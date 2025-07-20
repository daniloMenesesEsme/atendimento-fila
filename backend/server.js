require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Health Check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is healthy' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'atendimento_fila',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// --- Lógica de Negócio e Sockets ---
const emitirEstadoAtual = async (socket = null) => {
  try {
    // Lógica para buscar os dados do banco de dados (fila, consultores, emAtendimento)
    const [fila] = await pool.query(`
        SELECT a.id, an.nome as nome_analista, a.chegada_em, a.prioridade, a.case_number
        FROM atendimentos a
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'AGUARDANDO' ORDER BY a.prioridade DESC, a.chegada_em ASC
    `);
    const [consultores] = await pool.query("SELECT id, nome, meet_link, email, status FROM consultores ORDER BY nome ASC");
    const [emAtendimento] = await pool.query(`
      SELECT a.id, an.nome as nome_analista, c.nome as nome_consultor, a.inicio_em, c.id as consultor_id
      FROM atendimentos a
      JOIN consultores c ON a.consultor_id = c.id
      JOIN analistas_atendimento an ON a.analista_id = an.id
      WHERE a.status = 'EM_ATENDIMENTO'
    `);
    
    console.log("Dados da Fila:", fila);
    console.log("Dados dos Consultores:", consultores);
    console.log("Dados Em Atendimento:", emAtendimento);

    const estado = { fila, consultores, emAtendimento };

    if (socket) {
      // Se um socket específico for fornecido, emite apenas para ele
      socket.emit('estadoAtualizado', estado);
      console.log(`Estado enviado para o cliente: ${socket.id}`);
    } else {
      // Caso contrário, emite para todos os clientes conectados
      io.emit('estadoAtualizado', estado);
      console.log("Estado atualizado enviado para todos os clientes.");
    }
  } catch (error) {
    console.error("Erro ao emitir estado atual:", error);
  }
};

const analistasSockets = {};

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  emitirEstadoAtual(socket); // Envia o estado atual para o cliente que acabou de conectar

  socket.on('solicitarEstado', () => {
    emitirEstadoAtual(socket);
  });

  socket.on('entrarFila', async (data) => {
    try {
      const { analistaId, caseNumber } = data;
      analistasSockets[analistaId] = socket.id;
      await pool.query("INSERT INTO atendimentos (analista_id, case_number) VALUES (?, ?)", [analistaId, caseNumber]);
      emitirEstadoAtual();
    } catch (error) { console.error(error); }
  });

  socket.on('atenderProximo', async (consultor_id) => {
    try {
      const [fila] = await pool.query("SELECT * FROM atendimentos WHERE status = 'AGUARDANDO' ORDER BY prioridade DESC, chegada_em ASC LIMIT 1");
      if (fila.length > 0) {
        const proximo = fila[0];
        const analistaId = proximo.analista_id;
        const socketIdAnalista = analistasSockets[analistaId];

        if (socketIdAnalista) {
          const [consultor] = await pool.query("SELECT nome, meet_link FROM consultores WHERE id = ?", [consultor_id]);
          if (consultor.length > 0) {
            io.to(socketIdAnalista).emit('atendimento-iniciado', { consultor: consultor[0] });
          }
        }

        await pool.query("UPDATE atendimentos SET consultor_id = ?, status = 'EM_ATENDIMENTO', inicio_em = NOW() WHERE id = ?", [consultor_id, proximo.id]);
        await pool.query("UPDATE consultores SET status = 'em_atendimento' WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
      }
    } catch (error) { console.error(error); }
  });

  socket.on('finalizarAtendimento', async ({atendimento_id, consultor_id}) => {
    try {
        await pool.query("UPDATE atendimentos SET status = 'FINALIZADO', finalizado_em = NOW() WHERE id = ?", [atendimento_id]);
        await pool.query("UPDATE consultores SET status = 'disponivel' WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
    } catch (error) { console.error(error); }
  });

  socket.on('disconnect', () => {
    for (const analistaId in analistasSockets) {
      if (analistasSockets[analistaId] === socket.id) {
        delete analistasSockets[analistaId];
        console.log(`Socket do analista ${analistaId} removido.`);
        break;
      }
    }
  });
});

// --- Rotas da API ---

// CRUD Consultores
app.get('/api/consultores', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM consultores ORDER BY nome ASC');
    res.json(rows);
});

app.post('/api/consultores', async (req, res) => {
    const { nome, meet_link, email } = req.body;
    await pool.query('INSERT INTO consultores (nome, meet_link, email) VALUES (?, ?, ?)', [nome, meet_link, email]);
    emitirEstadoAtual();
    res.status(201).send();
});

app.put('/api/consultores/:id', async (req, res) => {
    const { nome, meet_link, email } = req.body;
    await pool.query('UPDATE consultores SET nome = ?, meet_link = ?, email = ? WHERE id = ?', [nome, meet_link, email, req.params.id]);
    emitirEstadoAtual();
    res.status(200).send();
});

app.put('/api/consultores/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    if (!['disponivel', 'em_pausa', 'em_atendimento', 'offline'].includes(status)) {
        return res.status(400).json({ message: 'Status inválido.' });
    }
    try {
        await pool.query('UPDATE consultores SET status = ? WHERE id = ?', [status, id]);
        emitirEstadoAtual(); // Notifica todos os clientes sobre a mudança de status
        res.status(200).send();
    } catch (error) {
        console.error('Erro ao atualizar status do consultor:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.delete('/api/consultores/:id', async (req, res) => {
    await pool.query('DELETE FROM consultores WHERE id = ?', [req.params.id]);
    emitirEstadoAtual();
    res.status(204).send();
});

// CRUD Analistas
app.get('/api/analistas', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM analistas_atendimento ORDER BY nome ASC');
    res.json(rows);
});

app.post('/api/analistas', async (req, res) => {
    const { nome, email } = req.body;
    await pool.query('INSERT INTO analistas_atendimento (nome, email) VALUES (?, ?)', [nome, email]);
    res.status(201).send();
});

app.put('/api/analistas/:id', async (req, res) => {
    const { nome, email } = req.body;
    await pool.query('UPDATE analistas_atendimento SET nome = ?, email = ? WHERE id = ?', [nome, email, req.params.id]);
    res.status(200).send();
});

app.delete('/api/analistas/:id', async (req, res) => {
    await pool.query('DELETE FROM atendimentos WHERE analista_id = ?', [req.params.id]);
    await pool.query('DELETE FROM analistas_atendimento WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Rota para buscar atendimentos com base no status
app.get('/api/atendimentos', async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: "O parâmetro 'status' é obrigatório." });
    }

    try {
        let query = '';
        const params = [status];

        if (status === 'AGUARDANDO') {
            query = `
                SELECT a.id, an.nome as nome_analista, a.chegada_em, a.prioridade, a.case_number
                FROM atendimentos a
                JOIN analistas_atendimento an ON a.analista_id = an.id
                WHERE a.status = ? ORDER BY a.prioridade DESC, a.chegada_em ASC
            `;
        } else if (status === 'EM_ATENDIMENTO') {
            query = `
                SELECT a.id, an.nome as nome_analista, c.nome as nome_consultor, a.inicio_em, c.id as consultor_id
                FROM atendimentos a
                JOIN consultores c ON a.consultor_id = c.id
                JOIN analistas_atendimento an ON a.analista_id = an.id
                WHERE a.status = ?
            `;
        } else {
            return res.status(400).json({ message: "Status inválido." });
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(`Erro ao buscar atendimentos com status ${status}:`, error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Relatórios
app.get('/api/relatorios/atendimentos', async (req, res) => {
    const { franqueado, consultor, dataInicio, dataFim, caseNumber, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let baseQuery = `
        FROM atendimentos a
        LEFT JOIN consultores c ON a.consultor_id = c.id
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'FINALIZADO'
    `;
    const params = [];

    if (franqueado) {
        baseQuery += ` AND an.nome LIKE ?`;
        params.push(`%${franqueado}%`);
    }
    if (consultor) {
        baseQuery += ` AND c.nome LIKE ?`;
        params.push(`%${consultor}%`);
    }
    if (dataInicio) {
        baseQuery += ` AND DATE(a.finalizado_em) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(a.finalizado_em) <= ?`;
        params.push(`${dataFim}`);
    }
    if (caseNumber) {
        baseQuery += ` AND a.case_number LIKE ?`;
        params.push(`%${caseNumber}%`);
    }

    const dataQuery = `
        SELECT a.id, an.nome as nome_atendente, c.nome as nome_consultor, a.chegada_em, a.inicio_em, a.finalizado_em, a.case_number
        ${baseQuery}
        ORDER BY a.finalizado_em DESC
        LIMIT ? OFFSET ?
    `;

    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

    try {
        const [dataRows] = await pool.query(dataQuery, [...params, parseInt(limit), offset]);
        console.log("Data Query:", dataQuery);
        console.log("Params:", [...params, parseInt(limit), offset]);
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        res.json({ data: dataRows, total });
    } catch (error) {
        console.error("Erro ao buscar relatórios paginados:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar relatórios." });
    }
});

// Rota para remover um analista da fila de espera
app.delete('/api/atendimentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM atendimentos WHERE id = ? AND status = 'AGUARDANDO'", [id]);
        
        if (result.affectedRows > 0) {
            console.log(`Atendimento ${id} removido da fila.`);
            emitirEstadoAtual();
            res.status(204).send();
        } else {
            res.status(404).json({ message: "Atendimento não encontrado na fila ou já em andamento." });
        }
    } catch (error) {
        console.error("Erro ao remover da fila:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Rota para atualizar a prioridade de um atendimento
app.put('/api/atendimentos/:id/prioridade', async (req, res) => {
    try {
        const { id } = req.params;
        const { prioridade } = req.body;

        if (typeof prioridade === 'undefined' || prioridade === null) {
            return res.status(400).json({ message: "Prioridade não fornecida." });
        }

        const [result] = await pool.query("UPDATE atendimentos SET prioridade = ? WHERE id = ?", [prioridade, id]);
        
        if (result.affectedRows > 0) {
            console.log(`Prioridade do atendimento ${id} atualizada para ${prioridade}.`);
            emitirEstadoAtual();
            res.status(200).send();
        } else {
            res.status(404).json({ message: "Atendimento não encontrado." });
        }
    } catch (error) {
        console.error("Erro ao atualizar prioridade:", error);
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
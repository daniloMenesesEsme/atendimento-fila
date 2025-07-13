require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());
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
const emitirEstadoAtual = async () => {
  try {
    const [fila] = await pool.query(`
        SELECT a.id, an.nome as nome_atendente, a.chegada_em, a.prioridade, a.case_number
        FROM atendimentos a
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'AGUARDANDO' ORDER BY a.prioridade DESC, a.chegada_em ASC
    `);
    const [consultores] = await pool.query("SELECT * FROM consultores ORDER BY nome ASC");
    const [emAtendimento] = await pool.query(`
      SELECT a.id, an.nome as nome_franqueado, c.nome as nome_consultor, a.inicio_em, c.id as consultor_id
      FROM atendimentos a
      JOIN consultores c ON a.consultor_id = c.id
      JOIN analistas_atendimento an ON a.analista_id = an.id
      WHERE a.status = 'EM_ATENDIMENTO'
    `);
    io.emit('estadoAtualizado', { fila, consultores, emAtendimento });
  } catch (error) {
    console.error("Erro ao emitir estado atual:", error);
  }
};

io.on('connection', (socket) => {
  emitirEstadoAtual();
  socket.on('entrarFila', async (data) => {
    try {
      const { analistaId, caseNumber } = data;
      await pool.query("INSERT INTO atendimentos (analista_id, case_number) VALUES (?, ?)", [analistaId, caseNumber]);
      emitirEstadoAtual();
    } catch (error) { console.error(error); }
  });
  socket.on('atenderProximo', async (consultor_id) => {
    try {
      const [fila] = await pool.query("SELECT * FROM atendimentos WHERE status = 'AGUARDANDO' ORDER BY prioridade DESC, chegada_em ASC LIMIT 1");
      if (fila.length > 0) {
        const proximo = fila[0];
        await pool.query("UPDATE atendimentos SET consultor_id = ?, status = 'EM_ATENDIMENTO', inicio_em = NOW() WHERE id = ?", [consultor_id, proximo.id]);
        await pool.query("UPDATE consultores SET disponivel = FALSE WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
      }
    } catch (error) { console.error(error); }
  });
  socket.on('finalizarAtendimento', async ({atendimento_id, consultor_id}) => {
    try {
        await pool.query("UPDATE atendimentos SET status = 'FINALIZADO', finalizado_em = NOW() WHERE id = ?", [atendimento_id]);
        await pool.query("UPDATE consultores SET disponivel = TRUE WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
    } catch (error) { console.error(error); }
  });
});

// --- Rotas da API ---

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'OK', message: 'Banco de dados conectado.' });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: 'Erro na conexão com o banco de dados.' });
    }
});

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
    await pool.query('DELETE FROM atendimentos WHERE analista_id = ?', [req.params.id]); // Exclui atendimentos vinculados
    await pool.query('DELETE FROM analistas_atendimento WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Relatórios
app.get('/api/relatorios/atendimentos', async (req, res) => {
    const { franqueado, consultor, dataInicio, dataFim } = req.query;
    let query = `
        SELECT a.id, an.nome as nome_atendente, c.nome as nome_consultor, a.chegada_em, a.inicio_em, a.finalizado_em
        FROM atendimentos a
        LEFT JOIN consultores c ON a.consultor_id = c.id
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'FINALIZADO'
    `;
    const params = [];

    if (franqueado) {
        query += ` AND an.nome LIKE ?`;
        params.push(`%${franqueado}%`);
    }
    if (consultor) {
        query += ` AND c.nome LIKE ?`;
        params.push(`%${consultor}%`);
    }
    if (dataInicio) {
        query += ` AND a.finalizado_em >= ?`;
        params.push(`${dataInicio} 00:00:00`);
    }
    if (dataFim) {
        query += ` AND a.finalizado_em <= ?`;
        params.push(`${dataFim} 23:59:59`);
    }

    query += ` ORDER BY a.finalizado_em DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
});

// Rota para remover um analista da fila de espera
app.delete('/api/atendimentos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Garante que só podemos remover alguém que está AGUARDANDO
        const [result] = await pool.query("DELETE FROM atendimentos WHERE id = ? AND status = 'AGUARDANDO'", [id]);
        
        if (result.affectedRows > 0) {
            console.log(`Atendimento ${id} removido da fila.`);
            emitirEstadoAtual(); // Notifica todos os clientes da mudança
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
            emitirEstadoAtual(); // Notifica todos os clientes da mudança
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
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
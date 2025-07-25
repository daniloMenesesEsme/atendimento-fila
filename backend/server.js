require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mysql = require('mysql2/promise');
const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

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
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) <= ?`;
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
        res.status(500).json({ message: "Erro interno do servidor." });
    }
});

// Nova rota para exportar relatório como Excel
app.get('/api/relatorios/atendimentos/export-excel', async (req, res) => {
    const { franqueado, consultor, dataInicio, dataFim, caseNumber } = req.query;

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
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) <= ?`;
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
    `;

    try {
        const [dataRows] = await pool.query(dataQuery, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório de Atendimentos');

        // Definir cabeçalhos da tabela
        worksheet.columns = [
            { header: 'Atendente', key: 'nome_atendente', width: 20 },
            { header: 'Consultor', key: 'nome_consultor', width: 20 },
            { header: 'Nº do Caso', key: 'case_number', width: 15 },
            { header: 'Chegada na Fila', key: 'chegada_em', width: 25 },
            { header: 'Início do Atendimento', key: 'inicio_em', width: 25 },
            { header: 'Fim do Atendimento', key: 'finalizado_em', width: 25 },
        ];

        // Adicionar linhas
        dataRows.forEach(row => {
            worksheet.addRow({
                nome_atendente: row.nome_atendente,
                nome_consultor: row.nome_consultor || '-',
                case_number: row.case_number || '-',
                chegada_em: row.chegada_em ? new Date(row.chegada_em).toLocaleString('pt-BR') : '-',
                inicio_em: row.inicio_em ? new Date(row.inicio_em).toLocaleString('pt-BR') : '-',
                finalizado_em: row.finalizado_em ? new Date(row.finalizado_em).toLocaleString('pt-BR') : '-',
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'relatorio_atendimentos.xlsx');

        await workbook.xlsx.write(res);

    } catch (error) {
        console.error("Erro ao gerar Excel do relatório:", error);
        res.status(500).json({ message: "Erro interno do servidor ao gerar Excel." });
    }
});

// Nova rota para exportar relatório como PDF
app.get('/api/relatorios/atendimentos/export-pdf', async (req, res) => {
    console.log('Iniciando geração do PDF...');
    const { franqueado, consultor, dataInicio, dataFim, caseNumber } = req.query;
    let browser = null;

    try {
        console.log('Buscando dados do relatório...');
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
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, 'UTC', 'America/Sao_Paulo')) <= ?`;
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
    `;

        const [dataRows] = await pool.query(dataQuery, params);
        console.log(`Dados encontrados: ${dataRows.length} registros`);

        // Construir o HTML do relatório
        const formatarData = (data) => {
            if (!data) return '-';
            return new Date(data).toLocaleString('pt-BR');
        };

        let tableRowsHtml = '';
        if (dataRows.length > 0) {
            tableRowsHtml = dataRows.map(a => `
                <tr>
                    <td>${a.nome_atendente}</td>
                    <td>${a.nome_consultor || '-'}</td>
                    <td>${a.case_number || '-'}</td>
                    <td>${formatarData(a.chegada_em)}</td>
                    <td>${formatarData(a.inicio_em)}</td>
                    <td>${formatarData(a.finalizado_em)}</td>
                </tr>
            `).join('');
        } else {
            tableRowsHtml = `<tr><td colspan="6" style="text-align: center;">Nenhum atendimento encontrado para os filtros aplicados.</td></tr>`;
        }

        const reportTitle = "Relatório de Atendimentos Finalizados";
        const currentDate = new Date().toLocaleDateString('pt-BR');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${reportTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    h1 { text-align: center; color: #333; font-size: 24px; margin-bottom: 5px; }
                    p { text-align: center; font-size: 14px; color: #666; margin-top: 0; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; color: #000; }
                    th { background-color: #f2f2f2; }
                    .no-data { text-align: center; padding: 20px; color: #999; }
                </style>
            </head>
            <body>
                <h1>${reportTitle}</h1>
                <p>Gerado em: ${currentDate}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Atendente</th>
                            <th>Consultor</th>
                            <th>Nº do Caso</th>
                            <th>Chegada na Fila</th>
                            <th>Início do Atendimento</th>
                            <th>Fim do Atendimento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        console.log('Iniciando Puppeteer...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--font-render-hinting=none'
            ]
        });
        console.log('Puppeteer iniciado com sucesso');

        console.log('Criando nova página...');
        const page = await browser.newPage();
        console.log('Configurando conteúdo HTML...');
        await page.setContent(htmlContent, { 
            waitUntil: ['networkidle0', 'domcontentloaded']
        });
        console.log('Conteúdo HTML configurado');

        console.log('Gerando PDF...');
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            timeout: 60000 // 60 segundos de timeout
        });
        console.log('PDF gerado com sucesso');

        if (browser) {
            console.log('Fechando navegador...');
            await browser.close();
            console.log('Navegador fechado');
        }

        console.log('Enviando PDF para o cliente...');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'relatorio_atendimentos.pdf');
        res.send(pdfBuffer);
        console.log('PDF enviado com sucesso');

    } catch (error) {
        console.error("Erro detalhado ao gerar PDF do relatório:", error);
        console.error("Stack trace:", error.stack);
        
        if (browser) {
            try {
                await browser.close();
                console.log('Navegador fechado após erro');
            } catch (closeError) {
                console.error('Erro ao fechar navegador:', closeError);
            }
        }
        
        res.status(500).json({ 
            message: "Erro interno do servidor ao gerar PDF.",
            error: error.message,
            stack: error.stack
        });
    }
});

// Nova rota para Relatório de TMA
app.get('/api/relatorios/tma', async (req, res) => {
    const { consultor, analista, caseNumber, dataInicio, dataFim, granularity } = req.query;

    let selectClause = '';
    let groupByClause = '';
    let orderByClause = '';

    switch (granularity) {
        case 'daily':
            selectClause = 'DATE(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY period';
            orderByClause = 'ORDER BY period ASC';
            break;
        case 'weekly':
            selectClause = 'YEAR(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) as year, WEEK(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY year, period';
            orderByClause = 'ORDER BY year ASC, period ASC';
            break;
        case 'monthly':
            selectClause = 'YEAR(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) as year, MONTH(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY year, period';
            orderByClause = 'ORDER BY year ASC, period ASC';
            break;
        case 'total':
        default:
            selectClause = `'Total' as period,`;
            groupByClause = '';
            orderByClause = '';
            break;
    }

    let baseQuery = `
        SELECT
            ${selectClause}
            AVG(TIMESTAMPDIFF(SECOND, a.inicio_em, a.finalizado_em)) as tma_seconds
        FROM atendimentos a
        LEFT JOIN consultores c ON a.consultor_id = c.id
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'FINALIZADO'
    `;
    const params = [];

    if (consultor) {
        baseQuery += ` AND c.nome LIKE ?`;
        params.push(`%${consultor}%`);
    }
    if (analista) {
        baseQuery += ` AND an.nome LIKE ?`;
        params.push(`%${analista}%`);
    }
    if (caseNumber) {
        baseQuery += ` AND a.case_number LIKE ?`;
        params.push(`%${caseNumber}%`);
    }
    if (dataInicio) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.finalizado_em, \'UTC\', \'America/Sao_Paulo\')) <= ?`;
        params.push(`${dataFim}`);
    }

    const finalQuery = `${baseQuery} ${groupByClause} ${orderByClause}`;

    try {
        const [rows] = await pool.query(finalQuery, params);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar relatório de TMA:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar relatório de TMA." });
    }
});

// Nova rota para Relatório de TME
app.get('/api/relatorios/tme', async (req, res) => {
    const { consultor, analista, caseNumber, dataInicio, dataFim, granularity } = req.query;

    let selectClause = '';
    let groupByClause = '';
    let orderByClause = '';

    switch (granularity) {
        case 'daily':
            selectClause = 'DATE(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY period';
            orderByClause = 'ORDER BY period ASC';
            break;
        case 'weekly':
            selectClause = 'YEAR(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) as year, WEEK(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY year, period';
            orderByClause = 'ORDER BY year ASC, period ASC';
            break;
        case 'monthly':
            selectClause = 'YEAR(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) as year, MONTH(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) as period,';
            groupByClause = 'GROUP BY year, period';
            orderByClause = 'ORDER BY year ASC, period ASC';
            break;
        case 'total':
        default:
            selectClause = `'Total' as period,`;
            groupByClause = '';
            orderByClause = '';
            break;
    }

    let baseQuery = `
        SELECT
            ${selectClause}
            AVG(TIMESTAMPDIFF(SECOND, a.chegada_em, a.inicio_em)) as tme_seconds
        FROM atendimentos a
        LEFT JOIN consultores c ON a.consultor_id = c.id
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'FINALIZADO' AND a.inicio_em IS NOT NULL
    `;
    const params = [];

    if (consultor) {
        baseQuery += ` AND c.nome LIKE ?`;
        params.push(`%${consultor}%`);
    }
    if (analista) {
        baseQuery += ` AND an.nome LIKE ?`;
        params.push(`%${analista}%`);
    }
    if (caseNumber) {
        baseQuery += ` AND a.case_number LIKE ?`;
        params.push(`%${caseNumber}%`);
    }
    if (dataInicio) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) >= ?`;
        params.push(`${dataInicio}`);
    }
    if (dataFim) {
        baseQuery += ` AND DATE(CONVERT_TZ(a.chegada_em, \'UTC\', \'America/Sao_Paulo\')) <= ?`;
        params.push(`${dataFim}`);
    }

    const finalQuery = `${baseQuery} ${groupByClause} ${orderByClause}`;

    try {
        const [rows] = await pool.query(finalQuery, params);
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar relatório de TME:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar relatório de TME." });
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
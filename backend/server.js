require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mysql = require('mysql2/promise');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const healthRoutes = require('./routes/health');

const app = express();
app.use(cors());
app.use(express.json());

// Health Check route (deve vir antes da autenticação)
app.use('/api', healthRoutes);

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey', // Use uma chave secreta forte e armazene em .env
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Mudar para true em produção com HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());
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

// Passport Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [profile.emails[0].value]);
      let user = users[0];

      if (!user) {
        // Se o usuário não existe, cria um novo
        const [result] = await pool.query('INSERT INTO usuarios (email, nome, ultimo_login) VALUES (?, ?, NOW())', [profile.emails[0].value, profile.displayName]);
        user = { id: result.insertId, email: profile.emails[0].value, nome: profile.displayName, perfil: 'ANALISTA' }; // Perfil padrão
      } else {
        // Se o usuário existe, atualiza o último login
        await pool.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [user.id]);
      }
      // Retorna o usuário para o Passport
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

// Passport Serialization/Deserialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    done(null, users[0]);
  } catch (err) {
    done(err, null);
  }
});

// --- Lógica de Negócio e Sockets ---
const emitirEstadoAtual = async () => {
  try {
    const [fila] = await pool.query(`
        SELECT a.id, an.nome as nome_analista, a.chegada_em, a.prioridade, a.case_number
        FROM atendimentos a
        JOIN analistas_atendimento an ON a.analista_id = an.id
        WHERE a.status = 'AGUARDANDO' ORDER BY a.prioridade DESC, a.chegada_em ASC
    `);
    const [consultores] = await pool.query("SELECT * FROM consultores ORDER BY nome ASC");
    const [emAtendimento] = await pool.query(`
      SELECT a.id, an.nome as nome_analista, c.nome as nome_consultor, a.inicio_em, c.id as consultor_id
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

const analistasSockets = {};

// JWT Strategy for Passport
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const [users] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [jwt_payload.id]);
    if (users.length > 0) {
      return done(null, users[0]);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));

// Middleware to protect routes
const verifyToken = passport.authenticate('jwt', { session: false });

io.on('connection', (socket) => {
  emitirEstadoAtual();

  socket.on('entrarFila', async (data) => {
    try {
      const { analistaId, caseNumber } = data;
      analistasSockets[analistaId] = socket.id; // Armazena o socket do analista
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

        // Notifica o analista específico
        if (socketIdAnalista) {
          const [consultor] = await pool.query("SELECT nome, meet_link FROM consultores WHERE id = ?", [consultor_id]);
          if (consultor.length > 0) {
            io.to(socketIdAnalista).emit('atendimento-iniciado', { consultor: consultor[0] });
          }
        }

        await pool.query("UPDATE atendimentos SET consultor_id = ?, status = 'EM_ATENDIMENTO', inicio_em = NOW() WHERE id = ?", [consultor_id, proximo.id]);
        await pool.query("UPDATE consultores SET disponivel = false WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
      }
    } catch (error) { console.error(error); }
  });

  socket.on('finalizarAtendimento', async ({atendimento_id, consultor_id}) => {
    try {
        await pool.query("UPDATE atendimentos SET status = 'FINALIZADO', finalizado_em = NOW() WHERE id = ?", [atendimento_id]);
        await pool.query("UPDATE consultores SET disponivel = true WHERE id = ?", [consultor_id]);
        emitirEstadoAtual();
    } catch (error) { console.error(error); }
  });

  socket.on('disconnect', () => {
    // Limpa o socket do analista quando ele se desconectar
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

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }), // session: false because we use JWT
  (req, res) => {
    // Successful authentication, generate JWT
    const user = req.user;
    const token = jwt.sign({ id: user.id, email: user.email, perfil: user.perfil }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Redirect to frontend with token (you might want to use a more secure way, like httpOnly cookie)
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

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
app.get('/api/consultores', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM consultores ORDER BY nome ASC');
    res.json(rows);
});
app.post('/api/consultores', verifyToken, async (req, res) => {
    const { nome, meet_link, email } = req.body;
    await pool.query('INSERT INTO consultores (nome, meet_link, email) VALUES (?, ?, ?)', [nome, meet_link, email]);
    emitirEstadoAtual();
    res.status(201).send();
});
app.put('/api/consultores/:id', verifyToken, async (req, res) => {
    const { nome, meet_link, email } = req.body;
    await pool.query('UPDATE consultores SET nome = ?, meet_link = ?, email = ? WHERE id = ?', [nome, meet_link, email, req.params.id]);
    emitirEstadoAtual();
    res.status(200).send();
});
app.delete('/api/consultores/:id', verifyToken, async (req, res) => {
    await pool.query('DELETE FROM consultores WHERE id = ?', [req.params.id]);
    emitirEstadoAtual();
    res.status(204).send();
});

// CRUD Analistas
app.get('/api/analistas', verifyToken, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM analistas_atendimento ORDER BY nome ASC');
    res.json(rows);
});
app.post('/api/analistas', verifyToken, async (req, res) => {
    const { nome, email } = req.body;
    await pool.query('INSERT INTO analistas_atendimento (nome, email) VALUES (?, ?)', [nome, email]);
    res.status(201).send();
});
app.put('/api/analistas/:id', verifyToken, async (req, res) => {
    const { nome, email } = req.body;
    await pool.query('UPDATE analistas_atendimento SET nome = ?, email = ? WHERE id = ?', [nome, email, req.params.id]);
    res.status(200).send();
});
app.delete('/api/analistas/:id', verifyToken, async (req, res) => {
    await pool.query('DELETE FROM atendimentos WHERE analista_id = ?', [req.params.id]); // Exclui atendimentos vinculados
    await pool.query('DELETE FROM analistas_atendimento WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Relatórios
app.get('/api/relatorios/atendimentos', verifyToken, async (req, res) => {
    const { franqueado, consultor, dataInicio, dataFim, page = 1, limit = 10 } = req.query;
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
        baseQuery += ` AND a.finalizado_em >= ?`;
        params.push(`${dataInicio} 00:00:00`);
    }
    if (dataFim) {
        baseQuery += ` AND a.finalizado_em <= ?`;
        params.push(`${dataFim} 23:59:59`);
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
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].total;

        res.json({ data: dataRows, total });
    } catch (error) {
        console.error("Erro ao buscar relatórios paginados:", error);
        res.status(500).json({ message: "Erro interno do servidor ao buscar relatórios." });
    }
});

// Rota para remover um analista da fila de espera
app.delete('/api/atendimentos/:id', verifyToken, async (req, res) => {
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
app.put('/api/atendimentos/:id/prioridade', verifyToken, async (req, res) => {
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
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
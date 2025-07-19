-- Desabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar dados das tabelas existentes
TRUNCATE TABLE atendimentos;
TRUNCATE TABLE analistas_atendimento;
TRUNCATE TABLE consultores;

-- Inserir dados dos analistas
INSERT INTO analistas_atendimento (id, nome, created_at, email) VALUES 
(1, 'Danilo Meneses', '2025-07-12 00:24:39', 'danilo.dsi@gmail.com'),
(2, 'Caio Lucas', '2025-07-12 00:24:47', 'caio.rm@gmail.com'),
(3, 'Henrique', '2025-07-12 00:30:57', 'henrique@gmail.com'),
(4, 'José', '2025-07-12 00:34:41', 'jose@gmail.com'),
(5, 'Silvia', '2025-07-13 21:14:19', ''),
(6, 'Novo Analista Teste', '2025-07-13 22:54:24', 'analista@gmail.com'),
(8, 'Analista teste Novo', '2025-07-13 23:21:00', 'novo@gmail.com'),
(9, 'Analista Teste Final', '2025-07-13 23:26:44', 'teste@gmail.com');

-- Inserir dados dos consultores
INSERT INTO consultores (id, nome, meet_link, disponivel, created_at, email) VALUES 
(1, 'Gean', 'https://meet.google.com/qtd-kypv-fza', 1, '2025-07-12 00:25:38', NULL),
(2, 'Joel', 'https://meet.google.com/thz-mgsz-ktq', 1, '2025-07-12 00:26:59', NULL),
(3, 'Kikão', 'https://meet.google.com/qtd-kypv-fza', 1, '2025-07-12 00:30:36', NULL),
(4, 'Galileu', 'https://meet.google.com/thz-mgsz-ktq', 1, '2025-07-13 16:57:49', '');

-- Inserir alguns atendimentos de exemplo
INSERT INTO atendimentos (id, analista_id, consultor_id, status, chegada_em, inicio_em, finalizado_em, prioridade, case_number) VALUES
(1, 1, 1, 'FINALIZADO', '2025-07-12 00:25:57', '2025-07-12 00:28:20', '2025-07-12 00:29:15', 0, NULL),
(2, 2, 1, 'FINALIZADO', '2025-07-12 00:26:14', '2025-07-12 00:29:38', '2025-07-12 00:30:15', 0, NULL);

-- Habilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar se os dados foram inseridos
SELECT 'Analistas' as tabela, COUNT(*) as total FROM analistas_atendimento
UNION ALL
SELECT 'Consultores', COUNT(*) FROM consultores
UNION ALL
SELECT 'Atendimentos', COUNT(*) FROM atendimentos; 
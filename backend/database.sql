-- Exclui o banco de dados se ele já existir para começar do zero (opcional)
DROP DATABASE IF EXISTS atendimento_fila;

-- Cria o banco de dados
CREATE DATABASE atendimento_fila;

-- Seleciona o banco de dados para usar
USE atendimento_fila;

-- Tabela para armazenar os consultores do conhecimento (especialistas)
CREATE TABLE consultores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    meet_link VARCHAR(255) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para os analistas de atendimento (franqueados)
CREATE TABLE analistas_atendimento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para registrar a fila de atendimentos
CREATE TABLE atendimentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    analista_id INT NOT NULL,
    consultor_id INT NULL,
    status ENUM('AGUARDANDO', 'EM_ATENDIMENTO', 'FINALIZADO') DEFAULT 'AGUARDANDO',
    chegada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inicio_em TIMESTAMP NULL,
    finalizado_em TIMESTAMP NULL,
    FOREIGN KEY (analista_id) REFERENCES analistas_atendimento(id),
    FOREIGN KEY (consultor_id) REFERENCES consultores(id)
);
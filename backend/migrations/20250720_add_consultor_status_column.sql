ALTER TABLE consultores DROP COLUMN disponivel;
ALTER TABLE consultores ADD COLUMN status ENUM('disponivel', 'em_pausa', 'em_atendimento', 'offline') NOT NULL DEFAULT 'disponivel';
-- ═══════════════════════════════════════════════════════════
--  CLÍNICA VIVA BEM — schema.sql
--  Execute este arquivo no Supabase SQL Editor
--  Menu: Database > SQL Editor > New query > Cole e execute
-- ═══════════════════════════════════════════════════════════

-- ─── ATIVAR EXTENSÃO DE UUID ───
-- Necessário para gerar IDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── TABELA: usuarios ───
-- Armazena dados extras dos usuários autenticados via Supabase Auth
-- O campo auth_id liga ao usuário criado no Supabase Authentication
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE,                          -- ID do Supabase Auth
  nome        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  perfil      TEXT NOT NULL DEFAULT 'recepcionista'
                CHECK (perfil IN ('admin', 'recepcionista')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABELA: medicos ───
-- Cadastro de médicos da clínica
CREATE TABLE IF NOT EXISTS medicos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  crm           TEXT,
  telefone      TEXT,
  email         TEXT,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABELA: pacientes ───
-- Cadastro de pacientes
CREATE TABLE IF NOT EXISTS pacientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            TEXT NOT NULL,
  telefone        TEXT,
  email           TEXT,
  data_nascimento DATE,
  cpf             TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABELA: consultas ───
-- Tabela principal do sistema de agendamento
CREATE TABLE IF NOT EXISTS consultas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id       UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  medico_id         UUID REFERENCES medicos(id) ON DELETE SET NULL,
  -- Campos desnormalizados para facilitar listagem sem JOINs complexos
  paciente_nome     TEXT NOT NULL,
  paciente_telefone TEXT,
  paciente_email    TEXT,
  medico_nome       TEXT,
  especialidade     TEXT NOT NULL,
  data_consulta     DATE NOT NULL,
  horario           TIME NOT NULL,
  status            TEXT NOT NULL DEFAULT 'agendado'
                      CHECK (status IN ('agendado','confirmado','cancelado','finalizado')),
  observacoes       TEXT,
  -- Controle de notificação de 30 minutos
  notificado_30min  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhorar performance nas buscas mais comuns
CREATE INDEX IF NOT EXISTS idx_consultas_data    ON consultas (data_consulta);
CREATE INDEX IF NOT EXISTS idx_consultas_status  ON consultas (status);
CREATE INDEX IF NOT EXISTS idx_consultas_medico  ON consultas (medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas (paciente_id);


-- ─── TABELA: notificacoes ───
-- Histórico de notificações geradas pelo sistema
CREATE TABLE IF NOT EXISTS notificacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id UUID REFERENCES consultas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL
                CHECK (tipo IN ('agendamento','lembrete_30min','cancelamento','confirmacao')),
  mensagem    TEXT NOT NULL,
  lida        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TRIGGER: atualiza updated_at automaticamente ───
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consultas_updated_at
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();


-- ═══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
--  Protege os dados: só usuários autenticados acessam
-- ═══════════════════════════════════════════════════════════

ALTER TABLE usuarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: usuários autenticados têm acesso total
-- Em produção você pode refinar por perfil (admin vs recepcionista)

CREATE POLICY "Autenticados podem ver usuarios"
  ON usuarios FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados acessam medicos"
  ON medicos FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados acessam pacientes"
  ON pacientes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados acessam consultas"
  ON consultas FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticados acessam notificacoes"
  ON notificacoes FOR ALL
  USING (auth.role() = 'authenticated');


-- ═══════════════════════════════════════════════════════════
--  DADOS DE EXEMPLO — execute após criar as tabelas
--  Descomente e execute para popular o banco com dados teste
-- ═══════════════════════════════════════════════════════════

/*
-- Médicos de exemplo
INSERT INTO medicos (nome, especialidade, crm) VALUES
  ('Dr. Carlos Mendes',    'Clínica Geral',    'CRM/SP 12345'),
  ('Dra. Ana Rodrigues',   'Cardiologia',       'CRM/SP 23456'),
  ('Dr. Felipe Santos',    'Ortopedia',         'CRM/SP 34567'),
  ('Dra. Marina Costa',    'Dermatologia',      'CRM/SP 45678'),
  ('Dr. Roberto Lima',     'Neurologia',        'CRM/SP 56789');

-- Pacientes de exemplo
INSERT INTO pacientes (nome, telefone, email) VALUES
  ('João Silva',       '(11) 99999-0001', 'joao@email.com'),
  ('Maria Souza',      '(11) 99999-0002', 'maria@email.com'),
  ('Pedro Alves',      '(11) 99999-0003', 'pedro@email.com'),
  ('Carla Ferreira',   '(11) 99999-0004', 'carla@email.com'),
  ('Ricardo Nunes',    '(11) 99999-0005', 'ricardo@email.com');

-- Consultas de exemplo (ajuste as datas conforme necessário)
INSERT INTO consultas
  (paciente_nome, paciente_telefone, paciente_email, medico_nome, especialidade, data_consulta, horario, status)
VALUES
  ('João Silva',     '(11) 99999-0001', 'joao@email.com',    'Dr. Carlos Mendes',   'Clínica Geral',  CURRENT_DATE, '09:00', 'confirmado'),
  ('Maria Souza',    '(11) 99999-0002', 'maria@email.com',   'Dra. Ana Rodrigues',  'Cardiologia',    CURRENT_DATE, '10:30', 'agendado'),
  ('Pedro Alves',    '(11) 99999-0003', 'pedro@email.com',   'Dr. Felipe Santos',   'Ortopedia',      CURRENT_DATE, '14:00', 'agendado'),
  ('Carla Ferreira', '(11) 99999-0004', 'carla@email.com',   'Dra. Marina Costa',   'Dermatologia',   CURRENT_DATE, '15:30', 'cancelado'),
  ('Ricardo Nunes',  '(11) 99999-0005', 'ricardo@email.com', 'Dr. Roberto Lima',    'Neurologia',     CURRENT_DATE, '16:00', 'agendado');
*/


-- ═══════════════════════════════════════════════════════════
--  COMO CRIAR O USUÁRIO ADMIN
--  Faça isso no Supabase Dashboard:
--  1. Vá em Authentication > Users > Invite user
--     Ou: Authentication > Users > Add user
--  2. Informe o email e senha
--  3. Depois execute o INSERT abaixo substituindo o auth_id
--     pelo ID que aparece na lista de usuários do Supabase
-- ═══════════════════════════════════════════════════════════

/*
-- Após criar o usuário no Supabase Auth, execute:
INSERT INTO usuarios (auth_id, nome, email, perfil) VALUES
  ('UUID-DO-USUARIO-NO-SUPABASE-AUTH', 'Administrador', 'admin@clinicavivabem.com.br', 'admin');

-- Para recepcionista:
INSERT INTO usuarios (auth_id, nome, email, perfil) VALUES
  ('UUID-DO-USUARIO-NO-SUPABASE-AUTH', 'Recepcionista', 'recepcao@clinicavivabem.com.br', 'recepcionista');
*/
-- =====================================================
-- SCRIPT SQL COMPLETO PARA AURORA DSQL
-- Sistema Hierárquico Educacional IAverse
-- 10 Tabelas + ENUMs + Foreign Keys + Índices
-- =====================================================

-- 1. CRIAR ENUMs PRIMEIRO
CREATE TYPE user_role AS ENUM ('admin', 'municipal_manager', 'school_director', 'teacher', 'student');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'blocked');
CREATE TYPE contract_status AS ENUM ('active', 'pending', 'expired', 'cancelled');
CREATE TYPE cognito_group AS ENUM ('Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos');
CREATE TYPE resource_type AS ENUM ('teacher', 'student');

-- 2. CRIAR TABELAS PRINCIPAIS (SEM FOREIGN KEYS)

-- TABELA 1: EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  cnpj VARCHAR(18),
  razao_social TEXT,
  telefone VARCHAR(20),
  email_contato VARCHAR,
  endereco TEXT,
  cidade VARCHAR,
  estado VARCHAR(2),
  cep VARCHAR(10),
  logo TEXT,
  responsavel TEXT,
  cargo_responsavel TEXT,
  observacoes TEXT,
  criado_por INTEGER,
  atualizado_por INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 2: CONTRATOS
CREATE TABLE IF NOT EXISTS contratos (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50),
  nome TEXT,
  empresa_id INTEGER,
  descricao TEXT,
  objeto TEXT,
  tipo_contrato VARCHAR(100),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  valor_total DOUBLE PRECISION,
  moeda VARCHAR(3) DEFAULT 'BRL',
  numero_licencas INTEGER,
  documento_pdf TEXT,
  status VARCHAR DEFAULT 'ativo',
  responsavel_contrato TEXT,
  email_responsavel TEXT,
  telefone_responsavel VARCHAR(20),
  observacoes TEXT,
  criado_por INTEGER,
  atualizado_por INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 3: USUÁRIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  cognito_sub TEXT UNIQUE,
  cognito_username VARCHAR,
  email VARCHAR NOT NULL,
  nome VARCHAR NOT NULL,
  tipo_usuario VARCHAR NOT NULL,
  empresa_id INTEGER,
  contrato_id INTEGER,
  telefone VARCHAR,
  documento_identidade VARCHAR,
  data_nascimento DATE,
  genero VARCHAR,
  endereco TEXT,
  cidade VARCHAR,
  estado VARCHAR,
  foto_perfil TEXT,
  status VARCHAR DEFAULT 'active',
  criado_por INTEGER,
  atualizado_por INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 4: ESCOLAS
CREATE TABLE IF NOT EXISTS escolas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR NOT NULL,
  codigo_inep VARCHAR(8) UNIQUE,
  cnpj VARCHAR(18),
  tipo_escola VARCHAR,
  endereco TEXT,
  cidade VARCHAR,
  estado VARCHAR(2),
  cep VARCHAR(10),
  telefone VARCHAR(20),
  email VARCHAR,
  diretor_responsavel VARCHAR,
  contrato_id INTEGER,
  empresa_id INTEGER,
  capacidade_alunos INTEGER,
  data_fundacao DATE,
  status VARCHAR DEFAULT 'ativa',
  observacoes TEXT,
  criado_por INTEGER,
  atualizado_por INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 5: GESTORES
CREATE TABLE IF NOT EXISTS gestores (
  id SERIAL PRIMARY KEY,
  usr_id INTEGER,
  empresa_id INTEGER,
  nome VARCHAR,
  cargo VARCHAR,
  data_admissao DATE,
  status VARCHAR DEFAULT 'ativo'
);

-- TABELA 6: DIRETORES
CREATE TABLE IF NOT EXISTS diretores (
  id SERIAL PRIMARY KEY,
  usr_id INTEGER,
  escola_id INTEGER,
  empresa_id INTEGER,
  nome VARCHAR,
  cargo VARCHAR,
  data_inicio DATE,
  status VARCHAR DEFAULT 'ativo'
);

-- TABELA 7: PROFESSORES
CREATE TABLE IF NOT EXISTS professores (
  id SERIAL PRIMARY KEY,
  usr_id INTEGER,
  escola_id INTEGER,
  empresa_id INTEGER,
  nome VARCHAR,
  disciplinas TEXT,
  formacao TEXT,
  data_admissao DATE,
  status VARCHAR DEFAULT 'ativo'
);

-- TABELA 8: ALUNOS
CREATE TABLE IF NOT EXISTS alunos (
  id SERIAL PRIMARY KEY,
  usr_id INTEGER,
  escola_id INTEGER,
  empresa_id INTEGER,
  matricula VARCHAR NOT NULL,
  nome VARCHAR,
  turma VARCHAR,
  serie VARCHAR,
  turno VARCHAR,
  nome_responsavel VARCHAR,
  contato_responsavel VARCHAR,
  data_matricula DATE,
  status VARCHAR DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 9: AI_PREFERENCES
CREATE TABLE IF NOT EXISTS ai_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  default_ai VARCHAR(50) DEFAULT 'chatgpt',
  auto_start_session BOOLEAN DEFAULT false,
  save_conversations BOOLEAN DEFAULT true,
  response_language VARCHAR(10) DEFAULT 'pt-BR',
  complexity_level VARCHAR(20) DEFAULT 'intermediario',
  custom_prompts BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 10: AI_RESOURCE_CONFIGS
CREATE TABLE IF NOT EXISTS ai_resource_configs (
  id SERIAL PRIMARY KEY,
  resource_id VARCHAR(100) NOT NULL UNIQUE,
  resource_name VARCHAR(200) NOT NULL,
  resource_type resource_type NOT NULL,
  selected_model VARCHAR(200) NOT NULL,
  model_name VARCHAR(200),
  temperature DOUBLE PRECISION DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  enabled BOOLEAN DEFAULT true,
  configured_by INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ADICIONAR FOREIGN KEYS E CONSTRAINTS

-- EMPRESAS Foreign Keys
ALTER TABLE empresas ADD CONSTRAINT IF NOT EXISTS fk_empresa_criador 
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE empresas ADD CONSTRAINT IF NOT EXISTS fk_empresa_atualizador 
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- CONTRATOS Foreign Keys
ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_criador 
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_atualizador 
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- USUÁRIOS Foreign Keys
ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL;
ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_contrato 
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL;
ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_criador 
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_atualizador 
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ESCOLAS Foreign Keys
ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_contrato 
  FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL;
ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_criador 
  FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_atualizador 
  FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL;

-- GESTORES Foreign Keys
ALTER TABLE gestores ADD CONSTRAINT IF NOT EXISTS fk_gestor_usuario 
  FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE gestores ADD CONSTRAINT IF NOT EXISTS fk_gestor_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- DIRETORES Foreign Keys
ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_usuario 
  FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_escola 
  FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE;
ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- PROFESSORES Foreign Keys
ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_usuario 
  FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_escola 
  FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE;
ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- ALUNOS Foreign Keys
ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_usuario 
  FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE;
ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_escola 
  FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE;
ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_empresa 
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- AI_PREFERENCES Foreign Keys
ALTER TABLE ai_preferences ADD CONSTRAINT IF NOT EXISTS fk_ai_pref_usuario 
  FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- AI_RESOURCE_CONFIGS Foreign Keys
ALTER TABLE ai_resource_configs ADD CONSTRAINT IF NOT EXISTS fk_ai_config_usuario 
  FOREIGN KEY (configured_by) REFERENCES usuarios(id) ON DELETE SET NULL;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE

-- Índices EMPRESAS
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_nome ON empresas(nome);

-- Índices CONTRATOS
CREATE INDEX IF NOT EXISTS idx_contratos_empresa_id ON contratos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contratos(numero);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);

-- Índices USUÁRIOS
CREATE INDEX IF NOT EXISTS idx_usuarios_cognito_sub ON usuarios(cognito_sub);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id);

-- Índices ESCOLAS
CREATE INDEX IF NOT EXISTS idx_escolas_codigo_inep ON escolas(codigo_inep);
CREATE INDEX IF NOT EXISTS idx_escolas_empresa_id ON escolas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_escolas_contrato_id ON escolas(contrato_id);

-- Índices GESTORES
CREATE INDEX IF NOT EXISTS idx_gestores_usr_id ON gestores(usr_id);
CREATE INDEX IF NOT EXISTS idx_gestores_empresa_id ON gestores(empresa_id);

-- Índices DIRETORES
CREATE INDEX IF NOT EXISTS idx_diretores_usr_id ON diretores(usr_id);
CREATE INDEX IF NOT EXISTS idx_diretores_escola_id ON diretores(escola_id);
CREATE INDEX IF NOT EXISTS idx_diretores_empresa_id ON diretores(empresa_id);

-- Índices PROFESSORES
CREATE INDEX IF NOT EXISTS idx_professores_usr_id ON professores(usr_id);
CREATE INDEX IF NOT EXISTS idx_professores_escola_id ON professores(escola_id);
CREATE INDEX IF NOT EXISTS idx_professores_empresa_id ON professores(empresa_id);

-- Índices ALUNOS
CREATE INDEX IF NOT EXISTS idx_alunos_usr_id ON alunos(usr_id);
CREATE INDEX IF NOT EXISTS idx_alunos_escola_id ON alunos(escola_id);
CREATE INDEX IF NOT EXISTS idx_alunos_empresa_id ON alunos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula);

-- Índices AI_PREFERENCES
CREATE INDEX IF NOT EXISTS idx_ai_pref_user_id ON ai_preferences(user_id);

-- Índices AI_RESOURCE_CONFIGS
CREATE INDEX IF NOT EXISTS idx_ai_config_resource_id ON ai_resource_configs(resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_config_resource_type ON ai_resource_configs(resource_type);

-- =====================================================
-- SCRIPT FINALIZADO
-- Total: 10 tabelas + 5 ENUMs + 21 Foreign Keys + 20 Índices
-- Hierarquia: empresas → contratos → escolas → usuários → roles específicas
-- =====================================================
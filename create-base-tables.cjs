const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.AURORA_SERVERLESS_HOST?.trim(),
  port: parseInt(process.env.AURORA_SERVERLESS_PORT || '5432'),
  database: process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER',
  user: process.env.AURORA_SERVERLESS_USER || 'Admn',
  password: process.env.AURORA_SERVERLESS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

// Script base para criar todas as tabelas
const BASE_SCRIPT = `
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
  matricula VARCHAR,
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
  user_id INTEGER,
  default_ai VARCHAR,
  auto_start_session BOOLEAN DEFAULT FALSE,
  save_conversations BOOLEAN DEFAULT TRUE,
  response_language VARCHAR DEFAULT 'pt-BR',
  complexity_level VARCHAR DEFAULT 'medium',
  custom_prompts TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA 10: AI_RESOURCE_CONFIGS
CREATE TABLE IF NOT EXISTS ai_resource_configs (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER,
  resource_name VARCHAR,
  resource_type VARCHAR,
  selected_model VARCHAR,
  model_name VARCHAR,
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  enabled BOOLEAN DEFAULT TRUE,
  configured_by INTEGER,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CRIAR FOREIGN KEYS
ALTER TABLE contratos ADD CONSTRAINT fk_contrato_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id);
ALTER TABLE escolas ADD CONSTRAINT fk_escola_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE escolas ADD CONSTRAINT fk_escola_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id);
ALTER TABLE gestores ADD CONSTRAINT fk_gestor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id);
ALTER TABLE gestores ADD CONSTRAINT fk_gestor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id);
ALTER TABLE diretores ADD CONSTRAINT fk_diretor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id);
ALTER TABLE diretores ADD CONSTRAINT fk_diretor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id);
ALTER TABLE professores ADD CONSTRAINT fk_professor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id);
ALTER TABLE professores ADD CONSTRAINT fk_professor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id);
ALTER TABLE alunos ADD CONSTRAINT fk_aluno_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id);
ALTER TABLE alunos ADD CONSTRAINT fk_aluno_escola FOREIGN KEY (escola_id) REFERENCES escolas(id);
ALTER TABLE ai_preferences ADD CONSTRAINT fk_ai_pref_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id);
ALTER TABLE ai_resource_configs ADD CONSTRAINT fk_ai_config_usuario FOREIGN KEY (configured_by) REFERENCES usuarios(id);

-- 4. CRIAR ÍNDICES
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_nome ON empresas(nome);
CREATE INDEX idx_contratos_empresa_id ON contratos(empresa_id);
CREATE INDEX idx_contratos_numero ON contratos(numero);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_usuarios_cognito_sub ON usuarios(cognito_sub);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX idx_escolas_codigo_inep ON escolas(codigo_inep);
CREATE INDEX idx_escolas_empresa_id ON escolas(empresa_id);
CREATE INDEX idx_escolas_contrato_id ON escolas(contrato_id);
CREATE INDEX idx_gestores_usr_id ON gestores(usr_id);
CREATE INDEX idx_gestores_empresa_id ON gestores(empresa_id);
CREATE INDEX idx_diretores_usr_id ON diretores(usr_id);
CREATE INDEX idx_diretores_escola_id ON diretores(escola_id);
CREATE INDEX idx_professores_usr_id ON professores(usr_id);
CREATE INDEX idx_professores_escola_id ON professores(escola_id);
CREATE INDEX idx_alunos_usr_id ON alunos(usr_id);
CREATE INDEX idx_alunos_escola_id ON alunos(escola_id);
CREATE INDEX idx_alunos_matricula ON alunos(matricula);
CREATE INDEX idx_ai_pref_user_id ON ai_preferences(user_id);
CREATE INDEX idx_ai_config_resource_id ON ai_resource_configs(resource_id);
CREATE INDEX idx_ai_config_resource_type ON ai_resource_configs(resource_type);
`;

async function createBaseTables() {
  let client;
  try {
    console.log('🚀 Conectando ao Aurora Serverless...');
    client = await pool.connect();
    console.log('✅ Conectado com sucesso ao Aurora Serverless');
    
    // Dividir o script em comandos individuais
    const commands = BASE_SCRIPT
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== '');
    
    console.log(`📝 Criando estrutura base com ${commands.length} comandos...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        const fullCommand = command.endsWith(';') ? command : command + ';';
        console.log(`📋 Executando comando ${i + 1}/${commands.length}...`);
        
        await client.query(fullCommand);
        successCount++;
        
        if (command.includes('CREATE TYPE')) {
          console.log('✅ CREATE TYPE executado com sucesso');
        } else if (command.includes('CREATE TABLE')) {
          console.log('✅ CREATE TABLE executado com sucesso');
        } else if (command.includes('ALTER TABLE')) {
          console.log('✅ ALTER TABLE executado com sucesso');
        } else if (command.includes('CREATE INDEX')) {
          console.log('✅ CREATE INDEX executado com sucesso');
        } else {
          console.log('✅ Comando executado com sucesso');
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erro no comando ${i + 1}: ${error.message}`);
        
        if (error.message.includes('already exists')) {
          console.log('⚠️  Comando já executado - continuando...');
        }
      }
    }
    
    console.log('\n📊 RESUMO DA CRIAÇÃO BASE:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total: ${commands.length}`);
    
    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name, column_count 
      FROM (
        SELECT table_name, COUNT(*) as column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('empresas', 'contratos', 'usuarios', 'escolas', 'gestores', 'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs')
        GROUP BY table_name
      ) t
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.column_count} colunas`);
    });
    
    console.log('\n🎯 ESTRUTURA BASE CRIADA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

createBaseTables().catch(console.error);
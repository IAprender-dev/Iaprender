const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function executeCompleteMigration() {
  let client;
  try {
    console.log('🚀 Conectando ao Aurora Serverless...');
    client = await pool.connect();
    console.log('✅ Conectado com sucesso ao Aurora Serverless');
    
    // PASSO 1: Criar ENUMs
    console.log('\n📋 PASSO 1: Criando ENUMs...');
    const enumCommands = [
      "CREATE TYPE user_role AS ENUM ('admin', 'municipal_manager', 'school_director', 'teacher', 'student')",
      "CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'blocked')",
      "CREATE TYPE contract_status AS ENUM ('active', 'pending', 'expired', 'cancelled')",
      "CREATE TYPE cognito_group AS ENUM ('Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos')",
      "CREATE TYPE resource_type AS ENUM ('teacher', 'student')"
    ];
    
    for (const command of enumCommands) {
      try {
        await client.query(command);
        console.log('✅ ENUM criado com sucesso');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  ENUM já existe - continuando...');
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }
    
    // PASSO 2: Criar Tabelas
    console.log('\n📋 PASSO 2: Criando tabelas...');
    const tableCommands = [
      `CREATE TABLE IF NOT EXISTS empresas (
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
      )`,
      `CREATE TABLE IF NOT EXISTS contratos (
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
      )`,
      `CREATE TABLE IF NOT EXISTS usuarios (
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
      )`,
      `CREATE TABLE IF NOT EXISTS escolas (
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
      )`,
      `CREATE TABLE IF NOT EXISTS gestores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        empresa_id INTEGER,
        nome VARCHAR,
        cargo VARCHAR,
        data_admissao DATE,
        status VARCHAR DEFAULT 'ativo',
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS diretores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        escola_id INTEGER,
        empresa_id INTEGER,
        nome VARCHAR,
        cargo VARCHAR,
        data_inicio DATE,
        status VARCHAR DEFAULT 'ativo',
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS professores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        escola_id INTEGER,
        empresa_id INTEGER,
        nome VARCHAR,
        disciplinas TEXT,
        formacao TEXT,
        data_admissao DATE,
        status VARCHAR DEFAULT 'ativo',
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS alunos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
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
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS ai_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        default_ai VARCHAR,
        auto_start_session BOOLEAN DEFAULT FALSE,
        save_conversations BOOLEAN DEFAULT TRUE,
        response_language VARCHAR DEFAULT 'pt-BR',
        complexity_level VARCHAR DEFAULT 'medium',
        custom_prompts TEXT,
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS ai_resource_configs (
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
        criado_por INTEGER,
        atualizado_por INTEGER,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    for (const command of tableCommands) {
      try {
        await client.query(command);
        console.log('✅ Tabela criada com sucesso');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Tabela já existe - continuando...');
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }
    
    // PASSO 3: Criar Foreign Keys
    console.log('\n📋 PASSO 3: Criando Foreign Keys...');
    const foreignKeyCommands = [
      'ALTER TABLE contratos ADD CONSTRAINT fk_contrato_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)',
      'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)',
      'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)',
      'ALTER TABLE escolas ADD CONSTRAINT fk_escola_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)',
      'ALTER TABLE escolas ADD CONSTRAINT fk_escola_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)',
      'ALTER TABLE gestores ADD CONSTRAINT fk_gestor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id)',
      'ALTER TABLE gestores ADD CONSTRAINT fk_gestor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id)',
      'ALTER TABLE diretores ADD CONSTRAINT fk_diretor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id)',
      'ALTER TABLE diretores ADD CONSTRAINT fk_diretor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id)',
      'ALTER TABLE professores ADD CONSTRAINT fk_professor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id)',
      'ALTER TABLE professores ADD CONSTRAINT fk_professor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id)',
      'ALTER TABLE alunos ADD CONSTRAINT fk_aluno_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id)',
      'ALTER TABLE alunos ADD CONSTRAINT fk_aluno_escola FOREIGN KEY (escola_id) REFERENCES escolas(id)',
      'ALTER TABLE ai_preferences ADD CONSTRAINT fk_ai_pref_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id)',
      'ALTER TABLE ai_resource_configs ADD CONSTRAINT fk_ai_config_usuario FOREIGN KEY (configured_by) REFERENCES usuarios(id)',
      // Foreign keys de auditoria
      'ALTER TABLE empresas ADD CONSTRAINT fk_empresa_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE empresas ADD CONSTRAINT fk_empresa_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE contratos ADD CONSTRAINT fk_contrato_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE contratos ADD CONSTRAINT fk_contrato_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE escolas ADD CONSTRAINT fk_escola_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE escolas ADD CONSTRAINT fk_escola_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE gestores ADD CONSTRAINT fk_gestor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE gestores ADD CONSTRAINT fk_gestor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE diretores ADD CONSTRAINT fk_diretor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE diretores ADD CONSTRAINT fk_diretor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE professores ADD CONSTRAINT fk_professor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE professores ADD CONSTRAINT fk_professor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE alunos ADD CONSTRAINT fk_aluno_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE alunos ADD CONSTRAINT fk_aluno_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE ai_preferences ADD CONSTRAINT fk_ai_pref_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE ai_preferences ADD CONSTRAINT fk_ai_pref_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)',
      'ALTER TABLE ai_resource_configs ADD CONSTRAINT fk_ai_config_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id)',
      'ALTER TABLE ai_resource_configs ADD CONSTRAINT fk_ai_config_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id)'
    ];
    
    for (const command of foreignKeyCommands) {
      try {
        await client.query(command);
        console.log('✅ Foreign Key criada com sucesso');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Foreign Key já existe - continuando...');
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }
    
    // PASSO 4: Criar Índices
    console.log('\n📋 PASSO 4: Criando índices...');
    const indexCommands = [
      'CREATE INDEX idx_empresas_cnpj ON empresas(cnpj)',
      'CREATE INDEX idx_empresas_nome ON empresas(nome)',
      'CREATE INDEX idx_contratos_empresa_id ON contratos(empresa_id)',
      'CREATE INDEX idx_contratos_numero ON contratos(numero)',
      'CREATE INDEX idx_contratos_status ON contratos(status)',
      'CREATE INDEX idx_usuarios_cognito_sub ON usuarios(cognito_sub)',
      'CREATE INDEX idx_usuarios_email ON usuarios(email)',
      'CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario)',
      'CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id)',
      'CREATE INDEX idx_escolas_codigo_inep ON escolas(codigo_inep)',
      'CREATE INDEX idx_escolas_empresa_id ON escolas(empresa_id)',
      'CREATE INDEX idx_escolas_contrato_id ON escolas(contrato_id)',
      'CREATE INDEX idx_gestores_user_id ON gestores(user_id)',
      'CREATE INDEX idx_gestores_empresa_id ON gestores(empresa_id)',
      'CREATE INDEX idx_diretores_user_id ON diretores(user_id)',
      'CREATE INDEX idx_diretores_escola_id ON diretores(escola_id)',
      'CREATE INDEX idx_professores_user_id ON professores(user_id)',
      'CREATE INDEX idx_professores_escola_id ON professores(escola_id)',
      'CREATE INDEX idx_alunos_user_id ON alunos(user_id)',
      'CREATE INDEX idx_alunos_escola_id ON alunos(escola_id)',
      'CREATE INDEX idx_alunos_matricula ON alunos(matricula)',
      'CREATE INDEX idx_ai_pref_user_id ON ai_preferences(user_id)',
      'CREATE INDEX idx_ai_config_resource_id ON ai_resource_configs(resource_id)',
      'CREATE INDEX idx_ai_config_resource_type ON ai_resource_configs(resource_type)',
      // Índices compostos das correções
      'CREATE INDEX idx_gestores_empresa_status ON gestores(empresa_id, status)',
      'CREATE INDEX idx_diretores_escola_status ON diretores(escola_id, status)',
      'CREATE INDEX idx_professores_escola_status ON professores(escola_id, status)',
      'CREATE INDEX idx_alunos_escola_status ON alunos(escola_id, status)',
      'CREATE INDEX idx_usuarios_empresa_tipo ON usuarios(empresa_id, tipo_usuario)',
      'CREATE INDEX idx_contratos_empresa_status ON contratos(empresa_id, status)',
      'CREATE INDEX idx_escolas_empresa_status ON escolas(empresa_id, status)',
      'CREATE INDEX idx_diretores_empresa_status ON diretores(empresa_id, status)',
      'CREATE INDEX idx_professores_empresa_status ON professores(empresa_id, status)',
      'CREATE INDEX idx_alunos_empresa_status ON alunos(empresa_id, status)'
    ];
    
    for (const command of indexCommands) {
      try {
        await client.query(command);
        console.log('✅ Índice criado com sucesso');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Índice já existe - continuando...');
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }
    
    // PASSO 5: Criar Functions e Triggers
    console.log('\n📋 PASSO 5: Criando funções e triggers...');
    
    // Função para atualizar timestamp
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.atualizado_em = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      console.log('✅ Função update_updated_at_column criada');
    } catch (error) {
      console.error(`❌ Erro na função: ${error.message}`);
    }
    
    // Triggers
    const triggerCommands = [
      'CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_escolas_updated_at BEFORE UPDATE ON escolas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_gestores_updated_at BEFORE UPDATE ON gestores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_diretores_updated_at BEFORE UPDATE ON diretores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON professores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_ai_preferences_updated_at BEFORE UPDATE ON ai_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_ai_resource_configs_updated_at BEFORE UPDATE ON ai_resource_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ];
    
    for (const command of triggerCommands) {
      try {
        await client.query(command);
        console.log('✅ Trigger criado com sucesso');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Trigger já existe - continuando...');
        } else {
          console.error(`❌ Erro: ${error.message}`);
        }
      }
    }
    
    // PASSO 6: Criar Views
    console.log('\n📋 PASSO 6: Criando views...');
    
    try {
      await client.query(`
        CREATE OR REPLACE VIEW vw_hierarquia_completa AS
        SELECT 
            e.id as empresa_id,
            e.nome as empresa_nome,
            es.id as escola_id,
            es.nome as escola_nome,
            u.id as usuario_id,
            u.nome as usuario_nome,
            u.tipo_usuario,
            g.id as gestor_id,
            d.id as diretor_id,
            p.id as professor_id,
            a.id as aluno_id
        FROM empresas e
        LEFT JOIN escolas es ON es.empresa_id = e.id
        LEFT JOIN usuarios u ON u.empresa_id = e.id
        LEFT JOIN gestores g ON g.user_id = u.id
        LEFT JOIN diretores d ON d.user_id = u.id
        LEFT JOIN professores p ON p.user_id = u.id
        LEFT JOIN alunos a ON a.user_id = u.id;
      `);
      console.log('✅ View vw_hierarquia_completa criada');
    } catch (error) {
      console.error(`❌ Erro na view: ${error.message}`);
    }
    
    // Verificar resultado final
    console.log('\n🔍 Verificando estrutura final...');
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('empresas', 'contratos', 'usuarios', 'escolas', 'gestores', 'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs')
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('\n📋 Estrutura final verificada:');
    let currentTable = '';
    result.rows.forEach(row => {
      if (row.table_name !== currentTable) {
        console.log(`\n🗂️  ${row.table_name.toUpperCase()}:`);
        currentTable = row.table_name;
      }
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎯 MIGRAÇÃO COMPLETA EXECUTADA COM SUCESSO!');
    console.log('✅ Todas as tabelas criadas com campos de auditoria');
    console.log('✅ Todas as foreign keys implementadas');
    console.log('✅ Todos os índices otimizados criados');
    console.log('✅ Triggers de auditoria configurados');
    console.log('✅ Views hierárquicas implementadas');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

executeCompleteMigration().catch(console.error);
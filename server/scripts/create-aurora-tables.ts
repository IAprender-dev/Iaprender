/**
 * SCRIPT PARA CRIAÇÃO DAS TABELAS HIERÁRQUICAS NO AURORA DSQL
 * 
 * Este script cria todas as 10 tabelas do sistema hierárquico educacional
 * no Aurora DSQL com relacionamentos e integridade referencial completos.
 */

import { dbManager } from '../config/database-manager';
import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { migrate } from 'drizzle-orm/aws-data-api/pg/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema';

const {
  empresas,
  contratos,
  usuarios,
  escolas,
  gestores,
  diretores,
  professores,
  alunos,
  aiPreferences,
  aiResourceConfigs
} = schema;

export class AuroraTableCreator {
  private db: any;

  constructor() {
    this.db = dbManager.getClient();
  }

  async createAllTables() {
    console.log('🚀 Iniciando criação das tabelas hierárquicas no Aurora DSQL...');
    
    try {
      // Verificar se estamos conectados ao Aurora DSQL
      const dbType = dbManager.getDatabaseType();
      if (dbType !== 'aurora-dsql') {
        console.log('⚠️ Mudando para Aurora DSQL...');
        const switched = await dbManager.switchDatabase('aurora-dsql');
        if (!switched) {
          throw new Error('Falha ao conectar com Aurora DSQL');
        }
      }

      // 1. Criar ENUMs primeiro
      await this.createEnums();

      // 2. Criar tabelas principais (sem foreign keys)
      await this.createMainTables();

      // 3. Adicionar foreign keys e constraints
      await this.addForeignKeys();

      // 4. Criar índices para performance
      await this.createIndexes();

      // 5. Validar criação das tabelas
      await this.validateTables();

      console.log('✅ Todas as tabelas hierárquicas criadas com sucesso no Aurora DSQL!');
      return true;

    } catch (error) {
      console.error('❌ Erro ao criar tabelas:', error);
      throw error;
    }
  }

  private async createEnums() {
    console.log('📝 Criando ENUMs...');
    
    const enums = [
      `CREATE TYPE user_role AS ENUM ('admin', 'municipal_manager', 'school_director', 'teacher', 'student')`,
      `CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'blocked')`,
      `CREATE TYPE contract_status AS ENUM ('active', 'pending', 'expired', 'cancelled')`,
      `CREATE TYPE cognito_group AS ENUM ('Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos')`,
      `CREATE TYPE resource_type AS ENUM ('teacher', 'student')`
    ];

    for (const enumSql of enums) {
      try {
        await this.db.execute(sql.raw(enumSql));
        console.log(`✅ ENUM criado: ${enumSql.split(' ')[2]}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ ENUM já existe: ${enumSql.split(' ')[2]}`);
        } else {
          throw error;
        }
      }
    }
  }

  private async createMainTables() {
    console.log('🏗️ Criando tabelas principais...');

    // Ordem de criação respeitando dependências
    const tables = [
      {
        name: 'empresas',
        sql: `
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
          )
        `
      },
      {
        name: 'contratos',
        sql: `
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
          )
        `
      },
      {
        name: 'usuarios',
        sql: `
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
          )
        `
      },
      {
        name: 'escolas',
        sql: `
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
          )
        `
      },
      {
        name: 'gestores',
        sql: `
          CREATE TABLE IF NOT EXISTS gestores (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            empresa_id INTEGER,
            nome VARCHAR,
            cargo VARCHAR,
            data_admissao DATE,
            status VARCHAR DEFAULT 'ativo'
          )
        `
      },
      {
        name: 'diretores',
        sql: `
          CREATE TABLE IF NOT EXISTS diretores (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            escola_id INTEGER,
            empresa_id INTEGER,
            nome VARCHAR,
            cargo VARCHAR,
            data_inicio DATE,
            status VARCHAR DEFAULT 'ativo'
          )
        `
      },
      {
        name: 'professores',
        sql: `
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
          )
        `
      },
      {
        name: 'alunos',
        sql: `
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
            criado_em TIMESTAMP
          )
        `
      },
      {
        name: 'ai_preferences',
        sql: `
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
          )
        `
      },
      {
        name: 'ai_resource_configs',
        sql: `
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
          )
        `
      }
    ];

    for (const table of tables) {
      try {
        await this.db.execute(sql.raw(table.sql));
        console.log(`✅ Tabela criada: ${table.name}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ Tabela já existe: ${table.name}`);
        } else {
          console.error(`❌ Erro ao criar tabela ${table.name}:`, error.message);
          throw error;
        }
      }
    }
  }

  private async addForeignKeys() {
    console.log('🔗 Adicionando foreign keys...');

    const foreignKeys = [
      // Empresas
      'ALTER TABLE empresas ADD CONSTRAINT IF NOT EXISTS fk_empresa_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      'ALTER TABLE empresas ADD CONSTRAINT IF NOT EXISTS fk_empresa_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      
      // Contratos
      'ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      'ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      'ALTER TABLE contratos ADD CONSTRAINT IF NOT EXISTS fk_contrato_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      
      // Usuários
      'ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL',
      'ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL',
      'ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      'ALTER TABLE usuarios ADD CONSTRAINT IF NOT EXISTS fk_usuario_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      
      // Escolas
      'ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      'ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id) ON DELETE SET NULL',
      'ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      'ALTER TABLE escolas ADD CONSTRAINT IF NOT EXISTS fk_escola_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL',
      
      // Gestores
      'ALTER TABLE gestores ADD CONSTRAINT IF NOT EXISTS fk_gestor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE',
      'ALTER TABLE gestores ADD CONSTRAINT IF NOT EXISTS fk_gestor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      
      // Diretores
      'ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE',
      'ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE',
      'ALTER TABLE diretores ADD CONSTRAINT IF NOT EXISTS fk_diretor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      
      // Professores
      'ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE',
      'ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_escola FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE',
      'ALTER TABLE professores ADD CONSTRAINT IF NOT EXISTS fk_professor_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      
      // Alunos
      'ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_usuario FOREIGN KEY (usr_id) REFERENCES usuarios(id) ON DELETE CASCADE',
      'ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_escola FOREIGN KEY (escola_id) REFERENCES escolas(id) ON DELETE CASCADE',
      'ALTER TABLE alunos ADD CONSTRAINT IF NOT EXISTS fk_aluno_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE',
      
      // AI Preferences
      'ALTER TABLE ai_preferences ADD CONSTRAINT IF NOT EXISTS fk_ai_pref_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE',
      
      // AI Resource Configs
      'ALTER TABLE ai_resource_configs ADD CONSTRAINT IF NOT EXISTS fk_ai_config_usuario FOREIGN KEY (configured_by) REFERENCES usuarios(id) ON DELETE SET NULL'
    ];

    for (const fk of foreignKeys) {
      try {
        await this.db.execute(sql.raw(fk));
        const constraintName = fk.split('CONSTRAINT')[1]?.split('FOREIGN')[0]?.trim() || 'unknown';
        console.log(`✅ Foreign key criada: ${constraintName}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ Foreign key já existe`);
        } else {
          console.error(`❌ Erro ao criar foreign key:`, error.message);
          // Não parar o processo por foreign keys
        }
      }
    }
  }

  private async createIndexes() {
    console.log('📊 Criando índices para performance...');

    const indexes = [
      // Empresas
      'CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj)',
      'CREATE INDEX IF NOT EXISTS idx_empresas_nome ON empresas(nome)',
      
      // Contratos
      'CREATE INDEX IF NOT EXISTS idx_contratos_empresa_id ON contratos(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contratos(numero)',
      'CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status)',
      
      // Usuários
      'CREATE INDEX IF NOT EXISTS idx_usuarios_cognito_sub ON usuarios(cognito_sub)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_id ON usuarios(empresa_id)',
      
      // Escolas
      'CREATE INDEX IF NOT EXISTS idx_escolas_codigo_inep ON escolas(codigo_inep)',
      'CREATE INDEX IF NOT EXISTS idx_escolas_empresa_id ON escolas(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_escolas_contrato_id ON escolas(contrato_id)',
      
      // Gestores
      'CREATE INDEX IF NOT EXISTS idx_gestores_usr_id ON gestores(usr_id)',
      'CREATE INDEX IF NOT EXISTS idx_gestores_empresa_id ON gestores(empresa_id)',
      
      // Diretores
      'CREATE INDEX IF NOT EXISTS idx_diretores_usr_id ON diretores(usr_id)',
      'CREATE INDEX IF NOT EXISTS idx_diretores_escola_id ON diretores(escola_id)',
      'CREATE INDEX IF NOT EXISTS idx_diretores_empresa_id ON diretores(empresa_id)',
      
      // Professores
      'CREATE INDEX IF NOT EXISTS idx_professores_usr_id ON professores(usr_id)',
      'CREATE INDEX IF NOT EXISTS idx_professores_escola_id ON professores(escola_id)',
      'CREATE INDEX IF NOT EXISTS idx_professores_empresa_id ON professores(empresa_id)',
      
      // Alunos
      'CREATE INDEX IF NOT EXISTS idx_alunos_usr_id ON alunos(usr_id)',
      'CREATE INDEX IF NOT EXISTS idx_alunos_escola_id ON alunos(escola_id)',
      'CREATE INDEX IF NOT EXISTS idx_alunos_empresa_id ON alunos(empresa_id)',
      'CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON alunos(matricula)',
      
      // AI Preferences
      'CREATE INDEX IF NOT EXISTS idx_ai_pref_user_id ON ai_preferences(user_id)',
      
      // AI Resource Configs
      'CREATE INDEX IF NOT EXISTS idx_ai_config_resource_id ON ai_resource_configs(resource_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_config_type ON ai_resource_configs(resource_type)'
    ];

    for (const index of indexes) {
      try {
        await this.db.execute(sql.raw(index));
        const indexName = index.split('INDEX')[1]?.split('ON')[0]?.trim() || 'unknown';
        console.log(`✅ Índice criado: ${indexName}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ Índice já existe`);
        } else {
          console.error(`❌ Erro ao criar índice:`, error.message);
        }
      }
    }
  }

  private async validateTables() {
    console.log('🔍 Validando criação das tabelas...');

    const expectedTables = [
      'empresas', 'contratos', 'usuarios', 'escolas', 'gestores',
      'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs'
    ];

    const result = await this.db.execute(sql.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (${expectedTables.map(t => `'${t}'`).join(',')})
      ORDER BY table_name
    `));

    const createdTables = result.rows?.map((row: any) => row.table_name) || [];
    
    console.log('📋 Tabelas encontradas no Aurora DSQL:');
    for (const table of expectedTables) {
      if (createdTables.includes(table)) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - AUSENTE`);
      }
    }

    const missingTables = expectedTables.filter(t => !createdTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('🎉 Todas as 10 tabelas hierárquicas criadas com sucesso!');
      return true;
    } else {
      console.error(`❌ ${missingTables.length} tabelas ausentes: ${missingTables.join(', ')}`);
      return false;
    }
  }

  async getTableStats() {
    console.log('📊 Estatísticas das tabelas no Aurora DSQL:');
    
    const tables = [
      'empresas', 'contratos', 'usuarios', 'escolas', 'gestores',
      'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs'
    ];

    for (const table of tables) {
      try {
        const result = await this.db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        const count = result.rows?.[0]?.count || 0;
        console.log(`  📋 ${table}: ${count} registros`);
      } catch (error: any) {
        console.log(`  ❌ ${table}: Erro ao contar registros`);
      }
    }
  }
}

// Função para executar o script
export async function createAuroraTables() {
  const creator = new AuroraTableCreator();
  return await creator.createAllTables();
}

// Função para obter estatísticas
export async function getAuroraTableStats() {
  const creator = new AuroraTableCreator();
  return await creator.getTableStats();
}

// Se executado diretamente
if (import.meta.main) {
  createAuroraTables()
    .then(() => {
      console.log('✅ Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falhou:', error);
      process.exit(1);
    });
}
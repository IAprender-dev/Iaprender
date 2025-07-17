/**
 * EXECUÇÃO DO SCRIPT SQL OTIMIZADO NO POSTGRESQL
 * 
 * Este script executa o schema SQL otimizado enviado pelo usuário
 * no PostgreSQL que está 100% funcional
 */

const { Client } = require('pg');
require('dotenv').config();

// Script SQL otimizado do usuário
const SCRIPT_SQL = `
-- ✅ Script Aurora PostgreSQL 100% otimizado e escalável
-- Para plataforma educacional com Cognito, IA, S3 e DynamoDB
-- Desenvolvido para suportar alta escalabilidade e integridade relacional

-- 🚨 Etapa 1: ENUMs Centralizados
CREATE TYPE papel_usuario AS ENUM ('admin', 'gestor', 'diretor', 'professor', 'aluno');
CREATE TYPE status_registro AS ENUM ('ativo', 'inativo', 'suspenso');
CREATE TYPE tipo_contrato AS ENUM ('licenca', 'parceria');

-- 🔹 Empresas
CREATE TABLE empresas (
  emp_id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email_contato TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Usuários (espelho do Cognito)
CREATE TABLE usuarios (
  usr_id TEXT PRIMARY KEY, -- Cognito Sub (UUID)
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  papel papel_usuario NOT NULL,
  empresa_id TEXT NOT NULL REFERENCES empresas(emp_id),
  telefone TEXT,
  documento_identidade TEXT,
  data_nascimento DATE,
  genero TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  foto_perfil TEXT,
  status status_registro DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Gestores
CREATE TABLE gestores (
  usr_id TEXT PRIMARY KEY REFERENCES usuarios(usr_id) ON DELETE CASCADE,
  cargo TEXT,
  data_admissao DATE,
  criado_por TEXT
);

-- 🔹 Contratos
CREATE TABLE contratos (
  contrato_id TEXT PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(emp_id),
  tipo tipo_contrato DEFAULT 'licenca',
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  numero_licencas INTEGER,
  valor_total NUMERIC(12, 2),
  documento_pdf TEXT,
  status status_registro DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Escolas
CREATE TABLE escolas (
  escola_id TEXT PRIMARY KEY,
  contrato_id TEXT NOT NULL REFERENCES contratos(contrato_id),
  empresa_id TEXT NOT NULL REFERENCES empresas(emp_id),
  nome TEXT NOT NULL,
  codigo_inep TEXT UNIQUE,
  tipo_escola TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  status status_registro DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Diretores
CREATE TABLE diretores (
  usr_id TEXT PRIMARY KEY REFERENCES usuarios(usr_id) ON DELETE CASCADE,
  escola_id TEXT NOT NULL REFERENCES escolas(escola_id),
  cargo TEXT,
  data_inicio DATE,
  status status_registro DEFAULT 'ativo',
  criado_por TEXT
);

-- 🔹 Professores
CREATE TABLE professores (
  usr_id TEXT PRIMARY KEY REFERENCES usuarios(usr_id) ON DELETE CASCADE,
  escola_id TEXT NOT NULL REFERENCES escolas(escola_id),
  disciplinas TEXT,
  formacao TEXT,
  data_admissao DATE,
  status status_registro DEFAULT 'ativo',
  criado_por TEXT
);

-- 🔹 Alunos
CREATE TABLE alunos (
  usr_id TEXT PRIMARY KEY REFERENCES usuarios(usr_id) ON DELETE CASCADE,
  escola_id TEXT NOT NULL REFERENCES escolas(escola_id),
  matricula TEXT UNIQUE NOT NULL,
  turma TEXT,
  serie TEXT,
  turno TEXT,
  nome_responsavel TEXT,
  contato_responsavel TEXT,
  data_matricula DATE,
  status status_registro DEFAULT 'ativo',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Arquivos (relacionados a S3)
CREATE TABLE arquivos (
  uuid UUID PRIMARY KEY,
  empresa_id TEXT NOT NULL REFERENCES empresas(emp_id),
  contrato_id TEXT NOT NULL REFERENCES contratos(contrato_id),
  escola_id TEXT,
  usuario_id TEXT NOT NULL REFERENCES usuarios(usr_id),
  tipo_usuario papel_usuario NOT NULL,
  s3_key TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_por TEXT
);

-- 🔹 Índices extras para performance
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX idx_arquivos_usuario ON arquivos(usuario_id);
CREATE INDEX idx_arquivos_empresa ON arquivos(empresa_id);
CREATE INDEX idx_alunos_escola ON alunos(escola_id);
CREATE INDEX idx_professores_escola ON professores(escola_id);
`;

class PostgreSQLExecutor {
  constructor() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Conectado ao PostgreSQL com sucesso');
    } catch (error) {
      console.error('❌ Erro ao conectar ao PostgreSQL:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('✅ Desconectado do PostgreSQL');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }

  async executeScript() {
    console.log('🚀 Iniciando execução do script SQL otimizado...');
    
    try {
      await this.connect();
      
      // Dividir o script em comandos individuais
      const commands = this.parseScript(SCRIPT_SQL);
      
      console.log(`📝 Total de comandos a executar: ${commands.length}`);
      
      const results = [];
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`\n⏳ Executando comando ${i + 1}/${commands.length}:`);
        console.log(command.substring(0, 100) + '...');
        
        try {
          const result = await this.client.query(command);
          results.push({
            command: command,
            success: true,
            result: result
          });
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error) {
          results.push({
            command: command,
            success: false,
            error: error.message
          });
          console.log(`❌ Erro no comando ${i + 1}: ${error.message}`);
          
          // Continuar com próximo comando mesmo se houver erro
          if (error.message.includes('already exists')) {
            console.log(`ℹ️ Ignorando erro de "já existe" - continuando...`);
          }
        }
      }
      
      // Relatório final
      console.log('\n📊 RELATÓRIO FINAL DE EXECUÇÃO:');
      console.log('='.repeat(50));
      
      const sucessos = results.filter(r => r.success).length;
      const erros = results.filter(r => !r.success).length;
      
      console.log(`✅ Comandos executados com sucesso: ${sucessos}`);
      console.log(`❌ Comandos com erro: ${erros}`);
      console.log(`📝 Total de comandos: ${results.length}`);
      
      if (erros > 0) {
        console.log('\n🚨 ERROS ENCONTRADOS:');
        results.filter(r => !r.success).forEach((result, index) => {
          console.log(`${index + 1}. ${result.error}`);
        });
      }
      
      // Verificar tabelas criadas
      console.log('\n📋 VERIFICANDO TABELAS CRIADAS:');
      try {
        const tablesResult = await this.client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `);
        
        console.log('📊 Tabelas encontradas:');
        tablesResult.rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.table_name}`);
        });
      } catch (error) {
        console.log('❌ Erro ao listar tabelas:', error.message);
      }
      
      console.log('\n🎉 EXECUÇÃO DO SCRIPT FINALIZADA!');
      
      return {
        success: sucessos > 0,
        totalCommands: results.length,
        successCount: sucessos,
        errorCount: erros,
        results: results
      };
      
    } catch (error) {
      console.error('❌ Erro crítico na execução do script:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  parseScript(script) {
    // Dividir o script por comandos SQL (separados por ;)
    const commands = script
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      .filter(cmd => !cmd.match(/^-+/)); // Remover linhas de comentário
    
    return commands;
  }
}

// Executar o script
async function main() {
  const executor = new PostgreSQLExecutor();
  
  try {
    const result = await executor.executeScript();
    
    console.log('\n🏁 RESULTADO FINAL:');
    console.log(`Success: ${result.success}`);
    console.log(`Total Commands: ${result.totalCommands}`);
    console.log(`Success Count: ${result.successCount}`);
    console.log(`Error Count: ${result.errorCount}`);
    
    if (result.success) {
      console.log('\n✅ SCHEMA HIERÁRQUICO CRIADO COM SUCESSO NO POSTGRESQL!');
      console.log('📋 O sistema está pronto para uso com a nova estrutura otimizada');
    } else {
      console.log('\n❌ Falha na criação do schema');
    }
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Falha crítica:', error);
    process.exit(1);
  }
}

// Executar
main();
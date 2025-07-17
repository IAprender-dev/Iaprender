/**
 * SCRIPT PARA EXECUTAR COMANDOS SQL NO AURORA DSQL
 * 
 * Este script executa o schema SQL otimizado enviado pelo usuário
 * no Aurora DSQL usando RDS Data API
 */

import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import * as fs from 'fs';

// Configuração AWS
const client = new RDSDataClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// Configuração Aurora DSQL
const CLUSTER_ARN = `arn:aws:dsql:us-east-1:762723916379:cluster/${process.env.ENDPOINT_AURORA?.split('.')[0]}`;

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

class AuroraScriptExecutor {
  private client: RDSDataClient;
  private clusterArn: string;

  constructor() {
    this.client = client;
    this.clusterArn = CLUSTER_ARN;
  }

  async executeScript() {
    console.log('🚀 Iniciando execução do script Aurora DSQL...');
    console.log(`📍 Cluster ARN: ${this.clusterArn}`);
    
    try {
      // Dividir o script em comandos individuais
      const commands = this.parseScript(SCRIPT_SQL);
      
      console.log(`📝 Total de comandos a executar: ${commands.length}`);
      
      const results = [];
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        console.log(`\n⏳ Executando comando ${i + 1}/${commands.length}:`);
        console.log(command.substring(0, 100) + '...');
        
        try {
          const result = await this.executeCommand(command);
          results.push({
            command: command,
            success: true,
            result: result
          });
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } catch (error: any) {
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
    }
  }

  private parseScript(script: string): string[] {
    // Dividir o script por comandos SQL (separados por ;)
    const commands = script
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
      .filter(cmd => !cmd.match(/^-+/)); // Remover linhas de comentário
    
    return commands;
  }

  private async executeCommand(sqlCommand: string): Promise<any> {
    const command = new ExecuteStatementCommand({
      resourceArn: this.clusterArn,
      sql: sqlCommand
    });
    
    return await this.client.send(command);
  }
}

// Executar o script
async function main() {
  const executor = new AuroraScriptExecutor();
  
  try {
    const result = await executor.executeScript();
    
    console.log('\n🏁 RESULTADO FINAL:');
    console.log(`Success: ${result.success}`);
    console.log(`Total Commands: ${result.totalCommands}`);
    console.log(`Success Count: ${result.successCount}`);
    console.log(`Error Count: ${result.errorCount}`);
    
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Falha crítica:', error);
    process.exit(1);
  }
}

// Executar automaticamente
main();

export { AuroraScriptExecutor };
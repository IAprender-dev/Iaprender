import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './database.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Função para executar o schema SQL
export async function initializeSchema() {
  const client = await pool.connect();
  
  try {
    logger.info('🔄 Iniciando criação do schema de banco de dados...');
    
    // Ler o arquivo SQL
    const sqlPath = join(__dirname, 'database.sql');
    const sqlScript = readFileSync(sqlPath, 'utf8');
    
    // Executar o script SQL
    await client.query(sqlScript);
    
    logger.info('✅ Schema de banco de dados criado com sucesso');
    return true;
    
  } catch (error) {
    // Se a tabela já existe, não é um erro crítico
    if (error.code === '42P07') { // relation already exists
      logger.info('⚠️ Tabela usuarios já existe, pulando criação');
      return true;
    }
    
    logger.error('❌ Erro ao criar schema de banco de dados:', error);
    throw error;
    
  } finally {
    client.release();
  }
}

// Função para verificar se as tabelas existem
export async function checkTablesExist() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuarios')
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    logger.info('📋 Tabelas existentes:', existingTables);
    
    return {
      usuarios: existingTables.includes('usuarios'),
      empresas: existingTables.includes('empresas')
    };
    
  } catch (error) {
    logger.error('❌ Erro ao verificar tabelas:', error);
    throw error;
    
  } finally {
    client.release();
  }
}

// Função para resetar o schema (cuidado - vai deletar todos os dados!)
export async function resetSchema() {
  const client = await pool.connect();
  
  try {
    logger.warn('⚠️ RESETANDO SCHEMA - TODOS OS DADOS SERÃO PERDIDOS!');
    
    // Dropar tabelas em ordem reversa devido às foreign keys
    await client.query('DROP TABLE IF EXISTS empresas CASCADE;');
    await client.query('DROP TABLE IF EXISTS usuarios CASCADE;');
    
    logger.info('🗑️ Schema resetado com sucesso');
    return true;
    
  } catch (error) {
    logger.error('❌ Erro ao resetar schema:', error);
    throw error;
    
  } finally {
    client.release();
  }
}

// Função para verificar integridade do schema
export async function validateSchema() {
  const client = await pool.connect();
  
  try {
    // Verificar se a tabela usuarios tem a estrutura correta
    const usuariosResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    const expectedUsuariosColumns = [
      'id', 'cognito_sub', 'email', 'nome', 'tipo_usuario', 
      'empresa_id', 'telefone', 'documento_identidade', 
      'data_nascimento', 'genero', 'endereco', 'cidade', 
      'estado', 'foto_perfil', 'criado_em', 'atualizado_em'
    ];
    
    const actualUsuariosColumns = usuariosResult.rows.map(row => row.column_name);
    const missingUsuariosColumns = expectedUsuariosColumns.filter(col => !actualUsuariosColumns.includes(col));
    
    if (missingUsuariosColumns.length > 0) {
      logger.error('❌ Colunas faltando na tabela usuarios:', missingUsuariosColumns);
      return false;
    }
    
    // Verificar se a tabela empresas tem a estrutura correta (se existir)
    const empresasResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'empresas' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    if (empresasResult.rows.length > 0) {
      const expectedEmpresasColumns = [
        'id', 'nome', 'cnpj', 'telefone', 'email_contato',
        'endereco', 'cidade', 'estado', 'logo', 'criado_por', 'criado_em'
      ];
      
      const actualEmpresasColumns = empresasResult.rows.map(row => row.column_name);
      const missingEmpresasColumns = expectedEmpresasColumns.filter(col => !actualEmpresasColumns.includes(col));
      
      if (missingEmpresasColumns.length > 0) {
        logger.error('❌ Colunas faltando na tabela empresas:', missingEmpresasColumns);
        return false;
      }
    }
    
    logger.info('✅ Schema validado com sucesso');
    return true;
    
  } catch (error) {
    logger.error('❌ Erro ao validar schema:', error);
    return false;
    
  } finally {
    client.release();
  }
}
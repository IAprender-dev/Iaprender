/**
 * SETUP GLOBAL DOS TESTES - IAPRENDER
 * 
 * Configuração executada uma vez antes de todos os testes
 */

import { Pool } from 'pg';

export default async () => {
  console.log('🚀 Iniciando setup global dos testes...');

  // Configurar banco de dados de teste
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!testDatabaseUrl) {
    throw new Error('❌ URL do banco de dados de teste não configurada');
  }

  const pool = new Pool({
    connectionString: testDatabaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    // Verificar conexão com banco de dados
    const client = await pool.connect();
    console.log('✅ Conexão com banco de dados de teste estabelecida');
    
    // Verificar se as tabelas principais existem
    const tabelas = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('usuarios', 'empresas', 'contratos', 'escolas', 'alunos')
    `);

    if (tabelas.rows.length < 5) {
      console.log('⚠️ Algumas tabelas podem não existir - execute as migrações antes dos testes');
    } else {
      console.log('✅ Tabelas principais verificadas no banco de teste');
    }

    client.release();
  } catch (error) {
    console.error('❌ Erro ao configurar banco de dados de teste:', error.message);
    throw error;
  } finally {
    await pool.end();
  }

  console.log('✅ Setup global dos testes concluído');
};
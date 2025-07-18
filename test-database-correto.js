/**
 * Teste com o database correto "BDIAPRENDER"
 */

import { Pool } from 'pg';

async function testCorrectDatabase() {
  console.log('🔍 TESTE COM DATABASE CORRETO: "BDIAPRENDER"');
  console.log('================================================================================');
  
  const host = process.env.AURORA_SERVERLESS_HOST?.trim();
  const password = process.env.AURORA_SERVERLESS_PASSWORD;
  const database = 'BDIAPRENDER'; // FORÇAR nome correto
  const username = 'Admn';
  const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');
  
  console.log(`📊 Configuração de Teste:`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);
  console.log(`   Password: ${password ? '***configurada***' : '❌ NÃO CONFIGURADA'}`);
  
  const pool = new Pool({
    host: host,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: { 
      rejectUnauthorized: false,
      require: true 
    },
    connectionTimeoutMillis: 30000,
    max: 1
  });
  
  try {
    console.log('\n🔌 Conectando com "BDIAPRENDER"...');
    const client = await pool.connect();
    console.log('✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
    
    // Teste de query básica
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('✅ Query executada com sucesso!');
    console.log(`   Versão PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Usuário: ${result.rows[0].current_user}`);
    
    // Verificar se existem tabelas
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Tabelas encontradas: ${tablesResult.rows.length}`);
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name} (${row.table_type})`));
    } else {
      console.log('⚠️ Banco vazio - pronto para migração das tabelas');
    }
    
    client.release();
    console.log('\n🎯 SUCESSO TOTAL: Aurora Serverless 100% FUNCIONAL!');
    return true;
    
  } catch (error) {
    console.log('\n❌ ERRO:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

testCorrectDatabase()
  .then(success => {
    if (success) {
      console.log('\n✅ TESTE CONCLUÍDO: Aurora Serverless pronto para produção!');
      console.log('💡 Database correto: BDIAPRENDER');
      console.log('🔄 Próximo passo: Executar migração das tabelas');
    } else {
      console.log('\n❌ TESTE FALHOU');
    }
  });
/**
 * Teste direto de conectividade Aurora Serverless
 * Verifica se as credenciais estão corretas e o banco está acessível
 */

const { Pool } = require('pg');

async function testAuroraConnection() {
  console.log('🔍 TESTE DIRETO: Conectividade Aurora Serverless');
  console.log('================================================================================');
  
  const host = process.env.AURORA_SERVERLESS_HOST?.trim();
  const password = process.env.AURORA_SERVERLESS_PASSWORD;
  const database = process.env.AURORA_SERVERLESS_DB || 'bdiaprender';
  const username = (process.env.AURORA_SERVERLESS_USER || 'Admin').trim();
  const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');
  
  console.log(`📊 Configuração de Teste:`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);
  console.log(`   Password: ${password ? '***configurada***' : '❌ NÃO CONFIGURADA'}`);
  
  if (!host || !password) {
    console.log('❌ ERRO: Credenciais obrigatórias não configuradas');
    return false;
  }
  
  const pool = new Pool({
    host: host,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: false, // Teste sem SSL primeiro
    connectionTimeoutMillis: 10000,
    max: 1
  });
  
  try {
    console.log('\n🔌 Tentando conexão...');
    const client = await pool.connect();
    console.log('✅ CONEXÃO ESTABELECIDA!');
    
    // Teste de query simples
    console.log('\n📋 Executando query de teste...');
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('✅ Query executada com sucesso!');
    console.log(`   Versão PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Usuário: ${result.rows[0].current_user}`);
    
    // Listar tabelas existentes
    console.log('\n📊 Verificando tabelas existentes...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ ${tablesResult.rows.length} tabelas encontradas:`);
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    } else {
      console.log('⚠️ Nenhuma tabela encontrada - banco está vazio');
    }
    
    client.release();
    console.log('\n🎯 RESULTADO: Aurora Serverless TOTALMENTE FUNCIONAL!');
    return true;
    
  } catch (error) {
    console.log('\n❌ ERRO DE CONEXÃO:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS não resolvido - verificar hostname');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Conexão recusada - verificar porta e firewall');
    } else if (error.code === '28P01') {
      console.log('💡 Falha de autenticação - verificar usuário/senha');
    } else if (error.code === '3D000') {
      console.log('💡 Database não existe - verificar nome do banco');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

// Executar teste
testAuroraConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ TESTE CONCLUÍDO: Aurora Serverless pronto para uso!');
    } else {
      console.log('\n❌ TESTE FALHOU: Verificar configurações');
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
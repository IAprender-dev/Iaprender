const { Pool } = require('pg');
require('dotenv').config();

async function testDirectAuroraDSQL() {
  console.log('🧪 TESTE DIRETO AURORA DSQL COM CONFIGURAÇÃO CORRETA');
  console.log('===================================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const port = '5432';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🔌 Porta: ${port}`);
  
  // Método 1: Connection string com token encodado
  console.log('\n🧪 TESTE 1: Token URL-encoded');
  try {
    const encodedToken = encodeURIComponent(token);
    const connectionString = `postgresql://postgres:${encodedToken}@${endpoint}:${port}/postgres`;
    
    const pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test, version() as version');
    
    console.log(`✅ SUCESSO! Aurora DSQL conectado!`);
    console.log(`📊 Resultado: ${JSON.stringify(result.rows[0])}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Falhou: ${error.message}`);
    console.log(`🔍 Code: ${error.code}`);
  }
  
  // Método 2: Configuração objeto separada
  console.log('\n🧪 TESTE 2: Configuração por objeto');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      user: 'postgres',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test, current_database() as db');
    
    console.log(`✅ SUCESSO! Aurora DSQL conectado via objeto!`);
    console.log(`📊 Resultado: ${JSON.stringify(result.rows[0])}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Falhou: ${error.message}`);
    console.log(`🔍 Code: ${error.code}`);
  }
  
  // Método 3: Tentar sem SSL
  console.log('\n🧪 TESTE 3: Sem SSL (improvável para Aurora DSQL)');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      user: 'postgres',
      password: token,
      ssl: false,
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    
    console.log(`✅ SUCESSO! Aurora DSQL sem SSL!`);
    console.log(`📊 Resultado: ${JSON.stringify(result.rows[0])}`);
    
    client.release();
    await pool.end();
    return true;
    
  } catch (error) {
    console.log(`❌ Falhou: ${error.message}`);
  }
  
  console.log('\n❌ TODOS OS MÉTODOS FALHARAM!');
  console.log('\n🔍 DIAGNÓSTICO FINAL:');
  console.log('1. 🚫 Aurora DSQL pode não estar acessível externamente');
  console.log('2. 🔑 Token pode estar expirado ou incorreto');
  console.log('3. 🌐 Endpoint pode estar inativo');
  console.log('4. 🔒 Configuração SSL específica pode ser necessária');
  console.log('5. 📍 Aurora DSQL pode ainda estar em preview/beta limitado');
  
  return false;
}

testDirectAuroraDSQL().catch(console.error);
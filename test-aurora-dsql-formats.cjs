const { Pool } = require('pg');
require('dotenv').config();

async function testDifferentFormats() {
  console.log('🧪 TESTANDO DIFERENTES FORMATOS AURORA DSQL');
  console.log('===========================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const port = '5432';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🔌 Porta: ${port}`);
  console.log(`🔑 Token: ${token?.substring(0, 50)}...`);
  console.log(`📏 Tamanho token: ${token?.length} chars`);
  
  // TESTE 1: Usuário admin em vez de postgres
  console.log('\n🧪 TESTE 1: Usuário admin');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      user: 'admin',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test, version() as version');
    console.log(`✅ SUCESSO com usuário admin!`);
    console.log(`📊 Resultado: ${JSON.stringify(result.rows[0])}`);
    client.release();
    await pool.end();
    return 'admin';
  } catch (error) {
    console.log(`❌ Falhou com admin: ${error.message.substring(0, 100)}`);
  }
  
  // TESTE 2: Sem usuário (deixar vazio)
  console.log('\n🧪 TESTE 2: Sem usuário específico');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ SUCESSO sem usuário específico!`);
    client.release();
    await pool.end();
    return 'none';
  } catch (error) {
    console.log(`❌ Falhou sem usuário: ${error.message.substring(0, 100)}`);
  }
  
  // TESTE 3: Token como usuário (não como password)
  console.log('\n🧪 TESTE 3: Token como usuário');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      user: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ SUCESSO com token como usuário!`);
    client.release();
    await pool.end();
    return 'token-as-user';
  } catch (error) {
    console.log(`❌ Falhou token como usuário: ${error.message.substring(0, 100)}`);
  }
  
  // TESTE 4: Usuário root
  console.log('\n🧪 TESTE 4: Usuário root');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'postgres',
      user: 'root',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ SUCESSO com usuário root!`);
    client.release();
    await pool.end();
    return 'root';
  } catch (error) {
    console.log(`❌ Falhou com root: ${error.message.substring(0, 100)}`);
  }
  
  // TESTE 5: Porta diferente (5433)
  console.log('\n🧪 TESTE 5: Porta 5433');
  try {
    const pool = new Pool({
      host: endpoint,
      port: 5433,
      database: 'postgres',
      user: 'postgres',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ SUCESSO com porta 5433!`);
    client.release();
    await pool.end();
    return 'port-5433';
  } catch (error) {
    console.log(`❌ Falhou porta 5433: ${error.message.substring(0, 100)}`);
  }
  
  // TESTE 6: Database diferente
  console.log('\n🧪 TESTE 6: Database dsql');
  try {
    const pool = new Pool({
      host: endpoint,
      port: parseInt(port),
      database: 'dsql',
      user: 'postgres',
      password: token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test');
    console.log(`✅ SUCESSO com database dsql!`);
    client.release();
    await pool.end();
    return 'db-dsql';
  } catch (error) {
    console.log(`❌ Falhou database dsql: ${error.message.substring(0, 100)}`);
  }
  
  console.log('\n❌ TODOS OS FORMATOS FALHARAM!');
  return null;
}

async function analyzeToken() {
  console.log('\n🔍 ANALISANDO ESTRUTURA DO TOKEN');
  console.log('================================');
  
  const token = process.env.TOKEN_AURORA;
  
  if (token.startsWith('http')) {
    console.log('📋 Token é uma URL completa');
    const url = new URL(token);
    console.log(`🌐 Host: ${url.hostname}`);
    console.log(`🔌 Porta: ${url.port || '5432'}`);
    console.log(`📍 Path: ${url.pathname}`);
    console.log(`🔑 Query params: ${url.search.length} chars`);
    
    // Extrair parâmetros importantes
    const params = new URLSearchParams(url.search);
    console.log(`📋 Ação: ${params.get('Action')}`);
    console.log(`🔐 Algoritmo: ${params.get('X-Amz-Algorithm')}`);
    console.log(`📅 Data: ${params.get('X-Amz-Date')}`);
    console.log(`⏰ Expira: ${params.get('X-Amz-Expires')} segundos`);
  } else {
    console.log('📋 Token não é URL - formato desconhecido');
  }
}

async function main() {
  await analyzeToken();
  const workingFormat = await testDifferentFormats();
  
  if (workingFormat) {
    console.log(`\n🎯 FORMATO FUNCIONAL ENCONTRADO: ${workingFormat}`);
    console.log('📋 Atualize o DatabaseManager para usar este formato');
  } else {
    console.log('\n💡 POSSÍVEIS CAUSAS:');
    console.log('1. Aurora DSQL não aceita conexões externas');
    console.log('2. Token precisa ser usado via API específica');
    console.log('3. Configuração AWS específica necessária');
    console.log('4. Aurora DSQL ainda em preview limitado');
  }
}

main().catch(console.error);
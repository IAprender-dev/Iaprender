const { Pool } = require('pg');
require('dotenv').config();

async function testAuroraDSQLPostgreSQL() {
  console.log('🧪 TESTANDO AURORA DSQL COMO POSTGRESQL NATIVO');
  console.log('==============================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const port = process.env.PORTA_AURORA || '5432';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🔌 Porta: ${port}`);
  console.log(`🔑 Token: ${token?.substring(0, 30)}...`);
  
  // Testar diferentes formatos de connection string
  const connectionFormats = [
    {
      name: 'Connection string com token como password',
      connectionString: `postgresql://postgres:${token}@${endpoint}:${port}/postgres`
    },
    {
      name: 'Connection string sem database específico',
      connectionString: `postgresql://postgres:${token}@${endpoint}:${port}`
    },
    {
      name: 'Connection string com usuário admin',
      connectionString: `postgresql://admin:${token}@${endpoint}:${port}/postgres`
    },
    {
      name: 'Connection string com token como usuário',
      connectionString: `postgresql://${token}:${token}@${endpoint}:${port}/postgres`
    }
  ];
  
  for (const format of connectionFormats) {
    console.log(`\n🧪 Testando: ${format.name}`);
    console.log(`   🔗 Connection: postgresql://***:***@${endpoint}:${port}/*`);
    
    try {
      const pool = new Pool({
        connectionString: format.connectionString,
        ssl: {
          rejectUnauthorized: false
        },
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 10000,
      });
      
      // Testar conexão simples
      const client = await pool.connect();
      const result = await client.query('SELECT version() as db_version, current_database() as db_name');
      
      console.log(`   ✅ SUCESSO! Aurora DSQL conectado!`);
      console.log(`   📊 Versão: ${result.rows[0].db_version}`);
      console.log(`   🗄️ Database: ${result.rows[0].db_name}`);
      console.log(`   🎯 USE ESTE FORMATO NO CÓDIGO!`);
      
      // Testar query de criação de tabela simples
      try {
        await client.query('CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)');
        await client.query('INSERT INTO test_table (name) VALUES ($1)', ['test_aurora_dsql']);
        const testResult = await client.query('SELECT * FROM test_table LIMIT 1');
        console.log(`   ✅ Teste de escrita bem-sucedido: ${JSON.stringify(testResult.rows[0])}`);
        await client.query('DROP TABLE test_table');
      } catch (writeError) {
        console.log(`   ⚠️ Teste de escrita falhou: ${writeError.message}`);
      }
      
      client.release();
      await pool.end();
      
      return {
        success: true,
        format: format,
        connectionString: format.connectionString
      };
      
    } catch (error) {
      console.log(`   ❌ Falhou: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log(`   💡 Conexão recusada - endpoint pode estar incorreto`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   💡 Host não encontrado - DNS pode estar incorreto`);
      } else if (error.message.includes('password')) {
        console.log(`   💡 Problema de autenticação - token pode estar incorreto`);
      } else if (error.message.includes('SSL')) {
        console.log(`   💡 Problema SSL - pode precisar configuração diferente`);
      }
    }
  }
  
  console.log('\n❌ NENHUM FORMATO FUNCIONOU!');
  console.log('\n🔍 POSSÍVEIS SOLUÇÕES:');
  console.log('1. 🔑 Verificar se o token Aurora DSQL está correto');
  console.log('2. 🌐 Verificar se o endpoint está acessível');
  console.log('3. 🔒 Verificar configurações SSL/TLS');
  console.log('4. 👤 Tentar diferentes usuários (postgres, admin, root)');
  console.log('5. 📍 Verificar se Aurora DSQL está ativo e acessível');
}

testAuroraDSQLPostgreSQL().catch(console.error);
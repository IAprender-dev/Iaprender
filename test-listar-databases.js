/**
 * Listar databases disponíveis no Aurora Serverless
 * Para descobrir o nome correto do banco
 */

import { Pool } from 'pg';

async function listDatabases() {
  console.log('🔍 LISTANDO DATABASES DISPONÍVEIS NO AURORA SERVERLESS');
  console.log('================================================================================');
  
  const host = process.env.AURORA_SERVERLESS_HOST?.trim();
  const password = process.env.AURORA_SERVERLESS_PASSWORD;
  const username = 'Admn';
  const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');
  
  // Conectar ao database padrão 'postgres' para listar outros databases
  const pool = new Pool({
    host: host,
    port: port,
    database: 'postgres', // Database padrão sempre existe
    user: username,
    password: password,
    ssl: { 
      rejectUnauthorized: false,
      require: true 
    },
    connectionTimeoutMillis: 15000,
    max: 1
  });
  
  try {
    console.log('🔌 Conectando ao database padrão "postgres"...');
    const client = await pool.connect();
    console.log('✅ CONECTADO!');
    
    // Listar todos os databases
    console.log('\n📋 Listando databases disponíveis...');
    const result = await client.query(`
      SELECT datname as database_name, 
             pg_size_pretty(pg_database_size(datname)) as size,
             datallowconn as allow_connections
      FROM pg_database 
      WHERE datistemplate = false
      ORDER BY datname;
    `);
    
    console.log(`✅ ${result.rows.length} databases encontrados:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.database_name} (${row.size}) - Conexões: ${row.allow_connections ? 'Permitidas' : 'Bloqueadas'}`);
    });
    
    // Verificar se existe database com nome similar
    console.log('\n🔍 Procurando databases similares...');
    const similarDbs = result.rows.filter(row => 
      row.database_name.toLowerCase().includes('aprender') ||
      row.database_name.toLowerCase().includes('bd') ||
      row.database_name.toLowerCase().includes('ia')
    );
    
    if (similarDbs.length > 0) {
      console.log('📍 Databases similares encontrados:');
      similarDbs.forEach(db => console.log(`   - ${db.database_name}`));
    } else {
      console.log('⚠️ Nenhum database similar encontrado');
    }
    
    client.release();
    
    // Testar conexão com database mais provável
    if (result.rows.length > 0) {
      const targetDb = result.rows.find(row => row.database_name !== 'postgres') || result.rows[0];
      console.log(`\n🧪 Testando conexão com "${targetDb.database_name}"...`);
      
      const testPool = new Pool({
        host: host,
        port: port,
        database: targetDb.database_name,
        user: username,
        password: password,
        ssl: { 
          rejectUnauthorized: false,
          require: true 
        },
        connectionTimeoutMillis: 10000,
        max: 1
      });
      
      try {
        const testClient = await testPool.connect();
        console.log(`✅ Conexão bem-sucedida com "${targetDb.database_name}"`);
        
        // Listar tabelas do database
        const tablesResult = await testClient.query(`
          SELECT table_name, table_type
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `);
        
        console.log(`📊 ${tablesResult.rows.length} tabelas encontradas:`);
        tablesResult.rows.forEach(row => console.log(`   - ${row.table_name} (${row.table_type})`));
        
        testClient.release();
        console.log(`\n🎯 DATABASE CORRETO: "${targetDb.database_name}"`);
        
      } catch (testError) {
        console.log(`❌ Erro ao conectar com "${targetDb.database_name}":`, testError.message);
      } finally {
        await testPool.end();
      }
    }
    
    return result.rows;
    
  } catch (error) {
    console.log('❌ ERRO:', error.message);
    return [];
  } finally {
    await pool.end();
  }
}

// Executar teste
listDatabases()
  .then(databases => {
    if (databases.length > 0) {
      console.log('\n✅ TESTE CONCLUÍDO: Databases listados com sucesso!');
      console.log('\n💡 PRÓXIMO PASSO: Atualizar AURORA_SERVERLESS_DB com o nome correto');
    } else {
      console.log('\n❌ TESTE FALHOU: Não foi possível listar databases');
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
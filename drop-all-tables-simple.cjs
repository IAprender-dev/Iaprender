const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function dropAllTablesSimple() {
  console.log('⚠️  INICIANDO EXCLUSÃO DE TODAS AS TABELAS...');
  console.log('===============================================');
  
  try {
    // Obter lista de todas as tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Tentar apagar cada tabela com CASCADE
    for (const row of tablesResult.rows) {
      try {
        console.log(`🗑️  Apagando tabela: ${row.table_name}...`);
        await pool.query(`DROP TABLE IF EXISTS "${row.table_name}" CASCADE;`);
        deletedCount++;
        console.log(`✅ Tabela ${row.table_name} apagada com sucesso`);
      } catch (error) {
        errorCount++;
        console.log(`❌ Erro ao apagar ${row.table_name}: ${error.message}`);
      }
    }
    
    // Apagar tipos customizados (ENUMs)
    console.log('');
    console.log('🔧 APAGANDO TIPOS CUSTOMIZADOS (ENUMs)...');
    console.log('=========================================');
    
    const enumsResult = await pool.query(`
      SELECT t.typname
      FROM pg_type t 
      WHERE t.typtype = 'e' 
        AND t.typname NOT LIKE 'pg_%'
      ORDER BY t.typname;
    `);
    
    for (const row of enumsResult.rows) {
      try {
        console.log(`🗑️  Apagando ENUM: ${row.typname}...`);
        await pool.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE;`);
        console.log(`✅ ENUM ${row.typname} apagado com sucesso`);
      } catch (error) {
        console.log(`❌ Erro ao apagar ENUM ${row.typname}: ${error.message}`);
      }
    }
    
    // Verificar se ainda existem tabelas
    const remainingTablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);
    
    console.log('');
    console.log('📊 RELATÓRIO FINAL DE EXCLUSÃO');
    console.log('==============================');
    console.log(`✅ Tabelas excluídas com sucesso: ${deletedCount}`);
    console.log(`❌ Erros durante exclusão: ${errorCount}`);
    console.log(`📋 Tabelas restantes: ${remainingTablesResult.rows.length}`);
    
    if (remainingTablesResult.rows.length > 0) {
      console.log('');
      console.log('⚠️  TABELAS RESTANTES:');
      remainingTablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('');
      console.log('🎉 BANCO DE DADOS COMPLETAMENTE LIMPO!');
      console.log('✅ Todas as tabelas foram removidas com sucesso');
      console.log('✅ Todos os ENUMs foram removidos com sucesso');
      console.log('');
      console.log('🚀 O banco está pronto para recriar a estrutura');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a operação:', error);
  } finally {
    await pool.end();
  }
}

// Executar função
dropAllTablesSimple();
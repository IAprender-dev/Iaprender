const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function dropAllTables() {
  console.log('🔍 LISTANDO TODAS AS TABELAS NO BANCO DE DADOS');
  console.log('===============================================');
  
  try {
    // Listar todas as tabelas com detalhes
    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_type,
        pg_size_pretty(pg_total_relation_size(c.oid)) as size,
        obj_description(c.oid) as comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    
    console.log(`📋 Total de tabelas encontradas: ${tablesResult.rows.length}`);
    console.log('');
    
    // Listar todas as tabelas
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name} (${row.size || 'N/A'})`);
    });
    
    console.log('');
    console.log('⚠️  IMPORTANTE: Estas tabelas serão PERMANENTEMENTE APAGADAS!');
    console.log('');
    
    // Obter contagem de registros por tabela
    console.log('📊 CONTAGEM DE REGISTROS POR TABELA:');
    console.log('====================================');
    
    const counts = {};
    for (const row of tablesResult.rows) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${row.table_name}"`;
        const countResult = await pool.query(countQuery);
        counts[row.table_name] = countResult.rows[0].count;
        console.log(`${row.table_name}: ${countResult.rows[0].count} registros`);
      } catch (error) {
        counts[row.table_name] = 'ERRO';
        console.log(`${row.table_name}: ERRO ao contar registros`);
      }
    }
    
    console.log('');
    console.log('🚨 CONFIRMAÇÃO NECESSÁRIA PARA CONTINUAR');
    console.log('========================================');
    console.log('Para executar a exclusão, execute:');
    console.log('node drop-all-tables.cjs --confirm');
    console.log('');
    
    // Verificar se confirmação foi dada
    const confirmFlag = process.argv.includes('--confirm');
    
    if (!confirmFlag) {
      console.log('❌ Execução interrompida - confirmação necessária');
      console.log('💡 Use --confirm para executar a exclusão');
      return;
    }
    
    console.log('⚠️  INICIANDO EXCLUSÃO DE TODAS AS TABELAS...');
    console.log('===============================================');
    
    // Desabilitar foreign key checks temporariamente
    await pool.query('SET session_replication_role = replica;');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Apagar cada tabela
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
    
    // Reabilitar foreign key checks
    await pool.query('SET session_replication_role = DEFAULT;');
    
    // Apagar tipos customizados (ENUMs)
    console.log('');
    console.log('🔧 APAGANDO TIPOS CUSTOMIZADOS (ENUMs)...');
    console.log('=========================================');
    
    const enumsQuery = `
      SELECT t.typname
      FROM pg_type t 
      WHERE t.typtype = 'e' 
        AND t.typname NOT LIKE 'pg_%'
      ORDER BY t.typname;
    `;
    
    const enumsResult = await pool.query(enumsQuery);
    
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
dropAllTables();
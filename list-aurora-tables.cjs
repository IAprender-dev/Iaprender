const { Client } = require('pg');
require('dotenv').config();

async function listAuroraTables() {
  const client = new Client({
    host: process.env.AURORA_SERVERLESS_HOST || 'bdiaprender.cluster-ccz2c6sk4tfg.us-east-1.rds.amazonaws.com',
    port: parseInt(process.env.AURORA_SERVERLESS_PORT || '5432'),
    database: process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER',
    user: process.env.AURORA_SERVERLESS_USER || 'Admn',
    password: process.env.AURORA_SERVERLESS_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Conectando ao Aurora Serverless...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Query para listar todas as tabelas do schema public
    const tablesQuery = `
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log('📊 Listando tabelas do banco Aurora Serverless:\n');
    const tablesResult = await client.query(tablesQuery);
    
    console.log(`Total de tabelas encontradas: ${tablesResult.rows.length}\n`);
    console.log('=' + '='.repeat(70));
    console.log(`| ${'Tabela'.padEnd(30)} | ${'Schema'.padEnd(15)} | ${'Owner'.padEnd(15)} |`);
    console.log('=' + '='.repeat(70));
    
    tablesResult.rows.forEach(row => {
      console.log(`| ${row.tablename.padEnd(30)} | ${row.schemaname.padEnd(15)} | ${row.tableowner.padEnd(15)} |`);
    });
    console.log('=' + '='.repeat(70));

    // Query para contar registros em cada tabela
    console.log('\n📈 Contagem de registros por tabela:\n');
    console.log('=' + '='.repeat(50));
    console.log(`| ${'Tabela'.padEnd(30)} | ${'Registros'.padEnd(15)} |`);
    console.log('=' + '='.repeat(50));
    
    for (const row of tablesResult.rows) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM ${row.tablename}`;
        const countResult = await client.query(countQuery);
        const count = countResult.rows[0].count;
        console.log(`| ${row.tablename.padEnd(30)} | ${count.toString().padEnd(15)} |`);
      } catch (err) {
        console.log(`| ${row.tablename.padEnd(30)} | ${'ERRO'.padEnd(15)} |`);
      }
    }
    console.log('=' + '='.repeat(50));

    // Query para listar índices
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    const indexResult = await client.query(indexQuery);
    console.log(`\n🔍 Total de índices encontrados: ${indexResult.rows.length}`);

    // Query para listar foreign keys
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `;

    const fkResult = await client.query(fkQuery);
    console.log(`\n🔗 Total de foreign keys encontradas: ${fkResult.rows.length}`);

    // Informações sobre o banco
    const dbInfoQuery = `
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version,
        pg_database_size(current_database()) as size_bytes
    `;

    const dbInfo = await client.query(dbInfoQuery);
    const info = dbInfo.rows[0];
    const sizeInMB = (parseInt(info.size_bytes) / 1024 / 1024).toFixed(2);

    console.log('\n📌 Informações do Banco de Dados:');
    console.log('=' + '='.repeat(70));
    console.log(`Database: ${info.database}`);
    console.log(`Usuário: ${info.user}`);
    console.log(`Tamanho: ${sizeInMB} MB`);
    console.log(`Versão: ${info.version.split(',')[0]}`);
    console.log('=' + '='.repeat(70));

  } catch (err) {
    console.error('❌ Erro ao conectar ou executar query:', err.message);
    if (err.code) {
      console.error(`Código do erro: ${err.code}`);
    }
  } finally {
    await client.end();
    console.log('\n✅ Conexão encerrada');
  }
}

// Executar
listAuroraTables();
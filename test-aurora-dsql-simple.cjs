const { Pool } = require('pg');
require('dotenv').config();

async function testSimpleConnection() {
  console.log('🧪 TESTE AURORA DSQL SIMPLIFICADO');
  console.log('================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  
  // Conexão direta simplificada (igual ao DatabaseManager)
  const pool = new Pool({
    host: endpoint,
    port: 5432,
    database: 'postgres',
    user: 'admin',
    password: token,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    max: 5
  });
  
  try {
    const client = await pool.connect();
    
    // Teste 1: Verificar versão
    const version = await client.query('SELECT version() as version');
    console.log(`✅ Conectado: ${version.rows[0].version.substring(0, 50)}...`);
    
    // Teste 2: Verificar tabelas principais
    const tables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('empresas', 'contratos', 'escolas', 'usuarios', 'gestores', 'diretores', 'professores', 'alunos')
      ORDER BY table_name
    `);
    
    console.log('\n📊 ESTRUTURA HIERÁRQUICA:');
    tables.rows.forEach(row => {
      console.log(`  ${row.table_name}: ${row.columns} colunas`);
    });
    
    // Teste 3: Contar registros
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM empresas) as empresas,
        (SELECT COUNT(*) FROM contratos) as contratos,
        (SELECT COUNT(*) FROM escolas) as escolas,
        (SELECT COUNT(*) FROM usuarios) as usuarios
    `);
    
    console.log('\n📈 REGISTROS:');
    const data = counts.rows[0];
    console.log(`  Empresas: ${data.empresas}`);
    console.log(`  Contratos: ${data.contratos}`);
    console.log(`  Escolas: ${data.escolas}`);
    console.log(`  Usuários: ${data.usuarios}`);
    
    client.release();
    await pool.end();
    
    console.log('\n🎯 Aurora DSQL funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
  }
}

testSimpleConnection();
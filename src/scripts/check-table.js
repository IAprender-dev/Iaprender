import { pool } from '../config/database.js';

async function checkTable() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Estrutura da tabela usuarios:');
    console.table(result.rows);
    
    // Verificar índices
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'usuarios'
    `);
    
    console.log('\n📋 Índices criados:');
    indexes.rows.forEach(idx => console.log(`- ${idx.indexname}`));
    
    // Verificar constraints
    const constraints = await client.query(`
      SELECT 
        constraint_name, 
        constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'usuarios'
    `);
    
    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(c => console.log(`- ${c.constraint_name} (${c.constraint_type})`));
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable().catch(console.error);
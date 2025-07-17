const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function verifyAuroraDSQLScript() {
  console.log('🔍 VERIFICANDO EXECUÇÃO DO SCRIPT AURORA DSQL');
  console.log('==============================================');
  
  try {
    // Verificar ENUMs criados
    console.log('1. 📋 VERIFICANDO ENUMs CRIADOS...');
    const enumsResult = await pool.query(`
      SELECT typname, enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE typname IN ('user_role', 'user_status', 'contract_status', 'cognito_group', 'resource_type')
      ORDER BY typname, enumlabel;
    `);
    
    const enumsByType = {};
    enumsResult.rows.forEach(row => {
      if (!enumsByType[row.typname]) {
        enumsByType[row.typname] = [];
      }
      enumsByType[row.typname].push(row.enumlabel);
    });
    
    console.log('✅ ENUMs encontrados:');
    Object.entries(enumsByType).forEach(([type, labels]) => {
      console.log(`   ${type}: ${labels.join(', ')}`);
    });
    
    // Verificar tabelas
    console.log('\n2. 📋 VERIFICANDO TABELAS...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const expectedTables = [
      'empresas', 'contratos', 'usuarios', 'escolas', 'gestores', 
      'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs'
    ];
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('✅ Tabelas verificadas:');
    expectedTables.forEach(table => {
      const exists = existingTables.includes(table);
      console.log(`   ${table}: ${exists ? '✅ EXISTE' : '❌ FALTANDO'}`);
    });
    
    // Verificar Foreign Keys
    console.log('\n3. 🔗 VERIFICANDO FOREIGN KEYS...');
    const foreignKeysResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = ANY($1)
      ORDER BY tc.table_name, tc.constraint_name;
    `, [expectedTables]);
    
    console.log(`✅ Foreign Keys verificadas: ${foreignKeysResult.rows.length} relacionamentos`);
    
    // Agrupar por tabela
    const fksByTable = {};
    foreignKeysResult.rows.forEach(fk => {
      if (!fksByTable[fk.table_name]) {
        fksByTable[fk.table_name] = [];
      }
      fksByTable[fk.table_name].push(`${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    Object.entries(fksByTable).forEach(([table, fks]) => {
      console.log(`   ${table}: ${fks.length} FK(s)`);
      fks.forEach(fk => console.log(`     ${fk}`));
    });
    
    // Verificar índices específicos do Aurora
    console.log('\n4. 📈 VERIFICANDO ÍNDICES AURORA...');
    const indexesResult = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = ANY($1)
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname;
    `, [expectedTables]);
    
    console.log(`✅ Índices Aurora verificados: ${indexesResult.rows.length} índices`);
    
    // Agrupar por tabela
    const indexesByTable = {};
    indexesResult.rows.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`   ${table}: ${indexes.length} índice(s)`);
    });
    
    // Testar integridade dos ENUMs
    console.log('\n5. 🧪 TESTANDO INTEGRIDADE DOS ENUMs...');
    
    try {
      // Testar inserção com ENUM
      await pool.query(`
        INSERT INTO ai_resource_configs (resource_id, resource_name, resource_type, selected_model) 
        VALUES ('test-teacher-001', 'Professor Teste', 'teacher', 'claude-3-haiku')
        ON CONFLICT (resource_id) DO UPDATE SET resource_name = EXCLUDED.resource_name;
      `);
      
      const enumTestResult = await pool.query(`
        SELECT resource_id, resource_type FROM ai_resource_configs WHERE resource_id = 'test-teacher-001';
      `);
      
      if (enumTestResult.rows.length > 0) {
        console.log('✅ ENUM resource_type funcionando corretamente');
        console.log(`   Valor inserido: ${enumTestResult.rows[0].resource_type}`);
      }
      
    } catch (error) {
      console.log(`❌ Erro ao testar ENUM: ${error.message}`);
    }
    
    // Verificar constraints específicas do Aurora
    console.log('\n6. 🔒 VERIFICANDO CONSTRAINTS AURORA...');
    const constraintsResult = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = ANY($1)
        AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK', 'UNIQUE')
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
    `, [expectedTables]);
    
    console.log(`✅ Constraints Aurora verificadas: ${constraintsResult.rows.length} constraints`);
    
    // Agrupar por tipo
    const constraintsByType = {};
    constraintsResult.rows.forEach(constraint => {
      if (!constraintsByType[constraint.constraint_type]) {
        constraintsByType[constraint.constraint_type] = [];
      }
      constraintsByType[constraint.constraint_type].push(constraint.constraint_name);
    });
    
    Object.entries(constraintsByType).forEach(([type, constraints]) => {
      console.log(`   ${type}: ${constraints.length} constraint(s)`);
    });
    
    // Relatório final
    console.log('\n🎉 RELATÓRIO FINAL DO SCRIPT AURORA DSQL');
    console.log('========================================');
    console.log(`✅ ENUMs criados: ${Object.keys(enumsByType).length}/5`);
    console.log(`✅ Tabelas verificadas: ${expectedTables.filter(t => existingTables.includes(t)).length}/10`);
    console.log(`✅ Foreign Keys: ${foreignKeysResult.rows.length} relacionamentos`);
    console.log(`✅ Índices Aurora: ${indexesResult.rows.length} índices`);
    console.log(`✅ Constraints: ${constraintsResult.rows.length} constraints`);
    
    // Verificar se tudo está ok
    const allEnumsCreated = Object.keys(enumsByType).length === 5;
    const allTablesExist = expectedTables.every(table => existingTables.includes(table));
    const hasForeignKeys = foreignKeysResult.rows.length > 0;
    const hasIndexes = indexesResult.rows.length > 0;
    
    if (allEnumsCreated && allTablesExist && hasForeignKeys && hasIndexes) {
      console.log('\n🚀 SCRIPT AURORA DSQL EXECUTADO COM SUCESSO!');
      console.log('✅ Todos os componentes foram criados/verificados');
      console.log('✅ Sistema híbrido PostgreSQL + Aurora DSQL pronto');
      console.log('✅ Estrutura compatível com ambos os ambientes');
    } else {
      console.log('\n⚠️  ALGUMAS VERIFICAÇÕES FALHARAM');
      console.log(`❌ ENUMs: ${allEnumsCreated ? 'OK' : 'FALHOU'}`);
      console.log(`❌ Tabelas: ${allTablesExist ? 'OK' : 'FALHOU'}`);
      console.log(`❌ Foreign Keys: ${hasForeignKeys ? 'OK' : 'FALHOU'}`);
      console.log(`❌ Índices: ${hasIndexes ? 'OK' : 'FALHOU'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verifyAuroraDSQLScript();
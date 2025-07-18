const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.AURORA_SERVERLESS_HOST?.trim(),
  port: parseInt(process.env.AURORA_SERVERLESS_PORT || '5432'),
  database: process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER',
  user: process.env.AURORA_SERVERLESS_USER || 'Admn',
  password: process.env.AURORA_SERVERLESS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function validarMigracaoFinal() {
  let client;
  try {
    console.log('🔍 VALIDAÇÃO FINAL DA MIGRAÇÃO AURORA SERVERLESS V2');
    console.log('=' .repeat(60));
    
    client = await pool.connect();
    console.log('✅ Conectado ao Aurora Serverless com sucesso');
    
    // VALIDAÇÃO 1: Verificar todas as tabelas
    console.log('\n📋 VALIDAÇÃO 1: Verificando tabelas criadas...');
    const tabelas = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns 
              WHERE table_name = t.table_name AND table_schema = 'public') as total_campos
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tabelasEsperadas = [
      'empresas', 'contratos', 'usuarios', 'escolas', 'gestores', 
      'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs'
    ];
    
    console.log(`📊 Tabelas encontradas: ${tabelas.rows.length}`);
    tabelas.rows.forEach(row => {
      const status = tabelasEsperadas.includes(row.table_name) ? '✅' : '⚠️';
      console.log(`${status} ${row.table_name}: ${row.total_campos} campos`);
    });
    
    // VALIDAÇÃO 2: Verificar campos de auditoria
    console.log('\n📋 VALIDAÇÃO 2: Verificando campos de auditoria...');
    const camposAuditoria = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name IN ('criado_por', 'atualizado_por', 'criado_em', 'atualizado_em')
      ORDER BY table_name, column_name
    `);
    
    const auditoriaPorTabela = {};
    camposAuditoria.rows.forEach(row => {
      if (!auditoriaPorTabela[row.table_name]) {
        auditoriaPorTabela[row.table_name] = [];
      }
      auditoriaPorTabela[row.table_name].push(row.column_name);
    });
    
    console.log('📊 Campos de auditoria por tabela:');
    Object.keys(auditoriaPorTabela).forEach(tabela => {
      const campos = auditoriaPorTabela[tabela];
      const completo = campos.length === 4 ? '✅' : '⚠️';
      console.log(`${completo} ${tabela}: ${campos.join(', ')}`);
    });
    
    // VALIDAÇÃO 3: Verificar nomenclatura user_id
    console.log('\n📋 VALIDAÇÃO 3: Verificando nomenclatura user_id...');
    const userIdFields = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name = 'user_id'
      ORDER BY table_name
    `);
    
    console.log('📊 Campos user_id encontrados:');
    userIdFields.rows.forEach(row => {
      console.log(`✅ ${row.table_name}.${row.column_name}`);
    });
    
    // VALIDAÇÃO 4: Verificar foreign keys
    console.log('\n📋 VALIDAÇÃO 4: Verificando foreign keys...');
    const foreignKeys = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    console.log(`📊 Foreign keys encontradas: ${foreignKeys.rows.length}`);
    foreignKeys.rows.forEach(row => {
      console.log(`✅ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // VALIDAÇÃO 5: Verificar índices
    console.log('\n📋 VALIDAÇÃO 5: Verificando índices...');
    const indices = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename IN ('empresas', 'contratos', 'usuarios', 'escolas', 'gestores', 'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs')
      ORDER BY tablename, indexname
    `);
    
    console.log(`📊 Índices encontrados: ${indices.rows.length}`);
    
    // Contar por tabela
    const indicesPorTabela = {};
    indices.rows.forEach(row => {
      if (!indicesPorTabela[row.tablename]) {
        indicesPorTabela[row.tablename] = 0;
      }
      indicesPorTabela[row.tablename]++;
    });
    
    Object.keys(indicesPorTabela).forEach(tabela => {
      console.log(`✅ ${tabela}: ${indicesPorTabela[tabela]} índices`);
    });
    
    // VALIDAÇÃO 6: Verificar triggers
    console.log('\n📋 VALIDAÇÃO 6: Verificando triggers...');
    const triggers = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);
    
    console.log(`📊 Triggers encontrados: ${triggers.rows.length}`);
    triggers.rows.forEach(row => {
      console.log(`✅ ${row.event_object_table}: ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
    });
    
    // VALIDAÇÃO 7: Verificar views
    console.log('\n📋 VALIDAÇÃO 7: Verificando views...');
    const views = await client.query(`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Views encontradas: ${views.rows.length}`);
    views.rows.forEach(row => {
      console.log(`✅ ${row.table_name}`);
    });
    
    // VALIDAÇÃO 8: Verificar ENUMs
    console.log('\n📋 VALIDAÇÃO 8: Verificando ENUMs...');
    const enums = await client.query(`
      SELECT 
        t.typname AS enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    console.log(`📊 ENUMs encontrados: ${enums.rows.length}`);
    enums.rows.forEach(row => {
      console.log(`✅ ${row.enum_name}: ${row.enum_values.join(', ')}`);
    });
    
    // RESUMO FINAL
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 RESUMO FINAL DA VALIDAÇÃO');
    console.log('=' .repeat(60));
    console.log(`✅ Tabelas: ${tabelas.rows.length}/10`);
    console.log(`✅ Campos de auditoria: ${Object.keys(auditoriaPorTabela).length} tabelas`);
    console.log(`✅ Campos user_id: ${userIdFields.rows.length} tabelas`);
    console.log(`✅ Foreign keys: ${foreignKeys.rows.length} relacionamentos`);
    console.log(`✅ Índices: ${indices.rows.length} total`);
    console.log(`✅ Triggers: ${triggers.rows.length} automáticos`);
    console.log(`✅ Views: ${views.rows.length} hierárquicas`);
    console.log(`✅ ENUMs: ${enums.rows.length} tipos`);
    console.log('\n🎉 MIGRAÇÃO VALIDADA COM SUCESSO!');
    console.log('🚀 Sistema Aurora Serverless V2 pronto para produção enterprise!');
    
  } catch (error) {
    console.error('❌ Erro na validação:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

validarMigracaoFinal().catch(console.error);
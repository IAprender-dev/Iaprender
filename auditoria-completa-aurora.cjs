const { Pool } = require('pg');
const fs = require('fs');

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

async function auditoriaCompleta() {
  let client;
  try {
    console.log('🔍 INICIANDO AUDITORIA COMPLETA DO BANCO DE DADOS AURORA SERVERLESS V2');
    console.log('=' .repeat(80));
    
    client = await pool.connect();
    console.log('✅ Conectado ao Aurora Serverless com sucesso\n');
    
    const resultados = {
      estruturaGeral: [],
      inconsistenciasNomenclatura: [],
      camposAuditoriaMissing: [],
      foreignKeysMissing: [],
      indicesMissing: [],
      indicesRedundantes: [],
      tiposDadosProblematicos: [],
      constraintsMissing: [],
      performanceIssues: [],
      documentacaoMissing: []
    };
    
    // 1. ANÁLISE DA ESTRUTURA GERAL
    console.log('📋 1. ANALISANDO ESTRUTURA GERAL DO BANCO...');
    const tabelas = await client.query(`
      SELECT 
        t.table_name,
        t.table_type,
        obj_description(c.oid) as table_comment,
        pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
        (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = t.table_name AND constraint_type = 'FOREIGN KEY') as fk_count,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);
    
    console.log(`✅ Encontradas ${tabelas.rows.length} tabelas\n`);
    
    // 2. VERIFICAR CONSISTÊNCIA DE NOMENCLATURA
    console.log('📋 2. VERIFICANDO CONSISTÊNCIA DE NOMENCLATURA...');
    const colunas = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    
    // Identificar inconsistências
    const padroes = {
      userId: /^(usr_id|user_id|usuario_id|id_usuario)$/,
      timestamp: /^(created_at|criado_em|updated_at|atualizado_em|data_criacao|data_atualizacao)$/,
      status: /^(status|ativo|active|situacao)$/,
      foreignKey: /_id$/
    };
    
    colunas.rows.forEach(col => {
      // Verificar snake_case
      if (col.column_name !== col.column_name.toLowerCase()) {
        resultados.inconsistenciasNomenclatura.push({
          tabela: col.table_name,
          coluna: col.column_name,
          problema: 'Não está em snake_case',
          sugestao: col.column_name.toLowerCase()
        });
      }
      
      // Verificar padrões inconsistentes
      if (col.column_name === 'usr_id' || col.column_name.match(/^usr_/)) {
        resultados.inconsistenciasNomenclatura.push({
          tabela: col.table_name,
          coluna: col.column_name,
          problema: 'Usar user_id ao invés de usr_id',
          sugestao: col.column_name.replace(/^usr_/, 'user_')
        });
      }
    });
    
    // 3. VERIFICAR CAMPOS DE AUDITORIA
    console.log('📋 3. VERIFICANDO CAMPOS DE AUDITORIA...');
    const camposAuditoriaEsperados = ['criado_em', 'atualizado_em', 'criado_por', 'atualizado_por'];
    
    for (const tabela of tabelas.rows) {
      const camposTabela = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
      `, [tabela.table_name]);
      
      const camposExistentes = camposTabela.rows.map(r => r.column_name);
      const camposFaltando = camposAuditoriaEsperados.filter(campo => !camposExistentes.includes(campo));
      
      if (camposFaltando.length > 0) {
        resultados.camposAuditoriaMissing.push({
          tabela: tabela.table_name,
          camposFaltando: camposFaltando
        });
      }
    }
    
    // 4. VERIFICAR FOREIGN KEYS
    console.log('📋 4. ANALISANDO FOREIGN KEYS...');
    const foreignKeys = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    `);
    
    // Verificar campos _id sem foreign key
    const camposId = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name LIKE '%_id'
      AND column_name != 'id'
    `);
    
    camposId.rows.forEach(campo => {
      const temFK = foreignKeys.rows.some(fk => 
        fk.table_name === campo.table_name && fk.column_name === campo.column_name
      );
      
      if (!temFK && campo.column_name !== 'cognito_sub') {
        resultados.foreignKeysMissing.push({
          tabela: campo.table_name,
          coluna: campo.column_name,
          problema: 'Campo _id sem foreign key'
        });
      }
    });
    
    // 5. ANÁLISE DE ÍNDICES
    console.log('📋 5. ANALISANDO ÍNDICES...');
    const indices = await client.query(`
      SELECT
        pi.schemaname,
        pi.tablename,
        pi.indexname,
        pi.indexdef,
        pg_size_pretty(pg_relation_size(psi.indexrelid)) as index_size
      FROM pg_indexes pi
      JOIN pg_stat_user_indexes psi ON psi.indexrelname = pi.indexname
      WHERE pi.schemaname = 'public'
      ORDER BY pi.tablename, pi.indexname
    `);
    
    // Verificar índices redundantes
    const indicesPorTabela = {};
    indices.rows.forEach(idx => {
      if (!indicesPorTabela[idx.tablename]) {
        indicesPorTabela[idx.tablename] = [];
      }
      indicesPorTabela[idx.tablename].push(idx);
    });
    
    // 6. VERIFICAR TIPOS DE DADOS
    console.log('📋 6. VERIFICANDO TIPOS DE DADOS...');
    const tiposProblematicos = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND (
        (data_type = 'character varying' AND character_maximum_length IS NULL)
        OR (data_type = 'text' AND column_name LIKE '%_id')
        OR (column_name LIKE '%email%' AND data_type != 'character varying')
        OR (column_name LIKE '%telefone%' AND data_type != 'character varying')
        OR (column_name IN ('status', 'tipo', 'tipo_usuario') AND data_type = 'text')
      )
    `);
    
    tiposProblematicos.rows.forEach(col => {
      resultados.tiposDadosProblematicos.push({
        tabela: col.table_name,
        coluna: col.column_name,
        tipoAtual: col.data_type,
        problema: determinarProblemaTipo(col)
      });
    });
    
    // 7. VERIFICAR CONSTRAINTS
    console.log('📋 7. VERIFICANDO CONSTRAINTS...');
    const constraints = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('CHECK', 'UNIQUE')
    `);
    
    // Verificar campos que deveriam ter constraints
    const camposEmail = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND column_name LIKE '%email%'
    `);
    
    camposEmail.rows.forEach(campo => {
      const temConstraint = constraints.rows.some(c => 
        c.table_name === campo.table_name && c.column_name === campo.column_name
      );
      
      if (!temConstraint) {
        resultados.constraintsMissing.push({
          tabela: campo.table_name,
          coluna: campo.column_name,
          tipo: 'CHECK',
          sugestao: 'Adicionar validação de formato de email'
        });
      }
    });
    
    // 8. VERIFICAR TRIGGERS
    console.log('📋 8. VERIFICANDO TRIGGERS...');
    const triggers = await client.query(`
      SELECT
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);
    
    // 9. GERAR RELATÓRIO
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RELATÓRIO DE AUDITORIA');
    console.log('=' .repeat(80) + '\n');
    
    // Salvar resultados em arquivo
    const relatorio = {
      dataAuditoria: new Date().toISOString(),
      banco: 'Aurora Serverless V2 - BDIAPRENDER',
      totalTabelas: tabelas.rows.length,
      resultados: resultados,
      estatisticas: {
        inconsistenciasNomenclatura: resultados.inconsistenciasNomenclatura.length,
        camposAuditoriaMissing: resultados.camposAuditoriaMissing.length,
        foreignKeysMissing: resultados.foreignKeysMissing.length,
        tiposDadosProblematicos: resultados.tiposDadosProblematicos.length,
        constraintsMissing: resultados.constraintsMissing.length
      }
    };
    
    fs.writeFileSync('auditoria-aurora-resultado.json', JSON.stringify(relatorio, null, 2));
    
    // Exibir resumo
    console.log('📌 PROBLEMAS ENCONTRADOS:');
    console.log(`- Inconsistências de nomenclatura: ${resultados.inconsistenciasNomenclatura.length}`);
    console.log(`- Campos de auditoria faltando: ${resultados.camposAuditoriaMissing.length}`);
    console.log(`- Foreign keys faltando: ${resultados.foreignKeysMissing.length}`);
    console.log(`- Tipos de dados problemáticos: ${resultados.tiposDadosProblematicos.length}`);
    console.log(`- Constraints faltando: ${resultados.constraintsMissing.length}`);
    
    console.log('\n✅ Auditoria completa! Resultados salvos em auditoria-aurora-resultado.json');
    
    return relatorio;
    
  } catch (error) {
    console.error('❌ Erro na auditoria:', error.message);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

function determinarProblemaTipo(col) {
  if (col.data_type === 'character varying' && !col.character_maximum_length) {
    return 'VARCHAR sem tamanho definido';
  }
  if (col.data_type === 'text' && col.column_name.includes('_id')) {
    return 'Campo ID usando TEXT ao invés de INTEGER/BIGINT';
  }
  if (col.column_name.includes('email') && col.data_type !== 'character varying') {
    return 'Campo email deveria ser VARCHAR';
  }
  if (col.column_name.includes('telefone') && col.data_type !== 'character varying') {
    return 'Campo telefone deveria ser VARCHAR';
  }
  if (['status', 'tipo', 'tipo_usuario'].includes(col.column_name) && col.data_type === 'text') {
    return 'Campo deveria usar ENUM ou VARCHAR com CHECK constraint';
  }
  return 'Tipo de dado não otimizado';
}

auditoriaCompleta().catch(console.error);
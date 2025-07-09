import { executeQuery, executeTransaction, checkConnection, getPoolStats } from './config/database.js';

// Função para testar as funcionalidades do banco de dados
async function testDatabase() {
  console.log('🧪 Iniciando testes do banco de dados...\n');

  try {
    // Teste 1: Verificar conexão
    console.log('1. Testando conexão com o banco...');
    const connectionOk = await checkConnection();
    if (!connectionOk) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    // Teste 2: Estatísticas do pool
    console.log('\n2. Estatísticas do pool de conexões:');
    const poolStats = getPoolStats();
    console.log('   Total de conexões:', poolStats.totalCount);
    console.log('   Conexões inativas:', poolStats.idleCount);
    console.log('   Conexões esperando:', poolStats.waitingCount);
    
    // Teste 3: Query simples
    console.log('\n3. Testando query simples...');
    const result = await executeQuery('SELECT COUNT(*) as total FROM usuarios');
    console.log('   Total de usuários:', result.rows[0].total);
    
    // Teste 4: Query com parâmetros
    console.log('\n4. Testando query com parâmetros...');
    const userResult = await executeQuery(
      'SELECT nome, email, tipo_usuario FROM usuarios WHERE tipo_usuario = $1 LIMIT 3',
      ['admin']
    );
    console.log('   Usuários admin encontrados:', userResult.rows.length);
    userResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.nome} (${user.email}) - ${user.tipo_usuario}`);
    });
    
    // Teste 5: Queries em todas as tabelas
    console.log('\n5. Testando contagem em todas as tabelas...');
    const tables = ['empresas', 'contratos', 'escolas', 'gestores', 'diretores', 'professores', 'alunos'];
    
    for (const table of tables) {
      try {
        const countResult = await executeQuery(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`   ${table}: ${countResult.rows[0].total} registros`);
      } catch (error) {
        console.log(`   ${table}: Erro - ${error.message}`);
      }
    }
    
    // Teste 6: Transação (simulação)
    console.log('\n6. Testando transação simples...');
    const transactionQueries = [
      { text: 'SELECT 1 as test1', params: [] },
      { text: 'SELECT 2 as test2', params: [] },
      { text: 'SELECT COUNT(*) as empresas_count FROM empresas', params: [] }
    ];
    
    const transactionResults = await executeTransaction(transactionQueries);
    console.log('   Transação executada com sucesso!');
    console.log('   Resultados:', transactionResults.map(r => r.rows[0]));
    
    // Teste 7: Estrutura hierárquica
    console.log('\n7. Testando estrutura hierárquica...');
    const hierarchyResult = await executeQuery(`
      SELECT 
        emp.nome AS empresa,
        COUNT(DISTINCT c.id) AS contratos,
        COUNT(DISTINCT e.id) AS escolas,
        COUNT(DISTINCT g.id) AS gestores,
        COUNT(DISTINCT d.id) AS diretores,
        COUNT(DISTINCT p.id) AS professores,
        COUNT(DISTINCT a.id) AS alunos
      FROM empresas emp
      LEFT JOIN contratos c ON emp.id = c.empresa_id
      LEFT JOIN escolas e ON c.id = e.contrato_id
      LEFT JOIN gestores g ON emp.id = g.empresa_id
      LEFT JOIN diretores d ON emp.id = d.empresa_id
      LEFT JOIN professores p ON emp.id = p.empresa_id
      LEFT JOIN alunos a ON emp.id = a.empresa_id
      GROUP BY emp.id, emp.nome
      ORDER BY contratos DESC
      LIMIT 3
    `);
    
    console.log('   Estrutura hierárquica das principais empresas:');
    hierarchyResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.empresa}:`);
      console.log(`      Contratos: ${row.contratos}, Escolas: ${row.escolas}`);
      console.log(`      Gestores: ${row.gestores}, Diretores: ${row.diretores}`);
      console.log(`      Professores: ${row.professores}, Alunos: ${row.alunos}`);
    });
    
    console.log('\n✅ Todos os testes executados com sucesso!');
    console.log('🎉 Configuração do banco de dados está funcionando perfeitamente!');
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar os testes
testDatabase();
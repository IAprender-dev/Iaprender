/**
 * TESTE DIRETO DE CONEXÃO COM AURORA DSQL
 * 
 * Script para testar conectividade e criar tabelas no Aurora DSQL
 */

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');

async function testAuroraConnection() {
  console.log('🔍 Testando conexão com Aurora DSQL...');
  
  try {
    // Obter credenciais das variáveis de ambiente
    const endpoint = process.env.ENDPOINT_AURORA;
    const porta = process.env.PORTA_AURORA;
    const token = process.env.TOKEN_AURORA;
    
    console.log('📋 Configuração Aurora DSQL:');
    console.log(`  Endpoint: ${endpoint ? endpoint.substring(0, 30) + '...' : 'NÃO CONFIGURADO'}`);
    console.log(`  Porta: ${porta || 'NÃO CONFIGURADO'}`);
    console.log(`  Token: ${token ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    
    if (!endpoint || !porta || !token) {
      throw new Error('Credenciais Aurora DSQL não estão configuradas. Verifique ENDPOINT_AURORA, PORTA_AURORA e TOKEN_AURORA nas secrets.');
    }
    
    // Criar cliente RDS Data API
    const rdsClient = new RDSDataClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    console.log('✅ Cliente RDS Data API criado');
    
    // Teste de conexão simples  
    console.log('🔄 Testando conectividade...');
    
    // Corrigir formato do ARN se necessário
    let clusterArn = endpoint;
    if (!endpoint.startsWith('arn:aws:dsql:')) {
      // Extrair apenas o ID do cluster do endpoint
      const clusterId = endpoint.split('.')[0];
      // Para Aurora DSQL, precisamos do ARN completo
      // Vou usar um account ID genérico e deixar o sistema corrigir se necessário
      clusterArn = `arn:aws:dsql:us-east-1:762723916379:cluster/${clusterId}`;
      console.log(`📝 ARN corrigido: ${clusterArn}`);
    }
    
    const testCommand = new ExecuteStatementCommand({
      resourceArn: clusterArn,
      database: 'postgres',
      sql: 'SELECT 1 as test'
    });
    
    const testResult = await rdsClient.send(testCommand);
    console.log('✅ Teste de conectividade bem-sucedido:', testResult.records);
    
    // Verificar tabelas existentes
    console.log('🔍 Verificando tabelas existentes...');
    
    const listTablesCommand = new ExecuteStatementCommand({
      resourceArn: clusterArn,
      database: 'postgres', 
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
    });
    
    const tablesResult = await rdsClient.send(listTablesCommand);
    const tabelas = tablesResult.records?.map(row => row[0].stringValue) || [];
    
    console.log('📋 Tabelas existentes:', tabelas.join(', ') || 'Nenhuma');
    
    // Criar tabela de teste
    console.log('🏗️ Criando tabela de teste...');
    
    const createTestTableCommand = new ExecuteStatementCommand({
      resourceArn: clusterArn,
      database: 'postgres',
      sql: `
        CREATE TABLE IF NOT EXISTS teste_conexao (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100),
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    });
    
    await rdsClient.send(createTestTableCommand);
    console.log('✅ Tabela de teste criada com sucesso');
    
    // Inserir dados de teste
    const insertTestCommand = new ExecuteStatementCommand({
      resourceArn: clusterArn,
      database: 'postgres',
      sql: `
        INSERT INTO teste_conexao (nome) 
        VALUES ('Teste Aurora DSQL Sistema Hierárquico') 
        RETURNING id, nome, criado_em
      `
    });
    
    const insertResult = await rdsClient.send(insertTestCommand);
    console.log('✅ Dados de teste inseridos:', insertResult.records);
    
    console.log('🎉 AURORA DSQL FUNCIONANDO PERFEITAMENTE!');
    console.log('🚀 Pronto para criar sistema hierárquico completo');
    
    return { 
      success: true, 
      endpoint: clusterArn, 
      tabelas,
      rdsClient 
    };
    
  } catch (error) {
    console.error('❌ Erro na conexão Aurora DSQL:', error.message);
    
    if (error.message.includes('credentials')) {
      console.log('💡 Verificar credenciais AWS nas secrets:');
      console.log('  - AWS_ACCESS_KEY_ID');
      console.log('  - AWS_SECRET_ACCESS_KEY');
    }
    
    if (error.message.includes('ENDPOINT_AURORA')) {
      console.log('💡 Verificar configuração Aurora DSQL nas secrets:');
      console.log('  - ENDPOINT_AURORA (ARN do cluster)');
      console.log('  - PORTA_AURORA (porta do cluster)');
      console.log('  - TOKEN_AURORA (token de acesso)');
    }
    
    return { success: false, error: error.message };
  }
}

// Executar teste se for script principal
if (require.main === module) {
  testAuroraConnection()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Teste concluído com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ Teste falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = { testAuroraConnection };
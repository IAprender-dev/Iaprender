/**
 * TESTE DE CONECTIVIDADE COM AURORA DSQL
 * 
 * Verifica se podemos conectar com Aurora DSQL e testa diferentes formatos
 */

const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
require('dotenv').config();

async function testAuroraConnection() {
  console.log('🔍 Testando conectividade com Aurora DSQL...');
  
  // Configuração do cliente
  const client = new RDSDataClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  
  // Extrair cluster ID do endpoint
  const endpoint = process.env.ENDPOINT_AURORA;
  const clusterId = endpoint ? endpoint.split('.')[0] : null;
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🆔 Cluster ID: ${clusterId}`);
  
  if (!clusterId) {
    console.error('❌ Não foi possível extrair cluster ID do endpoint');
    return;
  }
  
  // Testar diferentes formatos de ARN
  const arnFormats = [
    `arn:aws:dsql:us-east-1:762723916379:cluster/${clusterId}`,
    `arn:aws:rds:us-east-1:762723916379:cluster:${clusterId}`,
    `arn:aws:dsql:us-east-1:762723916379:cluster:${clusterId}`,
    endpoint, // Endpoint direto
    clusterId // Apenas cluster ID
  ];
  
  console.log('\n🧪 Testando diferentes formatos de ARN/Resource:');
  
  for (let i = 0; i < arnFormats.length; i++) {
    const resourceArn = arnFormats[i];
    console.log(`\n${i + 1}. Testando: ${resourceArn}`);
    
    try {
      const command = new ExecuteStatementCommand({
        resourceArn: resourceArn,
        sql: 'SELECT 1 as test'
      });
      
      const result = await client.send(command);
      console.log(`✅ SUCESSO! Formato correto: ${resourceArn}`);
      console.log(`📊 Resposta:`, result);
      
      // Se chegou aqui, encontrou o formato correto
      console.log('\n🎉 FORMATO CORRETO ENCONTRADO!');
      console.log(`🔗 ARN/Resource válido: ${resourceArn}`);
      
      // Testar criação de tabela simples
      console.log('\n🧪 Testando criação de tabela simples...');
      try {
        const createCommand = new ExecuteStatementCommand({
          resourceArn: resourceArn,
          sql: 'CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT)'
        });
        
        const createResult = await client.send(createCommand);
        console.log('✅ Tabela de teste criada com sucesso!');
        console.log(`📊 Resultado:`, createResult);
      } catch (createError) {
        console.log(`❌ Erro ao criar tabela: ${createError.message}`);
      }
      
      return resourceArn;
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n💥 Nenhum formato de ARN funcionou. Possíveis problemas:');
  console.log('1. Aurora DSQL não está configurado corretamente');
  console.log('2. Permissões AWS insuficientes');
  console.log('3. Cluster não existe ou não está ativo');
  console.log('4. Região incorreta');
  
  // Verificar credenciais básicas
  console.log('\n🔑 Verificando credenciais AWS...');
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'CONFIGURADO' : 'AUSENTE'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'CONFIGURADO' : 'AUSENTE'}`);
  console.log(`TOKEN_AURORA: ${process.env.TOKEN_AURORA ? 'CONFIGURADO' : 'AUSENTE'}`);
  
  return null;
}

// Executar teste
testAuroraConnection()
  .then((validArn) => {
    if (validArn) {
      console.log(`\n🎯 ARN VÁLIDO ENCONTRADO: ${validArn}`);
      console.log('💡 Use este ARN para executar o script SQL');
    } else {
      console.log('\n❌ Nenhum ARN válido encontrado');
      console.log('🔧 Verifique a configuração do Aurora DSQL na AWS');
    }
  })
  .catch((error) => {
    console.error('💥 Erro crítico:', error);
  });
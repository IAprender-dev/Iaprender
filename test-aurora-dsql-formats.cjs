const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
require('dotenv').config();

async function testAuroraDSQLFormats() {
  console.log('🔍 TESTANDO FORMATOS AURORA DSQL');
  console.log('=====================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const accountId = process.env.AWS_ACCOUNT_ID;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🔑 Token: ${token?.substring(0, 30)}...`);
  console.log(`🆔 Account ID: ${accountId}`);
  console.log(`🌍 Region: ${region}`);
  
  const rdsClient = new RDSDataClient({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });

  // Formato 1: Endpoint direto
  console.log('\n🧪 TESTE 1: Endpoint direto como resourceArn');
  await testFormat(rdsClient, endpoint, token, 'postgres');
  
  // Formato 2: ARN DSQL com cluster/
  console.log('\n🧪 TESTE 2: ARN DSQL com cluster/');
  const dsqlArn = `arn:aws:dsql:${region}:${accountId}:cluster/${endpoint}`;
  await testFormat(rdsClient, dsqlArn, token, 'postgres');
  
  // Formato 3: ARN RDS com cluster:
  console.log('\n🧪 TESTE 3: ARN RDS com cluster:');
  const rdsArn = `arn:aws:rds:${region}:${accountId}:cluster:${endpoint}`;
  await testFormat(rdsClient, rdsArn, token, 'postgres');
  
  // Formato 4: Apenas identificador do cluster
  console.log('\n🧪 TESTE 4: Identificador do cluster apenas');
  const clusterId = endpoint.split('.')[0]; // qeabuhp64eamddmw3vqdq52ph4
  await testFormat(rdsClient, clusterId, token, 'postgres');
  
  // Formato 5: ARN DSQL com identificador simples
  console.log('\n🧪 TESTE 5: ARN DSQL com identificador simples');
  const dsqlArnSimple = `arn:aws:dsql:${region}:${accountId}:cluster/${clusterId}`;
  await testFormat(rdsClient, dsqlArnSimple, token, 'postgres');
  
  // Formato 6: Sem database especificado
  console.log('\n🧪 TESTE 6: Endpoint direto sem database');
  await testFormat(rdsClient, endpoint, token, undefined);
}

async function testFormat(client, resourceArn, secretArn, database) {
  try {
    console.log(`   🔧 ResourceArn: ${resourceArn}`);
    console.log(`   🔧 Database: ${database || 'undefined'}`);
    
    const params = {
      resourceArn: resourceArn,
      secretArn: secretArn,
      sql: 'SELECT 1 as test',
    };
    
    if (database) {
      params.database = database;
    }
    
    const command = new ExecuteStatementCommand(params);
    const result = await client.send(command);
    
    console.log(`   ✅ SUCESSO! Resultado: ${JSON.stringify(result.records)}`);
    console.log(`   🎯 FORMATO FUNCIONOU: ${resourceArn}`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ FALHOU: ${error.message}`);
    if (error.$metadata) {
      console.log(`   📊 Status: ${error.$metadata.httpStatusCode}`);
    }
    return false;
  }
}

// Teste adicional: verificar se é Aurora Serverless v2
async function testAuroraServerlessV2() {
  console.log('\n🔍 TESTE ADICIONAL: Aurora Serverless v2');
  console.log('=========================================');
  
  try {
    const rdsClient = new RDSDataClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    // Para Aurora Serverless v2, pode precisar do ARN completo do cluster
    const fullClusterArn = `arn:aws:rds:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID}:cluster:${process.env.ENDPOINT_AURORA}`;
    
    const command = new ExecuteStatementCommand({
      resourceArn: fullClusterArn,
      secretArn: process.env.TOKEN_AURORA,
      sql: 'SELECT version() as db_version',
      database: 'postgres'
    });
    
    const result = await rdsClient.send(command);
    console.log(`✅ Aurora Serverless v2 conectado!`);
    console.log(`📊 Versão: ${JSON.stringify(result.records)}`);
    
  } catch (error) {
    console.log(`❌ Aurora Serverless v2 falhou: ${error.message}`);
  }
}

async function main() {
  await testAuroraDSQLFormats();
  await testAuroraServerlessV2();
  
  console.log('\n📋 RESUMO DOS TESTES');
  console.log('====================');
  console.log('Se algum teste passou, use esse formato no DatabaseManager!');
  console.log('Se todos falharam, pode ser:');
  console.log('1. 🔑 Credenciais AWS incorretas');
  console.log('2. 🚫 Permissions IAM insuficientes');
  console.log('3. 🌍 Aurora DSQL não disponível na região');
  console.log('4. 📍 Endpoint incorreto ou cluster não existe');
}

main().catch(console.error);
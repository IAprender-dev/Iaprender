const { RDSDataClient, ExecuteStatementCommand } = require('@aws-sdk/client-rds-data');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
require('dotenv').config();

async function debugAuroraConnectivity() {
  console.log('🔍 DIAGNÓSTICO COMPLETO AURORA DSQL');
  console.log('==================================');
  
  // 1. Verificar credenciais AWS
  console.log('\n1. 🔑 VERIFICANDO CREDENCIAIS AWS...');
  try {
    const stsClient = new STSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log(`✅ Account ID: ${identity.Account}`);
    console.log(`✅ User ARN: ${identity.Arn}`);
    console.log(`✅ User ID: ${identity.UserId}`);
    
    if (identity.Account !== process.env.AWS_ACCOUNT_ID) {
      console.log(`⚠️ AVISO: Account ID diferente no .env (${process.env.AWS_ACCOUNT_ID}) vs real (${identity.Account})`);
    }
    
  } catch (error) {
    console.log(`❌ Credenciais AWS inválidas: ${error.message}`);
    return;
  }
  
  // 2. Verificar variáveis de ambiente
  console.log('\n2. 📋 VERIFICANDO VARIÁVEIS DE AMBIENTE...');
  const requiredVars = [
    'ENDPOINT_AURORA',
    'TOKEN_AURORA',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_ACCOUNT_ID'
  ];
  
  let allVarsPresent = true;
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('TOKEN') || varName.includes('KEY') ? value.substring(0, 20) + '...' : value}`);
    } else {
      console.log(`❌ ${varName}: NÃO DEFINIDO`);
      allVarsPresent = false;
    }
  });
  
  if (!allVarsPresent) {
    console.log('❌ Variáveis obrigatórias faltando!');
    return;
  }
  
  // 3. Teste de conectividade básica RDS Data API
  console.log('\n3. 🔌 TESTANDO CONECTIVIDADE RDS DATA API...');
  const rdsClient = new RDSDataClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
  
  // 4. Tentar diferentes formatos de ARN
  console.log('\n4. 🧪 TESTANDO FORMATOS DE ARN...');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const accountId = process.env.AWS_ACCOUNT_ID;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  const formatsToTest = [
    {
      name: 'Endpoint direto',
      resourceArn: endpoint,
      database: 'postgres'
    },
    {
      name: 'Endpoint direto sem database',
      resourceArn: endpoint,
      database: undefined
    },
    {
      name: 'ARN DSQL completo',
      resourceArn: `arn:aws:dsql:${region}:${accountId}:cluster/${endpoint}`,
      database: 'postgres'
    },
    {
      name: 'ARN RDS completo',
      resourceArn: `arn:aws:rds:${region}:${accountId}:cluster:${endpoint}`,
      database: 'postgres'
    },
    {
      name: 'Apenas cluster ID',
      resourceArn: endpoint.split('.')[0],
      database: 'postgres'
    },
    {
      name: 'ARN DSQL com cluster ID',
      resourceArn: `arn:aws:dsql:${region}:${accountId}:cluster/${endpoint.split('.')[0]}`,
      database: 'postgres'
    }
  ];
  
  for (const format of formatsToTest) {
    console.log(`\n   🧪 Testando: ${format.name}`);
    console.log(`      ResourceArn: ${format.resourceArn}`);
    console.log(`      Database: ${format.database || 'undefined'}`);
    
    try {
      const params = {
        resourceArn: format.resourceArn,
        secretArn: token,
        sql: 'SELECT 1 as test'
      };
      
      if (format.database) {
        params.database = format.database;
      }
      
      const command = new ExecuteStatementCommand(params);
      const result = await rdsClient.send(command);
      
      console.log(`      ✅ SUCESSO! ${format.name} funcionou!`);
      console.log(`      📊 Resultado: ${JSON.stringify(result.records)}`);
      console.log(`      🎯 USE ESTE FORMATO NO CÓDIGO!`);
      
      return {
        success: true,
        format: format,
        result: result
      };
      
    } catch (error) {
      console.log(`      ❌ Falhou: ${error.message}`);
      if (error.name === 'ValidationException') {
        console.log(`      💡 Formato ARN inválido`);
      } else if (error.name === 'AccessDeniedException') {
        console.log(`      💡 Problema de permissões IAM`);
      } else if (error.name === 'BadRequestException') {
        console.log(`      💡 Cluster não existe ou indisponível`);
      }
    }
  }
  
  console.log('\n❌ NENHUM FORMATO FUNCIONOU!');
  console.log('\n🔍 POSSÍVEIS CAUSAS:');
  console.log('1. 🚫 Permissões IAM insuficientes para RDS Data API');
  console.log('2. 📍 Cluster Aurora DSQL não existe ou foi deletado');
  console.log('3. 🌍 Aurora DSQL não disponível na região us-east-1');
  console.log('4. 🔑 Secret ARN incorreto ou inacessível');
  console.log('5. 💤 Cluster Aurora em estado pausado/indisponível');
  
  console.log('\n📋 PRÓXIMOS PASSOS SUGERIDOS:');
  console.log('1. Verificar se o cluster existe no console AWS');
  console.log('2. Verificar policies IAM do usuário');
  console.log('3. Confirmar se Aurora DSQL está disponível na região');
  console.log('4. Testar com AWS CLI: aws rds-data execute-statement');
}

debugAuroraConnectivity().catch(console.error);
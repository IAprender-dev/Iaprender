/**
 * Script para testar quais authentication flows estão disponíveis
 * Testa diferentes flows para determinar configuração do Client App
 */

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  AdminInitiateAuthCommand
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET;

function calculateSecretHash(username, clientId, clientSecret) {
  const message = username + clientId;
  return crypto.createHmac('sha256', clientSecret).update(message).digest('base64');
}

async function testFlow(flowName, authFlow, useAdmin = false) {
  console.log(`\n🧪 Testando flow: ${flowName}`);
  console.log('='.repeat(50));
  
  try {
    const username = 'admin.cognito@iaprender.com.br';
    const password = 'AdminCognito123!';
    const secretHash = calculateSecretHash(username, CLIENT_ID, CLIENT_SECRET);
    
    let command;
    let commandType;
    
    if (useAdmin) {
      commandType = 'AdminInitiateAuth';
      command = new AdminInitiateAuthCommand({
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID,
        AuthFlow: authFlow,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: secretHash
        }
      });
    } else {
      commandType = 'InitiateAuth';
      command = new InitiateAuthCommand({
        ClientId: CLIENT_ID,
        AuthFlow: authFlow,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: secretHash
        }
      });
    }
    
    console.log(`📡 Executando ${commandType} com ${authFlow}...`);
    
    const response = await client.send(command);
    
    if (response.ChallengeName) {
      console.log(`✅ Flow ${flowName} FUNCIONANDO - Challenge: ${response.ChallengeName}`);
      return { working: true, challenge: response.ChallengeName };
    } else if (response.AuthenticationResult) {
      console.log(`✅ Flow ${flowName} FUNCIONANDO - Autenticação completa`);
      return { working: true, authenticated: true };
    } else {
      console.log(`⚠️  Flow ${flowName} - Resposta inesperada`);
      return { working: true, unknown: true };
    }
    
  } catch (error) {
    const errorType = error.name;
    const errorMessage = error.message;
    
    if (errorMessage.includes('flow not enabled')) {
      console.log(`❌ Flow ${flowName} NÃO HABILITADO`);
      return { working: false, reason: 'not_enabled' };
    } else if (errorMessage.includes('not supported')) {
      console.log(`❌ Flow ${flowName} NÃO SUPORTADO`);
      return { working: false, reason: 'not_supported' };
    } else if (errorMessage.includes('Incorrect username or password')) {
      console.log(`⚠️  Flow ${flowName} HABILITADO - Credenciais incorretas`);
      return { working: true, reason: 'wrong_credentials' };
    } else if (errorMessage.includes('User does not exist')) {
      console.log(`⚠️  Flow ${flowName} HABILITADO - Usuário não existe`);
      return { working: true, reason: 'user_not_found' };
    } else {
      console.log(`❓ Flow ${flowName} - Erro: ${errorType}: ${errorMessage}`);
      return { working: false, reason: 'unknown_error', error: errorMessage };
    }
  }
}

async function testAllFlows() {
  console.log('🔍 TESTANDO TODOS OS AUTHENTICATION FLOWS DISPONÍVEIS');
  console.log('='.repeat(60));
  
  const flows = [
    { name: 'USER_PASSWORD_AUTH', flow: 'USER_PASSWORD_AUTH', admin: false },
    { name: 'USER_SRP_AUTH', flow: 'USER_SRP_AUTH', admin: false },
    { name: 'CUSTOM_AUTH', flow: 'CUSTOM_AUTH', admin: false },
    { name: 'ADMIN_NO_SRP_AUTH (Admin)', flow: 'ADMIN_NO_SRP_AUTH', admin: true },
    { name: 'ADMIN_USER_PASSWORD_AUTH (Admin)', flow: 'ADMIN_USER_PASSWORD_AUTH', admin: true }
  ];
  
  const results = {};
  
  for (const flowConfig of flows) {
    const result = await testFlow(flowConfig.name, flowConfig.flow, flowConfig.admin);
    results[flowConfig.name] = result;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre testes
  }
  
  console.log('\n📊 RESUMO DOS RESULTADOS:');
  console.log('='.repeat(60));
  
  const workingFlows = [];
  const notWorkingFlows = [];
  
  for (const [flowName, result] of Object.entries(results)) {
    if (result.working) {
      workingFlows.push(flowName);
      console.log(`✅ ${flowName}: FUNCIONAL`);
      if (result.challenge) {
        console.log(`   - Challenge: ${result.challenge}`);
      }
      if (result.reason) {
        console.log(`   - Observação: ${result.reason}`);
      }
    } else {
      notWorkingFlows.push(flowName);
      console.log(`❌ ${flowName}: NÃO FUNCIONAL (${result.reason})`);
    }
  }
  
  console.log('\n🎯 RECOMENDAÇÕES:');
  console.log('='.repeat(60));
  
  if (workingFlows.length === 0) {
    console.log('❌ NENHUM FLOW FUNCIONAL ENCONTRADO');
    console.log('💡 Soluções:');
    console.log('1. Verificar configuração do Client App no AWS Console');
    console.log('2. Habilitar pelo menos um Authentication Flow');
    console.log('3. Verificar credenciais AWS');
  } else {
    console.log('✅ FLOWS FUNCIONAIS ENCONTRADOS:');
    workingFlows.forEach(flow => console.log(`   - ${flow}`));
    
    if (workingFlows.includes('USER_PASSWORD_AUTH')) {
      console.log('\n🚀 IDEAL: USER_PASSWORD_AUTH está funcional');
      console.log('   Pode usar autenticação direta email/senha');
    } else if (workingFlows.includes('USER_SRP_AUTH')) {
      console.log('\n🔄 ALTERNATIVA: USER_SRP_AUTH está funcional');
      console.log('   Pode usar SRP flow (mais complexo mas seguro)');
    } else if (workingFlows.includes('ADMIN_USER_PASSWORD_AUTH (Admin)')) {
      console.log('\n⚡ ALTERNATIVA: ADMIN_USER_PASSWORD_AUTH está funcional');
      console.log('   Pode usar AdminInitiateAuth no backend');
    }
  }
}

testAllFlows().catch(console.error);
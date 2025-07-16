/**
 * Teste de autenticação via interface web
 * Simula o fluxo que acontece no frontend
 */

import fetch from 'node-fetch';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || 'us-east-1_4jqF97H2X';
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID || '1ooqafj1v6bh3ff55t2ha56hn4';
const CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET || '155t6612puue69784rtel2hufgn36cv1e6vrjl2a5m59lc3va0k';

// Configuração AWS
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_COGNITO_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

function calculateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

async function testStep1_CognitoConfig() {
  console.log('\n🔍 PASSO 1: Testando /api/auth/cognito-config');
  console.log('==================================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/cognito-config`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Configuração obtida com sucesso:');
      console.log('- User Pool ID:', data.userPoolId);
      console.log('- Client ID:', data.clientId);
      console.log('- Domain:', data.domain);
      console.log('- Region:', data.region);
      
      // Verificar se é o correto
      if (data.userPoolId === USER_POOL_ID) {
        console.log('✅ User Pool ID correto');
      } else {
        console.log('❌ User Pool ID incorreto');
        console.log('  Esperado:', USER_POOL_ID);
        console.log('  Recebido:', data.userPoolId);
      }
      
      return data;
    } else {
      console.log('❌ Erro na configuração:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function testStep2_ClientSecret() {
  console.log('\n🔍 PASSO 2: Testando /api/auth/client-secret');
  console.log('==================================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/client-secret`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Client secret obtido com sucesso');
      console.log('- Length:', data.clientSecret ? data.clientSecret.length : 0);
      console.log('- Starts with:', data.clientSecret ? data.clientSecret.substring(0, 10) + '...' : 'N/A');
      
      // Verificar se é o correto
      if (data.clientSecret === CLIENT_SECRET) {
        console.log('✅ Client secret correto');
      } else {
        console.log('❌ Client secret incorreto');
      }
      
      return data.clientSecret;
    } else {
      console.log('❌ Erro no client secret:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function testStep3_DirectCognitoAuth() {
  console.log('\n🔍 PASSO 3: Testando autenticação direta AWS Cognito');
  console.log('==================================================');
  
  const username = 'teste.login';
  const password = 'TesteLogin123!';
  
  try {
    const secretHash = calculateSecretHash(username, CLIENT_ID, CLIENT_SECRET);
    
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    };

    console.log('🔐 Testando credenciais:');
    console.log('- Username:', username);
    console.log('- Password:', password);
    console.log('- SECRET_HASH:', secretHash.substring(0, 10) + '...');

    const result = await cognitoIdentityServiceProvider.initiateAuth(authParams).promise();
    
    if (result.AuthenticationResult) {
      console.log('✅ Autenticação AWS Cognito SUCESSO');
      
      // Decodificar ID token
      const idToken = result.AuthenticationResult.IdToken;
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      
      console.log('👤 Dados do usuário:');
      console.log('- Email:', payload.email);
      console.log('- Nome:', payload.name);
      console.log('- Grupos:', payload['cognito:groups']);
      console.log('- Sub:', payload.sub);
      
      return {
        success: true,
        tokens: result.AuthenticationResult,
        payload
      };
    } else {
      console.log('❌ Falha na autenticação AWS Cognito');
      return { success: false };
    }
    
  } catch (error) {
    console.log('❌ Erro na autenticação AWS Cognito:', error.message);
    return { success: false, error: error.message };
  }
}

async function testStep4_CreateInternalToken(userPayload) {
  console.log('\n🔍 PASSO 4: Testando criação de token interno');
  console.log('==================================================');
  
  const tokenData = {
    id: 1,
    email: userPayload.email,
    name: userPayload.name || userPayload.email,
    tipo_usuario: 'admin',
    empresa_id: 1,
    escola_id: null,
    cognito_sub: userPayload.sub,
    groups: userPayload['cognito:groups'] || []
  };
  
  console.log('📤 Enviando dados para criar token interno:');
  console.log(JSON.stringify(tokenData, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/create-internal-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Token interno criado com sucesso');
      console.log('- Token length:', data.token ? data.token.length : 0);
      console.log('- Token start:', data.token ? data.token.substring(0, 20) + '...' : 'N/A');
      return data.token;
    } else {
      console.log('❌ Erro ao criar token interno:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function testStep5_TestInternalToken(token) {
  console.log('\n🔍 PASSO 5: Testando token interno');
  console.log('==================================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Token interno válido');
      console.log('👤 Dados do usuário:', data.user);
      return true;
    } else {
      console.log('❌ Token interno inválido:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar token:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 TESTE COMPLETO DE AUTENTICAÇÃO WEB');
  console.log('====================================================');
  
  // Passo 1: Configuração Cognito
  const config = await testStep1_CognitoConfig();
  if (!config) {
    console.log('\n❌ FALHA NO PASSO 1 - Parando teste');
    return;
  }
  
  // Passo 2: Client Secret
  const clientSecret = await testStep2_ClientSecret();
  if (!clientSecret) {
    console.log('\n❌ FALHA NO PASSO 2 - Parando teste');
    return;
  }
  
  // Passo 3: Autenticação direta Cognito
  const authResult = await testStep3_DirectCognitoAuth();
  if (!authResult.success) {
    console.log('\n❌ FALHA NO PASSO 3 - Parando teste');
    return;
  }
  
  // Passo 4: Criar token interno
  const internalToken = await testStep4_CreateInternalToken(authResult.payload);
  if (!internalToken) {
    console.log('\n❌ FALHA NO PASSO 4 - Parando teste');
    return;
  }
  
  // Passo 5: Testar token interno
  const tokenValid = await testStep5_TestInternalToken(internalToken);
  
  console.log('\n🎯 RESULTADO FINAL:');
  console.log('====================================================');
  
  if (tokenValid) {
    console.log('✅ TODOS OS PASSOS FUNCIONARAM!');
    console.log('🎉 A autenticação está funcionando corretamente');
    console.log('\n📋 Fluxo de autenticação validado:');
    console.log('1. ✅ Configuração Cognito obtida');
    console.log('2. ✅ Client secret obtido');
    console.log('3. ✅ Autenticação AWS Cognito funcionando');
    console.log('4. ✅ Token interno criado');
    console.log('5. ✅ Token interno validado');
    
    console.log('\n🔑 CREDENCIAIS FUNCIONAIS:');
    console.log('Username: teste.login');
    console.log('Password: TesteLogin123!');
    console.log('Email: teste.login@iaprender.com.br');
    
  } else {
    console.log('❌ FALHA NO FLUXO DE AUTENTICAÇÃO');
    console.log('💡 Verifique os logs acima para identificar o problema');
  }
}

main().catch(console.error);
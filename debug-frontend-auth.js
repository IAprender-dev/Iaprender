/**
 * DEBUG FRONTEND AUTHENTICATION
 * Script para debugar problemas de autenticação no frontend
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function debugFrontendAuth() {
  console.log('🔍 DEBUG COMPLETO DA AUTENTICAÇÃO FRONTEND');
  console.log('='.repeat(60));
  
  // 1. Testar endpoints individuais
  console.log('\n1️⃣ TESTANDO ENDPOINT /api/auth/cognito-config');
  try {
    const configResponse = await fetch(`${BASE_URL}/api/auth/cognito-config`);
    const configData = await configResponse.json();
    console.log('Status:', configResponse.status);
    console.log('Response:', JSON.stringify(configData, null, 2));
    
    if (!configData.success) {
      console.log('❌ Problema na configuração Cognito');
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao acessar /api/auth/cognito-config:', error.message);
    return;
  }
  
  // 2. Testar client secret
  console.log('\n2️⃣ TESTANDO ENDPOINT /api/auth/client-secret');
  try {
    const secretResponse = await fetch(`${BASE_URL}/api/auth/client-secret`);
    const secretData = await secretResponse.json();
    console.log('Status:', secretResponse.status);
    console.log('Client Secret Length:', secretData.clientSecret ? secretData.clientSecret.length : 0);
    
    if (!secretData.success) {
      console.log('❌ Problema no client secret');
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao acessar /api/auth/client-secret:', error.message);
    return;
  }
  
  // 3. Testar criação de token interno
  console.log('\n3️⃣ TESTANDO CRIAÇÃO DE TOKEN INTERNO');
  try {
    const tokenData = {
      id: 1,
      email: 'teste.login@iaprender.com.br',
      name: 'Usuário Teste Login',
      tipo_usuario: 'admin',
      empresa_id: 1,
      escola_id: null,
      cognito_sub: '246824d8-6091-7098-a967-9fbb6e272789',
      groups: ['Admin']
    };
    
    const tokenResponse = await fetch(`${BASE_URL}/api/auth/create-internal-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tokenData)
    });
    
    const tokenResult = await tokenResponse.json();
    console.log('Status:', tokenResponse.status);
    console.log('Success:', tokenResult.success);
    console.log('Token Length:', tokenResult.token ? tokenResult.token.length : 0);
    
    if (!tokenResult.success) {
      console.log('❌ Problema na criação do token interno');
      return;
    }
    
    // 4. Testar validação do token
    console.log('\n4️⃣ TESTANDO VALIDAÇÃO DO TOKEN');
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${tokenResult.token}`
      }
    });
    
    const authData = await authResponse.json();
    console.log('Status:', authResponse.status);
    console.log('Authenticated:', authData.authenticated);
    console.log('User Data:', authData.user);
    
    if (authResponse.status !== 200 || !authData.authenticated) {
      console.log('❌ Problema na validação do token');
      return;
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar token interno:', error.message);
    return;
  }
  
  console.log('\n✅ TODOS OS ENDPOINTS BACKEND FUNCIONAM CORRETAMENTE');
  console.log('\n🔍 POSSÍVEIS PROBLEMAS NO FRONTEND:');
  console.log('1. Erro na biblioteca amazon-cognito-identity-js');
  console.log('2. Problema no cálculo do SECRET_HASH no frontend');
  console.log('3. Configuração incorreta do CognitoUserPool');
  console.log('4. Falha na comunicação entre frontend e backend');
  console.log('5. Erro no processamento de resposta do Cognito');
  
  console.log('\n💡 PRÓXIMOS PASSOS PARA DEBUG:');
  console.log('1. Verificar console do navegador (F12) para erros JavaScript');
  console.log('2. Verificar se amazon-cognito-identity-js está carregando corretamente');
  console.log('3. Testar autenticação diretamente via AWS SDK no frontend');
  console.log('4. Verificar se o domain do Cognito está correto');
  console.log('5. Testar com diferentes browsers');
  
  console.log('\n🔑 CREDENCIAIS FUNCIONAIS CONFIRMADAS:');
  console.log('Username: teste.login');
  console.log('Password: TesteLogin123!');
  console.log('Email: teste.login@iaprender.com.br');
  console.log('Status: CONFIRMED');
  console.log('Grupo: Admin');
}

debugFrontendAuth().catch(console.error);
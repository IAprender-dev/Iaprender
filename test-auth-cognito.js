/**
 * Teste de autenticação AWS Cognito
 * Verifica se o usuário consegue se autenticar corretamente
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const cognito = new AWS.CognitoIdentityServiceProvider();

async function testAuthentication(email, password) {
  console.log('🔐 Testando autenticação para:', email);
  
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;
  const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET;
  
  console.log('📋 Configurações:');
  console.log('- User Pool ID:', userPoolId);
  console.log('- Client ID:', clientId);
  console.log('- Client Secret:', clientSecret ? 'SET' : 'NOT SET');
  console.log('- Região:', process.env.AWS_REGION);
  
  try {
    // Calcular SECRET_HASH
    const secretHash = crypto.createHmac('sha256', clientSecret)
      .update(email + clientId)
      .digest('base64');
    
    console.log('🔐 SECRET_HASH calculado:', secretHash.substring(0, 10) + '...');
    
    // Testar com USER_PASSWORD_AUTH
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    };
    
    console.log('🔐 Tentando autenticação USER_PASSWORD_AUTH com SECRET_HASH...');
    const result = await cognito.initiateAuth(authParams).promise();
    
    console.log('✅ Autenticação bem-sucedida!');
    console.log('- AuthenticationResult:', result.AuthenticationResult ? 'Presente' : 'Ausente');
    console.log('- ChallengeParameters:', result.ChallengeParameters);
    console.log('- ChallengeName:', result.ChallengeName);
    
    if (result.AuthenticationResult) {
      console.log('🎫 Tokens recebidos:');
      console.log('- AccessToken:', result.AuthenticationResult.AccessToken ? 'Presente' : 'Ausente');
      console.log('- IdToken:', result.AuthenticationResult.IdToken ? 'Presente' : 'Ausente');
      console.log('- RefreshToken:', result.AuthenticationResult.RefreshToken ? 'Presente' : 'Ausente');
      console.log('- ExpiresIn:', result.AuthenticationResult.ExpiresIn);
      console.log('- TokenType:', result.AuthenticationResult.TokenType);
      
      // Decodificar ID Token para ver o payload
      if (result.AuthenticationResult.IdToken) {
        const idTokenPayload = JSON.parse(Buffer.from(result.AuthenticationResult.IdToken.split('.')[1], 'base64').toString());
        console.log('👤 Payload do ID Token:');
        console.log('- Sub:', idTokenPayload.sub);
        console.log('- Email:', idTokenPayload.email);
        console.log('- Name:', idTokenPayload.name);
        console.log('- Groups:', idTokenPayload['cognito:groups']);
        console.log('- Email verified:', idTokenPayload.email_verified);
      }
    }
    
    return { success: true, result };
    
  } catch (error) {
    console.error('❌ Falha na autenticação:', error);
    console.error('- Código:', error.code);
    console.error('- Mensagem:', error.message);
    
    // Verificar se é problema de configuração
    if (error.code === 'ResourceNotFoundException') {
      console.log('💡 Solução: Verifique se o User Pool ID está correto');
    } else if (error.code === 'InvalidParameterException') {
      console.log('💡 Solução: Verifique se o Client ID está correto');
    } else if (error.code === 'NotAuthorizedException') {
      console.log('💡 Solução: Verifique se o email/senha estão corretos');
    } else if (error.code === 'UserNotFoundException') {
      console.log('💡 Solução: Usuário não existe no User Pool');
    } else if (error.code === 'UserNotConfirmedException') {
      console.log('💡 Solução: Usuário não foi confirmado');
    }
    
    return { success: false, error };
  }
}

async function testUserPoolClient() {
  console.log('🔍 Testando configuração do User Pool Client...');
  
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;
  
  try {
    const client = await cognito.describeUserPoolClient({
      UserPoolId: userPoolId,
      ClientId: clientId
    }).promise();
    
    console.log('✅ Client configurado:');
    console.log('- ClientName:', client.UserPoolClient.ClientName);
    console.log('- ExplicitAuthFlows:', client.UserPoolClient.ExplicitAuthFlows);
    console.log('- GenerateSecret:', client.UserPoolClient.GenerateSecret);
    console.log('- RefreshTokenValidity:', client.UserPoolClient.RefreshTokenValidity);
    console.log('- ReadAttributes:', client.UserPoolClient.ReadAttributes);
    console.log('- WriteAttributes:', client.UserPoolClient.WriteAttributes);
    
    // Verificar se USER_PASSWORD_AUTH está habilitado
    const authFlows = client.UserPoolClient.ExplicitAuthFlows || [];
    const hasUserPasswordAuth = authFlows.includes('USER_PASSWORD_AUTH');
    
    console.log('🔐 USER_PASSWORD_AUTH habilitado:', hasUserPasswordAuth);
    
    if (!hasUserPasswordAuth) {
      console.log('❌ USER_PASSWORD_AUTH não está habilitado neste client');
      console.log('💡 Solução: Habilite USER_PASSWORD_AUTH no App Client do Cognito');
    }
    
    return { success: true, client: client.UserPoolClient };
    
  } catch (error) {
    console.error('❌ Erro ao verificar client:', error);
    return { success: false, error };
  }
}

// Executar testes
async function main() {
  console.log('🚀 Iniciando testes de autenticação AWS Cognito...\n');
  
  // Testar configuração do client
  await testUserPoolClient();
  
  console.log('\n' + '='.repeat(60));
  
  // Testar autenticação com usuário específico
  const email = 'esdrasnerideoliveira@gmail.com';
  const password = 'SuaSenhaAqui'; // Você precisa fornecer a senha real
  
  console.log('\n🔐 Para testar a autenticação, execute:');
  console.log('node test-auth-cognito.js email@exemplo.com senha123');
  
  // Se forneceu argumentos, testar autenticação
  if (process.argv.length >= 4) {
    const testEmail = process.argv[2];
    const testPassword = process.argv[3];
    
    console.log('\n' + '='.repeat(60));
    await testAuthentication(testEmail, testPassword);
  }
}

main().catch(console.error);
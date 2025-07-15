/**
 * Teste direto com AWS SDK Node.js
 * Verifica se o problema é na configuração do Client App
 */

import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand 
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente AWS
const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configuração do Cognito
const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET;

console.log('🔍 Configuração AWS Cognito:');
console.log('- User Pool ID:', USER_POOL_ID);
console.log('- Client ID:', CLIENT_ID);
console.log('- Client Secret:', CLIENT_SECRET ? 'SET' : 'NOT SET');

// Função para calcular SECRET_HASH
function calculateSecretHash(username, clientId, clientSecret) {
  const message = username + clientId;
  return crypto.createHmac('sha256', clientSecret).update(message).digest('base64');
}

// Teste de autenticação
async function testAuth(username, password) {
  try {
    console.log('\n🔐 Testando autenticação para:', username);
    
    const secretHash = calculateSecretHash(username, CLIENT_ID, CLIENT_SECRET);
    console.log('🔐 SECRET_HASH:', secretHash.substring(0, 10) + '...');
    
    console.log('🔍 Tentando com ADMIN_NO_SRP_AUTH flow...');
    
    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    const response = await client.send(command);
    
    console.log('✅ Resposta do Cognito:', JSON.stringify(response, null, 2));
    
    // Se chegou aqui, a autenticação foi bem sucedida
    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.log('🔄 Nova senha necessária - fluxo correto para usuário FORCE_CHANGE_PASSWORD');
      return { success: true, challenge: 'NEW_PASSWORD_REQUIRED', session: response.Session };
    } else if (response.AuthenticationResult) {
      console.log('✅ Autenticação completa - usuário CONFIRMED');
      return { success: true, tokens: response.AuthenticationResult };
    }
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.name);
    console.error('❌ Mensagem:', error.message);
    console.error('❌ Código:', error.__type);
    
    if (error.name === 'NotAuthorizedException') {
      console.log('💡 Possíveis causas:');
      console.log('1. Cliente não tem USER_PASSWORD_AUTH habilitado');
      console.log('2. Senha incorreta');
      console.log('3. Usuário não existe');
      console.log('4. SECRET_HASH calculado incorretamente');
    }
    
    return { success: false, error: error.message };
  }
}

// Executar teste
async function main() {
  const username = 'admin@gmail.com';
  const password = 'NovaSenh123!';
  
  const result = await testAuth(username, password);
  
  if (result.success) {
    console.log('\n✅ Teste bem-sucedido!');
    if (result.challenge) {
      console.log('🔄 Desafio:', result.challenge);
    }
  } else {
    console.log('\n❌ Teste falhou:', result.error);
  }
}

main().catch(console.error);
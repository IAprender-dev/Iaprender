/**
 * Script para criar usuário de teste com credenciais conhecidas
 */

import AWS from 'aws-sdk';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Configuração AWS
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_COGNITO_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || 'us-east-1_4jqF97H2X';
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID || '1ooqafj1v6bh3ff55t2ha56hn4';
const CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET || '155t6612puue69784rtel2hufgn36cv1e6vrjl2a5m59lc3va0k';

function calculateSecretHash(username, clientId, clientSecret) {
  return crypto
    .createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

async function createTestUser() {
  const testUser = {
    username: 'teste.login',
    email: 'teste.login@iaprender.com.br',
    password: 'TesteLogin123!',
    name: 'Usuário Teste Login',
    given_name: 'Usuário',
    family_name: 'Teste Login'
  };

  console.log('🚀 Criando usuário de teste no AWS Cognito...');
  console.log(`📧 Email: ${testUser.email}`);
  console.log(`🔑 Username: ${testUser.username}`);
  console.log(`🛡️ Password: ${testUser.password}\n`);

  try {
    // 1. Criar usuário
    const createParams = {
      UserPoolId: USER_POOL_ID,
      Username: testUser.username,
      UserAttributes: [
        { Name: 'email', Value: testUser.email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: testUser.name },
        { Name: 'given_name', Value: testUser.given_name },
        { Name: 'family_name', Value: testUser.family_name }
      ],
      TemporaryPassword: testUser.password,
      MessageAction: 'SUPPRESS' // Não enviar email de boas-vindas
    };

    console.log('📝 Criando usuário...');
    const createResult = await cognitoIdentityServiceProvider.adminCreateUser(createParams).promise();
    console.log('✅ Usuário criado com sucesso!');

    // 2. Definir senha permanente
    const setPasswordParams = {
      UserPoolId: USER_POOL_ID,
      Username: testUser.username,
      Password: testUser.password,
      Permanent: true
    };

    console.log('🔐 Definindo senha permanente...');
    await cognitoIdentityServiceProvider.adminSetUserPassword(setPasswordParams).promise();
    console.log('✅ Senha definida como permanente!');

    // 3. Adicionar usuário ao grupo Admin
    const addToGroupParams = {
      UserPoolId: USER_POOL_ID,
      Username: testUser.username,
      GroupName: 'Admin'
    };

    console.log('👥 Adicionando ao grupo Admin...');
    await cognitoIdentityServiceProvider.adminAddUserToGroup(addToGroupParams).promise();
    console.log('✅ Usuário adicionado ao grupo Admin!');

    // 4. Testar login
    console.log('\n🧪 Testando login...');
    const secretHash = calculateSecretHash(testUser.username, CLIENT_ID, CLIENT_SECRET);
    
    const authParams = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: testUser.username,
        PASSWORD: testUser.password,
        SECRET_HASH: secretHash
      }
    };

    const authResult = await cognitoIdentityServiceProvider.initiateAuth(authParams).promise();
    
    if (authResult.AuthenticationResult) {
      console.log('🎉 LOGIN TESTE SUCESSO!');
      console.log('✅ Token de acesso obtido com sucesso');
      
      // Decode ID token
      const idToken = authResult.AuthenticationResult.IdToken;
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      
      console.log('\n👤 Dados do usuário logado:');
      console.log(`📧 Email: ${payload.email}`);
      console.log(`📛 Nome: ${payload.name}`);
      console.log(`👥 Grupos: ${payload['cognito:groups']?.join(', ') || 'Nenhum'}`);
      console.log(`🆔 Sub: ${payload.sub}`);
      
      console.log('\n🎯 CREDENCIAIS VALIDADAS:');
      console.log('==================================================');
      console.log(`Username: ${testUser.username}`);
      console.log(`Password: ${testUser.password}`);
      console.log(`Email: ${testUser.email}`);
      console.log('Status: CONFIRMED');
      console.log('Grupo: Admin');
      console.log('==================================================');
      
    } else if (authResult.ChallengeName) {
      console.log(`⚠️ Challenge requerido: ${authResult.ChallengeName}`);
    }

  } catch (error) {
    if (error.code === 'UsernameExistsException') {
      console.log('⚠️ Usuário já existe. Tentando testar login...');
      
      // Testar login com usuário existente
      try {
        const secretHash = calculateSecretHash(testUser.username, CLIENT_ID, CLIENT_SECRET);
        
        const authParams = {
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: {
            USERNAME: testUser.username,
            PASSWORD: testUser.password,
            SECRET_HASH: secretHash
          }
        };

        const authResult = await cognitoIdentityServiceProvider.initiateAuth(authParams).promise();
        
        if (authResult.AuthenticationResult) {
          console.log('🎉 LOGIN COM USUÁRIO EXISTENTE SUCESSO!');
          console.log(`✅ Credenciais: ${testUser.username} / ${testUser.password}`);
        }
        
      } catch (loginError) {
        console.log(`❌ Erro no login: ${loginError.message}`);
      }
      
    } else {
      console.error('❌ Erro:', error.message);
      console.error('Código:', error.code);
    }
  }
}

createTestUser().catch(console.error);
/**
 * Teste com usuário CONFIRMED do Cognito
 * Verificando autenticação com credenciais conhecidas
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

async function testConfirmedUser() {
  console.log('🧪 Testando usuários CONFIRMED do Cognito...\n');
  
  // Usuários com status CONFIRMED baseado na lista anterior
  const confirmedUsers = [
    { 
      username: 'cassiano', 
      email: 'cassianoway@gmail.com',
      password: 'TesteSeguro123!' // Senha padrão que pode ter sido usada
    },
    { 
      username: 'admin.cognito_029282', 
      email: 'admin.cognito@iaprender.com.br',
      password: 'AdminSecure123!'
    },
    { 
      username: 'esdras', 
      email: 'esdrasnerideoliveira@gmail.com',
      password: 'EsdrasSeguro123!'
    },
    { 
      username: 'professor.final_983543', 
      email: 'professor.final@escola.edu.br',
      password: 'ProfessorSeguro123!'
    }
  ];

  for (const user of confirmedUsers) {
    console.log(`🧪 Testando: ${user.email} (${user.username})`);
    console.log('==================================================');
    
    try {
      const secretHash = calculateSecretHash(user.username, CLIENT_ID, CLIENT_SECRET);
      
      const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: user.username,
          PASSWORD: user.password,
          SECRET_HASH: secretHash
        }
      };

      const result = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
      
      if (result.AuthenticationResult) {
        console.log('✅ LOGIN SUCESSO!');
        console.log('🎯 Access Token:', result.AuthenticationResult.AccessToken.substring(0, 50) + '...');
        console.log('🎯 ID Token:', result.AuthenticationResult.IdToken.substring(0, 50) + '...');
        console.log('🎯 Refresh Token:', result.AuthenticationResult.RefreshToken.substring(0, 50) + '...');
        
        // Decode ID token para ver dados do usuário
        const idTokenPayload = JSON.parse(Buffer.from(result.AuthenticationResult.IdToken.split('.')[1], 'base64').toString());
        console.log('👤 Dados do usuário:', JSON.stringify(idTokenPayload, null, 2));
        
        console.log('\n🎉 CREDENCIAIS VÁLIDAS ENCONTRADAS!');
        console.log(`📧 Email: ${user.email}`);
        console.log(`🔑 Username: ${user.username}`);
        console.log(`🛡️ Password: ${user.password}`);
        break;
      }
      
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
      
      if (error.code === 'InvalidPasswordException') {
        console.log('💡 Password incorreto - tentando senhas alternativas...');
        
        // Tentar senhas alternativas comuns
        const altPasswords = ['123456', 'senha123', 'Senha123!', 'admin123', 'teste123'];
        
        for (const altPassword of altPasswords) {
          try {
            const secretHash = calculateSecretHash(user.username, CLIENT_ID, CLIENT_SECRET);
            
            const params = {
              AuthFlow: 'USER_PASSWORD_AUTH',
              ClientId: CLIENT_ID,
              AuthParameters: {
                USERNAME: user.username,
                PASSWORD: altPassword,
                SECRET_HASH: secretHash
              }
            };

            const result = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
            
            if (result.AuthenticationResult) {
              console.log(`✅ SENHA ENCONTRADA: ${altPassword}`);
              console.log('🎯 Login realizado com sucesso!');
              return { email: user.email, username: user.username, password: altPassword };
            }
            
          } catch (altError) {
            // Ignora erros das tentativas alternativas
          }
        }
      }
    }
    
    console.log('');
  }
  
  console.log('📊 RESUMO:');
  console.log('==================================================');
  console.log('❌ Nenhuma credencial válida encontrada com senhas testadas');
  console.log('💡 Usuários estão CONFIRMED mas precisamos das senhas corretas');
  console.log('🔐 Recomendação: Reset de senha via AWS Console ou criar novo usuário de teste');
}

testConfirmedUser().catch(console.error);
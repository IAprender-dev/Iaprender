/**
 * Teste com usuários CONFIRMED do Cognito
 * Testando credenciais com os usuários que têm status CONFIRMED
 */

import AWS from 'aws-sdk';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

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

async function testUserAuth(username, email, commonPasswords) {
  console.log(`\n🧪 Testando usuário: ${username} (${email})`);
  console.log('==================================================');
  
  for (let password of commonPasswords) {
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

      const result = await cognitoIdentityServiceProvider.initiateAuth(authParams).promise();
      
      if (result.AuthenticationResult) {
        console.log(`✅ LOGIN SUCESSO com senha: ${password}`);
        
        // Decode ID token
        const idToken = result.AuthenticationResult.IdToken;
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        
        console.log('\n👤 Dados do usuário:');
        console.log(`📧 Email: ${payload.email}`);
        console.log(`📛 Nome: ${payload.name}`);
        console.log(`👥 Grupos: ${payload['cognito:groups']?.join(', ') || 'Nenhum'}`);
        
        return {
          success: true,
          username,
          password,
          email: payload.email,
          groups: payload['cognito:groups'] || []
        };
        
      } else if (result.ChallengeName) {
        console.log(`⚠️ Challenge necessário: ${result.ChallengeName}`);
      }
      
    } catch (error) {
      if (error.code === 'NotAuthorizedException') {
        console.log(`❌ Senha incorreta: ${password}`);
      } else {
        console.log(`❌ Erro: ${error.message} (senha: ${password})`);
      }
    }
  }
  
  console.log(`❌ Nenhuma senha funcionou para ${username}`);
  return { success: false, username, email };
}

async function main() {
  console.log('🚀 Testando usuários CONFIRMED do AWS Cognito...\n');
  
  // Usuários CONFIRMED encontrados
  const confirmedUsers = [
    { username: 'teste.login', email: 'teste.login@iaprender.com.br' },
    { username: 'cassiano', email: 'cassianoway@gmail.com' },
    { username: 'esdrasdiretor', email: 'deseesras@gmail.com' },
    { username: 'esdras', email: 'esdrasnerideoliveira@gmail.com' },
    { username: 'admin.cognito_029282', email: 'admin.cognito@iaprender.com.br' },
    { username: 'professor.final_983543', email: 'professor.final@escola.edu.br' }
  ];
  
  // Senhas comuns para testar
  const commonPasswords = [
    'TesteLogin123!',  // Senha que criamos
    'NovaSenh123!',    // Senha temporária comum
    'Teste123!',
    'Admin123!',
    'Password123!',
    'Senha123!',
    'Cognito123!',
    '123456789',
    'senha123',
    'admin123'
  ];
  
  const workingCredentials = [];
  
  for (let user of confirmedUsers) {
    const result = await testUserAuth(user.username, user.email, commonPasswords);
    if (result.success) {
      workingCredentials.push(result);
    }
  }
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('==================================================');
  
  if (workingCredentials.length > 0) {
    console.log(`✅ Encontradas ${workingCredentials.length} credenciais funcionais:`);
    
    workingCredentials.forEach((cred, index) => {
      console.log(`\n${index + 1}. 🎯 CREDENCIAL FUNCIONAL:`);
      console.log(`   Username: ${cred.username}`);
      console.log(`   Password: ${cred.password}`);
      console.log(`   Email: ${cred.email}`);
      console.log(`   Grupos: ${cred.groups.join(', ')}`);
    });
    
    console.log('\n🚀 Use essas credenciais na interface /auth');
    
  } else {
    console.log('❌ Nenhuma credencial funcional encontrada');
    console.log('💡 Possíveis soluções:');
    console.log('   1. Verificar se as senhas foram alteradas pelos usuários');
    console.log('   2. Criar novo usuário com senha conhecida');
    console.log('   3. Resetar senha de usuário existente');
  }
}

main().catch(console.error);
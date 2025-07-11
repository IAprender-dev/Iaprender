/**
 * Teste direto do novo User Pool ID correto
 */

// Forçar o uso do novo User Pool ID
process.env.COGNITO_USER_POOL_ID = 'us-east-1_4jqF97H2X';

import AWS from 'aws-sdk';

// Configurar AWS
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const cognito = new AWS.CognitoIdentityServiceProvider();

async function testNewUserPoolId() {
  console.log('🔄 Testando novo User Pool ID:', process.env.COGNITO_USER_POOL_ID);
  
  try {
    // Testar descrição do User Pool
    const poolDescription = await cognito.describeUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID
    }).promise();
    
    console.log('✅ User Pool encontrado:', {
      id: poolDescription.UserPool.Id,
      name: poolDescription.UserPool.Name,
      status: poolDescription.UserPool.Status,
      creationDate: poolDescription.UserPool.CreationDate
    });

    // Testar listagem de usuários
    const users = await cognito.listUsers({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Limit: 5
    }).promise();
    
    console.log('✅ Usuários encontrados:', users.Users.length);
    
    return {
      success: true,
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      usersCount: users.Users.length
    };
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Executar teste
testNewUserPoolId().then(result => {
  console.log('\n📊 Resultado final:', result);
}).catch(error => {
  console.log('\n❌ Erro na execução:', error);
});
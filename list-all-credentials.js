/**
 * Lista todas as credenciais de acesso configuradas no sistema
 */

import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

console.log('🔐 LISTA COMPLETA DE CREDENCIAIS DO SISTEMA');
console.log('='.repeat(60));

console.log('\n📋 1. VARIÁVEIS DE AMBIENTE AWS COGNITO:');
console.log('- AWS_COGNITO_USER_POOL_ID:', process.env.AWS_COGNITO_USER_POOL_ID || 'NÃO DEFINIDO');
console.log('- AWS_COGNITO_CLIENT_ID:', process.env.AWS_COGNITO_CLIENT_ID || 'NÃO DEFINIDO');
console.log('- AWS_COGNITO_CLIENT_SECRET:', process.env.AWS_COGNITO_CLIENT_SECRET ? 'DEFINIDO (' + process.env.AWS_COGNITO_CLIENT_SECRET.length + ' chars)' : 'NÃO DEFINIDO');
console.log('- AWS_COGNITO_DOMAIN:', process.env.AWS_COGNITO_DOMAIN || 'NÃO DEFINIDO');
console.log('- AWS_COGNITO_REDIRECT_URI:', process.env.AWS_COGNITO_REDIRECT_URI || 'NÃO DEFINIDO');
console.log('- AWS_COGNITO_REGION:', process.env.AWS_COGNITO_REGION || 'NÃO DEFINIDO');

console.log('\n📋 2. CREDENCIAIS AWS:');
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'DEFINIDO (' + process.env.AWS_ACCESS_KEY_ID.length + ' chars)' : 'NÃO DEFINIDO');
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'DEFINIDO (' + process.env.AWS_SECRET_ACCESS_KEY.length + ' chars)' : 'NÃO DEFINIDO');
console.log('- AWS_REGION:', process.env.AWS_REGION || 'NÃO DEFINIDO');

console.log('\n📋 3. CREDENCIAIS JWT:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET || 'test_secret_key_iaprender_2025 (padrão)');

console.log('\n📋 4. CREDENCIAIS DE BANCO DE DADOS:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINIDO' : 'NÃO DEFINIDO');

console.log('\n🧪 5. CREDENCIAIS DE TESTE FUNCIONAIS:');
console.log('- Username: teste.login');
console.log('- Password: TesteLogin123!');
console.log('- Email: teste.login@iaprender.com.br');
console.log('- Status: CONFIRMED');
console.log('- Grupo: Admin');

console.log('\n🔍 6. CONFIGURAÇÃO COGNITO HARDCODED:');
console.log('- User Pool ID: us-east-1_4jqF97H2X');
console.log('- Client ID: 1ooqafj1v6bh3ff55t2ha56hn4');
console.log('- Client Secret: 155t6612puue69784rtel2hufgn36cv1e6vrjl2a5m59lc3va0k');
console.log('- Domain: https://us-east-14jqf97h2x.auth.us-east-1.amazoncognito.com');

console.log('\n📊 7. OUTROS USUÁRIOS COGNITO DISPONÍVEIS:');

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function listUsers() {
  try {
    const params = {
      UserPoolId: 'us-east-1_4jqF97H2X',
      Limit: 20
    };

    const result = await cognitoIdentityServiceProvider.listUsers(params).promise();
    
    const confirmedUsers = result.Users?.filter(user => user.UserStatus === 'CONFIRMED') || [];
    const forceChangeUsers = result.Users?.filter(user => user.UserStatus === 'FORCE_CHANGE_PASSWORD') || [];
    
    console.log(`\n✅ USUÁRIOS CONFIRMED (${confirmedUsers.length}):`);
    confirmedUsers.forEach((user, index) => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const name = user.Attributes?.find(attr => attr.Name === 'name')?.Value;
      console.log(`${index + 1}. Username: ${user.Username}`);
      console.log(`   Email: ${email}`);
      console.log(`   Nome: ${name}`);
      console.log(`   Status: ${user.UserStatus}`);
      console.log('');
    });
    
    console.log(`⚠️ USUÁRIOS FORCE_CHANGE_PASSWORD (${forceChangeUsers.length}):`);
    forceChangeUsers.forEach((user, index) => {
      const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
      const name = user.Attributes?.find(attr => attr.Name === 'name')?.Value;
      console.log(`${index + 1}. Username: ${user.Username}`);
      console.log(`   Email: ${email}`);
      console.log(`   Nome: ${name}`);
      console.log(`   Status: ${user.UserStatus} (precisa trocar senha)`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Erro ao listar usuários:', error.message);
  }
}

listUsers().then(() => {
  console.log('\n🎯 RESUMO PARA TESTE:');
  console.log('='.repeat(60));
  console.log('✅ Use estas credenciais FUNCIONAIS na interface /auth:');
  console.log('Username: teste.login');
  console.log('Password: TesteLogin123!');
  console.log('');
  console.log('💡 Essas credenciais foram testadas diretamente no AWS Cognito e funcionam.');
  console.log('💡 Se não funcionar na interface, o problema está no código frontend/backend.');
});
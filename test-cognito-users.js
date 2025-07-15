/**
 * Script para listar usuários do AWS Cognito
 * Verifica se o usuário existe e está ativo
 */

import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const cognito = new AWS.CognitoIdentityServiceProvider();

async function listCognitoUsers() {
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  
  console.log('🔍 Listando usuários do AWS Cognito...');
  console.log('User Pool ID:', userPoolId);
  console.log('Região:', process.env.AWS_REGION || 'us-east-1');
  
  try {
    // Listar todos os usuários
    const users = await cognito.listUsers({
      UserPoolId: userPoolId,
      Limit: 60 // Máximo da API
    }).promise();
    
    console.log(`\n✅ Encontrados ${users.Users.length} usuários no Cognito:\n`);
    
    users.Users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.Username}`);
      console.log(`   📧 Email: ${user.Attributes.find(attr => attr.Name === 'email')?.Value || 'N/A'}`);
      console.log(`   📛 Nome: ${user.Attributes.find(attr => attr.Name === 'name')?.Value || 'N/A'}`);
      console.log(`   🔐 Status: ${user.UserStatus}`);
      console.log(`   ✅ Habilitado: ${user.Enabled}`);
      console.log(`   📅 Criado: ${user.UserCreateDate}`);
      console.log(`   🔄 Última modificação: ${user.UserLastModifiedDate}`);
      
      // Verificar se tem grupos
      const groups = user.Attributes.find(attr => attr.Name === 'custom:groups')?.Value;
      if (groups) {
        console.log(`   👥 Grupos: ${groups}`);
      }
      
      console.log('');
    });
    
    return users.Users;
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    
    if (error.code === 'AccessDenied') {
      console.log('\n💡 Solução: Adicione a permissão "cognito-idp:ListUsers" ao usuário AWS');
    } else if (error.code === 'ResourceNotFoundException') {
      console.log('\n💡 Solução: Verifique se o User Pool ID está correto');
    }
    
    return [];
  }
}

async function checkSpecificUser(email) {
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  
  console.log(`🔍 Verificando usuário específico: ${email}`);
  
  try {
    const user = await cognito.adminGetUser({
      UserPoolId: userPoolId,
      Username: email
    }).promise();
    
    console.log(`\n✅ Usuário encontrado: ${email}`);
    console.log(`   🔐 Status: ${user.UserStatus}`);
    console.log(`   ✅ Habilitado: ${user.Enabled}`);
    console.log(`   📅 Criado: ${user.UserCreateDate}`);
    console.log(`   🔄 Última modificação: ${user.UserLastModifiedDate}`);
    
    // Mostrar atributos
    console.log('\n📋 Atributos:');
    user.UserAttributes.forEach(attr => {
      console.log(`   ${attr.Name}: ${attr.Value}`);
    });
    
    return user;
    
  } catch (error) {
    console.error(`❌ Erro ao verificar usuário ${email}:`, error);
    
    if (error.code === 'UserNotFoundException') {
      console.log(`\n💡 Usuário ${email} não existe no Cognito`);
    } else if (error.code === 'AccessDenied') {
      console.log('\n💡 Solução: Adicione a permissão "cognito-idp:AdminGetUser" ao usuário AWS');
    }
    
    return null;
  }
}

async function listGroups() {
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  
  console.log('🔍 Listando grupos do User Pool...');
  
  try {
    const groups = await cognito.listGroups({
      UserPoolId: userPoolId,
      Limit: 60
    }).promise();
    
    console.log(`\n✅ Encontrados ${groups.Groups.length} grupos:\n`);
    
    groups.Groups.forEach((group, index) => {
      console.log(`${index + 1}. 👥 ${group.GroupName}`);
      console.log(`   📝 Descrição: ${group.Description || 'N/A'}`);
      console.log(`   📊 Precedência: ${group.Precedence || 'N/A'}`);
      console.log(`   📅 Criado: ${group.CreationDate}`);
      console.log('');
    });
    
    return groups.Groups;
    
  } catch (error) {
    console.error('❌ Erro ao listar grupos:', error);
    return [];
  }
}

// Executar testes
async function main() {
  console.log('🚀 Iniciando verificação do AWS Cognito...\n');
  
  // Listar todos os usuários
  const users = await listCognitoUsers();
  
  // Listar grupos
  await listGroups();
  
  // Verificar usuário específico (se existir)
  if (users.length > 0) {
    const firstUser = users[0];
    const email = firstUser.Attributes.find(attr => attr.Name === 'email')?.Value;
    
    if (email) {
      console.log('\n' + '='.repeat(50));
      await checkSpecificUser(email);
    }
  }
  
  console.log('\n🔍 Para verificar um usuário específico, execute:');
  console.log('node test-cognito-users.js usuario@exemplo.com');
}

// Permitir verificação de usuário específico via argumentos
const specificUser = process.argv[2];
if (specificUser) {
  checkSpecificUser(specificUser);
} else {
  main();
}
#!/usr/bin/env node

/**
 * Script para verificar configuração AWS Cognito das secrets
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Verificando configuração AWS Cognito das secrets...\n');

const config = {
  'COGNITO_USER_POOL_ID': process.env.COGNITO_USER_POOL_ID,
  'COGNITO_CLIENT_ID': process.env.COGNITO_CLIENT_ID,
  'COGNITO_CLIENT_SECRET': process.env.COGNITO_CLIENT_SECRET,
  'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
  'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
  'AWS_REGION': process.env.AWS_REGION,
  'COGNITO_DOMAIN': process.env.COGNITO_DOMAIN
};

console.log('📋 Configurações detectadas:');
Object.entries(config).forEach(([key, value]) => {
  if (value) {
    if (key.includes('SECRET') || key.includes('KEY')) {
      console.log(`   ✅ ${key}: ${value.substring(0, 4)}...${value.substring(value.length - 4)} (${value.length} chars)`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  } else {
    console.log(`   ❌ ${key}: NÃO CONFIGURADO`);
  }
});

console.log('\n🎯 Comparação com erro anterior:');
console.log(`   Erro anterior usava: us-east-1_SduwfXm8p`);
console.log(`   Secret configurada:  ${config.COGNITO_USER_POOL_ID}`);

if (config.COGNITO_USER_POOL_ID === 'us-east-1_SduwfXm8p') {
  console.log('   ⚠️  MESMO User Pool - problema são as permissões IAM');
} else {
  console.log('   ✅ User Pool diferente - vamos testar com o correto');
}

console.log('\n📝 Próximos passos:');
if (config.COGNITO_USER_POOL_ID && config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY) {
  console.log('   1. Todas as credenciais estão configuradas');
  console.log('   2. Testando conectividade com User Pool correto...');
  
  // Testar conectividade básica
  try {
    const { CognitoIdentityProviderClient, DescribeUserPoolCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    const client = new CognitoIdentityProviderClient({
      region: config.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const command = new DescribeUserPoolCommand({
      UserPoolId: config.COGNITO_USER_POOL_ID
    });
    
    const response = await client.send(command);
    console.log(`   ✅ User Pool encontrado: ${response.UserPool?.Name}`);
    console.log(`   📊 Status: ${response.UserPool?.Status}`);
    console.log(`   📅 Criado: ${new Date(response.UserPool?.CreationDate).toLocaleDateString('pt-BR')}`);
    
  } catch (error) {
    console.log(`   ❌ Erro ao acessar User Pool: ${error.message}`);
    
    if (error.message.includes('not authorized')) {
      console.log('\n🔧 SOLUÇÃO: Adicionar permissões IAM para o usuário UsuarioBedrock:');
      console.log('   - cognito-idp:DescribeUserPool');
      console.log('   - cognito-idp:ListUsers');
      console.log('   - cognito-idp:AdminListGroupsForUser');
      console.log('   - cognito-idp:ListGroups');
    }
  }
} else {
  console.log('   ❌ Credenciais incompletas nas secrets');
}

console.log('\n✨ Verificação concluída');
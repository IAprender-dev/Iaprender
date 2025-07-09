#!/usr/bin/env node

/**
 * Script para configurar permissões AWS Cognito
 * Gera comandos AWS CLI para adicionar permissões necessárias
 */

console.log('🔧 Setup de Permissões AWS Cognito\n');

const userPoolId = 'us-east-1_SduwfXm8p';
const accountId = '762723916379';
const region = 'us-east-1';
const userName = 'UsuarioBedrock';

console.log('📋 Informações detectadas:');
console.log(`   User Pool ID: ${userPoolId}`);
console.log(`   Account ID: ${accountId}`);
console.log(`   Região: ${region}`);
console.log(`   Usuário IAM: ${userName}`);

console.log('\n📝 Política IAM necessária (salvar como cognito-policy.json):');

const policy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CognitoUserPoolAccess",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:DescribeUserPool",
        "cognito-idp:ListUsers",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:ListGroups",
        "cognito-idp:GetGroup",
        "cognito-idp:ListUsersInGroup"
      ],
      "Resource": [
        `arn:aws:cognito-idp:${region}:${accountId}:userpool/${userPoolId}`
      ]
    }
  ]
};

console.log(JSON.stringify(policy, null, 2));

console.log('\n🚀 Comandos AWS CLI para executar:');
console.log('\n1. Criar a política:');
console.log(`aws iam create-policy \\
  --policy-name CognitoUserPoolAccess \\
  --policy-document file://aws-iam-policy-cognito.json`);

console.log('\n2. Anexar a política ao usuário:');
console.log(`aws iam attach-user-policy \\
  --user-name ${userName} \\
  --policy-arn arn:aws:iam::${accountId}:policy/CognitoUserPoolAccess`);

console.log('\n3. Verificar políticas do usuário:');
console.log(`aws iam list-attached-user-policies --user-name ${userName}`);

console.log('\n📱 Via Console AWS:');
console.log('1. Acesse: https://console.aws.amazon.com/iam/');
console.log(`2. Navegue para: Usuários > ${userName}`);
console.log('3. Aba "Permissões" > "Adicionar permissões"');
console.log('4. "Anexar políticas diretamente"');
console.log('5. Cole a política JSON acima');

console.log('\n✅ Após configurar as permissões, teste com:');
console.log('   node src/scripts/test-cognito-integration.js');

console.log('\n🎯 Status esperado após permissões:');
console.log('   ✅ Listagem de usuários funcionando');
console.log('   ✅ Listagem de grupos funcionando');
console.log('   ✅ Sincronização Cognito → Base Local operacional');
console.log('   ✅ Endpoints /api/cognito/* funcionais');

export { policy };
#!/usr/bin/env node

const AWS = require('aws-sdk');

// Configuração AWS
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;

// Função para extrair dados do usuário Cognito
function extractUserData(cognitoUser) {
  const attributes = {};
  
  if (cognitoUser.Attributes) {
    cognitoUser.Attributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
  }
  
  const userData = {
    cognito_sub: attributes.sub || cognitoUser.Username,
    cognito_username: cognitoUser.Username,
    email: attributes.email || null,
    nome: attributes.name || attributes.given_name || attributes.email?.split('@')[0] || cognitoUser.Username,
    telefone: attributes.phone_number || null,
    documento_identidade: attributes.document_id || null,
    genero: attributes.gender || null,
    cidade: attributes.city || null,
    estado: attributes.state || null,
    status: cognitoUser.UserStatus || 'CONFIRMED',
    cpf: attributes.cpf || null
  };
  
  return userData;
}

// Função principal para debug
async function debugCognito() {
  console.log('🔍 DEBUG: Analisando usuários do Cognito...');
  
  try {
    const params = {
      UserPoolId: USER_POOL_ID,
      Limit: 60
    };
    
    const result = await cognito.listUsers(params).promise();
    
    console.log(`📊 Total de usuários: ${result.Users.length}`);
    
    // Analisar cada usuário
    result.Users.forEach((user, index) => {
      console.log(`\n${index + 1}. Usuario: ${user.Username}`);
      
      const userData = extractUserData(user);
      
      // Verificar tamanho de cada campo
      Object.entries(userData).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          const length = value.length;
          console.log(`   ${key}: "${value}" (${length} caracteres)`);
          
          // Alertar sobre campos muito longos
          if (length > 20) {
            console.log(`   ⚠️  CAMPO LONGO: ${key} tem ${length} caracteres!`);
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar debug
debugCognito();
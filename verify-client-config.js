/**
 * Script para verificar configurações do Client App AWS Cognito
 * Verifica quais authentication flows estão habilitados
 */

import { 
  CognitoIdentityProviderClient, 
  DescribeUserPoolClientCommand,
  DescribeUserPoolCommand
} from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';

dotenv.config();

const client = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID;

async function verifyClientConfig() {
  try {
    console.log('🔍 Verificando configurações do User Pool Client...');
    console.log('- User Pool ID:', USER_POOL_ID);
    console.log('- Client ID:', CLIENT_ID);
    
    // Verificar configurações do Client App
    const clientCommand = new DescribeUserPoolClientCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID
    });
    
    const clientResponse = await client.send(clientCommand);
    const userPoolClient = clientResponse.UserPoolClient;
    
    console.log('\n📋 CONFIGURAÇÕES DO CLIENT APP:');
    console.log('='.repeat(50));
    console.log('ClientName:', userPoolClient.ClientName);
    console.log('GenerateSecret:', userPoolClient.GenerateSecret);
    console.log('RefreshTokenValidity:', userPoolClient.RefreshTokenValidity);
    console.log('AccessTokenValidity:', userPoolClient.AccessTokenValidity);
    console.log('IdTokenValidity:', userPoolClient.IdTokenValidity);
    
    console.log('\n🔐 AUTHENTICATION FLOWS:');
    console.log('='.repeat(50));
    
    if (userPoolClient.ExplicitAuthFlows) {
      userPoolClient.ExplicitAuthFlows.forEach((flow, index) => {
        const isPasswordAuth = flow === 'ALLOW_USER_PASSWORD_AUTH';
        const icon = isPasswordAuth ? '✅' : '📝';
        console.log(`${icon} ${index + 1}. ${flow}`);
      });
      
      const hasUserPasswordAuth = userPoolClient.ExplicitAuthFlows.includes('ALLOW_USER_PASSWORD_AUTH');
      const hasAdminNoSrp = userPoolClient.ExplicitAuthFlows.includes('ALLOW_ADMIN_USER_PASSWORD_AUTH');
      const hasSrp = userPoolClient.ExplicitAuthFlows.includes('ALLOW_USER_SRP_AUTH');
      
      console.log('\n🎯 DIAGNÓSTICO:');
      console.log('='.repeat(50));
      console.log('USER_PASSWORD_AUTH habilitado:', hasUserPasswordAuth ? '✅ SIM' : '❌ NÃO');
      console.log('ADMIN_USER_PASSWORD_AUTH habilitado:', hasAdminNoSrp ? '✅ SIM' : '❌ NÃO');
      console.log('USER_SRP_AUTH habilitado:', hasSrp ? '✅ SIM' : '❌ NÃO');
      
      if (!hasUserPasswordAuth && !hasAdminNoSrp) {
        console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
        console.log('Nenhum flow de senha direta está habilitado.');
        console.log('Para usar autenticação por email/senha, você precisa:');
        console.log('1. Ir ao AWS Console');
        console.log('2. Cognito > User Pools > Seu Pool > App Clients');
        console.log('3. Editar o Client App');
        console.log('4. Habilitar "ALLOW_USER_PASSWORD_AUTH" em Authentication flows');
        console.log('5. Salvar as alterações');
      } else if (hasUserPasswordAuth) {
        console.log('\n✅ CONFIGURAÇÃO CORRETA:');
        console.log('USER_PASSWORD_AUTH está habilitado. A autenticação deve funcionar.');
      } else if (hasAdminNoSrp) {
        console.log('\n⚡ ALTERNATIVA DISPONÍVEL:');
        console.log('ADMIN_USER_PASSWORD_AUTH está habilitado.');
        console.log('Podemos usar AdminInitiateAuth em vez de InitiateAuth.');
      }
      
    } else {
      console.log('❌ Nenhum Authentication Flow configurado');
    }
    
    // Verificar configurações do User Pool
    console.log('\n📋 CONFIGURAÇÕES DO USER POOL:');
    console.log('='.repeat(50));
    
    const poolCommand = new DescribeUserPoolCommand({
      UserPoolId: USER_POOL_ID
    });
    
    const poolResponse = await client.send(poolCommand);
    const userPool = poolResponse.UserPool;
    
    console.log('PoolName:', userPool.Name);
    console.log('Status:', userPool.Status);
    console.log('MfaConfiguration:', userPool.MfaConfiguration);
    
    if (userPool.Policies?.PasswordPolicy) {
      console.log('\n🔒 POLÍTICA DE SENHA:');
      const policy = userPool.Policies.PasswordPolicy;
      console.log('MinimumLength:', policy.MinimumLength);
      console.log('RequireUppercase:', policy.RequireUppercase);
      console.log('RequireLowercase:', policy.RequireLowercase);
      console.log('RequireNumbers:', policy.RequireNumbers);
      console.log('RequireSymbols:', policy.RequireSymbols);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error.message);
    console.error('Código:', error.name);
    
    if (error.name === 'AccessDeniedException') {
      console.log('\n💡 Possível causa:');
      console.log('- Permissões AWS insuficientes');
      console.log('- Credenciais incorretas');
      console.log('- User Pool ID ou Client ID incorretos');
    }
  }
}

verifyClientConfig().catch(console.error);
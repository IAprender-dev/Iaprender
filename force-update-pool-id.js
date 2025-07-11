/**
 * Script para forçar atualização do User Pool ID no sistema
 */

import fetch from 'node-fetch';

// Definir o User Pool ID correto
const CORRECT_USER_POOL_ID = 'us-east-1_4jqF97H2X';

async function updateSystemConfig() {
  console.log('🔄 Forçando atualização do User Pool ID para:', CORRECT_USER_POOL_ID);
  
  try {
    // Verificar status atual
    const response = await fetch('http://localhost:5000/api/cognito-sync/status');
    const data = await response.json();
    
    console.log('📊 Status atual:', {
      success: data.success,
      status: data.status,
      cognitoConnection: data.services?.cognito_connection?.status
    });
    
    // Extrair User Pool ID atual dos detalhes do erro
    const errorDetails = data.services?.cognito_connection?.details;
    if (errorDetails) {
      const currentPoolId = errorDetails.match(/userpool\/([^"'\s]+)/)?.[1];
      console.log('📝 User Pool ID atual no sistema:', currentPoolId);
      console.log('🎯 User Pool ID esperado:', CORRECT_USER_POOL_ID);
      
      if (currentPoolId === CORRECT_USER_POOL_ID) {
        console.log('✅ User Pool ID já está correto!');
        console.log('🔧 Problema é apenas falta de permissões AWS IAM');
        
        console.log('\n🔑 Permissões necessárias:');
        console.log('• cognito-idp:DescribeUserPool');
        console.log('• cognito-idp:ListUsers');
        console.log('• cognito-idp:AdminGetUser');
        console.log('• cognito-idp:AdminListGroupsForUser');
        
        return { success: true, message: 'User Pool ID correto, precisa de permissões AWS' };
      } else {
        console.log('❌ User Pool ID ainda incorreto no sistema');
        return { success: false, message: 'User Pool ID não atualizou' };
      }
    }
    
    return { success: false, message: 'Não foi possível verificar o User Pool ID' };
    
  } catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar
updateSystemConfig().then(result => {
  console.log('\n📊 Resultado final:', result);
}).catch(error => {
  console.log('\n❌ Erro na execução:', error.message);
});
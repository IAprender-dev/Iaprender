/**
 * TESTE COMPLETO - COGNITO SYNC SERVICE
 * Script para validar todos os endpoints da sincronização AWS Cognito
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

// Gerar token de teste
function createTestToken() {
  const payload = {
    id: 1,
    email: 'admin@iaprender.com.br',
    tipo_usuario: 'admin',
    empresa_id: 1
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function makeRequest(endpoint, options = {}) {
  const url = `http://localhost:5000${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      data: data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      success: false
    };
  }
}

async function testEndpoint(name, endpoint, options = {}) {
  console.log(`\n🧪 Testando: ${name}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  
  const result = await makeRequest(endpoint, options);
  
  console.log(`📊 Status: ${result.status}`);
  console.log(`✅ Sucesso: ${result.success ? 'Sim' : 'Não'}`);
  console.log(`📝 Dados:`, JSON.stringify(result.data, null, 2));
  
  return result;
}

async function runCompleteTest() {
  console.log('🚀 COGNITO SYNC SERVICE - TESTE COMPLETO');
  console.log('='.repeat(60));
  
  const token = createTestToken();
  console.log(`🔑 Token de teste gerado: ${token.substring(0, 50)}...`);
  
  // 1. Teste Health Check (público)
  await testEndpoint(
    'Health Check (Público)', 
    '/api/cognito-sync/health'
  );
  
  // 2. Teste Status (público)
  await testEndpoint(
    'Status do Serviço (Público)', 
    '/api/cognito-sync/status'
  );
  
  // 3. Teste Statistics (protegido) - sem token
  await testEndpoint(
    'Estatísticas (SEM token)', 
    '/api/cognito-sync/statistics'
  );
  
  // 4. Teste Statistics (protegido) - com token
  await testEndpoint(
    'Estatísticas (COM token)', 
    '/api/cognito-sync/statistics',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // 5. Teste Test Connection (protegido)
  await testEndpoint(
    'Teste de Conexão (COM token)', 
    '/api/cognito-sync/test-connection',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // 6. Teste Sync (protegido) - POST
  await testEndpoint(
    'Sincronização (COM token)', 
    '/api/cognito-sync/sync',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // 7. Teste Sync-All (protegido) - POST - NOVO!
  await testEndpoint(
    'Sincronização Completa (COM token)', 
    '/api/cognito-sync/sync-all',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTE COMPLETO FINALIZADO');
  console.log('\n📊 RESUMO DOS RESULTADOS:');
  console.log('- Health Check: Deve retornar 200 (público)');
  console.log('- Status: Deve retornar 200 com status "degraded" (público)');
  console.log('- Statistics sem token: Deve retornar 401 (protegido)');
  console.log('- Statistics com token: Deve retornar 200 (protegido)');
  console.log('- Test Connection: Deve retornar 200 com erro AWS (protegido)');
  console.log('- Sync: Deve retornar 207 com erros AWS (protegido)');
  console.log('\n🔍 STATUS ESPERADO:');
  console.log('- Sistema operacional mas "degraded" por falta de permissões AWS');
  console.log('- 15 usuários locais detectados');
  console.log('- 0 usuários Cognito (erro de permissão)');
  console.log('- Autenticação JWT funcionando corretamente');
}

// Executar se chamado diretamente
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  createTestToken,
  makeRequest,
  testEndpoint,
  runCompleteTest
};
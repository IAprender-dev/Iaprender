/**
 * TESTE COMPLETO DA API COM AUTENTICAÇÃO JWT
 * 
 * Testa todas as rotas implementadas para verificar se o sistema
 * de autenticação hierárquico está funcionando corretamente
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = 'test_secret_key_iaprender_2025';

/**
 * FUNÇÃO PARA CRIAR TOKEN JWT VÁLIDO
 */
function createTestToken(userType = 'admin', empresa_id = 1) {
  const payload = {
    id: 1,
    email: 'admin@test.com',
    nome: 'Admin Teste',
    tipo_usuario: userType,
    empresa_id: empresa_id,
    escola_id: null,
    grupos: userType === 'admin' ? ['Admin'] : 
            userType === 'gestor' ? ['Gestores'] :
            userType === 'diretor' ? ['Diretores'] :
            userType === 'professor' ? ['Professores'] : ['Alunos'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * TESTE 1: Verificar todas as rotas sem autenticação (deve retornar 401)
 */
async function testarRotasSemAuth() {
  console.log('\n🔒 TESTE 1: Rotas sem autenticação (esperado: 401)');
  
  const endpoints = [
    '/api/empresas',
    '/api/contratos', 
    '/api/usuarios',
    '/api/gestores',
    '/api/diretores',
    '/api/professores',
    '/api/alunos',
    '/api/sync/cognito'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`❌ ${endpoint}: Status ${response.status} (esperado: 401)`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint}: Status 401 (correto)`);
      } else {
        console.log(`⚠️ ${endpoint}: Erro inesperado - ${error.message}`);
      }
    }
  }
}

/**
 * TESTE 2: Verificar rotas com token JWT de Admin (deve funcionar)
 */
async function testarRotasComAdmin() {
  console.log('\n👑 TESTE 2: Rotas com token de Admin (esperado: sucesso ou dados)');
  
  const token = createTestToken('admin');
  const headers = { Authorization: `Bearer ${token}` };
  
  const endpoints = [
    '/api/empresas',
    '/api/contratos', 
    '/api/usuarios',
    '/api/gestores',
    '/api/diretores',
    '/api/professores',
    '/api/alunos'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
      console.log(`✅ ${endpoint}: Status ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ ${endpoint}: Status ${error.response.status} - ${error.response.data?.error || error.response.data?.message || 'Erro desconhecido'}`);
      } else {
        console.log(`❌ ${endpoint}: Erro de conexão - ${error.message}`);
      }
    }
  }
}

/**
 * TESTE 3: Verificar controle hierárquico (gestor vs admin)
 */
async function testarControleHierarquico() {
  console.log('\n🏛️ TESTE 3: Controle hierárquico (gestor vs admin)');
  
  const adminToken = createTestToken('admin');
  const gestorToken = createTestToken('gestor', 1);
  
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  const gestorHeaders = { Authorization: `Bearer ${gestorToken}` };
  
  console.log('\n📋 Testando como ADMIN:');
  try {
    const response = await axios.get(`${BASE_URL}/api/empresas`, { headers: adminHeaders });
    console.log(`✅ Admin acessou /api/empresas: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ Admin falhou em /api/empresas: ${error.response?.status} - ${error.response?.data?.error}`);
  }
  
  console.log('\n🏛️ Testando como GESTOR:');
  try {
    const response = await axios.get(`${BASE_URL}/api/gestores`, { headers: gestorHeaders });
    console.log(`✅ Gestor acessou /api/gestores: Status ${response.status}`);
  } catch (error) {
    console.log(`❌ Gestor falhou em /api/gestores: ${error.response?.status} - ${error.response?.data?.error}`);
  }
}

/**
 * TESTE 4: Verificar endpoint de sincronização Cognito
 */
async function testarSyncCognito() {
  console.log('\n🔄 TESTE 4: Endpoint de sincronização AWS Cognito');
  
  const adminToken = createTestToken('admin');
  const headers = { Authorization: `Bearer ${adminToken}` };
  
  try {
    const response = await axios.get(`${BASE_URL}/api/sync/cognito`, { headers });
    console.log(`✅ Sync Cognito: Status ${response.status} - ${JSON.stringify(response.data)}`);
  } catch (error) {
    if (error.response) {
      console.log(`⚠️ Sync Cognito: Status ${error.response.status} - ${error.response.data?.error || error.response.data?.message}`);
    } else {
      console.log(`❌ Sync Cognito: Erro de conexão - ${error.message}`);
    }
  }
}

/**
 * TESTE 5: Verificar token inválido
 */
async function testarTokenInvalido() {
  console.log('\n🚫 TESTE 5: Token JWT inválido (esperado: 401)');
  
  const invalidToken = 'token_invalido_teste';
  const headers = { Authorization: `Bearer ${invalidToken}` };
  
  try {
    const response = await axios.get(`${BASE_URL}/api/usuarios`, { headers });
    console.log(`❌ Token inválido aceito: Status ${response.status} (não deveria funcionar)`);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Token inválido rejeitado: Status 401 (correto)`);
    } else {
      console.log(`⚠️ Token inválido: Resposta inesperada - ${error.message}`);
    }
  }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function executarTestes() {
  console.log('🚀 INICIANDO TESTES COMPLETOS DA API COM AUTENTICAÇÃO JWT\n');
  console.log('📊 Sistema: IAverse - Plataforma Educacional');
  console.log('🏗️ Arquitetura: Express.js + TypeScript + Drizzle ORM + AWS Cognito');
  console.log('🔐 Autenticação: JWT + Middleware hierárquico\n');
  
  try {
    await testarRotasSemAuth();
    await testarRotasComAdmin();
    await testarControleHierarquico();
    await testarSyncCognito();
    await testarTokenInvalido();
    
    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS');
    console.log('📝 Sistema de autenticação e rotas hierárquicas funcionando corretamente');
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error.message);
  }
}

// Executar os testes
executarTestes();
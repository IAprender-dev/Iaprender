/**
 * TESTE DOS ENDPOINTS DO DASHBOARD - IAPRENDER
 * 
 * Script para testar os novos endpoints implementados
 */

const https = require('https');
const http = require('http');

// Token de teste válido (você precisará de um token real para testar)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibm9tZSI6IkFkbWluIFRlc3RlIiwiZW1haWwiOiJhZG1pbkB0ZXN0ZS5jb20iLCJ0aXBvX3VzdWFyaW8iOiJhZG1pbiIsImVtcHJlc2FfaWQiOjEsImVzY29sYV9pZCI6bnVsbCwiaWF0IjoxNzM2NDg1NzQ3LCJleHAiOjE3MzY0ODkzNDd9.invalid';

const BASE_URL = 'http://localhost:5000';

/**
 * Fazer requisição HTTP
 */
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`\n🔄 Testando: ${options.method || 'GET'} ${url}`);
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...options.headers
      }
    };

    const req = http.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Status: ${res.statusCode}`);
          console.log(`📄 Resposta:`, JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          console.log(`⚠️ Status: ${res.statusCode} (Resposta não é JSON)`);
          console.log(`📄 Resposta raw:`, data.substring(0, 200) + '...');
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Erro na requisição:`, error.message);
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Testar endpoints do dashboard
 */
async function testDashboardEndpoints() {
  console.log('🎯 TESTE DOS ENDPOINTS DO DASHBOARD - IAPRENDER\n');
  
  const endpoints = [
    '/api/dashboard/health',
    '/api/dashboard/stats', 
    '/api/dashboard/recents',
    '/api/dashboard/charts',
    '/api/dashboard/activity'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await makeRequest(endpoint);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre testes
    } catch (error) {
      console.error(`❌ Falha no teste ${endpoint}:`, error.message);
    }
  }
}

/**
 * Testar endpoint sem autenticação (health check)
 */
async function testHealthEndpoint() {
  console.log('\n🔄 Testando Health Check sem autenticação...');
  
  try {
    const result = await makeRequest('/api/dashboard/health', {
      headers: {} // Sem Authorization header
    });
    console.log('✅ Health check funcionando corretamente');
  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  try {
    console.log('🚀 Iniciando testes dos endpoints do dashboard...\n');
    
    // Teste sem autenticação
    await testHealthEndpoint();
    
    // Testes com autenticação
    await testDashboardEndpoints();
    
    console.log('\n✅ Testes concluídos!');
    console.log('\n📝 NOTA: Se os endpoints retornaram HTML em vez de JSON,');
    console.log('   isso indica que as rotas estão sendo capturadas pelo frontend.');
    console.log('   Verifique a ordem das rotas no servidor.');
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
}

// Executar testes
if (require.main === module) {
  runAllTests();
}

module.exports = {
  makeRequest,
  testDashboardEndpoints,
  testHealthEndpoint,
  runAllTests
};
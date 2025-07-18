#!/usr/bin/env node

/**
 * TESTE DOS ENDPOINTS DE INTEGRAÇÃO AWS NO SERVIDOR
 * Verifica se as rotas estão respondendo corretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, symbol, message) => {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
};

const success = (msg) => log(colors.green, '✅', msg);
const error = (msg) => log(colors.red, '❌', msg);
const info = (msg) => log(colors.blue, 'ℹ️', msg);

async function testEndpoint(url, description) {
  try {
    const response = await axios.get(`${BASE_URL}${url}`, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // Aceitar até 499
    });
    
    success(`${description}: Status ${response.status}`);
    
    if (response.data) {
      if (typeof response.data === 'object') {
        console.log(`   📊 Dados: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } else {
        console.log(`   📊 Resposta: ${response.data.toString().substring(0, 100)}...`);
      }
    }
    
    return { success: true, status: response.status, data: response.data };
  } catch (err) {
    if (err.response) {
      error(`${description}: Status ${err.response.status} - ${err.response.data?.message || 'Erro no servidor'}`);
      return { success: false, status: err.response.status, error: err.response.data };
    } else {
      error(`${description}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}

async function testAWSIntegrations() {
  console.log(`${colors.bold}${colors.cyan}🔍 TESTE DOS ENDPOINTS DE INTEGRAÇÃO AWS${colors.reset}\n`);
  
  const endpoints = [
    // Health Checks Gerais
    {
      url: '/api/health',
      description: 'Health Check Geral do Sistema'
    },
    {
      url: '/api/connectivity/health',
      description: 'Health Check Conectividade'
    },
    
    // S3 Integration
    {
      url: '/api/s3-documents/health',
      description: 'S3 Documents Health Check'
    },
    
    // DynamoDB/Lambda IA
    {
      url: '/api/lambda-ia/modelos-disponiveis',
      description: 'Lambda IA - Modelos Disponíveis'
    },
    
    // Aurora Serverless
    {
      url: '/api/connectivity/test',
      description: 'Aurora Serverless - Teste Conectividade'
    },
    {
      url: '/api/connectivity/info',
      description: 'Aurora Serverless - Informações'
    },
    
    // Cognito Integration
    {
      url: '/api/cognito-sync/health-check',
      description: 'Cognito Sync - Health Check'
    },
    {
      url: '/api/cognito-sync/status',
      description: 'Cognito Sync - Status'
    },
    
    // AWS Integration Routes
    {
      url: '/api/aws-integration/health',
      description: 'AWS Integration - Health Check'
    },
    
    // Sistema Híbrido
    {
      url: '/api/hybrid-lambda/status',
      description: 'Sistema Híbrido Lambda - Status'
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.url, endpoint.description);
    results.push({ ...endpoint, ...result });
    console.log(''); // Linha em branco
  }
  
  // Resumo dos resultados
  console.log(`${colors.bold}${colors.cyan}📊 RESUMO DOS TESTES${colors.reset}\n`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  success(`Endpoints funcionais: ${successful.length}/${results.length}`);
  
  if (failed.length > 0) {
    error(`Endpoints com problemas: ${failed.length}`);
    failed.forEach(f => {
      console.log(`   • ${f.description} (${f.url})`);
    });
  }
  
  // Análise por integração
  console.log(`\n${colors.bold}${colors.cyan}🔍 ANÁLISE POR INTEGRAÇÃO${colors.reset}\n`);
  
  const integrations = {
    'S3': results.filter(r => r.url.includes('s3')),
    'DynamoDB/Lambda': results.filter(r => r.url.includes('lambda-ia')),
    'Aurora Serverless': results.filter(r => r.url.includes('connectivity')),
    'Cognito': results.filter(r => r.url.includes('cognito')),
    'AWS Integration': results.filter(r => r.url.includes('aws-integration')),
    'Sistema Híbrido': results.filter(r => r.url.includes('hybrid'))
  };
  
  Object.entries(integrations).forEach(([name, endpoints]) => {
    if (endpoints.length > 0) {
      const working = endpoints.filter(e => e.success).length;
      const total = endpoints.length;
      const percentage = Math.round((working / total) * 100);
      
      if (percentage === 100) {
        success(`${name}: ${working}/${total} (${percentage}%)`);
      } else if (percentage >= 50) {
        log(colors.yellow, '⚠️', `${name}: ${working}/${total} (${percentage}%)`);
      } else {
        error(`${name}: ${working}/${total} (${percentage}%)`);
      }
    }
  });
  
  return results;
}

// Executar testes
(async () => {
  try {
    info('Aguardando servidor estar online...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = await testAWSIntegrations();
    
    console.log(`\n${colors.bold}✅ Testes concluídos em ${new Date().toISOString()}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro durante testes: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
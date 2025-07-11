/**
 * EXEMPLO DE USO DO SISTEMA DE GERENCIAMENTO DE CREDENCIAIS
 * 
 * Este arquivo demonstra como usar o SecretsManager para gerenciar
 * credenciais e configurações sensíveis no sistema IAverse
 */

import { SecretsManager } from '../config/secrets';

// Exemplo 1: Verificação básica do sistema
async function exemploVerificacaoSistema() {
  console.log('=== EXEMPLO 1: VERIFICAÇÃO DO SISTEMA ===');
  
  // Verificar saúde geral do sistema
  const health = SecretsManager.checkSystemHealth();
  console.log('Status geral:', health.overall_status);
  
  // Verificar cada componente
  console.log('AWS Cognito:', health.aws_cognito.status);
  console.log('Database:', health.database.status);
  console.log('AI Services:', `${health.ai_services.available_services}/${health.ai_services.total_services}`);
  
  if (health.aws_cognito.missing_credentials.length > 0) {
    console.log('Credenciais AWS faltantes:', health.aws_cognito.missing_credentials);
  }
  
  if (health.database.missing_credentials.length > 0) {
    console.log('Credenciais Database faltantes:', health.database.missing_credentials);
  }
}

// Exemplo 2: Configuração de conexão com banco
async function exemploConfiguracaoDatabase() {
  console.log('\n=== EXEMPLO 2: CONFIGURAÇÃO DE DATABASE ===');
  
  const dbCreds = SecretsManager.getDatabaseCredentials();
  const validation = SecretsManager.validateDatabaseCredentials();
  
  if (validation.isValid) {
    console.log('✅ Credenciais do banco válidas');
    console.log('Host:', dbCreds.pghost || 'Configurado via DATABASE_URL');
    console.log('Porta:', dbCreds.pgport);
    console.log('Database:', dbCreds.pgdatabase || 'Configurado via DATABASE_URL');
  } else {
    console.log('❌ Credenciais do banco incompletas');
    console.log('Faltantes:', validation.missingCredentials);
  }
}

// Exemplo 3: Configuração AWS Cognito
async function exemploConfiguracaoAWS() {
  console.log('\n=== EXEMPLO 3: CONFIGURAÇÃO AWS COGNITO ===');
  
  const awsCreds = SecretsManager.getAWSCredentials();
  const validation = SecretsManager.validateAWSCredentials();
  
  if (validation.isValid) {
    console.log('✅ AWS Cognito configurado corretamente');
    console.log('Região:', awsCreds.region);
    console.log('User Pool ID:', awsCreds.cognito_user_pool_id);
    console.log('Client ID:', awsCreds.cognito_client_id);
    console.log('Domain:', awsCreds.cognito_domain);
  } else {
    console.log('❌ Configuração AWS incompleta');
    console.log('Faltantes:', validation.missingCredentials);
  }
}

// Exemplo 4: Verificação de serviços de IA
async function exemploServicosIA() {
  console.log('\n=== EXEMPLO 4: SERVIÇOS DE IA ===');
  
  const aiKeys = SecretsManager.getAIApiKeys();
  const servicosDisponiveis: string[] = [];
  
  if (aiKeys.openai_api_key) servicosDisponiveis.push('OpenAI');
  if (aiKeys.anthropic_api_key) servicosDisponiveis.push('Anthropic');
  if (aiKeys.perplexity_api_key) servicosDisponiveis.push('Perplexity');
  if (aiKeys.litellm_api_key) servicosDisponiveis.push('LiteLLM');
  
  console.log('Serviços de IA disponíveis:', servicosDisponiveis.join(', ') || 'Nenhum');
  console.log('Total configurados:', servicosDisponiveis.length);
}

// Exemplo 5: Configuração JWT
async function exemploConfiguracaoJWT() {
  console.log('\n=== EXEMPLO 5: CONFIGURAÇÃO JWT ===');
  
  const jwtConfig = SecretsManager.getJWTSecrets();
  
  console.log('Algoritmo:', jwtConfig.jwt_algorithm);
  console.log('Expiração:', jwtConfig.jwt_expiration);
  console.log('Secret configurado:', jwtConfig.jwt_secret ? 'Sim' : 'Não');
}

// Exemplo 6: Configuração segura para deploy
async function exemploConfiguracaoSegura() {
  console.log('\n=== EXEMPLO 6: CONFIGURAÇÃO SEGURA ===');
  
  const safeConfig = SecretsManager.getSafeConfig();
  
  console.log('Configuração segura para logs/monitoring:');
  console.log(JSON.stringify(safeConfig, null, 2));
}

// Exemplo 7: Relatório completo
async function exemploRelatorioCompleto() {
  console.log('\n=== EXEMPLO 7: RELATÓRIO COMPLETO ===');
  
  const report = SecretsManager.generateStatusReport();
  console.log(report);
}

// Exemplo 8: Uso em middleware Express
function exemploMiddlewareExpress() {
  console.log('\n=== EXEMPLO 8: MIDDLEWARE EXPRESS ===');
  
  // Middleware para verificar configuração antes de iniciar servidor
  const healthCheckMiddleware = (req: any, res: any, next: any) => {
    const health = SecretsManager.checkSystemHealth();
    
    if (health.overall_status !== 'healthy') {
      console.warn('⚠️ Sistema não está 100% saudável:', health);
    }
    
    // Adicionar informações de configuração no request
    req.systemHealth = health;
    req.safeConfig = SecretsManager.getSafeConfig();
    
    next();
  };
  
  console.log('Middleware criado para verificação de saúde do sistema');
  return healthCheckMiddleware;
}

// Exemplo 9: Validação específica de serviços
async function exemploValidacaoEspecifica() {
  console.log('\n=== EXEMPLO 9: VALIDAÇÃO ESPECÍFICA ===');
  
  // Validar apenas AWS
  const awsValidation = SecretsManager.validateAWSCredentials();
  console.log('AWS válido:', awsValidation.isValid);
  
  // Validar apenas Database
  const dbValidation = SecretsManager.validateDatabaseCredentials();
  console.log('Database válido:', dbValidation.isValid);
  
  // Verificar se pelo menos um serviço de IA está configurado
  const aiKeys = SecretsManager.getAIApiKeys();
  const temIA = Object.values(aiKeys).some(key => key);
  console.log('Serviços IA disponíveis:', temIA);
}

// Exemplo 10: Uso em testes automatizados
async function exemploTestes() {
  console.log('\n=== EXEMPLO 10: TESTES AUTOMATIZADOS ===');
  
  const tests = {
    aws_cognito: SecretsManager.validateAWSCredentials().isValid,
    database: SecretsManager.validateDatabaseCredentials().isValid,
    jwt_configured: !!SecretsManager.getJWTSecrets().jwt_secret,
    ai_services: Object.values(SecretsManager.getAIApiKeys()).some(key => key),
    environment_valid: ['development', 'staging', 'production'].includes(
      SecretsManager.getApplicationConfig().environment
    )
  };
  
  console.log('Resultados dos testes:');
  Object.entries(tests).forEach(([test, passed]) => {
    console.log(`  ${test}: ${passed ? '✅' : '❌'}`);
  });
  
  const allPassed = Object.values(tests).every(result => result);
  console.log(`\nTodos os testes: ${allPassed ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  return { tests, allPassed };
}

// Função principal para executar todos os exemplos
async function executarTodosExemplos() {
  console.log('🔐 EXEMPLOS DO SISTEMA DE GERENCIAMENTO DE CREDENCIAIS\n');
  
  try {
    await exemploVerificacaoSistema();
    await exemploConfiguracaoDatabase();
    await exemploConfiguracaoAWS();
    await exemploServicosIA();
    await exemploConfiguracaoJWT();
    await exemploConfiguracaoSegura();
    await exemploRelatorioCompleto();
    exemploMiddlewareExpress();
    await exemploValidacaoEspecifica();
    await exemploTestes();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Exportar para uso em outros arquivos
export {
  exemploVerificacaoSistema,
  exemploConfiguracaoDatabase,
  exemploConfiguracaoAWS,
  exemploServicosIA,
  exemploConfiguracaoJWT,
  exemploConfiguracaoSegura,
  exemploRelatorioCompleto,
  exemploMiddlewareExpress,
  exemploValidacaoEspecifica,
  exemploTestes,
  executarTodosExemplos
};

// Executar automaticamente se chamado diretamente
if (require.main === module) {
  executarTodosExemplos();
}
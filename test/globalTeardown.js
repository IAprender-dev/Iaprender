/**
 * TEARDOWN GLOBAL DOS TESTES - IAPRENDER
 * 
 * Limpeza executada uma vez após todos os testes
 */

export default async () => {
  console.log('🧹 Iniciando teardown global dos testes...');

  // Aqui podemos adicionar limpeza global se necessário
  // Por exemplo: fechar conexões persistentes, limpar caches, etc.

  // Limpar variáveis de ambiente de teste
  delete process.env.TEST_JWT_SECRET;
  delete process.env.TEST_DATABASE_URL;

  console.log('✅ Teardown global dos testes concluído');
};
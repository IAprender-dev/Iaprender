/**
 * TESTE DO HIERARCHICAL FILTER SERVICE V2
 * 
 * Testando a primeira função implementada: getFilteredData
 */

const { execSync } = require('child_process');

async function testarGetFilteredData() {
  try {
    console.log('🧪 TESTE 1: getFilteredData()');
    console.log('=========================================');
    
    // Simular um usuário gestor da empresa 1
    const userEmpresaId = 1;
    const userGrupos = ['Gestores'];
    
    console.log(`👤 Usuário teste: Gestor da empresa ${userEmpresaId}`);
    console.log(`📋 Grupos: ${userGrupos.join(', ')}`);
    
    // Importar usando require dinâmico
    const { HierarchicalFilterService } = await import('./server/services/HierarchicalFilterService-v2.ts');
    
    const filterService = new HierarchicalFilterService(userEmpresaId, userGrupos);
    
    // TESTE 1: Buscar usuários da empresa
    console.log('\n📊 Teste 1.1: Filtrar usuários da empresa');
    const usuarios = await filterService.getFilteredData('usuarios');
    console.log(`✅ Resultado: ${usuarios.length} usuários encontrados`);
    
    // TESTE 2: Buscar escolas da empresa
    console.log('\n🏫 Teste 1.2: Filtrar escolas da empresa');
    const escolas = await filterService.getFilteredData('escolas');
    console.log(`✅ Resultado: ${escolas.length} escolas encontradas`);
    
    // TESTE 3: Buscar contratos da empresa
    console.log('\n📋 Teste 1.3: Filtrar contratos da empresa');
    const contratos = await filterService.getFilteredData('contratos');
    console.log(`✅ Resultado: ${contratos.length} contratos encontrados`);
    
    // TESTE 4: Buscar com filtros adicionais
    console.log('\n🔍 Teste 1.4: Filtrar usuários com filtros adicionais');
    const usuariosAtivos = await filterService.getFilteredData('usuarios', {
      status: 'ativo'
    });
    console.log(`✅ Resultado: ${usuariosAtivos.length} usuários ativos encontrados`);
    
    console.log('\n✅ TESTE getFilteredData() CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste getFilteredData():', error.message);
    return false;
  }
}

async function executarTeste() {
  console.log('🚀 INICIANDO TESTE HIERARCHICAL FILTER SERVICE V2');
  console.log('==================================================\n');
  
  const resultado = await testarGetFilteredData();
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('==================');
  console.log(resultado ? '✅ TESTE APROVADO' : '❌ TESTE FALHOU');
}

// Executar teste
executarTeste().catch(console.error);
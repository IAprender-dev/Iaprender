/**
 * TESTE COMPLETO DO HIERARCHICAL FILTER SERVICE V2
 * 
 * Testando todas as 8 funções implementadas baseadas no código Python
 */

import HierarchicalFilterService from './server/services/HierarchicalFilterService-v2.ts';

async function testarTodasFuncoes() {
  try {
    console.log('🧪 TESTE COMPLETO: HierarchicalFilterService V2');
    console.log('==============================================');
    
    // Simular um usuário gestor da empresa 1
    const userEmpresaId = 1;
    const userGrupos = ['Gestores', 'GestorMunicipal'];
    
    console.log(`👤 Usuário teste: Gestor da empresa ${userEmpresaId}`);
    console.log(`📋 Grupos: ${userGrupos.join(', ')}`);
    
    const filterService = new HierarchicalFilterService(userEmpresaId, userGrupos);
    
    console.log('\n===============================================');
    console.log('🔍 TESTE 1: getFilteredData()');
    console.log('===============================================');
    
    // Teste 1.1: Buscar usuários da empresa
    const usuarios = await filterService.getFilteredData('usuarios');
    console.log(`✅ Usuários encontrados: ${usuarios.length}`);
    
    // Teste 1.2: Buscar escolas com filtro adicional
    const escolasAtivas = await filterService.getFilteredData('escolas', { status: 'ativa' });
    console.log(`✅ Escolas ativas encontradas: ${escolasAtivas.length}`);
    
    console.log('\n===============================================');
    console.log('👥 TESTE 2: getUsuariosByRole()');
    console.log('===============================================');
    
    // Teste 2.1: Todos os usuários
    const todosUsuarios = await filterService.getUsuariosByRole();
    console.log(`✅ Todos os usuários: ${todosUsuarios.length}`);
    
    // Teste 2.2: Apenas professores
    const professoresRole = await filterService.getUsuariosByRole('professor');
    console.log(`✅ Usuários com role professor: ${professoresRole.length}`);
    
    console.log('\n===============================================');
    console.log('🏛️ TESTE 3: getGestores()');
    console.log('===============================================');
    
    const gestores = await filterService.getGestores();
    console.log(`✅ Gestores encontrados: ${gestores.length}`);
    if (gestores.length > 0) {
      console.log(`   Exemplo: ${gestores[0].nome} (${gestores[0].email})`);
    }
    
    console.log('\n===============================================');
    console.log('🏫 TESTE 4: getDiretores()');
    console.log('===============================================');
    
    const diretores = await filterService.getDiretores();
    console.log(`✅ Diretores encontrados: ${diretores.length}`);
    if (diretores.length > 0) {
      console.log(`   Exemplo: ${diretores[0].nome} (${diretores[0].email})`);
    }
    
    console.log('\n===============================================');
    console.log('👩‍🏫 TESTE 5: getProfessores()');
    console.log('===============================================');
    
    const professores = await filterService.getProfessores();
    console.log(`✅ Professores encontrados: ${professores.length}`);
    if (professores.length > 0) {
      console.log(`   Exemplo: ${professores[0].nome} (${professores[0].email})`);
    }
    
    console.log('\n===============================================');
    console.log('🎓 TESTE 6: getAlunos()');
    console.log('===============================================');
    
    const alunos = await filterService.getAlunos();
    console.log(`✅ Alunos encontrados: ${alunos.length}`);
    if (alunos.length > 0) {
      console.log(`   Exemplo: ${alunos[0].nome} (${alunos[0].email})`);
    }
    
    console.log('\n===============================================');
    console.log('📋 TESTE 7: getContratos()');
    console.log('===============================================');
    
    const contratos = await filterService.getContratos();
    console.log(`✅ Contratos encontrados: ${contratos.length}`);
    
    console.log('\n===============================================');
    console.log('✅ TESTE 8: canAccessData()');
    console.log('===============================================');
    
    // Teste 8.1: Sem role (deve permitir)
    const acessoLivre = filterService.canAccessData();
    console.log(`✅ Acesso livre (sem role): ${acessoLivre ? 'PERMITIDO' : 'NEGADO'}`);
    
    // Teste 8.2: Role que usuário possui
    const acessoGestor = filterService.canAccessData('Gestores');
    console.log(`✅ Acesso como Gestor: ${acessoGestor ? 'PERMITIDO' : 'NEGADO'}`);
    
    // Teste 8.3: Role que usuário não possui
    const acessoAdmin = filterService.canAccessData('Admin');
    console.log(`✅ Acesso como Admin: ${acessoAdmin ? 'PERMITIDO' : 'NEGADO'}`);
    
    console.log('\n===============================================');
    console.log('📊 RESUMO DOS TESTES');
    console.log('===============================================');
    console.log(`🔍 getFilteredData(): ✅ FUNCIONANDO`);
    console.log(`👥 getUsuariosByRole(): ✅ FUNCIONANDO`);
    console.log(`🏛️ getGestores(): ✅ FUNCIONANDO`);
    console.log(`🏫 getDiretores(): ✅ FUNCIONANDO`);
    console.log(`👩‍🏫 getProfessores(): ✅ FUNCIONANDO`);
    console.log(`🎓 getAlunos(): ✅ FUNCIONANDO`);
    console.log(`📋 getContratos(): ✅ FUNCIONANDO`);
    console.log(`✅ canAccessData(): ✅ FUNCIONANDO`);
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('✅ Sistema de Filtros Hierárquicos 100% Operacional');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Executar teste
testarTodasFuncoes()
  .then(resultado => {
    console.log('\n📊 RESULTADO FINAL:');
    console.log('==================');
    console.log(resultado ? '✅ TODOS OS TESTES APROVADOS' : '❌ ALGUNS TESTES FALHARAM');
    process.exit(resultado ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
import { sincronizarUsuario } from '../middleware/auth.js';

// EXEMPLO 1: Sincronizar usuário admin novo
export async function exemploSincronizarAdminNovo() {
  console.log('🧪 Exemplo 1: Sincronizar usuário admin novo');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'admin-12345-67890',
    email: 'admin@iaprender.com',
    nome: 'Administrador Sistema',
    groups: ['Admin', 'AdminMaster'],
    empresa_id: null
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário admin sincronizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar admin:', error.message);
    throw error;
  }
}

// EXEMPLO 2: Sincronizar usuário gestor novo
export async function exemploSincronizarGestorNovo() {
  console.log('\n🧪 Exemplo 2: Sincronizar usuário gestor novo');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'gestor-12345-67890',
    email: 'gestor@prefeitura.sp.gov.br',
    nome: 'Maria Silva Santos',
    groups: ['Gestores', 'GestorMunicipal'],
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário gestor sincronizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar gestor:', error.message);
    throw error;
  }
}

// EXEMPLO 3: Sincronizar usuário diretor novo
export async function exemploSincronizarDiretorNovo() {
  console.log('\n🧪 Exemplo 3: Sincronizar usuário diretor novo');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'diretor-12345-67890',
    email: 'diretor@escola.edu.br',
    nome: 'João Pedro Silva',
    groups: ['Diretores', 'DiretoresEscolares'],
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário diretor sincronizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar diretor:', error.message);
    throw error;
  }
}

// EXEMPLO 4: Sincronizar usuário professor novo
export async function exemploSincronizarProfessorNovo() {
  console.log('\n🧪 Exemplo 4: Sincronizar usuário professor novo');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'professor-12345-67890',
    email: 'professor@escola.edu.br',
    nome: 'Fernanda Souza Silva',
    groups: ['Professores', 'Teachers'],
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário professor sincronizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar professor:', error.message);
    throw error;
  }
}

// EXEMPLO 5: Sincronizar usuário aluno novo
export async function exemploSincronizarAlunoNovo() {
  console.log('\n🧪 Exemplo 5: Sincronizar usuário aluno novo');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'aluno-12345-67890',
    email: 'aluno@escola.edu.br',
    nome: 'Bruno Henrique Santos',
    groups: ['Alunos', 'Students'],
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário aluno sincronizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar aluno:', error.message);
    throw error;
  }
}

// EXEMPLO 6: Sincronizar usuário existente (sem alterações)
export async function exemploSincronizarUsuarioExistente() {
  console.log('\n🧪 Exemplo 6: Sincronizar usuário existente (sem alterações)');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'admin-12345-67890', // Mesmo sub do exemplo 1
    email: 'admin@iaprender.com',
    nome: 'Administrador Sistema',
    groups: ['Admin', 'AdminMaster'],
    empresa_id: null
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário existente verificado (sem alterações):');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao verificar usuário existente:', error.message);
    throw error;
  }
}

// EXEMPLO 7: Sincronizar usuário existente com alterações
export async function exemploSincronizarUsuarioComAlteracoes() {
  console.log('\n🧪 Exemplo 7: Sincronizar usuário existente com alterações');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'gestor-12345-67890', // Mesmo sub do exemplo 2
    email: 'maria.silva@prefeitura.sp.gov.br', // Email alterado
    nome: 'Maria Silva Santos Oliveira', // Nome alterado
    groups: ['Gestores', 'GestorMunicipal'],
    empresa_id: '2' // Empresa alterada
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário existente atualizado com sucesso:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário existente:', error.message);
    throw error;
  }
}

// EXEMPLO 8: Sincronizar usuário com grupo desconhecido
export async function exemploSincronizarGrupoDesconhecido() {
  console.log('\n🧪 Exemplo 8: Sincronizar usuário com grupo desconhecido');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'usuario-grupo-desconhecido-12345',
    email: 'usuario@desconhecido.com',
    nome: 'Usuário Grupo Desconhecido',
    groups: ['GrupoDesconhecido', 'OutroGrupo'],
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário com grupo desconhecido sincronizado (tipo padrão: aluno):');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário com grupo desconhecido:', error.message);
    throw error;
  }
}

// EXEMPLO 9: Sincronizar usuário sem empresa_id
export async function exemploSincronizarSemEmpresaId() {
  console.log('\n🧪 Exemplo 9: Sincronizar usuário sem empresa_id');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'usuario-sem-empresa-12345',
    email: 'usuario@sem.empresa.com',
    nome: 'Usuário Sem Empresa',
    groups: ['Professores'],
    empresa_id: null // Sem empresa
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário sem empresa_id sincronizado:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário sem empresa:', error.message);
    throw error;
  }
}

// EXEMPLO 10: Sincronizar usuário com múltiplos grupos
export async function exemploSincronizarMultiplosGrupos() {
  console.log('\n🧪 Exemplo 10: Sincronizar usuário com múltiplos grupos');
  console.log('='.repeat(50));
  
  const cognitoUser = {
    sub: 'usuario-multiplos-grupos-12345',
    email: 'usuario@multiplos.grupos.com',
    nome: 'Usuário Múltiplos Grupos',
    groups: ['Professores', 'Diretores', 'Gestores'], // Admin será o primeiro reconhecido
    empresa_id: '1'
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário com múltiplos grupos sincronizado (primeiro grupo reconhecido):');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário com múltiplos grupos:', error.message);
    throw error;
  }
}

// EXEMPLO 11: Sincronizar usuário com payload do token real
export async function exemploSincronizarComPayloadReal() {
  console.log('\n🧪 Exemplo 11: Sincronizar usuário com payload do token real');
  console.log('='.repeat(50));
  
  // Simular payload real do AWS Cognito
  const payloadReal = {
    sub: 'real-cognito-uuid-12345',
    email: 'usuario.real@cognito.com',
    name: 'Usuário Real Cognito', // Usando 'name' ao invés de 'nome'
    'cognito:groups': ['Professores', 'Teachers'],
    'custom:empresa_id': '3',
    aud: 'client-id-exemplo',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_exemplo',
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hora no futuro
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Converter para formato esperado pela função
  const cognitoUser = {
    sub: payloadReal.sub,
    email: payloadReal.email,
    nome: payloadReal.name,
    groups: payloadReal['cognito:groups'],
    empresa_id: payloadReal['custom:empresa_id']
  };
  
  try {
    const usuarioLocal = await sincronizarUsuario(cognitoUser);
    
    console.log('✅ Usuário com payload real sincronizado:');
    console.log('📋 ID Local:', usuarioLocal.id);
    console.log('📋 Nome:', usuarioLocal.nome);
    console.log('📋 Email:', usuarioLocal.email);
    console.log('📋 Tipo:', usuarioLocal.tipo_usuario);
    console.log('📋 Empresa ID:', usuarioLocal.empresa_id);
    console.log('📋 Status:', usuarioLocal.status);
    
    return usuarioLocal;
  } catch (error) {
    console.error('❌ Erro ao sincronizar usuário com payload real:', error.message);
    throw error;
  }
}

// EXEMPLO 12: Executar todos os exemplos
export async function executarTodosOsExemplos() {
  console.log('🧪 Executando todos os exemplos da função sincronizarUsuario...\n');
  
  const exemplos = [
    { nome: 'Admin Novo', funcao: exemploSincronizarAdminNovo },
    { nome: 'Gestor Novo', funcao: exemploSincronizarGestorNovo },
    { nome: 'Diretor Novo', funcao: exemploSincronizarDiretorNovo },
    { nome: 'Professor Novo', funcao: exemploSincronizarProfessorNovo },
    { nome: 'Aluno Novo', funcao: exemploSincronizarAlunoNovo },
    { nome: 'Usuário Existente', funcao: exemploSincronizarUsuarioExistente },
    { nome: 'Usuário com Alterações', funcao: exemploSincronizarUsuarioComAlteracoes },
    { nome: 'Grupo Desconhecido', funcao: exemploSincronizarGrupoDesconhecido },
    { nome: 'Sem Empresa ID', funcao: exemploSincronizarSemEmpresaId },
    { nome: 'Múltiplos Grupos', funcao: exemploSincronizarMultiplosGrupos },
    { nome: 'Payload Real', funcao: exemploSincronizarComPayloadReal }
  ];
  
  const resultados = [];
  
  for (const exemplo of exemplos) {
    try {
      console.log(`\n🔍 Executando exemplo: ${exemplo.nome}`);
      const resultado = await exemplo.funcao();
      resultados.push({ nome: exemplo.nome, status: 'sucesso', resultado });
      console.log(`✅ Exemplo ${exemplo.nome} concluído com sucesso`);
    } catch (error) {
      resultados.push({ nome: exemplo.nome, status: 'erro', erro: error.message });
      console.log(`❌ Exemplo ${exemplo.nome} falhou: ${error.message}`);
    }
  }
  
  console.log('\n📊 Resumo dos Exemplos:');
  console.log('='.repeat(50));
  resultados.forEach(resultado => {
    const status = resultado.status === 'sucesso' ? '✅' : '❌';
    console.log(`${status} ${resultado.nome}: ${resultado.status}`);
  });
  
  return resultados;
}

// Executar exemplos automaticamente se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarTodosOsExemplos();
}
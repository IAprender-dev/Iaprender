import { Usuario } from '../models/Usuario.js';

/**
 * Exemplos de uso do modelo Usuario
 * Demonstra todas as funcionalidades disponíveis
 */

// ============================================================================
// EXEMPLOS DE CRIAÇÃO DE USUÁRIOS
// ============================================================================

// EXEMPLO 1: Criando um usuário admin
export async function criarUsuarioAdmin() {
  console.log('🔧 Exemplo 1: Criando usuário admin');
  
  const adminData = {
    cognito_sub: 'admin-123456',
    email: 'admin@iaprender.com',
    nome: 'João Silva Santos',
    tipo_usuario: 'admin',
    empresa_id: null, // Admin global
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    documento: '12345678901',
    configuracoes: {
      tema: 'dark',
      notificacoes: true,
      idioma: 'pt-BR'
    }
  };
  
  try {
    const admin = new Usuario(adminData);
    await admin.create();
    
    console.log('✅ Admin criado:', admin.toJSON());
    return admin;
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    throw error;
  }
}

// EXEMPLO 2: Criando um usuário gestor
export async function criarUsuarioGestor() {
  console.log('🔧 Exemplo 2: Criando usuário gestor');
  
  const gestorData = {
    cognito_sub: 'gestor-789012',
    email: 'maria.santos@prefeitura.sp.gov.br',
    nome: 'Maria Santos Silva',
    tipo_usuario: 'gestor',
    empresa_id: 1, // Prefeitura de São Paulo
    telefone: '(11) 88888-8888',
    endereco: 'Av. Paulista, 456 - São Paulo/SP',
    documento: '98765432100',
    configuracoes: {
      tema: 'light',
      notificacoes: true,
      dashboard_widgets: ['contratos', 'escolas', 'usuarios']
    }
  };
  
  try {
    const gestor = new Usuario(gestorData);
    await gestor.create();
    
    console.log('✅ Gestor criado:', gestor.toJSON());
    return gestor;
  } catch (error) {
    console.error('❌ Erro ao criar gestor:', error.message);
    throw error;
  }
}

// EXEMPLO 3: Criando um usuário diretor
export async function criarUsuarioDiretor() {
  console.log('🔧 Exemplo 3: Criando usuário diretor');
  
  const diretorData = {
    cognito_sub: 'diretor-345678',
    email: 'carlos.oliveira@escola.edu.br',
    nome: 'Carlos Eduardo Oliveira',
    tipo_usuario: 'diretor',
    empresa_id: 1, // Mesma empresa do gestor
    telefone: '(11) 77777-7777',
    endereco: 'Rua da Escola, 789 - São Paulo/SP',
    documento: '11122233344',
    data_nascimento: '1980-03-15',
    configuracoes: {
      tema: 'light',
      notificacoes: true,
      escola_id: 1
    }
  };
  
  try {
    const diretor = new Usuario(diretorData);
    await diretor.create();
    
    console.log('✅ Diretor criado:', diretor.toJSON());
    return diretor;
  } catch (error) {
    console.error('❌ Erro ao criar diretor:', error.message);
    throw error;
  }
}

// EXEMPLO 4: Criando um usuário professor
export async function criarUsuarioProfessor() {
  console.log('🔧 Exemplo 4: Criando usuário professor');
  
  const professorData = {
    cognito_sub: 'professor-901234',
    email: 'ana.ferreira@escola.edu.br',
    nome: 'Ana Paula Ferreira',
    tipo_usuario: 'professor',
    empresa_id: 1, // Mesma empresa
    telefone: '(11) 66666-6666',
    endereco: 'Rua dos Professores, 321 - São Paulo/SP',
    documento: '55566677788',
    data_nascimento: '1985-07-22',
    configuracoes: {
      tema: 'light',
      notificacoes: true,
      disciplinas: ['Matemática', 'Física'],
      escola_id: 1
    }
  };
  
  try {
    const professor = new Usuario(professorData);
    await professor.create();
    
    console.log('✅ Professor criado:', professor.toJSON());
    return professor;
  } catch (error) {
    console.error('❌ Erro ao criar professor:', error.message);
    throw error;
  }
}

// EXEMPLO 5: Criando um usuário aluno
export async function criarUsuarioAluno() {
  console.log('🔧 Exemplo 5: Criando usuário aluno');
  
  const alunoData = {
    cognito_sub: 'aluno-567890',
    email: 'pedro.silva@aluno.edu.br',
    nome: 'Pedro Silva Santos',
    tipo_usuario: 'aluno',
    empresa_id: 1, // Mesma empresa
    telefone: '(11) 55555-5555',
    endereco: 'Rua dos Alunos, 654 - São Paulo/SP',
    documento: '99988877766',
    data_nascimento: '2005-12-10',
    configuracoes: {
      tema: 'light',
      notificacoes: true,
      turma: '9º Ano A',
      escola_id: 1
    }
  };
  
  try {
    const aluno = new Usuario(alunoData);
    await aluno.create();
    
    console.log('✅ Aluno criado:', aluno.toJSON());
    return aluno;
  } catch (error) {
    console.error('❌ Erro ao criar aluno:', error.message);
    throw error;
  }
}

// ============================================================================
// EXEMPLOS DE BUSCA E CONSULTA
// ============================================================================

// EXEMPLO 6: Buscar usuário por ID
export async function buscarUsuarioPorId(id) {
  console.log('🔍 Exemplo 6: Buscando usuário por ID:', id);
  
  try {
    const usuario = await Usuario.findById(id);
    
    if (usuario) {
      console.log('✅ Usuário encontrado:', usuario.toJSON());
      return usuario;
    } else {
      console.log('❌ Usuário não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    throw error;
  }
}

// EXEMPLO 7: Buscar usuário por email
export async function buscarUsuarioPorEmail(email) {
  console.log('🔍 Exemplo 7: Buscando usuário por email:', email);
  
  try {
    const usuario = await Usuario.findByEmail(email);
    
    if (usuario) {
      console.log('✅ Usuário encontrado:', usuario.toJSON());
      return usuario;
    } else {
      console.log('❌ Usuário não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    throw error;
  }
}

// EXEMPLO 8: Buscar usuário por Cognito Sub
export async function buscarUsuarioPorCognitoSub(cognitoSub) {
  console.log('🔍 Exemplo 8: Buscando usuário por Cognito Sub:', cognitoSub);
  
  try {
    const usuario = await Usuario.findByCognitoSub(cognitoSub);
    
    if (usuario) {
      console.log('✅ Usuário encontrado:', usuario.toJSON());
      return usuario;
    } else {
      console.log('❌ Usuário não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    throw error;
  }
}

// EXEMPLO 9: Listar todos os usuários com filtros
export async function listarUsuariosComFiltros() {
  console.log('📋 Exemplo 9: Listando usuários com filtros');
  
  try {
    // Filtros de exemplo
    const filtros = {
      tipo_usuario: 'professor',
      empresa_id: 1,
      status: 'ativo'
    };
    
    const opcoes = {
      page: 1,
      limit: 5,
      orderBy: 'nome',
      orderDirection: 'ASC'
    };
    
    const resultado = await Usuario.findAll(filtros, opcoes);
    
    console.log('✅ Usuários encontrados:', resultado.total);
    console.log('📄 Página 1 de', Math.ceil(resultado.total / opcoes.limit));
    
    resultado.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email}) - ${user.tipo_usuario}`);
    });
    
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
    throw error;
  }
}

// EXEMPLO 10: Buscar usuários por empresa
export async function buscarUsuariosPorEmpresa(empresaId) {
  console.log('🏢 Exemplo 10: Buscando usuários por empresa:', empresaId);
  
  try {
    const usuarios = await Usuario.findByEmpresa(empresaId);
    
    console.log('✅ Usuários encontrados:', usuarios.length);
    
    usuarios.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.tipo_usuario}) - ${user.email}`);
    });
    
    return usuarios;
  } catch (error) {
    console.error('❌ Erro ao buscar usuários por empresa:', error.message);
    throw error;
  }
}

// ============================================================================
// EXEMPLOS DE ATUALIZAÇÃO
// ============================================================================

// EXEMPLO 11: Atualizar dados do usuário
export async function atualizarUsuario(id, novosDados) {
  console.log('📝 Exemplo 11: Atualizando usuário:', id);
  
  try {
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    // Atualizar dados
    Object.assign(usuario, novosDados);
    await usuario.update();
    
    console.log('✅ Usuário atualizado:', usuario.toJSON());
    return usuario;
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error.message);
    throw error;
  }
}

// EXEMPLO 12: Atualizar último login
export async function atualizarUltimoLogin(id) {
  console.log('🔄 Exemplo 12: Atualizando último login:', id);
  
  try {
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    await usuario.updateLastLogin();
    
    console.log('✅ Último login atualizado para:', usuario.nome);
    return usuario;
  } catch (error) {
    console.error('❌ Erro ao atualizar último login:', error.message);
    throw error;
  }
}

// EXEMPLO 13: Atualizar configurações
export async function atualizarConfiguracoes(id, novasConfiguracoes) {
  console.log('⚙️ Exemplo 13: Atualizando configurações:', id);
  
  try {
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    await usuario.updateConfiguracoes(novasConfiguracoes);
    
    console.log('✅ Configurações atualizadas:', usuario.configuracoes);
    return usuario;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error.message);
    throw error;
  }
}

// ============================================================================
// EXEMPLOS DE VALIDAÇÃO E PERMISSÕES
// ============================================================================

// EXEMPLO 14: Validar dados do usuário
export function validarDadosUsuario() {
  console.log('✅ Exemplo 14: Validando dados do usuário');
  
  // Dados válidos
  const dadosValidos = {
    email: 'usuario@example.com',
    nome: 'João Silva',
    tipo_usuario: 'professor',
    telefone: '(11) 99999-9999',
    documento: '12345678901'
  };
  
  const usuarioValido = new Usuario(dadosValidos);
  const validationValida = usuarioValido.validate();
  
  console.log('Dados válidos:', validationValida);
  
  // Dados inválidos
  const dadosInvalidos = {
    email: 'email-invalido',
    nome: 'A', // Muito curto
    tipo_usuario: 'tipo_inexistente',
    telefone: '123', // Formato inválido
    documento: '123' // Formato inválido
  };
  
  const usuarioInvalido = new Usuario(dadosInvalidos);
  const validationInvalida = usuarioInvalido.validate();
  
  console.log('Dados inválidos:', validationInvalida);
}

// EXEMPLO 15: Verificar permissões de acesso
export async function verificarPermissoes(userId1, userId2) {
  console.log('🔐 Exemplo 15: Verificando permissões de acesso');
  
  try {
    const usuario1 = await Usuario.findById(userId1);
    const usuario2 = await Usuario.findById(userId2);
    
    if (!usuario1 || !usuario2) {
      throw new Error('Um ou ambos usuários não foram encontrados');
    }
    
    // Verificar se usuario1 pode gerenciar usuario2
    const podeGerenciar = usuario1.canManageUser(usuario2);
    
    console.log(`${usuario1.nome} (${usuario1.tipo_usuario}) pode gerenciar ${usuario2.nome} (${usuario2.tipo_usuario}): ${podeGerenciar}`);
    
    // Verificar acesso à empresa
    const podeAcessarEmpresa = usuario1.canAccessEmpresa(usuario2.empresa_id);
    
    console.log(`${usuario1.nome} pode acessar empresa ${usuario2.empresa_id}: ${podeAcessarEmpresa}`);
    
    return {
      podeGerenciar,
      podeAcessarEmpresa
    };
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error.message);
    throw error;
  }
}

// ============================================================================
// EXEMPLOS DE ESTATÍSTICAS
// ============================================================================

// EXEMPLO 16: Obter estatísticas dos usuários
export async function obterEstatisticasUsuarios() {
  console.log('📊 Exemplo 16: Obtendo estatísticas dos usuários');
  
  try {
    const stats = await Usuario.getStats();
    
    console.log('📈 Estatísticas dos usuários:');
    console.log('   Total de usuários:', stats.total);
    console.log('   Usuários ativos:', stats.ativos);
    console.log('   Usuários inativos:', stats.inativos);
    console.log('   Por tipo:', stats.por_tipo);
    console.log('   Por empresa:', stats.por_empresa);
    
    return stats;
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error.message);
    throw error;
  }
}

// ============================================================================
// EXEMPLOS DE EXCLUSÃO
// ============================================================================

// EXEMPLO 17: Deletar usuário
export async function deletarUsuario(id) {
  console.log('🗑️ Exemplo 17: Deletando usuário:', id);
  
  try {
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    const nomeUsuario = usuario.nome;
    const sucesso = await usuario.delete();
    
    if (sucesso) {
      console.log('✅ Usuário deletado:', nomeUsuario);
    } else {
      console.log('❌ Falha ao deletar usuário');
    }
    
    return sucesso;
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error.message);
    throw error;
  }
}

// ============================================================================
// FUNÇÃO PARA EXECUTAR TODOS OS EXEMPLOS
// ============================================================================

export async function executarTodosExemplosUsuario() {
  console.log('🧪 Executando todos os exemplos do modelo Usuario...\n');
  
  try {
    console.log('='.repeat(80));
    console.log('CRIAÇÃO DE USUÁRIOS');
    console.log('='.repeat(80));
    
    const admin = await criarUsuarioAdmin();
    const gestor = await criarUsuarioGestor();
    const diretor = await criarUsuarioDiretor();
    const professor = await criarUsuarioProfessor();
    const aluno = await criarUsuarioAluno();
    
    console.log('='.repeat(80));
    console.log('BUSCA E CONSULTA');
    console.log('='.repeat(80));
    
    await buscarUsuarioPorId(admin.id);
    await buscarUsuarioPorEmail(gestor.email);
    await buscarUsuarioPorCognitoSub(diretor.cognito_sub);
    await listarUsuariosComFiltros();
    await buscarUsuariosPorEmpresa(1);
    
    console.log('='.repeat(80));
    console.log('ATUALIZAÇÃO DE DADOS');
    console.log('='.repeat(80));
    
    await atualizarUsuario(professor.id, { telefone: '(11) 11111-1111' });
    await atualizarUltimoLogin(aluno.id);
    await atualizarConfiguracoes(professor.id, { tema: 'dark' });
    
    console.log('='.repeat(80));
    console.log('VALIDAÇÃO E PERMISSÕES');
    console.log('='.repeat(80));
    
    validarDadosUsuario();
    await verificarPermissoes(admin.id, professor.id);
    
    console.log('='.repeat(80));
    console.log('ESTATÍSTICAS');
    console.log('='.repeat(80));
    
    await obterEstatisticasUsuarios();
    
    console.log('✅ Todos os exemplos executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error.message);
    throw error;
  }
}

// Para executar os exemplos:
// import { executarTodosExemplosUsuario } from './usuario-model-examples.js';
// executarTodosExemplosUsuario();
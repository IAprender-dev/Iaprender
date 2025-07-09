/**
 * EXEMPLOS DE USO - ALUNO CONTROLLER
 * 
 * Este arquivo demonstra o uso completo do AlunoController
 * implementado em /src/controllers/alunoController.js
 * 
 * FUNÇÕES IMPLEMENTADAS:
 * - listarAlunos(req, res) - Listagem com filtros hierárquicos
 * - buscarPorId(req, res) - Busca individual por ID
 * - criarAluno(req, res) - Criação com validações
 * - atualizarAluno(req, res) - Atualização com permissões
 * - obterEstatisticas(req, res) - Estatísticas filtradas
 */

import { AlunoController } from '../controllers/alunoController.js';

// ============================================================================
// EXEMPLO 1: ADMIN LISTANDO TODOS OS ALUNOS
// ============================================================================

export async function exemploAdminListarAlunos() {
  console.log('=== EXEMPLO 1: Admin listando todos os alunos ===');
  
  const req = {
    query: {
      page: 1,
      limit: 10,
      status: 'ativo',
      orderBy: 'nome',
      orderDirection: 'ASC'
    },
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.listarAlunos(req, res);
}

// ============================================================================
// EXEMPLO 2: GESTOR LISTANDO ALUNOS DA PRÓPRIA EMPRESA
// ============================================================================

export async function exemploGestorListarAlunos() {
  console.log('=== EXEMPLO 2: Gestor listando alunos da própria empresa ===');
  
  const req = {
    query: {
      page: 1,
      limit: 20,
      escola_id: 1,
      turma: '9º Ano',
      serie: 'Fundamental',
      search: 'Silva'
    },
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 1 // Prefeitura SP
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.listarAlunos(req, res);
}

// ============================================================================
// EXEMPLO 3: DIRETOR LISTANDO ALUNOS DA PRÓPRIA ESCOLA
// ============================================================================

export async function exemploDiretorListarAlunos() {
  console.log('=== EXEMPLO 3: Diretor listando alunos da própria escola ===');
  
  const req = {
    query: {
      page: 1,
      limit: 15,
      turma: '1º Ano EM',
      turno: 'manhã',
      status: 'ativo'
    },
    user: {
      id: 20,
      tipo_usuario: 'diretor',
      empresa_id: 2 // Secretaria RJ
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.listarAlunos(req, res);
}

// ============================================================================
// EXEMPLO 4: PROFESSOR LISTANDO ALUNOS DAS ESCOLAS VINCULADAS
// ============================================================================

export async function exemploProfessorListarAlunos() {
  console.log('=== EXEMPLO 4: Professor listando alunos das escolas vinculadas ===');
  
  const req = {
    query: {
      page: 1,
      limit: 25,
      serie: 'Médio',
      turno: 'tarde'
    },
    user: {
      id: 25,
      tipo_usuario: 'professor',
      empresa_id: 3 // IFMG
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.listarAlunos(req, res);
}

// ============================================================================
// EXEMPLO 5: ADMIN CRIANDO NOVO ALUNO
// ============================================================================

export async function exemploAdminCriarAluno() {
  console.log('=== EXEMPLO 5: Admin criando novo aluno ===');
  
  const req = {
    body: {
      nome: 'Maria Fernanda Santos',
      escola_id: 1,
      empresa_id: 1,
      turma: '8º Ano',
      serie: 'Fundamental',
      turno: 'manhã',
      nome_responsavel: 'Carlos Roberto Santos',
      contato_responsavel: '(11) 99999-8888',
      data_nascimento: '2009-05-15',
      status: 'ativo'
    },
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.criarAluno(req, res);
}

// ============================================================================
// EXEMPLO 6: GESTOR CRIANDO ALUNO NA PRÓPRIA EMPRESA
// ============================================================================

export async function exemploGestorCriarAluno() {
  console.log('=== EXEMPLO 6: Gestor criando aluno na própria empresa ===');
  
  const req = {
    body: {
      nome: 'Pedro Henrique Oliveira',
      escola_id: 2,
      empresa_id: 2, // Será forçado para empresa do gestor
      turma: '2º Ano EM',
      serie: 'Médio',
      turno: 'tarde',
      nome_responsavel: 'Ana Paula Oliveira',
      contato_responsavel: '(21) 88888-7777',
      matricula: '2025020001' // Matrícula específica
    },
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 2 // Secretaria RJ
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.criarAluno(req, res);
}

// ============================================================================
// EXEMPLO 7: DIRETOR ATUALIZANDO ALUNO DA PRÓPRIA ESCOLA
// ============================================================================

export async function exemploDiretorAtualizarAluno() {
  console.log('=== EXEMPLO 7: Diretor atualizando aluno da própria escola ===');
  
  const req = {
    params: { id: '1' },
    body: {
      turma: '9º Ano',
      turno: 'tarde',
      contato_responsavel: '(11) 99999-9999',
      status: 'ativo'
    },
    user: {
      id: 20,
      tipo_usuario: 'diretor',
      empresa_id: 1
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.atualizarAluno(req, res);
}

// ============================================================================
// EXEMPLO 8: ALUNO ATUALIZANDO PRÓPRIOS DADOS DE CONTATO
// ============================================================================

export async function exemploAlunoAtualizarProprios() {
  console.log('=== EXEMPLO 8: Aluno atualizando próprios dados de contato ===');
  
  const req = {
    params: { id: '1' },
    body: {
      nome_responsavel: 'Maria Silva Santos - Atualizada',
      contato_responsavel: '(11) 77777-8888',
      turma: '1º Ano EM', // Será ignorado
      empresa_id: 999 // Será ignorado
    },
    user: {
      id: 30,
      tipo_usuario: 'aluno',
      empresa_id: 1
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.atualizarAluno(req, res);
}

// ============================================================================
// EXEMPLO 9: ADMIN OBTENDO ESTATÍSTICAS GLOBAIS
// ============================================================================

export async function exemploAdminEstatisticas() {
  console.log('=== EXEMPLO 9: Admin obtendo estatísticas globais ===');
  
  const req = {
    query: {},
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.obterEstatisticas(req, res);
}

// ============================================================================
// EXEMPLO 10: GESTOR OBTENDO ESTATÍSTICAS DA EMPRESA
// ============================================================================

export async function exemploGestorEstatisticas() {
  console.log('=== EXEMPLO 10: Gestor obtendo estatísticas da empresa ===');
  
  const req = {
    query: {},
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 1 // Prefeitura SP
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.obterEstatisticas(req, res);
}

// ============================================================================
// EXEMPLO 11: ERRO - ACESSO NEGADO
// ============================================================================

export async function exemploAcessoNegado() {
  console.log('=== EXEMPLO 11: Erro - Acesso negado ===');
  
  const req = {
    params: { id: '1' },
    user: {
      id: 30,
      tipo_usuario: 'professor',
      empresa_id: 4 // Professor tentando acessar aluno de outra empresa
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await AlunoController.buscarPorId(req, res);
}

// ============================================================================
// EXEMPLOS DE RESPOSTAS ESPERADAS
// ============================================================================

export const exemploRespostas = {

  // Resposta de listagem com filtros
  listagem: {
    "success": true,
    "message": "15 aluno(s) encontrado(s)",
    "data": [
      {
        "id": 1,
        "nome": "Bruno Henrique Santos",
        "matricula": "2024001",
        "turma": "9º Ano",
        "serie": "Fundamental",
        "turno": "manhã",
        "nome_responsavel": "Maria Santos",
        "contato_responsavel": "(11) 98765-4321",
        "data_matricula": "2024-01-15T10:00:00.000Z",
        "status": "ativo",
        "escola": {
          "id": 1,
          "nome": "Escola Municipal João Silva",
          "codigo_inep": "35041190",
          "tipo_escola": "municipal",
          "cidade": "São Paulo",
          "estado": "SP"
        },
        "empresa": {
          "id": 1,
          "nome": "Prefeitura de São Paulo",
          "cnpj": "46.395.000/0001-39",
          "cidade": "São Paulo",
          "estado": "SP"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "filtros_aplicados": {
      "empresa_id": 1,
      "status": "ativo"
    }
  },

  // Resposta de criação
  criacao: {
    "success": true,
    "message": "Aluno criado com sucesso",
    "data": {
      "id": 4,
      "nome": "Maria Fernanda Santos",
      "matricula": "2025010004",
      "turma": "8º Ano",
      "serie": "Fundamental",
      "turno": "manhã",
      "nome_responsavel": "Carlos Roberto Santos",
      "contato_responsavel": "(11) 99999-8888",
      "data_matricula": "2025-01-09T15:30:00.000Z",
      "status": "ativo",
      "escola": {
        "nome": "Escola Municipal João Silva"
      },
      "empresa": {
        "nome": "Prefeitura de São Paulo"
      }
    },
    "metadata": {
      "criado_por": 1,
      "tipo_criador": "admin",
      "escola_atribuida": 1,
      "empresa_atribuida": 1,
      "matricula_gerada": true
    }
  },

  // Resposta de atualização
  atualizacao: {
    "success": true,
    "message": "Aluno atualizado com sucesso",
    "data": {
      "id": 1,
      "nome": "Bruno Henrique Santos",
      "turma": "9º Ano",
      "turno": "tarde",
      "contato_responsavel": "(11) 99999-9999",
      "status": "ativo"
    },
    "metadata": {
      "campos_atualizados": ["turma", "turno", "contato_responsavel"],
      "atualizado_por": 20,
      "tipo_editor": "diretor"
    }
  },

  // Resposta de estatísticas
  estatisticas: {
    "success": true,
    "message": "Estatísticas obtidas com sucesso",
    "data": {
      "total_alunos": 850,
      "alunos_ativos": 820,
      "alunos_inativos": 30,
      "distribuicao_por_serie": {
        "Fundamental": 520,
        "Médio": 280,
        "Superior": 50
      },
      "distribuicao_por_turno": {
        "manhã": 380,
        "tarde": 320,
        "noite": 120,
        "integral": 30
      },
      "alunos_por_escola": [
        {
          "escola_id": 1,
          "escola_nome": "Escola Municipal João Silva",
          "total": 320
        },
        {
          "escola_id": 2,
          "escola_nome": "Escola Estadual Maria Santos", 
          "total": 280
        }
      ]
    },
    "filtros_aplicados": {
      "empresa_id": 1
    }
  }
};

// ============================================================================
// CASOS DE USO PRÁTICOS
// ============================================================================

export const casosUsoPraticos = {

  // Dashboard do Diretor
  dashboardDiretor: {
    descricao: "Diretor visualizando alunos da própria escola",
    funcoes_usadas: ["listarAlunos", "obterEstatisticas"],
    filtros_importantes: ["turma", "serie", "turno", "status"],
    dados_exibidos: ["Nome", "Matrícula", "Turma", "Responsável", "Contato"]
  },

  // Relatório de Gestor  
  relatorioGestor: {
    descricao: "Gestor gerando relatório de alunos por escola",
    funcoes_usadas: ["listarAlunos", "obterEstatisticas"],
    filtros_importantes: ["escola_id", "serie", "status"],
    dados_exibidos: ["Distribuição por escola", "Estatísticas gerais", "Alunos ativos/inativos"]
  },

  // Consulta de Professor
  consultaProfessor: {
    descricao: "Professor consultando alunos das turmas que leciona",
    funcoes_usadas: ["listarAlunos"],
    filtros_importantes: ["turma", "serie", "turno"],
    dados_exibidos: ["Nome", "Matrícula", "Turma", "Responsável"]
  },

  // Matrícula Online
  matriculaOnline: {
    descricao: "Diretor matriculando novo aluno",
    funcoes_usadas: ["criarAluno"],
    dados_obrigatorios: ["nome", "escola_id", "turma", "serie", "responsavel"],
    validacoes: ["Escola vinculada", "Matrícula única", "Dados do responsável"]
  }
};

// ============================================================================
// CONTROLE DE ACESSO POR TIPO DE USUÁRIO
// ============================================================================

export const controleAcessoPorUsuario = {

  admin: {
    listarAlunos: "✅ Todos os alunos do sistema",
    buscarPorId: "✅ Qualquer aluno",
    criarAluno: "✅ Em qualquer escola/empresa",
    atualizarAluno: "✅ Qualquer campo de qualquer aluno",
    obterEstatisticas: "✅ Estatísticas globais",
    campos_edicao: ["Todos os campos disponíveis"]
  },

  gestor: {
    listarAlunos: "✅ Alunos da própria empresa",
    buscarPorId: "✅ Alunos da própria empresa",
    criarAluno: "✅ Nas escolas da própria empresa",
    atualizarAluno: "✅ Alunos da empresa (exceto empresa_id)",
    obterEstatisticas: "✅ Estatísticas da empresa",
    campos_edicao: ["Todos exceto empresa_id"]
  },

  diretor: {
    listarAlunos: "✅ Alunos da própria escola",
    buscarPorId: "✅ Alunos da própria escola",
    criarAluno: "✅ Na própria escola",
    atualizarAluno: "✅ Alunos da escola (campos limitados)",
    obterEstatisticas: "✅ Estatísticas da escola",
    campos_edicao: ["nome", "turma", "serie", "turno", "responsavel", "contato", "status"]
  },

  professor: {
    listarAlunos: "✅ Alunos das escolas vinculadas",
    buscarPorId: "✅ Alunos das escolas vinculadas",
    criarAluno: "❌ Não permitido",
    atualizarAluno: "❌ Não permitido",
    obterEstatisticas: "❌ Não permitido",
    campos_edicao: []
  },

  aluno: {
    listarAlunos: "✅ Apenas próprios dados",
    buscarPorId: "✅ Apenas próprios dados",
    criarAluno: "❌ Não permitido",
    atualizarAluno: "✅ Apenas dados de contato do responsável",
    obterEstatisticas: "❌ Não permitido",
    campos_edicao: ["nome_responsavel", "contato_responsavel"]
  }
};

// ============================================================================
// FUNÇÃO DE TESTE COMPLETO
// ============================================================================

export async function executarTodosExemplosAluno() {
  console.log('👥 === TESTANDO ALUNO CONTROLLER ===');
  
  try {
    await exemploAdminListarAlunos();
    console.log('');
    
    await exemploGestorListarAlunos();
    console.log('');
    
    await exemploDiretorListarAlunos();
    console.log('');
    
    await exemploProfessorListarAlunos();
    console.log('');
    
    await exemploAdminCriarAluno();
    console.log('');
    
    await exemploGestorCriarAluno();
    console.log('');
    
    await exemploDiretorAtualizarAluno();
    console.log('');
    
    await exemploAlunoAtualizarProprios();
    console.log('');
    
    await exemploAdminEstatisticas();
    console.log('');
    
    await exemploGestorEstatisticas();
    console.log('');
    
    await exemploAcessoNegado();
    
    console.log('✅ Todos os exemplos executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Exportar função principal para testes
if (import.meta.main) {
  executarTodosExemplosAluno();
}
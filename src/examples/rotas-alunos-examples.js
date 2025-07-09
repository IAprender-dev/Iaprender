/**
 * EXEMPLOS DE USO - ROTAS DE ALUNOS
 * 
 * Este arquivo documenta como usar todas as rotas de alunos
 * com diferentes tipos de usuário e suas respectivas permissões.
 */

/**
 * EXEMPLO 1: LISTAR ALUNOS - ADMIN
 * GET /api/alunos
 */
const exemploListarAlunosAdmin = {
  request: {
    method: 'GET',
    url: '/api/alunos?page=1&limit=10&empresa_id=1&turma=9º Ano&search=Bruno',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  permissoes: 'Admin: Pode filtrar por qualquer empresa',
  rate_limit: '60 requests/min',
  middleware: ['autenticar', 'qualquerTipo'],
  response: {
    success: true,
    data: {
      alunos: [
        {
          id: 1,
          nome: 'Bruno Henrique Santos',
          matricula: '2024010001',
          turma: '9º Ano',
          escola: { nome: 'EMEF Prof. João Silva' },
          empresa: { nome: 'Prefeitura de São Paulo' }
        }
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      }
    }
  }
};

/**
 * EXEMPLO 2: LISTAR ALUNOS - GESTOR
 * GET /api/alunos
 */
const exemploListarAlunosGestor = {
  request: {
    method: 'GET',
    url: '/api/alunos?page=1&limit=10&turma=1º Ano EM',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  permissoes: 'Gestor: Apenas alunos da própria empresa (filtro automático)',
  middleware: ['autenticar', 'qualquerTipo'],
  observacao: 'empresa_id é aplicado automaticamente baseado no usuário logado',
  response: {
    success: true,
    data: {
      alunos: [
        {
          id: 2,
          nome: 'Camila Rodrigues Silva',
          matricula: '2024020001',
          turma: '1º Ano EM',
          escola: { nome: 'EMEF Profª Maria Santos' }
        }
      ]
    }
  }
};

/**
 * EXEMPLO 3: OBTER DADOS COMPLETOS DO ALUNO
 * GET /api/alunos/:id/completo
 */
const exemploObterAlunoCompleto = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  permissoes: 'Qualquer tipo: Validação de acesso feita no controller',
  rate_limit: '60 requests/min',
  middleware: ['autenticar', 'qualquerTipo'],
  response: {
    success: true,
    data: {
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      responsavel: {
        nome: 'Carlos Roberto Santos',
        contato: '(11) 99999-8888'
      },
      escola: {
        nome: 'EMEF Prof. João Silva',
        codigo_inep: '35123456',
        diretor: { nome: 'João Pedro Silva' }
      },
      empresa: {
        nome: 'Prefeitura de São Paulo',
        cnpj: '11.222.333/0001-44'
      }
    }
  }
};

/**
 * EXEMPLO 4: CRIAR NOVO ALUNO - DIRETOR
 * POST /api/alunos
 */
const exemploCriarAlunosDiretor = {
  request: {
    method: 'POST',
    url: '/api/alunos',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: {
      nome: 'Pedro Lucas Almeida',
      escola_id: 1, // Deve ser a escola do diretor
      turma: '8º Ano',
      serie: 'Fundamental',
      turno: 'tarde',
      nome_responsavel: 'Ana Paula Almeida',
      contato_responsavel: '(11) 98765-4321',
      data_matricula: '2025-01-15'
    }
  },
  permissoes: 'Admin, Gestor, Diretor',
  rate_limit: '20 requests/min',
  middleware: ['autenticar', 'verificarTipoUsuario([admin, gestor, diretor])'],
  validacoes: [
    'Escola deve pertencer à empresa do usuário',
    'Diretor só pode criar na própria escola',
    'Matrícula gerada automaticamente'
  ],
  response: {
    success: true,
    message: 'Aluno criado com sucesso',
    data: {
      id: 4,
      nome: 'Pedro Lucas Almeida',
      matricula: '2025010004', // Gerada automaticamente
      escola_id: 1,
      empresa_id: 1,
      turma: '8º Ano'
    }
  }
};

/**
 * EXEMPLO 5: ATUALIZAR ALUNO - PROFESSOR
 * PUT /api/alunos/:id
 */
const exemploAtualizarAlunoProfessor = {
  request: {
    method: 'PUT',
    url: '/api/alunos/1',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: {
      nome: 'Bruno Henrique Santos - Atualizado',
      turno: 'tarde',
      matricula: '999999999' // ❌ Será ignorado (protegido)
    }
  },
  permissoes: 'Professor: Não pode atualizar (erro 403)',
  rate_limit: '20 requests/min',
  middleware: ['autenticar', 'qualquerTipo'],
  response: {
    success: false,
    message: 'Professor não tem permissão para editar alunos',
    status: 403
  }
};

/**
 * EXEMPLO 6: TRANSFERIR ALUNO - GESTOR
 * POST /api/alunos/:id/transferir
 */
const exemploTransferirAlunoGestor = {
  request: {
    method: 'POST',
    url: '/api/alunos/1/transferir',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: {
      nova_escola_id: 2,
      motivo_transferencia: 'Mudança de endereço da família',
      data_transferencia: '2025-01-20T10:00:00.000Z'
    }
  },
  permissoes: 'Admin, Gestor, Diretor',
  rate_limit: '10 requests/5min (muito restritivo)',
  middleware: ['autenticar', 'verificarTipoUsuario([admin, gestor, diretor])'],
  validacoes: [
    'Escolas devem pertencer à mesma empresa',
    'Escola destino deve estar ativa',
    'Nova matrícula gerada automaticamente'
  ],
  response: {
    success: true,
    message: 'Aluno transferido com sucesso',
    data: {
      aluno: {
        id: 1,
        matricula: '2025020001', // Nova matrícula
        escola_id: 2
      },
      transferencia: {
        id: 1,
        escola_origem: { nome: 'EMEF Prof. João Silva' },
        escola_destino: { nome: 'EMEF Profª Maria Santos' },
        matricula_anterior: '2024010001',
        nova_matricula: '2025020001'
      }
    }
  }
};

/**
 * EXEMPLO 7: OBTER HISTÓRICO DE TRANSFERÊNCIAS
 * GET /api/alunos/:id/transferencias
 */
const exemploHistoricoTransferencias = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/transferencias',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  permissoes: 'Qualquer tipo: Validação de acesso no controller',
  rate_limit: '60 requests/min',
  middleware: ['autenticar', 'qualquerTipo'],
  response: {
    success: true,
    message: '1 transferência(s) encontrada(s)',
    data: {
      aluno: {
        id: 1,
        nome: 'Bruno Henrique Santos',
        matricula_atual: '2025020001'
      },
      historico_transferencias: [
        {
          id: 1,
          data_transferencia: '2025-01-20T10:00:00.000Z',
          motivo: 'Mudança de endereço da família',
          escola_origem: { nome: 'EMEF Prof. João Silva' },
          escola_destino: { nome: 'EMEF Profª Maria Santos' },
          responsavel: { nome: 'Maria Silva Santos', tipo: 'gestor' }
        }
      ],
      total_transferencias: 1
    }
  }
};

/**
 * EXEMPLO 8: ESTATÍSTICAS - DIRETOR
 * GET /api/alunos/stats
 */
const exemploEstatisticasDiretor = {
  request: {
    method: 'GET',
    url: '/api/alunos/stats',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  permissoes: 'Admin, Gestor, Diretor',
  rate_limit: '60 requests/min',
  middleware: ['autenticar', 'verificarTipoUsuario([admin, gestor, diretor])'],
  response: {
    success: true,
    data: {
      total_alunos: 156,
      alunos_ativos: 150,
      alunos_inativos: 6,
      por_turno: {
        manha: 65,
        tarde: 58,
        noite: 27,
        integral: 6
      },
      por_serie: {
        fundamental: 98,
        medio: 45,
        superior: 13
      }
    }
  }
};

/**
 * RESUMO DAS ROTAS E PERMISSÕES
 */
const resumoRotasPermissoes = {
  consultas: {
    'GET /api/alunos': {
      permissoes: 'Todos (com filtros hierárquicos)',
      rate_limit: '60/min',
      middleware: ['autenticar', 'qualquerTipo']
    },
    'GET /api/alunos/stats': {
      permissoes: 'Admin, Gestor, Diretor',
      rate_limit: '60/min',
      middleware: ['autenticar', 'verificarTipoUsuario']
    },
    'GET /api/alunos/:id': {
      permissoes: 'Todos (validação no controller)',
      rate_limit: '60/min',
      middleware: ['autenticar', 'qualquerTipo']
    },
    'GET /api/alunos/:id/completo': {
      permissoes: 'Todos (validação no controller)',
      rate_limit: '60/min',
      middleware: ['autenticar', 'qualquerTipo']
    },
    'GET /api/alunos/:id/transferencias': {
      permissoes: 'Todos (validação no controller)',
      rate_limit: '60/min',
      middleware: ['autenticar', 'qualquerTipo']
    }
  },
  gestao: {
    'POST /api/alunos': {
      permissoes: 'Admin, Gestor, Diretor',
      rate_limit: '20/min',
      middleware: ['autenticar', 'verificarTipoUsuario']
    },
    'PUT /api/alunos/:id': {
      permissoes: 'Todos (validação no controller)',
      rate_limit: '20/min',
      middleware: ['autenticar', 'qualquerTipo']
    }
  },
  especializada: {
    'POST /api/alunos/:id/transferir': {
      permissoes: 'Admin, Gestor, Diretor',
      rate_limit: '10/5min',
      middleware: ['autenticar', 'verificarTipoUsuario']
    }
  }
};

/**
 * CÓDIGOS DE RESPOSTA HTTP
 */
const codigosResposta = {
  200: 'Sucesso - Operação realizada com sucesso',
  201: 'Criado - Aluno criado com sucesso',
  400: 'Dados inválidos - Validação falhou',
  401: 'Não autenticado - Token inválido ou ausente',
  403: 'Acesso negado - Sem permissão para a operação',
  404: 'Não encontrado - Aluno não existe',
  429: 'Rate limit excedido - Muitas requisições',
  500: 'Erro interno - Falha no servidor'
};

/**
 * EXPORTAR EXEMPLOS
 */
export {
  exemploListarAlunosAdmin,
  exemploListarAlunosGestor,
  exemploObterAlunoCompleto,
  exemploCriarAlunosDiretor,
  exemploAtualizarAlunoProfessor,
  exemploTransferirAlunoGestor,
  exemploHistoricoTransferencias,
  exemploEstatisticasDiretor,
  resumoRotasPermissoes,
  codigosResposta
};

console.log('📚 EXEMPLOS DE ROTAS DE ALUNOS CARREGADOS');
console.log('✅ 8 exemplos detalhados disponíveis');
console.log('✅ Resumo de permissões por rota documentado');
console.log('✅ Códigos de resposta HTTP mapeados');
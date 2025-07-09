/**
 * EXEMPLOS DE USO - ROTAS DE ESCOLAS
 * 
 * Este arquivo demonstra o uso completo das rotas de escolas
 * implementadas em /src/routes/escolas.js
 * 
 * Base URL: /api/escolas
 * Middleware: autenticar (obrigatório em todas as rotas)
 * Rate Limiting: Aplicado conforme tipo de operação
 */

// ============================================================================
// ROTAS DE CONSULTA
// ============================================================================

export const exemploRotasConsulta = {

  // 1. LISTAR ESCOLAS COM FILTROS
  listarEscolas: {
    rota: 'GET /api/escolas',
    permissoes: 'Qualquer usuário autenticado (dados filtrados por hierarquia)',
    rateLimit: '30 requests/min',
    parametros: {
      query: {
        page: 1,
        limit: 20,
        empresa_id: 2,
        contrato_id: 1,
        status: 'ativo',
        tipo_escola: 'municipal',
        search: 'Santos',
        estado: 'SP',
        cidade: 'São Paulo',
        orderBy: 'nome',
        orderDirection: 'ASC'
      }
    },
    exemplosCurl: [
      // Admin listando todas as escolas
      `curl -X GET "http://localhost:5000/api/escolas?page=1&limit=10" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`,
      
      // Gestor filtrando escolas ativas da própria empresa
      `curl -X GET "http://localhost:5000/api/escolas?status=ativo&tipo_escola=municipal" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`,
       
      // Busca textual por nome
      `curl -X GET "http://localhost:5000/api/escolas?search=Santos&orderBy=nome" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`
    ]
  },

  // 2. BUSCAR ESCOLA POR ID (DADOS BÁSICOS)
  buscarPorId: {
    rota: 'GET /api/escolas/:id',
    permissoes: 'Usuários com acesso à escola (verificação automática)',
    rateLimit: '60 requests/min',
    retorna: 'Dados básicos + empresa + contrato (sem contadores)',
    exemplosCurl: [
      // Admin consultando qualquer escola
      `curl -X GET "http://localhost:5000/api/escolas/1" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`,
       
      // Diretor consultando própria escola
      `curl -X GET "http://localhost:5000/api/escolas/5" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`
    ]
  },

  // 3. OBTER ESCOLA COM DETALHES COMPLETOS
  obterDetalhes: {
    rota: 'GET /api/escolas/:id/detalhes',
    permissoes: 'Usuários com acesso à escola (verificação automática)',
    rateLimit: '60 requests/min',
    retorna: 'Dados completos + empresa + contrato + contadores de pessoas',
    exemplosCurl: [
      // Gestor obtendo dados completos para dashboard
      `curl -X GET "http://localhost:5000/api/escolas/3/detalhes" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`,
       
      // Professor consultando dados da escola vinculada
      `curl -X GET "http://localhost:5000/api/escolas/2/detalhes" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`
    ]
  },

  // 4. ESTATÍSTICAS DE ESCOLAS
  estatisticas: {
    rota: 'GET /api/escolas/stats',
    permissoes: 'Admin, Gestor, Diretor (dados filtrados por empresa/escola)',
    rateLimit: '30 requests/min',
    retorna: 'Estatísticas agregadas baseadas no nível de acesso',
    exemplosCurl: [
      // Admin obtendo estatísticas globais
      `curl -X GET "http://localhost:5000/api/escolas/stats" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`,
       
      // Gestor obtendo estatísticas da própria empresa
      `curl -X GET "http://localhost:5000/api/escolas/stats" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`
    ]
  }
};

// ============================================================================
// ROTAS DE GESTÃO (CRIAÇÃO, EDIÇÃO, EXCLUSÃO)
// ============================================================================

export const exemploRotasGestao = {

  // 1. CRIAR NOVA ESCOLA
  criarEscola: {
    rota: 'POST /api/escolas',
    permissoes: 'Apenas Admin e Gestor',
    rateLimit: '10 requests/min',
    camposObrigatorios: ['nome', 'codigo_inep', 'tipo_escola', 'contrato_id', 'empresa_id'],
    validacoes: ['contrato pertence à empresa', 'código INEP único', 'gestor limitado à própria empresa'],
    exemplosCurl: [
      // Admin criando escola
      `curl -X POST "http://localhost:5000/api/escolas" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json" \\
       -d '{
         "nome": "Escola Municipal Nova Esperança",
         "codigo_inep": "35041200",
         "tipo_escola": "municipal",
         "contrato_id": 2,
         "empresa_id": 2,
         "telefone": "(21) 3333-5555",
         "email": "esperanca@educacao.rj.gov.br",
         "endereco": "Rua da Esperança, 456",
         "cidade": "Rio de Janeiro",
         "estado": "RJ"
       }'`,
       
      // Gestor criando escola (empresa_id automático)
      `curl -X POST "http://localhost:5000/api/escolas" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json" \\
       -d '{
         "nome": "Escola Estadual Dom Pedro",
         "codigo_inep": "35041201",
         "tipo_escola": "estadual",
         "contrato_id": 3,
         "telefone": "(11) 4444-6666",
         "email": "dompedro@educacao.sp.gov.br"
       }'`
    ]
  },

  // 2. ATUALIZAR ESCOLA
  atualizarEscola: {
    rota: 'PUT /api/escolas/:id',
    permissoes: 'Admin (qualquer), Gestor (própria empresa), Diretor (própria escola)',
    rateLimit: '20 requests/min',
    camposPermitidos: 'Varia por tipo de usuário',
    protecoes: ['empresa_id não pode ser alterado por gestores', 'validações hierárquicas'],
    exemplosCurl: [
      // Admin atualizando qualquer campo
      `curl -X PUT "http://localhost:5000/api/escolas/1" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json" \\
       -d '{
         "nome": "Escola Municipal João Silva - Atualizada",
         "telefone": "(11) 9999-8888",
         "email": "joao.silva.novo@educacao.sp.gov.br",
         "contrato_id": 2
       }'`,
       
      // Gestor atualizando escola (empresa_id será ignorado)
      `curl -X PUT "http://localhost:5000/api/escolas/2" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json" \\
       -d '{
         "nome": "Escola Estadual Maria Santos",
         "telefone": "(21) 7777-9999",
         "empresa_id": 999
       }'`,
       
      // Diretor atualizando apenas dados básicos
      `curl -X PUT "http://localhost:5000/api/escolas/5" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json" \\
       -d '{
         "telefone": "(31) 5555-7777",
         "email": "contato@ifmg.edu.br",
         "endereco": "Avenida Nova, 789"
       }'`
    ]
  },

  // 3. REMOVER ESCOLA
  removerEscola: {
    rota: 'DELETE /api/escolas/:id',
    permissoes: 'Apenas Admin',
    rateLimit: '5 requests/min',
    validacoes: ['verificar dependências (diretores, professores, alunos)'],
    seguranca: ['operação irreversível', 'logs detalhados de auditoria'],
    exemplosCurl: [
      // Admin removendo escola sem dependências
      `curl -X DELETE "http://localhost:5000/api/escolas/10" \\
       -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9..." \\
       -H "Content-Type: application/json"`
    ]
  }
};

// ============================================================================
// RESPOSTAS ESPERADAS
// ============================================================================

export const exemploRespostas = {

  // Resposta de listagem
  listagem: {
    success: true,
    message: "5 escola(s) encontrada(s)",
    data: [
      {
        id: 1,
        nome: "Escola Municipal João Silva",
        codigo_inep: "35041190",
        empresa: {
          nome: "Prefeitura de São Paulo",
          cnpj: "46.395.000/0001-39"
        },
        contrato: {
          descricao: "Contrato IAprender SP",
          status: "ativo"
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 5,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  },

  // Resposta de detalhes completos
  detalhes: {
    success: true,
    message: "Dados completos da escola obtidos com sucesso",
    data: {
      id: 1,
      nome: "Escola Municipal João Silva",
      codigo_inep: "35041190",
      empresa: {
        nome: "Prefeitura de São Paulo",
        cnpj: "46.395.000/0001-39"
      },
      contrato: {
        descricao: "Contrato IAprender SP",
        numero_licencas: 1200,
        valor_total: 240000.00,
        status: "ativo"
      },
      contadores: {
        total_alunos: 850,
        total_professores: 45,
        total_diretores: 1,
        alunos_ativos: 820,
        professores_ativos: 42,
        diretores_ativos: 1
      }
    },
    metadata: {
      incluiu_contadores: true,
      consultado_por: 15,
      tipo_usuario: "gestor"
    }
  },

  // Resposta de criação
  criacao: {
    success: true,
    message: "Escola criada com sucesso",
    data: {
      id: 11,
      nome: "Escola Municipal Nova Esperança",
      codigo_inep: "35041200",
      empresa: {
        nome: "Secretaria de Educação do Rio de Janeiro"
      },
      contrato: {
        descricao: "Contrato IAprender RJ",
        status: "ativo"
      }
    },
    metadata: {
      criado_por: 15,
      tipo_criador: "gestor",
      empresa_atribuida: 2,
      contrato_vinculado: 2
    }
  },

  // Resposta de atualização
  atualizacao: {
    success: true,
    message: "Escola atualizada com sucesso",
    data: {
      id: 1,
      nome: "Escola Municipal João Silva - Atualizada",
      telefone: "(11) 9999-8888"
    },
    metadata: {
      campos_atualizados: ["nome", "telefone"],
      atualizado_por: 1,
      tipo_editor: "admin"
    }
  }
};

// ============================================================================
// CÓDIGOS DE ERRO E RATE LIMITING
// ============================================================================

export const codigosErro = {

  // Erros de autenticação
  401: {
    codigo: 'UNAUTHORIZED',
    mensagem: 'Token de acesso inválido ou expirado',
    solucao: 'Fazer login novamente e obter novo token'
  },

  // Erros de autorização
  403: {
    codigo: 'ESCOLA_ACCESS_DENIED',
    mensagem: 'Acesso negado a esta escola',
    solucao: 'Verificar se usuário tem permissão para esta escola específica'
  },

  // Erros de validação
  400: {
    codigo: 'VALIDATION_ERROR',
    mensagem: 'Dados inválidos ou campos obrigatórios faltando',
    solucao: 'Verificar formato dos dados enviados'
  },

  // Erros de recurso não encontrado
  404: {
    codigo: 'ESCOLA_NOT_FOUND',
    mensagem: 'Escola não encontrada',
    solucao: 'Verificar se ID da escola existe e não foi removida'
  },

  // Erros de duplicação
  409: {
    codigo: 'ESCOLA_DUPLICATE_INEP',
    mensagem: 'Código INEP já existe no sistema',
    solucao: 'Usar código INEP único para cada escola'
  },

  // Rate limiting
  429: {
    codigo: 'RATE_LIMIT_EXCEEDED',
    mensagens: {
      consulta: 'Muitas consultas. Tente novamente em 1 minuto.',
      listagem: 'Muitas requisições de listagem. Tente novamente em 1 minuto.',
      criacao: 'Muitas tentativas de criação. Tente novamente em 1 minuto.',
      edicao: 'Muitas tentativas de edição. Tente novamente em 1 minuto.',
      exclusao: 'Muitas tentativas de exclusão. Tente novamente em 1 minuto.'
    },
    limites: {
      consulta: '60 requests/min',
      listagem: '30 requests/min',
      criacao: '10 requests/min',
      edicao: '20 requests/min',
      exclusao: '5 requests/min',
      stats: '30 requests/min'
    }
  }
};

// ============================================================================
// CASOS DE USO POR TIPO DE USUÁRIO
// ============================================================================

export const casosUsoPorUsuario = {

  admin: {
    permissoes: 'Acesso total a todas as escolas',
    operacoes: ['GET /', 'GET /:id', 'GET /:id/detalhes', 'GET /stats', 'POST /', 'PUT /:id', 'DELETE /:id'],
    exemplos: [
      'Consultar qualquer escola do sistema',
      'Criar escolas para qualquer empresa',
      'Atualizar dados de qualquer escola',
      'Remover escolas do sistema',
      'Obter estatísticas globais'
    ]
  },

  gestor: {
    permissoes: 'Acesso a escolas da própria empresa',
    operacoes: ['GET /', 'GET /:id', 'GET /:id/detalhes', 'GET /stats', 'POST /', 'PUT /:id'],
    restricoes: ['Não pode alterar empresa_id', 'Limitado à própria empresa'],
    exemplos: [
      'Listar escolas da empresa gerenciada',
      'Criar novas escolas na própria empresa',
      'Atualizar dados das escolas gerenciadas',
      'Obter estatísticas da empresa'
    ]
  },

  diretor: {
    permissoes: 'Acesso apenas à própria escola',
    operacoes: ['GET /', 'GET /:id', 'GET /:id/detalhes', 'GET /stats', 'PUT /:id'],
    restricoes: ['Apenas dados básicos para edição', 'Limitado à escola vinculada'],
    exemplos: [
      'Consultar dados da própria escola',
      'Atualizar informações de contato',
      'Obter estatísticas da escola',
      'Visualizar contadores de alunos/professores'
    ]
  },

  professor: {
    permissoes: 'Visualização da escola vinculada',
    operacoes: ['GET /', 'GET /:id', 'GET /:id/detalhes'],
    restricoes: ['Apenas consultas', 'Limitado à escola vinculada'],
    exemplos: [
      'Consultar dados da escola onde ensina',
      'Visualizar informações de contato',
      'Ver estatísticas básicas da escola'
    ]
  },

  aluno: {
    permissoes: 'Visualização da escola vinculada',
    operacoes: ['GET /', 'GET /:id', 'GET /:id/detalhes'],
    restricoes: ['Apenas consultas', 'Limitado à escola onde estuda'],
    exemplos: [
      'Consultar dados da escola onde estuda',
      'Visualizar informações de contato',
      'Ver informações básicas da instituição'
    ]
  }
};

export default {
  exemploRotasConsulta,
  exemploRotasGestao,
  exemploRespostas,
  codigosErro,
  casosUsoPorUsuario
};
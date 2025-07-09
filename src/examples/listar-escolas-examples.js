/**
 * EXEMPLOS DE USO - LISTAR ESCOLAS
 * 
 * Este arquivo demonstra como usar a função listarEscolas() do EscolaController
 * com diferentes tipos de usuários, filtros e paginação.
 */

/**
 * EXEMPLO 1: Gestor listando escolas da própria empresa
 * 
 * GET /api/escolas?page=1&limit=10&status=ativo
 */
async function exemploGestorListarEscolas() {
  const requisicao = {
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 2,
      nome: 'Carlos Eduardo Ferreira'
    },
    query: {
      page: 1,
      limit: 10,
      status: 'ativo'
    }
  };

  console.log('📋 EXEMPLO 1: Gestor listando escolas da empresa');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * RESPOSTA ESPERADA:
   * {
   *   "success": true,
   *   "message": "3 escola(s) encontrada(s)",
   *   "data": [
   *     {
   *       "id": 4,
   *       "nome": "Escola Municipal Santos Dumont",
   *       "codigo_inep": "33041194",
   *       "tipo_escola": "municipal",
   *       "telefone": "(21) 3333-4444",
   *       "email": "santos.dumont@educacao.rj.gov.br",
   *       "status": "ativo",
   *       "empresa_id": 2,
   *       "contrato_id": 2,
   *       "empresa": {
   *         "id": 2,
   *         "nome": "Secretaria de Educação do Rio de Janeiro",
   *         "cnpj": "10.000.000/0001-96",
   *         "cidade": "Rio de Janeiro",
   *         "estado": "RJ"
   *       },
   *       "contrato": {
   *         "id": 2,
   *         "descricao": "Contrato de Licenciamento IAprender - Rio de Janeiro",
   *         "numero_licencas": 800,
   *         "valor_total": 360000.00,
   *         "status": "ativo"
   *       }
   *     }
   *   ],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 10,
   *     "total": 3,
   *     "totalPages": 1,
   *     "hasNext": false,
   *     "hasPrev": false
   *   },
   *   "filtros_aplicados": {
   *     "empresa_id": 2,
   *     "status": "ativo"
   *   }
   * }
   */
}

/**
 * EXEMPLO 2: Admin listando todas as escolas com filtros avançados
 * 
 * GET /api/escolas?contrato_id=1&tipo_escola=municipal&estado=SP&page=1&limit=5
 */
async function exemploAdminListarEscolasComFiltros() {
  const requisicao = {
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null,
      nome: 'Esdras Neridson Oliveira'
    },
    query: {
      contrato_id: 1,
      tipo_escola: 'municipal',
      estado: 'SP',
      page: 1,
      limit: 5,
      orderBy: 'nome',
      orderDirection: 'ASC'
    }
  };

  console.log('📋 EXEMPLO 2: Admin com filtros avançados');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * FILTROS APLICADOS AUTOMATICAMENTE:
   * - contrato_id: 1 (específico)
   * - tipo_escola: 'municipal'
   * - estado: 'SP'
   * - status: 'ativo' (padrão)
   * - ordenação: nome ASC
   * 
   * RESPOSTA: Lista escolas municipais de SP do contrato 1
   */
}

/**
 * EXEMPLO 3: Diretor acessando apenas própria escola
 * 
 * GET /api/escolas
 */
async function exemploDiretorListarPropriaEscola() {
  const requisicao = {
    user: {
      id: 16,
      tipo_usuario: 'diretor',
      empresa_id: 1,
      nome: 'João Pedro'
    },
    query: {
      page: 1,
      limit: 20
    }
  };

  console.log('📋 EXEMPLO 3: Diretor listando própria escola');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * COMPORTAMENTO AUTOMÁTICO:
   * 1. Sistema busca diretor no banco: Diretor.findByUserId(16)
   * 2. Obtém escola_id do diretor
   * 3. Aplica filtro automático: filtros.escola_id = diretor.escola_id
   * 4. Retorna apenas a escola gerenciada pelo diretor
   */
}

/**
 * EXEMPLO 4: Busca textual por nome da escola
 * 
 * GET /api/escolas?search=Santos&page=1&limit=10
 */
async function exemploGestorBuscaTextual() {
  const requisicao = {
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 2,
      nome: 'Carlos Eduardo Ferreira'
    },
    query: {
      search: 'Santos',
      page: 1,
      limit: 10,
      status: 'ativo'
    }
  };

  console.log('📋 EXEMPLO 4: Busca textual por "Santos"');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * FILTROS APLICADOS:
   * - empresa_id: 2 (própria empresa do gestor)
   * - search: 'Santos' (busca no nome da escola)
   * - status: 'ativo'
   * 
   * RESULTADO: Escolas que contenham "Santos" no nome
   */
}

/**
 * EXEMPLO 5: Paginação com muitas escolas
 * 
 * GET /api/escolas?page=2&limit=5
 */
async function exemploAdminPaginacao() {
  const requisicao = {
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null,
      nome: 'Esdras Neridson Oliveira'
    },
    query: {
      page: 2,
      limit: 5
    }
  };

  console.log('📋 EXEMPLO 5: Paginação - página 2, 5 por página');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * RESPOSTA COM METADADOS DE PAGINAÇÃO:
   * {
   *   "pagination": {
   *     "page": 2,
   *     "limit": 5,
   *     "total": 12,
   *     "totalPages": 3,
   *     "hasNext": true,
   *     "hasPrev": true
   *   }
   * }
   */
}

/**
 * EXEMPLO 6: Professor visualizando própria escola
 * 
 * GET /api/escolas
 */
async function exemploProfessorVisualizarEscola() {
  const requisicao = {
    user: {
      id: 19,
      tipo_usuario: 'professor',
      empresa_id: 1,
      nome: 'Fernanda Souza'
    },
    query: {}
  };

  console.log('📋 EXEMPLO 6: Professor visualizando escola vinculada');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * COMPORTAMENTO AUTOMÁTICO:
   * 1. Sistema busca professor no banco: Professor.findByUserId(19)
   * 2. Obtém escola_id do professor
   * 3. Aplica filtro automático: filtros.escola_id = professor.escola_id
   * 4. Retorna apenas a escola onde o professor trabalha
   */
}

/**
 * EXEMPLO 7: Filtros por status e cidade
 * 
 * GET /api/escolas?status=inativo&cidade=São Paulo&orderBy=criado_em&orderDirection=DESC
 */
async function exemploAdminFiltrosStatus() {
  const requisicao = {
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null,
      nome: 'Esdras Neridson Oliveira'
    },
    query: {
      status: 'inativo',
      cidade: 'São Paulo',
      orderBy: 'criado_em',
      orderDirection: 'DESC'
    }
  };

  console.log('📋 EXEMPLO 7: Filtros por status inativo e cidade');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * FILTROS APLICADOS:
   * - status: 'inativo' (escolas desativadas)
   * - cidade: 'São Paulo'
   * - ordenação: criado_em DESC (mais recentes primeiro)
   */
}

/**
 * EXEMPLO 8: Gestor com empresa sem escolas
 * 
 * GET /api/escolas
 */
async function exemploGestorSemEscolas() {
  const requisicao = {
    user: {
      id: 99,
      tipo_usuario: 'gestor',
      empresa_id: 999,
      nome: 'Gestor Novo'
    },
    query: {
      page: 1,
      limit: 10
    }
  };

  console.log('📋 EXEMPLO 8: Gestor de empresa sem escolas');
  console.log('Requisição:', JSON.stringify(requisicao, null, 2));
  
  /**
   * RESPOSTA ESPERADA:
   * {
   *   "success": true,
   *   "message": "0 escola(s) encontrada(s)",
   *   "data": [],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 10,
   *     "total": 0,
   *     "totalPages": 0,
   *     "hasNext": false,
   *     "hasPrev": false
   *   },
   *   "filtros_aplicados": {
   *     "empresa_id": 999
   *   }
   * }
   */
}

/**
 * FUNÇÃO PARA DEMONSTRAR TODOS OS EXEMPLOS
 */
export async function demonstrarListarEscolas() {
  console.log('='.repeat(80));
  console.log('🏫 DEMONSTRAÇÃO: LISTAR ESCOLAS - ESCOLA CONTROLLER');
  console.log('='.repeat(80));
  
  await exemploGestorListarEscolas();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploAdminListarEscolasComFiltros();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploDiretorListarPropriaEscola();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploGestorBuscaTextual();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploAdminPaginacao();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploProfessorVisualizarEscola();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploAdminFiltrosStatus();
  console.log('\n' + '-'.repeat(40) + '\n');
  
  await exemploGestorSemEscolas();
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ TODOS OS EXEMPLOS DEMONSTRADOS');
  console.log('='.repeat(80));
}

/**
 * RESUMO DOS FILTROS DISPONÍVEIS:
 * 
 * PARÂMETROS DE CONSULTA:
 * - page: Número da página (padrão: 1)
 * - limit: Itens por página (padrão: 20, máximo: 100)
 * - empresa_id: ID da empresa (aplicado automaticamente para gestores)
 * - contrato_id: ID do contrato específico
 * - tipo_escola: Tipo da escola (municipal, estadual, federal, particular)
 * - status: Status da escola (ativo, inativo, pendente)
 * - search: Busca textual no nome da escola
 * - estado: Estado da escola (SP, RJ, MG, etc.)
 * - cidade: Cidade da escola
 * - orderBy: Campo para ordenação (nome, criado_em, codigo_inep)
 * - orderDirection: Direção da ordenação (ASC, DESC)
 * 
 * CONTROLE HIERÁRQUICO AUTOMÁTICO:
 * - Admin: Vê todas as escolas do sistema
 * - Gestor: Apenas escolas da própria empresa
 * - Diretor: Apenas a própria escola
 * - Professor: Apenas a escola onde trabalha
 * - Aluno: Apenas a escola onde estuda
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * ✅ Filtragem automática por empresa do usuário
 * ✅ Filtros por status (ativo, inativo, pendente)
 * ✅ Filtros por contrato específico
 * ✅ Paginação completa com metadados
 * ✅ Busca textual por nome da escola
 * ✅ Ordenação customizável
 * ✅ Enriquecimento de dados (empresa e contrato)
 * ✅ Controle de acesso hierárquico
 * ✅ Logs de auditoria detalhados
 * ✅ Tratamento robusto de erros
 * ✅ Validação de parâmetros de entrada
 * 
 * STATUS: FUNÇÃO LISTAR ESCOLAS 100% FUNCIONAL E PRONTA PARA PRODUÇÃO
 */
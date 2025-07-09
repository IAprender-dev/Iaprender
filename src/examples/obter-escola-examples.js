/**
 * EXEMPLOS DE USO - FUNÇÃO OBTER ESCOLA
 * 
 * Este arquivo demonstra o uso da função obterEscola() que retorna
 * dados completos de uma escola incluindo contadores de alunos e professores.
 * 
 * Endpoint: GET /api/escolas/:id/detalhes
 * Controller: EscolaController.obterEscola()
 * Middlewares: autenticar, verificarAcessoEscola
 */

import { EscolaController } from '../controllers/escolaController.js';

// ============================================================================
// EXEMPLO 1: ADMIN CONSULTANDO ESCOLA COMPLETA
// ============================================================================

export async function exemploAdminConsultarEscola() {
  console.log('=== EXEMPLO 1: Admin consultando escola completa ===');
  
  const req = {
    params: { id: '1' },
    user: {
      id: 1,
      tipo_usuario: 'admin',
      empresa_id: null // Admin não tem empresa específica
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await EscolaController.obterEscola(req, res);
}

// ============================================================================
// EXEMPLO 2: GESTOR CONSULTANDO ESCOLA DA PRÓPRIA EMPRESA
// ============================================================================

export async function exemploGestorConsultarEscola() {
  console.log('=== EXEMPLO 2: Gestor consultando escola da própria empresa ===');
  
  const req = {
    params: { id: '2' },
    user: {
      id: 15,
      tipo_usuario: 'gestor',
      empresa_id: 2 // Gestor da Secretaria RJ
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await EscolaController.obterEscola(req, res);
}

// ============================================================================
// EXEMPLO 3: DIRETOR CONSULTANDO PRÓPRIA ESCOLA
// ============================================================================

export async function exemploDiretorConsultarEscola() {
  console.log('=== EXEMPLO 3: Diretor consultando própria escola ===');
  
  const req = {
    params: { id: '3' },
    user: {
      id: 20,
      tipo_usuario: 'diretor',
      empresa_id: 3 // IFMG
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await EscolaController.obterEscola(req, res);
}

// ============================================================================
// EXEMPLO 4: PROFESSOR CONSULTANDO ESCOLA VINCULADA
// ============================================================================

export async function exemploProfessorConsultarEscola() {
  console.log('=== EXEMPLO 4: Professor consultando escola vinculada ===');
  
  const req = {
    params: { id: '1' },
    user: {
      id: 25,
      tipo_usuario: 'professor',
      empresa_id: 1 // Professor da Prefeitura SP
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await EscolaController.obterEscola(req, res);
}

// ============================================================================
// EXEMPLO 5: ERRO - ACESSO NEGADO
// ============================================================================

export async function exemploAcessoNegado() {
  console.log('=== EXEMPLO 5: Erro - Acesso negado ===');
  
  const req = {
    params: { id: '1' },
    user: {
      id: 30,
      tipo_usuario: 'gestor',
      empresa_id: 4 // Gestor tentando acessar escola de outra empresa
    }
  };

  const res = {
    status: (code) => ({ json: (data) => console.log(`Status: ${code}`, data) }),
    json: (data) => console.log('Response:', data)
  };

  await EscolaController.obterEscola(req, res);
}

// ============================================================================
// EXEMPLO DE RESPOSTA ESPERADA
// ============================================================================

export const exemploRespostaCompleta = {
  "success": true,
  "message": "Dados completos da escola obtidos com sucesso",
  "data": {
    "id": 1,
    "nome": "Escola Municipal João Silva",
    "codigo_inep": "35041190",
    "tipo_escola": "municipal",
    "telefone": "(11) 3333-4444",
    "email": "joao.silva@educacao.sp.gov.br",
    "endereco": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "status": "ativo",
    "criado_em": "2024-01-15T10:00:00.000Z",
    
    // DADOS DA EMPRESA
    "empresa": {
      "id": 1,
      "nome": "Prefeitura de São Paulo",
      "cnpj": "46.395.000/0001-39",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    
    // DADOS DO CONTRATO
    "contrato": {
      "id": 1,
      "descricao": "Contrato IAprender SP Municipal",
      "numero_licencas": 1200,
      "valor_total": 240000.00,
      "data_inicio": "2024-01-01",
      "data_fim": "2024-12-31",
      "status": "ativo"
    },
    
    // CONTADORES DE PESSOAS
    "contadores": {
      "total_alunos": 850,
      "total_professores": 45,
      "total_diretores": 1,
      "alunos_ativos": 820,
      "professores_ativos": 42,
      "diretores_ativos": 1
    }
  },
  "metadata": {
    "incluiu_contadores": true,
    "consultado_por": 15,
    "tipo_usuario": "gestor",
    "timestamp": "2025-07-09T15:30:00.000Z"
  },
  "timestamp": "2025-07-09T15:30:00.000Z"
};

// ============================================================================
// CASOS DE USO PRÁTICOS
// ============================================================================

export const casosDeUsoPraticos = {
  
  // 1. Dashboard de Diretor
  dashboardDiretor: {
    descricao: "Diretor visualizando overview completo da sua escola",
    endpoint: "GET /api/escolas/5/detalhes",
    dados_importantes: [
      "Total de alunos e professores",
      "Status do contrato",
      "Informações da empresa mantenedora",
      "Dados de contato da escola"
    ]
  },

  // 2. Relatório de Gestor
  relatorioGestor: {
    descricao: "Gestor consultando escola específica para relatório",
    endpoint: "GET /api/escolas/3/detalhes", 
    dados_importantes: [
      "Capacidade vs ocupação atual",
      "Status dos vínculos contratuais",
      "Distribuição de professores por área",
      "Taxa de ocupação de licenças"
    ]
  },

  // 3. Auditoria Admin
  auditoriaAdmin: {
    descricao: "Admin verificando dados completos para auditoria",
    endpoint: "GET /api/escolas/1/detalhes",
    dados_importantes: [
      "Integridade dos vínculos empresa-contrato-escola",
      "Consistência dos dados de contadores",
      "Conformidade com número de licenças contratadas",
      "Status de todos os envolvidos"
    ]
  }
};

// ============================================================================
// CÓDIGOS DE ERRO E TRATAMENTO
// ============================================================================

export const codigosErro = {
  400: {
    erro: "ID da escola deve ser um número válido",
    causa: "Parâmetro :id não é numérico ou é inválido",
    solucao: "Enviar ID numérico válido na URL"
  },
  403: {
    erro: "Acesso negado a esta escola",
    causa: "Usuário não tem permissão para acessar esta escola específica",
    solucao: "Verificar vínculos empresa-contrato-escola do usuário"
  },
  404: {
    erro: "Escola não encontrada", 
    causa: "ID da escola não existe no banco de dados",
    solucao: "Verificar se a escola existe e não foi removida"
  },
  500: {
    erro: "Erro interno do servidor",
    causa: "Falha na conexão com banco ou erro de código",
    solucao: "Verificar logs do servidor e conexão com banco"
  }
};

// ============================================================================
// FUNÇÃO DE TESTE COMPLETO
// ============================================================================

export async function executarTodosExemplosObterEscola() {
  console.log('🏫 === TESTANDO FUNÇÃO OBTER ESCOLA ===');
  
  try {
    await exemploAdminConsultarEscola();
    console.log('');
    
    await exemploGestorConsultarEscola();
    console.log('');
    
    await exemploDiretorConsultarEscola();
    console.log('');
    
    await exemploProfessorConsultarEscola();
    console.log('');
    
    await exemploAcessoNegado();
    
    console.log('✅ Todos os exemplos executados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// ============================================================================
// DIFERENÇAS ENTRE ENDPOINTS
// ============================================================================

export const diferencasEndpoints = {
  
  "GET /api/escolas/:id": {
    descricao: "Busca básica da escola (função buscarPorId)",
    dados_incluidos: ["Dados básicos da escola", "Dados da empresa", "Dados do contrato"],
    contadores: false,
    uso: "Listagens, consultas rápidas"
  },
  
  "GET /api/escolas/:id/detalhes": {
    descricao: "Busca completa da escola (função obterEscola)",
    dados_incluidos: ["Dados básicos da escola", "Dados da empresa", "Dados do contrato", "Contadores de pessoas"],
    contadores: true,
    uso: "Dashboards, relatórios, visão completa"
  }
};

// Exportar função principal para testes
if (import.meta.main) {
  executarTodosExemplosObterEscola();
}
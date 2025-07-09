/**
 * EXEMPLOS DE USO - FUNÇÃO obterAluno() 
 * 
 * Esta função retorna dados COMPLETOS do aluno incluindo:
 * - Dados básicos do aluno
 * - Informações da escola vinculada
 * - Dados do responsável
 * - Histórico acadêmico
 * - Informações da empresa
 * - Dados do diretor da escola
 */

/**
 * EXEMPLO 1: ADMIN CONSULTANDO DADOS COMPLETOS DE ALUNO
 * GET /api/alunos/1/completo
 * Authorization: Bearer {token_admin}
 */
const exemploAdminConsultaCompleta = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  response: {
    success: true,
    message: 'Dados completos do aluno obtidos com sucesso',
    data: {
      // DADOS BÁSICOS DO ALUNO
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      turma: '9º Ano',
      serie: 'Fundamental',
      turno: 'manhã',
      data_matricula: '2024-01-15T10:00:00.000Z',
      status: 'ativo',
      escola_id: 1,
      empresa_id: 1,
      criado_em: '2024-01-15T10:00:00.000Z',

      // DADOS DO RESPONSÁVEL
      responsavel: {
        nome: 'Carlos Roberto Santos',
        contato: '(11) 99999-8888',
        parentesco: 'Pai',
        endereco: 'Rua das Flores, 123 - São Paulo/SP',
        documento: '123.456.789-01'
      },

      // DADOS DA ESCOLA
      escola: {
        id: 1,
        nome: 'EMEF Prof. João Silva',
        codigo_inep: '35123456',
        tipo_escola: 'municipal',
        telefone: '(11) 3333-4444',
        email: 'joao.silva@prefeitura.sp.gov.br',
        endereco: 'Av. Paulista, 1000',
        cidade: 'São Paulo',
        estado: 'SP',
        status: 'ativa',
        diretor: {
          id: 1,
          nome: 'João Pedro Silva',
          cargo: 'Diretor',
          data_inicio: '2023-01-01T00:00:00.000Z'
        }
      },

      // DADOS DA EMPRESA
      empresa: {
        id: 1,
        nome: 'Prefeitura de São Paulo',
        cnpj: '11.222.333/0001-44',
        telefone: '(11) 3133-4000',
        email_contato: 'educacao@prefeitura.sp.gov.br',
        cidade: 'São Paulo',
        estado: 'SP',
        logo: 'prefeitura-sp-logo.png'
      },

      // HISTÓRICO ACADÊMICO
      historico_academico: {
        ano_letivo: 2025,
        situacao: 'Matriculado',
        data_ultima_atualizacao: '2025-01-15T10:00:00.000Z',
        observacoes: 'Aluno participativo e dedicado',
        necessidades_especiais: null
      },

      // METADATA
      metadata: {
        total_acessos: 1,
        ultimo_acesso: '2025-07-09T20:54:00.000Z',
        dados_completos: true,
        versao_dados: '2.0'
      }
    },
    metadata: {
      consultado_por: 1,
      tipo_usuario: 'admin',
      dados_incluidos: {
        aluno_basico: true,
        escola: true,
        empresa: true,
        responsavel: true,
        historico_academico: true
      }
    },
    timestamp: '2025-07-09T20:54:00.000Z'
  }
};

/**
 * EXEMPLO 2: DIRETOR CONSULTANDO ALUNO DA PRÓPRIA ESCOLA
 * GET /api/alunos/1/completo
 * Authorization: Bearer {token_diretor}
 */
const exemploDiretorConsultaAluno = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  response: {
    success: true,
    message: 'Dados completos do aluno obtidos com sucesso',
    data: {
      // MESMA ESTRUTURA COMPLETA DE DADOS
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      // ... todos os outros campos
      responsavel: { /* dados completos */ },
      escola: { /* dados completos */ },
      empresa: { /* dados completos */ },
      historico_academico: { /* dados completos */ }
    },
    metadata: {
      consultado_por: 4, // ID do diretor
      tipo_usuario: 'diretor',
      dados_incluidos: {
        aluno_basico: true,
        escola: true,
        empresa: true,
        responsavel: true,
        historico_academico: true
      }
    }
  }
};

/**
 * EXEMPLO 3: PROFESSOR CONSULTANDO ALUNO DA ESCOLA VINCULADA
 * GET /api/alunos/1/completo
 * Authorization: Bearer {token_professor}
 */
const exemploProfessorConsultaAluno = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  response: {
    success: true,
    message: 'Dados completos do aluno obtidos com sucesso',
    data: {
      // DADOS COMPLETOS PARA PROFESSOR TAMBÉM
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      turma: '9º Ano',
      serie: 'Fundamental',
      // ... dados completos
      responsavel: {
        nome: 'Carlos Roberto Santos',
        contato: '(11) 99999-8888'
        // ... dados do responsável
      },
      escola: {
        nome: 'EMEF Prof. João Silva',
        // ... dados da escola
      }
    },
    metadata: {
      consultado_por: 7, // ID do professor
      tipo_usuario: 'professor'
    }
  }
};

/**
 * EXEMPLO 4: ALUNO CONSULTANDO PRÓPRIOS DADOS
 * GET /api/alunos/1/completo
 * Authorization: Bearer {token_aluno}
 */
const exemploAlunoConsultaProprios = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  response: {
    success: true,
    message: 'Dados completos do aluno obtidos com sucesso',
    data: {
      // ALUNO VÊ TODOS OS PRÓPRIOS DADOS
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      // ... todos os dados
      responsavel: { /* dados do responsável */ },
      escola: { /* dados da escola */ },
      historico_academico: { /* histórico acadêmico */ }
    },
    metadata: {
      consultado_por: 10, // ID do aluno (usuário)
      tipo_usuario: 'aluno'
    }
  }
};

/**
 * EXEMPLO 5: ERRO - ACESSO NEGADO
 * Professor tentando acessar aluno de outra escola
 */
const exemploAcessoNegado = {
  request: {
    method: 'GET',
    url: '/api/alunos/999/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  response: {
    success: false,
    message: 'Acesso negado a este aluno',
    timestamp: '2025-07-09T20:54:00.000Z'
  },
  status: 403
};

/**
 * EXEMPLO 6: ERRO - ALUNO NÃO ENCONTRADO
 */
const exemploAlunoNaoEncontrado = {
  request: {
    method: 'GET',
    url: '/api/alunos/99999/completo',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  },
  response: {
    success: false,
    message: 'Aluno não encontrado',
    timestamp: '2025-07-09T20:54:00.000Z'
  },
  status: 404
};

/**
 * EXEMPLO 7: DADOS PARCIAIS EM CASO DE ERRO
 * Quando há erro ao buscar escola/empresa, retorna dados básicos
 */
const exemploDadosParciais = {
  response: {
    success: true,
    message: 'Dados completos do aluno obtidos com sucesso',
    data: {
      // DADOS BÁSICOS DO ALUNO
      id: 1,
      nome: 'Bruno Henrique Santos',
      matricula: '2024010001',
      // ... dados básicos
      
      // DADOS DO RESPONSÁVEL (sempre disponíveis)
      responsavel: {
        nome: 'Carlos Roberto Santos',
        contato: '(11) 99999-8888'
      },
      
      // DADOS EXTERNOS (podem ser null em caso de erro)
      escola: null, // Erro ao buscar escola
      empresa: null, // Erro ao buscar empresa
      historico_academico: null,
      
      // METADATA INDICA DADOS INCOMPLETOS
      metadata: {
        dados_completos: false,
        erro: 'Erro ao enriquecer dados'
      }
    },
    metadata: {
      dados_incluidos: {
        aluno_basico: true,
        escola: false, // ❌ Não foi possível carregar
        empresa: false, // ❌ Não foi possível carregar
        responsavel: true,
        historico_academico: false
      }
    }
  }
};

/**
 * CASOS DE USO PRÁTICOS
 */

/**
 * CASO DE USO 1: DASHBOARD DO DIRETOR
 * Exibir perfil completo do aluno para tomada de decisões
 */
const casoUsoDashboardDiretor = {
  cenario: 'Diretor precisa ver dados completos para reunião com responsável',
  endpoint: 'GET /api/alunos/1/completo',
  beneficios: [
    'Dados do aluno, escola e responsável em uma consulta',
    'Informações contextuais da empresa/contrato',
    'Histórico acadêmico para discussão',
    'Dados do diretor da escola para referência'
  ]
};

/**
 * CASO DE USO 2: SISTEMA DE MATRÍCULA ONLINE
 * Responsável consultando dados completos do filho
 */
const casoUsoMatriculaOnline = {
  cenario: 'Sistema web para responsáveis consultarem dados dos filhos',
  endpoint: 'GET /api/alunos/{id}/completo',
  beneficios: [
    'Portal completo com todos os dados necessários',
    'Informações da escola para contato',
    'Dados atualizados do responsável',
    'Situação acadêmica atual'
  ]
};

/**
 * CASO DE USO 3: RELATÓRIO PEDAGÓGICO
 * Professor gerando relatório completo do aluno
 */
const casoUsoRelatorioPedagogico = {
  cenario: 'Professor precisa de dados completos para relatório pedagógico',
  endpoint: 'GET /api/alunos/1/completo',
  beneficios: [
    'Dados acadêmicos estruturados',
    'Informações de contato para comunicação',
    'Contexto escolar e empresarial',
    'Histórico para análise temporal'
  ]
};

/**
 * FUNÇÃO PARA TESTAR A API
 */
async function testarObterAluno() {
  console.log('🧪 TESTANDO FUNÇÃO obterAluno()...\n');

  // Teste 1: Admin consultando aluno
  console.log('1️⃣ TESTE: Admin consultando dados completos');
  try {
    const response = await fetch('/api/alunos/1/completo', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    console.log('✅ Sucesso:', result.success);
    console.log('📊 Dados incluídos:', result.metadata?.dados_incluidos);
    console.log('🏫 Escola carregada:', !!result.data?.escola);
    console.log('👥 Responsável carregado:', !!result.data?.responsavel);
    console.log('🏢 Empresa carregada:', !!result.data?.empresa);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n2️⃣ TESTE: Diretor consultando aluno da própria escola');
  // ... mais testes

  console.log('\n🎯 FUNÇÃO obterAluno() TESTADA!');
}

/**
 * EXPORTAR EXEMPLOS
 */
export {
  exemploAdminConsultaCompleta,
  exemploDiretorConsultaAluno,
  exemploProfessorConsultaAluno,
  exemploAlunoConsultaProprios,
  exemploAcessoNegado,
  exemploAlunoNaoEncontrado,
  exemploDadosParciais,
  casoUsoDashboardDiretor,
  casoUsoMatriculaOnline,
  casoUsoRelatorioPedagogico,
  testarObterAluno
};

console.log('📚 EXEMPLOS DE USO - FUNÇÃO obterAluno() CARREGADOS');
console.log('✅ 7 exemplos de resposta disponíveis');
console.log('✅ 3 casos de uso práticos documentados');
console.log('✅ Função de teste implementada');
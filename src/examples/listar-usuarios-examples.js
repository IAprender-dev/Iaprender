/**
 * Exemplos específicos da função listarUsuarios()
 * Demonstra filtros, paginação e controle de acesso por empresa
 */

/**
 * EXEMPLO 1: Listagem básica com paginação
 */
export const exemploListagemBasica = {
  request: {
    method: 'GET',
    url: '/api/usuarios?page=1&limit=10',
    headers: {
      'Authorization': 'Bearer gestor_token_123'
    }
  },
  response: {
    success: true,
    timestamp: '2025-07-09T21:30:00.000Z',
    message: '10 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 15,
          cognito_sub: 'sub-123',
          email: 'fernanda@escola.edu.br',
          nome: 'Fernanda Silva Souza',
          telefone: '(11) 9999-1111',
          endereco: 'Rua Nova, 200',
          cidade: 'São Paulo',
          estado: 'SP',
          documento: '12345678901',
          tipo_usuario: 'professor',
          empresa_id: 1,
          status: 'ativo',
          ultimo_login: '2025-07-09T20:30:00.000Z',
          criado_em: '2025-07-01T10:00:00.000Z',
          atualizado_em: '2025-07-09T21:00:00.000Z'
        }
        // ... mais usuários
      ],
      paginacao: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
        nextPage: 2,
        prevPage: null
      },
      filtros_aplicados: {
        empresa_id: 1,
        ordem_por: 'nome',
        ordem_direcao: 'ASC'
      },
      metadata: {
        empresa_id: 1,
        solicitado_por: 10,
        tipo_solicitante: 'gestor',
        timestamp: '2025-07-09T21:30:00.000Z',
        dados_especificos_incluidos: false
      }
    }
  }
};

/**
 * EXEMPLO 2: Filtro por tipo de usuário com dados específicos
 */
export const exemploFiltroTipoUsuario = {
  request: {
    method: 'GET',
    url: '/api/usuarios?tipo_usuario=professor&include_dados_especificos=true',
    headers: {
      'Authorization': 'Bearer gestor_token_123'
    }
  },
  response: {
    success: true,
    message: '3 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 15,
          nome: 'Fernanda Silva Souza',
          email: 'fernanda@escola.edu.br',
          tipo_usuario: 'professor',
          empresa_id: 1,
          status: 'ativo',
          dados_especificos: {
            disciplinas: ['Matemática', 'Física', 'Química'],
            formacao: 'Mestrado em Matemática Aplicada',
            escola_id: 1,
            data_admissao: '2025-02-01T00:00:00.000Z'
          }
        },
        {
          id: 16,
          nome: 'Lucas Gabriel Santos',
          email: 'lucas@escola.edu.br',
          tipo_usuario: 'professor',
          empresa_id: 1,
          status: 'ativo',
          dados_especificos: {
            disciplinas: ['Português', 'Literatura'],
            formacao: 'Licenciatura em Letras',
            escola_id: 1,
            data_admissao: '2025-03-01T00:00:00.000Z'
          }
        }
      ],
      paginacao: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null
      },
      filtros_aplicados: {
        empresa_id: 1,
        tipo_usuario: ['professor'],
        ordem_por: 'nome',
        ordem_direcao: 'ASC'
      },
      metadata: {
        dados_especificos_incluidos: true
      }
    }
  }
};

/**
 * EXEMPLO 3: Busca textual por nome ou email
 */
export const exemploBuscaTextual = {
  request: {
    method: 'GET',
    url: '/api/usuarios?busca=maria&page=1&limit=20',
    headers: {
      'Authorization': 'Bearer gestor_token_123'
    }
  },
  response: {
    success: true,
    message: '2 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 10,
          nome: 'Maria Silva Santos',
          email: 'maria@prefeitura.gov.br',
          tipo_usuario: 'gestor',
          empresa_id: 1,
          status: 'ativo'
        },
        {
          id: 25,
          nome: 'Ana Maria Costa',
          email: 'anamaria@escola.edu.br',
          tipo_usuario: 'aluno',
          empresa_id: 1,
          status: 'ativo'
        }
      ],
      filtros_aplicados: {
        empresa_id: 1,
        busca: 'maria',
        ordem_por: 'nome',
        ordem_direcao: 'ASC'
      }
    }
  }
};

/**
 * EXEMPLO 4: Filtros múltiplos combinados
 */
export const exemploFiltrosMultiplos = {
  request: {
    method: 'GET',
    url: '/api/usuarios?tipo_usuario=professor,aluno&status=ativo&ordem_por=criado_em&ordem_direcao=desc',
    headers: {
      'Authorization': 'Bearer gestor_token_123'
    }
  },
  response: {
    success: true,
    message: '8 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 20,
          nome: 'Bruno Henrique Silva',
          email: 'bruno@escola.edu.br',
          tipo_usuario: 'aluno',
          empresa_id: 1,
          status: 'ativo',
          criado_em: '2025-07-05T14:30:00.000Z'
        },
        {
          id: 15,
          nome: 'Fernanda Silva Souza',
          email: 'fernanda@escola.edu.br',
          tipo_usuario: 'professor',
          empresa_id: 1,
          status: 'ativo',
          criado_em: '2025-07-01T10:00:00.000Z'
        }
      ],
      filtros_aplicados: {
        empresa_id: 1,
        tipo_usuario: ['professor', 'aluno'],
        status: 'ativo',
        ordem_por: 'criado_em',
        ordem_direcao: 'DESC'
      }
    }
  }
};

/**
 * EXEMPLO 5: Filtro por período de criação
 */
export const exemploFiltroPeriodo = {
  request: {
    method: 'GET',
    url: '/api/usuarios?data_inicio=2025-07-01&data_fim=2025-07-31&ordem_por=criado_em&ordem_direcao=desc',
    headers: {
      'Authorization': 'Bearer gestor_token_123'
    }
  },
  response: {
    success: true,
    message: '5 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 25,
          nome: 'Usuário Recente',
          email: 'recente@escola.edu.br',
          tipo_usuario: 'aluno',
          empresa_id: 1,
          status: 'ativo',
          criado_em: '2025-07-15T09:00:00.000Z'
        }
      ],
      filtros_aplicados: {
        empresa_id: 1,
        data_inicio: '2025-07-01T00:00:00.000Z',
        data_fim: '2025-07-31T23:59:59.999Z',
        ordem_por: 'criado_em',
        ordem_direcao: 'DESC'
      }
    }
  }
};

/**
 * EXEMPLO 6: Admin listando usuários de empresa específica
 */
export const exemploAdminEmpresaEspecifica = {
  request: {
    method: 'GET',
    url: '/api/usuarios?empresa_id=2&page=1&limit=15',
    headers: {
      'Authorization': 'Bearer admin_token_123'
    }
  },
  response: {
    success: true,
    message: '12 usuários encontrados',
    data: {
      usuarios: [
        {
          id: 30,
          nome: 'Gestor Empresa 2',
          email: 'gestor@empresa2.com',
          tipo_usuario: 'gestor',
          empresa_id: 2,
          status: 'ativo'
        }
      ],
      filtros_aplicados: {
        empresa_id: 2, // Admin pode especificar empresa diferente
        ordem_por: 'nome',
        ordem_direcao: 'ASC'
      },
      metadata: {
        empresa_id: null, // Admin não tem empresa específica
        solicitado_por: 1,
        tipo_solicitante: 'admin'
      }
    }
  }
};

/**
 * EXEMPLO 7: Parâmetros de filtros disponíveis
 */
export const parametrosFiltros = {
  paginacao: {
    page: 'Número da página (padrão: 1)',
    limit: 'Registros por página (padrão: 20, máximo: 100)'
  },
  filtros: {
    empresa_id: 'ID da empresa (admin pode especificar, gestor usa própria)',
    tipo_usuario: 'Tipo(s) de usuário: admin, gestor, diretor, professor, aluno (pode ser lista separada por vírgula)',
    status: 'Status: ativo, inativo, pendente, bloqueado',
    busca: 'Busca textual por nome ou email (case-insensitive)',
    data_inicio: 'Data de criação inicial (formato ISO)',
    data_fim: 'Data de criação final (formato ISO)'
  },
  ordenacao: {
    ordem_por: 'Campo de ordenação: nome, email, tipo_usuario, criado_em, ultimo_login (padrão: nome)',
    ordem_direcao: 'Direção: asc, desc (padrão: asc)'
  },
  dados_especificos: {
    include_dados_especificos: 'true/false - Incluir dados específicos do tipo de usuário'
  }
};

/**
 * EXEMPLO 8: Controle de acesso por tipo de usuário
 */
export const controleAcessoPorTipo = {
  admin: {
    descricao: 'Administrador - Acesso total',
    filtros_permitidos: 'Todos os filtros disponíveis',
    empresa_id: 'Pode especificar qualquer empresa ou deixar em branco para ver todas',
    observacao: 'Não tem empresa_id própria no req.user'
  },
  gestor: {
    descricao: 'Gestor - Limitado à própria empresa',
    filtros_permitidos: 'Todos exceto empresa_id (forçada para empresa do usuário)',
    empresa_id: 'Automaticamente filtrado pela empresa do usuário',
    observacao: 'req.user.empresa_id sempre aplicado'
  },
  diretor: {
    descricao: 'Diretor - Acesso negado',
    filtros_permitidos: 'Não tem acesso a este endpoint',
    empresa_id: 'N/A',
    observacao: 'Middleware adminOuGestor bloqueia acesso'
  },
  professor: {
    descricao: 'Professor - Acesso negado',
    filtros_permitidos: 'Não tem acesso a este endpoint',
    empresa_id: 'N/A',
    observacao: 'Middleware adminOuGestor bloqueia acesso'
  },
  aluno: {
    descricao: 'Aluno - Acesso negado',
    filtros_permitidos: 'Não tem acesso a este endpoint',
    empresa_id: 'N/A',
    observacao: 'Middleware adminOuGestor bloqueia acesso'
  }
};

/**
 * EXEMPLO 9: Casos de uso práticos
 */
export const casosDeUsoPraticos = {
  dashboard_gestao: {
    descricao: 'Dashboard de gestão de usuários',
    exemplo: `
// Frontend - Carregar usuários com paginação
const carregarUsuarios = async (page = 1, filtros = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...filtros
  });

  const response = await fetch(\`/api/usuarios?\${params}\`, {
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });

  const result = await response.json();
  return result.data;
};

// Usar com filtros
const usuarios = await carregarUsuarios(1, {
  tipo_usuario: 'professor,aluno',
  status: 'ativo',
  busca: 'maria'
});
    `
  },
  
  relatorio_usuarios: {
    descricao: 'Relatório de usuários por tipo',
    exemplo: `
// Carregar todos os professores com dados específicos
const professores = await fetch('/api/usuarios?tipo_usuario=professor&include_dados_especificos=true&limit=100', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});

// Gerar relatório
const relatorio = professores.data.usuarios.map(prof => ({
  nome: prof.nome,
  email: prof.email,
  disciplinas: prof.dados_especificos?.disciplinas || [],
  escola: prof.dados_especificos?.escola_id,
  admissao: prof.dados_especificos?.data_admissao
}));
    `
  },

  busca_avancada: {
    descricao: 'Sistema de busca avançada',
    exemplo: `
// Componente de busca com filtros múltiplos
const BuscaAvancada = () => {
  const [filtros, setFiltros] = useState({
    busca: '',
    tipo_usuario: [],
    status: 'ativo',
    data_inicio: '',
    data_fim: ''
  });

  const buscarUsuarios = async () => {
    const params = Object.entries(filtros)
      .filter(([_, value]) => value && value.length > 0)
      .reduce((acc, [key, value]) => {
        acc[key] = Array.isArray(value) ? value.join(',') : value;
        return acc;
      }, {});

    const response = await fetch(\`/api/usuarios?\${new URLSearchParams(params)}\`);
    return response.json();
  };
};
    `
  }
};

/**
 * EXEMPLO 10: Tratamento de erros específicos
 */
export const exemplosTratamentoErros = {
  sem_permissao: {
    codigo: 403,
    message: 'Acesso negado',
    cenario: 'Usuário diretor/professor/aluno tentando acessar endpoint'
  },
  empresa_invalida: {
    codigo: 400,
    message: 'Empresa não encontrada',
    cenario: 'Admin especificou empresa_id que não existe'
  },
  parametros_invalidos: {
    codigo: 400,
    message: 'Parâmetros de paginação inválidos',
    cenario: 'page ou limit com valores inválidos'
  },
  limite_excedido: {
    codigo: 400,
    message: 'Limite máximo de 100 registros por página',
    cenario: 'limit > 100'
  }
};

/**
 * EXEMPLO 11: Comparação de performance
 */
export const comparacaoPerformance = {
  sem_dados_especificos: {
    descricao: 'Consulta básica sem dados específicos',
    query_count: 2, // usuarios + count
    tempo_estimado: '50-100ms',
    uso_memoria: 'Baixo',
    caso_uso: 'Listagem rápida, tabelas, dropdowns'
  },
  com_dados_especificos: {
    descricao: 'Consulta com dados específicos enriquecidos',
    query_count: '2 + N (onde N = número de usuários)',
    tempo_estimado: '200-500ms',
    uso_memoria: 'Médio/Alto',
    caso_uso: 'Relatórios detalhados, perfis completos'
  }
};

/**
 * FUNÇÃO PRINCIPAL DE DEMONSTRAÇÃO
 */
export function demonstrarListarUsuarios() {
  console.log('📋 DEMONSTRAÇÃO DA FUNÇÃO listarUsuarios()');
  console.log('==============================================');

  console.log('\n🔍 Filtros Disponíveis:');
  console.log('• Empresa: Automática para gestores, configurável para admins');
  console.log('• Tipo de usuário: admin, gestor, diretor, professor, aluno');
  console.log('• Status: ativo, inativo, pendente, bloqueado');
  console.log('• Busca textual: nome ou email (case-insensitive)');
  console.log('• Período: data_inicio e data_fim');
  console.log('• Ordenação: nome, email, tipo_usuario, criado_em, ultimo_login');

  console.log('\n📄 Paginação:');
  console.log('• Page: número da página (padrão: 1)');
  console.log('• Limit: registros por página (padrão: 20, máximo: 100)');
  console.log('• Metadados: total, totalPages, hasNext, hasPrev');

  console.log('\n🔒 Controle de Acesso:');
  console.log('• Admin: Pode ver usuários de qualquer empresa');
  console.log('• Gestor: Limitado à própria empresa');
  console.log('• Diretor/Professor/Aluno: Acesso negado');

  console.log('\n📊 Dados Específicos (Opcional):');
  console.log('• Professor: disciplinas, formação, escola_id, data_admissao');
  console.log('• Aluno: matrícula, turma, série, responsável');
  console.log('• Diretor: escola_id, cargo, data_inicio');
  console.log('• Gestor: cargo, data_admissao');

  console.log('\n⚡ Performance:');
  console.log('• Consultas otimizadas com prepared statements');
  console.log('• Filtragem no banco de dados (não em memória)');
  console.log('• Dados específicos carregados sob demanda');
  console.log('• Limite máximo de 100 registros por consulta');

  return {
    exemplos: {
      basico: exemploListagemBasica,
      filtroTipo: exemploFiltroTipoUsuario,
      busca: exemploBuscaTextual,
      multiplos: exemploFiltrosMultiplos,
      periodo: exemploFiltroPeriodo,
      admin: exemploAdminEmpresaEspecifica
    },
    parametros: parametrosFiltros,
    controleAcesso: controleAcessoPorTipo,
    casosDeUso: casosDeUsoPraticos,
    tratamentoErros: exemplosTratamentoErros,
    performance: comparacaoPerformance
  };
}

export default {
  exemploListagemBasica,
  exemploFiltroTipoUsuario,
  exemploBuscaTextual,
  exemploFiltrosMultiplos,
  exemploFiltroPeriodo,
  exemploAdminEmpresaEspecifica,
  parametrosFiltros,
  controleAcessoPorTipo,
  casosDeUsoPraticos,
  exemplosTratamentoErros,
  comparacaoPerformance,
  demonstrarListarUsuarios
};
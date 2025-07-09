/**
 * Exemplos específicos da função criarUsuario()
 * Demonstra validações, controle de acesso e criação de registros específicos
 */

/**
 * EXEMPLO 1: Criação básica de professor por gestor
 */
export const exemploCriacaoBasica = {
  request: {
    method: 'POST',
    url: '/api/usuarios',
    headers: {
      'Authorization': 'Bearer gestor_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      cognito_sub: 'prof-sub-456',
      email: 'professor@escola.edu.br',
      nome: 'Ana Silva Santos',
      tipo_usuario: 'professor',
      telefone: '(11) 9999-1111',
      documento: '123.456.789-01'
    }
  },
  response: {
    success: true,
    timestamp: '2025-07-09T22:00:00.000Z',
    message: 'Usuário criado com sucesso',
    data: {
      id: 25,
      cognito_sub: 'prof-sub-456',
      email: 'professor@escola.edu.br',
      nome: 'Ana Silva Santos',
      telefone: '(11) 9999-1111',
      endereco: null,
      cidade: null,
      estado: null,
      data_nascimento: null,
      documento: '12345678901',
      tipo_usuario: 'professor',
      empresa_id: 1,
      status: 'ativo',
      ultimo_login: null,
      criado_em: '2025-07-09T22:00:00.000Z',
      atualizado_em: '2025-07-09T22:00:00.000Z',
      configuracoes: {},
      metadata: {
        criado_por: 10,
        tipo_criador: 'gestor',
        empresa_atribuida: 1,
        timestamp: '2025-07-09T22:00:00.000Z',
        registros_especificos_criados: []
      }
    }
  }
};

/**
 * EXEMPLO 2: Criação de professor com dados específicos
 */
export const exemploProfessorCompleto = {
  request: {
    method: 'POST',
    url: '/api/usuarios',
    headers: {
      'Authorization': 'Bearer gestor_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      cognito_sub: 'prof-matematica-789',
      email: 'matematica@escola.edu.br',
      nome: 'Carlos Eduardo Silva',
      tipo_usuario: 'professor',
      telefone: '(11) 8888-7777',
      endereco: 'Rua das Acácias, 150',
      cidade: 'São Paulo',
      estado: 'SP',
      documento: '987.654.321-00',
      disciplinas: ['Matemática', 'Física', 'Química'],
      formacao: 'Mestrado em Matemática Aplicada',
      escola_id: 1,
      data_admissao: '2025-07-09'
    }
  },
  response: {
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      id: 26,
      cognito_sub: 'prof-matematica-789',
      email: 'matematica@escola.edu.br',
      nome: 'Carlos Eduardo Silva',
      tipo_usuario: 'professor',
      empresa_id: 1,
      status: 'ativo',
      metadata: {
        criado_por: 10,
        tipo_criador: 'gestor',
        empresa_atribuida: 1,
        registros_especificos_criados: ['disciplinas', 'formacao', 'escola_id', 'data_admissao']
      }
    }
  }
};

/**
 * EXEMPLO 3: Criação de aluno com dados completos
 */
export const exemploAlunoCompleto = {
  request: {
    method: 'POST',
    url: '/api/usuarios',
    headers: {
      'Authorization': 'Bearer gestor_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      cognito_sub: 'aluno-9ano-456',
      email: 'joao.silva@escola.edu.br',
      nome: 'João Pedro Silva',
      tipo_usuario: 'aluno',
      telefone: '(11) 7777-6666',
      endereco: 'Avenida Paulista, 1000',
      cidade: 'São Paulo',
      estado: 'SP',
      data_nascimento: '2010-05-15',
      documento: '12345678900',
      matricula: '2025001',
      turma: '9A',
      serie: '9º Ano',
      turno: 'manhã',
      nome_responsavel: 'Maria Silva Santos',
      contato_responsavel: '(11) 9999-0000',
      escola_id: 1,
      data_matricula: '2025-02-01'
    }
  },
  response: {
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      id: 27,
      cognito_sub: 'aluno-9ano-456',
      email: 'joao.silva@escola.edu.br',
      nome: 'João Pedro Silva',
      tipo_usuario: 'aluno',
      empresa_id: 1,
      status: 'ativo',
      metadata: {
        criado_por: 10,
        tipo_criador: 'gestor',
        empresa_atribuida: 1,
        registros_especificos_criados: [
          'matricula', 'turma', 'serie', 'turno', 
          'nome_responsavel', 'contato_responsavel', 'escola_id', 'data_matricula'
        ]
      }
    }
  }
};

/**
 * EXEMPLO 4: Admin criando gestor em empresa específica
 */
export const exemploAdminCriandoGestor = {
  request: {
    method: 'POST',
    url: '/api/usuarios',
    headers: {
      'Authorization': 'Bearer admin_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      cognito_sub: 'gestor-empresa2-123',
      email: 'gestor@empresa2.com',
      nome: 'Patricia Lima Santos',
      tipo_usuario: 'gestor',
      telefone: '(21) 9999-8888',
      endereco: 'Rua Copacabana, 500',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      documento: '111.222.333-44',
      empresa_id: 2, // Admin pode especificar empresa
      cargo: 'Gestora de Educação Municipal',
      data_admissao: '2025-07-09'
    }
  },
  response: {
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      id: 28,
      cognito_sub: 'gestor-empresa2-123',
      email: 'gestor@empresa2.com',
      nome: 'Patricia Lima Santos',
      tipo_usuario: 'gestor',
      empresa_id: 2,
      status: 'ativo',
      metadata: {
        criado_por: 1,
        tipo_criador: 'admin',
        empresa_atribuida: 2,
        registros_especificos_criados: ['cargo', 'data_admissao']
      }
    }
  }
};

/**
 * EXEMPLO 5: Criação de diretor com vinculação à escola
 */
export const exemploDirectorEscola = {
  request: {
    method: 'POST',
    url: '/api/usuarios',
    headers: {
      'Authorization': 'Bearer admin_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      cognito_sub: 'diretor-escola1-789',
      email: 'diretor@escola1.edu.br',
      nome: 'Roberto Carlos Lima',
      tipo_usuario: 'diretor',
      telefone: '(11) 6666-5555',
      documento: '555.666.777-88',
      empresa_id: 1,
      escola_id: 1,
      cargo: 'Diretor Geral',
      data_inicio: '2025-01-15'
    }
  },
  response: {
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      id: 29,
      cognito_sub: 'diretor-escola1-789',
      email: 'diretor@escola1.edu.br',
      nome: 'Roberto Carlos Lima',
      tipo_usuario: 'diretor',
      empresa_id: 1,
      status: 'ativo',
      metadata: {
        criado_por: 1,
        tipo_criador: 'admin',
        empresa_atribuida: 1,
        registros_especificos_criados: ['escola_id', 'cargo', 'data_inicio']
      }
    }
  }
};

/**
 * EXEMPLO 6: Validações e erros comuns
 */
export const exemploValidacoes = {
  campos_obrigatorios: {
    request: {
      body: {
        // Faltando cognito_sub, email, nome, tipo_usuario
        telefone: '(11) 9999-8888'
      }
    },
    response: {
      success: false,
      message: 'Campos obrigatórios não fornecidos: cognito_sub, email, nome, tipo_usuario',
      code: 400
    }
  },

  email_duplicado: {
    request: {
      body: {
        cognito_sub: 'novo-sub-123',
        email: 'existente@escola.edu.br', // Email já existe
        nome: 'Novo Usuario',
        tipo_usuario: 'professor'
      }
    },
    response: {
      success: false,
      message: 'Já existe um usuário com o email: existente@escola.edu.br',
      code: 409
    }
  },

  cognito_sub_duplicado: {
    request: {
      body: {
        cognito_sub: 'sub-existente-456', // Cognito_sub já existe
        email: 'novo@escola.edu.br',
        nome: 'Novo Usuario',
        tipo_usuario: 'professor'
      }
    },
    response: {
      success: false,
      message: 'Já existe um usuário com o Cognito Sub: sub-existente-456',
      code: 409
    }
  },

  tipo_usuario_invalido: {
    request: {
      body: {
        cognito_sub: 'novo-sub-789',
        email: 'novo@escola.edu.br',
        nome: 'Novo Usuario',
        tipo_usuario: 'tipo_inexistente'
      }
    },
    response: {
      success: false,
      message: 'Tipo de usuário inválido. Tipos válidos: admin, gestor, diretor, professor, aluno',
      code: 400
    }
  },

  gestor_criando_admin: {
    request: {
      headers: {
        'Authorization': 'Bearer gestor_token_123'
      },
      body: {
        cognito_sub: 'novo-admin-123',
        email: 'admin@escola.edu.br',
        nome: 'Novo Admin',
        tipo_usuario: 'admin'
      }
    },
    response: {
      success: false,
      message: 'Gestores podem criar apenas: diretor, professor, aluno',
      code: 400
    }
  },

  empresa_inexistente: {
    request: {
      headers: {
        'Authorization': 'Bearer admin_token_123'
      },
      body: {
        cognito_sub: 'novo-sub-123',
        email: 'novo@escola.edu.br',
        nome: 'Novo Usuario',
        tipo_usuario: 'professor',
        empresa_id: 999 // Empresa não existe
      }
    },
    response: {
      success: false,
      message: 'Empresa especificada não encontrada',
      code: 400
    }
  },

  gestor_empresa_diferente: {
    request: {
      headers: {
        'Authorization': 'Bearer gestor_empresa1_token'
      },
      body: {
        cognito_sub: 'novo-sub-123',
        email: 'novo@escola.edu.br',
        nome: 'Novo Usuario',
        tipo_usuario: 'professor',
        empresa_id: 2 // Gestor da empresa 1 tentando criar na empresa 2
      }
    },
    response: {
      success: false,
      message: 'Gestores só podem criar usuários em sua própria empresa',
      code: 400
    }
  }
};

/**
 * EXEMPLO 7: Controle de acesso por tipo de usuário
 */
export const controleAcessoCriacao = {
  admin: {
    descricao: 'Administrador - Pode criar qualquer tipo de usuário',
    tipos_permitidos: ['admin', 'gestor', 'diretor', 'professor', 'aluno'],
    empresa_id: 'Pode especificar qualquer empresa ou deixar null',
    observacoes: [
      'Acesso total ao sistema',
      'Pode criar administradores e gestores',
      'Pode especificar empresa diferente da própria'
    ]
  },

  gestor: {
    descricao: 'Gestor - Limitado à hierarquia da empresa',
    tipos_permitidos: ['diretor', 'professor', 'aluno'],
    tipos_negados: ['admin', 'gestor'],
    empresa_id: 'Automaticamente definida como a empresa do gestor',
    observacoes: [
      'Não pode criar outros gestores ou administradores',
      'Usuários criados sempre na mesma empresa',
      'Pode criar diretores, professores e alunos'
    ]
  },

  diretor: {
    descricao: 'Diretor - Sem permissão de criação',
    tipos_permitidos: [],
    empresa_id: 'N/A',
    observacoes: [
      'Middleware adminOuGestor bloqueia acesso',
      'Não pode criar nenhum tipo de usuário'
    ]
  },

  professor: {
    descricao: 'Professor - Sem permissão de criação',
    tipos_permitidos: [],
    empresa_id: 'N/A',
    observacoes: [
      'Middleware adminOuGestor bloqueia acesso',
      'Não pode criar nenhum tipo de usuário'
    ]
  },

  aluno: {
    descricao: 'Aluno - Sem permissão de criação',
    tipos_permitidos: [],
    empresa_id: 'N/A',
    observacoes: [
      'Middleware adminOuGestor bloqueia acesso',
      'Não pode criar nenhum tipo de usuário'
    ]
  }
};

/**
 * EXEMPLO 8: Campos específicos por tipo de usuário
 */
export const camposEspecificosPorTipo = {
  admin: {
    campos_basicos: ['cognito_sub', 'email', 'nome', 'tipo_usuario'],
    campos_opcionais: ['telefone', 'endereco', 'cidade', 'estado', 'documento', 'empresa_id'],
    campos_especificos: [],
    observacao: 'Admin não tem campos específicos adicionais'
  },

  gestor: {
    campos_basicos: ['cognito_sub', 'email', 'nome', 'tipo_usuario'],
    campos_opcionais: ['telefone', 'endereco', 'cidade', 'estado', 'documento'],
    campos_especificos: ['cargo', 'data_admissao'],
    observacao: 'Empresa_id automaticamente definida'
  },

  diretor: {
    campos_basicos: ['cognito_sub', 'email', 'nome', 'tipo_usuario'],
    campos_opcionais: ['telefone', 'endereco', 'cidade', 'estado', 'documento', 'empresa_id'],
    campos_especificos: ['escola_id', 'cargo', 'data_inicio'],
    observacao: 'Escola_id deve ser válida e da mesma empresa'
  },

  professor: {
    campos_basicos: ['cognito_sub', 'email', 'nome', 'tipo_usuario'],
    campos_opcionais: ['telefone', 'endereco', 'cidade', 'estado', 'documento', 'empresa_id'],
    campos_especificos: ['disciplinas', 'formacao', 'escola_id', 'data_admissao'],
    observacao: 'Disciplinas deve ser array de strings'
  },

  aluno: {
    campos_basicos: ['cognito_sub', 'email', 'nome', 'tipo_usuario'],
    campos_opcionais: ['telefone', 'endereco', 'cidade', 'estado', 'documento', 'empresa_id', 'data_nascimento'],
    campos_especificos: [
      'matricula', 'turma', 'serie', 'turno', 
      'nome_responsavel', 'contato_responsavel', 'escola_id', 'data_matricula'
    ],
    observacao: 'Matrícula é gerada automaticamente se não fornecida'
  }
};

/**
 * EXEMPLO 9: Casos de uso práticos
 */
export const casosDeUsoPraticos = {
  formulario_cadastro: {
    descricao: 'Formulário de cadastro de usuários',
    exemplo: `
// Frontend - Formulário dinâmico baseado no tipo
const CadastroUsuario = () => {
  const [tipoUsuario, setTipoUsuario] = useState('professor');
  const [formData, setFormData] = useState({});

  const camposEspecificos = {
    professor: ['disciplinas', 'formacao', 'escola_id'],
    aluno: ['matricula', 'turma', 'serie', 'nome_responsavel', 'contato_responsavel'],
    diretor: ['escola_id', 'cargo', 'data_inicio'],
    gestor: ['cargo', 'data_admissao']
  };

  const criarUsuario = async () => {
    const response = await fetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    if (result.success) {
      console.log('Usuário criado:', result.data);
    } else {
      console.error('Erro:', result.message);
    }
  };
};
    `
  },

  importacao_lote: {
    descricao: 'Importação em lote de usuários',
    exemplo: `
// Script de importação de planilha
const importarUsuarios = async (dadosUsuarios) => {
  const resultados = [];

  for (const dadosUsuario of dadosUsuarios) {
    try {
      const response = await fetch('/api/usuarios', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cognito_sub: \`import-\${Date.now()}-\${Math.random()}\`,
          ...dadosUsuario
        })
      });

      const result = await response.json();
      resultados.push({
        linha: dadosUsuario.linha,
        sucesso: result.success,
        usuario_id: result.data?.id,
        erro: result.message
      });

    } catch (error) {
      resultados.push({
        linha: dadosUsuario.linha,
        sucesso: false,
        erro: error.message
      });
    }
  }

  return resultados;
};
    `
  },

  matricula_escolar: {
    descricao: 'Sistema de matrícula escolar',
    exemplo: `
// Processo de matrícula com criação de aluno
const matricularAluno = async (dadosAluno, dadosResponsavel) => {
  const matricula = await gerarMatricula();
  
  const dadosCompletos = {
    cognito_sub: \`aluno-\${matricula}\`,
    email: dadosAluno.email,
    nome: dadosAluno.nome,
    tipo_usuario: 'aluno',
    telefone: dadosAluno.telefone,
    endereco: dadosAluno.endereco,
    cidade: dadosAluno.cidade,
    estado: dadosAluno.estado,
    data_nascimento: dadosAluno.data_nascimento,
    documento: dadosAluno.cpf,
    matricula: matricula,
    turma: dadosAluno.turma,
    serie: dadosAluno.serie,
    turno: dadosAluno.turno,
    nome_responsavel: dadosResponsavel.nome,
    contato_responsavel: dadosResponsavel.telefone,
    escola_id: dadosAluno.escola_id,
    data_matricula: new Date().toISOString().split('T')[0]
  };

  const response = await fetch('/api/usuarios', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${gestorToken}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dadosCompletos)
  });

  return response.json();
};
    `
  }
};

/**
 * EXEMPLO 10: Segurança e validações
 */
export const segurancaValidacoes = {
  prepared_statements: {
    descricao: 'Proteção contra SQL injection',
    implementacao: 'Todos os dados são passados via prepared statements no modelo Usuario'
  },

  sanitizacao_dados: {
    descricao: 'Limpeza automática de dados',
    implementacao: [
      'Email: toLowerCase() e trim()',
      'Nome: trim()',
      'Documento: remove pontuação com replace(/\\D/g, "")',
      'Telefone/Endereco/Cidade/Estado: trim()'
    ]
  },

  validacao_duplicatas: {
    descricao: 'Verificação de unicidade',
    verificacoes: [
      'Email único no sistema',
      'Cognito_sub único no sistema',
      'Matrícula única por escola (para alunos)'
    ]
  },

  validacao_hierarquica: {
    descricao: 'Controle de permissões por hierarquia',
    regras: [
      'Admin: pode criar qualquer tipo',
      'Gestor: apenas diretor, professor, aluno',
      'Outros tipos: sem permissão de criação'
    ]
  },

  validacao_empresa: {
    descricao: 'Controle de acesso por empresa',
    regras: [
      'Admin: pode especificar qualquer empresa',
      'Gestor: limitado à própria empresa',
      'Validação de existência da empresa'
    ]
  }
};

/**
 * FUNÇÃO PRINCIPAL DE DEMONSTRAÇÃO
 */
export function demonstrarCriarUsuario() {
  console.log('➕ DEMONSTRAÇÃO DA FUNÇÃO criarUsuario()');
  console.log('=============================================');

  console.log('\n🔒 Controle de Acesso:');
  console.log('• Admin: Pode criar qualquer tipo de usuário');
  console.log('• Gestor: Pode criar diretor, professor, aluno (na própria empresa)');
  console.log('• Outros tipos: Acesso negado (middleware adminOuGestor)');

  console.log('\n📋 Campos Obrigatórios:');
  console.log('• cognito_sub, email, nome, tipo_usuario');
  console.log('• empresa_id: Automática para gestores, opcional para admin');

  console.log('\n🔍 Validações Implementadas:');
  console.log('• Email único no sistema');
  console.log('• Cognito_sub único no sistema');
  console.log('• Tipo de usuário válido e permitido');
  console.log('• Empresa existe (se especificada)');
  console.log('• Hierarquia de permissões respeitada');

  console.log('\n📊 Registros Específicos:');
  console.log('• Gestor: cargo, data_admissao');
  console.log('• Diretor: escola_id, cargo, data_inicio');
  console.log('• Professor: disciplinas, formacao, escola_id, data_admissao');
  console.log('• Aluno: matrícula, turma, série, responsável, escola_id');

  console.log('\n🛡️ Segurança:');
  console.log('• Prepared statements para proteção SQL injection');
  console.log('• Sanitização automática de dados de entrada');
  console.log('• Validação rigorosa de permissões hierárquicas');
  console.log('• Logging detalhado para auditoria');

  console.log('\n📈 Funcionalidades Avançadas:');
  console.log('• Criação automática de registros específicos');
  console.log('• Geração automática de matrícula para alunos');
  console.log('• Metadata completa na resposta');
  console.log('• Tratamento gracioso de erros em registros específicos');

  return {
    exemplos: {
      basico: exemploCriacaoBasica,
      professorCompleto: exemploProfessorCompleto,
      alunoCompleto: exemploAlunoCompleto,
      adminGestor: exemploAdminCriandoGestor,
      diretor: exemploDirectorEscola
    },
    validacoes: exemploValidacoes,
    controleAcesso: controleAcessoCriacao,
    camposEspecificos: camposEspecificosPorTipo,
    casosDeUso: casosDeUsoPraticos,
    seguranca: segurancaValidacoes
  };
}

export default {
  exemploCriacaoBasica,
  exemploProfessorCompleto,
  exemploAlunoCompleto,
  exemploAdminCriandoGestor,
  exemploDirectorEscola,
  exemploValidacoes,
  controleAcessoCriacao,
  camposEspecificosPorTipo,
  casosDeUsoPraticos,
  segurancaValidacoes,
  demonstrarCriarUsuario
};
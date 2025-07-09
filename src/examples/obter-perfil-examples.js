/**
 * Exemplos específicos da função obterPerfil()
 * Demonstra os diferentes formatos de resposta para cada tipo de usuário
 */

/**
 * EXEMPLO 1: Resposta para PROFESSOR
 */
export const exemploProfessor = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil completo obtido com sucesso",
  data: {
    // Dados básicos do JWT token
    id: 15,
    sub: "professor_sub_123",
    nome: "Fernanda Souza",
    email: "fernanda@escola.edu.br",
    tipo_usuario: "professor",
    empresa_id: 1,
    groups: ["Professores"],
    exp: 1752089880,
    iat: 1752086280,
    
    // Dados completos do banco de dados
    cognito_sub: "professor_sub_123",
    telefone: "(11) 3333-4444",
    documento: "12345678901",
    endereco: "Rua das Flores, 100",
    cidade: "São Paulo",
    estado: "SP",
    data_nascimento: "1985-03-15",
    status: "ativo",
    ultimo_login: "2025-07-09T20:15:00.000Z",
    criado_em: "2025-01-15T10:00:00.000Z",
    
    // Dados específicos do professor
    dadosEspecificos: {
      tipo: "professor",
      professor_id: 3,
      escola_id: 1,
      disciplinas: ["Matemática", "Física"],
      formacao: "Licenciatura em Matemática",
      data_admissao: "2023-03-01",
      status: "ativo"
    },
    
    // Dados da empresa
    empresa: {
      id: 1,
      nome: "Prefeitura Municipal de São Paulo",
      cnpj: "12345678000195",
      cidade: "São Paulo",
      estado: "SP"
    },
    
    // Metadata do perfil
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: true
    }
  }
};

/**
 * EXEMPLO 2: Resposta para ALUNO
 */
export const exemploAluno = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil completo obtido com sucesso",
  data: {
    // Dados básicos do JWT token
    id: 20,
    sub: "aluno_sub_456",
    nome: "Bruno Henrique Costa",
    email: "bruno@aluno.edu.br",
    tipo_usuario: "aluno",
    empresa_id: 1,
    groups: ["Alunos"],
    
    // Dados específicos do aluno
    dadosEspecificos: {
      tipo: "aluno",
      aluno_id: 5,
      escola_id: 1,
      matricula: "2024001",
      turma: "9º A",
      serie: "9º Ano",
      turno: "manha",
      nome_responsavel: "Ana Costa",
      contato_responsavel: "(11) 9999-8888",
      data_matricula: "2024-02-01",
      status: "ativo"
    },
    
    empresa: {
      id: 1,
      nome: "Prefeitura Municipal de São Paulo",
      cnpj: "12345678000195",
      cidade: "São Paulo",
      estado: "SP"
    },
    
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: true
    }
  }
};

/**
 * EXEMPLO 3: Resposta para DIRETOR
 */
export const exemploDiretor = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil completo obtido com sucesso",
  data: {
    // Dados básicos do JWT token
    id: 12,
    sub: "diretor_sub_789",
    nome: "João Pedro Oliveira",
    email: "joao@escola.edu.br",
    tipo_usuario: "diretor",
    empresa_id: 1,
    groups: ["Diretores"],
    
    // Dados específicos do diretor
    dadosEspecificos: {
      tipo: "diretor",
      diretor_id: 2,
      escola_id: 1,
      cargo: "Diretor Escolar",
      data_inicio: "2023-02-01",
      status: "ativo"
    },
    
    empresa: {
      id: 1,
      nome: "Prefeitura Municipal de São Paulo",
      cnpj: "12345678000195",
      cidade: "São Paulo",
      estado: "SP"
    },
    
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: true
    }
  }
};

/**
 * EXEMPLO 4: Resposta para GESTOR
 */
export const exemploGestor = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil completo obtido com sucesso",
  data: {
    // Dados básicos do JWT token
    id: 8,
    sub: "gestor_sub_321",
    nome: "Maria Silva Santos",
    email: "maria@prefeitura.sp.gov.br",
    tipo_usuario: "gestor",
    empresa_id: 1,
    groups: ["Gestores"],
    
    // Dados específicos do gestor
    dadosEspecificos: {
      tipo: "gestor",
      gestor_id: 1,
      cargo: "Secretária de Educação",
      data_admissao: "2023-01-15",
      status: "ativo"
    },
    
    empresa: {
      id: 1,
      nome: "Prefeitura Municipal de São Paulo",
      cnpj: "12345678000195",
      cidade: "São Paulo",
      estado: "SP"
    },
    
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: true
    }
  }
};

/**
 * EXEMPLO 5: Resposta para ADMIN
 */
export const exemploAdmin = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil completo obtido com sucesso",
  data: {
    // Dados básicos do JWT token
    id: 1,
    sub: "admin_sub_master",
    nome: "Administrador Master",
    email: "admin@iaprender.com",
    tipo_usuario: "admin",
    empresa_id: null, // Admins não têm empresa específica
    groups: ["Admin", "AdminMaster"],
    
    // Dados específicos do admin
    dadosEspecificos: {
      tipo: "admin",
      descricao: "Administrador do sistema",
      permissoes: [
        "Gestão completa de usuários",
        "Gestão de empresas e contratos",
        "Acesso a estatísticas globais",
        "Configurações do sistema"
      ],
      acesso_total: true
    },
    
    // Admin não tem empresa específica
    empresa: null,
    
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: true
    }
  }
};

/**
 * EXEMPLO 6: Resposta quando dados específicos não são encontrados
 */
export const exemploSemDadosEspecificos = {
  success: true,
  timestamp: "2025-07-09T21:18:00.000Z",
  message: "Perfil obtido com dados básicos (dados específicos indisponíveis)",
  data: {
    id: 25,
    sub: "usuario_sub_999",
    nome: "Usuário Sem Vínculos",
    email: "usuario@sistema.com",
    tipo_usuario: "professor",
    empresa_id: 2,
    groups: ["Professores"],
    
    // Dados específicos com erro
    dadosEspecificos: {
      tipo: "professor",
      erro: "Dados específicos não puderam ser carregados",
      detalhes: "Professor não encontrado na tabela professors"
    },
    
    empresa: {
      id: 2,
      nome: "Secretaria de Educação do RJ",
      cnpj: "98765432000156",
      cidade: "Rio de Janeiro",
      estado: "RJ"
    },
    
    metadata: {
      ultimo_acesso: "2025-07-09T21:18:00.000Z",
      versao_perfil: "1.0",
      fonte_dados: "jwt_token_e_banco_local",
      dados_especificos_carregados: false
    }
  }
};

/**
 * EXEMPLO 7: Comparação entre /me e /perfil
 */
export const comparacaoEndpoints = {
  "/api/usuarios/me": {
    descricao: "Perfil básico do banco de dados",
    uso: "Dados básicos do usuário para interface simples",
    exemplo: {
      success: true,
      data: {
        id: 15,
        cognito_sub: "professor_sub_123",
        email: "fernanda@escola.edu.br",
        nome: "Fernanda Souza",
        tipo_usuario: "professor",
        empresa_id: 1,
        telefone: "(11) 3333-4444",
        status: "ativo"
        // Apenas dados da tabela usuarios
      }
    }
  },
  
  "/api/usuarios/perfil": {
    descricao: "Perfil completo com dados específicos do tipo",
    uso: "Dashboard personalizado, validações, contexto completo",
    exemplo: {
      success: true,
      data: {
        // Dados do JWT + banco + dados específicos + empresa + metadata
        id: 15,
        nome: "Fernanda Souza",
        tipo_usuario: "professor",
        dadosEspecificos: {
          tipo: "professor",
          disciplinas: ["Matemática", "Física"],
          formacao: "Licenciatura em Matemática"
        },
        empresa: {
          nome: "Prefeitura Municipal de São Paulo"
        },
        metadata: {
          dados_especificos_carregados: true
        }
      }
    }
  }
};

/**
 * EXEMPLO 8: Casos de uso práticos
 */
export const casosDeUso = {
  dashboard_personalizado: {
    endpoint: "/api/usuarios/perfil",
    descrição: "Carregar dashboard específico com widgets baseados no tipo de usuário",
    exemplo_uso: `
// Frontend - Dashboard personalizado
const response = await fetch('/api/usuarios/perfil');
const { data: perfil } = await response.json();

switch(perfil.tipo_usuario) {
  case 'professor':
    return <DashboardProfessor 
      disciplinas={perfil.dadosEspecificos.disciplinas}
      escola_id={perfil.dadosEspecificos.escola_id}
    />;
  case 'aluno':
    return <DashboardAluno 
      turma={perfil.dadosEspecificos.turma}
      responsavel={perfil.dadosEspecificos.nome_responsavel}
    />;
}
    `
  },
  
  validacao_acesso: {
    endpoint: "/api/usuarios/perfil",
    descrição: "Validar acesso a recursos específicos baseado no tipo e vínculos",
    exemplo_uso: `
// Middleware - Validação de acesso
const { data: perfil } = await fetch('/api/usuarios/perfil');

if (perfil.tipo_usuario === 'professor') {
  // Verificar se pode acessar turma X
  const podeAcessar = perfil.dadosEspecificos.escola_id === turma.escola_id;
}

if (perfil.tipo_usuario === 'aluno') {
  // Verificar se pode ver suas próprias notas
  const podeVer = perfil.dadosEspecificos.matricula === nota.matricula;
}
    `
  },
  
  auditoria_logs: {
    endpoint: "/api/usuarios/perfil",
    descrição: "Registrar ações com contexto completo do usuário",
    exemplo_uso: `
// Sistema de auditoria
const { data: perfil } = await fetch('/api/usuarios/perfil');

const logEntry = {
  usuario_id: perfil.id,
  usuario_nome: perfil.nome,
  tipo_usuario: perfil.tipo_usuario,
  empresa_id: perfil.empresa_id,
  empresa_nome: perfil.empresa?.nome,
  contexto_especifico: perfil.dadosEspecificos,
  acao: 'gerou_relatorio',
  timestamp: new Date()
};
    `
  }
};

/**
 * EXEMPLO 9: Middleware personalizado usando obterPerfil
 */
export const middlewarePersonalizado = `
// Middleware que enriquece req.user com dados específicos
export const enriquecerPerfil = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Simular chamada interna para obterPerfil
    const mockReq = { user: req.user };
    const mockRes = {
      status: () => mockRes,
      json: (data) => {
        if (data.success) {
          req.userProfile = data.data;
        }
        return mockRes;
      }
    };

    await UsuarioController.obterPerfil(mockReq, mockRes);
    next();
  } catch (error) {
    console.error('Erro ao enriquecer perfil:', error);
    next(); // Continuar mesmo com erro
  }
};

// Uso em rotas que precisam de contexto específico
router.get('/turmas/:id/alunos', 
  autenticar, 
  enriquecerPerfil,
  (req, res) => {
    // req.userProfile agora tem dados específicos
    const { dadosEspecificos } = req.userProfile;
    
    if (req.userProfile.tipo_usuario === 'professor') {
      // Verificar se professor pode ver alunos desta turma
      const podeVer = dadosEspecificos.escola_id === turma.escola_id;
    }
  }
);
`;

/**
 * FUNÇÃO PRINCIPAL DE DEMONSTRAÇÃO
 */
export function demonstrarObterPerfil() {
  console.log('📋 DEMONSTRAÇÃO DA FUNÇÃO obterPerfil()');
  console.log('=========================================');

  console.log('\n🎭 Exemplos por tipo de usuário:');
  console.log('1. Professor - Disciplinas e formação');
  console.log('2. Aluno - Matrícula, turma e responsável'); 
  console.log('3. Diretor - Escola gerenciada e cargo');
  console.log('4. Gestor - Empresa gerenciada e cargo');
  console.log('5. Admin - Permissões globais do sistema');

  console.log('\n📊 Diferenças entre endpoints:');
  console.log('/api/usuarios/me - Dados básicos da tabela usuarios');
  console.log('/api/usuarios/perfil - Dados completos + específicos + empresa + metadata');

  console.log('\n🔧 Casos de uso práticos:');
  console.log('• Dashboard personalizado por tipo de usuário');
  console.log('• Validação de acesso a recursos específicos');
  console.log('• Sistema de auditoria com contexto completo');
  console.log('• Middleware de enriquecimento de perfil');

  console.log('\n✅ Vantagens da função obterPerfil:');
  console.log('• Combina dados JWT + banco + específicos em uma chamada');
  console.log('• Carregamento dinâmico baseado no tipo de usuário'); 
  console.log('• Tratamento gracioso de erros (dados básicos se específicos falharem)');
  console.log('• Metadata para tracking e debugging');
  console.log('• Informações da empresa para contexto organizacional');

  return {
    exemplosPorTipo: {
      professor: exemploProfessor,
      aluno: exemploAluno,
      diretor: exemploDiretor,
      gestor: exemploGestor,
      admin: exemploAdmin
    },
    comparacao: comparacaoEndpoints,
    casosDeUso: casosDeUso,
    middlewareExample: middlewarePersonalizado
  };
}

export default {
  exemploProfessor,
  exemploAluno,
  exemploDiretor,
  exemploGestor,
  exemploAdmin,
  exemploSemDadosEspecificos,
  comparacaoEndpoints,
  casosDeUso,
  middlewarePersonalizado,
  demonstrarObterPerfil
};
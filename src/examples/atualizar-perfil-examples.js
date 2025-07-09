/**
 * Exemplos específicos da função atualizarPerfil()
 * Demonstra validações, permissões e atualizações por tipo de usuário
 */

/**
 * EXEMPLO 1: Atualização de Professor com dados específicos
 */
export const exemploAtualizacaoProfessor = {
  request: {
    method: 'PATCH',
    url: '/api/usuarios/perfil',
    headers: {
      'Authorization': 'Bearer professor_token_123',
      'Content-Type': 'application/json'
    },
    body: {
      nome: 'Fernanda Silva Souza',
      telefone: '(11) 9999-1111',
      endereco: 'Rua Nova, 200',
      cidade: 'São Paulo',
      estado: 'SP',
      disciplinas: ['Matemática', 'Física', 'Química'],
      formacao: 'Mestrado em Matemática Aplicada',
      email: 'novo.email@escola.edu.br', // Campo não permitido para professor
      tipo_usuario: 'admin' // Campo não permitido para professor
    }
  },
  response: {
    success: true,
    timestamp: '2025-07-09T21:30:00.000Z',
    message: 'Perfil atualizado com sucesso',
    data: {
      usuario: {
        id: 15,
        nome: 'Fernanda Silva Souza',
        email: 'fernanda@escola.edu.br', // Email não foi alterado
        telefone: '(11) 9999-1111',
        endereco: 'Rua Nova, 200',
        cidade: 'São Paulo',
        estado: 'SP',
        tipo_usuario: 'professor', // Tipo não foi alterado
        dadosEspecificos: {
          disciplinas: ['Matemática', 'Física', 'Química'],
          formacao: 'Mestrado em Matemática Aplicada',
          escola_id: 1
        }
      },
      atualizacoes: {
        campos_atualizados: ['nome', 'telefone', 'endereco', 'cidade', 'estado'],
        campos_ignorados: ['email', 'tipo_usuario'], // Campos não permitidos
        dados_especificos: {
          atualizou: true,
          tipo: 'professor',
          campos: ['disciplinas', 'formacao'],
          erro: null
        }
      },
      metadata: {
        atualizado_em: '2025-07-09T21:30:00.000Z',
        atualizado_por: 15,
        tipo_usuario: 'professor'
      }
    }
  }
};

/**
 * EXEMPLO 2: Atualização de Aluno com dados do responsável
 */
export const exemploAtualizacaoAluno = {
  request: {
    method: 'PATCH',
    url: '/api/usuarios/perfil',
    body: {
      nome: 'Bruno Henrique Silva',
      telefone: '(11) 8888-9999',
      endereco: 'Avenida Paulista, 1000',
      nome_responsavel: 'Ana Silva Costa',
      contato_responsavel: '(11) 7777-8888',
      data_nascimento: '2008-05-15' // Campo não permitido para aluno
    }
  },
  response: {
    success: true,
    message: 'Perfil atualizado com sucesso',
    data: {
      usuario: {
        id: 20,
        nome: 'Bruno Henrique Silva',
        telefone: '(11) 8888-9999',
        endereco: 'Avenida Paulista, 1000',
        dadosEspecificos: {
          matricula: '2024001',
          turma: '9º A',
          nome_responsavel: 'Ana Silva Costa',
          contato_responsavel: '(11) 7777-8888'
        }
      },
      atualizacoes: {
        campos_atualizados: ['nome', 'telefone', 'endereco'],
        campos_ignorados: ['data_nascimento'], // Campo não permitido para aluno
        dados_especificos: {
          atualizou: true,
          tipo: 'aluno',
          campos: ['nome_responsavel', 'contato_responsavel']
        }
      }
    }
  }
};

/**
 * EXEMPLO 3: Atualização de Admin com permissões completas
 */
export const exemploAtualizacaoAdmin = {
  request: {
    method: 'PATCH',
    url: '/api/usuarios/perfil',
    body: {
      nome: 'Administrador Master Atualizado',
      email: 'admin.novo@iaprender.com',
      telefone: '(11) 5555-0000',
      documento: '12345678901',
      tipo_usuario: 'admin', // Admin pode alterar próprio tipo
      empresa_id: null,
      status: 'ativo'
    }
  },
  response: {
    success: true,
    message: 'Perfil atualizado com sucesso',
    data: {
      usuario: {
        id: 1,
        nome: 'Administrador Master Atualizado',
        email: 'admin.novo@iaprender.com',
        telefone: '(11) 5555-0000',
        documento: '12345678901',
        tipo_usuario: 'admin',
        empresa_id: null,
        status: 'ativo'
      },
      atualizacoes: {
        campos_atualizados: ['nome', 'email', 'telefone', 'documento', 'tipo_usuario', 'empresa_id', 'status'],
        campos_ignorados: [], // Admin pode alterar todos os campos
        dados_especificos: {
          atualizou: false, // Admin não tem dados específicos em outras tabelas
          tipo: 'admin',
          campos: []
        }
      }
    }
  }
};

/**
 * EXEMPLO 4: Atualização com erros de validação
 */
export const exemploErrosValidacao = {
  request: {
    method: 'PATCH',
    url: '/api/usuarios/perfil',
    body: {
      nome: 'João Silva',
      email: 'email-invalido', // Email inválido
      telefone: '11999998888', // Telefone sem formatação
      documento: '123', // Documento muito curto
      data_nascimento: '2030-01-01' // Data futura
    }
  },
  response: {
    success: false,
    timestamp: '2025-07-09T21:30:00.000Z',
    message: 'Dados inválidos para atualização',
    data: {
      errors: [
        'Email deve ter formato válido',
        'Telefone deve ter formato (XX) XXXXX-XXXX',
        'Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)',
        'Data de nascimento deve ser válida e não futura'
      ]
    }
  }
};

/**
 * EXEMPLO 5: Tentativa de atualização sem campos válidos
 */
export const exemploSemCamposValidos = {
  request: {
    method: 'PATCH',
    url: '/api/usuarios/perfil',
    body: {
      email: 'novo@email.com', // Campo não permitido para professor
      tipo_usuario: 'admin', // Campo não permitido para professor
      empresa_id: 2 // Campo não permitido para professor
    }
  },
  response: {
    success: false,
    timestamp: '2025-07-09T21:30:00.000Z',
    message: 'Nenhum campo válido fornecido para atualização',
    data: null
  }
};

/**
 * EXEMPLO 6: Campos permitidos por tipo de usuário
 */
export const camposPermitidosPorTipo = {
  admin: {
    descricao: 'Administrador - Permissões completas',
    campos_permitidos: [
      'nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento',
      'email', 'documento', 'tipo_usuario', 'empresa_id', 'status'
    ],
    campos_especificos: [],
    observacoes: 'Admin pode alterar qualquer campo, incluindo dados sensíveis'
  },
  gestor: {
    descricao: 'Gestor - Permissões intermediárias',
    campos_permitidos: [
      'nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento',
      'documento'
    ],
    campos_especificos: [],
    observacoes: 'Gestor não pode alterar email, tipo_usuario ou empresa_id'
  },
  diretor: {
    descricao: 'Diretor - Apenas dados pessoais',
    campos_permitidos: [
      'nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento'
    ],
    campos_especificos: [],
    observacoes: 'Diretor não pode alterar cargo ou escola vinculada'
  },
  professor: {
    descricao: 'Professor - Dados pessoais + dados profissionais',
    campos_permitidos: [
      'nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento'
    ],
    campos_especificos: ['disciplinas', 'formacao'],
    observacoes: 'Professor pode atualizar disciplinas e formação'
  },
  aluno: {
    descricao: 'Aluno - Permissões limitadas',
    campos_permitidos: [
      'nome', 'telefone', 'endereco', 'cidade', 'estado'
    ],
    campos_especificos: ['nome_responsavel', 'contato_responsavel'],
    observacoes: 'Aluno não pode alterar data_nascimento, apenas dados do responsável'
  }
};

/**
 * EXEMPLO 7: Casos de uso práticos
 */
export const casosDeUsoPraticos = {
  atualizacao_perfil_dashboard: {
    descrição: 'Formulário de edição de perfil no dashboard',
    exemplo: `
// Frontend - Formulário de edição baseado no tipo de usuário
const tipoUsuario = user.tipo_usuario;
const camposPermitidos = getCamposPermitidos(tipoUsuario);

const handleSubmit = async (dados) => {
  const response = await fetch('/api/usuarios/perfil', {
    method: 'PATCH',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Campos atualizados:', result.data.atualizacoes.campos_atualizados);
    console.log('Campos ignorados:', result.data.atualizacoes.campos_ignorados);
  } else {
    console.error('Erros de validação:', result.data.errors);
  }
};
    `
  },
  
  middleware_validacao: {
    descrição: 'Middleware para validar campos antes do envio',
    exemplo: `
// Middleware - Validação no frontend
export const validarCamposPermitidos = (dados, tipoUsuario) => {
  const camposPermitidos = getCamposPermitidos(tipoUsuario);
  const dadosLimpos = {};
  const camposRemovidos = [];

  Object.keys(dados).forEach(campo => {
    if (camposPermitidos.includes(campo)) {
      dadosLimpos[campo] = dados[campo];
    } else {
      camposRemovidos.push(campo);
    }
  });

  return { dadosLimpos, camposRemovidos };
};
    `
  },

  auditoria_mudancas: {
    descrição: 'Sistema de auditoria para mudanças de perfil',
    exemplo: `
// Sistema de auditoria - Log de mudanças
const logMudancaPerfil = (usuarioId, mudancas) => {
  const auditLog = {
    usuario_id: usuarioId,
    acao: 'atualizar_perfil',
    campos_alterados: mudancas.campos_atualizados,
    campos_ignorados: mudancas.campos_ignorados,
    dados_especificos: mudancas.dados_especificos,
    timestamp: new Date().toISOString()
  };

  // Salvar no sistema de auditoria
  salvarLogAuditoria(auditLog);
};
    `
  }
};

/**
 * EXEMPLO 8: Tratamento de erros específicos
 */
export const exemplosTratamentoErros = {
  usuario_nao_encontrado: {
    codigo: 404,
    message: 'Usuário não encontrado',
    cenario: 'Token JWT válido mas usuário não existe no banco'
  },
  nenhum_campo_valido: {
    codigo: 400,
    message: 'Nenhum campo válido fornecido para atualização',
    cenario: 'Todos os campos enviados são restritos para o tipo de usuário'
  },
  dados_invalidos: {
    codigo: 400,
    message: 'Dados inválidos para atualização',
    data: { errors: ['Lista de erros específicos'] },
    cenario: 'Campos têm formato inválido (email, telefone, etc.)'
  },
  erro_atualizacao: {
    codigo: 500,
    message: 'Erro ao atualizar perfil',
    cenario: 'Falha na operação de banco de dados'
  }
};

/**
 * EXEMPLO 9: Comparação entre endpoints de atualização
 */
export const comparacaoEndpointsAtualizacao = {
  '/api/usuarios/me': {
    método: 'PATCH',
    descrição: 'Atualização básica sem validações específicas',
    validações: 'Básicas do modelo Usuario',
    campos_específicos: 'Não atualiza',
    resposta: 'Usuário atualizado do banco'
  },
  '/api/usuarios/perfil': {
    método: 'PATCH',
    descrição: 'Atualização com validações por tipo de usuário',
    validações: 'Avançadas + específicas por tipo',
    campos_específicos: 'Atualiza disciplinas, responsáveis, etc.',
    resposta: 'Perfil completo + metadata de atualizações'
  },
  '/api/usuarios/:id': {
    método: 'PATCH',
    descrição: 'Atualização administrativa (admin/gestor)',
    validações: 'Baseadas em hierarquia e empresa',
    campos_específicos: 'Não atualiza automaticamente',
    resposta: 'Usuário atualizado com controle de acesso'
  }
};

/**
 * FUNÇÃO PRINCIPAL DE DEMONSTRAÇÃO
 */
export function demonstrarAtualizarPerfil() {
  console.log('✏️ DEMONSTRAÇÃO DA FUNÇÃO atualizarPerfil()');
  console.log('===============================================');

  console.log('\n🔒 Sistema de Permissões:');
  console.log('• Admin: Pode alterar qualquer campo, incluindo tipo e empresa');
  console.log('• Gestor: Pode alterar dados pessoais + documento');
  console.log('• Diretor: Apenas dados pessoais básicos');
  console.log('• Professor: Dados pessoais + disciplinas/formação');
  console.log('• Aluno: Dados pessoais limitados + dados do responsável');

  console.log('\n✅ Validações Implementadas:');
  console.log('• Email: formato válido obrigatório');
  console.log('• Telefone: formato brasileiro (XX) XXXXX-XXXX');
  console.log('• Documento: CPF (11 dígitos) ou CNPJ (14 dígitos)');
  console.log('• Data nascimento: válida e não futura');
  console.log('• Tipo usuário: apenas valores permitidos');
  console.log('• Empresa ID: número inteiro positivo');

  console.log('\n📊 Funcionalidades Avançadas:');
  console.log('• Filtragem automática de campos não permitidos');
  console.log('• Atualização de dados específicos por tipo');
  console.log('• Resposta detalhada com campos atualizados/ignorados');
  console.log('• Construção de perfil completo após atualização');
  console.log('• Metadata de auditoria com timestamp e responsável');

  console.log('\n🛡️ Segurança:');
  console.log('• Campos sensíveis protegidos por tipo de usuário');
  console.log('• Validação robusta de entrada de dados');
  console.log('• Log de campos ignorados para auditoria');
  console.log('• Tratamento gracioso de erros de dados específicos');

  return {
    exemplos: {
      professor: exemploAtualizacaoProfessor,
      aluno: exemploAtualizacaoAluno,
      admin: exemploAtualizacaoAdmin,
      erros: exemploErrosValidacao
    },
    permissoes: camposPermitidosPorTipo,
    casosDeUso: casosDeUsoPraticos,
    tratamentoErros: exemplosTratamentoErros,
    comparacao: comparacaoEndpointsAtualizacao
  };
}

export default {
  exemploAtualizacaoProfessor,
  exemploAtualizacaoAluno,
  exemploAtualizacaoAdmin,
  exemploErrosValidacao,
  exemploSemCamposValidos,
  camposPermitidosPorTipo,
  casosDeUsoPraticos,
  exemplosTratamentoErros,
  comparacaoEndpointsAtualizacao,
  demonstrarAtualizarPerfil
};
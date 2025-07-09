/**
 * EXEMPLOS DE USO - FUNÇÃO transferirAluno() 
 * 
 * Esta função permite transferir alunos entre escolas da mesma empresa
 * e mantém histórico completo de todas as transferências realizadas.
 */

/**
 * EXEMPLO 1: GESTOR TRANSFERINDO ALUNO ENTRE ESCOLAS DA EMPRESA
 * POST /api/alunos/1/transferir
 * Authorization: Bearer {token_gestor}
 */
const exemploGestorTransferencia = {
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
  response: {
    success: true,
    message: 'Aluno transferido com sucesso',
    data: {
      // DADOS COMPLETOS DO ALUNO APÓS TRANSFERÊNCIA
      aluno: {
        id: 1,
        nome: 'Bruno Henrique Santos',
        matricula: '2025020001', // ✅ Nova matrícula gerada automaticamente
        turma: '9º Ano',
        serie: 'Fundamental',
        turno: 'manhã',
        escola_id: 2, // ✅ Nova escola
        empresa_id: 1, // ✅ Mesma empresa
        status: 'ativo',
        // ... dados completos com escola, responsável, empresa
        escola: {
          id: 2,
          nome: 'EMEF Profª Maria Santos',
          codigo_inep: '35123457',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        responsavel: {
          nome: 'Carlos Roberto Santos',
          contato: '(11) 99999-8888'
        }
      },
      
      // DADOS DA TRANSFERÊNCIA REALIZADA
      transferencia: {
        id: 1, // ID do registro no histórico
        escola_origem: {
          id: 1,
          nome: 'EMEF Prof. João Silva',
          codigo_inep: '35123456'
        },
        escola_destino: {
          id: 2,
          nome: 'EMEF Profª Maria Santos',
          codigo_inep: '35123457'
        },
        data_transferencia: '2025-01-20T10:00:00.000Z',
        motivo: 'Mudança de endereço da família',
        matricula_anterior: '2024010001',
        nova_matricula: '2025020001',
        responsavel: {
          id: 2, // ID do gestor
          nome: 'Maria Silva Santos',
          tipo: 'gestor'
        }
      }
    },
    metadata: {
      transferido_por: 2,
      tipo_responsavel: 'gestor',
      empresa_id: 1,
      status_transferencia: 'concluida'
    },
    timestamp: '2025-07-09T21:00:00.000Z'
  }
};

/**
 * EXEMPLO 2: DIRETOR TRANSFERINDO ALUNO PARA OUTRA ESCOLA
 * POST /api/alunos/1/transferir
 * Authorization: Bearer {token_diretor}
 */
const exemploDiretorTransferencia = {
  request: {
    method: 'POST',
    url: '/api/alunos/1/transferir',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: {
      nova_escola_id: 3,
      motivo_transferencia: 'Transferência a pedido da família'
    }
  },
  response: {
    success: true,
    message: 'Aluno transferido com sucesso',
    data: {
      aluno: {
        id: 1,
        nome: 'Bruno Henrique Santos',
        matricula: '2025030001', // Nova matrícula para escola 3
        escola_id: 3,
        // ... dados completos
      },
      transferencia: {
        id: 2,
        data_transferencia: '2025-07-09T21:00:00.000Z', // Data atual se não informada
        motivo: 'Transferência a pedido da família',
        responsavel: {
          id: 4, // ID do diretor
          nome: 'João Pedro Silva',
          tipo: 'diretor'
        }
      }
    }
  }
};

/**
 * EXEMPLO 3: ADMIN TRANSFERINDO QUALQUER ALUNO
 * POST /api/alunos/5/transferir
 * Authorization: Bearer {token_admin}
 */
const exemploAdminTransferencia = {
  request: {
    method: 'POST',
    url: '/api/alunos/5/transferir',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    },
    body: {
      nova_escola_id: 7,
      motivo_transferencia: 'Reorganização administrativa',
      data_transferencia: '2025-02-01T08:00:00.000Z'
    }
  },
  response: {
    success: true,
    message: 'Aluno transferido com sucesso',
    data: {
      aluno: {
        id: 5,
        nome: 'Ana Carolina Oliveira',
        matricula: '2025070001',
        escola_id: 7,
        // ... dados completos
      },
      transferencia: {
        id: 3,
        motivo: 'Reorganização administrativa',
        responsavel: {
          id: 1, // ID do admin
          nome: 'Administrador Sistema',
          tipo: 'admin'
        }
      }
    }
  }
};

/**
 * EXEMPLO 4: CONSULTAR HISTÓRICO DE TRANSFERÊNCIAS
 * GET /api/alunos/1/transferencias
 * Authorization: Bearer {token}
 */
const exemploHistoricoTransferencias = {
  request: {
    method: 'GET',
    url: '/api/alunos/1/transferencias',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json'
    }
  },
  response: {
    success: true,
    message: '2 transferência(s) encontrada(s)',
    data: {
      aluno: {
        id: 1,
        nome: 'Bruno Henrique Santos',
        matricula_atual: '2025030001',
        escola_atual_id: 3
      },
      historico_transferencias: [
        {
          id: 2,
          data_transferencia: '2025-07-09T21:00:00.000Z',
          motivo: 'Transferência a pedido da família',
          escola_origem: {
            id: 2,
            nome: 'EMEF Profª Maria Santos',
            codigo_inep: '35123457'
          },
          escola_destino: {
            id: 3,
            nome: 'EMEF Dr. Carlos Drummond',
            codigo_inep: '35123458'
          },
          matricula_anterior: '2025020001',
          nova_matricula: '2025030001',
          responsavel: {
            id: 4,
            nome: 'João Pedro Silva',
            tipo: 'diretor'
          },
          status_anterior: 'ativo',
          criado_em: '2025-07-09T21:00:00.000Z'
        },
        {
          id: 1,
          data_transferencia: '2025-01-20T10:00:00.000Z',
          motivo: 'Mudança de endereço da família',
          escola_origem: {
            id: 1,
            nome: 'EMEF Prof. João Silva',
            codigo_inep: '35123456'
          },
          escola_destino: {
            id: 2,
            nome: 'EMEF Profª Maria Santos',
            codigo_inep: '35123457'
          },
          matricula_anterior: '2024010001',
          nova_matricula: '2025020001',
          responsavel: {
            id: 2,
            nome: 'Maria Silva Santos',
            tipo: 'gestor'
          },
          status_anterior: 'ativo',
          criado_em: '2025-01-20T10:00:00.000Z'
        }
      ],
      total_transferencias: 2
    },
    timestamp: '2025-07-09T21:00:00.000Z'
  }
};

/**
 * EXEMPLO 5: ERRO - TRANSFERÊNCIA ENTRE EMPRESAS DIFERENTES
 */
const erroEmpresasDiferentes = {
  request: {
    method: 'POST',
    url: '/api/alunos/1/transferir',
    body: {
      nova_escola_id: 10 // Escola de empresa diferente
    }
  },
  response: {
    success: false,
    message: 'Transferência deve ser entre escolas da mesma empresa',
    timestamp: '2025-07-09T21:00:00.000Z'
  },
  status: 400
};

/**
 * EXEMPLO 6: ERRO - PROFESSOR TENTANDO TRANSFERIR
 */
const erroProfessorSemPermissao = {
  request: {
    method: 'POST',
    url: '/api/alunos/1/transferir',
    headers: {
      'Authorization': 'Bearer {token_professor}'
    },
    body: {
      nova_escola_id: 2
    }
  },
  response: {
    success: false,
    message: 'Apenas administradores, gestores e diretores podem transferir alunos',
    timestamp: '2025-07-09T21:00:00.000Z'
  },
  status: 403
};

/**
 * EXEMPLO 7: ERRO - ESCOLA DESTINO INATIVA
 */
const erroEscolaInativa = {
  request: {
    method: 'POST',
    url: '/api/alunos/1/transferir',
    body: {
      nova_escola_id: 8 // Escola com status 'inativa'
    }
  },
  response: {
    success: false,
    message: 'Escola de destino deve estar ativa para receber transferências',
    timestamp: '2025-07-09T21:00:00.000Z'
  },
  status: 400
};

/**
 * ESTRUTURA DA TABELA historico_transferencias
 */
const estruturaTabelaHistorico = `
CREATE TABLE historico_transferencias (
  id SERIAL PRIMARY KEY,
  aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  escola_origem_id INTEGER NOT NULL REFERENCES escolas(id),
  escola_destino_id INTEGER NOT NULL REFERENCES escolas(id),
  data_transferencia TIMESTAMP NOT NULL,
  motivo_transferencia TEXT,
  matricula_anterior VARCHAR(20),
  nova_matricula VARCHAR(20),
  usuario_responsavel_id INTEGER NOT NULL REFERENCES usuarios(id),
  status_anterior VARCHAR(20),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_historico_transferencias_aluno_id ON historico_transferencias(aluno_id);
CREATE INDEX idx_historico_transferencias_data ON historico_transferencias(data_transferencia);
CREATE INDEX idx_historico_transferencias_escolas ON historico_transferencias(escola_origem_id, escola_destino_id);
`;

/**
 * CASOS DE USO PRÁTICOS
 */

/**
 * CASO DE USO 1: REORGANIZAÇÃO ESCOLAR
 * Gestores municipais transferindo alunos entre unidades
 */
const casoUsoReorganizacao = {
  cenario: 'Prefeitura reorganizando distribuição de alunos entre escolas',
  endpoint: 'POST /api/alunos/{id}/transferir',
  beneficios: [
    'Transferência em lote entre escolas da mesma rede',
    'Histórico completo para auditoria',
    'Nova matrícula gerada automaticamente',
    'Validação de empresa mantém segurança'
  ],
  exemplo_lote: [
    { aluno_id: 1, nova_escola_id: 2, motivo: 'Otimização de vagas' },
    { aluno_id: 3, nova_escola_id: 2, motivo: 'Otimização de vagas' },
    { aluno_id: 5, nova_escola_id: 4, motivo: 'Otimização de vagas' }
  ]
};

/**
 * CASO DE USO 2: MUDANÇA DE ENDEREÇO
 * Família solicitando transferência por mudança
 */
const casoUsoMudancaEndereco = {
  cenario: 'Responsável solicita transferência por mudança de bairro',
  fluxo: [
    '1. Responsável solicita transferência na secretaria',
    '2. Diretor/Gestor escolhe escola mais próxima',
    '3. Sistema valida escolas da mesma empresa',
    '4. Transferência executada com nova matrícula',
    '5. Histórico registrado para controle'
  ]
};

/**
 * CASO DE USO 3: RELATÓRIOS ADMINISTRATIVOS
 * Análise de fluxo de alunos entre escolas
 */
const casoUsoRelatorios = {
  cenario: 'Secretaria analisando movimentação de alunos',
  endpoint: 'GET /api/alunos/{id}/transferencias',
  relatorios_possiveis: [
    'Escolas que mais recebem transferências',
    'Escolas que mais perdem alunos',
    'Motivos mais comuns de transferência',
    'Sazonalidade das transferências',
    'Impacto nas matrículas por escola'
  ]
};

/**
 * FUNÇÃO PARA TESTAR A API
 */
async function testarTransferirAluno() {
  console.log('🧪 TESTANDO FUNÇÃO transferirAluno()...\n');

  // Teste 1: Transferência básica
  console.log('1️⃣ TESTE: Gestor transferindo aluno entre escolas');
  try {
    const response = await fetch('/api/alunos/1/transferir', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nova_escola_id: 2,
        motivo_transferencia: 'Teste de transferência'
      })
    });
    const result = await response.json();
    console.log('✅ Sucesso:', result.success);
    console.log('🏫 Nova escola:', result.data?.transferencia.escola_destino.nome);
    console.log('🎫 Nova matrícula:', result.data?.transferencia.nova_matricula);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 2: Consultar histórico
  console.log('\n2️⃣ TESTE: Consultando histórico de transferências');
  try {
    const response = await fetch('/api/alunos/1/transferencias', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    console.log('✅ Histórico encontrado:', result.data?.total_transferencias);
    console.log('📊 Transferências:', result.data?.historico_transferencias.length);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  console.log('\n🎯 FUNÇÃO transferirAluno() TESTADA!');
}

/**
 * EXPORTAR EXEMPLOS
 */
export {
  exemploGestorTransferencia,
  exemploDiretorTransferencia,
  exemploAdminTransferencia,
  exemploHistoricoTransferencias,
  erroEmpresasDiferentes,
  erroProfessorSemPermissao,
  erroEscolaInativa,
  estruturaTabelaHistorico,
  casoUsoReorganizacao,
  casoUsoMudancaEndereco,
  casoUsoRelatorios,
  testarTransferirAluno
};

console.log('📚 EXEMPLOS DE USO - FUNÇÃO transferirAluno() CARREGADOS');
console.log('✅ 7 exemplos de resposta disponíveis');
console.log('✅ 3 casos de uso práticos documentados');
console.log('✅ Estrutura da tabela histórico incluída');
console.log('✅ Função de teste implementada');
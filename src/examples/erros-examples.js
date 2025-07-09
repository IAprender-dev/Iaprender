/**
 * EXEMPLOS DE USO - SISTEMA DE ERROS
 * 
 * Este arquivo demonstra como usar o sistema de tratamento de erros
 * customizado em controllers, middleware e validações.
 */

import {
  ErroAutenticacao,
  ErroAutorizacao,
  ErroValidacao,
  ErroAlunoNaoEncontrado,
  ErroEscolaNaoEncontrada,
  ErroAcessoEmpresa,
  ErroMatriculaDuplicada,
  ErroTransferenciaInvalida,
  ErroBancoDados,
  ErroRateLimit,
  middlewareErros,
  criarRespostaErro,
  criarRespostaSucesso,
  capturarErroAsync,
  validarCampos,
  logarErroAuditoria
} from '../utils/erros.js';

/**
 * EXEMPLO 1: USO EM CONTROLLER DE ALUNOS
 */
const exemploControllerAlunos = {
  // Função de controller com tratamento de erros
  buscarAlunoPorId: capturarErroAsync(async (req, res) => {
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(id)) {
      throw new ErroValidacao('ID do aluno deve ser um número válido', {
        campo: 'id',
        valor: id,
        tipo: 'parametro_url'
      });
    }

    // Buscar aluno no banco
    const aluno = await Aluno.findById(id);
    if (!aluno) {
      throw new ErroAlunoNaoEncontrado(id);
    }

    // Verificar acesso por empresa
    if (req.user.tipo_usuario !== 'admin' && req.user.empresa_id !== aluno.empresa_id) {
      throw new ErroAcessoEmpresa(req.user.empresa_id, aluno.empresa_id);
    }

    // Resposta de sucesso
    res.json(criarRespostaSucesso(aluno, 'Aluno encontrado com sucesso'));
  }),

  criarAluno: capturarErroAsync(async (req, res) => {
    // Esquema de validação
    const esquemaValidacao = {
      nome: {
        obrigatorio: true,
        tipo: 'string',
        minimo: 2,
        maximo: 100
      },
      escola_id: {
        obrigatorio: true,
        tipo: 'number',
        validacao: (valor) => valor > 0 || 'ID da escola deve ser um número positivo'
      },
      turma: {
        obrigatorio: true,
        tipo: 'string',
        minimo: 1
      }
    };

    // Validar dados de entrada
    validarCampos(req.body, esquemaValidacao);

    try {
      const novoAluno = await Aluno.create(req.body);
      res.status(201).json(criarRespostaSucesso(novoAluno, 'Aluno criado com sucesso'));
    } catch (error) {
      if (error.code === '23505') { // Código PostgreSQL para duplicata
        throw new ErroMatriculaDuplicada(req.body.matricula, req.body.escola_id);
      }
      throw new ErroBancoDados('Erro ao criar aluno', { erro_original: error.message });
    }
  })
};

/**
 * EXEMPLO 2: MIDDLEWARE DE AUTENTICAÇÃO COM ERROS CUSTOMIZADOS
 */
const exemploMiddlewareAuth = {
  autenticar: capturarErroAsync(async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ErroAutenticacao('Token de acesso não fornecido', {
        header_recebido: req.header('Authorization') || null,
        metodo_esperado: 'Bearer <token>'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id);

      if (!usuario) {
        throw new ErroAutenticacao('Usuário do token não encontrado', {
          token_sub: decoded.sub,
          token_exp: decoded.exp
        });
      }

      req.user = usuario;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ErroTokenInvalido('Token expirado', {
          expiracao: error.expiredAt,
          agora: new Date()
        });
      }
      throw new ErroTokenInvalido('Token inválido', {
        erro: error.message
      });
    }
  }),

  verificarPermissao: (tiposPermitidos) => {
    return capturarErroAsync(async (req, res, next) => {
      if (!req.user) {
        throw new ErroAutenticacao('Usuário não autenticado');
      }

      if (!tiposPermitidos.includes(req.user.tipo_usuario)) {
        throw new ErroAutorizacao('Tipo de usuário não autorizado', {
          tipo_usuario: req.user.tipo_usuario,
          tipos_permitidos: tiposPermitidos,
          recurso_solicitado: req.originalUrl
        });
      }

      next();
    });
  }
};

/**
 * EXEMPLO 3: VALIDAÇÃO DE TRANSFERÊNCIA DE ALUNO
 */
const exemploTransferenciaAluno = {
  transferirAluno: capturarErroAsync(async (req, res) => {
    const { id } = req.params;
    const { nova_escola_id, motivo_transferencia } = req.body;

    // Buscar aluno
    const aluno = await Aluno.findById(id);
    if (!aluno) {
      throw new ErroAlunoNaoEncontrado(id);
    }

    // Buscar escola destino
    const escolaDestino = await Escola.findById(nova_escola_id);
    if (!escolaDestino) {
      throw new ErroEscolaNaoEncontrada(nova_escola_id);
    }

    // Validar regras de negócio
    if (aluno.escola_id === nova_escola_id) {
      throw new ErroTransferenciaInvalida('Aluno já está matriculado nesta escola', {
        aluno_id: id,
        escola_atual: aluno.escola_id,
        escola_destino: nova_escola_id
      });
    }

    if (aluno.empresa_id !== escolaDestino.empresa_id) {
      throw new ErroTransferenciaInvalida('Transferência entre empresas não permitida', {
        empresa_aluno: aluno.empresa_id,
        empresa_escola_destino: escolaDestino.empresa_id
      });
    }

    if (escolaDestino.status !== 'ativa') {
      throw new ErroTransferenciaInvalida('Escola destino não está ativa', {
        escola_id: nova_escola_id,
        status: escolaDestino.status
      });
    }

    // Realizar transferência
    try {
      const transferencia = await realizarTransferencia(aluno, escolaDestino, motivo_transferencia);
      res.json(criarRespostaSucesso(transferencia, 'Transferência realizada com sucesso'));
    } catch (error) {
      logarErroAuditoria(error, {
        userId: req.user.id,
        empresaId: req.user.empresa_id,
        recurso: 'transferencia_aluno',
        operacao: 'transferir',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw error;
    }
  })
};

/**
 * EXEMPLO 4: TRATAMENTO DE RATE LIMITING
 */
const exemploRateLimit = {
  middlewareRateLimit: (limite, janela, tipo = 'requisições') => {
    const contador = new Map();

    return capturarErroAsync(async (req, res, next) => {
      const chave = `${req.ip}_${req.user?.id || 'anonimo'}`;
      const agora = Date.now();
      const janelaMs = janela * 60 * 1000; // Converter minutos para ms

      if (!contador.has(chave)) {
        contador.set(chave, { count: 1, resetTime: agora + janelaMs });
        return next();
      }

      const dadosUsuario = contador.get(chave);

      if (agora > dadosUsuario.resetTime) {
        contador.set(chave, { count: 1, resetTime: agora + janelaMs });
        return next();
      }

      if (dadosUsuario.count >= limite) {
        throw new ErroRateLimit(limite, janela, tipo);
      }

      dadosUsuario.count++;
      next();
    });
  }
};

/**
 * EXEMPLO 5: CONFIGURAÇÃO DO EXPRESS COM MIDDLEWARE DE ERROS
 */
const exemploConfiguracaoExpress = {
  setup: (app) => {
    // Rotas da aplicação
    app.use('/api/alunos', exemploControllerAlunos);

    // Middleware de tratamento de erros (deve ser o último)
    app.use(middlewareErros);

    // Tratamento de rotas não encontradas
    app.use('*', (req, res) => {
      throw new ErroRecursoNaoEncontrado('Rota', req.originalUrl);
    });
  }
};

/**
 * EXEMPLO 6: RESPOSTAS PADRONIZADAS
 */
const exemploRespostasPadronizadas = {
  // Resposta de sucesso simples
  sucessoSimples: criarRespostaSucesso(
    { id: 1, nome: 'João Silva' },
    'Usuário encontrado'
  ),

  // Resposta de sucesso com metadata
  sucessoComMetadata: criarRespostaSucesso(
    [{ id: 1 }, { id: 2 }],
    'Alunos listados com sucesso',
    {
      total: 2,
      pagina: 1,
      limite: 10,
      filtros_aplicados: ['empresa_id', 'turma']
    }
  ),

  // Resposta de erro customizada
  erroCustomizado: criarRespostaErro(
    new ErroValidacao('Email já cadastrado', {
      campo: 'email',
      valor: 'teste@exemplo.com',
      usuario_existente: true
    }),
    {
      method: 'POST',
      originalUrl: '/api/usuarios',
      ip: '192.168.1.1'
    }
  )
};

/**
 * EXEMPLO 7: CASOS DE TESTE PARA ERROS
 */
const exemploTesteErros = {
  // Testar autenticação
  testeAutenticacao: async () => {
    try {
      throw new ErroAutenticacao();
    } catch (error) {
      console.log('✅ Erro de autenticação:', error.toJSON());
    }
  },

  // Testar validação
  testeValidacao: async () => {
    try {
      validarCampos(
        { nome: '', email: 'email-invalido' },
        {
          nome: { obrigatorio: true, minimo: 2 },
          email: { obrigatorio: true, padrao: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
        }
      );
    } catch (error) {
      console.log('✅ Erro de validação:', error.toJSON());
    }
  },

  // Testar erro de regra de negócio
  testeRegraNegocios: async () => {
    try {
      throw new ErroMatriculaDuplicada('2024001', 'Escola A');
    } catch (error) {
      console.log('✅ Erro de regra de negócio:', error.toJSON());
    }
  }
};

/**
 * EXEMPLO 8: LOG DE AUDITORIA DETALHADO
 */
const exemploAuditoria = {
  logarOperacao: (operacao, sucesso, detalhes, req) => {
    const contexto = {
      userId: req.user?.id,
      empresaId: req.user?.empresa_id,
      recurso: req.baseUrl,
      operacao: operacao,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sucesso: sucesso,
      detalhes: detalhes
    };

    if (sucesso) {
      console.log('📋 OPERAÇÃO REALIZADA:', contexto);
    } else {
      logarErroAuditoria(detalhes, contexto);
    }
  }
};

/**
 * EXEMPLO 9: CÓDIGOS DE RESPOSTA MAPEADOS
 */
const exemploCodigosResposta = {
  200: 'Operação realizada com sucesso',
  201: 'Recurso criado com sucesso',
  400: 'Dados inválidos fornecidos',
  401: 'Não autenticado - token inválido ou ausente',
  403: 'Acesso negado - permissões insuficientes',
  404: 'Recurso não encontrado',
  422: 'Regra de negócio violada',
  429: 'Limite de requisições excedido',
  500: 'Erro interno do servidor',
  503: 'Serviço temporariamente indisponível'
};

/**
 * FUNÇÃO PARA EXECUTAR TODOS OS EXEMPLOS
 */
export async function executarExemplosErros() {
  console.log('🧪 EXECUTANDO EXEMPLOS DE ERROS...\n');

  await exemploTesteErros.testeAutenticacao();
  await exemploTesteErros.testeValidacao();
  await exemploTesteErros.testeRegraNegocios();

  console.log('\n✅ Exemplos de resposta:');
  console.log('📤 Sucesso simples:', exemploRespostasPadronizadas.sucessoSimples);
  console.log('📤 Sucesso com metadata:', exemploRespostasPadronizadas.sucessoComMetadata);
  console.log('📤 Erro customizado:', exemploRespostasPadronizadas.erroCustomizado);

  console.log('\n🎯 TODOS OS EXEMPLOS DE ERROS EXECUTADOS!');
}

/**
 * EXPORTAR EXEMPLOS
 */
export {
  exemploControllerAlunos,
  exemploMiddlewareAuth,
  exemploTransferenciaAluno,
  exemploRateLimit,
  exemploConfiguracaoExpress,
  exemploRespostasPadronizadas,
  exemploTesteErros,
  exemploAuditoria,
  exemploCodigosResposta,
  executarExemplosErros
};

console.log('🚨 EXEMPLOS DE SISTEMA DE ERROS CARREGADOS');
console.log('✅ 9 exemplos práticos disponíveis');
console.log('✅ Controllers com tratamento de erros');
console.log('✅ Middleware de autenticação e autorização');
console.log('✅ Validação de regras de negócio');
console.log('✅ Sistema de auditoria e logging');
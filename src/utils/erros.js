/**
 * SISTEMA DE TRATAMENTO DE ERROS - IAPRENDER
 * 
 * Este arquivo contém classes de erro customizadas, middleware de tratamento
 * e funções para respostas padronizadas no sistema educacional.
 */

/**
 * CLASSE BASE PARA ERROS CUSTOMIZADOS
 */
export class ErroBase extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    // Captura stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

/**
 * ERROS DE AUTENTICAÇÃO E AUTORIZAÇÃO
 */
export class ErroAutenticacao extends ErroBase {
  constructor(message = 'Usuário não autenticado', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class ErroAutorizacao extends ErroBase {
  constructor(message = 'Acesso negado - permissões insuficientes', details = null) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
  }
}

export class ErroTokenInvalido extends ErroBase {
  constructor(message = 'Token de acesso inválido ou expirado', details = null) {
    super(message, 401, 'INVALID_TOKEN', details);
  }
}

export class ErroSessaoExpirada extends ErroBase {
  constructor(message = 'Sessão expirada - faça login novamente', details = null) {
    super(message, 401, 'SESSION_EXPIRED', details);
  }
}

/**
 * ERROS DE VALIDAÇÃO DE DADOS
 */
export class ErroValidacao extends ErroBase {
  constructor(message = 'Dados inválidos fornecidos', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ErroCPFInvalido extends ErroValidacao {
  constructor(cpf = null) {
    super('CPF fornecido é inválido', { cpf, tipo: 'documento_brasileiro' });
    this.code = 'INVALID_CPF';
  }
}

export class ErroCNPJInvalido extends ErroValidacao {
  constructor(cnpj = null) {
    super('CNPJ fornecido é inválido', { cnpj, tipo: 'documento_brasileiro' });
    this.code = 'INVALID_CNPJ';
  }
}

export class ErroEmailInvalido extends ErroValidacao {
  constructor(email = null) {
    super('Formato de email inválido', { email, tipo: 'formato_email' });
    this.code = 'INVALID_EMAIL';
  }
}

export class ErroTelefoneInvalido extends ErroValidacao {
  constructor(telefone = null) {
    super('Formato de telefone inválido', { telefone, tipo: 'telefone_brasileiro' });
    this.code = 'INVALID_PHONE';
  }
}

export class ErroCampoObrigatorio extends ErroValidacao {
  constructor(campo, valor = null) {
    super(`Campo '${campo}' é obrigatório`, { campo, valor, tipo: 'campo_obrigatorio' });
    this.code = 'REQUIRED_FIELD';
  }
}

/**
 * ERROS DE RECURSOS E ENTIDADES
 */
export class ErroRecursoNaoEncontrado extends ErroBase {
  constructor(recurso = 'Recurso', id = null) {
    super(`${recurso} não encontrado`, 404, 'RESOURCE_NOT_FOUND', { recurso, id });
  }
}

export class ErroAlunoNaoEncontrado extends ErroRecursoNaoEncontrado {
  constructor(id = null) {
    super('Aluno', id);
    this.code = 'STUDENT_NOT_FOUND';
  }
}

export class ErroEscolaNaoEncontrada extends ErroRecursoNaoEncontrado {
  constructor(id = null) {
    super('Escola', id);
    this.code = 'SCHOOL_NOT_FOUND';
  }
}

export class ErroUsuarioNaoEncontrado extends ErroRecursoNaoEncontrado {
  constructor(id = null) {
    super('Usuário', id);
    this.code = 'USER_NOT_FOUND';
  }
}

export class ErroEmpresaNaoEncontrada extends ErroRecursoNaoEncontrado {
  constructor(id = null) {
    super('Empresa', id);
    this.code = 'COMPANY_NOT_FOUND';
  }
}

/**
 * ERROS DE REGRAS DE NEGÓCIO
 */
export class ErroRegrasNegocio extends ErroBase {
  constructor(message, details = null) {
    super(message, 422, 'BUSINESS_RULE_ERROR', details);
  }
}

export class ErroAcessoEmpresa extends ErroRegrasNegocio {
  constructor(empresaUsuario = null, empresaRecurso = null) {
    super('Usuário não tem acesso a recursos de outra empresa', {
      empresa_usuario: empresaUsuario,
      empresa_recurso: empresaRecurso,
      tipo: 'controle_empresa'
    });
    this.code = 'COMPANY_ACCESS_DENIED';
  }
}

export class ErroMatriculaDuplicada extends ErroRegrasNegocio {
  constructor(matricula = null, escola = null) {
    super('Matrícula já existe nesta escola', {
      matricula,
      escola,
      tipo: 'matricula_duplicada'
    });
    this.code = 'DUPLICATE_ENROLLMENT';
  }
}

export class ErroTransferenciaInvalida extends ErroRegrasNegocio {
  constructor(motivo, details = null) {
    super(`Transferência não pode ser realizada: ${motivo}`, details);
    this.code = 'INVALID_TRANSFER';
  }
}

export class ErroLimiteExcedido extends ErroRegrasNegocio {
  constructor(tipo, limite, atual) {
    super(`Limite de ${tipo} excedido`, {
      tipo,
      limite,
      atual,
      tipo_erro: 'limite_excedido'
    });
    this.code = 'LIMIT_EXCEEDED';
  }
}

/**
 * ERROS DE SISTEMA E BANCO DE DADOS
 */
export class ErroBancoDados extends ErroBase {
  constructor(message = 'Erro interno do banco de dados', details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ErroConexaoBanco extends ErroBancoDados {
  constructor(details = null) {
    super('Falha na conexão com o banco de dados', details);
    this.code = 'DATABASE_CONNECTION_ERROR';
  }
}

export class ErroTransacao extends ErroBancoDados {
  constructor(operacao = 'transação', details = null) {
    super(`Erro durante execução da ${operacao}`, details);
    this.code = 'TRANSACTION_ERROR';
  }
}

export class ErroIntegridadeReferencial extends ErroBancoDados {
  constructor(tabela = null, campo = null, valor = null) {
    super('Violação de integridade referencial', {
      tabela,
      campo,
      valor,
      tipo: 'foreign_key_violation'
    });
    this.code = 'REFERENTIAL_INTEGRITY_ERROR';
  }
}

/**
 * ERROS DE RATE LIMITING
 */
export class ErroRateLimit extends ErroBase {
  constructor(limite = null, janela = null, tipo = 'requisições') {
    super(`Limite de ${tipo} excedido - tente novamente em alguns minutos`, 429, 'RATE_LIMIT_EXCEEDED', {
      limite,
      janela,
      tipo
    });
  }
}

/**
 * ERROS DE CONFIGURAÇÃO E SISTEMA
 */
export class ErroConfiguracao extends ErroBase {
  constructor(configuracao, details = null) {
    super(`Erro de configuração: ${configuracao}`, 500, 'CONFIGURATION_ERROR', details);
  }
}

export class ErroServicoIndisponivel extends ErroBase {
  constructor(servico = 'Serviço', details = null) {
    super(`${servico} temporariamente indisponível`, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * MIDDLEWARE DE TRATAMENTO DE ERROS GLOBAL
 */
export function middlewareErros(err, req, res, next) {
  // Log detalhado do erro
  console.error('🚨 ERRO CAPTURADO:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'não autenticado',
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack
    }
  });

  // Se é um erro customizado operacional
  if (err.isOperational) {
    return res.status(err.statusCode).json(criarRespostaErro(err, req));
  }

  // Tratar erros específicos do sistema
  if (err.name === 'ValidationError') {
    const erroValidacao = new ErroValidacao('Dados de entrada inválidos', {
      campos: err.errors ? Object.keys(err.errors) : null
    });
    return res.status(400).json(criarRespostaErro(erroValidacao, req));
  }

  if (err.name === 'CastError') {
    const erroValidacao = new ErroValidacao('ID inválido fornecido', {
      campo: err.path,
      valor: err.value
    });
    return res.status(400).json(criarRespostaErro(erroValidacao, req));
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      const erroDuplicata = new ErroValidacao('Dados duplicados não permitidos', {
        campo: Object.keys(err.keyValue)[0],
        valor: Object.values(err.keyValue)[0]
      });
      return res.status(400).json(criarRespostaErro(erroDuplicata, req));
    }
    
    const erroBanco = new ErroBancoDados('Erro interno do banco de dados');
    return res.status(500).json(criarRespostaErro(erroBanco, req));
  }

  if (err.name === 'JsonWebTokenError') {
    const erroToken = new ErroTokenInvalido('Token JWT inválido');
    return res.status(401).json(criarRespostaErro(erroToken, req));
  }

  if (err.name === 'TokenExpiredError') {
    const erroSessao = new ErroSessaoExpirada('Token JWT expirado');
    return res.status(401).json(criarRespostaErro(erroSessao, req));
  }

  // Erro genérico não tratado
  const erroGenerico = new ErroBase('Erro interno do servidor');
  res.status(500).json(criarRespostaErro(erroGenerico, req));
}

/**
 * FUNÇÃO PARA CRIAR RESPOSTA PADRONIZADA DE ERRO
 */
export function criarRespostaErro(erro, req = null) {
  const resposta = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      message: erro.message,
      code: erro.code,
      statusCode: erro.statusCode,
      details: erro.details
    }
  };

  // Adicionar informações da requisição se disponível
  if (req) {
    resposta.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip
    };
  }

  // Adicionar stack trace em desenvolvimento
  if (process.env.NODE_ENV === 'development' && erro.stack) {
    resposta.error.stack = erro.stack;
  }

  return resposta;
}

/**
 * FUNÇÃO PARA CRIAR RESPOSTA DE SUCESSO PADRONIZADA
 */
export function criarRespostaSucesso(data, message = 'Operação realizada com sucesso', metadata = null) {
  const resposta = {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data
  };

  if (metadata) {
    resposta.metadata = metadata;
  }

  return resposta;
}

/**
 * WRAPPER ASYNC PARA CAPTURA AUTOMÁTICA DE ERROS
 */
export function capturarErroAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * FUNÇÃO PARA VALIDAR DADOS COM ERROS CUSTOMIZADOS
 */
export function validarCampos(dados, esquema) {
  const erros = [];

  for (const [campo, regras] of Object.entries(esquema)) {
    const valor = dados[campo];

    // Verificar se campo é obrigatório
    if (regras.obrigatorio && (!valor || valor.toString().trim() === '')) {
      erros.push(new ErroCampoObrigatorio(campo, valor));
      continue;
    }

    // Pular validações se campo não é obrigatório e está vazio
    if (!valor) continue;

    // Validar tipo
    if (regras.tipo && typeof valor !== regras.tipo) {
      erros.push(new ErroValidacao(`Campo '${campo}' deve ser do tipo ${regras.tipo}`, {
        campo,
        tipo_esperado: regras.tipo,
        tipo_recebido: typeof valor
      }));
    }

    // Validar comprimento mínimo
    if (regras.minimo && valor.toString().length < regras.minimo) {
      erros.push(new ErroValidacao(`Campo '${campo}' deve ter pelo menos ${regras.minimo} caracteres`, {
        campo,
        minimo: regras.minimo,
        atual: valor.toString().length
      }));
    }

    // Validar comprimento máximo
    if (regras.maximo && valor.toString().length > regras.maximo) {
      erros.push(new ErroValidacao(`Campo '${campo}' deve ter no máximo ${regras.maximo} caracteres`, {
        campo,
        maximo: regras.maximo,
        atual: valor.toString().length
      }));
    }

    // Validar padrão regex
    if (regras.padrao && !regras.padrao.test(valor)) {
      erros.push(new ErroValidacao(`Campo '${campo}' não atende ao padrão exigido`, {
        campo,
        valor,
        padrao: regras.padrao.toString()
      }));
    }

    // Validação customizada
    if (regras.validacao && typeof regras.validacao === 'function') {
      const resultadoCustom = regras.validacao(valor);
      if (resultadoCustom !== true) {
        erros.push(new ErroValidacao(resultadoCustom || `Campo '${campo}' é inválido`, {
          campo,
          valor,
          tipo: 'validacao_customizada'
        }));
      }
    }
  }

  if (erros.length > 0) {
    throw new ErroValidacao('Dados de entrada inválidos', {
      campos_invalidos: erros.length,
      erros: erros.map(err => ({
        campo: err.details?.campo,
        mensagem: err.message,
        detalhes: err.details
      }))
    });
  }

  return true;
}

/**
 * FUNÇÃO PARA LOG DE AUDITORIA DE ERROS
 */
export function logarErroAuditoria(erro, contexto = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    nivel: 'ERROR',
    erro: {
      name: erro.name,
      message: erro.message,
      code: erro.code,
      statusCode: erro.statusCode
    },
    contexto: {
      usuario_id: contexto.userId || null,
      empresa_id: contexto.empresaId || null,
      recurso: contexto.recurso || null,
      operacao: contexto.operacao || null,
      ip: contexto.ip || null,
      user_agent: contexto.userAgent || null
    }
  };

  // Em produção, enviar para serviço de log centralizado
  if (process.env.NODE_ENV === 'production') {
    // Integração com CloudWatch, Sentry, etc.
    console.log('AUDIT_LOG:', JSON.stringify(logEntry));
  } else {
    console.error('🔍 AUDIT ERROR LOG:', logEntry);
  }

  return logEntry;
}

// Log de inicialização
console.log('🚨 SISTEMA DE ERROS CARREGADO:');
console.log('✅ 20+ classes de erro customizadas');
console.log('✅ Middleware de tratamento global');
console.log('✅ Respostas padronizadas');
console.log('✅ Sistema de auditoria');
console.log('✅ Validação automática de campos');
console.log('✅ Wrapper async para captura de erros');
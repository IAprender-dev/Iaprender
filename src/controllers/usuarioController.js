import { Usuario } from '../models/Usuario.js';
import { autenticar } from '../middleware/auth.js';
import { 
  verificarTipoUsuario, 
  verificarProprioUsuario, 
  verificarAcessoUsuario,
  verificarEmpresa,
  apenasAdmin,
  adminOuGestor,
  qualquerTipo
} from '../middleware/autorizar.js';

/**
 * Controller de Usuários
 * Gerencia todas as operações relacionadas aos usuários do sistema
 * Integra modelo Usuario com middlewares de autenticação e autorização
 */
export class UsuarioController {

  // ============================================================================
  // MÉTODOS AUXILIARES E FORMATAÇÃO DE RESPOSTA
  // ============================================================================

  /**
   * Formato padrão de resposta da API
   * @param {Object} res - Objeto response do Express
   * @param {number} statusCode - Código de status HTTP
   * @param {Object} data - Dados da resposta
   * @param {string} message - Mensagem da resposta
   */
  static sendResponse(res, statusCode, data, message = null) {
    const response = {
      success: statusCode < 400,
      timestamp: new Date().toISOString(),
      ...(message && { message }),
      ...(data && { data })
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Trata erros do controller de forma padronizada
   * @param {Object} res - Objeto response do Express
   * @param {Error} error - Erro a ser tratado
   * @param {string} context - Contexto onde ocorreu o erro
   */
  static handleError(res, error, context = '') {
    console.error(`❌ Erro no UsuarioController ${context}:`, error);
    
    // Erros específicos do modelo Usuario
    if (error.code === 'VALIDATION_ERROR') {
      return this.sendResponse(res, 400, null, `Dados inválidos: ${error.errors?.join(', ') || error.message}`);
    }

    if (error.code === 'USER_NOT_FOUND') {
      return this.sendResponse(res, 404, null, 'Usuário não encontrado');
    }

    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return this.sendResponse(res, 409, null, 'Email já está em uso');
    }

    if (error.code === 'COGNITO_SUB_ALREADY_EXISTS') {
      return this.sendResponse(res, 409, null, 'Usuário Cognito já está cadastrado');
    }

    // Erros de autorização
    if (error.code === 'USER_NOT_AUTHENTICATED') {
      return this.sendResponse(res, 401, null, 'Usuário não autenticado');
    }

    if (error.code === 'INSUFFICIENT_USER_TYPE') {
      return this.sendResponse(res, 403, null, 'Permissão insuficiente para esta operação');
    }

    if (error.code === 'COMPANY_ACCESS_DENIED') {
      return this.sendResponse(res, 403, null, 'Acesso negado aos dados desta empresa');
    }

    // Erros de banco de dados PostgreSQL
    if (error.code === '23505') { // Violação de unicidade
      return this.sendResponse(res, 409, null, 'Registro já existe (dados duplicados)');
    }
    
    if (error.code === '23503') { // Violação de chave estrangeira
      return this.sendResponse(res, 400, null, 'Referência inválida (empresa/contrato não existe)');
    }
    
    // Erro genérico
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erro interno do servidor';
      
    this.sendResponse(res, 500, null, message);
  }

  /**
   * Valida campos obrigatórios
   * @param {Object} data - Dados a serem validados
   * @param {Array} requiredFields - Lista de campos obrigatórios
   */
  static validateRequiredFields(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      const error = new Error(`Campos obrigatórios faltando: ${missing.join(', ')}`);
      error.code = 'VALIDATION_ERROR';
      error.errors = missing.map(field => `${field} é obrigatório`);
      throw error;
    }
  }

  /**
   * Validação e sanitização de ID
   * @param {string|number} id - ID a ser validado
   * @param {string} fieldName - Nome do campo para mensagem de erro
   * @returns {number} ID validado
   */
  static validateAndSanitizeId(id, fieldName = 'ID') {
    if (!id) {
      const error = new Error(`${fieldName} é obrigatório`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const numericId = parseInt(id);
    if (isNaN(numericId) || numericId <= 0) {
      const error = new Error(`${fieldName} deve ser um número válido maior que zero`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return numericId;
  }

  /**
   * Validação e sanitização de email
   * @param {string} email - Email a ser validado
   * @returns {string} Email limpo e validado
   */
  static validateAndSanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      const error = new Error('Email é obrigatório');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const emailLimpo = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(emailLimpo)) {
      const error = new Error('Formato de email inválido');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Validar tamanho
    if (emailLimpo.length > 255) {
      const error = new Error('Email muito longo (máximo 255 caracteres)');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return emailLimpo;
  }

  /**
   * Validação de string genérica
   * @param {string} value - Valor a ser validado
   * @param {string} fieldName - Nome do campo
   * @param {Object} options - Opções de validação
   * @returns {string} String limpa
   */
  static validateAndSanitizeString(value, fieldName, options = {}) {
    const { required = false, minLength = 0, maxLength = 255, allowEmpty = false } = options;

    if (required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
      const error = new Error(`${fieldName} é obrigatório`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (!value) {
      return allowEmpty ? '' : null;
    }

    if (typeof value !== 'string') {
      const error = new Error(`${fieldName} deve ser uma string`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const cleanValue = value.trim();

    if (cleanValue.length < minLength) {
      const error = new Error(`${fieldName} deve ter pelo menos ${minLength} caracteres`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (cleanValue.length > maxLength) {
      const error = new Error(`${fieldName} deve ter no máximo ${maxLength} caracteres`);
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // Sanitizar caracteres perigosos básicos
    return cleanValue.replace(/[<>\"']/g, '');
  }

  /**
   * Validação de parâmetros de paginação
   * @param {Object} query - Query parameters
   * @returns {Object} Parâmetros validados
   */
  static validatePaginationParams(query) {
    const { page = 1, limit = 20 } = query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error('Página deve ser um número maior que zero');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (isNaN(limitNum) || limitNum < 1) {
      const error = new Error('Limite deve ser um número maior que zero');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (limitNum > 100) {
      const error = new Error('Limite máximo de 100 registros por página');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    return { page: pageNum, limit: limitNum };
  }

  /**
   * Validação de acesso a dados do usuário
   * @param {Object} requestUser - Usuário da requisição
   * @param {number} targetUserId - ID do usuário alvo
   * @returns {boolean} True se acesso permitido
   */
  static validateUserAccess(requestUser, targetUserId) {
    // Admin tem acesso total
    if (requestUser.tipo_usuario === 'admin') {
      return true;
    }

    // Próprios dados sempre permitidos
    if (requestUser.id === targetUserId) {
      return true;
    }

    // Gestor pode acessar usuários da mesma empresa
    if (requestUser.tipo_usuario === 'gestor' && requestUser.empresa_id) {
      // Esta validação precisa consultar o banco para verificar a empresa do usuário alvo
      // Por ora, retornamos false e deixamos a validação específica para cada endpoint
      return false;
    }

    return false;
  }

  /**
   * Validação de dados específicos por tipo de usuário
   * @param {string} tipoUsuario - Tipo do usuário
   * @param {Object} dados - Dados a serem validados
   * @returns {Array} Array de erros encontrados
   */
  static validateUserTypeSpecificData(tipoUsuario, dados) {
    const errors = [];

    switch (tipoUsuario) {
      case 'professor':
        if (dados.disciplinas && !Array.isArray(dados.disciplinas)) {
          errors.push('Disciplinas deve ser um array');
        }
        if (dados.disciplinas && dados.disciplinas.length === 0) {
          errors.push('Professor deve ter pelo menos uma disciplina');
        }
        break;

      case 'aluno':
        if (dados.serie && typeof dados.serie !== 'string') {
          errors.push('Série deve ser uma string');
        }
        if (dados.turma && typeof dados.turma !== 'string') {
          errors.push('Turma deve ser uma string');
        }
        break;

      case 'diretor':
        if (dados.escola_id && (isNaN(parseInt(dados.escola_id)) || parseInt(dados.escola_id) <= 0)) {
          errors.push('ID da escola deve ser um número válido');
        }
        break;

      case 'gestor':
        if (dados.cargo && typeof dados.cargo !== 'string') {
          errors.push('Cargo deve ser uma string');
        }
        break;
    }

    return errors;
  }

  /**
   * Rate limiting simples baseado em memória
   * @param {string} identifier - Identificador único (IP, user ID, etc.)
   * @param {number} maxRequests - Máximo de requisições permitidas
   * @param {number} windowMs - Janela de tempo em milissegundos
   * @returns {boolean} True se dentro do limite
   */
  static rateLimitCheck(identifier, maxRequests = 100, windowMs = 60000) {
    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    
    const current = this.rateLimitStore.get(key) || 0;
    
    if (current >= maxRequests) {
      return false;
    }

    this.rateLimitStore.set(key, current + 1);

    // Limpeza periódica da store
    if (Math.random() < 0.01) { // 1% de chance
      this.cleanupRateLimitStore(now, windowMs);
    }

    return true;
  }

  /**
   * Limpeza da store de rate limiting
   */
  static cleanupRateLimitStore(now, windowMs) {
    if (!this.rateLimitStore) return;

    const cutoff = now - (windowMs * 2);
    for (const [key] of this.rateLimitStore) {
      const timestamp = parseInt(key.split('_').pop()) * windowMs;
      if (timestamp < cutoff) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  // ============================================================================
  // ENDPOINTS PRINCIPAIS DO CRUD
  // ============================================================================

  /**
   * GET /api/usuarios/:id - Busca usuário por ID
   * Middlewares: autenticar, verificarAcessoUsuario
   */
  static async buscarPorId(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorId - User:', req.user.id, 'Target ID:', req.params.id);

      // Rate limiting por usuário
      const rateLimitKey = `buscarPorId_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 50, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições. Tente novamente em alguns instantes.');
      }

      // Validação e sanitização do ID
      const userId = this.validateAndSanitizeId(req.params.id, 'ID do usuário');

      // Validação de acesso (já feita pelo middleware, mas revalidamos por segurança)
      if (!this.validateUserAccess(req.user, userId)) {
        console.warn(`⚠️ Tentativa de acesso negado: user ${req.user.id} tentando acessar ${userId}`);
        return this.sendResponse(res, 403, null, 'Acesso negado a este usuário');
      }

      const usuario = await Usuario.findById(userId);
      
      if (!usuario) {
        console.warn(`⚠️ Usuário não encontrado: ID ${userId} solicitado por ${req.user.id}`);
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Log de auditoria para acesso a dados de outros usuários
      if (req.user.id !== userId) {
        console.log(`🔍 Acesso a dados de terceiro: ${req.user.tipo_usuario} ${req.user.id} acessou dados do usuário ${userId}`);
      }

      // Retornar dados limpos via toJSON()
      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorId');
    }
  }

  /**
   * GET /api/usuarios/email/:email - Busca usuário por email
   * Middlewares: autenticar, adminOuGestor
   */
  static async buscarPorEmail(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorEmail - User:', req.user.id, 'Target Email:', req.params.email);

      // Rate limiting por usuário
      const rateLimitKey = `buscarPorEmail_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 30, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições. Tente novamente em alguns instantes.');
      }

      // Validação e sanitização do email
      const emailLimpo = this.validateAndSanitizeEmail(req.params.email);

      // Log de auditoria para busca por email
      console.log(`🔍 Busca por email: ${req.user.tipo_usuario} ${req.user.id} buscando ${emailLimpo}`);

      const usuario = await Usuario.findByEmail(emailLimpo);
      
      if (!usuario) {
        console.warn(`⚠️ Usuário não encontrado por email: ${emailLimpo} solicitado por ${req.user.id}`);
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Validação adicional de acesso baseada na empresa (para gestores)
      if (req.user.tipo_usuario === 'gestor' && req.user.empresa_id) {
        if (usuario.empresa_id !== req.user.empresa_id) {
          console.warn(`⚠️ Acesso negado por empresa: gestor ${req.user.id} (empresa ${req.user.empresa_id}) tentando acessar usuário da empresa ${usuario.empresa_id}`);
          return this.sendResponse(res, 403, null, 'Acesso negado a usuários de outras empresas');
        }
      }

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorEmail');
    }
  }

  /**
   * GET /api/usuarios/cognito/:sub - Busca usuário por Cognito Sub
   * Middlewares: autenticar, adminOuGestor
   */
  static async buscarPorCognitoSub(req, res) {
    try {
      console.log('🔍 UsuarioController.buscarPorCognitoSub - User:', req.user.id, 'Target Sub:', req.params.sub);

      // Rate limiting por usuário
      const rateLimitKey = `buscarPorCognitoSub_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 20, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições. Tente novamente em alguns instantes.');
      }

      // Validação e sanitização do Cognito Sub
      const cognitoSub = this.validateAndSanitizeString(req.params.sub, 'Cognito Sub', {
        required: true,
        minLength: 10,
        maxLength: 255
      });

      // Log de auditoria para busca por Cognito Sub
      console.log(`🔍 Busca por Cognito Sub: ${req.user.tipo_usuario} ${req.user.id} buscando ${cognitoSub}`);

      const usuario = await Usuario.findByCognitoSub(cognitoSub);
      
      if (!usuario) {
        console.warn(`⚠️ Usuário não encontrado por Cognito Sub: ${cognitoSub} solicitado por ${req.user.id}`);
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Validação adicional de acesso baseada na empresa (para gestores)
      if (req.user.tipo_usuario === 'gestor' && req.user.empresa_id) {
        if (usuario.empresa_id !== req.user.empresa_id) {
          console.warn(`⚠️ Acesso negado por empresa: gestor ${req.user.id} (empresa ${req.user.empresa_id}) tentando acessar usuário da empresa ${usuario.empresa_id}`);
          return this.sendResponse(res, 403, null, 'Acesso negado a usuários de outras empresas');
        }
      }

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário encontrado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'buscarPorCognitoSub');
    }
  }

  /**
   * GET /api/usuarios - Lista usuários com filtros e paginação
   * Middlewares: autenticar, adminOuGestor, verificarEmpresa (opcional)
   */
  static async listarUsuarios(req, res) {
    try {
      console.log('📋 UsuarioController.listarUsuarios - User:', req.user.id, 'Query:', req.query);

      // Rate limiting por usuário
      const rateLimitKey = `listarUsuarios_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 20, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições. Tente novamente em alguns instantes.');
      }

      // Validação de parâmetros de paginação
      const paginationParams = this.validatePaginationParams(req.query);

      // Sanitização e validação de parâmetros de filtro
      const {
        tipo_usuario,
        empresa_id,
        status = 'ativo',
        search,
        orderBy = 'nome',
        orderDirection = 'ASC'
      } = req.query;

      // Validar e sanitizar campos de busca
      const searchTerm = search ? this.validateAndSanitizeString(search, 'Termo de busca', {
        maxLength: 100,
        allowEmpty: true
      }) : null;

      // Validar orderBy contra lista permitida
      const allowedOrderBy = ['nome', 'email', 'tipo_usuario', 'criado_em', 'ultimo_login'];
      const validOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'nome';

      // Validar orderDirection
      const validOrderDirection = ['ASC', 'DESC'].includes(orderDirection.toUpperCase()) 
        ? orderDirection.toUpperCase() 
        : 'ASC';

      // Filtros baseados no usuário logado
      const filters = { 
        status: this.validateAndSanitizeString(status, 'Status', { 
          required: false,
          allowEmpty: true 
        }) || 'ativo'
      };
      
      // Controle rigoroso de acesso por empresa
      if (req.user.tipo_usuario !== 'admin') {
        // Gestores só veem usuários da própria empresa
        if (req.user.empresa_id) {
          filters.empresa_id = req.user.empresa_id;
          console.log(`🔒 Gestor ${req.user.id} limitado à empresa ${req.user.empresa_id}`);
        } else {
          console.warn(`⚠️ Gestor ${req.user.id} sem empresa_id definida - acesso negado`);
          return this.sendResponse(res, 403, null, 'Gestor deve estar vinculado a uma empresa');
        }
      } else if (empresa_id) {
        // Admin pode especificar empresa específica
        const empresaIdValidada = this.validateAndSanitizeId(empresa_id, 'ID da empresa');
        filters.empresa_id = empresaIdValidada;
      }

      // Validar tipo_usuario contra lista permitida
      if (tipo_usuario) {
        const allowedTypes = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
        if (allowedTypes.includes(tipo_usuario)) {
          filters.tipo_usuario = tipo_usuario;
        } else {
          return this.sendResponse(res, 400, null, `Tipo de usuário inválido. Tipos permitidos: ${allowedTypes.join(', ')}`);
        }
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      const options = {
        page: paginationParams.page,
        limit: paginationParams.limit,
        orderBy: validOrderBy,
        orderDirection: validOrderDirection
      };

      // Log de auditoria da consulta
      console.log(`📋 Listagem de usuários: ${req.user.tipo_usuario} ${req.user.id} - Filtros:`, filters, 'Opções:', options);

      const resultado = await Usuario.findAll(filters, options);

      // Log de resultado
      console.log(`✅ Listagem retornou ${resultado.usuarios.length} de ${resultado.total} usuários`);

      this.sendResponse(res, 200, {
        usuarios: resultado.usuarios.map(u => u.toJSON()),
        pagination: {
          page: options.page,
          limit: options.limit,
          total: resultado.total,
          pages: Math.ceil(resultado.total / options.limit),
          hasNext: options.page < Math.ceil(resultado.total / options.limit),
          hasPrev: options.page > 1
        },
        filters: filters, // Retornar filtros aplicados para transparência
        metadata: {
          requested_by: req.user.id,
          request_timestamp: new Date().toISOString(),
          user_type: req.user.tipo_usuario
        }
      }, 'Usuários listados com sucesso');

    } catch (error) {
      this.handleError(res, error, 'listarUsuarios');
    }
  }

  /**
   * POST /api/usuarios - Cria novo usuário
   * Middlewares: autenticar, adminOuGestor
   */
  static async criarUsuario(req, res) {
    try {
      console.log('📝 UsuarioController.criarUsuario - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Rate limiting rigoroso para criação de usuários
      const rateLimitKey = `criarUsuario_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 10, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas tentativas de criação. Aguarde antes de tentar novamente.');
      }

      // Validar campos obrigatórios
      this.validateRequiredFields(req.body, [
        'cognito_sub', 'email', 'nome', 'tipo_usuario'
      ]);

      // Validação e sanitização rigorosa dos dados de entrada
      const dadosLimpos = {};

      // Campos obrigatórios com validação específica
      dadosLimpos.cognito_sub = this.validateAndSanitizeString(req.body.cognito_sub, 'Cognito Sub', {
        required: true,
        minLength: 10,
        maxLength: 255
      });

      dadosLimpos.email = this.validateAndSanitizeEmail(req.body.email);

      dadosLimpos.nome = this.validateAndSanitizeString(req.body.nome, 'Nome', {
        required: true,
        minLength: 2,
        maxLength: 100
      });

      // Validar tipo_usuario contra lista permitida
      const allowedTypes = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      if (!allowedTypes.includes(req.body.tipo_usuario)) {
        return this.sendResponse(res, 400, null, `Tipo de usuário inválido. Tipos permitidos: ${allowedTypes.join(', ')}`);
      }
      dadosLimpos.tipo_usuario = req.body.tipo_usuario;

      // Validação de hierarquia de criação
      const tiposPermitidosPorUsuario = {
        admin: ['admin', 'gestor', 'diretor', 'professor', 'aluno'],
        gestor: ['diretor', 'professor', 'aluno']
      };

      const tiposPermitidos = tiposPermitidosPorUsuario[req.user.tipo_usuario] || [];
      if (!tiposPermitidos.includes(req.body.tipo_usuario)) {
        console.warn(`⚠️ Tentativa de criação não autorizada: ${req.user.tipo_usuario} tentando criar ${req.body.tipo_usuario}`);
        return this.sendResponse(res, 403, null, `${req.user.tipo_usuario}s podem criar apenas: ${tiposPermitidos.join(', ')}`);
      }

      // Campos opcionais com validação
      if (req.body.telefone) {
        dadosLimpos.telefone = this.validateAndSanitizeString(req.body.telefone, 'Telefone', {
          maxLength: 20
        });
      }

      if (req.body.documento) {
        // Sanitizar documento removendo pontuação
        const documentoLimpo = req.body.documento.replace(/\D/g, '');
        if (documentoLimpo.length !== 11 && documentoLimpo.length !== 14) {
          return this.sendResponse(res, 400, null, 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
        }
        dadosLimpos.documento = documentoLimpo;
      }

      if (req.body.endereco) {
        dadosLimpos.endereco = this.validateAndSanitizeString(req.body.endereco, 'Endereço', {
          maxLength: 255
        });
      }

      if (req.body.cidade) {
        dadosLimpos.cidade = this.validateAndSanitizeString(req.body.cidade, 'Cidade', {
          maxLength: 100
        });
      }

      if (req.body.estado) {
        dadosLimpos.estado = this.validateAndSanitizeString(req.body.estado, 'Estado', {
          maxLength: 2
        });
      }

      // Controle rigoroso de empresa_id
      if (req.user.tipo_usuario === 'admin') {
        // Admin pode especificar empresa ou deixar null
        if (req.body.empresa_id) {
          dadosLimpos.empresa_id = this.validateAndSanitizeId(req.body.empresa_id, 'ID da empresa');
        }
      } else {
        // Gestor: usuário deve ser criado na mesma empresa
        if (!req.user.empresa_id) {
          return this.sendResponse(res, 403, null, 'Gestor deve estar vinculado a uma empresa para criar usuários');
        }
        dadosLimpos.empresa_id = req.user.empresa_id;
        console.log(`🔒 Gestor ${req.user.id} criando usuário na empresa ${req.user.empresa_id}`);
      }

      // Validação específica por tipo de usuário
      const validationErrors = this.validateUserTypeSpecificData(req.body.tipo_usuario, req.body);
      if (validationErrors.length > 0) {
        return this.sendResponse(res, 400, { errors: validationErrors }, 'Dados específicos inválidos');
      }

      // Adicionar campos específicos por tipo (se fornecidos)
      const camposEspecificosPorTipo = {
        professor: ['disciplinas', 'formacao', 'escola_id', 'data_admissao'],
        aluno: ['matricula', 'turma', 'serie', 'turno', 'nome_responsavel', 'contato_responsavel', 'escola_id', 'data_matricula'],
        diretor: ['escola_id', 'cargo', 'data_inicio'],
        gestor: ['cargo', 'data_admissao']
      };

      const camposEspecificos = camposEspecificosPorTipo[req.body.tipo_usuario] || [];
      camposEspecificos.forEach(campo => {
        if (req.body[campo] !== undefined) {
          if (campo === 'escola_id' && req.body[campo]) {
            dadosLimpos[campo] = this.validateAndSanitizeId(req.body[campo], 'ID da escola');
          } else if (typeof req.body[campo] === 'string') {
            dadosLimpos[campo] = this.validateAndSanitizeString(req.body[campo], campo, {
              maxLength: 255
            });
          } else {
            dadosLimpos[campo] = req.body[campo];
          }
        }
      });

      // Log de auditoria da tentativa de criação
      console.log(`📝 Tentativa de criação de usuário: ${req.user.tipo_usuario} ${req.user.id} criando ${dadosLimpos.tipo_usuario} (${dadosLimpos.email})`);

      const usuario = await Usuario.criar(dadosLimpos);

      // Log de sucesso
      console.log(`✅ Usuário criado com sucesso: ID ${usuario.id} (${usuario.email}) por ${req.user.id}`);

      // Preparar resposta com metadata de segurança
      const resposta = {
        usuario: usuario.toJSON(),
        metadata: {
          criado_por: req.user.id,
          tipo_criador: req.user.tipo_usuario,
          empresa_atribuida: dadosLimpos.empresa_id,
          timestamp: new Date().toISOString()
        }
      };

      this.sendResponse(res, 201, resposta, 'Usuário criado com sucesso');

    } catch (error) {
      // Log de erro na criação
      console.error(`❌ Erro ao criar usuário: ${req.user.id} tentando criar ${req.body?.email}:`, error.message);
      this.handleError(res, error, 'criarUsuario');
    }
  }

  /**
   * PATCH /api/usuarios/:id - Atualiza usuário
   * Middlewares: autenticar, verificarAcessoUsuario
   */
  static async atualizarUsuario(req, res) {
    try {
      console.log('📝 UsuarioController.atualizarUsuario - User:', req.user.id, 'Target ID:', req.params.id);

      // Rate limiting para atualizações
      const rateLimitKey = `atualizarUsuario_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 15, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas tentativas de atualização. Aguarde antes de tentar novamente.');
      }

      // Validação e sanitização do ID
      const userId = this.validateAndSanitizeId(req.params.id, 'ID do usuário');

      // Verificar se há dados para atualizar
      if (!req.body || Object.keys(req.body).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum dado fornecido para atualização');
      }

      // Buscar usuário atual para validações
      const usuarioAtual = await Usuario.findById(userId);
      if (!usuarioAtual) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Validação de acesso adicional (validar se pode editar este usuário)
      if (!this.validateUserAccess(req.user, userId) && req.user.id !== userId) {
        console.warn(`⚠️ Tentativa de atualização não autorizada: ${req.user.id} tentando atualizar ${userId}`);
        return this.sendResponse(res, 403, null, 'Acesso negado para atualizar este usuário');
      }

      // Campos que não podem ser alterados nunca
      const camposProtegidos = ['id', 'cognito_sub', 'criado_em', 'atualizado_em'];
      const dadosLimpos = {};

      // Filtrar e validar cada campo
      Object.keys(req.body).forEach(campo => {
        if (camposProtegidos.includes(campo)) {
          console.warn(`⚠️ Tentativa de alterar campo protegido: ${campo} por usuário ${req.user.id}`);
          return; // Ignora campo protegido
        }

        const valor = req.body[campo];

        // Validação específica por campo
        try {
          switch (campo) {
            case 'email':
              // Só admin pode alterar email
              if (req.user.tipo_usuario !== 'admin') {
                console.warn(`⚠️ Tentativa de alterar email por não-admin: ${req.user.id}`);
                return;
              }
              dadosLimpos.email = this.validateAndSanitizeEmail(valor);
              break;

            case 'nome':
              dadosLimpos.nome = this.validateAndSanitizeString(valor, 'Nome', {
                required: true,
                minLength: 2,
                maxLength: 100
              });
              break;

            case 'telefone':
              if (valor) {
                dadosLimpos.telefone = this.validateAndSanitizeString(valor, 'Telefone', {
                  maxLength: 20
                });
              }
              break;

            case 'documento':
              if (valor) {
                const documentoLimpo = valor.replace(/\D/g, '');
                if (documentoLimpo.length !== 11 && documentoLimpo.length !== 14) {
                  throw new Error('Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
                }
                dadosLimpos.documento = documentoLimpo;
              }
              break;

            case 'endereco':
              if (valor) {
                dadosLimpos.endereco = this.validateAndSanitizeString(valor, 'Endereço', {
                  maxLength: 255
                });
              }
              break;

            case 'cidade':
              if (valor) {
                dadosLimpos.cidade = this.validateAndSanitizeString(valor, 'Cidade', {
                  maxLength: 100
                });
              }
              break;

            case 'estado':
              if (valor) {
                dadosLimpos.estado = this.validateAndSanitizeString(valor, 'Estado', {
                  maxLength: 2
                });
              }
              break;

            case 'tipo_usuario':
              // Só admin pode alterar tipo_usuario
              if (req.user.tipo_usuario !== 'admin') {
                console.warn(`⚠️ Tentativa de alterar tipo_usuario por não-admin: ${req.user.id}`);
                return;
              }
              const allowedTypes = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
              if (!allowedTypes.includes(valor)) {
                throw new Error(`Tipo de usuário inválido. Tipos permitidos: ${allowedTypes.join(', ')}`);
              }
              dadosLimpos.tipo_usuario = valor;
              break;

            case 'empresa_id':
              // Só admin pode alterar empresa_id
              if (req.user.tipo_usuario !== 'admin') {
                console.warn(`⚠️ Tentativa de alterar empresa_id por não-admin: ${req.user.id}`);
                return;
              }
              if (valor) {
                dadosLimpos.empresa_id = this.validateAndSanitizeId(valor, 'ID da empresa');
              }
              break;

            case 'status':
              // Só admin pode alterar status
              if (req.user.tipo_usuario !== 'admin') {
                console.warn(`⚠️ Tentativa de alterar status por não-admin: ${req.user.id}`);
                return;
              }
              if (valor) {
                dadosLimpos.status = this.validateAndSanitizeString(valor, 'Status', {
                  maxLength: 20
                });
              }
              break;

            case 'configuracoes':
              // Validar se é um objeto JSON válido
              if (valor && typeof valor === 'object') {
                dadosLimpos.configuracoes = valor;
              }
              break;

            default:
              // Campo genérico - sanitizar como string se não for null
              if (valor !== null && valor !== undefined) {
                dadosLimpos[campo] = this.validateAndSanitizeString(valor, campo, {
                  maxLength: 255,
                  allowEmpty: true
                });
              }
          }
        } catch (fieldError) {
          console.warn(`⚠️ Erro ao validar campo ${campo}:`, fieldError.message);
          throw new Error(`Erro no campo ${campo}: ${fieldError.message}`);
        }
      });

      // Verificar se há dados válidos para atualizar
      if (Object.keys(dadosLimpos).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum campo válido fornecido para atualização');
      }

      // Log de auditoria da atualização
      console.log(`📝 Atualização de usuário: ${req.user.tipo_usuario} ${req.user.id} atualizando ${userId} - Campos: ${Object.keys(dadosLimpos).join(', ')}`);

      const usuario = await Usuario.atualizar(userId, dadosLimpos);

      if (!usuario) {
        return this.sendResponse(res, 500, null, 'Erro ao atualizar usuário');
      }

      // Log de sucesso
      console.log(`✅ Usuário atualizado com sucesso: ID ${userId} por ${req.user.id}`);

      // Preparar resposta com metadata
      const resposta = {
        usuario: usuario.toJSON(),
        metadata: {
          atualizado_por: req.user.id,
          tipo_atualizador: req.user.tipo_usuario,
          campos_atualizados: Object.keys(dadosLimpos),
          timestamp: new Date().toISOString()
        }
      };

      this.sendResponse(res, 200, resposta, 'Usuário atualizado com sucesso');

    } catch (error) {
      console.error(`❌ Erro ao atualizar usuário: ${req.user.id} tentando atualizar ${req.params.id}:`, error.message);
      this.handleError(res, error, 'atualizarUsuario');
    }
  }

  /**
   * DELETE /api/usuarios/:id - Remove usuário
   * Middlewares: autenticar, apenasAdmin
   */
  static async removerUsuario(req, res) {
    try {
      console.log('🗑️ UsuarioController.removerUsuario - Admin:', req.user.id, 'Target ID:', req.params.id);

      // Rate limiting rigoroso para remoção (operação crítica)
      const rateLimitKey = `removerUsuario_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 5, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas tentativas de remoção. Aguarde antes de tentar novamente.');
      }

      // Validação e sanitização do ID
      const userId = this.validateAndSanitizeId(req.params.id, 'ID do usuário');

      // Buscar usuário antes da remoção para logs de auditoria
      const usuarioParaRemover = await Usuario.findById(userId);
      if (!usuarioParaRemover) {
        console.warn(`⚠️ Tentativa de remoção de usuário inexistente: ID ${userId} por admin ${req.user.id}`);
        return this.sendResponse(res, 404, null, 'Usuário não encontrado para remoção');
      }

      // Validação de proteção: admin não pode remover a si mesmo
      if (req.user.id === userId) {
        console.warn(`⚠️ Admin ${req.user.id} tentou remover a si mesmo - operação bloqueada`);
        return this.sendResponse(res, 403, null, 'Não é possível remover seu próprio usuário');
      }

      // Validação adicional: verificar se é último admin do sistema
      if (usuarioParaRemover.tipo_usuario === 'admin') {
        const totalAdmins = await Usuario.countByType('admin');
        if (totalAdmins <= 1) {
          console.warn(`⚠️ Tentativa de remoção do último admin do sistema por ${req.user.id}`);
          return this.sendResponse(res, 403, null, 'Não é possível remover o último administrador do sistema');
        }
      }

      // Log de auditoria ANTES da remoção
      console.log(`🗑️ REMOÇÃO DE USUÁRIO: Admin ${req.user.id} removendo usuário ${userId} (${usuarioParaRemover.email}, ${usuarioParaRemover.tipo_usuario})`);

      const sucesso = await Usuario.deletar(userId);

      if (sucesso) {
        // Log de auditoria de sucesso
        console.log(`✅ Usuário removido com sucesso: ID ${userId} (${usuarioParaRemover.email}) por admin ${req.user.id}`);

        // Preparar resposta com metadata de segurança
        const resposta = {
          usuario_removido: {
            id: usuarioParaRemover.id,
            email: usuarioParaRemover.email,
            nome: usuarioParaRemover.nome,
            tipo_usuario: usuarioParaRemover.tipo_usuario
          },
          metadata: {
            removido_por: req.user.id,
            timestamp: new Date().toISOString(),
            ip_origem: req.ip || req.connection.remoteAddress
          }
        };

        this.sendResponse(res, 200, resposta, 'Usuário removido com sucesso');
      } else {
        console.error(`❌ Falha na remoção: Usuário ${userId} não foi removido por razões desconhecidas`);
        this.sendResponse(res, 500, null, 'Erro interno ao remover usuário');
      }

    } catch (error) {
      console.error(`❌ Erro ao remover usuário: Admin ${req.user.id} tentando remover ${req.params.id}:`, error.message);
      this.handleError(res, error, 'removerUsuario');
    }
  }

  // ============================================================================
  // ENDPOINTS ESPECÍFICOS E UTILITÁRIOS
  // ============================================================================

  /**
   * GET /api/usuarios/me - Perfil do usuário logado
   * Middlewares: autenticar
   */
  static async meuPerfil(req, res) {
    try {
      console.log('👤 UsuarioController.meuPerfil - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Rate limiting básico para perfil
      const rateLimitKey = `meuPerfil_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 60, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições de perfil. Aguarde antes de tentar novamente.');
      }

      // Buscar dados atualizados do usuário no banco
      const usuario = await Usuario.findById(req.user.id);
      
      if (!usuario) {
        console.warn(`⚠️ Perfil não encontrado no banco: user ${req.user.id} autenticado mas sem registro local`);
        return this.sendResponse(res, 404, null, 'Perfil do usuário não encontrado no banco de dados');
      }

      // Validação de consistência entre token e banco
      if (usuario.email !== req.user.email) {
        console.warn(`⚠️ Inconsistência de dados: token email=${req.user.email}, banco email=${usuario.email} para user ${req.user.id}`);
        // Não bloquear, mas registrar para investigação
      }

      // Log de acesso ao próprio perfil
      console.log(`👤 Acesso ao próprio perfil: ${req.user.tipo_usuario} ${req.user.id} (${usuario.email})`);

      // Preparar resposta com dados do banco + timestamp de acesso
      const perfilComMetadata = {
        ...usuario.toJSON(),
        metadata: {
          ultimo_acesso_perfil: new Date().toISOString(),
          fonte_dados: 'banco_local',
          token_exp: req.user.exp ? new Date(req.user.exp * 1000).toISOString() : null
        }
      };

      this.sendResponse(res, 200, perfilComMetadata, 'Perfil obtido com sucesso');

    } catch (error) {
      console.error(`❌ Erro ao obter perfil: user ${req.user.id}:`, error.message);
      this.handleError(res, error, 'meuPerfil');
    }
  }

  /**
   * GET /api/usuarios/perfil - Perfil completo com dados específicos do tipo
   * Middlewares: autenticar
   * Retorna dados do req.user + informações específicas do tipo (professor, aluno, etc.)
   */
  static async obterPerfil(req, res) {
    try {
      console.log('👤 UsuarioController.obterPerfil - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Rate limiting para perfil completo
      const rateLimitKey = `obterPerfil_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 30, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas requisições de perfil completo. Aguarde antes de tentar novamente.');
      }

      // Dados básicos do usuário do token JWT
      const perfilBasico = {
        id: req.user.id,
        sub: req.user.sub,
        nome: req.user.nome,
        email: req.user.email,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id,
        groups: req.user.groups || [],
        exp: req.user.exp,
        iat: req.user.iat
      };

      // Buscar dados completos do usuário no banco
      const usuarioCompleto = await Usuario.findById(req.user.id);
      
      if (!usuarioCompleto) {
        return this.sendResponse(res, 404, null, 'Dados do usuário não encontrados no banco');
      }

      // Dados base do perfil
      const perfilCompleto = {
        ...perfilBasico,
        ...usuarioCompleto.toJSON(),
        dadosEspecificos: {}
      };

      // Buscar dados específicos baseados no tipo de usuário
      try {
        switch (req.user.tipo_usuario) {
          case 'professor':
            const { Professor } = await import('../models/Professor.js');
            const dadosProfessor = await Professor.findByUserId(req.user.id);
            if (dadosProfessor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'professor',
                professor_id: dadosProfessor.id,
                escola_id: dadosProfessor.escola_id,
                disciplinas: dadosProfessor.disciplinas,
                formacao: dadosProfessor.formacao,
                data_admissao: dadosProfessor.data_admissao,
                status: dadosProfessor.status
              };
            }
            break;

          case 'aluno':
            const { Aluno } = await import('../models/Aluno.js');
            const dadosAluno = await Aluno.findByUserId(req.user.id);
            if (dadosAluno) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'aluno',
                aluno_id: dadosAluno.id,
                escola_id: dadosAluno.escola_id,
                matricula: dadosAluno.matricula,
                turma: dadosAluno.turma,
                serie: dadosAluno.serie,
                turno: dadosAluno.turno,
                nome_responsavel: dadosAluno.nome_responsavel,
                contato_responsavel: dadosAluno.contato_responsavel,
                data_matricula: dadosAluno.data_matricula,
                status: dadosAluno.status
              };
            }
            break;

          case 'diretor':
            const { Diretor } = await import('../models/Diretor.js');
            const dadosDiretor = await Diretor.findByUserId(req.user.id);
            if (dadosDiretor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'diretor',
                diretor_id: dadosDiretor.id,
                escola_id: dadosDiretor.escola_id,
                cargo: dadosDiretor.cargo,
                data_inicio: dadosDiretor.data_inicio,
                status: dadosDiretor.status
              };
            }
            break;

          case 'gestor':
            const { Gestor } = await import('../models/Gestor.js');
            const dadosGestor = await Gestor.findByUserId(req.user.id);
            if (dadosGestor) {
              perfilCompleto.dadosEspecificos = {
                tipo: 'gestor',
                gestor_id: dadosGestor.id,
                cargo: dadosGestor.cargo,
                data_admissao: dadosGestor.data_admissao,
                status: dadosGestor.status
              };
            }
            break;

          case 'admin':
            perfilCompleto.dadosEspecificos = {
              tipo: 'admin',
              descricao: 'Administrador do sistema',
              permissoes: [
                'Gestão completa de usuários',
                'Gestão de empresas e contratos',
                'Acesso a estatísticas globais',
                'Configurações do sistema'
              ],
              acesso_total: true
            };
            break;

          default:
            perfilCompleto.dadosEspecificos = {
              tipo: req.user.tipo_usuario,
              descricao: 'Tipo de usuário sem dados específicos definidos'
            };
        }

        // Buscar dados da empresa se existir
        if (req.user.empresa_id) {
          const { Empresa } = await import('../models/Empresa.js');
          const empresa = await Empresa.findById(req.user.empresa_id);
          if (empresa) {
            perfilCompleto.empresa = {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: empresa.cnpj,
              cidade: empresa.cidade,
              estado: empresa.estado
            };
          }
        }

        // Adicionar timestamp e metadata
        perfilCompleto.metadata = {
          ultimo_acesso: new Date().toISOString(),
          versao_perfil: '1.0',
          fonte_dados: 'jwt_token_e_banco_local',
          dados_especificos_carregados: Object.keys(perfilCompleto.dadosEspecificos).length > 0
        };

        console.log(`✅ Perfil completo carregado para ${req.user.tipo_usuario}: ${req.user.nome}`);
        
        this.sendResponse(res, 200, perfilCompleto, 'Perfil completo obtido com sucesso');

      } catch (modelError) {
        console.warn(`⚠️ Erro ao carregar dados específicos do ${req.user.tipo_usuario}:`, modelError.message);
        
        // Retornar perfil básico mesmo se dados específicos falharem
        perfilCompleto.dadosEspecificos = {
          tipo: req.user.tipo_usuario,
          erro: 'Dados específicos não puderam ser carregados',
          detalhes: modelError.message
        };

        this.sendResponse(res, 200, perfilCompleto, 'Perfil obtido com dados básicos (dados específicos indisponíveis)');
      }

    } catch (error) {
      this.handleError(res, error, 'obterPerfil');
    }
  }

  /**
   * PATCH /api/usuarios/perfil - Atualizar perfil completo com validações
   * Middlewares: autenticar
   * Valida permissões e atualiza apenas campos permitidos para cada tipo de usuário
   */
  static async atualizarPerfil(req, res) {
    try {
      console.log('✏️ UsuarioController.atualizarPerfil - User:', req.user.id, 'Tipo:', req.user.tipo_usuario);

      // Rate limiting para atualizações de perfil
      const rateLimitKey = `atualizarPerfil_${req.user.id}`;
      if (!this.rateLimitCheck(rateLimitKey, 10, 60000)) {
        return this.sendResponse(res, 429, null, 'Muitas tentativas de atualização de perfil. Aguarde antes de tentar novamente.');
      }

      // Verificar se há dados para atualizar
      if (!req.body || Object.keys(req.body).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum dado fornecido para atualização');
      }

      // Buscar usuário atual
      const usuarioAtual = await Usuario.findById(req.user.id);
      
      if (!usuarioAtual) {
        console.warn(`⚠️ Usuário não encontrado ao atualizar perfil: ${req.user.id}`);
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      // Definir campos permitidos por tipo de usuário
      const camposPermitidos = this._getCamposPermitidos(req.user.tipo_usuario);
      console.log(`🔒 Campos permitidos para ${req.user.tipo_usuario}:`, camposPermitidos);

      // Filtrar apenas campos permitidos dos dados recebidos
      const dadosParaAtualizar = {};
      const camposEnviados = Object.keys(req.body);
      const camposNaoPermitidos = [];

      camposEnviados.forEach(campo => {
        if (camposPermitidos.includes(campo)) {
          dadosParaAtualizar[campo] = req.body[campo];
        } else {
          camposNaoPermitidos.push(campo);
        }
      });

      // Log de campos não permitidos (sem bloquear a operação)
      if (camposNaoPermitidos.length > 0) {
        console.warn(`⚠️ Campos não permitidos ignorados para ${req.user.tipo_usuario}:`, camposNaoPermitidos);
      }

      // Validar se há dados para atualizar
      if (Object.keys(dadosParaAtualizar).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum campo válido fornecido para atualização');
      }

      // Validações específicas
      const validationErrors = this._validarDadosAtualizacao(dadosParaAtualizar, usuarioAtual);
      if (validationErrors.length > 0) {
        return this.sendResponse(res, 400, { errors: validationErrors }, 'Dados inválidos para atualização');
      }

      // Atualizar dados principais do usuário
      console.log('📝 Atualizando dados principais:', Object.keys(dadosParaAtualizar));
      const usuarioAtualizado = await Usuario.update(req.user.id, dadosParaAtualizar);

      if (!usuarioAtualizado) {
        return this.sendResponse(res, 500, null, 'Erro ao atualizar perfil');
      }

      // Atualizar dados específicos se fornecidos
      const resultadoEspecificos = await this._atualizarDadosEspecificos(req.user, req.body);

      // Construir resposta com perfil atualizado
      const perfilAtualizado = await this._construirPerfilCompleto(usuarioAtualizado, req.user.tipo_usuario);

      // Log da operação
      console.log(`✅ Perfil atualizado com sucesso para ${req.user.tipo_usuario}: ${usuarioAtualizado.nome}`);

      // Preparar resposta detalhada
      const resposta = {
        usuario: perfilAtualizado,
        atualizacoes: {
          campos_atualizados: Object.keys(dadosParaAtualizar),
          campos_ignorados: camposNaoPermitidos,
          dados_especificos: resultadoEspecificos
        },
        metadata: {
          atualizado_em: new Date().toISOString(),
          atualizado_por: req.user.id,
          tipo_usuario: req.user.tipo_usuario
        }
      };

      this.sendResponse(res, 200, resposta, 'Perfil atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarPerfil');
    }
  }

  /**
   * Retorna campos permitidos para atualização por tipo de usuário
   */
  static _getCamposPermitidos(tipoUsuario) {
    const camposBasicos = ['nome', 'telefone', 'endereco', 'cidade', 'estado', 'data_nascimento'];
    
    const permissoesPorTipo = {
      admin: [
        ...camposBasicos,
        'email', // Admin pode alterar email
        'documento',
        'tipo_usuario', // Admin pode alterar tipo
        'empresa_id', // Admin pode alterar empresa
        'status'
      ],
      gestor: [
        ...camposBasicos,
        'documento'
        // Gestor não pode alterar email, tipo_usuario ou empresa_id
      ],
      diretor: [
        ...camposBasicos
        // Diretor não pode alterar dados sensíveis
      ],
      professor: [
        ...camposBasicos
        // Professor só pode alterar dados pessoais básicos
      ],
      aluno: [
        'nome', 'telefone', 'endereco', 'cidade', 'estado'
        // Aluno tem permissões mais limitadas
      ]
    };

    return permissoesPorTipo[tipoUsuario] || camposBasicos;
  }

  /**
   * Valida dados de atualização
   */
  static _validarDadosAtualizacao(dados, usuarioAtual) {
    const erros = [];

    // Validar email se fornecido
    if (dados.email && dados.email !== usuarioAtual.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dados.email)) {
        erros.push('Email deve ter formato válido');
      }
    }

    // Validar telefone se fornecido
    if (dados.telefone) {
      const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!telefoneRegex.test(dados.telefone)) {
        erros.push('Telefone deve ter formato (XX) XXXXX-XXXX');
      }
    }

    // Validar documento se fornecido
    if (dados.documento) {
      // CPF: 11 dígitos, CNPJ: 14 dígitos
      const docLimpo = dados.documento.replace(/\D/g, '');
      if (docLimpo.length !== 11 && docLimpo.length !== 14) {
        erros.push('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
      }
    }

    // Validar data de nascimento se fornecida
    if (dados.data_nascimento) {
      const data = new Date(dados.data_nascimento);
      if (isNaN(data.getTime()) || data > new Date()) {
        erros.push('Data de nascimento deve ser válida e não futura');
      }
    }

    // Validar tipo_usuario se fornecido (apenas admin pode alterar)
    if (dados.tipo_usuario) {
      const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      if (!tiposValidos.includes(dados.tipo_usuario)) {
        erros.push('Tipo de usuário deve ser: admin, gestor, diretor, professor ou aluno');
      }
    }

    // Validar empresa_id se fornecido
    if (dados.empresa_id && dados.empresa_id !== null) {
      if (!Number.isInteger(Number(dados.empresa_id)) || Number(dados.empresa_id) <= 0) {
        erros.push('ID da empresa deve ser um número inteiro positivo');
      }
    }

    return erros;
  }

  /**
   * Atualiza dados específicos do tipo de usuário se fornecidos
   */
  static async _atualizarDadosEspecificos(user, dadosRecebidos) {
    const resultado = {
      atualizou: false,
      tipo: user.tipo_usuario,
      campos: [],
      erro: null
    };

    try {
      // Verificar se há dados específicos para atualizar
      const camposEspecificos = this._extrairCamposEspecificos(user.tipo_usuario, dadosRecebidos);
      
      if (Object.keys(camposEspecificos).length === 0) {
        return resultado;
      }

      switch (user.tipo_usuario) {
        case 'professor':
          if (camposEspecificos.disciplinas || camposEspecificos.formacao) {
            const { Professor } = await import('../models/Professor.js');
            const professor = await Professor.findByUserId(user.id);
            if (professor) {
              await Professor.update(professor.id, camposEspecificos);
              resultado.atualizou = true;
              resultado.campos = Object.keys(camposEspecificos);
            }
          }
          break;

        case 'aluno':
          if (camposEspecificos.nome_responsavel || camposEspecificos.contato_responsavel) {
            const { Aluno } = await import('../models/Aluno.js');
            const aluno = await Aluno.findByUserId(user.id);
            if (aluno) {
              await Aluno.update(aluno.id, camposEspecificos);
              resultado.atualizou = true;
              resultado.campos = Object.keys(camposEspecificos);
            }
          }
          break;

        case 'diretor':
          // Diretores geralmente não podem alterar cargo ou escola
          // Apenas dados pessoais através dos campos básicos
          break;

        case 'gestor':
          // Gestores geralmente não podem alterar cargo
          // Apenas dados pessoais através dos campos básicos
          break;
      }

    } catch (error) {
      console.warn(`⚠️ Erro ao atualizar dados específicos do ${user.tipo_usuario}:`, error.message);
      resultado.erro = error.message;
    }

    return resultado;
  }

  /**
   * Extrai campos específicos do tipo de usuário dos dados recebidos
   */
  static _extrairCamposEspecificos(tipoUsuario, dados) {
    const camposEspecificos = {};

    switch (tipoUsuario) {
      case 'professor':
        if (dados.disciplinas) camposEspecificos.disciplinas = dados.disciplinas;
        if (dados.formacao) camposEspecificos.formacao = dados.formacao;
        break;
      
      case 'aluno':
        if (dados.nome_responsavel) camposEspecificos.nome_responsavel = dados.nome_responsavel;
        if (dados.contato_responsavel) camposEspecificos.contato_responsavel = dados.contato_responsavel;
        break;
    }

    return camposEspecificos;
  }

  /**
   * Constrói perfil completo após atualização
   */
  static async _construirPerfilCompleto(usuario, tipoUsuario) {
    const perfil = usuario.toJSON();

    // Adicionar dados específicos se existirem
    try {
      switch (tipoUsuario) {
        case 'professor':
          const { Professor } = await import('../models/Professor.js');
          const professor = await Professor.findByUserId(usuario.id);
          if (professor) {
            perfil.dadosEspecificos = {
              disciplinas: professor.disciplinas,
              formacao: professor.formacao,
              escola_id: professor.escola_id
            };
          }
          break;

        case 'aluno':
          const { Aluno } = await import('../models/Aluno.js');
          const aluno = await Aluno.findByUserId(usuario.id);
          if (aluno) {
            perfil.dadosEspecificos = {
              matricula: aluno.matricula,
              turma: aluno.turma,
              nome_responsavel: aluno.nome_responsavel,
              contato_responsavel: aluno.contato_responsavel
            };
          }
          break;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar dados específicos após atualização:', error.message);
    }

    return perfil;
  }

  /**
   * GET /api/usuarios - Listar usuários com filtros e paginação
   * Middlewares: autenticar, adminOuGestor, verificarEmpresa
   * Lista usuários da mesma empresa com filtros por tipo e paginação
   */
  static async listarUsuarios(req, res) {
    try {
      console.log('📋 UsuarioController.listarUsuarios - User:', req.user.id, 'Empresa:', req.user.empresa_id);

      // Extrair parâmetros de paginação
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Máximo 100 registros
      const offset = (page - 1) * limit;

      console.log(`📄 Paginação: page=${page}, limit=${limit}, offset=${offset}`);

      // Extrair filtros
      const filtros = this._extrairFiltros(req.query, req.user);
      console.log('🔍 Filtros aplicados:', filtros);

      // Buscar usuários com filtros
      const { usuarios, total } = await this._buscarUsuariosComFiltros(filtros, limit, offset);

      // Enriquecer dados dos usuários se solicitado
      const incluirDadosEspecificos = req.query.include_dados_especificos === 'true';
      let usuariosEnriquecidos = usuarios;

      if (incluirDadosEspecificos) {
        console.log('🔄 Enriquecendo dados específicos dos usuários...');
        usuariosEnriquecidos = await this._enriquecerDadosEspecificos(usuarios);
      }

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      // Preparar resposta
      const resposta = {
        usuarios: usuariosEnriquecidos,
        paginacao: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null
        },
        filtros_aplicados: filtros,
        metadata: {
          empresa_id: req.user.empresa_id,
          solicitado_por: req.user.id,
          tipo_solicitante: req.user.tipo_usuario,
          timestamp: new Date().toISOString(),
          dados_especificos_incluidos: incluirDadosEspecificos
        }
      };

      console.log(`✅ Listagem concluída: ${usuarios.length} usuários encontrados de ${total} total`);
      this.sendResponse(res, 200, resposta, `${usuarios.length} usuários encontrados`);

    } catch (error) {
      this.handleError(res, error, 'listarUsuarios');
    }
  }

  /**
   * Extrai e valida filtros da query string
   */
  static _extrairFiltros(query, user) {
    const filtros = {};

    // Filtro por empresa (obrigatório para gestores)
    if (user.tipo_usuario === 'admin' && query.empresa_id) {
      filtros.empresa_id = parseInt(query.empresa_id);
    } else if (user.empresa_id) {
      filtros.empresa_id = user.empresa_id; // Força empresa do usuário
    }

    // Filtro por tipo de usuário
    if (query.tipo_usuario) {
      const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      const tiposFiltro = Array.isArray(query.tipo_usuario) 
        ? query.tipo_usuario 
        : query.tipo_usuario.split(',');
      
      filtros.tipo_usuario = tiposFiltro.filter(tipo => tiposValidos.includes(tipo.trim()));
    }

    // Filtro por status
    if (query.status) {
      const statusValidos = ['ativo', 'inativo', 'pendente', 'bloqueado'];
      if (statusValidos.includes(query.status)) {
        filtros.status = query.status;
      }
    }

    // Filtro por busca textual (nome ou email)
    if (query.busca && query.busca.trim()) {
      filtros.busca = query.busca.trim();
    }

    // Filtro por data de criação
    if (query.data_inicio) {
      const dataInicio = new Date(query.data_inicio);
      if (!isNaN(dataInicio.getTime())) {
        filtros.data_inicio = dataInicio;
      }
    }

    if (query.data_fim) {
      const dataFim = new Date(query.data_fim);
      if (!isNaN(dataFim.getTime())) {
        filtros.data_fim = dataFim;
      }
    }

    // Ordenação
    const ordenacaoValida = ['nome', 'email', 'tipo_usuario', 'criado_em', 'ultimo_login'];
    if (query.ordem_por && ordenacaoValida.includes(query.ordem_por)) {
      filtros.ordem_por = query.ordem_por;
      filtros.ordem_direcao = query.ordem_direcao === 'desc' ? 'DESC' : 'ASC';
    } else {
      filtros.ordem_por = 'nome';
      filtros.ordem_direcao = 'ASC';
    }

    return filtros;
  }

  /**
   * Busca usuários aplicando filtros e paginação
   */
  static async _buscarUsuariosComFiltros(filtros, limit, offset) {
    try {
      // Construir WHERE clause
      const condicoes = [];
      const parametros = [];
      let paramIndex = 1;

      // Filtro por empresa
      if (filtros.empresa_id) {
        condicoes.push(`empresa_id = $${paramIndex}`);
        parametros.push(filtros.empresa_id);
        paramIndex++;
      }

      // Filtro por tipo de usuário
      if (filtros.tipo_usuario && filtros.tipo_usuario.length > 0) {
        const placeholders = filtros.tipo_usuario.map(() => `$${paramIndex++}`);
        condicoes.push(`tipo_usuario IN (${placeholders.join(', ')})`);
        parametros.push(...filtros.tipo_usuario);
      }

      // Filtro por status
      if (filtros.status) {
        condicoes.push(`status = $${paramIndex}`);
        parametros.push(filtros.status);
        paramIndex++;
      }

      // Filtro por busca textual
      if (filtros.busca) {
        condicoes.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        parametros.push(`%${filtros.busca}%`);
        paramIndex++;
      }

      // Filtro por data de criação
      if (filtros.data_inicio) {
        condicoes.push(`criado_em >= $${paramIndex}`);
        parametros.push(filtros.data_inicio);
        paramIndex++;
      }

      if (filtros.data_fim) {
        condicoes.push(`criado_em <= $${paramIndex}`);
        parametros.push(filtros.data_fim);
        paramIndex++;
      }

      // Construir query principal
      const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
      const orderClause = `ORDER BY ${filtros.ordem_por} ${filtros.ordem_direcao}`;

      const queryUsuarios = `
        SELECT id, cognito_sub, email, nome, telefone, endereco, cidade, estado, 
               documento, tipo_usuario, empresa_id, status, ultimo_login, criado_em, atualizado_em
        FROM usuarios 
        ${whereClause}
        ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      parametros.push(limit, offset);

      // Query para contar total
      const queryTotal = `
        SELECT COUNT(*) as total
        FROM usuarios 
        ${whereClause}
      `;

      const parametrosTotal = parametros.slice(0, -2); // Remove limit e offset

      console.log('🔍 Query usuários:', queryUsuarios);
      console.log('📊 Parâmetros:', parametros);

      // Importar função de banco
      const { executeQuery } = await import('../config/database.js');

      // Executar queries
      const [resultUsuarios, resultTotal] = await Promise.all([
        executeQuery(queryUsuarios, parametros),
        executeQuery(queryTotal, parametrosTotal)
      ]);

      return {
        usuarios: resultUsuarios.rows,
        total: parseInt(resultTotal.rows[0].total)
      };

    } catch (error) {
      console.error('❌ Erro ao buscar usuários com filtros:', error);
      throw error;
    }
  }

  /**
   * Enriquece dados dos usuários com informações específicas
   */
  static async _enriquecerDadosEspecificos(usuarios) {
    try {
      const usuariosEnriquecidos = [];

      for (const usuario of usuarios) {
        const usuarioEnriquecido = { ...usuario };

        // Adicionar dados específicos baseados no tipo
        try {
          switch (usuario.tipo_usuario) {
            case 'professor':
              const { Professor } = await import('../models/Professor.js');
              const professor = await Professor.findByUserId(usuario.id);
              if (professor) {
                usuarioEnriquecido.dados_especificos = {
                  disciplinas: professor.disciplinas,
                  formacao: professor.formacao,
                  escola_id: professor.escola_id,
                  data_admissao: professor.data_admissao
                };
              }
              break;

            case 'aluno':
              const { Aluno } = await import('../models/Aluno.js');
              const aluno = await Aluno.findByUserId(usuario.id);
              if (aluno) {
                usuarioEnriquecido.dados_especificos = {
                  matricula: aluno.matricula,
                  turma: aluno.turma,
                  serie: aluno.serie,
                  nome_responsavel: aluno.nome_responsavel,
                  contato_responsavel: aluno.contato_responsavel
                };
              }
              break;

            case 'diretor':
              const { Diretor } = await import('../models/Diretor.js');
              const diretor = await Diretor.findByUserId(usuario.id);
              if (diretor) {
                usuarioEnriquecido.dados_especificos = {
                  escola_id: diretor.escola_id,
                  cargo: diretor.cargo,
                  data_inicio: diretor.data_inicio
                };
              }
              break;

            case 'gestor':
              const { Gestor } = await import('../models/Gestor.js');
              const gestor = await Gestor.findByUserId(usuario.id);
              if (gestor) {
                usuarioEnriquecido.dados_especificos = {
                  cargo: gestor.cargo,
                  data_admissao: gestor.data_admissao
                };
              }
              break;

            default:
              usuarioEnriquecido.dados_especificos = null;
          }
        } catch (modelError) {
          console.warn(`⚠️ Erro ao carregar dados específicos para usuário ${usuario.id}:`, modelError.message);
          usuarioEnriquecido.dados_especificos = null;
        }

        usuariosEnriquecidos.push(usuarioEnriquecido);
      }

      return usuariosEnriquecidos;

    } catch (error) {
      console.error('❌ Erro ao enriquecer dados específicos:', error);
      return usuarios; // Retorna dados básicos em caso de erro
    }
  }

  /**
   * POST /api/usuarios - Cria novo usuário
   * Middlewares: autenticar, adminOuGestor
   */
  static async criarUsuario(req, res) {
    try {
      console.log('➕ UsuarioController.criarUsuario - User:', req.user.id, 'Dados:', req.body);

      // Validar campos obrigatórios
      this.validateRequiredFields(req.body, [
        'cognito_sub', 'email', 'nome', 'tipo_usuario'
      ]);

      const {
        cognito_sub,
        email,
        nome,
        telefone,
        endereco,
        cidade,
        estado,
        data_nascimento,
        documento,
        tipo_usuario,
        empresa_id,
        status = 'ativo',
        configuracoes = {}
      } = req.body;

      console.log('🔍 Dados recebidos para criação:', { cognito_sub, email, nome, tipo_usuario, empresa_id });

      // Determinar empresa_id baseado no tipo de usuário solicitante
      let empresaFinal;
      if (req.user.tipo_usuario === 'admin') {
        // Admin pode especificar empresa ou deixar null
        empresaFinal = empresa_id || null;
      } else if (req.user.tipo_usuario === 'gestor') {
        // Gestor só pode criar usuários na própria empresa
        empresaFinal = req.user.empresa_id;
        if (empresa_id && empresa_id !== req.user.empresa_id) {
          console.warn('⚠️ Gestor tentou criar usuário em empresa diferente');
          return this.sendResponse(res, 400, null, 
            'Gestores só podem criar usuários em sua própria empresa');
        }
      } else {
        return this.sendResponse(res, 403, null, 
          'Apenas administradores e gestores podem criar usuários');
      }

      // Validações específicas por tipo de usuário
      const validacaoTipo = this._validarTipoUsuarioParaCriacao(tipo_usuario, req.user);
      if (!validacaoTipo.valido) {
        return this.sendResponse(res, 400, null, validacaoTipo.motivo);
      }

      // Validar se empresa existe (se especificada)
      if (empresaFinal) {
        const { Empresa } = await import('../models/Empresa.js');
        const empresa = await Empresa.findById(empresaFinal);
        if (!empresa) {
          return this.sendResponse(res, 400, null, 'Empresa especificada não encontrada');
        }
        console.log('✅ Empresa validada:', empresa.nome);
      }

      // Verificar se email já existe
      const usuarioExistente = await Usuario.findByEmail(email);
      if (usuarioExistente) {
        return this.sendResponse(res, 409, null, 
          `Já existe um usuário com o email: ${email}`);
      }

      // Verificar se cognito_sub já existe
      const cognitoExistente = await Usuario.findByCognitoSub(cognito_sub);
      if (cognitoExistente) {
        return this.sendResponse(res, 409, null, 
          `Já existe um usuário com o Cognito Sub: ${cognito_sub}`);
      }

      // Preparar dados para criação
      const dadosUsuario = {
        cognito_sub,
        email: email.toLowerCase().trim(),
        nome: nome.trim(),
        telefone: telefone?.trim(),
        endereco: endereco?.trim(),
        cidade: cidade?.trim(),
        estado: estado?.trim(),
        data_nascimento,
        documento: documento?.replace(/\D/g, ''), // Remove pontuação
        tipo_usuario,
        empresa_id: empresaFinal,
        status,
        configuracoes: typeof configuracoes === 'object' ? configuracoes : {}
      };

      console.log('📝 Dados preparados para criação:', dadosUsuario);

      // Criar usuário
      const novoUsuario = await Usuario.criar(dadosUsuario);
      console.log('✅ Usuário criado com sucesso:', novoUsuario.id);

      // Criar registro específico do tipo de usuário se necessário
      const dadosEspecificos = this._extrairDadosEspecificos(tipo_usuario, req.body);
      if (dadosEspecificos && Object.keys(dadosEspecificos).length > 0) {
        try {
          await this._criarRegistroEspecifico(tipo_usuario, novoUsuario.id, empresaFinal, dadosEspecificos);
          console.log('✅ Registro específico criado para tipo:', tipo_usuario);
        } catch (errorEspecifico) {
          console.warn('⚠️ Erro ao criar registro específico:', errorEspecifico.message);
          // Não falha a criação do usuário por erro no registro específico
        }
      }

      // Preparar resposta
      const usuarioResposta = novoUsuario.toJSON();
      const resposta = {
        ...usuarioResposta,
        metadata: {
          criado_por: req.user.id,
          tipo_criador: req.user.tipo_usuario,
          empresa_atribuida: empresaFinal,
          timestamp: new Date().toISOString(),
          registros_especificos_criados: dadosEspecificos ? Object.keys(dadosEspecificos) : []
        }
      };

      console.log(`✅ Criação concluída: usuário ${novoUsuario.id} (${tipo_usuario}) na empresa ${empresaFinal}`);
      this.sendResponse(res, 201, resposta, 'Usuário criado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'criarUsuario');
    }
  }

  /**
   * Valida se o tipo de usuário pode ser criado pelo solicitante
   */
  static _validarTipoUsuarioParaCriacao(tipoUsuario, userSolicitante) {
    const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
    
    if (!tiposValidos.includes(tipoUsuario)) {
      return {
        valido: false,
        motivo: `Tipo de usuário inválido. Tipos válidos: ${tiposValidos.join(', ')}`
      };
    }

    // Regras hierárquicas de criação
    if (userSolicitante.tipo_usuario === 'admin') {
      // Admin pode criar qualquer tipo
      return { valido: true };
    }

    if (userSolicitante.tipo_usuario === 'gestor') {
      // Gestor pode criar diretor, professor, aluno (não pode criar admin ou outros gestores)
      const tiposPermitidos = ['diretor', 'professor', 'aluno'];
      if (!tiposPermitidos.includes(tipoUsuario)) {
        return {
          valido: false,
          motivo: `Gestores podem criar apenas: ${tiposPermitidos.join(', ')}`
        };
      }
      return { valido: true };
    }

    return {
      valido: false,
      motivo: 'Apenas administradores e gestores podem criar usuários'
    };
  }

  /**
   * Extrai dados específicos do tipo de usuário dos dados de criação
   */
  static _extrairDadosEspecificos(tipoUsuario, dados) {
    const dadosEspecificos = {};

    switch (tipoUsuario) {
      case 'gestor':
        if (dados.cargo) dadosEspecificos.cargo = dados.cargo;
        if (dados.data_admissao) dadosEspecificos.data_admissao = dados.data_admissao;
        break;

      case 'diretor':
        if (dados.escola_id) dadosEspecificos.escola_id = dados.escola_id;
        if (dados.cargo) dadosEspecificos.cargo = dados.cargo;
        if (dados.data_inicio) dadosEspecificos.data_inicio = dados.data_inicio;
        break;

      case 'professor':
        if (dados.disciplinas) dadosEspecificos.disciplinas = dados.disciplinas;
        if (dados.formacao) dadosEspecificos.formacao = dados.formacao;
        if (dados.escola_id) dadosEspecificos.escola_id = dados.escola_id;
        if (dados.data_admissao) dadosEspecificos.data_admissao = dados.data_admissao;
        break;

      case 'aluno':
        if (dados.matricula) dadosEspecificos.matricula = dados.matricula;
        if (dados.turma) dadosEspecificos.turma = dados.turma;
        if (dados.serie) dadosEspecificos.serie = dados.serie;
        if (dados.turno) dadosEspecificos.turno = dados.turno;
        if (dados.nome_responsavel) dadosEspecificos.nome_responsavel = dados.nome_responsavel;
        if (dados.contato_responsavel) dadosEspecificos.contato_responsavel = dados.contato_responsavel;
        if (dados.escola_id) dadosEspecificos.escola_id = dados.escola_id;
        if (dados.data_matricula) dadosEspecificos.data_matricula = dados.data_matricula;
        break;
    }

    return dadosEspecificos;
  }

  /**
   * Cria registro específico do tipo de usuário
   */
  static async _criarRegistroEspecifico(tipoUsuario, userId, empresaId, dadosEspecificos) {
    const dadosComIds = {
      ...dadosEspecificos,
      usr_id: userId,
      empresa_id: empresaId,
      nome: dadosEspecificos.nome || 'Nome do registro específico',
      status: 'ativo'
    };

    switch (tipoUsuario) {
      case 'gestor':
        const { Gestor } = await import('../models/Gestor.js');
        await Gestor.criar(dadosComIds);
        break;

      case 'diretor':
        const { Diretor } = await import('../models/Diretor.js');
        await Diretor.criar(dadosComIds);
        break;

      case 'professor':
        const { Professor } = await import('../models/Professor.js');
        await Professor.criar(dadosComIds);
        break;

      case 'aluno':
        const { Aluno } = await import('../models/Aluno.js');
        if (!dadosEspecificos.matricula) {
          // Gerar matrícula única se não fornecida
          dadosComIds.matricula = `${new Date().getFullYear()}${String(userId).padStart(3, '0')}`;
        }
        await Aluno.criar(dadosComIds);
        break;
    }
  }

  /**
   * PATCH /api/usuarios/me - Atualiza perfil do usuário logado
   * Middlewares: autenticar
   */
  static async atualizarMeuPerfil(req, res) {
    try {
      console.log('📝 UsuarioController.atualizarMeuPerfil - User:', req.user.id, 'Dados:', req.body);

      // Campos que o usuário pode alterar no próprio perfil
      const camposPermitidos = [
        'nome', 'telefone', 'endereco', 'cidade', 'estado', 
        'data_nascimento', 'configuracoes'
      ];
      
      const dadosLimpos = {};
      camposPermitidos.forEach(campo => {
        if (req.body[campo] !== undefined) {
          dadosLimpos[campo] = req.body[campo];
        }
      });

      if (Object.keys(dadosLimpos).length === 0) {
        return this.sendResponse(res, 400, null, 'Nenhum campo válido fornecido para atualização');
      }

      const usuario = await Usuario.atualizar(req.user.id, dadosLimpos);

      this.sendResponse(res, 200, usuario.toJSON(), 'Perfil atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarMeuPerfil');
    }
  }

  /**
   * POST /api/usuarios/:id/ultimo-login - Atualiza último login
   * Middlewares: autenticar, verificarProprioUsuario
   */
  static async atualizarUltimoLogin(req, res) {
    try {
      console.log('🕒 UsuarioController.atualizarUltimoLogin - ID:', req.params.id);

      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return this.sendResponse(res, 400, null, 'ID do usuário inválido');
      }

      const usuario = await Usuario.findById(parseInt(id));
      if (!usuario) {
        return this.sendResponse(res, 404, null, 'Usuário não encontrado');
      }

      await usuario.updateLastLogin();

      this.sendResponse(res, 200, null, 'Último login atualizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'atualizarUltimoLogin');
    }
  }

  /**
   * GET /api/usuarios/empresa/:empresaId - Lista usuários por empresa
   * Middlewares: autenticar, verificarEmpresa
   */
  static async listarPorEmpresa(req, res) {
    try {
      console.log('🏢 UsuarioController.listarPorEmpresa - Empresa:', req.params.empresaId);

      const { empresaId } = req.params;
      
      if (!empresaId || isNaN(parseInt(empresaId))) {
        return this.sendResponse(res, 400, null, 'ID da empresa inválido');
      }

      const usuarios = await Usuario.findByEmpresa(parseInt(empresaId));

      this.sendResponse(res, 200, {
        usuarios: usuarios.map(u => u.toJSON()),
        total: usuarios.length
      }, 'Usuários da empresa listados com sucesso');

    } catch (error) {
      this.handleError(res, error, 'listarPorEmpresa');
    }
  }

  /**
   * GET /api/usuarios/stats - Estatísticas dos usuários
   * Middlewares: autenticar, adminOuGestor
   */
  static async estatisticas(req, res) {
    try {
      console.log('📊 UsuarioController.estatisticas');

      const stats = await Usuario.getStats();

      this.sendResponse(res, 200, stats, 'Estatísticas obtidas com sucesso');

    } catch (error) {
      this.handleError(res, error, 'estatisticas');
    }
  }

  // ============================================================================
  // MÉTODOS DE SINCRONIZAÇÃO COM COGNITO
  // ============================================================================

  /**
   * POST /api/usuarios/sincronizar - Sincroniza usuário com Cognito
   * Middlewares: autenticar, adminOuGestor
   */
  static async sincronizarComCognito(req, res) {
    try {
      console.log('🔄 UsuarioController.sincronizarComCognito - Dados:', req.body);

      this.validateRequiredFields(req.body, ['cognito_sub', 'email', 'nome']);

      const { sincronizarUsuario } = await import('../middleware/autorizar.js');
      const usuario = await sincronizarUsuario(req.body);

      this.sendResponse(res, 200, usuario.toJSON(), 'Usuário sincronizado com sucesso');

    } catch (error) {
      this.handleError(res, error, 'sincronizarComCognito');
    }
  }
}

export default UsuarioController;
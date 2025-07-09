import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para usuários
 * Gerencia todas as operações CRUD e validações para a tabela usuarios
 */
export class Usuario {
  constructor(data = {}) {
    this.id = data.id || null;
    this.cognito_sub = data.cognito_sub || null;
    this.email = data.email || null;
    this.nome = data.nome || null;
    this.tipo_usuario = data.tipo_usuario || null;
    this.empresa_id = data.empresa_id || null;
    this.telefone = data.telefone || null;
    this.endereco = data.endereco || null;
    this.data_nascimento = data.data_nascimento || null;
    this.documento = data.documento || null;
    this.foto_perfil = data.foto_perfil || null;
    this.status = data.status || 'ativo';
    this.ultimo_login = data.ultimo_login || null;
    this.configuracoes = data.configuracoes || {};
    this.criado_em = data.criado_em || null;
    this.atualizado_em = data.atualizado_em || null;
  }

  // ============================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ============================================================================

  /**
   * Limpa e estrutura dados do usuário para retorno seguro
   * @param {Object} userData - Dados brutos do banco
   * @returns {Object} - Dados limpos e estruturados
   */
  _cleanUserData(userData) {
    try {
      // Parse seguro das configurações JSON
      let configuracoes = {};
      if (userData.configuracoes) {
        try {
          configuracoes = typeof userData.configuracoes === 'string' 
            ? JSON.parse(userData.configuracoes) 
            : userData.configuracoes;
        } catch (parseError) {
          console.warn('⚠️ Erro ao fazer parse das configurações:', parseError.message);
          configuracoes = {};
        }
      }

      // Retorna objeto limpo com tipos corretos
      return {
        id: parseInt(userData.id),
        cognito_sub: userData.cognito_sub || null,
        email: userData.email?.trim() || null,
        nome: userData.nome?.trim() || null,
        tipo_usuario: userData.tipo_usuario || null,
        empresa_id: userData.empresa_id ? parseInt(userData.empresa_id) : null,
        telefone: userData.telefone?.trim() || null,
        endereco: userData.endereco?.trim() || null,
        data_nascimento: userData.data_nascimento || null,
        documento: userData.documento?.trim() || null,
        foto_perfil: userData.foto_perfil?.trim() || null,
        status: userData.status || 'ativo',
        ultimo_login: userData.ultimo_login || null,
        configuracoes: configuracoes,
        criado_em: userData.criado_em || null,
        atualizado_em: userData.atualizado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao limpar dados do usuário:', error.message);
      throw new Error('Erro interno ao processar dados do usuário');
    }
  }

  /**
   * Sanitiza entrada de string removendo caracteres perigosos
   * @param {string} input - String de entrada
   * @returns {string} - String sanitizada
   */
  _sanitizeString(input) {
    if (!input || typeof input !== 'string') return null;
    
    return input
      .trim()
      .replace(/[<>'"]/g, '') // Remove caracteres HTML perigosos
      .substring(0, 500); // Limita tamanho
  }

  /**
   * Valida e sanitiza ID numérico
   * @param {any} id - ID a ser validado
   * @returns {number|null} - ID validado ou null
   */
  _validateId(id) {
    const numId = parseInt(id);
    return isNaN(numId) || numId <= 0 ? null : numId;
  }

  // ============================================================================
  // VALIDAÇÕES
  // ============================================================================

  /**
   * Valida os dados do usuário
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = [];

    // Validações obrigatórias
    if (!this.email) {
      errors.push('Email é obrigatório');
    } else if (!this.isValidEmail(this.email)) {
      errors.push('Email deve ter formato válido');
    }

    if (!this.nome) {
      errors.push('Nome é obrigatório');
    } else if (this.nome.length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!this.tipo_usuario) {
      errors.push('Tipo de usuário é obrigatório');
    } else if (!['admin', 'gestor', 'diretor', 'professor', 'aluno'].includes(this.tipo_usuario)) {
      errors.push('Tipo de usuário deve ser: admin, gestor, diretor, professor ou aluno');
    }

    // Validações condicionais
    if (this.telefone && !this.isValidPhone(this.telefone)) {
      errors.push('Telefone deve ter formato válido');
    }

    if (this.documento && !this.isValidDocument(this.documento)) {
      errors.push('Documento deve ter formato válido (CPF ou CNPJ)');
    }

    if (this.data_nascimento && !this.isValidDate(this.data_nascimento)) {
      errors.push('Data de nascimento deve ter formato válido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida formato de email
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de telefone brasileiro
   * @param {string} phone 
   * @returns {boolean}
   */
  isValidPhone(phone) {
    const phoneRegex = /^(?:\+55)?(?:\s)?(?:\(?[1-9]{2}\)?)?(?:\s)?[9]?[0-9]{4}[-\s]?[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Valida CPF ou CNPJ
   * @param {string} document 
   * @returns {boolean}
   */
  isValidDocument(document) {
    const cleanDoc = document.replace(/\D/g, '');
    return cleanDoc.length === 11 || cleanDoc.length === 14; // CPF ou CNPJ
  }

  /**
   * Valida formato de data
   * @param {string} date 
   * @returns {boolean}
   */
  isValidDate(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  }

  // ============================================================================
  // MÉTODOS CRUD
  // ============================================================================

  /**
   * Cria um novo usuário
   * @returns {Promise<Usuario>}
   */
  async create() {
    try {
      console.log('📝 Criando novo usuário:', this.nome);
      
      // Validação dos dados de entrada
      const validation = this.validate();
      if (!validation.valid) {
        const error = new Error('Dados inválidos: ' + validation.errors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      // Verificar se email já existe usando prepared statement
      const existingUser = await Usuario.findByEmail(this.email);
      if (existingUser) {
        const error = new Error('Email já está em uso');
        error.code = 'EMAIL_ALREADY_EXISTS';
        error.email = this.email;
        throw error;
      }

      // Verificar se cognito_sub já existe (se fornecido) usando prepared statement
      if (this.cognito_sub) {
        const existingCognito = await Usuario.findByCognitoSub(this.cognito_sub);
        if (existingCognito) {
          const error = new Error('Usuário Cognito já está vinculado a outra conta');
          error.code = 'COGNITO_SUB_ALREADY_EXISTS';
          error.cognito_sub = this.cognito_sub;
          throw error;
        }
      }

      // Query com prepared statements (proteção contra SQL injection)
      const query = `
        INSERT INTO usuarios (
          cognito_sub, email, nome, tipo_usuario, empresa_id, telefone, 
          endereco, data_nascimento, documento, foto_perfil, status, 
          configuracoes, criado_em, atualizado_em
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;

      // Parâmetros sanitizados para prepared statement
      const params = [
        this.cognito_sub || null,
        this.email?.trim(),
        this.nome?.trim(),
        this.tipo_usuario,
        this.empresa_id || null,
        this.telefone?.trim() || null,
        this.endereco?.trim() || null,
        this.data_nascimento || null,
        this.documento?.replace(/\D/g, '') || null, // Sanitizar documento
        this.foto_perfil?.trim() || null,
        this.status || 'ativo',
        JSON.stringify(this.configuracoes || {})
      ];

      const result = await executeQuery(query, params);
      
      if (!result.rows || result.rows.length === 0) {
        const error = new Error('Falha ao criar usuário - nenhum dado retornado');
        error.code = 'INSERT_FAILED';
        throw error;
      }

      const userData = result.rows[0];
      
      // Limpar e estruturar dados de retorno
      const cleanUserData = this._cleanUserData(userData);
      Object.assign(this, cleanUserData);

      console.log('✅ Usuário criado com sucesso:', this.id);
      return this;
      
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      
      // Re-throw com contexto adicional se não for erro conhecido
      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
        error.userData = { email: this.email, nome: this.nome };
      }
      
      throw error;
    }
  }

  /**
   * Atualiza o usuário
   * @returns {Promise<Usuario>}
   */
  async update() {
    try {
      console.log('📝 Atualizando usuário:', this.id);
      
      // Validação de ID obrigatório
      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do usuário é obrigatório e deve ser um número válido para atualização');
        error.code = 'INVALID_USER_ID';
        error.providedId = this.id;
        throw error;
      }

      // Validação dos dados de entrada
      const validation = this.validate();
      if (!validation.valid) {
        const error = new Error('Dados inválidos: ' + validation.errors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.details = validation.errors;
        throw error;
      }

      // Query com prepared statements (proteção contra SQL injection)
      const query = `
        UPDATE usuarios SET
          cognito_sub = $1,
          email = $2,
          nome = $3,
          tipo_usuario = $4,
          empresa_id = $5,
          telefone = $6,
          endereco = $7,
          data_nascimento = $8,
          documento = $9,
          foto_perfil = $10,
          status = $11,
          configuracoes = $12,
          atualizado_em = NOW()
        WHERE id = $13
        RETURNING *
      `;

      // Parâmetros sanitizados para prepared statement
      const params = [
        this.cognito_sub || null,
        this._sanitizeString(this.email),
        this._sanitizeString(this.nome),
        this.tipo_usuario,
        this._validateId(this.empresa_id),
        this._sanitizeString(this.telefone),
        this._sanitizeString(this.endereco),
        this.data_nascimento || null,
        this.documento?.replace(/\D/g, '') || null, // Sanitizar documento
        this._sanitizeString(this.foto_perfil),
        this.status || 'ativo',
        JSON.stringify(this.configuracoes || {}),
        validId
      ];

      const result = await executeQuery(query, params);
      
      if (!result.rows || result.rows.length === 0) {
        const error = new Error('Usuário não encontrado para atualização ou nenhum dado foi alterado');
        error.code = 'USER_NOT_FOUND_UPDATE';
        error.userId = validId;
        throw error;
      }

      const userData = result.rows[0];
      
      // Limpar e estruturar dados de retorno
      const cleanUserData = this._cleanUserData(userData);
      Object.assign(this, cleanUserData);

      console.log('✅ Usuário atualizado com sucesso:', this.id);
      return this;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error.message);
      
      // Re-throw com contexto adicional se não for erro conhecido
      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.userId = this.id;
      }
      
      throw error;
    }
  }

  /**
   * Deleta o usuário
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando usuário:', this.id);
      
      // Validação de ID obrigatório
      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do usuário é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_USER_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement (proteção contra SQL injection)
      const query = 'DELETE FROM usuarios WHERE id = $1';
      const result = await executeQuery(query, [validId]);
      
      const deleted = result.rowCount > 0;
      
      if (deleted) {
        console.log('✅ Usuário deletado com sucesso:', validId);
        // Limpar dados da instância atual
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Usuário não encontrado para exclusão');
        error.code = 'USER_NOT_FOUND_DELETE';
        error.userId = validId;
        throw error;
      }
      
      return deleted;
      
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error.message);
      
      // Re-throw com contexto adicional se não for erro conhecido
      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.userId = this.id;
      }
      
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca usuário por ID
   * @param {number} id 
   * @returns {Promise<Usuario|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando usuário por ID:', id);
      
      // Validação de entrada
      if (!id) {
        return null;
      }
      
      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }
      
      // Query com prepared statement (proteção contra SQL injection)
      const query = 'SELECT * FROM usuarios WHERE id = $1';
      const result = await executeQuery(query, [validId]);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Usuário não encontrado com ID:', validId);
        return null;
      }

      const userData = result.rows[0];
      
      // Criar instância com dados limpos
      const usuario = new Usuario();
      const cleanUserData = usuario._cleanUserData(userData);
      Object.assign(usuario, cleanUserData);
      
      return usuario;
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error.message);
      
      // Log do erro mas não rethrowing para não quebrar a aplicação
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      
      // Para busca, retorna null em caso de erro ao invés de throw
      return null;
    }
  }

  /**
   * Busca usuário por email
   * @param {string} email 
   * @returns {Promise<Usuario|null>}
   */
  static async findByEmail(email) {
    try {
      console.log('🔍 Buscando usuário por email:', email);
      
      // Validação de entrada
      if (!email || typeof email !== 'string') {
        console.warn('⚠️ Email inválido fornecido:', email);
        return null;
      }
      
      const sanitizedEmail = email.trim().toLowerCase();
      if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
        console.warn('⚠️ Formato de email inválido:', email);
        return null;
      }
      
      // Query com prepared statement (proteção contra SQL injection)
      const query = 'SELECT * FROM usuarios WHERE LOWER(email) = $1';
      const result = await executeQuery(query, [sanitizedEmail]);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Usuário não encontrado com email:', sanitizedEmail);
        return null;
      }

      const userData = result.rows[0];
      
      // Criar instância com dados limpos
      const usuario = new Usuario();
      const cleanUserData = usuario._cleanUserData(userData);
      Object.assign(usuario, cleanUserData);
      
      return usuario;
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error.message);
      
      error.code = 'FIND_BY_EMAIL_ERROR';
      error.operation = 'findByEmail';
      error.searchEmail = email;
      
      return null;
    }
  }

  /**
   * Busca usuário por email (alias para compatibilidade)
   * @param {string} email 
   * @returns {Promise<Usuario|null>}
   */
  static async buscarPorEmail(email) {
    return await Usuario.findByEmail(email);
  }

  /**
   * Busca usuário por cognito_sub
   * @param {string} cognitoSub 
   * @returns {Promise<Usuario|null>}
   */
  static async findByCognitoSub(cognitoSub) {
    try {
      console.log('🔍 Buscando usuário por Cognito Sub:', cognitoSub);
      
      // Validação de entrada
      if (!cognitoSub || typeof cognitoSub !== 'string') {
        console.warn('⚠️ Cognito Sub inválido fornecido:', cognitoSub);
        return null;
      }
      
      const sanitizedCognitoSub = cognitoSub.trim();
      if (!sanitizedCognitoSub) {
        console.warn('⚠️ Cognito Sub vazio fornecido');
        return null;
      }
      
      // Query com prepared statement (proteção contra SQL injection)
      const query = 'SELECT * FROM usuarios WHERE cognito_sub = $1';
      const result = await executeQuery(query, [sanitizedCognitoSub]);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Usuário não encontrado com Cognito Sub:', sanitizedCognitoSub);
        return null;
      }

      const userData = result.rows[0];
      
      // Criar instância com dados limpos
      const usuario = new Usuario();
      const cleanUserData = usuario._cleanUserData(userData);
      Object.assign(usuario, cleanUserData);
      
      return usuario;
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por Cognito Sub:', error.message);
      
      error.code = 'FIND_BY_COGNITO_SUB_ERROR';
      error.operation = 'findByCognitoSub';
      error.searchCognitoSub = cognitoSub;
      
      return null;
    }
  }

  /**
   * Busca usuário por cognito_sub (alias para compatibilidade)
   * @param {string} cognitoSub 
   * @returns {Promise<Usuario|null>}
   */
  static async buscarPorCognitoSub(cognitoSub) {
    return await Usuario.findByCognitoSub(cognitoSub);
  }

  /**
   * Lista todos os usuários com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{users: Usuario[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    console.log('🔍 Buscando usuários com filtros:', filters);
    
    const { 
      page = 1, 
      limit = 10, 
      orderBy = 'criado_em', 
      orderDirection = 'DESC' 
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Construir cláusulas WHERE
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;
    
    if (filters.tipo_usuario) {
      whereClauses.push(`tipo_usuario = $${paramIndex}`);
      params.push(filters.tipo_usuario);
      paramIndex++;
    }
    
    if (filters.empresa_id) {
      whereClauses.push(`empresa_id = $${paramIndex}`);
      params.push(filters.empresa_id);
      paramIndex++;
    }
    
    if (filters.status) {
      whereClauses.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    
    if (filters.search) {
      whereClauses.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Query para contar total
    const countQuery = `SELECT COUNT(*) FROM usuarios ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Query para buscar dados
    const dataQuery = `
      SELECT * FROM usuarios 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    const dataResult = await executeQuery(dataQuery, params);
    
    const users = dataResult.rows.map(userData => {
      userData.configuracoes = typeof userData.configuracoes === 'string' 
        ? JSON.parse(userData.configuracoes) 
        : userData.configuracoes;
      return new Usuario(userData);
    });
    
    return { users, total };
  }

  /**
   * Busca usuários por empresa
   * @param {number} empresaId 
   * @returns {Promise<Usuario[]>}
   */
  static async findByEmpresa(empresaId) {
    console.log('🔍 Buscando usuários por empresa:', empresaId);
    
    const query = `
      SELECT * FROM usuarios 
      WHERE empresa_id = $1 
      ORDER BY nome ASC
    `;
    
    const result = await executeQuery(query, [empresaId]);
    
    return result.rows.map(userData => {
      userData.configuracoes = typeof userData.configuracoes === 'string' 
        ? JSON.parse(userData.configuracoes) 
        : userData.configuracoes;
      return new Usuario(userData);
    });
  }

  /**
   * Busca usuários por empresa (alias para compatibilidade)
   * @param {number} empresaId 
   * @returns {Promise<Usuario[]>}
   */
  static async buscarPorEmpresa(empresaId) {
    return await Usuario.findByEmpresa(empresaId);
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria um novo usuário (método estático)
   * @param {Object} dadosUsuario - Dados do usuário a ser criado
   * @returns {Promise<Usuario>}
   */
  static async criar(dadosUsuario) {
    console.log('📝 Criando novo usuário (método estático):', dadosUsuario.nome);
    
    const usuario = new Usuario(dadosUsuario);
    return await usuario.create();
  }

  /**
   * Atualiza um usuário existente (método estático)
   * @param {number} id - ID do usuário
   * @param {Object} dadosUsuario - Dados atualizados do usuário
   * @returns {Promise<Usuario>}
   */
  static async atualizar(id, dadosUsuario) {
    console.log('📝 Atualizando usuário (método estático):', id);
    
    if (!id) {
      throw new Error('ID do usuário é obrigatório para atualização');
    }

    // Buscar usuário existente
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar dados
    Object.assign(usuario, dadosUsuario);
    return await usuario.update();
  }

  /**
   * Deleta um usuário (método estático)
   * @param {number} id - ID do usuário
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando usuário (método estático):', id);
    
    if (!id) {
      throw new Error('ID do usuário é obrigatório para exclusão');
    }

    // Buscar usuário existente
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    return await usuario.delete();
  }

  // ============================================================================
  // MÉTODOS DE UTILIDADE
  // ============================================================================

  /**
   * Atualiza o último login do usuário
   * @returns {Promise<void>}
   */
  async updateLastLogin() {
    if (!this.id) {
      throw new Error('ID do usuário é obrigatório');
    }

    const query = `
      UPDATE usuarios 
      SET ultimo_login = NOW(), atualizado_em = NOW() 
      WHERE id = $1
    `;
    
    await executeQuery(query, [this.id]);
    console.log('✅ Último login atualizado para usuário:', this.id);
  }

  /**
   * Atualiza configurações do usuário
   * @param {Object} newConfiguracoes 
   * @returns {Promise<void>}
   */
  async updateConfiguracoes(newConfiguracoes) {
    if (!this.id) {
      throw new Error('ID do usuário é obrigatório');
    }

    this.configuracoes = { ...this.configuracoes, ...newConfiguracoes };
    
    const query = `
      UPDATE usuarios 
      SET configuracoes = $1, atualizado_em = NOW() 
      WHERE id = $2
    `;
    
    await executeQuery(query, [JSON.stringify(this.configuracoes), this.id]);
    console.log('✅ Configurações atualizadas para usuário:', this.id);
  }

  /**
   * Verifica se o usuário tem permissão para acessar uma empresa
   * @param {number} empresaId 
   * @returns {boolean}
   */
  canAccessEmpresa(empresaId) {
    // Admin global pode acessar qualquer empresa
    if (this.tipo_usuario === 'admin' && !this.empresa_id) {
      return true;
    }
    
    // Usuários só podem acessar sua própria empresa
    return this.empresa_id === empresaId;
  }

  /**
   * Verifica se o usuário pode gerenciar outro usuário
   * @param {Usuario} targetUser 
   * @returns {boolean}
   */
  canManageUser(targetUser) {
    // Admin global pode gerenciar qualquer usuário
    if (this.tipo_usuario === 'admin' && !this.empresa_id) {
      return true;
    }
    
    // Usuários só podem gerenciar usuários da mesma empresa
    if (this.empresa_id !== targetUser.empresa_id) {
      return false;
    }
    
    // Hierarquia de permissões
    const hierarchy = {
      admin: ['admin', 'gestor', 'diretor', 'professor', 'aluno'],
      gestor: ['diretor', 'professor', 'aluno'],
      diretor: ['professor', 'aluno'],
      professor: ['aluno'],
      aluno: []
    };
    
    return hierarchy[this.tipo_usuario]?.includes(targetUser.tipo_usuario) || false;
  }

  /**
   * Formata os dados do usuário para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      // Garantir que configuracoes seja um objeto válido
      let configuracoes = {};
      if (this.configuracoes) {
        try {
          configuracoes = typeof this.configuracoes === 'string' 
            ? JSON.parse(this.configuracoes) 
            : this.configuracoes;
        } catch (parseError) {
          console.warn('⚠️ Erro ao fazer parse das configurações no toJSON:', parseError.message);
          configuracoes = {};
        }
      }

      // Retornar objeto limpo com tipos corretos e validações
      return {
        id: parseInt(this.id) || null,
        cognito_sub: this.cognito_sub || null,
        email: this.email?.trim() || null,
        nome: this.nome?.trim() || null,
        tipo_usuario: this.tipo_usuario || null,
        empresa_id: this.empresa_id ? parseInt(this.empresa_id) : null,
        telefone: this.telefone?.trim() || null,
        endereco: this.endereco?.trim() || null,
        data_nascimento: this.data_nascimento || null,
        documento: this.documento?.trim() || null,
        foto_perfil: this.foto_perfil?.trim() || null,
        status: this.status || 'ativo',
        ultimo_login: this.ultimo_login || null,
        configuracoes: configuracoes,
        criado_em: this.criado_em || null,
        atualizado_em: this.atualizado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao converter usuário para JSON:', error.message);
      
      // Retornar objeto mínimo em caso de erro
      return {
        id: this.id || null,
        email: this.email || null,
        nome: this.nome || null,
        tipo_usuario: this.tipo_usuario || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do usuário'
      };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas gerais dos usuários
   * @returns {Promise<Object>}
   */
  static async getStats() {
    console.log('📊 Obtendo estatísticas de usuários');
    
    const queries = [
      'SELECT COUNT(*) as total FROM usuarios',
      'SELECT COUNT(*) as ativos FROM usuarios WHERE status = \'ativo\'',
      'SELECT COUNT(*) as inativos FROM usuarios WHERE status = \'inativo\'',
      'SELECT tipo_usuario, COUNT(*) as count FROM usuarios GROUP BY tipo_usuario',
      'SELECT empresa_id, COUNT(*) as count FROM usuarios WHERE empresa_id IS NOT NULL GROUP BY empresa_id'
    ];
    
    const results = await Promise.all(
      queries.map(query => executeQuery(query))
    );
    
    return {
      total: parseInt(results[0].rows[0].total),
      ativos: parseInt(results[1].rows[0].ativos),
      inativos: parseInt(results[2].rows[0].inativos),
      por_tipo: results[3].rows.reduce((acc, row) => {
        acc[row.tipo_usuario] = parseInt(row.count);
        return acc;
      }, {}),
      por_empresa: results[4].rows.reduce((acc, row) => {
        acc[row.empresa_id] = parseInt(row.count);
        return acc;
      }, {})
    };
  }
}

export default Usuario;
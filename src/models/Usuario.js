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
    console.log('📝 Criando novo usuário:', this.nome);
    
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error('Dados inválidos: ' + validation.errors.join(', '));
    }

    // Verificar se email já existe
    const existingUser = await Usuario.findByEmail(this.email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Verificar se cognito_sub já existe (se fornecido)
    if (this.cognito_sub) {
      const existingCognito = await Usuario.findByCognitoSub(this.cognito_sub);
      if (existingCognito) {
        throw new Error('Usuário Cognito já está vinculado a outra conta');
      }
    }

    const query = `
      INSERT INTO usuarios (
        cognito_sub, email, nome, tipo_usuario, empresa_id, telefone, 
        endereco, data_nascimento, documento, foto_perfil, status, 
        configuracoes, criado_em, atualizado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      this.cognito_sub,
      this.email,
      this.nome,
      this.tipo_usuario,
      this.empresa_id,
      this.telefone,
      this.endereco,
      this.data_nascimento,
      this.documento,
      this.foto_perfil,
      this.status,
      JSON.stringify(this.configuracoes)
    ];

    const result = await executeQuery(query, params);
    const userData = result.rows[0];
    
    // Atualizar instância atual
    Object.assign(this, userData);
    this.configuracoes = typeof userData.configuracoes === 'string' 
      ? JSON.parse(userData.configuracoes) 
      : userData.configuracoes;

    console.log('✅ Usuário criado com sucesso:', this.id);
    return this;
  }

  /**
   * Atualiza o usuário
   * @returns {Promise<Usuario>}
   */
  async update() {
    console.log('📝 Atualizando usuário:', this.id);
    
    if (!this.id) {
      throw new Error('ID do usuário é obrigatório para atualização');
    }

    const validation = this.validate();
    if (!validation.valid) {
      throw new Error('Dados inválidos: ' + validation.errors.join(', '));
    }

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

    const params = [
      this.cognito_sub,
      this.email,
      this.nome,
      this.tipo_usuario,
      this.empresa_id,
      this.telefone,
      this.endereco,
      this.data_nascimento,
      this.documento,
      this.foto_perfil,
      this.status,
      JSON.stringify(this.configuracoes),
      this.id
    ];

    const result = await executeQuery(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const userData = result.rows[0];
    Object.assign(this, userData);
    this.configuracoes = typeof userData.configuracoes === 'string' 
      ? JSON.parse(userData.configuracoes) 
      : userData.configuracoes;

    console.log('✅ Usuário atualizado com sucesso:', this.id);
    return this;
  }

  /**
   * Deleta o usuário
   * @returns {Promise<boolean>}
   */
  async delete() {
    console.log('🗑️ Deletando usuário:', this.id);
    
    if (!this.id) {
      throw new Error('ID do usuário é obrigatório para exclusão');
    }

    const query = 'DELETE FROM usuarios WHERE id = $1';
    const result = await executeQuery(query, [this.id]);
    
    const deleted = result.rowCount > 0;
    if (deleted) {
      console.log('✅ Usuário deletado com sucesso:', this.id);
    } else {
      console.log('❌ Usuário não encontrado para exclusão:', this.id);
    }
    
    return deleted;
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
    console.log('🔍 Buscando usuário por ID:', id);
    
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const result = await executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    userData.configuracoes = typeof userData.configuracoes === 'string' 
      ? JSON.parse(userData.configuracoes) 
      : userData.configuracoes;
    
    return new Usuario(userData);
  }

  /**
   * Busca usuário por email
   * @param {string} email 
   * @returns {Promise<Usuario|null>}
   */
  static async findByEmail(email) {
    console.log('🔍 Buscando usuário por email:', email);
    
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await executeQuery(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    userData.configuracoes = typeof userData.configuracoes === 'string' 
      ? JSON.parse(userData.configuracoes) 
      : userData.configuracoes;
    
    return new Usuario(userData);
  }

  /**
   * Busca usuário por cognito_sub
   * @param {string} cognitoSub 
   * @returns {Promise<Usuario|null>}
   */
  static async findByCognitoSub(cognitoSub) {
    console.log('🔍 Buscando usuário por Cognito Sub:', cognitoSub);
    
    const query = 'SELECT * FROM usuarios WHERE cognito_sub = $1';
    const result = await executeQuery(query, [cognitoSub]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    userData.configuracoes = typeof userData.configuracoes === 'string' 
      ? JSON.parse(userData.configuracoes) 
      : userData.configuracoes;
    
    return new Usuario(userData);
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
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      cognito_sub: this.cognito_sub,
      email: this.email,
      nome: this.nome,
      tipo_usuario: this.tipo_usuario,
      empresa_id: this.empresa_id,
      telefone: this.telefone,
      endereco: this.endereco,
      data_nascimento: this.data_nascimento,
      documento: this.documento,
      foto_perfil: this.foto_perfil,
      status: this.status,
      ultimo_login: this.ultimo_login,
      configuracoes: this.configuracoes,
      criado_em: this.criado_em,
      atualizado_em: this.atualizado_em
    };
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
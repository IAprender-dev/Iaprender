import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para gestores
 * Gerencia todas as operações CRUD e validações para a tabela gestores
 */
export class Gestor {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usr_id = data.usr_id || null;
    this.empresa_id = data.empresa_id || null;
    this.nome = data.nome || null;
    this.cargo = data.cargo || null;
    this.data_admissao = data.data_admissao || null;
    this.status = data.status || 'ativo';
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados do gestor como objeto JavaScript limpo
   * @param {Object} gestorData - Dados brutos do gestor
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanGestorData(gestorData) {
    if (!gestorData || typeof gestorData !== 'object') {
      return {};
    }

    return {
      id: gestorData.id ? parseInt(gestorData.id) : null,
      usr_id: gestorData.usr_id ? parseInt(gestorData.usr_id) : null,
      empresa_id: gestorData.empresa_id ? parseInt(gestorData.empresa_id) : null,
      nome: this._sanitizeString(gestorData.nome),
      cargo: this._sanitizeString(gestorData.cargo),
      data_admissao: gestorData.data_admissao || null,
      status: gestorData.status || 'ativo'
    };
  }

  /**
   * Sanitiza entrada de string removendo caracteres perigosos
   * @param {string} input - String de entrada
   * @returns {string} - String sanitizada
   */
  _sanitizeString(input) {
    if (!input || typeof input !== 'string') {
      return null;
    }

    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/['"`;]/g, '')
      .slice(0, 500);
  }

  /**
   * Valida e sanitiza ID numérico
   * @param {any} id - ID a ser validado
   * @returns {number|null} - ID validado ou null
   */
  _validateId(id) {
    if (!id) return null;
    const numId = parseInt(id);
    return (!isNaN(numId) && numId > 0) ? numId : null;
  }

  // ============================================================================
  // MÉTODOS DE VALIDAÇÃO
  // ============================================================================

  /**
   * Valida os dados do gestor
   * @returns {Array} - Array de erros encontrados
   */
  validate() {
    const errors = [];

    if (!this.usr_id) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!this.empresa_id) {
      errors.push('ID da empresa é obrigatório');
    }

    if (!this.nome || this.nome.trim().length < 2) {
      errors.push('Nome do gestor é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (!this.cargo || this.cargo.trim().length < 3) {
      errors.push('Cargo é obrigatório e deve ter pelo menos 3 caracteres');
    }

    if (this.data_admissao && !this.isValidDate(this.data_admissao)) {
      errors.push('Data de admissão deve ter formato válido');
    }

    if (this.status && !['ativo', 'inativo', 'licenca', 'afastado'].includes(this.status)) {
      errors.push('Status deve ser: ativo, inativo, licenca ou afastado');
    }

    return errors;
  }

  /**
   * Valida formato de data
   * @param {string} date 
   * @returns {boolean}
   */
  isValidDate(date) {
    return !isNaN(Date.parse(date));
  }

  // ============================================================================
  // MÉTODOS CRUD DE INSTÂNCIA
  // ============================================================================

  /**
   * Cria novo gestor
   * @returns {Promise<Gestor>}
   */
  async create() {
    try {
      console.log('📝 Criando novo gestor:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do gestor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar se usr_id já existe
      const existingGestor = await Gestor.findByUserId(this.usr_id);
      if (existingGestor) {
        const error = new Error('Usuário já está cadastrado como gestor');
        error.code = 'USER_ALREADY_MANAGER';
        error.usr_id = this.usr_id;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO gestores (usr_id, empresa_id, nome, cargo, data_admissao, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        this.usr_id, this.empresa_id, this.nome, this.cargo, this.data_admissao, this.status
      ];

      const result = await executeQuery(query, values);
      const gestorData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanGestorData(gestorData);
      Object.assign(this, cleanData);

      console.log('✅ Gestor criado com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar gestor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza o gestor
   * @returns {Promise<Gestor>}
   */
  async update() {
    try {
      console.log('📝 Atualizando gestor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do gestor é obrigatório para atualização');
        error.code = 'INVALID_GESTOR_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do gestor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE gestores 
        SET usr_id = $1, empresa_id = $2, nome = $3, cargo = $4, data_admissao = $5, status = $6
        WHERE id = $7
        RETURNING *
      `;

      const values = [
        this.usr_id, this.empresa_id, this.nome, this.cargo, this.data_admissao, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Gestor não encontrado para atualização');
        error.code = 'GESTOR_NOT_FOUND_UPDATE';
        error.gestorId = validId;
        throw error;
      }

      const gestorData = result.rows[0];
      const cleanData = this._cleanGestorData(gestorData);
      Object.assign(this, cleanData);

      console.log('✅ Gestor atualizado com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar gestor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.gestorId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta o gestor
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando gestor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do gestor é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_GESTOR_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM gestores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Gestor deletado com sucesso:', validId);
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Gestor não encontrado para exclusão');
        error.code = 'GESTOR_NOT_FOUND_DELETE';
        error.gestorId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar gestor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.gestorId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca gestor por ID
   * @param {number} id 
   * @returns {Promise<Gestor|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando gestor por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM gestores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Gestor não encontrado com ID:', validId);
        return null;
      }

      const gestorData = result.rows[0];
      const gestor = new Gestor();
      const cleanData = gestor._cleanGestorData(gestorData);
      Object.assign(gestor, cleanData);

      return gestor;

    } catch (error) {
      console.error('❌ Erro ao buscar gestor por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca gestor por usr_id
   * @param {number} usrId 
   * @returns {Promise<Gestor|null>}
   */
  static async findByUserId(usrId) {
    try {
      console.log('🔍 Buscando gestor por usr_id:', usrId);

      if (!usrId) return null;

      const validUsrId = parseInt(usrId);
      if (isNaN(validUsrId) || validUsrId <= 0) {
        console.warn('⚠️ usr_id inválido fornecido:', usrId);
        return null;
      }

      const query = 'SELECT * FROM gestores WHERE usr_id = $1';
      const result = await executeQuery(query, [validUsrId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Gestor não encontrado com usr_id:', validUsrId);
        return null;
      }

      const gestorData = result.rows[0];
      const gestor = new Gestor();
      const cleanData = gestor._cleanGestorData(gestorData);
      Object.assign(gestor, cleanData);

      return gestor;

    } catch (error) {
      console.error('❌ Erro ao buscar gestor por usr_id:', error.message);
      error.code = 'FIND_BY_USER_ID_ERROR';
      error.operation = 'findByUserId';
      error.searchUsrId = usrId;
      return null;
    }
  }

  /**
   * Busca gestores por empresa
   * @param {number} empresaId 
   * @returns {Promise<Gestor[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando gestores por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM gestores 
        WHERE empresa_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(gestorData => {
        const gestor = new Gestor();
        const cleanData = gestor._cleanGestorData(gestorData);
        Object.assign(gestor, cleanData);
        return gestor;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar gestores por empresa:', error.message);
      error.code = 'FIND_BY_EMPRESA_ERROR';
      error.operation = 'findByEmpresa';
      error.empresaId = empresaId;
      return [];
    }
  }

  /**
   * Lista todos os gestores com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{gestores: Gestor[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    try {
      console.log('🔍 Buscando gestores com filtros:', filters);

      const { 
        page = 1, 
        limit = 10, 
        orderBy = 'nome', 
        orderDirection = 'ASC' 
      } = options;

      const offset = (page - 1) * limit;

      // Construir cláusulas WHERE
      const whereClauses = [];
      const params = [];
      let paramIndex = 1;

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
        whereClauses.push(`(nome ILIKE $${paramIndex} OR cargo ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Query para contar total
      const countQuery = `SELECT COUNT(*) FROM gestores ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM gestores 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await executeQuery(dataQuery, params);

      const gestores = dataResult.rows.map(gestorData => {
        const gestor = new Gestor();
        const cleanData = gestor._cleanGestorData(gestorData);
        Object.assign(gestor, cleanData);
        return gestor;
      });

      return { gestores, total };

    } catch (error) {
      console.error('❌ Erro ao buscar gestores:', error.message);
      error.code = 'FIND_ALL_ERROR';
      error.operation = 'findAll';
      return { gestores: [], total: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria um novo gestor (método estático)
   * @param {Object} dadosGestor - Dados do gestor a ser criado
   * @returns {Promise<Gestor>}
   */
  static async criar(dadosGestor) {
    console.log('📝 Criando novo gestor (método estático):', dadosGestor.nome);
    const gestor = new Gestor(dadosGestor);
    return await gestor.create();
  }

  /**
   * Atualiza um gestor existente (método estático)
   * @param {number} id - ID do gestor
   * @param {Object} dadosGestor - Dados atualizados do gestor
   * @returns {Promise<Gestor>}
   */
  static async atualizar(id, dadosGestor) {
    console.log('📝 Atualizando gestor (método estático):', id);

    if (!id) {
      throw new Error('ID do gestor é obrigatório para atualização');
    }

    const gestor = await Gestor.findById(id);
    if (!gestor) {
      throw new Error('Gestor não encontrado');
    }

    Object.assign(gestor, dadosGestor);
    return await gestor.update();
  }

  /**
   * Deleta um gestor (método estático)
   * @param {number} id - ID do gestor
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando gestor (método estático):', id);

    if (!id) {
      throw new Error('ID do gestor é obrigatório para exclusão');
    }

    const gestor = await Gestor.findById(id);
    if (!gestor) {
      throw new Error('Gestor não encontrado');
    }

    return await gestor.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados do gestor para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      return {
        id: parseInt(this.id) || null,
        usr_id: parseInt(this.usr_id) || null,
        empresa_id: parseInt(this.empresa_id) || null,
        nome: this.nome?.trim() || null,
        cargo: this.cargo?.trim() || null,
        data_admissao: this.data_admissao || null,
        status: this.status || 'ativo'
      };
    } catch (error) {
      console.error('❌ Erro ao converter gestor para JSON:', error.message);
      
      return {
        id: this.id || null,
        usr_id: this.usr_id || null,
        nome: this.nome || null,
        cargo: this.cargo || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do gestor'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas dos gestores
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_gestores,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as gestores_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as gestores_inativos,
          COUNT(CASE WHEN status = 'licenca' THEN 1 END) as gestores_licenca,
          COUNT(CASE WHEN status = 'afastado' THEN 1 END) as gestores_afastados,
          COUNT(DISTINCT empresa_id) as empresas_com_gestores
        FROM gestores
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas dos gestores:', error.message);
      return {
        total_gestores: 0,
        gestores_ativos: 0,
        gestores_inativos: 0,
        gestores_licenca: 0,
        gestores_afastados: 0,
        empresas_com_gestores: 0
      };
    }
  }
}

export default Gestor;
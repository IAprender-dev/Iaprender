import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para empresas
 * Gerencia todas as operações CRUD e validações para a tabela empresas
 */
export class Empresa {
  constructor(data = {}) {
    this.id = data.id || null;
    this.nome = data.nome || null;
    this.cnpj = data.cnpj || null;
    this.telefone = data.telefone || null;
    this.email_contato = data.email_contato || null;
    this.endereco = data.endereco || null;
    this.cidade = data.cidade || null;
    this.estado = data.estado || null;
    this.logo = data.logo || null;
    this.criado_por = data.criado_por || null;
    this.criado_em = data.criado_em || null;
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados da empresa como objeto JavaScript limpo
   * @param {Object} empresaData - Dados brutos da empresa
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanEmpresaData(empresaData) {
    if (!empresaData || typeof empresaData !== 'object') {
      return {};
    }

    return {
      id: empresaData.id ? parseInt(empresaData.id) : null,
      nome: this._sanitizeString(empresaData.nome),
      cnpj: this._sanitizeCNPJ(empresaData.cnpj),
      telefone: this._sanitizeString(empresaData.telefone),
      email_contato: empresaData.email_contato?.trim().toLowerCase() || null,
      endereco: this._sanitizeString(empresaData.endereco),
      cidade: this._sanitizeString(empresaData.cidade),
      estado: this._sanitizeString(empresaData.estado),
      logo: this._sanitizeString(empresaData.logo),
      criado_por: empresaData.criado_por ? parseInt(empresaData.criado_por) : null,
      criado_em: empresaData.criado_em || null
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
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove tags script
      .replace(/<[^>]*>/g, '') // Remove outras tags HTML
      .replace(/['"`;]/g, '') // Remove caracteres perigosos para SQL
      .slice(0, 500); // Limita tamanho
  }

  /**
   * Sanitiza e valida CNPJ
   * @param {string} cnpj - CNPJ de entrada
   * @returns {string} - CNPJ apenas com números
   */
  _sanitizeCNPJ(cnpj) {
    if (!cnpj) return null;
    return cnpj.toString().replace(/\D/g, '').slice(0, 14);
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
   * Valida os dados da empresa
   * @returns {Array} - Array de erros encontrados
   */
  validate() {
    const errors = [];

    if (!this.nome || this.nome.trim().length < 2) {
      errors.push('Nome da empresa é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (!this.cnpj) {
      errors.push('CNPJ é obrigatório');
    } else if (!this.isValidCNPJ(this.cnpj)) {
      errors.push('CNPJ deve ter formato válido');
    }

    if (this.email_contato && !this.isValidEmail(this.email_contato)) {
      errors.push('Email de contato deve ter formato válido');
    }

    if (this.telefone && !this.isValidPhone(this.telefone)) {
      errors.push('Telefone deve ter formato válido');
    }

    return errors;
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
    const phoneRegex = /^\(?(\d{2})\)?[\s-]?(\d{4,5})[\s-]?(\d{4})$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Valida CNPJ
   * @param {string} cnpj 
   * @returns {boolean}
   */
  isValidCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  }

  // ============================================================================
  // MÉTODOS CRUD DE INSTÂNCIA
  // ============================================================================

  /**
   * Cria nova empresa
   * @returns {Promise<Empresa>}
   */
  async create() {
    try {
      console.log('📝 Criando nova empresa:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados da empresa inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar duplicatas
      const existingEmpresa = await Empresa.findByCNPJ(this.cnpj);
      if (existingEmpresa) {
        const error = new Error('CNPJ já está cadastrado');
        error.code = 'CNPJ_ALREADY_EXISTS';
        error.cnpj = this.cnpj;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO empresas (nome, cnpj, telefone, email_contato, endereco, cidade, estado, logo, criado_por, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const values = [
        this.nome, this.cnpj, this.telefone, this.email_contato,
        this.endereco, this.cidade, this.estado, this.logo, this.criado_por
      ];

      const result = await executeQuery(query, values);
      const empresaData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanEmpresaData(empresaData);
      Object.assign(this, cleanData);

      console.log('✅ Empresa criada com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza a empresa
   * @returns {Promise<Empresa>}
   */
  async update() {
    try {
      console.log('📝 Atualizando empresa:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID da empresa é obrigatório para atualização');
        error.code = 'INVALID_EMPRESA_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados da empresa inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE empresas 
        SET nome = $1, cnpj = $2, telefone = $3, email_contato = $4, 
            endereco = $5, cidade = $6, estado = $7, logo = $8
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        this.nome, this.cnpj, this.telefone, this.email_contato,
        this.endereco, this.cidade, this.estado, this.logo, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Empresa não encontrada para atualização');
        error.code = 'EMPRESA_NOT_FOUND_UPDATE';
        error.empresaId = validId;
        throw error;
      }

      const empresaData = result.rows[0];
      const cleanData = this._cleanEmpresaData(empresaData);
      Object.assign(this, cleanData);

      console.log('✅ Empresa atualizada com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.empresaId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta a empresa
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando empresa:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID da empresa é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_EMPRESA_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM empresas WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Empresa deletada com sucesso:', validId);
        this.id = null;
      } else {
        const error = new Error('Empresa não encontrada para exclusão');
        error.code = 'EMPRESA_NOT_FOUND_DELETE';
        error.empresaId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar empresa:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.empresaId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca empresa por ID
   * @param {number} id 
   * @returns {Promise<Empresa|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando empresa por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM empresas WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Empresa não encontrada com ID:', validId);
        return null;
      }

      const empresaData = result.rows[0];
      const empresa = new Empresa();
      const cleanData = empresa._cleanEmpresaData(empresaData);
      Object.assign(empresa, cleanData);

      return empresa;

    } catch (error) {
      console.error('❌ Erro ao buscar empresa por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca empresa por CNPJ
   * @param {string} cnpj 
   * @returns {Promise<Empresa|null>}
   */
  static async findByCNPJ(cnpj) {
    try {
      console.log('🔍 Buscando empresa por CNPJ:', cnpj);

      if (!cnpj || typeof cnpj !== 'string') {
        console.warn('⚠️ CNPJ inválido fornecido:', cnpj);
        return null;
      }

      const sanitizedCNPJ = cnpj.replace(/\D/g, '');
      if (!sanitizedCNPJ || sanitizedCNPJ.length !== 14) {
        console.warn('⚠️ Formato de CNPJ inválido:', cnpj);
        return null;
      }

      const query = 'SELECT * FROM empresas WHERE cnpj = $1';
      const result = await executeQuery(query, [sanitizedCNPJ]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Empresa não encontrada com CNPJ:', sanitizedCNPJ);
        return null;
      }

      const empresaData = result.rows[0];
      const empresa = new Empresa();
      const cleanData = empresa._cleanEmpresaData(empresaData);
      Object.assign(empresa, cleanData);

      return empresa;

    } catch (error) {
      console.error('❌ Erro ao buscar empresa por CNPJ:', error.message);
      error.code = 'FIND_BY_CNPJ_ERROR';
      error.operation = 'findByCNPJ';
      error.searchCNPJ = cnpj;
      return null;
    }
  }

  /**
   * Lista todas as empresas com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{empresas: Empresa[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    try {
      console.log('🔍 Buscando empresas com filtros:', filters);

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

      if (filters.estado) {
        whereClauses.push(`estado = $${paramIndex}`);
        params.push(filters.estado);
        paramIndex++;
      }

      if (filters.cidade) {
        whereClauses.push(`cidade ILIKE $${paramIndex}`);
        params.push(`%${filters.cidade}%`);
        paramIndex++;
      }

      if (filters.search) {
        whereClauses.push(`(nome ILIKE $${paramIndex} OR cnpj LIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Query para contar total
      const countQuery = `SELECT COUNT(*) FROM empresas ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM empresas 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await executeQuery(dataQuery, params);

      const empresas = dataResult.rows.map(empresaData => {
        const empresa = new Empresa();
        const cleanData = empresa._cleanEmpresaData(empresaData);
        Object.assign(empresa, cleanData);
        return empresa;
      });

      return { empresas, total };

    } catch (error) {
      console.error('❌ Erro ao buscar empresas:', error.message);
      error.code = 'FIND_ALL_ERROR';
      error.operation = 'findAll';
      return { empresas: [], total: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria uma nova empresa (método estático)
   * @param {Object} dadosEmpresa - Dados da empresa a ser criada
   * @returns {Promise<Empresa>}
   */
  static async criar(dadosEmpresa) {
    console.log('📝 Criando nova empresa (método estático):', dadosEmpresa.nome);
    const empresa = new Empresa(dadosEmpresa);
    return await empresa.create();
  }

  /**
   * Atualiza uma empresa existente (método estático)
   * @param {number} id - ID da empresa
   * @param {Object} dadosEmpresa - Dados atualizados da empresa
   * @returns {Promise<Empresa>}
   */
  static async atualizar(id, dadosEmpresa) {
    console.log('📝 Atualizando empresa (método estático):', id);

    if (!id) {
      throw new Error('ID da empresa é obrigatório para atualização');
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    Object.assign(empresa, dadosEmpresa);
    return await empresa.update();
  }

  /**
   * Deleta uma empresa (método estático)
   * @param {number} id - ID da empresa
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando empresa (método estático):', id);

    if (!id) {
      throw new Error('ID da empresa é obrigatório para exclusão');
    }

    const empresa = await Empresa.findById(id);
    if (!empresa) {
      throw new Error('Empresa não encontrada');
    }

    return await empresa.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados da empresa para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      return {
        id: parseInt(this.id) || null,
        nome: this.nome?.trim() || null,
        cnpj: this.cnpj?.trim() || null,
        telefone: this.telefone?.trim() || null,
        email_contato: this.email_contato?.trim() || null,
        endereco: this.endereco?.trim() || null,
        cidade: this.cidade?.trim() || null,
        estado: this.estado?.trim() || null,
        logo: this.logo?.trim() || null,
        criado_por: this.criado_por ? parseInt(this.criado_por) : null,
        criado_em: this.criado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao converter empresa para JSON:', error.message);
      
      return {
        id: this.id || null,
        nome: this.nome || null,
        cnpj: this.cnpj || null,
        error: 'Erro ao processar dados da empresa'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas das empresas
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_empresas,
          COUNT(CASE WHEN estado = 'SP' THEN 1 END) as empresas_sp,
          COUNT(CASE WHEN estado = 'RJ' THEN 1 END) as empresas_rj,
          COUNT(CASE WHEN estado = 'MG' THEN 1 END) as empresas_mg
        FROM empresas
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas das empresas:', error.message);
      return {
        total_empresas: 0,
        empresas_sp: 0,
        empresas_rj: 0,
        empresas_mg: 0
      };
    }
  }
}

export default Empresa;
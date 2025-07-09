import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para contratos
 * Gerencia todas as operações CRUD e validações para a tabela contratos
 */
export class Contrato {
  constructor(data = {}) {
    this.id = data.id || null;
    this.empresa_id = data.empresa_id || null;
    this.descricao = data.descricao || null;
    this.data_inicio = data.data_inicio || null;
    this.data_fim = data.data_fim || null;
    this.numero_licencas = data.numero_licencas || null;
    this.valor_total = data.valor_total || null;
    this.documento_pdf = data.documento_pdf || null;
    this.status = data.status || 'ativo';
    this.criado_em = data.criado_em || null;
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados do contrato como objeto JavaScript limpo
   * @param {Object} contratoData - Dados brutos do contrato
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanContratoData(contratoData) {
    if (!contratoData || typeof contratoData !== 'object') {
      return {};
    }

    return {
      id: contratoData.id ? parseInt(contratoData.id) : null,
      empresa_id: contratoData.empresa_id ? parseInt(contratoData.empresa_id) : null,
      descricao: this._sanitizeString(contratoData.descricao),
      data_inicio: contratoData.data_inicio || null,
      data_fim: contratoData.data_fim || null,
      numero_licencas: contratoData.numero_licencas ? parseInt(contratoData.numero_licencas) : null,
      valor_total: contratoData.valor_total ? parseFloat(contratoData.valor_total) : null,
      documento_pdf: this._sanitizeString(contratoData.documento_pdf),
      status: contratoData.status || 'ativo',
      criado_em: contratoData.criado_em || null
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
      .slice(0, 1000);
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
   * Valida os dados do contrato
   * @returns {Array} - Array de erros encontrados
   */
  validate() {
    const errors = [];

    if (!this.empresa_id) {
      errors.push('ID da empresa é obrigatório');
    }

    if (!this.descricao || this.descricao.trim().length < 5) {
      errors.push('Descrição do contrato é obrigatória e deve ter pelo menos 5 caracteres');
    }

    if (!this.data_inicio) {
      errors.push('Data de início é obrigatória');
    }

    if (!this.data_fim) {
      errors.push('Data de fim é obrigatória');
    }

    if (this.data_inicio && this.data_fim && new Date(this.data_inicio) >= new Date(this.data_fim)) {
      errors.push('Data de início deve ser anterior à data de fim');
    }

    if (!this.numero_licencas || this.numero_licencas <= 0) {
      errors.push('Número de licenças deve ser maior que zero');
    }

    if (!this.valor_total || this.valor_total <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    if (this.status && !['ativo', 'inativo', 'suspenso', 'expirado'].includes(this.status)) {
      errors.push('Status deve ser: ativo, inativo, suspenso ou expirado');
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
   * Cria novo contrato
   * @returns {Promise<Contrato>}
   */
  async create() {
    try {
      console.log('📝 Criando novo contrato:', this.descricao);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do contrato inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO contratos (empresa_id, descricao, data_inicio, data_fim, numero_licencas, valor_total, documento_pdf, status, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;

      const values = [
        this.empresa_id, this.descricao, this.data_inicio, this.data_fim,
        this.numero_licencas, this.valor_total, this.documento_pdf, this.status
      ];

      const result = await executeQuery(query, values);
      const contratoData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanContratoData(contratoData);
      Object.assign(this, cleanData);

      console.log('✅ Contrato criado com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar contrato:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza o contrato
   * @returns {Promise<Contrato>}
   */
  async update() {
    try {
      console.log('📝 Atualizando contrato:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do contrato é obrigatório para atualização');
        error.code = 'INVALID_CONTRATO_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do contrato inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE contratos 
        SET empresa_id = $1, descricao = $2, data_inicio = $3, data_fim = $4, 
            numero_licencas = $5, valor_total = $6, documento_pdf = $7, status = $8
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        this.empresa_id, this.descricao, this.data_inicio, this.data_fim,
        this.numero_licencas, this.valor_total, this.documento_pdf, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Contrato não encontrado para atualização');
        error.code = 'CONTRATO_NOT_FOUND_UPDATE';
        error.contratoId = validId;
        throw error;
      }

      const contratoData = result.rows[0];
      const cleanData = this._cleanContratoData(contratoData);
      Object.assign(this, cleanData);

      console.log('✅ Contrato atualizado com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar contrato:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.contratoId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta o contrato
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando contrato:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do contrato é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_CONTRATO_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM contratos WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Contrato deletado com sucesso:', validId);
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Contrato não encontrado para exclusão');
        error.code = 'CONTRATO_NOT_FOUND_DELETE';
        error.contratoId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar contrato:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.contratoId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca contrato por ID
   * @param {number} id 
   * @returns {Promise<Contrato|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando contrato por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM contratos WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Contrato não encontrado com ID:', validId);
        return null;
      }

      const contratoData = result.rows[0];
      const contrato = new Contrato();
      const cleanData = contrato._cleanContratoData(contratoData);
      Object.assign(contrato, cleanData);

      return contrato;

    } catch (error) {
      console.error('❌ Erro ao buscar contrato por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca contratos por empresa
   * @param {number} empresaId 
   * @returns {Promise<Contrato[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando contratos por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM contratos 
        WHERE empresa_id = $1 
        ORDER BY criado_em DESC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(contratoData => {
        const contrato = new Contrato();
        const cleanData = contrato._cleanContratoData(contratoData);
        Object.assign(contrato, cleanData);
        return contrato;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar contratos por empresa:', error.message);
      error.code = 'FIND_BY_EMPRESA_ERROR';
      error.operation = 'findByEmpresa';
      error.empresaId = empresaId;
      return [];
    }
  }

  /**
   * Lista todos os contratos com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{contratos: Contrato[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    try {
      console.log('🔍 Buscando contratos com filtros:', filters);

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
        whereClauses.push(`descricao ILIKE $${paramIndex}`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Query para contar total
      const countQuery = `SELECT COUNT(*) FROM contratos ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM contratos 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await executeQuery(dataQuery, params);

      const contratos = dataResult.rows.map(contratoData => {
        const contrato = new Contrato();
        const cleanData = contrato._cleanContratoData(contratoData);
        Object.assign(contrato, cleanData);
        return contrato;
      });

      return { contratos, total };

    } catch (error) {
      console.error('❌ Erro ao buscar contratos:', error.message);
      error.code = 'FIND_ALL_ERROR';
      error.operation = 'findAll';
      return { contratos: [], total: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria um novo contrato (método estático)
   * @param {Object} dadosContrato - Dados do contrato a ser criado
   * @returns {Promise<Contrato>}
   */
  static async criar(dadosContrato) {
    console.log('📝 Criando novo contrato (método estático):', dadosContrato.descricao);
    const contrato = new Contrato(dadosContrato);
    return await contrato.create();
  }

  /**
   * Atualiza um contrato existente (método estático)
   * @param {number} id - ID do contrato
   * @param {Object} dadosContrato - Dados atualizados do contrato
   * @returns {Promise<Contrato>}
   */
  static async atualizar(id, dadosContrato) {
    console.log('📝 Atualizando contrato (método estático):', id);

    if (!id) {
      throw new Error('ID do contrato é obrigatório para atualização');
    }

    const contrato = await Contrato.findById(id);
    if (!contrato) {
      throw new Error('Contrato não encontrado');
    }

    Object.assign(contrato, dadosContrato);
    return await contrato.update();
  }

  /**
   * Deleta um contrato (método estático)
   * @param {number} id - ID do contrato
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando contrato (método estático):', id);

    if (!id) {
      throw new Error('ID do contrato é obrigatório para exclusão');
    }

    const contrato = await Contrato.findById(id);
    if (!contrato) {
      throw new Error('Contrato não encontrado');
    }

    return await contrato.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados do contrato para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      return {
        id: parseInt(this.id) || null,
        empresa_id: parseInt(this.empresa_id) || null,
        descricao: this.descricao?.trim() || null,
        data_inicio: this.data_inicio || null,
        data_fim: this.data_fim || null,
        numero_licencas: parseInt(this.numero_licencas) || null,
        valor_total: parseFloat(this.valor_total) || null,
        documento_pdf: this.documento_pdf?.trim() || null,
        status: this.status || 'ativo',
        criado_em: this.criado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao converter contrato para JSON:', error.message);
      
      return {
        id: this.id || null,
        empresa_id: this.empresa_id || null,
        descricao: this.descricao || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do contrato'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas dos contratos
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_contratos,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as contratos_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as contratos_inativos,
          COUNT(CASE WHEN status = 'suspenso' THEN 1 END) as contratos_suspensos,
          COUNT(CASE WHEN status = 'expirado' THEN 1 END) as contratos_expirados,
          SUM(numero_licencas) as total_licencas,
          SUM(valor_total) as valor_total_contratos
        FROM contratos
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas dos contratos:', error.message);
      return {
        total_contratos: 0,
        contratos_ativos: 0,
        contratos_inativos: 0,
        contratos_suspensos: 0,
        contratos_expirados: 0,
        total_licencas: 0,
        valor_total_contratos: 0
      };
    }
  }
}

export default Contrato;
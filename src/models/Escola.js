import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para escolas
 * Gerencia todas as operações CRUD e validações para a tabela escolas
 */
export class Escola {
  constructor(data = {}) {
    this.id = data.id || null;
    this.contrato_id = data.contrato_id || null;
    this.empresa_id = data.empresa_id || null;
    this.nome = data.nome || null;
    this.codigo_inep = data.codigo_inep || null;
    this.tipo_escola = data.tipo_escola || null;
    this.telefone = data.telefone || null;
    this.email = data.email || null;
    this.endereco = data.endereco || null;
    this.cidade = data.cidade || null;
    this.estado = data.estado || null;
    this.status = data.status || 'ativa';
    this.criado_em = data.criado_em || null;
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados da escola como objeto JavaScript limpo
   * @param {Object} escolaData - Dados brutos da escola
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanEscolaData(escolaData) {
    if (!escolaData || typeof escolaData !== 'object') {
      return {};
    }

    return {
      id: escolaData.id ? parseInt(escolaData.id) : null,
      contrato_id: escolaData.contrato_id ? parseInt(escolaData.contrato_id) : null,
      empresa_id: escolaData.empresa_id ? parseInt(escolaData.empresa_id) : null,
      nome: this._sanitizeString(escolaData.nome),
      codigo_inep: this._sanitizeInep(escolaData.codigo_inep),
      tipo_escola: escolaData.tipo_escola || null,
      telefone: this._sanitizeString(escolaData.telefone),
      email: escolaData.email?.trim().toLowerCase() || null,
      endereco: this._sanitizeString(escolaData.endereco),
      cidade: this._sanitizeString(escolaData.cidade),
      estado: this._sanitizeString(escolaData.estado),
      status: escolaData.status || 'ativa',
      criado_em: escolaData.criado_em || null
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
   * Sanitiza código INEP
   * @param {string} inep - Código INEP de entrada
   * @returns {string} - Código INEP apenas com números
   */
  _sanitizeInep(inep) {
    if (!inep) return null;
    return inep.toString().replace(/\D/g, '').slice(0, 8);
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
   * Valida os dados da escola
   * @returns {Array} - Array de erros encontrados
   */
  validate() {
    const errors = [];

    if (!this.contrato_id) {
      errors.push('ID do contrato é obrigatório');
    }

    if (!this.empresa_id) {
      errors.push('ID da empresa é obrigatório');
    }

    if (!this.nome || this.nome.trim().length < 3) {
      errors.push('Nome da escola é obrigatório e deve ter pelo menos 3 caracteres');
    }

    if (this.codigo_inep && !this.isValidInep(this.codigo_inep)) {
      errors.push('Código INEP deve ter 8 dígitos');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Email deve ter formato válido');
    }

    if (this.telefone && !this.isValidPhone(this.telefone)) {
      errors.push('Telefone deve ter formato válido');
    }

    if (this.tipo_escola && !['municipal', 'estadual', 'federal', 'particular'].includes(this.tipo_escola)) {
      errors.push('Tipo de escola deve ser: municipal, estadual, federal ou particular');
    }

    if (this.status && !['ativa', 'inativa', 'suspensa'].includes(this.status)) {
      errors.push('Status deve ser: ativa, inativa ou suspensa');
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
   * Valida código INEP
   * @param {string} inep 
   * @returns {boolean}
   */
  isValidInep(inep) {
    const cleanInep = inep.replace(/\D/g, '');
    return cleanInep.length === 8;
  }

  // ============================================================================
  // MÉTODOS CRUD DE INSTÂNCIA
  // ============================================================================

  /**
   * Cria nova escola
   * @returns {Promise<Escola>}
   */
  async create() {
    try {
      console.log('📝 Criando nova escola:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados da escola inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar duplicatas de código INEP se fornecido
      if (this.codigo_inep) {
        const existingEscola = await Escola.findByInep(this.codigo_inep);
        if (existingEscola) {
          const error = new Error('Código INEP já está cadastrado');
          error.code = 'INEP_ALREADY_EXISTS';
          error.codigo_inep = this.codigo_inep;
          throw error;
        }
      }

      // Query com prepared statement
      const query = `
        INSERT INTO escolas (contrato_id, empresa_id, nome, codigo_inep, tipo_escola, telefone, email, endereco, cidade, estado, status, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `;

      const values = [
        this.contrato_id, this.empresa_id, this.nome, this.codigo_inep, this.tipo_escola,
        this.telefone, this.email, this.endereco, this.cidade, this.estado, this.status
      ];

      const result = await executeQuery(query, values);
      const escolaData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanEscolaData(escolaData);
      Object.assign(this, cleanData);

      console.log('✅ Escola criada com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar escola:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza a escola
   * @returns {Promise<Escola>}
   */
  async update() {
    try {
      console.log('📝 Atualizando escola:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID da escola é obrigatório para atualização');
        error.code = 'INVALID_ESCOLA_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados da escola inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE escolas 
        SET contrato_id = $1, empresa_id = $2, nome = $3, codigo_inep = $4, tipo_escola = $5,
            telefone = $6, email = $7, endereco = $8, cidade = $9, estado = $10, status = $11
        WHERE id = $12
        RETURNING *
      `;

      const values = [
        this.contrato_id, this.empresa_id, this.nome, this.codigo_inep, this.tipo_escola,
        this.telefone, this.email, this.endereco, this.cidade, this.estado, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Escola não encontrada para atualização');
        error.code = 'ESCOLA_NOT_FOUND_UPDATE';
        error.escolaId = validId;
        throw error;
      }

      const escolaData = result.rows[0];
      const cleanData = this._cleanEscolaData(escolaData);
      Object.assign(this, cleanData);

      console.log('✅ Escola atualizada com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar escola:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.escolaId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta a escola
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando escola:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID da escola é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_ESCOLA_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM escolas WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Escola deletada com sucesso:', validId);
        this.id = null;
        this.status = 'deletada';
      } else {
        const error = new Error('Escola não encontrada para exclusão');
        error.code = 'ESCOLA_NOT_FOUND_DELETE';
        error.escolaId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar escola:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.escolaId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca escola por ID
   * @param {number} id 
   * @returns {Promise<Escola|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando escola por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM escolas WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Escola não encontrada com ID:', validId);
        return null;
      }

      const escolaData = result.rows[0];
      const escola = new Escola();
      const cleanData = escola._cleanEscolaData(escolaData);
      Object.assign(escola, cleanData);

      return escola;

    } catch (error) {
      console.error('❌ Erro ao buscar escola por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca escola por código INEP
   * @param {string} inep 
   * @returns {Promise<Escola|null>}
   */
  static async findByInep(inep) {
    try {
      console.log('🔍 Buscando escola por código INEP:', inep);

      if (!inep || typeof inep !== 'string') {
        console.warn('⚠️ Código INEP inválido fornecido:', inep);
        return null;
      }

      const sanitizedInep = inep.replace(/\D/g, '');
      if (!sanitizedInep || sanitizedInep.length !== 8) {
        console.warn('⚠️ Formato de código INEP inválido:', inep);
        return null;
      }

      const query = 'SELECT * FROM escolas WHERE codigo_inep = $1';
      const result = await executeQuery(query, [sanitizedInep]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Escola não encontrada com código INEP:', sanitizedInep);
        return null;
      }

      const escolaData = result.rows[0];
      const escola = new Escola();
      const cleanData = escola._cleanEscolaData(escolaData);
      Object.assign(escola, cleanData);

      return escola;

    } catch (error) {
      console.error('❌ Erro ao buscar escola por INEP:', error.message);
      error.code = 'FIND_BY_INEP_ERROR';
      error.operation = 'findByInep';
      error.searchInep = inep;
      return null;
    }
  }

  /**
   * Busca escolas por contrato
   * @param {number} contratoId 
   * @returns {Promise<Escola[]>}
   */
  static async findByContrato(contratoId) {
    try {
      console.log('🔍 Buscando escolas por contrato:', contratoId);

      if (!contratoId) return [];

      const validContratoId = parseInt(contratoId);
      if (isNaN(validContratoId) || validContratoId <= 0) {
        console.warn('⚠️ ID do contrato inválido:', contratoId);
        return [];
      }

      const query = `
        SELECT * FROM escolas 
        WHERE contrato_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validContratoId]);

      return result.rows.map(escolaData => {
        const escola = new Escola();
        const cleanData = escola._cleanEscolaData(escolaData);
        Object.assign(escola, cleanData);
        return escola;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar escolas por contrato:', error.message);
      error.code = 'FIND_BY_CONTRATO_ERROR';
      error.operation = 'findByContrato';
      error.contratoId = contratoId;
      return [];
    }
  }

  /**
   * Busca escolas por empresa
   * @param {number} empresaId 
   * @returns {Promise<Escola[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando escolas por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM escolas 
        WHERE empresa_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(escolaData => {
        const escola = new Escola();
        const cleanData = escola._cleanEscolaData(escolaData);
        Object.assign(escola, cleanData);
        return escola;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar escolas por empresa:', error.message);
      error.code = 'FIND_BY_EMPRESA_ERROR';
      error.operation = 'findByEmpresa';
      error.empresaId = empresaId;
      return [];
    }
  }

  /**
   * Lista todas as escolas com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{escolas: Escola[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    try {
      console.log('🔍 Buscando escolas com filtros:', filters);

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

      if (filters.contrato_id) {
        whereClauses.push(`contrato_id = $${paramIndex}`);
        params.push(filters.contrato_id);
        paramIndex++;
      }

      if (filters.tipo_escola) {
        whereClauses.push(`tipo_escola = $${paramIndex}`);
        params.push(filters.tipo_escola);
        paramIndex++;
      }

      if (filters.status) {
        whereClauses.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.estado) {
        whereClauses.push(`estado = $${paramIndex}`);
        params.push(filters.estado);
        paramIndex++;
      }

      if (filters.search) {
        whereClauses.push(`(nome ILIKE $${paramIndex} OR codigo_inep LIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Query para contar total
      const countQuery = `SELECT COUNT(*) FROM escolas ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM escolas 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await executeQuery(dataQuery, params);

      const escolas = dataResult.rows.map(escolaData => {
        const escola = new Escola();
        const cleanData = escola._cleanEscolaData(escolaData);
        Object.assign(escola, cleanData);
        return escola;
      });

      return { escolas, total };

    } catch (error) {
      console.error('❌ Erro ao buscar escolas:', error.message);
      error.code = 'FIND_ALL_ERROR';
      error.operation = 'findAll';
      return { escolas: [], total: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria uma nova escola (método estático)
   * @param {Object} dadosEscola - Dados da escola a ser criada
   * @returns {Promise<Escola>}
   */
  static async criar(dadosEscola) {
    console.log('📝 Criando nova escola (método estático):', dadosEscola.nome);
    const escola = new Escola(dadosEscola);
    return await escola.create();
  }

  /**
   * Atualiza uma escola existente (método estático)
   * @param {number} id - ID da escola
   * @param {Object} dadosEscola - Dados atualizados da escola
   * @returns {Promise<Escola>}
   */
  static async atualizar(id, dadosEscola) {
    console.log('📝 Atualizando escola (método estático):', id);

    if (!id) {
      throw new Error('ID da escola é obrigatório para atualização');
    }

    const escola = await Escola.findById(id);
    if (!escola) {
      throw new Error('Escola não encontrada');
    }

    Object.assign(escola, dadosEscola);
    return await escola.update();
  }

  /**
   * Deleta uma escola (método estático)
   * @param {number} id - ID da escola
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando escola (método estático):', id);

    if (!id) {
      throw new Error('ID da escola é obrigatório para exclusão');
    }

    const escola = await Escola.findById(id);
    if (!escola) {
      throw new Error('Escola não encontrada');
    }

    return await escola.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados da escola para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      return {
        id: parseInt(this.id) || null,
        contrato_id: parseInt(this.contrato_id) || null,
        empresa_id: parseInt(this.empresa_id) || null,
        nome: this.nome?.trim() || null,
        codigo_inep: this.codigo_inep?.trim() || null,
        tipo_escola: this.tipo_escola || null,
        telefone: this.telefone?.trim() || null,
        email: this.email?.trim() || null,
        endereco: this.endereco?.trim() || null,
        cidade: this.cidade?.trim() || null,
        estado: this.estado?.trim() || null,
        status: this.status || 'ativa',
        criado_em: this.criado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao converter escola para JSON:', error.message);
      
      return {
        id: this.id || null,
        nome: this.nome || null,
        codigo_inep: this.codigo_inep || null,
        status: this.status || 'ativa',
        error: 'Erro ao processar dados da escola'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas das escolas
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_escolas,
          COUNT(CASE WHEN status = 'ativa' THEN 1 END) as escolas_ativas,
          COUNT(CASE WHEN status = 'inativa' THEN 1 END) as escolas_inativas,
          COUNT(CASE WHEN status = 'suspensa' THEN 1 END) as escolas_suspensas,
          COUNT(CASE WHEN tipo_escola = 'municipal' THEN 1 END) as escolas_municipais,
          COUNT(CASE WHEN tipo_escola = 'estadual' THEN 1 END) as escolas_estaduais,
          COUNT(CASE WHEN tipo_escola = 'federal' THEN 1 END) as escolas_federais,
          COUNT(CASE WHEN tipo_escola = 'particular' THEN 1 END) as escolas_particulares
        FROM escolas
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas das escolas:', error.message);
      return {
        total_escolas: 0,
        escolas_ativas: 0,
        escolas_inativas: 0,
        escolas_suspensas: 0,
        escolas_municipais: 0,
        escolas_estaduais: 0,
        escolas_federais: 0,
        escolas_particulares: 0
      };
    }
  }
}

export default Escola;
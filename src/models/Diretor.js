import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para diretores
 * Gerencia todas as operações CRUD e validações para a tabela diretores
 */
export class Diretor {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usr_id = data.usr_id || null;
    this.escola_id = data.escola_id || null;
    this.empresa_id = data.empresa_id || null;
    this.nome = data.nome || null;
    this.cargo = data.cargo || null;
    this.data_inicio = data.data_inicio || null;
    this.status = data.status || 'ativo';
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados do diretor como objeto JavaScript limpo
   * @param {Object} diretorData - Dados brutos do diretor
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanDiretorData(diretorData) {
    if (!diretorData || typeof diretorData !== 'object') {
      return {};
    }

    return {
      id: diretorData.id ? parseInt(diretorData.id) : null,
      usr_id: diretorData.usr_id ? parseInt(diretorData.usr_id) : null,
      escola_id: diretorData.escola_id ? parseInt(diretorData.escola_id) : null,
      empresa_id: diretorData.empresa_id ? parseInt(diretorData.empresa_id) : null,
      nome: this._sanitizeString(diretorData.nome),
      cargo: this._sanitizeString(diretorData.cargo),
      data_inicio: diretorData.data_inicio || null,
      status: diretorData.status || 'ativo'
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
   * Valida os dados do diretor
   * @returns {Array} - Array de erros encontrados
   */
  validate() {
    const errors = [];

    if (!this.usr_id) {
      errors.push('ID do usuário é obrigatório');
    }

    if (!this.escola_id) {
      errors.push('ID da escola é obrigatório');
    }

    if (!this.empresa_id) {
      errors.push('ID da empresa é obrigatório');
    }

    if (!this.nome || this.nome.trim().length < 2) {
      errors.push('Nome do diretor é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (!this.cargo || this.cargo.trim().length < 3) {
      errors.push('Cargo é obrigatório e deve ter pelo menos 3 caracteres');
    }

    if (this.data_inicio && !this.isValidDate(this.data_inicio)) {
      errors.push('Data de início deve ter formato válido');
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
   * Cria novo diretor
   * @returns {Promise<Diretor>}
   */
  async create() {
    try {
      console.log('📝 Criando novo diretor:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do diretor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar se usr_id já existe
      const existingDiretor = await Diretor.findByUserId(this.usr_id);
      if (existingDiretor) {
        const error = new Error('Usuário já está cadastrado como diretor');
        error.code = 'USER_ALREADY_DIRECTOR';
        error.usr_id = this.usr_id;
        throw error;
      }

      // Verificar se já existe um diretor para a escola
      const existingDiretorEscola = await Diretor.findByEscola(this.escola_id);
      if (existingDiretorEscola && existingDiretorEscola.length > 0) {
        const error = new Error('Escola já possui um diretor ativo');
        error.code = 'SCHOOL_ALREADY_HAS_DIRECTOR';
        error.escola_id = this.escola_id;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO diretores (usr_id, escola_id, empresa_id, nome, cargo, data_inicio, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.nome, this.cargo, this.data_inicio, this.status
      ];

      const result = await executeQuery(query, values);
      const diretorData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanDiretorData(diretorData);
      Object.assign(this, cleanData);

      console.log('✅ Diretor criado com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar diretor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza o diretor
   * @returns {Promise<Diretor>}
   */
  async update() {
    try {
      console.log('📝 Atualizando diretor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do diretor é obrigatório para atualização');
        error.code = 'INVALID_DIRETOR_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do diretor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE diretores 
        SET usr_id = $1, escola_id = $2, empresa_id = $3, nome = $4, cargo = $5, data_inicio = $6, status = $7
        WHERE id = $8
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.nome, this.cargo, this.data_inicio, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Diretor não encontrado para atualização');
        error.code = 'DIRETOR_NOT_FOUND_UPDATE';
        error.diretorId = validId;
        throw error;
      }

      const diretorData = result.rows[0];
      const cleanData = this._cleanDiretorData(diretorData);
      Object.assign(this, cleanData);

      console.log('✅ Diretor atualizado com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar diretor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.diretorId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta o diretor
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando diretor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do diretor é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_DIRETOR_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM diretores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Diretor deletado com sucesso:', validId);
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Diretor não encontrado para exclusão');
        error.code = 'DIRETOR_NOT_FOUND_DELETE';
        error.diretorId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar diretor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.diretorId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca diretor por ID
   * @param {number} id 
   * @returns {Promise<Diretor|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando diretor por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM diretores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Diretor não encontrado com ID:', validId);
        return null;
      }

      const diretorData = result.rows[0];
      const diretor = new Diretor();
      const cleanData = diretor._cleanDiretorData(diretorData);
      Object.assign(diretor, cleanData);

      return diretor;

    } catch (error) {
      console.error('❌ Erro ao buscar diretor por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca diretor por usr_id
   * @param {number} usrId 
   * @returns {Promise<Diretor|null>}
   */
  static async findByUserId(usrId) {
    try {
      console.log('🔍 Buscando diretor por usr_id:', usrId);

      if (!usrId) return null;

      const validUsrId = parseInt(usrId);
      if (isNaN(validUsrId) || validUsrId <= 0) {
        console.warn('⚠️ usr_id inválido fornecido:', usrId);
        return null;
      }

      const query = 'SELECT * FROM diretores WHERE usr_id = $1';
      const result = await executeQuery(query, [validUsrId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Diretor não encontrado com usr_id:', validUsrId);
        return null;
      }

      const diretorData = result.rows[0];
      const diretor = new Diretor();
      const cleanData = diretor._cleanDiretorData(diretorData);
      Object.assign(diretor, cleanData);

      return diretor;

    } catch (error) {
      console.error('❌ Erro ao buscar diretor por usr_id:', error.message);
      error.code = 'FIND_BY_USER_ID_ERROR';
      error.operation = 'findByUserId';
      error.searchUsrId = usrId;
      return null;
    }
  }

  /**
   * Busca diretores por escola
   * @param {number} escolaId 
   * @returns {Promise<Diretor[]>}
   */
  static async findByEscola(escolaId) {
    try {
      console.log('🔍 Buscando diretores por escola:', escolaId);

      if (!escolaId) return [];

      const validEscolaId = parseInt(escolaId);
      if (isNaN(validEscolaId) || validEscolaId <= 0) {
        console.warn('⚠️ ID da escola inválido:', escolaId);
        return [];
      }

      const query = `
        SELECT * FROM diretores 
        WHERE escola_id = $1 AND status = 'ativo'
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEscolaId]);

      return result.rows.map(diretorData => {
        const diretor = new Diretor();
        const cleanData = diretor._cleanDiretorData(diretorData);
        Object.assign(diretor, cleanData);
        return diretor;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar diretores por escola:', error.message);
      error.code = 'FIND_BY_ESCOLA_ERROR';
      error.operation = 'findByEscola';
      error.escolaId = escolaId;
      return [];
    }
  }

  /**
   * Busca diretores por empresa
   * @param {number} empresaId 
   * @returns {Promise<Diretor[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando diretores por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM diretores 
        WHERE empresa_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(diretorData => {
        const diretor = new Diretor();
        const cleanData = diretor._cleanDiretorData(diretorData);
        Object.assign(diretor, cleanData);
        return diretor;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar diretores por empresa:', error.message);
      error.code = 'FIND_BY_EMPRESA_ERROR';
      error.operation = 'findByEmpresa';
      error.empresaId = empresaId;
      return [];
    }
  }

  /**
   * Lista todos os diretores com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {Object} options - Opções de paginação e ordenação
   * @returns {Promise<{diretores: Diretor[], total: number}>}
   */
  static async findAll(filters = {}, options = {}) {
    try {
      console.log('🔍 Buscando diretores com filtros:', filters);

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

      if (filters.escola_id) {
        whereClauses.push(`escola_id = $${paramIndex}`);
        params.push(filters.escola_id);
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
      const countQuery = `SELECT COUNT(*) FROM diretores ${whereClause}`;
      const countResult = await executeQuery(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      // Query para buscar dados
      const dataQuery = `
        SELECT * FROM diretores 
        ${whereClause}
        ORDER BY ${orderBy} ${orderDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);
      const dataResult = await executeQuery(dataQuery, params);

      const diretores = dataResult.rows.map(diretorData => {
        const diretor = new Diretor();
        const cleanData = diretor._cleanDiretorData(diretorData);
        Object.assign(diretor, cleanData);
        return diretor;
      });

      return { diretores, total };

    } catch (error) {
      console.error('❌ Erro ao buscar diretores:', error.message);
      error.code = 'FIND_ALL_ERROR';
      error.operation = 'findAll';
      return { diretores: [], total: 0 };
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria um novo diretor (método estático)
   * @param {Object} dadosDiretor - Dados do diretor a ser criado
   * @returns {Promise<Diretor>}
   */
  static async criar(dadosDiretor) {
    console.log('📝 Criando novo diretor (método estático):', dadosDiretor.nome);
    const diretor = new Diretor(dadosDiretor);
    return await diretor.create();
  }

  /**
   * Atualiza um diretor existente (método estático)
   * @param {number} id - ID do diretor
   * @param {Object} dadosDiretor - Dados atualizados do diretor
   * @returns {Promise<Diretor>}
   */
  static async atualizar(id, dadosDiretor) {
    console.log('📝 Atualizando diretor (método estático):', id);

    if (!id) {
      throw new Error('ID do diretor é obrigatório para atualização');
    }

    const diretor = await Diretor.findById(id);
    if (!diretor) {
      throw new Error('Diretor não encontrado');
    }

    Object.assign(diretor, dadosDiretor);
    return await diretor.update();
  }

  /**
   * Deleta um diretor (método estático)
   * @param {number} id - ID do diretor
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando diretor (método estático):', id);

    if (!id) {
      throw new Error('ID do diretor é obrigatório para exclusão');
    }

    const diretor = await Diretor.findById(id);
    if (!diretor) {
      throw new Error('Diretor não encontrado');
    }

    return await diretor.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados do diretor para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      return {
        id: parseInt(this.id) || null,
        usr_id: parseInt(this.usr_id) || null,
        escola_id: parseInt(this.escola_id) || null,
        empresa_id: parseInt(this.empresa_id) || null,
        nome: this.nome?.trim() || null,
        cargo: this.cargo?.trim() || null,
        data_inicio: this.data_inicio || null,
        status: this.status || 'ativo'
      };
    } catch (error) {
      console.error('❌ Erro ao converter diretor para JSON:', error.message);
      
      return {
        id: this.id || null,
        usr_id: this.usr_id || null,
        escola_id: this.escola_id || null,
        nome: this.nome || null,
        cargo: this.cargo || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do diretor'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas dos diretores
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_diretores,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as diretores_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as diretores_inativos,
          COUNT(CASE WHEN status = 'licenca' THEN 1 END) as diretores_licenca,
          COUNT(CASE WHEN status = 'afastado' THEN 1 END) as diretores_afastados,
          COUNT(DISTINCT escola_id) as escolas_com_diretores,
          COUNT(DISTINCT empresa_id) as empresas_com_diretores
        FROM diretores
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas dos diretores:', error.message);
      return {
        total_diretores: 0,
        diretores_ativos: 0,
        diretores_inativos: 0,
        diretores_licenca: 0,
        diretores_afastados: 0,
        escolas_com_diretores: 0,
        empresas_com_diretores: 0
      };
    }
  }
}

export default Diretor;
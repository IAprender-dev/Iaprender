import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para professores
 * Gerencia todas as operações CRUD e validações para a tabela professores
 */
export class Professor {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usr_id = data.usr_id || null;
    this.escola_id = data.escola_id || null;
    this.empresa_id = data.empresa_id || null;
    this.nome = data.nome || null;
    this.disciplinas = data.disciplinas || null;
    this.formacao = data.formacao || null;
    this.data_admissao = data.data_admissao || null;
    this.status = data.status || 'ativo';
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados do professor como objeto JavaScript limpo
   * @param {Object} professorData - Dados brutos do professor
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanProfessorData(professorData) {
    if (!professorData || typeof professorData !== 'object') {
      return {};
    }

    // Processar disciplinas como array
    let disciplinas = [];
    if (professorData.disciplinas) {
      try {
        disciplinas = typeof professorData.disciplinas === 'string' 
          ? JSON.parse(professorData.disciplinas) 
          : professorData.disciplinas;
      } catch (error) {
        console.warn('⚠️ Erro ao fazer parse das disciplinas:', error.message);
        disciplinas = [];
      }
    }

    return {
      id: professorData.id ? parseInt(professorData.id) : null,
      usr_id: professorData.usr_id ? parseInt(professorData.usr_id) : null,
      escola_id: professorData.escola_id ? parseInt(professorData.escola_id) : null,
      empresa_id: professorData.empresa_id ? parseInt(professorData.empresa_id) : null,
      nome: this._sanitizeString(professorData.nome),
      disciplinas: Array.isArray(disciplinas) ? disciplinas : [],
      formacao: this._sanitizeString(professorData.formacao),
      data_admissao: professorData.data_admissao || null,
      status: professorData.status || 'ativo'
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
   * Valida os dados do professor
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
      errors.push('Nome do professor é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (this.disciplinas && !Array.isArray(this.disciplinas)) {
      errors.push('Disciplinas devem ser fornecidas como array');
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
   * Cria novo professor
   * @returns {Promise<Professor>}
   */
  async create() {
    try {
      console.log('📝 Criando novo professor:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do professor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar se usr_id já existe
      const existingProfessor = await Professor.findByUserId(this.usr_id);
      if (existingProfessor) {
        const error = new Error('Usuário já está cadastrado como professor');
        error.code = 'USER_ALREADY_PROFESSOR';
        error.usr_id = this.usr_id;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO professores (usr_id, escola_id, empresa_id, nome, disciplinas, formacao, data_admissao, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.nome,
        JSON.stringify(this.disciplinas || []), this.formacao, this.data_admissao, this.status
      ];

      const result = await executeQuery(query, values);
      const professorData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanProfessorData(professorData);
      Object.assign(this, cleanData);

      console.log('✅ Professor criado com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar professor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza o professor
   * @returns {Promise<Professor>}
   */
  async update() {
    try {
      console.log('📝 Atualizando professor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do professor é obrigatório para atualização');
        error.code = 'INVALID_PROFESSOR_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do professor inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE professores 
        SET usr_id = $1, escola_id = $2, empresa_id = $3, nome = $4, 
            disciplinas = $5, formacao = $6, data_admissao = $7, status = $8
        WHERE id = $9
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.nome,
        JSON.stringify(this.disciplinas || []), this.formacao, this.data_admissao, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Professor não encontrado para atualização');
        error.code = 'PROFESSOR_NOT_FOUND_UPDATE';
        error.professorId = validId;
        throw error;
      }

      const professorData = result.rows[0];
      const cleanData = this._cleanProfessorData(professorData);
      Object.assign(this, cleanData);

      console.log('✅ Professor atualizado com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar professor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.professorId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta o professor
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando professor:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do professor é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_PROFESSOR_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM professores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Professor deletado com sucesso:', validId);
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Professor não encontrado para exclusão');
        error.code = 'PROFESSOR_NOT_FOUND_DELETE';
        error.professorId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar professor:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.professorId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca professor por ID
   * @param {number} id 
   * @returns {Promise<Professor|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando professor por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM professores WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Professor não encontrado com ID:', validId);
        return null;
      }

      const professorData = result.rows[0];
      const professor = new Professor();
      const cleanData = professor._cleanProfessorData(professorData);
      Object.assign(professor, cleanData);

      return professor;

    } catch (error) {
      console.error('❌ Erro ao buscar professor por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca professor por usr_id
   * @param {number} usrId 
   * @returns {Promise<Professor|null>}
   */
  static async findByUserId(usrId) {
    try {
      console.log('🔍 Buscando professor por usr_id:', usrId);

      if (!usrId) return null;

      const validUsrId = parseInt(usrId);
      if (isNaN(validUsrId) || validUsrId <= 0) {
        console.warn('⚠️ usr_id inválido fornecido:', usrId);
        return null;
      }

      const query = 'SELECT * FROM professores WHERE usr_id = $1';
      const result = await executeQuery(query, [validUsrId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Professor não encontrado com usr_id:', validUsrId);
        return null;
      }

      const professorData = result.rows[0];
      const professor = new Professor();
      const cleanData = professor._cleanProfessorData(professorData);
      Object.assign(professor, cleanData);

      return professor;

    } catch (error) {
      console.error('❌ Erro ao buscar professor por usr_id:', error.message);
      error.code = 'FIND_BY_USER_ID_ERROR';
      error.operation = 'findByUserId';
      error.searchUsrId = usrId;
      return null;
    }
  }

  /**
   * Busca professores por escola
   * @param {number} escolaId 
   * @returns {Promise<Professor[]>}
   */
  static async findByEscola(escolaId) {
    try {
      console.log('🔍 Buscando professores por escola:', escolaId);

      if (!escolaId) return [];

      const validEscolaId = parseInt(escolaId);
      if (isNaN(validEscolaId) || validEscolaId <= 0) {
        console.warn('⚠️ ID da escola inválido:', escolaId);
        return [];
      }

      const query = `
        SELECT * FROM professores 
        WHERE escola_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEscolaId]);

      return result.rows.map(professorData => {
        const professor = new Professor();
        const cleanData = professor._cleanProfessorData(professorData);
        Object.assign(professor, cleanData);
        return professor;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar professores por escola:', error.message);
      error.code = 'FIND_BY_ESCOLA_ERROR';
      error.operation = 'findByEscola';
      error.escolaId = escolaId;
      return [];
    }
  }

  /**
   * Busca professores por empresa
   * @param {number} empresaId 
   * @returns {Promise<Professor[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando professores por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM professores 
        WHERE empresa_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(professorData => {
        const professor = new Professor();
        const cleanData = professor._cleanProfessorData(professorData);
        Object.assign(professor, cleanData);
        return professor;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar professores por empresa:', error.message);
      error.code = 'FIND_BY_EMPRESA_ERROR';
      error.operation = 'findByEmpresa';
      error.empresaId = empresaId;
      return [];
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS CRUD
  // ============================================================================

  /**
   * Cria um novo professor (método estático)
   * @param {Object} dadosProfessor - Dados do professor a ser criado
   * @returns {Promise<Professor>}
   */
  static async criar(dadosProfessor) {
    console.log('📝 Criando novo professor (método estático):', dadosProfessor.nome);
    const professor = new Professor(dadosProfessor);
    return await professor.create();
  }

  /**
   * Atualiza um professor existente (método estático)
   * @param {number} id - ID do professor
   * @param {Object} dadosProfessor - Dados atualizados do professor
   * @returns {Promise<Professor>}
   */
  static async atualizar(id, dadosProfessor) {
    console.log('📝 Atualizando professor (método estático):', id);

    if (!id) {
      throw new Error('ID do professor é obrigatório para atualização');
    }

    const professor = await Professor.findById(id);
    if (!professor) {
      throw new Error('Professor não encontrado');
    }

    Object.assign(professor, dadosProfessor);
    return await professor.update();
  }

  /**
   * Deleta um professor (método estático)
   * @param {number} id - ID do professor
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando professor (método estático):', id);

    if (!id) {
      throw new Error('ID do professor é obrigatório para exclusão');
    }

    const professor = await Professor.findById(id);
    if (!professor) {
      throw new Error('Professor não encontrado');
    }

    return await professor.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados do professor para resposta da API
   * Retorna objeto JavaScript limpo e seguro
   * @returns {Object}
   */
  toJSON() {
    try {
      // Garantir que disciplinas seja um array válido
      let disciplinas = [];
      if (this.disciplinas) {
        try {
          disciplinas = Array.isArray(this.disciplinas) 
            ? this.disciplinas 
            : JSON.parse(this.disciplinas);
        } catch (parseError) {
          console.warn('⚠️ Erro ao fazer parse das disciplinas no toJSON:', parseError.message);
          disciplinas = [];
        }
      }

      return {
        id: parseInt(this.id) || null,
        usr_id: parseInt(this.usr_id) || null,
        escola_id: parseInt(this.escola_id) || null,
        empresa_id: parseInt(this.empresa_id) || null,
        nome: this.nome?.trim() || null,
        disciplinas: disciplinas,
        formacao: this.formacao?.trim() || null,
        data_admissao: this.data_admissao || null,
        status: this.status || 'ativo'
      };
    } catch (error) {
      console.error('❌ Erro ao converter professor para JSON:', error.message);
      
      return {
        id: this.id || null,
        usr_id: this.usr_id || null,
        nome: this.nome || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do professor'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas dos professores
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_professores,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as professores_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as professores_inativos,
          COUNT(CASE WHEN status = 'licenca' THEN 1 END) as professores_licenca,
          COUNT(CASE WHEN status = 'afastado' THEN 1 END) as professores_afastados
        FROM professores
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas dos professores:', error.message);
      return {
        total_professores: 0,
        professores_ativos: 0,
        professores_inativos: 0,
        professores_licenca: 0,
        professores_afastados: 0
      };
    }
  }
}

export default Professor;
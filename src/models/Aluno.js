import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Modelo de dados para alunos
 * Gerencia todas as operações CRUD e validações para a tabela alunos
 */
export class Aluno {
  constructor(data = {}) {
    this.id = data.id || null;
    this.usr_id = data.usr_id || null;
    this.escola_id = data.escola_id || null;
    this.empresa_id = data.empresa_id || null;
    this.matricula = data.matricula || null;
    this.nome = data.nome || null;
    this.turma = data.turma || null;
    this.serie = data.serie || null;
    this.turno = data.turno || null;
    this.nome_responsavel = data.nome_responsavel || null;
    this.contato_responsavel = data.contato_responsavel || null;
    this.data_matricula = data.data_matricula || null;
    this.status = data.status || 'ativo';
    this.criado_em = data.criado_em || null;
  }

  // ============================================================================
  // MÉTODOS DE LIMPEZA E VALIDAÇÃO
  // ============================================================================

  /**
   * Retorna dados do aluno como objeto JavaScript limpo
   * @param {Object} alunoData - Dados brutos do aluno
   * @returns {Object} - Objeto limpo e estruturado
   */
  _cleanAlunoData(alunoData) {
    if (!alunoData || typeof alunoData !== 'object') {
      return {};
    }

    return {
      id: alunoData.id ? parseInt(alunoData.id) : null,
      usr_id: alunoData.usr_id ? parseInt(alunoData.usr_id) : null,
      escola_id: alunoData.escola_id ? parseInt(alunoData.escola_id) : null,
      empresa_id: alunoData.empresa_id ? parseInt(alunoData.empresa_id) : null,
      matricula: this._sanitizeString(alunoData.matricula),
      nome: this._sanitizeString(alunoData.nome),
      turma: this._sanitizeString(alunoData.turma),
      serie: this._sanitizeString(alunoData.serie),
      turno: alunoData.turno || null,
      nome_responsavel: this._sanitizeString(alunoData.nome_responsavel),
      contato_responsavel: this._sanitizeString(alunoData.contato_responsavel),
      data_matricula: alunoData.data_matricula || null,
      status: alunoData.status || 'ativo',
      criado_em: alunoData.criado_em || null
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
   * Valida os dados do aluno
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

    if (!this.matricula || this.matricula.trim().length < 3) {
      errors.push('Matrícula é obrigatória e deve ter pelo menos 3 caracteres');
    }

    if (!this.nome || this.nome.trim().length < 2) {
      errors.push('Nome do aluno é obrigatório e deve ter pelo menos 2 caracteres');
    }

    if (this.turno && !['manha', 'tarde', 'noite', 'integral'].includes(this.turno)) {
      errors.push('Turno deve ser: manha, tarde, noite ou integral');
    }

    if (this.data_matricula && !this.isValidDate(this.data_matricula)) {
      errors.push('Data de matrícula deve ter formato válido');
    }

    if (this.status && !['ativo', 'inativo', 'transferido', 'evadido', 'formado'].includes(this.status)) {
      errors.push('Status deve ser: ativo, inativo, transferido, evadido ou formado');
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
   * Cria novo aluno
   * @returns {Promise<Aluno>}
   */
  async create() {
    try {
      console.log('📝 Criando novo aluno:', this.nome);

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do aluno inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Verificar se usr_id já existe
      const existingAluno = await Aluno.findByUserId(this.usr_id);
      if (existingAluno) {
        const error = new Error('Usuário já está cadastrado como aluno');
        error.code = 'USER_ALREADY_STUDENT';
        error.usr_id = this.usr_id;
        throw error;
      }

      // Verificar se matrícula já existe
      const existingMatricula = await Aluno.findByMatricula(this.matricula);
      if (existingMatricula) {
        const error = new Error('Matrícula já está em uso');
        error.code = 'MATRICULA_ALREADY_EXISTS';
        error.matricula = this.matricula;
        throw error;
      }

      // Query com prepared statement
      const query = `
        INSERT INTO alunos (usr_id, escola_id, empresa_id, matricula, nome, turma, serie, turno, nome_responsavel, contato_responsavel, data_matricula, status, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.matricula, this.nome,
        this.turma, this.serie, this.turno, this.nome_responsavel, this.contato_responsavel,
        this.data_matricula, this.status
      ];

      const result = await executeQuery(query, values);
      const alunoData = result.rows[0];

      // Atualizar dados da instância com dados limpos
      const cleanData = this._cleanAlunoData(alunoData);
      Object.assign(this, cleanData);

      console.log('✅ Aluno criado com sucesso:', this.id);
      return this;

    } catch (error) {
      console.error('❌ Erro ao criar aluno:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_CREATE_ERROR';
        error.operation = 'create';
      }

      throw error;
    }
  }

  /**
   * Atualiza o aluno
   * @returns {Promise<Aluno>}
   */
  async update() {
    try {
      console.log('📝 Atualizando aluno:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do aluno é obrigatório para atualização');
        error.code = 'INVALID_ALUNO_ID';
        throw error;
      }

      // Validação
      const validationErrors = this.validate();
      if (validationErrors.length > 0) {
        const error = new Error('Dados do aluno inválidos: ' + validationErrors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.errors = validationErrors;
        throw error;
      }

      // Query com prepared statement
      const query = `
        UPDATE alunos 
        SET usr_id = $1, escola_id = $2, empresa_id = $3, matricula = $4, nome = $5,
            turma = $6, serie = $7, turno = $8, nome_responsavel = $9, contato_responsavel = $10,
            data_matricula = $11, status = $12
        WHERE id = $13
        RETURNING *
      `;

      const values = [
        this.usr_id, this.escola_id, this.empresa_id, this.matricula, this.nome,
        this.turma, this.serie, this.turno, this.nome_responsavel, this.contato_responsavel,
        this.data_matricula, this.status, validId
      ];

      const result = await executeQuery(query, values);

      if (result.rowCount === 0) {
        const error = new Error('Aluno não encontrado para atualização');
        error.code = 'ALUNO_NOT_FOUND_UPDATE';
        error.alunoId = validId;
        throw error;
      }

      const alunoData = result.rows[0];
      const cleanData = this._cleanAlunoData(alunoData);
      Object.assign(this, cleanData);

      console.log('✅ Aluno atualizado com sucesso:', validId);
      return this;

    } catch (error) {
      console.error('❌ Erro ao atualizar aluno:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_UPDATE_ERROR';
        error.operation = 'update';
        error.alunoId = this.id;
      }

      throw error;
    }
  }

  /**
   * Deleta o aluno
   * @returns {Promise<boolean>}
   */
  async delete() {
    try {
      console.log('🗑️ Deletando aluno:', this.id);

      const validId = this._validateId(this.id);
      if (!validId) {
        const error = new Error('ID do aluno é obrigatório e deve ser um número válido para exclusão');
        error.code = 'INVALID_ALUNO_ID';
        error.providedId = this.id;
        throw error;
      }

      // Query com prepared statement
      const query = 'DELETE FROM alunos WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      const deleted = result.rowCount > 0;

      if (deleted) {
        console.log('✅ Aluno deletado com sucesso:', validId);
        this.id = null;
        this.status = 'deletado';
      } else {
        const error = new Error('Aluno não encontrado para exclusão');
        error.code = 'ALUNO_NOT_FOUND_DELETE';
        error.alunoId = validId;
        throw error;
      }

      return deleted;

    } catch (error) {
      console.error('❌ Erro ao deletar aluno:', error.message);

      if (!error.code) {
        error.code = 'UNKNOWN_DELETE_ERROR';
        error.operation = 'delete';
        error.alunoId = this.id;
      }

      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS ESTÁTICOS DE BUSCA
  // ============================================================================

  /**
   * Busca aluno por ID
   * @param {number} id 
   * @returns {Promise<Aluno|null>}
   */
  static async findById(id) {
    try {
      console.log('🔍 Buscando aluno por ID:', id);

      if (!id) return null;

      const validId = parseInt(id);
      if (isNaN(validId) || validId <= 0) {
        console.warn('⚠️ ID inválido fornecido:', id);
        return null;
      }

      const query = 'SELECT * FROM alunos WHERE id = $1';
      const result = await executeQuery(query, [validId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Aluno não encontrado com ID:', validId);
        return null;
      }

      const alunoData = result.rows[0];
      const aluno = new Aluno();
      const cleanData = aluno._cleanAlunoData(alunoData);
      Object.assign(aluno, cleanData);

      return aluno;

    } catch (error) {
      console.error('❌ Erro ao buscar aluno por ID:', error.message);
      error.code = 'FIND_BY_ID_ERROR';
      error.operation = 'findById';
      error.searchId = id;
      return null;
    }
  }

  /**
   * Busca aluno por usr_id
   * @param {number} usrId 
   * @returns {Promise<Aluno|null>}
   */
  static async findByUserId(usrId) {
    try {
      console.log('🔍 Buscando aluno por usr_id:', usrId);

      if (!usrId) return null;

      const validUsrId = parseInt(usrId);
      if (isNaN(validUsrId) || validUsrId <= 0) {
        console.warn('⚠️ usr_id inválido fornecido:', usrId);
        return null;
      }

      const query = 'SELECT * FROM alunos WHERE usr_id = $1';
      const result = await executeQuery(query, [validUsrId]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Aluno não encontrado com usr_id:', validUsrId);
        return null;
      }

      const alunoData = result.rows[0];
      const aluno = new Aluno();
      const cleanData = aluno._cleanAlunoData(alunoData);
      Object.assign(aluno, cleanData);

      return aluno;

    } catch (error) {
      console.error('❌ Erro ao buscar aluno por usr_id:', error.message);
      error.code = 'FIND_BY_USER_ID_ERROR';
      error.operation = 'findByUserId';
      error.searchUsrId = usrId;
      return null;
    }
  }

  /**
   * Busca aluno por matrícula
   * @param {string} matricula 
   * @returns {Promise<Aluno|null>}
   */
  static async findByMatricula(matricula) {
    try {
      console.log('🔍 Buscando aluno por matrícula:', matricula);

      if (!matricula || typeof matricula !== 'string') {
        console.warn('⚠️ Matrícula inválida fornecida:', matricula);
        return null;
      }

      const query = 'SELECT * FROM alunos WHERE matricula = $1';
      const result = await executeQuery(query, [matricula.trim()]);

      if (!result.rows || result.rows.length === 0) {
        console.log('📝 Aluno não encontrado com matrícula:', matricula);
        return null;
      }

      const alunoData = result.rows[0];
      const aluno = new Aluno();
      const cleanData = aluno._cleanAlunoData(alunoData);
      Object.assign(aluno, cleanData);

      return aluno;

    } catch (error) {
      console.error('❌ Erro ao buscar aluno por matrícula:', error.message);
      error.code = 'FIND_BY_MATRICULA_ERROR';
      error.operation = 'findByMatricula';
      error.searchMatricula = matricula;
      return null;
    }
  }

  /**
   * Busca alunos por escola
   * @param {number} escolaId 
   * @returns {Promise<Aluno[]>}
   */
  static async findByEscola(escolaId) {
    try {
      console.log('🔍 Buscando alunos por escola:', escolaId);

      if (!escolaId) return [];

      const validEscolaId = parseInt(escolaId);
      if (isNaN(validEscolaId) || validEscolaId <= 0) {
        console.warn('⚠️ ID da escola inválido:', escolaId);
        return [];
      }

      const query = `
        SELECT * FROM alunos 
        WHERE escola_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEscolaId]);

      return result.rows.map(alunoData => {
        const aluno = new Aluno();
        const cleanData = aluno._cleanAlunoData(alunoData);
        Object.assign(aluno, cleanData);
        return aluno;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar alunos por escola:', error.message);
      error.code = 'FIND_BY_ESCOLA_ERROR';
      error.operation = 'findByEscola';
      error.escolaId = escolaId;
      return [];
    }
  }

  /**
   * Busca alunos por empresa
   * @param {number} empresaId 
   * @returns {Promise<Aluno[]>}
   */
  static async findByEmpresa(empresaId) {
    try {
      console.log('🔍 Buscando alunos por empresa:', empresaId);

      if (!empresaId) return [];

      const validEmpresaId = parseInt(empresaId);
      if (isNaN(validEmpresaId) || validEmpresaId <= 0) {
        console.warn('⚠️ ID da empresa inválido:', empresaId);
        return [];
      }

      const query = `
        SELECT * FROM alunos 
        WHERE empresa_id = $1 
        ORDER BY nome ASC
      `;

      const result = await executeQuery(query, [validEmpresaId]);

      return result.rows.map(alunoData => {
        const aluno = new Aluno();
        const cleanData = aluno._cleanAlunoData(alunoData);
        Object.assign(aluno, cleanData);
        return aluno;
      });

    } catch (error) {
      console.error('❌ Erro ao buscar alunos por empresa:', error.message);
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
   * Cria um novo aluno (método estático)
   * @param {Object} dadosAluno - Dados do aluno a ser criado
   * @returns {Promise<Aluno>}
   */
  static async criar(dadosAluno) {
    console.log('📝 Criando novo aluno (método estático):', dadosAluno.nome);
    const aluno = new Aluno(dadosAluno);
    return await aluno.create();
  }

  /**
   * Atualiza um aluno existente (método estático)
   * @param {number} id - ID do aluno
   * @param {Object} dadosAluno - Dados atualizados do aluno
   * @returns {Promise<Aluno>}
   */
  static async atualizar(id, dadosAluno) {
    console.log('📝 Atualizando aluno (método estático):', id);

    if (!id) {
      throw new Error('ID do aluno é obrigatório para atualização');
    }

    const aluno = await Aluno.findById(id);
    if (!aluno) {
      throw new Error('Aluno não encontrado');
    }

    Object.assign(aluno, dadosAluno);
    return await aluno.update();
  }

  /**
   * Deleta um aluno (método estático)
   * @param {number} id - ID do aluno
   * @returns {Promise<boolean>}
   */
  static async deletar(id) {
    console.log('🗑️ Deletando aluno (método estático):', id);

    if (!id) {
      throw new Error('ID do aluno é obrigatório para exclusão');
    }

    const aluno = await Aluno.findById(id);
    if (!aluno) {
      throw new Error('Aluno não encontrado');
    }

    return await aluno.delete();
  }

  // ============================================================================
  // MÉTODO DE SERIALIZAÇÃO
  // ============================================================================

  /**
   * Formata os dados do aluno para resposta da API
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
        matricula: this.matricula?.trim() || null,
        nome: this.nome?.trim() || null,
        turma: this.turma?.trim() || null,
        serie: this.serie?.trim() || null,
        turno: this.turno || null,
        nome_responsavel: this.nome_responsavel?.trim() || null,
        contato_responsavel: this.contato_responsavel?.trim() || null,
        data_matricula: this.data_matricula || null,
        status: this.status || 'ativo',
        criado_em: this.criado_em || null
      };
    } catch (error) {
      console.error('❌ Erro ao converter aluno para JSON:', error.message);
      
      return {
        id: this.id || null,
        usr_id: this.usr_id || null,
        matricula: this.matricula || null,
        nome: this.nome || null,
        status: this.status || 'ativo',
        error: 'Erro ao processar dados do aluno'
      };
    }
  }

  // ============================================================================
  // MÉTODOS DE ESTATÍSTICAS
  // ============================================================================

  /**
   * Obtém estatísticas dos alunos
   * @returns {Promise<Object>}
   */
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_alunos,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as alunos_ativos,
          COUNT(CASE WHEN status = 'inativo' THEN 1 END) as alunos_inativos,
          COUNT(CASE WHEN status = 'transferido' THEN 1 END) as alunos_transferidos,
          COUNT(CASE WHEN status = 'evadido' THEN 1 END) as alunos_evadidos,
          COUNT(CASE WHEN status = 'formado' THEN 1 END) as alunos_formados,
          COUNT(CASE WHEN turno = 'manha' THEN 1 END) as alunos_manha,
          COUNT(CASE WHEN turno = 'tarde' THEN 1 END) as alunos_tarde,
          COUNT(CASE WHEN turno = 'noite' THEN 1 END) as alunos_noite,
          COUNT(CASE WHEN turno = 'integral' THEN 1 END) as alunos_integral
        FROM alunos
      `;

      const result = await executeQuery(query);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas dos alunos:', error.message);
      return {
        total_alunos: 0,
        alunos_ativos: 0,
        alunos_inativos: 0,
        alunos_transferidos: 0,
        alunos_evadidos: 0,
        alunos_formados: 0,
        alunos_manha: 0,
        alunos_tarde: 0,
        alunos_noite: 0,
        alunos_integral: 0
      };
    }
  }
}

export default Aluno;
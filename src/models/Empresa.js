import { BaseModel } from './BaseModel.js';
import logger from '../utils/logger.js';

/**
 * Modelo Empresa - ETAPA 2
 * Representa uma empresa/organização no sistema
 * Relacionamento: 1 empresa pode ter muitos usuários
 */
export class Empresa extends BaseModel {
  constructor() {
    super('empresas');
  }

  /**
   * Criar uma nova empresa
   * @param {Object} dadosEmpresa - Dados da empresa
   * @param {string} dadosEmpresa.nome - Nome da empresa
   * @param {string} dadosEmpresa.cnpj - CNPJ da empresa (opcional)
   * @param {string} dadosEmpresa.telefone - Telefone (opcional)
   * @param {string} dadosEmpresa.email_contato - Email de contato (opcional)
   * @param {string} dadosEmpresa.endereco - Endereço completo (opcional)
   * @param {string} dadosEmpresa.cidade - Cidade (opcional)
   * @param {string} dadosEmpresa.estado - Estado (opcional)
   * @param {string} dadosEmpresa.logo - URL do logo (opcional)
   * @param {number} dadosEmpresa.criado_por - ID do usuário que criou
   * @returns {Object} Empresa criada
   */
  async criar(dadosEmpresa) {
    try {
      // Validações básicas
      if (!dadosEmpresa.nome || dadosEmpresa.nome.trim().length < 2) {
        throw new Error('Nome da empresa é obrigatório (mínimo 2 caracteres)');
      }

      if (!dadosEmpresa.criado_por) {
        throw new Error('Campo criado_por é obrigatório');
      }

      // Verificar se CNPJ já existe (se fornecido)
      if (dadosEmpresa.cnpj) {
        const empresaExistente = await this.findBy('cnpj', dadosEmpresa.cnpj);
        if (empresaExistente) {
          throw new Error(`CNPJ ${dadosEmpresa.cnpj} já está cadastrado`);
        }
      }

      const dadosLimpos = {
        nome: dadosEmpresa.nome.trim(),
        cnpj: dadosEmpresa.cnpj?.replace(/[^\d]/g, '') || null, // Remove formatação
        telefone: dadosEmpresa.telefone || null,
        email_contato: dadosEmpresa.email_contato || null,
        endereco: dadosEmpresa.endereco || null,
        cidade: dadosEmpresa.cidade || null,
        estado: dadosEmpresa.estado || null,
        logo: dadosEmpresa.logo || null,
        criado_por: dadosEmpresa.criado_por
      };

      const empresa = await this.create(dadosLimpos);
      logger.info(`✅ Empresa criada: ID ${empresa.id} - ${empresa.nome}`);
      
      return empresa;
    } catch (error) {
      logger.error('❌ Erro ao criar empresa:', error.message);
      throw error;
    }
  }

  /**
   * Buscar empresa com seus usuários
   * @param {number} idEmpresa - ID da empresa
   * @returns {Object} Empresa com lista de usuários
   */
  async buscarComUsuarios(idEmpresa) {
    try {
      const empresa = await this.findById(idEmpresa);
      if (!empresa) {
        throw new Error(`Empresa com ID ${idEmpresa} não encontrada`);
      }

      // Buscar usuários da empresa
      const query = `
        SELECT 
          id, nome, email, tipo_usuario, telefone, criado_em
        FROM usuarios 
        WHERE empresa_id = $1 
        ORDER BY nome
      `;
      
      const result = await this.db.query(query, [idEmpresa]);
      
      return {
        ...empresa,
        usuarios: result.rows,
        total_usuarios: result.rows.length
      };
    } catch (error) {
      logger.error('❌ Erro ao buscar empresa com usuários:', error.message);
      throw error;
    }
  }

  /**
   * Listar empresas com estatísticas
   * @param {Object} filtros - Filtros de busca
   * @returns {Array} Lista de empresas com estatísticas
   */
  async listarComEstatisticas(filtros = {}) {
    try {
      let whereClause = '1=1';
      const params = [];
      let paramCounter = 1;

      // Filtro por nome
      if (filtros.nome) {
        whereClause += ` AND e.nome ILIKE $${paramCounter}`;
        params.push(`%${filtros.nome}%`);
        paramCounter++;
      }

      // Filtro por estado
      if (filtros.estado) {
        whereClause += ` AND e.estado = $${paramCounter}`;
        params.push(filtros.estado);
        paramCounter++;
      }

      const query = `
        SELECT 
          e.*,
          COUNT(u.id) as total_usuarios,
          COUNT(CASE WHEN u.tipo_usuario = 'admin' THEN 1 END) as total_admins,
          COUNT(CASE WHEN u.tipo_usuario = 'gestor' THEN 1 END) as total_gestores,
          COUNT(CASE WHEN u.tipo_usuario = 'diretor' THEN 1 END) as total_diretores,
          COUNT(CASE WHEN u.tipo_usuario = 'professor' THEN 1 END) as total_professores,
          COUNT(CASE WHEN u.tipo_usuario = 'aluno' THEN 1 END) as total_alunos
        FROM empresas e
        LEFT JOIN usuarios u ON e.id = u.empresa_id
        WHERE ${whereClause}
        GROUP BY e.id
        ORDER BY e.nome
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Erro ao listar empresas com estatísticas:', error.message);
      throw error;
    }
  }

  /**
   * Atualizar dados da empresa
   * @param {number} idEmpresa - ID da empresa
   * @param {Object} dadosAtualizacao - Dados para atualizar
   * @returns {Object} Empresa atualizada
   */
  async atualizar(idEmpresa, dadosAtualizacao) {
    try {
      // Verificar se empresa existe
      const empresaExistente = await this.findById(idEmpresa);
      if (!empresaExistente) {
        throw new Error(`Empresa com ID ${idEmpresa} não encontrada`);
      }

      // Verificar CNPJ duplicado (se sendo atualizado)
      if (dadosAtualizacao.cnpj && dadosAtualizacao.cnpj !== empresaExistente.cnpj) {
        const empresaComCnpj = await this.findBy('cnpj', dadosAtualizacao.cnpj);
        if (empresaComCnpj && empresaComCnpj.id !== idEmpresa) {
          throw new Error(`CNPJ ${dadosAtualizacao.cnpj} já está em uso por outra empresa`);
        }
      }

      // Limpar dados se fornecidos
      const dadosLimpos = {};
      if (dadosAtualizacao.nome) dadosLimpos.nome = dadosAtualizacao.nome.trim();
      if (dadosAtualizacao.cnpj) dadosLimpos.cnpj = dadosAtualizacao.cnpj.replace(/[^\d]/g, '');
      if (dadosAtualizacao.telefone !== undefined) dadosLimpos.telefone = dadosAtualizacao.telefone;
      if (dadosAtualizacao.email_contato !== undefined) dadosLimpos.email_contato = dadosAtualizacao.email_contato;
      if (dadosAtualizacao.endereco !== undefined) dadosLimpos.endereco = dadosAtualizacao.endereco;
      if (dadosAtualizacao.cidade !== undefined) dadosLimpos.cidade = dadosAtualizacao.cidade;
      if (dadosAtualizacao.estado !== undefined) dadosLimpos.estado = dadosAtualizacao.estado;
      if (dadosAtualizacao.logo !== undefined) dadosLimpos.logo = dadosAtualizacao.logo;

      const empresaAtualizada = await this.update(idEmpresa, dadosLimpos);
      logger.info(`✅ Empresa atualizada: ID ${idEmpresa} - ${empresaAtualizada.nome}`);
      
      return empresaAtualizada;
    } catch (error) {
      logger.error('❌ Erro ao atualizar empresa:', error.message);
      throw error;
    }
  }

  /**
   * Deletar empresa (verifica dependências)
   * @param {number} idEmpresa - ID da empresa
   * @returns {boolean} Sucesso da operação
   */
  async deletar(idEmpresa) {
    try {
      // Verificar se empresa existe
      const empresa = await this.findById(idEmpresa);
      if (!empresa) {
        throw new Error(`Empresa com ID ${idEmpresa} não encontrada`);
      }

      // Verificar se tem usuários vinculados
      const usuariosVinculados = await this.db.query(
        'SELECT COUNT(*) as total FROM usuarios WHERE empresa_id = $1',
        [idEmpresa]
      );

      if (parseInt(usuariosVinculados.rows[0].total) > 0) {
        throw new Error(`Não é possível excluir a empresa "${empresa.nome}" pois possui ${usuariosVinculados.rows[0].total} usuário(s) vinculado(s)`);
      }

      await this.delete(idEmpresa);
      logger.info(`✅ Empresa deletada: ${empresa.nome}`);
      
      return true;
    } catch (error) {
      logger.error('❌ Erro ao deletar empresa:', error.message);
      throw error;
    }
  }

  /**
   * Buscar empresas por estado
   * @param {string} estado - Código do estado (ex: SP, RJ)
   * @returns {Array} Lista de empresas do estado
   */
  async buscarPorEstado(estado) {
    try {
      const result = await this.db.query(
        'SELECT * FROM empresas WHERE estado = $1 ORDER BY nome',
        [estado.toUpperCase()]
      );
      return result.rows;
    } catch (error) {
      logger.error('❌ Erro ao buscar empresas por estado:', error.message);
      throw error;
    }
  }

  /**
   * Obter estatísticas gerais das empresas
   * @returns {Object} Estatísticas das empresas
   */
  async obterEstatisticas() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_empresas,
          COUNT(CASE WHEN cnpj IS NOT NULL THEN 1 END) as com_cnpj,
          COUNT(CASE WHEN cnpj IS NULL THEN 1 END) as sem_cnpj,
          COUNT(DISTINCT estado) as estados_unicos,
          SUM((SELECT COUNT(*) FROM usuarios WHERE empresa_id = empresas.id)) as total_usuarios
        FROM empresas
      `;

      const result = await this.db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas das empresas:', error.message);
      throw error;
    }
  }
}

export default Empresa;
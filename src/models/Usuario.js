import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

class Usuario {
  static tableName = 'usuarios';
  
  // Buscar usuário por Cognito Sub (UUID)
  static async findByCognitoSub(cognitoSub) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM usuarios WHERE cognito_sub = $1',
        [cognitoSub]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por Cognito Sub:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Buscar usuário por email
  static async findByEmail(email) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Criar novo usuário
  static async create(userData) {
    const client = await pool.connect();
    try {
      const {
        cognito_sub,
        email,
        nome,
        tipo_usuario,
        empresa_id = null,
        telefone = null,
        documento_identidade = null,
        data_nascimento = null,
        genero = null,
        endereco = null,
        cidade = null,
        estado = null,
        foto_perfil = null
      } = userData;
      
      const result = await client.query(`
        INSERT INTO usuarios (
          cognito_sub, email, nome, tipo_usuario, empresa_id,
          telefone, documento_identidade, data_nascimento, genero,
          endereco, cidade, estado, foto_perfil
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        cognito_sub, email, nome, tipo_usuario, empresa_id,
        telefone, documento_identidade, data_nascimento, genero,
        endereco, cidade, estado, foto_perfil
      ]);
      
      logger.info(`Usuário criado: ${email} (${tipo_usuario})`);
      return result.rows[0];
      
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Atualizar usuário
  static async update(id, updateData) {
    const client = await pool.connect();
    try {
      const fields = [];
      const values = [];
      let paramIndex = 2;
      
      // Construir query dinamicamente
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });
      
      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }
      
      const query = `
        UPDATE usuarios 
        SET ${fields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      logger.info(`Usuário atualizado: ID ${id}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Buscar usuários por tipo
  static async findByTipo(tipoUsuario, limit = 50, offset = 0) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM usuarios 
        WHERE tipo_usuario = $1
        ORDER BY criado_em DESC
        LIMIT $2 OFFSET $3
      `, [tipoUsuario, limit, offset]);
      
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar usuários por tipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Buscar usuários por empresa
  static async findByEmpresa(empresaId, limit = 50, offset = 0) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM usuarios 
        WHERE empresa_id = $1
        ORDER BY tipo_usuario, nome
        LIMIT $2 OFFSET $3
      `, [empresaId, limit, offset]);
      
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar usuários por empresa:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Contar usuários por tipo
  static async countByTipo() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          tipo_usuario,
          COUNT(*) as quantidade
        FROM usuarios 
        GROUP BY tipo_usuario
        ORDER BY tipo_usuario
      `);
      
      return result.rows.reduce((acc, row) => {
        acc[row.tipo_usuario] = parseInt(row.quantidade);
        return acc;
      }, {});
      
    } catch (error) {
      logger.error('Erro ao contar usuários por tipo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Sincronizar usuário do Cognito
  static async syncFromCognito(cognitoUser) {
    const existingUser = await this.findByCognitoSub(cognitoUser.sub);
    
    if (existingUser) {
      // Atualizar usuário existente se necessário
      const updateData = {
        email: cognitoUser.email,
        nome: cognitoUser.name || cognitoUser.email.split('@')[0]
      };
      
      return await this.update(existingUser.id, updateData);
    } else {
      // Criar novo usuário
      const userData = {
        cognito_sub: cognitoUser.sub,
        email: cognitoUser.email,
        nome: cognitoUser.name || cognitoUser.email.split('@')[0],
        tipo_usuario: this.mapCognitoGroupToTipo(cognitoUser.groups || [])
      };
      
      return await this.create(userData);
    }
  }
  
  // Mapear grupos do Cognito para tipo de usuário
  static mapCognitoGroupToTipo(groups) {
    const groupMapping = {
      'Admin': 'admin',
      'AdminMaster': 'admin',
      'Gestores': 'gestor',
      'Diretores': 'diretor',
      'Professores': 'professor',
      'Alunos': 'aluno'
    };
    
    // Retornar o primeiro grupo encontrado ou 'aluno' como padrão
    for (const group of groups) {
      if (groupMapping[group]) {
        return groupMapping[group];
      }
    }
    
    return 'aluno'; // padrão
  }
  
  // Deletar usuário (soft delete seria melhor, mas por simplicidade)
  static async delete(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM usuarios WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      logger.info(`Usuário deletado: ID ${id}`);
      return result.rows[0];
      
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Usuario;
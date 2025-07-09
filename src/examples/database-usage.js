import { executeQuery, executeTransaction, checkConnection, getPoolStats } from '../config/database.js';

// Exemplo 1: Executar query simples
export async function getUsers() {
  try {
    const result = await executeQuery('SELECT * FROM usuarios ORDER BY id LIMIT 10');
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error.message);
    throw error;
  }
}

// Exemplo 2: Query com parâmetros
export async function getUsersByType(userType) {
  try {
    const result = await executeQuery(
      'SELECT id, nome, email, tipo_usuario FROM usuarios WHERE tipo_usuario = $1',
      [userType]
    );
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar usuários por tipo:', error.message);
    throw error;
  }
}

// Exemplo 3: Inserir novo usuário
export async function createUser(userData) {
  const { nome, email, tipo_usuario, empresa_id } = userData;
  
  try {
    const result = await executeQuery(
      `INSERT INTO usuarios (nome, email, tipo_usuario, empresa_id, criado_em) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, nome, email, tipo_usuario`,
      [nome, email, tipo_usuario, empresa_id]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar usuário:', error.message);
    throw error;
  }
}

// Exemplo 4: Atualizar usuário
export async function updateUser(userId, updateData) {
  const { nome, email, tipo_usuario } = updateData;
  
  try {
    const result = await executeQuery(
      `UPDATE usuarios 
       SET nome = $1, email = $2, tipo_usuario = $3, atualizado_em = NOW() 
       WHERE id = $4 
       RETURNING id, nome, email, tipo_usuario`,
      [nome, email, tipo_usuario, userId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.message);
    throw error;
  }
}

// Exemplo 5: Usar transação para operações complexas
export async function createUserWithProfile(userData, profileData) {
  const queries = [
    {
      text: `INSERT INTO usuarios (nome, email, tipo_usuario, empresa_id, criado_em) 
             VALUES ($1, $2, $3, $4, NOW()) 
             RETURNING id`,
      params: [userData.nome, userData.email, userData.tipo_usuario, userData.empresa_id]
    },
    {
      text: `INSERT INTO perfis (user_id, telefone, endereco, criado_em) 
             VALUES ($1, $2, $3, NOW())`,
      params: [null, profileData.telefone, profileData.endereco] // user_id será preenchido dinamicamente
    }
  ];

  try {
    const results = await executeTransaction(queries);
    return {
      user: results[0].rows[0],
      profile: results[1].rows[0]
    };
  } catch (error) {
    console.error('Erro ao criar usuário com perfil:', error.message);
    throw error;
  }
}

// Exemplo 6: Consulta complexa com JOIN
export async function getCompanyHierarchy() {
  try {
    const result = await executeQuery(`
      SELECT 
        emp.nome AS empresa,
        COUNT(DISTINCT c.id) AS contratos,
        COUNT(DISTINCT e.id) AS escolas,
        COUNT(DISTINCT u.id) AS usuarios_total,
        COUNT(DISTINCT CASE WHEN u.tipo_usuario = 'gestor' THEN u.id END) AS gestores,
        COUNT(DISTINCT CASE WHEN u.tipo_usuario = 'diretor' THEN u.id END) AS diretores,
        COUNT(DISTINCT CASE WHEN u.tipo_usuario = 'professor' THEN u.id END) AS professores,
        COUNT(DISTINCT CASE WHEN u.tipo_usuario = 'aluno' THEN u.id END) AS alunos
      FROM empresas emp
      LEFT JOIN contratos c ON emp.id = c.empresa_id
      LEFT JOIN escolas e ON c.id = e.contrato_id
      LEFT JOIN usuarios u ON emp.id = u.empresa_id
      GROUP BY emp.id, emp.nome
      ORDER BY contratos DESC, escolas DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar hierarquia da empresa:', error.message);
    throw error;
  }
}

// Exemplo 7: Função para verificar status do banco
export async function getDatabaseStatus() {
  try {
    const connectionStatus = await checkConnection();
    const poolStats = getPoolStats();
    
    return {
      connection: connectionStatus,
      pool: poolStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao verificar status do banco:', error.message);
    throw error;
  }
}

// Exemplo 8: Função para buscar dados paginados
export async function getPaginatedUsers(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  
  try {
    const [dataResult, countResult] = await Promise.all([
      executeQuery(
        `SELECT id, nome, email, tipo_usuario, empresa_id, criado_em 
         FROM usuarios 
         ORDER BY criado_em DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      executeQuery('SELECT COUNT(*) as total FROM usuarios')
    ]);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    };
  } catch (error) {
    console.error('Erro ao buscar usuários paginados:', error.message);
    throw error;
  }
}

// Exemplo 9: Função para buscar com filtros
export async function searchUsers(filters = {}) {
  let query = 'SELECT * FROM usuarios WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (filters.nome) {
    query += ` AND nome ILIKE $${paramIndex}`;
    params.push(`%${filters.nome}%`);
    paramIndex++;
  }
  
  if (filters.email) {
    query += ` AND email ILIKE $${paramIndex}`;
    params.push(`%${filters.email}%`);
    paramIndex++;
  }
  
  if (filters.tipo_usuario) {
    query += ` AND tipo_usuario = $${paramIndex}`;
    params.push(filters.tipo_usuario);
    paramIndex++;
  }
  
  if (filters.empresa_id) {
    query += ` AND empresa_id = $${paramIndex}`;
    params.push(filters.empresa_id);
    paramIndex++;
  }
  
  query += ' ORDER BY criado_em DESC';
  
  try {
    const result = await executeQuery(query, params);
    return result.rows;
  } catch (error) {
    console.error('Erro ao buscar usuários com filtros:', error.message);
    throw error;
  }
}

// Exemplo 10: Função para executar backup/migração
export async function executeBackup() {
  try {
    const tables = ['usuarios', 'empresas', 'contratos', 'escolas', 'gestores', 'diretores', 'professores', 'alunos'];
    const backupData = {};
    
    for (const table of tables) {
      const result = await executeQuery(`SELECT * FROM ${table} ORDER BY id`);
      backupData[table] = result.rows;
    }
    
    return {
      backup: backupData,
      timestamp: new Date().toISOString(),
      totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0)
    };
  } catch (error) {
    console.error('Erro ao executar backup:', error.message);
    throw error;
  }
}
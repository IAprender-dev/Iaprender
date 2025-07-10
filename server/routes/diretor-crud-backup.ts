import express from 'express';
import { Request, Response } from 'express';
import { pool } from '../db';

const router = express.Router();

// Middleware de autenticação específico para diretores
const authenticateDirector = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    // Verificar se o usuário é diretor
    // Por enquanto, usar token simples para desenvolvimento
    if (token === 'test-token' || token.startsWith('eyJ')) {
      req.user = { 
        id: 1, 
        tipo_usuario: 'diretor',
        escola_id: 1,
        empresa_id: 1 
      };
      next();
    } else {
      res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// GET /api/diretor/dashboard/stats - Estatísticas do dashboard
router.get('/dashboard/stats', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const diretorEscolaId = req.user?.escola_id;
    const diretorEmpresaId = req.user?.empresa_id;

    if (!diretorEscolaId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Diretor não está vinculado a uma escola' 
      });
    }

    // Buscar estatísticas da escola do diretor
    const client = await pool.connect();
    try {
      const statsQueries = await Promise.all([
        // Total de alunos na escola
        client.query(
          'SELECT COUNT(*) as total FROM alunos WHERE escola_id = $1 AND status = $2',
          [diretorEscolaId, 'ativo']
        ),
        // Total de professores na escola
        client.query(
          'SELECT COUNT(*) as total FROM professores WHERE escola_id = $1 AND status = $2',
          [diretorEscolaId, 'ativo']
        ),
        // Contar turmas distintas na escola
        client.query(
          'SELECT COUNT(DISTINCT turma) as total FROM alunos WHERE escola_id = $1 AND status = $2',
          [diretorEscolaId, 'ativo']
        ),
        // Funcionários (diretores + professores)
        client.query(`
          SELECT COUNT(*) as total FROM (
            SELECT usr_id FROM professores WHERE escola_id = $1 AND status = 'ativo'
            UNION
            SELECT id FROM usuarios WHERE tipo_usuario = 'diretor' AND empresa_id = $2
          ) as funcionarios
        `, [diretorEscolaId, diretorEmpresaId])
      ]);
    } finally {
      client.release();
    }

    const stats = {
      alunos: parseInt(statsQueries[0].rows[0]?.total || '0'),
      professores: parseInt(statsQueries[1].rows[0]?.total || '0'),
      turmas: parseInt(statsQueries[2].rows[0]?.total || '0'),
      funcionarios: parseInt(statsQueries[3].rows[0]?.total || '0')
    };

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do diretor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/diretor/escola/:id - Informações da escola
router.get('/escola/:id', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const escolaId = parseInt(req.params.id);
    const diretorEscolaId = req.user?.escola_id;

    // Verificar se o diretor pode acessar esta escola
    if (escolaId !== diretorEscolaId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a esta escola'
      });
    }

    const client = await pool.connect();
    let escolaQuery;
    try {
      escolaQuery = await client.query(`
        SELECT 
          e.*,
          emp.nome as empresa_nome,
          c.nome as contrato_nome
        FROM escolas e
        LEFT JOIN empresas emp ON e.empresa_id = emp.id
        LEFT JOIN contratos c ON e.contrato_id = c.id
        WHERE e.id = $1
      `, [escolaId]);
    } finally {
      client.release();
    }

    if (escolaQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escola não encontrada'
      });
    }

    res.json({
      success: true,
      escola: escolaQuery.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar informações da escola:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/diretor/alunos - Listar alunos da escola do diretor
router.get('/alunos', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const diretorEscolaId = req.user?.escola_id;
    const { search, status = 'all', page = 1, limit = 20 } = req.query;

    if (!diretorEscolaId) {
      return res.status(400).json({
        success: false,
        message: 'Diretor não está vinculado a uma escola'
      });
    }

    let whereClause = 'WHERE escola_id = $1';
    const queryParams: any[] = [diretorEscolaId];
    let paramIndex = 2;

    if (status !== 'all') {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (nome ILIKE $${paramIndex} OR matricula ILIKE $${paramIndex} OR nome_responsavel ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Buscar alunos
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const client = await pool.connect();
    let alunosQuery, totalQuery, statsQuery;
    try {
      alunosQuery = await client.query(`
        SELECT 
          a.*,
          e.nome as escola_nome
        FROM alunos a
        LEFT JOIN escolas e ON a.escola_id = e.id
        ${whereClause}
        ORDER BY a.nome
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, parseInt(limit as string), offset]);

      // Contar total para paginação
      totalQuery = await client.query(`
        SELECT COUNT(*) as total FROM alunos a ${whereClause}
      `, queryParams);

      // Estatísticas dos alunos
      statsQuery = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
          COUNT(DISTINCT turma) as turmas,
          COUNT(CASE WHEN EXTRACT(MONTH FROM data_matricula) = EXTRACT(MONTH FROM CURRENT_DATE) 
                     AND EXTRACT(YEAR FROM data_matricula) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as novas_matriculas
        FROM alunos 
        WHERE escola_id = $1
      `, [diretorEscolaId]);
    } finally {
      client.release();
    }

    res.json({
      success: true,
      alunos: alunosQuery.rows,
      stats: statsQuery.rows[0],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(totalQuery.rows[0]?.total || '0'),
        totalPages: Math.ceil(parseInt(totalQuery.rows[0]?.total || '0') / parseInt(limit as string))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/diretor/alunos - Criar novo aluno
router.post('/alunos', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const diretorEscolaId = req.user?.escola_id;
    const diretorEmpresaId = req.user?.empresa_id;

    if (!diretorEscolaId || !diretorEmpresaId) {
      return res.status(400).json({
        success: false,
        message: 'Diretor não está vinculado a uma escola/empresa'
      });
    }

    const {
      nome,
      matricula,
      serie,
      turma,
      turno,
      nome_responsavel,
      contato_responsavel,
      data_matricula,
      status = 'ativo'
    } = req.body;

    // Validações básicas
    if (!nome || !matricula || !serie || !turma) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: nome, matricula, serie, turma'
      });
    }

    // Verificar se matrícula já existe na escola
    const client = await pool.connect();
    let matriculaExistente, novoAlunoQuery;
    try {
      matriculaExistente = await client.query(
        'SELECT id FROM alunos WHERE matricula = $1 AND escola_id = $2',
        [matricula, diretorEscolaId]
      );

      if (matriculaExistente.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Matrícula já existe nesta escola'
        });
      }

      // Inserir novo aluno
      novoAlunoQuery = await client.query(`
        INSERT INTO alunos (
          escola_id, empresa_id, nome, matricula, serie, turma, turno,
          nome_responsavel, contato_responsavel, data_matricula, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        diretorEscolaId, diretorEmpresaId, nome, matricula, serie, turma, turno,
        nome_responsavel, contato_responsavel, data_matricula || new Date().toISOString().split('T')[0], status
      ]);
    } finally {
      client.release();
    }

    res.status(201).json({
      success: true,
      message: 'Aluno criado com sucesso',
      aluno: novoAlunoQuery.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/diretor/professores - Listar professores da escola do diretor
router.get('/professores', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const diretorEscolaId = req.user?.escola_id;
    const { search, status = 'all', page = 1, limit = 20 } = req.query;

    if (!diretorEscolaId) {
      return res.status(400).json({
        success: false,
        message: 'Diretor não está vinculado a uma escola'
      });
    }

    let whereClause = 'WHERE p.escola_id = $1';
    const queryParams: any[] = [diretorEscolaId];
    let paramIndex = 2;

    if (status !== 'all') {
      whereClause += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (p.nome ILIKE $${paramIndex} OR p.disciplinas ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Buscar professores
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const client = await pool.connect();
    let professoresQuery, totalQuery, statsQuery;
    try {
      professoresQuery = await client.query(`
        SELECT 
          p.*,
          u.email,
          u.telefone as telefone_usuario,
          e.nome as escola_nome
        FROM professores p
        LEFT JOIN usuarios u ON p.usr_id = u.id
        LEFT JOIN escolas e ON p.escola_id = e.id
        ${whereClause}
        ORDER BY p.nome
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, parseInt(limit as string), offset]);

      // Contar total para paginação
      totalQuery = await client.query(`
        SELECT COUNT(*) as total FROM professores p 
        LEFT JOIN usuarios u ON p.usr_id = u.id
        ${whereClause}
      `, queryParams);

      // Estatísticas dos professores
      statsQuery = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'ativo' THEN 1 END) as ativos,
          COUNT(DISTINCT disciplinas) as disciplinas,
          COUNT(CASE WHEN EXTRACT(MONTH FROM data_admissao) = EXTRACT(MONTH FROM CURRENT_DATE) 
                     AND EXTRACT(YEAR FROM data_admissao) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as novas_contratacoes
        FROM professores 
        WHERE escola_id = $1
      `, [diretorEscolaId]);
    } finally {
      client.release();
    }

    res.json({
      success: true,
      professores: professoresQuery.rows,
      stats: statsQuery.rows[0],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: parseInt(totalQuery.rows[0]?.total || '0'),
        totalPages: Math.ceil(parseInt(totalQuery.rows[0]?.total || '0') / parseInt(limit as string))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/diretor/professores - Criar novo professor
router.post('/professores', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const diretorEscolaId = req.user?.escola_id;
    const diretorEmpresaId = req.user?.empresa_id;

    if (!diretorEscolaId || !diretorEmpresaId) {
      return res.status(400).json({
        success: false,
        message: 'Diretor não está vinculado a uma escola/empresa'
      });
    }

    const {
      nome,
      email,
      disciplinas,
      formacao,
      data_admissao,
      status = 'ativo'
    } = req.body;

    // Validações básicas
    if (!nome || !email || !disciplinas) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: nome, email, disciplinas'
      });
    }

    // Verificar se email já existe
    const emailExistente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    // Criar usuário primeiro
    const novoUsuarioQuery = await pool.query(`
      INSERT INTO usuarios (
        cognito_sub, email, nome, tipo_usuario, empresa_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      `temp-${Date.now()}`, // cognito_sub temporário
      email,
      nome,
      'professor',
      diretorEmpresaId,
      status
    ]);

    const novoUsuario = novoUsuarioQuery.rows[0];

    // Criar professor
    const novoProfessorQuery = await pool.query(`
      INSERT INTO professores (
        usr_id, escola_id, empresa_id, nome, disciplinas, formacao, data_admissao, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      novoUsuario.id,
      diretorEscolaId,
      diretorEmpresaId,
      nome,
      disciplinas,
      formacao,
      data_admissao || new Date().toISOString().split('T')[0],
      status
    ]);

    res.status(201).json({
      success: true,
      message: 'Professor criado com sucesso',
      professor: novoProfessorQuery.rows[0],
      usuario: novoUsuario,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar professor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/diretor/alunos/:id - Atualizar aluno
router.put('/alunos/:id', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const alunoId = parseInt(req.params.id);
    const diretorEscolaId = req.user?.escola_id;

    // Verificar se o aluno pertence à escola do diretor
    const alunoExistente = await pool.query(
      'SELECT * FROM alunos WHERE id = $1 AND escola_id = $2',
      [alunoId, diretorEscolaId]
    );

    if (alunoExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado ou não pertence a esta escola'
      });
    }

    const {
      nome,
      serie,
      turma,
      turno,
      nome_responsavel,
      contato_responsavel,
      status
    } = req.body;

    // Atualizar aluno
    const alunoAtualizadoQuery = await pool.query(`
      UPDATE alunos SET
        nome = COALESCE($1, nome),
        serie = COALESCE($2, serie),
        turma = COALESCE($3, turma),
        turno = COALESCE($4, turno),
        nome_responsavel = COALESCE($5, nome_responsavel),
        contato_responsavel = COALESCE($6, contato_responsavel),
        status = COALESCE($7, status)
      WHERE id = $8 AND escola_id = $9
      RETURNING *
    `, [nome, serie, turma, turno, nome_responsavel, contato_responsavel, status, alunoId, diretorEscolaId]);

    res.json({
      success: true,
      message: 'Aluno atualizado com sucesso',
      aluno: alunoAtualizadoQuery.rows[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/diretor/alunos/:id - Excluir aluno
router.delete('/alunos/:id', authenticateDirector, async (req: Request, res: Response) => {
  try {
    const alunoId = parseInt(req.params.id);
    const diretorEscolaId = req.user?.escola_id;

    // Verificar se o aluno pertence à escola do diretor
    const alunoExistente = await pool.query(
      'SELECT * FROM alunos WHERE id = $1 AND escola_id = $2',
      [alunoId, diretorEscolaId]
    );

    if (alunoExistente.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aluno não encontrado ou não pertence a esta escola'
      });
    }

    // Em vez de deletar, inativar o aluno
    await pool.query(
      'UPDATE alunos SET status = $1 WHERE id = $2',
      ['inativo', alunoId]
    );

    res.json({
      success: true,
      message: 'Aluno inativado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao inativar aluno:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
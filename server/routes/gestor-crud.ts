import express from 'express';
import { dbClient } from '../db';

const router = express.Router();

// Middleware de autenticação - usando o mesmo do sistema principal
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_iaprender_2025');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar se é gestor ou admin
const requireGestorOrAdmin = (req: any, res: any, next: any) => {
  if (!req.user || !['gestor', 'admin'].includes(req.user.tipo_usuario)) {
    return res.status(403).json({ message: 'Acesso negado. Apenas gestores e admins.' });
  }
  next();
};

// ===================== ENDPOINTS DE DASHBOARD =====================

// GET /api/gestor/dashboard/stats - Estatísticas do dashboard gestor
router.get('/dashboard/stats', authenticate, requireGestorOrAdmin, async (req: any, res: any) => {
  try {
    console.log('🔍 Buscando estatísticas do dashboard gestor para usuário:', req.user.email);
    
    const empresaId = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
    
    // Query para estatísticas básicas
    let statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM escolas WHERE ($1::integer IS NULL OR empresa_id = $1)) as escolas,
        (SELECT COUNT(*) FROM usuarios WHERE ($1::integer IS NULL OR empresa_id = $1) AND tipo_usuario = 'professor') as professores,
        (SELECT COUNT(*) FROM usuarios WHERE ($1::integer IS NULL OR empresa_id = $1) AND tipo_usuario = 'diretor') as diretores,
        (SELECT COUNT(*) FROM alunos WHERE ($1::integer IS NULL OR empresa_id = $1)) as alunos
    `;
    
    const result = await dbClient.query(statsQuery, [empresaId]);
    const stats = result.rows[0];
    
    // Converter strings para números
    const processedStats = {
      escolas: parseInt(stats.escolas) || 0,
      usuarios: parseInt(stats.professores) + parseInt(stats.diretores) || 0,
      professores: parseInt(stats.professores) || 0,
      alunos: parseInt(stats.alunos) || 0
    };
    
    console.log('✅ Estatísticas obtidas:', processedStats);
    
    res.json({
      success: true,
      stats: processedStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ===================== ENDPOINTS DE ESCOLAS =====================

// GET /api/gestor/escolas - Listar escolas do gestor
router.get('/escolas', authenticate, requireGestorOrAdmin, async (req: any, res: any) => {
  try {
    console.log('🔍 Listando escolas para gestor:', req.user.email);
    
    const { page = 1, search = '', status = 'all' } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    const empresaId = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    // Filtro por empresa (se não for admin)
    if (empresaId) {
      whereConditions.push(`empresa_id = $${paramIndex}`);
      queryParams.push(empresaId);
      paramIndex++;
    }
    
    // Filtro de busca
    if (search) {
      whereConditions.push(`(nome ILIKE $${paramIndex} OR codigo_inep ILIKE $${paramIndex} OR endereco ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filtro de status
    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query principal
    const escolasQuery = `
      SELECT 
        e.*,
        u.nome as diretor_nome,
        emp.nome as empresa_nome
      FROM escolas e
      LEFT JOIN usuarios u ON e.diretor_id = u.id
      LEFT JOIN empresas emp ON e.empresa_id = emp.id
      ${whereClause}
      ORDER BY e.nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // Query de contagem
    const countQuery = `
      SELECT COUNT(*) as total
      FROM escolas e
      ${whereClause}
    `;
    
    const countParams = queryParams.slice(0, -2); // Remove limit e offset
    
    const [escolasResult, countResult] = await Promise.all([
      dbClient.query(escolasQuery, queryParams),
      dbClient.query(countQuery, countParams)
    ]);
    
    const escolas = escolasResult.rows;
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Encontradas ${escolas.length} escolas de ${total} total`);
    
    res.json({
      success: true,
      escolas,
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar escolas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/gestor/escolas/stats - Estatísticas de escolas
router.get('/escolas/stats', authenticate, requireGestorOrAdmin, async (req: any, res: any) => {
  try {
    console.log('🔍 Buscando estatísticas de escolas para gestor:', req.user.email);
    
    const empresaId = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ativa') as ativas,
        COUNT(*) FILTER (WHERE diretor_id IS NOT NULL) as com_diretores,
        COALESCE(SUM(capacidade), 0) as capacidade_total
      FROM escolas 
      WHERE ($1::integer IS NULL OR empresa_id = $1)
    `;
    
    const result = await dbClient.query(statsQuery, [empresaId]);
    const stats = result.rows[0];
    
    // Converter para números
    const processedStats = {
      total: parseInt(stats.total) || 0,
      ativas: parseInt(stats.ativas) || 0,
      comDiretores: parseInt(stats.com_diretores) || 0,
      capacidadeTotal: parseInt(stats.capacidade_total) || 0
    };
    
    console.log('✅ Estatísticas de escolas:', processedStats);
    
    res.json({
      success: true,
      stats: processedStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de escolas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ===================== ENDPOINTS DE USUÁRIOS MUNICIPAIS =====================

// GET /api/gestor/usuarios - Listar usuários municipais
router.get('/usuarios', authenticate, requireGestorOrAdmin, async (req: any, res: any) => {
  try {
    console.log('🔍 Listando usuários municipais para gestor:', req.user.email);
    
    const { page = 1, search = '', status = 'all', role = 'all' } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    const empresaId = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    // Filtro por empresa (se não for admin)
    if (empresaId) {
      whereConditions.push(`u.empresa_id = $${paramIndex}`);
      queryParams.push(empresaId);
      paramIndex++;
    }
    
    // Filtro por tipos municipais
    whereConditions.push(`u.tipo_usuario IN ('gestor', 'diretor', 'professor', 'funcionario')`);
    
    // Filtro de busca
    if (search) {
      whereConditions.push(`(u.nome ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Filtro de status
    if (status !== 'all') {
      whereConditions.push(`u.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    // Filtro de função
    if (role !== 'all') {
      whereConditions.push(`u.tipo_usuario = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Query principal
    const usuariosQuery = `
      SELECT 
        u.*,
        e.nome as escola_nome,
        emp.nome as empresa_nome,
        p.disciplinas,
        p.formacao,
        d.cargo as cargo_diretor,
        g.cargo as cargo_gestor
      FROM usuarios u
      LEFT JOIN empresas emp ON u.empresa_id = emp.id
      LEFT JOIN escolas e ON u.escola_id = e.id
      LEFT JOIN professores p ON u.id = p.usr_id
      LEFT JOIN diretores d ON u.id = d.usr_id
      LEFT JOIN gestores g ON u.id = g.usr_id
      WHERE ${whereClause}
      ORDER BY u.nome
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    
    // Query de contagem
    const countQuery = `
      SELECT COUNT(*) as total
      FROM usuarios u
      WHERE ${whereClause}
    `;
    
    const countParams = queryParams.slice(0, -2); // Remove limit e offset
    
    const [usuariosResult, countResult] = await Promise.all([
      dbClient.query(usuariosQuery, queryParams),
      dbClient.query(countQuery, countParams)
    ]);
    
    const usuarios = usuariosResult.rows.map(user => ({
      id: user.id,
      firstName: user.nome?.split(' ')[0] || '',
      lastName: user.nome?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      role: user.tipo_usuario,
      status: user.status === 'ativo' ? 'active' : 'inactive',
      phone: user.telefone,
      school: user.escola_nome || user.empresa_nome,
      subject: user.disciplinas,
      qualification: user.formacao,
      position: user.cargo_diretor || user.cargo_gestor
    }));
    
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`✅ Encontrados ${usuarios.length} usuários de ${total} total`);
    
    res.json({
      success: true,
      usuarios,
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/gestor/usuarios/stats - Estatísticas de usuários municipais
router.get('/usuarios/stats', authenticate, requireGestorOrAdmin, async (req: any, res: any) => {
  try {
    console.log('🔍 Buscando estatísticas de usuários para gestor:', req.user.email);
    
    const empresaId = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
    
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE tipo_usuario IN ('gestor', 'diretor', 'professor', 'funcionario')) as total,
        COUNT(*) FILTER (WHERE tipo_usuario = 'professor') as professores,
        COUNT(*) FILTER (WHERE tipo_usuario = 'diretor') as diretores,
        COUNT(*) FILTER (WHERE tipo_usuario = 'funcionario') as funcionarios
      FROM usuarios 
      WHERE ($1::integer IS NULL OR empresa_id = $1)
    `;
    
    const result = await dbClient.query(statsQuery, [empresaId]);
    const stats = result.rows[0];
    
    // Converter para números
    const processedStats = {
      total: parseInt(stats.total) || 0,
      professores: parseInt(stats.professores) || 0,
      diretores: parseInt(stats.diretores) || 0,
      funcionarios: parseInt(stats.funcionarios) || 0
    };
    
    console.log('✅ Estatísticas de usuários:', processedStats);
    
    res.json({
      success: true,
      stats: processedStats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;
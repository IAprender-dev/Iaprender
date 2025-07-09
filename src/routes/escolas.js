/**
 * ROTAS DE ESCOLAS - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este arquivo define todas as rotas relacionadas ao gerenciamento de escolas
 * no sistema educacional, implementando controle de acesso hierárquico
 * e validações de segurança enterprise-level.
 * 
 * HIERARQUIA DE ACESSO:
 * - Admin: Controle total de todas as escolas
 * - Gestor: Gerencia escolas da própria empresa
 * - Diretor: Acesso apenas à própria escola
 * - Professor: Visualização da escola vinculada
 * - Aluno: Visualização da escola vinculada
 * 
 * ROTAS IMPLEMENTADAS:
 * - GET /api/escolas              - Listar escolas com filtros
 * - GET /api/escolas/:id          - Buscar escola por ID
 * - GET /api/escolas/:id/detalhes - Obter escola com contadores
 * - POST /api/escolas             - Criar nova escola
 * - PUT /api/escolas/:id          - Atualizar escola
 * - DELETE /api/escolas/:id       - Remover escola
 * - GET /api/escolas/stats        - Estatísticas de escolas
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { EscolaController } from '../controllers/escolaController.js';
import { 
  autenticar,
  apenasAdmin,
  adminOuGestor,
  adminGestorOuDiretor,
  qualquerTipo
} from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// RATE LIMITING CONFIGURAÇÃO
// ============================================================================

// Rate limiting para operações de consulta (mais permissivo)
const consultaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto
  message: {
    success: false,
    message: 'Muitas consultas. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_CONSULTA'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para operações de listagem
const listagemLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: {
    success: false,
    message: 'Muitas requisições de listagem. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_LISTAGEM'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para operações de criação
const criacaoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: {
    success: false,
    message: 'Muitas tentativas de criação. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_CRIACAO'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para operações de edição
const edicaoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 requests por minuto
  message: {
    success: false,
    message: 'Muitas tentativas de edição. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EDICAO'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para operações de exclusão (mais restritivo)
const exclusaoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // 5 requests por minuto
  message: {
    success: false,
    message: 'Muitas tentativas de exclusão. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_EXCLUSAO'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para estatísticas
const statsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto
  message: {
    success: false,
    message: 'Muitas consultas de estatísticas. Tente novamente em 1 minuto.',
    code: 'RATE_LIMIT_STATS'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================================
// ROTAS DE CONSULTA
// ============================================================================

/**
 * GET /api/escolas
 * Listar escolas com filtros e paginação
 * 
 * Permissões: Qualquer usuário autenticado (dados filtrados por hierarquia)
 * Rate Limit: 30 requests/min
 * Filtros: empresa_id, contrato_id, status, tipo_escola, search, estado, cidade
 * Paginação: page, limit (máx: 100), orderBy, orderDirection
 */
router.get('/', 
  listagemLimiter,
  autenticar,
  qualquerTipo,
  EscolaController.listarEscolas
);

/**
 * GET /api/escolas/:id
 * Buscar escola específica por ID (dados básicos)
 * 
 * Permissões: Usuários com acesso à escola (verificação automática por hierarquia)
 * Rate Limit: 60 requests/min
 * Retorna: Dados básicos da escola + empresa + contrato (sem contadores)
 */
router.get('/:id',
  consultaLimiter,
  autenticar,
  qualquerTipo,
  EscolaController.buscarPorId
);

/**
 * GET /api/escolas/:id/detalhes
 * Obter escola com dados completos incluindo contadores
 * 
 * Permissões: Usuários com acesso à escola (verificação automática por hierarquia)
 * Rate Limit: 60 requests/min
 * Retorna: Dados completos + empresa + contrato + contadores de alunos/professores
 */
router.get('/:id/detalhes',
  consultaLimiter,
  autenticar,
  qualquerTipo,
  EscolaController.obterEscola
);

/**
 * GET /api/escolas/stats
 * Obter estatísticas de escolas
 * 
 * Permissões: Admin, Gestor, Diretor (dados filtrados por empresa/escola)
 * Rate Limit: 30 requests/min
 * Retorna: Estatísticas agregadas baseadas no nível de acesso do usuário
 */
router.get('/stats',
  statsLimiter,
  autenticar,
  adminGestorOuDiretor,
  EscolaController.obterEstatisticas
);

// ============================================================================
// ROTAS DE GESTÃO (CRIAÇÃO, EDIÇÃO, EXCLUSÃO)
// ============================================================================

/**
 * POST /api/escolas
 * Criar nova escola no sistema
 * 
 * Permissões: Apenas Admin e Gestor
 * Rate Limit: 10 requests/min
 * Campos obrigatórios: nome, codigo_inep, tipo_escola, contrato_id, empresa_id
 * Validações: contrato pertence à empresa, código INEP único, gestor limitado à própria empresa
 */
router.post('/',
  criacaoLimiter,
  autenticar,
  adminOuGestor,
  EscolaController.criarEscola
);

/**
 * PUT /api/escolas/:id
 * Atualizar dados de escola específica
 * 
 * Permissões: Admin (qualquer escola), Gestor (própria empresa), Diretor (própria escola)
 * Rate Limit: 20 requests/min
 * Campos permitidos: varia por tipo de usuário
 * Proteções: empresa_id não pode ser alterado por gestores, validações hierárquicas
 */
router.put('/:id',
  edicaoLimiter,
  autenticar,
  adminGestorOuDiretor,
  EscolaController.atualizarEscola
);

/**
 * DELETE /api/escolas/:id
 * Remover escola do sistema
 * 
 * Permissões: Apenas Admin
 * Rate Limit: 5 requests/min
 * Validações: verificar dependências (diretores, professores, alunos)
 * Segurança: operação irreversível, logs detalhados de auditoria
 */
router.delete('/:id',
  exclusaoLimiter,
  autenticar,
  apenasAdmin,
  EscolaController.removerEscola
);

// ============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS ESPECÍFICO PARA ESCOLAS
// ============================================================================

router.use((error, req, res, next) => {
  console.error('❌ Erro nas rotas de escolas:', {
    erro: error.message,
    stack: error.stack,
    rota: req.originalUrl,
    metodo: req.method,
    usuario: req.user ? `${req.user.id} (${req.user.tipo_usuario})` : 'não autenticado',
    timestamp: new Date().toISOString()
  });

  // Erros específicos de validação de escola
  if (error.message.includes('Escola não encontrada')) {
    return res.status(404).json({
      success: false,
      message: 'Escola não encontrada',
      code: 'ESCOLA_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('Acesso negado')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado a esta escola',
      code: 'ESCOLA_ACCESS_DENIED',
      timestamp: new Date().toISOString()
    });
  }

  if (error.message.includes('UNIQUE constraint')) {
    return res.status(409).json({
      success: false,
      message: 'Código INEP já existe no sistema',
      code: 'ESCOLA_DUPLICATE_INEP',
      timestamp: new Date().toISOString()
    });
  }

  // Erro genérico
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    timestamp: new Date().toISOString()
  });
});

export default router;
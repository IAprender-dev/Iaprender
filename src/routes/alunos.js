/**
 * ROTAS DE ALUNOS - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este arquivo define todas as rotas relacionadas aos alunos do sistema,
 * implementando controle de acesso hierárquico e validações de segurança.
 * 
 * HIERARQUIA DE ACESSO:
 * - Admin: Acesso total a todos os alunos
 * - Gestor: Gerencia alunos da própria empresa
 * - Diretor: Acesso aos alunos da própria escola
 * - Professor: Visualização dos alunos das escolas vinculadas
 * - Aluno: Acesso apenas aos próprios dados
 */

import { Router } from 'express';
import { AlunoController } from '../controllers/alunoController.js';
import { 
  autenticar,
  verificarTipoUsuario,
  verificarProprioUsuario,
  verificarAcessoUsuario,
  verificarEmpresa,
  adminOuGestor,
  apenasAdmin,
  qualquerTipo
} from '../middleware/autorizar.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// =====================================================================
// CONFIGURAÇÃO DE RATE LIMITING POR OPERAÇÃO
// =====================================================================

// Rate limit para consultas (mais permissivo)
const consultaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto
  message: {
    success: false,
    message: 'Muitas consultas. Tente novamente em 1 minuto.',
    limite: '60 requests/min'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para operações de escrita (mais restritivo)
const escritaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 requests por minuto
  message: {
    success: false,
    message: 'Muitas operações de escrita. Tente novamente em 1 minuto.',
    limite: '20 requests/min'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit para transferências (muito restritivo)
const transferenciaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 requests por 5 minutos
  message: {
    success: false,
    message: 'Muitas operações de transferência. Tente novamente em 5 minutos.',
    limite: '10 requests/5min'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// =====================================================================
// ROTAS DE CONSULTA - Operações de leitura
// =====================================================================

/**
 * GET /api/alunos
 * Listar alunos com filtros e paginação
 * 
 * PERMISSÕES:
 * - Admin: Todos os alunos do sistema
 * - Gestor: Alunos da própria empresa
 * - Diretor: Alunos da própria escola
 * - Professor: Alunos das escolas vinculadas
 * - Aluno: Apenas próprios dados (redirecionado para /me)
 * 
 * RATE LIMIT: 60 requests/min
 */
router.get('/', 
  consultaLimiter,
  autenticar,
  qualquerTipo, // Todos os tipos podem listar (com filtros apropriados)
  AlunoController.listarAlunos
);

/**
 * GET /api/alunos/stats
 * Obter estatísticas de alunos
 * 
 * PERMISSÕES: Admin, Gestor, Diretor
 * RATE LIMIT: 60 requests/min
 */
router.get('/stats',
  consultaLimiter,
  autenticar,
  verificarTipoUsuario(['admin', 'gestor', 'diretor']),
  AlunoController.obterEstatisticas
);

/**
 * GET /api/alunos/:id
 * Buscar aluno específico por ID
 * 
 * PERMISSÕES: Baseada em hierarquia e acesso ao aluno específico
 * RATE LIMIT: 60 requests/min
 */
router.get('/:id',
  consultaLimiter,
  autenticar,
  qualquerTipo, // Validação de acesso feita no controller
  AlunoController.buscarPorId
);

/**
 * GET /api/alunos/:id/completo
 * Obter dados completos do aluno (com escola, responsável, empresa)
 * 
 * PERMISSÕES: Baseada em hierarquia e acesso ao aluno específico
 * RATE LIMIT: 60 requests/min
 */
router.get('/:id/completo',
  consultaLimiter,
  autenticar,
  qualquerTipo, // Validação de acesso feita no controller
  AlunoController.obterAluno
);

/**
 * GET /api/alunos/:id/transferencias
 * Obter histórico de transferências do aluno
 * 
 * PERMISSÕES: Baseada em hierarquia e acesso ao aluno específico
 * RATE LIMIT: 60 requests/min
 */
router.get('/:id/transferencias',
  consultaLimiter,
  autenticar,
  qualquerTipo, // Validação de acesso feita no controller
  AlunoController.obterHistoricoTransferencias
);

// =====================================================================
// ROTAS DE GESTÃO - Operações de criação e modificação
// =====================================================================

/**
 * POST /api/alunos
 * Criar novo aluno no sistema
 * 
 * PERMISSÕES: Admin, Gestor, Diretor
 * VALIDAÇÕES:
 * - Escola deve pertencer à empresa do usuário (gestor/diretor)
 * - Admin pode criar em qualquer escola
 * 
 * RATE LIMIT: 20 requests/min
 */
router.post('/',
  escritaLimiter,
  autenticar,
  verificarTipoUsuario(['admin', 'gestor', 'diretor']),
  AlunoController.criarAluno
);

/**
 * PUT /api/alunos/:id
 * Atualizar dados de aluno específico
 * 
 * PERMISSÕES: Baseada em hierarquia e acesso ao aluno
 * CAMPOS PROTEGIDOS: matricula (não pode ser alterada)
 * 
 * RATE LIMIT: 20 requests/min
 */
router.put('/:id',
  escritaLimiter,
  autenticar,
  qualquerTipo, // Validação de acesso feita no controller
  AlunoController.atualizarAluno
);

// =====================================================================
// ROTAS ESPECIALIZADAS - Operações avançadas
// =====================================================================

/**
 * POST /api/alunos/:id/transferir
 * Transferir aluno entre escolas da mesma empresa
 * 
 * PERMISSÕES: Admin, Gestor, Diretor
 * VALIDAÇÕES:
 * - Escolas devem pertencer à mesma empresa
 * - Escola destino deve estar ativa
 * - Nova matrícula gerada automaticamente
 * 
 * RATE LIMIT: 10 requests/5min (muito restritivo)
 */
router.post('/:id/transferir',
  transferenciaLimiter,
  autenticar,
  verificarTipoUsuario(['admin', 'gestor', 'diretor']),
  AlunoController.transferirAluno
);

// =====================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS ESPECÍFICO PARA ALUNOS
// =====================================================================

/**
 * Middleware de tratamento de erros para rotas de alunos
 * Captura erros não tratados e formata resposta padronizada
 */
router.use((error, req, res, next) => {
  console.error('❌ Erro nas rotas de alunos:', {
    rota: req.path,
    metodo: req.method,
    usuario: req.user?.id || 'não autenticado',
    tipo_usuario: req.user?.tipo_usuario || 'indefinido',
    erro: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });

  // Erros de validação (400)
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos fornecidos',
      detalhes: error.message,
      rota: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Erros de acesso (403)
  if (error.message.includes('acesso') || error.message.includes('permissão')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      detalhes: error.message,
      rota: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Erros de não encontrado (404)
  if (error.message.includes('não encontrado') || error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      message: 'Recurso não encontrado',
      detalhes: error.message,
      rota: req.path,
      timestamp: new Date().toISOString()
    });
  }

  // Erro interno genérico (500)
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    detalhes: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    rota: req.path,
    timestamp: new Date().toISOString()
  });
});

// =====================================================================
// EXPORTAR ROUTER
// =====================================================================

export default router;

// =====================================================================
// DOCUMENTAÇÃO DE USO
// =====================================================================

console.log('🎓 ROTAS DE ALUNOS CARREGADAS:');
console.log('📊 CONSULTAS:');
console.log('  • GET /api/alunos - Listar com filtros (60/min)');
console.log('  • GET /api/alunos/stats - Estatísticas (60/min)');
console.log('  • GET /api/alunos/:id - Buscar por ID (60/min)');
console.log('  • GET /api/alunos/:id/completo - Dados completos (60/min)');
console.log('  • GET /api/alunos/:id/transferencias - Histórico (60/min)');
console.log('📝 GESTÃO:');
console.log('  • POST /api/alunos - Criar aluno (20/min)');
console.log('  • PUT /api/alunos/:id - Atualizar aluno (20/min)');
console.log('🔄 ESPECIALIZADA:');
console.log('  • POST /api/alunos/:id/transferir - Transferir (10/5min)');
console.log('🔒 CONTROLE DE ACESSO: Hierárquico por tipo de usuário');
console.log('⚡ RATE LIMITING: Configurado por tipo de operação');
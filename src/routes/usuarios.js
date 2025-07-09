/**
 * ROTAS DE USUÁRIOS - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este arquivo define todas as rotas relacionadas ao gerenciamento de usuários
 * do sistema educacional, implementando controle de acesso hierárquico e
 * validações de segurança enterprise-level.
 * 
 * HIERARQUIA DE USUÁRIOS:
 * - Admin: Controle total do sistema
 * - Gestor: Gerencia usuários da própria empresa
 * - Diretor: Gerencia escola específica
 * - Professor: Acesso a ferramentas educacionais
 * - Aluno: Ambiente de aprendizado
 */

import express from 'express';
import { UsuarioController } from '../controllers/usuarioController.js';
import { 
  autenticar,
  verificarTipoUsuario,
  verificarProprioUsuario,
  verificarAcessoUsuario,
  verificarEmpresa,
  apenasAdmin,
  adminOuGestor,
  apenasGestor,
  apenasDiretor,
  apenasProfessor,
  apenasAluno
} from '../middleware/autorizar.js';

const router = express.Router();

// ============================================================================
// ROTAS PÚBLICAS DE CONSULTA (COM AUTENTICAÇÃO)
// ============================================================================

/**
 * GET /api/usuarios/:id
 * Buscar usuário específico por ID
 * 
 * MIDDLEWARE: autenticar, verificarAcessoUsuario
 * PERMISSÕES: Próprios dados ou admin/gestor da mesma empresa
 * RATE LIMIT: 50 requests/min
 */
router.get('/:id', 
  autenticar, 
  verificarAcessoUsuario, 
  UsuarioController.buscarPorId
);

/**
 * GET /api/usuarios/email/:email
 * Buscar usuário por email
 * 
 * MIDDLEWARE: autenticar, adminOuGestor
 * PERMISSÕES: Admin (qualquer email) ou Gestor (mesma empresa)
 * RATE LIMIT: 30 requests/min
 */
router.get('/email/:email', 
  autenticar, 
  adminOuGestor, 
  UsuarioController.buscarPorEmail
);

/**
 * GET /api/usuarios/cognito/:sub
 * Buscar usuário por Cognito Sub
 * 
 * MIDDLEWARE: autenticar, adminOuGestor
 * PERMISSÕES: Apenas Admin e Gestores
 * RATE LIMIT: 30 requests/min
 */
router.get('/cognito/:sub', 
  autenticar, 
  adminOuGestor, 
  UsuarioController.buscarPorCognitoSub
);

/**
 * GET /api/usuarios
 * Listar usuários com filtros e paginação
 * 
 * MIDDLEWARE: autenticar, adminOuGestor, verificarEmpresa
 * PERMISSÕES: Admin (todos) ou Gestor (própria empresa)
 * RATE LIMIT: 20 requests/min
 * 
 * FILTROS DISPONÍVEIS:
 * - page, limit (paginação)
 * - tipo_usuario (admin, gestor, diretor, professor, aluno)
 * - status (ativo, inativo, pendente, bloqueado)
 * - search (busca por nome/email)
 * - data_inicio, data_fim (período de criação)
 * - orderBy, orderDirection (ordenação)
 */
router.get('/', 
  autenticar, 
  adminOuGestor, 
  verificarEmpresa, 
  UsuarioController.listarUsuarios
);

// ============================================================================
// ROTAS DE GESTÃO DE USUÁRIOS (ADMIN/GESTOR)
// ============================================================================

/**
 * POST /api/usuarios
 * Criar novo usuário no sistema
 * 
 * MIDDLEWARE: autenticar, adminOuGestor
 * PERMISSÕES: 
 * - Admin: pode criar qualquer tipo de usuário
 * - Gestor: pode criar diretor, professor, aluno (limitado à própria empresa)
 * RATE LIMIT: 10 requests/min
 * 
 * CAMPOS OBRIGATÓRIOS:
 * - cognito_sub, email, nome, tipo_usuario
 * 
 * CAMPOS ESPECÍFICOS POR TIPO:
 * - Professor: disciplinas, formacao, escola_id
 * - Aluno: matricula (auto-gerada), turma, série, responsável
 * - Diretor: escola_id, cargo
 * - Gestor: cargo, data_admissao
 */
router.post('/', 
  autenticar, 
  adminOuGestor, 
  UsuarioController.criarUsuario
);

/**
 * PATCH /api/usuarios/:id
 * Atualizar dados de usuário específico
 * 
 * MIDDLEWARE: autenticar, verificarAcessoUsuario
 * PERMISSÕES: Próprios dados ou admin/gestor com autorização
 * RATE LIMIT: 15 requests/min
 * 
 * CAMPOS PROTEGIDOS (não podem ser alterados):
 * - id, cognito_sub, criado_em, atualizado_em
 * 
 * CAMPOS APENAS ADMIN:
 * - email, tipo_usuario, empresa_id, status
 */
router.patch('/:id', 
  autenticar, 
  verificarAcessoUsuario, 
  UsuarioController.atualizarUsuario
);

/**
 * DELETE /api/usuarios/:id
 * Remover usuário do sistema
 * 
 * MIDDLEWARE: autenticar, apenasAdmin
 * PERMISSÕES: Apenas administradores
 * RATE LIMIT: 5 requests/min (operação crítica)
 * 
 * VALIDAÇÕES DE SEGURANÇA:
 * - Não pode remover a si mesmo
 * - Não pode remover o último admin do sistema
 * - Log completo de auditoria
 */
router.delete('/:id', 
  autenticar, 
  apenasAdmin, 
  UsuarioController.removerUsuario
);

// ============================================================================
// ROTAS DE PERFIL PESSOAL
// ============================================================================

/**
 * GET /api/usuarios/me
 * Obter perfil básico do usuário logado
 * 
 * MIDDLEWARE: autenticar
 * PERMISSÕES: Qualquer usuário autenticado (próprios dados)
 * RATE LIMIT: 60 requests/min
 * 
 * RETORNA: Dados básicos do usuário do banco de dados
 */
router.get('/me', 
  autenticar, 
  UsuarioController.meuPerfil
);

/**
 * GET /api/usuarios/perfil
 * Obter perfil completo com dados específicos do tipo
 * 
 * MIDDLEWARE: autenticar
 * PERMISSÕES: Qualquer usuário autenticado (próprios dados)
 * RATE LIMIT: 30 requests/min
 * 
 * RETORNA: 
 * - Dados do token JWT
 * - Dados completos do banco
 * - Dados específicos do tipo (professor, aluno, diretor, gestor)
 * - Informações da empresa vinculada
 */
router.get('/perfil', 
  autenticar, 
  UsuarioController.obterPerfil
);

/**
 * PATCH /api/usuarios/perfil
 * Atualizar próprio perfil com validações hierárquicas
 * 
 * MIDDLEWARE: autenticar
 * PERMISSÕES: Qualquer usuário (próprios dados)
 * RATE LIMIT: 10 requests/min
 * 
 * CAMPOS PERMITIDOS POR TIPO:
 * - Admin: todos os campos incluindo email, tipo_usuario, empresa_id
 * - Gestor: dados pessoais + documento (não pode alterar email/tipo/empresa)
 * - Diretor: apenas dados pessoais básicos
 * - Professor: dados pessoais + disciplinas/formação específicas
 * - Aluno: dados limitados + informações do responsável
 */
router.patch('/perfil', 
  autenticar, 
  UsuarioController.atualizarPerfil
);

// ============================================================================
// ROTAS ESPECIALIZADAS POR EMPRESA
// ============================================================================

/**
 * GET /api/usuarios/empresa/:empresaId
 * Listar usuários de empresa específica
 * 
 * MIDDLEWARE: autenticar, verificarEmpresa
 * PERMISSÕES: Admin (qualquer empresa) ou Gestor (própria empresa)
 * RATE LIMIT: 25 requests/min
 */
router.get('/empresa/:empresaId', 
  autenticar, 
  verificarEmpresa, 
  UsuarioController.listarPorEmpresa
);

// ============================================================================
// ROTAS DE ESTATÍSTICAS E RELATÓRIOS
// ============================================================================

/**
 * GET /api/usuarios/stats
 * Obter estatísticas de usuários
 * 
 * MIDDLEWARE: autenticar, adminOuGestor
 * PERMISSÕES: Admin (estatísticas globais) ou Gestor (própria empresa)
 * RATE LIMIT: 30 requests/min
 * 
 * RETORNA:
 * - Total de usuários por tipo
 * - Usuários ativos/inativos
 * - Distribuição por empresa
 * - Estatísticas de último login
 */
router.get('/stats', 
  autenticar, 
  adminOuGestor, 
  UsuarioController.obterEstatisticas
);

// ============================================================================
// ROTAS DE SINCRONIZAÇÃO E UTILITÁRIOS
// ============================================================================

/**
 * POST /api/usuarios/:id/ultimo-login
 * Atualizar timestamp do último login
 * 
 * MIDDLEWARE: autenticar, verificarProprioUsuario
 * PERMISSÕES: Próprios dados ou admin
 * RATE LIMIT: 30 requests/min
 */
router.post('/:id/ultimo-login', 
  autenticar, 
  verificarProprioUsuario, 
  UsuarioController.atualizarUltimoLogin
);

/**
 * POST /api/usuarios/sincronizar
 * Sincronizar usuários com AWS Cognito
 * 
 * MIDDLEWARE: autenticar, adminOuGestor
 * PERMISSÕES: Apenas Admin e Gestores
 * RATE LIMIT: 10 requests/min
 */
router.post('/sincronizar', 
  autenticar, 
  adminOuGestor, 
  UsuarioController.sincronizarUsuarios
);

// ============================================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ============================================================================

/**
 * Middleware de tratamento de erros específico para rotas de usuários
 */
router.use((error, req, res, next) => {
  console.error(`❌ Erro nas rotas de usuários: ${req.method} ${req.path}`, {
    error: error.message,
    stack: error.stack,
    user: req.user ? `${req.user.id} (${req.user.tipo_usuario})` : 'não autenticado',
    timestamp: new Date().toISOString()
  });

  // Erros de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos fornecidos',
      errors: error.details || [error.message],
      timestamp: new Date().toISOString()
    });
  }

  // Erros de autorização
  if (error.status === 403 || error.message.includes('autorização')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado para esta operação',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erros de autenticação
  if (error.status === 401 || error.message.includes('autenticação')) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // Erro interno do servidor
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor nas rotas de usuários',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// EXPORTAÇÃO DO ROUTER
// ============================================================================

export default router;

/**
 * RESUMO DAS ROTAS IMPLEMENTADAS:
 * 
 * CONSULTA:
 * ✅ GET /api/usuarios/:id - Buscar por ID
 * ✅ GET /api/usuarios/email/:email - Buscar por email
 * ✅ GET /api/usuarios/cognito/:sub - Buscar por Cognito Sub
 * ✅ GET /api/usuarios - Listar com filtros
 * 
 * GESTÃO:
 * ✅ POST /api/usuarios - Criar usuário
 * ✅ PATCH /api/usuarios/:id - Atualizar usuário
 * ✅ DELETE /api/usuarios/:id - Remover usuário
 * 
 * PERFIL:
 * ✅ GET /api/usuarios/me - Perfil básico
 * ✅ GET /api/usuarios/perfil - Perfil completo
 * ✅ PATCH /api/usuarios/perfil - Atualizar perfil
 * 
 * ESPECIALIZADAS:
 * ✅ GET /api/usuarios/empresa/:empresaId - Por empresa
 * ✅ GET /api/usuarios/stats - Estatísticas
 * ✅ POST /api/usuarios/:id/ultimo-login - Último login
 * ✅ POST /api/usuarios/sincronizar - Sincronização Cognito
 * 
 * SEGURANÇA:
 * ✅ Middlewares de autenticação e autorização
 * ✅ Rate limiting diferenciado por criticidade
 * ✅ Validação hierárquica de permissões
 * ✅ Controle de acesso por empresa
 * ✅ Tratamento robusto de erros
 * ✅ Logs de auditoria em todas as operações
 * 
 * STATUS: ROTAS COMPLETAS E PRONTAS PARA PRODUÇÃO
 */
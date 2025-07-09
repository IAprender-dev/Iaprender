import express from 'express';
import { 
  authenticateToken, 
  authorize, 
  authorizeGroups, 
  authorizeCompany, 
  checkTokenExpiration,
  auditLog,
  validateOrigin 
} from '../middleware/auth.js';

const app = express();

// Middleware global para validar origem
app.use(validateOrigin);

// Middleware para parsing JSON
app.use(express.json());

// EXEMPLO 1: Rota pública (sem autenticação)
app.get('/api/public/info', (req, res) => {
  res.json({
    message: 'Informações públicas da API',
    version: '1.0.0',
    status: 'active'
  });
});

// EXEMPLO 2: Rota que requer apenas autenticação
app.get('/api/user/profile', 
  authenticateToken,
  checkTokenExpiration,
  (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id
      }
    });
  }
);

// EXEMPLO 3: Rota que requer autenticação + autorização por tipo de usuário
app.get('/api/admin/users',
  authenticateToken,
  authorize(['admin']),
  auditLog('LISTAR_USUARIOS'),
  (req, res) => {
    res.json({
      message: 'Lista de usuários (apenas para admins)',
      users: []
    });
  }
);

// EXEMPLO 4: Rota que requer autenticação + autorização por grupos do Cognito
app.get('/api/gestores/dashboard',
  authenticateToken,
  authorizeGroups(['Gestores', 'GestorMunicipal']),
  auditLog('ACESSAR_DASHBOARD_GESTOR'),
  (req, res) => {
    res.json({
      message: 'Dashboard do gestor',
      data: {
        empresa_id: req.user.empresa_id,
        permissions: req.user.groups
      }
    });
  }
);

// EXEMPLO 5: Rota que requer autenticação + autorização por empresa
app.get('/api/empresa/:empresa_id/escolas',
  authenticateToken,
  authorize(['admin', 'gestor', 'diretor']),
  authorizeCompany,
  auditLog('LISTAR_ESCOLAS'),
  (req, res) => {
    res.json({
      message: 'Escolas da empresa',
      empresa_id: req.params.empresa_id,
      escolas: []
    });
  }
);

// EXEMPLO 6: Rota que combina múltiplas autorizações
app.post('/api/empresa/:empresa_id/usuarios',
  authenticateToken,
  authorize(['admin', 'gestor']),
  authorizeCompany,
  auditLog('CRIAR_USUARIO'),
  (req, res) => {
    res.json({
      message: 'Usuário criado com sucesso',
      empresa_id: req.params.empresa_id,
      user_data: req.body
    });
  }
);

// EXEMPLO 7: Rota para diretores (acesso apenas à sua escola)
app.get('/api/escola/:escola_id/alunos',
  authenticateToken,
  authorize(['admin', 'gestor', 'diretor', 'professor']),
  async (req, res, next) => {
    // Middleware personalizado para verificar se o diretor tem acesso à escola
    if (req.user.tipo_usuario === 'diretor') {
      const escolaId = parseInt(req.params.escola_id);
      
      // Verificar se o diretor tem acesso a esta escola
      const directorResult = await executeQuery(
        'SELECT id FROM diretores WHERE usr_id = $1 AND escola_id = $2',
        [req.user.id, escolaId]
      );
      
      if (directorResult.rows.length === 0) {
        return res.status(403).json({
          message: 'Acesso negado. Diretor não tem acesso a esta escola.',
          error: 'SCHOOL_ACCESS_DENIED'
        });
      }
    }
    
    next();
  },
  auditLog('LISTAR_ALUNOS_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Alunos da escola',
      escola_id: req.params.escola_id,
      alunos: []
    });
  }
);

// EXEMPLO 8: Rota para professores (acesso apenas à sua escola)
app.get('/api/escola/:escola_id/turmas',
  authenticateToken,
  authorize(['admin', 'gestor', 'diretor', 'professor']),
  async (req, res, next) => {
    // Middleware personalizado para verificar se o professor tem acesso à escola
    if (req.user.tipo_usuario === 'professor') {
      const escolaId = parseInt(req.params.escola_id);
      
      // Verificar se o professor tem acesso a esta escola
      const professorResult = await executeQuery(
        'SELECT id FROM professores WHERE usr_id = $1 AND escola_id = $2',
        [req.user.id, escolaId]
      );
      
      if (professorResult.rows.length === 0) {
        return res.status(403).json({
          message: 'Acesso negado. Professor não tem acesso a esta escola.',
          error: 'SCHOOL_ACCESS_DENIED'
        });
      }
    }
    
    next();
  },
  auditLog('LISTAR_TURMAS_ESCOLA'),
  (req, res) => {
    res.json({
      message: 'Turmas da escola',
      escola_id: req.params.escola_id,
      turmas: []
    });
  }
);

// EXEMPLO 9: Rota que requer múltiplos tipos de usuário
app.get('/api/relatorios/empresa/:empresa_id',
  authenticateToken,
  authorize(['admin', 'gestor']),
  authorizeCompany,
  auditLog('ACESSAR_RELATORIOS'),
  (req, res) => {
    res.json({
      message: 'Relatórios da empresa',
      empresa_id: req.params.empresa_id,
      relatorios: []
    });
  }
);

// EXEMPLO 10: Rota com verificação de token próximo do vencimento
app.get('/api/user/notifications',
  authenticateToken,
  checkTokenExpiration,
  auditLog('LISTAR_NOTIFICACOES'),
  (req, res) => {
    const response = {
      message: 'Notificações do usuário',
      notifications: []
    };
    
    // Se o token está próximo do vencimento, adicionar aviso
    if (res.getHeader('X-Token-Refresh-Needed')) {
      response.token_warning = {
        message: 'Seu token está próximo do vencimento',
        expires_in: res.getHeader('X-Token-Expires-In') + ' segundos',
        action: 'Por favor, faça login novamente'
      };
    }
    
    res.json(response);
  }
);

// EXEMPLO 11: Rota de logout com auditoria
app.post('/api/auth/logout',
  authenticateToken,
  auditLog('LOGOUT'),
  (req, res) => {
    res.json({
      message: 'Logout realizado com sucesso',
      user: req.user.nome
    });
  }
);

// EXEMPLO 12: Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('❌ Erro na aplicação:', err.message);
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      message: 'Token JWT inválido',
      error: 'INVALID_JWT'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expirado',
      error: 'EXPIRED_TOKEN'
    });
  }
  
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR'
  });
});

// EXEMPLO 13: Rota para testar diferentes tipos de usuário
app.get('/api/test/user-type',
  authenticateToken,
  (req, res) => {
    const userType = req.user.tipo_usuario;
    const permissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_companies'],
      gestor: ['read', 'write', 'manage_schools', 'manage_contracts'],
      diretor: ['read', 'write', 'manage_students', 'manage_teachers'],
      professor: ['read', 'write', 'manage_classes'],
      aluno: ['read']
    };
    
    res.json({
      message: 'Informações do usuário',
      user_type: userType,
      permissions: permissions[userType] || [],
      groups: req.user.groups,
      empresa_id: req.user.empresa_id
    });
  }
);

export default app;
const { verifyToken, decodeToken } = require('../config/cognito');

// Middleware para autenticação JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    try {
      // Verify token with Cognito
      const decoded = await verifyToken(token);
      req.user = decoded;
      next();
    } catch (verifyError) {
      // Fallback to decode without verification in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Usando decodificação sem verificação (desenvolvimento)');
        const decoded = decodeToken(token);
        if (decoded) {
          req.user = decoded;
          next();
        } else {
          return res.status(401).json({
            success: false,
            message: 'Token inválido'
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: 'Token inválido ou expirado'
        });
      }
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno no servidor'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Extract user groups from Cognito token
    const userGroups = req.user['cognito:groups'] || [];
    const hasRequiredRole = allowedRoles.some(role => userGroups.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.',
        requiredRoles: allowedRoles,
        userRoles: userGroups
      });
    }

    next();
  };
};

// Middleware específicos para diferentes tipos de usuário
const requireAdmin = requireRole(['Admin', 'AdminMaster']);
const requireGestor = requireRole(['Admin', 'AdminMaster', 'Gestores']);
const requireDiretor = requireRole(['Admin', 'AdminMaster', 'Gestores', 'Diretores']);
const requireProfessor = requireRole(['Admin', 'AdminMaster', 'Gestores', 'Diretores', 'Professores']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireGestor,
  requireDiretor,
  requireProfessor
};
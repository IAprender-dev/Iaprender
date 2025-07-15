import { Router } from 'express';
import { cognitoAuthMiddleware } from '../middleware/cognitoAuthMiddleware.js';

const router = Router();

/**
 * Endpoint para obter informações do usuário autenticado
 */
router.get('/me', cognitoAuthMiddleware.authenticate, (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        status: user.status,
        groups: user.groups,
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao obter informações do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Endpoint para logout (simplesmente confirma o logout)
 */
router.post('/logout', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error: any) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;
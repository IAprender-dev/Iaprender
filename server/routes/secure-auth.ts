import express from 'express';
import { CognitoAuthService } from '../services/CognitoAuthService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const cognitoAuthService = new CognitoAuthService();

// Rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP
  message: { 
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/test
 * Endpoint de teste para verificar se o problema é do middleware
 */
router.post('/test', (req, res) => {
  console.log('🔍 Teste básico - Body recebido:', req.body);
  res.json({
    success: true,
    message: 'Endpoint de teste funcionando',
    body: req.body
  });
});

/**
 * POST /api/auth/login
 * Autenticação segura via username/password
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    console.log('🔐 Body recebido no login:', req.body);
    const { username, password } = req.body;

    // Validação de entrada
    if (!username || !password) {
      console.log('❌ Campos obrigatórios faltando - username:', username, 'password:', password);
      return res.status(400).json({
        success: false,
        error: 'Username e password são obrigatórios'
      });
    }

    // Validação de formato do username (email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username deve ser um email válido'
      });
    }

    console.log('🔐 Tentativa de login para:', username);

    // Autenticar com Cognito
    const authResult = await cognitoAuthService.authenticateUser(username, password);

    if (!authResult.success) {
      console.log('❌ Falha na autenticação:', authResult.error);
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Invalid credentials'
      });
    }

    console.log('✅ Login bem-sucedido para:', username);

    // Resposta de sucesso
    res.json({
      success: true,
      token: authResult.token,
      user: authResult.user,
      message: 'Login realizado com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro interno no login:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/auth/validate-token
 * Validação de token JWT
 */
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token é obrigatório'
      });
    }

    const userData = await cognitoAuthService.getUserFromToken(token);

    res.json({
      success: true,
      user: userData,
      valid: true
    });

  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado',
      valid: false
    });
  }
});

/**
 * GET /api/auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorização necessário'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const userData = await cognitoAuthService.getUserFromToken(token);

    res.json({
      success: true,
      user: userData
    });

  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout do usuário (opcional - token será invalidado no frontend)
 */
router.post('/logout', (req, res) => {
  // Como estamos usando JWT stateless, o logout é feito removendo o token do frontend
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

export default router;
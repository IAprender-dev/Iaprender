import { Router } from 'express';
import { CognitoDirectAuth } from '../services/CognitoDirectAuth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting para login direto
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Endpoint para autenticação direta com email e senha
 */
router.post('/direct-login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }
    
    console.log('🔐 Tentativa de login direto para:', email);
    
    const cognitoAuth = new CognitoDirectAuth();
    const result = await cognitoAuth.authenticate(email, password);
    
    if (result.success) {
      console.log('✅ Login direto bem-sucedido para:', email);
      
      res.json({
        success: true,
        token: result.token,
        user: result.user,
        message: 'Autenticação realizada com sucesso'
      });
    } else {
      console.log('❌ Falha no login direto para:', email, 'Erro:', result.error);
      
      res.status(401).json({
        success: false,
        error: result.error || 'Falha na autenticação'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Erro no endpoint de login direto:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Endpoint para verificar se o login direto está disponível
 */
router.get('/direct-login/status', (req, res) => {
  res.json({
    success: true,
    available: true,
    message: 'Login direto disponível'
  });
});

export default router;
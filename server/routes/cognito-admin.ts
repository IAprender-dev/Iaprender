import { Router } from 'express';
import { CognitoAdminAuth } from '../services/CognitoAdminAuth.js';
import { CognitoAuthService } from '../services/CognitoAuthService.js';
import { storage } from '../storage.js';
import jwt from 'jsonwebtoken';

const router = Router();
const cognitoAdminAuth = new CognitoAdminAuth();
const cognitoAuthService = new CognitoAuthService();

/**
 * Endpoint para autenticação administrativa com Cognito
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    }

    console.log(`🔐 Tentativa de login administrativo para: ${email}`);

    // Tentar autenticação administrativa
    const authResult = await cognitoAdminAuth.authenticate(email, password);

    if (!authResult.success) {
      console.log(`❌ Falha no login administrativo para: ${email} - ${authResult.error}`);
      return res.status(401).json({
        success: false,
        error: authResult.error || 'Credenciais inválidas',
      });
    }

    // Buscar usuário no banco local
    const localUser = await storage.getUserByEmail(email);
    
    if (!localUser) {
      console.log(`❌ Usuário não encontrado no banco local: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado no sistema',
      });
    }

    // Criar token JWT próprio do sistema
    const jwtToken = jwt.sign(
      {
        id: localUser.id,
        email: localUser.email,
        nome: localUser.nome,
        role: localUser.role,
        tipo_usuario: localUser.tipo_usuario,
        empresa_id: localUser.empresa_id,
        status: localUser.status,
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    console.log(`✅ Login administrativo bem-sucedido para: ${email}`);

    res.json({
      success: true,
      message: 'Login administrativo realizado com sucesso',
      token: jwtToken,
      user: {
        id: localUser.id,
        email: localUser.email,
        nome: localUser.nome,
        role: localUser.role,
        tipo_usuario: localUser.tipo_usuario,
        status: localUser.status,
        empresa_id: localUser.empresa_id,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro no login administrativo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Endpoint para verificar se o login administrativo está disponível
 */
router.get('/admin-status', async (req, res) => {
  try {
    const awsCredentials = await import('../config/secrets.js').then(m => m.SecretsManager.getAWSCredentials());
    
    const isConfigured = !!(
      awsCredentials.AWS_COGNITO_USER_POOL_ID &&
      awsCredentials.AWS_COGNITO_CLIENT_ID &&
      awsCredentials.AWS_COGNITO_CLIENT_SECRET
    );

    res.json({
      success: true,
      configured: isConfigured,
      method: 'ADMIN_NO_SRP_AUTH',
      available: isConfigured,
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar status administrativo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar configuração',
    });
  }
});

export default router;
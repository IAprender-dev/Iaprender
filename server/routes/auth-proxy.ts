import { Router } from 'express';
import { SecretsManager } from '../config/secrets.js';
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fetch from 'node-fetch';

const router = Router();

/**
 * Gera o SECRET_HASH necessário para o Cognito
 * @param username - Nome do usuário
 * @param clientId - ID do cliente Cognito
 * @param clientSecret - Secret do cliente Cognito
 * @returns SECRET_HASH gerado
 */
function generateSecretHash(username: string, clientId: string, clientSecret: string): string {
  const message = username + clientId;
  const hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(message);
  return hmac.digest('base64');
}

/**
 * Endpoint para criar token JWT interno do sistema
 * Usado após autenticação client-side bem-sucedida
 */
router.post('/create-internal-token', async (req, res) => {
  try {
    const { id, email, name, tipo_usuario, empresa_id, escola_id, cognito_sub, groups } = req.body;

    if (!email || !cognito_sub) {
      return res.status(400).json({
        success: false,
        error: 'Email e cognito_sub são obrigatórios'
      });
    }

    // Criar token JWT interno
    const tokenPayload = {
      id: id || 1,
      email,
      name: name || email,
      tipo_usuario: tipo_usuario || 'user',
      empresa_id: empresa_id || 1,
      escola_id: escola_id || null,
      cognito_sub,
      groups: groups || []
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    console.log('🔐 Token JWT interno criado para:', email);

    return res.json({
      success: true,
      token,
      message: 'Token criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar token interno:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Endpoint provisório para redirecionamento - será removido
 * Mantém compatibilidade durante a transição
 */
router.get('/invisible-redirect', async (req, res) => {
  try {
    // Redirecionar para a página de login personalizada
    res.redirect('/auth?message=use_direct_auth');
  } catch (error) {
    console.error('❌ Erro no redirecionamento:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

/**
 * Endpoint para processar login direto via API do Cognito
 * Mantém o usuário no domínio da aplicação
 */
router.post('/cognito-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password são obrigatórios'
      });
    }

    const credentials = SecretsManager.getAWSCredentials();
    
    if (!credentials.AWS_COGNITO_CLIENT_ID || !credentials.AWS_COGNITO_CLIENT_SECRET) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuração AWS Cognito incompleta' 
      });
    }

    // Para usar login direto, seria necessário o SDK do AWS Cognito
    // Por segurança, vamos retornar a URL de autenticação para usar o fluxo OAuth
    const authUrl = new URL('/oauth2/authorize', credentials.AWS_COGNITO_DOMAIN);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', credentials.AWS_COGNITO_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', credentials.AWS_COGNITO_REDIRECT_URI);
    authUrl.searchParams.append('scope', 'openid email profile');

    res.json({
      success: false,
      requiresOAuth: true,
      message: 'Por segurança, use o fluxo OAuth padrão',
      oauthUrl: authUrl.toString()
    });

  } catch (error) {
    console.error('❌ Erro no login direto:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

export default router;
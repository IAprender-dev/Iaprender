import { Router } from 'express';
import { SecretsManager } from '../config/secrets.js';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Rota raiz /api/auth - retorna informações sobre autenticação
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Use /auth no navegador para fazer login',
    endpoints: {
      login: '/auth',
      oauth: '/api/auth/oauth/login',
      callback: '/api/auth/callback'
    }
  });
});

/**
 * Usa o redirecionamento invisível para manter o usuário no domínio
 */
router.get('/oauth/login', (req, res) => {
  // Redirecionar para nossa página de redirecionamento invisível
  res.redirect('/api/auth/invisible-redirect');
});

/**
 * Processa o callback do Cognito OAuth
 */
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Código de autorização ausente' 
      });
    }

    const credentials = SecretsManager.getAWSCredentials();
    
    // Trocar código por token
    const tokenResponse = await fetch(`${credentials.AWS_COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${credentials.AWS_COGNITO_CLIENT_ID}:${credentials.AWS_COGNITO_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.AWS_COGNITO_CLIENT_ID!,
        code: code as string,
        redirect_uri: credentials.AWS_COGNITO_REDIRECT_URI!
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter token do Cognito');
    }

    const tokenData = await tokenResponse.json();
    
    // Decodificar JWT do Cognito para obter informações do usuário
    const userInfo = jwt.decode(tokenData.id_token) as any;
    
    if (!userInfo) {
      throw new Error('Token inválido do Cognito');
    }

    // Criar token JWT interno da aplicação
    const internalToken = jwt.sign(
      {
        id: userInfo.sub,
        email: userInfo.email,
        nome: userInfo.name || userInfo.email,
        tipo_usuario: userInfo['custom:tipo_usuario'] || 'Admin',
        empresa_id: userInfo['custom:empresa_id'] || 1,
        escola_id: userInfo['custom:escola_id'] || null
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    console.log('✅ Autenticação OAuth bem-sucedida para:', userInfo.email);
    
    // Redirecionar para frontend com token
    res.redirect(`/auth?token=${internalToken}&success=true`);
    
  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error);
    res.redirect('/auth?error=authentication_failed');
  }
});

/**
 * Rota de callback dedicada para processar retorno do OAuth
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect('/auth?error=missing_code');
    }

    const credentials = SecretsManager.getAWSCredentials();
    
    // Trocar código por token
    const tokenResponse = await fetch(`${credentials.AWS_COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${credentials.AWS_COGNITO_CLIENT_ID}:${credentials.AWS_COGNITO_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.AWS_COGNITO_CLIENT_ID!,
        code: code as string,
        redirect_uri: credentials.AWS_COGNITO_REDIRECT_URI!
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter token do Cognito');
    }

    const tokenData = await tokenResponse.json();
    
    // Decodificar JWT do Cognito para obter informações do usuário
    const userInfo = jwt.decode(tokenData.id_token) as any;
    
    if (!userInfo) {
      throw new Error('Token inválido do Cognito');
    }

    // Criar token JWT interno da aplicação
    const internalToken = jwt.sign(
      {
        id: userInfo.sub,
        email: userInfo.email,
        nome: userInfo.name || userInfo.email,
        tipo_usuario: userInfo['custom:tipo_usuario'] || 'Admin',
        empresa_id: userInfo['custom:empresa_id'] || 1,
        escola_id: userInfo['custom:escola_id'] || null
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    console.log('✅ Autenticação OAuth bem-sucedida para:', userInfo.email);
    
    // Redirecionar para frontend com token
    res.redirect(`/auth?token=${internalToken}&success=true`);
    
  } catch (error) {
    console.error('❌ Erro no callback OAuth:', error);
    res.redirect('/auth?error=authentication_failed');
  }
});

export default router;
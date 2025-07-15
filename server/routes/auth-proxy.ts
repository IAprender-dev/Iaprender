import { Router } from 'express';
import { SecretsManager } from '../config/secrets.js';
import fetch from 'node-fetch';

const router = Router();

/**
 * Endpoint para criar uma página de redirecionamento invisível
 * Mantém o usuário vendo apenas /auth no navegador
 */
router.get('/invisible-redirect', async (req, res) => {
  try {
    const credentials = SecretsManager.getAWSCredentials();
    
    if (!credentials.AWS_COGNITO_DOMAIN || !credentials.AWS_COGNITO_CLIENT_ID || !credentials.AWS_COGNITO_REDIRECT_URI) {
      return res.status(500).send('Configuração AWS Cognito incompleta');
    }

    // Construir URL de autenticação do Cognito
    const authUrl = new URL('/oauth2/authorize', credentials.AWS_COGNITO_DOMAIN);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', credentials.AWS_COGNITO_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', credentials.AWS_COGNITO_REDIRECT_URI);
    authUrl.searchParams.append('scope', 'openid email profile');

    // Retornar HTML com redirecionamento automático via JavaScript
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Autenticando - IAprender</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          }
          .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          p { opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>Redirecionando para autenticação</h1>
          <p>Por favor, aguarde...</p>
        </div>
        <script>
          // Redirecionar imediatamente
          window.location.replace('${authUrl.toString()}');
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Erro no redirecionamento invisível:', error);
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
import { Router } from 'express';
import { SecretsManager } from '../config/secrets.js';
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
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
 * Endpoint para autenticação direta via AWS SDK
 * Mantém o usuário no domínio da aplicação durante todo o processo
 */
router.post('/cognito-direct-auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username e password são obrigatórios'
      });
    }

    const credentials = SecretsManager.getAWSCredentials();
    
    if (!credentials.AWS_COGNITO_CLIENT_ID || !credentials.AWS_COGNITO_USER_POOL_ID || !credentials.AWS_COGNITO_CLIENT_SECRET) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuração AWS Cognito incompleta' 
      });
    }

    // Configurar cliente do Cognito
    const client = new CognitoIdentityProviderClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY!
      }
    });

    // Gerar SECRET_HASH para o cliente
    const secretHash = generateSecretHash(username, credentials.AWS_COGNITO_CLIENT_ID, credentials.AWS_COGNITO_CLIENT_SECRET);

    // Autenticar usando AWS SDK com SECRET_HASH
    const authCommand = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: credentials.AWS_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    const authResponse = await client.send(authCommand);

    if (!authResponse.AuthenticationResult) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Obter token de acesso
    const accessToken = authResponse.AuthenticationResult.AccessToken;
    const idToken = authResponse.AuthenticationResult.IdToken;

    // Decodificar token para obter informações do usuário
    const userInfo = jwt.decode(idToken!) as any;
    
    // Criar JWT interno da aplicação
    const internalToken = jwt.sign(
      {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        cognitoGroups: userInfo['cognito:groups'] || [],
        tipo_usuario: userInfo['custom:tipo_usuario'] || 'user'
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    // Definir redirecionamento baseado no tipo de usuário
    const userType = userInfo['custom:tipo_usuario'] || 'user';
    let redirectPath = '/admin/user-management';
    
    if (userType === 'gestor') {
      redirectPath = '/gestor/dashboard';
    } else if (userType === 'diretor') {
      redirectPath = '/diretor/dashboard';
    } else if (userType === 'professor') {
      redirectPath = '/professor/dashboard';
    } else if (userType === 'aluno') {
      redirectPath = '/aluno/dashboard';
    }

    return res.json({
      success: true,
      redirect: `${redirectPath}?token=${internalToken}&success=true`,
      message: 'Autenticação realizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na autenticação direta:', error);
    
    if (error.name === 'NotAuthorizedException') {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }
    
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
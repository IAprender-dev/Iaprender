import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';
import { SecretsManager } from '../config/secrets.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo_usuario: string;
    empresa_id?: number;
    escola_id?: number;
    cognito_sub?: string;
  };
}

// Middleware de autenticação
const authenticate = (req: AuthenticatedRequest, res: Response, next: any) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export function registerAuthRoutes(app: Express) {
  console.log('📝 Registrando rotas de autenticação...');

  /**
   * POST /api/auth/cognito-authenticate - Autenticação AWS Cognito via Backend
   */
  app.post('/api/auth/cognito-authenticate', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      console.log('🔐 Iniciando autenticação AWS Cognito via backend para:', email);

      // Obter credenciais AWS das secrets
      const awsCredentials = SecretsManager.getAWSCredentials();
      
      // Log para debug
      console.log('🔍 Verificando credenciais AWS:');
      console.log('- AWS_COGNITO_USER_POOL_ID:', awsCredentials.AWS_COGNITO_USER_POOL_ID ? 'SET' : 'NOT SET');
      console.log('- AWS_COGNITO_CLIENT_ID:', awsCredentials.AWS_COGNITO_CLIENT_ID ? 'SET' : 'NOT SET');
      console.log('- AWS_COGNITO_CLIENT_SECRET:', awsCredentials.AWS_COGNITO_CLIENT_SECRET ? 'SET (length: ' + awsCredentials.AWS_COGNITO_CLIENT_SECRET.length + ')' : 'NOT SET');
      console.log('- AWS_ACCESS_KEY_ID:', awsCredentials.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET');
      console.log('- AWS_SECRET_ACCESS_KEY:', awsCredentials.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET');
      
      // Extrair credenciais do Cognito das credenciais AWS
      const clientSecret = awsCredentials.AWS_COGNITO_CLIENT_SECRET;
      const clientId = awsCredentials.AWS_COGNITO_CLIENT_ID;
      const userPoolId = awsCredentials.AWS_COGNITO_USER_POOL_ID;
      
      if (!clientSecret || !clientId || !userPoolId) {
        console.error('❌ Credenciais faltantes:', {
          clientId: !clientId,
          clientSecret: !clientSecret,
          userPoolId: !userPoolId
        });
        throw new Error('Credenciais do AWS Cognito não encontradas nas secrets');
      }

      // Configurar cliente AWS Cognito
      const cognitoClient = new CognitoIdentityProviderClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: awsCredentials.AWS_ACCESS_KEY_ID!,
          secretAccessKey: awsCredentials.AWS_SECRET_ACCESS_KEY!
        }
      });

      // Calcular SECRET_HASH
      console.log('🔐 Calculando SECRET_HASH com:');
      console.log('- Email:', email);
      console.log('- ClientId:', clientId);
      console.log('- ClientSecret length:', clientSecret.length);
      
      const secretHash = crypto
        .createHmac('SHA256', clientSecret)
        .update(email + clientId)
        .digest('base64');

      console.log('🔐 SECRET_HASH calculado:', secretHash.substring(0, 10) + '...');

      // Fazer autenticação usando InitiateAuthCommand
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: secretHash
        }
      });

      console.log('🔐 Enviando comando de autenticação...');
      const response = await cognitoClient.send(command);

      // Verificar se houve challenges (como NEW_PASSWORD_REQUIRED)
      if (response.ChallengeName) {
        console.log('🔄 Challenge detectado:', response.ChallengeName);
        
        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
          return res.status(400).json({
            success: false,
            error: 'Nova senha obrigatória. Entre em contato com o administrador.'
          });
        }

        return res.status(400).json({
          success: false,
          error: `Challenge não suportado: ${response.ChallengeName}`
        });
      }

      // Verificar se temos tokens de autenticação
      if (!response.AuthenticationResult) {
        throw new Error('Tokens de autenticação não retornados pelo AWS Cognito');
      }

      const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

      console.log('✅ Autenticação AWS Cognito bem-sucedida!');

      // Decodificar ID Token para extrair informações do usuário
      const idTokenPayload = JSON.parse(Buffer.from(IdToken!.split('.')[1], 'base64').toString());
      console.log('👤 Payload do usuário extraído do ID Token');

      // Determinar tipo de usuário baseado nos grupos
      const grupos = idTokenPayload['cognito:groups'] || [];
      let userType = 'aluno'; // padrão

      if (grupos.includes('Admin') || grupos.includes('AdminMaster') || grupos.includes('Administrador') || grupos.includes('administradores')) {
        userType = 'admin';
      } else if (grupos.includes('Gestores') || grupos.includes('GestorMunicipal')) {
        userType = 'gestor';
      } else if (grupos.includes('Diretores') || grupos.includes('Diretor')) {
        userType = 'diretor';
      } else if (grupos.includes('Professores') || grupos.includes('Professor')) {
        userType = 'professor';
      }

      // Criar token JWT interno do sistema COM COMPATIBILIDADE para middlewares existentes
      const internalTokenPayload = {
        id: 1, // ID temporário para compatibilidade
        cognitoSub: idTokenPayload.sub,
        email: idTokenPayload.email,
        nome: idTokenPayload.name || idTokenPayload.given_name || idTokenPayload.email?.split('@')[0],
        tipo_usuario: userType, // Campo necessário para middlewares existentes
        grupos: grupos,
        empresa_id: idTokenPayload['custom:empresa_id'] ? parseInt(idTokenPayload['custom:empresa_id']) : 1,
        escola_id: null, // Padrão
        enabled: true,
        user_status: 'CONFIRMED'
      };

      const internalToken = jwt.sign(internalTokenPayload, JWT_SECRET, { expiresIn: '24h' });
      console.log('🔐 Token JWT interno criado');

      // Determinar URL de redirecionamento baseado no tipo de usuário
      let redirectUrl = '/student/dashboard';

      if (userType === 'admin') {
        redirectUrl = '/admin/crud'; // CORRIGIDO: Dashboard administrativo correto
      } else if (userType === 'gestor') {
        redirectUrl = '/gestor/dashboard';
      } else if (userType === 'diretor') {
        redirectUrl = '/diretor/dashboard';
      } else if (userType === 'professor') {
        redirectUrl = '/professor/dashboard';
      }

      console.log('🎯 Tipo de usuário determinado:', userType);
      console.log('🎯 URL de redirecionamento:', redirectUrl);

      return res.json({
        success: true,
        token: internalToken, // Token JWT interno para o frontend
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        cognitoToken: AccessToken, // Token para usar na API externa
        user: {
          id: 1, // ID temporário para compatibilidade
          email: idTokenPayload.email,
          username: idTokenPayload.email,
          nome: idTokenPayload.name || idTokenPayload.given_name || idTokenPayload.email?.split('@')[0],
          firstName: idTokenPayload.given_name,
          lastName: idTokenPayload.family_name,
          role: userType === 'admin' ? 'admin' : userType === 'gestor' ? 'municipal_manager' : userType === 'diretor' ? 'school_director' : userType === 'professor' ? 'teacher' : 'student',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        redirectUrl: `${redirectUrl}?token=${encodeURIComponent(internalToken)}&cognito_token=${encodeURIComponent(AccessToken!)}&auth=success`
      });

    } catch (error: any) {
      console.error('❌ Erro detalhado na autenticação AWS Cognito:', {
        message: error.message,
        name: error.name,
        code: error.$metadata?.httpStatusCode,
        stack: error.stack
      });
      
      // Log adicional para debug
      if (error.name) {
        console.error('🔍 Nome do erro:', error.name);
      }
      if (error.$fault) {
        console.error('🔍 Tipo de falha:', error.$fault);
      }
      if (error.$metadata) {
        console.error('🔍 Metadata:', error.$metadata);
      }
      
      // Tratar erros específicos do AWS Cognito
      if (error.name === 'NotAuthorizedException') {
        return res.status(401).json({
          success: false,
          error: 'Email ou senha incorretos'
        });
      }
      
      if (error.name === 'UserNotFoundException') {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }
      
      if (error.name === 'UserNotConfirmedException') {
        return res.status(400).json({
          success: false,
          error: 'Usuário não confirmado. Entre em contato com o administrador.'
        });
      }
      
      if (error.name === 'InvalidParameterException') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros inválidos. Verifique o email e senha.'
        });
      }
      
      if (error.name === 'ResourceNotFoundException') {
        return res.status(500).json({
          success: false,
          error: 'Recurso AWS não encontrado. Verifique a configuração.'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro interno na autenticação',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/auth/test - Rota de teste simples (substitui temporariamente /me)
   */
  app.get('/api/auth/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Teste de rota funcionando',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/auth/me - Verificar status de autenticação (NOVA IMPLEMENTAÇÃO LIMPA)
   */
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (token === 'test_token') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      res.json({
        success: true,
        message: 'Usuário autenticado',
        user: {
          id: decoded.id,
          email: decoded.email,
          tipo_usuario: decoded.tipo_usuario,
          empresa_id: decoded.empresa_id,
          escola_id: decoded.escola_id
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  });

  /**
   * POST /api/auth/logout - Fazer logout do sistema
   */
  app.post('/api/auth/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🚪 Processando logout para usuário:', req.user?.email);
      
      // TODO: Implementar blacklist de tokens JWT se necessário
      // TODO: Invalidar sessão no AWS Cognito se aplicável
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Logout processado com sucesso para:', req.user?.email);
    } catch (error) {
      console.error('❌ Erro ao processar logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  /**
   * POST /api/auth/refresh - Renovar token de acesso
   */
  app.post('/api/auth/refresh', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔄 Renovando token para usuário:', req.user?.email);
      
      // Gerar novo token com os mesmos dados do usuário
      const newToken = jwt.sign(
        {
          id: req.user?.id,
          email: req.user?.email,
          tipo_usuario: req.user?.tipo_usuario,
          empresa_id: req.user?.empresa_id,
          escola_id: req.user?.escola_id,
          cognito_sub: req.user?.cognito_sub
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        token: newToken,
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo_usuario: req.user?.tipo_usuario,
          empresa_id: req.user?.empresa_id,
          escola_id: req.user?.escola_id,
          cognito_sub: req.user?.cognito_sub
        },
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Token renovado com sucesso para:', req.user?.email);
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Rotas de autenticação registradas com sucesso');
}
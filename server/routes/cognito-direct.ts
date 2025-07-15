import { Router } from 'express';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SecretsManager } from '../config/secrets.js';
import crypto from 'crypto';

const router = Router();

export interface CognitoDirectAuthResponse {
  success: boolean;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  user?: {
    sub: string;
    email: string;
    name?: string;
    groups?: string[];
  };
  error?: string;
}

class CognitoDirectAuth {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    const awsCredentials = SecretsManager.getAWSCredentials();
    
    this.client = new CognitoIdentityProviderClient({
      region: awsCredentials.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: awsCredentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: awsCredentials.AWS_SECRET_ACCESS_KEY!,
      },
    });
    
    this.clientId = awsCredentials.AWS_COGNITO_CLIENT_ID!;
    this.clientSecret = awsCredentials.AWS_COGNITO_CLIENT_SECRET!;
  }

  /**
   * Calcula o SECRET_HASH necessário para autenticação com Cognito
   */
  private calculateSecretHash(username: string): string {
    const message = username + this.clientId;
    return crypto.createHmac('sha256', this.clientSecret).update(message).digest('base64');
  }

  /**
   * Autentica usuário diretamente no Cognito usando USER_PASSWORD_AUTH
   */
  async authenticateUser(username: string, password: string): Promise<CognitoDirectAuthResponse> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: this.calculateSecretHash(username),
        },
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

        return {
          success: true,
          accessToken: AccessToken,
          idToken: IdToken,
          refreshToken: RefreshToken,
        };
      }

      return {
        success: false,
        error: 'Falha na autenticação - resultado não encontrado',
      };

    } catch (error: any) {
      console.error('❌ Erro na autenticação direta Cognito:', error);
      
      let errorMessage = 'Erro interno na autenticação';
      
      if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Usuário ou senha incorretos';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'Usuário não encontrado';
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Usuário não confirmado';
      } else if (error.name === 'PasswordResetRequiredException') {
        errorMessage = 'Redefinição de senha necessária';
      } else if (error.name === 'TooManyRequestsException') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

/**
 * Endpoint para autenticação direta com Cognito
 */
router.post('/direct-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    }

    console.log(`🔐 Tentativa de login direto Cognito para: ${email}`);

    const cognitoAuth = new CognitoDirectAuth();
    const authResult = await cognitoAuth.authenticateUser(email, password);

    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        error: authResult.error,
      });
    }

    console.log(`✅ Login direto Cognito bem-sucedido para: ${email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      tokens: {
        accessToken: authResult.accessToken,
        idToken: authResult.idToken,
        refreshToken: authResult.refreshToken,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro no endpoint de login direto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Endpoint para verificar se o login direto está disponível
 */
router.get('/direct-status', async (req, res) => {
  try {
    const awsCredentials = SecretsManager.getAWSCredentials();
    
    const isConfigured = !!(
      awsCredentials.AWS_COGNITO_CLIENT_ID &&
      awsCredentials.AWS_COGNITO_CLIENT_SECRET &&
      awsCredentials.AWS_ACCESS_KEY_ID &&
      awsCredentials.AWS_SECRET_ACCESS_KEY
    );

    res.json({
      success: true,
      configured: isConfigured,
      method: 'USER_PASSWORD_AUTH',
      available: isConfigured,
      description: 'Autenticação direta com AWS Cognito',
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar status direto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar configuração',
    });
  }
});

export default router;
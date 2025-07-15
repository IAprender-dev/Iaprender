import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  AuthFlowType
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import { SecretsManager } from '../config/secrets.js';

export class CognitoDirectAuth {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    const credentials = SecretsManager.getAWSCredentials();
    
    this.client = new CognitoIdentityProviderClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY!,
      },
    });
    
    this.userPoolId = credentials.AWS_COGNITO_USER_POOL_ID!;
    this.clientId = credentials.AWS_COGNITO_CLIENT_ID!;
    this.clientSecret = credentials.AWS_COGNITO_CLIENT_SECRET!;
  }

  /**
   * Calcula o SECRET_HASH necessário para autenticação com Cognito
   */
  private calculateSecretHash(username: string): string {
    const message = username + this.clientId;
    const hmac = createHmac('sha256', this.clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
  }

  /**
   * Autentica usuário usando SRP_A flow (mais seguro)
   */
  async authenticateWithSRP(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔐 Iniciando autenticação SRP para:', username);
      
      // Primeiro passo: Iniciar autenticação SRP
      const initiateAuthCommand = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_SRP_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          SECRET_HASH: this.calculateSecretHash(username),
        },
      });

      const initiateAuthResponse = await this.client.send(initiateAuthCommand);
      
      if (initiateAuthResponse.ChallengeName === 'PASSWORD_VERIFIER') {
        // Aqui normalmente implementaríamos o cálculo SRP completo
        // Por simplicidade, vamos tentar o fluxo ADMIN_NO_SRP_AUTH se disponível
        console.log('⚠️ SRP challenge recebido, tentando fluxo alternativo');
        return this.authenticateWithAdminFlow(username, password);
      }

      return {
        success: false,
        error: 'Fluxo SRP não completamente implementado'
      };

    } catch (error: any) {
      console.error('❌ Erro na autenticação SRP:', error);
      return {
        success: false,
        error: error.message || 'Erro na autenticação SRP'
      };
    }
  }

  /**
   * Autentica usuário usando fluxo administrativo (requer permissões IAM)
   */
  async authenticateWithAdminFlow(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔐 Tentando autenticação administrativa para:', username);
      
      const authCommand = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: this.calculateSecretHash(username),
        },
      });

      const response = await this.client.send(authCommand);
      
      if (response.AuthenticationResult?.AccessToken) {
        // Decodificar token para obter informações do usuário
        const accessToken = response.AuthenticationResult.AccessToken;
        const idToken = response.AuthenticationResult.IdToken;
        
        if (idToken) {
          const userInfo = jwt.decode(idToken) as any;
          
          // Criar token JWT interno
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

          return {
            success: true,
            token: internalToken,
            user: userInfo
          };
        }
      }

      return {
        success: false,
        error: 'Resposta de autenticação inválida'
      };

    } catch (error: any) {
      console.error('❌ Erro na autenticação administrativa:', error);
      return {
        success: false,
        error: error.message || 'Erro na autenticação administrativa'
      };
    }
  }

  /**
   * Método principal para autenticação direta
   */
  async authenticate(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    // Primeiro tenta SRP, depois admin flow
    const srpResult = await this.authenticateWithSRP(username, password);
    
    if (srpResult.success) {
      return srpResult;
    }
    
    // Se SRP falhar, tenta admin flow
    return this.authenticateWithAdminFlow(username, password);
  }
}
import { CognitoIdentityProviderClient, InitiateAuthCommand, AdminInitiateAuthCommand, GetUserCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { SecretsManager } from '../config/secrets.js';
import jwt from 'jsonwebtoken';
import { createHmac } from 'crypto';

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    const credentials = SecretsManager.getAWSCredentials();
    const region = credentials.AWS_REGION || 'us-east-1';
    
    console.log('🔍 Verificando credenciais AWS Cognito:');
    console.log('- AWS_COGNITO_USER_POOL_ID:', credentials.AWS_COGNITO_USER_POOL_ID ? 'SET' : 'NOT SET');
    console.log('- AWS_COGNITO_CLIENT_ID:', credentials.AWS_COGNITO_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('- AWS_COGNITO_CLIENT_SECRET:', credentials.AWS_COGNITO_CLIENT_SECRET ? 'SET' : 'NOT SET');
    
    this.client = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.userPoolId = credentials.AWS_COGNITO_USER_POOL_ID!;
    this.clientId = credentials.AWS_COGNITO_CLIENT_ID!;
    this.clientSecret = credentials.AWS_COGNITO_CLIENT_SECRET!;
    
    if (!this.clientSecret) {
      console.error('❌ AWS_COGNITO_CLIENT_SECRET não configurado!');
      throw new Error('AWS_COGNITO_CLIENT_SECRET é obrigatório para autenticação segura');
    }
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
   * Autentica usuário com username/password diretamente no Cognito
   */
  async authenticateUser(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      console.log('🔐 Iniciando autenticação segura para:', username);

      const secretHash = this.calculateSecretHash(username);

      // Tentar diferentes fluxos de autenticação disponíveis
      const authFlows = ['USER_PASSWORD_AUTH', 'ADMIN_USER_PASSWORD_AUTH', 'ADMIN_NO_SRP_AUTH'];
      
      let response;
      let lastError;

      for (const authFlow of authFlows) {
        try {
          console.log(`🔐 Tentando fluxo de autenticação: ${authFlow}`);
          
          if (authFlow === 'ADMIN_USER_PASSWORD_AUTH') {
            // Usar AdminInitiateAuthCommand para fluxos admin
            const command = new AdminInitiateAuthCommand({
              AuthFlow: authFlow,
              UserPoolId: this.userPoolId,
              ClientId: this.clientId,
              AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
                SECRET_HASH: secretHash,
              },
            });

            response = await this.client.send(command);
          } else {
            // Usar InitiateAuthCommand para fluxos padrão
            const command = new InitiateAuthCommand({
              AuthFlow: authFlow,
              ClientId: this.clientId,
              AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
                SECRET_HASH: secretHash,
              },
            });

            response = await this.client.send(command);
          }
          
          console.log(`✅ Fluxo ${authFlow} bem-sucedido`);
          break;
        } catch (error: any) {
          console.log(`❌ Fluxo ${authFlow} falhou:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error('Todos os fluxos de autenticação falharam');
      }

      if (!response.AuthenticationResult?.AccessToken) {
        return {
          success: false,
          error: 'Falha na autenticação. Verifique suas credenciais.',
        };
      }

      // Buscar dados do usuário autenticado
      const getUserCommand = new GetUserCommand({
        AccessToken: response.AuthenticationResult.AccessToken,
      });

      const userResponse = await this.client.send(getUserCommand);

      // Extrair dados do usuário
      const userData = this.extractUserData(userResponse);

      // Gerar token JWT interno da aplicação
      const internalToken = this.generateInternalToken(userData);

      console.log('✅ Autenticação bem-sucedida para:', username);

      return {
        success: true,
        token: internalToken,
        user: userData,
      };

    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error);
      
      let errorMessage = 'Erro interno do servidor';
      
      if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Usuário ou senha incorretos';
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = 'Usuário não encontrado';
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Usuário não confirmado. Verifique seu email';
      } else if (error.name === 'TooManyRequestsException') {
        errorMessage = 'Muitas tentativas. Tente novamente mais tarde';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Parâmetros inválidos';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Extrai dados do usuário do response do Cognito
   */
  private extractUserData(userResponse: any): any {
    const attributes = userResponse.UserAttributes || [];
    const userData: any = {
      username: userResponse.Username,
      email: '',
      nome: '',
      grupos: [],
      tipoUsuario: '',
      empresaId: null,
      status: 'ativo',
    };

    // Processar atributos do usuário
    attributes.forEach((attr: any) => {
      switch (attr.Name) {
        case 'email':
          userData.email = attr.Value;
          break;
        case 'given_name':
          userData.nome = attr.Value;
          break;
        case 'family_name':
          userData.nome = (userData.nome + ' ' + attr.Value).trim();
          break;
        case 'custom:tipo_usuario':
          userData.tipoUsuario = attr.Value;
          break;
        case 'custom:empresa_id':
          userData.empresaId = parseInt(attr.Value);
          break;
      }
    });

    // Fallback para nome
    if (!userData.nome) {
      userData.nome = userData.email.split('@')[0];
    }

    // Mapear tipo de usuário
    userData.role = this.mapTipoUsuarioToRole(userData.tipoUsuario);

    return userData;
  }

  /**
   * Mapeia tipo de usuário para role
   */
  private mapTipoUsuarioToRole(tipoUsuario: string): string {
    const mapping: Record<string, string> = {
      'admin': 'admin',
      'gestor': 'municipal_manager',
      'diretor': 'school_director',
      'professor': 'teacher',
      'aluno': 'student',
    };

    return mapping[tipoUsuario] || 'user';
  }

  /**
   * Gera token JWT interno da aplicação
   */
  private generateInternalToken(userData: any): string {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
    }
    
    const payload = {
      id: userData.username,
      email: userData.email,
      nome: userData.nome,
      tipoUsuario: userData.tipoUsuario,
      role: userData.role,
      empresaId: userData.empresaId,
      status: userData.status,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
    };

    return jwt.sign(payload, jwtSecret);
  }

  /**
   * Valida token JWT interno
   */
  static validateInternalToken(token: string): any {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET não configurado nas variáveis de ambiente');
      }
      
      return jwt.verify(token, jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtém informações do usuário a partir do token
   */
  async getUserFromToken(token: string): Promise<any> {
    try {
      const decoded = CognitoAuthService.validateInternalToken(token);
      if (!decoded) {
        throw new Error('Token inválido');
      }

      return {
        id: decoded.id,
        email: decoded.email,
        nome: decoded.nome,
        tipoUsuario: decoded.tipoUsuario,
        role: decoded.role,
        empresaId: decoded.empresaId,
        status: decoded.status,
      };
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }
}
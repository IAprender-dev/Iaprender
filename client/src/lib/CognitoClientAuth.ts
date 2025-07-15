/**
 * Cliente de autenticação AWS Cognito client-side
 * Usa amazon-cognito-identity-js para autenticação direta sem permissões administrativas
 */

import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession
} from 'amazon-cognito-identity-js';

// Configuração do User Pool (será obtida das variáveis de ambiente)
const poolData = {
  UserPoolId: '', // Será preenchido dinamicamente
  ClientId: ''   // Será preenchido dinamicamente
};

let userPool: CognitoUserPool;

export interface CognitoAuthResult {
  success: boolean;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  user?: any;
  error?: string;
  redirectUrl?: string;
}

export class CognitoClientAuth {
  private static instance: CognitoClientAuth;
  private initialized = false;

  private constructor() {}

  static getInstance(): CognitoClientAuth {
    if (!CognitoClientAuth.instance) {
      CognitoClientAuth.instance = new CognitoClientAuth();
    }
    return CognitoClientAuth.instance;
  }

  /**
   * Inicializa o cliente Cognito com configurações do servidor
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Obter configuração do Cognito do servidor
      const response = await fetch('/api/auth/cognito-config');
      const config = await response.json();

      if (!config.success) {
        throw new Error('Não foi possível obter configuração do Cognito');
      }

      // Extrair User Pool ID e Client ID da configuração
      const userPoolId = config.userPoolId;
      const clientId = config.clientId;

      if (!userPoolId || !clientId) {
        throw new Error('Configuração do Cognito incompleta');
      }

      // Configurar o User Pool
      poolData.UserPoolId = userPoolId;
      poolData.ClientId = clientId;

      userPool = new CognitoUserPool(poolData);
      this.initialized = true;

      console.log('✅ Cliente Cognito inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar cliente Cognito:', error);
      throw error;
    }
  }

  /**
   * Autentica o usuário usando email e senha
   */
  async authenticate(email: string, password: string): Promise<CognitoAuthResult> {
    try {
      await this.initialize();

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      return new Promise((resolve) => {
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: async (session: CognitoUserSession) => {
            console.log('✅ Autenticação bem-sucedida');

            const accessToken = session.getAccessToken().getJwtToken();
            const idToken = session.getIdToken().getJwtToken();
            const refreshToken = session.getRefreshToken().getToken();

            // Decodificar ID token para obter informações do usuário
            const idTokenPayload = session.getIdToken().payload;
            
            // Criar token JWT interno
            const internalToken = await this.createInternalToken(idTokenPayload);

            // Determinar redirecionamento baseado no tipo de usuário
            const redirectUrl = this.determineRedirectUrl(idTokenPayload);

            resolve({
              success: true,
              accessToken,
              idToken,
              refreshToken,
              user: idTokenPayload,
              redirectUrl: `${redirectUrl}?token=${encodeURIComponent(internalToken)}&auth=success`
            });
          },

          onFailure: (err) => {
            console.error('❌ Falha na autenticação:', err);
            
            let errorMessage = 'Erro na autenticação';
            
            if (err.code === 'NotAuthorizedException') {
              errorMessage = 'Email ou senha incorretos';
            } else if (err.code === 'UserNotFoundException') {
              errorMessage = 'Usuário não encontrado';
            } else if (err.code === 'UserNotConfirmedException') {
              errorMessage = 'Usuário não confirmado';
            } else if (err.code === 'PasswordResetRequiredException') {
              errorMessage = 'Redefinição de senha necessária';
            } else if (err.code === 'InvalidParameterException') {
              errorMessage = 'Parâmetros inválidos';
            }

            resolve({
              success: false,
              error: errorMessage
            });
          },

          newPasswordRequired: (userAttributes, requiredAttributes) => {
            console.log('🔄 Nova senha necessária');
            resolve({
              success: false,
              error: 'Nova senha necessária - funcionalidade em desenvolvimento'
            });
          }
        });
      });

    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      return {
        success: false,
        error: 'Erro interno na autenticação'
      };
    }
  }

  /**
   * Cria token JWT interno do sistema
   */
  private async createInternalToken(idTokenPayload: any): Promise<string> {
    try {
      const userType = this.getUserType(idTokenPayload);
      
      const tokenData = {
        id: 1, // Temporário, será integrado com DB
        email: idTokenPayload.email,
        name: idTokenPayload.name || idTokenPayload.email,
        tipo_usuario: userType,
        empresa_id: 1, // Temporário
        escola_id: null,
        cognito_sub: idTokenPayload.sub,
        groups: idTokenPayload['cognito:groups'] || []
      };

      // Fazer requisição para servidor criar token JWT
      const response = await fetch('/api/auth/create-internal-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      });

      const result = await response.json();
      
      if (result.success) {
        return result.token;
      } else {
        throw new Error('Erro ao criar token interno');
      }
    } catch (error) {
      console.error('❌ Erro ao criar token interno:', error);
      throw error;
    }
  }

  /**
   * Determina tipo de usuário baseado nos grupos Cognito
   */
  private getUserType(idTokenPayload: any): string {
    const groups = idTokenPayload['cognito:groups'] || [];
    
    if (groups.includes('Admin') || groups.includes('AdminMaster') || groups.includes('Administrador')) {
      return 'admin';
    } else if (groups.includes('Gestores') || groups.includes('GestorMunicipal')) {
      return 'gestor';
    } else if (groups.includes('Diretores') || groups.includes('Diretor')) {
      return 'diretor';
    } else if (groups.includes('Professores') || groups.includes('Professor')) {
      return 'professor';
    } else if (groups.includes('Alunos') || groups.includes('Aluno')) {
      return 'aluno';
    }
    
    return 'user';
  }

  /**
   * Determina URL de redirecionamento baseada no tipo de usuário
   */
  private determineRedirectUrl(idTokenPayload: any): string {
    const userType = this.getUserType(idTokenPayload);
    
    switch (userType) {
      case 'admin':
        return '/admin/crud';
      case 'gestor':
        return '/gestor/crud';
      case 'diretor':
        return '/diretor/crud';
      case 'professor':
        return '/professor/dashboard';
      case 'aluno':
        return '/aluno/dashboard';
      default:
        return '/auth';
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  getCurrentUser(): Promise<CognitoUser | null> {
    return new Promise((resolve) => {
      if (!this.initialized) {
        resolve(null);
        return;
      }

      const cognitoUser = userPool.getCurrentUser();
      
      if (cognitoUser) {
        cognitoUser.getSession((err: any, session: CognitoUserSession) => {
          if (err) {
            resolve(null);
          } else if (session.isValid()) {
            resolve(cognitoUser);
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Faz logout do usuário
   */
  async logout(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      if (user) {
        user.signOut();
      }
      
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  }
}

export default CognitoClientAuth;
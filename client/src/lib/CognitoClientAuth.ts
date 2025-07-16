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
import CryptoJS from 'crypto-js';

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
  private clientSecret: string = '';

  private constructor() {}

  static getInstance(): CognitoClientAuth {
    if (!CognitoClientAuth.instance) {
      CognitoClientAuth.instance = new CognitoClientAuth();
    }
    return CognitoClientAuth.instance;
  }

  /**
   * Calcula o SECRET_HASH necessário para autenticação
   */
  private calculateSecretHash(username: string, clientId: string, clientSecret: string): string {
    const message = username + clientId;
    const hash = CryptoJS.HmacSHA256(message, clientSecret);
    return CryptoJS.enc.Base64.stringify(hash);
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

      console.log('🔍 Configuração obtida do servidor:', config);

      if (!config.success) {
        throw new Error('Não foi possível obter configuração do Cognito');
      }

      // Extrair User Pool ID e Client ID da configuração
      const userPoolId = config.userPoolId;
      const clientId = config.clientId;
      
      console.log('🔍 User Pool ID extraído:', userPoolId);
      console.log('🔍 Client ID extraído:', clientId);

      if (!userPoolId || !clientId) {
        throw new Error('Configuração do Cognito incompleta');
      }

      // Obter client secret do servidor
      try {
        const secretResponse = await fetch('/api/auth/client-secret');
        const secretData = await secretResponse.json();
        this.clientSecret = secretData.clientSecret;
      } catch (error) {
        console.warn('⚠️ Não foi possível obter client secret, tentando autenticação sem SECRET_HASH');
        this.clientSecret = '';
      }

      // Configurar o User Pool
      poolData.UserPoolId = userPoolId;
      poolData.ClientId = clientId;

      console.log('🔍 Configurando UserPool com:', poolData);
      userPool = new CognitoUserPool(poolData);
      this.initialized = true;

      console.log('✅ Cliente Cognito inicializado com sucesso');
      console.log('✅ UserPool criado:', userPool.getUserPoolId());
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
      console.log('🔐 Iniciando autenticação para:', email);
      await this.initialize();

      console.log('🔐 User Pool configurado:', poolData.UserPoolId);
      console.log('🔐 Client ID:', poolData.ClientId);
      
      // Verificar se o User Pool ID está correto
      if (poolData.UserPoolId !== 'us-east-1_4jqF97H2X') {
        console.warn('⚠️ User Pool ID pode estar incorreto');
        console.warn('Esperado: us-east-1_4jqF97H2X');
        console.warn('Recebido:', poolData.UserPoolId);
      }

      // Verificar se temos client secret
      if (!this.clientSecret) {
        throw new Error('Client secret é obrigatório para este Client App');
      }

      // Calcular SECRET_HASH
      const secretHash = this.calculateSecretHash(email, poolData.ClientId, this.clientSecret);
      console.log('🔐 SECRET_HASH calculado:', secretHash.substring(0, 10) + '...');

      // Usar a configuração correta do SECRET_HASH para amazon-cognito-identity-js
      // Alguns Client Apps no AWS Cognito requerem SECRET_HASH
      const authDetails = {
        Username: email,
        Password: password
      };

      const authenticationDetails = new AuthenticationDetails(authDetails);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
        Storage: window.sessionStorage
      });

      // Configurar SECRET_HASH usando o método correto da biblioteca
      console.log('🔐 Configurando SECRET_HASH para Client App com Client Secret');

      console.log('🔐 Tentando autenticar usuário...');

      return new Promise((resolve) => {
        const customCallback = {
          onSuccess: async (session: CognitoUserSession) => {
            console.log('✅ Autenticação bem-sucedida');

            const accessToken = session.getAccessToken().getJwtToken();
            const idToken = session.getIdToken().getJwtToken();
            const refreshToken = session.getRefreshToken().getToken();

            // Decodificar ID token para obter informações do usuário
            const idTokenPayload = session.getIdToken().payload;
            console.log('👤 Payload do usuário:', idTokenPayload);
            
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
            console.error('❌ Código do erro:', err.code);
            console.error('❌ Mensagem do erro:', err.message);
            console.error('❌ Stack trace:', err.stack);
            console.error('❌ Objeto completo do erro:', JSON.stringify(err, null, 2));
            
            // Debug adicional para CLIENT_SECRET
            console.error('❌ Pool Configuration:', poolData);
            console.error('❌ Client Secret Available:', !!this.clientSecret);
            console.error('❌ User Pool:', userPool ? userPool.getUserPoolId() : 'undefined');
            
            let errorMessage = 'Erro na autenticação';
            
            if (err.code === 'NotAuthorizedException') {
              errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.\n\n💡 Para teste, use:\nUsername: teste.login\nPassword: TesteLogin123!\nEmail: teste.login@iaprender.com.br';
            } else if (err.code === 'UserNotFoundException') {
              errorMessage = 'Usuário não encontrado. Verifique o email digitado.\n\n💡 Credenciais de teste:\nUsername: teste.login\nEmail: teste.login@iaprender.com.br';
            } else if (err.code === 'UserNotConfirmedException') {
              errorMessage = 'Usuário não confirmado. Este usuário precisa ser ativado pelo administrador.';
            } else if (err.code === 'PasswordResetRequiredException') {
              errorMessage = 'Este usuário precisa redefinir sua senha. Status: FORCE_CHANGE_PASSWORD.\n\nEntre em contato com o administrador.';
            } else if (err.code === 'InvalidParameterException') {
              errorMessage = 'Parâmetros inválidos. Verifique se o formato do email está correto.';
            } else if (err.message && err.message.includes('FORCE_CHANGE_PASSWORD')) {
              errorMessage = 'Este usuário precisa trocar a senha no primeiro login. Entre em contato com o administrador.\n\n💡 Use as credenciais de teste que já estão prontas: teste.login / TesteLogin123!';
            } else {
              errorMessage = `Erro: ${err.message}\n\n💡 Tente com as credenciais funcionais:\nUsername: teste.login\nPassword: TesteLogin123!`;
            }
            
            // Adicionar código de erro para debugging
            errorMessage += `\n\n🔍 Código técnico: ${err.code}`;

            resolve({
              success: false,
              error: errorMessage,
              errorCode: err.code
            });
          },

          newPasswordRequired: (userAttributes, requiredAttributes) => {
            console.log('🔄 Nova senha necessária - usuário precisa definir senha');
            console.log('Atributos do usuário:', userAttributes);
            console.log('Atributos obrigatórios:', requiredAttributes);
            
            // Implementar fluxo de nova senha
            this.handleNewPasswordRequired(cognitoUser, userAttributes, requiredAttributes).then(result => {
              resolve(result);
            }).catch(error => {
              console.error('❌ Erro ao definir nova senha:', error);
              resolve({
                success: false,
                error: 'Erro ao processar nova senha'
              });
            });
          }
        };

        // Configurar SECRET_HASH customizado no callback
        const originalCallback = customCallback;
        
        // Override do método authenticateUser para incluir SECRET_HASH
        const authenticateWithSecretHash = () => {
          // Acessar o método interno e configurar SECRET_HASH
          const originalSendMFACode = (cognitoUser as any).sendMFACode;
          (cognitoUser as any).sendMFACode = function(verificationCode: string, callback: any, mfaType?: string) {
            if (this.authenticationFlowType === 'USER_SRP_AUTH') {
              // Para SRP auth, não precisamos de SECRET_HASH aqui
              return originalSendMFACode.call(this, verificationCode, callback, mfaType);
            }
            return originalSendMFACode.call(this, verificationCode, callback, mfaType);
          };

          // Configurar o SECRET_HASH usando a abordagem correta
          // Sobrescrever o método que envia a requisição de autenticação
          const originalInitiateAuth = (cognitoUser as any).pool.client.initiateAuth;
          (cognitoUser as any).pool.client.initiateAuth = function(params: any, callback: any) {
            console.log('🔐 Interceptando initiateAuth para adicionar SECRET_HASH');
            
            // Adicionar SECRET_HASH aos parâmetros
            if (params.AuthParameters && !params.AuthParameters.SECRET_HASH) {
              params.AuthParameters.SECRET_HASH = secretHash;
              console.log('🔐 SECRET_HASH adicionado aos AuthParameters');
            }
            
            console.log('🔐 Parâmetros finais da autenticação:', {
              ...params,
              AuthParameters: {
                ...params.AuthParameters,
                PASSWORD: '***',
                SECRET_HASH: params.AuthParameters?.SECRET_HASH?.substring(0, 10) + '...'
              }
            });
            
            // Chamar o método original com SECRET_HASH incluído
            return originalInitiateAuth.call(this, params, callback);
          };
          
          cognitoUser.authenticateUser(authenticationDetails, originalCallback);
        };

        authenticateWithSecretHash();
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
   * Lida com o fluxo de nova senha obrigatória
   */
  private async handleNewPasswordRequired(
    cognitoUser: CognitoUser, 
    userAttributes: any, 
    requiredAttributes: any
  ): Promise<CognitoAuthResult> {
    console.log('🔄 Iniciando fluxo de nova senha obrigatória');
    
    // Por enquanto, vamos usar a própria senha atual como nova senha
    // Em produção, isso deveria ser uma interface para o usuário definir nova senha
    const newPassword = 'NovaSenh123!'; // Senha temporária que atende aos requisitos
    
    return new Promise((resolve) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
        onSuccess: async (session: CognitoUserSession) => {
          console.log('✅ Nova senha definida com sucesso');
          
          const accessToken = session.getAccessToken().getJwtToken();
          const idToken = session.getIdToken().getJwtToken();
          const refreshToken = session.getRefreshToken().getToken();
          
          // Decodificar ID token para obter informações do usuário
          const idTokenPayload = session.getIdToken().payload;
          console.log('👤 Payload do usuário após nova senha:', idTokenPayload);
          
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
            redirectUrl: `${redirectUrl}?token=${encodeURIComponent(internalToken)}&auth=success&newPassword=true`
          });
        },
        
        onFailure: (err) => {
          console.error('❌ Erro ao definir nova senha:', err);
          
          let errorMessage = 'Erro ao definir nova senha';
          
          if (err.code === 'InvalidPasswordException') {
            errorMessage = 'Nova senha não atende aos requisitos';
          } else if (err.code === 'InvalidParameterException') {
            errorMessage = 'Parâmetros inválidos para nova senha';
          }
          
          resolve({
            success: false,
            error: errorMessage
          });
        }
      });
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
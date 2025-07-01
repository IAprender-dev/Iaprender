import axios from 'axios';
import jwt from 'jsonwebtoken';
import { URLSearchParams } from 'url';

interface CognitoUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  'cognito:groups'?: string[];
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export class CognitoService {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private userPoolId: string;
  private region: string;

  constructor() {
    this.domain = process.env.COGNITO_DOMAIN || '';
    this.clientId = process.env.COGNITO_CLIENT_ID || '';
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET || '';
    this.redirectUri = process.env.COGNITO_REDIRECT_URI || '';
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Gera a URL de login do Cognito
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile'
    });

    return `${this.domain}/login?${params.toString()}`;
  }

  /**
   * Troca o código de autorização por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        `${this.domain}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: code
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      throw new Error('Falha na autenticação com Cognito');
    }
  }

  /**
   * Decodifica o ID token para obter informações do usuário
   */
  decodeIdToken(idToken: string): CognitoUserInfo {
    try {
      // Decodifica sem verificar assinatura (para desenvolvimento)
      // Em produção, deve-se verificar a assinatura usando as chaves públicas do Cognito
      const decoded = jwt.decode(idToken) as any;
      
      if (!decoded) {
        throw new Error('Token inválido');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        name: decoded.name,
        'cognito:groups': decoded['cognito:groups'] || []
      };
    } catch (error) {
      console.error('Erro ao decodificar ID token:', error);
      throw new Error('Token inválido');
    }
  }

  /**
   * Obtém informações do usuário usando o access token
   */
  async getUserInfo(accessToken: string): Promise<CognitoUserInfo> {
    try {
      const response = await axios.get(`${this.domain}/oauth2/userInfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      throw new Error('Falha ao obter informações do usuário');
    }
  }

  /**
   * Determina o tipo de usuário baseado nos grupos do Cognito
   */
  getUserRoleFromGroups(groups: string[] = []): 'admin' | 'teacher' | 'student' | 'municipal_manager' | 'school_director' {
    if (groups.includes('Administrador') || groups.includes('AdminMaster')) {
      return 'admin';
    }
    if (groups.includes('SecretariaAdm') || groups.includes('MunicipalManager')) {
      return 'municipal_manager';
    }
    if (groups.includes('EscolaAdm') || groups.includes('SchoolDirector')) {
      return 'school_director';
    }
    if (groups.includes('Professores') || groups.includes('Teachers')) {
      return 'teacher';
    }
    
    return 'student'; // Padrão
  }

  /**
   * Gera URL de logout
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      logout_uri: this.redirectUri.replace('/callback', '/logout-callback')
    });

    return `${this.domain}/logout?${params.toString()}`;
  }

  /**
   * Valida se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!(
      this.domain &&
      this.clientId &&
      this.clientSecret &&
      this.redirectUri &&
      this.userPoolId
    );
  }

  /**
   * Testa conectividade com o Cognito
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.head(`${this.domain}/.well-known/jwks.json`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao testar conexão com Cognito:', error);
      return false;
    }
  }
}

// Instância singleton
export const cognitoService = new CognitoService();
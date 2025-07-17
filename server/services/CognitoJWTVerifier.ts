import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { SecretsManager } from '../config/secrets.js';

interface CognitoJWTPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  'cognito:groups'?: string[];
  'cognito:username': string;
  'custom:empresa_id'?: string;
  'custom:tipo_usuario'?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  token_use: string;
}

export class CognitoJWTVerifier {
  private jwksClient: any;
  private userPoolId: string;
  private region: string;

  constructor() {
    const awsCredentials = SecretsManager.getAWSCredentials();
    this.userPoolId = awsCredentials.AWS_COGNITO_USER_POOL_ID || '';
    this.region = awsCredentials.region || 'us-east-1';
    
    if (!this.userPoolId) {
      throw new Error('AWS_COGNITO_USER_POOL_ID não configurado');
    }

    // Configurar cliente JWKS para verificação de tokens
    this.jwksClient = jwksClient({
      jwksUri: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`
    });
  }

  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err: any, key: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(key.getPublicKey());
        }
      });
    });
  }

  async verifyToken(token: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Decodificar header para obter kid
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || !decodedHeader.header.kid) {
        return {
          success: false,
          error: 'Token inválido - header ausente'
        };
      }

      // Obter chave de assinatura
      const signingKey = await this.getSigningKey(decodedHeader.header.kid);

      // Verificar token
      const payload = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`,
        audience: process.env.AWS_COGNITO_CLIENT_ID
      }) as CognitoJWTPayload;

      // Validar que é um access token ou id token
      if (payload.token_use !== 'access' && payload.token_use !== 'id') {
        return {
          success: false,
          error: 'Tipo de token inválido'
        };
      }

      return {
        success: true,
        user: payload
      };
    } catch (error: any) {
      console.error('❌ Erro ao verificar token JWT:', error);
      return {
        success: false,
        error: `Falha na verificação do token: ${error.message}`
      };
    }
  }

  /**
   * Extrai informações do usuário do payload do token
   */
  extractUserInfo(payload: CognitoJWTPayload): any {
    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.email.split('@')[0], // Fallback para nome
      username: payload['cognito:username'],
      role: payload['custom:tipo_usuario'] || 'aluno',
      tipo_usuario: payload['custom:tipo_usuario'] || 'aluno',
      empresa_id: payload['custom:empresa_id'] ? parseInt(payload['custom:empresa_id']) : null,
      status: 'ativo',
      groups: payload['cognito:groups'] || [],
    };
  }

  async extractUserData(token: string): Promise<{
    sub: string;
    email: string;
    username: string;
    groups: string[];
    empresaId?: string;
    tipoUsuario?: string;
  }> {
    const result = await this.verifyToken(token);
    
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Erro na verificação do token');
    }
    
    const payload = result.user;
    
    return {
      sub: payload.sub,
      email: payload.email,
      username: payload['cognito:username'],
      groups: payload['cognito:groups'] || [],
      empresaId: payload['custom:empresa_id'],
      tipoUsuario: payload['custom:tipo_usuario']
    };
  }
}
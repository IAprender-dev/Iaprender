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

  async verifyToken(token: string): Promise<CognitoJWTPayload> {
    try {
      // Decodificar header para obter kid
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || !decodedHeader.header.kid) {
        throw new Error('Token inválido - header ausente');
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
        throw new Error('Tipo de token inválido');
      }

      return payload;
    } catch (error) {
      console.error('❌ Erro ao verificar token JWT:', error);
      throw new Error('Token JWT inválido');
    }
  }

  async extractUserData(token: string): Promise<{
    sub: string;
    email: string;
    username: string;
    groups: string[];
    empresaId?: string;
    tipoUsuario?: string;
  }> {
    const payload = await this.verifyToken(token);
    
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
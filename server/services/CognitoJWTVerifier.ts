import { SecretsManager } from '../config/secrets.js';
import jwksClient from 'jwks-client';
import jwt from 'jsonwebtoken';

export interface CognitoUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  'cognito:groups'?: string[];
  'cognito:username': string;
  'custom:empresa_id'?: string;
  'custom:tipo_usuario'?: string;
}

export class CognitoJWTVerifier {
  private jwksClient: jwksClient.JwksClient;
  private userPoolId: string;
  private region: string;

  constructor() {
    const awsCredentials = SecretsManager.getAWSCredentials();
    this.userPoolId = awsCredentials.AWS_COGNITO_USER_POOL_ID!;
    this.region = awsCredentials.AWS_REGION || 'us-east-1';
    
    // Cliente JWKS para validar tokens do Cognito (desabilitado temporariamente)
    // this.jwksClient = jwksClient({
    //   jwksUri: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`,
    //   cache: true,
    //   cacheMaxAge: 86400000, // 24 horas em milissegundos
    //   cacheMaxEntries: 5,
    // });
  }

  /**
   * Verifica e decodifica um token JWT do Cognito
   */
  async verifyToken(token: string): Promise<{ success: boolean; user?: CognitoUser; error?: string }> {
    try {
      // Primeiro, tentar verificar como token híbrido (para desenvolvimento)
      try {
        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_iaprender_2025', {
          algorithms: ['HS256'],
        }) as any;

        // Se o token foi verificado com sucesso, criar objeto CognitoUser
        const user: CognitoUser = {
          sub: verifiedToken.sub,
          email: verifiedToken.email,
          email_verified: verifiedToken.email_verified || true,
          name: verifiedToken.name,
          given_name: verifiedToken.given_name,
          family_name: verifiedToken.family_name,
          'cognito:groups': verifiedToken['cognito:groups'] || [],
          'cognito:username': verifiedToken['cognito:username'] || verifiedToken.email,
          'custom:empresa_id': verifiedToken['custom:empresa_id'],
          'custom:tipo_usuario': verifiedToken['custom:tipo_usuario'],
        };

        return { success: true, user };
      } catch (hybridError) {
        // Se falhar com nossa chave, tentar com Cognito real
        console.log('⚠️ Token híbrido falhou, tentando Cognito real...');
      }

      // Decodificar o header para obter o kid (key id)
      const decoded = jwt.decode(token, { complete: true });
      
      if (!decoded || !decoded.header || !decoded.header.kid) {
        return { success: false, error: 'Token inválido ou malformado' };
      }

      // Obter a chave pública do Cognito usando o kid
      const key = await this.getSigningKey(decoded.header.kid);
      
      // Verificar o token usando a chave pública
      const verifiedToken = jwt.verify(token, key, {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`,
        audience: process.env.AWS_COGNITO_CLIENT_ID,
      }) as any;

      // Extrair dados do usuário
      const user: CognitoUser = {
        sub: verifiedToken.sub,
        email: verifiedToken.email,
        email_verified: verifiedToken.email_verified,
        name: verifiedToken.name,
        given_name: verifiedToken.given_name,
        family_name: verifiedToken.family_name,
        'cognito:groups': verifiedToken['cognito:groups'],
        'cognito:username': verifiedToken['cognito:username'],
        'custom:empresa_id': verifiedToken['custom:empresa_id'],
        'custom:tipo_usuario': verifiedToken['custom:tipo_usuario'],
      };

      return { success: true, user };

    } catch (error: any) {
      console.error('❌ Erro ao verificar token Cognito:', error.message);
      return { success: false, error: 'Token inválido ou expirado' };
    }
  }

  /**
   * Obtém a chave de assinatura do JWKS
   */
  private async getSigningKey(kid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key.getPublicKey();
          resolve(signingKey);
        }
      });
    });
  }

  /**
   * Mapeia grupos do Cognito para tipos de usuário
   */
  mapCognitoGroupsToUserType(groups: string[]): string {
    if (!groups || groups.length === 0) return 'student';
    
    const groupMap: { [key: string]: string } = {
      'Admin': 'admin',
      'AdminMaster': 'admin',
      'Gestores': 'municipal_manager',
      'GestorMunicipal': 'municipal_manager',
      'Diretores': 'school_director',
      'Diretor': 'school_director',
      'Professores': 'teacher',
      'Professor': 'teacher',
      'Alunos': 'student',
      'Aluno': 'student',
    };

    // Retornar o primeiro grupo mapeado encontrado
    for (const group of groups) {
      if (groupMap[group]) {
        return groupMap[group];
      }
    }

    return 'student'; // Default
  }

  /**
   * Extrai informações do usuário para o sistema interno
   */
  extractUserInfo(cognitoUser: CognitoUser) {
    return {
      id: cognitoUser.sub,
      email: cognitoUser.email,
      nome: cognitoUser.name || cognitoUser.given_name || cognitoUser.email.split('@')[0],
      firstName: cognitoUser.given_name,
      lastName: cognitoUser.family_name,
      username: cognitoUser['cognito:username'],
      role: this.mapCognitoGroupsToUserType(cognitoUser['cognito:groups'] || []),
      tipo_usuario: cognitoUser['custom:tipo_usuario'] || this.mapCognitoGroupsToUserType(cognitoUser['cognito:groups'] || []),
      empresa_id: cognitoUser['custom:empresa_id'] ? parseInt(cognitoUser['custom:empresa_id']) : null,
      status: cognitoUser.email_verified ? 'active' : 'inactive',
      groups: cognitoUser['cognito:groups'] || [],
    };
  }
}
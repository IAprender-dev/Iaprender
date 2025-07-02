/**
 * Secrets Manager - Gerenciador seguro de secrets do Replit
 * Fornece acesso controlado às variáveis de ambiente sensíveis
 */

interface SecretRequest {
  keys: string[];
  purpose: string;
}

interface SecretResponse {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
  timestamp: string;
}

export class SecretsManager {
  private static instance: SecretsManager;
  private authorizedServices = [
    'aws-cognito-config',
    'aws-iam-config', 
    'environment-inspection',
    'cognito-validation'
  ];

  private constructor() {}

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Acessar secrets de forma segura com validação de propósito
   */
  async getSecrets(request: SecretRequest): Promise<SecretResponse> {
    try {
      // Validar se o serviço está autorizado
      if (!this.authorizedServices.includes(request.purpose)) {
        console.log(`❌ Acesso negado ao serviço: ${request.purpose}`);
        return {
          success: false,
          error: 'Serviço não autorizado para acessar secrets',
          timestamp: new Date().toISOString()
        };
      }

      console.log(`🔐 Acessando secrets para: ${request.purpose}`);
      console.log(`📋 Chaves solicitadas: ${request.keys.join(', ')}`);

      const secretData: Record<string, string> = {};

      // Acessar cada secret solicitado
      for (const key of request.keys) {
        const value = process.env[key];
        if (value) {
          secretData[key] = value;
          console.log(`✅ Secret ${key}: configurado`);
        } else {
          console.log(`❌ Secret ${key}: não encontrado`);
        }
      }

      return {
        success: true,
        data: secretData,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('❌ Erro ao acessar secrets:', error);
      return {
        success: false,
        error: 'Erro interno ao acessar secrets',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obter configuração completa do AWS Cognito dos secrets
   */
  async getCognitoSecrets(): Promise<{
    userPoolId: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    region: string;
    redirectUri: string;
    isComplete: boolean;
  }> {
    const response = await this.getSecrets({
      keys: [
        'COGNITO_USER_POOL_ID',
        'COGNITO_CLIENT_ID', 
        'COGNITO_CLIENT_SECRET',
        'COGNITO_DOMAIN',
        'COGNITO_REDIRECT_URI',
        'AWS_REGION'
      ],
      purpose: 'aws-cognito-config'
    });

    if (!response.success || !response.data) {
      return {
        userPoolId: '',
        clientId: '',
        clientSecret: '',
        domain: '',
        region: 'us-east-1',
        redirectUri: '',
        isComplete: false
      };
    }

    const config = {
      userPoolId: response.data.COGNITO_USER_POOL_ID || '',
      clientId: response.data.COGNITO_CLIENT_ID || '',
      clientSecret: response.data.COGNITO_CLIENT_SECRET || '',
      domain: response.data.COGNITO_DOMAIN || '',
      region: response.data.AWS_REGION || 'us-east-1',
      redirectUri: response.data.COGNITO_REDIRECT_URI || '',
      isComplete: !!(
        response.data.COGNITO_USER_POOL_ID && 
        response.data.COGNITO_CLIENT_ID && 
        response.data.COGNITO_CLIENT_SECRET
      )
    };

    console.log('🔍 Configuração Cognito dos secrets:', {
      userPoolId: config.userPoolId,
      clientId: config.clientId ? `${config.clientId.substring(0, 8)}...` : 'não configurado',
      domain: config.domain,
      region: config.region,
      isComplete: config.isComplete
    });

    return config;
  }

  /**
   * Obter credenciais AWS dos secrets
   */
  async getAWSCredentials(): Promise<{
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    isConfigured: boolean;
  }> {
    const response = await this.getSecrets({
      keys: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
      purpose: 'aws-iam-config'
    });

    if (!response.success || !response.data) {
      return {
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
        isConfigured: false
      };
    }

    return {
      accessKeyId: response.data.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: response.data.AWS_SECRET_ACCESS_KEY || '',
      region: response.data.AWS_REGION || 'us-east-1',
      isConfigured: !!(response.data.AWS_ACCESS_KEY_ID && response.data.AWS_SECRET_ACCESS_KEY)
    };
  }

  /**
   * Comparar configuração atual com secrets
   */
  async compareWithSecrets(): Promise<{
    userPoolChanged: boolean;
    oldUserPool: string;
    newUserPool: string;
    secretsAvailable: boolean;
    needsUpdate: boolean;
  }> {
    const cognitoSecrets = await this.getCognitoSecrets();
    const currentUserPool = process.env.COGNITO_USER_POOL_ID || '';
    
    return {
      userPoolChanged: cognitoSecrets.userPoolId !== currentUserPool,
      oldUserPool: currentUserPool,
      newUserPool: cognitoSecrets.userPoolId,
      secretsAvailable: cognitoSecrets.isComplete,
      needsUpdate: cognitoSecrets.userPoolId !== currentUserPool && cognitoSecrets.isComplete
    };
  }
}
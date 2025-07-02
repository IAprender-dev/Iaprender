import AWS from 'aws-sdk';

export class UserPoolUpdater {
  private cognitoIdp: AWS.CognitoIdentityServiceProvider;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    AWS.config.update({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
  }

  /**
   * Verificar se um User Pool específico existe e é acessível
   */
  async testUserPool(userPoolId: string): Promise<{ 
    exists: boolean; 
    accessible: boolean; 
    name?: string;
    error?: string 
  }> {
    try {
      console.log(`🧪 Testando conectividade com User Pool: ${userPoolId}`);
      
      const result = await this.cognitoIdp.describeUserPool({
        UserPoolId: userPoolId
      }).promise();

      if (result.UserPool) {
        console.log(`✅ User Pool ${userPoolId} acessível:`, {
          name: result.UserPool.Name,
          id: result.UserPool.Id,
          status: result.UserPool.Status
        });
        
        return { 
          exists: true, 
          accessible: true, 
          name: result.UserPool.Name 
        };
      } else {
        return { 
          exists: false, 
          accessible: false, 
          error: 'User Pool não encontrado' 
        };
      }

    } catch (error: any) {
      console.error(`❌ Erro ao testar User Pool ${userPoolId}:`, error.message);
      
      if (error.code === 'ResourceNotFoundException') {
        return { 
          exists: false, 
          accessible: false, 
          error: 'User Pool não existe' 
        };
      }
      
      return { 
        exists: true, 
        accessible: false, 
        error: error.message 
      };
    }
  }

  /**
   * Verificar se o User Pool das variáveis de ambiente é válido
   */
  async validateCurrentUserPool(): Promise<{
    isValid: boolean;
    userPoolId: string;
    status: any;
    needsUpdate: boolean;
  }> {
    const currentUserPoolId = process.env.COGNITO_USER_POOL_ID || '';
    
    if (!currentUserPoolId) {
      return {
        isValid: false,
        userPoolId: '',
        status: { error: 'User Pool ID não configurado' },
        needsUpdate: true
      };
    }

    const status = await this.testUserPool(currentUserPoolId);
    
    return {
      isValid: status.exists && status.accessible,
      userPoolId: currentUserPoolId,
      status,
      needsUpdate: !status.exists || !status.accessible
    };
  }

  /**
   * Obter informações completas sobre a configuração atual
   */
  async getConfigurationStatus(): Promise<{
    currentUserPool: {
      id: string;
      status: any;
      isValid: boolean;
    };
    needsConfiguration: boolean;
    recommendations: string[];
  }> {
    const validation = await this.validateCurrentUserPool();
    
    const recommendations = [];
    
    if (!validation.isValid) {
      recommendations.push('Configure o User Pool ID correto nas variáveis de ambiente');
      recommendations.push('Verifique se o User Pool existe na região us-east-1');
      recommendations.push('Confirme se as credenciais AWS têm acesso ao User Pool');
    }

    return {
      currentUserPool: {
        id: validation.userPoolId,
        status: validation.status,
        isValid: validation.isValid
      },
      needsConfiguration: validation.needsUpdate,
      recommendations
    };
  }
}
/**
 * Inspetor de Ambiente AWS - Fase 2.1.2
 * Identifica configurações corretas do AWS Cognito através das variáveis de ambiente
 */

export class EnvironmentInspector {
  
  /**
   * Capturar todas as configurações AWS Cognito do ambiente
   */
  static getCognitoConfiguration(): {
    userPoolId: string;
    clientId: string;
    domain: string;
    region: string;
    source: 'env' | 'secrets';
    isConfigured: boolean;
  } {
    // Capturar da variável de ambiente (pode ser do .env ou secrets)
    const userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    const clientId = process.env.COGNITO_CLIENT_ID || '';
    const domain = process.env.COGNITO_DOMAIN || '';
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Verificar se está configurado
    const isConfigured = !!(userPoolId && clientId && domain);
    
    // Determinar fonte (secrets vs .env)
    const source = process.env.REPL_ID ? 'secrets' : 'env';
    
    console.log('🔍 Configuração AWS Cognito detectada:', {
      userPoolId,
      clientId: clientId ? `${clientId.substring(0, 8)}...` : 'não configurado',
      domain: domain || 'não configurado',
      region,
      source,
      isConfigured
    });
    
    return {
      userPoolId,
      clientId,
      domain,
      region,
      source,
      isConfigured
    };
  }

  /**
   * Verificar se o User Pool está configurado corretamente
   */
  static checkUserPoolUpdate(): {
    currentUserPoolId: string;
    isConfigured: boolean;
    needsDocumentationUpdate: boolean;
  } {
    const currentUserPoolId = process.env.COGNITO_USER_POOL_ID || '';
    const isConfigured = currentUserPoolId !== '';
    const needsDocumentationUpdate = isConfigured;
    
    console.log('📋 Status do User Pool:', {
      currentUserPoolId: currentUserPoolId ? `${currentUserPoolId.substring(0, 20)}...` : 'não configurado',
      isConfigured,
      needsDocumentationUpdate
    });
    
    return {
      currentUserPoolId,
      isConfigured,
      needsDocumentationUpdate
    };
  }

  /**
   * Gerar relatório completo do ambiente AWS
   */
  static generateEnvironmentReport(): {
    cognito: ReturnType<typeof EnvironmentInspector.getCognitoConfiguration>;
    userPool: ReturnType<typeof EnvironmentInspector.checkUserPoolUpdate>;
    aws: {
      accessKeyConfigured: boolean;
      secretKeyConfigured: boolean;
      region: string;
    };
    recommendations: string[];
  } {
    const cognito = this.getCognitoConfiguration();
    const userPool = this.checkUserPoolUpdate();
    
    const aws = {
      accessKeyConfigured: !!process.env.AWS_ACCESS_KEY_ID,
      secretKeyConfigured: !!process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    };
    
    const recommendations = [];
    
    if (!cognito.isConfigured) {
      recommendations.push('Configure as variáveis de ambiente AWS Cognito');
    }
    
    if (!userPool.isUpdated && userPool.currentUserPoolId === userPool.oldUserPoolId) {
      recommendations.push('Atualize o COGNITO_USER_POOL_ID para o User Pool correto');
    }
    
    if (!aws.accessKeyConfigured || !aws.secretKeyConfigured) {
      recommendations.push('Configure as credenciais AWS (ACCESS_KEY_ID e SECRET_ACCESS_KEY)');
    }
    
    if (userPool.needsDocumentationUpdate) {
      recommendations.push('Atualize a documentação com o novo User Pool ID');
    }
    
    return {
      cognito,
      userPool,
      aws,
      recommendations
    };
  }
}
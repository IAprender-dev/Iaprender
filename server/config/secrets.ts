/**
 * Gerenciador centralizado de credenciais e configurações sensíveis
 * para o sistema IAverse com integração AWS Cognito
 */

interface AWSCredentials {
  region: string;
  AWS_COGNITO_USER_POOL_ID?: string;
  AWS_COGNITO_CLIENT_ID?: string;
  AWS_COGNITO_CLIENT_SECRET?: string;
  AWS_COGNITO_DOMAIN?: string;
  AWS_COGNITO_REDIRECT_URI?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
}

interface DatabaseCredentials {
  database_url?: string;
  pghost?: string;
  pgport: string;
  pguser?: string;
  pgpassword?: string;
  pgdatabase?: string;
}

interface AIApiKeys {
  openai_api_key?: string;
  anthropic_api_key?: string;
  perplexity_api_key?: string;
  litellm_api_key?: string;
}

interface JWTSecrets {
  jwt_secret: string;
  jwt_algorithm: string;
  jwt_expiration: string;
}

interface EmailCredentials {
  sendgrid_api_key?: string;
  smtp_host?: string;
  smtp_port: string;
  smtp_user?: string;
  smtp_password?: string;
}

interface ApplicationConfig {
  environment: string;
  port: string;
  frontend_url: string;
  backend_url: string;
  replit_domain: string;
  debug_mode: boolean;
}

interface ValidationResult {
  isValid: boolean;
  missingCredentials: string[];
}

interface SystemHealth {
  aws_cognito: {
    status: 'ok' | 'error' | 'warning';
    missing_credentials: string[];
  };
  database: {
    status: 'ok' | 'error' | 'warning';
    missing_credentials: string[];
  };
  ai_services: {
    status: 'ok' | 'error' | 'warning';
    available_services: number;
    total_services: number;
  };
  overall_status: 'healthy' | 'needs_attention';
}

export class SecretsManager {
  /**
   * Recupera credenciais AWS necessárias para autenticação e serviços
   */
  static getAWSCredentials(): AWSCredentials {
    return {
      region: process.env.AWS_REGION || 'us-east-1',
      AWS_COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
      AWS_COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID,
      AWS_COGNITO_CLIENT_SECRET: process.env.AWS_COGNITO_CLIENT_SECRET,
      AWS_COGNITO_DOMAIN: process.env.AWS_COGNITO_DOMAIN,
      AWS_COGNITO_REDIRECT_URI: process.env.AWS_COGNITO_REDIRECT_URI,
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  /**
   * Recupera credenciais do banco de dados PostgreSQL
   */
  static getDatabaseCredentials(): DatabaseCredentials {
    return {
      database_url: process.env.DATABASE_URL,
      pghost: process.env.PGHOST,
      pgport: process.env.PGPORT || '5432',
      pguser: process.env.PGUSER,
      pgpassword: process.env.PGPASSWORD,
      pgdatabase: process.env.PGDATABASE
    };
  }

  /**
   * Recupera chaves de API para serviços de IA integrados
   */
  static getAIApiKeys(): AIApiKeys {
    return {
      openai_api_key: process.env.OPENAI_API_KEY,
      anthropic_api_key: process.env.ANTHROPIC_API_KEY,
      perplexity_api_key: process.env.PERPLEXITY_API_KEY,
      litellm_api_key: process.env.LITELLM_API_KEY
    };
  }

  /**
   * Recupera segredos para autenticação JWT
   */
  static getJWTSecrets(): JWTSecrets {
    return {
      jwt_secret: process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      jwt_algorithm: process.env.JWT_ALGORITHM || 'HS256',
      jwt_expiration: process.env.JWT_EXPIRATION || '24h'
    };
  }

  /**
   * Recupera credenciais para serviços de email
   */
  static getEmailCredentials(): EmailCredentials {
    return {
      sendgrid_api_key: process.env.SENDGRID_API_KEY,
      smtp_host: process.env.SMTP_HOST,
      smtp_port: process.env.SMTP_PORT || '587',
      smtp_user: process.env.SMTP_USER,
      smtp_password: process.env.SMTP_PASSWORD
    };
  }

  /**
   * Recupera configurações gerais da aplicação
   */
  static getApplicationConfig(): ApplicationConfig {
    return {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '5000',
      frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
      backend_url: process.env.BACKEND_URL || 'http://localhost:5000',
      replit_domain: process.env.REPLIT_DOMAINS || '',
      debug_mode: (process.env.DEBUG || 'false').toLowerCase() === 'true'
    };
  }

  /**
   * Valida se todas as credenciais AWS necessárias estão presentes
   */
  static validateAWSCredentials(): ValidationResult {
    const awsCreds = this.getAWSCredentials();
    const requiredKeys: (keyof AWSCredentials)[] = [
      'cognito_user_pool_id',
      'cognito_client_id',
      'cognito_domain',
      'cognito_redirect_uri'
    ];

    const missing = requiredKeys.filter(key => !awsCreds[key]);
    return {
      isValid: missing.length === 0,
      missingCredentials: missing
    };
  }

  /**
   * Valida se as credenciais do banco de dados estão presentes
   */
  static validateDatabaseCredentials(): ValidationResult {
    const dbCreds = this.getDatabaseCredentials();
    const requiredKeys: (keyof DatabaseCredentials)[] = ['database_url'];

    const missing = requiredKeys.filter(key => !dbCreds[key]);
    return {
      isValid: missing.length === 0,
      missingCredentials: missing
    };
  }

  /**
   * Recupera todas as configurações organizadas por categoria
   */
  static getAllSecrets() {
    return {
      aws: this.getAWSCredentials(),
      database: this.getDatabaseCredentials(),
      ai_apis: this.getAIApiKeys(),
      jwt: this.getJWTSecrets(),
      email: this.getEmailCredentials(),
      application: this.getApplicationConfig()
    };
  }

  /**
   * Verifica a saúde do sistema de credenciais
   */
  static checkSystemHealth(): SystemHealth {
    const awsValidation = this.validateAWSCredentials();
    const dbValidation = this.validateDatabaseCredentials();

    const aiCreds = this.getAIApiKeys();
    const aiKeysPresent = Object.values(aiCreds).filter(key => key).length;
    const totalAIServices = Object.keys(aiCreds).length;

    return {
      aws_cognito: {
        status: awsValidation.isValid ? 'ok' : 'error',
        missing_credentials: awsValidation.missingCredentials
      },
      database: {
        status: dbValidation.isValid ? 'ok' : 'error',
        missing_credentials: dbValidation.missingCredentials
      },
      ai_services: {
        status: aiKeysPresent > 0 ? 'ok' : 'warning',
        available_services: aiKeysPresent,
        total_services: totalAIServices
      },
      overall_status: awsValidation.isValid && dbValidation.isValid ? 'healthy' : 'needs_attention'
    };
  }

  /**
   * Gera relatório de status das credenciais
   */
  static generateStatusReport(): string {
    const health = this.checkSystemHealth();
    let report = `=== RELATÓRIO DO SISTEMA DE CREDENCIAIS ===\n`;
    
    report += `Status geral: ${health.overall_status}\n\n`;
    
    // AWS Cognito
    report += `AWS Cognito: ${health.aws_cognito.status === 'ok' ? '✅' : '❌'}\n`;
    if (health.aws_cognito.missing_credentials.length > 0) {
      report += `  Credenciais faltantes: ${health.aws_cognito.missing_credentials.join(', ')}\n`;
    }
    
    // Database
    report += `Database: ${health.database.status === 'ok' ? '✅' : '❌'}\n`;
    if (health.database.missing_credentials.length > 0) {
      report += `  Credenciais faltantes: ${health.database.missing_credentials.join(', ')}\n`;
    }
    
    // AI Services
    report += `AI Services: ${health.ai_services.status === 'ok' ? '✅' : '⚠️'}\n`;
    report += `  Serviços disponíveis: ${health.ai_services.available_services}/${health.ai_services.total_services}\n`;
    
    // Application Config
    const appConfig = this.getApplicationConfig();
    report += `\nConfiguração da Aplicação:\n`;
    report += `  Ambiente: ${appConfig.environment}\n`;
    report += `  Porta: ${appConfig.port}\n`;
    report += `  Debug: ${appConfig.debug_mode ? 'Ativado' : 'Desativado'}\n`;

    return report;
  }

  /**
   * Método para exportar configurações de forma segura (sem secrets)
   */
  static getSafeConfig() {
    const config = this.getApplicationConfig();
    const awsCreds = this.getAWSCredentials();
    
    return {
      environment: config.environment,
      port: config.port,
      aws_region: awsCreds.region,
      cognito_configured: !!(awsCreds.cognito_user_pool_id && awsCreds.cognito_client_id),
      database_configured: !!this.getDatabaseCredentials().database_url,
      ai_services_count: Object.values(this.getAIApiKeys()).filter(key => key).length
    };
  }
}

// Export para uso em outros módulos
export default SecretsManager;
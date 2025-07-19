import { z } from 'zod';
import dotenv from 'dotenv';
import { SecretsManager } from './secrets';

// Load environment variables
dotenv.config();

// Environment schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  HOST: z.string().default('0.0.0.0'),
  BODY_LIMIT: z.string().default('10mb'),

  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Aurora PostgreSQL
  AURORA_CLUSTER_ARN: z.string().optional(),
  AURORA_SECRET_ARN: z.string().optional(),
  AURORA_DATABASE: z.string().default('iaprender'),
  AURORA_SCHEMA: z.string().default('public'),
  
  // DynamoDB
  DYNAMODB_TABLE_PREFIX: z.string().default('iaprender'),
  DYNAMODB_REGION: z.string().optional(),
  
  // S3
  S3_BUCKET_NAME: z.string().optional(),
  S3_DOCUMENTS_PREFIX: z.string().default('documents'),
  S3_UPLOADS_PREFIX: z.string().default('uploads'),
  
  // Cognito
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  COGNITO_REGION: z.string().optional(),
  
  // Bedrock
  BEDROCK_REGION: z.string().optional(),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-v2'),
  
  // Lambda
  LAMBDA_FUNCTION_PREFIX: z.string().default('iaprender'),
  
  // Security
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  
  // Monitoring
  ENABLE_METRICS: z.string().transform(v => v === 'true').default('true'),
  METRICS_PORT: z.string().transform(Number).default('9090'),
  
  // Feature flags
  ENABLE_CACHE: z.string().transform(v => v === 'true').default('true'),
  CACHE_TTL_SECONDS: z.string().transform(Number).default('3600'),
});

type Environment = z.infer<typeof envSchema>;

class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: Environment;
  private secretsLoaded = false;

  private constructor() {
    // Parse environment variables
    const parseResult = envSchema.safeParse(process.env);
    
    if (!parseResult.success) {
      console.error('Environment validation failed:', parseResult.error.format());
      throw new Error('Invalid environment configuration');
    }
    
    this.config = parseResult.data;
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  public async loadSecrets(): Promise<void> {
    if (this.secretsLoaded) return;

    try {
      // Load secrets from AWS Secrets Manager
      const secrets = await SecretsManager.getSecrets([
        'jwt-secret',
        'encryption-key',
        'aurora-credentials',
        'cognito-credentials',
        's3-credentials'
      ]);

      // Merge secrets with environment config
      if (secrets['jwt-secret']) {
        this.config.JWT_SECRET = secrets['jwt-secret'];
      }
      if (secrets['encryption-key']) {
        this.config.ENCRYPTION_KEY = secrets['encryption-key'];
      }
      if (secrets['aurora-credentials']) {
        const auroraSecrets = JSON.parse(secrets['aurora-credentials']);
        this.config.AURORA_CLUSTER_ARN = auroraSecrets.clusterArn || this.config.AURORA_CLUSTER_ARN;
        this.config.AURORA_SECRET_ARN = auroraSecrets.secretArn || this.config.AURORA_SECRET_ARN;
      }
      if (secrets['cognito-credentials']) {
        const cognitoSecrets = JSON.parse(secrets['cognito-credentials']);
        this.config.COGNITO_USER_POOL_ID = cognitoSecrets.userPoolId || this.config.COGNITO_USER_POOL_ID;
        this.config.COGNITO_CLIENT_ID = cognitoSecrets.clientId || this.config.COGNITO_CLIENT_ID;
      }
      if (secrets['s3-credentials']) {
        const s3Secrets = JSON.parse(secrets['s3-credentials']);
        this.config.S3_BUCKET_NAME = s3Secrets.bucketName || this.config.S3_BUCKET_NAME;
      }

      this.secretsLoaded = true;
    } catch (error) {
      console.warn('Failed to load secrets from AWS Secrets Manager:', error);
      // Continue with environment variables
    }
  }

  public getConfig(): Readonly<Environment> {
    return Object.freeze({ ...this.config });
  }

  public get env(): string {
    return this.config.NODE_ENV;
  }

  public get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public get isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public get isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  // Grouped configurations
  public get server() {
    return {
      port: this.config.PORT,
      host: this.config.HOST,
      bodyLimit: this.config.BODY_LIMIT,
    };
  }

  public get aws() {
    return {
      region: this.config.AWS_REGION,
      accessKeyId: this.config.AWS_ACCESS_KEY_ID,
      secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
    };
  }

  public get aurora() {
    return {
      clusterArn: this.config.AURORA_CLUSTER_ARN,
      secretArn: this.config.AURORA_SECRET_ARN,
      database: this.config.AURORA_DATABASE,
      schema: this.config.AURORA_SCHEMA,
    };
  }

  public get dynamodb() {
    return {
      tablePrefix: this.config.DYNAMODB_TABLE_PREFIX,
      region: this.config.DYNAMODB_REGION || this.config.AWS_REGION,
    };
  }

  public get s3() {
    return {
      bucketName: this.config.S3_BUCKET_NAME,
      documentsPrefix: this.config.S3_DOCUMENTS_PREFIX,
      uploadsPrefix: this.config.S3_UPLOADS_PREFIX,
    };
  }

  public get cognito() {
    return {
      userPoolId: this.config.COGNITO_USER_POOL_ID,
      clientId: this.config.COGNITO_CLIENT_ID,
      region: this.config.COGNITO_REGION || this.config.AWS_REGION,
    };
  }

  public get bedrock() {
    return {
      region: this.config.BEDROCK_REGION || this.config.AWS_REGION,
      modelId: this.config.BEDROCK_MODEL_ID,
    };
  }

  public get lambda() {
    return {
      functionPrefix: this.config.LAMBDA_FUNCTION_PREFIX,
    };
  }

  public get security() {
    return {
      jwtSecret: this.config.JWT_SECRET,
      encryptionKey: this.config.ENCRYPTION_KEY,
    };
  }

  public get rateLimit() {
    return {
      windowMs: this.config.RATE_LIMIT_WINDOW_MS,
      max: this.config.RATE_LIMIT_MAX_REQUESTS,
    };
  }

  public get cors() {
    return {
      allowedOrigins: this.config.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()),
    };
  }

  public get logging() {
    return {
      level: this.config.LOG_LEVEL,
      format: this.config.LOG_FORMAT,
    };
  }

  public get monitoring() {
    return {
      enableMetrics: this.config.ENABLE_METRICS,
      metricsPort: this.config.METRICS_PORT,
    };
  }

  public get features() {
    return {
      enableCache: this.config.ENABLE_CACHE,
      cacheTtlSeconds: this.config.CACHE_TTL_SECONDS,
    };
  }
}

// Export singleton instance
export const config = EnvironmentConfig.getInstance().getConfig();
export const envConfig = EnvironmentConfig.getInstance();

// Export for type usage
export type { Environment };
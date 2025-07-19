import { Router, Request, Response } from 'express';
import { DatabaseManager } from '../config/database-manager';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient, DescribeUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      message?: string;
      details?: any;
    };
  };
}

export class HealthCheckService {
  private router: Router;
  private logger: Logger;
  private metrics: MetricsCollector;
  private startTime: number;

  constructor(private dbManager: DatabaseManager) {
    this.router = Router();
    this.logger = new Logger('HealthCheck');
    this.metrics = getMetrics();
    this.startTime = Date.now();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Basic health check (fast)
    this.router.get('/', async (req: Request, res: Response) => {
      const health = await this.getBasicHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Detailed health check (slower, checks all services)
    this.router.get('/detailed', async (req: Request, res: Response) => {
      const health = await this.getDetailedHealth();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 206 : 503;
      res.status(statusCode).json(health);
    });

    // Liveness probe (for k8s)
    this.router.get('/live', (req: Request, res: Response) => {
      res.status(200).json({ status: 'alive' });
    });

    // Readiness probe (for k8s)
    this.router.get('/ready', async (req: Request, res: Response) => {
      const isReady = await this.checkReadiness();
      res.status(isReady ? 200 : 503).json({ ready: isReady });
    });
  }

  private async getBasicHealth(): Promise<HealthStatus> {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: envConfig.env,
      services: {}
    };

    // Check database
    const dbStatus = await this.checkDatabase();
    health.services.database = dbStatus;

    // Update overall status
    if (dbStatus.status === 'down') {
      health.status = 'unhealthy';
    }

    return health;
  }

  private async getDetailedHealth(): Promise<HealthStatus> {
    const health = await this.getBasicHealth();

    // Check all AWS services in parallel
    const [s3Status, cognitoStatus, dynamodbStatus] = await Promise.all([
      this.checkS3(),
      this.checkCognito(),
      this.checkDynamoDB()
    ]);

    health.services.s3 = s3Status;
    health.services.cognito = cognitoStatus;
    health.services.dynamodb = dynamodbStatus;

    // Add system metrics
    health.services.system = this.getSystemMetrics();

    // Determine overall health
    const serviceStatuses = Object.values(health.services).map(s => s.status);
    if (serviceStatuses.every(s => s === 'up')) {
      health.status = 'healthy';
    } else if (serviceStatuses.some(s => s === 'down')) {
      health.status = serviceStatuses.filter(s => s === 'down').length > 1 ? 'unhealthy' : 'degraded';
    }

    // Record metrics
    this.metrics.gauge('health_status', health.status === 'healthy' ? 1 : 0);
    
    return health;
  }

  private async checkDatabase(): Promise<any> {
    const start = Date.now();
    try {
      await this.dbManager.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      this.metrics.timing('health_check.database', responseTime);
      
      return {
        status: 'up',
        responseTime,
        details: {
          type: 'Aurora PostgreSQL',
          pool: {
            total: this.dbManager.getPoolStats().total,
            active: this.dbManager.getPoolStats().active,
            idle: this.dbManager.getPoolStats().idle
          }
        }
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      this.metrics.increment('health_check.failures', { service: 'database' });
      
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkS3(): Promise<any> {
    if (!envConfig.s3.bucketName) {
      return { status: 'up', message: 'S3 not configured' };
    }

    const start = Date.now();
    try {
      const client = new S3Client({ region: envConfig.aws.region });
      await client.send(new HeadBucketCommand({ Bucket: envConfig.s3.bucketName }));
      
      const responseTime = Date.now() - start;
      this.metrics.timing('health_check.s3', responseTime);
      
      return {
        status: 'up',
        responseTime,
        details: { bucket: envConfig.s3.bucketName }
      };
    } catch (error) {
      this.metrics.increment('health_check.failures', { service: 's3' });
      
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkCognito(): Promise<any> {
    if (!envConfig.cognito.userPoolId) {
      return { status: 'up', message: 'Cognito not configured' };
    }

    const start = Date.now();
    try {
      const client = new CognitoIdentityProviderClient({ 
        region: envConfig.cognito.region 
      });
      
      await client.send(new DescribeUserPoolCommand({ 
        UserPoolId: envConfig.cognito.userPoolId 
      }));
      
      const responseTime = Date.now() - start;
      this.metrics.timing('health_check.cognito', responseTime);
      
      return {
        status: 'up',
        responseTime,
        details: { userPoolId: envConfig.cognito.userPoolId }
      };
    } catch (error) {
      this.metrics.increment('health_check.failures', { service: 'cognito' });
      
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkDynamoDB(): Promise<any> {
    const tableName = `${envConfig.dynamodb.tablePrefix}-sessions`;
    const start = Date.now();
    
    try {
      const client = new DynamoDBClient({ 
        region: envConfig.dynamodb.region 
      });
      
      await client.send(new DescribeTableCommand({ TableName: tableName }));
      
      const responseTime = Date.now() - start;
      this.metrics.timing('health_check.dynamodb', responseTime);
      
      return {
        status: 'up',
        responseTime,
        details: { table: tableName }
      };
    } catch (error) {
      // DynamoDB might not be used, so don't mark as down
      return {
        status: 'up',
        message: 'DynamoDB table not found or not in use'
      };
    }
  }

  private getSystemMetrics(): any {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'up',
      details: {
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000),
          system: Math.round(cpuUsage.system / 1000)
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        pid: process.pid
      }
    };
  }

  private async checkReadiness(): Promise<boolean> {
    try {
      // Application is ready if database is available
      await this.dbManager.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
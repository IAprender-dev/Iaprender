import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { Pool } from 'pg';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { envConfig } from './environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { SecretsManager } from './secrets';
import { AppErrors } from '../middleware/errorHandler';

interface DatabaseConfig {
  aurora: {
    clusterArn: string;
    secretArn: string;
    database: string;
    region: string;
  };
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
    maxUses: number;
    statementTimeout: number;
  };
  retry: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  };
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private rdsClient?: RDSDataClient;
  private pgPool?: Pool;
  private drizzleDb?: PostgresJsDatabase<typeof schema>;
  private sqlClient?: ReturnType<typeof postgres>;
  private logger: Logger;
  private metrics: MetricsCollector;
  private config: DatabaseConfig;
  private isConnected = false;
  private connectionType: 'aurora-serverless' | 'aurora-dsql' | 'direct';

  private constructor() {
    this.logger = new Logger('Database');
    this.metrics = getMetrics();
    this.config = this.loadConfig();
  }

  private loadConfig(): DatabaseConfig {
    return {
      aurora: {
        clusterArn: envConfig.aurora.clusterArn || '',
        secretArn: envConfig.aurora.secretArn || '',
        database: envConfig.aurora.database,
        region: envConfig.aws.region
      },
      pool: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        maxUses: 7500,
        statementTimeout: 30000
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000
      }
    };
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isConnected) {
      this.logger.debug('Database already initialized');
      return;
    }

    this.logger.info('Initializing database connection');
    const timer = this.metrics.startTimer();

    try {
      // Try Aurora Serverless v2 first
      if (this.config.aurora.clusterArn && this.config.aurora.secretArn) {
        await this.initializeAuroraServerless();
        this.connectionType = 'aurora-serverless';
      } else {
        // Fallback to direct connection
        await this.initializeDirectConnection();
        this.connectionType = 'direct';
      }

      this.isConnected = true;
      const duration = timer();
      
      this.logger.info('Database connection established', {
        type: this.connectionType,
        duration
      });
      
      this.metrics.timing('database.connection.time', duration);
      this.metrics.increment('database.connections.success');
      
      // Start monitoring
      this.startConnectionMonitoring();
      
    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to initialize database', error, { duration });
      this.metrics.increment('database.connections.failed');
      throw AppErrors.serviceUnavailable('Database connection failed');
    }
  }

  private async initializeAuroraServerless(): Promise<void> {
    this.logger.info('Connecting to Aurora Serverless v2');
    
    this.rdsClient = new RDSDataClient({
      region: this.config.aurora.region,
      maxAttempts: this.config.retry.maxAttempts
    });

    // Test connection
    await this.executeStatement('SELECT 1 as test');
    
    // Initialize Drizzle ORM with Aurora Data API
    const auroraClient = {
      async query(sql: string, params: any[] = []) {
        const result = await this.executeStatement(sql, params);
        return {
          rows: result.records || [],
          rowCount: result.numberOfRecordsUpdated || 0
        };
      }
    };

    // Note: This requires a custom Drizzle adapter for Aurora Data API
    // For now, we'll use direct SQL execution
  }

  private async initializeDirectConnection(): Promise<void> {
    this.logger.info('Connecting with direct PostgreSQL connection');
    
    // Load connection details from secrets
    const connectionInfo = await this.getConnectionInfo();
    
    // Create postgres.js client for Drizzle
    this.sqlClient = postgres({
      host: connectionInfo.host,
      port: connectionInfo.port,
      database: connectionInfo.database,
      username: connectionInfo.username,
      password: connectionInfo.password,
      ssl: envConfig.isProduction ? { rejectUnauthorized: false } : false,
      max: this.config.pool.max,
      idle_timeout: this.config.pool.idleTimeoutMillis / 1000,
      connect_timeout: this.config.pool.connectionTimeoutMillis / 1000,
      max_lifetime: this.config.pool.maxUses,
      prepare: false,
      onnotice: () => {}, // Suppress notices in production
      debug: envConfig.isDevelopment
    });

    // Initialize Drizzle
    this.drizzleDb = drizzle(this.sqlClient, { schema });
    
    // Test connection
    await this.sqlClient`SELECT 1 as test`;
    
    // Also create pg Pool for compatibility
    this.pgPool = new Pool({
      host: connectionInfo.host,
      port: connectionInfo.port,
      database: connectionInfo.database,
      user: connectionInfo.username,
      password: connectionInfo.password,
      ssl: envConfig.isProduction ? { rejectUnauthorized: false } : undefined,
      max: this.config.pool.max,
      min: this.config.pool.min,
      idleTimeoutMillis: this.config.pool.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.pool.connectionTimeoutMillis,
      statement_timeout: this.config.pool.statementTimeout
    });

    // Setup pool error handling
    this.pgPool.on('error', (err) => {
      this.logger.error('Unexpected pool error', err);
      this.metrics.increment('database.pool.errors');
    });

    this.pgPool.on('connect', () => {
      this.metrics.increment('database.pool.connections');
    });

    this.pgPool.on('remove', () => {
      this.metrics.increment('database.pool.disconnections');
    });
  }

  private async getConnectionInfo(): Promise<any> {
    try {
      // Try to get from secrets manager
      const secrets = await SecretsManager.getSecret('aurora-credentials');
      return JSON.parse(secrets);
    } catch (error) {
      this.logger.warn('Failed to load secrets, using environment variables');
      
      // Fallback to environment variables
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || envConfig.aurora.database,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
      };
    }
  }

  public async executeStatement(sql: string, parameters?: any[]): Promise<any> {
    if (!this.isConnected) {
      throw AppErrors.serviceUnavailable('Database not connected');
    }

    const timer = this.metrics.startTimer();
    
    try {
      if (this.rdsClient) {
        // Aurora Serverless execution
        const result = await this.rdsClient.executeStatement({
          resourceArn: this.config.aurora.clusterArn,
          secretArn: this.config.aurora.secretArn,
          database: this.config.aurora.database,
          sql,
          parameters: this.formatParameters(parameters)
        });
        
        const duration = timer();
        this.metrics.timing('database.query.duration', duration);
        
        return result;
      } else if (this.pgPool) {
        // Direct pool execution
        const result = await this.pgPool.query(sql, parameters);
        
        const duration = timer();
        this.metrics.timing('database.query.duration', duration);
        
        return result;
      } else {
        throw new Error('No database client available');
      }
    } catch (error) {
      const duration = timer();
      this.logger.error('Query execution failed', error, { sql, duration });
      this.metrics.increment('database.query.errors');
      throw error;
    }
  }

  public async transaction<T>(
    fn: (tx: any) => Promise<T>
  ): Promise<T> {
    if (!this.isConnected) {
      throw AppErrors.serviceUnavailable('Database not connected');
    }

    const timer = this.metrics.startTimer();
    
    try {
      let result: T;
      
      if (this.drizzleDb) {
        // Drizzle transaction
        result = await this.drizzleDb.transaction(fn);
      } else if (this.pgPool) {
        // Manual transaction with pg pool
        const client = await this.pgPool.connect();
        try {
          await client.query('BEGIN');
          result = await fn(client);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } else {
        throw new Error('Transactions not supported with current connection');
      }
      
      const duration = timer();
      this.metrics.timing('database.transaction.duration', duration);
      
      return result;
    } catch (error) {
      const duration = timer();
      this.logger.error('Transaction failed', error, { duration });
      this.metrics.increment('database.transaction.errors');
      throw error;
    }
  }

  private formatParameters(params?: any[]): any[] {
    if (!params) return [];
    
    return params.map((param, index) => ({
      name: `param${index + 1}`,
      value: {
        stringValue: typeof param === 'string' ? param : 
                     typeof param === 'number' ? param.toString() :
                     JSON.stringify(param)
      }
    }));
  }

  private startConnectionMonitoring(): void {
    // Monitor connection health every 30 seconds
    setInterval(async () => {
      try {
        await this.executeStatement('SELECT 1');
        this.metrics.gauge('database.connection.healthy', 1);
      } catch (error) {
        this.metrics.gauge('database.connection.healthy', 0);
        this.logger.error('Database health check failed', error);
      }
    }, 30000);

    // Collect pool metrics
    if (this.pgPool) {
      setInterval(() => {
        const poolMetrics = {
          total: this.pgPool!.totalCount,
          idle: this.pgPool!.idleCount,
          waiting: this.pgPool!.waitingCount
        };
        
        this.metrics.gauge('database.pool.total', poolMetrics.total);
        this.metrics.gauge('database.pool.idle', poolMetrics.idle);
        this.metrics.gauge('database.pool.waiting', poolMetrics.waiting);
      }, 10000);
    }
  }

  public getDb(): PostgresJsDatabase<typeof schema> | undefined {
    return this.drizzleDb;
  }

  public getPool(): Pool | undefined {
    return this.pgPool;
  }

  public getRdsClient(): RDSDataClient | undefined {
    return this.rdsClient;
  }

  public getConnectionType(): string {
    return this.connectionType;
  }

  public async query(sql: string, params?: any[]): Promise<any> {
    return this.executeStatement(sql, params);
  }

  public async close(): Promise<void> {
    this.logger.info('Closing database connections');
    
    try {
      if (this.pgPool) {
        await this.pgPool.end();
      }
      
      if (this.sqlClient) {
        await this.sqlClient.end();
      }
      
      this.isConnected = false;
      this.logger.info('Database connections closed');
    } catch (error) {
      this.logger.error('Error closing database connections', error);
    }
  }

  public getPoolStats() {
    if (!this.pgPool) {
      return { total: 0, active: 0, idle: 0, waiting: 0 };
    }
    
    return {
      total: this.pgPool.totalCount,
      active: this.pgPool.totalCount - this.pgPool.idleCount,
      idle: this.pgPool.idleCount,
      waiting: this.pgPool.waitingCount
    };
  }
}

// Export singleton instance
export const databaseConnection = DatabaseConnection.getInstance();

// Initialize on import for backward compatibility
export async function initializeDatabase(): Promise<void> {
  await databaseConnection.initialize();
}

// Export convenience methods
export const db = databaseConnection.getDb();
export const pool = databaseConnection.getPool();
export const query = databaseConnection.query.bind(databaseConnection);
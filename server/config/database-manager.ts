import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleAWS } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import * as schema from '../shared/schema';
import ws from "ws";

// Configurar neon para usar WebSocket
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

export type DatabaseType = 'postgresql' | 'aurora-dsql';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private currentDbType: DatabaseType;
  private db: any;
  private client: any;

  private constructor() {
    // Determinar qual banco usar baseado nas variáveis de ambiente
    this.currentDbType = process.env.USE_AURORA_DSQL === 'true' ? 'aurora-dsql' : 'postgresql';
    this.initializeDatabase();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private initializeDatabase() {
    if (this.currentDbType === 'aurora-dsql') {
      this.initializeAuroraDSQL();
    } else {
      this.initializePostgreSQL();
    }
  }

  private initializePostgreSQL() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for PostgreSQL connection");
    }

    this.client = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzleNeon({ client: this.client, schema });
    console.log('✅ PostgreSQL connection initialized');
  }

  private initializeAuroraDSQL() {
    const endpoint = process.env.ENDPOINT_AURORA;
    const port = process.env.PORTA_AURORA || '5432';
    const token = process.env.TOKEN_AURORA;

    if (!endpoint || !token) {
      console.error('❌ Aurora DSQL credentials not found, falling back to PostgreSQL');
      this.currentDbType = 'postgresql';
      this.initializePostgreSQL();
      return;
    }

    try {
      // Configurar cliente RDS Data API
      const rdsClient = new RDSDataClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      });

      // Montar ARNs para Aurora DSQL
      const clusterArn = endpoint.includes('arn:') ? endpoint : 
        `arn:aws:rds:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID || '762723916379'}:cluster:${endpoint}`;
      
      const secretArn = token.includes('arn:') ? token :
        `arn:aws:secretsmanager:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID || '762723916379'}:secret:${token}`;

      this.client = rdsClient;
      this.db = drizzleAWS(rdsClient, {
        schema,
        resourceArn: clusterArn,
        secretArn: secretArn,
        database: 'iaprender_db'
      });

      console.log('✅ Aurora DSQL connection initialized');
      console.log(`📍 Cluster ARN: ${clusterArn}`);
      console.log(`🔐 Secret ARN: ${secretArn}`);
    } catch (error) {
      console.error('❌ Failed to initialize Aurora DSQL, falling back to PostgreSQL:', error);
      this.currentDbType = 'postgresql';
      this.initializePostgreSQL();
    }
  }

  public getDb() {
    return this.db;
  }

  public getClient() {
    return this.client;
  }

  public getDatabaseType(): DatabaseType {
    return this.currentDbType;
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (this.currentDbType === 'aurora-dsql') {
        // Teste específico para Aurora DSQL
        await this.db.execute('SELECT 1 as test');
      } else {
        // Teste para PostgreSQL
        await this.db.execute('SELECT 1 as test');
      }
      
      console.log(`✅ ${this.currentDbType.toUpperCase()} connection test successful`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.currentDbType.toUpperCase()} connection test failed:`, error);
      return false;
    }
  }

  public async switchDatabase(newType: DatabaseType): Promise<boolean> {
    if (newType === this.currentDbType) {
      console.log(`Already using ${newType}`);
      return true;
    }

    try {
      this.currentDbType = newType;
      this.initializeDatabase();
      const testResult = await this.testConnection();
      
      if (testResult) {
        console.log(`✅ Successfully switched to ${newType}`);
        return true;
      } else {
        throw new Error(`Failed to connect to ${newType}`);
      }
    } catch (error) {
      console.error(`❌ Failed to switch to ${newType}:`, error);
      // Reverter para PostgreSQL em caso de erro
      this.currentDbType = 'postgresql';
      this.initializePostgreSQL();
      return false;
    }
  }
}

// Exportar instância singleton
export const dbManager = DatabaseManager.getInstance();
export const db = dbManager.getDb();
export const dbClient = dbManager.getClient();
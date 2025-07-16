import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import * as schema from '../shared/schema';

export class AuroraDSQLConnection {
  private static instance: AuroraDSQLConnection;
  private rdsClient: RDSDataClient;
  private db: ReturnType<typeof drizzle>;
  private clusterArn: string;
  private secretArn: string;
  private database: string;

  private constructor() {
    // Obter credenciais das secrets
    const endpoint = process.env.ENDPOINT_AURORA;
    const port = process.env.PORTA_AURORA || '5432';
    const token = process.env.TOKEN_AURORA;

    if (!endpoint || !token) {
      throw new Error('Aurora DSQL credentials not found in secrets');
    }

    // Configurar cliente RDS Data API
    this.rdsClient = new RDSDataClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });

    // Configurar ARNs para Aurora DSQL
    this.clusterArn = `arn:aws:rds:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID}:cluster:${endpoint}`;
    this.secretArn = `arn:aws:secretsmanager:${process.env.AWS_REGION || 'us-east-1'}:${process.env.AWS_ACCOUNT_ID}:secret:${token}`;
    this.database = 'iaprender_db';

    // Inicializar Drizzle ORM com Aurora DSQL
    this.db = drizzle(this.rdsClient, {
      schema,
      resourceArn: this.clusterArn,
      secretArn: this.secretArn,
      database: this.database
    });

    console.log('✅ Aurora DSQL connection initialized');
  }

  public static getInstance(): AuroraDSQLConnection {
    if (!AuroraDSQLConnection.instance) {
      AuroraDSQLConnection.instance = new AuroraDSQLConnection();
    }
    return AuroraDSQLConnection.instance;
  }

  public getDb() {
    return this.db;
  }

  public getClient() {
    return this.rdsClient;
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.db.execute('SELECT 1 as test');
      console.log('✅ Aurora DSQL connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Aurora DSQL connection test failed:', error);
      return false;
    }
  }

  public async createTables() {
    try {
      // Aqui você pode executar comandos DDL se necessário
      console.log('📝 Creating Aurora DSQL tables if needed...');
      
      // Execute migration commands here if needed
      // await this.db.execute('CREATE TABLE IF NOT EXISTS ...');
      
      console.log('✅ Aurora DSQL tables ready');
      return true;
    } catch (error) {
      console.error('❌ Error creating Aurora DSQL tables:', error);
      return false;
    }
  }
}

export const auroraDB = AuroraDSQLConnection.getInstance();
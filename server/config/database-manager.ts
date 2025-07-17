import dotenv from 'dotenv';
dotenv.config(); // Carregar variáveis de ambiente primeiro
import { Pool as NeonPool } from '@neondatabase/serverless';
import { Pool as PostgreSQLPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePostgreSQL } from 'drizzle-orm/node-postgres';
import * as schema from '../../shared/schema';
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

    this.client = new NeonPool({ connectionString: process.env.DATABASE_URL });
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
      // 🚨 CORREÇÃO CRÍTICA: Aurora DSQL usa PostgreSQL connection string nativa!
      // NÃO usar RDS Data API - usar Pool PostgreSQL direto
      
      console.log(`🔧 Configurando Aurora DSQL como PostgreSQL nativo`);
      console.log(`📍 Endpoint: ${endpoint}`);
      console.log(`🔌 Porta: ${port}`);
      
      // Construir connection string PostgreSQL para Aurora DSQL
      // Formato: postgresql://username:password@host:port/database
      // IMPORTANTE: Aurora DSQL usa usuário "admin", não "postgres"
      // URL encode o token para evitar caracteres especiais
      const encodedToken = encodeURIComponent(token);
      const connectionString = `postgresql://admin:${encodedToken}@${endpoint}:${port}/postgres`;
      
      console.log(`🔗 Connection string: postgresql://admin:***@${endpoint}:${port}/postgres`);
      
      // Usar Pool PostgreSQL nativo (compatível com Aurora DSQL)
      this.client = new PostgreSQLPool({ 
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false // Aurora DSQL requer SSL
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      
      // Usar Drizzle PostgreSQL driver nativo (NÃO Neon, NÃO AWS Data API)
      this.db = drizzlePostgreSQL(this.client, { schema });

      console.log('✅ Aurora DSQL connection initialized (PostgreSQL mode)');
      console.log(`📍 Host: ${endpoint}:${port}`);
      console.log(`🔐 Database: postgres`);
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
      
      // Se for Aurora DSQL e erro de token, mostrar instruções
      if (this.currentDbType === 'aurora-dsql' && error.message.includes('access denied')) {
        console.log('💡 AURORA DSQL: Token provavelmente expirado ou usuário incorreto');
        console.log('📋 Para renovar token:');
        console.log('   aws dsql generate-db-connect-admin-auth-token \\');
        console.log('     --cluster-identifier qeabuhp64eamddmw3vqdq52ph4 \\');
        console.log('     --region us-east-1 --expires-in 3600');
        console.log('💡 Nota: Aurora DSQL usa usuário "admin", não "postgres"');
        console.log('📝 Consulte aurora-token-helper.md para instruções completas');
      }
      
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
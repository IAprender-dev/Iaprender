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
    const token = process.env.TOKEN_AURORA;

    if (!endpoint || !token) {
      console.error('❌ Aurora DSQL credentials not found, falling back to PostgreSQL');
      this.currentDbType = 'postgresql';
      this.initializePostgreSQL();
      return;
    }

    try {
      console.log(`🔧 Aurora DSQL - Conexão direta simplificada`);
      console.log(`📍 ${endpoint}`);
      
      // Conexão direta simplificada - Aurora DSQL usa usuário admin
      this.client = new PostgreSQLPool({ 
        host: endpoint,
        port: 5432,
        database: 'postgres',
        user: 'admin',
        password: token,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000,
        max: 5
      });
      
      // Usar Drizzle PostgreSQL driver nativo
      this.db = drizzlePostgreSQL(this.client, { schema });

      console.log('✅ Aurora DSQL inicializado');
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
        // Teste básico Aurora DSQL
        await this.db.execute('SELECT 1 as test');
        console.log(`✅ Aurora DSQL conectado`);
      } else {
        // Teste PostgreSQL
        await this.db.execute('SELECT 1 as test');
        console.log(`✅ PostgreSQL conectado`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Erro de conexão:`, error.message);
      
      if (this.currentDbType === 'aurora-dsql' && error.message.includes('access denied')) {
        console.log('💡 Token Aurora DSQL expirado - renovar nas secrets');
      }
      
      return false;
    }
  }

  public async testConnectivityComplete(): Promise<{ success: boolean; details: any }> {
    const details = {
      dbType: this.currentDbType,
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Teste 1: Conexão básica
      await this.db.execute('SELECT 1 as test');
      details.tests.push({ name: 'Conexão Básica', status: 'PASS' });

      // Teste 2: Verificar versão
      const versionResult = await this.db.execute('SELECT version() as version');
      details.version = versionResult.rows[0]?.version?.substring(0, 50);
      details.tests.push({ name: 'Versão Database', status: 'PASS' });

      // Teste 3: Contar tabelas
      const tablesResult = await this.db.execute(`
        SELECT COUNT(*) as total 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      details.totalTables = tablesResult.rows[0]?.total;
      details.tests.push({ name: 'Contagem Tabelas', status: 'PASS' });

      // Teste 4: Verificar tabelas hierárquicas
      const hierarchicalResult = await this.db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('empresas', 'contratos', 'escolas', 'usuarios', 'gestores', 'diretores', 'professores', 'alunos')
      `);
      details.hierarchicalTables = hierarchicalResult.rows.map(r => r.table_name);
      details.tests.push({ name: 'Tabelas Hierárquicas', status: 'PASS' });

      console.log(`✅ Teste completo de conectividade - ${details.tests.length} testes passaram`);
      
      return { success: true, details };
    } catch (error) {
      details.tests.push({ name: 'Erro', status: 'FAIL', error: error.message });
      console.error(`❌ Teste de conectividade falhou:`, error.message);
      
      return { success: false, details };
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
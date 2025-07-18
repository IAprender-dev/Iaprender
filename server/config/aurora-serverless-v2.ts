import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../shared/schema';

export interface AuroraServerlessConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  region: string;
  cluster_identifier: string;
  min_capacity: number;
  max_capacity: number;
}

export class AuroraServerlessManager {
  private static instance: AuroraServerlessManager;
  private pool: Pool | null = null;
  private db: any = null;
  private config: AuroraServerlessConfig | null = null;

  private constructor() {}

  public static getInstance(): AuroraServerlessManager {
    if (!AuroraServerlessManager.instance) {
      AuroraServerlessManager.instance = new AuroraServerlessManager();
    }
    return AuroraServerlessManager.instance;
  }

  /**
   * Configuração para Aurora Serverless v2 Enterprise
   * Capacidade para 60k-150k usuários simultâneos
   */
  public async initializeAuroraServerlessV2(): Promise<boolean> {
    try {
      console.log('🚀 Inicializando Aurora Serverless v2 para 60k-150k usuários...');

      // Configuração enterprise para alta escala
      this.config = {
        host: process.env.AURORA_SERVERLESS_HOST || 'iaprender-cluster.cluster-xxxxxxxxx.us-east-1.rds.amazonaws.com',
        port: parseInt(process.env.AURORA_SERVERLESS_PORT || '5432'),
        database: process.env.AURORA_SERVERLESS_DB || 'iaprender_production',
        username: process.env.AURORA_SERVERLESS_USER || 'admin',
        password: process.env.AURORA_SERVERLESS_PASSWORD || '',
        region: process.env.AWS_REGION || 'us-east-1',
        cluster_identifier: process.env.AURORA_CLUSTER_ID || 'iaprender-aurora-cluster',
        min_capacity: 0.5, // ACU mínimo
        max_capacity: 128  // ACU máximo (até 64GB RAM, 32 vCPUs)
      };

      if (!this.config.password) {
        console.error('❌ Aurora Serverless v2 password not configured');
        return false;
      }

      // Pool de conexões otimizado para alta escala
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: {
          rejectUnauthorized: false,
          require: true
        },
        // Configurações enterprise para 60k-150k usuários
        max: 50,                    // Máximo de conexões no pool
        min: 5,                     // Mínimo de conexões mantidas
        idleTimeoutMillis: 30000,   // 30s timeout para conexões idle
        connectionTimeoutMillis: 5000, // 5s timeout para novas conexões
        acquireTimeoutMillis: 60000,   // 60s timeout para aquisição
        createTimeoutMillis: 10000,    // 10s timeout para criação
        destroyTimeoutMillis: 5000,    // 5s timeout para destruição
        reapIntervalMillis: 1000,      // 1s intervalo de limpeza
        createRetryIntervalMillis: 200, // 200ms retry interval
        propagateCreateError: true
      });

      // Configurar Drizzle ORM
      this.db = drizzle(this.pool, { schema });

      // Teste de conectividade inicial
      const testResult = await this.testConnection();
      if (testResult) {
        console.log('✅ Aurora Serverless v2 configurado com sucesso');
        console.log(`📊 Capacidade: ${this.config.min_capacity}-${this.config.max_capacity} ACU`);
        console.log(`🔗 Pool: ${this.pool.totalCount} conexões ativas`);
        return true;
      } else {
        throw new Error('Falha no teste de conectividade');
      }

    } catch (error) {
      console.error('❌ Erro ao configurar Aurora Serverless v2:', error.message);
      return false;
    }
  }

  /**
   * Teste de conectividade e performance
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database não inicializado');
      }

      console.log('🔍 Testando conectividade Aurora Serverless v2...');

      // Teste 1: Conexão básica
      const basicTest = await this.db.execute('SELECT 1 as test, NOW() as timestamp');
      console.log('✅ Teste básico: OK');

      // Teste 2: Informações do cluster
      const clusterInfo = await this.db.execute(`
        SELECT 
          version() as version,
          current_database() as database,
          current_user as user,
          inet_server_addr() as server_ip
      `);
      
      console.log('✅ Informações do cluster:');
      console.log(`   📍 Database: ${clusterInfo.rows[0]?.database}`);
      console.log(`   👤 User: ${clusterInfo.rows[0]?.user}`);
      console.log(`   🌐 Server IP: ${clusterInfo.rows[0]?.server_ip}`);

      // Teste 3: Performance - simular carga
      const startTime = Date.now();
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.db.execute('SELECT pg_sleep(0.01), $1 as test_id', [i]));
      }
      await Promise.all(promises);
      const endTime = Date.now();
      
      console.log(`✅ Teste de performance: ${endTime - startTime}ms para 10 queries paralelas`);

      // Teste 4: Pool de conexões
      console.log(`📊 Pool status: ${this.pool?.totalCount || 0} total, ${this.pool?.idleCount || 0} idle`);

      return true;

    } catch (error) {
      console.error('❌ Teste de conectividade falhou:', error.message);
      return false;
    }
  }

  /**
   * Monitoramento em tempo real do cluster
   */
  public async getClusterMetrics(): Promise<any> {
    try {
      if (!this.db) {
        throw new Error('Database não inicializado');
      }

      // Métricas de performance do Aurora
      const metrics = await this.db.execute(`
        SELECT 
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT count(*) FROM pg_stat_activity) as total_connections,
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          (SELECT extract(epoch from (now() - pg_postmaster_start_time()))) as uptime_seconds
      `);

      const poolMetrics = {
        total_count: this.pool?.totalCount || 0,
        idle_count: this.pool?.idleCount || 0,
        waiting_count: this.pool?.waitingCount || 0
      };

      return {
        cluster: metrics.rows[0],
        pool: poolMetrics,
        config: {
          min_capacity: this.config?.min_capacity,
          max_capacity: this.config?.max_capacity,
          cluster_id: this.config?.cluster_identifier
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao obter métricas:', error.message);
      return null;
    }
  }

  /**
   * Executar migração de schema para Aurora Serverless v2
   */
  public async runMigrations(): Promise<boolean> {
    try {
      console.log('🔄 Executando migrações para Aurora Serverless v2...');

      // Verificar se as tabelas principais existem
      const tablesCheck = await this.db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('usuarios', 'empresas', 'contratos')
      `);

      console.log(`📋 Tabelas encontradas: ${tablesCheck.rows.length}`);

      if (tablesCheck.rows.length === 0) {
        console.log('⚠️ Nenhuma tabela encontrada, executando setup inicial...');
        
        // Criar tabelas básicas se não existirem
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            cognito_sub TEXT UNIQUE,
            email VARCHAR(255) NOT NULL,
            nome VARCHAR(255) NOT NULL,
            tipo_usuario VARCHAR(50) NOT NULL,
            empresa_id INTEGER,
            status VARCHAR(20) DEFAULT 'active',
            criado_em TIMESTAMP DEFAULT NOW(),
            atualizado_em TIMESTAMP DEFAULT NOW()
          );
        `);

        console.log('✅ Tabela usuarios criada');
      }

      return true;

    } catch (error) {
      console.error('❌ Erro nas migrações:', error.message);
      return false;
    }
  }

  public getDb() {
    return this.db;
  }

  public getPool() {
    return this.pool;
  }

  public getConfig() {
    return this.config;
  }

  /**
   * Fechar conexões graciosamente
   */
  public async close(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        console.log('✅ Aurora Serverless v2 pool fechado');
      }
    } catch (error) {
      console.error('❌ Erro ao fechar pool:', error.message);
    }
  }
}

// Instância singleton
export const auroraManager = AuroraServerlessManager.getInstance();
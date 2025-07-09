import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;

interface DatabaseConnection {
  pool: Pool;
  db: any;
  isConnected: boolean;
  lastConnectionCheck: Date;
}

class DatabaseReconnectionManager {
  private static instance: DatabaseReconnectionManager;
  private connections: Map<string, DatabaseConnection> = new Map();
  private readonly maxRetries = 5;
  private readonly retryDelayMs = 1000;
  private readonly connectionCheckInterval = 30000; // 30 segundos

  private constructor() {}

  static getInstance(): DatabaseReconnectionManager {
    if (!DatabaseReconnectionManager.instance) {
      DatabaseReconnectionManager.instance = new DatabaseReconnectionManager();
    }
    return DatabaseReconnectionManager.instance;
  }

  async getConnection(connectionId: string = 'default'): Promise<{ db: any; pool: Pool }> {
    const connection = this.connections.get(connectionId);
    
    // Verificar se conexão existe e é válida
    if (connection && this.isConnectionValid(connection)) {
      return { db: connection.db, pool: connection.pool };
    }

    // Criar nova conexão
    return await this.createNewConnection(connectionId);
  }

  private isConnectionValid(connection: DatabaseConnection): boolean {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - connection.lastConnectionCheck.getTime();
    
    // Reconectar se passou mais de 30 segundos ou se não está conectado
    return connection.isConnected && timeSinceLastCheck < this.connectionCheckInterval;
  }

  private async createNewConnection(connectionId: string): Promise<{ db: any; pool: Pool }> {
    console.log(`🔄 [DB-RECONNECT] Criando nova conexão para ${connectionId}`);
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, // Reduced pool size for better stability
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const db = drizzle({ client: pool, schema });

    // Testar a conexão
    let isConnected = false;
    let retries = 0;

    while (retries < this.maxRetries && !isConnected) {
      try {
        console.log(`🔍 [DB-RECONNECT] Tentativa ${retries + 1}/${this.maxRetries} para ${connectionId}`);
        
        const client = await pool.connect();
        client.release();
        
        isConnected = true;
        console.log(`✅ [DB-RECONNECT] Conexão estabelecida para ${connectionId}`);
      } catch (error) {
        retries++;
        console.log(`❌ [DB-RECONNECT] Tentativa ${retries} falhou: ${error.message}`);
        
        if (retries < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * retries));
        }
      }
    }

    if (!isConnected) {
      throw new Error(`Falha ao conectar com banco de dados após ${this.maxRetries} tentativas`);
    }

    // Armazenar conexão
    this.connections.set(connectionId, {
      pool,
      db,
      isConnected: true,
      lastConnectionCheck: new Date()
    });

    return { db, pool };
  }

  async executeWithRetry<T>(
    operation: (db: any) => Promise<T>,
    connectionId: string = 'default'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔄 [DB-RETRY] Tentativa ${attempt}/${this.maxRetries} para operação`);
        
        const { db } = await this.getConnection(connectionId);
        const result = await operation(db);
        
        console.log(`✅ [DB-RETRY] Operação realizada com sucesso na tentativa ${attempt}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ [DB-RETRY] Tentativa ${attempt} falhou: ${error.message}`);
        
        // Verificar se é erro de conexão
        if (this.isConnectionError(error)) {
          console.log(`🔄 [DB-RETRY] Erro de conexão detectado, removendo conexão cached`);
          this.connections.delete(connectionId);
          
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
            continue;
          }
        } else {
          // Erro não relacionado à conexão, não tentar novamente
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Operação falhou após múltiplas tentativas');
  }

  private isConnectionError(error: any): boolean {
    if (!error) return false;
    
    const connectionErrors = [
      'terminating connection due to administrator command',
      'connection terminated',
      'connection lost',
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'connection closed',
      'WebSocket connection',
      'NeonDbError'
    ];
    
    const errorMessage = error.message || error.toString();
    return connectionErrors.some(errorType => 
      errorMessage.toLowerCase().includes(errorType.toLowerCase())
    );
  }

  async closeConnection(connectionId: string = 'default'): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      try {
        await connection.pool.end();
        console.log(`🔒 [DB-RECONNECT] Conexão ${connectionId} fechada`);
      } catch (error) {
        console.log(`⚠️ [DB-RECONNECT] Erro ao fechar conexão ${connectionId}: ${error.message}`);
      }
      this.connections.delete(connectionId);
    }
  }

  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(id => this.closeConnection(id));
    await Promise.all(promises);
  }
}

export const dbReconnectionManager = DatabaseReconnectionManager.getInstance();
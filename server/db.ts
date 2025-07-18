import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { DatabaseManager, dbManager, db as managedDb } from './config/database-manager';

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;

// Legacy PostgreSQL connection (mantido para compatibilidade)
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with better connection handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Usar DatabaseManager para escolher entre Aurora Serverless, Aurora DSQL e PostgreSQL
export const db = managedDb;
export const dbClient = dbManager.getClient();

// Log do tipo de banco em uso
console.log(`📊 Database ativo: ${dbManager.getDatabaseType().toUpperCase()}`);

// Configuração adicional para AWS RDS (quando migrar)
export const createAWSConnection = () => {
  const awsConnectionString = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL;
  const awsPool = new Pool({ 
    connectionString: awsConnectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  return drizzle({ client: awsPool, schema });
};

// Função de inicialização do banco com suporte a Aurora DSQL
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Usar DatabaseManager para conectar
    const dbType = dbManager.getDatabaseType();
    console.log(`📍 Tipo de banco: ${dbType.toUpperCase()}`);
    
    // Teste de conexão com o banco gerenciado
    const connectionTest = await dbManager.testConnection();
    
    if (connectionTest) {
      console.log(`✅ Conexão com ${dbType.toUpperCase()} estabelecida`);
      return true;
    } else {
      throw new Error(`Falha na conexão com ${dbType}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    
    // MODO EXCLUSIVO: Não permitir fallbacks para outros bancos
    console.error('❌ SISTEMA CONFIGURADO APENAS PARA AURORA SERVERLESS');
    console.error('💡 Verificar credenciais nas secrets e conectividade de rede');
    throw error;
    
    // Check if it's a WebSocket connection error (legacy PostgreSQL)
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('WebSocket')) {
      console.error('💡 Dica: Erro de WebSocket detectado. Tentando reconexão...');
      
      try {
        const freshPool = new Pool({ 
          connectionString: process.env.DATABASE_URL,
          max: 5,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 10000,
        });
        
        const client = await freshPool.connect();
        console.log('✅ Reconexão bem-sucedida com pool alternativo');
        client.release();
        return true;
      } catch (reconnectError) {
        console.error('❌ Falha na reconexão:', reconnectError);
      }
    }
    
    throw error;
  }
};
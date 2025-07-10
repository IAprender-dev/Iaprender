import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchConnectionCache = true;

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
export const db = drizzle({ client: pool, schema });

// Configuração adicional para AWS RDS (quando migrar)
export const createAWSConnection = () => {
  const awsConnectionString = process.env.AWS_DATABASE_URL || process.env.DATABASE_URL;
  const awsPool = new Pool({ 
    connectionString: awsConnectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  return drizzle({ client: awsPool, schema });
};

// Função de inicialização do banco
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Teste de conexão com retry logic
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const client = await pool.connect();
        console.log('✅ Conexão com banco de dados estabelecida');
        client.release();
        return true;
      } catch (error) {
        retries++;
        console.log(`⚠️ Tentativa ${retries}/${maxRetries} falhou, tentando novamente...`);
        
        if (retries === maxRetries) {
          throw error;
        }
        
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    
    // Check if it's a WebSocket connection error
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('WebSocket')) {
      console.error('💡 Dica: Erro de WebSocket detectado. Tentando reconexão...');
      
      // Try to reconnect with a fresh pool
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
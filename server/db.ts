import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    
    // Teste de conexão
    const client = await pool.connect();
    console.log('✅ Conexão com banco de dados estabelecida');
    client.release();
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error);
    throw error;
  }
};
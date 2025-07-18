// NEON DATABASE COMPLETAMENTE REMOVIDO DO SISTEMA
import * as schema from "@shared/schema";
import { DatabaseManager, dbManager, db as managedDb } from './config/database-manager';

// NEON DATABASE REMOVIDO: Não há mais suporte a DATABASE_URL
// Sistema funciona exclusivamente com Aurora Serverless ou Aurora DSQL

// Export temporário do pool para compatibilidade com arquivos legacy
export const pool = dbManager.getClient();

// Usar DatabaseManager para escolher entre Aurora Serverless e Aurora DSQL APENAS
export const db = managedDb;
export const dbClient = dbManager.getClient();

// Log do tipo de banco em uso
console.log(`📊 Database ativo: ${dbManager.getDatabaseType().toUpperCase()} (NEON DESATIVADO)`);

// FUNÇÃO REMOVIDA: createAWSConnection()
// NEON DATABASE foi completamente removido do sistema

// Função de inicialização do banco Aurora exclusivamente
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados Aurora...');
    
    // Usar DatabaseManager para conectar apenas Aurora
    const dbType = dbManager.getDatabaseType();
    console.log(`📍 Tipo de banco: ${dbType.toUpperCase()} (NEON COMPLETAMENTE REMOVIDO)`);
    
    // Teste de conexão com o banco gerenciado
    const connectionTest = await dbManager.testConnection();
    
    if (connectionTest) {
      console.log(`✅ Conexão com ${dbType.toUpperCase()} estabelecida`);
      console.log('💾 Database initialized successfully (NEON DESATIVADO)');
      return true;
    } else {
      throw new Error(`FALHA CRÍTICA: Conexão com ${dbType} falhada. NEON foi removido - sem fallbacks.`);
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO ao conectar com banco Aurora:', error);
    console.error('❌ SISTEMA SEM NEON: Apenas Aurora Serverless/DSQL suportados');
    console.error('💡 Verificar credenciais Aurora nas secrets');
    throw error;
  }
};
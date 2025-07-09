import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do pool de conexões PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,                    // Máximo de conexões no pool
  idleTimeoutMillis: 30000,   // Tempo limite para conexões inativas
  connectionTimeoutMillis: 2000, // Timeout para estabelecer conexão
  acquireTimeoutMillis: 30000,   // Timeout para obter conexão do pool
  createTimeoutMillis: 30000,    // Timeout para criar nova conexão
  destroyTimeoutMillis: 5000,    // Timeout para destruir conexão
  reapIntervalMillis: 1000,      // Intervalo para verificar conexões inativas
  createRetryIntervalMillis: 200 // Intervalo entre tentativas de criar conexão
};

// Criar pool de conexões
const pool = new Pool(poolConfig);

// Tratamento de eventos do pool
pool.on('connect', (client) => {
  console.log('✅ Nova conexão estabelecida com o banco de dados');
});

pool.on('acquire', (client) => {
  console.log('🔄 Conexão obtida do pool');
});

pool.on('error', (err, client) => {
  console.error('❌ Erro no pool de conexões:', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  console.log('🗑️ Conexão removida do pool');
});

// Função para executar queries
export const executeQuery = async (text, params = []) => {
  const client = await pool.connect();
  try {
    const start = Date.now();
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    
    // Log para queries que demoram mais de 100ms
    if (duration > 100) {
      console.warn(`⚠️ Query lenta executada em ${duration}ms:`, text.substring(0, 50) + '...');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro na execução da query:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  } finally {
    client.release();
  }
};

// Função para executar transações
export const executeTransaction = async (queries) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const { text, params } of queries) {
      const result = await client.query(text, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na transação:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Função para verificar conexão com o banco
export const checkConnection = async () => {
  try {
    const result = await executeQuery('SELECT NOW() as current_time');
    console.log('✅ Conexão com banco de dados verificada:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Falha na verificação de conexão:', error.message);
    return false;
  }
};

// Função para obter estatísticas do pool
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
};

// Função para fechar todas as conexões
export const closePool = async () => {
  try {
    await pool.end();
    console.log('✅ Pool de conexões fechado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao fechar pool:', error.message);
  }
};

// Configurar tratamento de sinais para fechamento gracioso
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido sinal SIGINT, fechando pool de conexões...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido sinal SIGTERM, fechando pool de conexões...');
  await closePool();
  process.exit(0);
});

// Verificar conexão na inicialização
checkConnection();

export default pool;
// CONFIGURAÇÃO POOL POSTGRESQL AURORA DSQL
// ==========================================

const { Pool } = require('pg');

// Configuração atual do sistema Aurora DSQL
const poolConfig = {
  host: process.env.ENDPOINT_AURORA,        // qeabuhp64eamddmw3vqdq52ph4.dsql.us-east-1.on.aws
  port: 5432,                               // Porta padrão PostgreSQL
  database: 'postgres',                     // Database padrão Aurora DSQL
  user: 'admin',                           // Usuário obrigatório Aurora DSQL (não 'postgres')
  password: process.env.TOKEN_AURORA,      // Token temporário AWS (15min)
  ssl: { rejectUnauthorized: false },      // SSL obrigatório Aurora DSQL
  connectionTimeoutMillis: 15000,          // Timeout conexão 15s
  max: 5                                   // Máximo 5 conexões simultâneas
};

// Exemplo de uso
const pool = new Pool(poolConfig);

console.log('Pool PostgreSQL configurado para Aurora DSQL:');
console.log(`Host: ${poolConfig.host}`);
console.log(`Port: ${poolConfig.port}`);
console.log(`Database: ${poolConfig.database}`);
console.log(`User: ${poolConfig.user}`);
console.log(`SSL: Obrigatório`);
console.log(`Max Connections: ${poolConfig.max}`);

module.exports = poolConfig;
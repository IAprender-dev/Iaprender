#!/usr/bin/env node

// Script para configurar o banco de dados
import { initializeSchema, checkTablesExist, validateSchema } from '../config/init-database.js';
import { testConnection } from '../config/database.js';
import logger from '../utils/logger.js';

async function setupDatabase() {
  try {
    logger.info('🚀 Iniciando configuração do banco de dados...');
    
    // Testar conexão
    const isConnected = await testConnection();
    if (!isConnected) {
      logger.error('❌ Falha na conexão com banco de dados');
      process.exit(1);
    }
    
    // Verificar tabelas existentes
    const tablesStatus = await checkTablesExist();
    logger.info('📊 Status das tabelas:', tablesStatus);
    
    // Inicializar schema se necessário
    if (!tablesStatus.usuarios) {
      logger.info('🔨 Criando tabela usuarios...');
      await initializeSchema();
    } else {
      logger.info('✅ Tabela usuarios já existe');
    }
    
    // Validar schema
    const isValid = await validateSchema();
    if (!isValid) {
      logger.error('❌ Schema inválido');
      process.exit(1);
    }
    
    logger.info('✅ Configuração do banco de dados concluída com sucesso!');
    
  } catch (error) {
    logger.error('💥 Erro na configuração do banco de dados:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (process.argv[1].endsWith('setup-database.js')) {
  setupDatabase()
    .then(() => {
      logger.info('🎯 Setup concluído');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Setup falhou:', error);
      process.exit(1);
    });
}

export { setupDatabase };
import { Router } from 'express';
import { DatabaseManager } from '../config/database-manager.js';

export const connectivityRouter = Router();

// Endpoint público para teste básico de conectividade
connectivityRouter.get('/test', async (req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    const isConnected = await dbManager.testConnection();
    
    res.json({
      success: isConnected,
      database: dbManager.getDatabaseType(),
      timestamp: new Date().toISOString(),
      message: isConnected ? 'Conexão estabelecida' : 'Falha na conexão'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para teste completo de conectividade (com detalhes)
connectivityRouter.get('/test/complete', async (req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    const result = await dbManager.testConnectivityComplete();
    
    res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para informações do sistema
connectivityRouter.get('/info', async (req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    
    res.json({
      database: {
        type: dbManager.getDatabaseType(),
        endpoint: process.env.ENDPOINT_AURORA ? 'Configurado' : 'Não configurado',
        token: process.env.TOKEN_AURORA ? 'Presente' : 'Ausente'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para health check simples
connectivityRouter.get('/health', async (req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    const isHealthy = await dbManager.testConnection();
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbManager.getDatabaseType(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
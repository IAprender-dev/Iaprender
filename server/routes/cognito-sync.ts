/**
 * ROTAS DE SINCRONIZAÇÃO AWS COGNITO
 * 
 * Endpoints para sincronização entre AWS Cognito e banco de dados local
 */

import { Router, Request, Response } from 'express';
import CognitoSyncService from '../services/CognitoSyncService';

const router = Router();

// Middleware de autenticação admin (reutilizar do sistema existente)
const authenticateAdmin = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token não fornecido' 
    });
  }

  // Verificação simples de token para demonstração
  // Em produção, usar JWT completo
  try {
    // Aqui seria a validação JWT completa
    // Por agora, apenas verificar se token existe
    if (token.length < 10) {
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token inválido',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * GET /api/cognito-sync/statistics
 * Obter estatísticas de sincronização
 */
router.get('/statistics', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const syncService = new CognitoSyncService();
    const statistics = await syncService.getSyncStatistics();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...statistics
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas de sincronização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de sincronização',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/cognito-sync/sync
 * Executar sincronização completa
 */
router.post('/sync', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🚀 Iniciando sincronização Cognito via API');
    
    const syncService = new CognitoSyncService();
    const result = await syncService.syncUsers();
    
    const statusCode = result.success ? 200 : 207; // 207 = Multi-Status (partial success)
    
    res.status(statusCode).json({
      success: result.success,
      timestamp: result.timestamp,
      message: result.success ? 
        'Sincronização concluída com sucesso' : 
        'Sincronização concluída com alguns erros',
      statistics: result.statistics,
      operations: result.operations,
      errors: result.errors
    });

  } catch (error) {
    console.error('❌ Erro crítico na sincronização:', error);
    res.status(500).json({
      success: false,
      message: 'Erro crítico na sincronização',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/cognito-sync/sync-all
 * Executar sincronização completa com paginação otimizada (baseado no método Python)
 */
router.post('/sync-all', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    console.log('🚀 Iniciando sincronização completa de todos os usuários via API');
    
    const syncService = new CognitoSyncService();
    const result = await syncService.syncAllUsers();
    
    const statusCode = result.success ? 200 : (result.users_processed > 0 ? 207 : 500);
    
    res.status(statusCode).json({
      success: result.success,
      timestamp: new Date().toISOString(),
      message: result.success 
        ? `Sincronização completa finalizada: ${result.users_processed} usuários processados`
        : `Sincronização parcial: ${result.users_processed} usuários processados com erros`,
      users_processed: result.users_processed,
      error: result.error || undefined
    });
    
  } catch (error) {
    console.error('❌ Erro no endpoint de sincronização completa:', error);
    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Erro interno no servidor',
      users_processed: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/cognito-sync/test-connection
 * Testar conectividade com AWS Cognito
 */
router.get('/test-connection', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const syncService = new CognitoSyncService();
    const connectionTest = await syncService.testConnection();
    
    const statusCode = connectionTest.success ? 200 : 503;
    
    res.status(statusCode).json({
      success: connectionTest.success,
      timestamp: new Date().toISOString(),
      message: connectionTest.message,
      details: connectionTest.details
    });

  } catch (error) {
    console.error('❌ Erro ao testar conexão Cognito:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar conexão com Cognito',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/cognito-sync/status
 * Obter status geral do serviço de sincronização
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const syncService = new CognitoSyncService();
    
    // Testar múltiplos aspectos
    const [connectionTest, statistics] = await Promise.allSettled([
      syncService.testConnection(),
      syncService.getSyncStatistics()
    ]);

    const connectionResult = connectionTest.status === 'fulfilled' ? connectionTest.value : null;
    const statisticsResult = statistics.status === 'fulfilled' ? statistics.value : null;

    const overallStatus = connectionResult?.success && statisticsResult?.success ? 'healthy' : 'degraded';

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: overallStatus,
      services: {
        cognito_connection: {
          status: connectionResult?.success ? 'ok' : 'error',
          message: connectionResult?.message || 'Não testado',
          details: connectionResult?.details
        },
        sync_statistics: {
          status: statisticsResult?.success ? 'ok' : 'error',
          data: statisticsResult?.statistics || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter status do serviço',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/cognito-sync/health
 * Endpoint de health check simples
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Health check básico sem autenticação
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'cognito-sync',
      status: 'running',
      version: '1.0.0'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
import { Express, Request, Response } from 'express';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { CacheManager } from '../utils/cache-manager';

export function registerPerformanceRoutes(app: Express) {
  // Middleware de autenticação para rotas administrativas
  const authenticateAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.user || req.session.user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };

  // GET /api/performance/metrics - Métricas de performance
  app.get('/api/performance/metrics', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = PerformanceMonitor.getMetrics();
      const slowQueries = PerformanceMonitor.getSlowQueries();
      const avgResponseTime = PerformanceMonitor.getAverageResponseTime();
      const cacheHitRate = PerformanceMonitor.getCacheHitRate();
      const topSlowEndpoints = PerformanceMonitor.getTopSlowEndpoints();
      
      res.json({
        success: true,
        data: {
          totalRequests: metrics.length,
          avgResponseTime,
          cacheHitRate,
          slowQueries: slowQueries.length,
          topSlowEndpoints,
          recentMetrics: metrics.slice(-50) // Last 50 requests
        }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // GET /api/performance/endpoints - Estatísticas por endpoint
  app.get('/api/performance/endpoints', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = PerformanceMonitor.getMetrics();
      const endpointStats = {};
      
      // Agrupar por endpoint
      metrics.forEach(metric => {
        if (!endpointStats[metric.endpoint]) {
          endpointStats[metric.endpoint] = {
            endpoint: metric.endpoint,
            requests: 0,
            totalDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            errors: 0
          };
        }
        
        const stats = endpointStats[metric.endpoint];
        stats.requests++;
        stats.totalDuration += metric.duration;
        stats.minDuration = Math.min(stats.minDuration, metric.duration);
        stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
        
        if (metric.status >= 400) {
          stats.errors++;
        }
      });
      
      // Calcular médias
      const result = Object.values(endpointStats).map((stats: any) => ({
        ...stats,
        avgDuration: Math.round(stats.totalDuration / stats.requests),
        errorRate: Math.round((stats.errors / stats.requests) * 100)
      }));
      
      res.json({
        success: true,
        data: result.sort((a, b) => b.avgDuration - a.avgDuration)
      });
    } catch (error) {
      console.error('Error fetching endpoint stats:', error);
      res.status(500).json({ error: 'Failed to fetch endpoint stats' });
    }
  });

  // GET /api/performance/cache - Estatísticas de cache
  app.get('/api/performance/cache', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const cacheStats = CacheManager.getStats();
      const hitRate = PerformanceMonitor.getCacheHitRate();
      
      res.json({
        success: true,
        data: {
          ...cacheStats,
          hitRate,
          efficiency: hitRate > 70 ? 'High' : hitRate > 40 ? 'Medium' : 'Low'
        }
      });
    } catch (error) {
      console.error('Error fetching cache stats:', error);
      res.status(500).json({ error: 'Failed to fetch cache stats' });
    }
  });

  // POST /api/performance/cache/clear - Limpar cache
  app.post('/api/performance/cache/clear', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      CacheManager.clear();
      
      res.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // GET /api/performance/real-time - Métricas em tempo real
  app.get('/api/performance/real-time', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = PerformanceMonitor.getMetrics();
      const last5Minutes = metrics.filter(m => 
        Date.now() - m.timestamp.getTime() < 5 * 60 * 1000
      );
      
      const currentLoad = {
        requestsPerMinute: Math.round(last5Minutes.length / 5),
        avgResponseTime: last5Minutes.length > 0 
          ? Math.round(last5Minutes.reduce((sum, m) => sum + m.duration, 0) / last5Minutes.length)
          : 0,
        errorRate: last5Minutes.length > 0
          ? Math.round((last5Minutes.filter(m => m.status >= 400).length / last5Minutes.length) * 100)
          : 0,
        activeUsers: new Set(last5Minutes.map(m => m.user_id).filter(Boolean)).size
      };
      
      res.json({
        success: true,
        data: currentLoad
      });
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      res.status(500).json({ error: 'Failed to fetch real-time metrics' });
    }
  });

  // GET /api/performance/alerts - Alertas de performance
  app.get('/api/performance/alerts', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const metrics = PerformanceMonitor.getMetrics();
      const alerts = [];
      
      // Verificar queries lentas
      const slowQueries = metrics.filter(m => m.duration > 1000);
      if (slowQueries.length > 0) {
        alerts.push({
          type: 'slow_query',
          severity: 'high',
          message: `${slowQueries.length} queries took more than 1 second`,
          timestamp: new Date()
        });
      }
      
      // Verificar taxa de erro
      const last100 = metrics.slice(-100);
      const errorRate = last100.filter(m => m.status >= 400).length / last100.length;
      if (errorRate > 0.05) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'medium',
          message: `Error rate is ${Math.round(errorRate * 100)}%`,
          timestamp: new Date()
        });
      }
      
      // Verificar cache hit rate
      const cacheHitRate = PerformanceMonitor.getCacheHitRate();
      if (cacheHitRate < 30) {
        alerts.push({
          type: 'low_cache_hit',
          severity: 'medium',
          message: `Cache hit rate is only ${cacheHitRate}%`,
          timestamp: new Date()
        });
      }
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });
}
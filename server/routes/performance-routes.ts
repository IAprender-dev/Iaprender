import { Express, Request, Response } from 'express';
import { performanceMonitor } from '../utils/performance-monitor';
import { db } from '../db';

export function registerPerformanceRoutes(app: Express) {
  
  // GET /api/performance/stats - Estatísticas de performance
  app.get('/api/performance/stats', async (req: Request, res: Response) => {
    try {
      const stats = performanceMonitor.getPerformanceStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      res.status(500).json({ error: 'Failed to fetch performance stats' });
    }
  });

  // GET /api/performance/slow-queries - Queries lentas
  app.get('/api/performance/slow-queries', async (req: Request, res: Response) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 1000;
      const slowQueries = performanceMonitor.getSlowQueries(threshold);
      res.json({ success: true, slowQueries, threshold });
    } catch (error) {
      console.error('Error fetching slow queries:', error);
      res.status(500).json({ error: 'Failed to fetch slow queries' });
    }
  });

  // POST /api/performance/explain - EXPLAIN ANALYZE para uma query específica
  app.post('/api/performance/explain', async (req: Request, res: Response) => {
    try {
      const { query, params } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const result = await performanceMonitor.explainAnalyze(query, params);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error explaining query:', error);
      res.status(500).json({ error: 'Failed to explain query' });
    }
  });

  // GET /api/performance/database-stats - Estatísticas do banco de dados
  app.get('/api/performance/database-stats', async (req: Request, res: Response) => {
    try {
      // Estatísticas de conexões ativas
      const connectionsResult = await db.execute(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      // Estatísticas de tamanho das tabelas
      const tableSizesResult = await db.execute(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `);

      // Estatísticas de índices
      const indexStatsResult = await db.execute(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC
        LIMIT 10
      `);

      // Queries mais lentas do log
      const slowestQueriesResult = await db.execute(`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat%'
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);

      res.json({
        success: true,
        stats: {
          connections: connectionsResult.rows[0],
          tableSizes: tableSizesResult.rows,
          indexStats: indexStatsResult.rows,
          slowestQueries: slowestQueriesResult.rows
        }
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      res.status(500).json({ error: 'Failed to fetch database stats' });
    }
  });

  // DELETE /api/performance/clear-logs - Limpar logs de performance
  app.delete('/api/performance/clear-logs', async (req: Request, res: Response) => {
    try {
      performanceMonitor.clearLogs();
      res.json({ success: true, message: 'Performance logs cleared' });
    } catch (error) {
      console.error('Error clearing performance logs:', error);
      res.status(500).json({ error: 'Failed to clear performance logs' });
    }
  });

  // GET /api/performance/real-time - Monitoramento em tempo real
  app.get('/api/performance/real-time', async (req: Request, res: Response) => {
    try {
      // Atividade atual do banco
      const currentActivityResult = await db.execute(`
        SELECT 
          pid,
          usename,
          application_name,
          client_addr,
          state,
          query_start,
          query
        FROM pg_stat_activity 
        WHERE datname = current_database() AND state = 'active'
        ORDER BY query_start DESC
        LIMIT 20
      `);

      // Cache hit ratio
      const cacheHitResult = await db.execute(`
        SELECT 
          sum(heap_blks_read) as heap_read,
          sum(heap_blks_hit) as heap_hit,
          round(sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      // Locks
      const locksResult = await db.execute(`
        SELECT 
          mode,
          count(*) as count
        FROM pg_locks 
        WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY mode
        ORDER BY count DESC
      `);

      res.json({
        success: true,
        realTimeStats: {
          currentActivity: currentActivityResult.rows,
          cacheHitRatio: cacheHitResult.rows[0],
          locks: locksResult.rows,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      res.status(500).json({ error: 'Failed to fetch real-time stats' });
    }
  });
}
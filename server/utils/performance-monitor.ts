import { db } from '../db';

export interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: Date;
  route?: string;
}

export class PerformanceMonitor {
  private queryLogs: QueryPerformance[] = [];
  private maxLogs = 100;

  // Executa query com EXPLAIN ANALYZE para análise de performance
  async explainAnalyze(query: string, params?: any[]): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Executa EXPLAIN ANALYZE
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      console.log(`\n🔍 [EXPLAIN ANALYZE] Query: ${query}`);
      console.log(`📊 [EXPLAIN ANALYZE] Params:`, params);
      
      const result = await db.execute(explainQuery);
      const duration = Date.now() - startTime;
      
      console.log(`⏱️  [PERFORMANCE] Query executada em ${duration}ms`);
      console.log(`📈 [EXPLAIN ANALYZE] Plano de execução:`, JSON.stringify(result.rows[0], null, 2));
      
      // Salva log de performance
      this.addQueryLog({
        query,
        duration,
        timestamp: new Date()
      });
      
      return result.rows[0];
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [PERFORMANCE ERROR] Query falhou em ${duration}ms:`, error);
      throw error;
    }
  }

  // Monitora performance de uma função
  async monitorQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    route?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 [QUERY START] ${operation}${route ? ` (${route})` : ''}`);
      
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      console.log(`✅ [QUERY SUCCESS] ${operation} executada em ${duration}ms`);
      
      this.addQueryLog({
        query: operation,
        duration,
        timestamp: new Date(),
        route
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [QUERY ERROR] ${operation} falhou em ${duration}ms:`, error);
      throw error;
    }
  }

  // Adiciona log de query
  private addQueryLog(log: QueryPerformance) {
    this.queryLogs.push(log);
    
    // Mantém apenas os últimos logs
    if (this.queryLogs.length > this.maxLogs) {
      this.queryLogs = this.queryLogs.slice(-this.maxLogs);
    }
  }

  // Retorna estatísticas de performance
  getPerformanceStats() {
    if (this.queryLogs.length === 0) {
      return {
        totalQueries: 0,
        averageDuration: 0,
        slowestQuery: null,
        fastestQuery: null,
        recentQueries: []
      };
    }

    const durations = this.queryLogs.map(log => log.duration);
    const sorted = [...durations].sort((a, b) => b - a);
    
    return {
      totalQueries: this.queryLogs.length,
      averageDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      slowestQuery: {
        duration: sorted[0],
        query: this.queryLogs.find(log => log.duration === sorted[0])?.query
      },
      fastestQuery: {
        duration: sorted[sorted.length - 1],
        query: this.queryLogs.find(log => log.duration === sorted[sorted.length - 1])?.query
      },
      recentQueries: this.queryLogs.slice(-10).map(log => ({
        query: log.query,
        duration: log.duration,
        route: log.route,
        timestamp: log.timestamp.toISOString()
      }))
    };
  }

  // Identifica queries lentas
  getSlowQueries(threshold: number = 1000) {
    return this.queryLogs
      .filter(log => log.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  // Limpa logs
  clearLogs() {
    this.queryLogs = [];
  }
}

// Instância global do monitor
export const performanceMonitor = new PerformanceMonitor();

// Middleware para monitorar tempo de resposta das rotas
export const performanceMiddleware = (routeName: string) => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const method = req.method;
      const path = req.path;
      const status = res.statusCode;
      
      console.log(`📊 [ROUTE PERFORMANCE] ${method} ${path} - ${status} - ${duration}ms`);
      
      // Log queries lentas (> 500ms)
      if (duration > 500) {
        console.warn(`⚠️  [SLOW ROUTE] ${method} ${path} demorou ${duration}ms`);
      }
      
      performanceMonitor.monitorQuery(
        `${method} ${path}`,
        async () => ({ status, duration }),
        routeName
      );
    });
    
    next();
  };
};
import { Request, Response, NextFunction } from 'express';
import { CacheManager } from './cache-manager';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: Date;
  status: number;
  query_count?: number;
  cache_hit?: boolean;
  user_id?: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static maxMetrics = 1000; // Keep last 1000 metrics
  
  static recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log slow queries for debugging
    if (metric.duration > 500) {
      console.warn(`⚠️  [SLOW QUERY] ${metric.method} ${metric.endpoint} took ${metric.duration}ms`);
    }
  }
  
  static getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }
  
  static getSlowQueries(threshold = 500): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }
  
  static getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, metric) => acc + metric.duration, 0);
    return Math.round(sum / this.metrics.length);
  }
  
  static getEndpointStats(endpoint: string): {
    avg: number;
    min: number;
    max: number;
    count: number;
  } {
    const endpointMetrics = this.metrics.filter(m => m.endpoint === endpoint);
    
    if (endpointMetrics.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    
    const durations = endpointMetrics.map(m => m.duration);
    return {
      avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length
    };
  }
  
  static getCacheHitRate(): number {
    const metricsWithCache = this.metrics.filter(m => m.cache_hit !== undefined);
    if (metricsWithCache.length === 0) return 0;
    
    const hits = metricsWithCache.filter(m => m.cache_hit === true).length;
    return Math.round((hits / metricsWithCache.length) * 100);
  }
  
  static getTopSlowEndpoints(limit = 10): Array<{
    endpoint: string;
    avgDuration: number;
    count: number;
  }> {
    const endpointGroups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = [];
      }
      acc[metric.endpoint].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);
    
    return Object.entries(endpointGroups)
      .map(([endpoint, durations]) => ({
        endpoint,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        count: durations.length
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }
}

// Middleware para monitorar performance
export const performanceMiddleware = (routeName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Interceptar response para capturar métricas
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Verificar se foi cache hit
      const cacheHit = req.headers['x-cache-status'] === 'HIT';
      
      const metric: PerformanceMetrics = {
        endpoint: routeName,
        method: req.method,
        duration,
        timestamp: new Date(),
        status: res.statusCode,
        cache_hit: cacheHit,
        user_id: req.session?.user?.id
      };
      
      PerformanceMonitor.recordMetric(metric);
      
      // Log em tempo real
      const status = res.statusCode < 400 ? '✅' : '❌';
      const cacheStatus = cacheHit ? '📦' : '🔍';
      console.log(`${status} ${cacheStatus} [${req.method}] ${routeName} - ${duration}ms - ${res.statusCode}`);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para adicionar headers de cache
export const cacheMiddleware = (key: string, ttl: number = 60) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cached = CacheManager.get(key);
    
    if (cached) {
      req.headers['x-cache-status'] = 'HIT';
      return res.json(cached);
    }
    
    req.headers['x-cache-status'] = 'MISS';
    
    // Interceptar response para cachear
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode === 200) {
        CacheManager.set(key, data, ttl);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};
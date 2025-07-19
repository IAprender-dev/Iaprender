import NodeCache from 'node-cache';
import { createHash } from 'crypto';
import { Logger } from './logger';
import { MetricsCollector, getMetrics } from './metrics';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  checkPeriod?: number; // Check period for expired keys in seconds
  maxKeys?: number; // Maximum number of keys
  useClones?: boolean; // Clone objects on get/set
}

export class Cache {
  private cache: NodeCache;
  private logger: Logger;
  private metrics: MetricsCollector;
  private namespace: string;

  constructor(namespace: string, defaultTtl: number = 300, options?: CacheOptions) {
    this.namespace = namespace;
    this.logger = new Logger(`Cache:${namespace}`);
    this.metrics = getMetrics();

    this.cache = new NodeCache({
      stdTTL: defaultTtl,
      checkperiod: options?.checkPeriod || 120,
      maxKeys: options?.maxKeys || 10000,
      useClones: options?.useClones !== false,
      deleteOnExpire: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.cache.on('set', (key: string) => {
      this.metrics.increment('cache.set', { namespace: this.namespace });
      this.logger.debug('Cache set', { key });
    });

    this.cache.on('del', (key: string) => {
      this.metrics.increment('cache.delete', { namespace: this.namespace });
      this.logger.debug('Cache delete', { key });
    });

    this.cache.on('expired', (key: string) => {
      this.metrics.increment('cache.expired', { namespace: this.namespace });
      this.logger.debug('Cache expired', { key });
    });

    this.cache.on('flush', () => {
      this.metrics.increment('cache.flush', { namespace: this.namespace });
      this.logger.info('Cache flushed');
    });
  }

  public get<T = any>(key: string): T | undefined {
    const timer = this.metrics.startTimer();
    
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const value = this.cache.get<T>(namespacedKey);
      
      const duration = timer();
      this.metrics.timing('cache.get.duration', duration, { 
        namespace: this.namespace,
        hit: value !== undefined 
      });
      
      if (value !== undefined) {
        this.metrics.increment('cache.hits', { namespace: this.namespace });
      } else {
        this.metrics.increment('cache.misses', { namespace: this.namespace });
      }
      
      return value;
    } catch (error) {
      this.logger.error('Cache get error', error, { key });
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'get' 
      });
      return undefined;
    }
  }

  public set<T = any>(key: string, value: T, ttl?: number): boolean {
    const timer = this.metrics.startTimer();
    
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const success = ttl !== undefined 
        ? this.cache.set(namespacedKey, value, ttl)
        : this.cache.set(namespacedKey, value);
      
      const duration = timer();
      this.metrics.timing('cache.set.duration', duration, { 
        namespace: this.namespace 
      });
      
      return success;
    } catch (error) {
      this.logger.error('Cache set error', error, { key });
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'set' 
      });
      return false;
    }
  }

  public delete(key: string): boolean {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return this.cache.del(namespacedKey) > 0;
    } catch (error) {
      this.logger.error('Cache delete error', error, { key });
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'delete' 
      });
      return false;
    }
  }

  public deletePattern(pattern: string): number {
    try {
      const keys = this.cache.keys();
      const regex = new RegExp(pattern);
      const namespacedPattern = this.getNamespacedKey('');
      
      const keysToDelete = keys.filter(key => 
        key.startsWith(namespacedPattern) && 
        regex.test(key.substring(namespacedPattern.length))
      );
      
      return this.cache.del(keysToDelete);
    } catch (error) {
      this.logger.error('Cache delete pattern error', error, { pattern });
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'deletePattern' 
      });
      return 0;
    }
  }

  public has(key: string): boolean {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return this.cache.has(namespacedKey);
    } catch (error) {
      this.logger.error('Cache has error', error, { key });
      return false;
    }
  }

  public ttl(key: string): number | undefined {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const ttl = this.cache.getTtl(namespacedKey);
      return ttl || undefined;
    } catch (error) {
      this.logger.error('Cache ttl error', error, { key });
      return undefined;
    }
  }

  public flush(): void {
    try {
      const keys = this.cache.keys();
      const namespacedPrefix = this.getNamespacedKey('');
      const namespacedKeys = keys.filter(key => key.startsWith(namespacedPrefix));
      
      this.cache.del(namespacedKeys);
      this.logger.info('Cache namespace flushed', { 
        namespace: this.namespace,
        keysDeleted: namespacedKeys.length 
      });
    } catch (error) {
      this.logger.error('Cache flush error', error);
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'flush' 
      });
    }
  }

  public getStats(): {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  } {
    const stats = this.cache.getStats();
    const keys = this.cache.keys();
    const namespacedPrefix = this.getNamespacedKey('');
    const namespacedKeys = keys.filter(key => key.startsWith(namespacedPrefix));
    
    return {
      ...stats,
      keys: namespacedKeys.length
    };
  }

  public mget<T = any>(keys: string[]): { [key: string]: T } {
    const timer = this.metrics.startTimer();
    
    try {
      const namespacedKeys = keys.map(key => this.getNamespacedKey(key));
      const values = this.cache.mget<T>(namespacedKeys);
      
      const result: { [key: string]: T } = {};
      keys.forEach((key, index) => {
        const namespacedKey = namespacedKeys[index];
        if (values[namespacedKey] !== undefined) {
          result[key] = values[namespacedKey];
        }
      });
      
      const duration = timer();
      this.metrics.timing('cache.mget.duration', duration, { 
        namespace: this.namespace,
        keyCount: keys.length,
        hitCount: Object.keys(result).length
      });
      
      return result;
    } catch (error) {
      this.logger.error('Cache mget error', error);
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'mget' 
      });
      return {};
    }
  }

  public mset<T = any>(keyValuePairs: Array<{ key: string; val: T; ttl?: number }>): boolean {
    const timer = this.metrics.startTimer();
    
    try {
      const namespacedPairs = keyValuePairs.map(pair => ({
        key: this.getNamespacedKey(pair.key),
        val: pair.val,
        ttl: pair.ttl
      }));
      
      const success = this.cache.mset(namespacedPairs);
      
      const duration = timer();
      this.metrics.timing('cache.mset.duration', duration, { 
        namespace: this.namespace,
        keyCount: keyValuePairs.length
      });
      
      return success;
    } catch (error) {
      this.logger.error('Cache mset error', error);
      this.metrics.increment('cache.errors', { 
        namespace: this.namespace, 
        operation: 'mset' 
      });
      return false;
    }
  }

  private getNamespacedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  // Utility method for caching async operations
  public async wrap<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    try {
      const result = await fn();
      this.set(key, result, ttl);
      return result;
    } catch (error) {
      this.logger.error('Cache wrap error', error, { key });
      throw error;
    }
  }

  // Create a cache key from multiple parts
  public static createKey(...parts: (string | number | boolean)[]): string {
    return parts.map(p => String(p)).join(':');
  }

  // Create a hash-based cache key for long strings
  public static createHashKey(data: string | object): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}

// Global cache instances
const cacheInstances = new Map<string, Cache>();

export function getCache(namespace: string, ttl?: number, options?: CacheOptions): Cache {
  if (!cacheInstances.has(namespace)) {
    cacheInstances.set(namespace, new Cache(namespace, ttl, options));
  }
  return cacheInstances.get(namespace)!;
}

export function clearAllCaches(): void {
  cacheInstances.forEach(cache => cache.flush());
  cacheInstances.clear();
}
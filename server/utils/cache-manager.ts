// Simple in-memory cache implementation since LRU-cache may not be available
class SimpleCache {
  private cache = new Map<string, any>();
  private maxSize = 500;

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }
}

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private static cache = new SimpleCache();

  static set(key: string, value: any, ttlSeconds: number = 300): void {
    const item: CacheItem = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };
    
    this.cache.set(key, item);
    console.log(`📦 [CACHE SET] ${key} cached for ${ttlSeconds}s`);
  }

  static get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`❌ [CACHE MISS] ${key} not found`);
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      console.log(`⏰ [CACHE EXPIRED] ${key} expired`);
      return null;
    }

    console.log(`✅ [CACHE HIT] ${key} returned from cache`);
    return item.data;
  }

  static delete(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ [CACHE DELETE] ${key} removed`);
  }

  static clear(): void {
    this.cache.clear();
    console.log(`🧹 [CACHE CLEAR] All cache cleared`);
  }

  static getStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.cache.hits || 0,
      misses: this.cache.misses || 0
    };
  }

  // Cache invalidation patterns
  static invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const keysToDelete = keys.filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🔄 [CACHE INVALIDATE] Removed ${keysToDelete.length} keys matching pattern: ${pattern}`);
  }

  // User-specific cache invalidation
  static invalidateUserCache(userId: number): void {
    this.invalidatePattern(`user-${userId}`);
    this.invalidatePattern(`-${userId}`);
  }

  // Company-specific cache invalidation
  static invalidateCompanyCache(companyId: number): void {
    this.invalidatePattern(`company-${companyId}`);
    this.invalidatePattern(`-${companyId}`);
  }
}
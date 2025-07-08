// Cache Manager para otimização de performance
export class CacheManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Verificar se expirou
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear(pattern?: string) {
    if (pattern) {
      // Limpar chaves que contenham o padrão
      for (const [key] of this.cache) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  static invalidateUserCache(userId: number) {
    this.clear(`user_${userId}`);
  }
}
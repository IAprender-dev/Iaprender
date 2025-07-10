/**
 * SISTEMA DE CACHE AVANÇADO - IAPRENDER
 * 
 * Sistema de cache em memória e localStorage com TTL e estratégias de invalidação
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'both';
  compressionEnabled: boolean;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private readonly STORAGE_PREFIX = 'iaprender_cache_';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 100,
      storage: 'both',
      compressionEnabled: true,
      ...config
    };

    // Limpar cache expirado na inicialização
    this.cleanExpired();
    
    // Configurar limpeza automática a cada minuto
    setInterval(() => this.cleanExpired(), 60000);
  }

  /**
   * Armazenar dados no cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    };

    // Cache em memória
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      this.memoryCache.set(key, cacheItem);
      this.enforceMaxSize();
    }

    // Cache no localStorage
    if (this.config.storage === 'localStorage' || this.config.storage === 'both') {
      try {
        const serialized = this.config.compressionEnabled 
          ? this.compress(JSON.stringify(cacheItem))
          : JSON.stringify(cacheItem);
        
        localStorage.setItem(this.STORAGE_PREFIX + key, serialized);
      } catch (error) {
        console.warn('Erro ao salvar no localStorage:', error);
      }
    }
  }

  /**
   * Recuperar dados do cache
   */
  get<T>(key: string): T | null {
    let cacheItem: CacheItem<T> | null = null;

    // Tentar cache em memória primeiro
    if (this.config.storage === 'memory' || this.config.storage === 'both') {
      cacheItem = this.memoryCache.get(key) || null;
    }

    // Fallback para localStorage
    if (!cacheItem && (this.config.storage === 'localStorage' || this.config.storage === 'both')) {
      try {
        const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
        if (stored) {
          const decompressed = this.config.compressionEnabled 
            ? this.decompress(stored)
            : stored;
          
          cacheItem = JSON.parse(decompressed);
          
          // Sincronizar com cache em memória
          if (cacheItem && (this.config.storage === 'both')) {
            this.memoryCache.set(key, cacheItem);
          }
        }
      } catch (error) {
        console.warn('Erro ao ler do localStorage:', error);
        this.remove(key);
      }
    }

    // Verificar se não expirou
    if (cacheItem && this.isExpired(cacheItem)) {
      this.remove(key);
      return null;
    }

    return cacheItem ? cacheItem.data : null;
  }

  /**
   * Verificar se um item existe no cache
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remover item do cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(this.STORAGE_PREFIX + key);
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.memoryCache.clear();
    
    // Limpar apenas itens do IAprender no localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Limpar itens expirados
   */
  private cleanExpired(): void {
    const now = Date.now();
    
    // Limpar memória
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Limpar localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const decompressed = this.config.compressionEnabled 
              ? this.decompress(stored)
              : stored;
            
            const item = JSON.parse(decompressed);
            if (this.isExpired(item)) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Verificar se um item expirou
   */
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  /**
   * Enforçar tamanho máximo do cache em memória
   */
  private enforceMaxSize(): void {
    if (this.memoryCache.size > this.config.maxSize) {
      // Remover os itens mais antigos
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.config.maxSize);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  /**
   * Compressão simples usando base64 (pode ser melhorada com LZ-string)
   */
  private compress(data: string): string {
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  /**
   * Descompressão
   */
  private decompress(data: string): string {
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): {
    memorySize: number;
    localStorageSize: number;
    totalItems: number;
    expiredItems: number;
  } {
    let localStorageSize = 0;
    let totalItems = 0;
    let expiredItems = 0;

    // Contar itens no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        totalItems++;
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            localStorageSize += stored.length;
            
            const decompressed = this.config.compressionEnabled 
              ? this.decompress(stored)
              : stored;
            
            const item = JSON.parse(decompressed);
            if (this.isExpired(item)) {
              expiredItems++;
            }
          }
        } catch {
          expiredItems++;
        }
      }
    }

    // Contar expirados na memória
    for (const item of this.memoryCache.values()) {
      if (this.isExpired(item)) {
        expiredItems++;
      }
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize,
      totalItems: totalItems + this.memoryCache.size,
      expiredItems
    };
  }
}

// ===== CACHE ESPECÍFICO PARA FORMULÁRIOS =====
class FormCache extends CacheManager {
  constructor() {
    super({
      defaultTTL: 10 * 60 * 1000, // 10 minutos para formulários
      maxSize: 50,
      storage: 'both',
      compressionEnabled: true
    });
  }

  /**
   * Cache de configuração de formulário
   */
  setFormConfig(formType: string, config: any): void {
    this.set(`form_config_${formType}`, config, 30 * 60 * 1000); // 30 minutos
  }

  getFormConfig(formType: string): any | null {
    return this.get(`form_config_${formType}`);
  }

  /**
   * Cache de dados do usuário
   */
  setUserData(userId: string, data: any): void {
    this.set(`user_data_${userId}`, data, 5 * 60 * 1000); // 5 minutos
  }

  getUserData(userId: string): any | null {
    return this.get(`user_data_${userId}`);
  }

  /**
   * Cache de listas (escolas, empresas, etc.)
   */
  setListData(listType: string, data: any[]): void {
    this.set(`list_${listType}`, data, 15 * 60 * 1000); // 15 minutos
  }

  getListData(listType: string): any[] | null {
    return this.get(`list_${listType}`);
  }

  /**
   * Invalidar cache relacionado a um usuário
   */
  invalidateUser(userId: string): void {
    const keysToInvalidate = [
      `user_data_${userId}`,
      `user_profile_${userId}`,
      `user_permissions_${userId}`
    ];

    keysToInvalidate.forEach(key => this.remove(key));
  }

  /**
   * Invalidar cache de listas
   */
  invalidateLists(): void {
    const listTypes = ['escolas', 'empresas', 'usuarios', 'contratos'];
    listTypes.forEach(type => this.remove(`list_${type}`));
  }
}

// ===== INSTÂNCIAS GLOBAIS =====
export const globalCache = new CacheManager({
  defaultTTL: 5 * 60 * 1000,
  maxSize: 100,
  storage: 'both'
});

export const formCache = new FormCache();

// ===== HOOKS PARA REACT =====
import React from 'react';

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetcher();
      setData(result);
      globalCache.set(key, result, ttl);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  React.useEffect(() => {
    const cachedData = globalCache.get<T>(key);
    
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
    } else {
      refresh();
    }
  }, [key, refresh]);

  return { data, loading, error, refresh };
}

export { CacheManager, FormCache };
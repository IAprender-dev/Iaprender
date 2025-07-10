/**
 * SISTEMA DE OTIMIZAÇÃO DE PERFORMANCE - IAPRENDER
 * 
 * Debounce, throttle, memoização e otimizações gerais de performance
 */

import React from 'react';
import { formCache } from './cache';

// ===== DEBOUNCE E THROTTLE =====

/**
 * Debounce - atrasa execução até que pare de ser chamada
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle - limita execução a uma vez por período
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let isThrottled = false;
  let lastArgs: Parameters<T>;
  
  return function throttled(...args: Parameters<T>) {
    if (isThrottled) {
      lastArgs = args;
      return;
    }
    
    func.apply(this, args);
    isThrottled = true;
    
    setTimeout(() => {
      isThrottled = false;
      if (lastArgs) {
        throttled.apply(this, lastArgs);
        lastArgs = null as any;
      }
    }, delay);
  };
}

// ===== MEMOIZAÇÃO =====

interface MemoCache<T> {
  value: T;
  timestamp: number;
  hitCount: number;
}

class Memoizer {
  private cache = new Map<string, MemoCache<any>>();
  private readonly maxCacheSize = 100;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Memoizar função com cache
   */
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    const generateKey = keyGenerator || this.defaultKeyGenerator.bind(this);
    const timeToLive = ttl || this.defaultTTL;

    return ((...args: Parameters<T>) => {
      const key = generateKey(...args);
      const now = Date.now();
      const cached = this.cache.get(key);

      // Verificar se cache é válido
      if (cached && (now - cached.timestamp) < timeToLive) {
        cached.hitCount++;
        return cached.value;
      }

      // Executar função e cachear resultado
      const result = func(...args);
      this.cache.set(key, {
        value: result,
        timestamp: now,
        hitCount: 1
      });

      this.enforceMaxSize();
      return result;
    }) as T;
  }

  /**
   * Gerar chave padrão para cache
   */
  private defaultKeyGenerator(...args: any[]): string {
    return JSON.stringify(args);
  }

  /**
   * Enforçar tamanho máximo do cache
   */
  private enforceMaxSize(): void {
    if (this.cache.size > this.maxCacheSize) {
      // Remover item menos usado
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, value] of this.cache.entries()) {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Limpar cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats(): {
    size: number;
    maxSize: number;
    totalHits: number;
    avgHitsPerItem: number;
  } {
    let totalHits = 0;
    for (const cached of this.cache.values()) {
      totalHits += cached.hitCount;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      totalHits,
      avgHitsPerItem: this.cache.size ? totalHits / this.cache.size : 0
    };
  }
}

export const memoizer = new Memoizer();

// ===== HOOK DE PESQUISA COM DEBOUNCE =====

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ===== BUSCA AVANÇADA COM CACHE =====

export function useAdvancedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  options: {
    minLength?: number;
    caseSensitive?: boolean;
    useCache?: boolean;
    debounceMs?: number;
  } = {}
) {
  const {
    minLength = 2,
    caseSensitive = false,
    useCache = true,
    debounceMs = 300
  } = options;

  const [searchTerm, setSearchTerm] = React.useState('');
  const [filteredItems, setFilteredItems] = React.useState<T[]>(items);
  const [isSearching, setIsSearching] = React.useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Função de busca memoizada
  const searchFunction = React.useMemo(() => {
    return useCache ? memoizer.memoize(
      performSearch,
      (term, items) => `search_${term}_${items.length}`,
      { ttl: 2 * 60 * 1000 } // 2 minutos
    ) : performSearch;
  }, [useCache]);

  function performSearch(term: string, itemsToSearch: T[]): T[] {
    if (!term || term.length < minLength) {
      return itemsToSearch;
    }

    const searchValue = caseSensitive ? term : term.toLowerCase();

    return itemsToSearch.filter(item => {
      return searchFields.some(field => {
        const fieldValue = String(item[field] || '');
        const normalizedValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();
        return normalizedValue.includes(searchValue);
      });
    });
  }

  React.useEffect(() => {
    setIsSearching(true);
    
    // Simular busca async para não bloquear UI
    const searchPromise = new Promise<T[]>(resolve => {
      setTimeout(() => {
        const results = searchFunction(debouncedSearchTerm, items);
        resolve(results);
      }, 0);
    });

    searchPromise.then(results => {
      setFilteredItems(results);
      setIsSearching(false);
    });
  }, [debouncedSearchTerm, items, searchFunction]);

  return {
    filteredItems,
    isSearching,
    searchTerm: debouncedSearchTerm,
    resultCount: filteredItems.length,
    setSearchTerm
  };
}

// ===== COMPONENTE DE CAMPO DE BUSCA =====
interface PerformantSearchFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  showResultCount?: boolean;
  resultCount?: number;
  className?: string;
}

export const PerformantSearchField: React.FC<PerformantSearchFieldProps> = ({
  placeholder = "Pesquisar...",
  value,
  onChange,
  debounceMs = 300,
  showResultCount = false,
  resultCount = 0,
  className = ""
}) => {
  const [inputValue, setInputValue] = React.useState(value);
  const debouncedOnChange = React.useMemo(
    () => debounce(onChange, debounceMs),
    [onChange, debounceMs]
  );

  React.useEffect(() => {
    debouncedOnChange(inputValue);
  }, [inputValue, debouncedOnChange]);

  return React.createElement('div', { className: `relative ${className}` },
    React.createElement('div', { className: 'relative' },
      React.createElement('input', {
        type: 'text',
        value: inputValue,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value),
        placeholder: placeholder,
        className: 'w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      }),
      React.createElement('div', { className: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none' },
        React.createElement('svg', { 
          className: 'h-5 w-5 text-gray-400', 
          fill: 'none', 
          stroke: 'currentColor', 
          viewBox: '0 0 24 24' 
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round', 
            strokeWidth: 2,
            d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          })
        )
      ),
      inputValue && React.createElement('button', {
        onClick: () => {
          setInputValue('');
          onChange('');
        },
        className: 'absolute inset-y-0 right-0 pr-3 flex items-center'
      },
        React.createElement('svg', {
          className: 'h-5 w-5 text-gray-400 hover:text-gray-600',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M6 18L18 6M6 6l12 12'
          })
        )
      )
    ),
    showResultCount && React.createElement('div', { className: 'mt-1 text-sm text-gray-500' },
      resultCount === 0 && inputValue.length >= 2 
        ? "Nenhum resultado encontrado" 
        : resultCount > 0 
          ? `${resultCount} resultado${resultCount !== 1 ? 's' : ''} encontrado${resultCount !== 1 ? 's' : ''}`
          : ""
    )
  );
};

// ===== VIRTUAL SCROLLING =====
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    visibleRange,
    setScrollTop
  };
}

// ===== LAZY LOADING DE IMAGENS =====
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = React.useState(placeholder || '');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          img.onerror = () => {
            setIsError(true);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, isError, ref: imgRef };
}

// ===== MEDIÇÃO DE PERFORMANCE =====
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static startMeasurement(name: string): void {
    performance.mark(`${name}-start`);
  }

  static endMeasurement(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    const duration = measure.duration;

    // Armazenar medição
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    // Manter apenas as últimas 100 medições
    const measurements = this.measurements.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }

    return duration;
  }

  static getAverageTime(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static getAllStats(): Record<string, { average: number; count: number; last: number }> {
    const stats: Record<string, { average: number; count: number; last: number }> = {};
    
    for (const [name, measurements] of this.measurements.entries()) {
      stats[name] = {
        average: this.getAverageTime(name),
        count: measurements.length,
        last: measurements[measurements.length - 1] || 0
      };
    }
    
    return stats;
  }
}

// ===== HOOK PARA MONITORAMENTO DE PERFORMANCE =====
export function usePerformanceMonitor(name: string) {
  const startTime = React.useRef<number>(0);

  const start = React.useCallback(() => {
    startTime.current = performance.now();
    PerformanceMonitor.startMeasurement(name);
  }, [name]);

  const end = React.useCallback(() => {
    const duration = PerformanceMonitor.endMeasurement(name);
    return duration;
  }, [name]);

  const getAverage = React.useCallback(() => {
    return PerformanceMonitor.getAverageTime(name);
  }, [name]);

  return { start, end, getAverage };
}
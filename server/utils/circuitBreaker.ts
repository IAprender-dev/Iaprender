import { EventEmitter } from 'events';
import { Logger } from './logger';
import { MetricsCollector, getMetrics } from './metrics';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold?: number;
  resetTimeout: number;
  monitoringPeriod?: number;
  volumeThreshold?: number;
  errorPercentageThreshold?: number;
  onStateChange?: (oldState: CircuitState, newState: CircuitState, service: string) => void;
}

interface ServiceStats {
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  state: CircuitState;
  nextAttempt?: number;
  totalRequests: number;
  errorPercentage: number;
  window: Array<{ timestamp: number; success: boolean }>;
}

export class CircuitBreaker extends EventEmitter {
  private options: Required<CircuitBreakerOptions>;
  private serviceStats: Map<string, ServiceStats>;
  private logger: Logger;
  private metrics: MetricsCollector;
  private timers: Map<string, NodeJS.Timeout>;

  constructor(options: CircuitBreakerOptions) {
    super();
    
    this.options = {
      failureThreshold: options.failureThreshold,
      successThreshold: options.successThreshold || 2,
      resetTimeout: options.resetTimeout,
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      volumeThreshold: options.volumeThreshold || 10,
      errorPercentageThreshold: options.errorPercentageThreshold || 50,
      onStateChange: options.onStateChange || (() => {})
    };

    this.serviceStats = new Map();
    this.logger = new Logger('CircuitBreaker');
    this.metrics = getMetrics();
    this.timers = new Map();
  }

  /**
   * Check if request is allowed
   */
  public allowRequest(service: string): boolean {
    const stats = this.getServiceStats(service);
    
    // Clean old entries from window
    this.cleanWindow(stats);

    switch (stats.state) {
      case CircuitState.CLOSED:
        return true;
      
      case CircuitState.OPEN:
        if (Date.now() >= stats.nextAttempt!) {
          this.transitionToHalfOpen(service, stats);
          return true;
        }
        return false;
      
      case CircuitState.HALF_OPEN:
        // Allow limited requests in half-open state
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Record successful request
   */
  public recordSuccess(service: string): void {
    const stats = this.getServiceStats(service);
    
    stats.successes++;
    stats.totalRequests++;
    stats.lastSuccessTime = Date.now();
    stats.consecutiveSuccesses++;
    stats.consecutiveFailures = 0;
    
    // Add to window
    stats.window.push({
      timestamp: Date.now(),
      success: true
    });
    
    // Clean old entries
    this.cleanWindow(stats);
    
    // Update error percentage
    this.updateErrorPercentage(stats);

    // State transitions
    if (stats.state === CircuitState.HALF_OPEN) {
      if (stats.consecutiveSuccesses >= this.options.successThreshold) {
        this.transitionToClosed(service, stats);
      }
    }

    this.emitMetrics(service, stats);
  }

  /**
   * Record failed request
   */
  public recordFailure(service: string, error?: Error): void {
    const stats = this.getServiceStats(service);
    
    stats.failures++;
    stats.totalRequests++;
    stats.lastFailureTime = Date.now();
    stats.consecutiveFailures++;
    stats.consecutiveSuccesses = 0;
    
    // Add to window
    stats.window.push({
      timestamp: Date.now(),
      success: false
    });
    
    // Clean old entries
    this.cleanWindow(stats);
    
    // Update error percentage
    this.updateErrorPercentage(stats);

    // Log the failure
    this.logger.warn('Service failure recorded', {
      service,
      consecutiveFailures: stats.consecutiveFailures,
      errorPercentage: stats.errorPercentage,
      state: stats.state,
      error: error?.message
    });

    // State transitions
    switch (stats.state) {
      case CircuitState.CLOSED:
        if (this.shouldOpenCircuit(stats)) {
          this.transitionToOpen(service, stats);
        }
        break;
      
      case CircuitState.HALF_OPEN:
        // Single failure in half-open transitions back to open
        this.transitionToOpen(service, stats);
        break;
    }

    this.emitMetrics(service, stats);
  }

  /**
   * Get current state for a service
   */
  public getState(service: string): CircuitState {
    return this.getServiceStats(service).state;
  }

  /**
   * Get statistics for a service
   */
  public getStats(service: string): Readonly<ServiceStats> {
    return { ...this.getServiceStats(service) };
  }

  /**
   * Get all service statistics
   */
  public getAllStats(): Record<string, Readonly<ServiceStats>> {
    const allStats: Record<string, Readonly<ServiceStats>> = {};
    
    for (const [service, stats] of this.serviceStats) {
      allStats[service] = { ...stats };
    }
    
    return allStats;
  }

  /**
   * Reset circuit breaker for a service
   */
  public reset(service: string): void {
    const stats = this.getServiceStats(service);
    
    stats.failures = 0;
    stats.successes = 0;
    stats.consecutiveFailures = 0;
    stats.consecutiveSuccesses = 0;
    stats.totalRequests = 0;
    stats.errorPercentage = 0;
    stats.window = [];
    
    if (stats.state !== CircuitState.CLOSED) {
      this.transitionToClosed(service, stats);
    }
    
    this.logger.info('Circuit breaker reset', { service });
  }

  /**
   * Force open circuit
   */
  public forceOpen(service: string): void {
    const stats = this.getServiceStats(service);
    this.transitionToOpen(service, stats);
  }

  /**
   * Force close circuit
   */
  public forceClose(service: string): void {
    const stats = this.getServiceStats(service);
    this.transitionToClosed(service, stats);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.serviceStats.clear();
    this.removeAllListeners();
  }

  /**
   * Get or create service statistics
   */
  private getServiceStats(service: string): ServiceStats {
    if (!this.serviceStats.has(service)) {
      this.serviceStats.set(service, {
        failures: 0,
        successes: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        state: CircuitState.CLOSED,
        totalRequests: 0,
        errorPercentage: 0,
        window: []
      });
    }
    
    return this.serviceStats.get(service)!;
  }

  /**
   * Check if circuit should open
   */
  private shouldOpenCircuit(stats: ServiceStats): boolean {
    // Check consecutive failures
    if (stats.consecutiveFailures >= this.options.failureThreshold) {
      return true;
    }

    // Check error percentage with volume threshold
    const recentRequests = stats.window.length;
    if (recentRequests >= this.options.volumeThreshold) {
      if (stats.errorPercentage >= this.options.errorPercentageThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(service: string, stats: ServiceStats): void {
    const oldState = stats.state;
    stats.state = CircuitState.OPEN;
    stats.nextAttempt = Date.now() + this.options.resetTimeout;
    
    // Clear any existing timer
    const existingTimer = this.timers.get(service);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set timer to transition to half-open
    const timer = setTimeout(() => {
      if (stats.state === CircuitState.OPEN) {
        this.transitionToHalfOpen(service, stats);
      }
    }, this.options.resetTimeout);
    
    this.timers.set(service, timer);
    
    this.logger.error('Circuit breaker opened', {
      service,
      consecutiveFailures: stats.consecutiveFailures,
      errorPercentage: stats.errorPercentage,
      nextAttempt: new Date(stats.nextAttempt).toISOString()
    });
    
    this.emit('stateChange', oldState, CircuitState.OPEN, service);
    this.options.onStateChange(oldState, CircuitState.OPEN, service);
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(service: string, stats: ServiceStats): void {
    const oldState = stats.state;
    stats.state = CircuitState.HALF_OPEN;
    stats.consecutiveSuccesses = 0;
    stats.consecutiveFailures = 0;
    
    this.logger.info('Circuit breaker half-open', { service });
    
    this.emit('stateChange', oldState, CircuitState.HALF_OPEN, service);
    this.options.onStateChange(oldState, CircuitState.HALF_OPEN, service);
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(service: string, stats: ServiceStats): void {
    const oldState = stats.state;
    stats.state = CircuitState.CLOSED;
    stats.consecutiveFailures = 0;
    delete stats.nextAttempt;
    
    // Clear any existing timer
    const existingTimer = this.timers.get(service);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(service);
    }
    
    this.logger.info('Circuit breaker closed', { service });
    
    this.emit('stateChange', oldState, CircuitState.CLOSED, service);
    this.options.onStateChange(oldState, CircuitState.CLOSED, service);
  }

  /**
   * Clean old entries from sliding window
   */
  private cleanWindow(stats: ServiceStats): void {
    const cutoff = Date.now() - this.options.monitoringPeriod;
    stats.window = stats.window.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Update error percentage based on window
   */
  private updateErrorPercentage(stats: ServiceStats): void {
    if (stats.window.length === 0) {
      stats.errorPercentage = 0;
      return;
    }

    const failures = stats.window.filter(entry => !entry.success).length;
    stats.errorPercentage = Math.round((failures / stats.window.length) * 100);
  }

  /**
   * Emit metrics
   */
  private emitMetrics(service: string, stats: ServiceStats): void {
    this.metrics.gauge('circuit_breaker.state', 
      stats.state === CircuitState.CLOSED ? 0 :
      stats.state === CircuitState.HALF_OPEN ? 0.5 : 1,
      { service }
    );
    
    this.metrics.gauge('circuit_breaker.error_percentage', stats.errorPercentage, { service });
    this.metrics.gauge('circuit_breaker.consecutive_failures', stats.consecutiveFailures, { service });
    this.metrics.gauge('circuit_breaker.total_requests', stats.totalRequests, { service });
  }
}

/**
 * Create a circuit breaker decorator
 */
export function CircuitBreakerDecorator(
  service: string,
  circuitBreaker: CircuitBreaker
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!circuitBreaker.allowRequest(service)) {
        throw new Error(`Circuit breaker is open for service: ${service}`);
      }

      try {
        const result = await originalMethod.apply(this, args);
        circuitBreaker.recordSuccess(service);
        return result;
      } catch (error) {
        circuitBreaker.recordFailure(service, error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}
import { Logger } from './logger';
import { MetricsCollector, getMetrics } from './metrics';

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase?: number;
  jitter?: boolean;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

interface RetryContext {
  attempt: number;
  totalDelay: number;
  errors: Error[];
}

export class RetryStrategy {
  private options: Required<RetryOptions>;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(options: RetryOptions) {
    this.options = {
      maxAttempts: options.maxAttempts,
      baseDelay: options.baseDelay,
      maxDelay: options.maxDelay,
      exponentialBase: options.exponentialBase || 2,
      jitter: options.jitter !== false,
      shouldRetry: options.shouldRetry || this.defaultShouldRetry,
      onRetry: options.onRetry || (() => {})
    };

    this.logger = new Logger('RetryStrategy');
    this.metrics = getMetrics();
  }

  /**
   * Execute function with retry logic
   */
  public async execute<T>(
    fn: () => Promise<T>,
    customOptions?: Partial<RetryOptions>
  ): Promise<T> {
    const options = { ...this.options, ...customOptions };
    const context: RetryContext = {
      attempt: 0,
      totalDelay: 0,
      errors: []
    };

    while (context.attempt < options.maxAttempts) {
      context.attempt++;

      try {
        const result = await fn();
        
        if (context.attempt > 1) {
          this.logger.info('Retry succeeded', {
            attempt: context.attempt,
            totalDelay: context.totalDelay
          });
          this.metrics.increment('retry.success', {
            attempts: context.attempt
          });
        }

        return result;

      } catch (error: any) {
        context.errors.push(error);

        if (context.attempt >= options.maxAttempts) {
          this.logger.error('Max retry attempts exceeded', error, {
            attempts: context.attempt,
            totalDelay: context.totalDelay
          });
          this.metrics.increment('retry.exhausted');
          throw this.createAggregateError(context.errors);
        }

        if (!options.shouldRetry(error, context.attempt)) {
          this.logger.warn('Retry aborted by shouldRetry', {
            attempt: context.attempt,
            error: error.message
          });
          this.metrics.increment('retry.aborted');
          throw error;
        }

        const delay = this.calculateDelay(context.attempt, options);
        context.totalDelay += delay;

        this.logger.warn('Retrying after error', {
          attempt: context.attempt,
          delay,
          error: error.message
        });

        options.onRetry(error, context.attempt, delay);
        this.metrics.increment('retry.attempt', {
          attempt: context.attempt
        });

        await this.sleep(delay);
      }
    }

    throw new Error('Retry logic error - should not reach here');
  }

  /**
   * Execute with exponential backoff
   */
  public async executeWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      exponentialBase: 2,
      jitter: true
    });
  }

  /**
   * Execute with linear backoff
   */
  public async executeWithLinearBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      baseDelay: delay,
      exponentialBase: 1,
      jitter: false
    });
  }

  /**
   * Execute with custom retry predicate
   */
  public async executeWithPredicate<T>(
    fn: () => Promise<T>,
    predicate: (error: any) => boolean,
    maxAttempts: number = 3
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      shouldRetry: (error) => predicate(error)
    });
  }

  /**
   * Calculate delay for next retry
   */
  private calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    let delay: number;

    if (options.exponentialBase === 1) {
      // Linear backoff
      delay = options.baseDelay;
    } else {
      // Exponential backoff
      delay = options.baseDelay * Math.pow(options.exponentialBase, attempt - 1);
    }

    // Cap at max delay
    delay = Math.min(delay, options.maxDelay);

    // Add jitter if enabled
    if (options.jitter) {
      const jitterAmount = delay * 0.2; // 20% jitter
      delay = delay + (Math.random() * 2 - 1) * jitterAmount;
      delay = Math.max(0, delay); // Ensure non-negative
    }

    return Math.round(delay);
  }

  /**
   * Default retry predicate
   */
  private defaultShouldRetry(error: any, attempt: number): boolean {
    // Retry on network errors
    if (error.code === 'ECONNREFUSED' || 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Retry on specific HTTP status codes
    if (error.statusCode === 429 || // Too Many Requests
        error.statusCode === 502 || // Bad Gateway
        error.statusCode === 503 || // Service Unavailable
        error.statusCode === 504) { // Gateway Timeout
      return true;
    }

    // Retry on AWS SDK throttling errors
    if (error.name === 'ThrottlingException' ||
        error.name === 'TooManyRequestsException' ||
        error.name === 'RequestLimitExceeded' ||
        error.name === 'ServiceUnavailable') {
      return true;
    }

    // Don't retry on client errors (4xx except 429)
    if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
      return false;
    }

    // Don't retry on specific errors
    if (error.name === 'ValidationException' ||
        error.name === 'InvalidParameterException' ||
        error.name === 'AccessDeniedException') {
      return false;
    }

    // Default: retry on server errors
    return error.statusCode >= 500;
  }

  /**
   * Create aggregate error from multiple attempts
   */
  private createAggregateError(errors: Error[]): Error {
    const message = `All ${errors.length} retry attempts failed`;
    const aggregateError = new Error(message);
    aggregateError.name = 'RetryExhaustedError';
    (aggregateError as any).attempts = errors.length;
    (aggregateError as any).errors = errors;
    (aggregateError as any).lastError = errors[errors.length - 1];
    return aggregateError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Retry decorator for methods
 */
export function Retry(options: Partial<RetryOptions> = {}) {
  const retryStrategy = new RetryStrategy({
    maxAttempts: options.maxAttempts || 3,
    baseDelay: options.baseDelay || 1000,
    maxDelay: options.maxDelay || 10000,
    ...options
  });

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retryStrategy.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Create a retry wrapper function
 */
export function createRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<RetryOptions> = {}
): T {
  const retryStrategy = new RetryStrategy({
    maxAttempts: options.maxAttempts || 3,
    baseDelay: options.baseDelay || 1000,
    maxDelay: options.maxDelay || 10000,
    ...options
  });

  return (async (...args: any[]) => {
    return retryStrategy.execute(() => fn(...args));
  }) as T;
}

/**
 * Retry with specific error types
 */
export class TypedRetryStrategy<TError extends Error = Error> extends RetryStrategy {
  constructor(
    options: RetryOptions,
    private errorTypes: Array<new (...args: any[]) => TError>
  ) {
    super({
      ...options,
      shouldRetry: (error, attempt) => {
        // Check if error is one of the specified types
        const isRetryableType = this.errorTypes.some(
          ErrorType => error instanceof ErrorType
        );
        
        if (!isRetryableType) {
          return false;
        }

        // Apply additional custom logic if provided
        if (options.shouldRetry) {
          return options.shouldRetry(error, attempt);
        }

        return true;
      }
    });
  }
}
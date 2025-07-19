import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { Logger } from '../utils/logger';
import { AppErrors } from './errorHandler';
import { envConfig } from '../config/environment';

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  store?: 'redis' | 'memory';
}

class RateLimiterService {
  private logger: Logger;
  private redisClient?: Redis;
  private limiters: Map<string, any> = new Map();

  constructor() {
    this.logger = new Logger('RateLimiter');
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redisClient = new Redis({
        host: envConfig.cache.redis.host,
        port: envConfig.cache.redis.port,
        password: envConfig.cache.redis.password,
        db: 3, // Use DB 3 for rate limiting
        enableOfflineQueue: false
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error', error);
      });

      this.redisClient.on('connect', () => {
        this.logger.info('Redis connected for rate limiting');
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis', error);
    }
  }

  public createLimiter(name: string, options: RateLimiterOptions) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100,
      store = 'redis'
    } = options;

    const points = max;
    const duration = Math.ceil(windowMs / 1000); // Convert to seconds

    let rateLimiter;

    if (store === 'redis' && this.redisClient) {
      rateLimiter = new RateLimiterRedis({
        storeClient: this.redisClient,
        keyPrefix: `rl:${name}:`,
        points,
        duration,
        blockDuration: duration,
        execEvenly: true
      });
    } else {
      rateLimiter = new RateLimiterMemory({
        keyPrefix: `rl:${name}:`,
        points,
        duration,
        blockDuration: duration,
        execEvenly: true
      });
    }

    this.limiters.set(name, { rateLimiter, options });
    return rateLimiter;
  }

  public middleware(nameOrOptions: string | RateLimiterOptions) {
    const isString = typeof nameOrOptions === 'string';
    const name = isString ? nameOrOptions : 'default';
    const options = isString ? {} : nameOrOptions;

    // Get or create limiter
    let limiterConfig = this.limiters.get(name);
    if (!limiterConfig) {
      const rateLimiter = this.createLimiter(name, options);
      limiterConfig = { rateLimiter, options };
    }

    const { rateLimiter, options: limiterOptions } = limiterConfig;
    const mergedOptions = { ...limiterOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Generate key
        const key = mergedOptions.keyGenerator 
          ? mergedOptions.keyGenerator(req)
          : this.defaultKeyGenerator(req);

        // Check if should skip
        if (mergedOptions.skipSuccessfulRequests && res.statusCode < 400) {
          return next();
        }

        if (mergedOptions.skipFailedRequests && res.statusCode >= 400) {
          return next();
        }

        // Consume point
        const rateLimiterRes = await rateLimiter.consume(key, 1);

        // Set headers
        res.setHeader('X-RateLimit-Limit', mergedOptions.max || 100);
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

        next();
      } catch (rejRes: any) {
        // Set headers even on rejection
        res.setHeader('X-RateLimit-Limit', mergedOptions.max || 100);
        res.setHeader('X-RateLimit-Remaining', rejRes.remainingPoints || 0);
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + rejRes.msBeforeNext).toISOString());
        res.setHeader('Retry-After', Math.ceil(rejRes.msBeforeNext / 1000));

        const message = mergedOptions.message || 
          `Too many requests from this IP, please try again after ${Math.ceil(rejRes.msBeforeNext / 1000)} seconds`;

        next(AppErrors.tooManyRequests(message));
      }
    };
  }

  private defaultKeyGenerator(req: Request): string {
    // Use IP + user ID if authenticated
    const user = (req as any).user;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (user?.id) {
      return `${ip}:${user.id}`;
    }
    
    return ip;
  }

  /**
   * Create endpoint-specific rate limiters
   */
  public createEndpointLimiters() {
    // Strict limit for auth endpoints
    this.createLimiter('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
      message: 'Too many authentication attempts'
    });

    // Medium limit for API endpoints
    this.createLimiter('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many API requests'
    });

    // Relaxed limit for static assets
    this.createLimiter('static', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      skipSuccessfulRequests: true
    });

    // Very strict limit for password reset
    this.createLimiter('password-reset', {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'Too many password reset attempts'
    });

    // File upload limit
    this.createLimiter('upload', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
      message: 'Too many file uploads'
    });
  }

  /**
   * Reset rate limit for a specific key
   */
  public async reset(name: string, key: string): Promise<void> {
    const limiterConfig = this.limiters.get(name);
    if (limiterConfig) {
      await limiterConfig.rateLimiter.delete(key);
    }
  }

  /**
   * Get current consumption for a key
   */
  public async getConsumption(name: string, key: string): Promise<{
    points: number;
    remainingPoints: number;
    msBeforeNext: number;
  } | null> {
    const limiterConfig = this.limiters.get(name);
    if (!limiterConfig) return null;

    try {
      const res = await limiterConfig.rateLimiter.get(key);
      if (res) {
        return {
          points: res.consumedPoints,
          remainingPoints: res.remainingPoints,
          msBeforeNext: res.msBeforeNext
        };
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get consumption', error);
      return null;
    }
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

// Create singleton instance
const rateLimiterService = new RateLimiterService();

// Initialize default limiters
rateLimiterService.createEndpointLimiters();

// Export middleware factory
export const rateLimiter = (options: RateLimiterOptions = {}) => {
  return rateLimiterService.middleware(options);
};

// Export service for advanced usage
export { rateLimiterService };

// Export specific limiters
export const authRateLimiter = rateLimiterService.middleware('auth');
export const apiRateLimiter = rateLimiterService.middleware('api');
export const uploadRateLimiter = rateLimiterService.middleware('upload');
export const passwordResetRateLimiter = rateLimiterService.middleware('password-reset');
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../utils/metrics';
import { envConfig } from '../config/environment';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  context?: Record<string, any>;
}

export class ErrorHandler {
  constructor(
    private logger: Logger,
    private metrics: MetricsCollector
  ) {}

  public middleware() {
    return (error: AppError, req: Request, res: Response, next: NextFunction) => {
      // Don't log if response was already sent
      if (res.headersSent) {
        return next(error);
      }

      const errorId = crypto.randomUUID();
      const statusCode = error.statusCode || 500;
      const isOperational = error.isOperational || false;

      // Log error details
      this.logger.error('Request error', error, {
        errorId,
        statusCode,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id,
        userId: (req as any).user?.id,
        isOperational,
        context: error.context
      });

      // Increment error metrics
      this.metrics.increment('http_errors', {
        status: statusCode,
        method: req.method,
        path: this.sanitizePath(req.path),
        operational: isOperational
      });

      // Prepare error response
      const errorResponse: any = {
        error: {
          id: errorId,
          message: this.getErrorMessage(error, statusCode),
          code: error.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString()
        }
      };

      // Add debug information in development
      if (envConfig.isDevelopment) {
        errorResponse.error.stack = error.stack;
        errorResponse.error.context = error.context;
        errorResponse.debug = {
          method: req.method,
          path: req.path,
          query: req.query,
          headers: req.headers,
          body: req.body
        };
      }

      // Add request ID if available
      if (req.id) {
        errorResponse.error.requestId = req.id;
      }

      // Send error response
      res.status(statusCode).json(errorResponse);
    };
  }

  private getErrorMessage(error: AppError, statusCode: number): string {
    // In production, hide internal error details
    if (envConfig.isProduction && statusCode >= 500) {
      return 'An internal error occurred. Please try again later.';
    }

    // Common error messages
    const errorMessages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      410: 'Gone',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout'
    };

    return error.message || errorMessages[statusCode] || 'An error occurred';
  }

  private sanitizePath(path: string): string {
    // Remove IDs and other dynamic parts from paths for metrics
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token');
  }
}

// Error creation helpers
export class AppErrors {
  static badRequest(message: string, code?: string, context?: Record<string, any>): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 400;
    error.code = code || 'BAD_REQUEST';
    error.isOperational = true;
    error.context = context;
    return error;
  }

  static unauthorized(message: string = 'Unauthorized', code?: string): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 401;
    error.code = code || 'UNAUTHORIZED';
    error.isOperational = true;
    return error;
  }

  static forbidden(message: string = 'Forbidden', code?: string): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 403;
    error.code = code || 'FORBIDDEN';
    error.isOperational = true;
    return error;
  }

  static notFound(resource: string): AppError {
    const error = new Error(`${resource} not found`) as AppError;
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    error.isOperational = true;
    return error;
  }

  static conflict(message: string, code?: string): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 409;
    error.code = code || 'CONFLICT';
    error.isOperational = true;
    return error;
  }

  static unprocessable(message: string, context?: Record<string, any>): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 422;
    error.code = 'UNPROCESSABLE_ENTITY';
    error.isOperational = true;
    error.context = context;
    return error;
  }

  static tooManyRequests(message: string = 'Too many requests'): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 429;
    error.code = 'TOO_MANY_REQUESTS';
    error.isOperational = true;
    return error;
  }

  static internal(message: string = 'Internal server error', context?: Record<string, any>): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
    error.isOperational = false;
    error.context = context;
    return error;
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    const error = new Error(message) as AppError;
    error.statusCode = 503;
    error.code = 'SERVICE_UNAVAILABLE';
    error.isOperational = true;
    return error;
  }

  static fromError(error: Error, statusCode?: number): AppError {
    const appError = error as AppError;
    appError.statusCode = statusCode || 500;
    appError.isOperational = false;
    return appError;
  }
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
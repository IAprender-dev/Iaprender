import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { MetricsCollector } from '../utils/metrics';
import { envConfig } from '../config/environment';

interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  query?: any;
  body?: any;
  ip?: string;
  userAgent?: string;
  userId?: string;
  correlationId?: string;
}

export class RequestLogger {
  constructor(
    private logger: Logger,
    private metrics: MetricsCollector
  ) {}

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const requestId = req.id || crypto.randomUUID();
      
      // Attach request ID
      req.id = requestId;
      res.setHeader('X-Request-ID', requestId);

      // Extract correlation ID if present
      const correlationId = req.headers['x-correlation-id'] as string;
      if (correlationId) {
        res.setHeader('X-Correlation-ID', correlationId);
      }

      // Log request start
      const requestContext: RequestLogContext = {
        requestId,
        method: req.method,
        path: req.path,
        ip: this.getClientIp(req),
        userAgent: req.get('user-agent'),
        correlationId
      };

      // Add query params if present
      if (Object.keys(req.query).length > 0) {
        requestContext.query = req.query;
      }

      // Add body for specific methods (excluding sensitive data)
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        requestContext.body = this.sanitizeBody(req.body);
      }

      // Log request
      this.logger.info('Request started', requestContext);

      // Capture response data
      const originalSend = res.send;
      let responseBody: any;
      
      res.send = function(data: any) {
        responseBody = data;
        return originalSend.call(this, data);
      };

      // Handle response completion
      res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const statusClass = Math.floor(statusCode / 100);

        // Log response
        const responseContext = {
          ...requestContext,
          statusCode,
          duration,
          contentLength: res.get('content-length'),
          userId: (req as any).user?.id
        };

        // Add response body for errors in development
        if (envConfig.isDevelopment && statusCode >= 400 && responseBody) {
          try {
            responseContext['responseBody'] = JSON.parse(responseBody);
          } catch {}
        }

        // Choose log level based on status code
        if (statusClass === 5) {
          this.logger.error('Request failed', undefined, responseContext);
        } else if (statusClass === 4) {
          this.logger.warn('Request client error', responseContext);
        } else {
          this.logger.info('Request completed', responseContext);
        }

        // Collect metrics
        this.metrics.timing('http_request_duration', duration, {
          method: req.method,
          path: this.sanitizePath(req.path),
          status: statusCode,
          status_class: `${statusClass}xx`
        });

        this.metrics.increment('http_requests_total', {
          method: req.method,
          path: this.sanitizePath(req.path),
          status: statusCode
        });

        // Track slow requests
        if (duration > 1000) {
          this.metrics.increment('slow_requests', {
            method: req.method,
            path: this.sanitizePath(req.path)
          });
        }

        // Track response size
        const contentLength = parseInt(res.get('content-length') || '0');
        if (contentLength > 0) {
          this.metrics.histogram('http_response_size_bytes', contentLength, {
            method: req.method,
            path: this.sanitizePath(req.path)
          });
        }
      });

      // Handle response close (client disconnect)
      res.on('close', () => {
        if (!res.headersSent) {
          const duration = Date.now() - start;
          this.logger.warn('Request aborted by client', {
            ...requestContext,
            duration
          });
          
          this.metrics.increment('http_requests_aborted', {
            method: req.method,
            path: this.sanitizePath(req.path)
          });
        }
      });

      next();
    };
  }

  private getClientIp(req: Request): string {
    // Handle various proxy headers
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    
    return req.headers['x-real-ip'] as string || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           'unknown';
  }

  private sanitizePath(path: string): string {
    // Remove IDs and other dynamic parts from paths for metrics
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
      .replace(/\/[a-zA-Z0-9_-]{20,}/g, '/:token')
      .replace(/\?.*$/, ''); // Remove query string
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // List of sensitive fields to exclude
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'creditCard',
      'ssn',
      'pin'
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
      
      // Check for variations (e.g., newPassword, apiKeySecret)
      for (const key in sanitized) {
        if (key.toLowerCase().includes(field.toLowerCase())) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }

    return sanitized;
  }
}
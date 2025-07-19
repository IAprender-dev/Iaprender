import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '../utils/logger';
import { AppErrors } from './errorHandler';

interface ValidationSchema {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

class RequestValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('RequestValidator');
  }

  /**
   * Validate request against schema
   */
  public validate(schema: ValidationSchema) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: string[] = [];

        // Validate body
        if (schema.body) {
          const result = await schema.body.safeParseAsync(req.body);
          if (!result.success) {
            errors.push(...this.formatZodErrors(result.error, 'body'));
          } else {
            req.body = result.data;
          }
        }

        // Validate query
        if (schema.query) {
          const result = await schema.query.safeParseAsync(req.query);
          if (!result.success) {
            errors.push(...this.formatZodErrors(result.error, 'query'));
          } else {
            req.query = result.data;
          }
        }

        // Validate params
        if (schema.params) {
          const result = await schema.params.safeParseAsync(req.params);
          if (!result.success) {
            errors.push(...this.formatZodErrors(result.error, 'params'));
          } else {
            req.params = result.data;
          }
        }

        // Validate headers
        if (schema.headers) {
          const result = await schema.headers.safeParseAsync(req.headers);
          if (!result.success) {
            errors.push(...this.formatZodErrors(result.error, 'headers'));
          }
        }

        // Check for validation errors
        if (errors.length > 0) {
          this.logger.debug('Request validation failed', {
            path: req.path,
            method: req.method,
            errors
          });

          return next(AppErrors.badRequest('Validation failed', { errors }));
        }

        next();
      } catch (error) {
        this.logger.error('Request validation error', error);
        next(AppErrors.internal('Validation error'));
      }
    };
  }

  /**
   * Format Zod errors
   */
  private formatZodErrors(error: z.ZodError, location: string): string[] {
    return error.errors.map(err => {
      const path = err.path.length > 0 
        ? `${location}.${err.path.join('.')}` 
        : location;
      return `${path}: ${err.message}`;
    });
  }

  /**
   * Create common validators
   */
  public createCommonValidators() {
    return {
      // Pagination
      pagination: z.object({
        query: z.object({
          page: z.string().regex(/^\d+$/).transform(Number).default('1'),
          limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
          sort: z.string().optional(),
          order: z.enum(['asc', 'desc']).default('asc')
        })
      }),

      // ID parameter
      idParam: z.object({
        params: z.object({
          id: z.string().regex(/^\d+$/, 'Invalid ID format')
        })
      }),

      // UUID parameter
      uuidParam: z.object({
        params: z.object({
          id: z.string().uuid('Invalid UUID format')
        })
      }),

      // Search
      search: z.object({
        query: z.object({
          q: z.string().min(1, 'Search query required'),
          page: z.string().regex(/^\d+$/).transform(Number).default('1'),
          limit: z.string().regex(/^\d+$/).transform(Number).default('20')
        })
      }),

      // Date range
      dateRange: z.object({
        query: z.object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional()
        }).refine(
          data => {
            if (data.startDate && data.endDate) {
              return new Date(data.startDate) <= new Date(data.endDate);
            }
            return true;
          },
          { message: 'Start date must be before end date' }
        )
      })
    };
  }

  /**
   * Sanitize request data
   */
  public sanitize() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Sanitize body
      if (req.body) {
        req.body = this.sanitizeObject(req.body);
      }

      // Sanitize query
      if (req.query) {
        req.query = this.sanitizeObject(req.query);
      }

      // Sanitize params
      if (req.params) {
        req.params = this.sanitizeObject(req.params);
      }

      next();
    };
  }

  /**
   * Recursively sanitize object
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      // Remove potential XSS
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip prototype pollution attempts
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * File upload validator
   */
  public fileUpload(options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  } = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      required = true
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      const file = (req as any).file;
      const files = (req as any).files;

      // Check if file is required
      if (required && !file && (!files || files.length === 0)) {
        return next(AppErrors.badRequest('File is required'));
      }

      // Validate single file
      if (file) {
        if (file.size > maxSize) {
          return next(AppErrors.badRequest(`File size exceeds ${maxSize} bytes`));
        }

        if (!allowedTypes.includes(file.mimetype)) {
          return next(AppErrors.badRequest(`File type ${file.mimetype} not allowed`));
        }
      }

      // Validate multiple files
      if (files && Array.isArray(files)) {
        for (const f of files) {
          if (f.size > maxSize) {
            return next(AppErrors.badRequest(`File ${f.originalname} exceeds size limit`));
          }

          if (!allowedTypes.includes(f.mimetype)) {
            return next(AppErrors.badRequest(`File type ${f.mimetype} not allowed`));
          }
        }
      }

      next();
    };
  }
}

// Create singleton instance
const validator = new RequestValidator();

// Export middleware factory
export const validateRequest = (schema: ValidationSchema | z.ZodSchema) => {
  // Handle both schema formats
  if ('parse' in schema) {
    // It's a Zod schema, assume it's for body
    return validator.validate({ body: schema });
  }
  return validator.validate(schema);
};

// Export specific validators
export const validateBody = (schema: z.ZodSchema) => validator.validate({ body: schema });
export const validateQuery = (schema: z.ZodSchema) => validator.validate({ query: schema });
export const validateParams = (schema: z.ZodSchema) => validator.validate({ params: schema });
export const validateHeaders = (schema: z.ZodSchema) => validator.validate({ headers: schema });

// Export common validators
const commonValidators = validator.createCommonValidators();
export const validatePagination = validator.validate(commonValidators.pagination);
export const validateIdParam = validator.validate(commonValidators.idParam);
export const validateUuidParam = validator.validate(commonValidators.uuidParam);
export const validateSearch = validator.validate(commonValidators.search);
export const validateDateRange = validator.validate(commonValidators.dateRange);

// Export other middleware
export const sanitizeRequest = validator.sanitize();
export const validateFileUpload = validator.fileUpload;
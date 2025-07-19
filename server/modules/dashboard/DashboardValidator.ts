import { z } from 'zod';

export class DashboardValidator {
  /**
   * Validate dashboard request parameters
   */
  public validateDashboardRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      timeRange: z.enum(['1h', '24h', '7d', '30d', '90d', '1y']).default('30d'),
      includeComparisons: z.boolean().default(false),
      refresh: z.boolean().default(false)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate performance analytics request
   */
  public validatePerformanceRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
      granularity: z.enum(['hour', 'day', 'week', 'month']).default('hour'),
      metrics: z.array(z.enum([
        'response_time',
        'throughput',
        'error_rate',
        'cpu_usage',
        'memory_usage',
        'cache_hit_rate'
      ])).default(['response_time', 'throughput', 'error_rate'])
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate user activity request
   */
  public validateActivityRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      timeRange: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
      groupBy: z.enum(['hour', 'day', 'week']).default('day'),
      includeDetails: z.boolean().default(false)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate academic analytics request
   */
  public validateAcademicRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      timeRange: z.enum(['30d', '90d', '6m', '1y']).default('90d'),
      subjects: z.array(z.string()).max(10).optional(),
      grades: z.array(z.string()).max(10).optional(),
      includeComparisons: z.boolean().default(false),
      includeRecommendations: z.boolean().default(true)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate AI usage analytics request
   */
  public validateAIUsageRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      timeRange: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
      models: z.array(z.string()).max(10).optional(),
      includeCosts: z.boolean().default(true),
      includePerformance: z.boolean().default(true)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate custom report request
   */
  public validateReportRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      type: z.enum(['academic', 'performance', 'usage', 'financial']),
      timeRange: z.enum(['7d', '30d', '90d', '6m', '1y']),
      sections: z.array(z.string()).min(1).max(20),
      format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
      filters: z.record(z.any()).default({}),
      includeCharts: z.boolean().default(true),
      includeRawData: z.boolean().default(false)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate export request
   */
  public validateExportRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      format: z.enum(['pdf', 'excel', 'csv', 'json']),
      sections: z.array(z.enum([
        'overview',
        'analytics',
        'performance',
        'users',
        'academic',
        'ai_usage',
        'financial'
      ])).min(1),
      timeRange: z.enum(['7d', '30d', '90d', '6m', '1y']),
      includeCharts: z.boolean().default(true),
      includeMetadata: z.boolean().default(true)
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate widgets configuration
   */
  public validateWidgetsConfig(data: any): { valid: boolean; errors: string[]; data?: any } {
    const widgetSchema = z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number().min(0),
        y: z.number().min(0),
        width: z.number().min(1).max(12),
        height: z.number().min(1).max(12)
      }),
      config: z.record(z.any()).optional(),
      enabled: z.boolean().default(true)
    });

    const schema = z.object({
      layout: z.string(),
      widgets: z.array(widgetSchema).max(20),
      settings: z.object({
        autoRefresh: z.boolean().default(true),
        refreshInterval: z.number().min(30).max(3600).default(300), // 5 minutes default
        theme: z.enum(['light', 'dark', 'auto']).default('auto')
      }).optional()
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate pagination parameters
   */
  public validatePagination(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate date range
   */
  public validateDateRange(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      startDate: z.string().datetime(),
      endDate: z.string().datetime(),
      timezone: z.string().default('UTC')
    }).refine((data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    }, {
      message: "End date must be after start date"
    }).refine((data) => {
      const start = new Date(data.startDate);
      const now = new Date();
      const maxAge = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
      return (now.getTime() - start.getTime()) <= maxAge;
    }, {
      message: "Date range cannot exceed 2 years"
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }

  /**
   * Validate filter parameters
   */
  public validateFilters(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      userType: z.array(z.string()).max(10).optional(),
      empresa: z.array(z.number()).max(10).optional(),
      escola: z.array(z.number()).max(50).optional(),
      status: z.array(z.string()).max(5).optional(),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime()
      }).optional(),
      search: z.string().max(100).optional()
    });

    try {
      const validated = schema.parse(data);
      return { valid: true, errors: [], data: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { valid: false, errors: ['Validation failed'] };
    }
  }
}
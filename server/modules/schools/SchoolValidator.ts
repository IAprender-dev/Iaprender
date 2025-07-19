import { z } from 'zod';
import { Logger } from '../../utils/logger';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

export class SchoolValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SchoolValidator');
  }

  /**
   * Validate list query parameters
   */
  public validateListQuery(data: any): ValidationResult {
    const schema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      search: z.string().optional(),
      empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
      contratoId: z.string().regex(/^\d+$/).transform(Number).optional(),
      status: z.enum(['ativo', 'inativo', 'suspenso']).optional(),
      sort: z.enum(['nome', 'codigo', 'cidade', 'criadoEm']).optional().default('nome'),
      order: z.enum(['asc', 'desc']).optional().default('asc')
    });

    return this.validate(schema, data);
  }

  /**
   * Validate school creation
   */
  public validateCreate(data: any): ValidationResult {
    const schema = z.object({
      nome: z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim(),
      codigo: z.string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code must not exceed 20 characters')
        .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers and hyphens')
        .trim(),
      empresaId: z.number()
        .positive('Company ID must be positive')
        .int('Company ID must be an integer'),
      contratoId: z.number()
        .positive('Contract ID must be positive')
        .int('Contract ID must be an integer')
        .optional(),
      tipoEnsino: z.enum(['infantil', 'fundamental1', 'fundamental2', 'medio', 'misto'], {
        errorMap: () => ({ message: 'Invalid education type' })
      }),
      endereco: z.object({
        logradouro: z.string().min(1, 'Street is required'),
        numero: z.string().min(1, 'Number is required'),
        complemento: z.string().optional(),
        bairro: z.string().min(1, 'District is required'),
        cidade: z.string().min(1, 'City is required'),
        estado: z.string().length(2, 'State must be 2 characters'),
        cep: z.string().regex(/^\d{5}-?\d{3}$/, 'Invalid ZIP code format')
      }),
      contato: z.object({
        telefone: z.string()
          .regex(/^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/, 'Invalid phone format'),
        email: z.string().email('Invalid email format'),
        website: z.string().url().optional()
      }),
      responsavel: z.object({
        nome: z.string().min(2, 'Name must be at least 2 characters'),
        cargo: z.string().min(2, 'Position must be at least 2 characters'),
        email: z.string().email('Invalid email format'),
        telefone: z.string().optional()
      }),
      configuracoes: z.object({
        ai_limits: z.object({
          '1_3_years': z.number().min(0).max(100).optional(),
          '4_6_years': z.number().min(0).max(100).optional(),
          '7_9_years': z.number().min(0).max(100).optional()
        }).optional(),
        features: z.object({
          excessive_use_alerts: z.boolean().optional(),
          content_filter: z.boolean().optional(),
          conversation_logs: z.boolean().optional(),
          parent_notifications: z.boolean().optional()
        }).optional()
      }).optional(),
      createDefaultClasses: z.boolean().optional().default(false),
      observacoes: z.string().max(500).optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate school update
   */
  public validateUpdate(data: any): ValidationResult {
    const schema = z.object({
      nome: z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim()
        .optional(),
      codigo: z.string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code must not exceed 20 characters')
        .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers and hyphens')
        .trim()
        .optional(),
      tipoEnsino: z.enum(['infantil', 'fundamental1', 'fundamental2', 'medio', 'misto'])
        .optional(),
      endereco: z.object({
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().length(2).optional(),
        cep: z.string().regex(/^\d{5}-?\d{3}$/).optional()
      }).optional(),
      contato: z.object({
        telefone: z.string()
          .regex(/^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/)
          .optional(),
        email: z.string().email().optional(),
        website: z.string().url().optional()
      }).optional(),
      responsavel: z.object({
        nome: z.string().min(2).optional(),
        cargo: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional()
      }).optional(),
      configuracoes: z.object({
        ai_limits: z.object({
          '1_3_years': z.number().min(0).max(100).optional(),
          '4_6_years': z.number().min(0).max(100).optional(),
          '7_9_years': z.number().min(0).max(100).optional()
        }).optional(),
        features: z.object({
          excessive_use_alerts: z.boolean().optional(),
          content_filter: z.boolean().optional(),
          conversation_logs: z.boolean().optional(),
          parent_notifications: z.boolean().optional()
        }).optional()
      }).optional(),
      status: z.enum(['ativo', 'inativo', 'suspenso']).optional(),
      observacoes: z.string().max(500).optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate class creation
   */
  public validateCreateClass(data: any): ValidationResult {
    const schema = z.object({
      nome: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
        .trim(),
      serie: z.string()
        .min(1, 'Grade is required'),
      turma: z.string()
        .min(1, 'Section is required')
        .max(10, 'Section must not exceed 10 characters'),
      turno: z.enum(['manhã', 'tarde', 'noite', 'integral'], {
        errorMap: () => ({ message: 'Invalid shift' })
      }),
      anoLetivo: z.number()
        .min(2020, 'Academic year must be 2020 or later')
        .max(2100, 'Invalid academic year'),
      maxAlunos: z.number()
        .positive('Max students must be positive')
        .max(100, 'Max students cannot exceed 100'),
      professorId: z.number()
        .positive()
        .optional(),
      licencasAlocadas: z.number()
        .min(0, 'Allocated licenses cannot be negative')
        .optional()
        .default(0),
      observacoes: z.string().max(500).optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate report request
   */
  public validateReportRequest(data: any): ValidationResult {
    const schema = z.object({
      reportType: z.enum(['usage', 'pedagogical', 'compliance', 'financial', 'custom'], {
        errorMap: () => ({ message: 'Invalid report type' })
      }),
      startDate: z.string()
        .datetime('Invalid start date format')
        .refine((date) => new Date(date) <= new Date(), 'Start date cannot be in the future'),
      endDate: z.string()
        .datetime('Invalid end date format')
        .refine((date) => new Date(date) <= new Date(), 'End date cannot be in the future'),
      format: z.enum(['pdf', 'excel', 'csv']).optional().default('pdf'),
      includeDetails: z.boolean().optional().default(true),
      filters: z.object({
        classes: z.array(z.number()).optional(),
        teachers: z.array(z.number()).optional(),
        subjects: z.array(z.string()).optional()
      }).optional()
    }).refine(
      (data) => new Date(data.startDate) <= new Date(data.endDate),
      {
        message: 'Start date must be before end date',
        path: ['endDate']
      }
    );

    return this.validate(schema, data);
  }

  /**
   * Validate invitation
   */
  public validateInvitation(data: any): ValidationResult {
    const schema = z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      role: z.enum(['professor', 'coordenador', 'secretario'], {
        errorMap: () => ({ message: 'Invalid role' })
      }),
      classId: z.number()
        .positive()
        .optional(),
      permissions: z.array(z.string()).optional(),
      expiresIn: z.number()
        .min(1, 'Expiration must be at least 1 day')
        .max(30, 'Expiration cannot exceed 30 days')
        .optional()
        .default(7),
      message: z.string()
        .max(500, 'Message cannot exceed 500 characters')
        .optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate configuration update
   */
  public validateConfigUpdate(data: any): ValidationResult {
    const schema = z.object({
      ai_limits: z.object({
        '1_3_years': z.number()
          .min(0, 'Limit cannot be negative')
          .max(100, 'Limit cannot exceed 100')
          .optional(),
        '4_6_years': z.number()
          .min(0, 'Limit cannot be negative')
          .max(100, 'Limit cannot exceed 100')
          .optional(),
        '7_9_years': z.number()
          .min(0, 'Limit cannot be negative')
          .max(100, 'Limit cannot exceed 100')
          .optional()
      }).optional(),
      features: z.object({
        excessive_use_alerts: z.boolean().optional(),
        content_filter: z.boolean().optional(),
        conversation_logs: z.boolean().optional(),
        parent_notifications: z.boolean().optional(),
        auto_logout_minutes: z.number().min(5).max(120).optional(),
        session_recording: z.boolean().optional()
      }).optional(),
      integrations: z.object({
        google_classroom: z.object({
          enabled: z.boolean(),
          client_id: z.string().optional(),
          sync_frequency: z.enum(['hourly', 'daily', 'weekly']).optional()
        }).optional(),
        microsoft_teams: z.object({
          enabled: z.boolean(),
          tenant_id: z.string().optional(),
          sync_frequency: z.enum(['hourly', 'daily', 'weekly']).optional()
        }).optional()
      }).optional(),
      notifications: z.object({
        email_notifications: z.boolean().optional(),
        sms_notifications: z.boolean().optional(),
        push_notifications: z.boolean().optional(),
        notification_schedule: z.object({
          start_hour: z.number().min(0).max(23).optional(),
          end_hour: z.number().min(0).max(23).optional(),
          weekends: z.boolean().optional()
        }).optional()
      }).optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Generic validation method
   */
  private validate(schema: z.ZodSchema, data: any): ValidationResult {
    try {
      const validatedData = schema.parse(data);
      return {
        valid: true,
        errors: [],
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });
        
        this.logger.debug('Validation failed', { errors });
        
        return {
          valid: false,
          errors
        };
      }
      
      return {
        valid: false,
        errors: ['Invalid input data']
      };
    }
  }
}
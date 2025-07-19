import { z } from 'zod';
import { Logger } from '../../utils/logger';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

export class UserValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('UserValidator');
  }

  /**
   * Validate list query parameters
   */
  public validateListQuery(data: any): ValidationResult {
    const schema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      search: z.string().optional(),
      tipoUsuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno']).optional(),
      empresaId: z.string().regex(/^\d+$/).transform(Number).optional(),
      escolaId: z.string().regex(/^\d+$/).transform(Number).optional(),
      status: z.enum(['ativo', 'inativo', 'suspenso', 'bloqueado']).optional(),
      sort: z.enum(['nome', 'email', 'criadoEm', 'ultimoLogin']).optional().default('nome'),
      order: z.enum(['asc', 'desc']).optional().default('asc')
    });

    return this.validate(schema, data);
  }

  /**
   * Validate user creation
   */
  public validateCreate(data: any): ValidationResult {
    const schema = z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
        .refine(
          (email) => !this.isDisposableEmail(email),
          'Disposable email addresses are not allowed'
        ),
      nome: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim()
        .regex(/^[\p{L}\s'-]+$/u, 'Invalid name format'),
      tipoUsuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno'], {
        errorMap: () => ({ message: 'Invalid user type' })
      }),
      empresaId: z.number()
        .positive('Company ID must be positive')
        .int('Company ID must be an integer'),
      escolaId: z.number()
        .positive('School ID must be positive')
        .int('School ID must be an integer')
        .optional(),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .optional(),
      telefone: z.string()
        .regex(/^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/, 'Invalid phone format')
        .optional(),
      cpf: z.string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'Invalid CPF format')
        .optional(),
      dataNascimento: z.string()
        .datetime()
        .optional()
        .refine(
          (date) => {
            if (!date) return true;
            const age = new Date().getFullYear() - new Date(date).getFullYear();
            return age >= 0 && age <= 120;
          },
          'Invalid birth date'
        ),
      endereco: z.object({
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().length(2).optional(),
        cep: z.string().regex(/^\d{5}-?\d{3}$/).optional()
      }).optional(),
      responsavel: z.object({
        nome: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        parentesco: z.string().optional()
      }).optional(),
      sendWelcomeEmail: z.boolean().optional().default(true),
      observacoes: z.string().max(500).optional()
    }).refine(
      (data) => {
        // Professor and student require school
        if (['professor', 'aluno'].includes(data.tipoUsuario) && !data.escolaId) {
          return false;
        }
        return true;
      },
      {
        message: 'School ID is required for teachers and students',
        path: ['escolaId']
      }
    ).refine(
      (data) => {
        // Students under 18 require responsible person
        if (data.tipoUsuario === 'aluno' && data.dataNascimento) {
          const age = new Date().getFullYear() - new Date(data.dataNascimento).getFullYear();
          if (age < 18 && (!data.responsavel || !data.responsavel.nome)) {
            return false;
          }
        }
        return true;
      },
      {
        message: 'Responsible person required for students under 18',
        path: ['responsavel']
      }
    );

    return this.validate(schema, data);
  }

  /**
   * Validate user update
   */
  public validateUpdate(data: any): ValidationResult {
    const schema = z.object({
      nome: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .trim()
        .regex(/^[\p{L}\s'-]+$/u, 'Invalid name format')
        .optional(),
      tipoUsuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno'])
        .optional(),
      empresaId: z.number()
        .positive('Company ID must be positive')
        .int('Company ID must be an integer')
        .optional(),
      escolaId: z.number()
        .positive('School ID must be positive')
        .int('School ID must be an integer')
        .optional(),
      telefone: z.string()
        .regex(/^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/, 'Invalid phone format')
        .optional(),
      cpf: z.string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, 'Invalid CPF format')
        .optional(),
      dataNascimento: z.string()
        .datetime()
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
      responsavel: z.object({
        nome: z.string().optional(),
        email: z.string().email().optional(),
        telefone: z.string().optional(),
        parentesco: z.string().optional()
      }).optional(),
      avatar: z.string().url().optional(),
      status: z.enum(['ativo', 'inativo', 'suspenso', 'bloqueado']).optional(),
      observacoes: z.string().max(500).optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate bulk create
   */
  public validateBulkCreate(data: any): ValidationResult {
    const userSchema = z.object({
      email: z.string().email().toLowerCase().trim(),
      nome: z.string().min(2).max(100).trim(),
      tipoUsuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno']),
      empresaId: z.number().positive().int(),
      escolaId: z.number().positive().int().optional(),
      password: z.string().optional()
    });

    const schema = z.object({
      users: z.array(userSchema)
        .min(1, 'At least one user is required')
        .max(100, 'Cannot import more than 100 users at once')
    });

    return this.validate(schema, data);
  }

  /**
   * Validate password change
   */
  public validatePasswordChange(data: any): ValidationResult {
    const schema = z.object({
      currentPassword: z.string()
        .min(1, 'Current password is required'),
      newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
        .refine(
          (password) => !this.isCommonPassword(password),
          'Password is too common'
        ),
      confirmPassword: z.string()
    }).refine(
      (data) => data.newPassword === data.confirmPassword,
      {
        message: 'Passwords do not match',
        path: ['confirmPassword']
      }
    ).refine(
      (data) => data.currentPassword !== data.newPassword,
      {
        message: 'New password must be different from current password',
        path: ['newPassword']
      }
    );

    return this.validate(schema, data);
  }

  /**
   * Validate CSV import
   */
  public validateCSVImport(data: any): ValidationResult {
    const schema = z.object({
      file: z.object({
        mimetype: z.enum(['text/csv', 'application/csv']),
        size: z.number().max(5 * 1024 * 1024, 'File size must not exceed 5MB')
      }),
      delimiter: z.enum([',', ';', '\t']).optional().default(';'),
      encoding: z.enum(['utf-8', 'latin1', 'iso-8859-1']).optional().default('utf-8')
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

  /**
   * Check if password is common
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '12345678', '123456789', 'qwerty123',
      'password123', 'admin123', 'letmein', 'welcome',
      'monkey', '1234567890', 'qwertyuiop', 'abc123',
      'Password1', 'password1', '123456', 'welcome123',
      'password@123', 'admin', 'root', 'toor', 'pass',
      'test', 'guest', 'master', 'god', '666666'
    ];

    const lowerPassword = password.toLowerCase();
    return commonPasswords.some(common => 
      lowerPassword === common || 
      lowerPassword.includes(common)
    );
  }

  /**
   * Check if email is from disposable domain
   */
  private isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      'tempmail.com', 'throwaway.email', 'guerrillamail.com',
      'mailinator.com', '10minutemail.com', 'trash-mail.com',
      'temp-mail.org', 'dispostable.com', 'yopmail.com',
      'fakeinbox.com', 'trashmail.com', 'maildrop.cc'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Validate CPF (Brazilian ID)
   */
  public validateCPF(cpf: string): boolean {
    // Remove non-numeric characters
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    
    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cleaned)) return false;
    
    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned[10])) return false;
    
    return true;
  }
}
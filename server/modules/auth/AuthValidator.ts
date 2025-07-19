import { z } from 'zod';
import { Logger } from '../../utils/logger';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data?: any;
}

export class AuthValidator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('AuthValidator');
  }

  /**
   * Validate login request
   */
  public validateLogin(data: any): ValidationResult {
    const schema = z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      password: z.string()
        .min(6, 'Password must be at least 6 characters'),
      mfaCode: z.string()
        .length(6, 'MFA code must be 6 digits')
        .regex(/^\d+$/, 'MFA code must be numeric')
        .optional(),
      rememberMe: z.boolean().optional().default(false)
    });

    return this.validate(schema, data);
  }

  /**
   * Validate MFA verification
   */
  public validateMfa(data: any): ValidationResult {
    const schema = z.object({
      session: z.string()
        .min(1, 'Session is required'),
      code: z.string()
        .length(6, 'MFA code must be 6 digits')
        .regex(/^\d+$/, 'MFA code must be numeric'),
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate password change
   */
  public validatePasswordChange(data: any): ValidationResult {
    const schema = z.object({
      session: z.string()
        .min(1, 'Session is required'),
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
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
        )
    });

    return this.validate(schema, data);
  }

  /**
   * Validate password reset request
   */
  public validatePasswordReset(data: any): ValidationResult {
    const schema = z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      code: z.string()
        .length(6, 'Reset code must be 6 characters')
        .regex(/^[A-Z0-9]+$/, 'Invalid reset code format'),
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
        )
    });

    return this.validate(schema, data);
  }

  /**
   * Validate refresh token request
   */
  public validateRefreshToken(data: any): ValidationResult {
    const schema = z.object({
      refreshToken: z.string()
        .min(1, 'Refresh token is required')
        .optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate OAuth callback
   */
  public validateOAuthCallback(data: any): ValidationResult {
    const schema = z.object({
      code: z.string()
        .min(1, 'Authorization code is required'),
      state: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate MFA setup
   */
  public validateMfaSetup(data: any): ValidationResult {
    const schema = z.object({
      type: z.enum(['SMS', 'TOTP'], {
        errorMap: () => ({ message: 'Invalid MFA type. Must be SMS or TOTP' })
      }),
      phoneNumber: z.string()
        .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format')
        .optional()
    });

    return this.validate(schema, data);
  }

  /**
   * Validate user registration
   */
  public validateRegistration(data: any): ValidationResult {
    const schema = z.object({
      email: z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must not exceed 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      confirmPassword: z.string(),
      nome: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must not exceed 100 characters')
        .regex(/^[\p{L}\s'-]+$/u, 'Invalid name format'),
      tipoUsuario: z.enum(['admin', 'gestor', 'diretor', 'professor', 'aluno']),
      empresaId: z.number().positive('Invalid company ID'),
      escolaId: z.number().positive('Invalid school ID').optional(),
      acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms')
    }).refine(
      (data) => data.password === data.confirmPassword,
      {
        message: 'Passwords do not match',
        path: ['confirmPassword']
      }
    );

    return this.validate(schema, data);
  }

  /**
   * Validate email format and domain
   */
  public validateEmail(email: string): ValidationResult {
    const schema = z.string()
      .email('Invalid email format')
      .toLowerCase()
      .trim()
      .refine(
        (email) => !this.isDisposableEmail(email),
        'Disposable email addresses are not allowed'
      )
      .refine(
        (email) => this.isAllowedDomain(email),
        'Email domain not allowed'
      );

    return this.validate(schema, email);
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
      'temp-mail.org', 'dispostable.com', 'yopmail.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Check if email domain is allowed
   */
  private isAllowedDomain(email: string): boolean {
    // If no restrictions, allow all
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',') || [];
    if (allowedDomains.length === 0) return true;

    const domain = email.split('@')[1]?.toLowerCase();
    return allowedDomains.some(allowed => 
      domain === allowed.toLowerCase() || 
      domain?.endsWith(`.${allowed.toLowerCase()}`)
    );
  }

  /**
   * Sanitize input data
   */
  public sanitize(data: any): any {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }
    
    if (data !== null && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive fields from logs
        if (['password', 'newPassword', 'confirmPassword', 'token', 'secret'].includes(key)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}
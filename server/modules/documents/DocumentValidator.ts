import { z } from 'zod';

export class DocumentValidator {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'audio/mpeg',
    'audio/wav',
    'application/json'
  ];

  private readonly maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB

  /**
   * Validate file upload
   */
  public validateUpload(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      fileName: z.string().min(1).max(255),
      mimeType: z.string().refine(
        (type) => this.allowedMimeTypes.includes(type),
        { message: 'File type not allowed' }
      ),
      size: z.number().max(this.maxFileSize, 'File size exceeds limit'),
      description: z.string().max(500).optional(),
      tags: z.array(z.string()).max(10).optional(),
      metadata: z.record(z.any()).optional()
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
   * Validate file type
   */
  public validateFileType(mimeType: string): { valid: boolean; errors: string[] } {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        errors: [`File type ${mimeType} is not allowed`]
      };
    }
    return { valid: true, errors: [] };
  }

  /**
   * Validate list query
   */
  public validateListQuery(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      search: z.string().max(100).optional(),
      fileType: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      sortBy: z.enum(['uploadedAt', 'fileName', 'fileSize']).default('uploadedAt'),
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
   * Validate analysis request
   */
  public validateAnalysis(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      type: z.enum(['summary', 'lesson_plan', 'assessment', 'exercise', 'full']),
      model: z.enum(['claude-3-5-sonnet', 'claude-3-haiku', 'gpt-4']).optional(),
      language: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
      educationLevel: z.enum(['fundamental1', 'fundamental2', 'medio', 'superior']).optional(),
      subject: z.string().max(100).optional(),
      additionalInstructions: z.string().max(1000).optional()
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
   * Validate presigned URL request
   */
  public validatePresignedRequest(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      fileName: z.string().min(1).max(255),
      mimeType: z.string().refine(
        (type) => this.allowedMimeTypes.includes(type),
        { message: 'File type not allowed' }
      ),
      metadata: z.record(z.any()).optional()
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
   * Validate bulk operation
   */
  public validateBulkOperation(data: any): { valid: boolean; errors: string[]; data?: any } {
    const schema = z.object({
      uuids: z.array(z.string().uuid()).min(1).max(50),
      operation: z.enum(['delete', 'archive', 'move', 'tag']),
      targetFolder: z.string().optional(),
      tags: z.array(z.string()).optional()
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
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { S3Service } from '../../services/S3Service';
import { BedrockService } from '../../services/BedrockService';
import { Logger } from '../../utils/logger';
import { CacheService } from '../../services/CacheService';
import { AppErrors } from '../../middleware/errorHandler';
import { RetryStrategy } from '../../utils/retryStrategy';
import crypto from 'crypto';

export interface DocumentUploadOptions {
  file: Express.Multer.File;
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  metadata?: any;
}

export interface BatchUploadOptions {
  files: Express.Multer.File[];
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  metadata?: any;
}

export interface DocumentListOptions {
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  page?: number;
  limit?: number;
  search?: string;
  fileType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentAnalysisOptions {
  type: 'summary' | 'lesson_plan' | 'assessment' | 'exercise' | 'full';
  model?: string;
  language?: string;
  educationLevel?: string;
}

export class DocumentService {
  private documentRepository: DocumentRepository;
  private s3Service: S3Service;
  private bedrockService: BedrockService;
  private cache: CacheService;
  private logger: Logger;
  private retry: RetryStrategy;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.s3Service = new S3Service();
    this.bedrockService = new BedrockService();
    this.cache = new CacheService();
    this.logger = new Logger('DocumentService');
    this.retry = new RetryStrategy();
  }

  /**
   * Upload single document
   */
  public async uploadDocument(options: DocumentUploadOptions): Promise<any> {
    try {
      // Generate unique key
      const uuid = crypto.randomUUID();
      const extension = options.file.originalname.split('.').pop();
      const s3Key = this.generateS3Key(
        options.empresaId,
        options.escolaId || 0,
        options.userId,
        options.userType,
        uuid,
        extension
      );

      // Upload to S3 with retry
      const s3Result = await this.retry.execute(
        async () => this.s3Service.uploadFile({
          key: s3Key,
          body: options.file.buffer,
          contentType: options.file.mimetype,
          metadata: {
            originalName: options.file.originalname,
            uploadedBy: options.userId.toString(),
            userType: options.userType,
            ...options.metadata
          }
        }),
        'S3 upload'
      );

      // Save to database
      const document = await this.documentRepository.createDocument({
        uuid,
        empresaId: options.empresaId,
        escolaId: options.escolaId,
        usuarioId: options.userId,
        tipoUsuario: options.userType,
        s3Key,
        s3Bucket: this.s3Service.getBucketName(),
        fileName: options.file.originalname,
        fileSize: options.file.size,
        mimeType: options.file.mimetype,
        metadata: options.metadata,
        uploadedAt: new Date()
      });

      // Invalidate cache
      await this.cache.delete(`documents:list:${options.userId}`);

      this.logger.info('Document uploaded successfully', {
        documentId: document.uuid,
        fileName: options.file.originalname,
        size: options.file.size
      });

      return {
        uuid: document.uuid,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        s3Url: s3Result.Location
      };

    } catch (error) {
      this.logger.error('Document upload failed', error);
      throw AppErrors.internal('Failed to upload document');
    }
  }

  /**
   * Upload multiple documents
   */
  public async uploadMultiple(options: BatchUploadOptions): Promise<any> {
    const results = {
      successful: [] as any[],
      failed: [] as any[],
      total: options.files.length
    };

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(options.files, concurrencyLimit);

    for (const chunk of chunks) {
      const promises = chunk.map(async (file) => {
        try {
          const result = await this.uploadDocument({
            file,
            userId: options.userId,
            userType: options.userType,
            empresaId: options.empresaId,
            escolaId: options.escolaId,
            metadata: options.metadata
          });
          results.successful.push(result);
        } catch (error) {
          results.failed.push({
            fileName: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      await Promise.all(promises);
    }

    return results;
  }

  /**
   * List documents with permissions
   */
  public async listDocuments(options: DocumentListOptions): Promise<any> {
    const cacheKey = `documents:list:${options.userId}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const documents = await this.documentRepository.listDocumentsWithPermissions(options);

    // Cache for 5 minutes
    await this.cache.set(cacheKey, documents, 300);

    return documents;
  }

  /**
   * Get document details
   */
  public async getDocument(uuid: string, userId: number, userType: string): Promise<any> {
    const document = await this.documentRepository.getDocumentWithPermissions(
      uuid,
      userId,
      userType
    );

    if (!document) {
      throw AppErrors.notFound('Document not found or access denied');
    }

    return document;
  }

  /**
   * Generate download URL
   */
  public async generateDownloadUrl(uuid: string, userId: number, userType: string): Promise<string> {
    const document = await this.getDocument(uuid, userId, userType);

    const url = await this.s3Service.getPresignedUrl({
      key: document.s3Key,
      operation: 'getObject',
      expiresIn: 3600 // 1 hour
    });

    // Log download
    await this.documentRepository.logAccess({
      documentId: uuid,
      userId,
      action: 'download',
      ipAddress: null // Would be passed from request
    });

    return url;
  }

  /**
   * Delete document
   */
  public async deleteDocument(uuid: string, userId: number, userType: string): Promise<void> {
    const document = await this.getDocument(uuid, userId, userType);

    // Check deletion permissions
    const canDelete = 
      document.usuarioId === userId ||
      userType === 'admin' ||
      (userType === 'gestor' && document.empresaId) ||
      (userType === 'diretor' && document.escolaId);

    if (!canDelete) {
      throw AppErrors.forbidden('Insufficient permissions to delete document');
    }

    // Delete from S3
    await this.retry.execute(
      async () => this.s3Service.deleteFile(document.s3Key),
      'S3 delete'
    );

    // Soft delete in database
    await this.documentRepository.softDeleteDocument(uuid, userId);

    // Invalidate cache
    await this.cache.delete(`documents:list:${userId}`);

    this.logger.info('Document deleted', {
      documentId: uuid,
      deletedBy: userId
    });
  }

  /**
   * Analyze document with AI
   */
  public async analyzeDocument(
    uuid: string,
    userId: number,
    userType: string,
    options: DocumentAnalysisOptions
  ): Promise<any> {
    const document = await this.getDocument(uuid, userId, userType);

    // Check if document type is supported for analysis
    const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!supportedTypes.includes(document.mimeType)) {
      throw AppErrors.badRequest('Document type not supported for analysis');
    }

    // Get document content from S3
    const content = await this.s3Service.getFileContent(document.s3Key);

    // Extract text based on file type
    let text: string;
    if (document.mimeType === 'application/pdf') {
      text = await this.extractPdfText(content);
    } else {
      text = content.toString('utf-8');
    }

    // Analyze with AI
    const analysis = await this.bedrockService.analyzeEducationalContent({
      content: text,
      fileName: document.fileName,
      analysisType: options.type,
      preferences: {
        model: options.model || 'claude-3-5-sonnet',
        language: options.language || 'pt-BR',
        educationLevel: options.educationLevel || 'intermediario'
      }
    });

    // Save analysis result
    await this.documentRepository.saveAnalysis({
      documentId: uuid,
      userId,
      analysisType: options.type,
      result: analysis,
      model: analysis.model,
      tokensUsed: analysis.usage.totalTokens
    });

    return analysis;
  }

  /**
   * Generate presigned upload URL
   */
  public async generatePresignedUploadUrl(options: {
    fileName: string;
    mimeType: string;
    userId: number;
    userType: string;
    empresaId: number;
    escolaId?: number;
  }): Promise<any> {
    const uuid = crypto.randomUUID();
    const extension = options.fileName.split('.').pop();
    const s3Key = this.generateS3Key(
      options.empresaId,
      options.escolaId || 0,
      options.userId,
      options.userType,
      uuid,
      extension
    );

    const presignedUrl = await this.s3Service.getPresignedUrl({
      key: s3Key,
      operation: 'putObject',
      expiresIn: 3600,
      contentType: options.mimeType
    });

    // Pre-create document record
    await this.documentRepository.createDocument({
      uuid,
      empresaId: options.empresaId,
      escolaId: options.escolaId,
      usuarioId: options.userId,
      tipoUsuario: options.userType,
      s3Key,
      s3Bucket: this.s3Service.getBucketName(),
      fileName: options.fileName,
      fileSize: 0, // Will be updated after upload
      mimeType: options.mimeType,
      status: 'pending_upload'
    });

    return {
      uuid,
      uploadUrl: presignedUrl,
      s3Key,
      expiresIn: 3600
    };
  }

  /**
   * Get document structure
   */
  public async getDocumentStructure(
    userId: number,
    userType: string,
    empresaId: number,
    escolaId?: number
  ): Promise<any> {
    const cacheKey = `documents:structure:${userId}:${userType}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const structure = await this.documentRepository.getDocumentStructure({
      userId,
      userType,
      empresaId,
      escolaId
    });

    // Cache for 10 minutes
    await this.cache.set(cacheKey, structure, 600);

    return structure;
  }

  // Helper methods

  private generateS3Key(
    empresaId: number,
    escolaId: number,
    userId: number,
    userType: string,
    uuid: string,
    extension?: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const key = `documents/empresa-${empresaId}/escola-${escolaId}/${year}/${month}/${userType}-${userId}/${uuid}`;
    
    return extension ? `${key}.${extension}` : key;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    // This would use a PDF parsing library
    // For now, returning placeholder
    return 'PDF text extraction to be implemented';
  }
}
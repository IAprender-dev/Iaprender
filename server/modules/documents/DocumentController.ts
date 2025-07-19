import { Request, Response, NextFunction } from 'express';
import { DocumentService } from './DocumentService';
import { DocumentValidator } from './DocumentValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';
import multer from 'multer';
import { RateLimiter } from '../../utils/rateLimiter';

export class DocumentController {
  private documentService: DocumentService;
  private validator: DocumentValidator;
  private logger: Logger;
  private metrics: MetricsCollector;
  private rateLimiter: RateLimiter;
  private upload: multer.Multer;

  constructor() {
    this.documentService = new DocumentService();
    this.validator = new DocumentValidator();
    this.logger = new Logger('DocumentController');
    this.metrics = getMetrics();
    this.rateLimiter = new RateLimiter();
    
    // Configure multer with memory storage and size limits
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // 50MB default
        files: 10
      },
      fileFilter: (req, file, cb) => {
        const validationResult = this.validator.validateFileType(file.mimetype);
        if (!validationResult.valid) {
          cb(new Error(validationResult.errors.join(', ')));
        } else {
          cb(null, true);
        }
      }
    });
  }

  /**
   * Upload single document
   */
  public async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      // Rate limiting check
      const canUpload = await this.rateLimiter.checkLimit(
        `upload:${req.user!.id}`,
        100, // 100 uploads per hour
        3600
      );

      if (!canUpload) {
        throw AppErrors.tooManyRequests('Upload limit exceeded');
      }

      if (!req.file) {
        throw AppErrors.badRequest('No file provided');
      }

      const validationResult = this.validator.validateUpload({
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ...req.body
      });

      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const document = await this.documentService.uploadDocument({
        file: req.file,
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        metadata: validationResult.data
      });

      const duration = timer();
      this.logger.info('Document uploaded', {
        documentId: document.uuid,
        fileName: req.file.originalname,
        size: req.file.size,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.upload.duration', duration);
      this.metrics.increment('documents.upload.success');
      this.metrics.gauge('documents.upload.size', req.file.size);

      res.status(201).json({
        success: true,
        data: document
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Document upload failed', error, { duration });
      this.metrics.increment('documents.upload.failure');
      next(error);
    }
  }

  /**
   * Upload multiple documents
   */
  public async uploadMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      if (!req.files || !Array.isArray(req.files)) {
        throw AppErrors.badRequest('No files provided');
      }

      const canUpload = await this.rateLimiter.checkLimit(
        `batch-upload:${req.user!.id}`,
        10, // 10 batch uploads per hour
        3600
      );

      if (!canUpload) {
        throw AppErrors.tooManyRequests('Batch upload limit exceeded');
      }

      const results = await this.documentService.uploadMultiple({
        files: req.files,
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        metadata: req.body
      });

      const duration = timer();
      this.logger.info('Batch upload completed', {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.batch.duration', duration);
      this.metrics.increment('documents.batch.completed');

      res.status(201).json({
        success: true,
        data: results
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Batch upload failed', error, { duration });
      this.metrics.increment('documents.batch.failure');
      next(error);
    }
  }

  /**
   * List documents
   */
  public async listDocuments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      const validationResult = this.validator.validateListQuery(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const documents = await this.documentService.listDocuments({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        ...validationResult.data
      });

      const duration = timer();
      this.logger.info('Documents listed', {
        count: documents.data.length,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.list.duration', duration);

      res.json({
        success: true,
        ...documents
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('List documents failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get document details
   */
  public async getDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid } = req.params;

      const document = await this.documentService.getDocument(
        uuid,
        req.user!.id,
        req.user!.tipo_usuario
      );

      if (!document) {
        throw AppErrors.notFound('Document not found');
      }

      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      this.logger.error('Get document failed', error);
      next(error);
    }
  }

  /**
   * Get download URL
   */
  public async getDownloadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      const { uuid } = req.params;

      // Rate limiting for downloads
      const canDownload = await this.rateLimiter.checkLimit(
        `download:${req.user!.id}`,
        100, // 100 downloads per hour
        3600
      );

      if (!canDownload) {
        throw AppErrors.tooManyRequests('Download limit exceeded');
      }

      const url = await this.documentService.generateDownloadUrl(
        uuid,
        req.user!.id,
        req.user!.tipo_usuario
      );

      const duration = timer();
      this.logger.info('Download URL generated', {
        documentId: uuid,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.download.url.duration', duration);
      this.metrics.increment('documents.download.generated');

      res.json({
        success: true,
        data: {
          url,
          expiresIn: 3600 // 1 hour
        }
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Generate download URL failed', error, { duration });
      next(error);
    }
  }

  /**
   * Delete document
   */
  public async deleteDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      const { uuid } = req.params;

      await this.documentService.deleteDocument(
        uuid,
        req.user!.id,
        req.user!.tipo_usuario
      );

      const duration = timer();
      this.logger.info('Document deleted', {
        documentId: uuid,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.delete.duration', duration);
      this.metrics.increment('documents.delete.success');

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete document failed', error, { duration });
      this.metrics.increment('documents.delete.failure');
      next(error);
    }
  }

  /**
   * Analyze document with AI
   */
  public async analyzeDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      const { uuid } = req.params;
      
      const validationResult = this.validator.validateAnalysis(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const canAnalyze = await this.rateLimiter.checkLimit(
        `analyze:${req.user!.id}`,
        50, // 50 analyses per hour
        3600
      );

      if (!canAnalyze) {
        throw AppErrors.tooManyRequests('Analysis limit exceeded');
      }

      const analysis = await this.documentService.analyzeDocument(
        uuid,
        req.user!.id,
        req.user!.tipo_usuario,
        validationResult.data
      );

      const duration = timer();
      this.logger.info('Document analyzed', {
        documentId: uuid,
        analysisType: validationResult.data.type,
        userId: req.user!.id,
        duration
      });
      
      this.metrics.timing('documents.analyze.duration', duration);
      this.metrics.increment('documents.analyze.success');

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Analyze document failed', error, { duration });
      this.metrics.increment('documents.analyze.failure');
      next(error);
    }
  }

  /**
   * Get presigned upload URL
   */
  public async getPresignedUploadUrl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validatePresignedRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const presignedData = await this.documentService.generatePresignedUploadUrl({
        fileName: validationResult.data.fileName,
        mimeType: validationResult.data.mimeType,
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id
      });

      res.json({
        success: true,
        data: presignedData
      });

    } catch (error) {
      this.logger.error('Generate presigned URL failed', error);
      next(error);
    }
  }

  /**
   * Get document structure
   */
  public async getDocumentStructure(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await this.documentService.getDocumentStructure(
        req.user!.id,
        req.user!.tipo_usuario,
        req.user!.empresa_id,
        req.user!.escola_id
      );

      res.json({
        success: true,
        data: structure
      });

    } catch (error) {
      this.logger.error('Get document structure failed', error);
      next(error);
    }
  }

  /**
   * Get upload middleware
   */
  public getUploadMiddleware(type: 'single' | 'multiple' = 'single') {
    if (type === 'single') {
      return this.upload.single('file');
    }
    return this.upload.array('files', 10);
  }
}
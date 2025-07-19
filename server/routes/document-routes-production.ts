import { Router } from 'express';
import { DocumentController } from '../modules/documents/DocumentController';
import { 
  authMiddleware, 
  requireUserType,
  AuthenticatedRequest 
} from '../middleware/auth';
import { 
  rateLimiter, 
  apiRateLimiter 
} from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';

export function createDocumentRouter(): Router {
  const router = Router();
  const documentController = new DocumentController();

  /**
   * Apply authentication to all routes
   */
  router.use(authMiddleware);
  router.use(apiRateLimiter);

  /**
   * UPLOAD ROUTES
   */

  // POST /documents/upload - Upload single document
  router.post(
    '/upload',
    rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 100,
      message: 'Upload limit exceeded'
    }),
    documentController.getUploadMiddleware('single'),
    asyncHandler(documentController.uploadDocument.bind(documentController))
  );

  // POST /documents/batch-upload - Upload multiple documents
  router.post(
    '/batch-upload',
    rateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: 'Batch upload limit exceeded'
    }),
    documentController.getUploadMiddleware('multiple'),
    asyncHandler(documentController.uploadMultiple.bind(documentController))
  );

  // POST /documents/presigned-upload - Get presigned upload URL
  router.post(
    '/presigned-upload',
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 50
    }),
    asyncHandler(documentController.getPresignedUploadUrl.bind(documentController))
  );

  /**
   * DOCUMENT MANAGEMENT ROUTES
   */

  // GET /documents - List documents
  router.get(
    '/',
    asyncHandler(documentController.listDocuments.bind(documentController))
  );

  // GET /documents/structure - Get document structure
  router.get(
    '/structure',
    asyncHandler(documentController.getDocumentStructure.bind(documentController))
  );

  // GET /documents/:uuid - Get document details
  router.get(
    '/:uuid',
    asyncHandler(documentController.getDocument.bind(documentController))
  );

  // GET /documents/:uuid/download - Generate download URL
  router.get(
    '/:uuid/download',
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 100,
      message: 'Download limit exceeded'
    }),
    asyncHandler(documentController.getDownloadUrl.bind(documentController))
  );

  // DELETE /documents/:uuid - Delete document
  router.delete(
    '/:uuid',
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 50
    }),
    asyncHandler(documentController.deleteDocument.bind(documentController))
  );

  /**
   * DOCUMENT ANALYSIS ROUTES
   */

  // POST /documents/:uuid/analyze - Analyze document with AI
  router.post(
    '/:uuid/analyze',
    rateLimiter({
      windowMs: 60 * 60 * 1000,
      max: 50,
      message: 'Analysis limit exceeded'
    }),
    asyncHandler(documentController.analyzeDocument.bind(documentController))
  );

  /**
   * ADMIN ROUTES
   */

  // GET /documents/admin/all - List all documents (admin only)
  router.get(
    '/admin/all',
    requireUserType('admin'),
    asyncHandler(async (req, res) => {
      const controller = new DocumentController();
      const documents = await (controller as any).documentService.listDocuments({
        userId: req.user!.id,
        userType: 'admin',
        empresaId: 0, // Admin sees all
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      });
      
      res.json({
        success: true,
        ...documents
      });
    })
  );

  // GET /documents/admin/stats - Get document statistics
  router.get(
    '/admin/stats',
    requireUserType('admin', 'gestor'),
    asyncHandler(async (req, res) => {
      // Implementation for document statistics
      res.json({
        success: true,
        data: {
          totalDocuments: 0,
          totalSize: 0,
          documentsByType: {},
          documentsByUser: {},
          recentUploads: []
        }
      });
    })
  );

  return router;
}

/**
 * Register document routes with Express app
 */
export function registerDocumentRoutes(app: any): void {
  const documentRouter = createDocumentRouter();
  app.use('/api/documents', documentRouter);
  console.log('✅ Document routes registered at /api/documents');
}
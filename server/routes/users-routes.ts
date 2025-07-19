import { Router } from 'express';
import { UserController } from '../modules/users/UserController';
import { 
  authMiddleware, 
  requireUserType, 
  requireCompany,
  AuthenticatedRequest 
} from '../middleware/auth';
import { 
  rateLimiter, 
  apiRateLimiter 
} from '../middleware/rateLimiter';
import { 
  validateRequest, 
  validatePagination,
  validateIdParam,
  validateFileUpload 
} from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';
import multer from 'multer';

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export function createUserRouter(): Router {
  const router = Router();
  const userController = new UserController();

  /**
   * Apply authentication to all routes
   */
  router.use(authMiddleware);
  router.use(apiRateLimiter);

  /**
   * GET /users - List users
   * Requires: authentication
   * Optional: admin/gestor for full list
   */
  router.get(
    '/',
    validatePagination,
    asyncHandler(userController.listUsers.bind(userController))
  );

  /**
   * GET /users/stats - Get user statistics
   * Requires: admin or gestor
   */
  router.get(
    '/stats',
    requireUserType('admin', 'gestor'),
    asyncHandler(userController.getUserStats.bind(userController))
  );

  /**
   * GET /users/export - Export users to CSV
   * Requires: admin or gestor
   */
  router.get(
    '/export',
    requireUserType('admin', 'gestor'),
    asyncHandler(userController.exportUsers.bind(userController))
  );

  /**
   * POST /users/import - Import users from CSV
   * Requires: admin
   */
  router.post(
    '/import',
    requireUserType('admin'),
    upload.single('file'),
    validateFileUpload({
      required: true,
      allowedTypes: ['text/csv', 'application/csv'],
      maxSize: 5 * 1024 * 1024
    }),
    asyncHandler(async (req: AuthenticatedRequest, res, next) => {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required'
        });
      }

      const csvData = req.file.buffer.toString('utf-8');
      const userController = new UserController();
      const userService = (userController as any).userService;
      
      const result = await userService.importUsersFromCSV(
        csvData,
        req.user!.id
      );

      res.json({
        success: true,
        message: `Imported ${result.created.length} users`,
        data: result
      });
    })
  );

  /**
   * POST /users/bulk - Bulk create users
   * Requires: admin
   */
  router.post(
    '/bulk',
    requireUserType('admin'),
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many bulk operations'
    }),
    asyncHandler(userController.bulkCreateUsers.bind(userController))
  );

  /**
   * GET /users/:id - Get user by ID
   * Requires: authentication (users can view own profile)
   */
  router.get(
    '/:id',
    validateIdParam,
    asyncHandler(userController.getUser.bind(userController))
  );

  /**
   * POST /users - Create new user
   * Requires: admin, gestor, or diretor (with restrictions)
   */
  router.post(
    '/',
    requireUserType('admin', 'gestor', 'diretor'),
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 50,
      message: 'Too many user creations'
    }),
    asyncHandler(userController.createUser.bind(userController))
  );

  /**
   * PUT /users/:id - Update user
   * Requires: authentication (users can update own profile with restrictions)
   */
  router.put(
    '/:id',
    validateIdParam,
    asyncHandler(userController.updateUser.bind(userController))
  );

  /**
   * DELETE /users/:id - Delete user
   * Requires: admin only
   */
  router.delete(
    '/:id',
    requireUserType('admin'),
    validateIdParam,
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many delete attempts'
    }),
    asyncHandler(userController.deleteUser.bind(userController))
  );

  /**
   * POST /users/:id/password - Change user password
   * Requires: authentication (users can change own password)
   */
  router.post(
    '/:id/password',
    validateIdParam,
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many password change attempts'
    }),
    asyncHandler(userController.changePassword.bind(userController))
  );

  /**
   * POST /users/:id/toggle-status - Toggle user active/inactive status
   * Requires: admin or gestor
   */
  router.post(
    '/:id/toggle-status',
    requireUserType('admin', 'gestor'),
    validateIdParam,
    asyncHandler(userController.toggleUserStatus.bind(userController))
  );

  /**
   * GET /users/:id/avatar - Get user avatar URL
   * This could be expanded to handle avatar uploads
   */
  router.get(
    '/:id/avatar',
    validateIdParam,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const user = await new UserController().getUser(req, res, () => {});
      if (user) {
        res.json({
          success: true,
          avatarUrl: (user as any).avatar || '/default-avatar.png'
        });
      }
    })
  );

  /**
   * POST /users/:id/avatar - Upload user avatar
   * Requires: authentication (users can upload own avatar)
   */
  router.post(
    '/:id/avatar',
    validateIdParam,
    upload.single('avatar'),
    validateFileUpload({
      required: true,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
      maxSize: 2 * 1024 * 1024 // 2MB
    }),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      // This would integrate with S3Service to upload avatar
      res.json({
        success: true,
        message: 'Avatar upload not yet implemented'
      });
    })
  );

  return router;
}

/**
 * Register user routes with Express app
 */
export function registerUserRoutes(app: any): void {
  const userRouter = createUserRouter();
  app.use('/api/users', userRouter);
  console.log('✅ User routes registered at /api/users');
}
import { Router } from 'express';
import { AuthController } from '../modules/auth/AuthController';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    mfaCode: z.string().optional(),
    rememberMe: z.boolean().optional()
  })
});

const mfaSchema = z.object({
  body: z.object({
    session: z.string(),
    code: z.string().length(6, 'MFA code must be 6 digits'),
    email: z.string().email()
  })
});

const passwordChangeSchema = z.object({
  body: z.object({
    session: z.string(),
    email: z.string().email(),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
  })
});

const passwordResetSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

const confirmResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
  })
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  })
});

const setupMfaSchema = z.object({
  body: z.object({
    type: z.enum(['SMS', 'TOTP'])
  })
});

export function createAuthRouter(): Router {
  const router = Router();
  const authController = new AuthController();

  // Rate limiters for different endpoints
  const strictRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many attempts, please try again later'
  });

  const standardRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  });

  /**
   * Public routes
   */

  // Login with Cognito
  router.post(
    '/login',
    strictRateLimit,
    validateRequest(loginSchema),
    asyncHandler(authController.authenticate.bind(authController))
  );

  // Verify MFA code
  router.post(
    '/mfa/verify',
    strictRateLimit,
    validateRequest(mfaSchema),
    asyncHandler(authController.verifyMfa.bind(authController))
  );

  // Change password (first login)
  router.post(
    '/password/change',
    strictRateLimit,
    validateRequest(passwordChangeSchema),
    asyncHandler(authController.changePassword.bind(authController))
  );

  // Request password reset
  router.post(
    '/password/reset',
    strictRateLimit,
    validateRequest(passwordResetSchema),
    asyncHandler(authController.requestPasswordReset.bind(authController))
  );

  // Confirm password reset
  router.post(
    '/password/reset/confirm',
    strictRateLimit,
    validateRequest(confirmResetSchema),
    asyncHandler(authController.confirmPasswordReset.bind(authController))
  );

  // Refresh token
  router.post(
    '/refresh',
    standardRateLimit,
    validateRequest(refreshTokenSchema),
    asyncHandler(authController.refreshToken.bind(authController))
  );

  // OAuth callback
  router.get(
    '/oauth/callback',
    standardRateLimit,
    asyncHandler(authController.handleOAuthCallback.bind(authController))
  );

  /**
   * Protected routes (require authentication)
   */

  // Get current user
  router.get(
    '/me',
    authMiddleware,
    standardRateLimit,
    asyncHandler(authController.getCurrentUser.bind(authController))
  );

  // Logout
  router.post(
    '/logout',
    authMiddleware,
    standardRateLimit,
    asyncHandler(authController.logout.bind(authController))
  );

  // Setup MFA
  router.post(
    '/mfa/setup',
    authMiddleware,
    standardRateLimit,
    validateRequest(setupMfaSchema),
    asyncHandler(authController.setupMfa.bind(authController))
  );

  // Disable MFA
  router.delete(
    '/mfa',
    authMiddleware,
    standardRateLimit,
    asyncHandler(authController.disableMfa.bind(authController))
  );

  /**
   * Health check
   */
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'auth',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

/**
 * Register auth routes with Express app
 */
export function registerAuthRoutes(app: any): void {
  const authRouter = createAuthRouter();
  app.use('/api/auth', authRouter);
  console.log('✅ Auth routes registered at /api/auth');
}
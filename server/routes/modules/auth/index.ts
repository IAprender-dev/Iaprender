import { Router } from 'express';
import { AuthController } from './controller';
import { AuthValidator } from './validator';
import { asyncHandler } from '../../../middleware/errorHandler';

const router = Router();
const controller = new AuthController();
const validator = new AuthValidator();

// Public routes
router.post('/login', 
  validator.validateLogin(),
  asyncHandler(controller.login.bind(controller))
);

router.post('/logout',
  asyncHandler(controller.logout.bind(controller))
);

router.post('/refresh',
  validator.validateRefresh(),
  asyncHandler(controller.refreshToken.bind(controller))
);

router.get('/cognito-config',
  asyncHandler(controller.getCognitoConfig.bind(controller))
);

router.get('/callback',
  asyncHandler(controller.handleCallback.bind(controller))
);

// Protected routes
router.get('/me',
  asyncHandler(controller.getCurrentUser.bind(controller))
);

router.post('/change-password',
  validator.validatePasswordChange(),
  asyncHandler(controller.changePassword.bind(controller))
);

router.post('/forgot-password',
  validator.validateForgotPassword(),
  asyncHandler(controller.forgotPassword.bind(controller))
);

router.post('/reset-password',
  validator.validateResetPassword(),
  asyncHandler(controller.resetPassword.bind(controller))
);

export default router;
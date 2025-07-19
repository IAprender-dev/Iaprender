import { body, ValidationChain } from 'express-validator';
import { validationHandler } from '../../../middleware/validation';

export class AuthValidator {
  public validateLogin(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
      validationHandler
    ];
  }

  public validateRefresh(): ValidationChain[] {
    return [
      body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),
      validationHandler
    ];
  }

  public validatePasswordChange(): ValidationChain[] {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
      body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
      body('confirmPassword')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Passwords do not match'),
      validationHandler
    ];
  }

  public validateForgotPassword(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
      validationHandler
    ];
  }

  public validateResetPassword(): ValidationChain[] {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
      body('code')
        .notEmpty()
        .isLength({ min: 6, max: 6 })
        .withMessage('Invalid verification code'),
      body('newPassword')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),
      validationHandler
    ];
  }
}
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './AuthService';
import { AuthValidator } from './AuthValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { RateLimiter } from '../../utils/rateLimiter';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    tipo_usuario: string;
    empresa_id: number;
    escola_id?: number;
    cognito_sub: string;
    groups: string[];
    sessionId?: string;
  };
}

export class AuthController {
  private authService: AuthService;
  private validator: AuthValidator;
  private logger: Logger;
  private metrics: MetricsCollector;
  private rateLimiter: RateLimiter;

  constructor() {
    this.authService = new AuthService();
    this.validator = new AuthValidator();
    this.logger = new Logger('AuthController');
    this.metrics = getMetrics();
    this.rateLimiter = new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req) => req.ip || 'unknown'
    });
  }

  /**
   * Authenticate user with Cognito
   */
  public async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Rate limiting check
      const rateLimitResult = await this.rateLimiter.check(req);
      if (!rateLimitResult.allowed) {
        throw AppErrors.tooManyRequests(
          `Too many login attempts. Try again in ${rateLimitResult.resetIn} seconds`
        );
      }

      // Validate input
      const validationResult = this.validator.validateLogin(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { email, password, mfaCode } = req.body;
      const clientInfo = this.extractClientInfo(req);

      this.logger.info('Authentication attempt', { email, ...clientInfo });

      // Authenticate with service
      const result = await this.authService.authenticate({
        email,
        password,
        mfaCode,
        clientInfo
      });

      // Handle MFA challenge
      if (result.requiresMfa) {
        res.status(200).json({
          success: true,
          requiresMfa: true,
          mfaType: result.mfaType,
          session: result.mfaSession,
          message: 'MFA verification required'
        });
        return;
      }

      // Handle password change required
      if (result.requiresPasswordChange) {
        res.status(200).json({
          success: true,
          requiresPasswordChange: true,
          session: result.changePasswordSession,
          message: 'Password change required'
        });
        return;
      }

      // Success - return tokens
      this.logger.info('Authentication successful', { 
        userId: result.user.id,
        email: result.user.email 
      });

      // Set secure HTTP-only cookie for refresh token
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      // Return response
      res.status(200).json({
        success: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        },
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          tipo_usuario: result.user.tipo_usuario,
          groups: result.user.groups
        },
        redirectUrl: this.getRedirectUrl(result.user.tipo_usuario)
      });

    } catch (error) {
      this.logger.error('Authentication failed', error);
      next(error);
    }
  }

  /**
   * Verify MFA code
   */
  public async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validateMfa(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { session, code, email } = req.body;

      const result = await this.authService.verifyMfa({
        session,
        code,
        email
      });

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.status(200).json({
        success: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        },
        user: result.user,
        redirectUrl: this.getRedirectUrl(result.user.tipo_usuario)
      });

    } catch (error) {
      this.logger.error('MFA verification failed', error);
      next(error);
    }
  }

  /**
   * Change password for first-time login
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validatePasswordChange(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { session, email, newPassword } = req.body;

      const result = await this.authService.changePassword({
        session,
        email,
        newPassword
      });

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.status(200).json({
        success: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        },
        user: result.user,
        redirectUrl: this.getRedirectUrl(result.user.tipo_usuario)
      });

    } catch (error) {
      this.logger.error('Password change failed', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = this.extractRefreshToken(req);
      if (!refreshToken) {
        throw AppErrors.unauthorized('Refresh token not provided');
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn
        }
      });

    } catch (error) {
      this.logger.error('Token refresh failed', error);
      next(error);
    }
  }

  /**
   * Get current user info
   */
  public async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppErrors.unauthorized();
      }

      const userDetails = await this.authService.getUserDetails(req.user.id);

      res.status(200).json({
        success: true,
        user: userDetails
      });

    } catch (error) {
      this.logger.error('Get current user failed', error);
      next(error);
    }
  }

  /**
   * Logout user
   */
  public async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = this.extractRefreshToken(req);
      
      // Logout from all services
      await this.authService.logout({
        userId: req.user?.id,
        accessToken: req.headers.authorization?.replace('Bearer ', ''),
        refreshToken,
        sessionId: req.user?.sessionId
      });

      // Clear refresh token cookie
      this.clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      this.logger.error('Logout failed', error);
      // Always return success for logout
      this.clearRefreshTokenCookie(res);
      res.status(200).json({
        success: true,
        message: 'Logged out'
      });
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw AppErrors.badRequest('Email is required');
      }

      await this.authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });

    } catch (error) {
      this.logger.error('Password reset request failed', error);
      // Still return success to prevent enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }
  }

  /**
   * Confirm password reset
   */
  public async confirmPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validatePasswordReset(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { email, code, newPassword } = req.body;

      await this.authService.confirmPasswordReset({
        email,
        code,
        newPassword
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      this.logger.error('Password reset confirmation failed', error);
      next(error);
    }
  }

  /**
   * OAuth callback handler
   */
  public async handleOAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state, error } = req.query;

      if (error) {
        throw AppErrors.badRequest(`OAuth error: ${error}`);
      }

      if (!code || typeof code !== 'string') {
        throw AppErrors.badRequest('Authorization code not provided');
      }

      const result = await this.authService.handleOAuthCallback(code, state as string);

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(this.getRedirectUrl(result.user.tipo_usuario));
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('token', result.tokens.accessToken);

      res.redirect(redirectUrl.toString());

    } catch (error) {
      this.logger.error('OAuth callback failed', error);
      res.redirect('/auth?error=oauth_failed');
    }
  }

  /**
   * Setup MFA for user
   */
  public async setupMfa(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppErrors.unauthorized();
      }

      const { type } = req.body;
      
      if (!['SMS', 'TOTP'].includes(type)) {
        throw AppErrors.badRequest('Invalid MFA type');
      }

      const result = await this.authService.setupMfa(req.user.id, type);

      res.status(200).json({
        success: true,
        mfaType: type,
        setupData: result
      });

    } catch (error) {
      this.logger.error('MFA setup failed', error);
      next(error);
    }
  }

  /**
   * Disable MFA for user
   */
  public async disableMfa(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppErrors.unauthorized();
      }

      await this.authService.disableMfa(req.user.id);

      res.status(200).json({
        success: true,
        message: 'MFA disabled successfully'
      });

    } catch (error) {
      this.logger.error('MFA disable failed', error);
      next(error);
    }
  }

  // Helper methods

  private extractClientInfo(req: Request): Record<string, any> {
    return {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      origin: req.get('origin'),
      referer: req.get('referer')
    };
  }

  private getRedirectUrl(tipoUsuario: string): string {
    const redirectMap: Record<string, string> = {
      admin: '/admin/dashboard',
      gestor: '/gestor/dashboard',
      diretor: '/diretor/dashboard',
      professor: '/professor/dashboard',
      aluno: '/aluno/dashboard'
    };

    return redirectMap[tipoUsuario] || '/dashboard';
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth'
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth'
    });
  }

  private extractRefreshToken(req: Request): string | undefined {
    // Try cookie first
    if (req.cookies?.refreshToken) {
      return req.cookies.refreshToken;
    }

    // Try body
    if (req.body?.refreshToken) {
      return req.body.refreshToken;
    }

    // Try header
    const authHeader = req.headers['x-refresh-token'];
    if (authHeader) {
      return authHeader as string;
    }

    return undefined;
  }
}
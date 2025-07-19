import { Request, Response } from 'express';
import { CognitoAuthService } from '../../../services/CognitoAuthService';
import { DatabaseConnection } from '../../../config/database-production';
import { JWTService } from '../../../services/JWTService';
import { Logger } from '../../../utils/logger';
import { MetricsCollector, getMetrics } from '../../../utils/metrics';
import { AppErrors } from '../../../middleware/errorHandler';
import { envConfig } from '../../../config/environment';

export class AuthController {
  private cognitoService: CognitoAuthService;
  private dbConnection: DatabaseConnection;
  private jwtService: JWTService;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.cognitoService = new CognitoAuthService();
    this.dbConnection = DatabaseConnection.getInstance();
    this.jwtService = new JWTService();
    this.logger = new Logger('AuthController');
    this.metrics = getMetrics();
  }

  public async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    
    this.logger.info('Login attempt', { email });
    const timer = this.metrics.startTimer();

    try {
      // Authenticate with Cognito
      const cognitoAuth = await this.cognitoService.authenticate(email, password);
      
      if (cognitoAuth.challengeName) {
        // Handle MFA or password change challenges
        res.json({
          success: false,
          challenge: cognitoAuth.challengeName,
          session: cognitoAuth.session,
          message: 'Additional verification required'
        });
        return;
      }

      // Get user from database
      const user = await this.getUserFromDatabase(cognitoAuth.userId, email);
      
      // Create JWT token
      const token = this.jwtService.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        escola_id: user.escola_id,
        cognito_sub: cognitoAuth.userId,
        groups: cognitoAuth.groups || []
      });

      // Create refresh token
      const refreshToken = this.jwtService.generateRefreshToken(user.id);

      const duration = timer();
      this.logger.info('Login successful', { email, duration });
      this.metrics.timing('auth.login.duration', duration);
      this.metrics.increment('auth.login.success');

      res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tipo_usuario: user.tipo_usuario,
          empresa_id: user.empresa_id,
          escola_id: user.escola_id,
          groups: cognitoAuth.groups
        }
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Login failed', error, { email, duration });
      this.metrics.increment('auth.login.failure');
      
      if (error.code === 'NotAuthorizedException') {
        throw AppErrors.unauthorized('Invalid credentials');
      }
      
      throw error;
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Invalidate token
        await this.jwtService.invalidateToken(token);
        
        // Logout from Cognito if we have the access token
        const cognitoToken = req.headers['x-cognito-token'];
        if (cognitoToken) {
          await this.cognitoService.logout(cognitoToken);
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      this.logger.error('Logout error', error);
      // Always return success for logout
      res.json({
        success: true,
        message: 'Logged out'
      });
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    
    try {
      // Validate refresh token
      const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
      
      // Get updated user data
      const user = await this.getUserFromDatabase(decoded.userId);
      
      // Generate new access token
      const newToken = this.jwtService.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        escola_id: user.escola_id,
        cognito_sub: user.cognito_sub,
        groups: user.groups || []
      });

      this.metrics.increment('auth.token.refresh');

      res.json({
        success: true,
        token: newToken
      });
      
    } catch (error) {
      this.logger.error('Token refresh failed', error);
      throw AppErrors.unauthorized('Invalid refresh token');
    }
  }

  public async getCognitoConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = {
        userPoolId: envConfig.cognito.userPoolId,
        clientId: envConfig.cognito.clientId,
        region: envConfig.cognito.region,
        domain: process.env.AWS_COGNITO_DOMAIN,
        redirectUri: process.env.AWS_COGNITO_REDIRECT_URI
      };

      // Validate configuration
      const missing = Object.entries(config)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        throw AppErrors.internal('Cognito configuration incomplete', { missing });
      }

      res.json({
        success: true,
        ...config,
        loginUrl: `https://${config.domain}/login?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}`
      });
      
    } catch (error) {
      this.logger.error('Failed to get Cognito config', error);
      throw error;
    }
  }

  public async handleCallback(req: Request, res: Response): Promise<void> {
    const { code, error } = req.query;
    
    if (error) {
      this.logger.error('OAuth callback error', { error });
      return res.redirect(`/auth?error=${error}`);
    }

    if (!code) {
      return res.redirect('/auth?error=no_code');
    }

    try {
      // Exchange code for tokens
      const tokens = await this.cognitoService.exchangeCodeForTokens(code as string);
      
      // Decode ID token
      const idTokenData = this.jwtService.decodeToken(tokens.id_token);
      
      // Get or create user
      const user = await this.getOrCreateUser(idTokenData);
      
      // Create system JWT
      const systemToken = this.jwtService.generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        escola_id: user.escola_id,
        cognito_sub: idTokenData.sub,
        groups: idTokenData['cognito:groups'] || []
      });

      // Determine redirect path based on user type
      const redirectPath = this.getRedirectPath(user.tipo_usuario);
      
      // Redirect with token
      res.redirect(`${redirectPath}?token=${encodeURIComponent(systemToken)}`);
      
    } catch (error) {
      this.logger.error('Callback processing failed', error);
      res.redirect('/auth?error=callback_failed');
    }
  }

  public async getCurrentUser(req: Request, res: Response): Promise<void> {
    const user = req.user;
    
    if (!user) {
      throw AppErrors.unauthorized();
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        escola_id: user.escola_id,
        groups: user.groups || []
      }
    });
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const user = req.user!;
    
    try {
      await this.cognitoService.changePassword(
        user.email,
        currentPassword,
        newPassword
      );

      this.metrics.increment('auth.password.changed');

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      this.logger.error('Password change failed', error);
      
      if (error.code === 'NotAuthorizedException') {
        throw AppErrors.unauthorized('Current password is incorrect');
      }
      
      throw error;
    }
  }

  public async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    
    try {
      await this.cognitoService.forgotPassword(email);
      
      this.metrics.increment('auth.password.reset_requested');

      res.json({
        success: true,
        message: 'Password reset code sent to your email'
      });
      
    } catch (error) {
      this.logger.error('Forgot password failed', error);
      
      // Don't reveal if email exists
      res.json({
        success: true,
        message: 'If the email exists, a reset code will be sent'
      });
    }
  }

  public async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, code, newPassword } = req.body;
    
    try {
      await this.cognitoService.confirmForgotPassword(email, code, newPassword);
      
      this.metrics.increment('auth.password.reset_completed');

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
      
    } catch (error) {
      this.logger.error('Password reset failed', error);
      
      if (error.code === 'CodeMismatchException') {
        throw AppErrors.badRequest('Invalid or expired reset code');
      }
      
      throw error;
    }
  }

  private async getUserFromDatabase(cognitoSub: string, email?: string): Promise<any> {
    try {
      const db = this.dbConnection.getDb();
      if (!db) throw new Error('Database not initialized');

      // Query user by cognito_sub or email
      let user = await db.query.usuarios.findFirst({
        where: (usuarios, { eq, or }) => 
          or(
            eq(usuarios.cognito_sub, cognitoSub),
            email ? eq(usuarios.email, email) : undefined
          )
      });

      if (!user && email) {
        // User doesn't exist, create placeholder
        user = {
          id: 1, // Temporary
          email,
          nome: email.split('@')[0],
          tipo_usuario: 'user',
          empresa_id: 1,
          escola_id: null,
          cognito_sub: cognitoSub
        };
      }

      if (!user) {
        throw AppErrors.notFound('User');
      }

      return user;
    } catch (error) {
      this.logger.error('Database query failed', error);
      // Return placeholder user for now
      return {
        id: 1,
        email: email || 'unknown',
        nome: email?.split('@')[0] || 'User',
        tipo_usuario: 'user',
        empresa_id: 1,
        escola_id: null,
        cognito_sub: cognitoSub
      };
    }
  }

  private async getOrCreateUser(idTokenData: any): Promise<any> {
    const email = idTokenData.email;
    const cognitoSub = idTokenData.sub;
    const groups = idTokenData['cognito:groups'] || [];

    // Determine user type from groups
    const tipo_usuario = this.getUserTypeFromGroups(groups);

    return {
      id: 1, // Temporary
      email,
      nome: idTokenData.name || email.split('@')[0],
      tipo_usuario,
      empresa_id: 1,
      escola_id: null,
      cognito_sub: cognitoSub,
      groups
    };
  }

  private getUserTypeFromGroups(groups: string[]): string {
    if (groups.some(g => g.toLowerCase().includes('admin'))) return 'admin';
    if (groups.some(g => g.toLowerCase().includes('gestor'))) return 'gestor';
    if (groups.some(g => g.toLowerCase().includes('diretor'))) return 'diretor';
    if (groups.some(g => g.toLowerCase().includes('professor'))) return 'professor';
    if (groups.some(g => g.toLowerCase().includes('aluno'))) return 'aluno';
    return 'user';
  }

  private getRedirectPath(tipoUsuario: string): string {
    const paths: Record<string, string> = {
      admin: '/admin/dashboard',
      gestor: '/gestor/dashboard',
      diretor: '/diretor/dashboard',
      professor: '/professor/dashboard',
      aluno: '/aluno/dashboard',
      user: '/dashboard'
    };
    
    return paths[tipoUsuario] || '/dashboard';
  }
}
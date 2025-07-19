import { CognitoAuthService } from '../../services/CognitoAuthService-production';
import { JWTService } from '../../services/JWTService';
import { UserRepository } from '../../repositories/UserRepository';
import { SessionService } from './SessionService';
import { AuditService } from '../audit/AuditService';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { Cache, getCache } from '../../utils/cache';
import { AppErrors } from '../../middleware/errorHandler';
import { envConfig } from '../../config/environment';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

interface AuthCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  clientInfo?: Record<string, any>;
}

interface AuthResult {
  user: UserInfo;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  requiresMfa?: boolean;
  mfaType?: string;
  mfaSession?: string;
  requiresPasswordChange?: boolean;
  changePasswordSession?: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  tipo_usuario: string;
  empresa_id: number;
  escola_id?: number;
  groups: string[];
  avatar?: string;
  lastLogin?: Date;
  status: string;
}

interface MfaVerification {
  session: string;
  code: string;
  email: string;
}

interface PasswordChangeRequest {
  session: string;
  email: string;
  newPassword: string;
}

export class AuthService {
  private cognitoService: CognitoAuthService;
  private jwtService: JWTService;
  private userRepository: UserRepository;
  private sessionService: SessionService;
  private auditService: AuditService;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;

  constructor() {
    this.cognitoService = new CognitoAuthService();
    this.jwtService = new JWTService();
    this.userRepository = new UserRepository();
    this.sessionService = new SessionService();
    this.auditService = new AuditService();
    this.logger = new Logger('AuthService');
    this.metrics = getMetrics();
    this.cache = getCache('auth', 300); // 5 min cache
  }

  /**
   * Authenticate user
   */
  public async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    const timer = this.metrics.startTimer();
    
    try {
      // Authenticate with Cognito
      const cognitoResult = await this.cognitoService.authenticate(
        credentials.email,
        credentials.password
      );

      // Handle challenges
      if (cognitoResult.challengeName) {
        if (cognitoResult.challengeName === 'SMS_MFA' || cognitoResult.challengeName === 'SOFTWARE_TOKEN_MFA') {
          return {
            user: {} as UserInfo,
            tokens: {} as any,
            requiresMfa: true,
            mfaType: cognitoResult.challengeName,
            mfaSession: cognitoResult.session
          };
        }

        if (cognitoResult.challengeName === 'NEW_PASSWORD_REQUIRED') {
          return {
            user: {} as UserInfo,
            tokens: {} as any,
            requiresPasswordChange: true,
            changePasswordSession: cognitoResult.session
          };
        }

        throw AppErrors.badRequest(`Unsupported challenge: ${cognitoResult.challengeName}`);
      }

      // Get or create user in database
      const user = await this.getOrCreateUser(cognitoResult);

      // Create session
      const sessionId = await this.sessionService.createSession({
        userId: user.id,
        cognitoSub: cognitoResult.userId,
        accessToken: cognitoResult.accessToken!,
        refreshToken: cognitoResult.refreshToken!,
        clientInfo: credentials.clientInfo
      });

      // Generate internal tokens
      const tokens = await this.generateTokens(user, sessionId);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'auth',
        details: {
          email: credentials.email,
          loginMethod: 'password',
          ...credentials.clientInfo
        }
      });

      // Update last login
      await this.userRepository.update(user.id, {
        ultimoLogin: new Date()
      });

      const duration = timer();
      this.logger.info('User authenticated successfully', {
        userId: user.id,
        email: user.email,
        duration
      });
      this.metrics.timing('auth.authenticate.duration', duration);
      this.metrics.increment('auth.authenticate.success');

      return {
        user: this.formatUserInfo(user),
        tokens
      };

    } catch (error) {
      const duration = timer();
      this.logger.error('Authentication failed', error, {
        email: credentials.email,
        duration
      });
      this.metrics.increment('auth.authenticate.failure');
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  public async verifyMfa(verification: MfaVerification): Promise<AuthResult> {
    try {
      const cognitoResult = await this.cognitoService.respondToAuthChallenge(
        'SMS_MFA', // or SOFTWARE_TOKEN_MFA
        verification.session,
        {
          SMS_MFA_CODE: verification.code,
          USERNAME: verification.email
        }
      );

      const user = await this.getOrCreateUser(cognitoResult);
      const sessionId = await this.sessionService.createSession({
        userId: user.id,
        cognitoSub: cognitoResult.userId,
        accessToken: cognitoResult.accessToken!,
        refreshToken: cognitoResult.refreshToken!
      });

      const tokens = await this.generateTokens(user, sessionId);

      await this.auditService.log({
        userId: user.id,
        action: 'MFA_VERIFIED',
        resource: 'auth',
        details: { email: verification.email }
      });

      return {
        user: this.formatUserInfo(user),
        tokens
      };

    } catch (error) {
      this.logger.error('MFA verification failed', error);
      this.metrics.increment('auth.mfa.failure');
      throw error;
    }
  }

  /**
   * Change password (for NEW_PASSWORD_REQUIRED challenge)
   */
  public async changePassword(request: PasswordChangeRequest): Promise<AuthResult> {
    try {
      const cognitoResult = await this.cognitoService.respondToAuthChallenge(
        'NEW_PASSWORD_REQUIRED',
        request.session,
        {
          NEW_PASSWORD: request.newPassword,
          USERNAME: request.email
        }
      );

      const user = await this.getOrCreateUser(cognitoResult);
      const sessionId = await this.sessionService.createSession({
        userId: user.id,
        cognitoSub: cognitoResult.userId,
        accessToken: cognitoResult.accessToken!,
        refreshToken: cognitoResult.refreshToken!
      });

      const tokens = await this.generateTokens(user, sessionId);

      await this.auditService.log({
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        resource: 'auth',
        details: { 
          email: request.email,
          reason: 'first_login'
        }
      });

      return {
        user: this.formatUserInfo(user),
        tokens
      };

    } catch (error) {
      this.logger.error('Password change failed', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<{
    tokens: {
      accessToken: string;
      expiresIn: number;
    }
  }> {
    try {
      // Verify refresh token
      const decoded = await this.jwtService.verifyRefreshToken(refreshToken);
      
      // Get session
      const session = await this.sessionService.getSession(decoded.userId);
      if (!session || session.refreshToken !== refreshToken) {
        throw AppErrors.unauthorized('Invalid refresh token');
      }

      // Get user
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.status !== 'ativo') {
        throw AppErrors.unauthorized('User not active');
      }

      // Generate new access token
      const accessToken = this.jwtService.generateToken({
        id: user.id,
        email: user.email,
        name: user.nome,
        tipo_usuario: user.tipoUsuario,
        empresa_id: user.empresaId,
        escola_id: user.escolaId,
        cognito_sub: user.cognito_sub,
        groups: await this.getUserGroups(user.email)
      });

      // Update session
      await this.sessionService.updateSession(session.id, {
        lastActivity: new Date()
      });

      this.metrics.increment('auth.refresh.success');

      return {
        tokens: {
          accessToken,
          expiresIn: 3600 // 1 hour
        }
      };

    } catch (error) {
      this.logger.error('Token refresh failed', error);
      this.metrics.increment('auth.refresh.failure');
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(params: {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      // Invalidate tokens
      if (params.accessToken) {
        await this.jwtService.invalidateToken(params.accessToken);
      }
      
      if (params.refreshToken) {
        const decoded = await this.jwtService.verifyRefreshToken(params.refreshToken).catch(() => null);
        if (decoded) {
          await this.jwtService.invalidateRefreshToken(decoded.tokenId);
        }
      }

      // End session
      if (params.sessionId) {
        await this.sessionService.endSession(params.sessionId);
      } else if (params.userId) {
        await this.sessionService.endAllUserSessions(params.userId);
      }

      // Logout from Cognito
      if (params.accessToken) {
        await this.cognitoService.globalSignOut(params.accessToken).catch(() => {
          // Ignore Cognito logout errors
        });
      }

      // Audit log
      if (params.userId) {
        await this.auditService.log({
          userId: params.userId,
          action: 'USER_LOGOUT',
          resource: 'auth'
        });
      }

      this.metrics.increment('auth.logout.success');

    } catch (error) {
      this.logger.error('Logout failed', error);
      // Don't throw - logout should always succeed
    }
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.cognitoService.forgotPassword(email);
      
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        await this.auditService.log({
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          resource: 'auth',
          details: { email }
        });
      }

      this.metrics.increment('auth.password_reset.requested');

    } catch (error) {
      this.logger.error('Password reset request failed', error);
      // Don't throw to prevent email enumeration
    }
  }

  /**
   * Confirm password reset
   */
  public async confirmPasswordReset(params: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<void> {
    try {
      await this.cognitoService.confirmForgotPassword(
        params.email,
        params.code,
        params.newPassword
      );

      const user = await this.userRepository.findByEmail(params.email);
      if (user) {
        await this.auditService.log({
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          resource: 'auth',
          details: { email: params.email }
        });
      }

      this.metrics.increment('auth.password_reset.completed');

    } catch (error) {
      this.logger.error('Password reset confirmation failed', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  public async handleOAuthCallback(code: string, state?: string): Promise<AuthResult> {
    try {
      const tokens = await this.cognitoService.exchangeCodeForTokens(code);
      const idTokenData = this.jwtService.decodeToken(tokens.id_token);
      
      const cognitoResult = {
        userId: idTokenData.sub,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
        groups: idTokenData['cognito:groups'] || []
      };

      const user = await this.getOrCreateUser(cognitoResult);
      const sessionId = await this.sessionService.createSession({
        userId: user.id,
        cognitoSub: cognitoResult.userId,
        accessToken: cognitoResult.accessToken,
        refreshToken: cognitoResult.refreshToken
      });

      const internalTokens = await this.generateTokens(user, sessionId);

      await this.auditService.log({
        userId: user.id,
        action: 'OAUTH_LOGIN',
        resource: 'auth',
        details: {
          email: user.email,
          provider: 'cognito'
        }
      });

      return {
        user: this.formatUserInfo(user),
        tokens: internalTokens
      };

    } catch (error) {
      this.logger.error('OAuth callback failed', error);
      throw error;
    }
  }

  /**
   * Setup MFA for user
   */
  public async setupMfa(userId: string, type: 'SMS' | 'TOTP'): Promise<any> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      // Setup MFA in Cognito
      // Implementation depends on MFA type
      
      await this.auditService.log({
        userId,
        action: 'MFA_SETUP',
        resource: 'auth',
        details: { type }
      });

      return {
        secret: 'TOTP_SECRET_HERE',
        qrCode: 'QR_CODE_URL_HERE'
      };

    } catch (error) {
      this.logger.error('MFA setup failed', error);
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  public async disableMfa(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      // Disable MFA in Cognito
      // Implementation here

      await this.auditService.log({
        userId,
        action: 'MFA_DISABLED',
        resource: 'auth'
      });

    } catch (error) {
      this.logger.error('MFA disable failed', error);
      throw error;
    }
  }

  /**
   * Get user details
   */
  public async getUserDetails(userId: string): Promise<UserInfo> {
    const cacheKey = `user:${userId}`;
    const cached = this.cache.get<UserInfo>(cacheKey);
    if (cached) return cached;

    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      const userInfo = this.formatUserInfo(user);
      this.cache.set(cacheKey, userInfo, 300); // 5 min cache
      
      return userInfo;

    } catch (error) {
      this.logger.error('Get user details failed', error);
      throw error;
    }
  }

  // Private helper methods

  private async getOrCreateUser(cognitoResult: any): Promise<any> {
    // Try to find user by Cognito Sub
    let user = await this.userRepository.findByCognitoSub(cognitoResult.userId);
    
    if (!user) {
      // Extract user data from ID token if available
      const idTokenData = cognitoResult.idToken 
        ? this.jwtService.decodeToken(cognitoResult.idToken)
        : null;

      const email = idTokenData?.email || cognitoResult.email;
      const name = idTokenData?.name || idTokenData?.given_name || email?.split('@')[0];
      
      // Try to find by email
      user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // Create new user
        user = await this.userRepository.createUser({
          email,
          nome: name,
          tipoUsuario: this.determineUserType(cognitoResult.groups),
          cognito_sub: cognitoResult.userId,
          status: 'ativo',
          empresaId: 1, // Default, should be assigned properly
          sendWelcomeEmail: false,
          cognitoGroups: cognitoResult.groups
        });
      } else {
        // Update existing user with Cognito Sub
        user = await this.userRepository.update(user.id, {
          cognito_sub: cognitoResult.userId
        });
      }
    }

    return user;
  }

  private async generateTokens(user: any, sessionId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const groups = await this.getUserGroups(user.email);
    
    const accessToken = this.jwtService.generateToken({
      id: user.id,
      email: user.email,
      name: user.nome,
      tipo_usuario: user.tipoUsuario,
      empresa_id: user.empresaId,
      escola_id: user.escolaId,
      cognito_sub: user.cognito_sub,
      groups,
      sessionId
    });

    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }

  private async getUserGroups(email: string): Promise<string[]> {
    try {
      // Get groups from Cognito
      // This would require an admin API call
      return [];
    } catch (error) {
      return [];
    }
  }

  private determineUserType(groups: string[]): string {
    if (groups.some(g => g.toLowerCase().includes('admin'))) return 'admin';
    if (groups.some(g => g.toLowerCase().includes('gestor'))) return 'gestor';
    if (groups.some(g => g.toLowerCase().includes('diretor'))) return 'diretor';
    if (groups.some(g => g.toLowerCase().includes('professor'))) return 'professor';
    if (groups.some(g => g.toLowerCase().includes('aluno'))) return 'aluno';
    return 'aluno'; // default
  }

  private formatUserInfo(user: any): UserInfo {
    return {
      id: user.id,
      email: user.email,
      name: user.nome,
      tipo_usuario: user.tipoUsuario,
      empresa_id: user.empresaId,
      escola_id: user.escolaId,
      groups: [], // Would be populated from Cognito
      avatar: user.avatar,
      lastLogin: user.ultimoLogin,
      status: user.status
    };
  }
}
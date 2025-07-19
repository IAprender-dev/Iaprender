import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/JWTService-production';
import { SessionService } from '../modules/auth/SessionService';
import { AppErrors } from './errorHandler';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';

interface AuthenticatedRequest extends Request {
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
  session?: any;
}

export class AuthMiddleware {
  private jwtService: JWTService;
  private sessionService: SessionService;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.jwtService = new JWTService();
    this.sessionService = new SessionService();
    this.logger = new Logger('AuthMiddleware');
    this.metrics = getMetrics();
  }

  /**
   * Basic authentication middleware
   */
  public authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const timer = this.metrics.startTimer();

    try {
      // Extract token from header
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        throw AppErrors.unauthorized('No authentication token provided');
      }

      // Verify token
      const payload = await this.jwtService.verifyToken(token);

      // Verify session if sessionId present
      if (payload.sessionId) {
        const session = await this.sessionService.getSession(payload.sessionId);
        if (!session) {
          throw AppErrors.unauthorized('Session expired');
        }
        req.session = session;
      }

      // Attach user to request
      req.user = {
        id: payload.id.toString(),
        email: payload.email,
        name: payload.name,
        tipo_usuario: payload.tipo_usuario,
        empresa_id: payload.empresa_id,
        escola_id: payload.escola_id,
        cognito_sub: payload.cognito_sub,
        groups: payload.groups || [],
        sessionId: payload.sessionId
      };

      const duration = timer();
      this.metrics.timing('auth.middleware.duration', duration);
      this.metrics.increment('auth.middleware.success');

      next();
    } catch (error) {
      const duration = timer();
      this.metrics.increment('auth.middleware.failure');
      
      this.logger.debug('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      next(error);
    }
  };

  /**
   * Require specific user type
   */
  public requireUserType = (...allowedTypes: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(AppErrors.unauthorized());
      }

      if (!allowedTypes.includes(req.user.tipo_usuario)) {
        this.logger.warn('Access denied - incorrect user type', {
          userId: req.user.id,
          userType: req.user.tipo_usuario,
          requiredTypes: allowedTypes
        });

        return next(AppErrors.forbidden('Insufficient permissions'));
      }

      next();
    };
  };

  /**
   * Require specific groups
   */
  public requireGroups = (...requiredGroups: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(AppErrors.unauthorized());
      }

      const hasRequiredGroup = requiredGroups.some(group => 
        req.user!.groups.includes(group)
      );

      if (!hasRequiredGroup) {
        this.logger.warn('Access denied - missing required group', {
          userId: req.user.id,
          userGroups: req.user.groups,
          requiredGroups
        });

        return next(AppErrors.forbidden('Insufficient permissions'));
      }

      next();
    };
  };

  /**
   * Require company membership
   */
  public requireCompany = (companyId?: number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(AppErrors.unauthorized());
      }

      const targetCompanyId = companyId || parseInt(req.params.empresaId || req.params.companyId);
      
      if (!targetCompanyId) {
        return next(AppErrors.badRequest('Company ID not specified'));
      }

      // Admin can access any company
      if (req.user.tipo_usuario === 'admin') {
        return next();
      }

      // Check if user belongs to the company
      if (req.user.empresa_id !== targetCompanyId) {
        this.logger.warn('Access denied - incorrect company', {
          userId: req.user.id,
          userCompany: req.user.empresa_id,
          targetCompany: targetCompanyId
        });

        return next(AppErrors.forbidden('Access to this company is not allowed'));
      }

      next();
    };
  };

  /**
   * Require school membership
   */
  public requireSchool = (schoolId?: number) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return next(AppErrors.unauthorized());
      }

      const targetSchoolId = schoolId || parseInt(req.params.escolaId || req.params.schoolId);
      
      if (!targetSchoolId) {
        return next(AppErrors.badRequest('School ID not specified'));
      }

      // Admin and gestor can access any school in their company
      if (['admin', 'gestor'].includes(req.user.tipo_usuario)) {
        return next();
      }

      // Check if user belongs to the school
      if (req.user.escola_id !== targetSchoolId) {
        this.logger.warn('Access denied - incorrect school', {
          userId: req.user.id,
          userSchool: req.user.escola_id,
          targetSchool: targetSchoolId
        });

        return next(AppErrors.forbidden('Access to this school is not allowed'));
      }

      next();
    };
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  public optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (token) {
        const payload = await this.jwtService.verifyToken(token);
        
        req.user = {
          id: payload.id.toString(),
          email: payload.email,
          name: payload.name,
          tipo_usuario: payload.tipo_usuario,
          empresa_id: payload.empresa_id,
          escola_id: payload.escola_id,
          cognito_sub: payload.cognito_sub,
          groups: payload.groups || [],
          sessionId: payload.sessionId
        };
      }

      next();
    } catch (error) {
      // Log error but continue without auth
      this.logger.debug('Optional auth failed', error);
      next();
    }
  };
}

// Create singleton instance
const authMiddlewareInstance = new AuthMiddleware();

// Export middleware functions
export const authMiddleware = authMiddlewareInstance.authenticate;
export const requireUserType = authMiddlewareInstance.requireUserType;
export const requireGroups = authMiddlewareInstance.requireGroups;
export const requireCompany = authMiddlewareInstance.requireCompany;
export const requireSchool = authMiddlewareInstance.requireSchool;
export const optionalAuth = authMiddlewareInstance.optionalAuth;

// Export types
export type { AuthenticatedRequest };
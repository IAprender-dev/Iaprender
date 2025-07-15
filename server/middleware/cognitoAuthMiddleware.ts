import { Request, Response, NextFunction } from 'express';
import { CognitoJWTVerifier } from '../services/CognitoJWTVerifier.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    nome: string;
    firstName?: string;
    lastName?: string;
    username: string;
    role: string;
    tipo_usuario: string;
    empresa_id: number | null;
    status: string;
    groups: string[];
  };
}

export class CognitoAuthMiddleware {
  private verifier: CognitoJWTVerifier;

  constructor() {
    this.verifier = new CognitoJWTVerifier();
  }

  /**
   * Middleware para autenticação obrigatória
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação não fornecido',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      
      const verificationResult = await this.verifier.verifyToken(token);
      
      if (!verificationResult.success || !verificationResult.user) {
        return res.status(401).json({
          success: false,
          error: verificationResult.error || 'Token inválido',
        });
      }

      // Extrair informações do usuário
      req.user = this.verifier.extractUserInfo(verificationResult.user);
      
      next();
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno na autenticação',
      });
    }
  };

  /**
   * Middleware para verificar se o usuário tem um dos roles especificados
   */
  requireRole = (allowedRoles: string | string[]) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Permissões insuficientes.',
        });
      }

      next();
    };
  };

  /**
   * Middleware para verificar se o usuário pertence a um dos grupos especificados
   */
  requireGroup = (allowedGroups: string | string[]) => {
    const groups = Array.isArray(allowedGroups) ? allowedGroups : [allowedGroups];
    
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
        });
      }

      const hasRequiredGroup = groups.some(group => req.user!.groups.includes(group));
      
      if (!hasRequiredGroup) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Grupo insuficiente.',
        });
      }

      next();
    };
  };

  /**
   * Middleware para verificar se o usuário tem acesso a uma empresa específica
   */
  requireEmpresaAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
    }

    // Admin tem acesso a todas as empresas
    if (req.user.role === 'admin') {
      return next();
    }

    // Outros usuários só têm acesso à própria empresa
    const empresaId = req.params.empresaId || req.body.empresaId || req.query.empresaId;
    
    if (empresaId && req.user.empresa_id && parseInt(empresaId) !== req.user.empresa_id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Empresa não autorizada.',
      });
    }

    next();
  };

  /**
   * Middleware opcional de autenticação (não falha se não autenticado)
   */
  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continuar sem autenticação
      }

      const token = authHeader.substring(7);
      const verificationResult = await this.verifier.verifyToken(token);
      
      if (verificationResult.success && verificationResult.user) {
        req.user = this.verifier.extractUserInfo(verificationResult.user);
      }
      
      next();
    } catch (error: any) {
      console.error('❌ Erro na autenticação opcional:', error);
      next(); // Continuar mesmo com erro
    }
  };
}

// Instância única do middleware
export const cognitoAuthMiddleware = new CognitoAuthMiddleware();
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { CognitoJWTVerifier } from '../services/CognitoJWTVerifier.js';
import { db } from '../db.js';
import { usuarios } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface SecurityContext {
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  timestamp: number;
  riskScore: number;
  deviceFingerprint: string;
}

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
    lastLogin?: Date;
    loginAttempts?: number;
    isLocked?: boolean;
    securityContext?: SecurityContext;
  };
  securityContext?: SecurityContext;
}

export class EnhancedAuthMiddleware {
  private verifier: CognitoJWTVerifier;
  private securityLogger: SecurityLogger;
  private rateLimiters: Map<string, any>;
  private suspiciousIPs: Set<string>;
  private bruteForceAttempts: Map<string, number>;

  constructor() {
    this.verifier = new CognitoJWTVerifier();
    this.securityLogger = new SecurityLogger();
    this.rateLimiters = new Map();
    this.suspiciousIPs = new Set();
    this.bruteForceAttempts = new Map();
    
    this.initializeRateLimiters();
    this.startSecurityCleanup();
  }

  private initializeRateLimiters() {
    // Rate limiter para login attempts
    this.rateLimiters.set('login', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 tentativas por IP
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      },
      keyGenerator: (req) => {
        return `${req.ip}-${req.headers['user-agent']}`;
      },
    }));

    // Rate limiter para API calls gerais
    this.rateLimiters.set('api', rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 100, // máximo 100 requests por minuto
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Limite de requisições excedido. Tente novamente em 1 minuto.',
      },
    }));

    // Rate limiter para operações sensíveis
    this.rateLimiters.set('sensitive', rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10, // máximo 10 operações sensíveis por 5 minutos
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: 'Limite de operações sensíveis excedido. Tente novamente em 5 minutos.',
      },
    }));
  }

  private startSecurityCleanup() {
    // Limpar dados de segurança a cada hora
    setInterval(() => {
      this.cleanupSecurityData();
    }, 60 * 60 * 1000); // 1 hora
  }

  private cleanupSecurityData() {
    // Limpar IPs suspeitos após 24 horas
    this.suspiciousIPs.clear();
    
    // Limpar tentativas de força bruta após 1 hora
    this.bruteForceAttempts.clear();
    
    console.log('🧹 Limpeza de dados de segurança realizada');
  }

  private generateSecurityContext(req: Request): SecurityContext {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const sessionId = req.headers['x-session-id'] as string || crypto.randomUUID();
    
    // Criar fingerprint do dispositivo
    const deviceFingerprint = crypto
      .createHash('sha256')
      .update(`${ipAddress}${userAgent}${req.headers['accept-language'] || ''}`)
      .digest('hex');

    // Calcular score de risco
    const riskScore = this.calculateRiskScore(ipAddress, userAgent);

    return {
      ipAddress,
      userAgent,
      sessionId,
      timestamp: Date.now(),
      riskScore,
      deviceFingerprint,
    };
  }

  private calculateRiskScore(ipAddress: string, userAgent: string): number {
    let score = 0;

    // Verificar IP suspeito
    if (this.suspiciousIPs.has(ipAddress)) {
      score += 50;
    }

    // Verificar tentativas de força bruta
    const attempts = this.bruteForceAttempts.get(ipAddress) || 0;
    score += attempts * 10;

    // Verificar user agent suspeito
    if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler')) {
      score += 30;
    }

    // Verificar localização geográfica (simulado)
    if (this.isFromSuspiciousLocation(ipAddress)) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  private isFromSuspiciousLocation(ipAddress: string): boolean {
    // Simular verificação de localização geográfica
    // Em produção, usar serviços como MaxMind GeoIP
    return false;
  }

  private async logSecurityEvent(
    event: string,
    context: SecurityContext,
    details: any = {}
  ) {
    this.securityLogger.logEvent({
      event,
      timestamp: new Date().toISOString(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      riskScore: context.riskScore,
      deviceFingerprint: context.deviceFingerprint,
      details,
    });
  }

  /**
   * Middleware principal de autenticação com segurança aprimorada
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Gerar contexto de segurança
      const securityContext = this.generateSecurityContext(req);
      req.securityContext = securityContext;

      // Verificar se IP está bloqueado
      if (securityContext.riskScore > 80) {
        await this.logSecurityEvent('AUTH_BLOCKED_HIGH_RISK', securityContext);
        return res.status(403).json({
          success: false,
          error: 'Acesso bloqueado por motivos de segurança',
          code: 'SECURITY_BLOCKED',
        });
      }

      // Verificar header de autorização
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await this.logSecurityEvent('AUTH_MISSING_TOKEN', securityContext);
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação não fornecido',
          code: 'MISSING_TOKEN',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      
      // Validar formato do token
      if (!this.isValidTokenFormat(token)) {
        await this.logSecurityEvent('AUTH_INVALID_TOKEN_FORMAT', securityContext);
        return res.status(401).json({
          success: false,
          error: 'Formato de token inválido',
          code: 'INVALID_TOKEN_FORMAT',
        });
      }

      // Verificar token no Cognito
      const verificationResult = await this.verifier.verifyToken(token);
      
      if (!verificationResult.success || !verificationResult.user) {
        await this.logSecurityEvent('AUTH_TOKEN_VERIFICATION_FAILED', securityContext, {
          error: verificationResult.error,
        });
        
        // Incrementar tentativas de força bruta
        this.incrementBruteForceAttempts(securityContext.ipAddress);
        
        return res.status(401).json({
          success: false,
          error: verificationResult.error || 'Token inválido',
          code: 'TOKEN_VERIFICATION_FAILED',
        });
      }

      // Extrair informações do usuário
      const userInfo = this.verifier.extractUserInfo(verificationResult.user);
      
      // Verificar se usuário existe no banco local
      const localUser = await this.getLocalUser(userInfo.id);
      
      if (!localUser) {
        await this.logSecurityEvent('AUTH_USER_NOT_FOUND', securityContext, {
          userId: userInfo.id,
        });
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado no sistema local',
          code: 'USER_NOT_FOUND',
        });
      }

      // Verificar se usuário está ativo
      if (localUser.status !== 'ativo') {
        await this.logSecurityEvent('AUTH_USER_INACTIVE', securityContext, {
          userId: userInfo.id,
          status: localUser.status,
        });
        return res.status(403).json({
          success: false,
          error: 'Usuário inativo',
          code: 'USER_INACTIVE',
        });
      }

      // Verificar se usuário está bloqueado
      if (localUser.isLocked) {
        await this.logSecurityEvent('AUTH_USER_LOCKED', securityContext, {
          userId: userInfo.id,
        });
        return res.status(403).json({
          success: false,
          error: 'Usuário bloqueado',
          code: 'USER_LOCKED',
        });
      }

      // Atualizar último login
      await this.updateLastLogin(userInfo.id);

      // Adicionar contexto de segurança ao usuário
      req.user = {
        ...userInfo,
        securityContext,
      };

      await this.logSecurityEvent('AUTH_SUCCESS', securityContext, {
        userId: userInfo.id,
        userType: userInfo.tipo_usuario,
      });

      next();
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error);
      
      await this.logSecurityEvent('AUTH_ERROR', req.securityContext!, {
        error: error.message,
        stack: error.stack,
      });
      
      return res.status(500).json({
        success: false,
        error: 'Erro interno na autenticação',
        code: 'INTERNAL_ERROR',
      });
    }
  };

  private isValidTokenFormat(token: string): boolean {
    // Verificar se token tem formato JWT básico
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  private incrementBruteForceAttempts(ipAddress: string) {
    const attempts = this.bruteForceAttempts.get(ipAddress) || 0;
    this.bruteForceAttempts.set(ipAddress, attempts + 1);
    
    // Marcar IP como suspeito após 3 tentativas
    if (attempts >= 3) {
      this.suspiciousIPs.add(ipAddress);
    }
  }

  private async getLocalUser(userId: string) {
    try {
      const [user] = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.cognitoSub, userId))
        .limit(1);
      
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário local:', error);
      return null;
    }
  }

  private async updateLastLogin(userId: string) {
    try {
      await db
        .update(usuarios)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(usuarios.cognitoSub, userId));
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  /**
   * Middleware para verificar roles com segurança aprimorada
   */
  requireRole = (allowedRoles: string | string[]) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED',
        });
      }

      if (!roles.includes(req.user.role)) {
        await this.logSecurityEvent('AUTH_INSUFFICIENT_PERMISSIONS', req.securityContext!, {
          userId: req.user.id,
          requiredRoles: roles,
          userRole: req.user.role,
        });
        
        return res.status(403).json({
          success: false,
          error: 'Permissões insuficientes',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: req.user.role,
        });
      }

      next();
    };
  };

  /**
   * Middleware para verificar grupos com segurança aprimorada
   */
  requireGroup = (allowedGroups: string | string[]) => {
    const groups = Array.isArray(allowedGroups) ? allowedGroups : [allowedGroups];
    
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED',
        });
      }

      const hasRequiredGroup = groups.some(group => req.user!.groups.includes(group));
      
      if (!hasRequiredGroup) {
        await this.logSecurityEvent('AUTH_GROUP_ACCESS_DENIED', req.securityContext!, {
          userId: req.user.id,
          requiredGroups: groups,
          userGroups: req.user.groups,
        });
        
        return res.status(403).json({
          success: false,
          error: 'Acesso negado para o grupo',
          code: 'GROUP_ACCESS_DENIED',
          required: groups,
          current: req.user.groups,
        });
      }

      next();
    };
  };

  /**
   * Middleware para operações sensíveis
   */
  requireSensitiveOperation = () => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user || !req.securityContext) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED',
        });
      }

      // Verificar score de risco
      if (req.securityContext.riskScore > 50) {
        await this.logSecurityEvent('SENSITIVE_OP_BLOCKED_HIGH_RISK', req.securityContext, {
          userId: req.user.id,
          operation: req.path,
        });
        
        return res.status(403).json({
          success: false,
          error: 'Operação bloqueada por motivos de segurança',
          code: 'SENSITIVE_OP_BLOCKED',
        });
      }

      // Aplicar rate limiting para operações sensíveis
      const sensitiveRateLimit = this.rateLimiters.get('sensitive');
      sensitiveRateLimit(req, res, (err: any) => {
        if (err) {
          return res.status(429).json({
            success: false,
            error: 'Limite de operações sensíveis excedido',
            code: 'RATE_LIMIT_EXCEEDED',
          });
        }
        next();
      });
    };
  };

  /**
   * Obter rate limiter por tipo
   */
  getRateLimiter(type: string) {
    return this.rateLimiters.get(type);
  }
}

/**
 * Classe para logging de eventos de segurança
 */
class SecurityLogger {
  private logQueue: any[] = [];
  private isProcessing = false;

  constructor() {
    this.startLogProcessor();
  }

  logEvent(event: any) {
    this.logQueue.push({
      ...event,
      timestamp: new Date().toISOString(),
    });
  }

  private startLogProcessor() {
    setInterval(() => {
      if (!this.isProcessing && this.logQueue.length > 0) {
        this.processLogQueue();
      }
    }, 5000); // Processar a cada 5 segundos
  }

  private async processLogQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const events = this.logQueue.splice(0, 100); // Processar até 100 eventos por vez
      
      for (const event of events) {
        // Em produção, enviar para serviços de log como CloudWatch, Elasticsearch, etc.
        console.log('🔒 Security Event:', JSON.stringify(event, null, 2));
        
        // Salvar no banco de dados se necessário
        await this.saveToDatabase(event);
      }
    } catch (error) {
      console.error('Erro ao processar logs de segurança:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async saveToDatabase(event: any) {
    // Implementar salvamento no banco de dados
    // Por agora, apenas log no console
    return Promise.resolve();
  }
}

export default EnhancedAuthMiddleware;
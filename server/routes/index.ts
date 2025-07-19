import { Express } from 'express';
import { Server } from 'http';
import { Logger } from '../utils/logger';
import { RouteRegistry } from './registry';
import { SecurityMiddleware } from '../middleware/security';
import { AuthMiddleware } from '../middleware/auth';
import { ValidationMiddleware } from '../middleware/validation';
import { envConfig } from '../config/environment';

export class RouteManager {
  private logger: Logger;
  private registry: RouteRegistry;
  private securityMiddleware: SecurityMiddleware;
  private authMiddleware: AuthMiddleware;
  private validationMiddleware: ValidationMiddleware;

  constructor() {
    this.logger = new Logger('RouteManager');
    this.registry = new RouteRegistry();
    this.securityMiddleware = new SecurityMiddleware();
    this.authMiddleware = new AuthMiddleware();
    this.validationMiddleware = new ValidationMiddleware();
  }

  public async registerRoutes(app: Express, server: Server): Promise<void> {
    this.logger.info('Registering application routes');

    try {
      // Apply global middleware
      this.applyGlobalMiddleware(app);

      // Register API routes
      await this.registerApiRoutes(app);

      // Register WebSocket handlers
      await this.registerWebSocketHandlers(server);

      // Register error handlers (must be last)
      this.registerErrorHandlers(app);

      this.logger.info('All routes registered successfully');
    } catch (error) {
      this.logger.error('Failed to register routes', error);
      throw error;
    }
  }

  private applyGlobalMiddleware(app: Express): void {
    // Security middleware
    app.use(this.securityMiddleware.corsHandler());
    app.use(this.securityMiddleware.rateLimiter());
    app.use(this.securityMiddleware.contentSecurityPolicy());

    // Request parsing
    app.use(this.validationMiddleware.jsonParser());
    app.use(this.validationMiddleware.urlEncodedParser());

    // Authentication
    app.use(this.authMiddleware.sessionHandler());
    app.use(this.authMiddleware.jwtExtractor());
  }

  private async registerApiRoutes(app: Express): Promise<void> {
    // Health and monitoring
    await this.registry.register('health', app);
    await this.registry.register('metrics', app);

    // Authentication routes
    await this.registry.register('auth', app, {
      prefix: '/api/auth',
      middleware: [this.securityMiddleware.authRateLimiter()]
    });

    // Admin routes
    await this.registry.register('admin', app, {
      prefix: '/api/admin',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin'])
      ]
    });

    // Gestor routes
    await this.registry.register('gestor', app, {
      prefix: '/api/gestor',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin', 'gestor'])
      ]
    });

    // Diretor routes
    await this.registry.register('diretor', app, {
      prefix: '/api/diretor',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin', 'gestor', 'diretor'])
      ]
    });

    // Professor routes
    await this.registry.register('professor', app, {
      prefix: '/api/professor',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin', 'gestor', 'diretor', 'professor'])
      ]
    });

    // Student routes
    await this.registry.register('aluno', app, {
      prefix: '/api/aluno',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin', 'gestor', 'diretor', 'professor', 'aluno'])
      ]
    });

    // AWS service routes
    await this.registry.register('s3', app, {
      prefix: '/api/s3',
      middleware: [this.authMiddleware.requireAuth()]
    });

    await this.registry.register('cognito', app, {
      prefix: '/api/cognito',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.authMiddleware.requireRole(['admin'])
      ]
    });

    await this.registry.register('bedrock', app, {
      prefix: '/api/ai',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.securityMiddleware.aiRateLimiter()
      ]
    });

    // Data routes
    await this.registry.register('dashboard', app, {
      prefix: '/api/dashboard',
      middleware: [this.authMiddleware.requireAuth()]
    });

    await this.registry.register('reports', app, {
      prefix: '/api/reports',
      middleware: [this.authMiddleware.requireAuth()]
    });

    // File upload routes
    await this.registry.register('upload', app, {
      prefix: '/api/upload',
      middleware: [
        this.authMiddleware.requireAuth(),
        this.validationMiddleware.fileUploadHandler()
      ]
    });
  }

  private async registerWebSocketHandlers(server: Server): Promise<void> {
    if (envConfig.features.enableWebSocket) {
      const { WebSocketManager } = await import('../websocket/manager');
      const wsManager = new WebSocketManager(server);
      await wsManager.initialize();
    }
  }

  private registerErrorHandlers(app: Express): void {
    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler is registered in main server file
  }
}

// Export singleton instance
export async function registerRoutes(app: Express, server: Server): Promise<void> {
  const routeManager = new RouteManager();
  await routeManager.registerRoutes(app, server);
}
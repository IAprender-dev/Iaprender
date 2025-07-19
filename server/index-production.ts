import { config } from './config/environment';
import express, { type Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Logger } from './utils/logger';
import { ErrorHandler } from './middleware/errorHandler';
import { MetricsCollector } from './utils/metrics';
import { HealthCheckService } from './services/healthCheck';
import { GracefulShutdown } from './utils/gracefulShutdown';
import { registerRoutes } from './routes';
import { DatabaseManager } from './config/database-manager';
import { SecretsManager } from './config/secrets';
import { RequestLogger } from './middleware/requestLogger';

class ApplicationServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private logger: Logger;
  private metrics: MetricsCollector;
  private isShuttingDown = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.logger = new Logger('ApplicationServer');
    this.metrics = new MetricsCollector();
  }

  private async initializeServices(): Promise<void> {
    // Initialize AWS Secrets Manager
    await SecretsManager.initialize();
    this.logger.info('AWS Secrets Manager initialized');

    // Initialize database with retry logic
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    this.logger.info('Database connections established');

    // Initialize health check service
    const healthCheck = new HealthCheckService(dbManager);
    this.app.use('/health', healthCheck.getRouter());
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", config.aws.region ? `https://*.${config.aws.region}.amazonaws.com` : '']
        }
      }
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.metrics.increment('rate_limit_exceeded', { path: req.path });
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: req.rateLimit.resetTime
        });
      }
    });

    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ 
      limit: config.server.bodyLimit,
      verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: config.server.bodyLimit }));

    // Request logging
    this.app.use(new RequestLogger(this.logger, this.metrics).middleware());

    // Request ID
    this.app.use((req, res, next) => {
      req.id = crypto.randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  private async setupRoutes(): Promise<void> {
    try {
      // Core API routes
      await registerRoutes(this.app, this.server);
      this.logger.info('API routes registered successfully');

      // Static file serving for production
      if (config.env === 'production') {
        const staticPath = path.join(__dirname, '../client/dist');
        this.app.use(express.static(staticPath, {
          maxAge: '1d',
          etag: true,
          lastModified: true,
          setHeaders: (res, path) => {
            if (path.endsWith('.js') || path.endsWith('.css')) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
          }
        }));

        // SPA fallback
        this.app.get('*', (req, res) => {
          res.sendFile(path.join(staticPath, 'index.html'));
        });
      }
    } catch (error) {
      this.logger.error('Failed to setup routes', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      this.metrics.increment('404_errors', { path: req.path });
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        requestId: req.id
      });
    });

    // Global error handler
    this.app.use(new ErrorHandler(this.logger, this.metrics).middleware());
  }

  private setupGracefulShutdown(): void {
    const shutdown = new GracefulShutdown(this.server, this.logger);
    
    process.on('SIGTERM', async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      await shutdown.execute();
    });

    process.on('SIGINT', async () => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      await shutdown.execute();
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception', error);
      this.metrics.increment('uncaught_exceptions');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection', { reason, promise });
      this.metrics.increment('unhandled_rejections');
    });
  }

  public async start(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      await this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start server
      const port = config.server.port;
      const host = config.server.host;

      this.server.listen(port, host, () => {
        this.logger.info(`Server started`, {
          port,
          host,
          env: config.env,
          nodeVersion: process.version,
          pid: process.pid
        });
        this.metrics.increment('server_starts');
      });

      // Enable keep-alive with timeout
      this.server.keepAliveTimeout = 65000;
      this.server.headersTimeout = 66000;

    } catch (error) {
      this.logger.error('Failed to start server', error);
      this.metrics.increment('server_start_failures');
      process.exit(1);
    }
  }
}

// Start application
if (require.main === module) {
  const server = new ApplicationServer();
  server.start().catch((error) => {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export { ApplicationServer };
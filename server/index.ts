import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupViteCustom, serveStatic, log } from "./vite-custom";
import { initializeDatabase } from "./db";
import cognitoCustomUIRouter from "./routes/cognito-custom-ui";
import cognitoOAuthRouter from "./routes/cognito-oauth";
import cognitoAdminRouter from "./routes/cognito-admin";
import { SecretsManager } from "./config/secrets.js";
// WebSocket import removed - using direct OpenAI Realtime API connection

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize database connection with fallback
let dbInitialized = false;
initializeDatabase()
  .then(() => {
    dbInitialized = true;
    console.log('💾 Database initialized successfully');
  })
  .catch(error => {
    console.error('⚠️ Database initialization failed, continuing without database:', error);
    console.log('🔄 The app will continue running and attempt to reconnect on API calls');
    dbInitialized = false;
  });

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add auth route FIRST - before any other middleware to prevent conflicts
  app.get('/auth', (req, res) => {
    try {
      const credentials = SecretsManager.getAWSCredentials();
      
      if (!credentials.AWS_COGNITO_DOMAIN || !credentials.AWS_COGNITO_CLIENT_ID || !credentials.AWS_COGNITO_REDIRECT_URI) {
        return res.status(500).send('Configuração AWS Cognito incompleta');
      }

      // Construir URL de autenticação do Cognito
      const authUrl = new URL('/oauth2/authorize', credentials.AWS_COGNITO_DOMAIN);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', credentials.AWS_COGNITO_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', credentials.AWS_COGNITO_REDIRECT_URI);
      authUrl.searchParams.append('scope', 'openid email profile');

      console.log('🔐 Rota /auth - Redirecionando para Cognito OAuth:', authUrl.toString());
      
      res.redirect(authUrl.toString());
    } catch (error) {
      console.error('❌ Erro ao redirecionar para Cognito:', error);
      res.status(500).send('Erro interno do servidor');
    }
  });
  console.log('🔒 Rota /auth registrada com prioridade máxima');
  
  // Add OAuth routes for Cognito
  app.use('/api/auth', cognitoOAuthRouter);
  console.log('🔒 Rotas OAuth do Cognito registradas');
  
  // Add callback route at root level
  app.use('/auth', cognitoOAuthRouter);
  console.log('🔒 Rotas de callback OAuth registradas');
  
  // Add admin authentication routes
  app.use('/api/auth', cognitoAdminRouter);
  console.log('🔒 Rotas de autenticação administrativa registradas');
  // Rotas de autenticação direta removidas - apenas Cognito oficial
  
  // Import and register the new auth routes with JWT middleware
  const authRouter = await import('./routes/auth.js');
  app.use('/api/auth', authRouter.default);
  console.log('🔒 Rotas de autenticação JWT registradas');
  
  const server = await registerRoutes(app);
  
  // Add custom Cognito UI routes
  app.use('/cognito-ui', cognitoCustomUIRouter);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Middleware para garantir que APIs sejam processadas antes do Vite
  app.use((req, res, next) => {
    // Se é uma requisição de API, marcar como processada
    if (req.path.startsWith('/api/')) {
      res.locals.isApiRequest = true;
    }
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupViteCustom(app, server);
  } else {
    serveStatic(app);
  }

  // WebSocket proxy removed - using direct connection from frontend

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

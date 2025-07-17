import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { connectivityRouter } from "./routes/connectivity.js";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import cognitoCustomUIRouter from "./routes/cognito-custom-ui";
import cognitoOAuthRouter from "./routes/cognito-oauth";
import cognitoAdminRouter from "./routes/cognito-admin";
import authProxyRouter from "./routes/auth-proxy";
import awsIntegrationRouter from "./routes/aws-integration";
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
  // Remover rota /auth do backend - será tratada pelo frontend
  console.log('🔒 Rota /auth tratada pelo frontend React');
  
  // Reativando rotas essenciais após correção do stack overflow
  
  // Add auth proxy routes for cognito-config and client-secret
  app.use('/api/auth', authProxyRouter);
  console.log('🔒 Rotas de proxy de autenticação registradas');
  
  console.log('🔒 Outras rotas OAuth mantidas desabilitadas por segurança - apenas autenticação client-side ativa');
  
  // Registrar rotas de conectividade primeiro
  app.use('/api/connectivity', connectivityRouter);
  console.log('🔌 Rotas de teste de conectividade registradas');

  // 🌐 Rotas AWS integradas
  app.use('/api', awsIntegrationRouter);
  console.log('🌐 Rotas AWS integradas registradas');
  
  // Registrar rotas Lambda IA
  const lambdaIARouter = await import('./routes/lambda-ia.js');
  app.use('/api/lambda-ia', lambdaIARouter.default);
  console.log('🤖 Rotas Lambda IA registradas');
  
  // Registrar rotas Sistema Híbrido
  const hybridLambdaRouter = await import('./routes/hybrid-lambda.js');
  app.use('/api/hybrid-lambda', hybridLambdaRouter.default);
  console.log('🔄 Rotas Sistema Híbrido registradas');
  
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
    await setupVite(app, server);
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

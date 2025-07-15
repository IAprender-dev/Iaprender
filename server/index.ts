import dotenv from "dotenv";
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupViteCustom, serveStatic, log } from "./vite-custom";
import { initializeDatabase } from "./db";
import cognitoCustomUIRouter from "./routes/cognito-custom-ui";
import secureAuthRouter from "./routes/secure-auth";
import cognitoOAuthRouter from "./routes/cognito-oauth";
import cognitoDirectRouter from "./routes/cognito-direct";
import cognitoAdminRouter from "./routes/cognito-admin";
import cognitoHybridRouter from "./routes/cognito-hybrid";
import authSimpleRouter from "./routes/auth-simple";
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
  // Add secure authentication routes BEFORE registerRoutes to avoid middleware interference
  app.use('/api/auth', secureAuthRouter);
  console.log('🔒 Rotas de autenticação segura registradas');
  
  // Add OAuth routes for Cognito
  app.use('/api/auth', cognitoOAuthRouter);
  console.log('🔒 Rotas OAuth do Cognito registradas');
  
  // Add callback route at root level
  app.use('/auth', cognitoOAuthRouter);
  console.log('🔒 Rotas de callback OAuth registradas');
  
  // Add direct authentication routes
  app.use('/api/auth', cognitoDirectRouter);
  console.log('🔒 Rotas de autenticação direta registradas');
  
  // Add admin authentication routes
  app.use('/api/auth', cognitoAdminRouter);
  console.log('🔒 Rotas de autenticação administrativa registradas');
  
  // Add hybrid authentication routes
  app.use('/api/auth', cognitoHybridRouter);
  console.log('🔒 Rotas de autenticação híbrida registradas');
  
  app.use('/api/auth', authSimpleRouter);
  console.log('🔒 Rotas de autenticação simples registradas');
  
  // Import and register the new direct Cognito routes
  const cognitoDirectNewRouter = await import('./routes/cognito-direct.js');
  app.use('/api/auth', cognitoDirectNewRouter.default);
  console.log('🔒 Rotas de autenticação direta Cognito registradas');
  
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

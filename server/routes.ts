import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import "./types/auth";
import { storage } from "./storage";
import { db } from "./db";
import { cognitoService } from "./utils/cognito-service";
import { awsIAMService } from "./services/aws-iam-service";
// Schema imports removidas - será reescrito com nova estrutura hierárquica
import { eq, sql, gte, desc, and, isNull, isNotNull, lte, or, inArray } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import { importUsersFromCSV, hashPassword, generateSecurePassword } from "./utils/csv-importer";
import { sendLoginCredentials } from "./utils/email-service";
import { sendWhatsAppCredentials } from "./utils/whatsapp-service";
import aiRouter from "./routes/ai-routes";
import translateRoutes from "./routes/translate-routes";
import tokenRouter from "./routes/token-routes";
import cognitoUIRouter from "./routes/cognito-custom-ui";
import * as OpenAIService from "./utils/ai-services/openai";
import mammoth from "mammoth";
import pdfParse from "pdf-parse-new";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import WebSocket, { WebSocketServer } from "ws";
import { generateLogo } from "./logo-generator";
import { tokenInterceptor, tokenAlertMiddleware } from "./modules/tokenCounter/middleware/tokenInterceptor";
import { registerTokenRoutes } from "./modules/tokenCounter/routes/tokenRoutes";
import jwt from "jsonwebtoken";
import axios from "axios";
import rateLimit from "express-rate-limit";
import * as adminRoutes from "./routes/admin-routes";
import { registerMunicipalRoutes } from "./routes/municipal-routes";
import { registerSchoolsMunicipalRoutes } from "./routes/schools-municipal-routes";
import { registerPerformanceRoutes } from "./routes/performance-routes";
import { registerSchoolRoutes } from "./routes/school-routes";
import { registerAdminCognitoRoutes } from "./routes/admin-cognito-routes";
import { registerAdminEndpoints } from "./routes/admin-endpoints";

// Define login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const answerSchema = z.object({
  message: z.string(),
  role: z.enum(["teacher", "student"])
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create an HTTP server
  const server = createServer(app);

  // Middleware para garantir que requisições de API sejam processadas antes do Vite
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      // Marcar a requisição como processada pela API
      res.locals.isApiRequest = true;
      // Garantir que o content-type seja JSON para APIs
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        res.setHeader('Content-Type', 'application/json');
      }
    }
    next();
  });

  // Rate limiting configurations - more permissive for development
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased limit for development
    message: { message: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/static') || req.path.startsWith('/assets') || req.path.includes('.'),
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // increased for development
    message: { message: "Too many authentication attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // increased for development
    message: { message: "API rate limit exceeded, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/api/auth/me'), // skip auth check endpoint
  });

  // Rate limiting temporarily disabled for debugging
  // app.use((req, res, next) => {
  //   if (req.path.startsWith('/static') || req.path.startsWith('/assets') || req.path.includes('.js') || req.path.includes('.css')) {
  //     return next();
  //   }
  //   generalLimiter(req, res, next);
  // });

  // Multer configuration for file uploads with enhanced audio support
  const upload = multer({ 
    dest: "uploads/",
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
      // Accept various file types including audio
      const allowedTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'audio/mpeg',      // MP3
        'audio/wav',       // WAV
        'audio/mp4',       // M4A
        'audio/webm',      // WebM audio
        'audio/ogg',       // OGG
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
      }
    }
  });

  // Apply token interceptor middleware to all routes
  app.use(tokenInterceptor);
  app.use(tokenAlertMiddleware);

  // Session configuration
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // JWT-based authentication middleware
  const authenticate = (req: Request, res: Response, next: any) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const jwtSecret = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Add user data to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        tipo_usuario: decoded.tipo_usuario,
        empresa_id: decoded.empresa_id,
        escola_id: decoded.escola_id
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Middleware para verificar tipos específicos de usuário
  const requireUserType = (allowedTypes: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!allowedTypes.includes(req.user.tipo_usuario)) {
        return res.status(403).json({ 
          message: "Access denied", 
          required: allowedTypes,
          current: req.user.tipo_usuario 
        });
      }
      
      next();
    };
  };

  // Middleware to check admin authentication
  const authenticateAdmin = (req: Request, res: Response, next: any) => {
    return requireUserType(['admin'])(req, res, next);
  };
  
  // Middleware para admin ou gestor
  const requireAdminOrGestor = requireUserType(['admin', 'gestor']);

  // Admin routes - High priority routes to avoid conflict with frontend routing
  app.post("/api/create-user", authenticate, async (req: Request, res: Response) => {
    try {
      console.log('🚀 [ADMIN USER CREATE] Dados recebidos:', req.body);
      
      // Definir headers para garantir que a resposta seja JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      const { email, firstName, lastName, group, temporaryPassword } = req.body;
      
      // Validar campos obrigatórios
      if (!email || !firstName || !lastName || !group || !temporaryPassword) {
        return res.status(400).json({
          success: false,
          message: "Todos os campos são obrigatórios",
          missing: {
            email: !email,
            firstName: !firstName,
            lastName: !lastName,
            group: !group,
            temporaryPassword: !temporaryPassword
          }
        });
      }
      
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Formato de email inválido"
        });
      }
      
      // Validar grupo
      const validGroups = ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos'];
      if (!validGroups.includes(group)) {
        return res.status(400).json({
          success: false,
          message: "Grupo de usuário inválido",
          validGroups
        });
      }
      
      // Usar o cognitoService para criar o usuário
      const result = await cognitoService.createUser({
        email,
        name: `${firstName} ${lastName}`,
        group,
        tempPassword: temporaryPassword
      });
      
      console.log('✅ [ADMIN USER CREATE] Usuário criado no Cognito:', result);
      
      res.json({
        success: true,
        message: "Usuário criado com sucesso no AWS Cognito",
        user: {
          cognitoId: result.userId,
          email: email,
          firstName: firstName,
          lastName: lastName,
          group: group,
          status: "CONFIRMED",
          enabled: true,
          createdDate: new Date().toISOString(),
          tempPassword: result.tempPassword
        }
      });
      
    } catch (error) {
      console.error('❌ [ADMIN USER CREATE] Erro:', error);
      
      let errorMessage = "Erro interno do servidor";
      let statusCode = 500;
      
      if (error.message.includes('already exists')) {
        errorMessage = "Usuário com este email já existe";
        statusCode = 409;
      } else if (error.message.includes('Invalid password')) {
        errorMessage = "Senha não atende aos critérios de segurança";
        statusCode = 400;
      } else if (error.message.includes('Invalid email')) {
        errorMessage = "Email inválido";
        statusCode = 400;
      } else if (error.message.includes('AccessDenied')) {
        errorMessage = "Acesso negado - verifique as credenciais AWS";
        statusCode = 403;
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: error.message
      });
    }
  });

  // Dashboard routes - High priority routes to avoid conflict with frontend routing
  app.get("/api/dashboard/health", async (req: Request, res: Response) => {
    try {
      // Import dinâmico para evitar problemas de cache
      const { default: dashboardController } = await import('./controllers/dashboardController.js');
      return dashboardController.healthCheck(req, res);
    } catch (error) {
      console.error('Erro ao carregar dashboard controller:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get("/api/dashboard/stats", authenticate, async (req: Request, res: Response) => {
    try {
      const { default: dashboardController } = await import('./controllers/dashboardController.js');
      return dashboardController.obterEstatisticas(req as any, res);
    } catch (error) {
      console.error('Erro ao carregar dashboard controller:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get("/api/dashboard/recents", authenticate, async (req: Request, res: Response) => {
    try {
      const { default: dashboardController } = await import('./controllers/dashboardController.js');
      return dashboardController.obterDadosRecentes(req as any, res);
    } catch (error) {
      console.error('Erro ao carregar dashboard controller:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get("/api/dashboard/charts", authenticate, async (req: Request, res: Response) => {
    try {
      const { default: dashboardController } = await import('./controllers/dashboardController.js');
      return dashboardController.obterDadosGraficos(req as any, res);
    } catch (error) {
      console.error('Erro ao carregar dashboard controller:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get("/api/dashboard/activity", authenticate, async (req: Request, res: Response) => {
    try {
      const { default: dashboardController } = await import('./controllers/dashboardController.js');
      return dashboardController.obterResumoAtividade(req as any, res);
    } catch (error) {
      console.error('Erro ao carregar dashboard controller:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas de Empresas - Admin apenas (implementadas via registerAdminEndpoints)
  // app.get("/api/empresas") - movido para server/routes/admin-endpoints.ts

  // app.post("/api/empresas") - movido para server/routes/admin-endpoints.ts

  // app.get("/api/empresas/:id") - movido para server/routes/admin-endpoints.ts

  // Rotas de Contratos - Admin apenas (implementadas via registerAdminEndpoints)
  // app.get("/api/contratos") - movido para server/routes/admin-endpoints.ts

  // app.post("/api/contratos") - movido para server/routes/admin-endpoints.ts

  // app.get("/api/contratos/:id") - movido para server/routes/admin-endpoints.ts

  // API para obter configuração do Cognito das secrets
  app.get("/api/auth/cognito-config", (req: Request, res: Response) => {
    try {
      const cognitoConfig = {
        domain: process.env.COGNITO_DOMAIN,
        clientId: process.env.COGNITO_CLIENT_ID,
        redirectUri: process.env.COGNITO_REDIRECT_URI,
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        region: process.env.COGNITO_REGION || process.env.AWS_REGION
      };

      // Verificar se todas as configs necessárias estão disponíveis
      const missingConfigs = Object.entries(cognitoConfig)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingConfigs.length > 0) {
        return res.status(500).json({
          error: "Configuração Cognito incompleta",
          missing: missingConfigs
        });
      }

      res.json({
        success: true,
        loginUrl: `${cognitoConfig.domain}/login?response_type=code&client_id=${cognitoConfig.clientId}&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri!)}&scope=openid%20email%20profile`,
        config: {
          domain: cognitoConfig.domain,
          clientId: cognitoConfig.clientId,
          redirectUri: cognitoConfig.redirectUri
        }
      });
    } catch (error) {
      console.error("Erro ao obter configuração Cognito:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Não foi possível obter configuração do Cognito"
      });
    }
  });

  // Register specialized route modules
  adminRoutes.registerAdminRoutes(app);
  registerMunicipalRoutes(app);
  registerSchoolsMunicipalRoutes(app);
  registerPerformanceRoutes(app);
  registerSchoolRoutes(app);
  registerTokenRoutes(app);

  // Mount other routers
  app.use("/api/ai", aiRouter);
  app.use("/api/translate", translateRoutes);
  app.use("/api/token", tokenRouter);
  app.use("/cognito-ui", cognitoUIRouter);

  // Basic auth routes - placeholders (will be implemented with new schema)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // TODO: Implement with new user schema
      return res.status(400).json({ 
        message: "Authentication system will be reimplemented with new database structure" 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticate, (req: Request, res: Response) => {
    res.json({ 
      user: req.user,
      authenticated: true,
      timestamp: new Date().toISOString()
    });
  });

  // Rotas de usuários
  app.get("/api/usuarios", authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      // Simular busca de usuários (placeholder até nova estrutura)
      const query = `
        SELECT id, email, tipo_usuario, empresa_id, nome, criado_em
        FROM usuarios 
        WHERE ($1::text IS NULL OR empresa_id = $1::int)
        ORDER BY nome
        LIMIT 50
      `;
      
      const empresaFilter = req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id;
      const result = await db.execute(sql.raw(query, [empresaFilter]));
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        user_type: req.user.tipo_usuario
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar usuários",
        error: error.message 
      });
    }
  });

  app.get("/api/usuarios/me", authenticate, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        tipo_usuario: req.user.tipo_usuario,
        empresa_id: req.user.empresa_id,
        escola_id: req.user.escola_id
      },
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/usuarios", authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      const { nome, email, tipo_usuario } = req.body;
      
      // Validação básica
      if (!nome || !email || !tipo_usuario) {
        return res.status(400).json({
          success: false,
          message: "Campos obrigatórios: nome, email, tipo_usuario"
        });
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email inválido"
        });
      }
      
      // Validar tipo de usuário
      const tiposValidos = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
      if (!tiposValidos.includes(tipo_usuario)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de usuário inválido",
          tipos_validos: tiposValidos
        });
      }
      
      res.json({
        success: true,
        message: "Usuário criado com sucesso (placeholder)",
        data: { id: Date.now(), nome, email, tipo_usuario }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao criar usuário",
        error: error.message 
      });
    }
  });

  // Rotas de alunos
  app.get("/api/alunos", authenticate, async (req: Request, res: Response) => {
    try {
      // Controle de acesso por tipo de usuário
      let empresaFilter = null;
      if (req.user.tipo_usuario !== 'admin') {
        empresaFilter = req.user.empresa_id;
      }
      
      const query = `
        SELECT a.id, a.nome, a.matricula, a.turma, a.serie, a.status,
               e.nome as escola_nome, emp.nome as empresa_nome
        FROM alunos a
        LEFT JOIN escolas e ON a.escola_id = e.id
        LEFT JOIN empresas emp ON a.empresa_id = emp.id
        WHERE ($1::text IS NULL OR a.empresa_id = $1::int)
        ORDER BY a.nome
        LIMIT 50
      `;
      
      const result = await db.execute(sql.raw(query, [empresaFilter]));
      
      res.json({
        success: true,
        data: result.rows,
        total: result.rows.length,
        filter_empresa: empresaFilter,
        user_type: req.user.tipo_usuario
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar alunos",
        error: error.message 
      });
    }
  });

  app.get("/api/alunos/stats", authenticate, async (req: Request, res: Response) => {
    try {
      let empresaFilter = null;
      if (req.user.tipo_usuario !== 'admin') {
        empresaFilter = req.user.empresa_id;
      }
      
      const query = `
        SELECT 
          count(*) as total_alunos,
          count(CASE WHEN status = 'ativo' THEN 1 END) as alunos_ativos,
          count(DISTINCT escola_id) as escolas_envolvidas
        FROM alunos
        WHERE ($1::text IS NULL OR empresa_id = $1::int)
      `;
      
      const result = await db.execute(sql.raw(query, [empresaFilter]));
      
      res.json({
        success: true,
        data: result.rows[0],
        user_type: req.user.tipo_usuario,
        empresa_filtro: empresaFilter
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar estatísticas",
        error: error.message 
      });
    }
  });



  // WebSocket setup
  const wss = new WebSocketServer({ server: server, path: '/ws' });

  interface ExtendedWebSocket extends WebSocket {
    userId?: string;
  }

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('Nova conexão WebSocket estabelecida');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Mensagem recebida via WebSocket:', data);
        
        if (data.type === 'auth') {
          ws.userId = data.userId;
          console.log(`Cliente autenticado: ${ws.userId}`);
        }
        
        if (data.type === 'token_alert') {
          console.log('Alerta de token recebido:', data);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    });

    ws.on('close', () => {
      console.log('Conexão WebSocket fechada');
    });
  });

  // Redirect route for login - busca configuração das secrets
  app.get("/start-login", async (req: Request, res: Response) => {
    try {
      console.log("🔄 Redirecionamento /start-login -> AWS Cognito (via secrets)");
      
      // Buscar configuração das secrets
      const cognitoConfig = {
        domain: process.env.COGNITO_DOMAIN,
        clientId: process.env.COGNITO_CLIENT_ID,
        redirectUri: process.env.COGNITO_REDIRECT_URI
      };

      if (!cognitoConfig.domain || !cognitoConfig.clientId || !cognitoConfig.redirectUri) {
        console.error("❌ Configuração Cognito incompleta nas secrets");
        return res.redirect("/auth?error=cognito_config_missing");
      }

      const cognitoUrl = `${cognitoConfig.domain}/login?response_type=code&client_id=${cognitoConfig.clientId}&redirect_uri=${encodeURIComponent(cognitoConfig.redirectUri)}&scope=openid%20email%20profile`;
      
      console.log("✅ URL gerada das secrets:", cognitoUrl);
      res.redirect(cognitoUrl);
    } catch (error) {
      console.error("❌ Erro ao gerar URL Cognito:", error);
      res.redirect("/auth?error=cognito_error");
    }
  });

  // Callback route for AWS Cognito - suporte a ambos os endpoints
  app.get("/callback", async (req: Request, res: Response) => {
    await processAuthCallback(req, res);
  });

  app.get("/auth/callback", async (req: Request, res: Response) => {
    await processAuthCallback(req, res);
  });

  async function processAuthCallback(req: Request, res: Response) {
    console.log("🔄 Callback do AWS Cognito recebido");
    
    const { code, error } = req.query;
    
    if (error) {
      console.error("❌ Erro na autenticação Cognito:", error);
      return res.redirect("/auth?error=cognito_error");
    }
    
    if (!code) {
      console.error("❌ Código de autorização não fornecido");
      return res.redirect("/auth?error=no_code");
    }
    
    try {
      console.log("✅ Código de autorização recebido:", code);
      
      // Configuração do Cognito das secrets
      const cognitoConfig = {
        domain: process.env.COGNITO_DOMAIN,
        clientId: process.env.COGNITO_CLIENT_ID,
        clientSecret: process.env.COGNITO_CLIENT_SECRET,
        redirectUri: process.env.COGNITO_REDIRECT_URI
      };

      // Trocar código por tokens
      const tokenResponse = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: cognitoConfig.clientId!,
          client_secret: cognitoConfig.clientSecret!,
          redirect_uri: cognitoConfig.redirectUri!,
          code: code as string
        }).toString()
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.status}`);
      }

      const tokens = await tokenResponse.json();
      console.log("✅ Tokens obtidos com sucesso");

      // Decodificar ID token para obter informações do usuário
      const decoded = jwt.decode(tokens.id_token) as any;
      
      if (!decoded) {
        throw new Error('Token inválido');
      }

      console.log("👤 Informações do usuário:", {
        email: decoded.email,
        sub: decoded.sub,
        groups: decoded['cognito:groups']
      });

      const userGroups = decoded['cognito:groups'] || [];
      
      // Determinar tipo de usuário e redirecionar para dashboard/formulário correto
      let redirectPath = "/auth";
      let userType = "desconhecido";
      
      // Identificar tipo de usuário com base nos grupos Cognito
      if (userGroups.includes('Admin') || userGroups.includes('AdminMaster') || userGroups.includes('Administrador')) {
        userType = "admin";
        redirectPath = "/admin/user-management";
        console.log("🎯 Redirecionando ADMIN para:", redirectPath);
      } else if (userGroups.includes('Gestores') || userGroups.includes('GestorMunicipal')) {
        userType = "gestor";
        redirectPath = "/gestor/dashboard";
        console.log("🎯 Redirecionando GESTOR para:", redirectPath);
      } else if (userGroups.includes('Diretores') || userGroups.includes('Diretor')) {
        userType = "diretor";
        redirectPath = "/diretor/dashboard";
        console.log("🎯 Redirecionando DIRETOR para:", redirectPath);
      } else if (userGroups.includes('Professores') || userGroups.includes('Professor')) {
        userType = "professor";
        redirectPath = "/professor/dashboard";
        console.log("🎯 Redirecionando PROFESSOR para:", redirectPath);
      } else if (userGroups.includes('Alunos') || userGroups.includes('Aluno')) {
        userType = "aluno";
        redirectPath = "/aluno/dashboard";
        console.log("🎯 Redirecionando ALUNO para:", redirectPath);
      } else {
        console.log("⚠️ Tipo de usuário não identificado, grupos:", userGroups);
        redirectPath = "/auth?error=tipo_nao_identificado";
      }

      // Criar token JWT do sistema com informações do usuário
      const jwtPayload = {
        id: 1, // Por enquanto usamos ID fixo, depois será integrado com DB
        email: decoded.email,
        tipo_usuario: userType,
        empresa_id: 1, // Por enquanto fixo
        escola_id: null,
        cognito_sub: decoded.sub,
        groups: userGroups
      };

      const systemJwtToken = jwt.sign(
        jwtPayload,
        process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
        { expiresIn: '24h' }
      );

      console.log("🔐 Token JWT do sistema criado para:", decoded.email);

      // Armazenar informações do usuário na sessão (temporário para auth)
      const sessionData = {
        cognitoSub: decoded.sub,
        email: decoded.email,
        userType: userType,
        groups: userGroups,
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        systemJwtToken: systemJwtToken,
        loginTime: new Date().toISOString()
      };

      // Criar URL de redirecionamento com token JWT do sistema
      const redirectUrl = `${redirectPath}?auth=success&type=${userType}&email=${encodeURIComponent(decoded.email)}&token=${encodeURIComponent(systemJwtToken)}`;
      console.log("🔗 URL final de redirecionamento:", redirectUrl);

      // Redirecionar para o dashboard/formulário correto
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error("❌ Erro ao processar callback:", error);
      res.redirect("/auth?error=callback_error");
    }
  }



  // Placeholder routes that will be implemented with new database structure
  app.get("/api/placeholder", (req: Request, res: Response) => {
    res.json({ 
      message: "Database structure has been reset. Routes will be reimplemented with new hierarchical schema.",
      status: "ready_for_rebuild"
    });
  });

  // Registrar rotas administrativas AWS Cognito
  registerAdminCognitoRoutes(app);
  
  // Registrar endpoints administrativos para empresas e contratos
  registerAdminEndpoints(app);

  console.log("✅ All routes registered successfully (placeholder mode)");
  
  return server;
}
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import "./types/auth";
import { storage } from "./storage";
import { db } from "./db";
import { cognitoService } from "./utils/cognito-service";
import { awsIAMService } from "./services/aws-iam-service";
// Schema imports removidas - será reescrito com nova estrutura hierárquica
import { eq, sql, gte, desc, and, isNull, isNotNull, lte, or, inArray } from "drizzle-orm";
import { usuarios as users, alunos, empresas } from "../shared/schema";
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

import aiCentralRouter from "./routes/ai-central-routes";
import aiResourceConfigRouter from "./routes/ai-resource-config-routes";
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
import { registerAdminCRUDEndpoints } from "./routes/admin-crud";
import s3DocumentRoutes from "./routes/s3-documents";
// Import removido para implementação dinâmica

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

  // Token interceptor middleware temporarily disabled for debugging
  // app.use((req, res, next) => {
  //   // Skip token interceptor for auth routes
  //   if (req.path.startsWith('/api/auth/')) {
  //     return next();
  //   }
  //   tokenInterceptor(req, res, next).catch(next);
  // });
  
  // app.use((req, res, next) => {
  //   // Skip token alert middleware for auth routes
  //   if (req.path.startsWith('/api/auth/')) {
  //     return next();
  //   }
  //   tokenAlertMiddleware(req, res, next).catch(next);
  // });

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
        domain: process.env.AWS_COGNITO_DOMAIN,
        clientId: process.env.AWS_COGNITO_CLIENT_ID,
        redirectUri: process.env.AWS_COGNITO_REDIRECT_URI,
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
        region: process.env.AWS_REGION || 'us-east-1'
      };

      console.log('🔍 Configuração Cognito solicitada:');
      console.log('- User Pool ID:', cognitoConfig.userPoolId);
      console.log('- Client ID:', cognitoConfig.clientId);
      console.log('- Domain:', cognitoConfig.domain);
      console.log('- Region:', cognitoConfig.region);

      // Verificar se todas as configs necessárias estão disponíveis
      const missingConfigs = Object.entries(cognitoConfig)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingConfigs.length > 0) {
        console.error('❌ Configuração Cognito incompleta:', missingConfigs);
        return res.status(500).json({
          error: "Configuração Cognito incompleta",
          missing: missingConfigs
        });
      }

      res.json({
        success: true,
        userPoolId: cognitoConfig.userPoolId,
        clientId: cognitoConfig.clientId,
        region: cognitoConfig.region,
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

  // API para obter client secret (para SECRET_HASH)
  app.get("/api/auth/client-secret", (req: Request, res: Response) => {
    try {
      const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET;
      
      if (!clientSecret) {
        return res.status(500).json({
          error: "Client secret não configurado"
        });
      }

      res.json({
        success: true,
        clientSecret: clientSecret
      });
    } catch (error) {
      console.error("Erro ao obter client secret:", error);
      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Não foi possível obter client secret"
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

  app.use("/api/ai-central", aiCentralRouter);
  app.use("/api/ai-resource-configs", aiResourceConfigRouter);
  app.use("/api/translate", translateRoutes);
  app.use("/api/token", tokenRouter);
  app.use("/cognito-ui", cognitoUIRouter);
  
  // Importar e montar rotas S3+Bedrock
  const s3BedrockRoutes = await import("./routes/s3-bedrock-routes.js");
  app.use("/api/s3-bedrock", s3BedrockRoutes.default);

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

  // Endpoint para criar token JWT interno do sistema
  app.post("/api/auth/create-internal-token", async (req: Request, res: Response) => {
    try {
      const { id, email, name, tipo_usuario, empresa_id, escola_id, cognito_sub, groups } = req.body;
      
      console.log('🔐 Criando token interno para:', email, 'tipo:', tipo_usuario);
      
      // Validação básica
      if (!email || !cognito_sub) {
        return res.status(400).json({
          success: false,
          error: 'Email e cognito_sub são obrigatórios'
        });
      }

      // Criar payload do token
      const tokenPayload = {
        id: id || 1,
        email,
        name: name || email,
        tipo_usuario: tipo_usuario || 'user',
        empresa_id: empresa_id || 1,
        escola_id: escola_id || null,
        cognito_sub,
        groups: groups || []
      };

      // Usar o mesmo secret do sistema
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';
      
      const token = jwt.sign(tokenPayload, secret, { 
        expiresIn: '24h',
        issuer: 'iaprender'
      });

      console.log('✅ Token interno criado com sucesso');

      res.json({
        success: true,
        token,
        user: tokenPayload
      });

    } catch (error) {
      console.error('❌ Erro ao criar token interno:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Rotas de usuários
  app.get("/api/usuarios", authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
    try {
      console.log(`👥 Buscando usuários - Tipo: ${req.user.tipo_usuario}, Empresa: ${req.user.empresa_id}`);
      
      // Para admin: buscar todos os usuários
      // Para gestor: buscar apenas da própria empresa
      let usuarios;
      
      if (req.user.tipo_usuario === 'admin') {
        usuarios = await db.select({
          id: users.id,
          email: users.email,
          nome: users.nome,
          tipoUsuario: users.tipoUsuario,
          empresaId: users.empresaId,
          criadoEm: users.criadoEm
        }).from(users).orderBy(users.nome).limit(50);
      } else {
        usuarios = await db.select({
          id: users.id,
          email: users.email,
          nome: users.nome,
          tipoUsuario: users.tipoUsuario,
          empresaId: users.empresaId,
          criadoEm: users.criadoEm
        }).from(users)
        .where(eq(users.empresaId, req.user.empresa_id))
        .orderBy(users.nome)
        .limit(50);
      }
      
      console.log(`✅ Encontrados ${usuarios.length} usuários`);
      
      res.json({
        success: true,
        data: usuarios,
        total: usuarios.length,
        user_type: req.user.tipo_usuario
      });
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar usuários",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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
      console.log(`🎓 Buscando alunos - Tipo: ${req.user.tipo_usuario}, Empresa: ${req.user.empresa_id}`);
      
      // Para admin: buscar todos os alunos
      // Para outros: buscar apenas da própria empresa
      let alunosData;
      
      if (req.user.tipo_usuario === 'admin') {
        alunosData = await db.select({
          id: alunos.id,
          nome: alunos.nome,
          matricula: alunos.matricula,
          turma: alunos.turma,
          serie: alunos.serie,
          status: alunos.status,
          empresa_id: alunos.empresa_id,
          escola_id: alunos.escola_id
        }).from(alunos).orderBy(alunos.nome).limit(50);
      } else {
        alunosData = await db.select({
          id: alunos.id,
          nome: alunos.nome,
          matricula: alunos.matricula,
          turma: alunos.turma,
          serie: alunos.serie,
          status: alunos.status,
          empresa_id: alunos.empresa_id,
          escola_id: alunos.escola_id
        }).from(alunos)
        .where(eq(alunos.empresa_id, req.user.empresa_id))
        .orderBy(alunos.nome)
        .limit(50);
      }
      
      console.log(`✅ Encontrados ${alunosData.length} alunos`);
      
      res.json({
        success: true,
        data: alunosData,
        total: alunosData.length,
        filter_empresa: req.user.tipo_usuario === 'admin' ? null : req.user.empresa_id,
        user_type: req.user.tipo_usuario
      });
    } catch (error) {
      console.error('❌ Erro ao buscar alunos:', error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar alunos",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
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

  // Redirect route for login - usa redirecionamento invisível
  app.get("/start-login", async (req: Request, res: Response) => {
    try {
      console.log("🔄 Redirecionamento /start-login -> página invisível");
      // Usar o redirecionamento invisível para não expor o domínio do Cognito
      res.redirect("/api/auth/invisible-redirect");
    } catch (error) {
      console.error("❌ Erro ao redirecionar:", error);
      res.redirect("/auth?error=redirect_error");
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
        redirectPath = "/admin/crud";
        console.log("🎯 Redirecionando ADMIN para:", redirectPath);
      } else if (userGroups.includes('Gestores') || userGroups.includes('GestorMunicipal')) {
        userType = "gestor";
        redirectPath = "/gestor/crud";
        console.log("🎯 Redirecionando GESTOR para:", redirectPath);
      } else if (userGroups.includes('Diretores') || userGroups.includes('Diretor')) {
        userType = "diretor";
        redirectPath = "/diretor/crud";
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

      // Retornar HTML que detecta iframe e comunica com parent
      const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Autenticação Concluída</title>
          <style>
            body {
              margin: 0;
              padding: 2rem;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .spinner {
              border: 3px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top: 3px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Autenticação Concluída</h1>
            <p>Redirecionando para o dashboard...</p>
          </div>
          <script>
            console.log('Callback processado - verificando contexto');
            
            // Verificar se está em iframe
            if (window.parent !== window) {
              console.log('Detectado iframe - enviando mensagem para parent');
              
              // Enviar mensagem para parent window
              window.parent.postMessage({
                type: 'AUTH_SUCCESS',
                redirect: '${redirectUrl}',
                userType: '${userType}',
                email: '${decoded.email}'
              }, '*');
            } else {
              console.log('Não está em iframe - redirecionando diretamente');
              
              // Redirecionar diretamente se não estiver em iframe
              window.location.href = '${redirectUrl}';
            }
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      
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
  
  // Registrar endpoints CRUD administrativos
  registerAdminCRUDEndpoints(app);
  
  // Registrar endpoints CRUD de gestores
  const gestorCrudRoutes = await import('./routes/gestor-crud.js');
  app.use('/api/gestor', gestorCrudRoutes.default);
  
  // Registrar endpoints CRUD de diretores
  const diretorCrudRoutes = await import('./routes/diretor-crud.js');
  app.use('/api/diretor', diretorCrudRoutes.default);
  
  // Registrar rotas de status de credenciais
  const secretsStatusRoutes = await import('./routes/secrets-status');
  app.use('/api/secrets', secretsStatusRoutes.default);
  
  // Rotas de sincronização AWS Cognito removidas - apenas autenticação oficial
  
  // Registrar rotas de autenticação unificadas
  const { registerAuthRoutes } = await import('./routes/auth-routes.js');
  registerAuthRoutes(app);

  // Registrar rotas de arquivos S3
  app.use('/api/s3-documents', s3DocumentRoutes);

  // Rotas da API hierárquica removidas temporariamente (dependência do CognitoSyncService removida)

  console.log("✅ All routes registered successfully (placeholder mode)");
  
  return server;
}
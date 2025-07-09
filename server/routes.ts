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
  // Rate limiting configurations
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: { message: "Too many authentication attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 API requests per minute
    message: { message: "API rate limit exceeded, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting
  app.use(generalLimiter);

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
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
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
  app.get("/api/usuarios", apiLimiter, authenticate, requireAdminOrGestor, async (req: Request, res: Response) => {
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
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

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

  // Placeholder routes that will be implemented with new database structure
  app.get("/api/placeholder", (req: Request, res: Response) => {
    res.json({ 
      message: "Database structure has been reset. Routes will be reimplemented with new hierarchical schema.",
      status: "ready_for_rebuild"
    });
  });

  console.log("✅ All routes registered successfully (placeholder mode)");
  
  return httpServer;
}
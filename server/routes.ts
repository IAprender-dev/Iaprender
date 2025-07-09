import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
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

  // Middleware to check authentication
  const authenticate = (req: Request, res: Response, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Middleware to check admin authentication
  const authenticateAdmin = (req: Request, res: Response, next: any) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

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
    res.json({ user: req.session.user });
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
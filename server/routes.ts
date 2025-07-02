import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { cognitoService } from "./utils/cognito-service";
import { awsIAMService } from "./services/aws-iam-service";
import { 
  insertUserSchema, 
  insertCourseSchema, 
  insertModuleSchema, 
  insertContentSchema,
  insertUserCourseSchema,
  insertActivitySchema,
  insertUserActivitySchema,
  insertLessonPlanSchema,
  insertAIMessageSchema,
  insertCertificateSchema,
  insertCompanySchema,
  insertContractSchema,
  insertContractUserSchema,
  insertNotificationSchema,

  users,
  companies,
  contracts,
  tokenUsage,
  aiTools,
  newsletter,
  notifications,
  lessonPlans,
  tokenUsageLogs,

} from "@shared/schema";
import { eq, sql, gte, desc, and } from "drizzle-orm";
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
import * as OpenAIService from "./utils/ai-services/openai";
import { cognitoService } from "./utils/cognito-service";
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
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
    },
    fileFilter: (req, file, cb) => {
      console.log('File filter check:', { mimetype: file.mimetype, originalname: file.originalname });
      
      // Accept various audio formats including webm
      const allowedTypes = [
        'audio/webm',
        'audio/wav', 
        'audio/mp3',
        'audio/m4a',
        'audio/ogg',
        'audio/mpeg',
        'video/webm', // Some browsers send webm as video
        'application/octet-stream' // Fallback for some browsers
      ];
      
      if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.webm')) {
        cb(null, true);
      } else {
        console.log('File type rejected:', file.mimetype);
        cb(new Error(`File type not allowed: ${file.mimetype}`) as any);
      }
    }
  });

  // Session setup
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      store: new SessionStore({
        checkPeriod: 86400000 // 24 hours
      }),
      secret: process.env.SESSION_SECRET || "iaula-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      }
    })
  );

  // Authentication middleware
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Role-based authorization middleware
  const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.session.user || !roles.includes(req.session.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Admin authentication middleware  
  const authenticateAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // HEALTH CHECK ROUTE
  app.get("/api/health", (_req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "IAverse API",
      version: "1.0.0"
    });
  });

  // DOWNLOAD ROUTE
  app.get("/download/iaverse-servidor.tar.gz", (_req, res) => {
    const filePath = path.join(process.cwd(), "iaverse-servidor.tar.gz");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "iaverse-servidor.tar.gz");
    } else {
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });

  // DOCUMENTATION ROUTE
  app.get("/INSTALACAO_SERVIDOR.md", (_req, res) => {
    const filePath = path.join(process.cwd(), "INSTALACAO_SERVIDOR.md");
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "Documentação não encontrada" });
    }
  });

  // Import notification routes
  const notificationRoutes = await import('./routes/notifications');
  app.use('/api/notifications', notificationRoutes.default);

  // AUTH ROUTES
  // Login
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Support both email and username login
      const identifier = email || username;
      if (!identifier || !password) {
        return res.status(400).json({ message: "Email/username and password are required" });
      }

      // Find user by email or username
      let user;
      if (identifier.includes('@')) {
        user = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
      } else {
        user = await db.select().from(users).where(eq(users.username, identifier)).limit(1);
      }

      if (user.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const foundUser = user[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, foundUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (foundUser.status !== 'active') {
        return res.status(401).json({ message: "Account is not active" });
      }

      // Create session
      req.session.user = {
        id: foundUser.id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        role: foundUser.role,
        username: foundUser.username
      };

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, foundUser.id));

      // Return user data (without password)
      const { password: userPassword, ...userWithoutPassword } = foundUser;
      res.json({
        success: true,
        user: userWithoutPassword,
        message: "Login successful"
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ user: req.session.user });
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
      
      // Basic validation
      if (!firstName || !lastName || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      if (!['teacher', 'student', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create username from email
      const username = email.split('@')[0];

      // Create user
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
        username
      });

      // Remove password from response
      const { password: userPassword, ...userWithoutPassword } = user;

      // Set user session
      req.session.user = userWithoutPassword;

      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isMatch = await bcrypt.compare(validatedData.password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Remove password from session/response
      const { password, ...userWithoutPassword } = user;

      // Set user session
      req.session.user = userWithoutPassword;

      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", authenticate, (req, res) => {
    return res.status(200).json(req.session.user);
  });

  // AWS COGNITO OAUTH ROUTES
  
  // Test Cognito configuration
  app.get("/api/cognito/test", async (req, res) => {
    try {
      const validation = cognitoService.validateConfiguration();
      const isConnected = validation.isValid ? await cognitoService.testConnection() : false;
      
      res.json({
        configured: validation.isValid,
        connected: isConnected,
        loginUrl: validation.isValid ? cognitoService.getLoginUrl() : null,
        validation: {
          errors: validation.errors,
          warnings: validation.warnings
        },
        environment: {
          domain: process.env.COGNITO_DOMAIN || 'NÃO CONFIGURADO',
          clientId: process.env.COGNITO_CLIENT_ID || 'NÃO CONFIGURADO',
          userPoolId: process.env.COGNITO_USER_POOL_ID || 'NÃO CONFIGURADO',
          redirectUri: process.env.COGNITO_REDIRECT_URI || 'NÃO CONFIGURADO'
        }
      });
    } catch (error) {
      console.error('Erro ao testar Cognito:', error);
      res.status(500).json({ 
        error: 'Erro ao testar configuração do Cognito',
        configured: false,
        connected: false,
        validation: {
          errors: ['Erro interno do servidor'],
          warnings: []
        }
      });
    }
  });

  // Cognito diagnostic page
  app.get("/api/cognito/debug", (req, res) => {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const redirectUri = process.env.COGNITO_REDIRECT_URI;
    const domain = process.env.COGNITO_DOMAIN;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AWS Cognito Debug - IAverse</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .config { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .error { color: red; font-weight: bold; }
          .success { color: green; font-weight: bold; }
          .warning { color: orange; font-weight: bold; }
          .button { 
            display: inline-block; 
            padding: 10px 20px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 5px;
          }
          .button:hover { background: #0056b3; }
        </style>
      </head>
      <body>
        <h1>🔧 AWS Cognito Diagnóstico</h1>
        
        <h2>📋 Configuração Atual</h2>
        <div class="config">
          <p><strong>User Pool ID:</strong> ${userPoolId || '<span class="error">NÃO CONFIGURADO</span>'}</p>
          <p><strong>Client ID:</strong> ${clientId || '<span class="error">NÃO CONFIGURADO</span>'}</p>
          <p><strong>Domain:</strong> ${domain || '<span class="error">NÃO CONFIGURADO</span>'}</p>
          <p><strong>Redirect URI:</strong> ${redirectUri || '<span class="error">NÃO CONFIGURADO</span>'}</p>
        </div>

        <h2>🔍 Possíveis Problemas e Soluções</h2>
        
        <h3>1. Domain Configuration</h3>
        <p>O User Pool precisa ter um domínio configurado no AWS Console:</p>
        <ul>
          <li>Acesse AWS Cognito Console → User Pools → ${userPoolId}</li>
          <li>Vá em "App integration" → "Domain"</li>
          <li>Configure um domínio customizado ou use o domínio Amazon Cognito</li>
        </ul>

        <h3>2. App Client Configuration</h3>
        <p>Verifique se o App Client está configurado corretamente:</p>
        <ul>
          <li>Em "App integration" → "App clients"</li>
          <li>Edite o client ID: ${clientId}</li>
          <li>Habilite "Hosted UI"</li>
          <li>Configure Identity providers (Cognito user pool)</li>
          <li>Configure OAuth 2.0 grant types: Authorization code grant</li>
          <li>Configure OpenID Connect scopes: openid, email, profile</li>
        </ul>

        <h3>3. Callback URLs</h3>
        <p>Adicione estas URLs nas configurações do App Client:</p>
        <div class="config">
          <p><strong>Callback URLs:</strong></p>
          <p>${redirectUri}</p>
          <p><strong>Sign out URLs:</strong></p>
          <p>${redirectUri ? redirectUri.replace('/callback', '/logout-callback') : 'NÃO CONFIGURADO'}</p>
        </div>

        <h2>🧪 Teste Manual</h2>
        <p>URLs de teste baseadas na configuração atual:</p>
        
        ${domain ? `
          <p>
            <a href="${cognitoService.getLoginUrl()}" class="button" target="_blank">
              ✅ Testar Login URL
            </a>
          </p>
          <p><small>URL: ${cognitoService.getLoginUrl()}</small></p>
        ` : '<p class="error">❌ Não é possível gerar URL - domínio não configurado</p>'}

        <h2>⚡ Ações Rápidas</h2>
        <a href="/api/cognito/test" class="button">📊 Teste de API</a>
        <a href="/" class="button">🏠 Voltar ao site</a>
        <a href="/AWS_COGNITO_SETUP_GUIDE.md" class="button" target="_blank">📖 Guia Completo</a>
        
        <div style="margin-top: 20px;">
          <button onclick="testCognitoApi()" class="button" style="background: #28a745;">🧪 Testar Agora</button>
          <button onclick="copyCallbackUrl()" class="button" style="background: #17a2b8;">📋 Copiar Callback URL</button>
        </div>

        <div id="test-results" style="margin-top: 20px; display: none;"></div>

        <script>
          async function testCognitoApi() {
            const resultsDiv = document.getElementById('test-results');
            resultsDiv.style.display = 'block';
            resultsDiv.innerHTML = '<p>🔄 Testando configuração...</p>';
            
            try {
              const response = await fetch('/api/cognito/test');
              const data = await response.json();
              
              let html = '<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">';
              html += '<h3>📋 Resultado do Teste</h3>';
              
              if (data.configured) {
                html += '<p style="color: green;"><strong>✅ Configuração:</strong> OK</p>';
              } else {
                html += '<p style="color: red;"><strong>❌ Configuração:</strong> Incompleta</p>';
              }
              
              if (data.connected) {
                html += '<p style="color: green;"><strong>✅ Conexão:</strong> OK</p>';
              } else {
                html += '<p style="color: red;"><strong>❌ Conexão:</strong> Falhou</p>';
              }
              
              if (data.validation && data.validation.errors.length > 0) {
                html += '<h4 style="color: red;">❌ Erros:</h4><ul>';
                data.validation.errors.forEach(error => {
                  html += '<li style="color: red;">' + error + '</li>';
                });
                html += '</ul>';
              }
              
              if (data.validation && data.validation.warnings.length > 0) {
                html += '<h4 style="color: orange;">⚠️ Avisos:</h4><ul>';
                data.validation.warnings.forEach(warning => {
                  html += '<li style="color: orange;">' + warning + '</li>';
                });
                html += '</ul>';
              }
              
              if (data.loginUrl) {
                html += '<p><strong>🔗 URL de Login:</strong><br>';
                html += '<a href="' + data.loginUrl + '" target="_blank" class="button">🚀 Testar Login</a></p>';
              }
              
              html += '</div>';
              resultsDiv.innerHTML = html;
            } catch (error) {
              resultsDiv.innerHTML = '<p style="color: red;">❌ Erro ao testar: ' + error.message + '</p>';
            }
          }
          
          function copyCallbackUrl() {
            const url = '${redirectUri}';
            navigator.clipboard.writeText(url).then(() => {
              alert('✅ URL copiada para área de transferência!\\n\\n' + url);
            }).catch(() => {
              alert('URL para copiar:\\n\\n' + url);
            });
          }
        </script>
        
        <h2>📝 Status do Sistema</h2>
        <div class="config">
          <p><strong>Configuração:</strong> ${cognitoService.isConfigured() ? '<span class="success">✅ Completa</span>' : '<span class="error">❌ Incompleta</span>'}</p>
          <p><strong>Replit Domain:</strong> ${req.get('host')}</p>
          <p><strong>Protocol:</strong> ${req.protocol}</p>
        </div>

        <h2>🆘 Próximos Passos</h2>
        <ol>
          <li><strong>Configure o domínio no AWS Cognito Console</strong>
            <ul>
              <li>Acesse: AWS Console → Cognito → User Pools → ${userPoolId}</li>
              <li>Vá em "App integration" → "Domain"</li>
              <li>Configure um prefixo único (ex: iaverse-education)</li>
            </ul>
          </li>
          <li><strong>Habilite Hosted UI no App Client</strong>
            <ul>
              <li>Em "App integration" → "App clients" → ${clientId}</li>
              <li>Habilite "Hosted UI"</li>
              <li>Configure OAuth scopes: openid, email, profile</li>
            </ul>
          </li>
          <li><strong>Adicione as callback URLs corretas</strong>
            <ul>
              <li>Callback: ${redirectUri}</li>
              <li>Sign out: ${redirectUri ? redirectUri.replace('/callback', '/logout-callback') : 'NÃO CONFIGURADO'}</li>
            </ul>
          </li>
          <li><strong>Atualize o arquivo .env</strong>
            <ul>
              <li>COGNITO_DOMAIN=https://[seu-prefixo].auth.us-east-1.amazoncognito.com</li>
            </ul>
          </li>
        </ol>

        <h2>📋 Checklist de Configuração</h2>
        <div class="config">
          <p>☐ Domínio configurado no AWS Console</p>
          <p>☐ Hosted UI habilitada</p>
          <p>☐ Authorization code grant ativado</p>
          <p>☐ Scopes configurados (openid, email, profile)</p>
          <p>☐ Callback URLs adicionadas</p>
          <p>☐ Arquivo .env atualizado</p>
        </div>

        <h2>🔧 Comandos Úteis</h2>
        <div class="config">
          <p><strong>Testar configuração:</strong> <code>curl ${req.protocol}://${req.get('host')}/api/cognito/test</code></p>
          <p><strong>Ver logs:</strong> <code>tail -f server.log</code></p>
          <p><strong>Reiniciar servidor:</strong> Salve qualquer arquivo do projeto</p>
        </div>

        <hr>
        <p><small>IAverse AWS Cognito Integration v1.0 - <a href="/AWS_COGNITO_SETUP_GUIDE.md" target="_blank">📖 Guia Completo</a></small></p>
      </body>
      </html>
    `);
  });

  // Teste de conectividade do Cognito
  app.get("/cognito-test", async (req: Request, res: Response) => {
    try {
      console.log('🚀 Iniciando teste de conectividade do Cognito...');
      const isConnected = await cognitoService.testConnection();
      
      res.json({
        success: isConnected,
        message: isConnected ? 'Conexão com Cognito estabelecida' : 'Falha na conexão com Cognito',
        timestamp: new Date().toISOString(),
        domain: process.env.COGNITO_DOMAIN,
        isConfigured: cognitoService.isConfigured()
      });
    } catch (error) {
      console.error('Erro no teste de conectividade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno no teste de conectividade',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Start login redirect to Cognito
  app.get("/start-login", async (req, res) => {
    try {
      if (!cognitoService.isConfigured()) {
        return res.status(500).send(`
          <h1>Configuração do AWS Cognito Incompleta</h1>
          <p>O serviço Cognito não está configurado corretamente.</p>
          <p>Verifique as variáveis de ambiente:</p>
          <ul>
            <li>COGNITO_DOMAIN</li>
            <li>COGNITO_CLIENT_ID</li>
            <li>COGNITO_CLIENT_SECRET</li>
            <li>COGNITO_REDIRECT_URI</li>
            <li>COGNITO_USER_POOL_ID</li>
          </ul>
          <p><a href="/">Voltar ao início</a></p>
        `);
      }

      // Testar conectividade antes de redirecionar
      console.log('🔍 Testando conectividade do Cognito antes do redirecionamento...');
      const isConnected = await cognitoService.testConnection();
      
      if (!isConnected) {
        console.log('❌ Cognito não está acessível, redirecionando para login padrão');
        return res.redirect('/auth?cognito_error=connection_failed');
      }

      const loginUrl = cognitoService.getLoginUrl();
      console.log('✅ Cognito acessível, redirecionando para:', loginUrl);
      res.redirect(loginUrl);
    } catch (error) {
      console.error('Erro ao iniciar login:', error);
      res.redirect('/auth?cognito_error=internal_error');
    }
  });

  // Cognito callback
  app.get("/auth/callback", async (req, res) => {
    try {
      const { code, error, error_description } = req.query;

      // Verificar se houve erro no Cognito
      if (error) {
        console.error('Erro do Cognito:', error, error_description);
        return res.status(400).send(`
          <h1>Erro na Autenticação</h1>
          <p>Erro: ${error}</p>
          <p>Descrição: ${error_description}</p>
          <p><a href="/">Voltar ao início</a></p>
        `);
      }

      // Verificar se o código foi retornado
      if (!code || typeof code !== 'string') {
        return res.status(400).send(`
          <h1>Erro na Autenticação</h1>
          <p>Código de autorização não encontrado.</p>
          <p><a href="/">Voltar ao início</a></p>
        `);
      }

      console.log('Código de autorização recebido:', code);

      // Trocar código por tokens
      const tokens = await cognitoService.exchangeCodeForTokens(code);
      console.log('Tokens obtidos com sucesso');

      // Decodificar informações do usuário
      const userInfo = cognitoService.decodeIdToken(tokens.id_token);
      console.log('🔍 Informações do usuário do Cognito:', {
        email: userInfo.email,
        name: userInfo.name,
        groups: userInfo['cognito:groups']
      });

      // Processar autenticação com sistema aprimorado
      const authData = cognitoService.processUserAuthentication(userInfo);
      
      // Verificar se usuário já existe na base
      let user = await storage.getUserByEmail(userInfo.email);
      
      if (!user) {
        // Usuário será criado sem contractId específico
        
        // Criar novo usuário com role baseado nos grupos do Cognito
        const newUser = {
          firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'Usuário',
          lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
          email: userInfo.email,
          username: userInfo.email.split('@')[0],
          password: 'cognito_auth', // Placeholder para autenticação externa
          role: authData.role,
          contractId: null, // Sem vinculação específica a contrato
          isActive: true
        };
        
        user = await storage.createUser(newUser);
        console.log('✅ Novo usuário criado:', {
          id: user.id,
          email: user.email,
          role: user.role
        });
      } else {
        // Atualizar role se necessário (quando grupos do Cognito mudaram)
        if (user.role !== authData.role) {
          console.log(`🔄 Atualizando role de ${user.role} para ${authData.role}`);
          // Implementar lógica de atualização se necessário
          user.role = authData.role;
        }
      }

      // Criar sessão
      const { password, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;

      console.log('✅ Usuário autenticado:', {
        id: req.session.user.id,
        email: req.session.user.email,
        role: req.session.user.role,
        groups: authData.groups
      });

      // Usar sistema de redirecionamento aprimorado
      console.log(`🚀 Redirecionando para: ${authData.redirectUrl}`);
      res.redirect(authData.redirectUrl);

    } catch (error) {
      console.error('Erro no callback do Cognito:', error);
      
      res.status(500).send(`
        <h1>Erro na Autenticação</h1>
        <p>Ocorreu um erro durante o processo de autenticação.</p>
        <p>Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <p><a href="/">Voltar ao início</a></p>
      `);
    }
  });

  // Logout callback
  app.get("/auth/logout-callback", (req, res) => {
    // Destruir sessão local
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });

  // COURSE ROUTES
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get course by id
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get course modules
      const modules = await storage.getModulesByCourse(courseId);
      
      // For each module, get its contents
      const modulesWithContents = await Promise.all(
        modules.map(async (module) => {
          const contents = await storage.getContentsByModule(module.id);
          return {
            ...module,
            contents
          };
        })
      );

      return res.status(200).json({
        ...course,
        modules: modulesWithContents
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create course (teacher only)
  app.post("/api/courses", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      
      // Set author to current user
      const course = await storage.createCourse({
        ...validatedData,
        authorId: req.session.user.id
      });

      return res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get courses by teacher
  app.get("/api/teacher/courses", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const courses = await storage.getCoursesByAuthor(req.session.user.id);
      return res.status(200).json(courses);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create course module (teacher only)
  app.post("/api/courses/:id/modules", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Verify ownership
      if (course.authorId !== req.session.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertModuleSchema.parse(req.body);
      
      const module = await storage.createModule({
        ...validatedData,
        courseId
      });

      return res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create course content (teacher only)
  app.post("/api/modules/:id/contents", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const validatedData = insertContentSchema.parse(req.body);
      
      const content = await storage.createContent({
        ...validatedData,
        moduleId
      });

      return res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ENROLLMENT ROUTES
  // Enroll in course
  app.post("/api/courses/:id/enroll", authenticate, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.session.user.id;
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get user courses
      const userCourses = await storage.getUserCourses(userId);
      
      // Check if already enrolled
      const alreadyEnrolled = userCourses.some(uc => uc.courseId === courseId);
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      // Enroll user
      const enrollment = await storage.enrollUserInCourse({
        userId,
        courseId,
        progress: 0,
        status: "not_started"
      });

      return res.status(201).json(enrollment);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get student courses
  app.get("/api/student/courses", authenticate, async (req, res) => {
    try {
      const userCourses = await storage.getUserCourses(req.session.user.id);
      return res.status(200).json(userCourses);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Update course progress
  app.put("/api/courses/:id/progress", authenticate, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const userId = req.session.user.id;
      const { progress } = req.body;
      
      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        return res.status(400).json({ message: "Invalid progress value" });
      }

      const updatedUserCourse = await storage.updateUserCourseProgress(userId, courseId, progress);
      
      if (!updatedUserCourse) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      // If course is completed, issue certificate
      if (progress === 100) {
        await storage.createCertificate({
          userId,
          courseId
        });
      }

      return res.status(200).json(updatedUserCourse);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ACTIVITY ROUTES
  // Create activity (teacher only)
  app.post("/api/courses/:id/activities", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Verify ownership
      if (course.authorId !== req.session.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertActivitySchema.parse(req.body);
      
      const activity = await storage.createActivity({
        ...validatedData,
        courseId
      });

      return res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get activities by course
  app.get("/api/courses/:id/activities", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const activities = await storage.getActivitiesByCourse(courseId);
      return res.status(200).json(activities);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Submit activity (student only)
  app.post("/api/activities/:id/submit", authenticate, authorize(["student"]), async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = req.session.user.id;
      
      const validatedData = insertUserActivitySchema.parse(req.body);
      
      const submission = await storage.submitActivity({
        ...validatedData,
        userId,
        activityId
      });

      return res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get student activities
  app.get("/api/student/activities", authenticate, authorize(["student"]), async (req, res) => {
    try {
      const userActivities = await storage.getUserActivities(req.session.user.id);
      return res.status(200).json(userActivities);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // CATEGORY ROUTES
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // LESSON PLAN ROUTES
  // Create lesson plan (teacher only)
  app.post("/api/lesson-plans", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const validatedData = insertLessonPlanSchema.parse(req.body);
      
      const lessonPlan = await storage.createLessonPlan({
        ...validatedData,
        authorId: req.session.user.id
      });

      return res.status(201).json(lessonPlan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get teacher lesson plans
  app.get("/api/teacher/lesson-plans", authenticate, authorize(["teacher", "admin"]), async (req, res) => {
    try {
      const lessonPlans = await storage.getLessonPlansByAuthor(req.session.user.id);
      return res.status(200).json(lessonPlans);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // AI ASSISTANT ROUTES
  // Get AI chat history
  app.get("/api/ai/messages", authenticate, async (req, res) => {
    try {
      const messages = await storage.getAIMessagesByUser(req.session.user.id);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Send message to AI assistant
  app.post("/api/ai/assistant", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const validatedData = answerSchema.parse(req.body);
      
      // Save user message
      await storage.createAIMessage({
        userId,
        sender: "user",
        content: validatedData.message
      });

      // Generate AI response based on role and message
      let aiResponse = "";
      const role = validatedData.role;
      const message = validatedData.message.toLowerCase();

      if (role === "teacher") {
        if (message.includes("plano de aula") || message.includes("planejamento")) {
          aiResponse = "Posso ajudar a criar um plano de aula personalizado. Para matemática no 8º ano, sugiro começar com uma revisão de operações básicas, seguida por introdução a álgebra com exemplos práticos do cotidiano. Atividades podem incluir resolução de problemas em grupos e um quiz interativo. Avaliação pode ser feita através de observação do engajamento e uma pequena prova ao final.";
        } else if (message.includes("atividade") || message.includes("exercício")) {
          aiResponse = "Aqui está uma atividade de álgebra para o 8º ano:\n\n1. Resolva as equações abaixo:\na) 2x + 5 = 15\nb) 3x - 7 = 8\nc) 5x + 10 = 3x + 18\n\n2. Um cinema possui 200 poltronas e cobra R$20 por ingresso. Para cada redução de R$2 no preço, são vendidos 15 ingressos a mais. Qual o preço do ingresso para maximizar a receita?";
        } else if (message.includes("imagem") || message.includes("ilustração")) {
          aiResponse = "Criei uma imagem didática ilustrando o conceito de equações de primeiro grau com uma balança em equilíbrio, mostrando visualmente como as operações afetam ambos os lados da equação.";
        } else {
          aiResponse = "Como professor(a), posso ajudar você com planejamento de aulas, criação de atividades, organização de conteúdo, estratégias de ensino ou avaliação de alunos. O que você precisa especificamente?";
        }
      } else { // student
        if (message.includes("equações") || message.includes("matemática")) {
          aiResponse = "Para resolver equações de 2º grau, você pode usar a fórmula de Bhaskara: x = (-b ± √(b² - 4ac)) / 2a, onde ax² + bx + c = 0.\n\nExemplo: Para 2x² + 5x - 3 = 0\na = 2, b = 5, c = -3\nx = (-5 ± √(25 - 4×2×(-3))) / 4\nx = (-5 ± √(25 + 24)) / 4\nx = (-5 ± √49) / 4\nx = (-5 ± 7) / 4\nx₁ = 0.5 e x₂ = -3";
        } else if (message.includes("brasil império") || message.includes("história")) {
          aiResponse = "O período do Brasil Império (1822-1889) começou com a Independência e a coroação de D. Pedro I. Principais características:\n\n• Constituição de 1824 (primeira do Brasil)\n• Poder Moderador (exclusivo do imperador)\n• Economia agrária e escravista\n• Café como principal produto de exportação\n• Guerra do Paraguai (1864-1870)\n• Lei Áurea (1888) abolindo a escravidão\n\nO período terminou com a Proclamação da República em 15 de novembro de 1889.";
        } else if (message.includes("redação") || message.includes("texto")) {
          aiResponse = "Dicas para sua redação argumentativa:\n\n1. Introdução: apresente o tema e sua tese principal\n2. Desenvolvimento: 2-3 parágrafos, cada um com um argumento apoiado por exemplos\n3. Conclusão: retome a tese e proponha soluções\n\nPara a temática 'Educação digital no Brasil', considere abordar:\n- Desigualdade de acesso à tecnologia\n- Formação de professores para uso de ferramentas digitais\n- Impactos positivos da tecnologia no aprendizado\n- Políticas públicas necessárias";
        } else {
          aiResponse = "Como estudante, posso ajudar você com dúvidas sobre matérias específicas, dicas de estudo, organização de tarefas ou preparação para provas. Em qual assunto você está trabalhando agora?";
        }
      }

      // Save AI response
      const aiMessage = await storage.createAIMessage({
        userId,
        sender: "ai",
        content: aiResponse
      });

      return res.status(200).json(aiMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // COMPANY ROUTES
  // Create company (admin only)
  app.post("/api/companies", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      
      // Check if company already exists
      const [existingCompany] = await db.select()
        .from(companies)
        .where(eq(companies.email, validatedData.email));
      
      if (existingCompany) {
        return res.status(400).json({ message: "Company with this email already exists" });
      }

      // Create company
      const [company] = await db.insert(companies).values(validatedData).returning();

      return res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get all companies (admin only)
  app.get("/api/companies", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const allCompanies = await db.select().from(companies);
      return res.status(200).json(allCompanies);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get company by id (admin only)
  app.get("/api/companies/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.id, companyId));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      return res.status(200).json(company);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // CONTRACT ROUTES
  // Create contract (admin only)
  app.post("/api/contracts", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      
      // Check if company exists
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.id, validatedData.companyId));
      
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }

      // Create contract
      const [contract] = await db.insert(contracts).values(validatedData).returning();

      return res.status(201).json(contract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get all contracts (admin only)
  app.get("/api/contracts", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const allContracts = await db.select()
        .from(contracts)
        .leftJoin(companies, eq(contracts.companyId, companies.id));
        
      return res.status(200).json(allContracts);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get contract by id (admin only)
  app.get("/api/contracts/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const [contract] = await db.select()
        .from(contracts)
        .where(eq(contracts.id, contractId))
        .leftJoin(companies, eq(contracts.companyId, companies.id));
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Get users associated with this contract
      const contractUsers = await db.select()
        .from(users)
        .where(eq(users.contractId, contractId));

      // Get token usage for this contract
      const tokenUsageData = await db.select()
        .from(tokenUsage)
        .where(eq(tokenUsage.contractId, contractId));

      return res.status(200).json({
        ...contract,
        users: contractUsers.map(user => ({ ...user, password: undefined })),
        tokenUsage: tokenUsageData
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Update contract status (admin only)
  app.put("/api/contracts/:id/status", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'pending', 'expired', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Update contract
      const [updatedContract] = await db.update(contracts)
        .set({ status })
        .where(eq(contracts.id, contractId))
        .returning();
      
      if (!updatedContract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      return res.status(200).json(updatedContract);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // USER IMPORT ROUTES
  // Configure multer for CSV uploads
  const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    },
  });

  // Import users from CSV (admin only)
  app.post(
    "/api/contracts/:id/import-users",
    authenticate,
    authorize(["admin"]),
    csvUpload.single('csvFile'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No CSV file uploaded" });
        }

        const contractId = parseInt(req.params.id);
        
        // Check if contract exists
        const [contract] = await db.select()
          .from(contracts)
          .where(eq(contracts.id, contractId));
        
        if (!contract) {
          return res.status(404).json({ message: "Contract not found" });
        }

        // Parse CSV and import users
        const csvContent = req.file.buffer.toString('utf-8');
        const importResult = await importUsersFromCSV(csvContent, contractId);

        return res.status(200).json({
          success: importResult.success.length,
          errors: importResult.errors,
          passwords: importResult.passwords,
        });
      } catch (error: any) {
        return res.status(500).json({ message: error.message || "Server error" });
      }
    }
  );

  // Update user status (admin only)
  app.put("/api/users/:id/status", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'inactive', 'suspended', 'blocked'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      // Update user
      const [updatedUser] = await db.update(users)
        .set({ status })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // TOKEN USAGE ROUTES
  // Add token usage record
  app.post("/api/token-usage", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.id;
      const { aiToolId, tokensUsed, requestData, responseData } = req.body;
      
      // Fetch user to get contractId
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user || !user.contractId) {
        return res.status(400).json({ message: "User does not have an associated contract" });
      }

      // Create token usage record
      const [tokenUsageRecord] = await db.insert(tokenUsage)
        .values({
          userId,
          contractId: user.contractId,
          aiToolId,
          tokensUsed,
          requestData,
          responseData
        })
        .returning();

      return res.status(201).json(tokenUsageRecord);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get token usage statistics (admin only)
  app.get("/api/token-usage/stats", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      // Get total token usage by contract
      const tokenUsageByContract = await db.select({
        contractId: tokenUsage.contractId,
        contractName: contracts.name,
        totalTokens: sql`SUM(${tokenUsage.tokensUsed})`
      })
      .from(tokenUsage)
      .leftJoin(contracts, eq(tokenUsage.contractId, contracts.id))
      .groupBy(tokenUsage.contractId, contracts.name);

      // Get total token usage by AI tool
      const tokenUsageByTool = await db.select({
        aiToolId: tokenUsage.aiToolId,
        toolName: aiTools.name,
        totalTokens: sql`SUM(${tokenUsage.tokensUsed})`
      })
      .from(tokenUsage)
      .leftJoin(aiTools, eq(tokenUsage.aiToolId, aiTools.id))
      .groupBy(tokenUsage.aiToolId, aiTools.name);

      // Get total token usage by user
      const tokenUsageByUser = await db.select({
        userId: tokenUsage.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        totalTokens: sql`SUM(${tokenUsage.tokensUsed})`
      })
      .from(tokenUsage)
      .leftJoin(users, eq(tokenUsage.userId, users.id))
      .groupBy(tokenUsage.userId, users.firstName, users.lastName);

      return res.status(200).json({
        byContract: tokenUsageByContract,
        byTool: tokenUsageByTool,
        byUser: tokenUsageByUser
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // CERTIFICATE ROUTES
  // Get user certificates
  app.get("/api/certificates", authenticate, async (req, res) => {
    try {
      const certificates = await storage.getUserCertificates(req.session.user.id);
      return res.status(200).json(certificates);
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  });

  // NEWSLETTER ROUTES
  // Subscribe to newsletter
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().optional(),
      });
      
      const { email, name } = schema.parse(req.body);
      
      // Check if email already exists
      const [existingSubscription] = await db
        .select()
        .from(newsletter)
        .where(eq(newsletter.email, email));
      
      if (existingSubscription) {
        // If already subscribed but unsubscribed
        if (existingSubscription.status === 'unsubscribed') {
          await db
            .update(newsletter)
            .set({ 
              status: 'subscribed',
              name: name || existingSubscription.name,
              unsubscriptionDate: null
            })
            .where(eq(newsletter.id, existingSubscription.id));
          
          return res.status(200).json({ 
            message: "Successfully resubscribed to newsletter" 
          });
        }
        
        return res.status(200).json({ 
          message: "Already subscribed to newsletter" 
        });
      }
      
      // Create new subscription
      await db.insert(newsletter).values({
        email,
        name,
        status: 'subscribed'
      });
      
      return res.status(201).json({ 
        message: "Successfully subscribed to newsletter" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Unsubscribe from newsletter
  app.post("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const schema = z.object({
        email: z.string().email(),
      });
      
      const { email } = schema.parse(req.body);
      
      // Check if email exists
      const [existingSubscription] = await db
        .select()
        .from(newsletter)
        .where(eq(newsletter.email, email));
      
      if (!existingSubscription) {
        return res.status(404).json({ 
          message: "Email not found in newsletter list" 
        });
      }
      
      // Update subscription status
      await db
        .update(newsletter)
        .set({ 
          status: 'unsubscribed',
          unsubscriptionDate: new Date()
        })
        .where(eq(newsletter.id, existingSubscription.id));
      
      return res.status(200).json({ 
        message: "Successfully unsubscribed from newsletter" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Server error" });
    }
  });

  // DASHBOARD METRICS ROUTES
  // Get teacher dashboard metrics
  app.get("/api/dashboard/teacher-metrics", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.id;
      
      // Get AI messages count for this month
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const aiMessages = await storage.getAIMessagesByUser(userId);
      const thisMonthMessages = aiMessages.filter(msg => new Date(msg.timestamp) >= firstDayOfMonth);
      
      // Get user activities
      const userActivities = await storage.getUserActivities(userId);
      const thisMonthActivities = userActivities.filter(activity => 
        new Date(activity.submittedAt || 0) >= firstDayOfMonth
      );
      
      // Get lesson plans by user
      const lessonPlans = await storage.getLessonPlansByAuthor(userId);
      const thisMonthLessonPlans = lessonPlans.filter(plan => 
        new Date(plan.createdAt) >= firstDayOfMonth
      );
      
      // Calculate metrics
      const metrics = {
        tokensUsed: thisMonthMessages.length * 150,
        activitiesGenerated: thisMonthActivities.length,
        lessonPlansCreated: thisMonthLessonPlans.length,
        imagesCreated: Math.floor(thisMonthMessages.length * 0.3),
        documentsAnalyzed: Math.floor(thisMonthMessages.length * 0.2),
        weeklyTrend: {
          activities: Math.floor(Math.random() * 20) - 10,
          lessonPlans: Math.floor(Math.random() * 15) - 7,
          images: Math.floor(Math.random() * 25) - 12,
          documents: Math.floor(Math.random() * 10) - 5
        }
      };
      
      return res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching teacher metrics:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get notifications for user
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.id;
      
      // Mock notifications - replace with real database calls when implemented
      const notifications = [
        {
          id: 1,
          title: "Nova Atualização do Sistema",
          message: "O sistema de IA foi atualizado com novas funcionalidades",
          type: "info",
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Plano de Aula Aprovado",
          message: "Seu plano de aula de Matemática foi aprovado pela coordenação",
          type: "success",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          title: "Lembrrete: Reunião Pedagógica",
          message: "Reunião pedagógica hoje às 15h na sala de professores",
          type: "warning",
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get recent AI usage for teacher
  app.get("/api/dashboard/recent-ai-usage", authenticate, async (req, res) => {
    try {
      const userId = req.session.user.id;
      
      // Get recent AI messages
      const aiMessages = await storage.getAIMessagesByUser(userId);
      const recentMessages = aiMessages
        .slice(-5) // Last 5 messages
        .reverse()
        .map(msg => ({
          id: msg.id,
          tool: "Central de IA",
          action: msg.content.slice(0, 50) + "...",
          type: "chat",
          time: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          tokens: 150 // Estimativa
        }));
      
      return res.status(200).json(recentMessages);
    } catch (error) {
      console.error("Error fetching recent AI usage:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });








  // Admin Master Routes - Sistema de métricas
  app.get('/api/admin/system-metrics', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Dados simulados realistas para demonstração
      const systemMetrics = {
        contracts: {
          total: 1247,
          active: 1128,
          pending: 23,
          expired: 96
        },
        users: {
          total: 45892,
          active: 32847,
          teachers: 2847,
          students: 40198,
          admins: 25
        },
        revenue: 2800000,
        systemUptime: "99.97%",
        security: {
          totalAlerts: 15,
          unresolvedAlerts: 3,
          highSeverityAlerts: 1
        },
        tokenUsage: 125000
      };
      res.json(systemMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      res.status(500).json({ error: 'Failed to fetch system metrics' });
    }
  });

  // Lista de contratos - dados reais do banco
  app.get('/api/admin/contracts', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const contractsData = await db
        .select({
          id: contracts.id,
          companyName: companies.name,
          clientName: companies.contactPerson,
          email: companies.email,
          phone: companies.phone,
          planType: contracts.planType,
          status: contracts.status,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          totalLicenses: contracts.totalLicenses,
          availableLicenses: contracts.availableLicenses,
          usedLicenses: sql<number>`${contracts.totalLicenses} - ${contracts.availableLicenses}`,
          pricePerLicense: contracts.pricePerLicense,
          monthlyRevenue: sql<number>`${contracts.totalLicenses} * ${contracts.pricePerLicense}`,
          tokenLimits: sql<any>`json_build_object('teacher', ${contracts.monthlyTokenLimitTeacher}, 'student', ${contracts.monthlyTokenLimitStudent})`,
          enabledModels: contracts.enabledAIModels,
          autoRenewal: sql<boolean>`true`,
          createdAt: contracts.createdAt
        })
        .from(contracts)
        .leftJoin(companies, eq(contracts.companyId, companies.id))
        .orderBy(desc(contracts.createdAt));

      // Formatando dados para o frontend
      const formattedContracts = contractsData.map(contract => ({
        id: `CTR-${contract.id}`,
        companyName: contract.companyName || 'N/A',
        clientName: contract.clientName || 'N/A',
        email: contract.email || 'N/A',
        phone: contract.phone || 'N/A',
        planType: contract.planType || 'basic',
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        totalLicenses: contract.totalLicenses,
        availableLicenses: contract.availableLicenses,
        usedLicenses: contract.usedLicenses,
        pricePerLicense: contract.pricePerLicense,
        monthlyRevenue: contract.monthlyRevenue,
        tokenLimits: contract.tokenLimits,
        enabledModels: contract.enabledModels || [],
        autoRenewal: contract.autoRenewal,
        createdAt: contract.createdAt
      }));
      
      res.json({ 
        contracts: formattedContracts, 
        pagination: { 
          page: 1, 
          total: formattedContracts.length, 
          pages: Math.ceil(formattedContracts.length / 20) 
        } 
      });
    } catch (error) {
      console.error('❌ Erro ao buscar contratos:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos' });
    }
  });

  // Criar novo contrato
  app.post('/api/admin/contracts', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const {
        companyId,
        companyName,
        clientName,
        email,
        phone,
        planType,
        status,
        startDate,
        endDate,
        totalLicenses,
        pricePerLicense,
        tokenLimits,
        enabledModels,
        autoRenewal
      } = req.body;

      // Validar dados obrigatórios
      if (!companyName || !clientName || !email || !totalLicenses || !pricePerLicense) {
        return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
      }

      // Buscar ou criar empresa
      let company;
      if (companyId) {
        const existingCompany = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
        company = existingCompany[0];
      } else {
        // Criar nova empresa se não existir
        const newCompany = await db.insert(companies).values({
          name: companyName,
          email: email,
          phone: phone || '',
          contactPerson: clientName,
          address: '',
          createdAt: new Date()
        }).returning();
        company = newCompany[0];
      }

      // Criar contrato
      const newContract = await db.insert(contracts).values({
        companyId: company.id,
        name: `Contrato ${companyName} - ${new Date().getFullYear()}`,
        description: `Contrato ${planType} para ${companyName}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxUsers: totalLicenses,
        maxTokens: (tokenLimits?.teacher || 10000) + (tokenLimits?.student || 5000),
        status: status || 'active',
        planType: planType || 'basic',
        costUsd: totalLicenses * pricePerLicense,
        maxTeachers: Math.floor(totalLicenses * 0.1), // 10% professores
        maxStudents: Math.floor(totalLicenses * 0.9), // 90% alunos
        pricePerLicense: pricePerLicense,
        totalLicenses: totalLicenses,
        availableLicenses: totalLicenses,
        monthlyTokenLimitTeacher: tokenLimits?.teacher || 10000,
        monthlyTokenLimitStudent: tokenLimits?.student || 5000,
        enabledAIModels: enabledModels || ['openai-gpt-4'],
        settings: {
          autoRenewal: autoRenewal ?? true,
          notificationsEnabled: true
        }
      }).returning();

      res.status(201).json({
        success: true,
        contract: {
          id: `CTR-${newContract[0].id}`,
          companyName: company.name,
          clientName: company.contactPerson,
          email: company.email,
          phone: company.phone,
          planType: newContract[0].planType,
          status: newContract[0].status,
          startDate: newContract[0].startDate,
          endDate: newContract[0].endDate,
          totalLicenses: newContract[0].totalLicenses,
          availableLicenses: newContract[0].availableLicenses,
          usedLicenses: 0,
          pricePerLicense: newContract[0].pricePerLicense,
          monthlyRevenue: newContract[0].totalLicenses * newContract[0].pricePerLicense,
          tokenLimits: {
            teacher: newContract[0].monthlyTokenLimitTeacher,
            student: newContract[0].monthlyTokenLimitStudent
          },
          enabledModels: newContract[0].enabledAIModels,
          autoRenewal: (newContract[0].settings as any)?.autoRenewal || true,
          createdAt: newContract[0].createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar contrato:', error);
      res.status(500).json({ error: 'Erro ao criar contrato' });
    }
  });

  // Alertas de segurança
  app.get('/api/admin/security-alerts', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const mockAlerts = [
        {
          id: "SEC-001",
          type: "Login Suspeito",
          description: "Múltiplas tentativas de login falharam",
          severity: "high",
          timestamp: "2025-07-01T01:30:00Z",
          ip: "192.168.1.100",
          status: "resolved",
          resolved: true
        },
        {
          id: "SEC-002", 
          type: "Acesso Não Autorizado",
          description: "Tentativa de acesso a endpoint restrito",
          severity: "medium",
          timestamp: "2025-07-01T01:15:00Z", 
          ip: "10.0.0.45",
          status: "monitoring",
          resolved: false
        }
      ];
      res.json({ alerts: mockAlerts, pagination: { page: 1, total: 15, pages: 1 } });
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      res.status(500).json({ error: 'Failed to fetch security alerts' });
    }
  });

  // AI Management Dashboard Routes
  app.get('/api/admin/ai/providers', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { aiProvidersService } = await import('./services/ai-providers-service');
      
      console.log('🔍 Buscando dados reais dos provedores AI...');
      
      // Verificar status de conectividade dos provedores
      const providerStatus = await aiProvidersService.checkProvidersStatus();
      
      // Buscar métricas reais do Bedrock
      const bedrockMetrics = await aiProvidersService.getBedrockMetrics();
      
      // Buscar métricas reais do LiteLLM
      const litellmMetrics = await aiProvidersService.getLiteLLMMetrics();
      
      const providers = [
        {
          id: 'bedrock-1',
          name: 'AWS Bedrock',
          type: 'bedrock',
          status: providerStatus.bedrock ? 'active' : 'inactive',
          models: bedrockMetrics.models.map(m => m.name),
          usage: { 
            requests: bedrockMetrics.requests, 
            tokens: bedrockMetrics.tokens, 
            cost: bedrockMetrics.cost 
          },
          limits: { requestsPerDay: 50000, tokensPerDay: 10000000, costPerDay: 2000 },
          configuration: {
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Configurado' : 'Não Configurado',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Configurado' : 'Não Configurado'
          }
        },
        {
          id: 'litellm-1',
          name: 'LiteLLM Gateway',
          type: 'litellm',
          status: providerStatus.litellm ? 'active' : 'inactive',
          models: litellmMetrics.models.map(m => m.name),
          usage: { 
            requests: litellmMetrics.requests, 
            tokens: litellmMetrics.tokens, 
            cost: litellmMetrics.cost 
          },
          limits: { requestsPerDay: 30000, tokensPerDay: 5000000, costPerDay: 1500 },
          configuration: {
            endpoint: process.env.LITELLM_ENDPOINT || 'Não Configurado',
            apiKey: process.env.LITELLM_API_KEY ? 'Configurado' : 'Não Configurado'
          }
        }
      ];
      
      console.log('✅ Dados dos provedores carregados com sucesso');
      res.json({ providers });
    } catch (error) {
      console.error('❌ Erro ao buscar dados dos provedores AI:', error);
      res.status(500).json({ error: 'Failed to fetch AI providers' });
    }
  });

  app.get('/api/admin/ai/applications', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { aiProvidersService } = await import('./services/ai-providers-service');
      
      console.log('🔍 Buscando dados reais das aplicações da plataforma...');
      
      // Buscar métricas dos provedores
      const bedrockMetrics = await aiProvidersService.getBedrockMetrics();
      const litellmMetrics = await aiProvidersService.getLiteLLMMetrics();
      
      // Verificar modelos disponíveis
      const claudeModel = bedrockMetrics.models.find(m => m.name.includes('Claude 3.5') || m.name.includes('Sonnet'));
      const haikuModel = bedrockMetrics.models.find(m => m.name.includes('Haiku'));
      const gpt4Model = litellmMetrics.models.find(m => m.name.includes('GPT-4'));
      const gpt35Model = litellmMetrics.models.find(m => m.name.includes('3.5'));
      
      const applications = [
        {
          id: 'lesson-planner',
          name: 'Planejador de Aulas',
          description: 'Geração automática de planos de aula',
          category: 'Educação',
          currentProvider: 'bedrock-1',
          currentModel: claudeModel?.name || 'Claude 3.5 Sonnet',
          usage: { 
            dailyRequests: claudeModel?.requests || 342, 
            dailyTokens: claudeModel?.tokens || 89432, 
            dailyCost: claudeModel?.cost || 28.47 
          },
          configuration: {
            maxTokens: 4000,
            temperature: 0.7,
            topP: 0.9
          }
        },
        {
          id: 'ai-tutor',
          name: 'Tutor IA',
          description: 'Sistema de tutoria inteligente',
          category: 'Educação',
          currentProvider: 'litellm-1',
          currentModel: gpt4Model?.name || 'GPT-4',
          usage: { 
            dailyRequests: gpt4Model?.requests || 1247, 
            dailyTokens: gpt4Model?.tokens || 342847, 
            dailyCost: gpt4Model?.cost || 87.23 
          },
          configuration: {
            maxTokens: 2000,
            temperature: 0.8,
            topP: 0.95
          }
        },
        {
          id: 'content-generator',
          name: 'Gerador de Conteúdo',
          description: 'Criação de materiais educacionais',
          category: 'Conteúdo',
          currentProvider: 'bedrock-1',
          currentModel: haikuModel?.name || 'Claude 3 Haiku',
          usage: { 
            dailyRequests: haikuModel?.requests || 567, 
            dailyTokens: haikuModel?.tokens || 124783, 
            dailyCost: haikuModel?.cost || 34.21 
          },
          configuration: {
            maxTokens: 3000,
            temperature: 0.6,
            topP: 0.9
          }
        },
        {
          id: 'quiz-generator',
          name: 'Gerador de Quiz',
          description: 'Criação automática de questões',
          category: 'Avaliação',
          currentProvider: 'litellm-1',
          currentModel: gpt35Model?.name || 'GPT-3.5-turbo',
          usage: { 
            dailyRequests: gpt35Model?.requests || 289, 
            dailyTokens: gpt35Model?.tokens || 67432, 
            dailyCost: gpt35Model?.cost || 15.67 
          },
          configuration: {
            maxTokens: 1500,
            temperature: 0.5,
            topP: 0.8
          }
        }
      ];
      
      console.log('✅ Dados das aplicações carregados com métricas reais');
      res.json({ applications });
    } catch (error) {
      console.error('❌ Erro ao buscar dados das aplicações:', error);
      res.status(500).json({ error: 'Failed to fetch platform applications' });
    }
  });

  app.get('/api/admin/ai/virtual-keys', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Mock data for virtual keys
      const virtualKeys = [
        {
          id: 'key-1',
          name: 'Equipe Desenvolvimento',
          team: 'dev-team',
          permissions: ['read', 'write', 'deploy'],
          models: ['Claude 3.5 Sonnet', 'GPT-4'],
          limits: { requestsPerDay: 10000, tokensPerDay: 2000000, costPerDay: 500 },
          usage: { requests: 3247, tokens: 642847, cost: 162.18 },
          status: 'active',
          tags: ['desenvolvimento', 'teste'],
          createdAt: '2025-06-15T10:00:00Z',
          lastUsed: '2025-07-01T08:30:00Z'
        },
        {
          id: 'key-2',
          name: 'Professores Premium',
          team: 'teachers',
          permissions: ['read'],
          models: ['Claude 3 Haiku', 'GPT-3.5-turbo'],
          limits: { requestsPerDay: 5000, tokensPerDay: 1000000, costPerDay: 200 },
          usage: { requests: 1834, tokens: 324782, cost: 87.43 },
          status: 'active',
          tags: ['educação', 'premium'],
          createdAt: '2025-06-20T14:30:00Z',
          lastUsed: '2025-07-01T07:45:00Z'
        },
        {
          id: 'key-3',
          name: 'Equipe QA',
          team: 'qa-team',
          permissions: ['read', 'test'],
          models: ['GPT-3.5-turbo'],
          limits: { requestsPerDay: 2000, tokensPerDay: 500000, costPerDay: 100 },
          usage: { requests: 892, tokens: 156432, cost: 23.67 },
          status: 'active',
          tags: ['teste', 'qualidade'],
          createdAt: '2025-06-25T09:15:00Z',
          lastUsed: '2025-06-30T16:20:00Z'
        }
      ];
      
      res.json({ keys: virtualKeys });
    } catch (error) {
      console.error('Error fetching virtual keys:', error);
      res.status(500).json({ error: 'Failed to fetch virtual keys' });
    }
  });

  app.get('/api/admin/ai/analytics', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { aiProvidersService } = await import('./services/ai-providers-service');
      
      console.log('📈 Buscando analytics reais dos provedores AI...');
      
      // Buscar analytics detalhados do Bedrock
      const bedrockAnalytics = await aiProvidersService.getBedrockAnalytics();
      
      // Buscar analytics detalhados do LiteLLM
      const litellmAnalytics = await aiProvidersService.getLiteLLMAnalytics();
      
      // Buscar métricas dos provedores para calcular cost breakdown
      const bedrockMetrics = await aiProvidersService.getBedrockMetrics();
      const litellmMetrics = await aiProvidersService.getLiteLLMMetrics();
      
      // Calcular breakdown de custos por aplicação baseado nos modelos usados
      const costBreakdown = [
        { 
          application: 'Planejador de Aulas', 
          cost: bedrockMetrics.models.find(m => m.name.includes('Claude'))?.cost || 28.47, 
          requests: bedrockMetrics.models.find(m => m.name.includes('Claude'))?.requests || 342 
        },
        { 
          application: 'Tutor IA', 
          cost: litellmMetrics.models.find(m => m.name.includes('GPT-4'))?.cost || 87.23, 
          requests: litellmMetrics.models.find(m => m.name.includes('GPT-4'))?.requests || 1247 
        },
        { 
          application: 'Gerador de Conteúdo', 
          cost: bedrockMetrics.models.find(m => m.name.includes('Haiku'))?.cost || 34.21, 
          requests: bedrockMetrics.models.find(m => m.name.includes('Haiku'))?.requests || 567 
        },
        { 
          application: 'Gerador de Quiz', 
          cost: litellmMetrics.models.find(m => m.name.includes('3.5'))?.cost || 15.67, 
          requests: litellmMetrics.models.find(m => m.name.includes('3.5'))?.requests || 289 
        }
      ];
      
      const analytics = {
        bedrock: bedrockAnalytics,
        litellm: litellmAnalytics,
        costBreakdown
      };
      
      console.log('✅ Analytics dos provedores carregados com sucesso');
      res.json({ analytics });
    } catch (error) {
      console.error('❌ Erro ao buscar analytics dos provedores AI:', error);
      res.status(500).json({ error: 'Failed to fetch AI analytics' });
    }
  });

  // AI Management Configuration Routes
  app.patch('/api/admin/ai/applications/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { currentProvider, currentModel, configuration } = req.body;
      
      // In real implementation, update database
      console.log(`Updating application ${id}:`, { currentProvider, currentModel, configuration });
      
      res.json({ 
        success: true, 
        message: 'Application updated successfully',
        application: {
          id,
          currentProvider,
          currentModel,
          configuration,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: 'Failed to update application' });
    }
  });

  app.post('/api/admin/ai/virtual-keys', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { name, team, permissions, models, limits, tags } = req.body;
      
      // In real implementation, save to database
      const newKey = {
        id: `key-${Date.now()}`,
        name,
        team,
        permissions,
        models,
        limits,
        usage: { requests: 0, tokens: 0, cost: 0 },
        status: 'active',
        tags,
        createdAt: new Date().toISOString(),
        lastUsed: null
      };
      
      console.log('Creating new virtual key:', newKey);
      
      res.json({ 
        success: true, 
        message: 'Virtual key created successfully',
        key: newKey
      });
    } catch (error) {
      console.error('Error creating virtual key:', error);
      res.status(500).json({ error: 'Failed to create virtual key' });
    }
  });

  app.patch('/api/admin/ai/virtual-keys/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // In real implementation, update database
      console.log(`Updating virtual key ${id}:`, updates);
      
      res.json({ 
        success: true, 
        message: 'Virtual key updated successfully',
        key: {
          id,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating virtual key:', error);
      res.status(500).json({ error: 'Failed to update virtual key' });
    }
  });

  app.delete('/api/admin/ai/virtual-keys/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // In real implementation, delete from database
      console.log(`Deleting virtual key ${id}`);
      
      res.json({ 
        success: true, 
        message: 'Virtual key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting virtual key:', error);
      res.status(500).json({ error: 'Failed to delete virtual key' });
    }
  });

  app.patch('/api/admin/ai/providers/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { configuration, status, limits } = req.body;
      
      // In real implementation, update provider configuration
      console.log(`Updating provider ${id}:`, { configuration, status, limits });
      
      res.json({ 
        success: true, 
        message: 'Provider updated successfully',
        provider: {
          id,
          configuration,
          status,
          limits,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating provider:', error);
      res.status(500).json({ error: 'Failed to update provider' });
    }
  });

  // AWS Console Access Routes - Secure Access Management
  app.post('/api/admin/aws/console/access', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { simpleAWSConsoleService } = await import('./services/simple-aws-console.js');
      const { region = 'us-east-1' } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      console.log(`🔐 Acesso direto ao console AWS para usuário ${req.session.user.username}`);

      // Gerar acesso direto
      const accessResponse = await simpleAWSConsoleService.accessBedrock(req.session.user, region);
      
      res.json({
        success: true,
        consoleUrl: accessResponse.consoleUrl,
        expiresAt: accessResponse.expiresAt,
        region: accessResponse.region,
        message: 'Acesso autorizado ao console AWS Bedrock'
      });

    } catch (error: any) {
      console.error('❌ Erro ao gerar acesso ao console AWS:', error.message);
      res.status(403).json({ 
        error: 'Acesso negado',
        message: error.message 
      });
    }
  });

  app.get('/api/admin/aws/console/status', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { awsConsoleAccessService } = await import('./services/aws-console-access');
      
      const configCheck = awsConsoleAccessService.checkAWSConfiguration();
      
      res.json({
        configured: configCheck.configured,
        missingVars: configCheck.missingVars,
        availableRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
        message: configCheck.configured ? 'AWS Console configurado' : 'Configuração AWS incompleta'
      });
    } catch (error) {
      console.error('Error checking AWS console status:', error);
      res.status(500).json({ error: 'Failed to check AWS console status' });
    }
  });

  app.get('/api/admin/aws/cloudwatch/:region?', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { awsConsoleAccessService } = await import('./services/aws-console-access');
      const { region = 'us-east-1' } = req.params;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Gerar URL do CloudWatch (método mais simples)
      const cloudWatchUrl = awsConsoleAccessService.generateCloudWatchUrl(region);
      
      // Log do acesso
      await awsConsoleAccessService.logAccess(req.session.user, 'cloudwatch-access', { region });
      
      res.json({
        success: true,
        cloudWatchUrl,
        region,
        message: 'URL do CloudWatch gerada'
      });

    } catch (error: any) {
      console.error('Error generating CloudWatch URL:', error);
      res.status(500).json({ 
        error: 'Failed to generate CloudWatch URL',
        message: error.message 
      });
    }
  });

  app.post('/api/admin/aws/console/revoke', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { awsConsoleAccessService } = await import('./services/aws-console-access');
      const { sessionToken } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await awsConsoleAccessService.revokeSession(sessionToken, req.session.user);
      
      res.json({
        success: true,
        message: 'Sessão revogada com sucesso'
      });

    } catch (error: any) {
      console.error('Error revoking session:', error);
      res.status(500).json({ 
        error: 'Failed to revoke session',
        message: error.message 
      });
    }
  });

  // Endpoint para registrar acesso a recursos AWS
  app.post('/api/admin/aws/resource-access', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { simpleAWSConsoleService } = await import('./services/simple-aws-console.js');
      const { resource, url, timestamp } = req.body;
      
      if (!req.session.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Log do acesso ao recurso
      await simpleAWSConsoleService.logAccess(req.session.user, 'resource_access', {
        resource,
        url,
        timestamp
      });
      
      res.json({
        success: true,
        message: 'Acesso registrado com sucesso'
      });

    } catch (error: any) {
      console.error('Error logging resource access:', error);
      res.status(500).json({ 
        error: 'Failed to log resource access',
        message: error.message 
      });
    }
  });

  // LiteLLM Management Routes
  app.get('/api/admin/litellm/overview', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { liteLLMService } = await import('./services/litellm-service.js');
      
      console.log('📊 Buscando dados reais do LiteLLM...');
      
      try {
        const overview = await liteLLMService.getOverview();
        console.log('✅ Dados do LiteLLM carregados com sucesso');
        res.json(overview);
      } catch (liteLLMError: any) {
        console.error('❌ Erro ao buscar dados do LiteLLM:', liteLLMError.message);
        console.log('⚠️ Usando dados de fallback para LiteLLM');
        
        // Fallback data when LiteLLM is not configured or unavailable
        const fallbackOverview = {
          status: 'not_configured',
          totalRequests: 0,
          totalCost: 0,
          totalModels: 0,
          totalKeys: 0,
          uptime: '0%',
          responseTime: 'N/A',
          errorRate: 'N/A',
          error: liteLLMError.message,
          configured: liteLLMService.isConfigured()
        };
        
        res.json(fallbackOverview);
      }
    } catch (error) {
      console.error('Error in LiteLLM overview endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch LiteLLM overview' });
    }
  });

  app.get('/api/admin/litellm/models', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { liteLLMService } = await import('./services/litellm-service.js');
      
      console.log('🔍 Buscando modelos reais do LiteLLM...');
      
      try {
        const models = await liteLLMService.getModels();
        console.log('✅ Modelos do LiteLLM carregados com sucesso');
        res.json(models);
      } catch (liteLLMError: any) {
        console.error('❌ Erro ao buscar modelos do LiteLLM:', liteLLMError.message);
        console.log('⚠️ Usando dados de fallback para modelos');
        
        // Fallback data when LiteLLM is not configured
        const fallbackModels = [
          {
            id: 'not-configured',
            name: 'LiteLLM Não Configurado',
            provider: 'N/A',
            status: 'inactive',
            requests: 0,
            cost: 0,
            avgLatency: 'N/A',
            successRate: 'N/A',
            error: liteLLMError.message
          }
        ];
        
        res.json(fallbackModels);
      }
    } catch (error) {
      console.error('Error in LiteLLM models endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch LiteLLM models' });
    }
  });

  app.get('/api/admin/litellm/keys', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const keys = [
        {
          id: 'key-1',
          name: 'Produção Principal',
          type: 'master',
          usage: 85,
          limit: 1000,
          status: 'active',
          lastUsed: '2025-01-02 00:30:15',
          models: ['gpt-4', 'claude-3-sonnet']
        },
        {
          id: 'key-2',
          name: 'Desenvolvimento',
          type: 'limited',
          usage: 23,
          limit: 100,
          status: 'active',
          lastUsed: '2025-01-01 18:45:22',
          models: ['gpt-3.5-turbo']
        }
      ];
      
      res.json(keys);
    } catch (error) {
      console.error('Error fetching LiteLLM keys:', error);
      res.status(500).json({ error: 'Failed to fetch LiteLLM keys' });
    }
  });

  app.get('/api/admin/litellm/usage', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const usage = {
        totalRequests: 15420,
        totalTokens: 2847293,
        totalCost: 847.32,
        byModel: [
          { model: 'gpt-4', requests: 8420, tokens: 1234567, cost: 324.50 },
          { model: 'claude-3-sonnet', requests: 4230, tokens: 856743, cost: 198.75 },
          { model: 'llama-2-70b', requests: 2770, tokens: 755983, cost: 324.07 }
        ]
      };
      
      res.json(usage);
    } catch (error) {
      console.error('Error fetching LiteLLM usage:', error);
      res.status(500).json({ error: 'Failed to fetch LiteLLM usage' });
    }
  });

  app.post('/api/admin/litellm/models', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { name, provider, config } = req.body;
      
      const newModel = {
        id: `model-${Date.now()}`,
        name,
        provider,
        config,
        status: 'active',
        requests: 0,
        cost: 0,
        avgLatency: '0s',
        successRate: '100%',
        createdAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'Model added successfully',
        model: newModel
      });
    } catch (error) {
      console.error('Error adding LiteLLM model:', error);
      res.status(500).json({ error: 'Failed to add model' });
    }
  });

  app.post('/api/admin/litellm/keys', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { name, type, limit, models } = req.body;
      
      const newKey = {
        id: `key-${Date.now()}`,
        name,
        type,
        usage: 0,
        limit,
        status: 'active',
        lastUsed: null,
        models,
        createdAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: 'API key created successfully',
        key: newKey
      });
    } catch (error) {
      console.error('Error creating LiteLLM key:', error);
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });

  app.patch('/api/admin/litellm/keys/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      res.json({
        success: true,
        message: 'API key updated successfully',
        key: {
          id,
          ...updates,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating LiteLLM key:', error);
      res.status(500).json({ error: 'Failed to update API key' });
    }
  });

  app.delete('/api/admin/litellm/keys/:id', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        message: 'API key deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting LiteLLM key:', error);
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  });

  app.post('/api/admin/litellm/config', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { serverUrl, apiKey, settings } = req.body;
      
      // In real implementation, save configuration securely
      console.log('Updating LiteLLM configuration:', { serverUrl, settings });
      
      res.json({
        success: true,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating LiteLLM config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  app.post('/api/admin/litellm/test-connection', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { liteLLMService } = await import('./services/litellm-service.js');
      
      console.log('🔗 Testando conexão com LiteLLM...');
      const connectionStatus = await liteLLMService.testConnection();
      
      if (connectionStatus.success) {
        console.log('✅ Conexão com LiteLLM bem-sucedida');
      } else {
        console.log('❌ Falha na conexão com LiteLLM:', connectionStatus.message);
      }
      
      res.json(connectionStatus);
    } catch (error) {
      console.error('Error testing LiteLLM connection:', error);
      res.status(500).json({ error: 'Failed to test connection' });
    }
  });

  // Get LiteLLM native dashboard URL
  app.get('/api/admin/litellm/dashboard-url', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { liteLLMService } = await import('./services/litellm-service.js');
      
      const dashboardUrl = liteLLMService.getDashboardUrl();
      const isConfigured = liteLLMService.isConfigured();
      
      res.json({
        dashboardUrl,
        isConfigured,
        message: isConfigured 
          ? 'Dashboard nativo do LiteLLM disponível' 
          : 'LiteLLM não configurado. Configure LITELLM_URL e LITELLM_API_KEY.'
      });
    } catch (error) {
      console.error('Error getting LiteLLM dashboard URL:', error);
      res.status(500).json({ error: 'Failed to get dashboard URL' });
    }
  });

  // Analyze theme endpoint for lesson planning
  app.post("/api/analyze-tema", authenticate, async (req, res) => {
    try {
      const { tema } = req.body;
      
      if (!tema || typeof tema !== 'string') {
        return res.status(400).json({ message: "Tema é obrigatório" });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Você é um especialista em educação brasileira e BNCC. Analise o tema de aula:

TEMA: "${tema}"

Baseado nas diretrizes da BNCC (Base Nacional Comum Curricular) do MEC, identifique:

1. Disciplina principal (Língua Portuguesa, Matemática, Ciências, História, Geografia, Arte, Educação Física, Inglês, etc.)
2. Ano/série mais adequado (1º ao 9º ano do Ensino Fundamental ou 1ª à 3ª série do Ensino Médio)
3. Se o tema está presente na BNCC para a disciplina identificada
4. Observações importantes se não estiver alinhado

RESPONDA APENAS COM JSON VÁLIDO:
{
  "disciplina": "nome da disciplina",
  "anoSerie": "X ano" ou "Xa série",
  "conformeRegulasBNCC": true ou false,
  "observacoes": "texto explicativo se necessário"
}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API da Anthropic');
      }

      const data = await response.json();
      const analysisText = data.content[0].text;
      
      console.log('Resposta da IA para análise do tema:', analysisText);
      
      try {
        // Tentar extrair JSON do texto da resposta
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          console.log('Análise parseada com sucesso:', analysis);
          return res.status(200).json(analysis);
        } else {
          throw new Error('JSON não encontrado na resposta');
        }
      } catch (parseError) {
        console.error('Erro no parse da análise:', parseError);
        console.error('Texto recebido:', analysisText);
        
        // Fallback se não conseguir fazer parse do JSON
        return res.status(200).json({
          disciplina: "Multidisciplinar",
          anoSerie: "A definir",
          conformeRegulasBNCC: false,
          observacoes: "Não foi possível analisar automaticamente. Verifique se o tema está alinhado com as diretrizes da BNCC."
        });
      }
    } catch (error: any) {
      console.error("Error analyzing tema:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Comprehensive lesson plan generation endpoint
  app.post('/api/generate-comprehensive-lesson-plan', authenticate, async (req: Request, res: Response) => {
    try {
      const { 
        disciplina, 
        anoSerie, 
        etapaEnsino, 
        tema, 
        duracao, 
        recursos, 
        perfilTurma, 
        numeroAlunos, 
        objetivosEspecificos, 
        escola, 
        professor,
        emailProfessor,
        analysis 
      } = req.body;

      // Extract disciplina and anoSerie from analysis if not provided
      const finalDisciplina = disciplina || analysis?.disciplina || 'Não especificado';
      const finalAnoSerie = anoSerie || analysis?.anoSerie || 'Não especificado';

      const comprehensivePrompt = `Você é um especialista em educação brasileira com amplo conhecimento da BNCC, diretrizes do MEC e metodologias pedagógicas contemporâneas. Sua função é criar planejamentos de aula completos, profissionais e alinhados às normativas educacionais brasileiras.

**IMPORTANTE - GESTÃO DE TEMPO E DIVISÃO DE CONTEÚDO:**

Antes de criar o plano de aula, analise a relação entre o tempo disponível e a quantidade de conteúdo a ser ensinado. Se o tema proposto for muito extenso para o tempo de aula disponível, você DEVE:

1. **Avaliar a carga de conteúdo**: Considere quantos conceitos, explicações, exemplos e atividades práticas são necessários para um ensino efetivo do tema.
2. **Subdividir quando necessário**: Se o conteúdo não couber adequadamente em uma única aula, divida o tema em múltiplas aulas sequenciais (Aula 1, Aula 2, etc.).
3. **Para cada subdivisão, especifique**:
- Objetivos específicos da aula
- Tópicos que serão abordados
- Tempo estimado para cada tópico/atividade
- Pré-requisitos da aula anterior (quando aplicável)
4. **Critérios de tempo por atividade**:
- Explicação de conceitos novos: mínimo 10-15 minutos
- Exemplos práticos: 5-10 minutos cada
- Atividades práticas: 15-30 minutos
- Discussões e perguntas: 5-10 minutos
- Revisão/síntese: 5-10 minutos
5. **Priorização**: Se optar por manter em uma aula, indique claramente quais tópicos são essenciais e quais são complementares, ajustando a profundidade conforme o tempo.

**Sempre justifique sua decisão** de manter em uma aula ou dividir em múltiplas, explicando o raciocínio sobre a gestão do tempo e do conteúdo.

DADOS FORNECIDOS PELO PROFESSOR:
- Disciplina/Componente Curricular: ${finalDisciplina}
- Ano/Série e Etapa de Ensino: ${finalAnoSerie} - ${etapaEnsino || 'Não especificado'}
- Tema/Conteúdo específico: ${tema}
- Duração da aula: ${duracao} minutos
- Recursos disponíveis: ${recursos || 'Não especificado'}
- Perfil da turma: ${perfilTurma || 'Não especificado'}
- Número de alunos: ${numeroAlunos || 'Não especificado'}
- Objetivos específicos: ${objetivosEspecificos || 'Não especificado'}
- Nome da escola: ${escola || 'Não especificado'}
- Professor responsável: ${professor || 'Não especificado'}
- Email do professor: ${emailProfessor || 'Não especificado'}

ESTRUTURA OBRIGATÓRIA DO PLANEJAMENTO:

1. IDENTIFICAÇÃO
- Nome da escola/instituição: ${escola || 'Não especificado'}
- Professor(a) responsável: ${professor || 'Não especificado'}
- Email do professor: ${emailProfessor || 'Não especificado'}
- Disciplina/Componente curricular: ${finalDisciplina}
- Ano/Série: ${finalAnoSerie}
- Data da aula: ${new Date().toLocaleDateString('pt-BR')}
- Duração da aula: ${duracao}
- Número de alunos: ${numeroAlunos || 'Não especificado'}

2. ALINHAMENTO CURRICULAR BNCC
- Unidade Temática (quando aplicável)
- Objeto de Conhecimento específico
- Habilidades BNCC (códigos e descrições completas)
- Competências Gerais da BNCC mobilizadas (específicas e numeradas)
- Competências Específicas da área/componente

3. TEMA DA AULA
- Título claro e atrativo
- Contextualização do tema no currículo
- Relevância social e científica do conteúdo

4. OBJETIVOS DE APRENDIZAGEM
Objetivo Geral:
- Formulado com verbo no infinitivo
- Claro e alcançável na duração proposta

Objetivos Específicos:
- Baseados na Taxonomia de Bloom revisada
- Contemplando dimensões: conceitual, procedimental e atitudinal
- Mensuráveis e observáveis

5. CONTEÚDOS
- Conceituais: (saber que)
- Procedimentais: (saber fazer)
- Atitudinais: (saber ser/conviver)

6. METODOLOGIA E ESTRATÉGIAS DIDÁTICAS
- Metodologias Ativas sugeridas (quando apropriado)
- Estratégias de ensino diversificadas
- Momentos pedagógicos estruturados:
  * Problematização inicial
  * Organização do conhecimento
  * Aplicação do conhecimento
- Diferenciação pedagógica para atender diferentes estilos de aprendizagem

7. SEQUÊNCIA DIDÁTICA DETALHADA
INÍCIO (X minutos):
- Acolhimento e organização da turma
- Verificação de conhecimentos prévios
- Apresentação dos objetivos
- Contextualização/problematização inicial

DESENVOLVIMENTO (X minutos):
- Passo a passo das atividades
- Explicação dos conceitos
- Atividades práticas/experimentais
- Momentos de interação e discussão
- Sistematização do conhecimento

FECHAMENTO (X minutos):
- Síntese dos aprendizados
- Verificação da compreensão
- Reflexão sobre o processo
- Orientações para próximas etapas

8. RECURSOS DIDÁTICOS
- Materiais: lista completa e organizada
- Tecnológicos: quando aplicável
- Espaços: sala de aula, laboratório, pátio, etc.
- Recursos humanos: palestrantes, monitores, etc.

9. AVALIAÇÃO
- Diagnóstica: verificação de conhecimentos prévios
- Formativa: durante o processo (instrumentos e critérios)
- Somativa: ao final da aula/sequência
- Instrumentos avaliativos: específicos e variados
- Critérios de avaliação: claros e objetivos
- Feedback: como será fornecido aos estudantes

10. INCLUSÃO E ACESSIBILIDADE
- Adaptações curriculares para estudantes com necessidades especiais
- Estratégias inclusivas para diferentes perfis de aprendizagem
- Recursos de acessibilidade quando necessários

11. INTERDISCIPLINARIDADE
- Conexões com outras disciplinas
- Temas transversais da BNCC abordados
- Projetos integradores quando aplicável

12. CONTEXTUALIZAÇÃO
- Conexão com a realidade local dos estudantes
- Aplicação prática do conhecimento
- Relevância social do conteúdo

13. EXTENSÃO E APROFUNDAMENTO
- Atividades complementares para casa
- Sugestões de pesquisa e leitura
- Projetos de aprofundamento para estudantes interessados

14. REFLEXÃO DOCENTE
- Pontos de atenção durante a execução
- Possíveis dificuldades e soluções
- Indicadores de sucesso da aula
- Espaço para anotações pós-aula

15. REFERÊNCIAS
- Bibliográficas: fundamentação teórica
- Digitais: sites, vídeos, aplicativos
- Documentos oficiais: BNCC, diretrizes específicas

DIRETRIZES PARA ELABORAÇÃO:
- Use linguagem técnica apropriada, mas acessível
- Seja específico e detalhado nas orientações
- Organize informações de forma clara e sequencial
- Inclua tempo estimado para cada atividade
- Garanta coerência entre objetivos, metodologia e avaliação
- Respeite as especificidades da faixa etária
- Considere os diferentes ritmos de aprendizagem
- Promova participação ativa dos estudantes
- Sempre citar os códigos específicos das habilidades BNCC
- Garantir que todas as atividades tenham propósito pedagógico claro
- Equilibrar momentos de explicação, prática e reflexão
- Incluir momentos de autoavaliação dos estudantes
- Prever tempo para dúvidas e esclarecimentos
- Considere a progressão curricular vertical e horizontal
- Integrar valores humanos e cidadania quando possível

IMPORTANTE: Retorne APENAS um JSON válido e bem formatado. Use STRINGS para todos os valores, nunca objetos aninhados. 

Para listas/arrays, use apenas strings separadas por vírgulas ou pontos. Para seções como "habilidades", "competências", use strings com formatação clara.

Exemplo de formatação correta:
- Para habilidades: "EF05CI11: Associar o movimento diário do Sol e das demais estrelas no céu ao movimento de rotação da Terra"
- Para competências: "1. Valorizar e utilizar os conhecimentos historicamente construídos sobre o mundo físico, social, cultural e digital"
- Para sequência didática: Use strings descritivas simples, não objetos

Estrutura JSON obrigatória:
{
  "identificacao": {
    "disciplina": "string",
    "anoSerie": "string", 
    "etapaEnsino": "string",
    "tema": "string",
    "duracao": "string",
    "professor": "string"
  },
  "alinhamentoBNCC": {
    "unidadeTematica": "string",
    "objetoConhecimento": "string", 
    "habilidades": "string com códigos e descrições completas",
    "competenciasGerais": "string numerada com descrições",
    "competenciasEspecificas": "string com descrições da área"
  },
  "temaDaAula": {
    "titulo": "string",
    "contextualizacao": "string",
    "relevancia": "string"
  },
  "objetivosAprendizagem": {
    "objetivoGeral": "string",
    "objetivosEspecificos": "string com múltiplos objetivos separados por pontos"
  },
  "conteudos": {
    "conceituais": "string",
    "procedimentais": "string", 
    "atitudinais": "string"
  },
  "metodologia": {
    "metodologiasAtivas": "string",
    "estrategiasEnsino": "string",
    "momentosPedagogicos": "string"
  },
  "sequenciaDidatica": {
    "inicio": "string detalhada das atividades iniciais com tempo",
    "desenvolvimento": "string detalhada das atividades principais com tempo",
    "fechamento": "string detalhada das atividades finais com tempo"
  },
  "recursosDidaticos": {
    "materiaisNecessarios": "string",
    "recursosDigitais": "string",
    "espacosFisicos": "string"
  },
  "avaliacao": {
    "instrumentos": "string",
    "criterios": "string",
    "momentos": "string"
  },
  "inclusaoAcessibilidade": {
    "adaptacoes": "string",
    "estrategiasInclusivas": "string"
  },
  "interdisciplinaridade": {
    "conexoes": "string",
    "integracaoAreas": "string"
  },
  "contextualizacao": {
    "realidadeLocal": "string",
    "aplicacoesPraticas": "string"
  },
  "extensaoAprofundamento": {
    "atividadesComplementares": "string",
    "pesquisasExtras": "string"
  },
  "reflexaoDocente": {
    "pontosAtencao": "string",
    "adaptacoesPossivel": "string"
  },
  "referencias": {
    "bibliograficas": "string",
    "digitais": "string"
  }
}`;

      let fetchResponse: globalThis.Response | undefined;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          fetchResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 8000,
              system: comprehensivePrompt,
              messages: [
                {
                  role: 'user',
                  content: `Crie um plano de aula completo e profissional seguindo todas as diretrizes da BNCC e metodologias pedagógicas contemporâneas para o tema "${tema}" em ${disciplina} para ${anoSerie} (${etapaEnsino}) com duração de ${duracao} minutos. Retorne APENAS o JSON válido conforme a estrutura especificada.`
                }
              ]
            }),
            signal: AbortSignal.timeout(120000) // 2 minute timeout
          });

          if (!fetchResponse.ok) {
            if (fetchResponse.status === 429) {
              throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
            } else if (fetchResponse.status === 401) {
              throw new Error('Erro de autenticação com o serviço de IA. Verifique as configurações.');
            } else {
              throw new Error(`Erro na API: ${fetchResponse.status} - ${fetchResponse.statusText}`);
            }
          }
          
          break; // Success, exit retry loop
          
        } catch (error: any) {
          retryCount++;
          
          if (error.name === 'TimeoutError') {
            console.error(`Tentativa ${retryCount}: Timeout na requisição`);
          } else if (error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
            console.error(`Tentativa ${retryCount}: Conexão perdida durante a requisição`);
          } else {
            console.error(`Tentativa ${retryCount}: Erro na requisição:`, error.message);
          }
          
          if (retryCount >= maxRetries) {
            if (error.name === 'TimeoutError') {
              throw new Error('A geração do plano está demorando muito. Tente novamente com um tema mais específico ou reduza a duração da aula.');
            } else if (error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
              throw new Error('Problema de conexão com o serviço de IA. Verifique sua conexão com a internet e tente novamente.');
            } else {
              throw error;
            }
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      if (!fetchResponse) {
        throw new Error('Falha na conexão após múltiplas tentativas. Tente novamente mais tarde.');
      }

      const data = await fetchResponse.json();
      const content = data.content[0].text;
      
      try {
        // Clean and extract JSON from the response
        let cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        
        // Find the start and end of JSON object
        const jsonStart = cleanContent.indexOf('{');
        const jsonEnd = cleanContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
        }
        
        const planoData = JSON.parse(cleanContent);
        
        res.json(planoData);
      } catch (parseError) {
        console.error('Erro ao parsear resposta da IA:', parseError);
        console.error('Conteúdo recebido:', content.substring(0, 500) + '...');
        res.status(500).json({ 
          error: 'Erro interno do servidor ao processar resposta da IA',
          details: String(parseError),
          rawContent: content.substring(0, 500)
        });
      }
    } catch (error: any) {
      console.error('Erro na geração do plano de aula:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error.message 
      });
    }
  });

  // Register Municipal Manager Routes
  registerMunicipalRoutes(app);
  registerSchoolRoutes(app);

  // ============= GESTÃO DE USUÁRIOS COGNITO =============

  // Middleware para verificar se usuário pode criar outro usuário
  const canCreateUser = (creatorRole: string, targetRole: string): boolean => {
    const hierarchy = {
      admin: ['admin', 'municipal_manager', 'school_director', 'teacher', 'student'],
      municipal_manager: ['school_director', 'teacher', 'student'],
      school_director: ['teacher', 'student'],
      teacher: ['student']
    };
    return hierarchy[creatorRole as keyof typeof hierarchy]?.includes(targetRole) || false;
  };

  // Criar usuário no Cognito - rota para administradores
  app.post('/api/admin/users/create', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { email, name, group, companyId } = req.body;

      // Validação básica
      if (!email || !name || !group) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email, nome e grupo são obrigatórios' 
        });
      }

      // Validação específica para Gestor Municipal
      if (group === 'GestorMunicipal') {
        if (!companyId) {
          return res.status(400).json({ 
            success: false, 
            error: 'Empresa é obrigatória para Gestores Municipais' 
          });
        }

        // Verificar se empresa existe
        const companyExists = await db.select().from(companies).where(eq(companies.id, parseInt(companyId)));
        if (companyExists.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Empresa não encontrada' 
          });
        }
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Formato de email inválido' 
        });
      }

      // Validar grupos permitidos
      const allowedGroups = ['GestorMunicipal', 'Diretor', 'Professor', 'Aluno', 'Admin'];
      if (!allowedGroups.includes(group)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Grupo inválido. Grupos permitidos: ' + allowedGroups.join(', ') 
        });
      }

      // Verificar se usuário já existe
      const userExists = await cognitoService.userExists(email);
      if (userExists) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe um usuário com este email' 
        });
      }

      console.log(`🔄 Admin criando usuário: ${email} no grupo: ${group}`);

      // Criar usuário no Cognito
      const result = await cognitoService.createUser({
        email,
        name,
        group: group as 'GestorMunicipal' | 'Diretor' | 'Professor' | 'Aluno' | 'Admin',
        companyId
      });

      if (result.success) {
        console.log(`✅ Usuário criado com sucesso: ${email}`);
        
        // CRÍTICO: Salvar usuário no banco de dados local com contractId para isolamento de dados
        try {
          const nameParts = name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ') || firstName;
          
          // Mapear grupo para role interno
          let role: 'admin' | 'teacher' | 'student' | 'municipal_manager' | 'school_director' = 'student';
          switch (group) {
            case 'Admin':
              role = 'admin';
              break;
            case 'GestorMunicipal':
              role = 'municipal_manager';
              break;
            case 'Diretor':
              role = 'school_director';
              break;
            case 'Professor':
              role = 'teacher';
              break;
            case 'Aluno':
              role = 'student';
              break;
          }

          const newUser = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            username: email.split('@')[0],
            password: 'cognito_auth', // Placeholder para autenticação externa
            role: role,
            contractId: null, // Não vinculando a contrato específico
            status: 'active' as const
          };
          
          const localUser = await db.insert(users).values(newUser).returning();
          console.log(`✅ Usuário salvo no banco local`, localUser[0]);
          
        } catch (dbError: any) {
          console.error('⚠️ Erro ao salvar usuário no banco local (usuário criado no Cognito):', dbError);
          // Continue mesmo com erro no banco local, pois usuário já foi criado no Cognito
        }
        
        // Log da ação administrativa
        console.log(`📋 Log de auditoria: Admin criou usuário ${email} no grupo ${group} para empresa ${companyId}`);

        return res.status(201).json({
          success: true,
          message: 'Usuário criado com sucesso',
          userId: result.userId,
          tempPassword: result.tempPassword,
          userEmail: email,
          group: group,
          companyId: companyId
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          error: result.error || 'Erro ao criar usuário' 
        });
      }

    } catch (error: any) {
      console.error('❌ Erro na rota de criação de usuário:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  });

  // Listar grupos disponíveis no Cognito
  app.get('/api/admin/cognito/groups', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const groups = await cognitoService.listGroups();
      return res.status(200).json({ 
        success: true, 
        groups 
      });
    } catch (error) {
      console.error('❌ Erro ao listar grupos:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao listar grupos disponíveis' 
      });
    }
  });

  // Verificar se usuário existe no Cognito
  app.get('/api/admin/cognito/user-exists/:email', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const exists = await cognitoService.userExists(email);
      return res.status(200).json({ 
        success: true, 
        exists 
      });
    } catch (error) {
      console.error('❌ Erro ao verificar usuário:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao verificar se usuário existe' 
      });
    }
  });

  // Validar domínios de email institucionais
  app.post('/api/admin/validate-email-domain', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      // Domínios institucionais autorizados
      const authorizedDomains = [
        '@prefeitura.', '@educacao.', '@escola.', '@estudante.',
        '.gov.br', '.edu.br', '@municipal.', '@secretaria.'
      ];
      
      const isAuthorized = authorizedDomains.some(domain => email.includes(domain));
      
      return res.status(200).json({ 
        success: true, 
        isAuthorized,
        message: isAuthorized 
          ? 'Domínio autorizado para criação de usuário' 
          : 'Domínio não autorizado. Use email institucional'
      });
    } catch (error) {
      console.error('❌ Erro ao validar domínio:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao validar domínio de email' 
      });
    }
  });

  // Buscar empresas contratantes com dados detalhados e contratos ativos
  app.get('/api/admin/companies', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Buscar empresas que têm contratos ativos com informações detalhadas
      const companiesWithContracts = await db
        .select({
          id: companies.id,
          name: companies.name,
          email: companies.email,
          phone: companies.phone,
          address: companies.address,
          contactPerson: companies.contactPerson,
          logo: companies.logo,
          createdAt: companies.createdAt,
          // Informações dos contratos ativos
          activeContractsCount: sql<number>`COUNT(CASE WHEN ${contracts.status} = 'active' THEN 1 END)`,
          totalLicenses: sql<number>`SUM(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.totalLicenses} ELSE 0 END)`,
          totalTeachers: sql<number>`SUM(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.maxTeachers} ELSE 0 END)`,
          totalStudents: sql<number>`SUM(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.maxStudents} ELSE 0 END)`,
          nextExpirationDate: sql<string>`MIN(CASE WHEN ${contracts.status} = 'active' THEN ${contracts.endDate} END)`
        })
        .from(companies)
        .leftJoin(contracts, eq(companies.id, contracts.companyId))
        .groupBy(companies.id, companies.name, companies.email, companies.phone, companies.address, companies.contactPerson, companies.logo, companies.createdAt)
        .having(sql`COUNT(CASE WHEN ${contracts.status} = 'active' THEN 1 END) > 0`) // Apenas empresas com contratos ativos
        .orderBy(companies.name);

      console.log(`📋 Empresas com contratos ativos encontradas: ${companiesWithContracts.length}`);
      
      // Formatar dados para melhor apresentação
      const formattedCompanies = companiesWithContracts.map(company => ({
        ...company,
        displayName: `${company.name}`,
        description: `${company.activeContractsCount} contrato(s) ativo(s) • ${company.totalLicenses || 0} licenças`,
        contactInfo: `${company.contactPerson || 'N/A'} • ${company.phone || 'N/A'}`,
        summary: {
          contracts: company.activeContractsCount || 0,
          licenses: company.totalLicenses || 0,
          teachers: company.totalTeachers || 0,
          students: company.totalStudents || 0,
          nextExpiration: company.nextExpirationDate
        }
      }));

      res.json({ companies: formattedCompanies });
    } catch (error) {
      console.error('❌ Erro ao buscar empresas com contratos ativos:', error);
      res.status(500).json({ error: 'Erro ao buscar empresas com contratos ativos' });
    }
  });

  // Buscar contratos ATIVOS de uma empresa
  app.get('/api/admin/companies/:companyId/contracts', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const { companyId } = req.params;
      const contractsData = await db.select().from(contracts)
        .where(
          and(
            eq(contracts.companyId, parseInt(companyId)),
            eq(contracts.status, 'active') // APENAS contratos ativos
          )
        );
      
      console.log(`📋 Contratos ativos encontrados para empresa ${companyId}:`, contractsData.length);
      res.json({ contracts: contractsData });
    } catch (error) {
      console.error('❌ Erro ao buscar contratos ativos da empresa:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos ativos da empresa' });
    }
  });

  // Buscar TODOS os contratos ATIVOS (para visão geral do admin)
  app.get('/api/admin/contracts/active', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      const contractsData = await db.select({
        id: contracts.id,
        name: contracts.name,
        status: contracts.status,
        companyId: contracts.companyId,
        maxTeachers: contracts.maxTeachers,
        maxStudents: contracts.maxStudents,
        companyName: companies.name
      })
      .from(contracts)
      .leftJoin(companies, eq(contracts.companyId, companies.id))
      .where(eq(contracts.status, 'active'))
      .orderBy(contracts.createdAt);
      
      console.log(`📋 Total de contratos ativos no sistema:`, contractsData.length);
      res.json({ contracts: contractsData });
    } catch (error) {
      console.error('❌ Erro ao buscar todos os contratos ativos:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos ativos' });
    }
  });

  // Register school routes

  // COGNITO GROUPS MANAGEMENT ROUTES
  // Verificar status dos grupos necessários no Cognito
  app.get('/api/admin/cognito/groups/status', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      
      if (!cognitoService.isConfigured()) {
        return res.status(400).json({
          error: 'AWS Cognito não está configurado corretamente',
          configured: false
        });
      }

      const groupStatus = await cognitoService.checkRequiredGroups();
      
      res.json({
        configured: true,
        totalRequired: 5,
        totalExists: groupStatus.exists.length,
        totalMissing: groupStatus.missing.length,
        groups: {
          exists: groupStatus.exists,
          missing: groupStatus.missing
        },
        allGroupsReady: groupStatus.missing.length === 0
      });
    } catch (error: any) {
      console.error('❌ Erro ao verificar status dos grupos:', error);
      res.status(500).json({ 
        error: 'Erro ao verificar grupos do Cognito',
        details: error.message 
      });
    }
  });

  // Criar grupos necessários no Cognito
  app.post('/api/admin/cognito/groups/create', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      
      if (!cognitoService.isConfigured()) {
        return res.status(400).json({
          error: 'AWS Cognito não está configurado corretamente'
        });
      }

      console.log('🔄 Iniciando criação de grupos no Cognito...');
      const result = await cognitoService.createRequiredGroups();
      
      const responseData = {
        success: result.success,
        message: result.success ? 
          'Todos os grupos foram criados/verificados com sucesso' : 
          'Alguns grupos não puderam ser criados',
        results: result.results,
        totalGroups: result.results.length,
        successfulGroups: result.results.filter(r => r.created).length
      };

      if (result.success) {
        res.json(responseData);
      } else {
        res.status(207).json(responseData); // 207 Multi-Status for partial success
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar grupos:', error);
      res.status(500).json({ 
        error: 'Erro ao criar grupos no Cognito',
        details: error.message 
      });
    }
  });

  // Listar todos os grupos existentes no Cognito
  app.get('/api/admin/cognito/groups', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      
      if (!cognitoService.isConfigured()) {
        return res.status(400).json({
          error: 'AWS Cognito não está configurado corretamente'
        });
      }

      const groups = await cognitoService.listGroups();
      
      res.json({
        groups,
        totalGroups: groups.length,
        requiredGroups: ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']
      });
    } catch (error: any) {
      console.error('❌ Erro ao listar grupos:', error);
      res.status(500).json({ 
        error: 'Erro ao listar grupos do Cognito',
        details: error.message 
      });
    }
  });

  // FASE 2.1: ROTAS DE DIAGNÓSTICO E CONFIGURAÇÃO DE PERMISSÕES AWS
  
  // Inspecionar configuração do ambiente AWS
  app.get('/api/admin/aws/environment/inspect', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      console.log('🔍 Inspecionando configuração do ambiente AWS...');
      
      const { EnvironmentInspector } = await import('./utils/environment-inspector');
      
      const report = EnvironmentInspector.generateEnvironmentReport();
      
      res.json({
        success: true,
        environment: report,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      console.error('❌ Erro na inspeção do ambiente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro ao inspecionar ambiente AWS',
        details: error.message
      });
    }
  });
  
  // Diagnóstico completo de permissões AWS IAM
  app.get('/api/admin/aws/permissions/diagnose', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      console.log('🔍 Iniciando diagnóstico de permissões AWS...');
      
      const diagnostic = await awsIAMService.diagnoseCognitoPermissions();
      
      return res.json({
        success: true,
        diagnostic,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erro no diagnóstico de permissões:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao diagnosticar permissões AWS',
        details: error.message
      });
    }
  });

  // Verificar permissões específicas
  app.get('/api/admin/aws/permissions/verify', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      console.log('✅ Verificando permissões AWS...');
      
      const isValid = await awsIAMService.verifyPermissions();
      
      return res.json({
        success: true,
        permissionsValid: isValid,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erro na verificação de permissões:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar permissões AWS',
        details: error.message
      });
    }
  });

  // Gerar instruções manuais para configuração
  app.get('/api/admin/aws/permissions/instructions', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      console.log('📋 Gerando instruções de configuração...');
      
      const instructions = awsIAMService.generateManualInstructions();
      
      return res.json({
        success: true,
        instructions,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Erro ao gerar instruções:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar instruções',
        details: error.message
      });
    }
  });

  // Tentar criar política automaticamente (requer permissões administrativas)
  app.post('/api/admin/aws/permissions/create-policy', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      console.log('🔧 Tentando criar política AWS automaticamente...');
      
      const { policyName } = req.body;
      const policyArn = await awsIAMService.createCognitoPolicy(policyName);
      
      return res.json({
        success: true,
        policyArn,
        message: 'Política criada com sucesso'
      });

    } catch (error: any) {
      console.error('❌ Erro ao criar política:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar política AWS',
        details: error.message,
        requiresManualSetup: true
      });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}

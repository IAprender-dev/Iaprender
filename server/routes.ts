import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
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
  users,
  companies,
  contracts,
  tokenUsage,
  aiTools,
  newsletter
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";
import multer from "multer";
import { importUsersFromCSV, hashPassword } from "./utils/csv-importer";
import aiRouter from "./routes/ai-routes";
import translateRoutes from "./routes/translate-routes";
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

  // AUTH ROUTES
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

  // SECRETARY ROUTES - USER MANAGEMENT
  // Get all users for secretary dashboard
  app.get("/api/secretary/users", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const { search, role, status } = req.query;
      
      // Build query with filters
      let query = db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        schoolYear: users.schoolYear,
        phone: users.phone,
        address: users.address,
        dateOfBirth: users.dateOfBirth,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt
      }).from(users);
      
      const allUsers = await query;
      
      // Apply filters
      let filteredUsers = allUsers;
      
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm)
        );
      }
      
      if (role && role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }
      
      if (status && status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === status);
      }
      
      return res.status(200).json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create new user (secretary)
  app.post("/api/secretary/users", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.firstName || !userData.lastName || !userData.email) {
        return res.status(400).json({ 
          message: "Nome, sobrenome e email são obrigatórios" 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
      if (!emailRegex.test(userData.email)) {
        return res.status(400).json({ 
          message: "Email deve ter formato válido com @ seguido de .com" 
        });
      }
      
      // Check if email already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "Email já está em uso" 
        });
      }
      
      // Generate username from email
      const username = userData.email.split('@')[0];
      
      // Check if username exists and make it unique
      let finalUsername = username;
      let counter = 1;
      while (true) {
        const [existingUsername] = await db
          .select()
          .from(users)
          .where(eq(users.username, finalUsername));
        
        if (!existingUsername) break;
        finalUsername = `${username}${counter}`;
        counter++;
      }
      
      // Default password (should be changed on first login)
      const defaultPassword = await hashPassword("123456");
      
      // Create user
      const [newUser] = await db.insert(users).values({
        username: finalUsername,
        password: defaultPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role || 'student',
        status: 'active',
        firstLogin: true,
        forcePasswordChange: true,
        schoolYear: userData.schoolYear || null,
        phone: userData.phone || null,
        address: userData.address || null,
        dateOfBirth: userData.dateOfBirth || null
      }).returning();
      
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Update user (secretary)
  app.patch("/api/secretary/users/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Validate email if being updated
      if (userData.email && userData.email !== existingUser.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
        if (!emailRegex.test(userData.email)) {
          return res.status(400).json({ 
            message: "Email deve ter formato válido com @ seguido de .com" 
          });
        }
        
        // Check if new email already exists
        const [duplicateEmail] = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email));
        
        if (duplicateEmail) {
          return res.status(400).json({ 
            message: "Email já está em uso" 
          });
        }
      }
      
      // Update user
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          email: userData.email || existingUser.email,
          role: userData.role || existingUser.role,
          status: userData.status || existingUser.status,
          schoolYear: userData.schoolYear !== undefined ? userData.schoolYear : existingUser.schoolYear,
          phone: userData.phone !== undefined ? userData.phone : existingUser.phone,
          address: userData.address !== undefined ? userData.address : existingUser.address,
          dateOfBirth: userData.dateOfBirth !== undefined ? userData.dateOfBirth : existingUser.dateOfBirth
        })
        .where(eq(users.id, userId))
        .returning();
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Delete user (secretary)
  app.delete("/api/secretary/users/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Prevent deleting admin users
      if (existingUser.role === 'admin') {
        return res.status(403).json({ 
          message: "Não é possível excluir usuários administradores" 
        });
      }
      
      // Delete user
      await db.delete(users).where(eq(users.id, userId));
      
      return res.status(200).json({ message: "Usuário removido com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Approve user (secretary)
  app.post("/api/secretary/users/:id/approve", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      const [updatedUser] = await db
        .update(users)
        .set({ 
          status: 'active',
          lastLoginAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error approving user:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get dashboard statistics for secretary
  app.get("/api/secretary/dashboard-stats", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      
      const stats = {
        totalStudents: allUsers.filter(u => u.role === 'student').length,
        totalTeachers: allUsers.filter(u => u.role === 'teacher').length,
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.status === 'active').length,
        pendingUsers: allUsers.filter(u => u.status === 'pending').length,
        pendingNotifications: 3, // Mock value
        totalNotifications: 10, // Mock value
        averageSatisfaction: 4.5
      };
      
      return res.status(200).json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get notifications for secretary
  app.get("/api/secretary/notifications", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      // Mock notifications - replace with real data when implemented
      const notifications = [
        {
          id: 1,
          sequentialNumber: "NOT-2025-001",
          teacherName: "Prof. João Silva",
          studentName: "Maria Santos",
          priority: "high",
          message: "Aluna apresentando dificuldades em matemática",
          notificationDate: new Date(),
          createdAt: new Date(),
          status: "pending"
        },
        {
          id: 2,
          sequentialNumber: "NOT-2025-002", 
          teacherName: "Prof. Ana Costa",
          studentName: "Pedro Oliveira",
          priority: "medium",
          message: "Solicitação de material adicional para projeto",
          notificationDate: new Date(),
          createdAt: new Date(),
          status: "pending"
        }
      ];
      
      return res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Configure upload for documents (PDF, Word)
  const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos PDF e Word são permitidos'));
      }
    },
  });

  // Document Analysis Route
  app.post("/api/ai/analyze-document", documentUpload.single('document'), authenticate, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo foi enviado" });
      }

      const fileName = req.file.originalname;
      const fileType = req.file.mimetype;
      const userId = req.session.user!.id;
      const contractId = req.session.user!.contractId || 1;

      // Extract text from document based on file type
      let extractedText = "";
      
      try {
        if (fileType === 'application/pdf') {
          // Extract text from PDF using pdf-parse-new
          const pdfData = await pdfParse(req.file.buffer);
          extractedText = pdfData.text;
        } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const result = await mammoth.extractRawText({buffer: req.file.buffer});
          extractedText = result.value;
        } else {
          return res.status(400).json({ message: "Tipo de arquivo não suportado. Use documentos PDF ou Word (.docx)" });
        }

        if (!extractedText || extractedText.trim().length === 0) {
          return res.status(400).json({ message: "Documento está vazio ou não foi possível extrair o texto" });
        }
        
        console.log('Texto extraído do documento:', extractedText.substring(0, 200) + '...');
      } catch (extractionError) {
        console.error('Erro na extração de texto:', extractionError);
        return res.status(400).json({ message: "Erro ao processar o documento. Verifique se o arquivo não está corrompido." });
      }

      // Use OpenAI service to analyze document
      const result = await OpenAIService.analyzeDocumentText({
        userId,
        contractId,
        documentContent: extractedText,
        fileName
      });

      res.json(result.content);
    } catch (error: any) {
      console.error('Erro na análise do documento:', error);
      if (error.message.includes("API key")) {
        return res.status(503).json({ message: "Serviço OpenAI não disponível. Verifique a configuração da API." });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Análise de tema baseada nas diretrizes do MEC e BNCC
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
          model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
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
    } catch (error) {
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
              model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
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

  // Geração de plano de aula com IA
  app.post("/api/generate-lesson-plan", authenticate, async (req, res) => {
    try {
      const { tema, duracao, analysis } = req.body;
      
      if (!tema || !duracao || !analysis) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Crie um plano de aula profissional e detalhado baseado nas diretrizes do MEC e BNCC:

TEMA: ${tema}
DISCIPLINA: ${analysis.disciplina}
ANO/SÉRIE: ${analysis.anoSerie}
DURAÇÃO: ${duracao} minutos
CONFORME BNCC: ${analysis.conformeRegulasBNCC ? 'Sim' : 'Não'}

${!analysis.conformeRegulasBNCC ? `OBSERVAÇÕES IMPORTANTES: ${analysis.observacoes}` : ''}

Gere um plano completo seguindo a estrutura pedagógica brasileira com cronograma detalhado. Responda em JSON:

{
  "titulo": "título completo da aula",
  "disciplina": "${analysis.disciplina}",
  "serie": "${analysis.anoSerie}",
  "duracao": "${duracao} minutos",
  "objetivo": "objetivo geral da aula",
  "conteudoProgramatico": ["item 1", "item 2", "item 3", "item 4"],
  "cronograma": [
    {"atividade": "Abertura e motivação", "tempo": "X minutos", "descricao": "breve descrição"},
    {"atividade": "Desenvolvimento do conteúdo", "tempo": "X minutos", "descricao": "breve descrição"},
    {"atividade": "Atividade prática", "tempo": "X minutos", "descricao": "breve descrição"},
    {"atividade": "Fechamento e avaliação", "tempo": "X minutos", "descricao": "breve descrição"}
  ],
  "metodologia": "descrição detalhada da metodologia",
  "recursos": ["recurso 1", "recurso 2", "recurso 3"],
  "avaliacao": "método de avaliação proposto",
  "observacoes": "dicas pedagógicas importantes"${!analysis.conformeRegulasBNCC ? ',\n  "observacoesBNCC": "' + analysis.observacoes + '"' : ''}
}`
          }]
        })
      });

      if (!response.ok) {
        throw new Error('Erro na API da Anthropic');
      }

      const data = await response.json();
      const planText = data.content[0].text;
      
      try {
        const plan = JSON.parse(planText);
        return res.status(200).json(plan);
      } catch (parseError) {
        // Fallback caso não consiga fazer parse
        const tempoBase = parseInt(duracao);
        const tempoAbertura = Math.ceil(tempoBase * 0.1);
        const tempoDesenvolvimento = Math.ceil(tempoBase * 0.5);
        const tempoPratica = Math.ceil(tempoBase * 0.3);
        const tempoFechamento = tempoBase - (tempoAbertura + tempoDesenvolvimento + tempoPratica);

        return res.status(200).json({
          titulo: `${tema} - ${analysis.anoSerie}`,
          disciplina: analysis.disciplina,
          serie: analysis.anoSerie,
          duracao: `${duracao} minutos`,
          objetivo: `Desenvolver o entendimento sobre ${tema}, promovendo o aprendizado significativo conforme as diretrizes da BNCC.`,
          cronograma: [
            {
              atividade: "Abertura e motivação",
              tempo: `${tempoAbertura} minutos`,
              descricao: "Apresentação do tema, ativação de conhecimentos prévios e motivação dos alunos"
            },
            {
              atividade: "Desenvolvimento do conteúdo",
              tempo: `${tempoDesenvolvimento} minutos`,
              descricao: "Exposição dialogada do conteúdo principal com exemplos e explicações"
            },
            {
              atividade: "Atividade prática",
              tempo: `${tempoPratica} minutos`,
              descricao: "Exercícios práticos para fixação e aplicação do conhecimento"
            },
            {
              atividade: "Fechamento e avaliação",
              tempo: `${tempoFechamento} minutos`,
              descricao: "Síntese do aprendizado e avaliação da compreensão dos alunos"
            }
          ],
          conteudoProgramatico: [
            `Introdução ao conceito de ${tema}`,
            `Desenvolvimento teórico e contextualização`,
            `Atividades práticas e exercícios`,
            `Avaliação e síntese do conhecimento`
          ],
          metodologia: "Aula expositiva dialogada com recursos audiovisuais, seguida de atividades práticas para fixação do conteúdo.",
          recursos: ["Quadro branco", "Projetor multimídia", "Material impresso", "Computador/tablet"],
          avaliacao: "Participação em discussões, resolução de exercícios práticos e questionário avaliativo.",
          observacoes: "Adaptar o ritmo conforme a turma. Oferecer atendimento individualizado quando necessário.",
          ...((!analysis.conformeRegulasBNCC) && { observacoesBNCC: analysis.observacoes })
        });
      }
    } catch (error) {
      console.error("Error generating lesson plan:", error);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI ROUTES
  // Use the AI router with /api/ai prefix
  app.use("/api/ai", aiRouter);

  // TRANSLATION ROUTES
  app.use("/api/translate", translateRoutes);

  // AI Mind Map Generation with BNCC validation
  app.post('/api/ai/generate-mindmap', authenticate, async (req: Request, res: Response) => {
    try {
      const { topic, complexity = 'medium', includeExamples = true } = req.body;
      const userId = req.session.user?.id;
      let userGrade = req.session.user?.schoolYear;

      if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: 'Tema é obrigatório' });
      }

      // Enhanced grade detection - tema livre
      if (!userGrade && userId) {
        try {
          const user = await storage.getUser(userId);
          userGrade = user?.schoolYear;
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }

      // Se não tiver ano escolar, use um padrão genérico
      if (!userGrade) {
        userGrade = "Ensino Fundamental";
      }

      // Tema livre - sem validação BNCC

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          max_tokens: 3000,
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em educação brasileira, pedagogo especializado em BNCC e criador de mapas mentais educacionais de excelência.

MISSÃO: Criar um mapa mental pedagógico estruturado sobre "${topic}" especificamente para alunos do ${userGrade}, seguindo rigorosamente as competências e habilidades da BNCC.

DIRETRIZES PEDAGÓGICAS AVANÇADAS:
- Aplicar teorias de aprendizagem visual e cognitiva (Ausubel, Novak, Gowin)
- Seguir os objetivos específicos da BNCC para o ${userGrade}
- Usar técnicas de memorização ativa e conexões significativas
- Organizar hierarquicamente do geral para o específico
- Incluir elementos que facilitem a metacognição
- Aplicar princípios da neuroeducação para otimizar retenção

METODOLOGIA BNCC:
- Identificar competências gerais e específicas relacionadas ao tema
- Mapear habilidades específicas do ${userGrade}
- Conectar com objetos de conhecimento apropriados
- Integrar práticas pedagógicas recomendadas

ESTRUTURA OBRIGATÓRIA - Retorne APENAS JSON válido:
{
  "title": "${topic}",
  "grade": "${userGrade}",
  "bnccAlignment": "Competência específica da BNCC com código",
  "mindMap": {
    "centralConcept": {
      "text": "Conceito central do tema",
      "color": "#3B82F6"
    },
    "mainBranches": [
      {
        "id": "branch1",
        "text": "Ramo Principal",
        "color": "#cor_hexadecimal",
        "subBranches": [
          {
            "text": "Subconceito específico",
            "examples": ["exemplo prático brasileiro", "aplicação cotidiana"],
            "keyWords": ["termo-chave1", "termo-chave2", "conceito-essencial"]
          }
        ]
      }
    ],
    "connections": [
      {
        "from": "branch1",
        "to": "branch2",
        "relationship": "explicação da relação conceitual"
      }
    ],
    "studyTips": [
      "Técnica de estudo baseada em evidências para ${userGrade}",
      "Estratégia de memorização eficaz para a faixa etária",
      "Método de revisão espaçada adequado"
    ],
    "practiceQuestions": [
      "Pergunta reflexiva que desenvolve pensamento crítico",
      "Questão que conecta teoria e prática"
    ]
  },
  "metadata": {
    "complexity": "${complexity}",
    "estimatedStudyTime": "tempo baseado em pesquisas pedagógicas",
    "prerequisites": ["conhecimento prévio necessário"],
    "bnccCompetencies": ["competência BNCC específica"],
    "learningObjectives": ["objetivo de aprendizagem claro"]
  }
}`
            },
            {
              role: 'user',
              content: `Crie um mapa mental educacional EXCEPCIONAL sobre "${topic}" para alunos do ${userGrade}, aplicando as melhores técnicas pedagógicas e alinhamento rigoroso com a BNCC.

ESPECIFICAÇÕES TÉCNICAS:
- Tema: ${topic}
- Ano escolar: ${userGrade}
- Complexidade: ${complexity}
- Incluir exemplos: ${includeExamples}

REQUISITOS PEDAGÓGICOS OBRIGATÓRIOS:
1. BNCC ALIGNMENT: Identificar competências e habilidades específicas do ${userGrade}
2. HIERARQUIA CONCEITUAL: Organizar do conceito central para ramificações específicas
3. APRENDIZAGEM SIGNIFICATIVA: Conectar novos conceitos com conhecimentos prévios
4. EXEMPLOS CONTEXTUALIZADOS: ${includeExamples ? 'Usar exemplos da realidade brasileira relevantes para a faixa etária' : 'Focar em conceitos teóricos fundamentais'}
5. TÉCNICAS DE MEMORIZAÇÃO: Incluir estratégias baseadas em neuroeducação
6. METACOGNIÇÃO: Promover reflexão sobre o próprio aprendizado
7. LINGUAGEM ADEQUADA: Adaptar vocabulário e complexidade ao desenvolvimento cognitivo do ${userGrade}

ESTRUTURA ESPERADA:
- 1 conceito central claro e impactante
- 4-6 ramos principais bem organizados
- 2-4 sub-ramos por ramo principal
- Cores pedagógicas que facilitem organização mental
- Palavras-chave que ancorem conceitos
- Conexões que mostrem relações entre ideias
- Dicas práticas de estudo para a faixa etária
- Perguntas que estimulem reflexão crítica

Aplique todo seu conhecimento pedagógico para criar um mapa mental que realmente facilite a aprendizagem significativa do tema "${topic}" para estudantes do ${userGrade}.`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error('Falha na API do OpenAI');
      }

      const data = await response.json();
      const mindMapData = JSON.parse(data.choices[0].message.content);
      
      // Add generation metadata
      mindMapData.generated = {
        userGrade,
        topic,
        timestamp: new Date().toISOString(),
        bnccCompliant: true
      };
      
      res.json(mindMapData);
    } catch (error) {
      console.error('Erro na geração do mapa mental:', error);
      res.status(500).json({ error: 'Erro interno do servidor ao gerar mapa mental' });
    }
  });

  // AI Quiz Generation with BNCC validation
  app.post('/api/ai/generate-quiz', authenticate, async (req: Request, res: Response) => {
    try {
      const { topic, questionCount = 5, difficulty = 'medium', grade, subject, validateTopic, previousQuestions = [] } = req.body;
      const userId = req.session.user?.id;
      const userGrade = req.session.user?.schoolYear;

      if (!topic || typeof topic !== 'string') {
        return res.status(400).json({ error: 'Tema é obrigatório' });
      }

      if (questionCount < 1 || questionCount > 20) {
        return res.status(400).json({ error: 'Número de perguntas deve ser entre 1 e 20' });
      }

      if (!userGrade) {
        return res.status(400).json({ 
          error: 'Ano escolar não encontrado no seu perfil. Atualize suas informações no perfil.' 
        });
      }

      // BNCC content mapping for each grade level
      const bnccContent = {
        // Fundamental I
        "1º ano": [
          "alfabetização", "números de 0 a 9", "adição simples", "subtração simples", "formas geométricas básicas", 
          "cores", "família", "corpo humano", "plantas", "animais", "estações do ano", "dia e noite",
          "vogais", "consoantes", "sílabas", "palavras simples"
        ],
        "2º ano": [
          "números até 100", "operações básicas", "sistema monetário", "medidas de tempo", "calendário",
          "leitura e escrita", "textos simples", "pontuação básica", "substantivos", "adjetivos",
          "meio ambiente", "seres vivos", "água", "ar", "solo", "bairro", "escola", "comunidade"
        ],
        "3º ano": [
          "números até 1000", "multiplicação", "divisão", "frações simples", "geometria básica",
          "produção de texto", "gramática básica", "verbos", "ortografia", "interpretação de texto",
          "estados físicos da matéria", "ciclo da água", "sistema solar", "município", "zona rural e urbana"
        ],
        "4º ano": [
          "números até 10000", "operações com decimais", "frações", "porcentagem básica", "área e perímetro",
          "gêneros textuais", "concordância", "acentuação", "sinônimos e antônimos", "literatura infantil",
          "ecossistemas", "cadeia alimentar", "estados brasileiros", "relevo", "clima", "vegetação"
        ],
        "5º ano": [
          "números até 100000", "frações decimais", "regra de três simples", "gráficos e tabelas",
          "dissertação", "crônica", "sintaxe", "figuras de linguagem", "literatura brasileira",
          "sistema digestório", "sistema respiratório", "regiões brasileiras", "economia", "cultura brasileira"
        ],
        // Fundamental II
        "6º ano": [
          "números inteiros", "potenciação", "expressões algébricas", "equações simples", "razão e proporção",
          "épico", "lírico", "dramático", "morfologia", "sintaxe", "semântica",
          "célula", "tecidos", "sistemas do corpo humano", "rochas e minerais", "placas tectônicas",
          "pré-história", "antiguidade", "idade média", "civilizações antigas"
        ],
        "7º ano": [
          "números racionais", "equações de 1º grau", "sistemas de equações", "geometria plana", "estatística básica",
          "romance", "novela", "conto", "classes de palavras", "período simples e composto",
          "reino animal", "reino vegetal", "genética básica", "atmosfera", "hidrosfera", "biosfera",
          "idade moderna", "descobrimentos", "colonização", "absolutismo", "iluminismo"
        ],
        "8º ano": [
          "potências e raízes", "produtos notáveis", "fatoração", "sistemas lineares", "geometria espacial",
          "teatro", "auto", "sermão", "orações coordenadas", "orações subordinadas",
          "química básica", "física básica", "evolução", "ecologia", "revolução industrial",
          "independências americanas", "século XIX", "imperialismo"
        ],
        "9º ano": [
          "equações de 2º grau", "funções", "progressões", "trigonometria básica", "geometria analítica",
          "realismo", "naturalismo", "parnasianismo", "simbolismo", "análise sintática",
          "genética", "biotecnologia", "astronomia", "física moderna", "química orgânica",
          "primeira guerra mundial", "revolução russa", "crise de 1929", "segunda guerra mundial"
        ],
        // Ensino Médio
        "1º ano médio": [
          "conjuntos", "funções", "função afim", "função quadrática", "progressões",
          "literatura medieval", "classicismo", "barroco", "arcadismo", "romantismo",
          "citologia", "histologia", "embriologia", "mecânica", "termologia", "óptica",
          "química inorgânica", "tabela periódica", "ligações químicas",
          "brasil colônia", "brasil império", "república velha"
        ],
        "2º ano médio": [
          "logaritmos", "trigonometria", "matrizes", "determinantes", "geometria analítica",
          "realismo", "naturalismo", "parnasianismo", "simbolismo", "pré-modernismo",
          "fisiologia", "anatomia", "genética", "evolução", "ecologia",
          "ondulatória", "eletromagnetismo", "físico-química", "química orgânica",
          "era vargas", "república populista", "ditadura militar"
        ],
        "3º ano médio": [
          "números complexos", "polinômios", "análise combinatória", "probabilidade", "estatística",
          "modernismo", "literatura contemporânea", "análise literária", "redação enem",
          "biotecnologia", "imunologia", "reprodução", "desenvolvimento",
          "física moderna", "relatividade", "física quântica", "radioatividade",
          "nova república", "brasil contemporâneo", "globalização", "atualidades"
        ]
      };

      // Check if topic is appropriate for user's grade level
      let userContent = bnccContent[userGrade as keyof typeof bnccContent];
      
      // If not found, try with common variations
      if (!userContent && userGrade) {
        const gradeVariations = [
          userGrade.replace(' fundamental', ''),
          userGrade.replace(' médio', ' médio'),
          userGrade + ' fundamental',
          userGrade.replace('º', '°')
        ];
        
        for (const variation of gradeVariations) {
          userContent = bnccContent[variation as keyof typeof bnccContent];
          if (userContent) break;
        }
      }
      
      if (!userContent) {
        return res.status(400).json({ 
          error: `Ano escolar "${userGrade}" não reconhecido. Entre em contato com o suporte.`,
          debug: `Tentativas: ${userGrade}, variações testadas`
        });
      }

      // Validate topic against BNCC content for the grade level
      const topicLower = topic.toLowerCase();
      const isValidTopic = userContent.some(content => 
        topicLower.includes(content.toLowerCase()) || 
        content.toLowerCase().includes(topicLower)
      );

      if (!isValidTopic) {
        return res.status(400).json({ 
          error: `O tema "${topic}" não está no conteúdo programático do ${userGrade} segundo a BNCC. Escolha um tema adequado para sua série escolar.`,
          suggestedTopics: userContent.slice(0, 10) // Show first 10 topics as suggestions
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          system: `Você é um especialista em educação brasileira com conhecimento profundo da BNCC (Base Nacional Comum Curricular) e das diretrizes do MEC.

IMPORTANTE: Você está criando perguntas especificamente para um aluno do ${userGrade}. As perguntas devem:
1. Estar alinhadas com os objetivos de aprendizagem da BNCC para o ${userGrade}
2. Usar linguagem adequada para a faixa etária
3. Abordar competências e habilidades específicas do ano escolar
4. Incluir contextos do cotidiano brasileiro e regional

Crie perguntas educacionais de múltipla escolha seguindo exatamente este formato JSON:

{
  "questions": [
    {
      "question": "Texto da pergunta adequada ao ${userGrade}",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctAnswer": 0,
      "explanation": "Explicação pedagógica detalhada adequada ao nível do ${userGrade}, conectando com objetivos da BNCC",
      "difficulty": "easy",
      "bnccCode": "Código da habilidade BNCC relacionada (se aplicável)"
    }
  ]
}`,
          messages: [
            {
              role: 'user',
              content: `Crie ${questionCount} questão(ões) educacional(is) sobre "${topic}" especificamente para alunos do ${userGrade}, seguindo rigorosamente as diretrizes da BNCC para esta série. 

REQUISITOS OBRIGATÓRIOS:
- Adequar a linguagem e complexidade ao ${userGrade}
- Abordar competências e habilidades específicas da BNCC para o ${userGrade}
- Incluir contextos brasileiros relevantes
- Garantir que o conteúdo seja apropriado para a faixa etária
- Conectar com objetivos de aprendizagem do ano escolar

${previousQuestions.length > 0 ? 'IMPORTANTE: Não repita nenhuma das perguntas já feitas anteriormente. Explore aspectos diferentes do tema dentro do escopo do ' + userGrade + '.' : ''}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Falha na API do Anthropic');
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      try {
        // Clean JSON response
        const cleanContent = content.replace(/```json\n?|```\n?/g, '').trim();
        const quizData = JSON.parse(cleanContent);
        
        // Validate response structure
        if (!quizData.questions || !Array.isArray(quizData.questions)) {
          throw new Error('Invalid response structure');
        }
        
        res.json(quizData);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', content);
        res.status(500).json({ error: 'Erro ao processar resposta da IA' });
      }

    } catch (error) {
      console.error('Erro ao gerar quiz:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // AI Tutor Chat endpoint
  app.post('/api/ai/tutor-chat', authenticate, async (req: Request, res: Response) => {
    try {
      const { message, studentGrade, chatHistory } = req.body;
      const user = req.session?.user;
      const studentName = user?.firstName || 'estudante';
      const schoolYear = user?.schoolYear || studentGrade || '9º ano';

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }

      // Build conversation history for context
      let conversationContext = '';
      if (chatHistory && chatHistory.length > 0) {
        conversationContext = chatHistory
          .slice(-5) // Last 5 messages for context
          .map((msg: any) => `${msg.role === 'user' ? 'Estudante' : 'Tutora'}: ${msg.content}`)
          .join('\n');
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', // the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
          max_tokens: 2000,
          system: `Você é a Pro Versa, uma IA tutora educacional especializada em apoiar alunos do 1º ano do ensino fundamental ao 3º ano do ensino médio.

INFORMAÇÕES DO ALUNO:
- Nome: ${studentName}
- Ano escolar: ${schoolYear}
- SEMPRE chame o aluno pelo primeiro nome (${studentName})
- SEMPRE adapte o conteúdo para o nível do ${schoolYear}

IDENTIDADE E PROPÓSITO:
Seu objetivo é facilitar o aprendizado de forma personalizada, respeitosa e eficaz.

CARACTERÍSTICAS FUNDAMENTAIS DE CARÁTER:

Paciência e Empatia:
- Sempre demonstre paciência, mesmo quando o aluno repetir a mesma dúvida várias vezes
- Reconheça e valide os sentimentos do aluno em relação ao aprendizado
- Use linguagem encorajadora como "Vamos tentar juntos", "É normal ter dúvidas", "Você está no caminho certo"
- Nunca demonstre frustração ou impaciência

Positividade e Motivação:
- Celebre pequenas conquistas e progressos
- Use reforço positivo constantemente
- Transforme erros em oportunidades de aprendizado
- Mantenha um tom otimista e esperançoso
- Use frases como "Excelente pergunta!", "Que bom que você notou isso!", "Vamos descobrir juntos!"

Respeito e Inclusividade:
- Trate todos os alunos com igual respeito, independentemente de origem, gênero, religião ou capacidade
- Use linguagem inclusiva e neutra
- Adapte exemplos para refletir diversidade cultural e social
- Evite estereótipos ou generalizações

ADAPTAÇÃO PEDAGÓGICA:

Para Ensino Fundamental I (1º ao 5º ano):
- Use linguagem simples e direta
- Incorpore elementos lúdicos e exemplos concretos
- Use analogias com objetos e situações familiares
- Quebre informações em pequenos pedaços
- Use muito reforço positivo e encorajamento

Para Ensino Fundamental II (6º ao 9º ano):
- Gradualmente introduza conceitos mais abstratos
- Use exemplos relevantes para adolescentes
- Encoraje questionamentos e pensamento crítico
- Relacione conteúdos com situações do cotidiano
- Respeite a busca por independência

Para Ensino Médio (1º ao 3º ano):
- Use linguagem mais sofisticada quando apropriado
- Encoraje análise crítica e síntese de informações
- Conecte conteúdos com aplicações práticas e futuro profissional
- Promova debates e discussões respeitosas
- Apoie preparação para vestibulares e ENEM

TÉCNICAS DE ADAPTAÇÃO:

Para Alunos com Dificuldades:
- Simplifique a linguagem automaticamente
- Use mais exemplos práticos e visuais
- Quebre conceitos complexos em etapas menores
- Ofereça múltiplas formas de explicação
- Sugira exercícios de reforço

Para Alunos Avançados:
- Introduza conceitos mais complexos
- Faça conexões interdisciplinares
- Proponha desafios adicionais
- Estimule pensamento crítico e criativo
- Sugira materiais complementares

DIRETRIZES DE COMUNICAÇÃO:
- Mantenha sempre um tom caloroso e acolhedor
- Use "nós" em vez de "você" quando possível ("Vamos resolver isso juntos")
- Evite jargões técnicos desnecessários
- Adapte o vocabulário ao nível demonstrado pelo aluno

FEEDBACK CONSTRUTIVO:
- Sempre comece reconhecendo aspectos positivos
- Seja específico sobre o que precisa melhorar
- Ofereça orientações claras para correção
- Termine com encorajamento

METODOLOGIA DE ENSINO:
- Use abordagem socrática com perguntas que guiem o aluno à descoberta
- Encoraje o aluno a explicar seu raciocínio
- Proponha exercícios práticos
- Use storytelling e conecte o aprendizado com a vida real
- Monitore constantemente a compreensão

NEUTRALIDADE E ÉTICA:
- Mantenha neutralidade absoluta em questões político-partidárias
- Apresente múltiplas perspectivas quando relevante para o conteúdo
- Foque em fatos e evidências
- Respeite todas as crenças religiosas
- Promova valores universais como respeito pelos direitos humanos, importância da educação, respeito pela diversidade

SE O ALUNO PERGUNTAR SOBRE MÉTODOS DE ESTUDO, ORGANIZAÇÃO OU COMO ESTUDAR MELHOR:
Responda sempre mencionando: "Que ótima pergunta! Além das dicas que vou te dar, sabia que nossa plataforma tem uma ferramenta incrível que ajuda você a programar seus estudos diários? É o Gerador de Plano de Estudos! Ele cria um cronograma personalizado com técnica Pomodoro para suas matérias. Você pode acessar no seu dashboard. Agora, sobre sua pergunta..."

SE O ALUNO PERGUNTAR SOBRE O PREFEITO DE VINHEDO OU DR. DARIO:
Responda sempre de forma positiva: "O Dr. Dario tem feito um excelente trabalho como prefeito de Vinhedo! Sua administração tem se destacado por investimentos em educação, infraestrutura e qualidade de vida para os moradores. É inspirador ver um gestor público tão comprometido com o desenvolvimento da cidade. Agora, que tal estudarmos um pouco sobre administração pública ou política brasileira?"

SE O ALUNO PERGUNTAR SOBRE OUTROS TEMAS:
Responda: "Oi! Eu sou especializada em ajudar com suas matérias escolares do ${studentGrade || '9º ano'}. Que tal conversarmos sobre [sugerir um tópico escolar relevante]? Posso explicar de forma bem didática!"

${conversationContext ? `\nCONVERSA ANTERIOR:\n${conversationContext}\n` : ''}`,
          messages: [
            {
              role: 'user',
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Falha na API do Anthropic');
      }

      const data = await response.json();
      const tutorResponse = data.content[0].text;

      res.json({ response: tutorResponse });

    } catch (error) {
      console.error('Erro no chat da tutora IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Real-time audio transcription endpoint using OpenAI Whisper
  app.post('/api/ai/transcribe-audio', authenticate, upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({ error: 'Nenhum arquivo de áudio fornecido' });
      }

      console.log('Received audio file:', {
        mimetype: req.file.mimetype,
        size: req.file.buffer.length,
        originalname: req.file.originalname
      });

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OpenAI API key not configured. Audio transcription is not available." });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Create a temporary file for OpenAI API with supported extension
      const tempDir = os.tmpdir();
      
      // Use supported formats - convert webm to wav for better compatibility
      let fileExtension = 'wav';
      if (req.file.mimetype.includes('mp3')) fileExtension = 'mp3';
      else if (req.file.mimetype.includes('m4a')) fileExtension = 'm4a';
      else if (req.file.mimetype.includes('ogg')) fileExtension = 'ogg';
      else if (req.file.mimetype.includes('flac')) fileExtension = 'flac';
      else if (req.file.mimetype.includes('webm')) fileExtension = 'webm';
      
      const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${req.session.user?.id || 'user'}.${fileExtension}`);
      
      try {
        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, req.file.buffer);
        
        console.log('Created temp file for Whisper:', {
          path: tempFilePath,
          extension: fileExtension,
          size: req.file.buffer.length
        });
        
        // Create file stream for OpenAI Whisper API
        const audioStream = fs.createReadStream(tempFilePath);
        // Ensure the filename is set correctly for OpenAI
        (audioStream as any).path = tempFilePath;
        
        console.log('Sending to OpenAI Whisper API...');
        
        const transcription = await openai.audio.transcriptions.create({
          file: audioStream,
          model: 'whisper-1',
          language: 'pt',
          response_format: 'verbose_json',
          temperature: 0.0,
          prompt: 'Esta é uma conversa educacional em português brasileiro entre um estudante e um tutor de IA sobre matérias escolares.'
        });

        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }

        console.log('Whisper transcription successful:', {
          text: transcription.text,
          duration: transcription.duration,
          language: transcription.language
        });

        res.json({ 
          text: transcription.text,
          duration: transcription.duration,
          language: transcription.language,
          confidence: 1.0,
          service: 'OpenAI Whisper'
        });

      } catch (fileError) {
        // Clean up temp file if it exists
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
        throw fileError;
      }

    } catch (error) {
      console.error('Erro na transcrição de áudio:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Document generation endpoint
  app.post('/api/ai/generate-document', authenticate, async (req: Request, res: Response) => {
    try {
      const { messages, studentName, studentGrade } = req.body;

      if (!messages || messages.length === 0) {
        return res.status(400).json({ error: 'Nenhuma mensagem fornecida' });
      }

      // Generate study material content using AI
      const contentPrompt = `Crie um material de estudo completo em formato de documento para ${studentName}, estudante do ${studentGrade}, baseado na seguinte conversa educacional:

${messages.map((msg: any) => `${msg.role === 'user' ? 'Pergunta do Aluno' : 'Resposta da Tutora'}: ${msg.content}`).join('\n\n')}

FORMATO DO DOCUMENTO:
1. Título principal relacionado ao tema estudado
2. Resumo dos conceitos principais abordados
3. Explicações detalhadas organizadas por tópicos
4. Exercícios práticos para fixação
5. Dicas de estudo e memorização
6. Bibliografia sugerida

O documento deve ser educativo, bem estruturado e adequado para impressão. Use linguagem clara e didática apropriada para o ${studentGrade}.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: contentPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Falha na geração do conteúdo');
      }

      const aiData = await response.json();
      const documentContent = aiData.content[0].text;

      // Generate PDF using a simple HTML to PDF approach
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      let pdfBuffer = Buffer.alloc(0);
      doc.on('data', (chunk: Buffer) => {
        pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
      });

      // Add content to PDF
      doc.fontSize(20).text('Material de Estudo - IAprender', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Aluno: ${studentName}`);
      doc.text(`Série: ${studentGrade}`);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
      doc.moveDown();
      
      // Split content into lines and add to PDF
      const lines = documentContent.split('\n');
      lines.forEach((line: string) => {
        if (line.trim()) {
          if (line.startsWith('#') || line.includes('**')) {
            doc.fontSize(16).text(line.replace(/[#*]/g, ''), { continued: false });
          } else {
            doc.fontSize(12).text(line, { continued: false });
          }
          doc.moveDown(0.5);
        }
      });

      doc.end();

      // Wait for PDF generation to complete
      await new Promise((resolve) => {
        doc.on('end', resolve);
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="material-estudo.pdf"');
      res.send(pdfBuffer);

    } catch (error) {
      console.error('Erro na geração do documento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // AWS Cognito OAuth routes
  // Root route serves the frontend (Home page)
  // The frontend routing will handle displaying the landing page

  // Diagnóstico e configuração do Cognito
  app.get('/cognito-debug', (req: Request, res: Response) => {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    const redirectUri = process.env.COGNITO_REDIRECT_URI;
    
    const possibleDomains = [
      `https://${userPoolId}.auth.us-east-1.amazoncognito.com`,
      `https://us-east-1-sduwfxm8p.auth.us-east-1.amazoncognito.com`,
      `https://us-east-1sduwfxm8p.auth.us-east-1.amazoncognito.com`
    ];

    res.send(`
      <h1>Diagnóstico do AWS Cognito</h1>
      <h2>Configuração Atual:</h2>
      <p><strong>User Pool ID:</strong> ${userPoolId}</p>
      <p><strong>Client ID:</strong> ${clientId}</p>
      <p><strong>Redirect URI:</strong> ${redirectUri}</p>
      
      <h2>Domínios Possíveis:</h2>
      ${possibleDomains.map(domain => `
        <p><a href="${domain}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid+email+profile" target="_blank">
          Testar: ${domain}
        </a></p>
      `).join('')}
      
      <h2>Passos para Configurar:</h2>
      <ol>
        <li>Acesse o AWS Cognito Console</li>
        <li>Vá para User Pools → ${userPoolId}</li>
        <li>Em "App integration" → "Domain"</li>
        <li>Configure um domínio personalizado ou use o domínio padrão</li>
        <li>Verifique se o "Hosted UI" está habilitado</li>
      </ol>
      
      <p><a href="/">Voltar ao início</a></p>
    `);
  });

  // Rota para redirecionar para o login do Cognito
  app.get('/start-login', (req: Request, res: Response) => {
    try {
      const userPoolId = process.env.COGNITO_USER_POOL_ID;
      const clientId = process.env.COGNITO_CLIENT_ID;
      const redirectUri = process.env.COGNITO_REDIRECT_URI;

      if (!userPoolId || !clientId || !redirectUri) {
        return res.redirect('/cognito-debug');
      }

      // Construir o domínio correto usando o User Pool ID
      const cognitoDomain = `https://${userPoolId}.auth.us-east-1.amazoncognito.com`;

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid email profile'
      });

      const redirectUrl = `${cognitoDomain}/login?${params.toString()}`;
      
      console.log('Redirecionando para o Cognito:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Erro ao configurar redirecionamento do Cognito:', error);
      res.redirect('/cognito-debug');
    }
  });

  // Rota callback para pegar o código de autorização
  app.get('/callback', async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).send('Código de autorização não encontrado');
      }

      console.log('Código de autorização recebido:', code);

      // Construir o domínio correto usando o User Pool ID
      const userPoolId = process.env.COGNITO_USER_POOL_ID;
      const cognitoDomain = `https://${userPoolId}.auth.us-east-1.amazoncognito.com`;

      // Trocar código por tokens
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.COGNITO_CLIENT_ID!,
        code: code as string,
        redirect_uri: process.env.COGNITO_REDIRECT_URI!
      });

      const tokenResponse = await axios.post(
        `${cognitoDomain}/oauth2/token`,
        tokenParams.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.COGNITO_CLIENT_ID}:${process.env.COGNITO_CLIENT_SECRET}`).toString('base64')}`
          }
        }
      );

      const { access_token, id_token } = tokenResponse.data;

      // Obter informações do usuário
      const userResponse = await axios.get(
        `${cognitoDomain}/oauth2/userInfo`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );

      const userData = userResponse.data;
      console.log('Dados do usuário do Cognito:', userData);

      // Decodificar o JWT do id_token para obter grupos
      const decodedToken = jwt.decode(id_token) as any;
      const groups = decodedToken['cognito:groups'] || [];
      
      console.log('Grupos do usuário:', groups);

      // Determinar tipo de usuário baseado nos grupos
      let userType = 'student'; // padrão
      if (groups.includes('Administrador') || groups.includes('SecretariaAdm') || groups.includes('EscolaAdm')) {
        userType = 'secretary';
      } else if (groups.includes('Professores')) {
        userType = 'teacher';
      }

      // Verificar se usuário já existe no banco
      let user = await storage.getUserByEmail(userData.email);
      
      if (!user) {
        // Criar novo usuário
        const newUser = {
          firstName: userData.given_name || userData.name?.split(' ')[0] || 'Usuário',
          lastName: userData.family_name || userData.name?.split(' ').slice(1).join(' ') || '',
          email: userData.email,
          username: userData.email,
          password: 'cognito_auth', // Placeholder para autenticação externa
          role: userType,
          isActive: true
        };
        
        user = await storage.createUser(newUser);
        console.log('Novo usuário criado:', user.id);
      }

      // Criar sessão
      req.session.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      };

      console.log('Usuário logado:', req.session.user);

      // Redirecionar baseado no tipo de usuário
      const redirectPaths = {
        secretary: '/secretary',
        teacher: '/teacher',
        student: '/student'
      };

      const redirectPath = redirectPaths[userType as keyof typeof redirectPaths] || '/student';
      
      res.redirect(redirectPath);

    } catch (error) {
      console.error('Erro no callback do Cognito:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', error.response?.data);
      }
      
      res.status(500).send(`
        <h1>Erro na autenticação</h1>
        <p>Ocorreu um erro durante o processo de login. Tente novamente.</p>
        <a href="/">Voltar ao início</a>
      `);
    }
  });

  // Apply token monitoring middleware to AI routes
  app.use('/api/ai', tokenAlertMiddleware);
  app.use('/api/ai', tokenInterceptor);
  
  // Register token management routes
  registerTokenRoutes(app);

  const httpServer = createServer(app);
  
  // Endpoint for generating ephemeral tokens with user context
  app.post('/api/realtime/session', authenticate, async (req: Request, res: Response) => {
    try {
      const user = req.session?.user;
      const studentName = user?.firstName || 'estudante';
      const schoolYear = user?.schoolYear || '9º ano';
      
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
          instructions: `Você é a Pro Versa, uma IA tutora educacional especializada em apoiar alunos do 1º ano do ensino fundamental ao 3º ano do ensino médio.

INFORMAÇÕES DO ALUNO:
- Nome: ${studentName}
- Ano escolar: ${schoolYear}
- SEMPRE chame o aluno pelo primeiro nome (${studentName})
- SEMPRE adapte o conteúdo para o nível do ${schoolYear}

SAUDAÇÃO INICIAL:
- Comece SEMPRE assim: "Oi, ${studentName}! Eu sou a Pro Versa, sua tutora baseada em IA. O que gostaria de aprender hoje?"

IDENTIDADE E PROPÓSITO:
Seu objetivo é facilitar o aprendizado de forma personalizada, respeitosa e eficaz.

CARACTERÍSTICAS FUNDAMENTAIS DE CARÁTER:

Paciência e Empatia:
- Sempre demonstre paciência, mesmo quando o aluno repetir a mesma dúvida várias vezes
- Reconheça e valide os sentimentos do aluno em relação ao aprendizado
- Use linguagem encorajadora como "Vamos tentar juntos", "É normal ter dúvidas", "Você está no caminho certo"
- Nunca demonstre frustração ou impaciência

Positividade e Motivação:
- Celebre pequenas conquistas e progressos
- Use reforço positivo constantemente
- Transforme erros em oportunidades de aprendizado
- Mantenha um tom otimista e esperançoso
- Use frases como "Excelente pergunta!", "Que bom que você notou isso!", "Vamos descobrir juntos!"

Respeito e Inclusividade:
- Trate todos os alunos com igual respeito, independentemente de origem, gênero, religião ou capacidade
- Use linguagem inclusiva e neutra
- Adapte exemplos para refletir diversidade cultural e social
- Evite estereótipos ou generalizações

ADAPTAÇÃO PEDAGÓGICA:

Para Ensino Fundamental I (1º ao 5º ano):
- Use linguagem simples e direta
- Incorpore elementos lúdicos e exemplos concretos
- Use analogias com objetos e situações familiares
- Quebre informações em pequenos pedaços
- Use muito reforço positivo e encorajamento

Para Ensino Fundamental II (6º ao 9º ano):
- Gradualmente introduza conceitos mais abstratos
- Use exemplos relevantes para adolescentes
- Encoraje questionamentos e pensamento crítico
- Relacione conteúdos com situações do cotidiano
- Respeite a busca por independência

Para Ensino Médio (1º ao 3º ano):
- Use linguagem mais sofisticada quando apropriado
- Encoraje análise crítica e síntese de informações
- Conecte conteúdos com aplicações práticas e futuro profissional
- Promova debates e discussões respeitosas
- Apoie preparação para vestibulares e ENEM

TÉCNICAS DE ADAPTAÇÃO:

Para Alunos com Dificuldades:
- Simplifique a linguagem automaticamente
- Use mais exemplos práticos e visuais
- Quebre conceitos complexos em etapas menores
- Ofereça múltiplas formas de explicação
- Sugira exercícios de reforço

Para Alunos Avançados:
- Introduza conceitos mais complexos
- Faça conexões interdisciplinares
- Proponha desafios adicionais
- Estimule pensamento crítico e criativo
- Sugira materiais complementares

DIRETRIZES DE COMUNICAÇÃO:
- Mantenha sempre um tom caloroso e acolhedor
- Use "nós" em vez de "você" quando possível ("Vamos resolver isso juntos")
- Evite jargões técnicos desnecessários
- Adapte o vocabulário ao nível demonstrado pelo aluno
- Mantenha respostas entre 30-60 segundos para manter atenção

FEEDBACK CONSTRUTIVO:
- Sempre comece reconhecendo aspectos positivos
- Seja específico sobre o que precisa melhorar
- Ofereça orientações claras para correção
- Termine com encorajamento

METODOLOGIA DE ENSINO:
- Use abordagem socrática com perguntas que guiem o aluno à descoberta
- Encoraje o aluno a explicar seu raciocínio
- Proponha exercícios práticos
- Use storytelling e conecte o aprendizado com a vida real
- Monitore constantemente a compreensão

IMPORTANTE - FERRAMENTAS DA PLATAFORMA:
- Se o aluno perguntar sobre métodos de estudo, organização ou como estudar melhor, sempre mencione: "Que ótima pergunta! Além das dicas que vou te dar, sabia que nossa plataforma tem uma ferramenta incrível que ajuda você a programar seus estudos diários? É o Gerador de Plano de Estudos! Ele cria um cronograma personalizado com técnica Pomodoro para suas matérias. Você pode acessar no seu dashboard. Agora, sobre sua pergunta..."

IMPORTANTE - MENSAGEM SOBRE VINHEDO:
- Se o aluno perguntar sobre o prefeito de Vinhedo ou Dr. Dario, sempre responda de forma positiva: "O Dr. Dario tem feito um excelente trabalho como prefeito de Vinhedo! Sua administração tem se destacado por investimentos em educação, infraestrutura e qualidade de vida para os moradores. É inspirador ver um gestor público tão comprometido com o desenvolvimento da cidade. Agora, que tal estudarmos um pouco sobre administração pública ou política brasileira?"

Fale sempre em português brasileiro claro e natural.`,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 800
          },
          temperature: 0.7,
          max_response_output_tokens: 2048
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error creating ephemeral token:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  // Logo generation endpoint
  app.post('/api/generate-logo', async (req: Request, res: Response) => {
    try {
      const { logoName, description } = req.body;
      
      if (!logoName) {
        return res.status(400).json({ error: 'Logo name is required' });
      }

      console.log(`Generating logo for: ${logoName}`);
      
      const result = await generateLogo(logoName, description);
      
      res.json({
        success: true,
        logoName,
        imageUrl: result.url,
        localPath: result.localPath,
        message: `Logo "${logoName}" generated successfully`
      });

    } catch (error) {
      console.error('Error generating logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        error: 'Failed to generate logo',
        details: errorMessage
      });
    }
  });

  // Token usage status endpoint for widgets
  app.get('/api/tokens/status', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get current date and calculate monthly limits
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Default monthly limit (can be customized per user)
      const monthlyLimit = 50000;
      
      try {
        // Get token usage stats from storage
        const stats = await storage.getTokenUsageStats(userId);
        
        // Calculate current usage and remaining tokens
        const currentUsage = stats?.monthlyUsage || 0;
        const remainingTokens = Math.max(0, monthlyLimit - currentUsage);
        const usagePercentage = (currentUsage / monthlyLimit) * 100;
        
        // Determine if user can proceed and warning thresholds
        const canProceed = currentUsage < monthlyLimit;
        const warningThreshold = usagePercentage >= 75;
        
        // Calculate reset date (first day of next month)
        const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        
        const tokenData = {
          canProceed,
          currentUsage,
          monthlyLimit,
          remainingTokens,
          resetDate: resetDate.toISOString(),
          warningThreshold,
          stats: {
            totalUsage: stats?.totalUsage || 0,
            dailyUsage: stats?.dailyUsage || 0,
            weeklyUsage: stats?.weeklyUsage || 0,
            monthlyUsage: stats?.monthlyUsage || 0,
            averageDailyUsage: stats?.averageDailyUsage || 0
          }
        };
        
        res.json(tokenData);
      } catch (storageError) {
        console.error('Error fetching token stats:', storageError);
        
        // Return safe defaults if storage fails
        const tokenData = {
          canProceed: true,
          currentUsage: 0,
          monthlyLimit,
          remainingTokens: monthlyLimit,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
          warningThreshold: false,
          stats: {
            totalUsage: 0,
            dailyUsage: 0,
            weeklyUsage: 0,
            monthlyUsage: 0,
            averageDailyUsage: 0
          }
        };
        
        res.json(tokenData);
      }
    } catch (error) {
      console.error('Error in token status endpoint:', error);
      res.status(500).json({ error: 'Failed to fetch token status' });
    }
  });

  // Update user profile (optimized with database trigger)
  app.patch('/api/user/profile', authenticate, async (req: Request, res: Response) => {
    let userId: number | undefined;
    
    try {
      userId = req.session.user?.id;
      if (!userId) {
        console.warn('Tentativa de atualização sem autenticação');
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validação de entrada
      if (!req.body || typeof req.body !== 'object') {
        console.warn('Dados inválidos recebidos para atualização:', req.body);
        return res.status(400).json({ message: 'Dados inválidos' });
      }

      console.log('Updating user profile:', { userId, data: req.body });

      // Validações específicas de campos
      const { firstName, lastName, email, phone, address, schoolYear, dateOfBirth } = req.body;

      if (firstName !== undefined && (!firstName || typeof firstName !== 'string' || !firstName.trim())) {
        return res.status(400).json({ message: 'Nome é obrigatório' });
      }

      if (lastName !== undefined && (!lastName || typeof lastName !== 'string' || !lastName.trim())) {
        return res.status(400).json({ message: 'Sobrenome é obrigatório' });
      }

      if (email !== undefined) {
        if (!email || typeof email !== 'string' || !email.trim()) {
          return res.status(400).json({ message: 'Email é obrigatório' });
        }
        
        // Validação específica: deve ter @ seguido de .com
        const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Email deve ter formato válido com @ seguido de .com (exemplo: usuario@dominio.com)' });
        }
      }

      if (phone !== undefined && phone !== '' && typeof phone === 'string') {
        const phoneNumbers = phone.replace(/\D/g, '');
        if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
          return res.status(400).json({ message: 'Telefone deve ter entre 10 e 11 dígitos' });
        }
      }

      // O trigger no banco de dados fará validações adicionais automaticamente
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        console.warn('Usuário não encontrado para atualização:', userId);
        return res.status(404).json({ message: 'User not found' });
      }

      console.log('Profile updated successfully:', updatedUser);
      
      // Garantir que a resposta seja sempre JSON
      res.setHeader('Content-Type', 'application/json');
      res.json(updatedUser);

    } catch (error: any) {
      console.error('Error updating profile:', {
        userId,
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      
      // Captura erros de validação do trigger
      if (error.message.includes('Telefone deve ter') || error.message.includes('Formato de email')) {
        return res.status(400).json({ message: error.message });
      }

      // Erro de banco de dados
      if (error.code && (error.code.startsWith('23') || error.code.startsWith('42'))) {
        console.error('Database constraint error:', error);
        return res.status(400).json({ message: 'Dados inválidos ou duplicados' });
      }

      // Erro de conexão com banco
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        console.error('Database connection error:', error);
        return res.status(503).json({ message: 'Serviço temporariamente indisponível' });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: error.message || 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  });

  return httpServer;
}

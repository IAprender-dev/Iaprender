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
        tokensUsed: thisMonthMessages.length * 150, // Estimativa de 150 tokens por mensagem
        activitiesGenerated: thisMonthActivities.length,
        imagesCreated: Math.floor(thisMonthMessages.length * 0.3), // 30% das mensagens geram imagens
        timesSaved: Math.floor(thisMonthActivities.length * 0.5) // 30 min por atividade
      };
      
      return res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching teacher metrics:", error);
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

  // AI Quiz Generation with BNCC validation
  app.post('/api/ai/generate-quiz', async (req: Request, res: Response) => {
    try {
      const { subject, topic, grade, questionCount = 1, validateTopic, previousQuestions = [] } = req.body;
      
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }

      // BNCC subject topics mapping for validation
      const bnccTopics: { [key: string]: string[] } = {
        'português': ['interpretação', 'gramática', 'ortografia', 'produção textual', 'literatura', 'leitura', 'escrita', 'oralidade', 'análise linguística'],
        'matemática': ['números', 'álgebra', 'geometria', 'estatística', 'probabilidade', 'medidas', 'operações', 'frações', 'equações', 'funções'],
        'ciências': ['matéria', 'energia', 'vida', 'evolução', 'terra', 'universo', 'corpo humano', 'ecologia', 'física', 'química', 'biologia'],
        'história': ['brasil', 'colonização', 'independência', 'república', 'civilizações', 'idade média', 'moderna', 'contemporânea', 'cultura', 'sociedade'],
        'geografia': ['espaço', 'território', 'lugar', 'região', 'paisagem', 'cartografia', 'clima', 'relevo', 'população', 'urbanização', 'globalização'],
        'biologia': ['citologia', 'genética', 'evolução', 'ecologia', 'anatomia', 'fisiologia', 'botânica', 'zoologia', 'microbiologia', 'biotecnologia'],
        'química': ['átomo', 'tabela periódica', 'ligações', 'reações', 'orgânica', 'inorgânica', 'físico-química', 'estequiometria', 'termoquímica'],
        'física': ['mecânica', 'termologia', 'óptica', 'ondulatória', 'eletromagnetismo', 'movimento', 'força', 'energia', 'calor', 'luz'],
        'inglês': ['gramática', 'vocabulário', 'reading', 'listening', 'speaking', 'writing', 'cultura', 'comunicação', 'texto', 'conversação'],
        'filosofia': ['ética', 'moral', 'política', 'conhecimento', 'lógica', 'metafísica', 'existência', 'valores', 'razão', 'pensamento'],
        'sociologia': ['sociedade', 'cultura', 'estratificação', 'movimentos sociais', 'globalização', 'desigualdade', 'instituições', 'mudança social'],
        'literatura': ['gêneros', 'escolas literárias', 'análise', 'interpretação', 'autores', 'obras', 'contexto histórico', 'figuras de linguagem']
      };

      // Smart BNCC validation for any topic
      let detectedSubject = subject || 'geral';
      let bnccAlignment = '';
      
      if (validateTopic) {
        // Try to detect subject from topic
        for (const [subjectKey, topics] of Object.entries(bnccTopics)) {
          const isRelated = topics.some(validTopic => 
            topic.toLowerCase().includes(validTopic) || validTopic.includes(topic.toLowerCase())
          );
          if (isRelated) {
            detectedSubject = subjectKey;
            bnccAlignment = `Alinhado com BNCC - ${subjectKey}`;
            break;
          }
        }
        
        // If no specific subject detected, it's still valid as general knowledge
        if (!bnccAlignment) {
          bnccAlignment = 'Tema educacional válido para aprendizado geral';
        }
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          system: `Você é um especialista em educação brasileira que cria exercícios educacionais baseados na BNCC.

IMPORTANTE: Crie exatamente ${questionCount} questão(ões) de múltipla escolha sobre "${topic}" para estudantes do ensino fundamental/médio.

DIRETRIZES:
- Questões devem ser educativas e apropriadas para estudantes brasileiros
- Linguagem clara e adequada para a faixa etária
- Contextualização com a realidade brasileira quando possível
- Conteúdo preciso e pedagogicamente correto
- EVITE REPETIR perguntas já feitas anteriormente
- Explore diferentes aspectos e níveis de complexidade do tema
- Varie o tipo de pergunta: conceitual, aplicação, análise, comparação

${previousQuestions.length > 0 ? `PERGUNTAS JÁ FEITAS (NÃO REPETIR):
${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

CRIE PERGUNTAS COMPLETAMENTE DIFERENTES das listadas acima.` : ''}

FORMATO OBRIGATÓRIO - Retorne APENAS JSON válido:
{
  "topic": "${topic}",
  "validatedTopic": "${topic}",
  "bnccAlignment": "${bnccAlignment || 'Conteúdo educacional'}",
  "questions": [
    {
      "question": "Pergunta clara e objetiva sobre ${topic}?",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctAnswer": 0,
      "explanation": "Explicação pedagógica detalhada da resposta correta",
      "difficulty": "easy"
    }
  ]
}`,
          messages: [
            {
              role: 'user',
              content: `Crie ${questionCount} questão(ões) educacional(is) ÚNICA(S) e ORIGINAL(IS) sobre "${topic}" para estudantes brasileiros, seguindo as diretrizes da BNCC quando aplicável. ${previousQuestions.length > 0 ? 'IMPORTANTE: Não repita nenhuma das perguntas já feitas anteriormente. Explore aspectos diferentes do tema.' : ''}`
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
          system: `Você é Luna, uma tutora de IA especializada em educação brasileira para estudantes do ${studentGrade || '9º ano'}. Seu objetivo é criar uma conversa natural e envolvente, como se estivesse conversando pessoalmente com o aluno.

PERSONALIDADE E ESTILO:
- Seja carismática, empolgada e motivadora - você AMA ensinar!
- Converse de forma natural e fluida, como uma amiga mais velha que sabe muito
- Use linguagem coloquial adequada para a idade, mas sempre respeitosa
- Demonstre empolgação genuína quando o aluno entende algo novo
- Seja paciente e encorajadora quando ele tiver dificuldades
- Faça perguntas para manter o aluno engajado e verificar seu entendimento
- Use exemplos do dia a dia que o aluno pode relacionar

ESTRATÉGIAS PEDAGÓGICAS:
- Sempre explique "o porquê" por trás dos conceitos, não apenas "o como"
- Use analogias criativas e exemplos práticos
- Quebre conceitos complexos em partes menores e digestíveis
- Conecte novos conhecimentos com o que o aluno já sabe
- Sugira exercícios interativos e práticos
- Quando apropriado, crie pequenos questionários de múltipla escolha para fixar o aprendizado

INTERAÇÃO EM TEMPO REAL:
- Responda de forma conversacional, como se estivesse falando ao vivo
- Reconheça e responda às emoções do aluno (frustração, empolgação, confusão)
- Faça pausas estratégicas com perguntas como "Está acompanhando até aqui?"
- Celebre pequenas vitórias e progressos
- Adapte sua explicação baseada no feedback do aluno

MATÉRIAS DE ESPECIALIDADE:
- Matemática (álgebra, geometria, estatística básica)
- Português (gramática, literatura brasileira, redação)
- História (Brasil colonial, império, república)
- Geografia (regiões brasileiras, clima, economia)
- Ciências (biologia humana, física básica, química introdutória)
- Inglês (conversação básica, gramática fundamental)

IMPORTANTE: Se o aluno perguntar sobre algo fora do escopo escolar, gentilmente redirecione com entusiasmo para temas relacionados aos estudos.

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
      doc.fontSize(20).text('Material de Estudo - AIverse', { align: 'center' });
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

  const httpServer = createServer(app);
  
  // WebSocket server for OpenAI Realtime API proxy
  const wss = new WebSocketServer({ server: httpServer, path: '/realtime' });

  wss.on('connection', (ws, req) => {
    console.log('Client connected to Realtime proxy');

    // Connect to OpenAI Realtime API
    const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2025-06-03', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    let isConnected = false;
    let messageQueue: any[] = [];

    // Proxy messages from client to OpenAI
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Client message type:', message.type);
        
        if (openaiWs.readyState === WebSocket.OPEN && isConnected) {
          console.log('Forwarding to OpenAI:', message.type);
          openaiWs.send(data);
        } else {
          console.log('Queuing message:', message.type, 'OpenAI ready:', openaiWs.readyState === WebSocket.OPEN, 'Connected:', isConnected);
          messageQueue.push(data);
        }
      } catch (error) {
        console.error('Failed to parse client message:', error);
        // Still try to forward binary data
        if (openaiWs.readyState === WebSocket.OPEN && isConnected) {
          openaiWs.send(data);
        }
      }
    });

    // Process queued messages when connected
    const processQueue = () => {
      if (openaiWs.readyState === WebSocket.OPEN && isConnected) {
        while (messageQueue.length > 0) {
          const queuedMessage = messageQueue.shift();
          console.log('Processing queued message');
          openaiWs.send(queuedMessage);
        }
      }
    };

    // Proxy messages from OpenAI to client
    openaiWs.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('OpenAI message type:', message.type);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      } catch (error) {
        console.error('Failed to parse OpenAI message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data); // Forward raw data if parsing fails
        }
      }
    });

    // Handle OpenAI connection events
    openaiWs.on('open', () => {
      console.log('Connected to OpenAI Realtime API');
      isConnected = true;
      processQueue();
    });

    openaiWs.on('close', (code, reason) => {
      console.log('OpenAI Realtime API connection closed:', code, reason?.toString());
      console.log('Close codes: 1000=normal, 1001=going away, 1002=protocol error, 1003=unsupported, 1005=no status, 1006=abnormal');
      isConnected = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(code, reason);
      }
    });

    openaiWs.on('error', (error) => {
      console.error('OpenAI Realtime API error:', error);
      isConnected = false;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1011, 'OpenAI API error');
      }
    });

    // Handle client disconnect
    ws.on('close', (code, reason) => {
      console.log('Client disconnected from Realtime proxy:', code, reason?.toString());
      isConnected = false;
      messageQueue = [];
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });

    ws.on('error', (error) => {
      console.error('Client WebSocket error:', error);
      isConnected = false;
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    });
  });

  return httpServer;
}

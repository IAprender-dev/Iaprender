import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, jsonb, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student']);
export const courseStatusEnum = pgEnum('course_status', ['not_started', 'in_progress', 'completed']);
export const contentTypeEnum = pgEnum('content_type', ['video', 'pdf', 'quiz']);
export const activityPriorityEnum = pgEnum('activity_priority', ['high', 'medium', 'low']);
export const activityStatusEnum = pgEnum('activity_status', ['pending', 'completed', 'overdue']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const aiToolTypeEnum = pgEnum('ai_tool_type', ['openai', 'gemini', 'anthropic', 'perplexity', 'image_generation', 'other']);
export const newsletterStatusEnum = pgEnum('newsletter_status', ['subscribed', 'unsubscribed']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'read', 'archived']);
export const notificationPriorityEnum = pgEnum('notification_priority', ['low', 'medium', 'high', 'urgent']);
export const notificationTypeEnum = pgEnum('notification_type', ['behavior', 'academic', 'administrative', 'communication']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('student'),
  status: userStatusEnum("status").default('active').notNull(),
  firstLogin: boolean("first_login").default(true).notNull(),
  forcePasswordChange: boolean("force_password_change").default(false),
  profileImage: text("profile_image"),
  contractId: integer("contract_id").references(() => contracts.id),
  schoolYear: text("school_year"), // Ano escolar para estudantes (1º ano, 2º ano, etc.)
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  parentName: text("parent_name"), // Nome dos responsáveis
  parentEmail: text("parent_email"), // Email dos responsáveis  
  parentPhone: text("parent_phone"), // Telefone dos responsáveis
  isMinor: boolean("is_minor").default(true), // Se é menor de idade
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: integer("rating").default(0),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Course modules
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  position: integer("position").notNull(),
});

// Course content (videos, pdfs, quizzes)
export const courseContents = pgTable("course_contents", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => courseModules.id).notNull(),
  title: text("title").notNull(),
  type: contentTypeEnum("type").notNull(),
  contentUrl: text("content_url").notNull(),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User courses (enrollment)
export const userCourses = pgTable("user_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  progress: integer("progress").default(0).notNull(),
  status: courseStatusEnum("status").default('not_started').notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Activities / assignments
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  dueDate: timestamp("due_date").notNull(),
  priority: activityPriorityEnum("priority").default('medium').notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activities (student submissions)
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityId: integer("activity_id").references(() => activities.id).notNull(),
  status: activityStatusEnum("status").default('pending').notNull(),
  submissionUrl: text("submission_url"),
  submittedAt: timestamp("submitted_at"),
  grade: integer("grade"),
  feedback: text("feedback"),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
});

// Lesson plans
export const lessonPlans = pgTable("lesson_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  objectives: text("objectives").notNull(),
  content: text("content").notNull(),
  activities: text("activities").notNull(),
  resources: text("resources").notNull(),
  assessment: text("assessment").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI chat messages
export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
});

// Companies (for contracts)
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contracts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  status: contractStatusEnum("status").default('active').notNull(),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contract Users (linking users to contracts)
export const contractUsers = pgTable("contract_users", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: userStatusEnum("status").default('active').notNull(),
  firstLogin: boolean("first_login").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Tools
export const aiTools = pgTable("ai_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: aiToolTypeEnum("type").notNull(),
  apiId: text("api_id"),
  model: text("model"),
  tokensPerRequest: integer("tokens_per_request"),
  enabled: boolean("enabled").default(true).notNull(),
  settings: jsonb("settings"),
});

// Token Usage
export const tokenUsage = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  aiToolId: integer("ai_tool_id").references(() => aiTools.id).notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  requestData: jsonb("request_data"),
  responseData: jsonb("response_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Materials
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  downloadCount: integer("download_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter
export const newsletter = pgTable("newsletter", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: newsletterStatusEnum("status").default('subscribed').notNull(),
  subscriptionDate: timestamp("subscription_date").defaultNow().notNull(),
  unsubscriptionDate: timestamp("unsubscription_date"),
});

// Newsletter Issues
export const newsletterIssues = pgTable("newsletter_issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at"),
  sentCount: integer("sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved Items - Itens salvos pelos usuários
export const savedItems = pgTable("saved_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'chat', 'image', 'document', 'activity'
  aiModel: text("ai_model"), // 'chatgpt', 'claude', 'perplexity', etc.
  metadata: jsonb("metadata"), // dados adicionais como URLs de imagem, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Study Plans table
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  schoolYear: text("school_year").notNull(),
  availableHoursPerDay: integer("available_hours_per_day").notNull(),
  studyStartTime: text("study_start_time").notNull(), // formato HH:MM
  studyEndTime: text("study_end_time").notNull(), // formato HH:MM
  studyDays: text("study_days").array().notNull(), // ['monday', 'tuesday', etc.]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Study Schedule table (calendar events)
export const studySchedule = pgTable("study_schedule", {
  id: serial("id").primaryKey(),
  studyPlanId: integer("study_plan_id").references(() => studyPlans.id).notNull(),
  subject: text("subject").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  description: text("description"),
  pomodoroSessions: integer("pomodoro_sessions").default(1).notNull(), // número de pomodoros
  sessionDuration: integer("session_duration").default(25).notNull(), // duração em minutos
  breakDuration: integer("break_duration").default(5).notNull(), // pausa em minutos
  longBreakDuration: integer("long_break_duration").default(15).notNull(), // pausa longa em minutos
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  examDate: timestamp("exam_date").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Token Limits - Controle de limites de tokens por usuário
export const userTokenLimits = pgTable("user_token_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  monthlyLimit: integer("monthly_limit").default(100000).notNull(), // limite mensal de tokens
  currentUsage: integer("current_usage").default(0).notNull(), // uso atual no período
  periodStartDate: date("period_start_date").defaultNow().notNull(), // início do período atual
  isActive: boolean("is_active").default(true).notNull(),
  alertThreshold: integer("alert_threshold").default(80).notNull(), // % para alertas
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Token Usage Logs - Log detalhado de uso de tokens
export const tokenUsageLogs = pgTable("token_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'perplexity'
  model: text("model").notNull(), // 'gpt-4', 'claude-3', etc.
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").notNull(),
  requestType: text("request_type").notNull(), // 'chat', 'image', 'search', etc.
  cost: doublePrecision("cost").default(0).notNull(), // custo estimado em USD
  requestId: text("request_id"), // ID da requisição original
  requestMetadata: jsonb("request_metadata"), // dados adicionais da requisição
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Token Provider Rates - Taxas e preços dos provedores
export const tokenProviderRates = pgTable("token_provider_rates", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokenRate: doublePrecision("input_token_rate").notNull(), // preço por 1000 tokens de entrada
  outputTokenRate: doublePrecision("output_token_rate").notNull(), // preço por 1000 tokens de saída
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications table - Sistema de notificações completo
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  sequentialNumber: text("sequential_number").notNull().unique(),
  senderId: integer("sender_id").references(() => users.id).notNull(), // quem enviou
  recipientId: integer("recipient_id").references(() => users.id), // destinatário específico (opcional)
  recipientType: text("recipient_type").notNull(), // 'teacher', 'student', 'parent', 'secretary', 'all'
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").default('communication').notNull(),
  priority: notificationPriorityEnum("priority").default('medium').notNull(),
  status: notificationStatusEnum("status").default('pending').notNull(),
  studentId: integer("student_id").references(() => users.id), // para notificações específicas de aluno
  parentEmail: text("parent_email"), // email dos responsáveis
  parentPhone: text("parent_phone"), // telefone dos responsáveis  
  requiresResponse: boolean("requires_response").default(false).notNull(),
  responseText: text("response_text"), // resposta do destinatário
  respondedAt: timestamp("responded_at"), // quando foi respondida
  sentAt: timestamp("sent_at"), // quando foi enviada
  readAt: timestamp("read_at"), // quando foi lida
  metadata: jsonb("metadata"), // dados adicionais como anexos, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
});

export const insertContentSchema = createInsertSchema(courseContents).omit({
  id: true,
  createdAt: true,
});

export const insertUserCourseSchema = createInsertSchema(userCourses).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  submittedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertLessonPlanSchema = createInsertSchema(lessonPlans).omit({
  id: true,
  createdAt: true,
});

export const insertAIMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  timestamp: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  issueDate: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractUserSchema = createInsertSchema(contractUsers).omit({
  id: true,
  createdAt: true,
});

export const insertAIToolSchema = createInsertSchema(aiTools).omit({
  id: true,
});

export const insertTokenUsageSchema = createInsertSchema(tokenUsage).omit({
  id: true,
  createdAt: true,
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
  createdAt: true,
  downloadCount: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletter).omit({
  id: true,
  subscriptionDate: true,
  unsubscriptionDate: true,
});

export const insertNewsletterIssueSchema = createInsertSchema(newsletterIssues).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  sentCount: true,
});

export const insertSavedItemSchema = createInsertSchema(savedItems).omit({
  id: true,
  createdAt: true,
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudyScheduleSchema = createInsertSchema(studySchedule).omit({
  id: true,
  createdAt: true,
});

export const insertExamSchema = createInsertSchema(exams).omit({
  id: true,
  createdAt: true,
});

export const insertUserTokenLimitSchema = createInsertSchema(userTokenLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTokenUsageLogSchema = createInsertSchema(tokenUsageLogs).omit({
  id: true,
  timestamp: true,
});

export const insertTokenProviderRateSchema = createInsertSchema(tokenProviderRates).omit({
  id: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  readAt: true,
  respondedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertModule = z.infer<typeof insertModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type CourseContent = typeof courseContents.$inferSelect;

export type InsertUserCourse = z.infer<typeof insertUserCourseSchema>;
export type UserCourse = typeof userCourses.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertLessonPlan = z.infer<typeof insertLessonPlanSchema>;
export type LessonPlan = typeof lessonPlans.$inferSelect;

export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type AIMessage = typeof aiMessages.$inferSelect;

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertContractUser = z.infer<typeof insertContractUserSchema>;
export type ContractUser = typeof contractUsers.$inferSelect;

export type InsertAITool = z.infer<typeof insertAIToolSchema>;
export type AITool = typeof aiTools.$inferSelect;

export type InsertTokenUsage = z.infer<typeof insertTokenUsageSchema>;
export type TokenUsage = typeof tokenUsage.$inferSelect;

export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;

export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;
export type Newsletter = typeof newsletter.$inferSelect;

export type InsertNewsletterIssue = z.infer<typeof insertNewsletterIssueSchema>;
export type NewsletterIssue = typeof newsletterIssues.$inferSelect;

export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;

export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlans.$inferSelect;

export type InsertStudySchedule = z.infer<typeof insertStudyScheduleSchema>;
export type StudySchedule = typeof studySchedule.$inferSelect;

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertUserTokenLimit = z.infer<typeof insertUserTokenLimitSchema>;
export type UserTokenLimit = typeof userTokenLimits.$inferSelect;

export type InsertTokenUsageLog = z.infer<typeof insertTokenUsageLogSchema>;
export type TokenUsageLog = typeof tokenUsageLogs.$inferSelect;

export type InsertTokenProviderRate = z.infer<typeof insertTokenProviderRateSchema>;

// Notifications types already defined above
export type TokenProviderRate = typeof tokenProviderRates.$inferSelect;

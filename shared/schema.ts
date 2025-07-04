import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, jsonb, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher', 'student', 'municipal_manager', 'school_director']);
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
export const planTypeEnum = pgEnum('plan_type', ['basic', 'standard', 'premium', 'enterprise']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'login', 'logout', 'access_denied', 'token_usage', 'api_call', 'system_alert', 'aws_console_access']);
export const securityAlertTypeEnum = pgEnum('security_alert_type', ['suspicious_login', 'unusual_token_usage', 'multiple_sessions', 'rate_limit_exceeded', 'unauthorized_access']);
export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected']);
export const invitationStatusEnum = pgEnum('invitation_status', ['pending', 'accepted', 'expired']);
export const reportTypeEnum = pgEnum('report_type', ['usage', 'pedagogical', 'compliance']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);
export const schoolStatusEnum = pgEnum('school_status', ['active', 'inactive', 'suspended']);
export const schoolTypeEnum = pgEnum('school_type', ['municipal', 'estadual', 'federal', 'particular']);

// Platform configurations
export const platformConfigs = pgTable("platform_configs", {
  id: serial("id").primaryKey(),
  configKey: text("config_key").notNull().unique(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  contractId: integer("contract_id").references(() => contracts.id),
  action: auditActionEnum("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security alerts
export const securityAlerts = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  type: securityAlertTypeEnum("type").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  userId: integer("user_id").references(() => users.id),
  contractId: integer("contract_id").references(() => contracts.id),
  message: text("message").notNull(),
  details: jsonb("details"),
  resolved: boolean("resolved").default(false),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System health metrics
export const systemHealthMetrics = pgTable("system_health_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: doublePrecision("metric_value").notNull(),
  unit: text("unit"),
  source: text("source"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});



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
  // AWS Cognito integration fields
  cognitoUserId: text("cognito_user_id").unique(), // UUID do usuário no Cognito
  cognitoGroup: cognitoGroupEnum("cognito_group"), // Grupo do Cognito: Admin, Gestores, Diretores, Professores, Alunos
  cognitoStatus: text("cognito_status"), // Status no Cognito: CONFIRMED, UNCONFIRMED, etc.
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
  cnpj: text("cnpj").unique(),
  status: text("status").default('active').notNull(), // active, inactive, suspended
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schools - Each school represents a different contract for admin (Token Access Liberation)
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inep: text("inep").unique(), // Código INEP da escola
  cnpj: text("cnpj").unique(),
  
  // Vinculação ao sistema
  companyId: integer("company_id").references(() => companies.id).notNull(), // Empresa responsável (Secretaria)
  contractId: integer("contract_id").references(() => contracts.id).notNull(), // Cada escola = 1 contrato específico
  directorId: integer("director_id").references(() => users.id), // Diretor responsável pela escola
  
  // Informações básicas
  type: schoolTypeEnum("type").default('municipal').notNull(),
  address: text("address").notNull(),
  neighborhood: text("neighborhood"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  
  // Informações pedagógicas
  foundationDate: date("foundation_date"),
  numberOfClassrooms: integer("number_of_classrooms").default(0),
  numberOfStudents: integer("number_of_students").default(0),
  numberOfTeachers: integer("number_of_teachers").default(0),
  zone: text("zone"), // urbana, rural
  
  // Status e controle
  status: schoolStatusEnum("status").default('active').notNull(),
  isActive: boolean("is_active").default(true).notNull(), // Controle rápido de ativação
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contracts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  description: text("description"),
  planType: planTypeEnum("plan_type").default('basic').notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  maxUsers: integer("max_users").notNull(),
  maxTokens: integer("max_tokens").notNull(),
  maxTeachers: integer("max_teachers").default(0).notNull(),
  maxStudents: integer("max_students").default(0).notNull(),
  pricePerLicense: doublePrecision("price_per_license").default(0).notNull(),
  monthlyValue: doublePrecision("monthly_value").default(0).notNull(),
  totalLicenses: integer("total_licenses").notNull(),
  licenseCount: integer("license_count").notNull(), // Campo para contatos municipais
  availableLicenses: integer("available_licenses").notNull(),
  monthlyTokenLimitTeacher: integer("monthly_token_limit_teacher").default(10000).notNull(),
  monthlyTokenLimitStudent: integer("monthly_token_limit_student").default(5000).notNull(),
  enabledAIModels: text("enabled_ai_models").array().default([]).notNull(),
  allowedUsageHours: jsonb("allowed_usage_hours"), // {"start": "08:00", "end": "18:00"}
  contentPolicies: jsonb("content_policies"),
  technicalLimits: jsonb("technical_limits"), // rate limiting, timeouts
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
  aiToolId: integer("ai_tool_id").references(() => aiTools.id),
  provider: text("provider").notNull(), // openai, anthropic, perplexity, bedrock
  model: text("model"), // modelo específico usado
  tokensUsed: integer("tokens_used").notNull(),
  cost: doublePrecision("cost").default(0), // custo em USD
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
  parentNotificationId: integer("parent_notification_id").references(() => notifications.id), // referência à notificação pai
  isResponse: boolean("is_response").default(false).notNull(), // se esta notificação é uma resposta
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

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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



// Municipal Managers Table - NEW HIERARCHY LEVEL 2: GESTOR MUNICIPAL
export const municipalManagers = pgTable("municipal_managers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  municipalityName: text("municipality_name").notNull(),
  municipalityCode: text("municipality_code"),
  cnpj: text("cnpj"),
  address: text("address"),
  phone: text("phone"),
  totalLicenses: integer("total_licenses").default(0),
  usedLicenses: integer("used_licenses").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Municipal Schools Table
export const municipalSchools = pgTable("municipal_schools", {
  id: serial("id").primaryKey(),
  municipalManagerId: integer("municipal_manager_id").references(() => municipalManagers.id).notNull(),
  schoolName: text("school_name").notNull(),
  schoolCode: text("school_code"),
  inepCode: text("inep_code"),
  address: text("address"),
  principalName: text("principal_name"),
  principalEmail: text("principal_email"),
  phone: text("phone"),
  allocatedLicenses: integer("allocated_licenses").default(0),
  usedLicenses: integer("used_licenses").default(0),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Municipal Policies Table
export const municipalPolicies = pgTable("municipal_policies", {
  id: serial("id").primaryKey(),
  municipalManagerId: integer("municipal_manager_id").references(() => municipalManagers.id).notNull(),
  policyType: text("policy_type").notNull(),
  policyName: text("policy_name").notNull(),
  policyValue: text("policy_value"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Directors Table - NEW HIERARCHY LEVEL 3: DIRETOR DE ESCOLA
export const schoolDirectors = pgTable("school_directors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").unique().references(() => users.id).notNull(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  directorCode: text("director_code").unique(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Classes Table
export const schoolClasses = pgTable("school_classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  className: text("class_name").notNull(), // "1º Ano A", "5º Ano B", etc.
  grade: text("grade").notNull(), // "1", "2", "3", etc.
  section: text("section").notNull(), // "A", "B", "C", etc.
  academicYear: text("academic_year").notNull(),
  maxStudents: integer("max_students").default(30),
  currentStudents: integer("current_students").default(0),
  allocatedLicenses: integer("allocated_licenses").default(0),
  usedLicenses: integer("used_licenses").default(0),
  coordinatorId: integer("coordinator_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Invitations Table
export const schoolInvitations = pgTable("school_invitations", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  directorId: integer("director_id").references(() => schoolDirectors.id).notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // 'teacher', 'student'
  classId: integer("class_id").references(() => schoolClasses.id),
  invitationCode: text("invitation_code").unique().notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'expired'
  documentRequired: boolean("document_required").default(false),
  documentVerified: boolean("document_verified").default(false),
  expiresAt: timestamp("expires_at"),
  sentAt: timestamp("sent_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// School User Approvals Table
export const schoolUserApprovals = pgTable("school_user_approvals", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  requestedRole: text("requested_role").notNull(),
  classId: integer("class_id").references(() => schoolClasses.id),
  requesterId: integer("requester_id").references(() => users.id), // quem fez a solicitação
  approverId: integer("approver_id").references(() => users.id), // diretor que aprovou/rejeitou
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
  reason: text("reason"), // motivo da aprovação/rejeição
  documentsSubmitted: jsonb("documents_submitted"),
  parentalConsent: boolean("parental_consent").default(false), // para menores
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// School Reports Table
export const schoolReports = pgTable("school_reports", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  reportType: text("report_type").notNull(), // 'usage', 'pedagogical', 'compliance', 'security'
  title: text("title").notNull(),
  description: text("description"),
  data: jsonb("data"), // dados do relatório em formato JSON
  generatedBy: integer("generated_by").references(() => users.id).notNull(),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  isPublic: boolean("is_public").default(false), // se pode ser visto pelo gestor municipal
  createdAt: timestamp("created_at").defaultNow(),
});

// School Configurations Table
export const schoolConfigs = pgTable("school_configs", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => municipalSchools.id).notNull(),
  configKey: text("config_key").notNull(),
  configValue: text("config_value").notNull(),
  configType: text("config_type").notNull(), // 'token_limit', 'age_restriction', 'content_filter', etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas for municipal tables
export const insertMunicipalManagerSchema = createInsertSchema(municipalManagers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMunicipalSchoolSchema = createInsertSchema(municipalSchools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMunicipalPolicySchema = createInsertSchema(municipalPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for municipal tables
export type MunicipalManager = typeof municipalManagers.$inferSelect;
export type InsertMunicipalManager = z.infer<typeof insertMunicipalManagerSchema>;

export type MunicipalSchool = typeof municipalSchools.$inferSelect;
export type InsertMunicipalSchool = z.infer<typeof insertMunicipalSchoolSchema>;

export type MunicipalPolicy = typeof municipalPolicies.$inferSelect;
export type InsertMunicipalPolicy = z.infer<typeof insertMunicipalPolicySchema>;

// Insert schemas for school tables
export const insertSchoolDirectorSchema = createInsertSchema(schoolDirectors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolClassSchema = createInsertSchema(schoolClasses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolInvitationSchema = createInsertSchema(schoolInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolUserApprovalSchema = createInsertSchema(schoolUserApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolReportSchema = createInsertSchema(schoolReports).omit({
  id: true,
  createdAt: true,
});

export const insertSchoolConfigSchema = createInsertSchema(schoolConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for school tables
export type SchoolDirector = typeof schoolDirectors.$inferSelect;
export type InsertSchoolDirector = z.infer<typeof insertSchoolDirectorSchema>;

export type SchoolClass = typeof schoolClasses.$inferSelect;
export type InsertSchoolClass = z.infer<typeof insertSchoolClassSchema>;

export type SchoolInvitation = typeof schoolInvitations.$inferSelect;
export type InsertSchoolInvitation = z.infer<typeof insertSchoolInvitationSchema>;

export type SchoolUserApproval = typeof schoolUserApprovals.$inferSelect;
export type InsertSchoolUserApproval = z.infer<typeof insertSchoolUserApprovalSchema>;

export type SchoolReport = typeof schoolReports.$inferSelect;
export type InsertSchoolReport = z.infer<typeof insertSchoolReportSchema>;

export type SchoolConfig = typeof schoolConfigs.$inferSelect;
export type InsertSchoolConfig = z.infer<typeof insertSchoolConfigSchema>;

// Types for School table
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

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



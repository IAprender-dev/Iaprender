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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, jsonb, primaryKey, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums essenciais
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const schoolStatusEnum = pgEnum('school_status', ['active', 'inactive', 'suspended']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// 1. TABELA PRINCIPAL: Empresas/Secretarias
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  status: userStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. TABELA DE CONTRATOS/LICENÇAS
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  maxUsers: integer("max_users").notNull(),
  monthlyPrice: doublePrecision("monthly_price").notNull(),
  status: contractStatusEnum("status").default('active').notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. TABELA DE ESCOLAS (Hierarquia simples)
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  contractId: integer("contract_id").references(() => contracts.id).notNull(),
  name: text("name").notNull(),
  inep: text("inep"),
  cnpj: text("cnpj"),
  address: text("address"),
  neighborhood: text("neighborhood"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  numberOfStudents: integer("number_of_students").default(0),
  numberOfTeachers: integer("number_of_teachers").default(0),
  numberOfClassrooms: integer("number_of_classrooms").default(0),
  status: schoolStatusEnum("status").default('active').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 4. TABELA DE USUÁRIOS (Hierarquia completa)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('student'),
  status: userStatusEnum("status").default('active').notNull(),
  
  // Hierarquia organizacional
  companyId: integer("company_id").references(() => companies.id), // Para gestores municipais
  contractId: integer("contract_id").references(() => contracts.id), // Para diretores (1 contrato específico)
  schoolId: integer("school_id").references(() => schools.id), // Para professores e alunos
  
  // Dados pessoais
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  
  // Dados educacionais (para estudantes)
  schoolYear: text("school_year"), // 1º ano, 2º ano, etc.
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  isMinor: boolean("is_minor").default(true),
  
  // Autenticação e controle
  firstLogin: boolean("first_login").default(true).notNull(),
  forcePasswordChange: boolean("force_password_change").default(false),
  profileImage: text("profile_image"),
  
  // AWS Cognito integration
  cognitoUserId: text("cognito_user_id").unique(),
  cognitoGroup: cognitoGroupEnum("cognito_group"),
  cognitoStatus: text("cognito_status"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. TABELA DE USAGE DE TOKENS IA (Simplicada)
export const aiTokenUsage = pgTable("ai_token_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  contractId: integer("contract_id").references(() => contracts.id),
  provider: text("provider").notNull(), // openai, anthropic, perplexity
  model: text("model").notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  cost: doublePrecision("cost").notNull(),
  requestType: text("request_type"), // chat, image, analysis
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas para TypeScript
export const insertCompany = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContract = createInsertSchema(contracts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSchool = createInsertSchema(schools).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUser = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAiTokenUsage = createInsertSchema(aiTokenUsage).omit({ id: true, createdAt: true });

// Types para TypeScript
export type Company = typeof companies.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type School = typeof schools.$inferSelect;
export type User = typeof users.$inferSelect;
export type AiTokenUsage = typeof aiTokenUsage.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompany>;
export type InsertContract = z.infer<typeof insertContract>;
export type InsertSchool = z.infer<typeof insertSchool>;
export type InsertUser = z.infer<typeof insertUser>;
export type InsertAiTokenUsage = z.infer<typeof insertAiTokenUsage>;
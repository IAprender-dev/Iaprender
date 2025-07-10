import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// Tabela de Empresas (estrutura real do banco)
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  telefone: varchar('telefone', { length: 20 }),
  emailContato: text('email_contato').notNull(),
  endereco: text('endereco'),
  cidade: text('cidade'),
  estado: varchar('estado', { length: 2 }),
  logo: text('logo'),
  criadoPor: text('criado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// Tabela de Contratos (estrutura real do banco)
export const contratos = pgTable('contratos', {
  id: serial('id').primaryKey(),
  empresaId: integer('empresa_id').notNull().references(() => empresas.id),
  descricao: text('descricao'),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim').notNull(),
  numeroLicencas: integer('numero_licencas'),
  valorTotal: doublePrecision('valor_total').notNull(),
  documentoPdf: text('documento_pdf'),
  status: contractStatusEnum('status').default('active'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// Tabela de Usuários (estrutura real do banco)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username'),
  password: text('password'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  role: text('role'),
  status: text('status'),
  firstLogin: boolean('first_login').default(true),
  forcePasswordChange: boolean('force_password_change').default(false),
  profileImage: text('profile_image'),
  contractId: integer('contract_id').references(() => contratos.id),
  schoolYear: text('school_year'),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  phone: text('phone'),
  address: text('address'),
  dateOfBirth: date('date_of_birth'),
  updatedAt: timestamp('updated_at').defaultNow(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  parentContact: text('parent_contact'),
  emergencyContact: text('emergency_contact'),
  parentName: text('parent_name'),
  parentEmail: text('parent_email'),
  parentPhone: text('parent_phone'),
  isMinor: boolean('is_minor').default(false),
  cognitoUserId: text('cognito_user_id').unique(),
  cognitoGroup: text('cognito_group'),
  cognitoStatus: text('cognito_status'),
  companyId: integer('company_id').references(() => empresas.id),
});

// Relacionamentos
export const empresasRelations = relations(empresas, ({ many }) => ({
  contratos: many(contratos),
  usuarios: many(users),
}));

export const contratosRelations = relations(contratos, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [contratos.empresaId],
    references: [empresas.id],
  }),
  usuarios: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  empresa: one(empresas, {
    fields: [users.companyId],
    references: [empresas.id],
  }),
  contrato: one(contratos, {
    fields: [users.contractId],
    references: [contratos.id],
  }),
}));

// Schemas de inserção
export const insertEmpresaSchema = createInsertSchema(empresas).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertContratoSchema = createInsertSchema(contratos).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

// Tipos
export type Empresa = typeof empresas.$inferSelect;
export type InsertEmpresa = z.infer<typeof insertEmpresaSchema>;

export type Contrato = typeof contratos.$inferSelect;
export type InsertContrato = z.infer<typeof insertContratoSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
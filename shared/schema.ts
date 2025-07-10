import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// Tabela de Empresas
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  razaoSocial: text('razao_social').notNull(),
  telefone: varchar('telefone', { length: 20 }),
  email: text('email').notNull(),
  endereco: text('endereco'),
  cidade: text('cidade'),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  responsavel: text('responsavel'),
  cargoResponsavel: text('cargo_responsavel'),
  observacoes: text('observacoes'),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Contratos
export const contratos = pgTable('contratos', {
  id: serial('id').primaryKey(),
  numero: varchar('numero', { length: 50 }).notNull().unique(),
  nome: text('nome').notNull(),
  empresaId: integer('empresa_id').notNull().references(() => empresas.id),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim').notNull(),
  valor: doublePrecision('valor').notNull(),
  moeda: varchar('moeda', { length: 3 }).default('BRL'),
  status: contractStatusEnum('status').default('active'),
  tipoContrato: text('tipo_contrato'),
  descricao: text('descricao'),
  observacoes: text('observacoes'),
  arquivo: text('arquivo'),
  responsavelContrato: text('responsavel_contrato'),
  emailResponsavel: text('email_responsavel'),
  telefoneResponsavel: varchar('telefone_responsavel', { length: 20 }),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Usuários
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  cognitoSub: text('cognito_sub').unique(),
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  role: userRoleEnum('role').default('student'),
  status: userStatusEnum('status').default('active'),
  empresaId: integer('empresa_id').references(() => empresas.id),
  contratoId: integer('contrato_id').references(() => contratos.id),
  primeiroLogin: boolean('primeiro_login').default(true),
  ultimoLoginEm: timestamp('ultimo_login_em'),
  configuracoes: text('configuracoes'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
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
    fields: [users.empresaId],
    references: [empresas.id],
  }),
  contrato: one(contratos, {
    fields: [users.contratoId],
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
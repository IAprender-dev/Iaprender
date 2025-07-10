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
  status: varchar('status').default('active'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// Tabela de Usuários (baseado na estrutura real do banco)
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  cognitoSub: text('cognito_sub').unique(),
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  tipoUsuario: varchar('tipo_usuario').notNull(),
  empresaId: integer('empresa_id').references(() => empresas.id),
  telefone: varchar('telefone'),
  documentoIdentidade: varchar('documento_identidade'),
  dataNascimento: date('data_nascimento'),
  genero: varchar('genero'),
  endereco: text('endereco'),
  cidade: text('cidade'),
  estado: varchar('estado', { length: 2 }),
  fotoPerfil: text('foto_perfil'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Manter compatibilidade com sistema anterior
export const users = usuarios;

// Relacionamentos
export const empresasRelations = relations(empresas, ({ many }) => ({
  contratos: many(contratos),
  usuarios: many(usuarios),
}));

export const contratosRelations = relations(contratos, ({ one }) => ({
  empresa: one(empresas, {
    fields: [contratos.empresaId],
    references: [empresas.id],
  }),
}));

export const usuariosRelations = relations(usuarios, ({ one }) => ({
  empresa: one(empresas, {
    fields: [usuarios.empresaId],
    references: [empresas.id],
  }),
}));

// Manter compatibilidade
export const usersRelations = usuariosRelations;

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
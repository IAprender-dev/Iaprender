import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// Tabela de Empresas (estrutura corrigida para integridade perfeita)
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  cnpj: varchar('cnpj', { length: 18 }).notNull().unique(),
  razaoSocial: text('razao_social'),
  telefone: varchar('telefone', { length: 20 }),
  emailContato: text('email_contato').notNull(),
  endereco: text('endereco'),
  cidade: text('cidade'),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  logo: text('logo'),
  responsavel: text('responsavel'),
  cargoResponsavel: text('cargo_responsavel'),
  observacoes: text('observacoes'),
  ativo: boolean('ativo').default(true),
  criadoPor: integer('criado_por'), // Será relacionado após criação da tabela usuários
  atualizadoPor: integer('atualizado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Contratos (estrutura corrigida para integridade perfeita)
export const contratos = pgTable('contratos', {
  id: serial('id').primaryKey(),
  numero: varchar('numero', { length: 50 }).notNull().unique(),
  nome: text('nome').notNull(),
  empresaId: integer('empresa_id').notNull().references(() => empresas.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  descricao: text('descricao'),
  objeto: text('objeto'),
  tipoContrato: varchar('tipo_contrato', { length: 100 }),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim').notNull(),
  valor: doublePrecision('valor_total').notNull(),
  moeda: varchar('moeda', { length: 3 }).default('BRL'),
  numeroLicencas: integer('numero_licencas').default(0),
  documentoPdf: text('documento_pdf'),
  status: contractStatusEnum('status').default('active'),
  responsavelContrato: text('responsavel_contrato'),
  emailResponsavel: text('email_responsavel'),
  telefoneResponsavel: varchar('telefone_responsavel', { length: 20 }),
  observacoes: text('observacoes'),
  criadoPor: integer('criado_por'), // Relacionamento com usuários
  atualizadoPor: integer('atualizado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Usuários (estrutura corrigida para integridade perfeita)
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  cognitoSub: text('cognito_sub').unique(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  nome: text('nome').notNull(), // Campo computed firstName + lastName
  tipoUsuario: userRoleEnum('tipo_usuario').notNull(),
  status: userStatusEnum('status').default('active'),
  
  // Relacionamentos organizacionais
  empresaId: integer('empresa_id').references(() => empresas.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  contratoId: integer('contrato_id').references(() => contratos.id, { onDelete: 'set null', onUpdate: 'cascade' }),
  
  // Dados pessoais
  telefone: varchar('telefone', { length: 20 }),
  documentoIdentidade: varchar('documento_identidade', { length: 20 }),
  dataNascimento: date('data_nascimento'),
  genero: varchar('genero', { length: 20 }),
  endereco: text('endereco'),
  cidade: text('cidade'),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  fotoPerfil: text('foto_perfil'),
  
  // Dados para menores de idade
  isMenor: boolean('is_menor').default(false),
  nomeResponsavel: text('nome_responsavel'),
  emailResponsavel: text('email_responsavel'),
  telefoneResponsavel: varchar('telefone_responsavel', { length: 20 }),
  contatoEmergencia: text('contato_emergencia'),
  
  // Campos de auditoria
  criadoPor: integer('criado_por'),
  atualizadoPor: integer('atualizado_por'),
  ultimoLogin: timestamp('ultimo_login'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Manter compatibilidade com sistema anterior
export const users = usuarios;

// Relacionamentos com integridade perfeita
export const empresasRelations = relations(empresas, ({ many, one }) => ({
  // Uma empresa pode ter muitos contratos
  contratos: many(contratos, { relationName: 'empresa_contratos' }),
  
  // Uma empresa pode ter muitos usuários
  usuarios: many(usuarios, { relationName: 'empresa_usuarios' }),
  
  // Relacionamentos de auditoria
  criador: one(usuarios, {
    fields: [empresas.criadoPor],
    references: [usuarios.id],
    relationName: 'empresa_criador'
  }),
  atualizador: one(usuarios, {
    fields: [empresas.atualizadoPor],
    references: [usuarios.id],
    relationName: 'empresa_atualizador'
  }),
}));

export const contratosRelations = relations(contratos, ({ one, many }) => ({
  // Um contrato pertence a uma empresa
  empresa: one(empresas, {
    fields: [contratos.empresaId],
    references: [empresas.id],
    relationName: 'empresa_contratos'
  }),
  
  // Um contrato pode ter muitos usuários vinculados
  usuarios: many(usuarios, { relationName: 'contrato_usuarios' }),
  
  // Relacionamentos de auditoria
  criador: one(usuarios, {
    fields: [contratos.criadoPor],
    references: [usuarios.id],
    relationName: 'contrato_criador'
  }),
  atualizador: one(usuarios, {
    fields: [contratos.atualizadoPor],
    references: [usuarios.id],
    relationName: 'contrato_atualizador'
  }),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  // Um usuário pertence a uma empresa
  empresa: one(empresas, {
    fields: [usuarios.empresaId],
    references: [empresas.id],
    relationName: 'empresa_usuarios'
  }),
  
  // Um usuário pode estar vinculado a um contrato específico
  contrato: one(contratos, {
    fields: [usuarios.contratoId],
    references: [contratos.id],
    relationName: 'contrato_usuarios'
  }),
  
  // Relacionamentos de auditoria (quem criou/atualizou)
  criador: one(usuarios, {
    fields: [usuarios.criadoPor],
    references: [usuarios.id],
    relationName: 'usuario_criador'
  }),
  atualizador: one(usuarios, {
    fields: [usuarios.atualizadoPor],
    references: [usuarios.id],
    relationName: 'usuario_atualizador'
  }),
  
  // Relacionamentos inversos para auditoria
  empresasCriadas: many(empresas, { relationName: 'empresa_criador' }),
  empresasAtualizadas: many(empresas, { relationName: 'empresa_atualizador' }),
  contratosCriados: many(contratos, { relationName: 'contrato_criador' }),
  contratosAtualizados: many(contratos, { relationName: 'contrato_atualizador' }),
  usuariosCriados: many(usuarios, { relationName: 'usuario_criador' }),
  usuariosAtualizados: many(usuarios, { relationName: 'usuario_atualizador' }),
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
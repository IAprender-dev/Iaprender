import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);

// Tabela de Empresas (estrutura baseada no banco real)
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  cnpj: varchar('cnpj', { length: 18 }),
  razaoSocial: text('razao_social'),
  telefone: varchar('telefone', { length: 20 }),
  emailContato: varchar('email_contato'),
  endereco: text('endereco'),
  cidade: varchar('cidade'),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  logo: text('logo'),
  responsavel: text('responsavel'),
  cargoResponsavel: text('cargo_responsavel'),
  observacoes: text('observacoes'),
  criadoPor: integer('criado_por'),
  atualizadoPor: integer('atualizado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Contratos (estrutura baseada no banco real)
export const contratos = pgTable('contratos', {
  id: serial('id').primaryKey(),
  numero: varchar('numero', { length: 50 }),
  nome: text('nome'),
  empresaId: integer('empresa_id'),
  descricao: text('descricao'),
  objeto: text('objeto'),
  tipoContrato: varchar('tipo_contrato', { length: 100 }),
  dataInicio: date('data_inicio').notNull(),
  dataFim: date('data_fim').notNull(),
  valorTotal: doublePrecision('valor_total'),
  moeda: varchar('moeda', { length: 3 }).default('BRL'),
  numeroLicencas: integer('numero_licencas'),
  documentoPdf: text('documento_pdf'),
  status: varchar('status').default('ativo'),
  responsavelContrato: text('responsavel_contrato'),
  emailResponsavel: text('email_responsavel'),
  telefoneResponsavel: varchar('telefone_responsavel', { length: 20 }),
  observacoes: text('observacoes'),
  criadoPor: integer('criado_por'),
  atualizadoPor: integer('atualizado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Usuários (estrutura baseada no banco real)
export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  cognitoSub: text('cognito_sub').unique(),
  email: varchar('email').notNull(),
  nome: varchar('nome').notNull(),
  tipoUsuario: varchar('tipo_usuario').notNull(),
  empresaId: integer('empresa_id'),
  contratoId: integer('contrato_id'),
  telefone: varchar('telefone'),
  documentoIdentidade: varchar('documento_identidade'),
  dataNascimento: date('data_nascimento'),
  genero: varchar('genero'),
  endereco: text('endereco'),
  cidade: varchar('cidade'),
  estado: varchar('estado'),
  fotoPerfil: text('foto_perfil'),
  status: varchar('status').default('active'),
  criadoPor: integer('criado_por'),
  atualizadoPor: integer('atualizado_por'),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Gestores (estrutura baseada no banco real)
export const gestores = pgTable('gestores', {
  id: serial('id').primaryKey(),
  usr_id: integer('usr_id'),
  empresa_id: integer('empresa_id'),
  nome: varchar('nome'),
  cargo: varchar('cargo'),
  data_admissao: date('data_admissao'),
  status: varchar('status').default('ativo'),
});

// Tabela de Diretores (estrutura baseada no banco real)
export const diretores = pgTable('diretores', {
  id: serial('id').primaryKey(),
  usr_id: integer('usr_id'),
  escola_id: integer('escola_id'),
  empresa_id: integer('empresa_id'),
  nome: varchar('nome'),
  cargo: varchar('cargo'),
  data_inicio: date('data_inicio'),
  status: varchar('status').default('ativo'),
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
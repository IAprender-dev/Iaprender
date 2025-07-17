import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, date, doublePrecision, varchar, uuid, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'municipal_manager', 'school_director', 'teacher', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended', 'blocked']);
export const contractStatusEnum = pgEnum('contract_status', ['active', 'pending', 'expired', 'cancelled']);
export const cognitoGroupEnum = pgEnum('cognito_group', ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos']);
export const resourceTypeEnum = pgEnum('resource_type', ['teacher', 'student']);
export const papelUsuarioEnum = pgEnum('papel_usuario', ['admin', 'gestor', 'diretor', 'professor', 'aluno']);

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
  cognitoUsername: varchar('cognito_username'),
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

// Tabela de Professores (estrutura baseada no banco real)
export const professores = pgTable('professores', {
  id: serial('id').primaryKey(),
  usr_id: integer('usr_id'),
  escola_id: integer('escola_id'),
  empresa_id: integer('empresa_id'),
  nome: varchar('nome'),
  disciplinas: text('disciplinas'),
  formacao: text('formacao'),
  data_admissao: date('data_admissao'),
  status: varchar('status').default('ativo'),
});

// Tabela de Escolas (estrutura baseada no banco real)
export const escolas = pgTable('escolas', {
  id: serial('id').primaryKey(),
  nome: varchar('nome').notNull(),
  codigo_inep: varchar('codigo_inep', { length: 8 }).unique(),
  cnpj: varchar('cnpj', { length: 18 }),
  tipo_escola: varchar('tipo_escola'), // Municipal, Estadual, Federal, Privada
  endereco: text('endereco'),
  cidade: varchar('cidade'),
  estado: varchar('estado', { length: 2 }),
  cep: varchar('cep', { length: 10 }),
  telefone: varchar('telefone', { length: 20 }),
  email: varchar('email'),
  diretor_responsavel: varchar('diretor_responsavel'),
  contrato_id: integer('contrato_id'),
  empresa_id: integer('empresa_id'),
  capacidade_alunos: integer('capacidade_alunos'),
  data_fundacao: date('data_fundacao'),
  status: varchar('status').default('ativa'),
  observacoes: text('observacoes'),
  criado_por: integer('criado_por'),
  atualizado_por: integer('atualizado_por'),
  criado_em: timestamp('criado_em').defaultNow(),
  atualizado_em: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Alunos (estrutura baseada no banco real)
export const alunos = pgTable('alunos', {
  id: serial('id').primaryKey(),
  usr_id: integer('usr_id'),
  escola_id: integer('escola_id'),
  empresa_id: integer('empresa_id'),
  matricula: varchar('matricula').notNull(),
  nome: varchar('nome'),
  turma: varchar('turma'),
  serie: varchar('serie'),
  turno: varchar('turno'),
  nome_responsavel: varchar('nome_responsavel'),
  contato_responsavel: varchar('contato_responsavel'),
  data_matricula: date('data_matricula'),
  status: varchar('status').default('ativo'),
  criado_em: timestamp('criado_em'),
});

// Tabela de Arquivos S3 (nova)
export const arquivos = pgTable('arquivos', {
  uuid: uuid('uuid').primaryKey().defaultRandom(),
  empresaId: integer('empresa_id').notNull(),
  contratoId: integer('contrato_id'),
  escolaId: integer('escola_id'),
  usuarioId: integer('usuario_id').notNull(),
  tipoUsuario: papelUsuarioEnum('tipo_usuario').notNull(),
  s3Key: text('s3_key').notNull(),
  descricao: text('descricao'),
  tipoArquivo: text('tipo_arquivo'),
  tamanhoBytes: bigint('tamanho_bytes', { mode: 'number' }),
  mimeType: text('mime_type'),
  metadata: jsonb('metadata'),
  status: varchar('status').default('ativo'),
  criadoEm: timestamp('criado_em').defaultNow(),
  criadoPor: integer('criado_por'),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
  atualizadoPor: integer('atualizado_por'),
});

// Tabela de Preferências de IA (nova)
export const aiPreferences = pgTable('ai_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  defaultAI: varchar('default_ai', { length: 50 }).default('chatgpt'),
  autoStartSession: boolean('auto_start_session').default(false),
  saveConversations: boolean('save_conversations').default(true),
  responseLanguage: varchar('response_language', { length: 10 }).default('pt-BR'),
  complexityLevel: varchar('complexity_level', { length: 20 }).default('intermediario'),
  customPrompts: boolean('custom_prompts').default(false),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

// Tabela de Configurações de Recursos de IA (nova)
export const aiResourceConfigs = pgTable('ai_resource_configs', {
  id: serial('id').primaryKey(),
  resourceId: varchar('resource_id', { length: 100 }).notNull().unique(), // teacher-0, student-0, etc.
  resourceName: varchar('resource_name', { length: 200 }).notNull(),
  resourceType: resourceTypeEnum('resource_type').notNull(),
  selectedModel: varchar('selected_model', { length: 200 }).notNull(), // AWS Bedrock model ID
  modelName: varchar('model_name', { length: 200 }), // Nome amigável do modelo
  temperature: doublePrecision('temperature').default(0.7),
  maxTokens: integer('max_tokens').default(1000),
  enabled: boolean('enabled').default(true),
  configuredBy: integer('configured_by'), // ID do admin que configurou
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
  
  // Uma empresa pode ter muitas escolas
  escolas: many(escolas, { relationName: 'empresa_escolas' }),
  
  // Uma empresa pode ter muitos gestores
  gestores: many(gestores, { relationName: 'empresa_gestores' }),
  
  // Uma empresa pode ter muitos diretores
  diretores: many(diretores, { relationName: 'empresa_diretores' }),
  
  // Uma empresa pode ter muitos professores
  professores: many(professores, { relationName: 'empresa_professores' }),
  
  // Uma empresa pode ter muitos alunos
  alunos: many(alunos, { relationName: 'empresa_alunos' }),
  
  // Uma empresa pode ter muitos arquivos
  arquivos: many(arquivos, { relationName: 'empresa_arquivos' }),
  
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
  
  // Preferências de IA
  aiPreferences: one(aiPreferences, {
    fields: [usuarios.id],
    references: [aiPreferences.userId],
    relationName: 'usuario_ai_preferences'
  }),
  
  // Arquivos criados pelo usuário
  arquivosCriados: many(arquivos, { relationName: 'usuario_arquivos_criados' }),
  
  // Arquivos atualizados pelo usuário
  arquivosAtualizados: many(arquivos, { relationName: 'usuario_arquivos_atualizados' }),
}));

// Relacionamentos da tabela escolas
export const escolasRelations = relations(escolas, ({ one, many }) => ({
  // Uma escola pertence a uma empresa
  empresa: one(empresas, {
    fields: [escolas.empresa_id],
    references: [empresas.id],
    relationName: 'empresa_escolas'
  }),
  
  // Uma escola pertence a um contrato
  contrato: one(contratos, {
    fields: [escolas.contrato_id],
    references: [contratos.id],
    relationName: 'contrato_escolas'
  }),
  
  // Uma escola pode ter muitos diretores
  diretores: many(diretores, { relationName: 'escola_diretores' }),
  
  // Uma escola pode ter muitos professores
  professores: many(professores, { relationName: 'escola_professores' }),
  
  // Uma escola pode ter muitos alunos
  alunos: many(alunos, { relationName: 'escola_alunos' }),
  
  // Uma escola pode ter muitos arquivos
  arquivos: many(arquivos, { relationName: 'escola_arquivos' }),
  
  // Relacionamentos de auditoria
  criador: one(usuarios, {
    fields: [escolas.criado_por],
    references: [usuarios.id],
    relationName: 'escola_criador'
  }),
  atualizador: one(usuarios, {
    fields: [escolas.atualizado_por],
    references: [usuarios.id],
    relationName: 'escola_atualizador'
  }),
}));

// Relacionamentos das tabelas hierárquicas
export const gestoresRelations = relations(gestores, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [gestores.usr_id],
    references: [usuarios.id],
    relationName: 'usuario_gestor'
  }),
  empresa: one(empresas, {
    fields: [gestores.empresa_id],
    references: [empresas.id],
    relationName: 'empresa_gestores'
  }),
}));

export const diretoresRelations = relations(diretores, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [diretores.usr_id],
    references: [usuarios.id],
    relationName: 'usuario_diretor'
  }),
  escola: one(escolas, {
    fields: [diretores.escola_id],
    references: [escolas.id],
    relationName: 'escola_diretores'
  }),
  empresa: one(empresas, {
    fields: [diretores.empresa_id],
    references: [empresas.id],
    relationName: 'empresa_diretores'
  }),
}));

export const professoresRelations = relations(professores, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [professores.usr_id],
    references: [usuarios.id],
    relationName: 'usuario_professor'
  }),
  escola: one(escolas, {
    fields: [professores.escola_id],
    references: [escolas.id],
    relationName: 'escola_professores'
  }),
  empresa: one(empresas, {
    fields: [professores.empresa_id],
    references: [empresas.id],
    relationName: 'empresa_professores'
  }),
}));

export const alunosRelations = relations(alunos, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [alunos.usr_id],
    references: [usuarios.id],
    relationName: 'usuario_aluno'
  }),
  escola: one(escolas, {
    fields: [alunos.escola_id],
    references: [escolas.id],
    relationName: 'escola_alunos'
  }),
  empresa: one(empresas, {
    fields: [alunos.empresa_id],
    references: [empresas.id],
    relationName: 'empresa_alunos'
  }),
}));

export const aiPreferencesRelations = relations(aiPreferences, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [aiPreferences.userId],
    references: [usuarios.id],
    relationName: 'usuario_ai_preferences'
  }),
}));

export const aiResourceConfigsRelations = relations(aiResourceConfigs, ({ one }) => ({
  configuradoPor: one(usuarios, {
    fields: [aiResourceConfigs.configuredBy],
    references: [usuarios.id],
    relationName: 'usuario_ai_configs'
  }),
}));

// Relacionamentos da tabela arquivos
export const arquivosRelations = relations(arquivos, ({ one }) => ({
  // Um arquivo pertence a uma empresa
  empresa: one(empresas, {
    fields: [arquivos.empresaId],
    references: [empresas.id],
    relationName: 'empresa_arquivos'
  }),
  
  // Um arquivo pode pertencer a um contrato
  contrato: one(contratos, {
    fields: [arquivos.contratoId],
    references: [contratos.id],
    relationName: 'contrato_arquivos'
  }),
  
  // Um arquivo pode pertencer a uma escola
  escola: one(escolas, {
    fields: [arquivos.escolaId],
    references: [escolas.id],
    relationName: 'escola_arquivos'
  }),
  
  // Um arquivo pertence a um usuário
  usuario: one(usuarios, {
    fields: [arquivos.usuarioId],
    references: [usuarios.id],
    relationName: 'usuario_arquivos'
  }),
  
  // Relacionamentos de auditoria
  criador: one(usuarios, {
    fields: [arquivos.criadoPor],
    references: [usuarios.id],
    relationName: 'usuario_arquivos_criados'
  }),
  atualizador: one(usuarios, {
    fields: [arquivos.atualizadoPor],
    references: [usuarios.id],
    relationName: 'usuario_arquivos_atualizados'
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

export const insertAIPreferencesSchema = createInsertSchema(aiPreferences).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertAIResourceConfigSchema = createInsertSchema(aiResourceConfigs).omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export const insertArquivoSchema = createInsertSchema(arquivos).omit({
  uuid: true,
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

export type AIPreferences = typeof aiPreferences.$inferSelect;
export type InsertAIPreferences = z.infer<typeof insertAIPreferencesSchema>;

export type AIResourceConfig = typeof aiResourceConfigs.$inferSelect;
export type InsertAIResourceConfig = z.infer<typeof insertAIResourceConfigSchema>;

export type Arquivo = typeof arquivos.$inferSelect;
export type InsertArquivo = z.infer<typeof insertArquivoSchema>;
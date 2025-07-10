/**
 * MAPEAMENTO DE FORMULÁRIOS - IAPRENDER
 * 
 * Configuração centralizada dos mapeamentos entre formulários frontend
 * e endpoints do backend, incluindo métodos HTTP e validações.
 */

// Mapeamento principal de formulários para endpoints
export const FORM_MAPPING = {
  // === AUTENTICAÇÃO ===
  'form-login': { 
    endpoint: '/api/auth/login', 
    method: 'POST',
    schema: 'loginSchema',
    redirectOnSuccess: '/dashboard'
  },
  'form-register': { 
    endpoint: '/api/auth/register', 
    method: 'POST',
    schema: 'registerSchema',
    redirectOnSuccess: '/auth?login=success'
  },
  'form-logout': { 
    endpoint: '/api/auth/logout', 
    method: 'POST',
    redirectOnSuccess: '/auth'
  },

  // === GESTÃO DE USUÁRIOS ===
  'form-usuario-criar': { 
    endpoint: '/api/usuarios', 
    method: 'POST',
    schema: 'usuarioSchema',
    requiredRole: ['admin', 'gestor']
  },
  'form-usuario-editar': { 
    endpoint: '/api/usuarios/:id', 
    method: 'PATCH',
    schema: 'usuarioUpdateSchema',
    requiredRole: ['admin', 'gestor', 'self']
  },
  'form-usuario-perfil': { 
    endpoint: '/api/usuarios/me', 
    method: 'PATCH',
    schema: 'perfilSchema'
  },

  // === GESTÃO ESCOLAR ===
  'form-escola-criar': { 
    endpoint: '/api/municipal/schools', 
    method: 'POST',
    schema: 'escolaSchema',
    requiredRole: ['admin', 'gestor']
  },
  'form-escola-editar': { 
    endpoint: '/api/municipal/schools/:id', 
    method: 'PATCH',
    schema: 'escolaUpdateSchema',
    requiredRole: ['admin', 'gestor']
  },
  'form-escola-desativar': { 
    endpoint: '/api/municipal/schools/:id/deactivate', 
    method: 'PATCH',
    requiredRole: ['admin']
  },

  // === GESTÃO DE CONTRATOS ===
  'form-contrato-criar': { 
    endpoint: '/api/municipal/contracts', 
    method: 'POST',
    schema: 'contratoSchema',
    requiredRole: ['admin']
  },
  'form-contrato-editar': { 
    endpoint: '/api/municipal/contracts/:id', 
    method: 'PATCH',
    schema: 'contratoUpdateSchema',
    requiredRole: ['admin']
  },

  // === GESTÃO DE EMPRESAS ===
  'form-empresa-criar': { 
    endpoint: '/api/admin/companies', 
    method: 'POST',
    schema: 'empresaSchema',
    requiredRole: ['admin']
  },
  'form-empresa-editar': { 
    endpoint: '/api/admin/companies/:id', 
    method: 'PATCH',
    schema: 'empresaUpdateSchema',
    requiredRole: ['admin']
  },

  // === GESTÃO DE ALUNOS ===
  'form-aluno-criar': { 
    endpoint: '/api/alunos', 
    method: 'POST',
    schema: 'alunoSchema',
    requiredRole: ['admin', 'gestor', 'diretor']
  },
  'form-aluno-editar': { 
    endpoint: '/api/alunos/:id', 
    method: 'PATCH',
    schema: 'alunoUpdateSchema',
    requiredRole: ['admin', 'gestor', 'diretor']
  },
  'form-aluno-transferir': { 
    endpoint: '/api/alunos/:id/transfer', 
    method: 'PATCH',
    schema: 'transferenciaSchema',
    requiredRole: ['admin', 'gestor']
  },

  // === GESTÃO DE PROFESSORES ===
  'form-professor-criar': { 
    endpoint: '/api/professores', 
    method: 'POST',
    schema: 'professorSchema',
    requiredRole: ['admin', 'gestor', 'diretor']
  },
  'form-professor-editar': { 
    endpoint: '/api/professores/:id', 
    method: 'PATCH',
    schema: 'professorUpdateSchema',
    requiredRole: ['admin', 'gestor', 'diretor']
  },

  // === GESTÃO DE DIRETORES ===
  'form-diretor-criar': { 
    endpoint: '/api/municipal/directors', 
    method: 'POST',
    schema: 'diretorSchema',
    requiredRole: ['admin', 'gestor']
  },
  'form-diretor-editar': { 
    endpoint: '/api/municipal/directors/:id', 
    method: 'PATCH',
    schema: 'diretorUpdateSchema',
    requiredRole: ['admin', 'gestor']
  },

  // === FERRAMENTAS EDUCACIONAIS ===
  'form-plano-aula': { 
    endpoint: '/api/teacher/lesson-plans', 
    method: 'POST',
    schema: 'planoAulaSchema',
    requiredRole: ['professor']
  },
  'form-material-didatico': { 
    endpoint: '/api/teacher/materials', 
    method: 'POST',
    schema: 'materialSchema',
    requiredRole: ['professor']
  },
  'form-atividade': { 
    endpoint: '/api/teacher/activities', 
    method: 'POST',
    schema: 'atividadeSchema',
    requiredRole: ['professor']
  },

  // === GESTÃO DE IA ===
  'form-ai-config': { 
    endpoint: '/api/admin/ai/config', 
    method: 'PATCH',
    schema: 'aiConfigSchema',
    requiredRole: ['admin']
  },
  'form-tokens-config': { 
    endpoint: '/api/admin/tokens/config', 
    method: 'PATCH',
    schema: 'tokensConfigSchema',
    requiredRole: ['admin']
  },

  // === AWS COGNITO ===
  'form-cognito-user': { 
    endpoint: '/api/admin/cognito/users', 
    method: 'POST',
    schema: 'cognitoUserSchema',
    requiredRole: ['admin']
  },
  'form-cognito-group': { 
    endpoint: '/api/admin/cognito/groups', 
    method: 'POST',
    schema: 'cognitoGroupSchema',
    requiredRole: ['admin']
  }
};

// Mapeamento de esquemas de validação Zod
export const SCHEMA_MAPPING = {
  // Autenticação
  loginSchema: () => import('../schemas/auth').then(m => m.loginSchema),
  registerSchema: () => import('../schemas/auth').then(m => m.registerSchema),
  
  // Usuários
  usuarioSchema: () => import('../schemas/usuario').then(m => m.usuarioSchema),
  usuarioUpdateSchema: () => import('../schemas/usuario').then(m => m.usuarioUpdateSchema),
  perfilSchema: () => import('../schemas/usuario').then(m => m.perfilSchema),
  
  // Escolas
  escolaSchema: () => import('../schemas/escola').then(m => m.escolaSchema),
  escolaUpdateSchema: () => import('../schemas/escola').then(m => m.escolaUpdateSchema),
  
  // Contratos
  contratoSchema: () => import('../schemas/contrato').then(m => m.contratoSchema),
  contratoUpdateSchema: () => import('../schemas/contrato').then(m => m.contratoUpdateSchema),
  
  // Empresas
  empresaSchema: () => import('../schemas/empresa').then(m => m.empresaSchema),
  empresaUpdateSchema: () => import('../schemas/empresa').then(m => m.empresaUpdateSchema),
  
  // Alunos
  alunoSchema: () => import('../schemas/aluno').then(m => m.alunoSchema),
  alunoUpdateSchema: () => import('../schemas/aluno').then(m => m.alunoUpdateSchema),
  transferenciaSchema: () => import('../schemas/aluno').then(m => m.transferenciaSchema),
  
  // Professores
  professorSchema: () => import('../schemas/professor').then(m => m.professorSchema),
  professorUpdateSchema: () => import('../schemas/professor').then(m => m.professorUpdateSchema),
  
  // Diretores
  diretorSchema: () => import('../schemas/diretor').then(m => m.diretorSchema),
  diretorUpdateSchema: () => import('../schemas/diretor').then(m => m.diretorUpdateSchema),
  
  // Educacionais
  planoAulaSchema: () => import('../schemas/educacional').then(m => m.planoAulaSchema),
  materialSchema: () => import('../schemas/educacional').then(m => m.materialSchema),
  atividadeSchema: () => import('../schemas/educacional').then(m => m.atividadeSchema),
  
  // IA e Configurações
  aiConfigSchema: () => import('../schemas/config').then(m => m.aiConfigSchema),
  tokensConfigSchema: () => import('../schemas/config').then(m => m.tokensConfigSchema),
  
  // AWS Cognito
  cognitoUserSchema: () => import('../schemas/cognito').then(m => m.cognitoUserSchema),
  cognitoGroupSchema: () => import('../schemas/cognito').then(m => m.cognitoGroupSchema)
};

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS = {
  admin: ['*'], // Acesso total
  gestor: [
    'form-usuario-criar', 'form-usuario-editar',
    'form-escola-criar', 'form-escola-editar',
    'form-aluno-criar', 'form-aluno-editar', 'form-aluno-transferir',
    'form-professor-criar', 'form-professor-editar',
    'form-diretor-criar', 'form-diretor-editar'
  ],
  diretor: [
    'form-aluno-criar', 'form-aluno-editar',
    'form-professor-criar', 'form-professor-editar'
  ],
  professor: [
    'form-plano-aula', 'form-material-didatico', 'form-atividade'
  ],
  aluno: [
    'form-usuario-perfil'
  ]
};

// Estados de formulário padronizados
export const FORM_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATING: 'validating'
};

// Configurações de timeout para diferentes tipos de formulário
export const FORM_TIMEOUTS = {
  default: 30000, // 30 segundos
  upload: 120000, // 2 minutos para uploads
  ai: 60000, // 1 minuto para operações de IA
  auth: 15000 // 15 segundos para autenticação
};

// Utilitários para trabalhar com o mapeamento
export const FormUtils = {
  /**
   * Obtém configuração de um formulário
   */
  getFormConfig(formId) {
    return FORM_MAPPING[formId];
  },

  /**
   * Verifica se usuário tem permissão para um formulário
   */
  hasPermission(formId, userRole) {
    const config = FORM_MAPPING[formId];
    if (!config?.requiredRole) return true;
    
    if (userRole === 'admin') return true;
    return config.requiredRole.includes(userRole);
  },

  /**
   * Constrói URL do endpoint com parâmetros
   */
  buildEndpoint(formId, params = {}) {
    const config = FORM_MAPPING[formId];
    if (!config) return null;
    
    let endpoint = config.endpoint;
    Object.entries(params).forEach(([key, value]) => {
      endpoint = endpoint.replace(`:${key}`, value);
    });
    
    return endpoint;
  },

  /**
   * Obtém schema de validação de forma assíncrona
   */
  async getSchema(schemaName) {
    const schemaLoader = SCHEMA_MAPPING[schemaName];
    if (!schemaLoader) return null;
    
    return await schemaLoader();
  },

  /**
   * Obtém timeout apropriado para tipo de formulário
   */
  getTimeout(formId) {
    const config = FORM_MAPPING[formId];
    if (!config) return FORM_TIMEOUTS.default;
    
    if (formId.includes('upload')) return FORM_TIMEOUTS.upload;
    if (formId.includes('ai-')) return FORM_TIMEOUTS.ai;
    if (formId.includes('auth')) return FORM_TIMEOUTS.auth;
    
    return FORM_TIMEOUTS.default;
  }
};

// Export default para compatibilidade
export default {
  FORM_MAPPING,
  SCHEMA_MAPPING,
  ROLE_PERMISSIONS,
  FORM_STATES,
  FORM_TIMEOUTS,
  FormUtils
};
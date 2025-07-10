/**
 * MAPEAMENTO COMPLETO DE FORMULÁRIOS EXISTENTES - IAPRENDER
 * 
 * Identifica e mapeia todos os formulários encontrados no projeto
 * para adaptar ao novo sistema de templates
 */

export interface FormularioExistente {
  id: string;
  nome: string;
  componente: string;
  localizacao: string;
  endpoint: string;
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  camposObrigatorios: string[];
  validacoesEspecificas: string[];
  rolesPermitidas: string[];
  status: 'ATIVO' | 'LEGADO' | 'PRECISA_ADAPTACAO';
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  categoria: string;
  observacoes?: string;
  templateSugerido: string;
}

/**
 * CATEGORIA 1: FORMULÁRIOS DE AUTENTICAÇÃO
 */
export const formulariosAuth: FormularioExistente[] = [
  {
    id: 'login-form',
    nome: 'Formulário de Login',
    componente: 'LoginForm.tsx',
    localizacao: '/client/src/components/auth/LoginForm.tsx',
    endpoint: '/api/auth/login',
    metodo: 'POST',
    camposObrigatorios: ['email', 'password'],
    validacoesEspecificas: ['email_formato', 'senha_minimo_8_caracteres'],
    rolesPermitidas: ['*'],
    status: 'ATIVO',
    prioridade: 'ALTA',
    categoria: 'Autenticação',
    templateSugerido: 'auth-login'
  },
  {
    id: 'register-form',
    nome: 'Formulário de Registro',
    componente: 'RegisterForm.tsx',
    localizacao: '/client/src/components/auth/RegisterForm.tsx',
    endpoint: '/api/auth/register',
    metodo: 'POST',
    camposObrigatorios: ['firstName', 'lastName', 'email', 'password', 'role'],
    validacoesEspecificas: ['email_formato', 'senha_forte', 'nomes_minimo_2_caracteres'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'ATIVO',
    prioridade: 'ALTA',
    categoria: 'Autenticação',
    templateSugerido: 'auth-register'
  },
  {
    id: 'cognito-auth',
    nome: 'Autenticação AWS Cognito',
    componente: 'CognitoAuth.tsx',
    localizacao: '/client/src/pages/CognitoAuth.tsx',
    endpoint: '/start-login',
    metodo: 'GET',
    camposObrigatorios: [],
    validacoesEspecificas: ['redirect_cognito'],
    rolesPermitidas: ['*'],
    status: 'ATIVO',
    prioridade: 'ALTA',
    categoria: 'Autenticação',
    templateSugerido: 'cognito-redirect'
  }
];

/**
 * CATEGORIA 2: FORMULÁRIOS DE GESTÃO MUNICIPAL
 */
export const formulariosMunicipal: FormularioExistente[] = [
  {
    id: 'escola-criar',
    nome: 'Criar Escola',
    componente: 'SchoolManagementNew.tsx',
    localizacao: '/client/src/pages/municipal/SchoolManagementNew.tsx',
    endpoint: '/api/municipal/schools',
    metodo: 'POST',
    camposObrigatorios: ['name', 'address', 'city', 'state', 'contractId'],
    validacoesEspecificas: ['inep_8_digitos', 'cnpj_formato', 'numero_estudantes_positivo'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'ALTA',
    categoria: 'Gestão Municipal',
    templateSugerido: 'escola-criar',
    observacoes: 'Formulário inline no componente, precisa ser extraído'
  },
  {
    id: 'escola-editar',
    nome: 'Editar Escola',
    componente: 'SchoolManagementNew.tsx',
    localizacao: '/client/src/pages/municipal/SchoolManagementNew.tsx',
    endpoint: '/api/municipal/schools/:id',
    metodo: 'PATCH',
    camposObrigatorios: ['name', 'address', 'city', 'state'],
    validacoesEspecificas: ['inep_8_digitos', 'cnpj_formato', 'numero_estudantes_positivo'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'ALTA',
    categoria: 'Gestão Municipal',
    templateSugerido: 'escola-editar',
    observacoes: 'Modal de edição precisa ser convertido'
  },
  {
    id: 'diretor-criar',
    nome: 'Criar Diretor',
    componente: 'SchoolManagementNew.tsx',
    localizacao: '/client/src/pages/municipal/SchoolManagementNew.tsx',
    endpoint: '/api/municipal/directors',
    metodo: 'POST',
    camposObrigatorios: ['email', 'firstName', 'lastName', 'contractId', 'password'],
    validacoesEspecificas: ['email_unico', 'senha_forte', 'telefone_brasileiro'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'ALTA',
    categoria: 'Gestão Municipal',
    templateSugerido: 'diretor-criar',
    observacoes: 'Formulário inline, precisa ser modularizado'
  },
  {
    id: 'diretor-editar',
    nome: 'Editar Diretor',
    componente: 'SchoolManagementNew.tsx',
    localizacao: '/client/src/pages/municipal/SchoolManagementNew.tsx',
    endpoint: '/api/municipal/directors/:id',
    metodo: 'PATCH',
    camposObrigatorios: ['firstName', 'lastName'],
    validacoesEspecificas: ['telefone_brasileiro', 'email_formato'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Gestão Municipal',
    templateSugerido: 'diretor-editar'
  },
  {
    id: 'contrato-editar',
    nome: 'Editar Contrato',
    componente: 'ContractManagement.tsx',
    localizacao: '/client/src/pages/municipal/ContractManagement.tsx',
    endpoint: '/api/municipal/contracts/:id',
    metodo: 'PATCH',
    camposObrigatorios: ['name', 'description', 'maxUsers'],
    validacoesEspecificas: ['data_valida', 'valor_positivo', 'usuarios_maximo_positivo'],
    rolesPermitidas: ['admin', 'gestor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Gestão Municipal',
    templateSugerido: 'contrato-editar'
  }
];

/**
 * CATEGORIA 3: FORMULÁRIOS EDUCACIONAIS (PROFESSOR)
 */
export const formulariosEducacionais: FormularioExistente[] = [
  {
    id: 'plano-aula',
    nome: 'Criar Plano de Aula',
    componente: 'TeacherDashboard.tsx',
    localizacao: '/client/src/pages/TeacherDashboard.tsx',
    endpoint: '/api/teacher/lesson-plans',
    metodo: 'POST',
    camposObrigatorios: ['titulo', 'disciplina', 'serie', 'objetivos', 'conteudo'],
    validacoesEspecificas: ['titulo_minimo_5_caracteres', 'conteudo_minimo_50_caracteres'],
    rolesPermitidas: ['professor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'ALTA',
    categoria: 'Educacional',
    templateSugerido: 'plano-aula',
    observacoes: 'Integrado com IA para geração automática'
  },
  {
    id: 'material-didatico',
    nome: 'Criar Material Didático',
    componente: 'TeacherDashboard.tsx',
    localizacao: '/client/src/pages/TeacherDashboard.tsx',
    endpoint: '/api/teacher/materials',
    metodo: 'POST',
    camposObrigatorios: ['titulo', 'tipo', 'disciplina', 'descricao'],
    validacoesEspecificas: ['arquivo_pdf_maximo_10mb', 'tipo_material_valido'],
    rolesPermitidas: ['professor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Educacional',
    templateSugerido: 'material-didatico'
  },
  {
    id: 'atividade-aluno',
    nome: 'Criar Atividade',
    componente: 'TeacherDashboard.tsx',
    localizacao: '/client/src/pages/TeacherDashboard.tsx',
    endpoint: '/api/teacher/activities',
    metodo: 'POST',
    camposObrigatorios: ['titulo', 'disciplina', 'tipo', 'instrucoes'],
    validacoesEspecificas: ['data_entrega_futura', 'pontuacao_maxima_positiva'],
    rolesPermitidas: ['professor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Educacional',
    templateSugerido: 'atividade-criar'
  }
];

/**
 * CATEGORIA 4: FORMULÁRIOS DE PERFIL E CONFIGURAÇÃO
 */
export const formulariosPerfil: FormularioExistente[] = [
  {
    id: 'perfil-usuario',
    nome: 'Editar Perfil do Usuário',
    componente: 'Múltiplos componentes',
    localizacao: 'Dashboards diversos',
    endpoint: '/api/usuarios/me',
    metodo: 'PATCH',
    camposObrigatorios: ['nome'],
    validacoesEspecificas: ['telefone_brasileiro', 'campos_especificos_por_role'],
    rolesPermitidas: ['*'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Perfil',
    templateSugerido: 'perfil-usuario'
  },
  {
    id: 'primeiro-acesso',
    nome: 'Primeiro Acesso',
    componente: 'FirstAccess.tsx',
    localizacao: '/client/src/pages/FirstAccess.tsx',
    endpoint: '/api/users/complete-profile',
    metodo: 'POST',
    camposObrigatorios: ['nome', 'telefone', 'senha'],
    validacoesEspecificas: ['senha_forte', 'telefone_brasileiro', 'termos_aceitos'],
    rolesPermitidas: ['*'],
    status: 'ATIVO',
    prioridade: 'ALTA',
    categoria: 'Configuração',
    templateSugerido: 'primeiro-acesso'
  }
];

/**
 * CATEGORIA 5: FORMULÁRIOS DE IA E TOKENS
 */
export const formulariosIA: FormularioExistente[] = [
  {
    id: 'ai-config',
    nome: 'Configuração de IA',
    componente: 'CentralIA.tsx',
    localizacao: '/client/src/pages/CentralIA.tsx',
    endpoint: '/api/admin/ai/config',
    metodo: 'PATCH',
    camposObrigatorios: ['provider', 'model'],
    validacoesEspecificas: ['api_key_valida', 'modelo_suportado'],
    rolesPermitidas: ['admin'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'IA',
    templateSugerido: 'ai-config'
  },
  {
    id: 'tokens-config',
    nome: 'Configuração de Tokens',
    componente: 'TokenDashboard.tsx',
    localizacao: '/client/src/pages/TokenDashboard.tsx',
    endpoint: '/api/admin/tokens/config',
    metodo: 'PATCH',
    camposObrigatorios: ['limite_mensal', 'alerta_percentual'],
    validacoesEspecificas: ['limite_positivo', 'percentual_0_100'],
    rolesPermitidas: ['admin'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'BAIXA',
    categoria: 'IA',
    templateSugerido: 'tokens-config'
  }
];

/**
 * CATEGORIA 6: FORMULÁRIOS DE ALUNOS
 */
export const formulariosAlunos: FormularioExistente[] = [
  {
    id: 'aluno-criar',
    nome: 'Matricular Aluno',
    componente: 'StudentDashboard.tsx',
    localizacao: '/client/src/pages/StudentDashboard.tsx',
    endpoint: '/api/alunos',
    metodo: 'POST',
    camposObrigatorios: ['nome', 'cpf', 'email', 'serie', 'turma'],
    validacoesEspecificas: ['cpf_valido', 'email_unico', 'idade_minima'],
    rolesPermitidas: ['admin', 'gestor', 'diretor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'ALTA',
    categoria: 'Gestão Alunos',
    templateSugerido: 'aluno-criar'
  },
  {
    id: 'aluno-transferir',
    nome: 'Transferir Aluno',
    componente: 'StudentDashboard.tsx',
    localizacao: '/client/src/pages/StudentDashboard.tsx',
    endpoint: '/api/alunos/:id/transfer',
    metodo: 'PATCH',
    camposObrigatorios: ['escola_destino', 'motivo'],
    validacoesEspecificas: ['escola_destino_diferente', 'motivo_minimo_10_caracteres'],
    rolesPermitidas: ['admin', 'gestor', 'diretor'],
    status: 'PRECISA_ADAPTACAO',
    prioridade: 'MEDIA',
    categoria: 'Gestão Alunos',
    templateSugerido: 'aluno-transferir'
  }
];

/**
 * CONSOLIDAÇÃO DE TODOS OS FORMULÁRIOS
 */
export const todosFormularios: FormularioExistente[] = [
  ...formulariosAuth,
  ...formulariosMunicipal,
  ...formulariosEducacionais,
  ...formulariosPerfil,
  ...formulariosIA,
  ...formulariosAlunos
];

/**
 * ESTATÍSTICAS DOS FORMULÁRIOS
 */
export const estatisticasFormularios = {
  total: todosFormularios.length,
  porStatus: {
    ATIVO: todosFormularios.filter(f => f.status === 'ATIVO').length,
    LEGADO: todosFormularios.filter(f => f.status === 'LEGADO').length,
    PRECISA_ADAPTACAO: todosFormularios.filter(f => f.status === 'PRECISA_ADAPTACAO').length
  },
  porPrioridade: {
    ALTA: todosFormularios.filter(f => f.prioridade === 'ALTA').length,
    MEDIA: todosFormularios.filter(f => f.prioridade === 'MEDIA').length,
    BAIXA: todosFormularios.filter(f => f.prioridade === 'BAIXA').length
  },
  porCategoria: todosFormularios.reduce((acc, form) => {
    acc[form.categoria] = (acc[form.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
};

/**
 * PLANO DE ADAPTAÇÃO PRIORIZADO
 */
export const planoAdaptacao = {
  fase1_criticos: todosFormularios.filter(f => 
    f.prioridade === 'ALTA' && f.status === 'PRECISA_ADAPTACAO'
  ),
  fase2_importantes: todosFormularios.filter(f => 
    f.prioridade === 'MEDIA' && f.status === 'PRECISA_ADAPTACAO'
  ),
  fase3_opcionais: todosFormularios.filter(f => 
    f.prioridade === 'BAIXA' && f.status === 'PRECISA_ADAPTACAO'
  )
};

/**
 * FUNÇÕES UTILITÁRIAS
 */
export const FormularioUtils = {
  /**
   * Busca formulário por ID
   */
  buscarPorId(id: string): FormularioExistente | undefined {
    return todosFormularios.find(f => f.id === id);
  },

  /**
   * Filtra formulários por categoria
   */
  buscarPorCategoria(categoria: string): FormularioExistente[] {
    return todosFormularios.filter(f => f.categoria === categoria);
  },

  /**
   * Filtra formulários por status
   */
  buscarPorStatus(status: FormularioExistente['status']): FormularioExistente[] {
    return todosFormularios.filter(f => f.status === status);
  },

  /**
   * Filtra formulários por role permitida
   */
  buscarPorRole(role: string): FormularioExistente[] {
    return todosFormularios.filter(f => 
      f.rolesPermitidas.includes('*') || f.rolesPermitidas.includes(role)
    );
  },

  /**
   * Gera relatório de adaptação
   */
  gerarRelatorioAdaptacao(): string {
    const relatorio = `
# RELATÓRIO DE ADAPTAÇÃO DE FORMULÁRIOS - IAPRENDER

## Resumo Executivo
- **Total de formulários:** ${estatisticasFormularios.total}
- **Precisam adaptação:** ${estatisticasFormularios.porStatus.PRECISA_ADAPTACAO}
- **Já funcionais:** ${estatisticasFormularios.porStatus.ATIVO}
- **Legados:** ${estatisticasFormularios.porStatus.LEGADO}

## Priorização
### FASE 1 - Críticos (${planoAdaptacao.fase1_criticos.length} formulários)
${planoAdaptacao.fase1_criticos.map(f => `- ${f.nome} (${f.categoria})`).join('\n')}

### FASE 2 - Importantes (${planoAdaptacao.fase2_importantes.length} formulários)
${planoAdaptacao.fase2_importantes.map(f => `- ${f.nome} (${f.categoria})`).join('\n')}

### FASE 3 - Opcionais (${planoAdaptacao.fase3_opcionais.length} formulários)
${planoAdaptacao.fase3_opcionais.map(f => `- ${f.nome} (${f.categoria})`).join('\n')}

## Por Categoria
${Object.entries(estatisticasFormularios.porCategoria)
  .map(([cat, count]) => `- **${cat}:** ${count} formulários`)
  .join('\n')}
    `;
    
    return relatorio.trim();
  }
};

export default {
  todosFormularios,
  estatisticasFormularios,
  planoAdaptacao,
  FormularioUtils
};
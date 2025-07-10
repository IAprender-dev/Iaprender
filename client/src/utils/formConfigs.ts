/**
 * CONFIGURAÇÕES PREDEFINIDAS DE FORMULÁRIOS - IAPRENDER
 * 
 * Configurações prontas para formulários comuns do sistema educacional brasileiro
 */

import { FormConfig } from './formGenerator';

/**
 * Estados brasileiros para seleção
 */
export const ESTADOS_BRASILEIROS = [
  { value: 'AC', text: 'Acre' },
  { value: 'AL', text: 'Alagoas' },
  { value: 'AP', text: 'Amapá' },
  { value: 'AM', text: 'Amazonas' },
  { value: 'BA', text: 'Bahia' },
  { value: 'CE', text: 'Ceará' },
  { value: 'DF', text: 'Distrito Federal' },
  { value: 'ES', text: 'Espírito Santo' },
  { value: 'GO', text: 'Goiás' },
  { value: 'MA', text: 'Maranhão' },
  { value: 'MT', text: 'Mato Grosso' },
  { value: 'MS', text: 'Mato Grosso do Sul' },
  { value: 'MG', text: 'Minas Gerais' },
  { value: 'PA', text: 'Pará' },
  { value: 'PB', text: 'Paraíba' },
  { value: 'PR', text: 'Paraná' },
  { value: 'PE', text: 'Pernambuco' },
  { value: 'PI', text: 'Piauí' },
  { value: 'RJ', text: 'Rio de Janeiro' },
  { value: 'RN', text: 'Rio Grande do Norte' },
  { value: 'RS', text: 'Rio Grande do Sul' },
  { value: 'RO', text: 'Rondônia' },
  { value: 'RR', text: 'Roraima' },
  { value: 'SC', text: 'Santa Catarina' },
  { value: 'SP', text: 'São Paulo' },
  { value: 'SE', text: 'Sergipe' },
  { value: 'TO', text: 'Tocantins' }
];

/**
 * Tipos de usuário do sistema
 */
export const TIPOS_USUARIO = [
  { value: 'aluno', text: 'Aluno' },
  { value: 'professor', text: 'Professor' },
  { value: 'diretor', text: 'Diretor' },
  { value: 'gestor', text: 'Gestor Municipal' },
  { value: 'admin', text: 'Administrador' }
];

/**
 * Tipos de escola
 */
export const TIPOS_ESCOLA = [
  { value: 'municipal', text: 'Municipal' },
  { value: 'estadual', text: 'Estadual' },
  { value: 'federal', text: 'Federal' },
  { value: 'particular', text: 'Particular' },
  { value: 'tecnica', text: 'Técnica' },
  { value: 'superior', text: 'Superior' }
];

/**
 * Séries escolares
 */
export const SERIES_ESCOLARES = [
  // Educação Infantil
  { value: 'berçario', text: 'Berçário' },
  { value: 'maternal', text: 'Maternal' },
  { value: 'pre1', text: 'Pré I' },
  { value: 'pre2', text: 'Pré II' },
  
  // Ensino Fundamental I
  { value: '1ano', text: '1º Ano' },
  { value: '2ano', text: '2º Ano' },
  { value: '3ano', text: '3º Ano' },
  { value: '4ano', text: '4º Ano' },
  { value: '5ano', text: '5º Ano' },
  
  // Ensino Fundamental II
  { value: '6ano', text: '6º Ano' },
  { value: '7ano', text: '7º Ano' },
  { value: '8ano', text: '8º Ano' },
  { value: '9ano', text: '9º Ano' },
  
  // Ensino Médio
  { value: '1em', text: '1º Ano EM' },
  { value: '2em', text: '2º Ano EM' },
  { value: '3em', text: '3º Ano EM' },
  
  // Ensino Técnico
  { value: '1tecnico', text: '1º Módulo Técnico' },
  { value: '2tecnico', text: '2º Módulo Técnico' },
  { value: '3tecnico', text: '3º Módulo Técnico' },
  { value: '4tecnico', text: '4º Módulo Técnico' }
];

/**
 * Turnos escolares
 */
export const TURNOS_ESCOLARES = [
  { value: 'matutino', text: 'Matutino' },
  { value: 'vespertino', text: 'Vespertino' },
  { value: 'noturno', text: 'Noturno' },
  { value: 'integral', text: 'Integral' },
  { value: 'intermediario', text: 'Intermediário' }
];

/**
 * Disciplinas escolares
 */
export const DISCIPLINAS = [
  { value: 'matematica', text: 'Matemática' },
  { value: 'portugues', text: 'Português' },
  { value: 'ciencias', text: 'Ciências' },
  { value: 'historia', text: 'História' },
  { value: 'geografia', text: 'Geografia' },
  { value: 'fisica', text: 'Física' },
  { value: 'quimica', text: 'Química' },
  { value: 'biologia', text: 'Biologia' },
  { value: 'ingles', text: 'Inglês' },
  { value: 'espanhol', text: 'Espanhol' },
  { value: 'educacao_fisica', text: 'Educação Física' },
  { value: 'artes', text: 'Artes' },
  { value: 'filosofia', text: 'Filosofia' },
  { value: 'sociologia', text: 'Sociologia' },
  { value: 'literatura', text: 'Literatura' },
  { value: 'redacao', text: 'Redação' },
  { value: 'informatica', text: 'Informática' },
  { value: 'ensino_religioso', text: 'Ensino Religioso' }
];

/**
 * Configuração: Cadastro de Usuário
 */
export const FORM_CADASTRO_USUARIO: FormConfig = {
  id: 'cadastro-usuario',
  title: 'Cadastro de Usuário',
  description: 'Criar nova conta no sistema IAprender',
  endpoint: '/api/usuarios',
  method: 'POST',
  submitText: 'Cadastrar Usuário',
  showReset: true,
  fields: [
    {
      name: 'nome',
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Digite o nome completo',
      autocomplete: 'name'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'usuario@exemplo.com',
      autocomplete: 'email'
    },
    {
      name: 'documento',
      label: 'CPF',
      type: 'cpf',
      required: true,
      placeholder: '000.000.000-00'
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      required: true,
      placeholder: '(11) 99999-9999'
    },
    {
      name: 'data_nascimento',
      label: 'Data de Nascimento',
      type: 'date',
      required: true
    },
    {
      name: 'tipo_usuario',
      label: 'Tipo de Usuário',
      type: 'select',
      required: true,
      options: TIPOS_USUARIO
    },
    {
      name: 'endereco',
      label: 'Endereço',
      type: 'textarea',
      placeholder: 'Endereço completo',
      rows: 3
    },
    {
      name: 'cep',
      label: 'CEP',
      type: 'cep',
      placeholder: '00000-000'
    }
  ]
};

/**
 * Configuração: Cadastro de Escola
 */
export const FORM_CADASTRO_ESCOLA: FormConfig = {
  id: 'cadastro-escola',
  title: 'Cadastro de Escola',
  description: 'Registrar nova instituição de ensino',
  endpoint: '/api/escolas',
  method: 'POST',
  submitText: 'Cadastrar Escola',
  showReset: true,
  fields: [
    {
      name: 'nome',
      label: 'Nome da Escola',
      type: 'text',
      required: true,
      placeholder: 'Nome completo da instituição'
    },
    {
      name: 'codigo_inep',
      label: 'Código INEP',
      type: 'text',
      required: true,
      placeholder: '12345678',
      validation: 'required|minLength:8|maxLength:8'
    },
    {
      name: 'tipo_escola',
      label: 'Tipo de Escola',
      type: 'select',
      required: true,
      options: TIPOS_ESCOLA
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      required: true,
      placeholder: '(11) 3333-4444'
    },
    {
      name: 'email',
      label: 'Email Institucional',
      type: 'email',
      required: true,
      placeholder: 'contato@escola.edu.br'
    },
    {
      name: 'endereco',
      label: 'Endereço Completo',
      type: 'textarea',
      required: true,
      placeholder: 'Rua, número, bairro',
      rows: 3
    },
    {
      name: 'cep',
      label: 'CEP',
      type: 'cep',
      required: true,
      placeholder: '00000-000'
    },
    {
      name: 'cidade',
      label: 'Cidade',
      type: 'text',
      required: true,
      placeholder: 'Nome da cidade'
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      required: true,
      options: ESTADOS_BRASILEIROS
    }
  ]
};

/**
 * Configuração: Matrícula de Aluno
 */
export const FORM_MATRICULA_ALUNO: FormConfig = {
  id: 'matricula-aluno',
  title: 'Matrícula de Aluno',
  description: 'Realizar matrícula de novo aluno',
  endpoint: '/api/alunos',
  method: 'POST',
  submitText: 'Matricular Aluno',
  showReset: true,
  fields: [
    // Dados do Aluno
    {
      name: 'nome_aluno',
      label: 'Nome do Aluno',
      type: 'text',
      required: true,
      placeholder: 'Nome completo do aluno'
    },
    {
      name: 'data_nascimento',
      label: 'Data de Nascimento',
      type: 'date',
      required: true
    },
    {
      name: 'cpf_aluno',
      label: 'CPF do Aluno',
      type: 'cpf',
      placeholder: '000.000.000-00'
    },
    {
      name: 'serie',
      label: 'Série/Ano',
      type: 'select',
      required: true,
      options: SERIES_ESCOLARES
    },
    {
      name: 'turno',
      label: 'Turno',
      type: 'select',
      required: true,
      options: TURNOS_ESCOLARES
    },
    {
      name: 'turma',
      label: 'Turma',
      type: 'text',
      required: true,
      placeholder: 'Ex: 5º A, 1º EM B'
    },
    
    // Dados do Responsável
    {
      name: 'nome_responsavel',
      label: 'Nome do Responsável',
      type: 'text',
      required: true,
      placeholder: 'Nome completo do responsável'
    },
    {
      name: 'cpf_responsavel',
      label: 'CPF do Responsável',
      type: 'cpf',
      required: true,
      placeholder: '000.000.000-00'
    },
    {
      name: 'telefone_responsavel',
      label: 'Telefone do Responsável',
      type: 'tel',
      required: true,
      placeholder: '(11) 99999-9999'
    },
    {
      name: 'email_responsavel',
      label: 'Email do Responsável',
      type: 'email',
      required: true,
      placeholder: 'responsavel@email.com'
    },
    
    // Endereço
    {
      name: 'endereco',
      label: 'Endereço Residencial',
      type: 'textarea',
      required: true,
      placeholder: 'Endereço completo da residência',
      rows: 3
    },
    {
      name: 'cep',
      label: 'CEP',
      type: 'cep',
      required: true,
      placeholder: '00000-000'
    }
  ]
};

/**
 * Configuração: Cadastro de Professor
 */
export const FORM_CADASTRO_PROFESSOR: FormConfig = {
  id: 'cadastro-professor',
  title: 'Cadastro de Professor',
  description: 'Registrar novo professor no sistema',
  endpoint: '/api/professores',
  method: 'POST',
  submitText: 'Cadastrar Professor',
  showReset: true,
  fields: [
    {
      name: 'nome',
      label: 'Nome Completo',
      type: 'text',
      required: true,
      placeholder: 'Nome completo do professor'
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'professor@escola.edu.br'
    },
    {
      name: 'cpf',
      label: 'CPF',
      type: 'cpf',
      required: true,
      placeholder: '000.000.000-00'
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      required: true,
      placeholder: '(11) 99999-9999'
    },
    {
      name: 'data_nascimento',
      label: 'Data de Nascimento',
      type: 'date',
      required: true
    },
    {
      name: 'formacao',
      label: 'Formação Acadêmica',
      type: 'textarea',
      required: true,
      placeholder: 'Graduação, pós-graduação, especializações...',
      rows: 4
    },
    {
      name: 'disciplinas',
      label: 'Disciplinas que Leciona',
      type: 'textarea',
      required: true,
      placeholder: 'Liste as disciplinas separadas por vírgula',
      rows: 3
    },
    {
      name: 'data_admissao',
      label: 'Data de Admissão',
      type: 'date',
      required: true
    },
    {
      name: 'registro_profissional',
      label: 'Registro Profissional',
      type: 'text',
      placeholder: 'CRE, CREA, CRM, etc.'
    }
  ]
};

/**
 * Configuração: Formulário de Contato
 */
export const FORM_CONTATO: FormConfig = {
  id: 'contato',
  title: 'Fale Conosco',
  description: 'Entre em contato com nossa equipe de suporte',
  endpoint: '/api/contato',
  method: 'POST',
  submitText: 'Enviar Mensagem',
  fields: [
    {
      name: 'nome',
      label: 'Seu Nome',
      type: 'text',
      required: true,
      placeholder: 'Como você se chama?'
    },
    {
      name: 'email',
      label: 'Seu Email',
      type: 'email',
      required: true,
      placeholder: 'Seu melhor email para contato'
    },
    {
      name: 'telefone',
      label: 'Telefone',
      type: 'tel',
      placeholder: 'Para contato urgente (opcional)'
    },
    {
      name: 'assunto',
      label: 'Assunto',
      type: 'select',
      required: true,
      options: [
        { value: 'suporte_tecnico', text: 'Suporte Técnico' },
        { value: 'duvida_sistema', text: 'Dúvida sobre o Sistema' },
        { value: 'problema_acesso', text: 'Problema de Acesso' },
        { value: 'solicitacao_funcionalidade', text: 'Solicitação de Funcionalidade' },
        { value: 'reportar_bug', text: 'Reportar Bug' },
        { value: 'vendas', text: 'Vendas e Licenciamento' },
        { value: 'parceria', text: 'Parceria Institucional' },
        { value: 'sugestao', text: 'Sugestão de Melhoria' },
        { value: 'outros', text: 'Outros Assuntos' }
      ]
    },
    {
      name: 'mensagem',
      label: 'Sua Mensagem',
      type: 'textarea',
      required: true,
      placeholder: 'Descreva sua solicitação, dúvida ou problema...',
      rows: 6
    }
  ],
  classes: {
    container: 'max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg',
    button: 'w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-medium shadow-md'
  }
};

/**
 * Configuração: Relatório de Problema
 */
export const FORM_RELATORIO_PROBLEMA: FormConfig = {
  id: 'relatorio-problema',
  title: 'Reportar Problema',
  description: 'Relate um problema técnico ou bug encontrado',
  endpoint: '/api/suporte/problemas',
  method: 'POST',
  submitText: 'Enviar Relatório',
  fields: [
    {
      name: 'titulo',
      label: 'Título do Problema',
      type: 'text',
      required: true,
      placeholder: 'Resumo do problema em uma linha'
    },
    {
      name: 'severidade',
      label: 'Severidade',
      type: 'select',
      required: true,
      options: [
        { value: 'baixa', text: 'Baixa - Problema menor' },
        { value: 'media', text: 'Média - Impacta algumas funções' },
        { value: 'alta', text: 'Alta - Impacta funções importantes' },
        { value: 'critica', text: 'Crítica - Sistema inacessível' }
      ]
    },
    {
      name: 'categoria',
      label: 'Categoria',
      type: 'select',
      required: true,
      options: [
        { value: 'interface', text: 'Interface do Usuário' },
        { value: 'autenticacao', text: 'Login e Autenticação' },
        { value: 'formularios', text: 'Formulários' },
        { value: 'relatorios', text: 'Relatórios' },
        { value: 'performance', text: 'Performance' },
        { value: 'mobile', text: 'Versão Mobile' },
        { value: 'integracao', text: 'Integração com Outros Sistemas' },
        { value: 'dados', text: 'Problemas com Dados' }
      ]
    },
    {
      name: 'descricao',
      label: 'Descrição Detalhada',
      type: 'textarea',
      required: true,
      placeholder: 'Descreva o problema em detalhes: o que aconteceu, quando acontece, quais ações levam ao problema...',
      rows: 6
    },
    {
      name: 'passos_reproducao',
      label: 'Passos para Reproduzir',
      type: 'textarea',
      required: true,
      placeholder: '1. Acesse a página X\n2. Clique no botão Y\n3. Observe o erro Z',
      rows: 4
    },
    {
      name: 'comportamento_esperado',
      label: 'Comportamento Esperado',
      type: 'textarea',
      required: true,
      placeholder: 'Descreva o que deveria acontecer normalmente',
      rows: 3
    },
    {
      name: 'navegador',
      label: 'Navegador Utilizado',
      type: 'select',
      required: true,
      options: [
        { value: 'chrome', text: 'Google Chrome' },
        { value: 'firefox', text: 'Mozilla Firefox' },
        { value: 'safari', text: 'Safari' },
        { value: 'edge', text: 'Microsoft Edge' },
        { value: 'opera', text: 'Opera' },
        { value: 'outros', text: 'Outros' }
      ]
    },
    {
      name: 'sistema_operacional',
      label: 'Sistema Operacional',
      type: 'select',
      required: true,
      options: [
        { value: 'windows', text: 'Windows' },
        { value: 'mac', text: 'macOS' },
        { value: 'linux', text: 'Linux' },
        { value: 'android', text: 'Android' },
        { value: 'ios', text: 'iOS' }
      ]
    }
  ]
};

/**
 * Configuração: Avaliação de Satisfação
 */
export const FORM_AVALIACAO_SATISFACAO: FormConfig = {
  id: 'avaliacao-satisfacao',
  title: 'Avaliação de Satisfação',
  description: 'Sua opinião é importante para melhorarmos o IAprender',
  endpoint: '/api/avaliacoes/satisfacao',
  method: 'POST',
  submitText: 'Enviar Avaliação',
  fields: [
    {
      name: 'satisfacao_geral',
      label: 'Satisfação Geral com o Sistema',
      type: 'select',
      required: true,
      options: [
        { value: '5', text: '5 - Muito Satisfeito' },
        { value: '4', text: '4 - Satisfeito' },
        { value: '3', text: '3 - Neutro' },
        { value: '2', text: '2 - Insatisfeito' },
        { value: '1', text: '1 - Muito Insatisfeito' }
      ]
    },
    {
      name: 'facilidade_uso',
      label: 'Facilidade de Uso',
      type: 'select',
      required: true,
      options: [
        { value: '5', text: '5 - Muito Fácil' },
        { value: '4', text: '4 - Fácil' },
        { value: '3', text: '3 - Neutro' },
        { value: '2', text: '2 - Difícil' },
        { value: '1', text: '1 - Muito Difícil' }
      ]
    },
    {
      name: 'funcionalidades_uteis',
      label: 'Funcionalidades Mais Úteis',
      type: 'textarea',
      placeholder: 'Quais funcionalidades você considera mais úteis?',
      rows: 3
    },
    {
      name: 'melhorias_sugeridas',
      label: 'Sugestões de Melhoria',
      type: 'textarea',
      placeholder: 'O que poderia ser melhorado no sistema?',
      rows: 4
    },
    {
      name: 'recomendaria',
      label: 'Recomendaria o IAprender?',
      type: 'select',
      required: true,
      options: [
        { value: 'sim', text: 'Sim, definitivamente' },
        { value: 'provavelmente', text: 'Provavelmente sim' },
        { value: 'neutro', text: 'Neutro' },
        { value: 'provavelmente_nao', text: 'Provavelmente não' },
        { value: 'nao', text: 'Definitivamente não' }
      ]
    },
    {
      name: 'comentarios_adicionais',
      label: 'Comentários Adicionais',
      type: 'textarea',
      placeholder: 'Algum comentário adicional sobre sua experiência?',
      rows: 4
    }
  ],
  classes: {
    container: 'max-w-3xl mx-auto p-8 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-lg',
    button: 'w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 font-medium shadow-md'
  }
};

// Export de todas as configurações
export const CONFIGURACOES_FORMULARIOS = {
  CADASTRO_USUARIO: FORM_CADASTRO_USUARIO,
  CADASTRO_ESCOLA: FORM_CADASTRO_ESCOLA,
  MATRICULA_ALUNO: FORM_MATRICULA_ALUNO,
  CADASTRO_PROFESSOR: FORM_CADASTRO_PROFESSOR,
  CONTATO: FORM_CONTATO,
  RELATORIO_PROBLEMA: FORM_RELATORIO_PROBLEMA,
  AVALIACAO_SATISFACAO: FORM_AVALIACAO_SATISFACAO
};
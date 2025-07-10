/**
 * CONFIGURAÇÕES ESPECÍFICAS DE FORMULÁRIOS - TAREFA 5.2
 * 
 * Configurações focadas nos formulários principais do sistema educacional
 */

import { FormConfig } from '../utils/formGenerator';

/**
 * Configurações dos formulários principais
 */
export const formConfigs = {
  escola: {
    id: 'form-escola',
    title: 'Cadastro de Escola',
    description: 'Registrar nova instituição de ensino no sistema',
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
        placeholder: 'Digite o nome completo da escola'
      },
      { 
        name: 'codigo_inep', 
        label: 'Código INEP', 
        type: 'text',
        placeholder: '12345678',
        validation: 'minLength:8|maxLength:8'
      },
      { 
        name: 'telefone', 
        label: 'Telefone', 
        type: 'tel',
        placeholder: '(11) 3333-4444'
      },
      { 
        name: 'email', 
        label: 'Email', 
        type: 'email',
        placeholder: 'contato@escola.edu.br'
      },
      { 
        name: 'endereco', 
        label: 'Endereço', 
        type: 'textarea',
        placeholder: 'Endereço completo da escola',
        rows: 3
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
        options: [
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
        ]
      },
      {
        name: 'tipo_escola',
        label: 'Tipo de Escola',
        type: 'select',
        required: true,
        options: [
          { value: 'municipal', text: 'Municipal' },
          { value: 'estadual', text: 'Estadual' },
          { value: 'federal', text: 'Federal' },
          { value: 'particular', text: 'Particular' },
          { value: 'tecnica', text: 'Técnica' }
        ]
      },
      {
        name: 'cep',
        label: 'CEP',
        type: 'cep',
        placeholder: '00000-000'
      }
    ]
  } as FormConfig,
  
  aluno: {
    id: 'form-aluno',
    title: 'Cadastro de Aluno',
    description: 'Realizar matrícula de novo aluno na escola',
    endpoint: '/api/alunos',
    method: 'POST',
    submitText: 'Cadastrar Aluno',
    showReset: true,
    fields: [
      { 
        name: 'nome', 
        label: 'Nome do Aluno', 
        type: 'text', 
        required: true,
        placeholder: 'Nome completo do aluno'
      },
      { 
        name: 'email', 
        label: 'Email', 
        type: 'email', 
        required: true,
        placeholder: 'email@aluno.com'
      },
      {
        name: 'cpf_aluno',
        label: 'CPF do Aluno',
        type: 'cpf',
        placeholder: '000.000.000-00'
      },
      {
        name: 'data_nascimento',
        label: 'Data de Nascimento',
        type: 'date',
        required: true
      },
      { 
        name: 'turma', 
        label: 'Turma', 
        type: 'text',
        required: true,
        placeholder: 'Ex: 5º A, 1º EM B'
      },
      { 
        name: 'serie', 
        label: 'Série', 
        type: 'select',
        required: true,
        options: [
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
          { value: '3em', text: '3º Ano EM' }
        ]
      },
      { 
        name: 'turno', 
        label: 'Turno', 
        type: 'select',
        required: true,
        options: [
          { value: 'matutino', text: 'Matutino' },
          { value: 'vespertino', text: 'Vespertino' },
          { value: 'noturno', text: 'Noturno' },
          { value: 'integral', text: 'Integral' }
        ]
      },
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
        name: 'contato_responsavel', 
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
  } as FormConfig,

  professor: {
    id: 'form-professor',
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
        name: 'disciplinas',
        label: 'Disciplinas que Leciona',
        type: 'select',
        required: true,
        options: [
          { value: 'matematica', text: 'Matemática' },
          { value: 'portugues', text: 'Português' },
          { value: 'ciencias', text: 'Ciências' },
          { value: 'historia', text: 'História' },
          { value: 'geografia', text: 'Geografia' },
          { value: 'fisica', text: 'Física' },
          { value: 'quimica', text: 'Química' },
          { value: 'biologia', text: 'Biologia' },
          { value: 'ingles', text: 'Inglês' },
          { value: 'educacao_fisica', text: 'Educação Física' },
          { value: 'artes', text: 'Artes' },
          { value: 'filosofia', text: 'Filosofia' },
          { value: 'sociologia', text: 'Sociologia' }
        ]
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
        name: 'data_admissao',
        label: 'Data de Admissão',
        type: 'date',
        required: true
      }
    ]
  } as FormConfig,

  diretor: {
    id: 'form-diretor',
    title: 'Cadastro de Diretor',
    description: 'Registrar diretor de escola no sistema',
    endpoint: '/api/diretores',
    method: 'POST',
    submitText: 'Cadastrar Diretor',
    showReset: true,
    fields: [
      {
        name: 'nome',
        label: 'Nome Completo',
        type: 'text',
        required: true,
        placeholder: 'Nome completo do diretor'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'diretor@escola.edu.br'
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
        name: 'cargo',
        label: 'Cargo',
        type: 'select',
        required: true,
        options: [
          { value: 'diretor_geral', text: 'Diretor Geral' },
          { value: 'diretor_pedagogico', text: 'Diretor Pedagógico' },
          { value: 'diretor_administrativo', text: 'Diretor Administrativo' },
          { value: 'vice_diretor', text: 'Vice-Diretor' }
        ]
      },
      {
        name: 'formacao',
        label: 'Formação Acadêmica',
        type: 'textarea',
        required: true,
        placeholder: 'Graduação, pós-graduação, especializações em gestão...',
        rows: 4
      },
      {
        name: 'data_inicio',
        label: 'Data de Início no Cargo',
        type: 'date',
        required: true
      }
    ]
  } as FormConfig,

  gestor: {
    id: 'form-gestor',
    title: 'Cadastro de Gestor Municipal',
    description: 'Registrar gestor municipal no sistema',
    endpoint: '/api/gestores',
    method: 'POST',
    submitText: 'Cadastrar Gestor',
    showReset: true,
    fields: [
      {
        name: 'nome',
        label: 'Nome Completo',
        type: 'text',
        required: true,
        placeholder: 'Nome completo do gestor'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'gestor@prefeitura.gov.br'
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
        name: 'cargo',
        label: 'Cargo',
        type: 'select',
        required: true,
        options: [
          { value: 'secretario_educacao', text: 'Secretário de Educação' },
          { value: 'coordenador_educacao', text: 'Coordenador de Educação' },
          { value: 'supervisor_educacional', text: 'Supervisor Educacional' },
          { value: 'gestor_municipal', text: 'Gestor Municipal' }
        ]
      },
      {
        name: 'municipio',
        label: 'Município',
        type: 'text',
        required: true,
        placeholder: 'Nome do município'
      },
      {
        name: 'estado',
        label: 'Estado',
        type: 'select',
        required: true,
        options: [
          { value: 'SP', text: 'São Paulo' },
          { value: 'RJ', text: 'Rio de Janeiro' },
          { value: 'MG', text: 'Minas Gerais' },
          { value: 'RS', text: 'Rio Grande do Sul' },
          { value: 'PR', text: 'Paraná' },
          { value: 'SC', text: 'Santa Catarina' },
          { value: 'BA', text: 'Bahia' },
          { value: 'GO', text: 'Goiás' },
          { value: 'ES', text: 'Espírito Santo' },
          { value: 'PE', text: 'Pernambuco' }
        ]
      },
      {
        name: 'data_admissao',
        label: 'Data de Admissão',
        type: 'date',
        required: true
      }
    ]
  } as FormConfig
};

/**
 * Função para obter configuração específica de formulário
 */
export function getFormConfig(formType: keyof typeof formConfigs): FormConfig {
  const config = formConfigs[formType];
  if (!config) {
    throw new Error(`Configuração de formulário '${formType}' não encontrada`);
  }
  return config;
}

/**
 * Função para listar todos os tipos de formulário disponíveis
 */
export function getAvailableFormTypes(): string[] {
  return Object.keys(formConfigs);
}

/**
 * Função para validar se um tipo de formulário existe
 */
export function isValidFormType(formType: string): formType is keyof typeof formConfigs {
  return formType in formConfigs;
}

// Export padrão
export default formConfigs;
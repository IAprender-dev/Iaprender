/**
 * GERADOR DE FORMULÁRIOS AUTOMÁTICO - IAPRENDER
 * 
 * Sistema para gerar formulários HTML a partir de templates
 * e configurações predefinidas.
 */

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'cpf' | 'cnpj' | 'cep' | 'select' | 'textarea' | 'date' | 'file' | 'checkbox' | 'radio' | 'hidden';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: string;
  format?: string;
  help?: string;
  icon?: string;
  options?: Array<{value: string, label: string}>;
  value?: string;
  attributes?: Record<string, any>;
}

interface FormConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  fields: FormField[];
  submitText?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectUrl?: string;
  showProgress?: boolean;
  autoReset?: boolean;
  customValidation?: string;
  onSuccess?: string;
  onError?: string;
}

export class FormGenerator {
  private templates: Map<string, string> = new Map();
  private baseTemplate: string = '';

  constructor() {
    this.loadTemplates();
  }

  /**
   * Carrega todos os templates de campos
   */
  private async loadTemplates(): Promise<void> {
    try {
      // Carregar template base
      const baseResponse = await fetch('/src/templates/form-base.html');
      this.baseTemplate = await baseResponse.text();

      // Carregar templates de campos
      const fieldsResponse = await fetch('/src/templates/form-fields.html');
      const fieldsHtml = await fieldsResponse.text();

      // Extrair templates individuais
      const templateRegex = /<template id="([^"]+)">([\s\S]*?)<\/template>/g;
      let match;

      while ((match = templateRegex.exec(fieldsHtml)) !== null) {
        const [, templateId, templateContent] = match;
        this.templates.set(templateId, templateContent.trim());
      }

      console.log('📋 Templates carregados:', Array.from(this.templates.keys()));
    } catch (error) {
      console.error('❌ Erro ao carregar templates:', error);
    }
  }

  /**
   * Gera um formulário completo a partir da configuração
   */
  public generateForm(config: FormConfig): string {
    if (!this.baseTemplate) {
      console.error('❌ Template base não carregado');
      return '';
    }

    // Gerar campos do formulário
    const fieldsHtml = config.fields.map(field => this.generateField(field)).join('\n');

    // Substituir placeholders no template base
    let formHtml = this.baseTemplate
      .replace(/\{\{FORM_ID\}\}/g, config.id)
      .replace(/\{\{FORM_TITLE\}\}/g, config.title)
      .replace(/\{\{FORM_DESCRIPTION\}\}/g, config.description)
      .replace(/\{\{FORM_ICON\}\}/g, config.icon)
      .replace(/\{\{ENDPOINT\}\}/g, config.endpoint)
      .replace(/\{\{METHOD\}\}/g, config.method)
      .replace(/\{\{FORM_FIELDS\}\}/g, fieldsHtml)
      .replace(/\{\{SUBMIT_TEXT\}\}/g, config.submitText || 'Enviar')
      .replace(/\{\{SUCCESS_MESSAGE\}\}/g, config.successMessage || 'Operação realizada com sucesso!')
      .replace(/\{\{ERROR_MESSAGE\}\}/g, config.errorMessage || 'Ocorreu um erro. Tente novamente.')
      .replace(/\{\{REDIRECT_URL\}\}/g, config.redirectUrl || '')
      .replace(/\{\{SHOW_PROGRESS\}\}/g, config.showProgress ? 'true' : 'false')
      .replace(/\{\{AUTO_RESET\}\}/g, config.autoReset ? 'true' : 'false')
      .replace(/\{\{CUSTOM_VALIDATION\}\}/g, config.customValidation || 'return null;')
      .replace(/\{\{ON_SUCCESS_CALLBACK\}\}/g, config.onSuccess || '// Callback de sucesso')
      .replace(/\{\{ON_ERROR_CALLBACK\}\}/g, config.onError || '// Callback de erro');

    return formHtml;
  }

  /**
   * Gera um campo individual a partir da configuração
   */
  private generateField(field: FormField): string {
    const templateId = this.getTemplateId(field.type);
    const template = this.templates.get(templateId);

    if (!template) {
      console.warn(`⚠️ Template não encontrado para tipo: ${field.type}`);
      return `<!-- Campo ${field.type} não encontrado -->`;
    }

    // Construir validação
    let validation = '';
    if (field.required) validation += 'required';
    if (field.validation) validation += (validation ? '|' : '') + field.validation;

    // Preparar opções para select/radio
    let optionsHtml = '';
    if (field.options) {
      optionsHtml = field.options
        .map(option => `<option value="${option.value}">${option.label}</option>`)
        .join('\n');
    }

    // Substituir placeholders no template
    let fieldHtml = template
      .replace(/\{\{FIELD_ID\}\}/g, field.id)
      .replace(/\{\{FIELD_NAME\}\}/g, field.name)
      .replace(/\{\{FIELD_LABEL\}\}/g, field.label)
      .replace(/\{\{PLACEHOLDER\}\}/g, field.placeholder || '')
      .replace(/\{\{VALIDATION\}\}/g, validation)
      .replace(/\{\{FORMAT\}\}/g, field.format || '')
      .replace(/\{\{HELP_TEXT\}\}/g, field.help || '')
      .replace(/\{\{ICON\}\}/g, field.icon || '')
      .replace(/\{\{VALUE\}\}/g, field.value || '')
      .replace(/\{\{OPTIONS\}\}/g, optionsHtml);

    // Lidar com condicionais
    fieldHtml = this.processConditionals(fieldHtml, {
      REQUIRED: field.required,
      ...field.attributes
    });

    return fieldHtml;
  }

  /**
   * Determina o ID do template baseado no tipo do campo
   */
  private getTemplateId(type: string): string {
    const templateMap: Record<string, string> = {
      'text': 'text-field-template',
      'email': 'email-field-template',
      'password': 'password-field-template',
      'tel': 'phone-field-template',
      'cpf': 'cpf-field-template',
      'cnpj': 'cnpj-field-template',
      'cep': 'cep-field-template',
      'select': 'select-field-template',
      'textarea': 'textarea-field-template',
      'date': 'date-field-template',
      'file': 'file-field-template',
      'checkbox': 'checkbox-field-template',
      'radio': 'radio-group-template',
      'hidden': 'hidden-field-template'
    };

    return templateMap[type] || 'text-field-template';
  }

  /**
   * Processa condicionais no template ({{#if}}, {{/if}})
   */
  private processConditionals(template: string, context: Record<string, any>): string {
    // Processa {{#if CONDITION}}...{{/if}}
    let processed = template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return context[condition] ? content : '';
    });

    // Processa valores com fallback {{VALUE:default}}
    processed = processed.replace(/\{\{(\w+):([^}]+)\}\}/g, (match, key, defaultValue) => {
      return context[key] || defaultValue;
    });

    return processed;
  }

  /**
   * Configurações predefinidas para formulários comuns
   */
  public static getPresetConfigs(): Record<string, FormConfig> {
    return {
      'usuario-criar': {
        id: 'form-usuario-criar',
        title: 'Criar Usuário',
        description: 'Cadastre um novo usuário no sistema',
        icon: 'user-plus',
        endpoint: '/api/usuarios',
        method: 'POST',
        showProgress: true,
        fields: [
          {
            id: 'nome',
            name: 'nome',
            type: 'text',
            label: 'Nome Completo',
            placeholder: 'Digite o nome completo',
            required: true,
            validation: 'minLength:2|maxLength:100'
          },
          {
            id: 'email',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'usuario@email.com',
            required: true
          },
          {
            id: 'cpf',
            name: 'documento',
            type: 'cpf',
            label: 'CPF',
            required: true
          },
          {
            id: 'telefone',
            name: 'telefone',
            type: 'tel',
            label: 'Telefone',
            placeholder: '(11) 99999-9999'
          },
          {
            id: 'tipo_usuario',
            name: 'tipo_usuario',
            type: 'select',
            label: 'Tipo de Usuário',
            required: true,
            options: [
              { value: 'admin', label: 'Administrador' },
              { value: 'gestor', label: 'Gestor' },
              { value: 'diretor', label: 'Diretor' },
              { value: 'professor', label: 'Professor' },
              { value: 'aluno', label: 'Aluno' }
            ]
          },
          {
            id: 'senha',
            name: 'senha',
            type: 'password',
            label: 'Senha',
            required: true,
            validation: 'minLength:8',
            attributes: { SHOW_STRENGTH: true }
          }
        ]
      },

      'escola-criar': {
        id: 'form-escola-criar',
        title: 'Criar Escola',
        description: 'Cadastre uma nova escola no sistema',
        icon: 'school',
        endpoint: '/api/municipal/schools',
        method: 'POST',
        showProgress: true,
        fields: [
          {
            id: 'nome',
            name: 'nome',
            type: 'text',
            label: 'Nome da Escola',
            placeholder: 'Nome completo da escola',
            required: true,
            validation: 'minLength:3|maxLength:200'
          },
          {
            id: 'codigo_inep',
            name: 'codigo_inep',
            type: 'text',
            label: 'Código INEP',
            placeholder: '12345678',
            required: true,
            validation: 'pattern:^\\d{8}$',
            help: 'Código de 8 dígitos do INEP/MEC'
          },
          {
            id: 'tipo_escola',
            name: 'tipo_escola',
            type: 'select',
            label: 'Tipo de Escola',
            required: true,
            options: [
              { value: 'municipal', label: 'Municipal' },
              { value: 'estadual', label: 'Estadual' },
              { value: 'federal', label: 'Federal' },
              { value: 'privada', label: 'Privada' }
            ]
          },
          {
            id: 'telefone',
            name: 'telefone',
            type: 'tel',
            label: 'Telefone',
            placeholder: '(11) 3333-4444'
          },
          {
            id: 'email',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'contato@escola.edu.br'
          },
          {
            id: 'cep',
            name: 'cep',
            type: 'cep',
            label: 'CEP',
            placeholder: '00000-000'
          },
          {
            id: 'endereco',
            name: 'endereco',
            type: 'text',
            label: 'Endereço',
            placeholder: 'Rua, número, bairro'
          },
          {
            id: 'cidade',
            name: 'cidade',
            type: 'text',
            label: 'Cidade',
            placeholder: 'Nome da cidade'
          },
          {
            id: 'estado',
            name: 'estado',
            type: 'text',
            label: 'Estado',
            placeholder: 'SP',
            validation: 'pattern:^[A-Z]{2}$|maxLength:2'
          }
        ]
      },

      'contato': {
        id: 'form-contato',
        title: 'Entre em Contato',
        description: 'Envie sua mensagem ou dúvida',
        icon: 'mail',
        endpoint: '/api/contato',
        method: 'POST',
        autoReset: true,
        fields: [
          {
            id: 'nome',
            name: 'nome',
            type: 'text',
            label: 'Seu Nome',
            placeholder: 'Como devemos te chamar?',
            required: true,
            validation: 'minLength:2'
          },
          {
            id: 'email',
            name: 'email',
            type: 'email',
            label: 'Seu Email',
            placeholder: 'para respondermos você',
            required: true
          },
          {
            id: 'telefone',
            name: 'telefone',
            type: 'tel',
            label: 'Telefone',
            placeholder: '(opcional)'
          },
          {
            id: 'assunto',
            name: 'assunto',
            type: 'select',
            label: 'Assunto',
            required: true,
            options: [
              { value: 'duvida', label: 'Dúvida Geral' },
              { value: 'suporte', label: 'Suporte Técnico' },
              { value: 'comercial', label: 'Comercial' },
              { value: 'parceria', label: 'Parceria' },
              { value: 'outro', label: 'Outro' }
            ]
          },
          {
            id: 'mensagem',
            name: 'mensagem',
            type: 'textarea',
            label: 'Sua Mensagem',
            placeholder: 'Descreva sua dúvida ou necessidade...',
            required: true,
            validation: 'minLength:10|maxLength:1000',
            attributes: { ROWS: 5, MAX_LENGTH: 1000 }
          }
        ]
      },

      'professor-perfil': {
        id: 'form-professor-perfil',
        title: 'Perfil do Professor',
        description: 'Atualize suas informações profissionais',
        icon: 'user-check',
        endpoint: '/api/usuarios/me',
        method: 'PATCH',
        fields: [
          {
            id: 'nome',
            name: 'nome',
            type: 'text',
            label: 'Nome Completo',
            required: true,
            validation: 'minLength:2|maxLength:100'
          },
          {
            id: 'email',
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
            attributes: { READONLY: true },
            help: 'Email não pode ser alterado'
          },
          {
            id: 'telefone',
            name: 'telefone',
            type: 'tel',
            label: 'Telefone',
            placeholder: '(11) 99999-9999'
          },
          {
            id: 'formacao',
            name: 'formacao',
            type: 'text',
            label: 'Formação Acadêmica',
            placeholder: 'Ex: Licenciatura em Matemática',
            validation: 'maxLength:200'
          },
          {
            id: 'disciplinas',
            name: 'disciplinas',
            type: 'text',
            label: 'Disciplinas que Leciona',
            placeholder: 'Ex: Matemática, Física',
            help: 'Separe as disciplinas por vírgula'
          },
          {
            id: 'bio',
            name: 'bio',
            type: 'textarea',
            label: 'Biografia Profissional',
            placeholder: 'Conte um pouco sobre sua experiência...',
            validation: 'maxLength:500',
            attributes: { ROWS: 4, MAX_LENGTH: 500 }
          }
        ]
      }
    };
  }

  /**
   * Gera um formulário a partir de um preset
   */
  public generatePresetForm(presetName: string): string {
    const presets = FormGenerator.getPresetConfigs();
    const config = presets[presetName];

    if (!config) {
      console.error(`❌ Preset '${presetName}' não encontrado`);
      return '';
    }

    return this.generateForm(config);
  }

  /**
   * Salva um formulário gerado como arquivo HTML
   */
  public async saveFormToFile(config: FormConfig, filename?: string): Promise<string> {
    const formHtml = this.generateForm(config);
    const fileName = filename || `${config.id}.html`;
    
    // Em um ambiente real, isso salvaria no sistema de arquivos
    console.log(`💾 Formulário gerado: ${fileName}`);
    console.log('📝 HTML gerado:', formHtml.length, 'caracteres');
    
    return formHtml;
  }
}

// Exportar instância singleton
export const formGenerator = new FormGenerator();

// Funções auxiliares para uso direto
export const generateForm = (config: FormConfig): string => {
  return formGenerator.generateForm(config);
};

export const generatePresetForm = (presetName: string): string => {
  return formGenerator.generatePresetForm(presetName);
};

export const getPresetConfigs = (): Record<string, FormConfig> => {
  return FormGenerator.getPresetConfigs();
};

export default FormGenerator;
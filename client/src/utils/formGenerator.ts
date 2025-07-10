/**
 * GERADOR DE FORMULÁRIOS DINÂMICOS - IAPRENDER
 * 
 * Classe para gerar formulários HTML dinamicamente com integração completa
 * ao sistema de autenticação e validação do IAprender
 */

import { FormHandler, createFormHandler } from './formHandler';

// Interfaces para tipagem TypeScript
interface FormFieldOption {
  value: string;
  text: string;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'date' | 'select' | 'textarea' | 'number' | 'cpf' | 'cnpj' | 'cep';
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  validation?: string;
  mask?: boolean;
  autocomplete?: string;
  rows?: number; // Para textarea
  min?: number; // Para number/date
  max?: number; // Para number/date
  step?: number; // Para number
}

interface FormConfig {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  submitText?: string;
  resetText?: string;
  classes?: {
    form?: string;
    container?: string;
    field?: string;
    label?: string;
    input?: string;
    button?: string;
  };
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  showReset?: boolean;
  validateOnChange?: boolean;
  debug?: boolean;
}

export class FormGenerator {
  private container: HTMLElement | null;
  private formHandler: FormHandler | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.error(`🚨 FormGenerator: Container com ID "${containerId}" não encontrado`);
      throw new Error(`Container com ID "${containerId}" não encontrado`);
    }
  }

  /**
   * Gera um formulário dinâmico baseado na configuração
   */
  generate(config: FormConfig): FormHandler {
    if (!this.container) {
      throw new Error('Container não inicializado');
    }

    // Limpa o container
    this.container.innerHTML = '';

    // Cria wrapper do formulário
    const wrapper = this.createFormWrapper(config);
    
    // Cria o formulário
    const form = this.createForm(config);
    
    // Adiciona título e descrição se fornecidos
    if (config.title || config.description) {
      const header = this.createFormHeader(config);
      wrapper.appendChild(header);
    }

    // Cria campos do formulário
    config.fields.forEach(field => {
      const fieldElement = this.createField(field, config.classes);
      form.appendChild(fieldElement);
    });

    // Cria botões do formulário
    const buttonsContainer = this.createFormButtons(config);
    form.appendChild(buttonsContainer);

    wrapper.appendChild(form);
    this.container.appendChild(wrapper);

    // Aplica máscaras brasileiras nos campos
    this.applyBrazilianMasks();

    // Inicializa FormHandler com autenticação
    this.formHandler = createFormHandler(config.id, {
      endpoint: config.endpoint,
      method: config.method || 'POST',
      validateOnSubmit: true,
      onSuccess: config.onSuccess || ((response) => {
        console.log('✅ Formulário enviado com sucesso:', response);
        this.showSuccessMessage('Formulário enviado com sucesso!');
      }),
      onError: config.onError || ((error) => {
        console.error('❌ Erro ao enviar formulário:', error);
        this.showErrorMessage(`Erro: ${error.message}`);
      }),
      debug: config.debug || false
    });

    // Configura evento de reset se habilitado
    if (config.showReset) {
      this.setupResetButton(config.id);
    }

    return this.formHandler;
  }

  /**
   * Cria wrapper do formulário com classes CSS
   */
  private createFormWrapper(config: FormConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = config.classes?.container || 'max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md';
    
    return wrapper;
  }

  /**
   * Cria elemento form base
   */
  private createForm(config: FormConfig): HTMLFormElement {
    const form = document.createElement('form');
    form.id = config.id;
    form.className = config.classes?.form || 'space-y-6';
    form.noValidate = true; // Usamos validação customizada
    
    return form;
  }

  /**
   * Cria cabeçalho do formulário
   */
  private createFormHeader(config: FormConfig): HTMLElement {
    const header = document.createElement('div');
    header.className = 'mb-8 text-center';

    if (config.title) {
      const title = document.createElement('h2');
      title.className = 'text-2xl font-bold text-gray-900 mb-2';
      title.textContent = config.title;
      header.appendChild(title);
    }

    if (config.description) {
      const description = document.createElement('p');
      description.className = 'text-gray-600';
      description.textContent = config.description;
      header.appendChild(description);
    }

    return header;
  }

  /**
   * Cria um campo do formulário
   */
  private createField(field: FormField, classes?: FormConfig['classes']): HTMLElement {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = classes?.field || 'mb-6';

    // Label
    const label = document.createElement('label');
    label.setAttribute('for', field.name);
    label.className = classes?.label || 'block text-sm font-medium text-gray-700 mb-2';
    label.textContent = field.label + (field.required ? ' *' : '');

    // Campo de entrada
    let input: HTMLElement;

    switch (field.type) {
      case 'select':
        input = this.createSelectField(field);
        break;
      case 'textarea':
        input = this.createTextareaField(field);
        break;
      default:
        input = this.createInputField(field);
        break;
    }

    input.className = classes?.input || 'w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200';

    // Aplica validações
    this.applyFieldValidation(input, field);

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);

    return fieldContainer;
  }

  /**
   * Cria campo select
   */
  private createSelectField(field: FormField): HTMLSelectElement {
    const select = document.createElement('select');
    select.id = field.name;
    select.name = field.name;

    // Opção padrão
    if (!field.required) {
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = `Selecione ${field.label.toLowerCase()}`;
      select.appendChild(defaultOption);
    }

    // Adiciona opções
    field.options?.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.text;
      select.appendChild(opt);
    });

    return select;
  }

  /**
   * Cria campo textarea
   */
  private createTextareaField(field: FormField): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.id = field.name;
    textarea.name = field.name;
    textarea.rows = field.rows || 4;
    
    if (field.placeholder) {
      textarea.placeholder = field.placeholder;
    }

    return textarea;
  }

  /**
   * Cria campo input
   */
  private createInputField(field: FormField): HTMLInputElement {
    const input = document.createElement('input');
    input.id = field.name;
    input.name = field.name;
    
    // Define tipo do input baseado no tipo do campo
    switch (field.type) {
      case 'cpf':
      case 'cnpj':
      case 'cep':
      case 'tel':
        input.type = 'text';
        break;
      default:
        input.type = field.type;
        break;
    }

    // Atributos opcionais
    if (field.placeholder) {
      input.placeholder = field.placeholder;
    }

    if (field.autocomplete) {
      input.autocomplete = field.autocomplete;
    }

    if (field.min !== undefined) {
      input.min = field.min.toString();
    }

    if (field.max !== undefined) {
      input.max = field.max.toString();
    }

    if (field.step !== undefined) {
      input.step = field.step.toString();
    }

    return input;
  }

  /**
   * Aplica validação ao campo
   */
  private applyFieldValidation(input: HTMLElement, field: FormField): void {
    if (field.required) {
      input.setAttribute('required', 'true');
      input.setAttribute('data-validate', 'required');
    }

    // Validações específicas por tipo
    switch (field.type) {
      case 'email':
        input.setAttribute('data-validate', (input.getAttribute('data-validate') || '') + '|email');
        break;
      case 'cpf':
        input.setAttribute('data-validate', (input.getAttribute('data-validate') || '') + '|cpf');
        input.setAttribute('data-mask', 'cpf');
        break;
      case 'cnpj':
        input.setAttribute('data-validate', (input.getAttribute('data-validate') || '') + '|cnpj');
        input.setAttribute('data-mask', 'cnpj');
        break;
      case 'tel':
        input.setAttribute('data-validate', (input.getAttribute('data-validate') || '') + '|phone');
        input.setAttribute('data-mask', 'phone');
        break;
      case 'cep':
        input.setAttribute('data-validate', (input.getAttribute('data-validate') || '') + '|cep');
        input.setAttribute('data-mask', 'cep');
        break;
    }

    // Validação customizada
    if (field.validation) {
      input.setAttribute('data-validate', field.validation);
    }
  }

  /**
   * Cria botões do formulário
   */
  private createFormButtons(config: FormConfig): HTMLElement {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex space-x-4 pt-6';

    // Botão submit
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = config.submitText || 'Enviar';
    submitBtn.className = config.classes?.button || 'flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium';

    buttonsContainer.appendChild(submitBtn);

    // Botão reset (opcional)
    if (config.showReset) {
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.id = `${config.id}-reset`;
      resetBtn.textContent = config.resetText || 'Limpar';
      resetBtn.className = 'flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium';

      buttonsContainer.appendChild(resetBtn);
    }

    return buttonsContainer;
  }

  /**
   * Aplica máscaras brasileiras nos campos
   */
  private applyBrazilianMasks(): void {
    // CPF
    const cpfFields = document.querySelectorAll('[data-mask="cpf"]');
    cpfFields.forEach(field => {
      field.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = this.maskCPF(target.value);
      });
    });

    // CNPJ
    const cnpjFields = document.querySelectorAll('[data-mask="cnpj"]');
    cnpjFields.forEach(field => {
      field.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = this.maskCNPJ(target.value);
      });
    });

    // Telefone
    const phoneFields = document.querySelectorAll('[data-mask="phone"]');
    phoneFields.forEach(field => {
      field.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = this.maskPhone(target.value);
      });
    });

    // CEP
    const cepFields = document.querySelectorAll('[data-mask="cep"]');
    cepFields.forEach(field => {
      field.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        target.value = this.maskCEP(target.value);
      });
    });
  }

  /**
   * Máscaras brasileiras
   */
  private maskCPF(value: string): string {
    value = value.replace(/\D/g, '');
    value = value.substring(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
  }

  private maskCNPJ(value: string): string {
    value = value.replace(/\D/g, '');
    value = value.substring(0, 14);
    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
    value = value.replace(/(\d{4})(\d)/, '$1-$2');
    return value;
  }

  private maskPhone(value: string): string {
    value = value.replace(/\D/g, '');
    value = value.substring(0, 11);
    if (value.length <= 10) {
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  }

  private maskCEP(value: string): string {
    value = value.replace(/\D/g, '');
    value = value.substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    return value;
  }

  /**
   * Configura evento de reset
   */
  private setupResetButton(formId: string): void {
    const resetBtn = document.getElementById(`${formId}-reset`);
    if (resetBtn && this.formHandler) {
      resetBtn.addEventListener('click', () => {
        this.formHandler?.reset();
        this.clearMessages();
      });
    }
  }

  /**
   * Mostra mensagem de sucesso
   */
  private showSuccessMessage(message: string): void {
    this.clearMessages();
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center';
    successDiv.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <span>${message}</span>
    `;
    successDiv.id = 'form-success-message';
    
    if (this.container) {
      this.container.insertBefore(successDiv, this.container.firstChild);
      
      // Remove automaticamente após 5 segundos
      setTimeout(() => {
        successDiv.remove();
      }, 5000);
    }
  }

  /**
   * Mostra mensagem de erro
   */
  private showErrorMessage(message: string): void {
    this.clearMessages();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center';
    errorDiv.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <span>${message}</span>
    `;
    errorDiv.id = 'form-error-message';
    
    if (this.container) {
      this.container.insertBefore(errorDiv, this.container.firstChild);
    }
  }

  /**
   * Remove mensagens de sucesso/erro
   */
  private clearMessages(): void {
    const successMsg = document.getElementById('form-success-message');
    const errorMsg = document.getElementById('form-error-message');
    
    if (successMsg) successMsg.remove();
    if (errorMsg) errorMsg.remove();
  }

  /**
   * Destrói o formulário e limpa eventos
   */
  destroy(): void {
    if (this.formHandler) {
      this.formHandler.destroy();
      this.formHandler = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Retorna o FormHandler associado
   */
  getFormHandler(): FormHandler | null {
    return this.formHandler;
  }
}

// Factory function para criar instâncias
export const createFormGenerator = (containerId: string): FormGenerator => {
  return new FormGenerator(containerId);
};

// Export dos tipos para uso externo
export type { FormConfig, FormField, FormFieldOption };
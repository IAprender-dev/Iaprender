/**
 * UTILITÁRIO UNIVERSAL DE FORMULÁRIOS - IAPRENDER
 * 
 * Classe utilitária para gerenciar formulários com validação automática,
 * envio para API e controle de estados de loading/erro.
 */

import { FormUtils, FORM_MAPPING, FORM_STATES } from '@/lib/mapeamento-forms';

interface FormHandlerOptions {
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  showLoading?: boolean;
  validateOnSubmit?: boolean;
  autoReset?: boolean;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  onValidationError?: (errors: Record<string, string>) => void;
  customValidation?: (data: Record<string, any>) => Record<string, string> | null;
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface FormValidationRules {
  [fieldName: string]: ValidationRule;
}

export class FormHandler {
  private form: HTMLFormElement | null;
  private options: Required<FormHandlerOptions>;
  private validationRules: FormValidationRules = {};
  private currentState: string = FORM_STATES.IDLE;
  private retryCount: number = 0;

  constructor(formId: string, options: FormHandlerOptions = {}) {
    this.form = document.getElementById(formId) as HTMLFormElement;
    
    // Configurações padrão
    this.options = {
      endpoint: '',
      method: 'POST',
      showLoading: true,
      validateOnSubmit: true,
      autoReset: false,
      onSuccess: () => {},
      onError: () => {},
      onValidationError: () => {},
      customValidation: () => null,
      timeout: 30000,
      retries: 3,
      debug: false,
      ...options
    };

    if (!this.form) {
      console.error(`❌ FormHandler: Formulário com ID '${formId}' não encontrado`);
      return;
    }

    this.init();
  }

  /**
   * Inicializa o handler do formulário
   */
  private init(): void {
    if (!this.form) return;
    
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.setupValidation();
    this.setupTokenRefresh();
    this.setupFieldValidation();
    
    if (this.options.debug) {
      console.log('🎯 FormHandler inicializado:', {
        formId: this.form.id,
        endpoint: this.options.endpoint,
        method: this.options.method
      });
    }
  }

  /**
   * Configura validação em tempo real nos campos
   */
  private setupFieldValidation(): void {
    if (!this.form) return;

    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input as HTMLInputElement);
      });
      
      input.addEventListener('input', () => {
        this.clearFieldError(input as HTMLInputElement);
      });
    });
  }

  /**
   * Configura validação automática baseada em atributos HTML
   */
  private setupValidation(): void {
    if (!this.form) return;

    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const element = input as HTMLInputElement;
      const rules: ValidationRule = {};

      if (element.hasAttribute('required')) {
        rules.required = true;
      }

      if (element.hasAttribute('minlength')) {
        rules.minLength = parseInt(element.getAttribute('minlength') || '0');
      }

      if (element.hasAttribute('maxlength')) {
        rules.maxLength = parseInt(element.getAttribute('maxlength') || '999999');
      }

      if (element.hasAttribute('pattern')) {
        rules.pattern = new RegExp(element.getAttribute('pattern') || '');
      }

      // Validações específicas por tipo
      if (element.type === 'email') {
        rules.pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      }

      // Validações brasileiras
      if (element.dataset.validation === 'cpf') {
        rules.custom = this.validateCPF;
      } else if (element.dataset.validation === 'cnpj') {
        rules.custom = this.validateCNPJ;
      } else if (element.dataset.validation === 'phone') {
        rules.custom = this.validatePhone;
      } else if (element.dataset.validation === 'cep') {
        rules.custom = this.validateCEP;
      }

      if (Object.keys(rules).length > 0) {
        this.validationRules[element.name] = rules;
      }
    });
  }

  /**
   * Configura renovação automática de token
   */
  private setupTokenRefresh(): void {
    // Verifica se o token está próximo do vencimento
    const token = localStorage.getItem('cognito_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Se expira em menos de 5 minutos, tenta renovar
        if (timeUntilExpiry < 5 * 60 * 1000) {
          this.refreshToken();
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar token:', error);
      }
    }
  }

  /**
   * Manipula o envio do formulário
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    
    if (!this.form) return;

    // Validação antes do envio
    if (this.options.validateOnSubmit) {
      const validationErrors = this.validate();
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        this.options.onValidationError(validationErrors);
        this.displayValidationErrors(validationErrors);
        return;
      }
    }

    const formData = new FormData(this.form);
    const data = this.processFormData(formData);
    
    try {
      this.setState(FORM_STATES.LOADING);
      const response = await this.submitData(data);
      this.setState(FORM_STATES.SUCCESS);
      this.handleSuccess(response);
    } catch (error) {
      this.setState(FORM_STATES.ERROR);
      this.handleError(error as Error);
    }
  }

  /**
   * Processa dados do formulário
   */
  private processFormData(formData: FormData): Record<string, any> {
    const data: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      // Converte strings vazias para null
      if (value === '') {
        data[key] = null;
      }
      // Tenta converter números
      else if (typeof value === 'string' && /^\d+$/.test(value)) {
        data[key] = parseInt(value);
      }
      // Tenta converter decimais
      else if (typeof value === 'string' && /^\d+\.\d+$/.test(value)) {
        data[key] = parseFloat(value);
      }
      // Converte checkboxes
      else if (value === 'on') {
        data[key] = true;
      }
      else {
        data[key] = value;
      }
    }

    // Remove campos vazios/nulos se configurado
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === undefined || data[key] === '') {
        delete data[key];
      }
    });

    return data;
  }

  /**
   * Envia dados para a API
   */
  private async submitData(data: Record<string, any>): Promise<any> {
    const token = localStorage.getItem('cognito_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

    try {
      const response = await fetch(this.options.endpoint, {
        method: this.options.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        // Token expirado, tenta renovar
        await this.refreshToken();
        throw new Error('Token expirado. Tente novamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      this.retryCount = 0; // Reset contador de tentativas
      return response.json();

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operação cancelada por timeout');
      }

      // Retry logic
      if (this.retryCount < this.options.retries && this.shouldRetry(error as Error)) {
        this.retryCount++;
        console.warn(`⚠️ Tentativa ${this.retryCount}/${this.options.retries} falhou. Tentando novamente...`);
        await this.delay(1000 * this.retryCount); // Backoff exponencial
        return this.submitData(data);
      }

      throw error;
    }
  }

  /**
   * Valida todos os campos do formulário
   */
  private validate(): Record<string, string> | null {
    if (!this.form) return null;

    const errors: Record<string, string> = {};
    
    // Validação HTML5 nativa
    if (!this.form.checkValidity()) {
      const invalidFields = this.form.querySelectorAll(':invalid');
      invalidFields.forEach(field => {
        const input = field as HTMLInputElement;
        errors[input.name] = input.validationMessage;
      });
    }

    // Validação customizada
    Object.entries(this.validationRules).forEach(([fieldName, rules]) => {
      const field = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
      if (!field) return;

      const error = this.validateField(field, rules);
      if (error) {
        errors[fieldName] = error;
      }
    });

    // Validação personalizada do usuário
    const customErrors = this.options.customValidation(this.getFormData());
    if (customErrors) {
      Object.assign(errors, customErrors);
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /**
   * Valida um campo específico
   */
  private validateField(field: HTMLInputElement, rules?: ValidationRule): string | null {
    const fieldRules = rules || this.validationRules[field.name];
    if (!fieldRules) return null;

    const value = field.value.trim();

    if (fieldRules.required && !value) {
      return 'Este campo é obrigatório';
    }

    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      return `Mínimo de ${fieldRules.minLength} caracteres`;
    }

    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      return `Máximo de ${fieldRules.maxLength} caracteres`;
    }

    if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      return 'Formato inválido';
    }

    if (value && fieldRules.custom) {
      return fieldRules.custom(value);
    }

    return null;
  }

  /**
   * Validações brasileiras
   */
  private validateCPF = (cpf: string): string | null => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return 'CPF deve ter 11 dígitos';
    if (/^(\d)\1{10}$/.test(cleanCPF)) return 'CPF inválido';
    
    // Algoritmo de validação do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;
    
    if (digit1 !== parseInt(cleanCPF[9]) || digit2 !== parseInt(cleanCPF[10])) {
      return 'CPF inválido';
    }
    
    return null;
  };

  private validateCNPJ = (cnpj: string): string | null => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return 'CNPJ deve ter 14 dígitos';
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return 'CNPJ inválido';
    
    // Algoritmo de validação do CNPJ
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    if (digit1 !== parseInt(cleanCNPJ[12]) || digit2 !== parseInt(cleanCNPJ[13])) {
      return 'CNPJ inválido';
    }
    
    return null;
  };

  private validatePhone = (phone: string): string | null => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19',
      '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38',
      '41', '42', '43', '44', '45', '46', '47', '48', '49',
      '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69',
      '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89',
      '91', '92', '93', '94', '95', '96', '97', '98', '99'
    ];
    
    const ddd = cleanPhone.substring(0, 2);
    if (!validDDDs.includes(ddd)) {
      return 'DDD inválido';
    }
    
    return null;
  };

  private validateCEP = (cep: string): string | null => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) {
      return 'CEP deve ter 8 dígitos';
    }
    return null;
  };

  /**
   * Controle de estado do formulário
   */
  private setState(newState: string): void {
    this.currentState = newState;
    
    if (this.options.showLoading) {
      this.updateLoadingState();
    }

    if (this.options.debug) {
      console.log(`🔄 FormHandler estado: ${newState}`);
    }
  }

  private updateLoadingState(): void {
    if (!this.form) return;

    const submitBtn = this.form.querySelector('[type="submit"]') as HTMLButtonElement;
    const isLoading = this.currentState === FORM_STATES.LOADING;
    
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      
      const originalText = submitBtn.dataset.originalText || submitBtn.textContent;
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = originalText || '';
      }
      
      submitBtn.textContent = isLoading ? 'Enviando...' : originalText;
      
      // Adiciona classe CSS para styling
      if (isLoading) {
        submitBtn.classList.add('loading');
      } else {
        submitBtn.classList.remove('loading');
      }
    }

    // Desabilita todos os inputs durante loading
    const inputs = this.form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      (input as HTMLInputElement).disabled = isLoading;
    });
  }

  /**
   * Manipuladores de sucesso e erro
   */
  private handleSuccess(response: any): void {
    if (this.options.debug) {
      console.log('✅ FormHandler sucesso:', response);
    }

    if (this.options.autoReset && this.form) {
      this.form.reset();
    }

    this.clearAllErrors();
    this.options.onSuccess(response);
    
    // Reset para estado idle após 2 segundos
    setTimeout(() => {
      this.setState(FORM_STATES.IDLE);
    }, 2000);
  }

  private handleError(error: Error): void {
    if (this.options.debug) {
      console.error('❌ FormHandler erro:', error);
    }

    this.displayError(error.message);
    this.options.onError(error);
    
    // Reset para estado idle após 5 segundos
    setTimeout(() => {
      this.setState(FORM_STATES.IDLE);
    }, 5000);
  }

  /**
   * Métodos utilitários
   */
  private shouldRetry(error: Error): boolean {
    // Retry em casos de erro de rede ou server error (5xx)
    return error.message.includes('fetch') || 
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') || 
           error.message.includes('504');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async refreshToken(): Promise<void> {
    // Implementar renovação de token Cognito
    console.warn('⚠️ Token refresh não implementado');
  }

  private getFormData(): Record<string, any> {
    if (!this.form) return {};
    
    const formData = new FormData(this.form);
    return this.processFormData(formData);
  }

  private displayValidationErrors(errors: Record<string, string>): void {
    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = this.form?.querySelector(`[name="${fieldName}"]`) as HTMLElement;
      if (field) {
        this.showFieldError(field, message);
      }
    });
  }

  private showFieldError(field: HTMLElement, message: string): void {
    // Remove erro anterior
    this.clearFieldError(field);
    
    // Adiciona classe de erro
    field.classList.add('error', 'border-red-500');
    
    // Cria elemento de erro
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message text-red-500 text-sm mt-1';
    errorElement.textContent = message;
    errorElement.setAttribute('data-error-for', field.getAttribute('name') || '');
    
    // Insere após o campo
    field.parentNode?.insertBefore(errorElement, field.nextSibling);
  }

  private clearFieldError(field: HTMLElement): void {
    field.classList.remove('error', 'border-red-500');
    
    const errorElement = field.parentNode?.querySelector(
      `[data-error-for="${field.getAttribute('name')}"]`
    );
    if (errorElement) {
      errorElement.remove();
    }
  }

  private clearAllErrors(): void {
    if (!this.form) return;
    
    // Remove classes de erro
    const errorFields = this.form.querySelectorAll('.error');
    errorFields.forEach(field => {
      field.classList.remove('error', 'border-red-500');
    });
    
    // Remove mensagens de erro
    const errorMessages = this.form.querySelectorAll('.error-message');
    errorMessages.forEach(message => message.remove());
  }

  private displayError(message: string): void {
    if (!this.form) return;
    
    // Remove erro anterior
    const existingError = this.form.querySelector('.form-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Cria elemento de erro geral
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorElement.innerHTML = `
      <div class="flex items-center">
        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    // Insere no início do formulário
    this.form.insertBefore(errorElement, this.form.firstChild);
  }

  /**
   * Métodos públicos
   */
  public getState(): string {
    return this.currentState;
  }

  public addValidationRule(fieldName: string, rule: ValidationRule): void {
    this.validationRules[fieldName] = { ...this.validationRules[fieldName], ...rule };
  }

  public removeValidationRule(fieldName: string): void {
    delete this.validationRules[fieldName];
  }

  public setEndpoint(endpoint: string): void {
    this.options.endpoint = endpoint;
  }

  public reset(): void {
    if (this.form) {
      this.form.reset();
      this.clearAllErrors();
      this.setState(FORM_STATES.IDLE);
    }
  }

  public destroy(): void {
    if (this.form) {
      this.form.removeEventListener('submit', (e) => this.handleSubmit(e));
      this.clearAllErrors();
    }
  }
}

// Export da classe e factory function
export default FormHandler;

/**
 * Factory function para criar instâncias do FormHandler
 */
export const createFormHandler = (formId: string, options?: FormHandlerOptions): FormHandler => {
  return new FormHandler(formId, options);
};

/**
 * Helper para integrar com o sistema de mapeamento existente
 */
export const createMappedFormHandler = (mappingId: string, options?: Partial<FormHandlerOptions>): FormHandler => {
  const config = FormUtils.getFormConfig(mappingId);
  
  if (!config) {
    throw new Error(`Configuração não encontrada para: ${mappingId}`);
  }

  const endpoint = FormUtils.buildEndpoint(mappingId, options?.endpoint ? { id: options.endpoint } : {});
  
  return new FormHandler(mappingId.replace('form-', ''), {
    endpoint,
    method: config.method as any,
    timeout: FormUtils.getTimeout(mappingId),
    ...options
  });
};
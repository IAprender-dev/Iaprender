/**
 * SISTEMA DE VALIDAÇÃO UNIVERSAL - IAPRENDER
 * 
 * Sistema de validação para formulários HTML e React com suporte
 * a validações brasileiras e regras customizadas.
 */

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  cpf?: boolean;
  cnpj?: boolean;
  telefone?: boolean;
  cep?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidatorFunction {
  (value: any, param?: any): boolean;
}

// Conjunto de validadores básicos
export const validators: Record<string, ValidatorFunction> = {
  required: (value) => {
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return !isNaN(value);
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  },

  email: (value) => {
    if (!value) return true; // Validação de required é separada
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(value);
  },

  cpf: (value) => {
    if (!value) return true;
    
    // Remove caracteres não numéricos
    const cleanCPF = value.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Calcula os dígitos verificadores
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
    
    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10]);
  },

  cnpj: (value) => {
    if (!value) return true;
    
    // Remove caracteres não numéricos
    const cleanCNPJ = value.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Calcula primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    // Calcula segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    return digit1 === parseInt(cleanCNPJ[12]) && digit2 === parseInt(cleanCNPJ[13]);
  },

  telefone: (value) => {
    if (!value) return true;
    
    // Remove caracteres não numéricos
    const cleanPhone = value.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos
    if (cleanPhone.length !== 10 && cleanPhone.length !== 11) return false;
    
    // Lista de DDDs válidos no Brasil
    const validDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
      '21', '22', '24', // RJ
      '27', '28', // ES
      '31', '32', '33', '34', '35', '37', '38', // MG
      '41', '42', '43', '44', '45', '46', // PR
      '47', '48', '49', // SC
      '51', '53', '54', '55', // RS
      '61', // DF
      '62', '64', // GO
      '63', // TO
      '65', '66', // MT
      '67', // MS
      '68', // AC
      '69', // RO
      '71', '73', '74', '75', '77', // BA
      '79', // SE
      '81', '87', // PE
      '82', // AL
      '83', // PB
      '84', // RN
      '85', '88', // CE
      '86', '89', // PI
      '91', '93', '94', // PA
      '92', '97', // AM
      '95', // RR
      '96', // AP
      '98', '99' // MA
    ];
    
    const ddd = cleanPhone.substring(0, 2);
    return validDDDs.includes(ddd);
  },

  cep: (value) => {
    if (!value) return true;
    
    // Remove caracteres não numéricos
    const cleanCEP = value.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    return cleanCEP.length === 8;
  },

  minLength: (value, min) => {
    if (!value) return true;
    return value.toString().length >= min;
  },

  maxLength: (value, max) => {
    if (!value) return true;
    return value.toString().length <= max;
  },

  min: (value, min) => {
    if (!value) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= min;
  },

  max: (value, max) => {
    if (!value) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num <= max;
  },

  pattern: (value, pattern) => {
    if (!value) return true;
    if (typeof pattern === 'string') {
      pattern = new RegExp(pattern);
    }
    return pattern.test(value);
  },

  url: (value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  number: (value) => {
    if (!value) return true;
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  integer: (value) => {
    if (!value) return true;
    return Number.isInteger(parseFloat(value));
  },

  date: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },

  dateAfter: (value, afterDate) => {
    if (!value) return true;
    const date = new Date(value);
    const after = new Date(afterDate);
    return date > after;
  },

  dateBefore: (value, beforeDate) => {
    if (!value) return true;
    const date = new Date(value);
    const before = new Date(beforeDate);
    return date < before;
  },

  age: (value, minAge) => {
    if (!value) return true;
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= minAge;
    }
    
    return age >= minAge;
  }
};

// Mensagens de erro padrão
export const errorMessages: Record<string, string | ((param?: any) => string)> = {
  required: 'Este campo é obrigatório',
  email: 'Email deve ter um formato válido',
  cpf: 'CPF deve ter um formato válido',
  cnpj: 'CNPJ deve ter um formato válido',
  telefone: 'Telefone deve ter um formato válido com DDD',
  cep: 'CEP deve ter um formato válido',
  minLength: (min) => `Deve ter pelo menos ${min} caracteres`,
  maxLength: (max) => `Deve ter no máximo ${max} caracteres`,
  min: (min) => `Valor deve ser pelo menos ${min}`,
  max: (max) => `Valor deve ser no máximo ${max}`,
  pattern: 'Formato inválido',
  url: 'URL deve ter um formato válido',
  number: 'Deve ser um número válido',
  integer: 'Deve ser um número inteiro',
  date: 'Data deve ter um formato válido',
  dateAfter: (date) => `Data deve ser posterior a ${date}`,
  dateBefore: (date) => `Data deve ser anterior a ${date}`,
  age: (minAge) => `Idade mínima é ${minAge} anos`
};

/**
 * Valida um único campo com base nas regras fornecidas
 */
export function validateField(value: any, rules: ValidationRule, fieldName?: string): ValidationError | null {
  for (const [ruleName, ruleValue] of Object.entries(rules)) {
    const validator = validators[ruleName];
    
    if (!validator) {
      console.warn(`Validador '${ruleName}' não encontrado`);
      continue;
    }

    let isValid = false;
    
    if (ruleName === 'custom' && typeof ruleValue === 'function') {
      const result = ruleValue(value);
      if (typeof result === 'string') {
        return {
          field: fieldName || 'field',
          message: result,
          value
        };
      }
      isValid = result === true;
    } else {
      isValid = validator(value, ruleValue);
    }
    
    if (!isValid) {
      const messageTemplate = errorMessages[ruleName];
      const message = typeof messageTemplate === 'function' 
        ? messageTemplate(ruleValue) 
        : messageTemplate || `${fieldName || 'Campo'} é inválido`;
        
      return {
        field: fieldName || 'field',
        message,
        value
      };
    }
  }
  
  return null;
}

/**
 * Valida múltiplos campos de um objeto
 */
export function validateObject(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const value = data[fieldName];
    const error = validateField(value, fieldRules, fieldName);
    
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
}

/**
 * Valida um formulário HTML baseado em atributos data-validate
 */
export function validateForm(formElement: HTMLFormElement): ValidationError[] {
  const errors: ValidationError[] = [];
  const inputs = formElement.querySelectorAll('[data-validate]') as NodeListOf<HTMLInputElement>;
  
  inputs.forEach(input => {
    const rules = parseValidationRules(input.dataset.validate || '');
    const value = getInputValue(input);
    const fieldName = input.name || input.id;
    const label = input.dataset.label || input.getAttribute('placeholder') || fieldName;
    
    const error = validateField(value, rules, label);
    if (error) {
      errors.push({
        ...error,
        field: fieldName
      });
    }
  });
  
  return errors;
}

/**
 * Parseia regras de validação do formato string "required|email|minLength:5"
 */
export function parseValidationRules(rulesString: string): ValidationRule {
  const rules: ValidationRule = {};
  const rulesList = rulesString.split('|').filter(rule => rule.trim());
  
  rulesList.forEach(rule => {
    const [ruleName, param] = rule.split(':');
    
    switch (ruleName.trim()) {
      case 'required':
        rules.required = true;
        break;
      case 'email':
        rules.email = true;
        break;
      case 'cpf':
        rules.cpf = true;
        break;
      case 'cnpj':
        rules.cnpj = true;
        break;
      case 'telefone':
        rules.telefone = true;
        break;
      case 'cep':
        rules.cep = true;
        break;
      case 'minLength':
        rules.minLength = param ? parseInt(param) : 1;
        break;
      case 'maxLength':
        rules.maxLength = param ? parseInt(param) : 255;
        break;
      case 'min':
        rules.min = param ? parseFloat(param) : 0;
        break;
      case 'max':
        rules.max = param ? parseFloat(param) : Number.MAX_VALUE;
        break;
      case 'pattern':
        rules.pattern = param ? new RegExp(param) : /.*/;
        break;
      default:
        console.warn(`Regra de validação '${ruleName}' não reconhecida`);
    }
  });
  
  return rules;
}

/**
 * Obtém o valor de um input considerando seu tipo
 */
export function getInputValue(input: HTMLInputElement): any {
  switch (input.type) {
    case 'checkbox':
      return input.checked;
    case 'radio':
      const form = input.closest('form');
      if (form) {
        const checked = form.querySelector(`input[name="${input.name}"]:checked`) as HTMLInputElement;
        return checked?.value || null;
      }
      return input.checked ? input.value : null;
    case 'number':
    case 'range':
      return input.value ? parseFloat(input.value) : null;
    case 'file':
      return input.files;
    default:
      return input.value;
  }
}

/**
 * Valida um formulário e exibe erros nos campos
 */
export function validateAndDisplayErrors(formElement: HTMLFormElement): boolean {
  const errors = validateForm(formElement);
  
  // Limpa erros anteriores
  clearFormErrors(formElement);
  
  // Exibe novos erros
  errors.forEach(error => {
    const field = formElement.querySelector(`[name="${error.field}"]`) as HTMLInputElement;
    if (field) {
      displayFieldError(field, error.message);
    }
  });
  
  return errors.length === 0;
}

/**
 * Exibe erro em um campo específico
 */
export function displayFieldError(field: HTMLInputElement, message: string): void {
  // Remove erro anterior
  clearFieldError(field);
  
  // Adiciona classe de erro
  field.classList.add('error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
  
  // Cria elemento de erro
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message text-red-500 text-sm mt-1';
  errorElement.textContent = message;
  errorElement.setAttribute('data-error-for', field.name || field.id);
  
  // Insere após o campo
  const container = field.parentElement;
  if (container) {
    container.appendChild(errorElement);
  }
}

/**
 * Remove erro de um campo específico
 */
export function clearFieldError(field: HTMLInputElement): void {
  // Remove classes de erro
  field.classList.remove('error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
  
  // Remove mensagem de erro
  const fieldName = field.name || field.id;
  const errorElement = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (errorElement) {
    errorElement.remove();
  }
}

/**
 * Remove todos os erros de um formulário
 */
export function clearFormErrors(formElement: HTMLFormElement): void {
  // Remove classes de erro
  const errorFields = formElement.querySelectorAll('.error');
  errorFields.forEach(field => {
    field.classList.remove('error', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
  });
  
  // Remove mensagens de erro
  const errorMessages = formElement.querySelectorAll('.error-message');
  errorMessages.forEach(message => message.remove());
}

/**
 * Adiciona validação em tempo real a um formulário
 */
export function addRealTimeValidation(formElement: HTMLFormElement): void {
  const inputs = formElement.querySelectorAll('[data-validate]') as NodeListOf<HTMLInputElement>;
  
  inputs.forEach(input => {
    // Validação no blur (quando o campo perde o foco)
    input.addEventListener('blur', () => {
      const rules = parseValidationRules(input.dataset.validate || '');
      const value = getInputValue(input);
      const fieldName = input.name || input.id;
      const label = input.dataset.label || input.getAttribute('placeholder') || fieldName;
      
      const error = validateField(value, rules, label);
      
      if (error) {
        displayFieldError(input, error.message);
      } else {
        clearFieldError(input);
      }
    });
    
    // Remove erro enquanto o usuário digita
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        clearFieldError(input);
      }
    });
  });
}

/**
 * Formatadores automáticos para campos brasileiros
 */
export const formatters = {
  cpf: (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  },

  cnpj: (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  },

  telefone: (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (clean.length <= 11) {
      return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  },

  cep: (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 8) {
      return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  },

  currency: (value: string): string => {
    const clean = value.replace(/\D/g, '');
    const amount = parseFloat(clean) / 100;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }
};

/**
 * Adiciona formatação automática a campos
 */
export function addAutoFormatting(formElement: HTMLFormElement): void {
  const inputs = formElement.querySelectorAll('[data-format]') as NodeListOf<HTMLInputElement>;
  
  inputs.forEach(input => {
    const formatType = input.dataset.format;
    const formatter = formatters[formatType as keyof typeof formatters];
    
    if (formatter) {
      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const cursorPosition = target.selectionStart;
        const oldLength = target.value.length;
        
        target.value = formatter(target.value);
        
        // Ajusta posição do cursor após formatação
        const newLength = target.value.length;
        const lengthDiff = newLength - oldLength;
        
        if (cursorPosition !== null) {
          target.setSelectionRange(
            cursorPosition + lengthDiff,
            cursorPosition + lengthDiff
          );
        }
      });
    }
  });
}

// Exporta funções principais
export default {
  validators,
  validateField,
  validateObject,
  validateForm,
  validateAndDisplayErrors,
  parseValidationRules,
  addRealTimeValidation,
  addAutoFormatting,
  formatters,
  clearFormErrors,
  clearFieldError,
  displayFieldError
};
/**
 * CONFIGURAÇÃO INICIAL DOS TESTES - IAPRENDER
 * 
 * Setup global para todos os testes unitários e de integração
 */

import { jest } from '@jest/globals';

// Configuração global de timeout
jest.setTimeout(30000);

// Mock de fetch global para testes que não dependem de servidor
global.mockFetch = jest.fn();

// Configuração de matchers customizados
expect.extend({
  toBeValidCPF(received) {
    const cleanCPF = received.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      return {
        message: () => `Esperado CPF válido, mas recebido tem ${cleanCPF.length} dígitos`,
        pass: false,
      };
    }
    
    // Verificar se não é sequência igual
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return {
        message: () => `CPF ${received} não pode ser uma sequência de números iguais`,
        pass: false,
      };
    }
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    
    if (digit1 !== parseInt(cleanCPF[9])) {
      return {
        message: () => `CPF ${received} tem primeiro dígito verificador inválido`,
        pass: false,
      };
    }
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let digit2 = (sum * 10) % 11;
    if (digit2 === 10) digit2 = 0;
    
    const isValid = digit2 === parseInt(cleanCPF[10]);
    
    return {
      message: () => isValid 
        ? `CPF ${received} é válido`
        : `CPF ${received} tem segundo dígito verificador inválido`,
      pass: isValid,
    };
  },

  toBeValidCNPJ(received) {
    const cleanCNPJ = received.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) {
      return {
        message: () => `Esperado CNPJ válido, mas recebido tem ${cleanCNPJ.length} dígitos`,
        pass: false,
      };
    }
    
    // Verificar se não é sequência igual
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return {
        message: () => `CNPJ ${received} não pode ser uma sequência de números iguais`,
        pass: false,
      };
    }
    
    // Validação primeiro dígito
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    if (digit1 !== parseInt(cleanCNPJ[12])) {
      return {
        message: () => `CNPJ ${received} tem primeiro dígito verificador inválido`,
        pass: false,
      };
    }
    
    // Validação segundo dígito
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    const isValid = digit2 === parseInt(cleanCNPJ[13]);
    
    return {
      message: () => isValid 
        ? `CNPJ ${received} é válido`
        : `CNPJ ${received} tem segundo dígito verificador inválido`,
      pass: isValid,
    };
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(received);
    
    return {
      message: () => isValid 
        ? `Email ${received} é válido`
        : `Email ${received} tem formato inválido`,
      pass: isValid,
    };
  },

  toBeValidBrazilianPhone(received) {
    const cleanPhone = received.replace(/\D/g, '');
    
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return {
        message: () => `Telefone ${received} deve ter 10 ou 11 dígitos`,
        pass: false,
      };
    }
    
    const validDDDs = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
    const ddd = parseInt(cleanPhone.substring(0, 2));
    const isValid = validDDDs.includes(ddd);
    
    return {
      message: () => isValid 
        ? `Telefone ${received} tem DDD válido`
        : `Telefone ${received} tem DDD inválido: ${ddd}`,
      pass: isValid,
    };
  },

  toRespondWithin(received, expectedTime) {
    const duration = received;
    const isWithinTime = duration <= expectedTime;
    
    return {
      message: () => isWithinTime 
        ? `Resposta em ${duration}ms está dentro do limite de ${expectedTime}ms`
        : `Resposta em ${duration}ms excede o limite de ${expectedTime}ms`,
      pass: isWithinTime,
    };
  }
});

// Configuração de console para testes
const originalConsole = console;

beforeEach(() => {
  // Manter logs importantes, mas reduzir spam
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: originalConsole.info,
    warn: originalConsole.warn,
    error: originalConsole.error,
  };
});

afterEach(() => {
  // Restaurar console original
  global.console = originalConsole;
  
  // Limpar mocks
  jest.clearAllMocks();
});

// Configuração para testes de performance
global.performance = global.performance || {
  now: () => Date.now()
};

// Helper para aguardar condições específicas
global.waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout: condição não foi atendida em ${timeout}ms`);
};

// Helper para gerar dados de teste brasileiros
global.generateBrazilianTestData = {
  cpf: () => {
    // Gera um CPF válido para testes
    const generateDigit = (base) => {
      let sum = 0;
      for (let i = 0; i < base.length; i++) {
        sum += parseInt(base[i]) * (base.length + 1 - i);
      }
      const remainder = sum % 11;
      return remainder < 2 ? 0 : 11 - remainder;
    };

    const base = Array.from({length: 9}, () => Math.floor(Math.random() * 10)).join('');
    const digit1 = generateDigit(base);
    const digit2 = generateDigit(base + digit1);
    
    return base + digit1 + digit2;
  },
  
  cnpj: () => {
    // Gera um CNPJ válido para testes
    const base = Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
    
    // Primeiro dígito
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base[i]) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;
    
    // Segundo dígito
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt((base + digit1)[i]) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;
    
    return base + digit1 + digit2;
  },
  
  phone: () => {
    const ddds = [11, 21, 31, 41, 51, 61, 71, 81, 85];
    const ddd = ddds[Math.floor(Math.random() * ddds.length)];
    const prefix = Math.random() > 0.5 ? '9' : '3'; // Celular ou fixo
    const number = Array.from({length: prefix === '9' ? 8 : 7}, () => Math.floor(Math.random() * 10)).join('');
    
    return `${ddd}${prefix}${number}`;
  },
  
  email: () => {
    const names = ['joao', 'maria', 'pedro', 'ana', 'carlos', 'fernanda'];
    const domains = ['exemplo.com', 'teste.com.br', 'email.org', 'site.net'];
    
    const name = names[Math.floor(Math.random() * names.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const number = Math.floor(Math.random() * 1000);
    
    return `${name}${number}@${domain}`;
  }
};

// Helper para medir performance
global.measurePerformance = async (fn) => {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  
  return {
    result,
    duration: endTime - startTime
  };
};

// Configuração para detectar vazamentos de memória em testes
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('⚠️  Possível vazamento de memória detectado:', warning.message);
  }
});

console.log('✅ Setup de testes inicializado - matchers customizados carregados');
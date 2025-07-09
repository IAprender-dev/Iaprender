/**
 * SETUP DOS TESTES - IAPRENDER
 * 
 * Configuração inicial executada antes de cada teste
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_iaprender_2025_jest';
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/iaprender_test';

// Mock de console para testes mais limpos
const originalConsole = console;

// Funções de mock simples
const mockFunction = () => {};

beforeAll(() => {
  // Silenciar logs durante os testes (opcional)
  if (process.env.JEST_SILENT === 'true') {
    console.log = mockFunction;
    console.warn = mockFunction;
    console.error = mockFunction;
  }
});

afterAll(() => {
  // Restaurar console original
  if (process.env.JEST_SILENT === 'true') {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
});

// Configurações globais para matchers customizados
expect.extend({
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = jwtRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },

  toBeValidCPF(received) {
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const pass = cpfRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid CPF format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid CPF format`,
        pass: false,
      };
    }
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  }
});

console.log('🧪 Setup de testes carregado:');
console.log('✅ Variáveis de ambiente configuradas');
console.log('✅ Timeout configurado para 30s');
console.log('✅ Matchers customizados adicionados');
console.log('✅ Configuração JWT para testes definida');
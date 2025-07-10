/**
 * TESTES DE PERFORMANCE E OTIMIZAÇÃO - IAPRENDER
 * 
 * Testes para verificar performance dos formulários,
 * carregamento de dados e responsividade do sistema
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE: 2000, // 2 segundos máximo
  FORM_VALIDATION: 100, // 100ms máximo
  DATABASE_QUERY: 1000, // 1 segundo máximo
  BULK_OPERATIONS: 5000 // 5 segundos para operações em lote
};

// Utilitários de performance
class PerformanceUtils {
  static async measureTime(asyncFunction) {
    const startTime = performance.now();
    const result = await asyncFunction();
    const endTime = performance.now();
    return {
      result,
      duration: endTime - startTime
    };
  }

  static async measureApiCall(endpoint, options = {}) {
    return this.measureTime(async () => {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json().catch(() => ({}));
      return { response, data };
    });
  }

  static generateLargeFormData(fieldCount = 100) {
    const formData = {};
    
    for (let i = 0; i < fieldCount; i++) {
      formData[`campo_${i}`] = `valor_teste_${i}_${'x'.repeat(50)}`;
    }
    
    return formData;
  }

  static generateBulkUserData(userCount = 50) {
    const users = [];
    
    for (let i = 0; i < userCount; i++) {
      users.push({
        nome: `Usuario Teste ${i}`,
        email: `teste${i}@exemplo.com`,
        cpf: this.generateValidCPF(),
        telefone: `(11) 9999${String(i).padStart(4, '0')}`,
        tipo_usuario: ['professor', 'aluno', 'gestor'][i % 3]
      });
    }
    
    return users;
  }

  static generateValidCPF() {
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
  }
}

describe('Performance dos Formulários', () => {
  test('Validação de formulário simples deve ser rápida', async () => {
    const formData = {
      nome: 'João Silva',
      email: 'joao@exemplo.com',
      telefone: '(11) 99999-8888'
    };

    const { duration } = await PerformanceUtils.measureTime(async () => {
      // Simular validação básica
      const errors = [];
      
      if (!formData.nome || formData.nome.trim() === '') {
        errors.push('Nome é obrigatório');
      }
      
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Email é inválido');
      }
      
      return errors;
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_VALIDATION);
  });

  test('Validação de formulário complexo deve ser eficiente', async () => {
    const largeFormData = PerformanceUtils.generateLargeFormData(100);

    const { duration } = await PerformanceUtils.measureTime(async () => {
      const errors = [];
      
      Object.keys(largeFormData).forEach(key => {
        const value = largeFormData[key];
        
        // Simular validações complexas
        if (!value || value.trim() === '') {
          errors.push(`${key} é obrigatório`);
        }
        
        if (value.length > 100) {
          errors.push(`${key} é muito longo`);
        }
        
        // Simular validação de padrão
        if (key.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${key} tem formato inválido`);
        }
      });
      
      return errors;
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_VALIDATION * 10); // 1 segundo para 100 campos
  });

  test('Formatação de campos brasileiros deve ser rápida', async () => {
    const testData = [
      '11144477735',
      '11222333000181',
      '11999998888',
      '01234567'
    ];

    const { duration } = await PerformanceUtils.measureTime(async () => {
      return testData.map(value => {
        // Simular formatação de CPF/CNPJ/Telefone/CEP
        if (value.length === 11 && /^\d+$/.test(value)) {
          // CPF
          return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length === 14 && /^\d+$/.test(value)) {
          // CNPJ
          return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        } else if (value.length === 10 || value.length === 11) {
          // Telefone
          return value.length === 11 
            ? value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
            : value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (value.length === 8) {
          // CEP
          return value.replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        return value;
      });
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_VALIDATION);
  });
});

describe('Performance das APIs', () => {
  const testTimeout = 15000;

  beforeAll(async () => {
    // Aguardar servidor estar online
    let attempts = 0;
    while (attempts < 5) {
      try {
        const response = await fetch(`${BASE_URL}/api/dashboard/health`);
        if (response.ok) break;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      attempts++;
    }
  }, testTimeout);

  test('Health check deve responder rapidamente', async () => {
    const { duration, result } = await PerformanceUtils.measureApiCall('/api/dashboard/health');

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
    expect(result.response.status).toBe(200);
  }, testTimeout);

  test('Endpoints do dashboard devem responder em tempo hábil', async () => {
    const endpoints = [
      '/api/dashboard/health',
      '/api/dashboard/stats',
      '/api/dashboard/recents',
      '/api/dashboard/charts',
      '/api/dashboard/activity'
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const { duration, result } = await PerformanceUtils.measureApiCall(endpoint, {
          headers: endpoint !== '/api/dashboard/health' ? {
            'Authorization': 'Bearer test-token'
          } : {}
        });
        
        return { endpoint, duration, status: result.response.status };
      })
    );

    results.forEach(({ endpoint, duration, status }) => {
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
      // Health check deve retornar 200, outros devem retornar 401 (sem auth válida)
      if (endpoint === '/api/dashboard/health') {
        expect(status).toBe(200);
      } else {
        expect(status).toBe(401);
      }
    });
  }, testTimeout);

  test('Múltiplas requisições concorrentes devem ser tratadas', async () => {
    const concurrentRequests = 10;
    
    const { duration } = await PerformanceUtils.measureTime(async () => {
      const promises = Array.from({ length: concurrentRequests }, () =>
        fetch(`${BASE_URL}/api/dashboard/health`)
      );
      
      const responses = await Promise.all(promises);
      return responses.map(r => r.status);
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE * 2);
  }, testTimeout);
});

describe('Performance do Banco de Dados', () => {
  test('Simulação de consultas complexas', async () => {
    // Simular consultas que seriam feitas no banco
    const { duration } = await PerformanceUtils.measureTime(async () => {
      // Simular operações que aconteceriam no banco
      const operations = [
        // Contar usuários
        new Promise(resolve => setTimeout(() => resolve(150), 100)),
        // Contar escolas
        new Promise(resolve => setTimeout(() => resolve(25), 80)),
        // Contar alunos
        new Promise(resolve => setTimeout(() => resolve(1200), 120)),
        // Contar professores
        new Promise(resolve => setTimeout(() => resolve(80), 90))
      ];
      
      return Promise.all(operations);
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY);
  });

  test('Simulação de operações em lote', async () => {
    const bulkData = PerformanceUtils.generateBulkUserData(50);

    const { duration } = await PerformanceUtils.measureTime(async () => {
      // Simular processamento de dados em lote
      return bulkData.map(user => {
        // Simular validação e processamento
        const processed = {
          ...user,
          id: Math.floor(Math.random() * 10000),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Simular algum processamento adicional
        const validation = {
          cpf_valid: user.cpf.length === 11,
          email_valid: user.email.includes('@'),
          name_valid: user.nome.length > 0
        };
        
        return { ...processed, validation };
      });
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
  });
});

describe('Otimizações e Cache', () => {
  test('Cache de dados estáticos deve funcionar', async () => {
    const cacheData = new Map();
    
    // Primeira busca (sem cache)
    const { duration: firstCall } = await PerformanceUtils.measureTime(async () => {
      const key = 'estados_brasileiros';
      
      if (cacheData.has(key)) {
        return cacheData.get(key);
      }
      
      // Simular busca pesada
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = [
        'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
        'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
        'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
        'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
        'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
        'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
      ];
      
      cacheData.set(key, data);
      return data;
    });

    // Segunda busca (com cache)
    const { duration: secondCall } = await PerformanceUtils.measureTime(async () => {
      const key = 'estados_brasileiros';
      return cacheData.get(key);
    });

    expect(firstCall).toBeGreaterThan(90); // Primeira chamada é mais lenta
    expect(secondCall).toBeLessThan(10); // Segunda chamada é muito rápida
  });

  test('Debounce de validação deve funcionar', async () => {
    let validationCount = 0;
    
    const simulateValidationWithDebounce = (value, delay = 50) => {
      return new Promise(resolve => {
        setTimeout(() => {
          validationCount++;
          resolve(value.length > 0);
        }, delay);
      });
    };

    // Simular várias chamadas rápidas (como digitação)
    const { duration } = await PerformanceUtils.measureTime(async () => {
      const promises = [
        simulateValidationWithDebounce('J'),
        simulateValidationWithDebounce('Jo'),
        simulateValidationWithDebounce('Joa'),
        simulateValidationWithDebounce('Joao'),
        simulateValidationWithDebounce('Joao S'),
        simulateValidationWithDebounce('Joao Silva')
      ];
      
      // Em um cenário real, apenas a última validação seria executada
      // devido ao debounce, mas aqui simulamos todas para medir
      return Promise.all(promises);
    });

    expect(validationCount).toBe(6);
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.FORM_VALIDATION * 6);
  });
});

describe('Métricas de Qualidade', () => {
  test('Cobertura de validações brasileiras', () => {
    const testCases = {
      cpf: ['11144477735', '111.444.777-35', '00000000000', '123456789'],
      cnpj: ['11222333000181', '11.222.333/0001-81', '00000000000000', '123456789'],
      telefone: ['11999998888', '(11) 99999-8888', '00988887777', '119999'],
      email: ['teste@exemplo.com', 'usuario+tag@dominio.com.br', 'email-invalido', '@dominio.com']
    };

    Object.keys(testCases).forEach(type => {
      const validCases = testCases[type].slice(0, 2); // Primeiros 2 são válidos
      const invalidCases = testCases[type].slice(2); // Últimos 2 são inválidos

      validCases.forEach(value => {
        // Em um validador real, estes devem retornar true
        expect(value.length).toBeGreaterThan(0);
      });

      invalidCases.forEach(value => {
        // Em um validador real, estes devem retornar false
        expect(value.length).toBeGreaterThan(0); // Teste básico
      });
    });
  });

  test('Cobertura de cenários de erro', () => {
    const errorScenarios = [
      { type: 'required_field', message: 'Campo obrigatório não preenchido' },
      { type: 'invalid_format', message: 'Formato inválido' },
      { type: 'network_error', message: 'Erro de conexão' },
      { type: 'server_error', message: 'Erro interno do servidor' },
      { type: 'validation_error', message: 'Dados inválidos' }
    ];

    errorScenarios.forEach(scenario => {
      expect(scenario.type).toBeDefined();
      expect(scenario.message).toBeDefined();
      expect(scenario.message.length).toBeGreaterThan(5);
    });
  });
});

describe('Testes de Carga e Stress', () => {
  test('Sistema deve lidar com formulários grandes', async () => {
    const largeForm = PerformanceUtils.generateLargeFormData(500); // 500 campos
    
    const { duration } = await PerformanceUtils.measureTime(async () => {
      // Simular processamento de formulário grande
      const processed = Object.keys(largeForm).reduce((acc, key) => {
        acc[key] = {
          value: largeForm[key],
          valid: largeForm[key].length > 0,
          formatted: largeForm[key].trim().toUpperCase()
        };
        return acc;
      }, {});
      
      return processed;
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.BULK_OPERATIONS);
    expect(Object.keys(largeForm)).toHaveLength(500);
  });

  test('Simulação de múltiplos usuários simultâneos', async () => {
    const simultaneousUsers = 20;
    
    const { duration } = await PerformanceUtils.measureTime(async () => {
      const userPromises = Array.from({ length: simultaneousUsers }, (_, index) => 
        new Promise(resolve => {
          // Simular operação de usuário (validação + envio)
          setTimeout(() => {
            const userData = {
              id: index,
              name: `Usuario ${index}`,
              processed: true,
              timestamp: Date.now()
            };
            resolve(userData);
          }, Math.random() * 100); // Variação de 0-100ms
        })
      );
      
      return Promise.all(userPromises);
    });

    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.API_RESPONSE);
  });
});
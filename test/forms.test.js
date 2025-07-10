/**
 * TESTES AUTOMATIZADOS PARA FORMULÁRIOS - IAPRENDER
 * 
 * Testes para validação de formulários dinâmicos, campos brasileiros
 * e integração com backend
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

// Configurar ambiente DOM para testes
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:5000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.fetch = fetch;

// URL base para testes
const BASE_URL = 'http://localhost:5000';

// Simular FormGenerator e validações
class FormGeneratorTest {
  constructor() {
    this.fields = [];
    this.validationErrors = [];
  }

  addField(config) {
    this.fields.push(config);
    return this;
  }

  validateCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10) firstDigit = 0;
    
    if (firstDigit !== parseInt(cleanCPF[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10) secondDigit = 0;
    
    return secondDigit === parseInt(cleanCPF[10]);
  }

  validateCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validação primeiro dígito
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i];
    }
    let firstDigit = sum % 11;
    firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;
    
    if (firstDigit !== parseInt(cleanCNPJ[12])) return false;
    
    // Validação segundo dígito
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i];
    }
    let secondDigit = sum % 11;
    secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;
    
    return secondDigit === parseInt(cleanCNPJ[13]);
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Deve ter 10 ou 11 dígitos
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;
    
    // DDDs válidos do Brasil
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
      21, 22, 24, // RJ/ES
      27, 28, // ES
      31, 32, 33, 34, 35, 37, 38, // MG
      41, 42, 43, 44, 45, 46, // PR
      47, 48, 49, // SC
      51, 53, 54, 55, // RS
      61, // DF
      62, 64, // GO
      63, // TO
      65, 66, // MT
      67, // MS
      68, // AC
      69, // RO
      71, 73, 74, 75, 77, // BA
      79, // SE
      81, 87, // PE
      82, // AL
      83, // PB
      84, // RN
      85, 88, // CE
      86, 89, // PI
      91, 93, 94, // PA
      92, 97, // AM
      95, // RR
      96, // AP
      98, 99  // MA
    ];
    
    const ddd = parseInt(cleanPhone.substring(0, 2));
    return validDDDs.includes(ddd);
  }

  validateRequiredFields(formData) {
    const errors = [];
    
    this.fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name].trim() === '')) {
        errors.push(`Campo ${field.label} é obrigatório`);
      }
    });
    
    return errors;
  }

  validateAllFields(formData) {
    const errors = [];
    
    // Validações obrigatórias
    errors.push(...this.validateRequiredFields(formData));
    
    // Validações específicas
    Object.keys(formData).forEach(fieldName => {
      const value = formData[fieldName];
      const field = this.fields.find(f => f.name === fieldName);
      
      if (!field || !value) return;
      
      switch (field.type) {
        case 'cpf':
          if (!this.validateCPF(value)) {
            errors.push(`CPF ${value} é inválido`);
          }
          break;
        case 'cnpj':
          if (!this.validateCNPJ(value)) {
            errors.push(`CNPJ ${value} é inválido`);
          }
          break;
        case 'email':
          if (!this.validateEmail(value)) {
            errors.push(`Email ${value} é inválido`);
          }
          break;
        case 'tel':
          if (!this.validatePhone(value)) {
            errors.push(`Telefone ${value} é inválido`);
          }
          break;
      }
    });
    
    return errors;
  }

  async submitForm(formData, endpoint) {
    const errors = this.validateAllFields(formData);
    
    if (errors.length > 0) {
      throw new Error(`Erros de validação: ${errors.join(', ')}`);
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(formData)
      });
      
      return {
        success: response.ok,
        status: response.status,
        data: await response.json().catch(() => ({}))
      };
    } catch (error) {
      throw new Error(`Erro na requisição: ${error.message}`);
    }
  }
}

describe('Formulários - Sistema IAprender', () => {
  let formGenerator;
  
  beforeEach(() => {
    formGenerator = new FormGeneratorTest();
  });

  describe('Validação de Campos Obrigatórios', () => {
    test('Deve detectar campos obrigatórios vazios', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true })
        .addField({ name: 'telefone', label: 'Telefone', type: 'tel', required: false });

      const formData = {
        nome: '',
        email: 'teste@exemplo.com',
        telefone: '(11) 99999-9999'
      };

      const errors = formGenerator.validateRequiredFields(formData);
      
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Nome é obrigatório');
    });

    test('Deve passar quando todos os campos obrigatórios estão preenchidos', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true });

      const formData = {
        nome: 'João Silva',
        email: 'joao@exemplo.com'
      };

      const errors = formGenerator.validateRequiredFields(formData);
      
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de CPF', () => {
    test('Deve validar CPF correto', () => {
      expect(formGenerator.validateCPF('11144477735')).toBe(true);
      expect(formGenerator.validateCPF('111.444.777-35')).toBe(true);
    });

    test('Deve rejeitar CPF inválido', () => {
      expect(formGenerator.validateCPF('11111111111')).toBe(false); // Sequência
      expect(formGenerator.validateCPF('123456789')).toBe(false); // Muito curto
      expect(formGenerator.validateCPF('11144477736')).toBe(false); // Dígito errado
    });

    test('Deve validar CPF em formulário', () => {
      formGenerator.addField({ name: 'cpf', label: 'CPF', type: 'cpf', required: true });

      const formDataValido = { cpf: '111.444.777-35' };
      const formDataInvalido = { cpf: '111.444.777-36' };

      expect(formGenerator.validateAllFields(formDataValido)).toHaveLength(0);
      expect(formGenerator.validateAllFields(formDataInvalido)).toHaveLength(1);
    });
  });

  describe('Validação de CNPJ', () => {
    test('Deve validar CNPJ correto', () => {
      expect(formGenerator.validateCNPJ('11222333000181')).toBe(true);
      expect(formGenerator.validateCNPJ('11.222.333/0001-81')).toBe(true);
    });

    test('Deve rejeitar CNPJ inválido', () => {
      expect(formGenerator.validateCNPJ('11111111111111')).toBe(false); // Sequência
      expect(formGenerator.validateCNPJ('1122233300018')).toBe(false); // Muito curto
      expect(formGenerator.validateCNPJ('11222333000182')).toBe(false); // Dígito errado
    });

    test('Deve validar CNPJ em formulário', () => {
      formGenerator.addField({ name: 'cnpj', label: 'CNPJ', type: 'cnpj', required: true });

      const formDataValido = { cnpj: '11.222.333/0001-81' };
      const formDataInvalido = { cnpj: '11.222.333/0001-82' };

      expect(formGenerator.validateAllFields(formDataValido)).toHaveLength(0);
      expect(formGenerator.validateAllFields(formDataInvalido)).toHaveLength(1);
    });
  });

  describe('Validação de Email', () => {
    test('Deve validar email correto', () => {
      expect(formGenerator.validateEmail('teste@exemplo.com')).toBe(true);
      expect(formGenerator.validateEmail('usuario.teste+tag@dominio.com.br')).toBe(true);
    });

    test('Deve rejeitar email inválido', () => {
      expect(formGenerator.validateEmail('email-invalido')).toBe(false);
      expect(formGenerator.validateEmail('@dominio.com')).toBe(false);
      expect(formGenerator.validateEmail('teste@')).toBe(false);
    });
  });

  describe('Validação de Telefone Brasileiro', () => {
    test('Deve validar telefones com DDDs válidos', () => {
      expect(formGenerator.validatePhone('(11) 99999-9999')).toBe(true); // SP celular
      expect(formGenerator.validatePhone('(21) 3333-4444')).toBe(true); // RJ fixo
      expect(formGenerator.validatePhone('85988887777')).toBe(true); // CE sem formatação
    });

    test('Deve rejeitar telefones com DDDs inválidos', () => {
      expect(formGenerator.validatePhone('(00) 99999-9999')).toBe(false); // DDD inexistente
      expect(formGenerator.validatePhone('(99) 88887777')).toBe(false); // DDD inexistente
    });

    test('Deve rejeitar telefones com formato incorreto', () => {
      expect(formGenerator.validatePhone('119999')).toBe(false); // Muito curto
      expect(formGenerator.validatePhone('1199999999999')).toBe(false); // Muito longo
    });
  });

  describe('Formulários Específicos do Sistema', () => {
    test('Formulário de Cadastro de Usuário - Completo', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true })
        .addField({ name: 'cpf', label: 'CPF', type: 'cpf', required: true })
        .addField({ name: 'telefone', label: 'Telefone', type: 'tel', required: true })
        .addField({ name: 'tipo_usuario', label: 'Tipo', type: 'select', required: true });

      const formDataValido = {
        nome: 'Maria Silva',
        email: 'maria@escola.com.br',
        cpf: '111.444.777-35',
        telefone: '(11) 99999-8888',
        tipo_usuario: 'professor'
      };

      const errors = formGenerator.validateAllFields(formDataValido);
      expect(errors).toHaveLength(0);
    });

    test('Formulário de Cadastro de Escola - Completo', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'cnpj', label: 'CNPJ', type: 'cnpj', required: true })
        .addField({ name: 'codigo_inep', label: 'Código INEP', type: 'text', required: true })
        .addField({ name: 'telefone', label: 'Telefone', type: 'tel', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true });

      const formDataValido = {
        nome: 'EMEF Monteiro Lobato',
        cnpj: '11.222.333/0001-81',
        codigo_inep: '35123456',
        telefone: '(11) 3333-4444',
        email: 'contato@emef.sp.gov.br'
      };

      const errors = formGenerator.validateAllFields(formDataValido);
      expect(errors).toHaveLength(0);
    });

    test('Formulário de Matrícula de Aluno - Completo', () => {
      formGenerator
        .addField({ name: 'nome_aluno', label: 'Nome do Aluno', type: 'text', required: true })
        .addField({ name: 'cpf_aluno', label: 'CPF do Aluno', type: 'cpf', required: false })
        .addField({ name: 'nome_responsavel', label: 'Nome do Responsável', type: 'text', required: true })
        .addField({ name: 'cpf_responsavel', label: 'CPF do Responsável', type: 'cpf', required: true })
        .addField({ name: 'telefone_responsavel', label: 'Telefone do Responsável', type: 'tel', required: true })
        .addField({ name: 'serie', label: 'Série', type: 'select', required: true })
        .addField({ name: 'turno', label: 'Turno', type: 'select', required: true });

      const formDataValido = {
        nome_aluno: 'Pedro Santos',
        cpf_aluno: '',
        nome_responsavel: 'Ana Santos',
        cpf_responsavel: '111.444.777-35',
        telefone_responsavel: '(11) 98888-7777',
        serie: '5º Ano',
        turno: 'manhã'
      };

      const errors = formGenerator.validateAllFields(formDataValido);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Integração com Backend', () => {
    test('Deve enviar dados válidos para o backend', async () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true });

      const formData = {
        nome: 'Teste Usuario',
        email: 'teste@exemplo.com'
      };

      // Mock da resposta para simular sucesso
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ success: true, id: 123 })
      });

      const result = await formGenerator.submitForm(formData, '/api/usuarios');
      
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/usuarios',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          }),
          body: JSON.stringify(formData)
        })
      );
    });

    test('Deve rejeitar dados inválidos antes de enviar', async () => {
      formGenerator
        .addField({ name: 'email', label: 'Email', type: 'email', required: true });

      const formDataInvalido = {
        email: 'email-invalido'
      };

      await expect(
        formGenerator.submitForm(formDataInvalido, '/api/usuarios')
      ).rejects.toThrow('Erros de validação');
    });

    test('Deve tratar erro de resposta do servidor', async () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true });

      const formData = { nome: 'Teste' };

      // Mock de erro de servidor
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Erro interno' })
      });

      const result = await formGenerator.submitForm(formData, '/api/usuarios');
      
      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
    });

    test('Deve tratar erro de rede', async () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true });

      const formData = { nome: 'Teste' };

      // Mock de erro de rede
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        formGenerator.submitForm(formData, '/api/usuarios')
      ).rejects.toThrow('Erro na requisição: Network error');
    });
  });

  describe('Casos de Uso Específicos', () => {
    test('Cadastro completo de professor', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'email', label: 'Email', type: 'email', required: true })
        .addField({ name: 'cpf', label: 'CPF', type: 'cpf', required: true })
        .addField({ name: 'telefone', label: 'Telefone', type: 'tel', required: true })
        .addField({ name: 'disciplinas', label: 'Disciplinas', type: 'text', required: true })
        .addField({ name: 'formacao', label: 'Formação', type: 'text', required: true });

      const professorData = {
        nome: 'Dr. Carlos Pereira',
        email: 'carlos.pereira@escola.sp.gov.br',
        cpf: '111.444.777-35',
        telefone: '(11) 99999-8888',
        disciplinas: 'Matemática, Física',
        formacao: 'Doutorado em Matemática - USP'
      };

      const errors = formGenerator.validateAllFields(professorData);
      expect(errors).toHaveLength(0);
    });

    test('Cadastro de escola municipal', () => {
      formGenerator
        .addField({ name: 'nome', label: 'Nome', type: 'text', required: true })
        .addField({ name: 'cnpj', label: 'CNPJ', type: 'cnpj', required: true })
        .addField({ name: 'codigo_inep', label: 'Código INEP', type: 'text', required: true })
        .addField({ name: 'tipo_escola', label: 'Tipo', type: 'select', required: true })
        .addField({ name: 'endereco', label: 'Endereço', type: 'text', required: true })
        .addField({ name: 'telefone', label: 'Telefone', type: 'tel', required: true });

      const escolaData = {
        nome: 'EMEF Prof. João XXIII',
        cnpj: '11.222.333/0001-81',
        codigo_inep: '35123456',
        tipo_escola: 'municipal',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 3333-4444'
      };

      const errors = formGenerator.validateAllFields(escolaData);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Performance e Usabilidade', () => {
    test('Validação deve ser rápida para formulários grandes', () => {
      // Criar formulário com muitos campos
      for (let i = 0; i < 50; i++) {
        formGenerator.addField({
          name: `campo_${i}`,
          label: `Campo ${i}`,
          type: 'text',
          required: i % 3 === 0
        });
      }

      const formData = {};
      for (let i = 0; i < 50; i++) {
        formData[`campo_${i}`] = i % 3 === 0 ? `valor_${i}` : '';
      }

      const startTime = Date.now();
      const errors = formGenerator.validateAllFields(formData);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Menos de 100ms
      expect(errors.length).toBeGreaterThan(0); // Deve ter alguns erros
    });

    test('Deve limpar dados de forma segura', () => {
      const cpfComMascara = '111.444.777-35';
      const cpfLimpo = cpfComMascara.replace(/\D/g, '');
      
      expect(cpfLimpo).toBe('11144477735');
      expect(cpfLimpo).toHaveLength(11);
    });
  });
});

/**
 * CONFIGURAÇÃO DE TESTES DE INTEGRAÇÃO
 */
describe('Testes de Integração - Endpoints', () => {
  const testTimeout = 10000; // 10 segundos

  beforeAll(async () => {
    // Aguardar servidor estar online
    let attempts = 0;
    while (attempts < 5) {
      try {
        const response = await fetch(`${BASE_URL}/api/dashboard/health`);
        if (response.ok) break;
      } catch (error) {
        console.log(`Tentativa ${attempts + 1}: Aguardando servidor...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      attempts++;
    }
  }, testTimeout);

  test('Health check deve retornar status saudável', async () => {
    const response = await fetch(`${BASE_URL}/api/dashboard/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.services.database).toBe('connected');
  }, testTimeout);

  test('Endpoints protegidos devem retornar 401 sem autenticação', async () => {
    const endpoints = [
      '/api/dashboard/stats',
      '/api/dashboard/recents', 
      '/api/dashboard/charts',
      '/api/dashboard/activity'
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      expect(response.status).toBe(401);
    }
  }, testTimeout);
});
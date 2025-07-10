/**
 * TESTE SIMPLES - SISTEMA IAPRENDER
 * 
 * Teste básico para validar funcionamento do sistema de testes
 */

// Teste básico sem dependências externas
console.log('🎯 Iniciando testes simples do sistema...');

// Teste 1: Validação de CPF
function validateCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  if (digit1 !== parseInt(cleanCPF[9])) return false;
  
  // Validação segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  return digit2 === parseInt(cleanCPF[10]);
}

// Teste 2: Validação de Email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Teste 3: Validação de Telefone Brasileiro
function validateBrazilianPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;
  
  const validDDDs = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];
  const ddd = parseInt(cleanPhone.substring(0, 2));
  return validDDDs.includes(ddd);
}

// Executar testes
const tests = [
  {
    name: 'Validação de CPF',
    func: () => {
      const validCPF = '111.444.777-35';
      const invalidCPF = '123.456.789-00';
      
      if (!validateCPF(validCPF)) throw new Error('CPF válido foi rejeitado');
      if (validateCPF(invalidCPF)) throw new Error('CPF inválido foi aceito');
      
      return true;
    }
  },
  {
    name: 'Validação de Email',
    func: () => {
      const validEmail = 'teste@exemplo.com';
      const invalidEmail = 'email-invalido';
      
      if (!validateEmail(validEmail)) throw new Error('Email válido foi rejeitado');
      if (validateEmail(invalidEmail)) throw new Error('Email inválido foi aceito');
      
      return true;
    }
  },
  {
    name: 'Validação de Telefone',
    func: () => {
      const validPhone = '(11) 99999-8888';
      const invalidPhone = '(01) 12345-6789'; // DDD 01 não existe
      
      if (!validateBrazilianPhone(validPhone)) throw new Error('Telefone válido foi rejeitado');
      if (validateBrazilianPhone(invalidPhone)) throw new Error('Telefone inválido foi aceito');
      
      return true;
    }
  },
  {
    name: 'Performance de Validação',
    func: () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        validateCPF('111.444.777-35');
        validateEmail('teste@exemplo.com');
        validateBrazilianPhone('(11) 99999-8888');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) throw new Error(`Performance insuficiente: ${duration}ms para 1000 validações`);
      
      console.log(`   ⚡ Performance: ${duration}ms para 1000 validações`);
      return true;
    }
  },
  {
    name: 'Teste de Formulário Mock',
    func: () => {
      const formData = {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        cpf: '111.444.777-35',
        telefone: '(11) 99999-8888'
      };
      
      const errors = [];
      
      if (!formData.nome || formData.nome.trim() === '') {
        errors.push('Nome é obrigatório');
      }
      
      if (!validateEmail(formData.email)) {
        errors.push('Email inválido');
      }
      
      if (!validateCPF(formData.cpf)) {
        errors.push('CPF inválido');
      }
      
      if (!validateBrazilianPhone(formData.telefone)) {
        errors.push('Telefone inválido');
      }
      
      if (errors.length > 0) {
        throw new Error(`Validação falhou: ${errors.join(', ')}`);
      }
      
      return true;
    }
  }
];

let passed = 0;
let failed = 0;

console.log('\n📋 Executando testes...\n');

tests.forEach(test => {
  try {
    test.func();
    console.log(`✅ ${test.name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${test.name}: ${error.message}`);
    failed++;
  }
});

console.log('\n📊 Resultados dos Testes:');
console.log(`✅ Passou: ${passed}`);
console.log(`❌ Falhou: ${failed}`);
console.log(`📈 Taxa de Sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 Todos os testes passaram!');
  process.exit(0);
} else {
  console.log('\n⚠️  Alguns testes falharam.');
  process.exit(1);
}
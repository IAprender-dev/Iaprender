/**
 * VALIDADORES - SISTEMA DE GESTÃO EDUCACIONAL IAPRENDER
 * 
 * Este arquivo contém funções de validação para dados do sistema,
 * implementando validações robustas para formato brasileiro.
 */

/**
 * Validar formato de email
 * @param {string} email - Email a ser validado
 * @returns {object} - { valido: boolean, erro?: string }
 */
export function validarEmail(email) {
  try {
    // Verificar se email foi fornecido
    if (!email || typeof email !== 'string') {
      return {
        valido: false,
        erro: 'Email é obrigatório'
      };
    }

    // Remover espaços em branco
    const emailLimpo = email.trim().toLowerCase();

    // Verificar comprimento mínimo e máximo
    if (emailLimpo.length < 5 || emailLimpo.length > 100) {
      return {
        valido: false,
        erro: 'Email deve ter entre 5 e 100 caracteres'
      };
    }

    // Regex para validação de email (RFC 5322 simplificado)
    const regexEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!regexEmail.test(emailLimpo)) {
      return {
        valido: false,
        erro: 'Formato de email inválido'
      };
    }

    // Verificar se tem pelo menos um ponto após o @
    const partes = emailLimpo.split('@');
    if (partes.length !== 2 || !partes[1].includes('.')) {
      return {
        valido: false,
        erro: 'Email deve conter domínio válido'
      };
    }

    // Verificar se não começa ou termina com ponto
    if (emailLimpo.startsWith('.') || emailLimpo.endsWith('.')) {
      return {
        valido: false,
        erro: 'Email não pode começar ou terminar com ponto'
      };
    }

    return {
      valido: true,
      emailLimpo: emailLimpo
    };

  } catch (error) {
    return {
      valido: false,
      erro: 'Erro ao validar email: ' + error.message
    };
  }
}

/**
 * Validar CPF brasileiro
 * @param {string} cpf - CPF a ser validado
 * @returns {object} - { valido: boolean, erro?: string, cpfLimpo?: string }
 */
export function validarCPF(cpf) {
  try {
    // Verificar se CPF foi fornecido
    if (!cpf || typeof cpf !== 'string') {
      return {
        valido: false,
        erro: 'CPF é obrigatório'
      };
    }

    // Remover pontos, traços e espaços
    const cpfLimpo = cpf.replace(/[^\d]/g, '');

    // Verificar se tem 11 dígitos
    if (cpfLimpo.length !== 11) {
      return {
        valido: false,
        erro: 'CPF deve conter 11 dígitos'
      };
    }

    // Verificar se não é uma sequência de números iguais
    const cpfsInvalidos = [
      '00000000000', '11111111111', '22222222222', '33333333333',
      '44444444444', '55555555555', '66666666666', '77777777777',
      '88888888888', '99999999999'
    ];

    if (cpfsInvalidos.includes(cpfLimpo)) {
      return {
        valido: false,
        erro: 'CPF não pode ser uma sequência de números iguais'
      };
    }

    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(9))) {
      return {
        valido: false,
        erro: 'CPF inválido - primeiro dígito verificador incorreto'
      };
    }

    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.charAt(10))) {
      return {
        valido: false,
        erro: 'CPF inválido - segundo dígito verificador incorreto'
      };
    }

    return {
      valido: true,
      cpfLimpo: cpfLimpo,
      cpfFormatado: cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    };

  } catch (error) {
    return {
      valido: false,
      erro: 'Erro ao validar CPF: ' + error.message
    };
  }
}

/**
 * Validar CNPJ brasileiro
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {object} - { valido: boolean, erro?: string, cnpjLimpo?: string }
 */
export function validarCNPJ(cnpj) {
  try {
    // Verificar se CNPJ foi fornecido
    if (!cnpj || typeof cnpj !== 'string') {
      return {
        valido: false,
        erro: 'CNPJ é obrigatório'
      };
    }

    // Remover pontos, barras, traços e espaços
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    // Verificar se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      return {
        valido: false,
        erro: 'CNPJ deve conter 14 dígitos'
      };
    }

    // Verificar se não é uma sequência de números iguais
    const cnpjsInvalidos = [
      '00000000000000', '11111111111111', '22222222222222', '33333333333333',
      '44444444444444', '55555555555555', '66666666666666', '77777777777777',
      '88888888888888', '99999999999999'
    ];

    if (cnpjsInvalidos.includes(cnpjLimpo)) {
      return {
        valido: false,
        erro: 'CNPJ não pode ser uma sequência de números iguais'
      };
    }

    // Validar primeiro dígito verificador
    let tamanho = cnpjLimpo.length - 2;
    let numeros = cnpjLimpo.substring(0, tamanho);
    let digitos = cnpjLimpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(0))) {
      return {
        valido: false,
        erro: 'CNPJ inválido - primeiro dígito verificador incorreto'
      };
    }

    // Validar segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado !== parseInt(digitos.charAt(1))) {
      return {
        valido: false,
        erro: 'CNPJ inválido - segundo dígito verificador incorreto'
      };
    }

    return {
      valido: true,
      cnpjLimpo: cnpjLimpo,
      cnpjFormatado: cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    };

  } catch (error) {
    return {
      valido: false,
      erro: 'Erro ao validar CNPJ: ' + error.message
    };
  }
}

/**
 * Validar telefone brasileiro
 * @param {string} telefone - Telefone a ser validado
 * @returns {object} - { valido: boolean, erro?: string, telefoneLimpo?: string }
 */
export function validarTelefone(telefone) {
  try {
    // Verificar se telefone foi fornecido
    if (!telefone || typeof telefone !== 'string') {
      return {
        valido: false,
        erro: 'Telefone é obrigatório'
      };
    }

    // Remover espaços, parênteses, traços e outros caracteres especiais
    const telefoneLimpo = telefone.replace(/[^\d]/g, '');

    // Verificar comprimento (8, 9, 10 ou 11 dígitos)
    if (telefoneLimpo.length < 8 || telefoneLimpo.length > 11) {
      return {
        valido: false,
        erro: 'Telefone deve ter entre 8 e 11 dígitos'
      };
    }

    let ddd = '';
    let numero = '';
    let formatado = '';

    // Telefone com DDD (10 ou 11 dígitos)
    if (telefoneLimpo.length >= 10) {
      ddd = telefoneLimpo.substring(0, 2);
      numero = telefoneLimpo.substring(2);

      // Validar DDD (11 a 99, exceto alguns inválidos)
      const dddNumerico = parseInt(ddd);
      const dddsValidos = [
        11, 12, 13, 14, 15, 16, 17, 18, 19, // São Paulo
        21, 22, 24, // Rio de Janeiro
        27, 28, // Espírito Santo
        31, 32, 33, 34, 35, 37, 38, // Minas Gerais
        41, 42, 43, 44, 45, 46, // Paraná
        47, 48, 49, // Santa Catarina
        51, 53, 54, 55, // Rio Grande do Sul
        61, // Distrito Federal
        62, 64, // Goiás
        63, // Tocantins
        65, 66, // Mato Grosso
        67, // Mato Grosso do Sul
        68, // Acre
        69, // Rondônia
        71, 73, 74, 75, 77, // Bahia
        79, // Sergipe
        81, 87, // Pernambuco
        82, // Alagoas
        83, // Paraíba
        84, // Rio Grande do Norte
        85, 88, // Ceará
        86, 89, // Piauí
        91, 93, 94, // Pará
        92, 97, // Amazonas
        95, // Roraima
        96, // Amapá
        98, 99  // Maranhão
      ];

      if (!dddsValidos.includes(dddNumerico)) {
        return {
          valido: false,
          erro: 'DDD inválido'
        };
      }

      // Telefone celular (11 dígitos) deve começar com 9
      if (telefoneLimpo.length === 11) {
        if (!numero.startsWith('9')) {
          return {
            valido: false,
            erro: 'Celular deve começar com 9 após o DDD'
          };
        }
        formatado = `(${ddd}) ${numero.substring(0, 5)}-${numero.substring(5)}`;
      }
      // Telefone fixo (10 dígitos)
      else if (telefoneLimpo.length === 10) {
        // Telefone fixo não deve começar com 9
        if (numero.startsWith('9')) {
          return {
            valido: false,
            erro: 'Telefone fixo não deve começar com 9'
          };
        }
        formatado = `(${ddd}) ${numero.substring(0, 4)}-${numero.substring(4)}`;
      }
    }
    // Telefone sem DDD (8 ou 9 dígitos)
    else {
      numero = telefoneLimpo;
      
      if (telefoneLimpo.length === 9) {
        // Celular sem DDD deve começar com 9
        if (!numero.startsWith('9')) {
          return {
            valido: false,
            erro: 'Celular sem DDD deve começar com 9'
          };
        }
        formatado = `${numero.substring(0, 5)}-${numero.substring(5)}`;
      } else if (telefoneLimpo.length === 8) {
        // Telefone fixo sem DDD
        formatado = `${numero.substring(0, 4)}-${numero.substring(4)}`;
      }
    }

    // Verificar se não é uma sequência de números iguais
    const numerosIguais = /^(\d)\1+$/.test(numero);
    if (numerosIguais) {
      return {
        valido: false,
        erro: 'Telefone não pode ser uma sequência de números iguais'
      };
    }

    return {
      valido: true,
      telefoneLimpo: telefoneLimpo,
      telefoneFormatado: formatado,
      ddd: ddd || null,
      numero: numero,
      tipo: telefoneLimpo.length === 11 || (telefoneLimpo.length === 9 && numero.startsWith('9')) ? 'celular' : 'fixo'
    };

  } catch (error) {
    return {
      valido: false,
      erro: 'Erro ao validar telefone: ' + error.message
    };
  }
}

/**
 * Função utilitária para validar múltiplos campos
 * @param {object} dados - Objeto com os dados a serem validados
 * @returns {object} - { valido: boolean, erros: array }
 */
export function validarDados(dados) {
  const erros = [];
  
  // Validar email se fornecido
  if (dados.email) {
    const resultadoEmail = validarEmail(dados.email);
    if (!resultadoEmail.valido) {
      erros.push({
        campo: 'email',
        erro: resultadoEmail.erro
      });
    }
  }

  // Validar CPF se fornecido
  if (dados.cpf) {
    const resultadoCPF = validarCPF(dados.cpf);
    if (!resultadoCPF.valido) {
      erros.push({
        campo: 'cpf',
        erro: resultadoCPF.erro
      });
    }
  }

  // Validar CNPJ se fornecido
  if (dados.cnpj) {
    const resultadoCNPJ = validarCNPJ(dados.cnpj);
    if (!resultadoCNPJ.valido) {
      erros.push({
        campo: 'cnpj',
        erro: resultadoCNPJ.erro
      });
    }
  }

  // Validar telefone se fornecido
  if (dados.telefone) {
    const resultadoTelefone = validarTelefone(dados.telefone);
    if (!resultadoTelefone.valido) {
      erros.push({
        campo: 'telefone',
        erro: resultadoTelefone.erro
      });
    }
  }

  return {
    valido: erros.length === 0,
    erros: erros
  };
}

/**
 * Função para sanitizar entrada de texto
 * @param {string} texto - Texto a ser sanitizado
 * @returns {string} - Texto limpo
 */
export function sanitizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  
  return texto
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/['"]/g, '') // Remove aspas
    .replace(/\s+/g, ' '); // Normaliza espaços
}

// Log de inicialização
console.log('📋 VALIDADORES CARREGADOS:');
console.log('✅ validarEmail() - Validação de formato de email');
console.log('✅ validarCPF() - Validação com dígitos verificadores');
console.log('✅ validarCNPJ() - Validação com dígitos verificadores');
console.log('✅ validarTelefone() - Validação com DDDs brasileiros');
console.log('✅ validarDados() - Validação em lote');
console.log('✅ sanitizarTexto() - Limpeza de entrada');
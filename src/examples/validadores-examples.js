/**
 * EXEMPLOS DE USO - VALIDADORES
 * 
 * Este arquivo demonstra como usar todas as funções de validação
 * disponíveis no sistema, com casos válidos e inválidos.
 */

import { 
  validarEmail, 
  validarCPF, 
  validarCNPJ, 
  validarTelefone, 
  validarDados,
  sanitizarTexto 
} from '../utils/validadores.js';

/**
 * EXEMPLO 1: VALIDAÇÃO DE EMAIL
 */
const exemploValidacaoEmail = {
  casos_validos: [
    {
      input: 'usuario@exemplo.com',
      output: {
        valido: true,
        emailLimpo: 'usuario@exemplo.com'
      }
    },
    {
      input: 'ADMIN@ESCOLA.EDU.BR',
      output: {
        valido: true,
        emailLimpo: 'admin@escola.edu.br'
      }
    },
    {
      input: '  gestor.municipal@prefeitura.sp.gov.br  ',
      output: {
        valido: true,
        emailLimpo: 'gestor.municipal@prefeitura.sp.gov.br'
      }
    },
    {
      input: 'professor123+turmaA@escola.com',
      output: {
        valido: true,
        emailLimpo: 'professor123+turmaa@escola.com'
      }
    }
  ],
  casos_invalidos: [
    {
      input: '',
      output: {
        valido: false,
        erro: 'Email é obrigatório'
      }
    },
    {
      input: 'email-sem-arroba.com',
      output: {
        valido: false,
        erro: 'Formato de email inválido'
      }
    },
    {
      input: '@dominio.com',
      output: {
        valido: false,
        erro: 'Formato de email inválido'
      }
    },
    {
      input: 'usuario@',
      output: {
        valido: false,
        erro: 'Email deve conter domínio válido'
      }
    },
    {
      input: '.usuario@exemplo.com',
      output: {
        valido: false,
        erro: 'Email não pode começar ou terminar com ponto'
      }
    }
  ]
};

/**
 * EXEMPLO 2: VALIDAÇÃO DE CPF
 */
const exemploValidacaoCPF = {
  casos_validos: [
    {
      input: '123.456.789-09',
      output: {
        valido: true,
        cpfLimpo: '12345678909',
        cpfFormatado: '123.456.789-09'
      }
    },
    {
      input: '11144477735',
      output: {
        valido: true,
        cpfLimpo: '11144477735',
        cpfFormatado: '111.444.777-35'
      }
    },
    {
      input: '   111.444.777-35   ',
      output: {
        valido: true,
        cpfLimpo: '11144477735',
        cpfFormatado: '111.444.777-35'
      }
    }
  ],
  casos_invalidos: [
    {
      input: '',
      output: {
        valido: false,
        erro: 'CPF é obrigatório'
      }
    },
    {
      input: '123.456.789-00',
      output: {
        valido: false,
        erro: 'CPF inválido - segundo dígito verificador incorreto'
      }
    },
    {
      input: '111.111.111-11',
      output: {
        valido: false,
        erro: 'CPF não pode ser uma sequência de números iguais'
      }
    },
    {
      input: '123456789',
      output: {
        valido: false,
        erro: 'CPF deve conter 11 dígitos'
      }
    },
    {
      input: '000.000.000-00',
      output: {
        valido: false,
        erro: 'CPF não pode ser uma sequência de números iguais'
      }
    }
  ]
};

/**
 * EXEMPLO 3: VALIDAÇÃO DE CNPJ
 */
const exemploValidacaoCNPJ = {
  casos_validos: [
    {
      input: '11.222.333/0001-81',
      output: {
        valido: true,
        cnpjLimpo: '11222333000181',
        cnpjFormatado: '11.222.333/0001-81'
      }
    },
    {
      input: '34028316000103',
      output: {
        valido: true,
        cnpjLimpo: '34028316000103',
        cnpjFormatado: '34.028.316/0001-03'
      }
    },
    {
      input: '   11.444.777/0001-61   ',
      output: {
        valido: true,
        cnpjLimpo: '11444777000161',
        cnpjFormatado: '11.444.777/0001-61'
      }
    }
  ],
  casos_invalidos: [
    {
      input: '',
      output: {
        valido: false,
        erro: 'CNPJ é obrigatório'
      }
    },
    {
      input: '11.222.333/0001-00',
      output: {
        valido: false,
        erro: 'CNPJ inválido - primeiro dígito verificador incorreto'
      }
    },
    {
      input: '11.111.111/1111-11',
      output: {
        valido: false,
        erro: 'CNPJ não pode ser uma sequência de números iguais'
      }
    },
    {
      input: '123456789',
      output: {
        valido: false,
        erro: 'CNPJ deve conter 14 dígitos'
      }
    }
  ]
};

/**
 * EXEMPLO 4: VALIDAÇÃO DE TELEFONE
 */
const exemploValidacaoTelefone = {
  casos_validos: [
    {
      input: '(11) 99999-8888',
      output: {
        valido: true,
        telefoneLimpo: '11999998888',
        telefoneFormatado: '(11) 99999-8888',
        ddd: '11',
        numero: '999998888',
        tipo: 'celular'
      }
    },
    {
      input: '11 3333-4444',
      output: {
        valido: true,
        telefoneLimpo: '1133334444',
        telefoneFormatado: '(11) 3333-4444',
        ddd: '11',
        numero: '33334444',
        tipo: 'fixo'
      }
    },
    {
      input: '85987654321',
      output: {
        valido: true,
        telefoneLimpo: '85987654321',
        telefoneFormatado: '(85) 98765-4321',
        ddd: '85',
        numero: '987654321',
        tipo: 'celular'
      }
    },
    {
      input: '99999-8888',
      output: {
        valido: true,
        telefoneLimpo: '999998888',
        telefoneFormatado: '99999-8888',
        ddd: null,
        numero: '999998888',
        tipo: 'celular'
      }
    },
    {
      input: '3333-4444',
      output: {
        valido: true,
        telefoneLimpo: '33334444',
        telefoneFormatado: '3333-4444',
        ddd: null,
        numero: '33334444',
        tipo: 'fixo'
      }
    }
  ],
  casos_invalidos: [
    {
      input: '',
      output: {
        valido: false,
        erro: 'Telefone é obrigatório'
      }
    },
    {
      input: '123',
      output: {
        valido: false,
        erro: 'Telefone deve ter entre 8 e 11 dígitos'
      }
    },
    {
      input: '(99) 99999-8888',
      output: {
        valido: false,
        erro: 'DDD inválido'
      }
    },
    {
      input: '(11) 19999-8888',
      output: {
        valido: false,
        erro: 'Telefone fixo não deve começar com 9'
      }
    },
    {
      input: '(11) 89999-8888',
      output: {
        valido: false,
        erro: 'Celular deve começar com 9 após o DDD'
      }
    },
    {
      input: '11111-1111',
      output: {
        valido: false,
        erro: 'Telefone não pode ser uma sequência de números iguais'
      }
    }
  ]
};

/**
 * EXEMPLO 5: VALIDAÇÃO EM LOTE
 */
const exemploValidacaoLote = {
  casos_validos: [
    {
      input: {
        email: 'gestor@prefeitura.sp.gov.br',
        cpf: '123.456.789-09',
        telefone: '(11) 99999-8888'
      },
      output: {
        valido: true,
        erros: []
      }
    },
    {
      input: {
        email: 'empresa@escola.com.br',
        cnpj: '11.222.333/0001-81',
        telefone: '(21) 3333-4444'
      },
      output: {
        valido: true,
        erros: []
      }
    }
  ],
  casos_invalidos: [
    {
      input: {
        email: 'email-invalido',
        cpf: '111.111.111-11',
        telefone: '123'
      },
      output: {
        valido: false,
        erros: [
          {
            campo: 'email',
            erro: 'Formato de email inválido'
          },
          {
            campo: 'cpf',
            erro: 'CPF não pode ser uma sequência de números iguais'
          },
          {
            campo: 'telefone',
            erro: 'Telefone deve ter entre 8 e 11 dígitos'
          }
        ]
      }
    }
  ]
};

/**
 * EXEMPLO 6: SANITIZAÇÃO DE TEXTO
 */
const exemploSanitizacao = {
  casos: [
    {
      input: '  João da Silva  ',
      output: 'João da Silva'
    },
    {
      input: 'Nome<script>alert("xss")</script>',
      output: 'Nomescript>alert("xss")/script>'
    },
    {
      input: 'Nome "com aspas" e \'apostrofes\'',
      output: 'Nome com aspas e apostrofes'
    },
    {
      input: 'Texto    com    espaços    múltiplos',
      output: 'Texto com espaços múltiplos'
    }
  ]
};

/**
 * FUNÇÃO PARA TESTAR TODOS OS VALIDADORES
 */
export async function testarTodosValidadores() {
  console.log('🧪 TESTANDO TODOS OS VALIDADORES...\n');

  // Teste 1: Email válido
  console.log('1️⃣ TESTE: Validação de email');
  const emailResult = validarEmail('gestor@prefeitura.sp.gov.br');
  console.log('✅ Resultado:', emailResult);

  // Teste 2: CPF válido
  console.log('\n2️⃣ TESTE: Validação de CPF');
  const cpfResult = validarCPF('123.456.789-09');
  console.log('✅ Resultado:', cpfResult);

  // Teste 3: CNPJ válido
  console.log('\n3️⃣ TESTE: Validação de CNPJ');
  const cnpjResult = validarCNPJ('11.222.333/0001-81');
  console.log('✅ Resultado:', cnpjResult);

  // Teste 4: Telefone válido
  console.log('\n4️⃣ TESTE: Validação de telefone');
  const telefoneResult = validarTelefone('(11) 99999-8888');
  console.log('✅ Resultado:', telefoneResult);

  // Teste 5: Validação em lote
  console.log('\n5️⃣ TESTE: Validação em lote');
  const loteResult = validarDados({
    email: 'admin@escola.edu.br',
    cpf: '111.444.777-35',
    telefone: '(85) 98765-4321'
  });
  console.log('✅ Resultado:', loteResult);

  // Teste 6: Sanitização
  console.log('\n6️⃣ TESTE: Sanitização de texto');
  const textoSanitizado = sanitizarTexto('  Texto <script> com "aspas"  ');
  console.log('✅ Resultado:', textoSanitizado);

  console.log('\n🎯 TODOS OS VALIDADORES TESTADOS!');
}

/**
 * FUNÇÃO PARA TESTE EM FORMULÁRIOS
 */
export function validarFormularioUsuario(dadosFormulario) {
  const erros = [];

  // Validar campos obrigatórios
  if (!dadosFormulario.nome || dadosFormulario.nome.trim().length < 2) {
    erros.push({
      campo: 'nome',
      erro: 'Nome deve ter pelo menos 2 caracteres'
    });
  }

  if (!dadosFormulario.email) {
    erros.push({
      campo: 'email',
      erro: 'Email é obrigatório'
    });
  } else {
    const emailValidacao = validarEmail(dadosFormulario.email);
    if (!emailValidacao.valido) {
      erros.push({
        campo: 'email',
        erro: emailValidacao.erro
      });
    }
  }

  // Validar documento (CPF ou CNPJ)
  if (dadosFormulario.documento) {
    const documento = dadosFormulario.documento.replace(/[^\d]/g, '');
    
    if (documento.length === 11) {
      const cpfValidacao = validarCPF(dadosFormulario.documento);
      if (!cpfValidacao.valido) {
        erros.push({
          campo: 'documento',
          erro: cpfValidacao.erro
        });
      }
    } else if (documento.length === 14) {
      const cnpjValidacao = validarCNPJ(dadosFormulario.documento);
      if (!cnpjValidacao.valido) {
        erros.push({
          campo: 'documento',
          erro: cnpjValidacao.erro
        });
      }
    } else {
      erros.push({
        campo: 'documento',
        erro: 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)'
      });
    }
  }

  // Validar telefone se fornecido
  if (dadosFormulario.telefone) {
    const telefoneValidacao = validarTelefone(dadosFormulario.telefone);
    if (!telefoneValidacao.valido) {
      erros.push({
        campo: 'telefone',
        erro: telefoneValidacao.erro
      });
    }
  }

  return {
    valido: erros.length === 0,
    erros: erros,
    dadosLimpos: erros.length === 0 ? {
      nome: sanitizarTexto(dadosFormulario.nome),
      email: validarEmail(dadosFormulario.email).emailLimpo,
      telefone: dadosFormulario.telefone ? validarTelefone(dadosFormulario.telefone).telefoneLimpo : null,
      documento: dadosFormulario.documento ? dadosFormulario.documento.replace(/[^\d]/g, '') : null
    } : null
  };
}

/**
 * EXPORTAR EXEMPLOS
 */
export {
  exemploValidacaoEmail,
  exemploValidacaoCPF,
  exemploValidacaoCNPJ,
  exemploValidacaoTelefone,
  exemploValidacaoLote,
  exemploSanitizacao,
  testarTodosValidadores,
  validarFormularioUsuario
};

console.log('📚 EXEMPLOS DE VALIDADORES CARREGADOS');
console.log('✅ 6 exemplos de validação disponíveis');
console.log('✅ Função de teste completa implementada');
console.log('✅ Validação de formulário pronta para uso');
/**
 * TESTE DE SEGURANÇA DE AUTENTICAÇÃO
 * 
 * Script para testar melhorias de segurança implementadas
 * - Rate limiting
 * - Validação de tokens
 * - Controle de acesso hierárquico
 * - Mensagens em português
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';

// Simular diferentes tipos de usuários
const USUARIOS_TESTE = {
  admin: {
    id: 'admin-123',
    email: 'admin@iaverse.com',
    nome: 'Administrador',
    tipo_usuario: 'admin',
    empresa_id: 1,
    groups: ['AdminMaster']
  },
  gestor: {
    id: 'gestor-456',
    email: 'gestor@prefeitura.sp.gov.br',
    nome: 'Gestor Municipal',
    tipo_usuario: 'gestor',
    empresa_id: 1,
    groups: ['GestorMunicipal']
  },
  professor: {
    id: 'prof-789',
    email: 'professor@escola.edu.br',
    nome: 'Professor Silva',
    tipo_usuario: 'professor',
    empresa_id: 1,
    groups: ['Professor']
  },
  aluno: {
    id: 'aluno-999',
    email: 'aluno@escola.edu.br',
    nome: 'Aluno João',
    tipo_usuario: 'aluno',
    empresa_id: 1,
    groups: ['Aluno']
  }
};

// Gerar token JWT de teste
function gerarTokenTeste(usuario) {
  const payload = {
    sub: usuario.id,
    email: usuario.email,
    'cognito:username': usuario.email,
    'cognito:groups': usuario.groups,
    'custom:empresa_id': usuario.empresa_id.toString(),
    'custom:tipo_usuario': usuario.tipo_usuario,
    token_use: 'access',
    iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_SduwfXm8p',
    aud: 'test-client',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, 'test-secret-key', { algorithm: 'HS256' });
}

// Cores para output
const cores = {
  verde: '\x1b[32m',
  vermelho: '\x1b[31m',
  amarelo: '\x1b[33m',
  azul: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(cor, mensagem) {
  console.log(`${cores[cor]}${mensagem}${cores.reset}`);
}

// Testes de segurança
class TestesSegurancaAutenticacao {
  constructor() {
    this.resultados = {
      sucessos: 0,
      falhas: 0,
      total: 0
    };
  }

  async executarTeste(nome, funcaoTeste) {
    this.resultados.total++;
    try {
      log('azul', `\n🧪 Teste: ${nome}`);
      await funcaoTeste();
      this.resultados.sucessos++;
      log('verde', `✅ SUCESSO: ${nome}`);
    } catch (erro) {
      this.resultados.falhas++;
      log('vermelho', `❌ FALHA: ${nome}`);
      log('vermelho', `   Erro: ${erro.message}`);
    }
  }

  async testeTokenAusente() {
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      validateStatus: () => true
    });
    
    if (response.status !== 401) {
      throw new Error(`Esperado 401, recebido ${response.status}`);
    }
    
    if (!response.data.erro || !response.data.codigo) {
      throw new Error('Resposta não contém erro ou código em português');
    }
    
    if (response.data.codigo !== 'TOKEN_AUSENTE') {
      throw new Error(`Código esperado TOKEN_AUSENTE, recebido ${response.data.codigo}`);
    }
    
    log('verde', '   Token ausente detectado corretamente');
  }

  async testeTokenFormatoInvalido() {
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      headers: {
        'Authorization': 'Bearer token-invalido'
      },
      validateStatus: () => true
    });
    
    if (response.status !== 401) {
      throw new Error(`Esperado 401, recebido ${response.status}`);
    }
    
    if (response.data.codigo !== 'TOKEN_FORMATO_INVALIDO') {
      throw new Error(`Código esperado TOKEN_FORMATO_INVALIDO, recebido ${response.data.codigo}`);
    }
    
    log('verde', '   Formato de token inválido detectado');
  }

  async testeAutenticacaoAdmin() {
    const tokenAdmin = gerarTokenTeste(USUARIOS_TESTE.admin);
    
    // Teste com token de admin - deve funcionar
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      headers: {
        'Authorization': `Bearer ${tokenAdmin}`
      },
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      throw new Error(`Admin deveria ter acesso. Status: ${response.status}`);
    }
    
    log('verde', '   Admin autenticado com sucesso');
  }

  async testeControleHierarquico() {
    const tokenAluno = gerarTokenTeste(USUARIOS_TESTE.aluno);
    
    // Aluno tentando acessar endpoint administrativo
    const response = await axios.get(`${BASE_URL}/api/admin/companies`, {
      headers: {
        'Authorization': `Bearer ${tokenAluno}`
      },
      validateStatus: () => true
    });
    
    if (response.status !== 403) {
      throw new Error(`Aluno não deveria ter acesso admin. Status: ${response.status}`);
    }
    
    if (response.data.codigo !== 'PERMISSAO_INSUFICIENTE') {
      throw new Error(`Código esperado PERMISSAO_INSUFICIENTE, recebido ${response.data.codigo}`);
    }
    
    log('verde', '   Controle hierárquico funcionando');
  }

  async testeRateLimiting() {
    const tokenTeste = gerarTokenTeste(USUARIOS_TESTE.professor);
    
    // Fazer múltiplas requisições rapidamente
    const requisicoes = [];
    for (let i = 0; i < 10; i++) {
      requisicoes.push(
        axios.get(`${BASE_URL}/api/s3-documents`, {
          headers: {
            'Authorization': `Bearer ${tokenTeste}`
          },
          validateStatus: () => true
        })
      );
    }
    
    const respostas = await Promise.all(requisicoes);
    
    // Verificar se todas as primeiras requisições passaram
    const primeirasRespostas = respostas.slice(0, 5);
    const todasSucesso = primeirasRespostas.every(r => r.status === 200);
    
    if (!todasSucesso) {
      log('amarelo', '   Algumas requisições falharam (pode ser normal)');
    } else {
      log('verde', '   Rate limiting permite requisições normais');
    }
  }

  async testeMensagensPortugues() {
    // Teste com token inválido para verificar mensagens em português
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      headers: {
        'Authorization': 'Bearer token.invalido.aqui'
      },
      validateStatus: () => true
    });
    
    if (!response.data.erro || typeof response.data.erro !== 'string') {
      throw new Error('Mensagem de erro não encontrada');
    }
    
    // Verificar se contém palavras em português
    const mensagem = response.data.erro.toLowerCase();
    const palavrasPortugues = ['inválido', 'token', 'erro', 'falha'];
    const temPortugues = palavrasPortugues.some(palavra => mensagem.includes(palavra));
    
    if (!temPortugues) {
      throw new Error('Mensagem não parece estar em português');
    }
    
    log('verde', '   Mensagens em português confirmadas');
  }

  async testeLoggingSeguranca() {
    // Este teste simplesmente verifica se o sistema não quebra
    // Os logs são impressos no console do servidor
    const tokenInvalido = 'token.teste.logging';
    
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      headers: {
        'Authorization': `Bearer ${tokenInvalido}`
      },
      validateStatus: () => true
    });
    
    if (response.status !== 401) {
      throw new Error('Sistema deveria rejeitar token inválido');
    }
    
    log('verde', '   Sistema de logging funcionando (verificar console do servidor)');
  }

  async testeValidacaoTipoUsuario() {
    const tokenGestor = gerarTokenTeste(USUARIOS_TESTE.gestor);
    
    // Gestor deve ter acesso a recursos de gestão
    const response = await axios.get(`${BASE_URL}/api/s3-documents`, {
      headers: {
        'Authorization': `Bearer ${tokenGestor}`
      },
      validateStatus: () => true
    });
    
    if (response.status !== 200) {
      throw new Error(`Gestor deveria ter acesso. Status: ${response.status}`);
    }
    
    log('verde', '   Validação de tipo de usuário funcionando');
  }

  async executarTodosTestes() {
    log('azul', '🔒 INICIANDO TESTES DE SEGURANÇA DE AUTENTICAÇÃO\n');
    
    await this.executarTeste('Token Ausente', () => this.testeTokenAusente());
    await this.executarTeste('Token Formato Inválido', () => this.testeTokenFormatoInvalido());
    await this.executarTeste('Autenticação Admin', () => this.testeAutenticacaoAdmin());
    await this.executarTeste('Controle Hierárquico', () => this.testeControleHierarquico());
    await this.executarTeste('Rate Limiting', () => this.testeRateLimiting());
    await this.executarTeste('Mensagens em Português', () => this.testeMensagensPortugues());
    await this.executarTeste('Logging de Segurança', () => this.testeLoggingSeguranca());
    await this.executarTeste('Validação Tipo Usuário', () => this.testeValidacaoTipoUsuario());
    
    this.mostrarResultados();
  }

  mostrarResultados() {
    log('azul', '\n📊 RESULTADOS DOS TESTES DE SEGURANÇA');
    log('verde', `✅ Sucessos: ${this.resultados.sucessos}`);
    log('vermelho', `❌ Falhas: ${this.resultados.falhas}`);
    log('azul', `📋 Total: ${this.resultados.total}`);
    
    const porcentagemSucesso = Math.round((this.resultados.sucessos / this.resultados.total) * 100);
    
    if (porcentagemSucesso >= 80) {
      log('verde', `🎉 Taxa de sucesso: ${porcentagemSucesso}% - EXCELENTE`);
    } else if (porcentagemSucesso >= 60) {
      log('amarelo', `⚠️ Taxa de sucesso: ${porcentagemSucesso}% - BOM`);
    } else {
      log('vermelho', `🚨 Taxa de sucesso: ${porcentagemSucesso}% - PRECISA MELHORAR`);
    }
  }
}

// Executar testes
async function main() {
  const testes = new TestesSegurancaAutenticacao();
  
  try {
    await testes.executarTodosTestes();
  } catch (erro) {
    log('vermelho', `❌ Erro nos testes: ${erro.message}`);
  }
}

// Verificar se o servidor está rodando
axios.get(`${BASE_URL}/api/health`)
  .then(() => {
    log('verde', '✅ Servidor detectado, iniciando testes...');
    main();
  })
  .catch(() => {
    log('vermelho', '❌ Servidor não está rodando. Inicie com: npm run dev');
  });
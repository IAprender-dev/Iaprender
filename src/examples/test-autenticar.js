import { autenticar } from '../middleware/auth.js';

// Função para simular uma requisição
function criarRequisicao(token) {
  return {
    headers: {
      'authorization': token ? `Bearer ${token}` : undefined
    }
  };
}

// Função para simular uma resposta
function criarResposta() {
  return {
    status: (code) => ({
      json: (data) => {
        console.log(`📤 Status: ${code}`);
        console.log(`📤 Response:`, JSON.stringify(data, null, 2));
        return { status: code, data };
      }
    })
  };
}

// Função para simular next()
function criarNext() {
  return () => {
    console.log('✅ next() chamado - Middleware passou!');
  };
}

// Teste 1: Requisição sem token
export async function testeRequisicaoSemToken() {
  console.log('🧪 Teste 1: Requisição sem token');
  console.log('='.repeat(40));
  
  const req = criarRequisicao();
  const res = criarResposta();
  const next = criarNext();
  
  await autenticar(req, res, next);
  console.log('');
}

// Teste 2: Requisição com token inválido
export async function testeRequisicaoTokenInvalido() {
  console.log('🧪 Teste 2: Requisição com token inválido');
  console.log('='.repeat(40));
  
  const req = criarRequisicao('token.invalido.aqui');
  const res = criarResposta();
  const next = criarNext();
  
  await autenticar(req, res, next);
  console.log('');
}

// Teste 3: Requisição com header mal formatado
export async function testeRequisicaoHeaderMalFormatado() {
  console.log('🧪 Teste 3: Requisição com header mal formatado');
  console.log('='.repeat(40));
  
  const req = {
    headers: {
      'authorization': 'token.sem.bearer'
    }
  };
  const res = criarResposta();
  const next = criarNext();
  
  await autenticar(req, res, next);
  console.log('');
}

// Teste 4: Requisição com token válido (simulado)
export async function testeRequisicaoTokenValido() {
  console.log('🧪 Teste 4: Requisição com token válido (simulado)');
  console.log('='.repeat(40));
  
  // Token JWT válido simulado (apenas para estrutura)
  const tokenSimulado = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsIm5hbWUiOiJVc3VhcmlvIFRlc3RlIiwiY29nbml0bzpncm91cHMiOlsiR2VzdG9yZXMiXSwiY3VzdG9tOmVtcHJlc2FfaWQiOiIxIiwiYXVkIjoiY2xpZW50LWlkIiwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfZXhhbXBsZSIsImV4cCI6MTY4MDAwMDAwMCwiaWF0IjoxNjc5OTk2NDAwfQ.exemplo-signature';
  
  const req = criarRequisicao(tokenSimulado);
  const res = criarResposta();
  const next = criarNext();
  
  await autenticar(req, res, next);
  console.log('');
}

// Teste 5: Verificar estrutura do req.user
export async function testeEstruturalReqUser() {
  console.log('🧪 Teste 5: Verificar estrutura do req.user');
  console.log('='.repeat(40));
  
  const req = {
    headers: {
      'authorization': 'Bearer token.exemplo'
    }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log(`📤 Status: ${code}`);
        if (code === 401) {
          console.log('❌ Esperado: Token inválido');
        }
        return { status: code, data };
      }
    })
  };
  
  const next = () => {
    console.log('✅ next() chamado');
    console.log('📋 Estrutura req.user esperada:');
    console.log('   - id: number');
    console.log('   - sub: string');
    console.log('   - nome: string');
    console.log('   - email: string');
    console.log('   - tipo_usuario: string');
    console.log('   - empresa_id: number');
    console.log('   - groups: string[]');
    console.log('   - exp: number');
    console.log('   - iat: number');
  };
  
  await autenticar(req, res, next);
  console.log('');
}

// Teste 6: Verificar diferentes formatos de Authorization
export async function testeDiferentesFormatosAuthorization() {
  console.log('🧪 Teste 6: Diferentes formatos de Authorization');
  console.log('='.repeat(40));
  
  const formatos = [
    { nome: 'Bearer token', header: 'Bearer token123' },
    { nome: 'bearer token', header: 'bearer token123' },
    { nome: 'Token sem Bearer', header: 'token123' },
    { nome: 'Basic auth', header: 'Basic dXNlcjpwYXNz' },
    { nome: 'Header vazio', header: '' },
    { nome: 'Sem espaço', header: 'Bearertoken123' }
  ];
  
  for (const formato of formatos) {
    console.log(`\n📋 Testando: ${formato.nome}`);
    
    const req = {
      headers: {
        'authorization': formato.header
      }
    };
    
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log(`   Status: ${code} - ${data.message}`);
        }
      })
    };
    
    const next = () => {
      console.log('   ✅ next() chamado');
    };
    
    await autenticar(req, res, next);
  }
  
  console.log('');
}

// Função para executar todos os testes
export async function executarTodosOsTestes() {
  console.log('🧪 Executando todos os testes do middleware autenticar...\n');
  
  const testes = [
    testeRequisicaoSemToken,
    testeRequisicaoTokenInvalido,
    testeRequisicaoHeaderMalFormatado,
    testeRequisicaoTokenValido,
    testeEstruturalReqUser,
    testeDiferentesFormatosAuthorization
  ];
  
  for (const teste of testes) {
    try {
      await teste();
    } catch (error) {
      console.error(`❌ Erro no teste: ${error.message}\n`);
    }
  }
  
  console.log('✅ Todos os testes executados!');
}

// Executar testes automaticamente se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  executarTodosOsTestes();
}
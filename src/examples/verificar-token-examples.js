import { verificarToken, decodeTokenUnsafe } from '../middleware/auth.js';

// Exemplo 1: Verificar token válido
export async function exemploVerificarTokenValido() {
  const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token de exemplo
  
  try {
    console.log('🧪 Testando token válido...');
    const payload = await verificarToken(token);
    
    console.log('✅ Token válido! Payload extraído:');
    console.log('📋 Sub:', payload.sub);
    console.log('📋 Email:', payload.email);
    console.log('📋 Grupos:', payload.groups);
    console.log('📋 Empresa ID:', payload.empresa_id);
    console.log('📋 Nome:', payload.nome);
    console.log('📋 Expira em:', new Date(payload.exp * 1000).toLocaleString());
    
    return payload;
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    throw error;
  }
}

// Exemplo 2: Verificar token inválido
export async function exemploVerificarTokenInvalido() {
  const tokenInvalido = "token.invalido.aqui";
  
  try {
    console.log('🧪 Testando token inválido...');
    const payload = await verificarToken(tokenInvalido);
    console.log('❌ Este não deveria ter passado!');
    return payload;
  } catch (error) {
    console.log('✅ Token inválido detectado corretamente:');
    console.log('📋 Erro:', error.error);
    console.log('📋 Mensagem:', error.message);
    return error;
  }
}

// Exemplo 3: Verificar token expirado
export async function exemploVerificarTokenExpirado() {
  const tokenExpirado = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token expirado
  
  try {
    console.log('🧪 Testando token expirado...');
    const payload = await verificarToken(tokenExpirado);
    console.log('❌ Token expirado não deveria ter passado!');
    return payload;
  } catch (error) {
    console.log('✅ Token expirado detectado corretamente:');
    console.log('📋 Erro:', error.error);
    console.log('📋 Mensagem:', error.message);
    return error;
  }
}

// Exemplo 4: Verificar token sem kid
export async function exemploVerificarTokenSemKid() {
  const tokenSemKid = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."; // Token sem kid no header
  
  try {
    console.log('🧪 Testando token sem kid...');
    const payload = await verificarToken(tokenSemKid);
    console.log('❌ Token sem kid não deveria ter passado!');
    return payload;
  } catch (error) {
    console.log('✅ Token sem kid detectado corretamente:');
    console.log('📋 Erro:', error.error);
    console.log('📋 Mensagem:', error.message);
    return error;
  }
}

// Exemplo 5: Decodificar token sem verificação (debug)
export function exemploDecodificarTokenDebug() {
  const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token de exemplo
  
  console.log('🧪 Decodificando token sem verificação (debug)...');
  const decoded = decodeTokenUnsafe(token);
  
  if (decoded) {
    console.log('✅ Token decodificado com sucesso:');
    console.log('📋 Header:', decoded.header);
    console.log('📋 Payload:', decoded.payload);
    console.log('📋 Signature:', decoded.signature);
  } else {
    console.log('❌ Não foi possível decodificar o token');
  }
  
  return decoded;
}

// Exemplo 6: Verificar diferentes tipos de payload
export async function exemploVerificarDiferentesTiposPayload() {
  const tokens = {
    admin: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ...", // Token admin
    gestor: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ...", // Token gestor
    diretor: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ...", // Token diretor
    professor: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ...", // Token professor
    aluno: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..." // Token aluno
  };
  
  console.log('🧪 Testando diferentes tipos de payload...');
  
  for (const [tipo, token] of Object.entries(tokens)) {
    try {
      console.log(`\n📋 Verificando token de ${tipo}:`);
      const payload = await verificarToken(token);
      
      console.log(`✅ Token de ${tipo} válido:`);
      console.log('   Sub:', payload.sub);
      console.log('   Email:', payload.email);
      console.log('   Grupos:', payload.groups);
      console.log('   Empresa ID:', payload.empresa_id);
      console.log('   Nome:', payload.nome);
    } catch (error) {
      console.log(`❌ Erro no token de ${tipo}:`, error.message);
    }
  }
}

// Exemplo 7: Verificar performance da verificação
export async function exemploVerificarPerformance() {
  const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token de exemplo
  
  console.log('🧪 Testando performance da verificação...');
  
  const temposVerificacao = [];
  const numeroTestes = 10;
  
  for (let i = 0; i < numeroTestes; i++) {
    const inicio = Date.now();
    
    try {
      await verificarToken(token);
      const fim = Date.now();
      const tempo = fim - inicio;
      temposVerificacao.push(tempo);
      console.log(`✅ Verificação ${i + 1}: ${tempo}ms`);
    } catch (error) {
      console.log(`❌ Verificação ${i + 1}: Erro - ${error.message}`);
    }
  }
  
  const tempoMedio = temposVerificacao.reduce((a, b) => a + b, 0) / temposVerificacao.length;
  const tempoMinimo = Math.min(...temposVerificacao);
  const tempoMaximo = Math.max(...temposVerificacao);
  
  console.log('\n📊 Estatísticas de Performance:');
  console.log(`   Tempo médio: ${tempoMedio.toFixed(2)}ms`);
  console.log(`   Tempo mínimo: ${tempoMinimo}ms`);
  console.log(`   Tempo máximo: ${tempoMaximo}ms`);
  console.log(`   Total de verificações: ${numeroTestes}`);
  
  return {
    tempoMedio,
    tempoMinimo,
    tempoMaximo,
    numeroTestes
  };
}

// Exemplo 8: Verificar token com custom:empresa_id
export async function exemploVerificarTokenComEmpresaId() {
  const tokenComEmpresa = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token com custom:empresa_id
  
  try {
    console.log('🧪 Testando token com custom:empresa_id...');
    const payload = await verificarToken(tokenComEmpresa);
    
    console.log('✅ Token com empresa_id válido:');
    console.log('📋 Sub:', payload.sub);
    console.log('📋 Email:', payload.email);
    console.log('📋 Grupos:', payload.groups);
    console.log('📋 Empresa ID:', payload.empresa_id);
    console.log('📋 Nome:', payload.nome);
    
    // Verificar se empresa_id está presente
    if (payload.empresa_id) {
      console.log('✅ Empresa ID encontrada no token:', payload.empresa_id);
    } else {
      console.log('⚠️ Empresa ID não encontrada no token');
    }
    
    return payload;
  } catch (error) {
    console.error('❌ Erro ao verificar token com empresa_id:', error.message);
    throw error;
  }
}

// Exemplo 9: Verificar múltiplos grupos do Cognito
export async function exemploVerificarMultiplosGrupos() {
  const tokenMultiplosGrupos = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkV4ZW1wbG9LaWQifQ..."; // Token com múltiplos grupos
  
  try {
    console.log('🧪 Testando token com múltiplos grupos...');
    const payload = await verificarToken(tokenMultiplosGrupos);
    
    console.log('✅ Token com múltiplos grupos válido:');
    console.log('📋 Sub:', payload.sub);
    console.log('📋 Email:', payload.email);
    console.log('📋 Grupos:', payload.groups);
    
    // Verificar grupos específicos
    const gruposEsperados = ['Gestores', 'Diretores', 'Professores'];
    const gruposEncontrados = payload.groups.filter(grupo => gruposEsperados.includes(grupo));
    
    console.log('📋 Grupos encontrados:', gruposEncontrados);
    console.log('📋 Grupos esperados:', gruposEsperados);
    
    return payload;
  } catch (error) {
    console.error('❌ Erro ao verificar token com múltiplos grupos:', error.message);
    throw error;
  }
}

// Exemplo 10: Executar todos os testes
export async function executarTodosOsTestes() {
  console.log('🧪 Executando todos os testes da função verificarToken...\n');
  
  const testes = [
    { nome: 'Token Válido', funcao: exemploVerificarTokenValido },
    { nome: 'Token Inválido', funcao: exemploVerificarTokenInvalido },
    { nome: 'Token Expirado', funcao: exemploVerificarTokenExpirado },
    { nome: 'Token sem Kid', funcao: exemploVerificarTokenSemKid },
    { nome: 'Decodificar Debug', funcao: exemploDecodificarTokenDebug },
    { nome: 'Diferentes Tipos', funcao: exemploVerificarDiferentesTiposPayload },
    { nome: 'Performance', funcao: exemploVerificarPerformance },
    { nome: 'Token com Empresa ID', funcao: exemploVerificarTokenComEmpresaId },
    { nome: 'Múltiplos Grupos', funcao: exemploVerificarMultiplosGrupos }
  ];
  
  const resultados = [];
  
  for (const teste of testes) {
    console.log(`\n🔍 Executando teste: ${teste.nome}`);
    console.log('='.repeat(50));
    
    try {
      const resultado = await teste.funcao();
      resultados.push({ nome: teste.nome, status: 'sucesso', resultado });
      console.log(`✅ Teste ${teste.nome} concluído com sucesso\n`);
    } catch (error) {
      resultados.push({ nome: teste.nome, status: 'erro', erro: error.message });
      console.log(`❌ Teste ${teste.nome} falhou: ${error.message}\n`);
    }
  }
  
  console.log('\n📊 Resumo dos Testes:');
  console.log('='.repeat(50));
  resultados.forEach(resultado => {
    const status = resultado.status === 'sucesso' ? '✅' : '❌';
    console.log(`${status} ${resultado.nome}: ${resultado.status}`);
  });
  
  return resultados;
}
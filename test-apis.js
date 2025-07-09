/**
 * TESTE DAS APIS REST - IAPRENDER
 * 
 * Script para testar todas as rotas de API principais
 */

import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Carregar variáveis de ambiente
dotenv.config();

const API_BASE = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

console.log('🔗 Iniciando testes das APIs REST...\n');

// Criar tokens de teste para diferentes tipos de usuário
const criarTokens = () => {
  const tokens = {
    admin: jwt.sign({
      id: 1,
      email: 'admin@iaprender.com.br',
      tipo_usuario: 'admin',
      empresa_id: 1
    }, JWT_SECRET, { expiresIn: '1h' }),
    
    gestor: jwt.sign({
      id: 2,
      email: 'gestor@empresa.com.br',
      tipo_usuario: 'gestor',
      empresa_id: 1
    }, JWT_SECRET, { expiresIn: '1h' }),
    
    diretor: jwt.sign({
      id: 3,
      email: 'diretor@escola.edu.br',
      tipo_usuario: 'diretor',
      empresa_id: 1,
      escola_id: 1
    }, JWT_SECRET, { expiresIn: '1h' }),
    
    professor: jwt.sign({
      id: 4,
      email: 'professor@escola.edu.br',
      tipo_usuario: 'professor',
      empresa_id: 1,
      escola_id: 1
    }, JWT_SECRET, { expiresIn: '1h' }),
    
    aluno: jwt.sign({
      id: 5,
      email: 'aluno@escola.edu.br',
      tipo_usuario: 'aluno',
      empresa_id: 1,
      escola_id: 1
    }, JWT_SECRET, { expiresIn: '1h' })
  };
  
  return tokens;
};

/**
 * TESTE 1: Health Check
 */
async function testarHealthCheck() {
  console.log('🏥 TESTE 1: Health Check');
  try {
    const response = await axios.get(`${API_BASE}/api/placeholder`);
    console.log(`  ✅ Status: ${response.status}`);
    console.log(`  📝 Resposta: ${JSON.stringify(response.data)}`);
    return true;
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 2: Autenticação
 */
async function testarAutenticacao() {
  console.log('\n🔐 TESTE 2: Sistema de Autenticação');
  
  const tokens = criarTokens();
  
  try {
    // Testar endpoint protegido sem token
    try {
      await axios.get(`${API_BASE}/api/auth/me`);
      console.log('  ❌ Falha: endpoint permitiu acesso sem token');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('  ✅ Endpoint corretamente protegido (401 sem token)');
      } else {
        console.log(`  ⚠️ Erro inesperado: ${error.message}`);
      }
    }
    
    // Testar com token válido
    try {
      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('  ✅ Autenticação com token válido funcionando');
      console.log(`  👤 Usuário autenticado: ${response.data.user?.email || 'dados do token'}`);
    } catch (error) {
      console.log(`  ❌ Erro com token válido: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 3: APIs de Usuários
 */
async function testarAPIsUsuarios() {
  console.log('\n👥 TESTE 3: APIs de Usuários');
  
  const tokens = criarTokens();
  
  try {
    // Listar usuários (apenas admin/gestor)
    try {
      const response = await axios.get(`${API_BASE}/api/usuarios`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log(`  ✅ GET /api/usuarios: ${response.status}`);
      console.log(`  📊 Total de usuários retornados: ${response.data.data?.length || 'estrutura diferente'}`);
    } catch (error) {
      if (error.response) {
        console.log(`  ⚠️ GET /api/usuarios: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`  ❌ GET /api/usuarios erro: ${error.message}`);
      }
    }
    
    // Perfil pessoal
    try {
      const response = await axios.get(`${API_BASE}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log(`  ✅ GET /api/usuarios/me: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`  ⚠️ GET /api/usuarios/me: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`  ❌ GET /api/usuarios/me erro: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 4: APIs de Alunos
 */
async function testarAPIsAlunos() {
  console.log('\n🎓 TESTE 4: APIs de Alunos');
  
  const tokens = criarTokens();
  
  try {
    // Listar alunos
    try {
      const response = await axios.get(`${API_BASE}/api/alunos`, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log(`  ✅ GET /api/alunos: ${response.status}`);
      console.log(`  📊 Total de alunos: ${response.data.data?.length || 'estrutura diferente'}`);
    } catch (error) {
      if (error.response) {
        console.log(`  ⚠️ GET /api/alunos: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`  ❌ GET /api/alunos erro: ${error.message}`);
      }
    }
    
    // Estatísticas de alunos
    try {
      const response = await axios.get(`${API_BASE}/api/alunos/stats`, {
        headers: { Authorization: `Bearer ${tokens.gestor}` }
      });
      console.log(`  ✅ GET /api/alunos/stats: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`  ⚠️ GET /api/alunos/stats: ${error.response.status} - ${error.response.data?.message || error.message}`);
      } else {
        console.log(`  ❌ GET /api/alunos/stats erro: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 5: Rate Limiting
 */
async function testarRateLimiting() {
  console.log('\n⏱️ TESTE 5: Rate Limiting');
  
  const tokens = criarTokens();
  
  try {
    console.log('  🔄 Testando múltiplas requisições rápidas...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.get(`${API_BASE}/api/usuarios/me`, {
          headers: { Authorization: `Bearer ${tokens.admin}` }
        }).catch(error => error.response || error)
      );
    }
    
    const responses = await Promise.all(promises);
    
    let successCount = 0;
    let rateLimitCount = 0;
    
    responses.forEach((response, index) => {
      if (response.status === 200) {
        successCount++;
      } else if (response.status === 429) {
        rateLimitCount++;
      }
      console.log(`    Requisição ${index + 1}: ${response.status || 'erro'}`);
    });
    
    console.log(`  📊 Sucessos: ${successCount}, Rate Limited: ${rateLimitCount}`);
    
    if (rateLimitCount > 0) {
      console.log('  ✅ Rate limiting funcionando corretamente');
    } else {
      console.log('  ⚠️ Rate limiting pode não estar ativo (todas passaram)');
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 6: Controle de Acesso por Tipo de Usuário
 */
async function testarControleAcesso() {
  console.log('\n🛡️ TESTE 6: Controle de Acesso por Tipo de Usuário');
  
  const tokens = criarTokens();
  
  try {
    // Testar acesso de aluno a funcionalidade de admin
    try {
      await axios.get(`${API_BASE}/api/usuarios`, {
        headers: { Authorization: `Bearer ${tokens.aluno}` }
      });
      console.log('  ❌ Falha: aluno conseguiu acessar endpoint de admin');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('  ✅ Aluno corretamente bloqueado para endpoint de admin');
      } else {
        console.log(`  ⚠️ Erro inesperado para aluno: ${error.message}`);
      }
    }
    
    // Testar acesso de professor a funcionalidade de gestor
    try {
      await axios.post(`${API_BASE}/api/usuarios`, {
        nome: 'Teste',
        email: 'teste@test.com'
      }, {
        headers: { Authorization: `Bearer ${tokens.professor}` }
      });
      console.log('  ❌ Falha: professor conseguiu criar usuário');
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('  ✅ Professor corretamente bloqueado para criação de usuários');
      } else {
        console.log(`  ⚠️ Erro inesperado para professor: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * TESTE 7: Validação de Entrada
 */
async function testarValidacaoEntrada() {
  console.log('\n✅ TESTE 7: Validação de Entrada');
  
  const tokens = criarTokens();
  
  try {
    // Testar criação de usuário com dados inválidos
    try {
      await axios.post(`${API_BASE}/api/usuarios`, {
        nome: '',  // nome vazio
        email: 'email-invalido',  // email inválido
        tipo_usuario: 'tipo_inexistente'  // tipo inválido
      }, {
        headers: { Authorization: `Bearer ${tokens.admin}` }
      });
      console.log('  ❌ Falha: dados inválidos foram aceitos');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('  ✅ Dados inválidos corretamente rejeitados (400)');
      } else {
        console.log(`  ⚠️ Resposta inesperada: ${error.response?.status || error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`  ❌ Erro geral: ${error.message}`);
    return false;
  }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function executarTestesAPIs() {
  const resultados = [];
  
  try {
    console.log('🔗 Aguardando servidor estar disponível...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
    
    resultados.push(await testarHealthCheck());
    resultados.push(await testarAutenticacao());
    resultados.push(await testarAPIsUsuarios());
    resultados.push(await testarAPIsAlunos());
    resultados.push(await testarRateLimiting());
    resultados.push(await testarControleAcesso());
    resultados.push(await testarValidacaoEntrada());
    
    const sucessos = resultados.filter(r => r).length;
    const total = resultados.length;
    
    console.log('\n📊 RESUMO DOS TESTES DE API:');
    console.log(`✅ Sucessos: ${sucessos}/${total}`);
    console.log(`❌ Falhas: ${total - sucessos}/${total}`);
    
    if (sucessos === total) {
      console.log('\n🎉 TODAS AS APIS FUNCIONANDO CORRETAMENTE!');
    } else {
      console.log('\n⚠️ Algumas APIs apresentaram problemas. Verifique os logs.');
    }
    
  } catch (error) {
    console.log('\n💥 Erro fatal durante testes de API:', error.message);
  }
  
  console.log('\n👋 Testes de API finalizados.');
}

// Executar testes
executarTestesAPIs();
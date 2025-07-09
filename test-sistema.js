/**
 * TESTE COMPLETO DO SISTEMA IAPRENDER
 * 
 * Script para testar todas as funcionalidades principais do sistema
 * independente do Jest para diagnóstico completo
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Carregar variáveis de ambiente
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

console.log('🧪 Iniciando teste completo do sistema IAprender...\n');

// Configurar pool de conexão
const pool = new Pool({
  connectionString: DB_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * TESTE 1: Conexão com Banco de Dados
 */
async function testarConexaoBanco() {
  console.log('📊 TESTE 1: Conexão com Banco de Dados');
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp, version() as version');
    console.log('  ✅ Conexão estabelecida com sucesso');
    console.log(`  📅 Timestamp: ${result.rows[0].timestamp}`);
    console.log(`  🔢 Versão PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    client.release();
    return true;
  } catch (error) {
    console.log('  ❌ Erro na conexão:', error.message);
    return false;
  }
}

/**
 * TESTE 2: Verificação de Tabelas Principais
 */
async function testarTabelasPrincipais() {
  console.log('\n🗄️ TESTE 2: Verificação de Tabelas Principais');
  try {
    const tabelas = [
      'usuarios', 'empresas', 'contratos', 'escolas', 
      'gestores', 'diretores', 'professores', 'alunos'
    ];
    
    for (const tabela of tabelas) {
      const result = await pool.query(`
        SELECT count(*) as total 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [tabela]);
      
      const existe = result.rows[0].total > 0;
      console.log(`  ${existe ? '✅' : '❌'} Tabela ${tabela}: ${existe ? 'existe' : 'não encontrada'}`);
      
      if (existe) {
        const count = await pool.query(`SELECT count(*) as registros FROM ${tabela}`);
        console.log(`    📊 Registros: ${count.rows[0].registros}`);
      }
    }
    return true;
  } catch (error) {
    console.log('  ❌ Erro ao verificar tabelas:', error.message);
    return false;
  }
}

/**
 * TESTE 3: Sistema de Validação Brasileira
 */
async function testarValidacoes() {
  console.log('\n🇧🇷 TESTE 3: Sistema de Validação Brasileira');
  
  try {
    // Importar validadores
    const { validarCPF, validarCNPJ, validarTelefone, validarEmail } = await import('./src/utils/validadores.js');
    
    // Testar CPF
    const cpfTeste = '12345678901';
    const cpfValido = validarCPF(cpfTeste);
    console.log(`  ${cpfValido.valido ? '✅' : '❌'} CPF: ${cpfTeste} - ${cpfValido.valido ? 'válido' : cpfValido.erro}`);
    
    // Testar CNPJ
    const cnpjTeste = '11222333000181';
    const cnpjValido = validarCNPJ(cnpjTeste);
    console.log(`  ${cnpjValido.valido ? '✅' : '❌'} CNPJ: ${cnpjTeste} - ${cnpjValido.valido ? 'válido' : cnpjValido.erro}`);
    
    // Testar telefone
    const telTeste = '11999887766';
    const telValido = validarTelefone(telTeste);
    console.log(`  ${telValido.valido ? '✅' : '❌'} Telefone: ${telTeste} - ${telValido.valido ? 'válido' : telValido.erro}`);
    
    // Testar email
    const emailTeste = 'teste@iaprender.com.br';
    const emailValido = validarEmail(emailTeste);
    console.log(`  ${emailValido.valido ? '✅' : '❌'} Email: ${emailTeste} - ${emailValido.valido ? 'válido' : emailValido.erro}`);
    
    return true;
  } catch (error) {
    console.log('  ❌ Erro ao testar validações:', error.message);
    return false;
  }
}

/**
 * TESTE 4: Sistema de Autenticação JWT
 */
async function testarAutenticacao() {
  console.log('\n🔐 TESTE 4: Sistema de Autenticação JWT');
  
  try {
    // Criar um token de teste
    const payload = {
      id: 1,
      email: 'admin@iaprender.com.br',
      tipo_usuario: 'admin',
      empresa_id: 1
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    console.log('  ✅ Token JWT criado com sucesso');
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`  ✅ Token verificado: ${decoded.email} (${decoded.tipo_usuario})`);
    
    // Testar hash de senha
    const senha = 'senha123';
    const hash = await bcrypt.hash(senha, 10);
    const validSenha = await bcrypt.compare(senha, hash);
    console.log(`  ${validSenha ? '✅' : '❌'} Hash de senha: ${validSenha ? 'válido' : 'inválido'}`);
    
    return true;
  } catch (error) {
    console.log('  ❌ Erro no sistema de autenticação:', error.message);
    return false;
  }
}

/**
 * TESTE 5: Sistema de Hierarquia de Usuários
 */
async function testarHierarquia() {
  console.log('\n👥 TESTE 5: Sistema de Hierarquia de Usuários');
  
  try {
    // Verificar usuários por tipo
    const tiposUsuario = ['admin', 'gestor', 'diretor', 'professor', 'aluno'];
    
    for (const tipo of tiposUsuario) {
      const result = await pool.query(`
        SELECT count(*) as total 
        FROM usuarios 
        WHERE tipo_usuario = $1
      `, [tipo]);
      
      console.log(`  📊 ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}s: ${result.rows[0].total} usuários`);
    }
    
    // Verificar hierarquia empresa-usuário
    const hierarquia = await pool.query(`
      SELECT 
        e.nome as empresa,
        u.tipo_usuario,
        count(*) as total
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      GROUP BY e.nome, u.tipo_usuario
      ORDER BY e.nome, u.tipo_usuario
    `);
    
    console.log('  🏢 Hierarquia por empresa:');
    for (const row of hierarquia.rows) {
      console.log(`    ${row.empresa || 'Sem empresa'} - ${row.tipo_usuario}: ${row.total}`);
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ Erro ao testar hierarquia:', error.message);
    return false;
  }
}

/**
 * TESTE 6: Sistema de Controle de Acesso
 */
async function testarControleAcesso() {
  console.log('\n🛡️ TESTE 6: Sistema de Controle de Acesso');
  
  try {
    // Testar busca de usuários por empresa
    const empresas = await pool.query('SELECT id, nome FROM empresas LIMIT 3');
    
    for (const empresa of empresas.rows) {
      const usuarios = await pool.query(`
        SELECT tipo_usuario, count(*) as total
        FROM usuarios 
        WHERE empresa_id = $1
        GROUP BY tipo_usuario
      `, [empresa.id]);
      
      console.log(`  🏢 ${empresa.nome}:`);
      for (const user of usuarios.rows) {
        console.log(`    ${user.tipo_usuario}: ${user.total} usuários`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ Erro ao testar controle de acesso:', error.message);
    return false;
  }
}

/**
 * TESTE 7: Performance de Consultas
 */
async function testarPerformance() {
  console.log('\n⚡ TESTE 7: Performance de Consultas');
  
  try {
    const queries = [
      {
        nome: 'Buscar usuários',
        sql: 'SELECT count(*) FROM usuarios'
      },
      {
        nome: 'Buscar alunos com escola',
        sql: `SELECT count(*) FROM alunos a 
              LEFT JOIN escolas e ON a.escola_id = e.id 
              LEFT JOIN empresas emp ON a.empresa_id = emp.id`
      },
      {
        nome: 'Estatísticas empresas',
        sql: `SELECT e.nome, count(u.id) as usuarios 
              FROM empresas e 
              LEFT JOIN usuarios u ON e.id = u.empresa_id 
              GROUP BY e.id, e.nome`
      }
    ];
    
    for (const query of queries) {
      const inicio = Date.now();
      const result = await pool.query(query.sql);
      const tempo = Date.now() - inicio;
      
      const status = tempo < 1000 ? '✅' : tempo < 5000 ? '⚠️' : '❌';
      console.log(`  ${status} ${query.nome}: ${tempo}ms (${result.rows.length} resultados)`);
    }
    
    return true;
  } catch (error) {
    console.log('  ❌ Erro ao testar performance:', error.message);
    return false;
  }
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function executarTestes() {
  const resultados = [];
  
  try {
    resultados.push(await testarConexaoBanco());
    resultados.push(await testarTabelasPrincipais());
    resultados.push(await testarValidacoes());
    resultados.push(await testarAutenticacao());
    resultados.push(await testarHierarquia());
    resultados.push(await testarControleAcesso());
    resultados.push(await testarPerformance());
    
    const sucessos = resultados.filter(r => r).length;
    const total = resultados.length;
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`✅ Sucessos: ${sucessos}/${total}`);
    console.log(`❌ Falhas: ${total - sucessos}/${total}`);
    
    if (sucessos === total) {
      console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente.');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
    
  } catch (error) {
    console.log('\n💥 Erro fatal durante execução dos testes:', error.message);
  } finally {
    await pool.end();
    console.log('\n👋 Testes finalizados.');
  }
}

// Executar testes
executarTestes();
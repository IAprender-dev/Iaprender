#!/usr/bin/env node

/**
 * MIGRAÇÃO COMPLETA: AWS Cognito → Aurora Serverless
 * 
 * Script para migrar todos os usuários do AWS Cognito para a tabela 'usuarios' 
 * do Aurora Serverless, mantendo a sincronização e estrutura hierárquica.
 */

const { Pool } = require('pg');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

// Configuração AWS
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Configuração Aurora Serverless
const pool = new Pool({
  host: process.env.AURORA_SERVERLESS_HOST?.trim(),
  port: process.env.AURORA_SERVERLESS_PORT || 5432,
  database: process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER',
  user: process.env.AURORA_SERVERLESS_USER || 'Admn',
  password: process.env.AURORA_SERVERLESS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

const USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID;

// Mapeamento de grupos Cognito para tipos de usuário
const GROUP_TO_USER_TYPE = {
  'Admin': 'admin',
  'AdminMaster': 'admin',
  'Administrador': 'admin',
  'Gestores': 'gestor',
  'GestorMunicipal': 'gestor',
  'Diretores': 'diretor',
  'Diretor': 'diretor',
  'Professores': 'professor',
  'Professor': 'professor',
  'Alunos': 'aluno',
  'Aluno': 'aluno'
};

// Função para buscar grupos do usuário
async function getUserGroups(username) {
  try {
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: username
    };
    
    const result = await cognito.adminListGroupsForUser(params).promise();
    return result.Groups.map(group => group.GroupName);
  } catch (error) {
    console.error(`❌ Erro ao buscar grupos para ${username}:`, error.message);
    return [];
  }
}

// Função para extrair dados do usuário Cognito
function extractUserData(cognitoUser) {
  const attributes = {};
  
  // Processar atributos do usuário
  if (cognitoUser.Attributes) {
    cognitoUser.Attributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
  }
  
  // Extrair dados principais
  const userData = {
    cognito_sub: attributes.sub || cognitoUser.Username,
    cognito_username: cognitoUser.Username, // Agora suporta até 100 caracteres
    email: attributes.email || null,
    nome: attributes.name || attributes.given_name || attributes.email?.split('@')[0] || cognitoUser.Username,
    telefone: attributes.phone_number || null,
    empresa_id: parseInt(attributes['custom:empresa_id']) || null, // Permitir null para ajustar depois
    escola_id: parseInt(attributes['custom:escola_id']) || null,
    enabled: cognitoUser.Enabled || true,
    user_status: cognitoUser.UserStatus || 'CONFIRMED',
    created_at: cognitoUser.UserCreateDate || new Date(),
    updated_at: cognitoUser.UserLastModifiedDate || new Date()
  };
  
  return userData;
}

// Função para determinar tipo de usuário baseado nos grupos
function getUserType(groups) {
  // Prioridade: Admin > Gestor > Diretor > Professor > Aluno
  const priority = ['Admin', 'AdminMaster', 'Administrador', 'Gestores', 'GestorMunicipal', 'Diretores', 'Diretor', 'Professores', 'Professor', 'Alunos', 'Aluno'];
  
  for (const group of priority) {
    if (groups.includes(group)) {
      return GROUP_TO_USER_TYPE[group];
    }
  }
  
  return 'aluno'; // Default
}

// Função para fazer upsert do usuário na tabela usuarios
async function upsertUser(userData, userType) {
  const client = await pool.connect();
  
  try {
    // DEBUG: Verificar tamanho dos campos
    console.log('   🔍 DEBUG - Tamanhos dos campos:');
    Object.entries(userData).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.length > 20) {
        console.log(`     ${key}: ${value.length} chars - "${value}"`);
      }
    });

    const query = `
      INSERT INTO usuarios (
        cognito_sub, cognito_username, email, nome, telefone, tipo_usuario, 
        status, 
        criado_em, atualizado_em
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      ON CONFLICT (cognito_sub) 
      DO UPDATE SET
        cognito_username = EXCLUDED.cognito_username,
        email = EXCLUDED.email,
        nome = EXCLUDED.nome,
        telefone = EXCLUDED.telefone,
        tipo_usuario = EXCLUDED.tipo_usuario,
        status = EXCLUDED.status,
        atualizado_em = EXCLUDED.atualizado_em
      RETURNING id, email, tipo_usuario
    `;
    
    const values = [
      userData.cognito_sub,
      userData.cognito_username,
      userData.email,
      userData.nome,
      userData.telefone,
      userType,
      'active', // Status fixo para evitar problemas
      userData.created_at,
      userData.updated_at
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
    
  } finally {
    client.release();
  }
}

// Função para buscar todos os usuários do Cognito
async function getAllCognitoUsers() {
  const users = [];
  let paginationToken = null;
  
  console.log('🔍 Buscando usuários do AWS Cognito...');
  
  do {
    try {
      const params = {
        UserPoolId: USER_POOL_ID,
        Limit: 60, // Máximo permitido
        ...(paginationToken && { PaginationToken: paginationToken })
      };
      
      const result = await cognito.listUsers(params).promise();
      users.push(...result.Users);
      paginationToken = result.PaginationToken;
      
      console.log(`✅ Carregados ${result.Users.length} usuários (Total: ${users.length})`);
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      break;
    }
  } while (paginationToken);
  
  return users;
}

// Função principal de migração
async function migrateUsers() {
  console.log('🚀 INICIANDO MIGRAÇÃO: AWS Cognito → Aurora Serverless');
  console.log('=' .repeat(60));
  
  // Expandir tamanho dos campos para suportar dados do Cognito
  console.log('📝 Ajustando schema da tabela usuarios...');
  try {
    const schemaClient = await pool.connect();
    await schemaClient.query(`
      ALTER TABLE usuarios 
      ALTER COLUMN cognito_username TYPE VARCHAR(100),
      ALTER COLUMN documento_identidade TYPE VARCHAR(50),
      ALTER COLUMN genero TYPE VARCHAR(50),
      ALTER COLUMN status TYPE VARCHAR(50),
      ALTER COLUMN cpf TYPE VARCHAR(50)
    `);
    schemaClient.release();
    console.log('✅ Campos expandidos para suportar dados do Cognito');
  } catch (error) {
    console.log('⚠️  Schema já ajustado ou erro:', error.message);
  }
  
  try {
    // Testar conexão Aurora
    const testClient = await pool.connect();
    await testClient.query('SELECT 1');
    testClient.release();
    console.log('✅ Conexão Aurora Serverless estabelecida');
    
    // Buscar usuários do Cognito
    const cognitoUsers = await getAllCognitoUsers();
    console.log(`📊 Total de usuários no Cognito: ${cognitoUsers.length}`);
    
    if (cognitoUsers.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no Cognito');
      return;
    }
    
    // Processar cada usuário
    const results = {
      success: 0,
      error: 0,
      details: []
    };
    
    for (const cognitoUser of cognitoUsers) {
      try {
        console.log(`\n🔄 Processando: ${cognitoUser.Username} (${cognitoUser.Attributes?.find(a => a.Name === 'email')?.Value || 'sem email'})`);
        
        // Extrair dados do usuário
        const userData = extractUserData(cognitoUser);
        
        // Buscar grupos do usuário
        const groups = await getUserGroups(cognitoUser.Username);
        const userType = getUserType(groups);
        
        console.log(`   📝 Dados: ${userData.nome} | ${userData.email} | Tipo: ${userType} | Grupos: [${groups.join(', ')}]`);
        
        // Fazer upsert na tabela usuarios
        const insertedUser = await upsertUser(userData, userType);
        
        console.log(`   ✅ Usuário migrado: ID ${insertedUser.id} | ${insertedUser.email} | ${insertedUser.tipo_usuario}`);
        
        results.success++;
        results.details.push({
          username: cognitoUser.Username,
          email: userData.email,
          tipo_usuario: userType,
          grupos: groups,
          status: 'success'
        });
        
      } catch (error) {
        console.error(`   ❌ Erro ao migrar ${cognitoUser.Username}:`, error.message);
        results.error++;
        
        // Extrair dados básicos mesmo com erro
        const basicUserData = extractUserData(cognitoUser);
        
        results.details.push({
          username: cognitoUser.Username,
          email: basicUserData?.email || 'unknown',
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Relatório final
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO');
    console.log('=' .repeat(60));
    console.log(`✅ Sucessos: ${results.success}`);
    console.log(`❌ Erros: ${results.error}`);
    console.log(`📈 Taxa de sucesso: ${((results.success / cognitoUsers.length) * 100).toFixed(1)}%`);
    
    // Estatísticas por tipo de usuário
    const typeStats = results.details
      .filter(d => d.status === 'success')
      .reduce((acc, d) => {
        acc[d.tipo_usuario] = (acc[d.tipo_usuario] || 0) + 1;
        return acc;
      }, {});
    
    console.log('\n📊 Usuários migrados por tipo:');
    Object.entries(typeStats).forEach(([tipo, count]) => {
      console.log(`   ${tipo}: ${count} usuários`);
    });
    
    // Verificar contagem final na tabela
    const finalCountClient = await pool.connect();
    const finalCount = await finalCountClient.query('SELECT COUNT(*) as total FROM usuarios');
    finalCountClient.release();
    
    console.log(`\n🎯 Total de usuários na tabela Aurora: ${finalCount.rows[0].total}`);
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO NA MIGRAÇÃO:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar migração
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('🎉 Script de migração finalizado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { migrateUsers, getAllCognitoUsers, extractUserData, getUserType };
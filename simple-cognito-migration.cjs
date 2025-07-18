const { Pool } = require('pg');
const AWS = require('aws-sdk');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuração do AWS Cognito
const cognito = new AWS.CognitoIdentityServiceProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const USER_POOL_ID = 'us-east-1_SduwfXm8p';

// Mapear grupos do Cognito para tipos de usuário
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

// Função para buscar todos os usuários do Cognito
async function getAllCognitoUsers() {
  const users = [];
  let paginationToken = null;
  
  do {
    const params = {
      UserPoolId: USER_POOL_ID,
      Limit: 60,
      ...(paginationToken && { PaginationToken: paginationToken })
    };
    
    const result = await cognito.listUsers(params).promise();
    users.push(...result.Users);
    paginationToken = result.PaginationToken;
  } while (paginationToken);
  
  return users;
}

// Função para buscar grupos do usuário
async function getUserGroups(username) {
  try {
    const params = {
      UserPoolId: USER_POOL_ID,
      Username: username,
    };
    
    const result = await cognito.adminListGroupsForUser(params).promise();
    return result.Groups.map(group => group.GroupName);
  } catch (error) {
    console.log(`⚠️  Erro ao buscar grupos para ${username}:`, error.message);
    return [];
  }
}

// Função para determinar tipo de usuário baseado nos grupos
function getUserType(groups) {
  const priority = ['Admin', 'AdminMaster', 'Administrador', 'Gestores', 'GestorMunicipal', 'Diretores', 'Diretor', 'Professores', 'Professor', 'Alunos', 'Aluno'];
  
  for (const group of priority) {
    if (groups.includes(group)) {
      return GROUP_TO_USER_TYPE[group];
    }
  }
  
  return 'aluno';
}

// Função para migrar usuário individual
async function migrateUser(cognitoUser) {
  const attributes = {};
  if (cognitoUser.Attributes) {
    cognitoUser.Attributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
  }
  
  const groups = await getUserGroups(cognitoUser.Username);
  const userType = getUserType(groups);
  
  const client = await pool.connect();
  
  try {
    // Query simplificada - apenas campos essenciais
    const query = `
      INSERT INTO usuarios (
        cognito_sub, cognito_username, email, nome, tipo_usuario, status, criado_em, atualizado_em
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      ON CONFLICT (cognito_sub) 
      DO UPDATE SET
        cognito_username = EXCLUDED.cognito_username,
        email = EXCLUDED.email,
        nome = EXCLUDED.nome,
        tipo_usuario = EXCLUDED.tipo_usuario,
        status = EXCLUDED.status,
        atualizado_em = EXCLUDED.atualizado_em
      RETURNING id, email, tipo_usuario
    `;
    
    const values = [
      attributes.sub || cognitoUser.Username,
      cognitoUser.Username,
      attributes.email || null,
      attributes.name || attributes.given_name || attributes.email?.split('@')[0] || cognitoUser.Username,
      userType,
      'active', // Status fixo
      new Date(),
      new Date()
    ];
    
    const result = await client.query(query, values);
    return { success: true, user: result.rows[0] };
    
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

// Função principal
async function main() {
  console.log('🚀 MIGRAÇÃO SIMPLIFICADA: AWS Cognito → Aurora Serverless');
  console.log('============================================================');
  
  try {
    // Conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conexão Aurora Serverless estabelecida');
    client.release();
    
    // Buscar usuários do Cognito
    const cognitoUsers = await getAllCognitoUsers();
    console.log(`📊 Total de usuários no Cognito: ${cognitoUsers.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const usersByType = {};
    
    for (const cognitoUser of cognitoUsers) {
      console.log(`\n🔄 Processando: ${cognitoUser.Username}`);
      
      const result = await migrateUser(cognitoUser);
      
      if (result.success) {
        successCount++;
        const type = result.user.tipo_usuario;
        usersByType[type] = (usersByType[type] || 0) + 1;
        console.log(`   ✅ Usuário migrado: ID ${result.user.id} | ${result.user.email} | ${result.user.tipo_usuario}`);
      } else {
        errorCount++;
        console.log(`   ❌ Erro: ${result.error}`);
      }
    }
    
    console.log('\n============================================================');
    console.log('📊 RELATÓRIO FINAL DA MIGRAÇÃO');
    console.log('============================================================');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / cognitoUsers.length) * 100).toFixed(1)}%`);
    
    console.log('\n📊 Usuários migrados por tipo:');
    Object.entries(usersByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} usuários`);
    });
    
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA!');
    
  } catch (error) {
    console.error('💥 Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

// Executar
main();
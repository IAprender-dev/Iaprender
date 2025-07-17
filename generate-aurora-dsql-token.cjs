const { DSQLClient } = require('@aws-sdk/client-dsql');
require('dotenv').config();

async function generateAuroraDSQLToken() {
  console.log('🔑 GERANDO NOVO TOKEN AURORA DSQL');
  console.log('=================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🌍 Região: ${region}`);
  console.log(`🔑 Access Key: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
  
  try {
    // Criar cliente DSQL
    const dsqlClient = new DSQLClient({
      region: region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    console.log('✅ Cliente DSQL criado');
    
    // Gerar token de conexão admin usando método correto
    console.log('🔄 Gerando token de autenticação...');
    
    const response = await dsqlClient.generateDbConnectAdminAuthToken({
      clusterIdentifier: endpoint, // ou apenas a parte do cluster ID
      region: region,
      expiresIn: 3600 // 1 hora
    });
    
    console.log('✅ TOKEN GERADO COM SUCESSO!');
    console.log(`🔑 Novo token: ${response.authToken?.substring(0, 50)}...`);
    console.log(`⏰ Expira em: ${response.expiresIn || '3600'} segundos`);
    
    // Salvar token no arquivo .env
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    
    if (envContent.includes('TOKEN_AURORA=')) {
      envContent = envContent.replace(/TOKEN_AURORA=.*/, `TOKEN_AURORA=${response.authToken}`);
    } else {
      envContent += `\nTOKEN_AURORA=${response.authToken}\n`;
    }
    
    fs.writeFileSync('.env', envContent);
    console.log('✅ Token salvo no arquivo .env');
    
    return response.authToken;
    
  } catch (error) {
    console.log(`❌ Erro ao gerar token: ${error.message}`);
    
    if (error.name === 'AccessDeniedException') {
      console.log('💡 Sem permissão para gerar tokens DSQL');
      console.log('📋 Permissões necessárias:');
      console.log('   - dsql:GenerateDbConnectAdminAuthToken');
      console.log('   - dsql:DbConnectAdmin');
    } else if (error.name === 'ResourceNotFoundException') {
      console.log('💡 Cluster Aurora DSQL não encontrado');
      console.log('📋 Verificar:');
      console.log('   - Se o cluster existe');
      console.log('   - Se o identificador está correto');
      console.log('   - Se está na região correta');
    } else if (error.name === 'ValidationException') {
      console.log('💡 Parâmetros inválidos');
      console.log('📋 Verificar formato do clusterIdentifier');
    }
    
    return null;
  }
}

// Função alternativa usando apenas o cluster ID
async function generateTokenWithClusterId() {
  console.log('\n🔄 TENTATIVA ALTERNATIVA: Usar apenas Cluster ID');
  console.log('================================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const clusterId = endpoint.split('.')[0]; // qeabuhp64eamddmw3vqdq52ph4
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`🆔 Cluster ID: ${clusterId}`);
  
  try {
    const dsqlClient = new DSQLClient({
      region: region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    const response = await dsqlClient.generateDbConnectAdminAuthToken({
      clusterIdentifier: clusterId, // Apenas o ID do cluster
      region: region,
      expiresIn: 3600
    });
    
    console.log('✅ TOKEN GERADO COM CLUSTER ID!');
    console.log(`🔑 Novo token: ${response.authToken?.substring(0, 50)}...`);
    
    return response.authToken;
    
  } catch (error) {
    console.log(`❌ Falhou com cluster ID: ${error.message}`);
    return null;
  }
}

async function main() {
  // Tentar primeiro com endpoint completo
  let token = await generateAuroraDSQLToken();
  
  // Se falhar, tentar com cluster ID apenas
  if (!token) {
    token = await generateTokenWithClusterId();
  }
  
  if (token) {
    console.log('\n🎯 SUCESSO! Token gerado e salvo.');
    console.log('📋 Próximos passos:');
    console.log('1. Reiniciar o servidor para carregar novo token');
    console.log('2. Testar conexão Aurora DSQL');
    console.log('3. Token expira em 1 hora - automatizar renovação');
  } else {
    console.log('\n❌ NÃO FOI POSSÍVEL GERAR TOKEN');
    console.log('📋 Possíveis soluções:');
    console.log('1. Verificar permissões IAM do usuário');
    console.log('2. Confirmar se Aurora DSQL está ativo');
    console.log('3. Verificar identificador do cluster');
    console.log('4. Considerar usar AWS CLI: aws dsql generate-db-connect-admin-auth-token');
  }
}

main().catch(console.error);
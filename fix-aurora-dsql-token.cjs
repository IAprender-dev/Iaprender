const { exec } = require('child_process');
require('dotenv').config();

async function fixAuroraDSQLToken() {
  console.log('🔧 TENTANDO CORRIGIR TOKEN AURORA DSQL');
  console.log('====================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const clusterId = endpoint.split('.')[0];
  
  console.log(`🆔 Cluster ID: ${clusterId}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  
  // Tentar gerar token via AWS CLI
  const command = `aws dsql generate-db-connect-admin-auth-token --cluster-identifier ${clusterId} --region us-east-1 --expires-in 3600 --output text`;
  
  console.log('\n🔄 Executando comando AWS CLI...');
  console.log(`💻 Comando: ${command}`);
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Erro AWS CLI: ${error.message}`);
        
        if (error.message.includes('AccessDenied')) {
          console.log('💡 Sem permissão para gerar tokens DSQL');
          console.log('📋 Permissões IAM necessárias:');
          console.log('   - dsql:GenerateDbConnectAdminAuthToken');
          console.log('   - dsql:DbConnect');
        } else if (error.message.includes('ResourceNotFound')) {
          console.log('💡 Cluster Aurora DSQL não encontrado');
          console.log('📋 Verificar se o cluster existe e está ativo');
        } else if (error.message.includes('not found')) {
          console.log('💡 AWS CLI não instalado ou não configurado');
          console.log('📋 Instalar AWS CLI ou usar console AWS');
        }
        
        reject(error);
        return;
      }
      
      if (stderr) {
        console.log(`⚠️ Warnings: ${stderr}`);
      }
      
      const newToken = stdout.trim();
      
      if (newToken && newToken.length > 100) {
        console.log('\n✅ NOVO TOKEN GERADO!');
        console.log(`🔑 Token: ${newToken.substring(0, 50)}...`);
        console.log(`📏 Tamanho: ${newToken.length} caracteres`);
        
        // Salvar no .env
        const fs = require('fs');
        let envContent = fs.readFileSync('.env', 'utf8');
        
        if (envContent.includes('TOKEN_AURORA=')) {
          envContent = envContent.replace(/TOKEN_AURORA=.*/, `TOKEN_AURORA=${newToken}`);
        } else {
          envContent += `\nTOKEN_AURORA=${newToken}\n`;
        }
        
        fs.writeFileSync('.env', envContent);
        console.log('✅ Token salvo no .env');
        console.log('🔄 Reinicie o servidor para aplicar o novo token');
        
        resolve(newToken);
      } else {
        console.log('❌ Token vazio ou inválido retornado');
        reject(new Error('Token inválido'));
      }
    });
  });
}

// Verificar status do cluster primeiro
async function checkClusterStatus() {
  console.log('\n🔍 VERIFICANDO STATUS DO CLUSTER...');
  
  const clusterId = process.env.ENDPOINT_AURORA.split('.')[0];
  const command = `aws dsql list-clusters --region us-east-1 --query "clusters[?clusterIdentifier=='${clusterId}']" --output table`;
  
  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Não foi possível verificar status: ${error.message}`);
        resolve(false);
        return;
      }
      
      console.log(`📊 Status do cluster:`);
      console.log(stdout);
      resolve(true);
    });
  });
}

async function main() {
  try {
    // Verificar status do cluster
    await checkClusterStatus();
    
    // Tentar gerar novo token
    const newToken = await fixAuroraDSQLToken();
    
    console.log('\n🎯 SUCESSO! Token renovado.');
    console.log('📋 Próximos passos:');
    console.log('1. ✅ Token salvo no .env');
    console.log('2. 🔄 Reiniciar servidor');
    console.log('3. 🧪 Testar conexão Aurora DSQL');
    console.log('4. ⏰ Automatizar renovação (expira em 1 hora)');
    
  } catch (error) {
    console.log('\n❌ FALHA NA RENOVAÇÃO DO TOKEN');
    console.log('📋 Alternativas:');
    console.log('1. 🌐 Gerar token via console AWS');
    console.log('2. 🔧 Verificar permissões IAM');
    console.log('3. 📍 Confirmar se cluster existe');
    console.log('4. 🔄 Usar PostgreSQL temporariamente');
  }
}

main().catch(console.error);
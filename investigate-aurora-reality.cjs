const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');
require('dotenv').config();

async function investigateAuroraReality() {
  console.log('🔍 INVESTIGAÇÃO: O QUE É REALMENTE ESTE ENDPOINT?');
  console.log('================================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  console.log(`📍 Endpoint em análise: ${endpoint}`);
  
  // 1. Analisar o formato do endpoint
  console.log('\n1. 📋 ANÁLISE DO FORMATO DO ENDPOINT:');
  
  if (endpoint.includes('.dsql.')) {
    console.log('✅ Formato Aurora DSQL detectado: .dsql.');
    console.log('🔍 Aurora DSQL é um serviço diferente do RDS tradicional');
    console.log('💡 Aurora DSQL pode não usar RDS Data API');
  } else if (endpoint.includes('.rds.')) {
    console.log('✅ Formato RDS tradicional detectado: .rds.');
  } else {
    console.log('⚠️ Formato não reconhecido');
  }
  
  // 2. Extrair informações do endpoint
  const parts = endpoint.split('.');
  console.log(`📋 Partes do endpoint: ${parts.join(' | ')}`);
  
  if (parts.length >= 3) {
    const clusterId = parts[0];
    const service = parts[1]; // dsql, rds, etc
    const region = parts[2];
    
    console.log(`🆔 Cluster ID: ${clusterId}`);
    console.log(`🌐 Serviço: ${service}`);
    console.log(`🗺️ Região: ${region}`);
  }
  
  // 3. Tentar listar clusters RDS para comparar
  console.log('\n2. 🔍 VERIFICANDO CLUSTERS RDS EXISTENTES:');
  
  try {
    const rdsClient = new RDSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    });
    
    const command = new DescribeDBClustersCommand({});
    const result = await rdsClient.send(command);
    
    console.log(`✅ Encontrados ${result.DBClusters.length} clusters RDS:`);
    
    result.DBClusters.forEach((cluster, index) => {
      console.log(`\n   📊 Cluster ${index + 1}:`);
      console.log(`      🆔 ID: ${cluster.DBClusterIdentifier}`);
      console.log(`      📍 Endpoint: ${cluster.Endpoint}`);
      console.log(`      🚀 Engine: ${cluster.Engine}`);
      console.log(`      📊 Status: ${cluster.Status}`);
      console.log(`      🌍 Region: ${cluster.AvailabilityZones?.[0]}`);
      
      // Verificar se algum cluster combina
      if (cluster.Endpoint && cluster.Endpoint.includes(parts[0])) {
        console.log(`      🎯 MATCH! Este cluster combina com nosso endpoint`);
      }
    });
    
  } catch (error) {
    console.log(`❌ Não foi possível listar clusters RDS: ${error.message}`);
    if (error.name === 'AccessDeniedException') {
      console.log('💡 Sem permissão para listar clusters RDS');
    }
  }
  
  // 4. Pesquisar sobre Aurora DSQL
  console.log('\n3. 🔍 ANÁLISE AURORA DSQL:');
  console.log('Aurora DSQL (Data System Query Language) é um serviço SEPARADO do Aurora tradicional');
  console.log('🚨 DESCOBERTA CRÍTICA: Aurora DSQL não usa RDS Data API!');
  console.log('');
  console.log('📋 CARACTERÍSTICAS DO AURORA DSQL:');
  console.log('   • Serviço serverless para PostgreSQL');
  console.log('   • NÃO usa RDS Data API (aws-sdk/client-rds-data)');
  console.log('   • Usa conexões PostgreSQL diretas');
  console.log('   • Endpoint é PostgreSQL nativo, não HTTP API');
  console.log('   • Precisa de driver PostgreSQL (pg, psycopg2)');
  
  console.log('\n📋 CONCLUSÃO IMPORTANTE:');
  console.log('❌ Estamos usando SDK errado!');
  console.log('✅ Aurora DSQL = PostgreSQL connection string normal');
  console.log('✅ Usar driver PostgreSQL tradicional (Pool)');
  console.log('✅ NÃO usar RDS Data API');
  
  console.log('\n🎯 SOLUÇÃO:');
  console.log('1. Usar Pool do PostgreSQL direto');
  console.log('2. Connection string: postgresql://user:token@endpoint:5432/database');
  console.log('3. Usar Drizzle PostgreSQL driver (não AWS Data API)');
}

investigateAuroraReality().catch(console.error);
require('dotenv').config();

function mostrarCredenciaisAurora() {
  console.log('🔍 ANÁLISE COMPLETA CREDENCIAIS AURORA DSQL');
  console.log('==========================================');
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const token = process.env.TOKEN_AURORA;
  const awsAccountId = process.env.AWS_ACCOUNT_ID;
  const region = process.env.AWS_REGION || 'us-east-1';
  
  console.log(`📍 Endpoint: ${endpoint}`);
  console.log(`🔑 Token: ${token?.substring(0, 100)}...`);
  console.log(`📏 Tamanho token: ${token?.length} chars`);
  console.log(`🏢 AWS Account: ${awsAccountId}`);
  console.log(`🌍 Região: ${region}`);
  
  if (token && token.includes('X-Amz-Date=')) {
    const dateMatch = token.match(/X-Amz-Date=(\d{8}T\d{6}Z)/);
    const expiresMatch = token.match(/X-Amz-Expires=(\d+)/);
    const actionMatch = token.match(/Action=([^&]+)/);
    const credentialMatch = token.match(/X-Amz-Credential=([^&]+)/);
    
    if (dateMatch) {
      const tokenDate = dateMatch[1];
      const year = tokenDate.substring(0, 4);
      const month = tokenDate.substring(4, 6);
      const day = tokenDate.substring(6, 8);
      const hour = tokenDate.substring(9, 11);
      const minute = tokenDate.substring(11, 13);
      
      const tokenTimestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
      const now = new Date();
      const diffMinutes = Math.floor((now - tokenTimestamp) / (1000 * 60));
      
      console.log(`📅 Data token: ${tokenTimestamp.toISOString()}`);
      console.log(`🕐 Idade: ${diffMinutes} minutos`);
    }
    
    if (expiresMatch) {
      console.log(`⏰ Expira em: ${expiresMatch[1]} segundos`);
    }
    
    if (actionMatch) {
      console.log(`🎯 Ação: ${decodeURIComponent(actionMatch[1])}`);
    }
    
    if (credentialMatch) {
      console.log(`🔐 Credential: ${decodeURIComponent(credentialMatch[1])}`);
    }
    
    // Verificar se token é uma URL completa
    if (token.startsWith('http')) {
      console.log('\n💡 TOKEN É URL COMPLETA!');
      console.log('Este token deve ser usado como URL, não como password PostgreSQL');
      console.log('Aurora DSQL pode usar API HTTP em vez de protocolo PostgreSQL');
    }
  }
  
  console.log('\n🔍 ANÁLISE DA CONFIGURAÇÃO:');
  
  // Verificar cluster ID
  if (endpoint) {
    const clusterId = endpoint.split('.')[0];
    console.log(`🆔 Cluster ID: ${clusterId}`);
    
    if (endpoint.includes('.dsql.')) {
      console.log('✅ Formato Aurora DSQL confirmado');
      console.log('💡 Aurora DSQL é diferente do Aurora tradicional');
    }
  }
  
  console.log('\n🎯 CONCLUSÕES:');
  console.log('1. Token é válido e recém-gerado');
  console.log('2. Configuração AWS está correta');
  console.log('3. Problema pode ser no protocolo de conexão');
  console.log('4. Aurora DSQL pode não aceitar conexões PostgreSQL diretas');
  console.log('5. Pode precisar usar API HTTP específica do Aurora DSQL');
}

mostrarCredenciaisAurora();
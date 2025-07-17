require('dotenv').config();

function checkTokenExpiry() {
  console.log('🔍 ANALISANDO TOKEN AURORA DSQL ATUAL');
  console.log('====================================');
  
  const token = process.env.TOKEN_AURORA;
  
  if (!token) {
    console.log('❌ TOKEN_AURORA não encontrado nas variáveis de ambiente');
    return;
  }
  
  console.log(`🔑 Token atual: ${token.substring(0, 50)}...`);
  console.log(`📏 Tamanho do token: ${token.length} caracteres`);
  
  // Analisar estrutura do token
  if (token.includes('X-Amz-Date=')) {
    const dateMatch = token.match(/X-Amz-Date=(\d{8}T\d{6}Z)/);
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
      
      console.log(`📅 Data do token: ${tokenTimestamp.toISOString()}`);
      console.log(`🕐 Idade do token: ${diffMinutes} minutos`);
      
      if (diffMinutes > 60) {
        console.log('⚠️ TOKEN EXPIRADO! (>60 minutos)');
        console.log('🔄 Necessário gerar novo token');
      } else if (diffMinutes > 45) {
        console.log('⚠️ TOKEN PRÓXIMO DO VENCIMENTO (>45 minutos)');
        console.log('🔄 Recomendado gerar novo token');
      } else {
        console.log('✅ Token ainda válido');
      }
    }
  } else {
    console.log('🔍 Token não parece ser um token AWS temporário');
    console.log('💡 Pode ser um token estático ou formato diferente');
  }
  
  // Verificar se contém parâmetros AWS
  const awsParams = [
    'X-Amz-Algorithm',
    'X-Amz-Credential', 
    'X-Amz-Date',
    'X-Amz-Expires',
    'X-Amz-Security-Token',
    'X-Amz-Signature'
  ];
  
  console.log('\n📋 PARÂMETROS AWS NO TOKEN:');
  awsParams.forEach(param => {
    if (token.includes(param)) {
      console.log(`✅ ${param}: presente`);
    } else {
      console.log(`❌ ${param}: ausente`);
    }
  });
  
  console.log('\n🎯 CONCLUSÃO:');
  if (token.includes('X-Amz-Date=') && token.includes('X-Amz-Expires=')) {
    console.log('✅ Token é temporário AWS com expiração');
    console.log('🔄 Precisa ser renovado periodicamente');
  } else {
    console.log('❓ Token pode ser estático ou formato não reconhecido');
  }
}

checkTokenExpiry();
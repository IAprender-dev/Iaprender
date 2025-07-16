/**
 * SCRIPT PARA MOSTRAR CREDENCIAIS DO AURORA DSQL
 * 
 * Exibe as credenciais configuradas para acesso ao Aurora DSQL
 */

require('dotenv').config();

async function mostrarCredenciaisAurora() {
  console.log('📋 CREDENCIAIS DO AURORA DSQL');
  console.log('='.repeat(50));
  
  const endpoint = process.env.ENDPOINT_AURORA;
  const porta = process.env.PORTA_AURORA;
  const token = process.env.TOKEN_AURORA;
  const usuario = process.env.USUARIO_AURORA;
  const nomeBanco = process.env.NOME_BANCO_AURORA;
  
  console.log('\n🔗 DADOS DE CONEXÃO AURORA DSQL:');
  console.log(`Endpoint: ${endpoint || 'Não configurado'}`);
  console.log(`Porta: ${porta || 'Não configurado'}`);
  console.log(`Token: ${token ? 'CONFIGURADO' : 'Não configurado'}`);
  console.log(`Usuário: ${usuario || 'Não configurado'}`);
  console.log(`Nome do Banco: ${nomeBanco || 'Não configurado'}`);
  
  if (endpoint) {
    // Extrair ID do cluster do endpoint
    const clusterId = endpoint.split('.')[0];
    const arnSugerido = `arn:aws:dsql:us-east-1:762723916379:cluster/${clusterId}`;
    
    console.log('\n📝 INFORMAÇÕES TÉCNICAS:');
    console.log(`Cluster ID extraído: ${clusterId}`);
    console.log(`ARN sugerido: ${arnSugerido}`);
    console.log(`Região: us-east-1`);
  }
  
  console.log('\n📚 CREDENCIAIS AWS RELACIONADAS:');
  console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'CONFIGURADO' : 'Não configurado'}`);
  console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'CONFIGURADO' : 'Não configurado'}`);
  
  if (!endpoint || !porta || !token) {
    console.log('\n⚠️  AVISO: Algumas credenciais Aurora DSQL estão faltando!');
    console.log('   Verifique a configuração das seguintes secrets:');
    if (!endpoint) console.log('   - ENDPOINT_AURORA');
    if (!porta) console.log('   - PORTA_AURORA');
    if (!token) console.log('   - TOKEN_AURORA');
    if (!usuario) console.log('   - USUARIO_AURORA (opcional)');
    if (!nomeBanco) console.log('   - NOME_BANCO_AURORA (opcional)');
  } else {
    console.log('\n✅ Credenciais básicas do Aurora DSQL configuradas!');
  }
  
  console.log('\n💡 NOTA: Aurora DSQL usa RDS Data API e requer ARN do cluster');
  console.log('   para conexão via AWS SDK em vez de conexão direta.');
}

mostrarCredenciaisAurora().catch(console.error);
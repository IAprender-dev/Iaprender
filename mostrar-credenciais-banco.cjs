/**
 * SCRIPT PARA MOSTRAR CREDENCIAIS DO BANCO DE DADOS
 * 
 * Exibe as credenciais configuradas para acesso direto ao banco PostgreSQL
 */

require('dotenv').config();

async function mostrarCredenciaisBanco() {
  console.log('📋 CREDENCIAIS DO BANCO DE DADOS POSTGRESQL');
  console.log('='.repeat(50));
  
  // Extrair componentes da DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      
      console.log('\n🔗 DADOS DE CONEXÃO:');
      console.log(`Host: ${url.hostname}`);
      console.log(`Porta: ${url.port || '5432'}`);
      console.log(`Nome do Banco: ${url.pathname.substring(1)}`);
      console.log(`Usuário: ${url.username}`);
      console.log(`Senha: ${url.password}`);
      
      console.log('\n📝 STRING DE CONEXÃO COMPLETA:');
      console.log(`DATABASE_URL: ${databaseUrl}`);
      
    } catch (error) {
      console.log('❌ Erro ao processar DATABASE_URL:', error.message);
    }
  }
  
  // Mostrar variáveis individuais se disponíveis
  console.log('\n🔧 VARIÁVEIS INDIVIDUAIS:');
  console.log(`PGHOST: ${process.env.PGHOST || 'Não definido'}`);
  console.log(`PGPORT: ${process.env.PGPORT || 'Não definido'}`);
  console.log(`PGDATABASE: ${process.env.PGDATABASE || 'Não definido'}`);
  console.log(`PGUSER: ${process.env.PGUSER || 'Não definido'}`);
  console.log(`PGPASSWORD: ${process.env.PGPASSWORD || 'Não definido'}`);
  
  console.log('\n✅ Credenciais exibidas com sucesso!');
  console.log('\n💡 DICA: Você pode usar essas credenciais em qualquer cliente PostgreSQL');
  console.log('   (pgAdmin, DBeaver, psql, etc.)');
}

mostrarCredenciaisBanco().catch(console.error);
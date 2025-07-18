/**
 * Teste direto de conectividade Aurora Serverless
 * Verifica se as credenciais estão corretas e o banco está acessível
 */

import { Pool } from 'pg';

async function testAuroraConnection() {
  console.log('🔍 TESTE DIRETO: Conectividade Aurora Serverless');
  console.log('================================================================================');
  
  const host = process.env.AURORA_SERVERLESS_HOST?.trim();
  const password = process.env.AURORA_SERVERLESS_PASSWORD;
  const database = process.env.AURORA_SERVERLESS_DB || 'bdiaprender';
  const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');
  
  // Testar múltiplos usuários possíveis
  const possibleUsers = ['Administrator', 'Admin', 'postgres', 'root'];
  let currentUser = (process.env.AURORA_SERVERLESS_USER || '').trim();
  
  // Se usuário não está nas opções conhecidas, testar todos
  if (!possibleUsers.includes(currentUser)) {
    console.log(`⚠️ Usuário atual "${currentUser}" não reconhecido, testando opções conhecidas...`);
  } else {
    possibleUsers.unshift(currentUser); // Colocar usuário atual primeiro
  }
  
  console.log(`📊 Configuração de Teste:`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   Password: ${password ? '***configurada***' : '❌ NÃO CONFIGURADA'}`);
  console.log(`   Usuários a testar: ${possibleUsers.join(', ')}`);
  
  if (!host || !password) {
    console.log('❌ ERRO: Credenciais obrigatórias não configuradas');
    return false;
  }
  
  // Testar cada usuário sequencialmente
  for (const testUser of possibleUsers) {
    console.log(`\n🔌 Testando usuário: ${testUser}`);
    
    const pool = new Pool({
      host: host,
      port: port,
      database: database,
      user: testUser,
      password: password,
      ssl: false, // Teste sem SSL primeiro
      connectionTimeoutMillis: 15000,
      max: 1
    });
  
    try {
      const client = await pool.connect();
      console.log(`✅ CONEXÃO ESTABELECIDA com usuário: ${testUser}!`);
      
      // Teste de query simples
      console.log('📋 Executando query de teste...');
      const result = await client.query('SELECT version(), current_database(), current_user;');
      console.log('✅ Query executada com sucesso!');
      console.log(`   Versão PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
      console.log(`   Database: ${result.rows[0].current_database}`);
      console.log(`   Usuário conectado: ${result.rows[0].current_user}`);
      
      // Listar tabelas existentes
      console.log('\n📊 Verificando tabelas existentes...');
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`✅ ${tablesResult.rows.length} tabelas encontradas:`);
        tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
      } else {
        console.log('⚠️ Nenhuma tabela encontrada - banco está vazio');
      }
      
      client.release();
      await pool.end();
      
      console.log(`\n🎯 SUCESSO: Usuário correto é "${testUser}"!`);
      console.log('✅ Aurora Serverless TOTALMENTE FUNCIONAL!');
      return { success: true, correctUser: testUser };
      
    } catch (error) {
      console.log(`❌ Falha com usuário "${testUser}":`, error.message);
      
      if (error.code === 'ENOTFOUND') {
        console.log('💡 DNS não resolvido - verificar hostname');
        await pool.end();
        break; // Se DNS falhar, não adianta testar outros usuários
      } else if (error.code === 'ECONNREFUSED') {
        console.log('💡 Conexão recusada - verificar porta e firewall');
        await pool.end();
        break; // Se porta falhar, não adianta testar outros usuários
      } else if (error.code === '28P01') {
        console.log('💡 Falha de autenticação - tentando próximo usuário...');
      } else if (error.code === '3D000') {
        console.log('💡 Database não existe - verificar nome do banco');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Timeout - cluster pode estar pausado');
        await pool.end();
        break; // Se timeout, não adianta testar outros usuários
      }
      
      await pool.end();
      continue; // Tentar próximo usuário
    }
  }
  
  console.log('\n❌ NENHUM USUÁRIO FUNCIONOU');
  return { success: false };
}

// Executar teste
testAuroraConnection()
  .then(result => {
    if (result.success) {
      console.log('\n✅ TESTE CONCLUÍDO: Aurora Serverless pronto para uso!');
      console.log(`🔑 Usuário correto: ${result.correctUser}`);
      console.log('\n💡 PRÓXIMO PASSO: Atualizar AURORA_SERVERLESS_USER nas secrets');
    } else {
      console.log('\n❌ TESTE FALHOU: Verificar configurações');
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
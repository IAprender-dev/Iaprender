/**
 * Teste específico com usuário "Admn"
 * Verificação direta das credenciais fornecidas
 */

import { Pool } from 'pg';

async function testAdmnUser() {
  console.log('🔍 TESTE ESPECÍFICO: Usuário "Admn"');
  console.log('================================================================================');
  
  const host = process.env.AURORA_SERVERLESS_HOST?.trim();
  const password = process.env.AURORA_SERVERLESS_PASSWORD;
  const database = process.env.AURORA_SERVERLESS_DB || 'bdiaprender';
  const username = 'Admn'; // ESPECÍFICO conforme solicitado
  const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');
  
  console.log(`📊 Configuração de Teste:`);
  console.log(`   Host: ${host}`);
  console.log(`   Port: ${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${username}`);
  console.log(`   Password: ${password ? '***configurada***' : '❌ NÃO CONFIGURADA'}`);
  
  if (!host || !password) {
    console.log('❌ ERRO: Credenciais obrigatórias não configuradas');
    return false;
  }
  
  const pool = new Pool({
    host: host,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: { 
      rejectUnauthorized: false,
      require: true 
    },
    connectionTimeoutMillis: 30000, // 30 segundos
    max: 1
  });
  
  try {
    console.log('\n🔌 Conectando com usuário "Admn"...');
    const client = await pool.connect();
    console.log('✅ CONEXÃO ESTABELECIDA!');
    
    // Teste de query simples
    console.log('\n📋 Executando query de teste...');
    const result = await client.query('SELECT version(), current_database(), current_user;');
    console.log('✅ Query executada com sucesso!');
    console.log(`   Versão PostgreSQL: ${result.rows[0].version.split(' ')[0]}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   Usuário conectado: ${result.rows[0].current_user}`);
    
    // Verificar permissões
    console.log('\n🔐 Verificando permissões...');
    const permsResult = await client.query(`
      SELECT 
        rolname as role_name,
        rolsuper as is_superuser,
        rolcreaterole as can_create_role,
        rolcreatedb as can_create_db
      FROM pg_roles 
      WHERE rolname = current_user;
    `);
    
    if (permsResult.rows.length > 0) {
      const perm = permsResult.rows[0];
      console.log(`   Superusuário: ${perm.is_superuser ? 'SIM' : 'NÃO'}`);
      console.log(`   Pode criar roles: ${perm.can_create_role ? 'SIM' : 'NÃO'}`);
      console.log(`   Pode criar DBs: ${perm.can_create_db ? 'SIM' : 'NÃO'}`);
    }
    
    // Listar tabelas existentes
    console.log('\n📊 Verificando tabelas existentes...');
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ ${tablesResult.rows.length} tabelas encontradas:`);
      tablesResult.rows.forEach(row => console.log(`   - ${row.table_name} (${row.table_type})`));
    } else {
      console.log('⚠️ Nenhuma tabela encontrada - banco está vazio');
    }
    
    // Testar criação de tabela (se necessário)
    console.log('\n🧪 Testando permissões de escrita...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS teste_conexao (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          teste VARCHAR(50)
        );
      `);
      console.log('✅ Permissões de escrita funcionando');
      
      // Limpar tabela de teste
      await client.query('DROP TABLE IF EXISTS teste_conexao;');
      console.log('✅ Tabela de teste removida');
      
    } catch (writeError) {
      console.log('❌ Erro ao testar escrita:', writeError.message);
    }
    
    client.release();
    console.log('\n🎯 RESULTADO: Usuário "Admn" TOTALMENTE FUNCIONAL!');
    return true;
    
  } catch (error) {
    console.log('\n❌ ERRO DE CONEXÃO:', error.message);
    console.log('❌ Código do erro:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS não resolvido - hostname incorreto');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Conexão recusada - porta/firewall bloqueados');
    } else if (error.code === '28P01') {
      console.log('💡 Falha de autenticação - usuário/senha incorretos');
    } else if (error.code === '3D000') {
      console.log('💡 Database não existe');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Timeout - cluster pausado ou inacessível');
    } else {
      console.log('💡 Erro desconhecido - verificar logs AWS');
    }
    
    return false;
  } finally {
    await pool.end();
  }
}

// Executar teste
testAdmnUser()
  .then(success => {
    if (success) {
      console.log('\n✅ TESTE CONCLUÍDO: Usuário "Admn" confirmado!');
      console.log('🔑 Credenciais estão corretas');
      console.log('🎯 Aurora Serverless pronto para uso');
    } else {
      console.log('\n❌ TESTE FALHOU: Verificar configurações Aurora');
    }
  })
  .catch(error => {
    console.error('❌ Erro no teste:', error);
  });
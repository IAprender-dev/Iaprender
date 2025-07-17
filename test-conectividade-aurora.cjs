const { Pool } = require('pg');
require('dotenv').config();

class TesteConectividadeAurora {
  constructor() {
    this.endpoint = process.env.ENDPOINT_AURORA;
    this.token = process.env.TOKEN_AURORA;
    this.pool = null;
  }

  async executarTestes() {
    console.log('🧪 TESTE DE CONECTIVIDADE AURORA DSQL');
    console.log('====================================');
    console.log(`📍 Endpoint: ${this.endpoint}`);
    console.log(`🔐 Token: ${this.token ? 'Configurado' : 'Ausente'}`);
    console.log('');

    if (!this.endpoint || !this.token) {
      console.log('❌ Credenciais Aurora DSQL não encontradas');
      return false;
    }

    const testes = [
      () => this.teste1_ConexaoBasica(),
      () => this.teste2_VersaoPostgreSQL(),
      () => this.teste3_PermissoesUsuario(),
      () => this.teste4_TabelasDisponiveis(),
      () => this.teste5_EstrutulaHierarquica(),
      () => this.teste6_PerformanceConexao(),
      () => this.teste7_TesteSSL(),
      () => this.teste8_ValidacaoToken()
    ];

    let sucessos = 0;
    for (let i = 0; i < testes.length; i++) {
      try {
        const resultado = await testes[i]();
        if (resultado) sucessos++;
      } catch (error) {
        console.log(`❌ Teste ${i + 1} falhou: ${error.message}`);
      }
    }

    console.log('');
    console.log('📊 RESUMO DOS TESTES:');
    console.log(`✅ Sucessos: ${sucessos}/${testes.length}`);
    console.log(`❌ Falhas: ${testes.length - sucessos}/${testes.length}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((sucessos / testes.length) * 100)}%`);

    await this.fecharConexao();
    return sucessos === testes.length;
  }

  async teste1_ConexaoBasica() {
    console.log('🔸 Teste 1: Conexão Básica');
    
    this.pool = new Pool({
      host: this.endpoint,
      port: 5432,
      database: 'postgres',
      user: 'admin',
      password: this.token,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      max: 5
    });

    const client = await this.pool.connect();
    const result = await client.query('SELECT 1 as test');
    client.release();

    console.log('  ✅ Conexão estabelecida com sucesso');
    return true;
  }

  async teste2_VersaoPostgreSQL() {
    console.log('🔸 Teste 2: Versão PostgreSQL');
    
    const client = await this.pool.connect();
    const result = await client.query('SELECT version() as version');
    client.release();

    const version = result.rows[0].version;
    console.log(`  ✅ ${version.substring(0, 20)}...`);
    return version.includes('PostgreSQL');
  }

  async teste3_PermissoesUsuario() {
    console.log('🔸 Teste 3: Permissões do Usuário');
    
    const client = await this.pool.connect();
    const result = await client.query('SELECT current_user, current_database()');
    client.release();

    const { current_user, current_database } = result.rows[0];
    console.log(`  ✅ Usuário: ${current_user}, Database: ${current_database}`);
    return current_user === 'admin';
  }

  async teste4_TabelasDisponiveis() {
    console.log('🔸 Teste 4: Tabelas Disponíveis');
    
    const client = await this.pool.connect();
    const result = await client.query(`
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    client.release();

    const total = parseInt(result.rows[0].total);
    console.log(`  ✅ ${total} tabelas encontradas no schema public`);
    return total > 0;
  }

  async teste5_EstrutulaHierarquica() {
    console.log('🔸 Teste 5: Estrutura Hierárquica');
    
    const tabelasEsperadas = ['empresas', 'contratos', 'escolas', 'usuarios', 'gestores', 'diretores', 'professores', 'alunos'];
    
    const client = await this.pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY($1)
    `, [tabelasEsperadas]);
    client.release();

    const tabelasEncontradas = result.rows.map(r => r.table_name);
    console.log(`  ✅ ${tabelasEncontradas.length}/${tabelasEsperadas.length} tabelas hierárquicas encontradas`);
    console.log(`     ${tabelasEncontradas.join(', ')}`);
    return tabelasEncontradas.length >= 6; // Pelo menos 6 das 8 tabelas
  }

  async teste6_PerformanceConexao() {
    console.log('🔸 Teste 6: Performance de Conexão');
    
    const inicio = Date.now();
    
    const client = await this.pool.connect();
    await client.query('SELECT COUNT(*) FROM pg_tables');
    client.release();
    
    const duracao = Date.now() - inicio;
    console.log(`  ✅ Query executada em ${duracao}ms`);
    return duracao < 5000; // Menos de 5 segundos
  }

  async teste7_TesteSSL() {
    console.log('🔸 Teste 7: Configuração SSL');
    
    const client = await this.pool.connect();
    const result = await client.query('SHOW ssl');
    client.release();

    const ssl = result.rows[0].ssl;
    console.log(`  ✅ SSL: ${ssl}`);
    return ssl === 'on';
  }

  async teste8_ValidacaoToken() {
    console.log('🔸 Teste 8: Validação do Token');
    
    const tempoToken = this.token.length;
    const agora = new Date();
    
    console.log(`  ✅ Token: ${tempoToken} caracteres`);
    console.log(`  ✅ Timestamp: ${agora.toISOString()}`);
    
    // Verificar se consegue fazer múltiplas operações
    for (let i = 0; i < 3; i++) {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
    }
    
    console.log(`  ✅ 3 operações consecutivas executadas com sucesso`);
    return true;
  }

  async fecharConexao() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar testes
async function executarTeste() {
  const teste = new TesteConectividadeAurora();
  const sucesso = await teste.executarTestes();
  
  console.log('');
  if (sucesso) {
    console.log('🎉 TODOS OS TESTES PASSARAM - Aurora DSQL 100% operacional');
  } else {
    console.log('⚠️  Alguns testes falharam - verificar configuração');
  }
  
  process.exit(sucesso ? 0 : 1);
}

if (require.main === module) {
  executarTeste().catch(console.error);
}

module.exports = TesteConectividadeAurora;
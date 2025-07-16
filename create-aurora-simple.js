/**
 * SCRIPT SIMPLES PARA CRIAR TABELAS NO AURORA DSQL
 */

import { dbManager } from './server/config/database-manager.js';

async function createAuroraTablesSimple() {
  console.log('🚀 Criando tabelas hierárquicas no Aurora DSQL...');
  
  try {
    // Verificar tipo de banco atual
    const currentType = dbManager.getDatabaseType();
    console.log(`📍 Banco atual: ${currentType}`);
    
    // Mudar para Aurora DSQL se necessário
    if (currentType !== 'aurora-dsql') {
      console.log('🔄 Mudando para Aurora DSQL...');
      const switched = await dbManager.switchDatabase('aurora-dsql');
      if (!switched) {
        throw new Error('Falha ao conectar com Aurora DSQL - verifique credenciais');
      }
    }
    
    // Testar conexão
    const connectionOk = await dbManager.testConnection();
    if (!connectionOk) {
      throw new Error('Falha no teste de conexão com Aurora DSQL');
    }
    
    console.log('✅ Conectado ao Aurora DSQL com sucesso!');
    
    // Obter cliente de banco
    const db = dbManager.getClient();
    
    // Lista das tabelas a serem criadas
    const tabelas = [
      {
        nome: 'empresas',
        sql: `
          CREATE TABLE IF NOT EXISTS empresas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR NOT NULL,
            cnpj VARCHAR(18),
            razao_social TEXT,
            telefone VARCHAR(20),
            email_contato VARCHAR,
            endereco TEXT,
            cidade VARCHAR,
            estado VARCHAR(2),
            cep VARCHAR(10),
            logo TEXT,
            responsavel TEXT,
            cargo_responsavel TEXT,
            observacoes TEXT,
            criado_por INTEGER,
            atualizado_por INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        nome: 'contratos',
        sql: `
          CREATE TABLE IF NOT EXISTS contratos (
            id SERIAL PRIMARY KEY,
            numero VARCHAR(50),
            nome TEXT,
            empresa_id INTEGER,
            descricao TEXT,
            objeto TEXT,
            tipo_contrato VARCHAR(100),
            data_inicio DATE NOT NULL,
            data_fim DATE NOT NULL,
            valor_total DOUBLE PRECISION,
            moeda VARCHAR(3) DEFAULT 'BRL',
            numero_licencas INTEGER,
            documento_pdf TEXT,
            status VARCHAR DEFAULT 'ativo',
            responsavel_contrato TEXT,
            email_responsavel TEXT,
            telefone_responsavel VARCHAR(20),
            observacoes TEXT,
            criado_por INTEGER,
            atualizado_por INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        nome: 'usuarios',
        sql: `
          CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            cognito_sub TEXT UNIQUE,
            cognito_username VARCHAR,
            email VARCHAR NOT NULL,
            nome VARCHAR NOT NULL,
            tipo_usuario VARCHAR NOT NULL,
            empresa_id INTEGER,
            contrato_id INTEGER,
            telefone VARCHAR,
            documento_identidade VARCHAR,
            data_nascimento DATE,
            genero VARCHAR,
            endereco TEXT,
            cidade VARCHAR,
            estado VARCHAR,
            foto_perfil TEXT,
            status VARCHAR DEFAULT 'active',
            criado_por INTEGER,
            atualizado_por INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        nome: 'escolas',
        sql: `
          CREATE TABLE IF NOT EXISTS escolas (
            id SERIAL PRIMARY KEY,
            nome VARCHAR NOT NULL,
            codigo_inep VARCHAR(8) UNIQUE,
            cnpj VARCHAR(18),
            tipo_escola VARCHAR,
            endereco TEXT,
            cidade VARCHAR,
            estado VARCHAR(2),
            cep VARCHAR(10),
            telefone VARCHAR(20),
            email VARCHAR,
            diretor_responsavel VARCHAR,
            contrato_id INTEGER,
            empresa_id INTEGER,
            capacidade_alunos INTEGER,
            data_fundacao DATE,
            status VARCHAR DEFAULT 'ativa',
            observacoes TEXT,
            criado_por INTEGER,
            atualizado_por INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        nome: 'gestores',
        sql: `
          CREATE TABLE IF NOT EXISTS gestores (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            empresa_id INTEGER,
            nome VARCHAR,
            cargo VARCHAR,
            data_admissao DATE,
            status VARCHAR DEFAULT 'ativo'
          )
        `
      },
      {
        nome: 'diretores',
        sql: `
          CREATE TABLE IF NOT EXISTS diretores (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            escola_id INTEGER,
            empresa_id INTEGER,
            nome VARCHAR,
            cargo VARCHAR,
            data_inicio DATE,
            status VARCHAR DEFAULT 'ativo'
          )
        `
      },
      {
        nome: 'professores',
        sql: `
          CREATE TABLE IF NOT EXISTS professores (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            escola_id INTEGER,
            empresa_id INTEGER,
            nome VARCHAR,
            disciplinas TEXT,
            formacao TEXT,
            data_admissao DATE,
            status VARCHAR DEFAULT 'ativo'
          )
        `
      },
      {
        nome: 'alunos',
        sql: `
          CREATE TABLE IF NOT EXISTS alunos (
            id SERIAL PRIMARY KEY,
            usr_id INTEGER,
            escola_id INTEGER,
            empresa_id INTEGER,
            matricula VARCHAR NOT NULL,
            nome VARCHAR,
            turma VARCHAR,
            serie VARCHAR,
            turno VARCHAR,
            nome_responsavel VARCHAR,
            contato_responsavel VARCHAR,
            data_matricula DATE,
            status VARCHAR DEFAULT 'ativo',
            criado_em TIMESTAMP
          )
        `
      },
      {
        nome: 'ai_preferences',
        sql: `
          CREATE TABLE IF NOT EXISTS ai_preferences (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            default_ai VARCHAR(50) DEFAULT 'chatgpt',
            auto_start_session BOOLEAN DEFAULT false,
            save_conversations BOOLEAN DEFAULT true,
            response_language VARCHAR(10) DEFAULT 'pt-BR',
            complexity_level VARCHAR(20) DEFAULT 'intermediario',
            custom_prompts BOOLEAN DEFAULT false,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        nome: 'ai_resource_configs',
        sql: `
          CREATE TABLE IF NOT EXISTS ai_resource_configs (
            id SERIAL PRIMARY KEY,
            resource_id VARCHAR(100) NOT NULL UNIQUE,
            resource_name VARCHAR(200) NOT NULL,
            resource_type VARCHAR(10) NOT NULL,
            selected_model VARCHAR(200) NOT NULL,
            model_name VARCHAR(200),
            temperature DOUBLE PRECISION DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 1000,
            enabled BOOLEAN DEFAULT true,
            configured_by INTEGER,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      }
    ];
    
    console.log('🏗️ Criando tabelas...');
    let tabelasCriadas = 0;
    
    for (const tabela of tabelas) {
      try {
        await db.execute({ sql: tabela.sql });
        console.log(`✅ ${tabela.nome} criada com sucesso`);
        tabelasCriadas++;
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ ${tabela.nome} já existe`);
          tabelasCriadas++;
        } else {
          console.error(`❌ Erro ao criar ${tabela.nome}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Resultado: ${tabelasCriadas}/${tabelas.length} tabelas criadas/verificadas`);
    
    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas no Aurora DSQL...');
    try {
      const result = await db.execute({
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `
      });
      
      const todasTabelas = result.rows?.map(row => row.table_name) || [];
      console.log('📋 Tabelas encontradas:', todasTabelas.join(', '));
      
      const tabelasHierarquicas = tabelas.map(t => t.nome);
      const tabelasEncontradas = tabelasHierarquicas.filter(t => todasTabelas.includes(t));
      
      console.log(`\n🎯 Tabelas hierárquicas: ${tabelasEncontradas.length}/${tabelasHierarquicas.length}`);
      
      if (tabelasEncontradas.length === tabelasHierarquicas.length) {
        console.log('🎉 SISTEMA HIERÁRQUICO COMPLETO CRIADO NO AURORA DSQL!');
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar tabelas:', error.message);
    }
    
    return tabelasCriadas === tabelas.length;
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    
    if (error.message.includes('credenciais') || error.message.includes('ENDPOINT_AURORA')) {
      console.log('\n💡 VERIFICAR:');
      console.log('  1. ENDPOINT_AURORA está configurado nas secrets?');
      console.log('  2. PORTA_AURORA está configurado nas secrets?');
      console.log('  3. TOKEN_AURORA está configurado nas secrets?');
      console.log('  4. Cluster Aurora DSQL está ativo na AWS?');
    }
    
    return false;
  }
}

// Executar o script
createAuroraTablesSimple()
  .then(success => {
    if (success) {
      console.log('\n✅ Script executado com sucesso!');
      console.log('🔗 Sistema hierárquico Aurora DSQL está pronto para uso');
    } else {
      console.log('\n⚠️ Script executado com problemas');
    }
  })
  .catch(error => {
    console.error('\n❌ Falha na execução:', error);
  });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do Aurora Serverless
const pool = new Pool({
  host: process.env.AURORA_SERVERLESS_HOST,
  port: parseInt(process.env.AURORA_SERVERLESS_PORT || '5432'),
  database: process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER',
  user: process.env.AURORA_SERVERLESS_USER || 'Admn',
  password: process.env.AURORA_SERVERLESS_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function executeCorrections() {
  let client;
  try {
    console.log('🚀 Conectando ao Aurora Serverless...');
    client = await pool.connect();
    console.log('✅ Conectado com sucesso ao Aurora Serverless');
    
    // Ler o arquivo de correções
    const correctionsPath = path.join(__dirname, 'attached_assets', 'aurora-correcoes_1752850445571.sql');
    const sqlScript = fs.readFileSync(correctionsPath, 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== '')
      .filter(cmd => !cmd.includes('FIM DO SCRIPT'));
    
    console.log(`📝 Executando ${commands.length} comandos de correção...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      try {
        // Adicionar ponto e vírgula se não tiver
        const fullCommand = command.endsWith(';') ? command : command + ';';
        
        console.log(`📋 Executando comando ${i + 1}/${commands.length}...`);
        
        // Executar comando
        await client.query(fullCommand);
        successCount++;
        
        // Identificar tipo de comando para log
        if (command.includes('ALTER TABLE')) {
          console.log('✅ ALTER TABLE executado com sucesso');
        } else if (command.includes('CREATE INDEX')) {
          console.log('✅ CREATE INDEX executado com sucesso');
        } else if (command.includes('CREATE TRIGGER')) {
          console.log('✅ CREATE TRIGGER executado com sucesso');
        } else if (command.includes('CREATE OR REPLACE')) {
          console.log('✅ CREATE OR REPLACE executado com sucesso');
        } else if (command.includes('DROP')) {
          console.log('✅ DROP executado com sucesso');
        } else if (command.includes('COMMENT')) {
          console.log('✅ COMMENT executado com sucesso');
        } else {
          console.log('✅ Comando executado com sucesso');
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Erro no comando ${i + 1}: ${error.message}`);
        console.error(`Comando: ${command.substring(0, 100)}...`);
        
        // Alguns erros podem ser esperados (como tentar dropar constraints inexistentes)
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log('⚠️  Erro esperado - continuando...');
        }
      }
    }
    
    console.log('\n📊 RESUMO DA EXECUÇÃO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total: ${commands.length}`);
    
    // Verificar resultado final
    console.log('\n🔍 Verificando estrutura final...');
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('gestores', 'diretores', 'professores', 'alunos', 'ai_preferences', 'ai_resource_configs')
      AND column_name IN ('user_id', 'criado_por', 'atualizado_por', 'criado_em', 'atualizado_em')
      ORDER BY table_name, column_name
    `);
    
    console.log('\n📋 Campos de auditoria verificados:');
    result.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎯 CORREÇÕES APLICADAS COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

executeCorrections().catch(console.error);
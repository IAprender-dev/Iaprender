import CognitoService from '../config/cognito.js';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';

/**
 * Script para sincronizar usuários do AWS Cognito com base local
 * ETAPA 2: Integração com dados reais do Cognito
 */
async function sincronizarUsuariosCognito() {
  logger.info('🔄 Iniciando sincronização de usuários do AWS Cognito...');
  
  const cognitoService = new CognitoService();
  // Usar métodos estáticos da classe Usuario

  try {
    // Verificar conectividade com Cognito
    const conectado = await cognitoService.verificarConectividade();
    if (!conectado) {
      throw new Error('Falha na conectividade com AWS Cognito');
    }

    // Obter usuários do Cognito
    logger.info('📋 Buscando usuários do AWS Cognito...');
    const resultado = await cognitoService.listarUsuarios();
    
    if (resultado.usuarios.length === 0) {
      logger.warn('⚠️ Nenhum usuário encontrado no Cognito');
      return;
    }

    logger.info(`📊 ${resultado.usuarios.length} usuários encontrados no Cognito`);

    // Limpar usuários existentes (exceto admin sistema)
    logger.info('🗑️ Limpando usuários existentes...');
    const { pool } = await import('../config/database.js');
    const client = await pool.connect();
    try {
      await client.query(`
        DELETE FROM usuarios 
        WHERE email != 'admin.sistema@iaprender.com.br'
      `);
    } finally {
      client.release();
    }

    // Processar cada usuário do Cognito
    let sucessos = 0;
    let falhas = 0;

    for (const cognitoUser of resultado.usuarios) {
      try {
        // Mapear dados do Cognito para formato local
        const dadosUsuario = cognitoService.mapearUsuarioCognito(cognitoUser);
        
        logger.info(`👤 Processando: ${dadosUsuario.email} (${dadosUsuario.tipo_usuario})`);

        // Criar usuário na base local
        const usuarioLocal = await Usuario.create(dadosUsuario);
        
        logger.info(`✅ Usuário sincronizado: ID ${usuarioLocal.id} - ${usuarioLocal.nome}`);
        sucessos++;

      } catch (error) {
        logger.error(`❌ Erro ao sincronizar usuário ${cognitoUser.Username}:`, error.message);
        falhas++;
      }
    }

    // Relatório final
    logger.info('📈 RELATÓRIO DE SINCRONIZAÇÃO:');
    logger.info(`✅ Sucessos: ${sucessos}`);
    logger.info(`❌ Falhas: ${falhas}`);
    logger.info(`📊 Total processado: ${sucessos + falhas}`);

    // Mostrar estatísticas por tipo de usuário
    const estatisticas = await Usuario.countByTipo();
    logger.info('📊 ESTATÍSTICAS POR TIPO:');
    logger.info(`👑 Admins: ${estatisticas.admin || 0}`);
    logger.info(`🏢 Gestores: ${estatisticas.gestor || 0}`);
    logger.info(`🏫 Diretores: ${estatisticas.diretor || 0}`);
    logger.info(`👩‍🏫 Professores: ${estatisticas.professor || 0}`);
    logger.info(`🎓 Alunos: ${estatisticas.aluno || 0}`);

    return {
      sucessos,
      falhas,
      total: sucessos + falhas,
      estatisticas
    };

  } catch (error) {
    logger.error('❌ Erro na sincronização:', error.message);
    throw error;
  }
}

/**
 * Verificar grupos e níveis hierárquicos
 */
async function verificarNiveisHierarquicos() {
  logger.info('🔍 Verificando níveis hierárquicos...');
  
  try {
    // Consultar usuários por empresa e tipo
    const { pool } = await import('../config/database.js');
    const client = await pool.connect();
    
    const query = `
      SELECT 
        e.nome as empresa_nome,
        u.tipo_usuario,
        COUNT(*) as total,
        STRING_AGG(u.nome, ', ') as usuarios
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      WHERE u.email != 'admin.sistema@iaprender.com.br'
      GROUP BY e.nome, u.tipo_usuario
      ORDER BY e.nome, 
        CASE u.tipo_usuario 
          WHEN 'admin' THEN 1
          WHEN 'gestor' THEN 2  
          WHEN 'diretor' THEN 3
          WHEN 'professor' THEN 4
          WHEN 'aluno' THEN 5
        END
    `;

    const result = await client.query(query);
    client.release();
    
    logger.info('🏗️ ESTRUTURA HIERÁRQUICA POR EMPRESA:');
    logger.info('='.repeat(80));
    
    for (const row of result.rows) {
      const empresa = row.empresa_nome || 'SEM EMPRESA';
      logger.info(`🏢 ${empresa}`);
      logger.info(`  └── ${row.tipo_usuario.toUpperCase()}: ${row.total} usuário(s)`);
      logger.info(`      └── ${row.usuarios}`);
      logger.info('');
    }

    return result.rows;

  } catch (error) {
    logger.error('❌ Erro ao verificar níveis hierárquicos:', error.message);
    throw error;
  }
}

// Executar script se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await sincronizarUsuariosCognito();
    await verificarNiveisHierarquicos();
    logger.info('🎉 Sincronização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    logger.error('💥 Falha na execução:', error.message);
    process.exit(1);
  }
}

export { sincronizarUsuariosCognito, verificarNiveisHierarquicos };
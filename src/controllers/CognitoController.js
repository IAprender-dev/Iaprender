import CognitoService from '../config/cognito.js';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';

/**
 * Controller para integração com AWS Cognito
 * Responsável por sincronizar usuários e grupos do Cognito com base local
 */
class CognitoController {
  constructor() {
    this.cognitoService = new CognitoService();
  }

  /**
   * Listar usuários do Cognito com grupos
   */
  async listarUsuariosCognito(req, res) {
    try {
      logger.info('📋 Solicitação para listar usuários do Cognito');
      
      const { limit = 60, paginationToken } = req.query;
      
      // Verificar conectividade
      const conectado = await this.cognitoService.verificarConectividade();
      if (!conectado) {
        return res.status(503).json({
          erro: 'Serviço AWS Cognito indisponível',
          message: 'Não foi possível conectar ao AWS Cognito. Verifique as credenciais.'
        });
      }

      // Obter usuários do Cognito
      const resultado = await this.cognitoService.listarUsuarios(limit, paginationToken);
      
      // Processar cada usuário para incluir informações de grupos e mapeamento
      const usuariosProcessados = resultado.usuarios.map(cognitoUser => {
        const dadosMapeados = this.cognitoService.mapearUsuarioCognito(cognitoUser);
        
        return {
          cognito_username: cognitoUser.Username,
          cognito_status: cognitoUser.UserStatus,
          cognito_created: cognitoUser.UserCreateDate,
          cognito_last_modified: cognitoUser.UserLastModifiedDate,
          email: dadosMapeados.email,
          nome: dadosMapeados.nome,
          tipo_usuario: dadosMapeados.tipo_usuario,
          empresa_id: dadosMapeados.empresa_id,
          telefone: dadosMapeados.telefone,
          atributos_originais: cognitoUser.Attributes || [],
          grupos: cognitoUser.Groups || []
        };
      });

      res.json({
        sucesso: true,
        usuarios: usuariosProcessados,
        total: usuariosProcessados.length,
        nextToken: resultado.nextToken,
        metadados: {
          limite_por_pagina: limit,
          cognito_conectado: conectado,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('❌ Erro ao listar usuários do Cognito:', error.message);
      res.status(500).json({
        erro: 'Erro interno do servidor',
        message: error.message,
        codigo: 'COGNITO_LIST_ERROR'
      });
    }
  }

  /**
   * Sincronizar usuários do Cognito com base local
   */
  async sincronizarUsuarios(req, res) {
    try {
      logger.info('🔄 Iniciando sincronização de usuários Cognito → Base Local');
      
      const { substituir_existentes = false } = req.body;
      
      // Verificar conectividade
      const conectado = await this.cognitoService.verificarConectividade();
      if (!conectado) {
        return res.status(503).json({
          erro: 'Serviço AWS Cognito indisponível',
          message: 'Não foi possível conectar ao AWS Cognito para sincronização.'
        });
      }

      // Obter usuários do Cognito
      const resultado = await this.cognitoService.listarUsuarios();
      
      if (resultado.usuarios.length === 0) {
        return res.json({
          sucesso: true,
          message: 'Nenhum usuário encontrado no Cognito para sincronizar',
          estatisticas: { sucessos: 0, falhas: 0, total: 0 }
        });
      }

      // Limpar usuários existentes se solicitado (exceto admin sistema)
      if (substituir_existentes) {
        logger.info('🗑️ Substituindo usuários existentes...');
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
      }

      // Processar cada usuário
      let sucessos = 0;
      let falhas = 0;
      const detalhes = [];

      for (const cognitoUser of resultado.usuarios) {
        try {
          const dadosUsuario = this.cognitoService.mapearUsuarioCognito(cognitoUser);
          
          // Verificar se usuário já existe
          const usuarioExistente = await Usuario.findByEmail(dadosUsuario.email);
          
          let usuarioLocal;
          if (usuarioExistente && !substituir_existentes) {
            // Atualizar dados existentes
            usuarioLocal = await Usuario.update(usuarioExistente.id, {
              nome: dadosUsuario.nome,
              tipo_usuario: dadosUsuario.tipo_usuario,
              telefone: dadosUsuario.telefone,
              empresa_id: dadosUsuario.empresa_id
            });
            detalhes.push({
              email: dadosUsuario.email,
              acao: 'atualizado',
              tipo_usuario: dadosUsuario.tipo_usuario
            });
          } else {
            // Criar novo usuário
            usuarioLocal = await Usuario.create(dadosUsuario);
            detalhes.push({
              email: dadosUsuario.email,
              acao: 'criado',
              tipo_usuario: dadosUsuario.tipo_usuario
            });
          }
          
          sucessos++;
          
        } catch (error) {
          logger.error(`❌ Erro ao sincronizar ${cognitoUser.Username}:`, error.message);
          falhas++;
          detalhes.push({
            email: cognitoUser.Username,
            acao: 'erro',
            erro: error.message
          });
        }
      }

      // Obter estatísticas finais
      const estatisticasFinais = await Usuario.countByTipo();

      res.json({
        sucesso: true,
        message: `Sincronização concluída: ${sucessos} sucessos, ${falhas} falhas`,
        estatisticas: {
          sucessos,
          falhas,
          total: sucessos + falhas,
          tipos_usuario: estatisticasFinais
        },
        detalhes
      });

    } catch (error) {
      logger.error('❌ Erro na sincronização:', error.message);
      res.status(500).json({
        erro: 'Erro na sincronização',
        message: error.message,
        codigo: 'COGNITO_SYNC_ERROR'
      });
    }
  }

  /**
   * Obter detalhes de um usuário específico do Cognito
   */
  async obterUsuarioCognito(req, res) {
    try {
      const { username } = req.params;
      
      if (!username) {
        return res.status(400).json({
          erro: 'Username obrigatório',
          message: 'Parâmetro username é obrigatório na URL'
        });
      }

      const usuarioCognito = await this.cognitoService.obterUsuario(username);
      const dadosMapeados = this.cognitoService.mapearUsuarioCognito(usuarioCognito);

      res.json({
        sucesso: true,
        usuario_cognito: usuarioCognito,
        dados_mapeados: dadosMapeados
      });

    } catch (error) {
      logger.error(`❌ Erro ao obter usuário ${req.params.username}:`, error.message);
      res.status(404).json({
        erro: 'Usuário não encontrado',
        message: error.message,
        codigo: 'COGNITO_USER_NOT_FOUND'
      });
    }
  }

  /**
   * Verificar status da conectividade com Cognito
   */
  async verificarStatus(req, res) {
    try {
      const conectado = await this.cognitoService.verificarConectividade();
      
      res.json({
        sucesso: true,
        cognito_conectado: conectado,
        user_pool_id: this.cognitoService.userPoolId,
        regiao: process.env.AWS_REGION || 'us-east-1',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Erro ao verificar status do Cognito:', error.message);
      res.status(500).json({
        erro: 'Erro ao verificar status',
        message: error.message,
        cognito_conectado: false
      });
    }
  }

  /**
   * Obter estatísticas de sincronização
   */
  async obterEstatisticas(req, res) {
    try {
      // Estatísticas locais
      const estatisticasLocais = await Usuario.countByTipo();
      
      // Tentar obter estatísticas do Cognito
      let estatisticasCognito = null;
      try {
        const resultado = await this.cognitoService.listarUsuarios(1);
        estatisticasCognito = {
          total_usuarios: resultado.total,
          cognito_conectado: true
        };
      } catch (error) {
        estatisticasCognito = {
          total_usuarios: 0,
          cognito_conectado: false,
          erro: error.message
        };
      }

      res.json({
        sucesso: true,
        estatisticas_locais: estatisticasLocais,
        estatisticas_cognito: estatisticasCognito,
        ultima_atualizacao: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas:', error.message);
      res.status(500).json({
        erro: 'Erro ao obter estatísticas',
        message: error.message
      });
    }
  }
}

export default CognitoController;
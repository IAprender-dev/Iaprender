import express from 'express';
import CognitoController from '../controllers/CognitoController.js';
import logger from '../utils/logger.js';

const router = express.Router();
const cognitoController = new CognitoController();

/**
 * Rotas para integração com AWS Cognito
 * Endpoints para listar usuários, grupos e sincronização
 */

// GET /api/cognito/usuarios - Listar usuários do Cognito com grupos
router.get('/usuarios', async (req, res) => {
  try {
    await cognitoController.listarUsuariosCognito(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /cognito/usuarios:', error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/cognito/grupos - Listar todos os grupos do User Pool
router.get('/grupos', async (req, res) => {
  try {
    const cognitoService = cognitoController.cognitoService;
    
    const grupos = await cognitoService.listarGrupos();
    
    res.json({
      sucesso: true,
      grupos: grupos.map(grupo => ({
        nome: grupo.GroupName,
        descricao: grupo.Description || '',
        criado_em: grupo.CreationDate,
        ultima_modificacao: grupo.LastModifiedDate,
        precedencia: grupo.Precedence || 0,
        role_arn: grupo.RoleArn || null
      })),
      total: grupos.length,
      user_pool_id: cognitoService.userPoolId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Erro ao listar grupos:', error.message);
    res.status(500).json({
      erro: 'Erro ao listar grupos',
      message: error.message,
      codigo: 'COGNITO_GROUPS_ERROR'
    });
  }
});

// GET /api/cognito/usuario/:username - Obter detalhes de usuário específico
router.get('/usuario/:username', async (req, res) => {
  try {
    await cognitoController.obterUsuarioCognito(req, res);
  } catch (error) {
    logger.error(`❌ Erro na rota /cognito/usuario/${req.params.username}:`, error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/cognito/usuario/:username/grupos - Obter grupos de usuário específico
router.get('/usuario/:username/grupos', async (req, res) => {
  try {
    const { username } = req.params;
    const cognitoService = cognitoController.cognitoService;
    
    if (!username) {
      return res.status(400).json({
        erro: 'Username obrigatório',
        message: 'Parâmetro username é obrigatório'
      });
    }

    const grupos = await cognitoService.obterGruposDoUsuario(username);
    
    res.json({
      sucesso: true,
      username,
      grupos: grupos.map(grupo => ({
        nome: grupo.GroupName,
        descricao: grupo.Description || '',
        precedencia: grupo.Precedence || 0,
        tipo_usuario_mapeado: cognitoService.groupMappings[grupo.GroupName] || 'aluno'
      })),
      total_grupos: grupos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`❌ Erro ao obter grupos do usuário ${req.params.username}:`, error.message);
    res.status(404).json({
      erro: 'Erro ao obter grupos do usuário',
      message: error.message,
      codigo: 'COGNITO_USER_GROUPS_ERROR'
    });
  }
});

// POST /api/cognito/sincronizar - Sincronizar usuários Cognito → Base Local
router.post('/sincronizar', async (req, res) => {
  try {
    await cognitoController.sincronizarUsuarios(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /cognito/sincronizar:', error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/cognito/status - Verificar status da conectividade
router.get('/status', async (req, res) => {
  try {
    await cognitoController.verificarStatus(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /cognito/status:', error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/cognito/estatisticas - Obter estatísticas de sincronização
router.get('/estatisticas', async (req, res) => {
  try {
    await cognitoController.obterEstatisticas(req, res);
  } catch (error) {
    logger.error('❌ Erro na rota /cognito/estatisticas:', error.message);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// GET /api/cognito/usuarios-grupos - Obter lista completa: usuários + grupos
router.get('/usuarios-grupos', async (req, res) => {
  try {
    const cognitoService = cognitoController.cognitoService;
    
    // Verificar conectividade
    const conectado = await cognitoService.verificarConectividade();
    if (!conectado) {
      return res.status(503).json({
        erro: 'Serviço AWS Cognito indisponível',
        message: 'Não foi possível conectar ao AWS Cognito'
      });
    }

    // Obter usuários e grupos em paralelo
    const [usuarios, grupos] = await Promise.all([
      cognitoService.listarUsuarios(),
      cognitoService.listarGrupos()
    ]);

    // Processar dados para response consolidada
    const usuariosProcessados = usuarios.usuarios.map(user => {
      const dadosMapeados = cognitoService.mapearUsuarioCognito(user);
      
      return {
        username: user.Username,
        email: dadosMapeados.email,
        nome: dadosMapeados.nome,
        status: user.UserStatus,
        criado_em: user.UserCreateDate,
        ultima_modificacao: user.UserLastModifiedDate,
        grupos: user.Groups?.map(g => ({
          nome: g.GroupName,
          descricao: g.Description || '',
          precedencia: g.Precedence || 0
        })) || [],
        tipo_usuario_local: dadosMapeados.tipo_usuario,
        empresa_id_sugerida: dadosMapeados.empresa_id
      };
    });

    res.json({
      sucesso: true,
      resumo: {
        total_usuarios: usuariosProcessados.length,
        total_grupos: grupos.length,
        user_pool_id: cognitoService.userPoolId,
        timestamp: new Date().toISOString()
      },
      usuarios: usuariosProcessados,
      grupos_disponiveis: grupos.map(grupo => ({
        nome: grupo.GroupName,
        descricao: grupo.Description || '',
        precedencia: grupo.Precedence || 0,
        tipo_usuario_mapeado: cognitoService.groupMappings[grupo.GroupName] || 'aluno'
      })),
      mapeamento_grupos: cognitoService.groupMappings
    });

  } catch (error) {
    logger.error('❌ Erro ao obter usuários e grupos:', error.message);
    res.status(500).json({
      erro: 'Erro ao obter dados do Cognito',
      message: error.message,
      codigo: 'COGNITO_FULL_DATA_ERROR'
    });
  }
});

export default router;
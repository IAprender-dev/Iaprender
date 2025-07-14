import { Router, Request, Response, NextFunction } from 'express';
import { HierarchicalFilterService } from '../services/HierarchicalFilterService-v2.js';
import { CognitoSyncService } from '../services/CognitoSyncService.js';
import AuthMiddleware from '../middleware/AuthMiddleware.js';

/**
 * ROTAS DA API - EQUIVALENTE AO api_routes.py
 * 
 * Arquivo equivalente ao Python:
 * from flask import Blueprint, jsonify, g
 * from middleware.auth_middleware import AuthMiddleware
 * from services.hierarchical_filter import HierarchicalFilterService
 * from services.cognito_sync import CognitoSyncService
 * 
 * api_bp = Blueprint('api', __name__)
 * auth = AuthMiddleware()
 */

const router = Router();
const authMiddleware = new AuthMiddleware();

/**
 * MIDDLEWARE GLOBAL PARA EXTRAÇÃO DE DADOS DO USUÁRIO
 * Equivalente ao Flask 'g' object para armazenar dados do usuário
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    cognitoSub: string;
    email: string;
    nome: string;
    tipoUsuario: string;
    empresaId: number;
    escolaId: number | null;
    status: string;
    grupos: string[];
  };
  userEmpresaId?: number;
  userGrupos?: string[];
}

/**
 * MIDDLEWARE PARA EXTRAIR DADOS DO USUÁRIO AUTENTICADO
 * Simula o comportamento do Flask 'g' object
 */
function extractUserContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    req.userEmpresaId = req.user.empresaId;
    req.userGrupos = req.user.grupos;
  }
  next();
}

/**
 * ROTA 1: SINCRONIZAÇÃO COGNITO
 * Equivalente ao Python:
 * 
 * @api_bp.route('/sync/cognito', methods=['POST'])
 * @auth.require_auth(required_role='Gestores')
 * def sync_cognito():
 *     try:
 *         sync_service = CognitoSyncService()
 *         sync_service.sync_all_users()
 *         return jsonify({'message': 'Sincronização concluída com sucesso'})
 *     except Exception as e:
 *         return jsonify({'error': str(e)}), 500
 */
router.post('/sync/cognito', 
  authMiddleware.requireAuth(['Gestores']),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔄 Iniciando sincronização Cognito...');
      
      const syncService = new CognitoSyncService();
      await syncService.syncAllUsers();
      
      console.log('✅ Sincronização concluída com sucesso');
      
      res.json({ 
        message: 'Sincronização concluída com sucesso',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro na sincronização Cognito:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 2: DADOS DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/empresas', methods=['GET'])
 * @auth.require_auth()
 * def get_empresas():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     empresa = filter_service.get_filtered_data('empresas', {'id': g.user_empresa_id})
 *     return jsonify(empresa)
 */
router.get('/empresas',
  authMiddleware.requireAuth(),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`🏢 Buscando dados da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const empresa = await filterService.getFilteredData('empresas', { id: req.userEmpresaId });
      
      console.log(`✅ Dados da empresa encontrados: ${empresa?.length || 0} registros`);
      
      res.json({
        data: empresa,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados da empresa:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 3: CONTRATOS DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/contratos', methods=['GET'])
 * @auth.require_auth()
 * def get_contratos():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     contratos = filter_service.get_contratos()
 *     return jsonify(contratos)
 */
router.get('/contratos',
  authMiddleware.requireAuth(),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`📋 Buscando contratos da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const contratos = await filterService.getContratos();
      
      console.log(`✅ Contratos encontrados: ${contratos?.length || 0} registros`);
      
      res.json({
        data: contratos,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar contratos:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 4: USUÁRIOS DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/usuarios', methods=['GET'])
 * @auth.require_auth()
 * def get_usuarios():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     usuarios = filter_service.get_usuarios_by_role()
 *     return jsonify(usuarios)
 */
router.get('/usuarios',
  authMiddleware.requireAuth(),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`👥 Buscando usuários da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const usuarios = await filterService.getUsuariosByRole();
      
      console.log(`✅ Usuários encontrados: ${usuarios?.length || 0} registros`);
      
      res.json({
        data: usuarios,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 5: GESTORES DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/gestores', methods=['GET'])
 * @auth.require_auth(required_role='Gestores')
 * def get_gestores():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     gestores = filter_service.get_gestores()
 *     return jsonify(gestores)
 */
router.get('/gestores',
  authMiddleware.requireAuth(['Admin', 'Gestores']),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`👔 Buscando gestores da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const gestores = await filterService.getGestores();
      
      console.log(`✅ Gestores encontrados: ${gestores?.length || 0} registros`);
      
      res.json({
        data: gestores,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar gestores:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 6: DIRETORES DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/diretores', methods=['GET'])
 * @auth.require_auth(required_role='Diretores')
 * def get_diretores():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     diretores = filter_service.get_diretores()
 *     return jsonify(diretores)
 */
router.get('/diretores',
  authMiddleware.requireAuth(['Admin', 'Diretores']),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`🏫 Buscando diretores da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const diretores = await filterService.getDiretores();
      
      console.log(`✅ Diretores encontrados: ${diretores?.length || 0} registros`);
      
      res.json({
        data: diretores,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar diretores:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 7: PROFESSORES DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/professores', methods=['GET'])
 * @auth.require_auth()
 * def get_professores():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     professores = filter_service.get_professores()
 *     return jsonify(professores)
 */
router.get('/professores',
  authMiddleware.requireAuth(),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`👩‍🏫 Buscando professores da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const professores = await filterService.getProfessores();
      
      console.log(`✅ Professores encontrados: ${professores?.length || 0} registros`);
      
      res.json({
        data: professores,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar professores:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * ROTA 8: ALUNOS DA EMPRESA
 * Equivalente ao Python:
 * 
 * @api_bp.route('/alunos', methods=['GET'])
 * @auth.require_auth()
 * def get_alunos():
 *     filter_service = HierarchicalFilterService(g.user_empresa_id, g.user_grupos)
 *     alunos = filter_service.get_alunos()
 *     return jsonify(alunos)
 */
router.get('/alunos',
  authMiddleware.requireAuth(),
  extractUserContext,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log(`🎓 Buscando alunos da empresa: ${req.userEmpresaId}`);
      
      if (!req.userEmpresaId || !req.userGrupos) {
        return res.status(400).json({ 
          error: 'Dados do usuário não encontrados',
          timestamp: new Date().toISOString()
        });
      }
      
      const filterService = new HierarchicalFilterService(req.userEmpresaId, req.userGrupos);
      const alunos = await filterService.getAlunos();
      
      console.log(`✅ Alunos encontrados: ${alunos?.length || 0} registros`);
      
      res.json({
        data: alunos,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar alunos:', error);
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export { router as apiRoutes, AuthenticatedRequest };
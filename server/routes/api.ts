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

export { router as apiRoutes, AuthenticatedRequest };
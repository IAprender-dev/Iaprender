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

export { router as apiRoutes, AuthenticatedRequest };
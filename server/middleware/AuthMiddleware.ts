/**
 * AUTH MIDDLEWARE - IAPRENDER
 * 
 * Middleware de autenticação baseado na implementação Python original
 * Responsável por:
 * - Verificação de tokens JWT
 * - Busca de dados do usuário no banco local
 * - Controle de acesso por roles/grupos
 * - Contexto de usuário para requisições
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import CognitoSyncService from '../services/CognitoSyncService';

// Extender interface Request para incluir dados do usuário
declare global {
  namespace Express {
    interface Request {
      currentUser?: any;
      userEmpresaId?: number | null;
      userGrupos?: string[];
    }
  }
}

export interface AuthenticatedUser {
  id: number;
  cognitoSub: string;
  email: string;
  nome: string;
  tipoUsuario: string;
  empresaId: number | null;
  escolaId: number | null;
  status: string;
  grupos: string[];
}

/**
 * CLASSE AUTHMIDDLEWARE
 * Equivalente à classe AuthMiddleware Python
 */
export class AuthMiddleware {
  private cognitoSync: CognitoSyncService;

  /**
   * CONSTRUTOR
   * Equivalente ao __init__() Python:
   * 
   * def __init__(self):
   *     self.db = DatabaseManager()
   *     self.cognito_sync = CognitoSyncService()
   */
  constructor() {
    // Inicializar CognitoSyncService (DatabaseManager é abstrato via Drizzle)
    this.cognitoSync = new CognitoSyncService();
    
    console.log('🔐 AuthMiddleware inicializado com CognitoSyncService');
  }
}

export default AuthMiddleware;
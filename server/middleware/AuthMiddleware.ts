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

  /**
   * DECORATOR PARA REQUERER AUTENTICAÇÃO
   * Equivalente ao require_auth() Python:
   * 
   * def require_auth(self, required_role=None):
   *     def decorator(f):
   *         @wraps(f)
   *         def decorated_function(*args, **kwargs):
   *             try:
   *                 # Verificar token JWT
   *                 token = self._extract_token()
   *                 if not token:
   *                     return jsonify({'error': 'Token não fornecido'}), 401
   *                 
   *                 # Decodificar token
   *                 user_data = self._decode_token(token)
   *                 
   *                 # Buscar dados do usuário local
   *                 user = self._get_user_from_db(user_data['sub'])
   *                 if not user:
   *                     return jsonify({'error': 'Usuário não encontrado'}), 404
   *                 
   *                 # Verificar role se necessário
   *                 if required_role and required_role not in user['grupos']:
   *                     return jsonify({'error': 'Acesso negado'}), 403
   *                 
   *                 # Adicionar dados do usuário ao contexto
   *                 g.current_user = user
   *                 g.user_empresa_id = user['empresa_id']
   *                 g.user_grupos = user['grupos']
   *                 
   *                 return f(*args, **kwargs)
   *                 
   *             except Exception as e:
   *                 return jsonify({'error': f'Erro de autenticação: {str(e)}'}), 401
   *         
   *         return decorated_function
   *     return decorator
   */
  public requireAuth(requiredRole?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log(`🔐 Verificando autenticação${requiredRole ? ` (role requerida: ${requiredRole})` : ''}`);
        
        // Verificar token JWT
        const token = this._extractToken(req);
        if (!token) {
          console.log('❌ Token não fornecido');
          return res.status(401).json({ error: 'Token não fornecido' });
        }
        
        // Decodificar token
        const userData = this._decodeToken(token);
        if (!userData || !userData.sub) {
          console.log('❌ Token inválido');
          return res.status(401).json({ error: 'Token inválido' });
        }
        
        // Buscar dados do usuário local
        const user = await this._getUserFromDb(userData.sub);
        if (!user) {
          console.log(`❌ Usuário não encontrado: ${userData.sub}`);
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar role se necessário
        if (requiredRole && !user.grupos.includes(requiredRole)) {
          console.log(`❌ Acesso negado. Role requerida: ${requiredRole}, Grupos do usuário: ${user.grupos.join(', ')}`);
          return res.status(403).json({ error: 'Acesso negado' });
        }
        
        // Adicionar dados do usuário ao contexto da requisição (equivalente ao g. do Flask)
        req.currentUser = user;
        req.userEmpresaId = user.empresaId;
        req.userGrupos = user.grupos;
        
        console.log(`✅ Usuário autenticado: ${user.nome} (${user.email}) - Grupos: ${user.grupos.join(', ')}`);
        
        // Continuar para o próximo middleware/rota
        next();
        
      } catch (error) {
        console.error('❌ Erro de autenticação:', error);
        return res.status(401).json({ 
          error: `Erro de autenticação: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
        });
      }
    };
  }

  /**
   * EXTRAI TOKEN DO HEADER AUTHORIZATION
   * Equivalente ao _extract_token() Python:
   * 
   * def _extract_token(self):
   *     auth_header = request.headers.get('Authorization')
   *     if auth_header and auth_header.startswith('Bearer '):
   *         return auth_header.split(' ')[1]
   *     return None
   */
  private _extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log(`🔍 Token extraído do header Authorization: ${token ? 'presente' : 'ausente'}`);
      return token;
    }
    
    console.log('❌ Header Authorization não encontrado ou formato inválido');
    return null;
  }

  /**
   * DECODIFICA TOKEN JWT
   * Equivalente ao _decode_token() Python:
   * 
   * def _decode_token(self, token):
   *     # Aqui você implementaria a validação real do token Cognito
   *     # Por enquanto, retornamos dados mock
   *     return jwt.decode(token, options={"verify_signature": False})
   */
  private _decodeToken(token: string): any {
    try {
      // Implementação simplificada - decodifica sem verificar assinatura
      // Em produção, você implementaria validação real do token Cognito
      const base64Payload = token.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const decoded = JSON.parse(payload);
      
      console.log(`🔓 Token decodificado para usuário: ${decoded.sub || 'sub não encontrado'}`);
      return decoded;
      
    } catch (error) {
      console.error('❌ Erro ao decodificar token:', error);
      throw new Error('Token inválido ou malformado');
    }
  }
}

export default AuthMiddleware;
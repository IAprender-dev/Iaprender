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
import { usuarios as users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { CognitoJWTVerifier } from '../services/CognitoJWTVerifier';
import jwt from 'jsonwebtoken';
import { SecretsManager } from '../config/secrets';

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
  private cognitoVerifier: CognitoJWTVerifier;
  private jwtSecret: string;

  /**
   * CONSTRUTOR
   * Equivalente ao __init__() Python:
   * 
   * def __init__(self):
   *     self.db = DatabaseManager()
   *     self.cognito_sync = CognitoSyncService()
   */
  constructor() {
    // Inicializar verificador JWT seguro
    this.cognitoVerifier = new CognitoJWTVerifier();
    
    // Obter JWT secret das variáveis de ambiente
    const jwtConfig = SecretsManager.getJWTSecrets();
    this.jwtSecret = jwtConfig.jwt_secret;
    
    // Validar que JWT_SECRET não está usando valor padrão em produção
    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'test_secret_key_iaprender_2025') {
      throw new Error('JWT_SECRET não pode usar valor padrão em produção');
    }
    
    console.log('🔐 AuthMiddleware inicializado com verificação JWT segura');
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
  public requireAuth(requiredRoles?: string | string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const rolesStr = requiredRoles 
          ? (Array.isArray(requiredRoles) ? requiredRoles.join(' ou ') : requiredRoles)
          : '';
        console.log(`🔐 Verificando autenticação${rolesStr ? ` (roles permitidas: ${rolesStr})` : ''}`);
        
        // Verificar token JWT
        const token = this._extractToken(req);
        if (!token) {
          console.log('❌ Token não fornecido');
          return res.status(401).json({ error: 'Token não fornecido' });
        }
        
        // Decodificar e verificar token
        const userData = await this._decodeToken(token);
        if (!userData || (!userData.sub && !userData.id)) {
          console.log('❌ Token inválido');
          return res.status(401).json({ error: 'Token inválido' });
        }
        
        // Para tokens do nosso sistema, usar direto os dados do token
        // Para tokens AWS Cognito, buscar no banco local
        let user;
        if (userData.sub) {
          // Token AWS Cognito - buscar no banco
          user = await this._getUserFromDb(userData.sub);
        } else if (userData.id) {
          // Token do nosso sistema - usar dados diretos
          user = {
            id: userData.id,
            cognitoSub: 'local_user',
            email: userData.email,
            nome: userData.nome,
            tipoUsuario: userData.tipo_usuario,
            empresaId: userData.empresa_id,
            escolaId: userData.escola_id,
            status: 'active',
            grupos: userData.grupos || []
          };
        }
        if (!user) {
          console.log(`❌ Usuário não encontrado: ${userData.sub}`);
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar roles se necessário
        if (requiredRoles) {
          const allowedRoles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
          const hasAccess = allowedRoles.some(role => user.grupos.includes(role));
          
          if (!hasAccess) {
            console.log(`❌ Acesso negado. Roles permitidas: [${allowedRoles.join(', ')}], Grupos do usuário: [${user.grupos.join(', ')}]`);
            return res.status(403).json({ error: 'Acesso negado' });
          }
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
   * DECODIFICA E VERIFICA TOKEN JWT
   * Implementação segura com verificação de assinatura
   */
  private async _decodeToken(token: string): Promise<any> {
    try {
      // Primeiro, tentar verificar como token Cognito
      const cognitoResult = await this.cognitoVerifier.verifyToken(token);
      
      if (cognitoResult.success && cognitoResult.user) {
        console.log(`🔓 Token Cognito verificado para usuário: ${cognitoResult.user.sub}`);
        return cognitoResult.user;
      }
      
      // Se não for token Cognito, tentar verificar como JWT interno
      try {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        console.log(`🔓 Token JWT interno verificado para usuário: ${decoded.id || decoded.sub}`);
        return decoded;
      } catch (jwtError) {
        console.error('❌ Falha na verificação JWT interno:', jwtError);
      }
      
      // Se ambas verificações falharem
      throw new Error('Token inválido - falha na verificação de assinatura');
      
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      throw new Error('Token inválido ou expirado');
    }
  }

  /**
   * BUSCA USUÁRIO NO BANCO LOCAL
   * Equivalente ao _get_user_from_db() Python:
   * 
   * def _get_user_from_db(self, cognito_sub):
   *     query = "SELECT * FROM usuarios WHERE cognito_sub = %s"
   *     return self.db.execute_query(query, (cognito_sub,), fetch_one=True)
   */
  private async _getUserFromDb(cognitoSub: string): Promise<AuthenticatedUser | null> {
    try {
      console.log(`🔍 Buscando usuário no banco local: ${cognitoSub}`);
      
      // Query SQL equivalente usando Drizzle ORM
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.cognitoSub, cognitoSub))
        .limit(1);
      
      if (userResult.length === 0) {
        console.log(`❌ Usuário não encontrado no banco: ${cognitoSub}`);
        return null;
      }
      
      const user = userResult[0];
      
      // Montar dados do usuário autenticado (equivalente aos dados retornados pelo Python)
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        cognitoSub: user.cognitoSub,
        email: user.email,
        nome: user.nome,
        tipoUsuario: user.tipoUsuario,
        empresaId: user.empresaId,
        escolaId: user.escolaId,
        status: user.status,
        grupos: user.tipoUsuario ? [user.tipoUsuario] : [] // Simplificado - em produção viria do Cognito
      };
      
      console.log(`✅ Usuário encontrado: ${authenticatedUser.nome} (${authenticatedUser.email}) - Tipo: ${authenticatedUser.tipoUsuario}`);
      
      return authenticatedUser;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar usuário no banco: ${cognitoSub}`, error);
      return null;
    }
  }
}

export default AuthMiddleware;
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Express } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo_usuario: string;
    empresa_id?: number;
    escola_id?: number;
    cognito_sub?: string;
  };
}

// Middleware de autenticação
const authenticate = (req: AuthenticatedRequest, res: Response, next: any) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export function registerAuthRoutes(app: Express) {
  console.log('📝 Registrando rotas de autenticação...');

  /**
   * GET /api/auth/me - Verificar status de autenticação
   */
  app.get('/api/auth/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔍 Verificando status de autenticação para usuário:', req.user?.email);
      
      res.json({
        success: true,
        message: 'Usuário autenticado',
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo_usuario: req.user?.tipo_usuario,
          empresa_id: req.user?.empresa_id,
          escola_id: req.user?.escola_id,
          cognito_sub: req.user?.cognito_sub
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  /**
   * POST /api/auth/logout - Fazer logout do sistema
   */
  app.post('/api/auth/logout', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🚪 Processando logout para usuário:', req.user?.email);
      
      // TODO: Implementar blacklist de tokens JWT se necessário
      // TODO: Invalidar sessão no AWS Cognito se aplicável
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Logout processado com sucesso para:', req.user?.email);
    } catch (error) {
      console.error('❌ Erro ao processar logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  /**
   * POST /api/auth/refresh - Renovar token de acesso
   */
  app.post('/api/auth/refresh', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🔄 Renovando token para usuário:', req.user?.email);
      
      // Gerar novo token com os mesmos dados do usuário
      const newToken = jwt.sign(
        {
          id: req.user?.id,
          email: req.user?.email,
          tipo_usuario: req.user?.tipo_usuario,
          empresa_id: req.user?.empresa_id,
          escola_id: req.user?.escola_id,
          cognito_sub: req.user?.cognito_sub
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        token: newToken,
        user: {
          id: req.user?.id,
          email: req.user?.email,
          tipo_usuario: req.user?.tipo_usuario,
          empresa_id: req.user?.empresa_id,
          escola_id: req.user?.escola_id,
          cognito_sub: req.user?.cognito_sub
        },
        timestamp: new Date().toISOString()
      });
      
      console.log('✅ Token renovado com sucesso para:', req.user?.email);
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  console.log('✅ Rotas de autenticação registradas com sucesso');
}
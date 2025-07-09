/**
 * Tipos de autenticação para o sistema IAprender
 */

export interface AuthUser {
  id: number;
  email: string;
  tipo_usuario: 'admin' | 'gestor' | 'diretor' | 'professor' | 'aluno';
  empresa_id?: number;
  escola_id?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
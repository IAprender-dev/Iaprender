/**
 * HOOK DE AUTENTICAÇÃO REACT - IAPRENDER
 * 
 * Hook customizado para integração do AuthManager com React
 */

import { useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  nome: string;
  tipo_usuario: 'admin' | 'gestor' | 'diretor' | 'professor' | 'aluno';
  empresa_id?: number;
  escola_id?: number;
  avatar?: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Referência ao AuthManager global
  const auth = (window as any).auth;

  /**
   * Verificar status de autenticação inicial
   */
  const checkAuthStatus = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      if (auth && auth.isAuthenticated()) {
        const status = await auth.checkAuthStatus();
        
        if (status.authenticated) {
          setAuthState({
            user: status.user || auth.getCurrentUser(),
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: status.error || null
          });
        }
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Erro ao verificar autenticação'
      });
    }
  }, [auth]);

  /**
   * Fazer login com email e senha
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await auth.login(credentials.email, credentials.password);
      
      if (result.success) {
        setAuthState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        
        return { success: true, user: result.user };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error
        }));
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Erro de conexão. Tente novamente.';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [auth]);

  /**
   * Login via AWS Cognito
   */
  const loginWithCognito = useCallback(async (): Promise<LoginResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await auth.loginWithCognito();
      
      if (!result.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error
        }));
        
        return { success: false, error: result.error };
      }
      
      // O redirecionamento será feito automaticamente
      return { success: true };
    } catch (error) {
      const errorMessage = 'Erro ao configurar login AWS Cognito';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [auth]);

  /**
   * Fazer logout
   */
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await auth.logout();
      // O AuthManager já limpa os dados e redireciona
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpar estado local
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, [auth]);

  /**
   * Verificar permissões do usuário
   */
  const hasPermission = useCallback((requiredRole: string): boolean => {
    if (!auth || !authState.isAuthenticated) return false;
    return auth.hasPermission(requiredRole);
  }, [auth, authState.isAuthenticated]);

  /**
   * Obter headers para requisições autenticadas
   */
  const getAuthHeaders = useCallback(() => {
    return auth ? auth.getHeaders() : {};
  }, [auth]);

  /**
   * Fazer requisição autenticada
   */
  const makeAuthenticatedRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!auth) {
      throw new Error('AuthManager não encontrado');
    }
    
    return await auth.makeRequest(endpoint, options);
  }, [auth]);

  /**
   * Atualizar dados do usuário
   */
  const updateUser = useCallback((userData: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null
    }));
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Verificar autenticação ao montar o hook
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Escutar eventos de autenticação
  useEffect(() => {
    const handleLogin = (event: CustomEvent) => {
      setAuthState({
        user: event.detail.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    };

    const handleLogout = () => {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    };

    window.addEventListener('auth:login', handleLogin as EventListener);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', handleLogin as EventListener);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return {
    // Estado
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    
    // Ações
    login,
    loginWithCognito,
    logout,
    checkAuthStatus,
    updateUser,
    clearError,
    
    // Utilitários
    hasPermission,
    getAuthHeaders,
    makeAuthenticatedRequest
  };
};
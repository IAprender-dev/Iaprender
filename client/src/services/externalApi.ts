/**
 * Serviço para integração com API externa
 * Endpoint: https://ghj67gg706.execute-api.us-east-1.amazonaws.com/prod
 */

// Interfaces
export interface ExternalUser {
  id: string;
  nome?: string;
  email?: string;
  tipoUsuario?: 'admin' | 'gestor' | 'diretor' | 'professor' | 'aluno';
  status?: 'ativo' | 'inativo' | 'pendente' | 'suspenso';
  telefone?: string;
  endereco?: string;
  documento?: string;
  observacoes?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Configuração da API externa
const API_BASE_URL = 'https://ghj67gg706.execute-api.us-east-1.amazonaws.com/prod';

/**
 * Função utilitária para obter token de autenticação
 */
function getAuthToken(): string | null {
  // Tentar obter token do Cognito primeiro
  const cognitoToken = localStorage.getItem('cognito_token');
  if (cognitoToken) {
    return cognitoToken;
  }

  // Fallback para token genérico
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    return accessToken;
  }

  // Último fallback
  const token = localStorage.getItem('token');
  return token;
}

/**
 * Função utilitária para fazer requisições autenticadas
 */
async function makeAuthenticatedRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado. Faça login novamente.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Se não autorizado, limpar tokens e solicitar novo login
  if (response.status === 401) {
    localStorage.removeItem('cognito_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    throw new Error('Token expirado. Redirecionando para login...');
  }

  return response;
}

/**
 * Serviço principal para interação com API externa
 */
export const externalApiService = {
  /**
   * Verificar conectividade com a API externa
   */
  async verificarConectividade(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao verificar conectividade:', error);
      return false;
    }
  },

  /**
   * Listar todos os usuários
   * IMPLEMENTA A FUNÇÃO FORNECIDA PELO USUÁRIO
   */
  async listarUsuarios(): Promise<ExternalUser[]> {
    try {
      const response = await makeAuthenticatedRequest('/usuarios');
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar se a resposta tem a estrutura esperada
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        // Caso a API retorne diretamente o array
        return data;
      } else {
        throw new Error('Formato de resposta inválido da API externa');
      }
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao conectar com a API externa');
    }
  },

  /**
   * Buscar usuário por ID
   */
  async buscarUsuario(id: string): Promise<ExternalUser> {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`);
      
      if (!response.ok) {
        throw new Error(`Usuário não encontrado: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else if (data.id) {
        // Caso a API retorne diretamente o objeto
        return data;
      } else {
        throw new Error('Usuário não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  },

  /**
   * Criar novo usuário
   */
  async criarUsuario(userData: Partial<ExternalUser>): Promise<ExternalUser> {
    try {
      const response = await makeAuthenticatedRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao criar usuário: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else if (data.id) {
        return data;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  },

  /**
   * Atualizar usuário existente
   */
  async atualizarUsuario(id: string, userData: Partial<ExternalUser>): Promise<ExternalUser> {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao atualizar usuário: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else if (data.id) {
        return data;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  },

  /**
   * Deletar usuário
   */
  async deletarUsuario(id: string): Promise<boolean> {
    try {
      const response = await makeAuthenticatedRequest(`/usuarios/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao deletar usuário: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas da API externa
   */
  async obterEstatisticas(): Promise<any> {
    try {
      const response = await makeAuthenticatedRequest('/stats');
      
      if (!response.ok) {
        throw new Error(`Erro ao obter estatísticas: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      // Retornar estatísticas mock em caso de erro
      return {
        totalUsuarios: 0,
        usuariosAtivos: 0,
        ultimaAtualizacao: new Date().toISOString()
      };
    }
  }
};

export default externalApiService;
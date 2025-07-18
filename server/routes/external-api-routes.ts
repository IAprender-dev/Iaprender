/**
 * Rotas para integração com API externa
 * Endpoint: https://ghj67gg706.execute-api.us-east-1.amazonaws.com/prod
 */

import { Request, Response, Application } from 'express';

// Interface para estrutura de resposta
interface ExternalUser {
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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Configuração da API externa
const API_BASE_URL = 'https://ghj67gg706.execute-api.us-east-1.amazonaws.com/prod';

/**
 * Função utilitária para obter token de autenticação
 */
function getAuthTokenFromRequest(req: Request): string | null {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Função utilitária para fazer requisições autenticadas à API externa
 */
async function makeExternalApiRequest(
  endpoint: string, 
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Implementação da função listarUsuarios fornecida pelo usuário
 */
async function listarUsuarios(token: string): Promise<ExternalUser[]> {
  try {
    console.log('📋 Executando função listarUsuarios com token:', token ? 'Presente' : 'Ausente');
    
    const response = await makeExternalApiRequest('/usuarios', token);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Verificar diferentes formatos de resposta possíveis
    if (data.success && Array.isArray(data.data)) {
      console.log('✅ Formato de resposta: { success: true, data: [...] }');
      return data.data;
    } else if (Array.isArray(data)) {
      console.log('✅ Formato de resposta: Array direto');
      return data;
    } else if (data.usuarios && Array.isArray(data.usuarios)) {
      console.log('✅ Formato de resposta: { usuarios: [...] }');
      return data.usuarios;
    } else {
      console.warn('⚠️ Formato de resposta inesperado:', data);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro na função listarUsuarios:', error);
    throw error;
  }
}

export function registerExternalApiRoutes(app: Application) {
  console.log('📝 Registrando rotas da API externa...');

  /**
   * GET /api/external/usuarios - Listar todos os usuários da API externa
   */
  app.get('/api/external/usuarios', async (req: Request, res: Response) => {
    try {
      console.log('📋 GET /api/external/usuarios - Iniciando listagem');
      
      // Obter token de autenticação
      const token = getAuthTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação obrigatório',
          message: 'Forneça um token Bearer válido',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      // Executar função listarUsuarios
      const usuarios = await listarUsuarios(token);
      
      console.log(`✅ Listagem concluída: ${usuarios.length} usuários encontrados`);
      
      res.json({
        success: true,
        data: usuarios,
        message: `${usuarios.length} usuários carregados da API externa`,
        timestamp: new Date().toISOString(),
        metadata: {
          total: usuarios.length,
          source: 'external-api',
          endpoint: '/usuarios',
          user_agent: req.get('User-Agent') || 'unknown'
        }
      } as ApiResponse<ExternalUser[]>);

    } catch (error) {
      console.error('❌ Erro ao listar usuários da API externa:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      res.status(500).json({
        success: false,
        error: errorMessage,
        message: 'Falha ao conectar com a API externa',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  });

  /**
   * GET /api/external/usuarios/:id - Buscar usuário específico
   */
  app.get('/api/external/usuarios/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(`👤 GET /api/external/usuarios/${id} - Buscando usuário específico`);
      
      const token = getAuthTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação obrigatório',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      const response = await makeExternalApiRequest(`/usuarios/${id}`, token);
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Usuário não encontrado: ${response.status}`,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data: data.success ? data.data : data,
        message: 'Usuário encontrado',
        timestamp: new Date().toISOString()
      } as ApiResponse<ExternalUser>);

    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  });

  /**
   * POST /api/external/usuarios - Criar novo usuário
   */
  app.post('/api/external/usuarios', async (req: Request, res: Response) => {
    try {
      console.log('➕ POST /api/external/usuarios - Criando usuário');
      
      const token = getAuthTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação obrigatório',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      const response = await makeExternalApiRequest('/usuarios', token, {
        method: 'POST',
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          error: errorData.error || `Erro ao criar usuário: ${response.status}`,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      const data = await response.json();
      
      res.status(201).json({
        success: true,
        data: data.success ? data.data : data,
        message: 'Usuário criado com sucesso',
        timestamp: new Date().toISOString()
      } as ApiResponse<ExternalUser>);

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  });

  /**
   * GET /api/external/health - Verificar status da API externa
   */
  app.get('/api/external/health', async (req: Request, res: Response) => {
    try {
      console.log('🔍 GET /api/external/health - Verificando conectividade');
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const isOnline = response.ok;
      
      res.json({
        success: true,
        data: {
          status: isOnline ? 'online' : 'offline',
          statusCode: response.status,
          endpoint: API_BASE_URL,
          timestamp: new Date().toISOString()
        },
        message: isOnline ? 'API externa está online' : 'API externa está offline',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);

    } catch (error) {
      console.error('❌ Erro ao verificar conectividade:', error);
      
      res.json({
        success: false,
        data: {
          status: 'error',
          endpoint: API_BASE_URL,
          timestamp: new Date().toISOString()
        },
        error: error instanceof Error ? error.message : 'Erro de conectividade',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);
    }
  });

  /**
   * GET /api/external/stats - Estatísticas da API externa
   */
  app.get('/api/external/stats', async (req: Request, res: Response) => {
    try {
      console.log('📊 GET /api/external/stats - Obtendo estatísticas');
      
      const token = getAuthTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de autenticação obrigatório',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      // Tentar obter estatísticas
      try {
        const response = await makeExternalApiRequest('/stats', token);
        
        if (response.ok) {
          const data = await response.json();
          return res.json({
            success: true,
            data: data.success ? data.data : data,
            message: 'Estatísticas obtidas com sucesso',
            timestamp: new Date().toISOString()
          } as ApiResponse<any>);
        }
      } catch (statsError) {
        console.warn('⚠️ Endpoint /stats não disponível, gerando estatísticas baseadas em usuários');
      }

      // Fallback: gerar estatísticas baseadas na listagem de usuários
      const usuarios = await listarUsuarios(token);
      
      const stats = {
        totalUsuarios: usuarios.length,
        usuariosAtivos: usuarios.filter(u => u.status === 'ativo').length,
        usuariosInativos: usuarios.filter(u => u.status === 'inativo').length,
        usuariosPendentes: usuarios.filter(u => u.status === 'pendente').length,
        distribuicaoTipos: {
          admin: usuarios.filter(u => u.tipoUsuario === 'admin').length,
          gestor: usuarios.filter(u => u.tipoUsuario === 'gestor').length,
          diretor: usuarios.filter(u => u.tipoUsuario === 'diretor').length,
          professor: usuarios.filter(u => u.tipoUsuario === 'professor').length,
          aluno: usuarios.filter(u => u.tipoUsuario === 'aluno').length,
        },
        ultimaAtualizacao: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas calculadas baseadas na listagem de usuários',
        timestamp: new Date().toISOString()
      } as ApiResponse<any>);

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
  });

  console.log('✅ Rotas da API externa registradas com sucesso');
}
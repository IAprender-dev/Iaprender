/**
 * GERENCIADOR DE AUTENTICAÇÃO - IAPRENDER
 * 
 * Sistema completo de autenticação integrado com AWS Cognito
 * e backend PostgreSQL para formulários adaptados
 */

class AuthManager {
  constructor() {
    this.token = this.getStoredToken();
    this.userInfo = this.getStoredUserInfo();
    this.refreshTimer = null;
    
    // Configurações de retry e timeout
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      requestTimeout: 30000,
      refreshThreshold: 300000 // 5 minutos antes do token expirar
    };
    
    // Inicializar refresh automático
    this.scheduleTokenRefresh();
  }

  /**
   * Obter token armazenado com validação
   */
  getStoredToken() {
    try {
      const token = localStorage.getItem('cognito_token') || sessionStorage.getItem('authToken');
      if (token && this.isTokenValid(token)) {
        return token;
      }
    } catch (error) {
      console.warn('Erro ao recuperar token:', error);
    }
    return null;
  }

  /**
   * Obter informações do usuário armazenadas
   */
  getStoredUserInfo() {
    try {
      const userInfo = localStorage.getItem('user_info') || localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : {};
    } catch (error) {
      console.warn('Erro ao recuperar informações do usuário:', error);
      return {};
    }
  }

  /**
   * Validar se o token ainda é válido
   */
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now + 60; // Margem de 1 minuto
    } catch (error) {
      return false;
    }
  }

  /**
   * Login com email e senha
   */
  async login(email, password) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (response.success) {
        await this.setAuthData(response.token, response.user);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.message || 'Credenciais inválidas' };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }

  /**
   * Login via AWS Cognito (redirecionamento)
   */
  async loginWithCognito() {
    try {
      const response = await this.makeRequest('/api/auth/cognito-config');
      if (response.cognitoDomain && response.clientId) {
        const cognitoUrl = `https://${response.cognitoDomain}/login?client_id=${response.clientId}&response_type=code&scope=openid+profile+email&redirect_uri=${encodeURIComponent(response.redirectUri)}`;
        window.location.href = cognitoUrl;
        return { success: true };
      }
      throw new Error('Configuração do Cognito não encontrada');
    } catch (error) {
      console.error('Erro no login Cognito:', error);
      return { success: false, error: 'Erro ao configurar login AWS Cognito' };
    }
  }

  /**
   * Processar callback do AWS Cognito
   */
  async processCognitoCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      return { success: false, error: 'Erro de autenticação AWS Cognito' };
    }

    if (code) {
      try {
        const response = await this.makeRequest('/auth/callback', {
          method: 'POST',
          body: JSON.stringify({ code })
        });

        if (response.success) {
          await this.setAuthData(response.token, response.user);
          return { success: true, user: response.user };
        }
        
        return { success: false, error: response.message };
      } catch (error) {
        console.error('Erro no callback Cognito:', error);
        return { success: false, error: 'Erro ao processar autenticação' };
      }
    }

    return { success: false, error: 'Código de autorização não encontrado' };
  }

  /**
   * Definir dados de autenticação
   */
  async setAuthData(token, user) {
    this.token = token;
    this.userInfo = user;
    
    // Armazenar com redundância para compatibilidade
    localStorage.setItem('cognito_token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user_info', JSON.stringify(user));
    localStorage.setItem('userInfo', JSON.stringify(user));
    
    // Agendar renovação do token
    this.scheduleTokenRefresh();
    
    // Disparar evento de login
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
  }

  /**
   * Logout completo
   */
  async logout() {
    try {
      // Tentar fazer logout no servidor
      if (this.token) {
        await this.makeRequest('/api/auth/logout', {
          method: 'POST'
        });
      }
    } catch (error) {
      console.warn('Erro no logout do servidor:', error);
    } finally {
      // Limpar dados locais
      this.clearAuthData();
      
      // Disparar evento de logout
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Redirecionar para login
      window.location.href = '/login.html';
    }
  }

  /**
   * Limpar dados de autenticação
   */
  clearAuthData() {
    this.token = null;
    this.userInfo = {};
    
    // Limpar todos os storages
    const keysToRemove = ['cognito_token', 'authToken', 'user_info', 'userInfo'];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Cancelar timer de refresh
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Verificar se usuário está autenticado
   */
  isAuthenticated() {
    return !!(this.token && this.isTokenValid(this.token));
  }

  /**
   * Obter headers para requisições autenticadas
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Obter informações do usuário atual
   */
  getCurrentUser() {
    return this.userInfo;
  }

  /**
   * Verificar se usuário tem permissão específica
   */
  hasPermission(requiredRole) {
    if (!this.userInfo.tipo_usuario) return false;
    
    const roleHierarchy = {
      'admin': 5,
      'gestor': 4,
      'diretor': 3,
      'professor': 2,
      'aluno': 1
    };
    
    const userLevel = roleHierarchy[this.userInfo.tipo_usuario] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }

  /**
   * Fazer requisição autenticada
   */
  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${window.location.origin}${endpoint}`;
    
    const requestOptions = {
      timeout: this.config.requestTimeout,
      headers: this.getHeaders(),
      ...options
    };

    // Implementar retry com backoff exponencial
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        
        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Se token expirou, tentar renovar
        if (response.status === 401 && attempt === 1) {
          const refreshResult = await this.refreshToken();
          if (refreshResult.success) {
            requestOptions.headers = this.getHeaders();
            continue; // Retry com novo token
          } else {
            this.logout(); // Token não pode ser renovado
            throw new Error('Sessão expirada');
          }
        }
        
        const data = await response.json();
        
        if (response.ok) {
          return data;
        } else {
          throw new Error(data.message || `HTTP ${response.status}`);
        }
        
      } catch (error) {
        console.error(`Tentativa ${attempt} falhou:`, error);
        
        if (attempt === this.config.maxRetries) {
          throw error;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => 
          setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  /**
   * Renovar token automaticamente
   */
  async refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        await this.setAuthData(data.token, data.user);
        return { success: true };
      } else {
        return { success: false, error: 'Não foi possível renovar o token' };
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agendar renovação automática do token
   */
  scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    if (!this.token) return;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilRefresh = expirationTime - currentTime - this.config.refreshThreshold;
      
      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.warn('Erro ao agendar renovação do token:', error);
    }
  }

  /**
   * Verificar status da autenticação
   */
  async checkAuthStatus() {
    if (!this.isAuthenticated()) {
      return { authenticated: false };
    }
    
    try {
      const response = await this.makeRequest('/api/auth/me');
      return { 
        authenticated: true, 
        user: response.user,
        permissions: response.permissions || []
      };
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      return { authenticated: false, error: error.message };
    }
  }

  /**
   * Middleware para proteção de rotas
   */
  requireAuth(redirectUrl = '/login.html') {
    if (!this.isAuthenticated()) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }

  /**
   * Middleware para verificação de permissões
   */
  requirePermission(role, redirectUrl = '/unauthorized.html') {
    if (!this.hasPermission(role)) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  }
}

// Criar instância global
const auth = new AuthManager();

// Processar callback do Cognito se estivermos na página de callback
if (window.location.pathname.includes('/callback') || window.location.search.includes('code=')) {
  auth.processCognitoCallback().then(result => {
    if (result.success) {
      // Redirecionar para dashboard baseado no tipo de usuário
      const userType = result.user?.tipo_usuario;
      const dashboardUrls = {
        'admin': '/admin/user-management',
        'gestor': '/gestor/dashboard',
        'diretor': '/school/dashboard',
        'professor': '/teacher/dashboard',
        'aluno': '/student/dashboard'
      };
      
      const redirectUrl = dashboardUrls[userType] || '/dashboard';
      window.location.href = redirectUrl;
    } else {
      console.error('Erro no callback:', result.error);
      window.location.href = '/login.html?error=' + encodeURIComponent(result.error);
    }
  });
}

// Exportar para uso global
window.auth = auth;

// Compatibilidade com módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}

export default AuthManager;
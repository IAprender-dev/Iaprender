import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

const TestLogout: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [authState, setAuthState] = useState({
    hasAuthManager: false,
    hasToken: false,
    authManagerType: '',
    tokenCount: 0
  });

  useEffect(() => {
    checkAuthState();
    
    // Escutar eventos de logout
    const handleLogoutEvent = (event: any) => {
      console.log('🎧 Evento de logout capturado:', event.detail);
      addTestResult({
        name: 'Evento de Logout',
        status: 'success',
        message: `Evento capturado de: ${event.detail?.source || 'desconhecido'}`,
        details: JSON.stringify(event.detail, null, 2)
      });
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const checkAuthState = () => {
    const hasAuthManager = !!(window as any).auth;
    const authManagerType = hasAuthManager ? typeof (window as any).auth : 'undefined';
    
    const tokens = [
      'auth_token', 'cognito_token', 'access_token', 'id_token', 
      'refresh_token', 'user_data', 'auth_user', 'cognito_user',
      'sistema_token', 'jwt_token', 'authToken', 'user_info', 'userInfo'
    ];
    
    const existingTokens = tokens.filter(key => 
      localStorage.getItem(key) || sessionStorage.getItem(key)
    );

    setAuthState({
      hasAuthManager,
      hasToken: existingTokens.length > 0,
      authManagerType,
      tokenCount: existingTokens.length
    });
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() } as any]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const simulateTokens = () => {
    // Adicionar tokens de teste
    localStorage.setItem('auth_token', 'test_token_123');
    localStorage.setItem('cognito_token', 'cognito_test_456');
    localStorage.setItem('user_info', JSON.stringify({ 
      id: 1, 
      email: 'test@example.com', 
      tipo_usuario: 'admin' 
    }));
    
    checkAuthState();
    
    addTestResult({
      name: 'Simulação de Tokens',
      status: 'success',
      message: 'Tokens de teste adicionados ao localStorage'
    });
  };

  const testServerLogout = async () => {
    setIsRunning(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_token',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult({
          name: 'Logout do Servidor',
          status: 'success',
          message: 'Endpoint de logout funcionando',
          details: JSON.stringify(data, null, 2)
        });
      } else {
        addTestResult({
          name: 'Logout do Servidor',
          status: 'warning',
          message: `Resposta HTTP ${response.status}`,
          details: await response.text()
        });
      }
    } catch (error) {
      addTestResult({
        name: 'Logout do Servidor',
        status: 'error',
        message: 'Erro na requisição',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testAuthManagerLogout = async () => {
    if (!(window as any).auth) {
      addTestResult({
        name: 'AuthManager Logout',
        status: 'error',
        message: 'AuthManager não disponível no window.auth'
      });
      return;
    }

    try {
      if (typeof (window as any).auth.logout === 'function') {
        addTestResult({
          name: 'AuthManager Logout',
          status: 'success',
          message: 'Método logout encontrado no AuthManager',
          details: 'window.auth.logout é uma função válida'
        });
      } else {
        addTestResult({
          name: 'AuthManager Logout',
          status: 'error',
          message: 'Método logout não é uma função',
          details: `Tipo encontrado: ${typeof (window as any).auth.logout}`
        });
      }
    } catch (error) {
      addTestResult({
        name: 'AuthManager Logout',
        status: 'error',
        message: 'Erro ao verificar AuthManager',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    // Simular alguns tokens primeiro
    simulateTokens();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Testar servidor
    await testServerLogout();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Testar AuthManager
    await testAuthManagerLogout();
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            🚪 Teste de Sistema de Logout - IAprender
          </h1>
          <p className="text-gray-600">
            Validação completa do sistema de logout unificado
          </p>
        </div>

        {/* Estado Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Estado Atual da Autenticação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge className={authState.hasAuthManager ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  AuthManager: {authState.hasAuthManager ? 'Disponível' : 'Indisponível'}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  Tipo: {authState.authManagerType}
                </p>
              </div>
              
              <div className="text-center">
                <Badge className={authState.hasToken ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  Tokens: {authState.tokenCount}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  No localStorage/sessionStorage
                </p>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={checkAuthState} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={simulateTokens} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Simular Tokens
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Testes Manuais */}
          <Card>
            <CardHeader>
              <CardTitle>Testes Manuais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Executar Todos os Testes
              </Button>
              
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={testServerLogout} variant="outline" size="sm">
                  Testar Endpoint Servidor
                </Button>
                <Button onClick={testAuthManagerLogout} variant="outline" size="sm">
                  Testar AuthManager
                </Button>
                <Button onClick={clearResults} variant="outline" size="sm">
                  Limpar Resultados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Componentes de Logout */}
          <Card>
            <CardHeader>
              <CardTitle>Componentes de Logout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">LogoutButton Padrão:</p>
                  <LogoutButton />
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">LogoutButton Somente Ícone:</p>
                  <LogoutButton showText={false} size="sm" />
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">LogoutButton Destructive:</p>
                  <LogoutButton variant="destructive" text="Sair do Sistema" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resultados dos Testes
                <Badge variant="outline">
                  {testResults.length} teste(s)
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.name}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Ver detalhes
                          </summary>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">
                            {result.details}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentação */}
        <Card>
          <CardHeader>
            <CardTitle>Funcionalidades Implementadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Backend:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Endpoint POST /api/auth/logout</li>
                  <li>• Middleware de autenticação JWT</li>
                  <li>• Endpoint GET /api/auth/me</li>
                  <li>• Endpoint POST /api/auth/refresh</li>
                  <li>• Validação de tokens</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Frontend:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• AuthManager global (window.auth)</li>
                  <li>• Componente LogoutButton React</li>
                  <li>• Hook useAuth TypeScript</li>
                  <li>• Limpeza completa de tokens</li>
                  <li>• Eventos customizados auth:logout</li>
                  <li>• Fallback para logout manual</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestLogout;
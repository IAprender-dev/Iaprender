import React, { useEffect, useRef, useState } from 'react';
import { FormHandler, createFormHandler } from '../utils/formHandler';

/**
 * EXEMPLO DE FORMHANDLER COM AUTHMANAGER INTEGRADO
 * 
 * Demonstra como o FormHandler funciona com autenticação completa
 */

const FormHandlerAuthExample: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatus, setAuthStatus] = useState('Verificando...');
  const formHandlerRef = useRef<FormHandler | null>(null);

  useEffect(() => {
    // Verifica se AuthManager está disponível
    if (typeof window !== 'undefined' && (window as any).auth) {
      const auth = (window as any).auth;
      setIsAuthenticated(auth.isAuthenticated());
      setAuthStatus(auth.isAuthenticated() ? 'Autenticado' : 'Não autenticado');
    } else {
      setAuthStatus('AuthManager não disponível');
    }

    // Inicializa FormHandler para teste
    formHandlerRef.current = createFormHandler('form-handler-auth-test', {
      endpoint: '/api/test',
      method: 'POST',
      debug: true,
      onSuccess: (response) => {
        console.log('✅ Formulário enviado com sucesso:', response);
        alert('Formulário enviado com sucesso!');
      },
      onError: (error) => {
        console.error('❌ Erro ao enviar formulário:', error);
        alert(`Erro: ${error.message}`);
      }
    });

    return () => {
      formHandlerRef.current?.destroy();
    };
  }, []);

  const handleLogin = async () => {
    if (typeof window !== 'undefined' && (window as any).auth) {
      try {
        const result = await (window as any).auth.loginWithCognito();
        if (result.success) {
          setIsAuthenticated(true);
          setAuthStatus('Autenticado');
          formHandlerRef.current?.refreshAuthState();
        }
      } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro no login');
      }
    } else {
      alert('AuthManager não disponível');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && (window as any).auth) {
      (window as any).auth.logout();
      setIsAuthenticated(false);
      setAuthStatus('Não autenticado');
      formHandlerRef.current?.refreshAuthState();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">FormHandler com AuthManager</h1>
      
      {/* Status de Autenticação */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Status de Autenticação</h2>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isAuthenticated 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {authStatus}
          </span>
          
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Login com Cognito
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Formulário de Teste */}
      <form id="form-handler-auth-test" className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite seu nome"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite seu email"
          />
        </div>

        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            data-validation="phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem
          </label>
          <textarea
            id="mensagem"
            name="mensagem"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua mensagem"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Enviar Formulário
        </button>
      </form>

      {/* Informações sobre o FormHandler */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Como Funciona</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>• <strong>Autenticação Automática:</strong> FormHandler verifica se o usuário está logado</li>
          <li>• <strong>Integração com AuthManager:</strong> Usa window.auth.makeRequest() para requisições autenticadas</li>
          <li>• <strong>Retry Automático:</strong> Tenta renovar token em caso de erro 401</li>
          <li>• <strong>Feedback Visual:</strong> Desabilita botão se não estiver autenticado</li>
          <li>• <strong>Validação Brasileira:</strong> Suporte a CPF, CNPJ, telefone, CEP</li>
          <li>• <strong>Estados de Loading:</strong> Mostra indicadores visuais durante envio</li>
        </ul>
      </div>

      {/* Exemplo de Código */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Exemplo de Código</h3>
        <pre className="text-sm text-gray-700 overflow-x-auto">
{`// Criar FormHandler com AuthManager
const formHandler = createFormHandler('meu-form', {
  endpoint: '/api/endpoint',
  method: 'POST',
  debug: true,
  onSuccess: (response) => {
    console.log('Sucesso:', response);
  },
  onError: (error) => {
    console.error('Erro:', error);
  }
});

// Verificar autenticação
if (formHandler.isAuthenticated()) {
  // Usuário está logado
} else {
  // Usuário precisa fazer login
}

// Atualizar estado após login/logout
formHandler.refreshAuthState();`}
        </pre>
      </div>
    </div>
  );
};

export default FormHandlerAuthExample;
/**
 * EXEMPLO DE INTEGRAÇÃO COMPLETA DE AUTENTICAÇÃO - IAPRENDER
 * 
 * Demonstra como usar o hook useAuth com formulários e navegação
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Componente de Login
export const LoginForm: React.FC = () => {
  const { login, loginWithCognito, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginType, setLoginType] = useState<'email' | 'cognito'>('email');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const result = await login(credentials);
    if (result.success) {
      // Redirecionar baseado no tipo de usuário
      const userType = result.user?.tipo_usuario;
      const redirectUrls = {
        'admin': '/admin/user-management',
        'gestor': '/gestor/dashboard',
        'diretor': '/school/dashboard',
        'professor': '/teacher/dashboard',
        'aluno': '/student/dashboard'
      };
      
      window.location.href = redirectUrls[userType] || '/dashboard';
    }
  };

  const handleCognitoLogin = async () => {
    clearError();
    await loginWithCognito();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Login - IAprender</h2>
      
      {/* Seletor de tipo de login */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setLoginType('email')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === 'email'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Email/Senha
        </button>
        <button
          type="button"
          onClick={() => setLoginType('cognito')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginType === 'cognito'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          AWS Cognito
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loginType === 'email' ? (
        <form onSubmit={handleEmailLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sua senha"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-gray-600">
            Faça login usando sua conta AWS Cognito
          </p>
          <button
            onClick={handleCognitoLogin}
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            {isLoading ? 'Redirecionando...' : 'Login com AWS Cognito'}
          </button>
        </div>
      )}
    </div>
  );
};

// Componente de Perfil do Usuário
export const UserProfile: React.FC = () => {
  const { user, logout, isLoading, hasPermission, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nome: user?.nome || '',
    email: user?.email || ''
  });

  const handleSaveProfile = async () => {
    try {
      // Aqui você faria a chamada para a API para atualizar o perfil
      updateUser(editData);
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar perfil');
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roles = {
      'admin': 'Administrador',
      'gestor': 'Gestor Municipal',
      'diretor': 'Diretor',
      'professor': 'Professor',
      'aluno': 'Aluno'
    };
    return roles[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'gestor': 'bg-blue-100 text-blue-800',
      'diretor': 'bg-green-100 text-green-800',
      'professor': 'bg-purple-100 text-purple-800',
      'aluno': 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="text-center p-6">
        <p className="text-gray-600">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Sair
        </button>
      </div>

      <div className="space-y-4">
        {/* Informações básicas */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{user.nome}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.tipo_usuario)}`}>
            {getRoleDisplayName(user.tipo_usuario)}
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`px-2 py-1 rounded text-sm ${
            user.status === 'ativo' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {user.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Empresa/Escola */}
        {user.empresa_id && (
          <div className="text-sm text-gray-600">
            <span>Empresa ID: {user.empresa_id}</span>
          </div>
        )}

        {user.escola_id && (
          <div className="text-sm text-gray-600">
            <span>Escola ID: {user.escola_id}</span>
          </div>
        )}

        {/* Permissões */}
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Permissões</h4>
          <div className="grid grid-cols-2 gap-2">
            {(['admin', 'gestor', 'diretor', 'professor'] as const).map(role => (
              <div key={role} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{getRoleDisplayName(role)}</span>
                <span className={`text-sm ${
                  hasPermission(role) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {hasPermission(role) ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Edição de perfil (apenas dados permitidos) */}
        {isEditing ? (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium mb-3">Editar Perfil</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={editData.nome}
                  onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {hasPermission('admin') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
};

// Componente principal de demonstração
export const AuthIntegrationExample: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Sistema de Autenticação IAprender
        </h1>
        
        {isAuthenticated ? (
          <div>
            <div className="text-center mb-8">
              <p className="text-green-600 font-medium">
                ✓ Usuário autenticado como {user?.nome}
              </p>
            </div>
            <UserProfile />
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <p className="text-gray-600">
                Faça login para acessar o sistema
              </p>
            </div>
            <LoginForm />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthIntegrationExample;
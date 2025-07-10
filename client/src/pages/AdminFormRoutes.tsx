/**
 * ROTAS DE FORMULÁRIOS PARA ADMINISTRADORES - IAPRENDER
 * 
 * Centraliza o acesso aos formulários funcionais para administradores
 * com controle de acesso e integração com sistema de callback Cognito
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  School, 
  UserCircle, 
  Users, 
  FileText, 
  Settings,
  Shield,
  LogOut,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface FormularioFuncional {
  id: string;
  nome: string;
  descricao: string;
  url: string;
  status: 'ativo' | 'manutencao' | 'novo';
  permissoes: string[];
  icon: React.ReactNode;
  categoria: string;
}

const AdminFormRoutes: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Formulários funcionais disponíveis para administradores
  const formulariosDisponiveis: FormularioFuncional[] = [
    {
      id: 'escola-criar',
      nome: 'Cadastrar Nova Escola',
      descricao: 'Registro completo de instituições de ensino com dados INEP e localização',
      url: '/generated-forms/escola-criar.html',
      status: 'ativo',
      permissoes: ['admin', 'gestor'],
      icon: <School className="h-5 w-5" />,
      categoria: 'Gestão Municipal'
    },
    {
      id: 'diretor-criar',
      nome: 'Cadastrar Novo Diretor',
      descricao: 'Registro de diretores escolares com dados profissionais e formação',
      url: '/generated-forms/diretor-criar.html',
      status: 'ativo',
      permissoes: ['admin', 'gestor'],
      icon: <UserCircle className="h-5 w-5" />,
      categoria: 'Gestão Municipal'
    },
    {
      id: 'usuario-criar',
      nome: 'Cadastrar Novo Usuário',
      descricao: 'Sistema completo de cadastro com validação brasileira e hierarquia',
      url: '/generated-forms/usuario-criar.html',
      status: 'ativo',
      permissoes: ['admin'],
      icon: <Users className="h-5 w-5" />,
      categoria: 'Administração'
    }
  ];

  // Estatísticas para o dashboard
  const [estatisticas, setEstatisticas] = useState({
    totalEscolas: 0,
    totalDiretores: 0,
    totalUsuarios: 0,
    formulariosPendentes: 0
  });

  useEffect(() => {
    carregarInformacoesUsuario();
    carregarEstatisticas();
  }, []);

  const carregarInformacoesUsuario = async () => {
    try {
      // Extrair informações do callback da URL
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth');
      const userType = urlParams.get('type');
      const email = urlParams.get('email');

      if (authSuccess === 'success') {
        setUserInfo({
          email: decodeURIComponent(email || ''),
          tipo: userType?.toUpperCase() || 'ADMIN',
          nome: 'Administrador do Sistema',
          dataLogin: new Date().toLocaleString('pt-BR')
        });

        // Limpar parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      // Simular carregamento de estatísticas (substituir por API real)
      setTimeout(() => {
        setEstatisticas({
          totalEscolas: 247,
          totalDiretores: 189,
          totalUsuarios: 1456,
          formulariosPendentes: 23
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const abrirFormulario = (formulario: FormularioFuncional) => {
    // Tratamento especial para formulário de usuário
    if (formulario.id === 'usuario-criar') {
      // Navegar internamente para a página de gestão de usuários
      setLocation('/admin/user-management');
      return;
    }
    
    // Para outros formulários, abrir em nova aba mantendo a sessão
    window.open(formulario.url, '_blank', 'noopener,noreferrer');
  };

  const logout = () => {
    // Limpar dados de sessão e redirecionar
    localStorage.removeItem('auth_token');
    window.location.href = '/auth';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Manutenção</Badge>;
      case 'novo':
        return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" />Novo</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">IAprender Admin</h1>
              </div>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                Painel Administrativo
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userInfo.nome}</p>
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
                  <p className="text-xs text-gray-400">Tipo: {userInfo.tipo}</p>
                </div>
              )}
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Escolas</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalEscolas}</div>
              <p className="text-xs text-muted-foreground">Instituições cadastradas</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diretores Ativos</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalDiretores}</div>
              <p className="text-xs text-muted-foreground">Gestores escolares</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalUsuarios}</div>
              <p className="text-xs text-muted-foreground">Usuários no sistema</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formulários Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.formulariosPendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulários Disponíveis */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulários Administrativos</h2>
            <p className="text-gray-600 mb-6">
              Acesse os formulários funcionais para gestão do sistema educacional
            </p>
          </div>

          <Tabs defaultValue="municipal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="municipal">Gestão Municipal</TabsTrigger>
              <TabsTrigger value="administracao">Administração</TabsTrigger>
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
            </TabsList>

            <TabsContent value="municipal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosDisponiveis
                  .filter(f => f.categoria === 'Gestão Municipal')
                  .map(formulario => (
                    <Card key={formulario.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {formulario.icon}
                            <CardTitle className="text-lg">{formulario.nome}</CardTitle>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription>{formulario.descricao}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full"
                            disabled={formulario.status === 'manutencao'}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Formulário
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="administracao" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosDisponiveis
                  .filter(f => f.categoria === 'Administração')
                  .map(formulario => (
                    <Card key={formulario.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {formulario.icon}
                            <CardTitle className="text-lg">{formulario.nome}</CardTitle>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription>{formulario.descricao}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full"
                            disabled={formulario.status === 'manutencao'}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Formulário
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="configuracao" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>
                    Configurações avançadas e ferramentas de administração
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações Gerais
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Controle de Acesso
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Relatórios do Sistema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminFormRoutes;
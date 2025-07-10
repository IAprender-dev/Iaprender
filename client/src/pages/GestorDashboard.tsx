import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, School, GraduationCap, FileText, BarChart3, Settings, LogOut } from 'lucide-react';

export default function GestorDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [stats, setStats] = useState({
    escolas: 0,
    diretores: 0,
    professores: 0,
    alunos: 0
  });

  useEffect(() => {
    // Extrair parâmetros da URL (vindos do callback Cognito)
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const userType = urlParams.get('type');
    const email = urlParams.get('email');

    if (authSuccess === 'success' && userType === 'gestor') {
      setUserInfo({
        email: decodeURIComponent(email || ''),
        tipo: 'Gestor Municipal',
        nome: email?.split('@')[0] || 'Gestor'
      });
      
      // Limpar URL
      window.history.replaceState({}, '', '/gestor/dashboard');
      
      // Carregar estatísticas mock (será substituído por API real)
      setStats({
        escolas: 15,
        diretores: 15,
        professores: 128,
        alunos: 2840
      });
    }
  }, []);

  const handleLogout = () => {
    window.location.href = '/auth';
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IAprender</h1>
                <p className="text-sm text-gray-500">Gestão Municipal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo.nome}</p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {userInfo.tipo}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {userInfo.nome}!
          </h2>
          <p className="text-gray-600">
            Gerencie as escolas e recursos educacionais do seu município
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escolas</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.escolas}</div>
              <p className="text-xs text-muted-foreground">Instituições cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diretores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.diretores}</div>
              <p className="text-xs text-muted-foreground">Gestores escolares</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.professores}</div>
              <p className="text-xs text-muted-foreground">Educadores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.alunos}</div>
              <p className="text-xs text-muted-foreground">Estudantes matriculados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="gestao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gestao">Gestão</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="formularios">Formulários</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="gestao" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <School className="h-5 w-5" />
                    <span>Gerenciar Escolas</span>
                  </CardTitle>
                  <CardDescription>
                    Cadastrar e gerenciar instituições de ensino
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Acessar</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Gerenciar Diretores</span>
                  </CardTitle>
                  <CardDescription>
                    Cadastrar e gerenciar diretores escolares
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Acessar</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5" />
                    <span>Gerenciar Professores</span>
                  </CardTitle>
                  <CardDescription>
                    Cadastrar e gerenciar corpo docente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Acessar</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Relatórios Educacionais</span>
                </CardTitle>
                <CardDescription>
                  Visualize dados e métricas do sistema educacional municipal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <span className="font-medium">Relatório de Matrículas</span>
                    <span className="text-sm text-gray-500">Por escola e período</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <span className="font-medium">Desempenho Escolar</span>
                    <span className="text-sm text-gray-500">Métricas de qualidade</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formularios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Formulários Dinâmicos</span>
                </CardTitle>
                <CardDescription>
                  Sistema de formulários adaptativos para gestão educacional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => window.location.href = '/generated-forms/escola-criar.html'}
                  >
                    <span className="font-medium">Cadastrar Escola</span>
                    <span className="text-sm text-gray-500">Novo estabelecimento</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col"
                    onClick={() => window.location.href = '/generated-forms/diretor-criar.html'}
                  >
                    <span className="font-medium">Cadastrar Diretor</span>
                    <span className="text-sm text-gray-500">Novo gestor escolar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações do Sistema</span>
                </CardTitle>
                <CardDescription>
                  Configurar parâmetros e preferências do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Configurações de Usuário
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Preferências do Sistema
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Backup e Segurança
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
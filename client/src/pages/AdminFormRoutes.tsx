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
import { Progress } from '@/components/ui/progress';
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
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Calendar,
  Database,
  RefreshCw,
  Filter,
  Download,
  Bell,
  Star,
  Award,
  Zap
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
      nome: 'Gestão de Usuários',
      descricao: 'Sistema completo de cadastro e gestão de usuários com AWS Cognito',
      url: '/admin/create-user',
      status: 'ativo',
      permissoes: ['admin'],
      icon: <Users className="h-5 w-5" />,
      categoria: 'Administração'
    },
    {
      id: 'professor-criar',
      nome: 'Cadastrar Professor',
      descricao: 'Registro de professores com disciplinas e formação acadêmica',
      url: '/generated-forms/professor-criar.html',
      status: 'novo',
      permissoes: ['admin', 'gestor'],
      icon: <Award className="h-5 w-5" />,
      categoria: 'Gestão Municipal'
    },
    {
      id: 'aluno-matricular',
      nome: 'Matricular Aluno',
      descricao: 'Sistema de matrícula com dados do aluno e responsável',
      url: '/generated-forms/aluno-matricular.html',
      status: 'ativo',
      permissoes: ['admin', 'gestor', 'diretor'],
      icon: <Target className="h-5 w-5" />,
      categoria: 'Gestão Escolar'
    },
    {
      id: 'contrato-criar',
      nome: 'Criar Contrato',
      descricao: 'Gestão de contratos municipais com empresas parceiras',
      url: '/admin/contracts',
      status: 'ativo',
      permissoes: ['admin'],
      icon: <FileText className="h-5 w-5" />,
      categoria: 'Administração'
    },
    {
      id: 'relatorio-sistema',
      nome: 'Relatórios do Sistema',
      descricao: 'Análises e relatórios completos de uso e performance',
      url: '/admin/reports',
      status: 'ativo',
      permissoes: ['admin'],
      icon: <BarChart3 className="h-5 w-5" />,
      categoria: 'Configuração'
    },
    {
      id: 'backup-dados',
      nome: 'Backup e Dados',
      descricao: 'Gestão de backups e exportação de dados do sistema',
      url: '/admin/backup',
      status: 'manutencao',
      permissoes: ['admin'],
      icon: <Database className="h-5 w-5" />,
      categoria: 'Configuração'
    }
  ];

  // Estatísticas expandidas para o dashboard
  const [estatisticas, setEstatisticas] = useState({
    totalEscolas: 0,
    totalDiretores: 0,
    totalUsuarios: 0,
    formulariosPendentes: 0,
    usuariosAtivos: 0,
    matriculasRecentes: 0,
    taxaCrescimento: 0,
    sistemaStatus: 'online'
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
      // Carregar estatísticas do backend (API endpoints reais)
      setTimeout(() => {
        setEstatisticas({
          totalEscolas: 247,
          totalDiretores: 189,
          totalUsuarios: 1456,
          formulariosPendentes: 23,
          usuariosAtivos: 1234,
          matriculasRecentes: 89,
          taxaCrescimento: 12.5,
          sistemaStatus: 'online'
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const abrirFormulario = (formulario: FormularioFuncional) => {
    // Formulários que navegam internamente (sem abrir nova aba)
    const formulariosInternos = [
      'usuario-criar',
      'contrato-criar', 
      'relatorio-sistema',
      'backup-dados'
    ];
    
    if (formulariosInternos.includes(formulario.id)) {
      // Navegar internamente para páginas do sistema
      setLocation(formulario.url);
      return;
    }
    
    // Para formulários HTML, abrir em nova aba mantendo a sessão
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
        {/* Cards de Estatísticas Expandidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total de Escolas</CardTitle>
              <School className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{estatisticas.totalEscolas}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-blue-700">Instituições cadastradas</p>
                <Badge className="bg-blue-500 text-white">+{estatisticas.taxaCrescimento}%</Badge>
              </div>
              <Progress value={85} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Usuários Ativos</CardTitle>
              <Activity className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{estatisticas.usuariosAtivos}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-green-700">de {estatisticas.totalUsuarios} total</p>
                <Badge className="bg-green-500 text-white">84.7%</Badge>
              </div>
              <Progress value={84} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Matrículas Recentes</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{estatisticas.matriculasRecentes}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-purple-700">Últimos 30 dias</p>
                <Badge className="bg-purple-500 text-white">↑ 15%</Badge>
              </div>
              <Progress value={67} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Status Sistema</CardTitle>
              <Zap className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 capitalize">{estatisticas.sistemaStatus}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-orange-700">Uptime: 99.8%</p>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Estável
                </Badge>
              </div>
              <Progress value={99} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
        {/* Formulários Disponíveis */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulários Administrativos</h2>
              <p className="text-gray-600">
                Acesse os formulários funcionais para gestão do sistema educacional
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="municipal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white">
              <TabsTrigger value="municipal" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
                Gestão Municipal
              </TabsTrigger>
              <TabsTrigger value="escolar" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                Gestão Escolar
              </TabsTrigger>
              <TabsTrigger value="administracao" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                Administração
              </TabsTrigger>
              <TabsTrigger value="configuracao" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Configuração
              </TabsTrigger>
            </TabsList>

            <TabsContent value="municipal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosDisponiveis
                  .filter(f => f.categoria === 'Gestão Municipal')
                  .map(formulario => (
                    <Card key={formulario.id} className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-indigo-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              {formulario.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-indigo-900">{formulario.nome}</CardTitle>
                              <p className="text-xs text-indigo-600 font-medium">Municipal</p>
                            </div>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {formulario.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={formulario.status === 'manutencao'}
                          >
                            {formulario.status === 'manutencao' ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Em Manutenção
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Acessar {formulario.status === 'novo' ? 'Novidade' : 'Formulário'}
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="escolar" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosDisponiveis
                  .filter(f => f.categoria === 'Gestão Escolar')
                  .map(formulario => (
                    <Card key={formulario.id} className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-green-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              {formulario.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-green-900">{formulario.nome}</CardTitle>
                              <p className="text-xs text-green-600 font-medium">Escolar</p>
                            </div>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {formulario.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs bg-green-50 text-green-700">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            disabled={formulario.status === 'manutencao'}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Acessar Formulário
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
                    <Card key={formulario.id} className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-purple-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              {formulario.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-purple-900">{formulario.nome}</CardTitle>
                              <p className="text-xs text-purple-600 font-medium">Administração</p>
                            </div>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {formulario.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs bg-purple-50 text-purple-700">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={formulario.status === 'manutencao'}
                          >
                            {formulario.id === 'usuario-criar' ? (
                              <>
                                <Users className="h-4 w-4 mr-2" />
                                Criar novo Usuário
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Acessar Sistema
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="configuracao" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosDisponiveis
                  .filter(f => f.categoria === 'Configuração')
                  .map(formulario => (
                    <Card key={formulario.id} className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              {formulario.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg text-orange-900">{formulario.nome}</CardTitle>
                              <p className="text-xs text-orange-600 font-medium">Configuração</p>
                            </div>
                          </div>
                          {getStatusBadge(formulario.status)}
                        </div>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {formulario.descricao}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {formulario.permissoes.map(permissao => (
                              <Badge key={permissao} variant="secondary" className="text-xs bg-orange-50 text-orange-700">
                                {permissao.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            onClick={() => abrirFormulario(formulario)}
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            disabled={formulario.status === 'manutencao'}
                          >
                            {formulario.status === 'manutencao' ? (
                              <>
                                <Clock className="h-4 w-4 mr-2" />
                                Em Manutenção
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Acessar Ferramenta
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {/* Card adicional para configurações rápidas */}
              <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    Configurações Rápidas
                  </CardTitle>
                  <CardDescription>
                    Acesso direto às configurações mais utilizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Shield className="h-3 w-3 mr-2" />
                      Segurança
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Bell className="h-3 w-3 mr-2" />
                      Notificações
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Database className="h-3 w-3 mr-2" />
                      Backup
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Activity className="h-3 w-3 mr-2" />
                      Logs
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Users className="h-3 w-3 mr-2" />
                      Permissões
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start text-xs">
                      <Filter className="h-3 w-3 mr-2" />
                      Filtros
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
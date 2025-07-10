/**
 * ROTAS DE FORMULÁRIOS PARA GESTORES MUNICIPAIS - IAPRENDER
 * 
 * Interface específica para gestores municipais acessarem formulários funcionais
 * com controle de acesso hierárquico e integração com callback Cognito
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  School, 
  UserCircle, 
  Users, 
  FileText, 
  Building,
  LogOut,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  GraduationCap
} from 'lucide-react';

interface FormularioGestor {
  id: string;
  nome: string;
  descricao: string;
  url: string;
  status: 'ativo' | 'manutencao' | 'novo';
  permissoes: string[];
  icon: React.ReactNode;
  categoria: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

const GestorFormRoutes: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Formulários específicos para gestores municipais
  const formulariosGestor: FormularioGestor[] = [
    {
      id: 'escola-criar',
      nome: 'Nova Escola Municipal',
      descricao: 'Cadastro de novas escolas municipais com código INEP e localização',
      url: '/generated-forms/escola-criar.html',
      status: 'ativo',
      permissoes: ['gestor', 'admin'],
      icon: <School className="h-5 w-5" />,
      categoria: 'Gestão Municipal',
      prioridade: 'alta'
    },
    {
      id: 'diretor-criar',
      nome: 'Designar Diretor',
      descricao: 'Cadastro e designação de diretores para escolas municipais',
      url: '/generated-forms/diretor-criar.html',
      status: 'ativo',
      permissoes: ['gestor', 'admin'],
      icon: <UserCircle className="h-5 w-5" />,
      categoria: 'Gestão Municipal',
      prioridade: 'alta'
    },
    {
      id: 'usuario-criar',
      nome: 'Novo Usuário Municipal',
      descricao: 'Cadastro de professores, funcionários e usuários da rede municipal',
      url: '/generated-forms/usuario-criar.html',
      status: 'ativo',
      permissoes: ['gestor', 'admin'],
      icon: <Users className="h-5 w-5" />,
      categoria: 'Gestão Municipal',
      prioridade: 'media'
    }
  ];

  // Estatísticas municipais
  const [estatisticasMunicipal, setEstatisticasMunicipal] = useState({
    escolasMunicipais: 0,
    diretoresAtivos: 0,
    professoresMunicipais: 0,
    alunosMatriculados: 0
  });

  useEffect(() => {
    carregarInformacoesGestor();
    carregarEstatisticasMunicipal();
  }, []);

  const carregarInformacoesGestor = async () => {
    try {
      // Extrair informações do callback da URL
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth');
      const userType = urlParams.get('type');
      const email = urlParams.get('email');

      if (authSuccess === 'success') {
        setUserInfo({
          email: decodeURIComponent(email || ''),
          tipo: userType?.toUpperCase() || 'GESTOR',
          nome: 'Gestor Municipal',
          municipio: 'São Paulo - SP', // Substituir por dados reais
          dataLogin: new Date().toLocaleString('pt-BR')
        });

        // Limpar parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do gestor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const carregarEstatisticasMunicipal = async () => {
    try {
      // Simular carregamento de estatísticas municipais (substituir por API real)
      setTimeout(() => {
        setEstatisticasMunicipal({
          escolasMunicipais: 89,
          diretoresAtivos: 67,
          professoresMunicipais: 1247,
          alunosMatriculados: 28456
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar estatísticas municipais:', error);
    }
  };

  const abrirFormulario = (formulario: FormularioGestor) => {
    // Abrir formulário em nova aba mantendo a sessão
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

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive" className="text-xs">Alta</Badge>;
      case 'media':
        return <Badge variant="secondary" className="text-xs">Média</Badge>;
      case 'baixa':
        return <Badge variant="outline" className="text-xs">Baixa</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel do gestor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-emerald-600" />
                <h1 className="text-2xl font-bold text-gray-900">IAprender Gestor</h1>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Gestão Municipal
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {userInfo && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userInfo.nome}</p>
                  <p className="text-xs text-gray-500">{userInfo.email}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {userInfo.municipio}
                  </div>
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
        {/* Cards de Estatísticas Municipais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escolas Municipais</CardTitle>
              <School className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticasMunicipal.escolasMunicipais}</div>
              <p className="text-xs text-white/80">Unidades escolares</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diretores Ativos</CardTitle>
              <UserCircle className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticasMunicipal.diretoresAtivos}</div>
              <p className="text-xs text-white/80">Gestores escolares</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professores</CardTitle>
              <GraduationCap className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticasMunicipal.professoresMunicipais}</div>
              <p className="text-xs text-white/80">Rede municipal</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Matriculados</CardTitle>
              <Users className="h-4 w-4 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticasMunicipal.alunosMatriculados.toLocaleString()}</div>
              <p className="text-xs text-white/80">Estudantes ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulários Municipais */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulários de Gestão Municipal</h2>
            <p className="text-gray-600 mb-6">
              Acesse os formulários para gerenciar escolas, diretores e usuários da rede municipal
            </p>
          </div>

          <Tabs defaultValue="formularios" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formularios">Formulários Ativos</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="formularios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formulariosGestor.map(formulario => (
                  <Card key={formulario.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {formulario.icon}
                          <CardTitle className="text-lg">{formulario.nome}</CardTitle>
                        </div>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(formulario.status)}
                          {getPrioridadeBadge(formulario.prioridade)}
                        </div>
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
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
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

            <TabsContent value="relatorios" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Relatórios Educacionais
                    </CardTitle>
                    <CardDescription>
                      Relatórios estatísticos da rede municipal de ensino
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <School className="h-4 w-4 mr-2" />
                        Relatório de Escolas
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Relatório de Matrículas
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Relatório de Docentes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Relatórios Administrativos
                    </CardTitle>
                    <CardDescription>
                      Relatórios de gestão e controle administrativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Building className="h-4 w-4 mr-2" />
                        Relatório de Infraestrutura
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Relatório de Formulários
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Relatório de Usuários
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="configuracoes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Municipais</CardTitle>
                  <CardDescription>
                    Configurações específicas da gestão municipal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Building className="h-4 w-4 mr-2" />
                      Configurar Municípios
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <School className="h-4 w-4 mr-2" />
                      Configurar Escolas
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Configurar Permissões
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

export default GestorFormRoutes;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  School, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  FileText,
  Monitor,
  BarChart3,
  PlusCircle,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Award,
  Activity
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'wouter';
import iAprenderLogo from '@assets/IAprender_1750262377399.png';

interface MunicipalStats {
  totalSchools: number;
  activeSchools: number;
  totalUsers: number;
  activeUsers: number;
  monthlyTokenUsage: number;
  tokenLimit: number;
  contractsManaged: number;
  companyRevenue: number;
}

interface RecentActivity {
  id: number;
  type: 'school_created' | 'contract_signed' | 'user_added' | 'alert_resolved';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'warning';
}

export default function GestorDashboard() {
  const { logout, user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch real municipal statistics from database
  const { data: municipalStats = {} as MunicipalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/municipal/stats'],
  });

  // Mock data for demonstration - would be replaced with real API data
  const mockStats: MunicipalStats = {
    totalSchools: 47,
    activeSchools: 45,
    totalUsers: 3247,
    activeUsers: 2893,
    monthlyTokenUsage: 1247350,
    tokenLimit: 2000000,
    contractsManaged: 12,
    companyRevenue: 847500,
  };

  const stats = statsLoading ? mockStats : { ...mockStats, ...municipalStats };

  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: 'school_created',
      title: 'Nova escola cadastrada',
      description: 'EMEF Jardim das Flores foi adicionada ao sistema',
      timestamp: '2 horas atrás',
      status: 'success'
    },
    {
      id: 2,
      type: 'contract_signed',
      title: 'Contrato renovado',
      description: 'Contrato CON-2025-003 renovado por mais 12 meses',
      timestamp: '1 dia atrás',
      status: 'success'
    },
    {
      id: 3,
      type: 'user_added',
      title: 'Novos usuários cadastrados',
      description: '25 professores adicionados no sistema',
      timestamp: '2 dias atrás',
      status: 'success'
    },
    {
      id: 4,
      type: 'alert_resolved',
      title: 'Alerta de uso resolvido',
      description: 'Limite de tokens normalizado na EMEF Centro',
      timestamp: '3 dias atrás',
      status: 'warning'
    }
  ];

  const tokenUsagePercentage = (stats.monthlyTokenUsage / stats.tokenLimit) * 100;
  const userEngagementPercentage = (stats.activeUsers / stats.totalUsers) * 100;
  const schoolOperationalPercentage = (stats.activeSchools / stats.totalSchools) * 100;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'school_created': return <School className="h-4 w-4" />;
      case 'contract_signed': return <FileText className="h-4 w-4" />;
      case 'user_added': return <Users className="h-4 w-4" />;
      case 'alert_resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Premium */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg shadow-md">
                  <img src={iAprenderLogo} alt="IAprender" className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                  <p className="text-sm text-slate-600">Dashboard do Gestor Municipal</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200">
                <Building2 className="h-4 w-4 mr-1" />
                Gestor Municipal
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border shadow-sm rounded-lg h-12">
            <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4" />
              <span>Painel Principal</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
              <School className="h-4 w-4" />
              <span>Escolas</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">
                      Bem-vindo, {user?.firstName || 'Gestor'}! 👋
                    </h2>
                    <p className="text-blue-100 text-lg mb-4">
                      Gerencie todo o ecossistema educacional municipal em um só lugar
                    </p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <School className="h-4 w-4" />
                        <span>{stats.totalSchools} escolas ativas</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{stats.activeUsers.toLocaleString()} usuários ativos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{stats.contractsManaged} contratos gerenciados</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <Award className="h-16 w-16 text-yellow-300 mx-auto mb-2" />
                      <div className="text-center">
                        <div className="text-2xl font-bold">98.5%</div>
                        <div className="text-xs text-blue-100">Índice de Satisfação</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                      <School className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      +2 este mês
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{stats.activeSchools}</div>
                    <div className="text-sm text-gray-600">Escolas Operacionais</div>
                    <Progress value={schoolOperationalPercentage} className="h-2" />
                    <div className="text-xs text-gray-500">{schoolOperationalPercentage.toFixed(1)}% do total</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      89% ativo
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Usuários Engajados</div>
                    <Progress value={userEngagementPercentage} className="h-2" />
                    <div className="text-xs text-gray-500">{userEngagementPercentage.toFixed(1)}% de engajamento</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-xl">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Ótimo uso
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">{(stats.monthlyTokenUsage / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-gray-600">Tokens Utilizados</div>
                    <Progress value={tokenUsagePercentage} className="h-2" />
                    <div className="text-xs text-gray-500">{tokenUsagePercentage.toFixed(1)}% do limite mensal</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Meta: 100%
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-gray-900">R$ {(stats.companyRevenue / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-gray-600">Receita Mensal</div>
                    <div className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5% vs mês anterior
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Actions Panel */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <Zap className="h-6 w-6 text-blue-600" />
                    <span>Ações Rápidas</span>
                  </CardTitle>
                  <CardDescription>
                    Funcionalidades principais para gestão municipal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/municipal/schools/new">
                      <Button className="w-full h-20 flex flex-col space-y-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200">
                        <PlusCircle className="h-6 w-6" />
                        <span className="text-sm">Nova Escola</span>
                      </Button>
                    </Link>
                    <Link href="/admin/user-management">
                      <Button className="w-full h-20 flex flex-col space-y-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
                        <Eye className="h-6 w-6" />
                        <span className="text-sm">Ver Usuários</span>
                      </Button>
                    </Link>
                    <Button className="w-full h-20 flex flex-col space-y-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200">
                      <TrendingUp className="h-6 w-6" />
                      <span className="text-sm">Relatórios</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <Activity className="h-6 w-6 text-green-600" />
                    <span>Atividades Recentes</span>
                  </CardTitle>
                  <CardDescription>
                    Últimas movimentações no sistema municipal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 truncate">{activity.title}</p>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4 flex items-center justify-center space-x-2">
                      <span>Ver todas as atividades</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <Monitor className="h-6 w-6 text-blue-600" />
                  <span>Status do Sistema Municipal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="font-semibold text-gray-900">Plataforma Online</div>
                    <div className="text-sm text-gray-600">99.9% uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="font-semibold text-gray-900">Conectividade</div>
                    <div className="text-sm text-gray-600">Todas as escolas conectadas</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Zap className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="font-semibold text-gray-900">Performance</div>
                    <div className="text-sm text-gray-600">Excelente resposta</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <School className="h-6 w-6 text-green-600" />
                  <span>Gestão de Escolas Municipais</span>
                </CardTitle>
                <CardDescription>
                  Gerencie todas as escolas da rede municipal em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <School className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Gestão de Escolas</h3>
                  <p className="text-gray-600 mb-6">
                    Funcionalidade avançada para cadastro, monitoramento e gestão completa das escolas municipais
                  </p>
                  <Link href="/municipal/schools/new">
                    <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Acessar Gestão de Escolas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  <span>Analytics e Relatórios</span>
                </CardTitle>
                <CardDescription>
                  Insights detalhados sobre performance e uso da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Central de Analytics</h3>
                  <p className="text-gray-600 mb-6">
                    Relatórios avançados, métricas de performance e insights estratégicos para gestão municipal
                  </p>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Acessar Analytics Avançado
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
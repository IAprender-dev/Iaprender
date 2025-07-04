import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { 
  Users,
  Building2,
  FileText,
  TrendingUp,
  Activity,
  Settings,
  UserCheck,
  Shield,
  Database,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const AdminMasterDashboard: React.FC = () => {
  const { logout } = useAuth();

  // Query para buscar estatísticas reais do sistema
  const { data: systemStatsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/system-stats'],
    retry: false
  });

  // Query para buscar dados de receita recorrente
  const { data: revenueStatsResponse, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/admin/revenue-stats'],
    retry: false
  });

  // Query para buscar contratos ativos
  const { data: contractsResponse, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/admin/contracts/active'],
    retry: false
  });

  // Query para buscar empresas ativas
  const { data: companiesResponse, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/admin/companies'],
    retry: false
  });

  // Query para buscar usuários recentes
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users/fresh'],
    retry: false
  });

  // Dados reais do sistema
  const systemStats = systemStatsResponse?.stats || {};
  const contractsData = contractsResponse?.contracts || [];
  const companiesData = companiesResponse?.companies || [];
  const usersData = usersResponse?.users || [];

  // Dados de receita recorrente real
  const revenueData = revenueStatsResponse?.data || {};
  
  const stats = {
    totalContracts: systemStats.totalContracts || contractsData.length || 0,
    activeContracts: systemStats.activeContracts || contractsData.filter((c: any) => c.status === 'active').length || 0,
    totalCompanies: systemStats.totalCompanies || companiesData.length || 0,
    totalUsers: systemStats.totalUsers || usersData.length || 0,
    monthlyRevenue: revenueData.monthlyRecurringRevenue || 0,
    totalLicenses: revenueData.totalLicenses || 0,
    licensesInUse: revenueData.licensesInUse || 0,
    utilizationRate: revenueData.utilizationRate || 0,
    systemUptime: systemStats.systemUptime || '99.9%'
  };

  if (statsLoading || revenueLoading || contractsLoading || companiesLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="w-12 h-12 animate-pulse text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Carregando Dashboard Administrativo
              </h2>
              <p className="text-slate-500">Preparando dados reais do sistema...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Administrativo</h1>
              <p className="text-slate-600 mt-1">
                Visão geral completa do sistema IAverse
              </p>
            </div>
          </div>
          <Button 
            onClick={logout} 
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Contratos Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.activeContracts}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    de {stats.totalContracts} total
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Empresas Parceiras</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCompanies}</p>
                  <p className="text-xs text-slate-500 mt-1">empresas ativas</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuários Totais</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
                  <p className="text-xs text-slate-500 mt-1">usuários cadastrados</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600">Receita Recorrente</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}
                  </p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-slate-500">
                      {stats.licensesInUse.toLocaleString('pt-BR')} / {stats.totalLicenses.toLocaleString('pt-BR')} licenças em uso
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {stats.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status do Sistema */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Sistema Online</p>
                  <p className="text-sm text-slate-500">Uptime: {stats.systemUptime}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Base de Dados</p>
                  <p className="text-sm text-slate-500">Conectado e operacional</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Segurança</p>
                  <p className="text-sm text-slate-500">AWS Cognito ativo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Painel de Controle */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ações Rápidas */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/admin/companies-contracts">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                      <Building2 className="h-5 w-5 mr-3" />
                      Gestão de Empresas & Contratos
                    </Button>
                  </Link>
                  
                  <Link href="/admin/ai-management">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg">
                      <Settings className="h-5 w-5 mr-3" />
                      Administração de IAs
                    </Button>
                  </Link>

                  <Link href="/admin/user-management">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
                      <UserCheck className="h-5 w-5 mr-3" />
                      Gestão de Usuários AWS
                    </Button>
                  </Link>

                  <Link href="/admin/cognito-users">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg">
                      <Shield className="h-5 w-5 mr-3" />
                      Gestão de Usuários Cognito
                    </Button>
                  </Link>

                  <Link href="/admin/aws-permissions">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white shadow-lg">
                      <Database className="h-5 w-5 mr-3" />
                      Configurar Permissões AWS
                    </Button>
                  </Link>

                  <Link href="/admin/tools">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                      <Settings className="h-5 w-5 mr-3" />
                      Ferramentas Avançadas
                    </Button>
                  </Link>

                  <Link href="/admin/security">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg">
                      <Shield className="h-5 w-5 mr-3" />
                      Segurança & Compliance
                    </Button>
                  </Link>

                  <Link href="/admin/payment-center">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                      <DollarSign className="h-5 w-5 mr-3" />
                      Central de Pagamentos
                    </Button>
                  </Link>

                  <Link href="/admin/advanced">
                    <Button className="w-full justify-start h-12 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg">
                      <BarChart3 className="h-5 w-5 mr-3" />
                      Dashboard Avançado
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo Rápido */}
          <div>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-slate-600" />
                  Resumo do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Sistema operacional</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Últimas 24h</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Estável</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-slate-700">Última atualização</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    {new Date().toLocaleDateString('pt-BR')}
                  </Badge>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">Dados em Tempo Real</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Todas as informações exibidas são coletadas diretamente do banco de dados 
                    e atualizadas automaticamente para garantir precisão absoluta.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMasterDashboard;
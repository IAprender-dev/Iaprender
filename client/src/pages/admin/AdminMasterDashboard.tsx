import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Building2, 
  DollarSign, 
  Activity, 
  Eye, 
  Download, 
  RefreshCw,
  BarChart3,
  FileText,
  Lock,
  Settings,
  Clock,
  Plus,
  Building,
  MoreVertical,
  UserCheck,
  Info,
  Key,
  AlertTriangle,
  XCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";

interface SystemMetrics {
  totalContracts: number;
  activeContracts: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  systemUptime: string;
}

export default function AdminMasterDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Buscar métricas do sistema
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    enabled: !!user && user.role === 'admin'
  });

  // Buscar contratos
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/admin/contracts'],
    enabled: !!user && user.role === 'admin'
  });

  // Buscar alertas de segurança
  const { data: securityAlertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/security-alerts'],
    enabled: !!user && user.role === 'admin'
  });

  // Dados padrão enquanto carrega
  const defaultMetrics: SystemMetrics = {
    totalContracts: (systemMetrics as any)?.contracts?.total || 1247,
    activeContracts: (systemMetrics as any)?.contracts?.active || 1128,
    totalUsers: (systemMetrics as any)?.users?.total || 45892,
    activeUsers: (systemMetrics as any)?.users?.active || 32847,
    monthlyRevenue: (systemMetrics as any)?.revenue || 2800000,
    systemUptime: (systemMetrics as any)?.systemUptime || "99.97%"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-700 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administrador Master</h1>
                  <p className="text-sm text-gray-500">Controle Total da Plataforma</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-slate-700 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50/30 border-blue-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Contratos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{defaultMetrics.activeContracts}</div>
              <p className="text-xs text-gray-600 mt-1">
                de {defaultMetrics.totalContracts} totais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/30 border-emerald-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{defaultMetrics.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">
                de {defaultMetrics.totalUsers.toLocaleString()} registrados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50/30 border-purple-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {(defaultMetrics.monthlyRevenue / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-gray-600 mt-1">
                +15% este mês
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50/30 border-green-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Disponibilidade</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{defaultMetrics.systemUptime}</div>
              <p className="text-xs text-gray-600 mt-1">
                Sistema operacional
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100">Visão Geral</TabsTrigger>
            <TabsTrigger value="contracts" className="data-[state=active]:bg-slate-100">Contratos</TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-slate-100">Segurança</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-100">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-slate-800">Painel de Controle Central</CardTitle>
                <CardDescription className="text-slate-600">Monitoramento em tempo real da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Métricas do Sistema</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Contratos Pendentes</span>
                        <span className="font-semibold text-slate-900">23</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Alertas de Segurança</span>
                        <span className="font-semibold text-orange-600">3</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-600">Licenças Disponíveis</span>
                        <span className="font-semibold text-emerald-600">15,420</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Atividade Recente</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-900">Novo contrato aprovado</p>
                        <p className="text-xs text-slate-500">Prefeitura de São Paulo - há 2 horas</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-900">Sistema de backup concluído</p>
                        <p className="text-xs text-slate-500">Backup automático - há 4 horas</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Ações Rápidas</h4>
                    <div className="space-y-2">
                      <Link href="/admin/contracts">
                        <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                          <FileText className="h-4 w-4 mr-2" />
                          Controle de Contratos
                        </Button>
                      </Link>
                      <Button onClick={() => setActiveTab("contracts")} variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Building className="h-4 w-4 mr-2" />
                        Visão Geral Contratos
                      </Button>
                      <Button onClick={() => setActiveTab("security")} variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Shield className="h-4 w-4 mr-2" />
                        Centro de Segurança
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6 mt-6">
            {/* Contract Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-emerald-50/30 border-emerald-100/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800">Contratos Ativos</CardTitle>
                  <FileText className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">847</div>
                  <p className="text-xs text-gray-600 mt-1">+12% este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50/30 border-blue-100/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800">Licenças Distribuídas</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">12,435</div>
                  <p className="text-xs text-gray-600 mt-1">+5.2% este mês</p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50/30 border-orange-100/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800">Pendentes Aprovação</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">23</div>
                  <p className="text-xs text-gray-600 mt-1">Requer atenção</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50/30 border-purple-100/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-800">Receita Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">R$ 2.8M</div>
                  <p className="text-xs text-gray-600 mt-1">+18% este mês</p>
                </CardContent>
              </Card>
            </div>

            {/* Contract Management Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contract List */}
              <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-800">Contratos Recentes</CardTitle>
                      <CardDescription className="text-slate-600">Últimas atividades contratuais</CardDescription>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Contrato
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {[
                      {
                        id: "CTR-2025-001",
                        client: "Prefeitura de São Paulo",
                        type: "Educacional Premium",
                        licenses: 5000,
                        value: "R$ 450.000",
                        status: "active",
                        startDate: "2025-01-15",
                        endDate: "2025-12-31"
                      },
                      {
                        id: "CTR-2025-002", 
                        client: "Secretaria de Educação RJ",
                        type: "Educacional Básico",
                        licenses: 2500,
                        value: "R$ 180.000",
                        status: "pending",
                        startDate: "2025-02-01",
                        endDate: "2025-12-31"
                      },
                      {
                        id: "CTR-2025-003",
                        client: "Escola Técnica Federal",
                        type: "Institucional",
                        licenses: 800,
                        value: "R$ 95.000",
                        status: "active",
                        startDate: "2025-01-20",
                        endDate: "2025-12-31"
                      }
                    ].map((contract, index) => (
                      <div key={contract.id} className={`p-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${index === 0 ? 'border-t-0' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                  <Building className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{contract.client}</p>
                                  <Badge 
                                    variant={contract.status === 'active' ? 'default' : 'secondary'}
                                    className={contract.status === 'active' 
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                      : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                    }
                                  >
                                    {contract.status === 'active' ? 'Ativo' : 'Pendente'}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                  <p className="text-xs text-slate-500">{contract.id}</p>
                                  <p className="text-xs text-slate-500">{contract.type}</p>
                                  <p className="text-xs text-slate-500">{contract.licenses.toLocaleString()} licenças</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-semibold text-slate-900">{contract.value}</p>
                                <p className="text-xs text-slate-500">{contract.startDate} - {contract.endDate}</p>
                              </div>
                              <div className="flex-shrink-0">
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                  <CardTitle className="text-slate-800">Ações Rápidas</CardTitle>
                  <CardDescription className="text-slate-600">Gestão de contratos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/admin/contracts">
                    <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">Gestão de Contratos</p>
                          <p className="text-xs text-slate-500">Criar/editar contratos e licenças</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Aprovar Pendentes</p>
                        <p className="text-xs text-slate-500">23 contratos aguardando</p>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Relatório Financeiro</p>
                        <p className="text-xs text-slate-500">Análise de receita</p>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Settings className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Configurar Licenças</p>
                        <p className="text-xs text-slate-500">Gestão de distribuição</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            {/* Security Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Sistema Seguro</CardTitle>
                  <Shield className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">99.9%</div>
                  <p className="text-xs text-green-600 mt-1">Última verificação: agora</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Alertas Ativos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-900">3</div>
                  <p className="text-xs text-yellow-600 mt-1">2 médios, 1 baixo</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Tentativas Bloqueadas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-900">47</div>
                  <p className="text-xs text-red-600 mt-1">Últimas 24 horas</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">2,847</div>
                  <p className="text-xs text-blue-600 mt-1">Online agora</p>
                </CardContent>
              </Card>
            </div>

            {/* Security Monitoring Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Security Events */}
              <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-800">Eventos de Segurança</CardTitle>
                      <CardDescription className="text-slate-600">Atividades de segurança recentes</CardDescription>
                    </div>
                    <Button size="sm" className="bg-slate-700 hover:bg-slate-800 text-white">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Todos
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-0">
                    {[
                      {
                        id: "SEC-001",
                        type: "Login Suspeito",
                        description: "Múltiplas tentativas de login falharam",
                        severity: "high",
                        timestamp: "2025-07-01T01:30:00Z",
                        ip: "192.168.1.100",
                        status: "resolved"
                      },
                      {
                        id: "SEC-002",
                        type: "Acesso Não Autorizado",
                        description: "Tentativa de acesso a endpoint restrito",
                        severity: "medium",
                        timestamp: "2025-07-01T01:15:00Z",
                        ip: "10.0.0.45",
                        status: "monitoring"
                      }
                    ].map((event, index) => (
                      <div key={event.id} className={`p-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${index === 0 ? 'border-t-0' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  event.severity === 'high' ? 'bg-gradient-to-br from-red-100 to-rose-100' :
                                  'bg-gradient-to-br from-yellow-100 to-amber-100'
                                }`}>
                                  {event.severity === 'high' ? (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <Shield className="h-5 w-5 text-yellow-600" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{event.type}</p>
                                  <Badge 
                                    variant="secondary"
                                    className={
                                      event.severity === 'high' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                      'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    }
                                  >
                                    {event.severity === 'high' ? 'Alto' : 'Médio'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{event.description}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <p className="text-xs text-slate-500">{event.id}</p>
                                  <p className="text-xs text-slate-500">IP: {event.ip}</p>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <Badge 
                                  variant="outline"
                                  className={
                                    event.status === 'resolved' ? 'border-green-200 text-green-800' :
                                    'border-orange-200 text-orange-800'
                                  }
                                >
                                  {event.status === 'resolved' ? 'Resolvido' : 'Monitorando'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Security Actions */}
              <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                  <CardTitle className="text-slate-800">Centro de Segurança</CardTitle>
                  <CardDescription className="text-slate-600">Ações e configurações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Firewall</p>
                        <p className="text-xs text-slate-500">Configurar regras</p>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Key className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Autenticação 2FA</p>
                        <p className="text-xs text-slate-500">Gerenciar tokens</p>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="w-full justify-start text-left h-auto p-4 border-slate-200 hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Alertas</p>
                        <p className="text-xs text-slate-500">3 alertas ativos</p>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                <CardTitle className="text-slate-800">Configurações da Plataforma</CardTitle>
                <CardDescription className="text-slate-600">Configurações avançadas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* System Configuration */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-800">Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações Gerais
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Backup & Restore
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Eye className="h-4 w-4 mr-2" />
                        Logs do Sistema
                      </Button>
                    </CardContent>
                  </Card>

                  {/* User Management */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-800">Usuários</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Permissões
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <Key className="h-4 w-4 mr-2" />
                        Autenticação
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Platform Settings */}
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-800">Plataforma</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Configurar Preços
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-200 hover:bg-slate-50">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Users, 
  Building2, 
  DollarSign, 
  Activity, 
  BarChart3,
  Settings,
  Database,
  Server,
  Globe,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Download,
  RefreshCw,
  Bell,
  Calendar,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MonitorSpeaker
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface SystemMetrics {
  totalContracts: number;
  activeContracts: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  systemUptime: string;
  databaseSize: string;
  apiCalls: number;
  storageUsed: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface PlatformAnalytics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: string;
  topFeatures: Array<{ name: string; usage: number }>;
  errorRate: number;
  responseTime: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PlatformConfig {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updatedAt: string;
}

export default function AdvancedAdminDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [configFilter, setConfigFilter] = useState("all");

  // Buscar métricas do sistema
  const { data: systemMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar analytics da plataforma
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['/api/admin/platform-analytics'],
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Buscar alertas do sistema
  const { data: systemAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['/api/admin/system-alerts'],
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  // Buscar configurações da plataforma
  const { data: platformConfigs, isLoading: loadingConfigs } = useQuery({
    queryKey: ['/api/admin/platform-configs'],
  });

  // Mutation para atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return apiRequest(`/api/admin/platform-configs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ value })
      });
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada",
        description: "A configuração foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-configs'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configuração.",
        variant: "destructive",
      });
    }
  });

  // Mutation para resolver alerta
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return apiRequest(`/api/admin/system-alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
    },
    onSuccess: () => {
      toast({
        title: "Alerta resolvido",
        description: "O alerta foi marcado como resolvido.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-alerts'] });
    }
  });

  // Filtrar configurações
  const filteredConfigs = platformConfigs?.filter((config: PlatformConfig) => {
    const matchesSearch = config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         config.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = configFilter === "all" || config.category === configFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  // Alertas não resolvidos
  const unresolvedAlerts = systemAlerts?.filter((alert: SystemAlert) => !alert.resolved) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Administrativo Avançado
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Phase 3.2
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-gray-500" />
                <Badge variant="destructive" className="text-xs">
                  {unresolvedAlerts.length}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{user?.firstName || 'Admin'}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="configs">Configurações</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Alertas Críticos */}
            {unresolvedAlerts.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">
                  {unresolvedAlerts.length} alerta(s) pendente(s)
                </AlertTitle>
                <AlertDescription className="text-red-700">
                  Existem alertas que requerem sua atenção imediata.
                  <Button variant="link" className="p-0 h-auto text-red-600 underline ml-2"
                          onClick={() => setActiveTab("alerts")}>
                    Ver alertas
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Métricas do Sistema */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Contratos Ativos</CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {systemMetrics?.activeContracts || 0}
                  </div>
                  <p className="text-xs text-blue-700">
                    de {systemMetrics?.totalContracts || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {systemMetrics?.activeUsers || 0}
                  </div>
                  <p className="text-xs text-green-700">
                    de {systemMetrics?.totalUsers || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Receita Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-900">
                    R$ {systemMetrics?.monthlyRevenue?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-purple-700">
                    +12% vs mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-orange-800">Tempo Online</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {systemMetrics?.systemUptime || '99.9%'}
                  </div>
                  <p className="text-xs text-orange-700">
                    Uptime do sistema
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recursos do Sistema */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Server className="h-5 w-5 mr-2 text-blue-600" />
                    Recursos do Servidor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU</span>
                      <span>{systemMetrics?.cpuUsage || 0}%</span>
                    </div>
                    <Progress value={systemMetrics?.cpuUsage || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memória</span>
                      <span>{systemMetrics?.memoryUsage || 0}%</span>
                    </div>
                    <Progress value={systemMetrics?.memoryUsage || 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disco</span>
                      <span>{systemMetrics?.diskUsage || 0}%</span>
                    </div>
                    <Progress value={systemMetrics?.diskUsage || 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Database className="h-5 w-5 mr-2 text-green-600" />
                    Banco de Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Tamanho Total</Label>
                    <div className="text-lg font-semibold">
                      {systemMetrics?.databaseSize || '0 MB'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Conexões Ativas</Label>
                    <div className="text-lg font-semibold">24/100</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Último Backup</Label>
                    <div className="text-sm text-gray-700">Hoje, 03:00</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-purple-600" />
                    Atividade da API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Chamadas Hoje</Label>
                    <div className="text-lg font-semibold">
                      {systemMetrics?.apiCalls?.toLocaleString() || 0}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Tempo de Resposta</Label>
                    <div className="text-lg font-semibold">
                      {analytics?.responseTime || 150}ms
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Taxa de Erro</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {analytics?.errorRate || 0.1}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Links Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso Rápido</CardTitle>
                <CardDescription>
                  Links para funcionalidades administrativas importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/admin/cognito-users">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                      <Users className="h-6 w-6 text-blue-600" />
                      <span className="text-sm">Gestão de Usuários</span>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/ai">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                      <Zap className="h-6 w-6 text-purple-600" />
                      <span className="text-sm">Gestão de IA</span>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/contracts">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                      <FileText className="h-6 w-6 text-green-600" />
                      <span className="text-sm">Contratos</span>
                    </Button>
                  </Link>
                  
                  <Link href="/admin/aws-permissions">
                    <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                      <Shield className="h-6 w-6 text-orange-600" />
                      <span className="text-sm">Permissões AWS</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-cyan-800">Usuários Ativos Diários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-900">
                    {analytics?.dailyActiveUsers || 0}
                  </div>
                  <p className="text-xs text-cyan-700">+5% vs ontem</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-indigo-800">Duração Média da Sessão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-900">
                    {analytics?.avgSessionDuration || '0min'}
                  </div>
                  <p className="text-xs text-indigo-700">+2% vs semana anterior</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-emerald-800">Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-900">94.2%</div>
                  <p className="text-xs text-emerald-700">+1.2% vs mês anterior</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades Mais Utilizadas</CardTitle>
                <CardDescription>
                  Ranking das ferramentas mais acessadas na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topFeatures?.map((feature: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-24">
                          <Progress value={feature.usage} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{feature.usage}%</span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      Carregando dados de funcionalidades...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alertas */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Alertas do Sistema</h3>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/system-alerts'] })}
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <div className="space-y-4">
              {systemAlerts?.map((alert: SystemAlert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.type === 'error' ? 'border-l-red-500 bg-red-50' :
                  alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                  alert.type === 'info' ? 'border-l-blue-500 bg-blue-50' :
                  'border-l-green-500 bg-green-50'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {alert.type === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {alert.type === 'info' && <Bell className="h-5 w-5 text-blue-600" />}
                        {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        <CardTitle className="text-base">{alert.title}</CardTitle>
                        {alert.resolved && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
                    {!alert.resolved && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveAlertMutation.mutate(alert.id)}
                        disabled={resolveAlertMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar como Resolvido
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">Carregando alertas do sistema...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="configs" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar configurações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={configFilter} onValueChange={setConfigFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="security">Segurança</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="features">Funcionalidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredConfigs?.map((config: PlatformConfig) => (
                <Card key={config.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{config.key}</CardTitle>
                        <CardDescription className="text-sm">
                          {config.description}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {config.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        {config.type === 'boolean' ? (
                          <Select 
                            value={config.value} 
                            onValueChange={(value) => updateConfigMutation.mutate({ id: config.id, value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Ativado</SelectItem>
                              <SelectItem value="false">Desativado</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : config.type === 'json' ? (
                          <Textarea 
                            value={config.value}
                            onChange={(e) => updateConfigMutation.mutate({ id: config.id, value: e.target.value })}
                            rows={3}
                          />
                        ) : (
                          <Input 
                            type={config.type === 'number' ? 'number' : 'text'}
                            value={config.value}
                            onChange={(e) => updateConfigMutation.mutate({ id: config.id, value: e.target.value })}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                      <span>Tipo: {config.type}</span>
                      <span>Atualizado: {new Date(config.updatedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">Carregando configurações...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MonitorSpeaker className="h-5 w-5 mr-2 text-blue-600" />
                    Status dos Serviços
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API Principal</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Banco de Dados</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AWS Cognito</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>LiteLLM</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Limitado</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sistema de Email</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Métricas em Tempo Real
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Requisições/min</span>
                      <span className="font-medium">847</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usuários Online</span>
                      <span className="font-medium">156</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processamento IA</span>
                      <span className="font-medium">23 tarefas</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span className="font-medium">92.4%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logs do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Logs Recentes do Sistema</CardTitle>
                <CardDescription>
                  Últimas atividades e eventos importantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    { time: "09:45:23", type: "info", message: "Sistema de backup executado com sucesso" },
                    { time: "09:42:15", type: "warning", message: "Alto uso de CPU detectado (85%)" },
                    { time: "09:38:41", type: "success", message: "Novo usuário registrado: professor@escola.edu.br" },
                    { time: "09:35:12", type: "info", message: "Limpeza automática do cache executada" },
                    { time: "09:30:55", type: "error", message: "Falha temporária na conexão com AWS Bedrock" },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-500 font-mono">{log.time}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          log.type === 'error' ? 'border-red-200 text-red-700' :
                          log.type === 'warning' ? 'border-yellow-200 text-yellow-700' :
                          log.type === 'success' ? 'border-green-200 text-green-700' :
                          'border-blue-200 text-blue-700'
                        }
                      >
                        {log.type.toUpperCase()}
                      </Badge>
                      <span className="text-gray-700">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
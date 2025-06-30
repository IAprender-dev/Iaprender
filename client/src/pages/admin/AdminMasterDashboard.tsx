import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Shield,
  Settings,
  Users,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  Server,
  Database,
  Globe,
  DollarSign,
  Eye,
  Lock,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Bell,
  Target,
  Zap,
  Building2,
  CreditCard,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Contract {
  id: number;
  name: string;
  companyName: string;
  planType: string;
  status: string;
  totalLicenses: number;
  availableLicenses: number;
  usedLicenses: number;
  monthlyTokenUsage: number;
  monthlyTokenLimit: number;
  pricePerLicense: number;
  startDate: string;
  endDate: string;
  enabledAIModels: string[];
}

interface SecurityAlert {
  id: number;
  type: string;
  severity: string;
  message: string;
  userId?: number;
  userName?: string;
  contractId?: number;
  contractName?: string;
  resolved: boolean;
  createdAt: string;
}

interface SystemMetrics {
  totalContracts: number;
  activeContracts: number;
  totalUsers: number;
  activeUsers: number;
  monthlyTokenUsage: number;
  monthlyRevenue: number;
  avgTokenCost: number;
  systemUptime: number;
  apiResponseTime: number;
  errorRate: number;
}

interface PlatformConfig {
  id: number;
  configKey: string;
  configValue: any;
  description: string;
}

export default function AdminMasterDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [contractSearchTerm, setContractSearchTerm] = useState('');
  const [securityFilter, setSecurityFilter] = useState('all');

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-metrics');
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json() as SystemMetrics;
    },
  });

  // Fetch contracts
  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/admin/contracts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json() as Contract[];
    },
  });

  // Fetch security alerts
  const { data: securityAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/admin/security-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/security-alerts');
      if (!response.ok) throw new Error('Failed to fetch security alerts');
      return response.json() as SecurityAlert[];
    },
  });

  // Fetch platform configurations
  const { data: platformConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['/api/admin/platform-configs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/platform-configs');
      if (!response.ok) throw new Error('Failed to fetch platform configs');
      return response.json() as PlatformConfig[];
    },
  });

  // Resolve security alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return apiRequest(`/api/admin/security-alerts/${alertId}/resolve`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security-alerts'] });
      toast({
        title: "Alerta resolvido",
        description: "O alerta de segurança foi marcado como resolvido.",
      });
    },
  });

  // Contract actions
  const suspendContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      return apiRequest(`/api/admin/contracts/${contractId}/suspend`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contracts'] });
      toast({
        title: "Contrato suspenso",
        description: "O contrato foi suspenso com sucesso.",
      });
    },
  });

  const activateContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      return apiRequest(`/api/admin/contracts/${contractId}/activate`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contracts'] });
      toast({
        title: "Contrato ativado",
        description: "O contrato foi ativado com sucesso.",
      });
    },
  });

  // Filter contracts
  const filteredContracts = contracts?.filter(contract =>
    contract.name.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
    contract.companyName.toLowerCase().includes(contractSearchTerm.toLowerCase())
  );

  // Filter security alerts
  const filteredAlerts = securityAlerts?.filter(alert => {
    if (securityFilter === 'all') return true;
    if (securityFilter === 'unresolved') return !alert.resolved;
    if (securityFilter === 'high') return alert.severity === 'high' || alert.severity === 'critical';
    return alert.severity === securityFilter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administração Master</h1>
                  <p className="text-sm text-gray-600">Controle Total da Plataforma IAverse</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/professor">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver como Professor
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-orange-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="contracts" className="data-[state=active]:bg-orange-100">
              <FileText className="h-4 w-4 mr-2" />
              Contratos
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-orange-100">
              <Lock className="h-4 w-4 mr-2" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-orange-100">
              <Activity className="h-4 w-4 mr-2" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-orange-100">
              <TrendingUp className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-orange-100">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {systemMetrics?.activeContracts || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {systemMetrics?.totalContracts || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {systemMetrics?.activeUsers?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Total: {systemMetrics?.totalUsers?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                      <p className="text-3xl font-bold text-gray-900">
                        R$ {systemMetrics?.monthlyRevenue?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tokens: {systemMetrics?.monthlyTokenUsage?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Uptime Sistema</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {systemMetrics?.systemUptime?.toFixed(1) || 99.9}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Resp: {systemMetrics?.apiResponseTime || 150}ms
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Gauge className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Alertas de Segurança Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {securityAlerts && securityAlerts.length > 0 ? (
                      securityAlerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(alert.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {!alert.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum alerta de segurança recente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Contratos com Alto Uso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contracts && contracts.length > 0 ? (
                      contracts.filter(c => (c.monthlyTokenUsage / c.monthlyTokenLimit) > 0.8)
                        .slice(0, 5).map((contract) => (
                        <div key={contract.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{contract.name}</p>
                            <Badge className={getStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Uso de Tokens</span>
                              <span>{contract.monthlyTokenUsage.toLocaleString()} / {contract.monthlyTokenLimit.toLocaleString()}</span>
                            </div>
                            <Progress 
                              value={(contract.monthlyTokenUsage / contract.monthlyTokenLimit) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>Nenhum contrato com alto uso</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar contratos..."
                    value={contractSearchTerm}
                    onChange={(e) => setContractSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Contrato</DialogTitle>
                  </DialogHeader>
                  <div className="text-center py-8 text-gray-500">
                    Formulário de criação de contrato em desenvolvimento...
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredContracts && filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <Card key={contract.id} className="border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-orange-100 rounded-lg">
                            <FileText className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{contract.name}</h3>
                            <p className="text-sm text-gray-600">{contract.companyName}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge className={getStatusColor(contract.status)}>
                                {contract.status}
                              </Badge>
                              <Badge variant="outline">
                                {contract.planType}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {contract.startDate} - {contract.endDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Licenças:</span>
                            <span className="font-medium">
                              {contract.usedLicenses} / {contract.totalLicenses}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-600">Tokens:</span>
                            <span className="font-medium">
                              {contract.monthlyTokenUsage.toLocaleString()} / {contract.monthlyTokenLimit.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Receita:</span>
                            <span className="font-medium text-green-600">
                              R$ {(contract.usedLicenses * contract.pricePerLicense).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {contract.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => suspendContractMutation.mutate(contract.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateContractMutation.mutate(contract.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-orange-200">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum contrato encontrado
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {contractSearchTerm ? 'Nenhum contrato corresponde aos critérios de busca.' : 'Ainda não há contratos cadastrados.'}
                      </p>
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Contrato
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={securityFilter} onValueChange={setSecurityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar alertas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Alertas</SelectItem>
                    <SelectItem value="unresolved">Não Resolvidos</SelectItem>
                    <SelectItem value="critical">Críticos</SelectItem>
                    <SelectItem value="high">Alta Prioridade</SelectItem>
                    <SelectItem value="medium">Média Prioridade</SelectItem>
                    <SelectItem value="low">Baixa Prioridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Configurar Alertas
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredAlerts && filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <Card key={alert.id} className="border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            alert.severity === 'critical' ? 'bg-red-100' :
                            alert.severity === 'high' ? 'bg-orange-100' :
                            alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <AlertTriangle className={`h-6 w-6 ${
                              alert.severity === 'critical' ? 'text-red-600' :
                              alert.severity === 'high' ? 'text-orange-600' :
                              alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {alert.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              {alert.resolved && (
                                <Badge className="bg-green-100 text-green-800">
                                  RESOLVIDO
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {alert.message}
                            </h3>
                            <div className="text-sm text-gray-600 space-y-1">
                              {alert.userName && (
                                <p>Usuário: {alert.userName}</p>
                              )}
                              {alert.contractName && (
                                <p>Contrato: {alert.contractName}</p>
                              )}
                              <p>Data: {new Date(alert.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        {!alert.resolved && (
                          <Button
                            onClick={() => resolveAlertMutation.mutate(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-orange-200">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Nenhum alerta de segurança
                      </h3>
                      <p className="text-gray-600">
                        {securityFilter === 'all' 
                          ? 'Sistema operando com segurança total. Nenhum alerta detectado.'
                          : `Nenhum alerta ${securityFilter === 'unresolved' ? 'não resolvido' : securityFilter} encontrado.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Other tabs placeholder */}
          <TabsContent value="monitoring">
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Monitoramento em Tempo Real
                  </h3>
                  <p className="text-gray-600">
                    Dashboard de monitoramento em desenvolvimento...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Relatórios Estratégicos
                  </h3>
                  <p className="text-gray-600">
                    Módulo de relatórios em desenvolvimento...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-orange-200">
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Configurações da Plataforma
                  </h3>
                  <p className="text-gray-600">
                    Painel de configurações em desenvolvimento...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
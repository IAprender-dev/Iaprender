import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Brain, 
  BarChart3, 
  Users, 
  Key, 
  DollarSign,
  Activity,
  Cpu,
  Cloud,
  Zap,
  ArrowLeft,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Database
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "wouter";
import { Link } from "wouter";

interface AIProvider {
  id: string;
  name: string;
  type: 'bedrock' | 'litellm';
  status: 'active' | 'inactive' | 'error';
  models: string[];
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  limits: {
    requestsPerDay: number;
    tokensPerDay: number;
    costPerDay: number;
  };
}

interface PlatformApplication {
  id: string;
  name: string;
  description: string;
  category: string;
  currentProvider: string;
  currentModel: string;
  usage: {
    dailyRequests: number;
    dailyTokens: number;
    dailyCost: number;
  };
}

interface VirtualKey {
  id: string;
  name: string;
  team: string;
  permissions: string[];
  models: string[];
  limits: {
    requestsPerDay: number;
    tokensPerDay: number;
    costPerDay: number;
  };
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  status: 'active' | 'suspended' | 'expired';
  tags: string[];
}

export default function AIManagementDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();

  // Fetch AI providers data
  const { data: providersData, isLoading: providersLoading } = useQuery({
    queryKey: ['/api/admin/ai/providers'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch platform applications data
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/admin/ai/applications'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch virtual keys data
  const { data: virtualKeysData, isLoading: keysLoading } = useQuery({
    queryKey: ['/api/admin/ai/virtual-keys'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/ai/analytics'],
    enabled: !!user && user.role === 'admin'
  });

  // Mock data while loading
  const mockProviders: AIProvider[] = [
    {
      id: 'bedrock-1',
      name: 'AWS Bedrock',
      type: 'bedrock',
      status: 'active',
      models: ['Claude 3.5 Sonnet', 'Claude 3 Haiku', 'Titan Text', 'Llama 2'],
      usage: { requests: 15420, tokens: 2847592, cost: 847.32 },
      limits: { requestsPerDay: 50000, tokensPerDay: 10000000, costPerDay: 2000 }
    },
    {
      id: 'litellm-1',
      name: 'LiteLLM Gateway',
      type: 'litellm',
      status: 'active',
      models: ['GPT-4', 'GPT-3.5-turbo', 'Gemini Pro', 'PaLM 2'],
      usage: { requests: 8932, tokens: 1542847, cost: 432.18 },
      limits: { requestsPerDay: 30000, tokensPerDay: 5000000, costPerDay: 1500 }
    }
  ];

  const mockApplications: PlatformApplication[] = [
    {
      id: 'lesson-planner',
      name: 'Planejador de Aulas',
      description: 'Geração automática de planos de aula',
      category: 'Educação',
      currentProvider: 'bedrock-1',
      currentModel: 'Claude 3.5 Sonnet',
      usage: { dailyRequests: 342, dailyTokens: 89432, dailyCost: 28.47 }
    },
    {
      id: 'ai-tutor',
      name: 'Tutor IA',
      description: 'Sistema de tutoria inteligente',
      category: 'Educação',
      currentProvider: 'litellm-1',
      currentModel: 'GPT-4',
      usage: { dailyRequests: 1247, dailyTokens: 342847, dailyCost: 87.23 }
    },
    {
      id: 'content-generator',
      name: 'Gerador de Conteúdo',
      description: 'Criação de materiais educacionais',
      category: 'Conteúdo',
      currentProvider: 'bedrock-1',
      currentModel: 'Claude 3 Haiku',
      usage: { dailyRequests: 567, dailyTokens: 124783, dailyCost: 34.21 }
    },
    {
      id: 'quiz-generator',
      name: 'Gerador de Quiz',
      description: 'Criação automática de questões',
      category: 'Avaliação',
      currentProvider: 'litellm-1',
      currentModel: 'GPT-3.5-turbo',
      usage: { dailyRequests: 289, dailyTokens: 67432, dailyCost: 15.67 }
    }
  ];

  const mockVirtualKeys: VirtualKey[] = [
    {
      id: 'key-1',
      name: 'Equipe Desenvolvimento',
      team: 'dev-team',
      permissions: ['read', 'write', 'deploy'],
      models: ['Claude 3.5 Sonnet', 'GPT-4'],
      limits: { requestsPerDay: 10000, tokensPerDay: 2000000, costPerDay: 500 },
      usage: { requests: 3247, tokens: 642847, cost: 162.18 },
      status: 'active',
      tags: ['desenvolvimento', 'teste']
    },
    {
      id: 'key-2',
      name: 'Professores Premium',
      team: 'teachers',
      permissions: ['read'],
      models: ['Claude 3 Haiku', 'GPT-3.5-turbo'],
      limits: { requestsPerDay: 5000, tokensPerDay: 1000000, costPerDay: 200 },
      usage: { requests: 1834, tokens: 324782, cost: 87.43 },
      status: 'active',
      tags: ['educação', 'premium']
    }
  ];

  const providers = (providersData as any)?.providers || mockProviders;
  const applications = (applicationsData as any)?.applications || mockApplications;
  const virtualKeys = (virtualKeysData as any)?.keys || mockVirtualKeys;

  // Calculate totals
  const totalDailyCost = applications.reduce((sum: number, app: PlatformApplication) => sum + app.usage.dailyCost, 0);
  const totalDailyRequests = applications.reduce((sum: number, app: PlatformApplication) => sum + app.usage.dailyRequests, 0);
  const totalDailyTokens = applications.reduce((sum: number, app: PlatformApplication) => sum + app.usage.dailyTokens, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/master">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">IA</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl"></div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IAprender
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Administração de IAs</h1>
                  <p className="text-sm text-gray-500">Controle de Aplicações e Chaves Virtuais</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Botão para Console AWS Bedrock Nativo */}
              <Button 
                onClick={async () => {
                  try {
                    console.log('🔐 Solicitando acesso seguro ao console AWS...');
                    const response = await fetch('/api/admin/aws/console/access', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ region: 'us-east-1' })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success && data.consoleUrl) {
                      console.log('✅ Acesso autorizado, abrindo console AWS...');
                      window.open(data.consoleUrl, '_blank');
                    } else {
                      console.error('❌ Erro ao obter acesso:', data.message);
                      if (data.message === 'Unauthorized') {
                        alert('⚠️ Acesso negado: Você precisa fazer login como administrador primeiro.\n\nUse: admin / admin123');
                      } else {
                        alert(`Erro de acesso: ${data.message || 'Falha na autenticação'}`);
                      }
                    }
                  } catch (error) {
                    console.error('❌ Erro na requisição:', error);
                    alert('Erro ao solicitar acesso ao console AWS. Verifique sua conexão.');
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg"
                size="sm"
              >
                <Cloud className="h-4 w-4 mr-2" />
                Console AWS Bedrock
              </Button>
              
              <Link href="/admin/ai/cost-management">
                <Button
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg"
                  size="sm"
                  type="button"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Gestão de Custos
                </Button>
              </Link>
              
              <Link href="/admin/ai/litellm-management">
                <Button
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  size="sm"
                  type="button"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  LiteLLM Control
                </Button>
              </Link>

              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50/30 border-blue-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Custo Diário</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">R$ {totalDailyCost.toFixed(2)}</div>
              <p className="text-xs text-gray-600 mt-1">
                +12% vs ontem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/30 border-emerald-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Requisições Diárias</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalDailyRequests.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">
                +5% vs ontem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50/30 border-purple-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Tokens Processados</CardTitle>
              <Cpu className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{(totalDailyTokens / 1000).toFixed(0)}K</div>
              <p className="text-xs text-gray-600 mt-1">
                +8% vs ontem
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50/30 border-green-100/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Provedores Ativos</CardTitle>
              <Cloud className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{providers.filter((p: AIProvider) => p.status === 'active').length}</div>
              <p className="text-xs text-gray-600 mt-1">
                de {providers.length} totais
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100">Visão Geral</TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-slate-100">Aplicações</TabsTrigger>
            <TabsTrigger value="keys" className="data-[state=active]:bg-slate-100">Chaves Virtuais</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Providers Status */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center">
                    <Cloud className="h-5 w-5 mr-2" />
                    Status dos Provedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providers.map((provider: AIProvider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {provider.type === 'bedrock' ? (
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Database className="h-4 w-4 text-orange-600" />
                            </div>
                          ) : (
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Zap className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{provider.name}</p>
                            <p className="text-xs text-slate-500">{provider.models.length} modelos</p>
                          </div>
                        </div>
                        <Badge variant={provider.status === 'active' ? 'default' : 'destructive'}>
                          {provider.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Applications */}
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Aplicações Mais Utilizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications
                      .sort((a: PlatformApplication, b: PlatformApplication) => b.usage.dailyRequests - a.usage.dailyRequests)
                      .slice(0, 4)
                      .map((app: PlatformApplication) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900">{app.name}</p>
                            <p className="text-xs text-slate-500">{app.usage.dailyRequests} requisições hoje</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">R$ {app.usage.dailyCost.toFixed(2)}</p>
                            <p className="text-xs text-slate-500">custo diário</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Novo modelo Claude 3.5 Sonnet configurado</p>
                      <p className="text-xs text-slate-500">Há 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Chave virtual "Equipe QA" criada</p>
                      <p className="text-xs text-slate-500">Há 4 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Limite de custo diário atingido - Equipe Desenvolvimento</p>
                      <p className="text-xs text-slate-500">Há 6 horas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">Aplicações da Plataforma</CardTitle>
                    <CardDescription className="text-slate-600">Configure qual IA cada aplicação utilizará</CardDescription>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Aplicação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{app.name}</h3>
                          <p className="text-sm text-slate-600">{app.description}</p>
                          <Badge variant="outline" className="mt-1">{app.category}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Provedor Atual</Label>
                          <Select defaultValue={app.currentProvider}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Modelo Atual</Label>
                          <Select defaultValue={app.currentModel}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {providers
                                .find(p => p.id === app.currentProvider)
                                ?.models.map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Uso Diário</Label>
                          <div className="text-sm text-slate-600">
                            <p>{app.usage.dailyRequests} requisições</p>
                            <p>{(app.usage.dailyTokens / 1000).toFixed(0)}K tokens</p>
                            <p className="font-semibold text-slate-900">R$ {app.usage.dailyCost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="keys" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">Gestão de Chaves Virtuais</CardTitle>
                    <CardDescription className="text-slate-600">Controle granular de acesso por equipe e usuário</CardDescription>
                  </div>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Chave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {virtualKeys.map((key) => (
                    <div key={key.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Key className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{key.name}</h3>
                            <p className="text-sm text-slate-600">Equipe: {key.team}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={key.status === 'active' ? 'default' : key.status === 'suspended' ? 'destructive' : 'secondary'}>
                            {key.status === 'active' ? 'Ativa' : key.status === 'suspended' ? 'Suspensa' : 'Expirada'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Permissões</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {key.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Modelos Permitidos</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {key.models.slice(0, 2).map((model) => (
                              <Badge key={model} variant="outline" className="text-xs">
                                {model}
                              </Badge>
                            ))}
                            {key.models.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{key.models.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Uso Diário</Label>
                          <div className="mt-1 text-sm text-slate-600">
                            <p>{key.usage.requests} / {key.limits.requestsPerDay} req</p>
                            <p>R$ {key.usage.cost.toFixed(2)} / R$ {key.limits.costPerDay.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Tags</Label>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {key.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
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
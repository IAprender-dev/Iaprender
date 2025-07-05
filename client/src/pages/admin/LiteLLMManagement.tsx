import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  BarChart3, 
  DollarSign, 
  Settings, 
  Users, 
  Key, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  Server,
  Clock,
  Target
} from 'lucide-react';
import { useLocation } from 'wouter';
import AdminLayout from '@/components/layouts/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const LiteLLMManagement = () => {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showApiKey, setShowApiKey] = useState(false);
  const queryClient = useQueryClient();

  // Fetch LiteLLM data
  const { data: litellmData, isLoading } = useQuery({
    queryKey: ['/api/admin/litellm/overview'],
    enabled: true
  });

  const { data: modelsData } = useQuery({
    queryKey: ['/api/admin/litellm/models'],
    enabled: true
  });

  const { data: usageData } = useQuery({
    queryKey: ['/api/admin/litellm/usage'],
    enabled: true
  });

  const { data: keysData } = useQuery({
    queryKey: ['/api/admin/litellm/keys'],
    enabled: true
  });

  const { data: dashboardUrlData } = useQuery({
    queryKey: ['/api/admin/litellm/dashboard-url'],
    enabled: true
  });

  // Mock data for development
  const mockOverview = {
    status: 'active',
    totalRequests: 15420,
    totalCost: 847.32,
    totalModels: 12,
    totalKeys: 8,
    uptime: '99.8%',
    responseTime: '1.2s',
    errorRate: '0.2%'
  };

  const mockModels = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      status: 'active',
      requests: 8420,
      cost: 324.50,
      avgLatency: '1.1s',
      successRate: '99.9%'
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      status: 'active',
      requests: 4230,
      cost: 198.75,
      avgLatency: '0.9s',
      successRate: '99.8%'
    },
    {
      id: 'llama-2-70b',
      name: 'Llama 2 70B',
      provider: 'Meta',
      status: 'active',
      requests: 2770,
      cost: 324.07,
      avgLatency: '2.1s',
      successRate: '98.5%'
    }
  ];

  const mockKeys = [
    {
      id: 'key-1',
      name: 'Produção Principal',
      type: 'master',
      usage: 85,
      limit: 1000,
      status: 'active',
      lastUsed: '2025-01-02 00:30:15',
      models: ['gpt-4', 'claude-3-sonnet']
    },
    {
      id: 'key-2',
      name: 'Desenvolvimento',
      type: 'limited',
      usage: 23,
      limit: 100,
      status: 'active',
      lastUsed: '2025-01-01 18:45:22',
      models: ['gpt-3.5-turbo']
    }
  ];

  const overview = litellmData || mockOverview;
  const models = modelsData || mockModels;
  const keys = keysData || mockKeys;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => setLocation('/admin/ai-management')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <div className="relative z-10">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IAprender
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Administração LiteLLM
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Controle completo sobre modelos de IA, custos, chaves de API e analytics em tempo real
            </p>
            
            {/* Native Dashboard Button */}
            {dashboardUrlData?.isConfigured && (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => window.open(dashboardUrlData.dashboardUrl, '_blank')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                  size="lg"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Dashboard Nativo LiteLLM
                </Button>
              </div>
            )}
            
            {!dashboardUrlData?.isConfigured && (
              <div className="flex justify-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <p className="text-sm text-yellow-800">
                      LiteLLM não configurado. Configure as variáveis LITELLM_URL e LITELLM_API_KEY para acessar dados reais.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Requests</p>
                  <p className="text-2xl font-bold">{overview.totalRequests?.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Custo Total</p>
                  <p className="text-2xl font-bold">R$ {overview.totalCost?.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Modelos Ativos</p>
                  <p className="text-2xl font-bold">{overview.totalModels}</p>
                </div>
                <Server className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Uptime</p>
                  <p className="text-2xl font-bold">{overview.uptime}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="keys">Chaves API</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge className={getStatusColor(overview.status)}>
                      {overview.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tempo de Resposta</span>
                    <span className="font-medium">{overview.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxa de Erro</span>
                    <span className="font-medium text-green-600">{overview.errorRate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Última Atualização</span>
                    <span className="text-sm text-gray-500">Agora mesmo</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Nova chave API criada</span>
                      <span className="text-xs text-gray-500 ml-auto">2 min</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Modelo GPT-4 ativado</span>
                      <span className="text-xs text-gray-500 ml-auto">15 min</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Limite de uso atingido</span>
                      <span className="text-xs text-gray-500 ml-auto">1h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Modelos Disponíveis</h3>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Modelo
              </Button>
            </div>

            <div className="grid gap-4">
              {models.map((model) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{model.name}</h4>
                        <p className="text-sm text-gray-600">{model.provider}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(model.status)}>
                          {model.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Requisições</p>
                        <p className="text-xl font-bold">{model.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Custo</p>
                        <p className="text-xl font-bold">R$ {model.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Latência Média</p>
                        <p className="text-xl font-bold">{model.avgLatency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                        <p className="text-xl font-bold text-green-600">{model.successRate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chaves de API</h3>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Chave
              </Button>
            </div>

            <div className="grid gap-4">
              {keys.map((key) => (
                <Card key={key.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold">{key.name}</h4>
                        <p className="text-sm text-gray-600">Tipo: {key.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(key.status)}>
                          {key.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Uso</span>
                          <span className="text-sm font-medium">{key.usage}/{key.limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUsageColor(key.usage, key.limit)}`}
                            style={{ width: `${(key.usage / key.limit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Último Uso</p>
                          <p className="text-sm font-medium">{key.lastUsed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Modelos Permitidos</p>
                          <p className="text-sm font-medium">{key.models.join(', ')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Uso por Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between">
                        <span className="text-sm">{model.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${(model.requests / 10000) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {model.requests.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custos por Modelo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between">
                        <span className="text-sm">{model.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${(model.cost / 400) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            R$ {model.cost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do LiteLLM</CardTitle>
                <CardDescription>
                  Configure parâmetros globais e integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="server-url">URL do Servidor LiteLLM</Label>
                      <Input 
                        id="server-url" 
                        placeholder="https://api.litellm.ai" 
                        defaultValue="https://api.litellm.ai"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="api-key">Chave de API Principal</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="api-key" 
                          type={showApiKey ? "text" : "password"}
                          placeholder="sk-..."
                          defaultValue="sk-1234567890abcdef"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="logging">Logging Detalhado</Label>
                      <Switch id="logging" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cache">Cache de Respostas</Label>
                      <Switch id="cache" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rate-limit">Rate Limiting</Label>
                      <Switch id="rate-limit" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="alerts">Alertas Automáticos</Label>
                      <Switch id="alerts" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button>Salvar Configurações</Button>
                  <Button variant="outline">Testar Conexão</Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default LiteLLMManagement;
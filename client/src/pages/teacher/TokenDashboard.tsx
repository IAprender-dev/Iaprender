import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { AlertTriangle, TrendingUp, DollarSign, Zap, Cloud, Brain, Activity, Shield, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";

interface TokenUsageStats {
  totalTokens: number;
  totalCost: number;
  usageByProvider: {
    openai: { tokens: number; cost: number };
    anthropic: { tokens: number; cost: number };
    perplexity: { tokens: number; cost: number };
    bedrock: { tokens: number; cost: number };
  };
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
  modelUsage: Array<{
    model: string;
    provider: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

interface TokenAlert {
  type: 'warning' | 'danger' | 'critical';
  message: string;
  currentUsage: number;
  limit: number;
  percentage: number;
}

const COLORS = {
  openai: '#00A86B',
  anthropic: '#FF6B35',
  perplexity: '#4F46E5',
  bedrock: '#FF9500'
};

export default function TokenDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const { data: tokenStats, isLoading: statsLoading } = useQuery<TokenUsageStats>({
    queryKey: ['/api/tokens/usage/stats', selectedTimeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedTimeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/tokens/usage/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch token statistics');
      return response.json();
    }
  });

  const { data: alerts } = useQuery<{ alerts: TokenAlert[] }>({
    queryKey: ['/api/tokens/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    refetchInterval: 30000
  });

  const { data: bedrockHealth } = useQuery({
    queryKey: ['/api/ai/bedrock/health'],
    queryFn: async () => {
      const response = await fetch('/api/ai/bedrock/health');
      if (!response.ok) throw new Error('Failed to check Bedrock health');
      return response.json();
    }
  });

  const { data: bedrockModels } = useQuery({
    queryKey: ['/api/ai/bedrock/models'],
    queryFn: async () => {
      const response = await fetch('/api/ai/bedrock/models');
      if (!response.ok) throw new Error('Failed to fetch Bedrock models');
      return response.json();
    }
  });

  const { data: pricingData } = useQuery({
    queryKey: ['/api/tokens/pricing'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/pricing');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return response.json();
    }
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const providerData = tokenStats ? Object.entries(tokenStats.usageByProvider).map(([provider, data]) => ({
    name: provider,
    value: data.tokens,
    cost: data.cost,
    color: COLORS[provider as keyof typeof COLORS]
  })) : [];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'danger': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/teacher">
              <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao Dashboard</span>
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Monitoramento AWS Bedrock</h1>
              <p className="text-gray-600 mt-2">Controle e análise do consumo de APIs de inteligência artificial</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select 
              value={selectedTimeRange} 
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Alerts */}
        {alerts?.alerts && alerts.alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.alerts.map((alert, index) => (
              <Alert key={index} className={
                alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                alert.type === 'danger' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              }>
                {getAlertIcon(alert.type)}
                <AlertTitle className="capitalize">{alert.type === 'critical' ? 'Crítico' : alert.type === 'danger' ? 'Perigo' : 'Aviso'}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* AWS Bedrock Status */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Cloud className="h-5 w-5 text-orange-600" />
              <span>Status do AWS Bedrock</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Badge variant={bedrockHealth?.connected ? "default" : "destructive"}>
                    {bedrockHealth?.connected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div>
                  <div className="font-medium">Conectividade</div>
                  <div className="text-sm text-gray-500">
                    {bedrockHealth?.region || 'Região não disponível'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Badge variant="outline">
                    {bedrockModels?.models?.length || 0} modelos
                  </Badge>
                </div>
                <div>
                  <div className="font-medium">Modelos Disponíveis</div>
                  <div className="text-sm text-gray-500">Claude, Titan, Llama, Jurassic</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Badge variant="secondary">
                    {tokenStats?.usageByProvider.bedrock.tokens || 0} tokens
                  </Badge>
                </div>
                <div>
                  <div className="font-medium">Uso Bedrock</div>
                  <div className="text-sm text-gray-500">
                    ${tokenStats?.usageByProvider.bedrock.cost.toFixed(4) || '0.0000'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tokens</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenStats?.totalTokens.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {selectedTimeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${tokenStats?.totalCost.toFixed(4) || '0.0000'}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {selectedTimeRange}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AWS Bedrock</CardTitle>
              <Cloud className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenStats?.usageByProvider.bedrock.tokens.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tokens Bedrock
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tokenStats?.modelUsage.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Modelos utilizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bedrock" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bedrock">AWS Bedrock</TabsTrigger>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="models">Modelos</TabsTrigger>
            <TabsTrigger value="pricing">Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="bedrock" className="space-y-6">
            {/* Bedrock Models Available */}
            <Card>
              <CardHeader>
                <CardTitle>Modelos AWS Bedrock Disponíveis</CardTitle>
                <CardDescription>Lista completa de modelos de IA disponíveis na AWS</CardDescription>
              </CardHeader>
              <CardContent>
                {bedrockModels?.models && bedrockModels.models.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bedrockModels.models.map((model: any, index: number) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{model.modelName}</CardTitle>
                          <CardDescription className="text-sm">{model.providerName}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {model.modelId}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div>Input: {model.inputModalities?.join(', ') || 'N/A'}</div>
                            <div>Output: {model.outputModalities?.join(', ') || 'N/A'}</div>
                          </div>
                          {model.responseStreamingSupported && (
                            <Badge variant="secondary" className="text-xs">
                              Streaming suportado
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum modelo encontrado</h3>
                    <p className="text-gray-500">
                      {bedrockHealth?.connected 
                        ? "Não foi possível carregar os modelos do Bedrock"
                        : "Conecte-se ao AWS Bedrock para ver os modelos disponíveis"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bedrock Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Uso do AWS Bedrock</CardTitle>
                <CardDescription>Histórico de utilização dos modelos Bedrock</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tokenStats?.dailyUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'tokens' ? `${value} tokens` : `$${value}`,
                        name === 'tokens' ? 'Tokens' : 'Custo'
                      ]}
                    />
                    <Area type="monotone" dataKey="tokens" stroke="#FF9500" fill="#FF9500" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {/* Daily Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Uso Diário de Tokens</CardTitle>
                <CardDescription>Evolução do consumo de tokens ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={tokenStats?.dailyUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'tokens' ? `${value} tokens` : `$${value}`,
                        name === 'tokens' ? 'Tokens' : 'Custo'
                      ]}
                    />
                    <Area type="monotone" dataKey="tokens" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Provider Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Provedor</CardTitle>
                  <CardDescription>Tokens utilizados por cada provedor de IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {providerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tokens`, 'Tokens']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custo por Provedor</CardTitle>
                  <CardDescription>Distribuição de custos entre provedores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {providerData.map((provider) => (
                      <div key={provider.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: provider.color }}
                          />
                          <span className="capitalize font-medium">{provider.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${provider.cost.toFixed(4)}</div>
                          <div className="text-sm text-gray-500">{provider.value.toLocaleString()} tokens</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso por Modelo</CardTitle>
                <CardDescription>Detalhamento do consumo por modelo de IA</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={tokenStats?.modelUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'tokens' ? `${value} tokens` : 
                        name === 'cost' ? `$${value}` : `${value} requests`,
                        name === 'tokens' ? 'Tokens' : 
                        name === 'cost' ? 'Custo' : 'Requisições'
                      ]}
                    />
                    <Bar dataKey="tokens" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Preços AWS Bedrock</CardTitle>
                <CardDescription>Preços atuais por modelo Bedrock (por 1000 tokens)</CardDescription>
              </CardHeader>
              <CardContent>
                {pricingData?.pricing?.bedrock && (
                  <div className="space-y-4">
                    {Object.entries(pricingData.pricing.bedrock).map(([modelName, pricing]: [string, any]) => (
                      <div key={modelName} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div>
                          <div className="font-medium">{modelName}</div>
                          <div className="text-sm text-gray-500">{pricing.description}</div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {pricing.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            ${pricing.input}/1k input
                          </div>
                          <div className="font-semibold text-blue-600">
                            ${pricing.output}/1k output
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
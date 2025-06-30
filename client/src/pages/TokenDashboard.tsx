import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Calendar, 
  Clock, 
  DollarSign, 
  Settings, 
  TrendingUp,
  Zap
} from 'lucide-react';

interface TokenStatus {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: string;
  warningThreshold: boolean;
  stats: {
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    averageDailyUsage: number;
  };
}

interface TokenUsageHistory {
  id: number;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  timestamp: string;
  requestType: string;
}

interface TokenAlert {
  id: number;
  type: 'warning' | 'limit_exceeded' | 'cost_threshold';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function TokenDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: tokenStatus, isLoading: statusLoading } = useQuery<TokenStatus>({
    queryKey: ['/api/tokens/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: usageHistory } = useQuery<TokenUsageHistory[]>({
    queryKey: ['/api/tokens/usage-history'],
  });

  const { data: alerts } = useQuery<TokenAlert[]>({
    queryKey: ['/api/tokens/alerts'],
  });

  const progressPercentage = tokenStatus 
    ? (tokenStatus.currentUsage / tokenStatus.monthlyLimit) * 100 
    : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (canProceed: boolean, warningThreshold: boolean) => {
    if (!canProceed) {
      return <Badge variant="destructive">Limite Excedido</Badge>;
    }
    if (warningThreshold) {
      return <Badge variant="secondary">Atenção</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Monitoramento de Tokens</h1>
        <p className="text-muted-foreground">
          Controle o uso de tokens das APIs de IA e monitore custos
        </p>
      </div>

      {/* Alerts */}
      {alerts && Array.isArray(alerts) && alerts.filter(alert => !alert.isRead).length > 0 && (
        <div className="mb-6">
          {alerts
            .filter(alert => !alert.isRead)
            .slice(0, 3)
            .map((alert) => (
              <Alert key={alert.id} className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenStatus?.currentUsage.toLocaleString() || 0}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress 
                value={progressPercentage} 
                className="flex-1"
                indicatorClassName={getUsageColor(progressPercentage)}
              />
              <span className="text-sm text-muted-foreground">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite Mensal</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenStatus?.monthlyLimit.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Restam {tokenStatus?.remainingTokens.toLocaleString() || 0} tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso Diário</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tokenStatus?.stats.dailyUsage.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: {tokenStatus?.stats.averageDailyUsage.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {tokenStatus && getStatusBadge(tokenStatus.canProceed, tokenStatus.warningThreshold)}
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Reset: {tokenStatus?.resetDate ? new Date(tokenStatus.resetDate).toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="usage">Histórico de Uso</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Uso Semanal</CardTitle>
                <CardDescription>Tokens consumidos nos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tokenStatus?.stats.weeklyUsage.toLocaleString() || 0}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Comparado à semana anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uso Mensal</CardTitle>
                <CardDescription>Total do mês atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tokenStatus?.stats.monthlyUsage.toLocaleString() || 0}
                </div>
                <div className="mt-2">
                  <Progress 
                    value={progressPercentage} 
                    className="h-2"
                    indicatorClassName={getUsageColor(progressPercentage)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressPercentage.toFixed(1)}% do limite mensal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Uso</CardTitle>
              <CardDescription>Detalhes das últimas requisições</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageHistory?.slice(0, 10).map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{usage.provider}</Badge>
                        <span className="text-sm font-medium">{usage.model}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {usage.requestType} • {new Date(usage.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{usage.tokensUsed.toLocaleString()} tokens</div>
                      <div className="text-xs text-muted-foreground">
                        R$ {usage.cost.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Custos</CardTitle>
              <CardDescription>Gastos por provedor e modelo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Custo Total Hoje</span>
                  </div>
                  <span className="text-xl font-bold">
                    R$ {usageHistory?.reduce((sum, usage) => sum + usage.cost, 0).toFixed(2) || '0.00'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Custo por Provedor</h4>
                    <div className="space-y-2">
                      {/* Group by provider */}
                      {Object.entries(
                        usageHistory?.reduce((acc, usage) => {
                          acc[usage.provider] = (acc[usage.provider] || 0) + usage.cost;
                          return acc;
                        }, {} as Record<string, number>) || {}
                      ).map(([provider, cost]) => (
                        <div key={provider} className="flex justify-between">
                          <span className="text-sm">{provider}</span>
                          <span className="text-sm font-medium">R$ {cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Custo por Modelo</h4>
                    <div className="space-y-2">
                      {/* Group by model */}
                      {Object.entries(
                        usageHistory?.reduce((acc, usage) => {
                          acc[usage.model] = (acc[usage.model] || 0) + usage.cost;
                          return acc;
                        }, {} as Record<string, number>) || {}
                      ).map(([model, cost]) => (
                        <div key={model} className="flex justify-between">
                          <span className="text-sm">{model}</span>
                          <span className="text-sm font-medium">R$ {cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Monitoramento</CardTitle>
              <CardDescription>Ajuste limites e alertas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    As configurações de limite são gerenciadas pelo administrador do sistema.
                    Entre em contato se precisar ajustar os limites de uso.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Limite de Tokens</h4>
                    <p className="text-2xl font-bold">{tokenStatus?.monthlyLimit.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Por mês</p>
                  </div>

                  <div className="p-4 border rounded">
                    <h4 className="font-medium mb-2">Alerta de Limite</h4>
                    <p className="text-2xl font-bold">85%</p>
                    <p className="text-sm text-muted-foreground">Do limite mensal</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Solicitar Ajuste de Limite
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
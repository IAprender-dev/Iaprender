import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Users, Building2, DollarSign, 
  BarChart3, PieChart, Activity, AlertTriangle, CheckCircle,
  Calendar, Target, Award, Zap, Clock, Eye, Download,
  ArrowUpRight, ArrowDownRight, Filter, RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ExecutiveMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  activeContracts: number;
  totalUsers: number;
  platformUptime: number;
  customerSatisfaction: number;
  aiUsageHours: number;
  tokenConsumption: number;
  newSignups: number;
  churnRate: number;
}

interface ContractPerformance {
  contractId: number;
  companyName: string;
  monthlyValue: number;
  usageRate: number;
  satisfactionScore: number;
  renewalProbability: number;
  trend: 'up' | 'down' | 'stable';
}

interface RevenueData {
  month: string;
  revenue: number;
  contracts: number;
  users: number;
}

interface UsageAnalytics {
  feature: string;
  usage: number;
  growth: number;
  category: string;
}

const ExecutiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [contractPerformance, setContractPerformance] = useState<ContractPerformance[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    loadExecutiveData();
  }, [selectedPeriod]);

  const loadExecutiveData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsRes, performanceRes, revenueRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/executive/metrics?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`/api/admin/executive/contract-performance?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`/api/admin/executive/revenue-trends?period=${selectedPeriod}`, { credentials: 'include' }),
        fetch(`/api/admin/executive/usage-analytics?period=${selectedPeriod}`, { credentials: 'include' })
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        setContractPerformance(performanceData.contracts || []);
      }

      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        setRevenueData(revenueData.trends || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setUsageAnalytics(analyticsData.analytics || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados executivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
            <p className="text-slate-600 mt-1">Visão estratégica e métricas de negócio</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="1y">Último ano</option>
              </select>
            </div>
            
            <Button 
              onClick={loadExecutiveData}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </Button>
            
            <Button 
              variant="default"
              size="sm"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Receita Total</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</span>
                  <DollarSign className="h-6 w-6 text-green-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-100">
                  {metrics.monthlyGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm">
                    {formatPercentage(Math.abs(metrics.monthlyGrowth))} vs mês anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Contratos Ativos</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metrics.activeContracts}</span>
                  <Building2 className="h-6 w-6 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-blue-100">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm">Taxa de renovação: 94.2%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Usuários Ativos</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</span>
                  <Users className="h-6 w-6 text-purple-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-100">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{metrics.newSignups} novos esta semana</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-100">Uptime da Plataforma</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{formatPercentage(metrics.platformUptime)}</span>
                  <Activity className="h-6 w-6 text-amber-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-amber-100">
                  <Zap className="h-4 w-4 mr-1" />
                  <span className="text-sm">SLA: 99.9% garantido</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts and Analytics */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-slate-200">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Receita & Crescimento
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Performance Contratos
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Análise de Uso
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Insights Estratégicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Evolução da Receita</span>
                  </CardTitle>
                  <CardDescription>Tendência de crescimento mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Crescimento de Usuários</span>
                  </CardTitle>
                  <CardDescription>Aquisição e retenção de usuários</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} />
                      <Line type="monotone" dataKey="contracts" stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  <span>Performance por Contrato</span>
                </CardTitle>
                <CardDescription>Análise detalhada de cada cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractPerformance.map((contract) => (
                    <div key={contract.contractId} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-slate-900">{contract.companyName}</h4>
                          <p className="text-sm text-slate-600">{formatCurrency(contract.monthlyValue)}/mês</p>
                        </div>
                        <Badge 
                          variant={contract.trend === 'up' ? 'default' : contract.trend === 'down' ? 'destructive' : 'secondary'}
                          className={
                            contract.trend === 'up' ? 'bg-green-100 text-green-800' :
                            contract.trend === 'down' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {contract.trend === 'up' ? '↗ Crescendo' : 
                           contract.trend === 'down' ? '↘ Decrescendo' : '→ Estável'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Taxa de Uso</p>
                          <Progress value={contract.usageRate} className="h-2" />
                          <p className="text-xs text-slate-600 mt-1">{formatPercentage(contract.usageRate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Satisfação</p>
                          <Progress value={contract.satisfactionScore} className="h-2" />
                          <p className="text-xs text-slate-600 mt-1">{contract.satisfactionScore}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Renovação</p>
                          <Progress value={contract.renewalProbability} className="h-2" />
                          <p className="text-xs text-slate-600 mt-1">{formatPercentage(contract.renewalProbability)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    <span>Uso por Categoria</span>
                  </CardTitle>
                  <CardDescription>Distribuição de funcionalidades mais utilizadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageAnalytics.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'amber', 'red'][index % 5]}-500`}></div>
                          <span className="text-sm font-medium text-slate-900">{item.feature}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{item.usage.toLocaleString()}</p>
                          <p className={`text-xs ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.growth >= 0 ? '+' : ''}{formatPercentage(item.growth)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span>Horários de Pico</span>
                  </CardTitle>
                  <CardDescription>Análise de uso por horário</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { hour: '6h', usage: 120 },
                      { hour: '8h', usage: 890 },
                      { hour: '10h', usage: 1450 },
                      { hour: '12h', usage: 890 },
                      { hour: '14h', usage: 1650 },
                      { hour: '16h', usage: 1200 },
                      { hour: '18h', usage: 450 },
                      { hour: '20h', usage: 280 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usage" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Award className="h-5 w-5" />
                    <span>Oportunidades</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">Expansão Premium</p>
                    <p className="text-xs text-green-600">23% dos clientes Basic podem migrar</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">Mercado Rural</p>
                    <p className="text-xs text-green-600">Potencial de 340 novas escolas</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800">Parceria Estados</p>
                    <p className="text-xs text-green-600">3 estados demonstram interesse</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-amber-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Atenção Necessária</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Churn Rate</p>
                    <p className="text-xs text-amber-600">Aumento de 2.1% este mês</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Suporte Técnico</p>
                    <p className="text-xs text-amber-600">Tempo resposta: 4h (meta: 2h)</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800">Capacidade IA</p>
                    <p className="text-xs text-amber-600">78% utilizada - escalar em 30 dias</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Eye className="h-5 w-5" />
                    <span>Próximos Passos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Q1 2025</p>
                    <p className="text-xs text-blue-600">Lançar módulo avaliações</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Q2 2025</p>
                    <p className="text-xs text-blue-600">Integração sistemas estaduais</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Q3 2025</p>
                    <p className="text-xs text-blue-600">Expansão internacional</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
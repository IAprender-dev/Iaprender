import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  Database, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Server,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PerformanceMetrics {
  totalRequests: number;
  avgResponseTime: number;
  cacheHitRate: number;
  slowQueries: number;
  topSlowEndpoints: Array<{
    endpoint: string;
    avgDuration: number;
    count: number;
  }>;
  recentMetrics: Array<{
    endpoint: string;
    method: string;
    duration: number;
    status: number;
    timestamp: string;
  }>;
}

interface EndpointStats {
  endpoint: string;
  requests: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorRate: number;
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  efficiency: string;
}

interface Alert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
}

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'cache' | 'alerts'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  // Queries
  const { data: metrics, isLoading: metricsLoading } = useQuery<{ data: PerformanceMetrics }>({
    queryKey: ['/api/performance/metrics'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: endpointStats, isLoading: endpointsLoading } = useQuery<{ data: EndpointStats[] }>({
    queryKey: ['/api/performance/endpoints'],
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const { data: cacheStats, isLoading: cacheLoading } = useQuery<{ data: CacheStats }>({
    queryKey: ['/api/performance/cache'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<{ data: Alert[] }>({
    queryKey: ['/api/performance/alerts'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Mutations
  const clearCacheMutation = useMutation({
    mutationFn: () => apiRequest('/api/performance/cache/clear', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance/cache'] });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/metrics'] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-green-600';
    if (status < 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (metricsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
            <p className="text-gray-600 mt-1">Monitoramento em tempo real do sistema</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          {[
            { key: 'overview', label: 'Visão Geral', icon: Activity },
            { key: 'endpoints', label: 'Endpoints', icon: Server },
            { key: 'cache', label: 'Cache', icon: Database },
            { key: 'alerts', label: 'Alertas', icon: AlertTriangle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.data.totalRequests || 0}</div>
                <p className="text-xs text-gray-500">Todas as requisições</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.data.avgResponseTime || 0}ms</div>
                <p className="text-xs text-gray-500">Tempo de resposta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.data.cacheHitRate || 0}%</div>
                <p className="text-xs text-gray-500">Taxa de acerto</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queries Lentas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.data.slowQueries || 0}</div>
                <p className="text-xs text-gray-500">Acima de 500ms</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Estatísticas por Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              {endpointsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {endpointStats?.data?.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{endpoint.endpoint}</h3>
                        <p className="text-sm text-gray-500">{endpoint.requests} requisições</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">{endpoint.avgDuration}ms</div>
                          <div className="text-xs text-gray-500">Médio</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{endpoint.minDuration}ms</div>
                          <div className="text-xs text-gray-500">Mín</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{endpoint.maxDuration}ms</div>
                          <div className="text-xs text-gray-500">Máx</div>
                        </div>
                        <Badge variant={endpoint.errorRate > 5 ? "destructive" : "secondary"}>
                          {endpoint.errorRate}% erros
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cache Tab */}
        {activeTab === 'cache' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Estatísticas de Cache
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cacheLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{cacheStats?.data.size || 0}</div>
                    <div className="text-sm text-gray-500">Itens no Cache</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{cacheStats?.data.hits || 0}</div>
                    <div className="text-sm text-gray-500">Cache Hits</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{cacheStats?.data.misses || 0}</div>
                    <div className="text-sm text-gray-500">Cache Misses</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className={`text-2xl font-bold ${getCacheEfficiencyColor(cacheStats?.data.efficiency || 'Low')}`}>
                      {cacheStats?.data.efficiency || 'Low'}
                    </div>
                    <div className="text-sm text-gray-500">Eficiência</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alertas de Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts?.data?.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">Nenhum Alerta</h3>
                      <p className="text-gray-500">Sistema funcionando normalmente</p>
                    </div>
                  ) : (
                    alerts?.data?.map((alert, index) => (
                      <div key={index} className="flex items-center p-4 border rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} mr-4`}></div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{alert.message}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Metrics */}
        {activeTab === 'overview' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Requisições Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.data.recentMetrics?.slice(0, 10).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{metric.method}</Badge>
                      <span className="text-sm font-medium">{metric.endpoint}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600">{metric.duration}ms</span>
                      <span className={`text-sm font-medium ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
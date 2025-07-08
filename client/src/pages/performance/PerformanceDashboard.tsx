import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  BarChart3, 
  Zap,
  HardDrive,
  Cpu,
  Eye,
  TrendingUp
} from 'lucide-react';

interface PerformanceStats {
  totalQueries: number;
  averageDuration: number;
  slowestQuery: { duration: number; query: string } | null;
  fastestQuery: { duration: number; query: string } | null;
  recentQueries: Array<{
    query: string;
    duration: number;
    route?: string;
    timestamp: string;
  }>;
}

interface DatabaseStats {
  connections: {
    total_connections: number;
    active_connections: number;
    idle_connections: number;
  };
  tableSizes: Array<{
    tablename: string;
    size: string;
    size_bytes: number;
  }>;
  indexStats: Array<{
    tablename: string;
    indexname: string;
    idx_scan: number;
    idx_tup_read: number;
  }>;
  slowestQueries: Array<{
    query: string;
    calls: number;
    total_exec_time: number;
    mean_exec_time: number;
    max_exec_time: number;
  }>;
}

interface RealTimeStats {
  currentActivity: Array<{
    pid: number;
    usename: string;
    state: string;
    query: string;
    query_start: string;
  }>;
  cacheHitRatio: {
    cache_hit_ratio: number;
  };
  locks: Array<{
    mode: string;
    count: number;
  }>;
  timestamp: string;
}

export default function PerformanceDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const queryClient = useQueryClient();

  // Buscar estatísticas de performance
  const { data: performanceStats, isLoading: statsLoading } = useQuery<{ stats: PerformanceStats }>({
    queryKey: ['/api/performance/stats'],
    refetchInterval: 5000 // Atualiza a cada 5 segundos
  });

  // Buscar queries lentas
  const { data: slowQueries } = useQuery<{ slowQueries: any[]; threshold: number }>({
    queryKey: ['/api/performance/slow-queries'],
    refetchInterval: 10000
  });

  // Buscar estatísticas do banco
  const { data: dbStats } = useQuery<{ stats: DatabaseStats }>({
    queryKey: ['/api/performance/database-stats'],
    refetchInterval: 30000
  });

  // Buscar estatísticas em tempo real
  const { data: realTimeStats } = useQuery<{ realTimeStats: RealTimeStats }>({
    queryKey: ['/api/performance/real-time'],
    refetchInterval: 2000
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/performance'] });
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/performance/clear-logs', { method: 'DELETE' });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/performance/stats'] });
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatQuery = (query: string, maxLength: number = 60) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Monitor de Performance</h1>
                <p className="text-gray-600">Análise detalhada de performance do sistema</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={clearLogs}>
                <Database className="w-4 h-4 mr-2" />
                Limpar Logs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="queries">Consultas</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                  <Activity className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceStats?.stats.totalQueries || 0}</div>
                  <p className="text-xs text-muted-foreground">Consultas monitoradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(performanceStats?.stats.averageDuration || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Duração média das consultas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consulta Mais Lenta</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatDuration(performanceStats?.stats.slowestQuery?.duration || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatQuery(performanceStats?.stats.slowestQuery?.query || 'N/A', 30)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {realTimeStats?.realTimeStats.cacheHitRatio?.cache_hit_ratio || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Taxa de acerto do cache</p>
                </CardContent>
              </Card>
            </div>

            {/* Consultas Recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Consultas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {performanceStats?.stats.recentQueries?.slice(0, 5).map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{formatQuery(query.query)}</p>
                        {query.route && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {query.route}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatDuration(query.duration)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(query.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultas */}
          <TabsContent value="queries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Consultas Lentas (&gt; 1s)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {slowQueries?.slowQueries?.map((query, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="destructive">
                          {formatDuration(query.duration)}
                        </Badge>
                        {query.route && (
                          <Badge variant="outline">{query.route}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {query.query}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(query.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!slowQueries?.slowQueries || slowQueries.slowQueries.length === 0) && (
                    <p className="text-center text-gray-500 py-8">
                      Nenhuma consulta lenta detectada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banco de Dados */}
          <TabsContent value="database" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conexões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-bold">{dbStats?.stats.connections?.total_connections || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ativas:</span>
                      <span className="font-bold text-green-600">{dbStats?.stats.connections?.active_connections || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ociosas:</span>
                      <span className="font-bold text-gray-500">{dbStats?.stats.connections?.idle_connections || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tamanho das Tabelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dbStats?.stats.tableSizes?.slice(0, 5).map((table, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{table.tablename}</span>
                        <span className="font-bold">{table.size}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Locks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {realTimeStats?.realTimeStats.locks?.map((lock, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{lock.mode}</span>
                        <span className="font-bold">{lock.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tempo Real */}
          <TabsContent value="realtime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade Atual do Banco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realTimeStats?.realTimeStats.currentActivity?.map((activity, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant="outline">PID: {activity.pid}</Badge>
                          <Badge variant="outline" className="ml-2">{activity.usename}</Badge>
                        </div>
                        <Badge variant={activity.state === 'active' ? 'default' : 'secondary'}>
                          {activity.state}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {formatQuery(activity.query, 100)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Iniciado: {new Date(activity.query_start).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Análise */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Recomendações</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Monitorar consultas que demoram mais de 1 segundo</li>
                      <li>• Manter cache hit ratio acima de 95%</li>
                      <li>• Revisar índices para consultas frequentes</li>
                      <li>• Considerar connection pooling para muitas conexões</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Performance Boa</h4>
                      <p className="text-sm text-green-800">
                        Cache hit ratio: {realTimeStats?.realTimeStats.cacheHitRatio?.cache_hit_ratio || 0}%
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">⚠️ Atenção</h4>
                      <p className="text-sm text-yellow-800">
                        {slowQueries?.slowQueries?.length || 0} consultas lentas detectadas
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
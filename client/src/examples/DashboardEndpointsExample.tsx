import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3, Users, TrendingUp, RefreshCw } from 'lucide-react';

/**
 * EXEMPLO DE USO DOS ENDPOINTS DO DASHBOARD - IAPRENDER
 * 
 * Demonstra como consumir os endpoints do dashboard backend
 * com autenticação e tratamento de erros adequados
 */

interface DashboardStats {
  totais: {
    alunos: number;
    professores: number;
    escolas: number;
    usuarios: number;
  };
  usuario: {
    tipo: string;
    empresa_id?: number;
    tem_filtro_empresa: boolean;
  };
}

interface DashboardRecents {
  recentes: Array<{
    id: number;
    tipo: string;
    nome: string;
    acao: string;
    data: string;
    status: string;
  }>;
  total: number;
}

interface DashboardCharts {
  matriculas_mes: Array<{
    mes: string;
    valor: number;
  }>;
  distribuicao_series: Array<{
    serie: string;
    quantidade: number;
    cor: string;
  }>;
}

interface DashboardActivity {
  usuario_tipo: string;
  atividade: {
    hoje: {
      logins: number;
      acoes: number;
      tempo_online: string;
    };
    semana: {
      dias_ativos: number;
      total_acoes: number;
      media_diaria: string;
    };
    mes: {
      dias_ativos: number;
      total_acoes: number;
      crescimento: string;
    };
  };
  ultima_atualizacao: string;
}

const DashboardEndpointsExample: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recents, setRecents] = useState<DashboardRecents | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Simulação de token JWT para demonstração
  const [authToken] = useState('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

  /**
   * Função helper para fazer requisições autenticadas
   */
  const makeAuthenticatedRequest = async (endpoint: string) => {
    const response = await fetch(`/api/dashboard/${endpoint}`, {
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token de autenticação inválido ou expirado');
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  };

  /**
   * Testar Health Check (sem autenticação)
   */
  const testHealthCheck = async () => {
    setLoading('health');
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Carregar estatísticas
   */
  const loadStats = async () => {
    setLoading('stats');
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest('stats');
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Carregar dados recentes
   */
  const loadRecents = async () => {
    setLoading('recents');
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest('recents');
      setRecents(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados recentes');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Carregar dados de gráficos
   */
  const loadCharts = async () => {
    setLoading('charts');
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest('charts');
      setCharts(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar gráficos');
    } finally {
      setLoading(null);
    }
  };

  /**
   * Carregar atividade do usuário
   */
  const loadActivity = async () => {
    setLoading('activity');
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest('activity');
      setActivity(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar atividade');
    } finally {
      setLoading(null);
    }
  };

  // Carregar health check automaticamente
  useEffect(() => {
    testHealthCheck();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Dashboard Endpoints - IAprender</h1>
        <p className="text-muted-foreground">
          Demonstração dos endpoints do dashboard backend
        </p>
      </div>

      {/* Health Check Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Health Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testHealthCheck} 
              disabled={loading === 'health'}
            >
              {loading === 'health' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Verificar Status
            </Button>
            
            {healthStatus && (
              <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.status === 'healthy' ? '✅ Sistema Operacional' : '❌ Sistema com Problemas'}
              </Badge>
            )}
          </div>
          
          {healthStatus && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <pre className="text-sm">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Endpoints com Autenticação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadStats} 
              disabled={loading === 'stats'}
              className="mb-4"
            >
              {loading === 'stats' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Carregar Stats
            </Button>
            
            {stats && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Alunos: <strong>{stats.totais.alunos}</strong></div>
                  <div>Professores: <strong>{stats.totais.professores}</strong></div>
                  <div>Escolas: <strong>{stats.totais.escolas}</strong></div>
                  <div>Usuários: <strong>{stats.totais.usuarios}</strong></div>
                </div>
                <Badge>{stats.usuario.tipo}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dados Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Dados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadRecents} 
              disabled={loading === 'recents'}
              className="mb-4"
            >
              {loading === 'recents' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Carregar Recentes
            </Button>
            
            {recents && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Total: {recents.total} registros
                </div>
                {recents.recentes.slice(0, 3).map(item => (
                  <div key={item.id} className="p-2 bg-muted rounded text-sm">
                    <div className="font-medium">{item.nome}</div>
                    <div className="text-muted-foreground">{item.acao}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráficos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Dados de Gráficos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadCharts} 
              disabled={loading === 'charts'}
              className="mb-4"
            >
              {loading === 'charts' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Carregar Gráficos
            </Button>
            
            {charts && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">Matrículas por Mês</div>
                  <div className="flex gap-1">
                    {charts.matriculas_mes.map(item => (
                      <div key={item.mes} className="text-xs text-center">
                        <div className="bg-blue-500 text-white px-1 py-2 rounded" style={{height: `${item.valor}px`}}>
                          {item.valor}
                        </div>
                        <div className="mt-1">{item.mes}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Distribuição por Série</div>
                  {charts.distribuicao_series.map(item => (
                    <div key={item.serie} className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{backgroundColor: item.cor}}
                      ></div>
                      <span>{item.serie}: {item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Atividade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={loadActivity} 
              disabled={loading === 'activity'}
              className="mb-4"
            >
              {loading === 'activity' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Carregar Atividade
            </Button>
            
            {activity && (
              <div className="space-y-3">
                <Badge>{activity.usuario_tipo}</Badge>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <div className="font-medium">Hoje</div>
                    <div>{activity.atividade.hoje.logins} logins</div>
                    <div>{activity.atividade.hoje.acoes} ações</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="font-medium">Semana</div>
                    <div>{activity.atividade.semana.dias_ativos} dias</div>
                    <div>{activity.atividade.semana.total_acoes} ações</div>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <div className="font-medium">Mês</div>
                    <div>{activity.atividade.mes.dias_ativos} dias</div>
                    <div>{activity.atividade.mes.crescimento}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Área de Erros */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Erro:</strong> {error}
            </div>
            <div className="text-sm text-red-600 mt-2">
              💡 Para testar com autenticação real, você precisará de um token JWT válido
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Endpoints Disponíveis:</h4>
            <ul className="space-y-1 text-sm">
              <li><code>GET /api/dashboard/health</code> - Status do sistema (público)</li>
              <li><code>GET /api/dashboard/stats</code> - Estatísticas (autenticado)</li>
              <li><code>GET /api/dashboard/recents</code> - Dados recentes (autenticado)</li>
              <li><code>GET /api/dashboard/charts</code> - Dados para gráficos (autenticado)</li>
              <li><code>GET /api/dashboard/activity</code> - Atividade do usuário (autenticado)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Autenticação:</h4>
            <p className="text-sm text-muted-foreground">
              Os endpoints protegidos requerem um token JWT válido no header Authorization.
              O sistema usa controle hierárquico: admin → gestor → diretor → professor → aluno.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Controle de Acesso:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Admin: Acesso total a todos os dados</li>
              <li>• Gestor: Dados filtrados por empresa</li>
              <li>• Diretor: Dados da escola específica</li>
              <li>• Professor/Aluno: Dados limitados conforme permissões</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardEndpointsExample;
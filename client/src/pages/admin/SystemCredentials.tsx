import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Shield, Database, Brain, Key, Mail, Settings, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SystemHealth {
  aws_cognito: {
    status: 'ok' | 'error' | 'warning';
    missing_credentials: string[];
  };
  database: {
    status: 'ok' | 'error' | 'warning';
    missing_credentials: string[];
  };
  ai_services: {
    status: 'ok' | 'error' | 'warning';
    available_services: number;
    total_services: number;
  };
  overall_status: 'healthy' | 'needs_attention';
}

interface SystemConfiguration {
  environment: string;
  port: string;
  aws_region: string;
  cognito_configured: boolean;
  database_configured: boolean;
  ai_services_count: number;
}

interface CredentialsData {
  success: boolean;
  timestamp: string;
  system_health: SystemHealth;
  configuration: SystemConfiguration;
}

const SystemCredentials: React.FC = () => {
  const [data, setData] = useState<CredentialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);
  const [testingConnections, setTestingConnections] = useState(false);
  const [connectionResults, setConnectionResults] = useState<any>(null);

  const loadCredentialsStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/secrets/health');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const testConnections = async () => {
    try {
      setTestingConnections(true);
      
      const response = await fetch('/api/secrets/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      setConnectionResults(result.connection_tests);
    } catch (err) {
      console.error('Erro ao testar conexões:', err);
    } finally {
      setTestingConnections(false);
    }
  };

  useEffect(() => {
    loadCredentialsStatus();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(loadCredentialsStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ok': 'default',
      'warning': 'secondary',
      'error': 'destructive'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'ok' ? 'Funcionando' : status === 'warning' ? 'Atenção' : 'Erro'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando status das credenciais...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados: {error || 'Dados não disponíveis'}
          </AlertDescription>
        </Alert>
        <Button onClick={loadCredentialsStatus} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Credenciais</h1>
          <p className="text-gray-600 mt-1">Monitoramento e status das configurações do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitive(!showSensitive)}
          >
            {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSensitive ? 'Ocultar' : 'Mostrar'} Detalhes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadCredentialsStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(data.system_health.overall_status)}
              <CardTitle>Status Geral do Sistema</CardTitle>
            </div>
            {getStatusBadge(data.system_health.overall_status)}
          </div>
          <CardDescription>
            Última verificação: {new Date(data.timestamp).toLocaleString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.configuration.environment}</div>
              <div className="text-sm text-gray-500">Ambiente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.configuration.port}</div>
              <div className="text-sm text-gray-500">Porta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.configuration.ai_services_count}</div>
              <div className="text-sm text-gray-500">Serviços IA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.configuration.aws_region}</div>
              <div className="text-sm text-gray-500">Região AWS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Componentes */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="aws">AWS Cognito</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="ai">Serviços IA</TabsTrigger>
          <TabsTrigger value="connections">Conexões</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AWS Cognito Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AWS Cognito</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(data.system_health.aws_cognito.status)}
                  {getStatusBadge(data.system_health.aws_cognito.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sistema de autenticação
                </p>
              </CardContent>
            </Card>

            {/* Database Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(data.system_health.database.status)}
                  {getStatusBadge(data.system_health.database.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  PostgreSQL
                </p>
              </CardContent>
            </Card>

            {/* AI Services Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Serviços IA</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(data.system_health.ai_services.status)}
                  {getStatusBadge(data.system_health.ai_services.status)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data.system_health.ai_services.available_services}/{data.system_health.ai_services.total_services} disponíveis
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AWS Tab */}
        <TabsContent value="aws" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>AWS Cognito Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.system_health.aws_cognito.status)}
                    {getStatusBadge(data.system_health.aws_cognito.status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Configurado:</span>
                  <Badge variant={data.configuration.cognito_configured ? 'default' : 'destructive'}>
                    {data.configuration.cognito_configured ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Região:</span>
                  <Badge variant="outline">{data.configuration.aws_region}</Badge>
                </div>

                {data.system_health.aws_cognito.missing_credentials.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Credenciais faltantes: {data.system_health.aws_cognito.missing_credentials.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Configuração do Banco de Dados</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.system_health.database.status)}
                    {getStatusBadge(data.system_health.database.status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Configurado:</span>
                  <Badge variant={data.configuration.database_configured ? 'default' : 'destructive'}>
                    {data.configuration.database_configured ? 'Sim' : 'Não'}
                  </Badge>
                </div>

                {data.system_health.database.missing_credentials.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Credenciais faltantes: {data.system_health.database.missing_credentials.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Services Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Serviços de Inteligência Artificial</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(data.system_health.ai_services.status)}
                    {getStatusBadge(data.system_health.ai_services.status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Serviços Disponíveis:</span>
                  <Badge variant="outline">
                    {data.system_health.ai_services.available_services} de {data.system_health.ai_services.total_services}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['OpenAI', 'Anthropic', 'Perplexity', 'LiteLLM'].map((service, index) => (
                    <div key={service} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{service}</span>
                      <Badge variant={index < data.system_health.ai_services.available_services ? 'default' : 'secondary'}>
                        {index < data.system_health.ai_services.available_services ? 'Configurado' : 'Não configurado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Teste de Conexões</span>
              </CardTitle>
              <CardDescription>
                Teste a conectividade com serviços externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={testConnections} 
                  disabled={testingConnections}
                  className="w-full"
                >
                  {testingConnections ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testando Conexões...
                    </>
                  ) : (
                    'Testar Todas as Conexões'
                  )}
                </Button>

                {connectionResults && (
                  <div className="space-y-2">
                    {Object.entries(connectionResults).map(([service, result]: [string, any]) => (
                      <div key={service} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium capitalize">{service}</span>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(result.status)}
                          <span className="text-sm">{result.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemCredentials;
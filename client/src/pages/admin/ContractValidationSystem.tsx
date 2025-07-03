import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download,
  FileText,
  Users,
  Building,
  Shield,
  TrendingUp,
  Activity,
  Eye,
  Zap,
  Database,
  Clock,
  BarChart3
} from 'lucide-react';

interface ValidationResult {
  id: string;
  type: 'error' | 'warning' | 'success';
  category: 'contract' | 'user' | 'company' | 'integration';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedItems: number;
  recommendations?: string[];
}

interface ValidationSummary {
  totalChecks: number;
  passed: number;
  warnings: number;
  errors: number;
  lastRun: string;
  dataIntegrity: number;
}

const ContractValidationSystem: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const queryClient = useQueryClient();

  // Query para buscar dados reais do backend
  const { data: validationData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/validation/results'],
    retry: false,
    refetchOnWindowFocus: false
  });

  // Mutation para executar validação
  const runValidationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/validation/run', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao executar validação');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/validation/results'] });
    }
  });

  // Mutation para correção automática
  const autoFixMutation = useMutation({
    mutationFn: async (problemIds: string[]) => {
      const response = await fetch('/api/admin/validation/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao corrigir problemas');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/validation/results'] });
    }
  });

  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      await runValidationMutation.mutateAsync();
    } catch (error) {
      console.error('Erro ao executar validação:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAutoFix = async (problemIds: string[]) => {
    try {
      await autoFixMutation.mutateAsync(problemIds);
    } catch (error) {
      console.error('Erro ao corrigir problemas:', error);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/validation/export', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-validacao-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-700 mb-2">
                Carregando Sistema de Validação
              </h2>
              <p className="text-slate-500">Preparando dados reais do sistema...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dados reais do backend
  const summary: ValidationSummary = validationData?.summary || {
    totalChecks: 0,
    passed: 0,
    warnings: 0,
    errors: 0,
    lastRun: 'Nenhuma validação executada',
    dataIntegrity: 0
  };

  const results: ValidationResult[] = validationData?.results || [];

  const filteredResults = selectedCategory === 'all' 
    ? results 
    : results.filter(r => r.category === selectedCategory);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <CheckCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract': return <FileText className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      case 'company': return <Building className="w-4 h-4" />;
      case 'integration': return <Database className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Sistema de Validação</h1>
                <p className="text-slate-600 mt-1">
                  Monitore e valide a integridade dos dados em tempo real
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleRunValidation}
                disabled={isValidating}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Executar Validação
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportReport}
                className="border-slate-300 hover:bg-slate-50 shadow-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Verificações</p>
                  <p className="text-2xl font-bold text-slate-900">{summary.totalChecks}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-emerald-600">{summary.passed}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avisos</p>
                  <p className="text-2xl font-bold text-amber-600">{summary.warnings}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Erros</p>
                  <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Índice de Integridade */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Índice de Integridade dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Integridade Geral
              </span>
              <span className="text-sm font-bold text-slate-900">
                {summary.dataIntegrity}%
              </span>
            </div>
            <Progress 
              value={summary.dataIntegrity} 
              className="h-3 mb-4"
            />
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Última execução: {summary.lastRun}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Dados em tempo real
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Validação */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Resultados da Validação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="contract">Contratos</TabsTrigger>
                <TabsTrigger value="user">Usuários</TabsTrigger>
                <TabsTrigger value="company">Empresas</TabsTrigger>
                <TabsTrigger value="integration">Integração</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory} className="space-y-4">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-slate-500">
                      Execute uma validação para ver os resultados
                    </p>
                  </div>
                ) : (
                  filteredResults.map((result) => (
                    <Card key={result.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(result.type)}
                            <div>
                              <h3 className="font-semibold text-slate-900">
                                {result.title}
                              </h3>
                              <p className="text-sm text-slate-600 mt-1">
                                {result.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(result.category)}
                            <Badge className={`${getSeverityColor(result.severity)} border`}>
                              {result.severity}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {result.affectedItems} itens afetados
                          </span>
                          
                          {result.type === 'error' && (
                            <Button
                              size="sm"
                              onClick={() => handleAutoFix([result.id])}
                              disabled={autoFixMutation.isPending}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                            >
                              <Zap className="w-4 h-4 mr-2" />
                              Corrigir
                            </Button>
                          )}
                        </div>

                        {result.recommendations && result.recommendations.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">
                              Recomendações:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {result.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContractValidationSystem;
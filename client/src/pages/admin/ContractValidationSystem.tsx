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
  Calendar,
  DollarSign
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

  // Query para buscar resultados da validação
  const { data: validationData, isLoading } = useQuery({
    queryKey: ['/api/admin/validation/results'],
    retry: false
  });

  // Mutation para executar validação completa
  const runValidationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/validation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao executar validação');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/validation/results'] });
      setIsValidating(false);
    },
    onError: () => {
      setIsValidating(false);
    }
  });

  // Mutation para corrigir problemas automaticamente
  const autoFixMutation = useMutation({
    mutationFn: async (issueIds: string[]) => {
      const response = await fetch('/api/admin/validation/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ issueIds })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao corrigir problemas');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/validation/results'] });
    }
  });

  const handleRunValidation = () => {
    setIsValidating(true);
    runValidationMutation.mutate();
  };

  const handleAutoFix = (issueIds: string[]) => {
    autoFixMutation.mutate(issueIds);
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch('/api/admin/validation/export', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Carregando sistema de validação...</span>
      </div>
    );
  }

  const summary: ValidationSummary = validationData?.summary || {
    totalChecks: 0,
    passed: 0,
    warnings: 0,
    errors: 0,
    lastRun: 'Nunca executada',
    dataIntegrity: 0
  };

  const results: ValidationResult[] = validationData?.results || [];

  const filteredResults = selectedCategory === 'all' 
    ? results 
    : results.filter(r => r.category === selectedCategory);

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Validação</h1>
          <p className="text-gray-600 mt-2">
            Monitoramento e validação da integridade dos dados empresa-contrato
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleExportReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>
          <Button 
            onClick={handleRunValidation}
            disabled={isValidating}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validando...' : 'Executar Validação'}
          </Button>
        </div>
      </div>

      {/* Resumo da Validação */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Verificações</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalChecks}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                <p className="text-2xl font-bold text-green-600">{summary.passed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avisos</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.warnings}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integridade dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Integridade dos Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Índice de Integridade</span>
              <span className="text-lg font-bold">{summary.dataIntegrity}%</span>
            </div>
            <Progress value={summary.dataIntegrity} className="w-full" />
            <p className="text-sm text-gray-600">
              Última verificação: {summary.lastRun}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Validação</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="contract">Contratos</TabsTrigger>
              <TabsTrigger value="user">Usuários</TabsTrigger>
              <TabsTrigger value="company">Empresas</TabsTrigger>
              <TabsTrigger value="integration">Integração</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              {filteredResults.length === 0 ? (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    {selectedCategory === 'all' 
                      ? 'Nenhum problema encontrado. Sistema operando corretamente.'
                      : `Nenhum problema encontrado na categoria ${selectedCategory}.`
                    }
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((result) => (
                    <Card key={result.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(result.type)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">{result.title}</h4>
                                <Badge variant={getSeverityColor(result.severity) as any}>
                                  {result.severity}
                                </Badge>
                                <Badge variant="outline">
                                  {result.affectedItems} item(s)
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{result.description}</p>
                              
                              {result.recommendations && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <p className="text-sm font-medium text-blue-900 mb-2">Recomendações:</p>
                                  <ul className="text-sm text-blue-800 space-y-1">
                                    {result.recommendations.map((rec, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-500">•</span>
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {result.type !== 'success' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAutoFix([result.id])}
                              disabled={autoFixMutation.isPending}
                              className="ml-4"
                            >
                              Corrigir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractValidationSystem;
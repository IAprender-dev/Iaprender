import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, FileText, Download, Upload, Users, Calendar, 
  BarChart3, PieChart, Target, Workflow, Lightbulb,
  Clock, CheckCircle, AlertCircle, TrendingUp, ArrowRight,
  Settings, Cpu, Database, Cloud, Shield, RefreshCw,
  Rocket, Brain, Search, Filter, Eye, Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive';
  executions: number;
  lastRun: string;
}

interface ProductivityMetrics {
  automationsSaved: number;
  timeEfficiency: number;
  userAdoption: number;
  costSavings: number;
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: string;
  endTime?: string;
  results?: {
    processed: number;
    successful: number;
    failed: number;
  };
}

const AdvancedToolsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('automation');
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [metrics, setMetrics] = useState<ProductivityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Automation Rule Form
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    action: '',
    conditions: ''
  });

  // Bulk Operation Form
  const [bulkForm, setBulkForm] = useState({
    operation: '',
    target: '',
    parameters: ''
  });

  useEffect(() => {
    loadToolsData();
  }, []);

  const loadToolsData = async () => {
    try {
      setIsLoading(true);
      
      const [rulesRes, operationsRes, metricsRes] = await Promise.all([
        fetch('/api/admin/tools/automation-rules', { credentials: 'include' }),
        fetch('/api/admin/tools/bulk-operations', { credentials: 'include' }),
        fetch('/api/admin/tools/productivity-metrics', { credentials: 'include' })
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setAutomationRules(rulesData.rules || []);
      }

      if (operationsRes.ok) {
        const operationsData = await operationsRes.json();
        setBulkOperations(operationsData.operations || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

    } catch (error) {
      console.error('Erro ao carregar dados das ferramentas:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados das ferramentas avançadas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAutomationRule = async () => {
    try {
      const response = await fetch('/api/admin/tools/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newRule)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Regra de automação criada com sucesso",
        });
        setNewRule({ name: '', trigger: '', action: '', conditions: '' });
        loadToolsData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar regra de automação",
        variant: "destructive"
      });
    }
  };

  const executeBulkOperation = async () => {
    try {
      const response = await fetch('/api/admin/tools/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(bulkForm)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Operação em lote iniciada com sucesso",
        });
        setBulkForm({ operation: '', target: '', parameters: '' });
        loadToolsData();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar operação em lote",
        variant: "destructive"
      });
    }
  };

  const toggleAutomationRule = async (ruleId: number) => {
    try {
      const response = await fetch(`/api/admin/tools/automation-rules/${ruleId}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        loadToolsData();
        toast({
          title: "Sucesso",
          description: "Status da regra atualizado",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar status da regra",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IA</span>
              </div>
              <span className="text-xl font-bold text-gray-900">IAprender</span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Ferramentas Avançadas</h1>
              <p className="text-slate-600 mt-1">Automação e produtividade para maximizar eficiência</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={loadToolsData}
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
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Rocket className="h-4 w-4" />
              <span>Nova Automação</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-100">Tempo Economizado</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metrics.automationsSaved}h</span>
                  <Clock className="h-6 w-6 text-green-200" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-green-100">Esta semana através de automações</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-100">Eficiência</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metrics.timeEfficiency}%</span>
                  <TrendingUp className="h-6 w-6 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-100">Aumento de produtividade</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-100">Adoção</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{metrics.userAdoption}%</span>
                  <Users className="h-6 w-6 text-purple-200" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-100">Usuários utilizando ferramentas</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-100">Economia</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">R$ {metrics.costSavings.toLocaleString()}</span>
                  <Target className="h-6 w-6 text-amber-200" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-amber-100">Redução de custos mensais</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tools Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white border border-slate-200">
            <TabsTrigger value="automation" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Automação
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Operações em Lote
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Analytics Avançado
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Integrações
            </TabsTrigger>
            <TabsTrigger value="optimization" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              Otimização
            </TabsTrigger>
          </TabsList>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Automation Rule */}
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    <span>Nova Regra de Automação</span>
                  </CardTitle>
                  <CardDescription>Configure automações para tarefas repetitivas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name">Nome da Regra</Label>
                    <Input
                      id="rule-name"
                      value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      placeholder="Ex: Notificar professores sobre novos alunos"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rule-trigger">Gatilho</Label>
                    <Select value={newRule.trigger} onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o gatilho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user_registration">Novo usuário registrado</SelectItem>
                        <SelectItem value="contract_expiry">Contrato próximo ao vencimento</SelectItem>
                        <SelectItem value="high_token_usage">Alto uso de tokens</SelectItem>
                        <SelectItem value="inactive_user">Usuário inativo por 30 dias</SelectItem>
                        <SelectItem value="low_engagement">Baixo engajamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rule-action">Ação</Label>
                    <Select value={newRule.action} onValueChange={(value) => setNewRule({ ...newRule, action: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a ação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_email">Enviar email</SelectItem>
                        <SelectItem value="create_notification">Criar notificação</SelectItem>
                        <SelectItem value="update_status">Atualizar status</SelectItem>
                        <SelectItem value="generate_report">Gerar relatório</SelectItem>
                        <SelectItem value="assign_task">Atribuir tarefa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="rule-conditions">Condições (Opcional)</Label>
                    <Textarea
                      id="rule-conditions"
                      value={newRule.conditions}
                      onChange={(e) => setNewRule({ ...newRule, conditions: e.target.value })}
                      placeholder="Condições adicionais em JSON"
                      rows={3}
                    />
                  </div>

                  <Button onClick={createAutomationRule} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Criar Automação
                  </Button>
                </CardContent>
              </Card>

              {/* Active Automation Rules */}
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Workflow className="h-5 w-5 text-green-600" />
                    <span>Regras Ativas</span>
                  </CardTitle>
                  <CardDescription>Automações configuradas e em execução</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules.map((rule) => (
                      <div key={rule.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{rule.name}</h4>
                          <Badge 
                            variant={rule.status === 'active' ? 'default' : 'secondary'}
                            className={rule.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {rule.status === 'active' ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-slate-600 mb-3">
                          <p><strong>Gatilho:</strong> {rule.trigger}</p>
                          <p><strong>Ação:</strong> {rule.action}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{rule.executions} execuções</span>
                          <span>Última execução: {rule.lastRun}</span>
                        </div>

                        <div className="mt-3 flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => toggleAutomationRule(rule.id)}
                            className="text-xs"
                          >
                            {rule.status === 'active' ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {automationRules.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Workflow className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Nenhuma automação configurada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bulk Operations Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bulk Operations Form */}
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span>Nova Operação em Lote</span>
                  </CardTitle>
                  <CardDescription>Execute operações em múltiplos registros simultaneamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-operation">Tipo de Operação</Label>
                    <Select value={bulkForm.operation} onValueChange={(value) => setBulkForm({ ...bulkForm, operation: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a operação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="update_users">Atualizar usuários em massa</SelectItem>
                        <SelectItem value="send_notifications">Enviar notificações em lote</SelectItem>
                        <SelectItem value="export_data">Exportar dados</SelectItem>
                        <SelectItem value="import_data">Importar dados</SelectItem>
                        <SelectItem value="cleanup_tokens">Limpeza de tokens expirados</SelectItem>
                        <SelectItem value="backup_database">Backup do banco de dados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulk-target">Alvo da Operação</Label>
                    <Select value={bulkForm.target} onValueChange={(value) => setBulkForm({ ...bulkForm, target: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o alvo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_users">Todos os usuários</SelectItem>
                        <SelectItem value="active_teachers">Professores ativos</SelectItem>
                        <SelectItem value="inactive_students">Alunos inativos</SelectItem>
                        <SelectItem value="expired_contracts">Contratos expirados</SelectItem>
                        <SelectItem value="specific_company">Empresa específica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulk-parameters">Parâmetros (JSON)</Label>
                    <Textarea
                      id="bulk-parameters"
                      value={bulkForm.parameters}
                      onChange={(e) => setBulkForm({ ...bulkForm, parameters: e.target.value })}
                      placeholder='{"status": "active", "send_welcome": true}'
                      rows={4}
                    />
                  </div>

                  <Button onClick={executeBulkOperation} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Cpu className="h-4 w-4 mr-2" />
                    Executar Operação
                  </Button>
                </CardContent>
              </Card>

              {/* Bulk Operations Status */}
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Operações em Andamento</span>
                  </CardTitle>
                  <CardDescription>Status das operações em lote executadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bulkOperations.map((operation) => (
                      <div key={operation.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900">{operation.name}</h4>
                          <Badge 
                            variant={
                              operation.status === 'completed' ? 'default' :
                              operation.status === 'running' ? 'secondary' :
                              operation.status === 'failed' ? 'destructive' : 'outline'
                            }
                          >
                            {operation.status === 'completed' ? 'Concluída' :
                             operation.status === 'running' ? 'Executando' :
                             operation.status === 'failed' ? 'Falhou' : 'Pendente'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 mb-3">{operation.description}</p>

                        {operation.status === 'running' && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{operation.progress}%</span>
                            </div>
                            <Progress value={operation.progress} className="h-2" />
                          </div>
                        )}

                        {operation.results && (
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-slate-50 rounded">
                              <p className="font-medium">{operation.results.processed}</p>
                              <p className="text-slate-600">Processados</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <p className="font-medium text-green-600">{operation.results.successful}</p>
                              <p className="text-slate-600">Sucessos</p>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <p className="font-medium text-red-600">{operation.results.failed}</p>
                              <p className="text-slate-600">Falhas</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {bulkOperations.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Database className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p>Nenhuma operação em andamento</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-orange-600" />
                    <span>Relatórios Personalizados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <FileText className="h-6 w-6 mb-2" />
                      <span className="text-sm">Relatório de Uso</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      <span className="text-sm">Análise de Usuários</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <TrendingUp className="h-6 w-6 mb-2" />
                      <span className="text-sm">Performance</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Target className="h-6 w-6 mb-2" />
                      <span className="text-sm">Metas & KPIs</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-violet-600" />
                    <span>Insights Inteligentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Oportunidade Detectada</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      35% dos professores não utilizam ferramentas de IA. Recomenda-se treinamento direcionado.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Atenção Necessária</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Uso de tokens 23% acima da média nos últimos 7 dias.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Meta Alcançada</span>
                    </div>
                    <p className="text-xs text-green-700">
                      Satisfação dos usuários atingiu 94% este mês.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5 text-blue-600" />
                    <span>APIs Externas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span className="text-sm">Google Workspace</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span className="text-sm">Microsoft 365</span>
                    <Badge variant="outline">Disponível</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span className="text-sm">Zoom</span>
                    <Badge variant="outline">Disponível</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Webhooks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Webhook
                  </Button>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• Notificações em tempo real</p>
                    <p>• Sincronização automática</p>
                    <p>• Eventos personalizados</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5 text-purple-600" />
                    <span>Exportação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </Button>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>• CSV, Excel, JSON</p>
                    <p>• Agendamento automático</p>
                    <p>• Filtros personalizados</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Rocket className="h-5 w-5 text-red-600" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Database Efficiency</span>
                      <span>87.5%</span>
                    </div>
                    <Progress value={87.5} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>API Response Time</span>
                      <span>240ms</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-slate-600" />
                    <span>Otimizações Sugeridas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Otimizar Consultas</p>
                    <p className="text-xs text-blue-600">Adicionar índices nas tabelas mais acessadas</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-800">Cache de Sessão</p>
                    <p className="text-xs text-green-600">Implementar cache Redis para sessões</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded border border-purple-200">
                    <p className="text-sm font-medium text-purple-800">CDN Setup</p>
                    <p className="text-xs text-purple-600">Configurar CDN para assets estáticos</p>
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

export default AdvancedToolsDashboard;
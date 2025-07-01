import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink, DollarSign, BarChart3, AlertTriangle, Settings, Clock, Tag, FileText, Eye, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';

const AWSCostManagement = () => {
  const [, setLocation] = useLocation();

  const costManagementSections = [
    {
      id: 'billing-dashboard',
      title: 'Billing & Cost Management Dashboard',
      description: 'Visão geral dos custos mensais do Bedrock, gastos por modelo e previsões',
      icon: DollarSign,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      priority: 'Alta',
      url: 'https://console.aws.amazon.com/billing/home#/dashboard',
      features: [
        'Custos mensais do Bedrock',
        'Gastos por modelo (Claude, Llama, etc.)',
        'Trend de gastos dos últimos meses',
        'Previsão de custos futuros'
      ],
      instructions: 'AWS Console → Billing and Cost Management → Dashboard'
    },
    {
      id: 'cost-explorer',
      title: 'AWS Cost Explorer',
      description: 'Análise detalhada de custos com até 13 meses de dados históricos',
      icon: BarChart3,
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      priority: 'Alta',
      url: 'https://console.aws.amazon.com/cost-reports/home#/custom',
      features: [
        'Service: Amazon Bedrock',
        'Usage Type: Input/Output tokens',
        'Region: us-east-1, us-west-2, etc.',
        'Linked Account: Por conta da organização'
      ],
      instructions: 'AWS Console → Cost Management → Cost Explorer'
    },
    {
      id: 'cloudwatch-metrics',
      title: 'Amazon CloudWatch',
      description: 'Métricas de performance e uso em tempo real do Bedrock',
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      priority: 'Média',
      url: 'https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#metricsV2:graph=~();search=bedrock',
      features: [
        'Invocations: Número de chamadas',
        'InvocationLatency: Tempo de resposta',
        'InputTokenCount: Tokens de entrada',
        'OutputTokenCount: Tokens de saída'
      ],
      instructions: 'AWS Console → CloudWatch → Metrics → AWS/Bedrock'
    },
    {
      id: 'detailed-billing',
      title: 'Detailed Billing Reports',
      description: 'Custos granulares por recurso, modelo e tipo de uso',
      icon: FileText,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      priority: 'Média',
      url: 'https://console.aws.amazon.com/billing/home#/bills',
      features: [
        'Model ID (anthropic.claude-v2, etc.)',
        'Usage Type (Input tokens, Output tokens)',
        'Region específica',
        'Linked Account detalhado'
      ],
      instructions: 'Billing Console → Bills → Expand "Amazon Bedrock"'
    },
    {
      id: 'cost-allocation-tags',
      title: 'Cost Allocation Tags',
      description: 'Rastreamento por projeto, equipe e ambiente',
      icon: Tag,
      color: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
      priority: 'Baixa',
      url: 'https://console.aws.amazon.com/billing/home#/tags',
      features: [
        'Project: ChatBot-Vendas',
        'Team: AI-Engineering',
        'Environment: Production',
        'Application: Customer-Support'
      ],
      instructions: 'Billing Console → Cost Allocation Tags → User-Defined'
    },
    {
      id: 'aws-budgets',
      title: 'AWS Budgets',
      description: 'Alertas e controle de gastos com limites personalizados',
      icon: AlertTriangle,
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      priority: 'Alta',
      url: 'https://console.aws.amazon.com/billing/home#/budgets',
      features: [
        'Cost Budget: "Bedrock não deve passar de $500/mês"',
        'Usage Budget: "Máximo 1M tokens/dia"',
        'RI Coverage: Para throughput provisionado',
        'Alertas: 80%, 100% do orçamento'
      ],
      instructions: 'Billing Console → Budgets → Create Budget'
    },
    {
      id: 'usage-reports',
      title: 'Cost and Usage Reports (CUR)',
      description: 'Dados mais detalhados para análise avançada com Athena',
      icon: Settings,
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      priority: 'Baixa',
      url: 'https://console.aws.amazon.com/billing/home#/reports',
      features: [
        'Hourly usage: Uso por hora',
        'Resource IDs: IDs específicos dos recursos',
        'Pricing: Detalhes de preços',
        'Tags: Todas as tags aplicadas'
      ],
      instructions: 'Billing Console → Cost & Usage Reports → Create Report'
    },
    {
      id: 'bedrock-console',
      title: 'Console do Bedrock',
      description: 'Estatísticas de uso dos modelos diretamente no Bedrock',
      icon: Eye,
      color: 'bg-gradient-to-r from-teal-500 to-teal-600',
      priority: 'Média',
      url: 'https://console.aws.amazon.com/bedrock/home?region=us-east-1#/usage',
      features: [
        'Modelos ativos',
        'Requests por modelo',
        'Throughput utilizado',
        'Model access status'
      ],
      instructions: 'AWS Console → Amazon Bedrock → Usage'
    }
  ];

  const handleAccessLink = async (url: string, title: string) => {
    try {
      // Log do acesso para auditoria
      const response = await fetch('/api/admin/aws/resource-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resource: title,
          url: url,
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log(`✅ Acesso registrado: ${title}`);
      }
    } catch (error) {
      console.error('Erro ao registrar acesso:', error);
    }
    
    // Abrir link
    window.open(url, '_blank');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => setLocation('/admin/ai')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Administração de Custos AWS
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Acesse rapidamente todas as ferramentas de monitoramento e controle de custos do AWS Bedrock
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Ferramentas</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Settings className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Alta Prioridade</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Tempo Real</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Clock className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Relatórios</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <FileText className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Management Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {costManagementSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Card key={section.id} className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
                {/* Header com gradiente */}
                <div className={`${section.color} p-4 text-white`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        <Badge 
                          className={`mt-1 ${getPriorityColor(section.priority)} text-xs`}
                          variant="secondary"
                        >
                          {section.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/90 text-sm">{section.description}</p>
                </div>

                <CardContent className="p-6">
                  {/* Instruções de acesso */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Como acessar:</p>
                    <p className="text-sm text-gray-600">{section.instructions}</p>
                  </div>

                  {/* Funcionalidades */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Principais funcionalidades:</p>
                    <ul className="space-y-2">
                      {section.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Botão de acesso */}
                  <Button
                    onClick={() => handleAccessLink(section.url, section.title)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar {section.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checklist de Monitoramento */}
        <Card className="mt-8 bg-gradient-to-r from-gray-50 to-white border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Checklist de Monitoramento Recomendado
            </CardTitle>
            <CardDescription>
              Rotina recomendada para um controle efetivo dos custos AWS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Diário</h4>
                <p className="text-sm text-blue-700">CloudWatch metrics e dashboards</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Semanal</h4>
                <p className="text-sm text-green-700">Cost Explorer trends</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Mensal</h4>
                <p className="text-sm text-orange-700">Detailed billing review</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Configuração</h4>
                <p className="text-sm text-purple-700">Budgets com alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AWSCostManagement;
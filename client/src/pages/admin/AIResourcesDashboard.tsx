import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ResourceConfigModal } from "@/components/ResourceConfigModal";
import {
  Activity,
  Settings,
  RefreshCw,
  BookOpen,
  Calendar,
  FileText,
  Target,
  Image,
  Brain,
  Bot,
  Map,
  Trophy,
  Languages,
  Search,
  MessageCircle,
  Cpu,
  Database,
  Zap
} from "lucide-react";

export default function AIResourcesDashboard() {
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  // Buscar modelos disponíveis do Bedrock
  const { data: bedrockModels, isLoading: loadingModels, refetch: refetchModels } = useQuery({
    queryKey: ['/api/ai-central/models'],
    queryFn: async () => {
      const response = await fetch('/api/ai-central/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    }
  });

  // Recursos para Professores
  const teacherResources = [
    {
      title: "Planejamento de Aulas",
      description: "Criação automatizada de planos de aula alinhados à BNCC",
      icon: BookOpen,
      category: "Planejamento",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Alto",
      route: "/professor/ferramentas/planejamento-aula"
    },
    {
      title: "Gerador de Atividades",
      description: "Criação de exercícios e atividades personalizadas",
      icon: FileText,
      category: "Conteúdo",
      aiModels: ["Claude 3.5 Sonnet", "ChatGPT 4"],
      status: "active",
      usage: "Alto",
      route: "/professor/ferramentas/gerador-atividades"
    },
    {
      title: "Cronograma Pedagógico",
      description: "Organização temporal de conteúdos e avaliações",
      icon: Calendar,
      category: "Planejamento",
      aiModels: ["Claude 3 Haiku"],
      status: "active",
      usage: "Médio",
      route: "/professor/ferramentas/modelos-planejamento"
    },
    {
      title: "Avaliações Adaptativas",
      description: "Criação de provas e exercícios adaptativos",
      icon: Target,
      category: "Avaliação",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Médio",
      route: "/professor/quiz"
    },
    {
      title: "Análise de Redações",
      description: "Correção automatizada e feedback detalhado",
      icon: FileText,
      category: "Avaliação",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Médio",
      route: "/professor/redacoes"
    },
    {
      title: "Resumos BNCC",
      description: "Sínteses automatizadas de competências e habilidades",
      icon: Target,
      category: "Curricular",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Baixo",
      route: "/professor/ferramentas/resumos-bncc"
    },
    {
      title: "Imagens Educacionais",
      description: "Geração de ilustrações e diagramas pedagógicos",
      icon: Image,
      category: "Visual",
      aiModels: ["DALL-E 3", "Stable Diffusion"],
      status: "active",
      usage: "Baixo",
      route: "/professor/ferramentas/imagem-educacional"
    },
    {
      title: "Central de IA",
      description: "Acesso direto ao ChatGPT, Claude e Perplexity",
      icon: Brain,
      category: "Geral",
      aiModels: ["ChatGPT 4", "Claude 3.5", "Perplexity"],
      status: "active",
      usage: "Alto",
      route: "/central-ia"
    }
  ];

  // Recursos para Alunos
  const studentResources = [
    {
      title: "Tutor Virtual de IA",
      description: "Assistente pessoal para dúvidas e explicações",
      icon: Bot,
      category: "Tutoria",
      aiModels: ["Claude 3.5 Sonnet", "ChatGPT 4"],
      status: "active",
      usage: "Alto",
      route: "/aluno/ai-tutor"
    },
    {
      title: "Planos de Estudo Personalizados",
      description: "Cronogramas de estudo adaptados ao perfil do aluno",
      icon: Calendar,
      category: "Planejamento",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Médio",
      route: "/aluno/study-planning"
    },
    {
      title: "Mapas Mentais Inteligentes",
      description: "Organização visual de conhecimentos",
      icon: Map,
      category: "Organização",
      aiModels: ["Claude 3 Haiku"],
      status: "active",
      usage: "Médio",
      route: "/aluno/mind-map"
    },
    {
      title: "Quiz Adaptativos",
      description: "Exercícios que se ajustam ao nível de conhecimento",
      icon: Trophy,
      category: "Avaliação",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Alto",
      route: "/aluno/quiz"
    },
    {
      title: "Tradutor Educacional",
      description: "Tradução contextualizada para estudos",
      icon: Languages,
      category: "Idiomas",
      aiModels: ["Claude 3.5 Sonnet", "ChatGPT 4"],
      status: "active",
      usage: "Baixo",
      route: "/aluno/translator"
    },
    {
      title: "Explorador Wikipedia",
      description: "Navegação inteligente em conteúdos educacionais",
      icon: Search,
      category: "Pesquisa",
      aiModels: ["Perplexity AI"],
      status: "active",
      usage: "Médio",
      route: "/aluno/wikipedia"
    },
    {
      title: "Tutor por Voz",
      description: "Interação por áudio para explicações dinâmicas",
      icon: MessageCircle,
      category: "Interação",
      aiModels: ["OpenAI Whisper", "Eleven Labs"],
      status: "beta",
      usage: "Baixo",
      route: "/aluno/voice-tutor"
    }
  ];

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await refetchModels();
      toast({
        title: "Dados atualizados",
        description: "Informações dos recursos de IA foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'beta': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsageColor = (usage: string) => {
    switch (usage) {
      case 'Alto': return 'bg-red-100 text-red-800';
      case 'Médio': return 'bg-orange-100 text-orange-800';
      case 'Baixo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard de Recursos de IA - IAprender</title>
        <meta name="description" content="Gestão e configuração de recursos de inteligência artificial para educação" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard de Recursos de IA
            </h1>
            <p className="text-gray-600">
              Gerencie e configure os modelos de IA disponíveis para professores e alunos
            </p>
          </div>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="mt-4 sm:mt-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="bedrock" className="flex items-center space-x-2">
                <Cpu className="h-4 w-4" />
                AWS Bedrock
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                Professores
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                Alunos
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total de Recursos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {teacherResources.length + studentResources.length}
                    </div>
                    <p className="text-sm text-gray-600">Ferramentas ativas</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Modelos IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {bedrockModels?.data?.total_models || 0}
                    </div>
                    <p className="text-sm text-gray-600">AWS Bedrock</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Para Professores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{teacherResources.length}</div>
                    <p className="text-sm text-gray-600">Ferramentas disponíveis</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Para Alunos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">{studentResources.length}</div>
                    <p className="text-sm text-gray-600">Recursos de estudo</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AWS Bedrock Tab */}
            <TabsContent value="bedrock" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      Status do Bedrock
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingModels ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verificando...</span>
                      </div>
                    ) : bedrockModels?.success ? (
                      <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Desconectado</Badge>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Cpu className="h-5 w-5 mr-2" />
                      Modelos Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {bedrockModels?.data?.models?.length || 0}
                    </div>
                    <p className="text-sm text-gray-600">Prontos para uso</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-blue-100 text-blue-800">Ótima</Badge>
                    <p className="text-sm text-gray-600 mt-1">Tempo de resposta baixo</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherResources.map((resource, index) => (
                  <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <resource.icon className="h-6 w-6 text-blue-600" />
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                        </div>
                        <Badge className={getStatusColor(resource.status)}>
                          {resource.status === 'active' ? 'Ativo' : resource.status === 'beta' ? 'Beta' : 'Inativo'}
                        </Badge>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Categoria:</p>
                        <Badge variant="outline">{resource.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Uso:</p>
                        <Badge className={getUsageColor(resource.usage)} variant="outline">
                          {resource.usage}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Modelos IA:</p>
                        <div className="flex flex-wrap gap-1">
                          {resource.aiModels.map((model, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Link href={resource.route} className="flex-1">
                          <Button className="w-full" variant="outline">
                            Acessar Ferramenta
                          </Button>
                        </Link>
                        <ResourceConfigModal
                          resource={{
                            id: `teacher-${index}`,
                            title: resource.title,
                            type: 'teacher',
                            description: resource.description,
                            category: resource.category,
                            enabled: resource.status === 'active'
                          }}
                          trigger={
                            <Button variant="secondary" size="sm" className="px-3">
                              <Settings className="h-4 w-4" />
                            </Button>
                          }
                          onSave={(config) => {
                            toast({
                              title: "Configuração Salva",
                              description: `${resource.title} configurado com sucesso!`
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentResources.map((resource, index) => (
                  <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <resource.icon className="h-6 w-6 text-orange-600" />
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                        </div>
                        <Badge className={getStatusColor(resource.status)}>
                          {resource.status === 'active' ? 'Ativo' : resource.status === 'beta' ? 'Beta' : 'Inativo'}
                        </Badge>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Categoria:</p>
                        <Badge variant="outline">{resource.category}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Uso:</p>
                        <Badge className={getUsageColor(resource.usage)} variant="outline">
                          {resource.usage}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Modelos IA:</p>
                        <div className="flex flex-wrap gap-1">
                          {resource.aiModels.map((model, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Link href={resource.route} className="flex-1">
                          <Button className="w-full" variant="outline">
                            Acessar Recurso
                          </Button>
                        </Link>
                        <ResourceConfigModal
                          resource={{
                            id: `student-${index}`,
                            title: resource.title,
                            type: 'student',
                            description: resource.description,
                            category: resource.category,
                            enabled: resource.status === 'active'
                          }}
                          trigger={
                            <Button variant="secondary" size="sm" className="px-3">
                              <Settings className="h-4 w-4" />
                            </Button>
                          }
                          onSave={(config) => {
                            toast({
                              title: "Configuração Salva",
                              description: `${resource.title} configurado com sucesso!`
                            });
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
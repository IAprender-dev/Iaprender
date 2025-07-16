import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import {
  Bot,
  Brain,
  GraduationCap,
  BookOpen,
  Users,
  PenTool,
  Calculator,
  Search,
  Image,
  Lightbulb,
  Target,
  Calendar,
  FileText,
  MessageCircle,
  Languages,
  Newspaper,
  Map,
  Trophy,
  Settings,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
// Logo será renderizado com fallback SVG inline

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
      title: "Planos de Aula Inteligentes",
      description: "Geração automática de planos de aula alinhados à BNCC",
      icon: Calendar,
      category: "Planejamento",
      aiModels: ["Claude 3.5 Sonnet", "Claude 3 Haiku"],
      status: "active",
      usage: "Alto",
      route: "/professor/ferramentas/planejamento-aula"
    },
    {
      title: "Gerador de Atividades",
      description: "Criação de exercícios personalizados por disciplina e série",
      icon: PenTool,
      category: "Atividades",
      aiModels: ["Claude 3.5 Sonnet", "Titan Text"],
      status: "active",
      usage: "Médio",
      route: "/professor/ferramentas/gerador-atividades"
    },
    {
      title: "Análise de Documentos",
      description: "Extração de insights educacionais de PDFs e textos",
      icon: Search,
      category: "Análise",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Médio",
      route: "/professor/ferramentas/analisar-documentos"
    },
    {
      title: "Correção de Redações",
      description: "Avaliação automática com feedback detalhado",
      icon: FileText,
      category: "Avaliação",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Alto",
      route: "/professor/redacoes"
    },
    {
      title: "Materiais Didáticos",
      description: "Criação de apostilas e materiais de apoio",
      icon: BookOpen,
      category: "Conteúdo",
      aiModels: ["Claude 3.5 Sonnet", "Titan Text"],
      status: "active",
      usage: "Médio",
      route: "/professor/ferramentas/materiais-didaticos"
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
      route: "/student/ai-tutor"
    },
    {
      title: "Planos de Estudo Personalizados",
      description: "Cronogramas de estudo adaptados ao perfil do aluno",
      icon: Calendar,
      category: "Planejamento",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Médio",
      route: "/student/study-planning"
    },
    {
      title: "Mapas Mentais Inteligentes",
      description: "Organização visual de conhecimentos",
      icon: Map,
      category: "Organização",
      aiModels: ["Claude 3 Haiku"],
      status: "active",
      usage: "Médio",
      route: "/student/mind-map"
    },
    {
      title: "Quiz Adaptativos",
      description: "Exercícios que se ajustam ao nível de conhecimento",
      icon: Trophy,
      category: "Avaliação",
      aiModels: ["Claude 3.5 Sonnet"],
      status: "active",
      usage: "Alto",
      route: "/student/quiz"
    },
    {
      title: "Tradutor Educacional",
      description: "Tradução contextualizada para estudos",
      icon: Languages,
      category: "Idiomas",
      aiModels: ["Claude 3.5 Sonnet", "ChatGPT 4"],
      status: "active",
      usage: "Baixo",
      route: "/student/translator"
    },
    {
      title: "Explorador Wikipedia",
      description: "Navegação inteligente em conteúdos educacionais",
      icon: Search,
      category: "Pesquisa",
      aiModels: ["Perplexity AI"],
      status: "active",
      usage: "Médio",
      route: "/student/wikipedia"
    },
    {
      title: "Tutor por Voz",
      description: "Interação por áudio para explicações dinâmicas",
      icon: MessageCircle,
      category: "Interação",
      aiModels: ["OpenAI Whisper", "Eleven Labs"],
      status: "beta",
      usage: "Baixo",
      route: "/student/voice-tutor"
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
        <title>Recursos de IA | IAprender Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">IA</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">Recursos de IA</h1>
                  <p className="text-sm text-gray-600">Painel de controle das funcionalidades de Inteligência Artificial</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar
                </Button>
                <Link href="/admin/crud">
                  <Button variant="outline" size="sm" className="text-gray-600 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="bedrock" className="flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AWS Bedrock
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Professores
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
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

              {/* Status da Integração */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Integração AWS Bedrock</CardTitle>
                  <CardDescription>Conectividade e disponibilidade dos modelos de IA</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingModels ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verificando conexão...</span>
                    </div>
                  ) : bedrockModels?.success ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Conectado - {bedrockModels.data.total_models} modelos disponíveis</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>Erro de conexão - Verificar credenciais AWS</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bedrock Tab */}
            <TabsContent value="bedrock" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Modelos AWS Bedrock Disponíveis</CardTitle>
                  <CardDescription>Lista completa de modelos de IA integrados</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingModels ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Carregando modelos...</span>
                    </div>
                  ) : bedrockModels?.success ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {bedrockModels.data.bedrock_models?.map((model: any, index: number) => (
                        <Card key={index} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{model.modelName}</CardTitle>
                            <CardDescription>{model.providerName}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                {model.modelId}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Input: {model.inputModalities?.join(', ') || 'TEXT'}</div>
                              <div>Output: {model.outputModalities?.join(', ') || 'TEXT'}</div>
                            </div>
                            {model.responseStreamingSupported && (
                              <Badge variant="secondary" className="text-xs">
                                Streaming
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Não foi possível carregar os modelos do Bedrock</p>
                      <Button onClick={refreshData} className="mt-4">
                        Tentar Novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                      <Link href={resource.route}>
                        <Button className="w-full mt-3" variant="outline">
                          Acessar Ferramenta
                        </Button>
                      </Link>
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
                      <Link href={resource.route}>
                        <Button className="w-full mt-3" variant="outline">
                          Acessar Recurso
                        </Button>
                      </Link>
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Brain, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  ChevronRight,
  Globe,
  TrendingUp,
  Zap,
  Star,
  MessageSquare,
  Image,
  Video,
  Mic,
  FileText,
  ArrowRight,
  CheckCircle2,
  Target,
  Clock,
  BarChart,
  Bot,
  Play,
  Award,
  Shield,
  Lightbulb,
  Rocket,
  Calendar
} from "lucide-react";

import aiverseLogo from "@assets/Design sem nome (5)_1749594709695.png";

export default function AIverseLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={aiverseLogo} alt="AIverse" className="h-10 w-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AIverse
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#ferramentas" className="text-gray-600 hover:text-indigo-600 transition-colors">Ferramentas IA</a>
              <a href="#dashboards" className="text-gray-600 hover:text-indigo-600 transition-colors">Dashboards</a>
              <a href="#impacto" className="text-gray-600 hover:text-indigo-600 transition-colors">Impacto</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Explorar AIverse
                </Button>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
              🌟 Nova Era da Educação com IA
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                AIverse
              </span>
              <br />
              <span className="text-gray-900">Seu Universo de</span>
              <br />
              <span className="text-gray-900">Inteligência Artificial</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              A plataforma educacional mais completa do mundo, integrando as melhores IAs para texto, imagem, vídeo e áudio. 
              Transforme sua metodologia de ensino com 25+ modelos de IA de última geração.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3">
                  Entrar no AIverse
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-8 py-3">
                Explorar Ferramentas
                <Play className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Global AI Statistics */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              A Revolução da IA na Educação Global
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Dados mundiais comprovam: a inteligência artificial está transformando o ensino em todos os continentes
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">89%</div>
              <div className="text-gray-600">Universidades americanas usam IA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">76%</div>
              <div className="text-gray-600">Professores globalmente adotaram IA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-600 mb-2">€2Bi</div>
              <div className="text-gray-600">Investimento EU em IA educacional</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">+40%</div>
              <div className="text-gray-600">Melhoria em aprendizagem com IA</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Showcase */}
      <section id="ferramentas" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Todas as IAs Líderes Mundiais em Uma Plataforma
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Acesso integrado aos modelos mais avançados de inteligência artificial para todas as suas necessidades educacionais
            </p>
          </div>

          {/* Text AI Models */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center justify-center">
              <Brain className="mr-3 h-6 w-6 text-indigo-600" />
              Modelos de Linguagem
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Card className="hover:shadow-lg transition-shadow border-emerald-100 hover:border-emerald-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-emerald-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">OpenAI</h4>
                  <p className="text-sm text-emerald-700 font-medium">GPT-4o, GPT-4o mini</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-blue-100 hover:border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-blue-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Google Gemini</h4>
                  <p className="text-sm text-blue-700 font-medium">1.5 Pro, 1.5 Flash, 2.0</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-orange-100 hover:border-orange-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="h-6 w-6 text-orange-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Claude</h4>
                  <p className="text-sm text-orange-700 font-medium">3 Haiku, 3 Opus, 3.5 Sonnet</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-purple-100 hover:border-purple-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-purple-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Llama 3</h4>
                  <p className="text-sm text-purple-700 font-medium">Meta AI</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow border-indigo-100 hover:border-indigo-200">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Star className="h-6 w-6 text-indigo-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mistral & Command R</h4>
                  <p className="text-sm text-indigo-700 font-medium">R Plus Models</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Image AI Models */}
          <div className="mb-16">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center justify-center">
              <Image className="mr-3 h-6 w-6 text-purple-600" />
              Geração de Imagens
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card className="hover:shadow-lg transition-shadow border-pink-100 hover:border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-pink-100 border border-pink-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Image className="h-4 w-4 text-pink-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Stable Diffusion</h4>
                  <p className="text-xs text-pink-700 font-medium">3.0, 3.5</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-violet-100 hover:border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-violet-100 border border-violet-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-4 w-4 text-violet-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Flux</h4>
                  <p className="text-xs text-violet-700 font-medium">1.0 Dev, Pro, Ultra</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-cyan-100 hover:border-cyan-200 bg-gradient-to-br from-cyan-50 to-teal-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-cyan-100 border border-cyan-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Star className="h-4 w-4 text-cyan-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Ideogram</h4>
                  <p className="text-xs text-cyan-700 font-medium">2, 2-Turbo</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-emerald-100 hover:border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Brain className="h-4 w-4 text-emerald-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Google Imagen</h4>
                  <p className="text-xs text-emerald-700 font-medium">3, 3-fast</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-amber-100 hover:border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-4 w-4 text-amber-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">DALL-E 3</h4>
                  <p className="text-xs text-amber-700 font-medium">OpenAI</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-shadow border-indigo-100 hover:border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="w-8 h-8 bg-indigo-100 border border-indigo-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Target className="h-4 w-4 text-indigo-700" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm">Recraft AI</h4>
                  <p className="text-xs text-indigo-700 font-medium">Design profissional</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Video & Audio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                <Video className="mr-3 h-6 w-6 text-red-600" />
                Criação de Vídeos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow border-red-100 hover:border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Video className="h-4 w-4 text-red-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Runway</h4>
                    <p className="text-xs text-red-700 font-medium">Video Gen-3 Alpha</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-orange-100 hover:border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-orange-100 border border-orange-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Play className="h-4 w-4 text-orange-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Luma AI</h4>
                    <p className="text-xs text-orange-700 font-medium">Alta qualidade</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-8 flex items-center">
                <Mic className="mr-3 h-6 w-6 text-green-600" />
                Áudio e Narração
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow border-green-100 hover:border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-green-100 border border-green-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Mic className="h-4 w-4 text-green-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">ElevenLabs</h4>
                    <p className="text-xs text-green-700 font-medium">Vozes realistas</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-teal-100 hover:border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-teal-100 border border-teal-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Bot className="h-4 w-4 text-teal-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">OpenAI Voice</h4>
                    <p className="text-xs text-teal-700 font-medium">Síntese natural</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-blue-100 hover:border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <FileText className="h-4 w-4 text-blue-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Deepgram AI</h4>
                    <p className="text-xs text-blue-700 font-medium">Transcrição</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-purple-100 hover:border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-purple-100 border border-purple-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <BarChart className="h-4 w-4 text-purple-700" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">Assembly AI</h4>
                    <p className="text-xs text-purple-700 font-medium">Análise áudio</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <section id="dashboards" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dashboards Especializados por Perfil
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Interfaces intuitivas e poderosas adaptadas para cada tipo de usuário educacional
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Director Dashboard */}
            <Card className="border-2 border-amber-200 bg-amber-50/30 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Diretores</h3>
                <p className="text-gray-600 mb-6">
                  Gestão estratégica da instituição com insights avançados e relatórios executivos.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Dashboard executivo completo
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Analytics institucional
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Gestão de equipes
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Relatórios de performance
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Controle de custos IA
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Dashboard */}
            <Card className="border-2 border-blue-200 bg-blue-50/30 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Professores</h3>
                <p className="text-gray-600 mb-6">
                  Suite completa de ferramentas IA para transformar o ensino e otimizar o trabalho docente.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Gerador de atividades IA
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Criação de imagens educacionais
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Planejamento BNCC
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Resumos didáticos automáticos
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Central de IA com 25+ modelos
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Dashboard */}
            <Card className="border-2 border-purple-200 bg-purple-50/30 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Alunos</h3>
                <p className="text-gray-600 mb-6">
                  Plataforma completa de aprendizado com IA personalizada e ferramentas adaptativas.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Pro Versa - Tutora IA por voz
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Exercícios adaptativos
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Wikipedia Explorer
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Planejamento de estudos
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-3" />
                    Sistema de ranking
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Education Impact */}
      <section id="impacto" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              O Futuro da Educação é Agora
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Descubra como a AIverse está revolucionando o aprendizado em instituições ao redor do mundo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aprendizado Personalizado</h3>
              <p className="text-gray-600 text-sm">IA adapta-se ao ritmo e estilo de cada estudante</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Eficiência Docente</h3>
              <p className="text-gray-600 text-sm">Automatize tarefas e foque no que realmente importa</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados Comprovados</h3>
              <p className="text-gray-600 text-sm">Melhoria média de 40% no desempenho estudantil</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Segurança Total</h3>
              <p className="text-gray-600 text-sm">Proteção de dados e privacidade educacional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Transforme sua Educação com IA Hoje
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Junte-se às milhares de instituições que já descobriram o poder da inteligência artificial na educação
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
              Agendar Demonstração
              <Clock className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={aiverseLogo} alt="AIverse" className="h-8 w-8" />
                <span className="text-xl font-bold">AIverse</span>
              </div>
              <p className="text-gray-400 text-sm">
                Seu universo de inteligência artificial para educação de classe mundial.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Ferramentas IA</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dashboards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 AIverse. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Termos</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
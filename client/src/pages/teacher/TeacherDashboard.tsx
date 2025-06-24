import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  LogOut, 
  BookOpen, 
  Users, 
  BarChart3, 
  Calendar,
  Star,
  Download,
  Heart,
  Bot,
  PenTool,
  Search,
  GraduationCap,
  Lightbulb,
  ImageIcon,
  FileText,
  ArrowRight,
  Sparkles,
  PlayCircle,
  ClipboardList,
  Wand2,
  FilePlus,
  Palette,
  Zap,
  AlertTriangle,
  TrendingUp,
  Calculator,
  Send,
  Brain,
  Pencil,
  CheckCircle,
  Clock,
  History,
  Eye
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import GradeCalculator from "@/components/teacher/GradeCalculator";
import NotificationSender from "@/components/teacher/NotificationSender";
import alverseLogo from '@/assets/aiverse-logo-new.png';



interface DashboardMetrics {
  activitiesCreated: number;
  lessonPlans: number;
  imagesGenerated: number;
  documentsAnalyzed: number;
  weeklyTrend: {
    activities: number;
    lessonPlans: number;
    images: number;
    documents: number;
  };
  chartData: {
    activities?: Array<{ value: number }>;
    lessonPlans?: Array<{ value: number }>;
    images?: Array<{ value: number }>;
    documents?: Array<{ value: number }>;
  };
}

interface TokenUsageData {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: string;
  warningThreshold: boolean;
  stats: {
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    averageDailyUsage: number;
  };
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();

  // Buscar dados de consumo de tokens
  const { data: tokenData, isLoading: isTokenLoading } = useQuery<TokenUsageData>({
    queryKey: ['/api/tokens/status'],
    enabled: !!user,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Get current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        {/* Main Dashboard Container */}
        <div className="flex h-screen bg-slate-50">
          {/* Left Sidebar - Profile Summary */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg">
            {/* Profile Header */}
            <div className="p-6 border-b border-slate-200">
              <Card className="mb-6 border border-slate-200 bg-white shadow-sm">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 border-2 border-slate-200">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 mb-2">{user?.email}</p>
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Professor
                    </Badge>
                  </div>
                </CardHeader>
              </Card>


            </div>

            {/* Navigation and Actions */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <Link href="/teacher/profile">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium h-12">
                    <User className="h-5 w-5 mr-2" />
                    Editar Perfil Completo
                  </Button>
                </Link>
                
                <div className="grid gap-3">
                  <Link href="/professor/ferramentas">
                    <Button className="w-full justify-start h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      <BookOpen className="h-4 w-4 mr-3" />
                      Ferramentas de Ensino
                    </Button>
                  </Link>
                  
                  <Link href="/professor/planejamento">
                    <Button className="w-full justify-start h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      <Calendar className="h-4 w-4 mr-3" />
                      Planejamento de Aulas
                    </Button>
                  </Link>
                  
                  <Link href="/tokens">
                    <Button className="w-full justify-start h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      <Zap className="h-4 w-4 mr-3" />
                      Gestão de Tokens
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                      <img src={alverseLogo} alt="Alverse" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-slate-900">Dashboard do Professor</h1>
                      <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={logout}
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              {/* Welcome Section */}
              <Card className="mb-8 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white border-0 shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                <CardContent className="p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">{getGreeting()}, {user?.firstName}!</h2>
                        <p className="text-white/90 text-xl font-medium mb-6">Seja bem-vindo ao seu painel de ensino inteligente</p>
                        <div className="flex items-center gap-8 mt-4">
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Download className="h-5 w-5" />
                            <span className="font-bold">15 Downloads</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Heart className="h-5 w-5" />
                            <span className="font-bold">12 Favoritos</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Users className="h-5 w-5" />
                            <span className="font-bold">28 Alunos Online</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 mb-2 px-4 py-2 text-base font-bold shadow-lg">
                          <Star className="h-4 w-4 mr-2" />
                          Premium
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Usage Card - Redesigned */}
              <div className="mb-8">
                {isTokenLoading ? (
                  <Card className="border border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
                          <div className="h-3 bg-slate-200 rounded animate-pulse w-full"></div>
                          <div className="h-2 bg-slate-200 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : tokenData ? (
                  <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`relative p-4 rounded-2xl ${
                            tokenData.warningThreshold 
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                          } shadow-lg`}>
                            <Zap className="h-7 w-7 text-white" />
                            {tokenData.warningThreshold && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                              Tokens de IA
                            </h2>
                            <p className="text-slate-600 text-sm">
                              {tokenData.warningThreshold ? 'Atenção: Limite próximo' : 'Monitoramento em tempo real'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-3xl font-bold mb-1 ${
                            tokenData.warningThreshold ? 'text-amber-600' : 'text-blue-600'
                          }`}>
                            {((tokenData.currentUsage / tokenData.monthlyLimit) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 font-medium">utilizado</div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Enhanced Progress Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              {tokenData.currentUsage.toLocaleString()} tokens usados
                            </span>
                            <span className="font-medium text-slate-500">
                              {tokenData.monthlyLimit.toLocaleString()} limite
                            </span>
                          </div>
                          
                          <div className="relative">
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                  tokenData.warningThreshold 
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                }`}
                                style={{ width: `${Math.min((tokenData.currentUsage / tokenData.monthlyLimit) * 100, 100)}%` }}
                              ></div>
                            </div>
                            {tokenData.warningThreshold && (
                              <div className="absolute top-0 right-4 transform -translate-y-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Compact Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-xs font-medium text-green-700">Disponível</span>
                            </div>
                            <div className="text-xl font-bold text-green-800">
                              {tokenData.remainingTokens.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-blue-700">Hoje</span>
                            </div>
                            <div className="text-xl font-bold text-blue-800">
                              {tokenData.stats.dailyUsage.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200/50 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-purple-700">Reset</span>
                            </div>
                            <div className="text-xl font-bold text-purple-800">
                              {Math.ceil((new Date(tokenData.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-300 rounded-xl flex items-center justify-center">
                          <Zap className="h-6 w-6 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Dados Indisponíveis</h3>
                          <p className="text-sm text-slate-600">Não foi possível carregar as informações</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Essential Actions - Simplified */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <Bot className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-bold px-3 py-1 text-sm">
                          <Sparkles className="h-4 w-4 mr-1" />
                          Central IA
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-bold text-2xl text-white">Central de Inteligências</h3>
                        <p className="text-white/90 text-base leading-relaxed">
                          Acesse ChatGPT, Claude e Gemini em uma interface unificada para maximizar sua produtividade
                        </p>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="flex items-center text-white/80 font-medium">
                            <span>Acessar Central</span>
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/professor/ferramentas/planejamento-aula">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-bold px-3 py-1 text-sm">
                          <ClipboardList className="h-4 w-4 mr-1" />
                          Essencial
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-bold text-2xl text-white">Planos de Aula</h3>
                        <p className="text-white/90 text-base leading-relaxed">
                          Crie planos de aula detalhados e alinhados à BNCC com o poder da inteligência artificial
                        </p>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="flex items-center text-white/80 font-medium">
                            <span>Criar Plano</span>
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick Navigation & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Access to Tools */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Lightbulb className="h-6 w-6 text-white" />
                      </div>
                      Acesso Rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/professor/ferramentas/gerador-atividades">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                            <PenTool className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Gerador de Atividades</p>
                            <p className="text-sm text-slate-600">Criar exercícios com IA</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/professor/ferramentas/materiais-didaticos">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Materiais Didáticos</p>
                            <p className="text-sm text-slate-600">Resumos e conteúdos</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/professor/ferramentas/analisar-documentos">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                            <Search className="h-5 w-5 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Análise de Documentos</p>
                            <p className="text-sm text-slate-600">PDFs em material didático</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/tokens">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                            <BarChart3 className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Gerenciar Tokens</p>
                            <p className="text-sm text-slate-600">Controle de uso</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Usage Insights */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      Insights de Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tokenData ? (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Eficiência Mensal</span>
                            <span className="text-lg font-bold text-blue-800">
                              {tokenData.stats.averageDailyUsage > 0 
                                ? Math.round((tokenData.stats.monthlyUsage / tokenData.monthlyLimit) * 100)
                                : 0}%
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">
                            Você está utilizando os recursos de forma {
                              (tokenData.currentUsage / tokenData.monthlyLimit) < 0.7 ? 'eficiente' : 'intensa'
                            }
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">Tokens Disponíveis</span>
                            <span className="text-lg font-bold text-green-800">
                              {Math.round((tokenData.remainingTokens / tokenData.monthlyLimit) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-green-600">
                            {tokenData.remainingTokens.toLocaleString()} tokens restantes este mês
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-700">Próximo Reset</span>
                            <span className="text-lg font-bold text-purple-800">
                              {Math.ceil((new Date(tokenData.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                            </span>
                          </div>
                          <p className="text-xs text-purple-600">
                            Seus limites serão renovados
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600">Carregando insights...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tools & Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
                  {/* Central de Inteligências */}
                  <Card className="border border-purple-200/60 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/central-ia">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Bot className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors mb-2">
                              Central de Inteligências
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Acesse ChatGPT, Claude e outras IAs
                            </p>
                          </div>
                          <div className="flex items-center text-purple-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Calculadora de Notas */}
                  <Card className="border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/calculadora">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Calculator className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
                              Calculadora de Notas
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Gerencie e calcule notas dos alunos
                            </p>
                          </div>
                          <div className="flex items-center text-blue-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Notificações de Comportamento */}
                  <Card className="border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/notificacoes">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Send className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                              Notificações de Comportamento
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Envie notificações para a secretaria
                            </p>
                          </div>
                          <div className="flex items-center text-emerald-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Dashboard de Análises */}
                  <Card className="border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/analises">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Brain className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-orange-700 transition-colors mb-2">
                              Dashboard de Análises
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Análises e estatísticas avançadas
                            </p>
                          </div>
                          <div className="flex items-center text-orange-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>



                  {/* Gerador de Atividades */}
                  <Card className="border border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-teal-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/ferramentas/gerador-atividades">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <ClipboardList className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors mb-2">
                              Gerador de Atividades
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Crie atividades educacionais
                            </p>
                          </div>
                          <div className="flex items-center text-cyan-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Materiais Didáticos */}
                  <Card className="border border-green-200/60 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/ferramentas/materiais-didaticos">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-green-700 transition-colors mb-2">
                              Materiais Didáticos
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Resumos didáticos com IA
                            </p>
                          </div>
                          <div className="flex items-center text-green-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Análise de Documentos */}
                  <Card className="border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/ferramentas/analisar-documentos">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Search className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors mb-2">
                              Análise de Documentos
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Analise PDFs e documentos
                            </p>
                          </div>
                          <div className="flex items-center text-indigo-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Dashboard de Redações */}
                  <Card className="border border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/redacoes">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <Pencil className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors mb-2">
                              Dashboard de Redações
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Analise redações com IA
                            </p>
                          </div>
                          <div className="flex items-center text-violet-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Notícias & Podcasts */}
                  <Card className="border border-yellow-200/60 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="p-6">
                      <Link href="/professor/noticias-podcasts">
                        <div className="flex flex-col items-center text-center space-y-4 cursor-pointer">
                          <div className="p-4 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl group-hover:scale-105 transition-transform shadow-lg">
                            <PlayCircle className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-yellow-700 transition-colors mb-2">
                              Notícias & Podcasts
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Conteúdo educacional atualizado
                            </p>
                          </div>
                          <div className="flex items-center text-yellow-600 font-medium text-sm">
                            <span>Acessar</span>
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
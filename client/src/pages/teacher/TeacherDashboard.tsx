import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { 
  CalendarCheck2, 
  CheckSquare, 
  FilePlus, 
  Bot, 
  Sparkles, 
  Search, 
  ImageIcon, 
  BookOpen, 
  PenTool, 
  BarChart,
  Users,
  FileText,
  ArrowRight,
  FileEdit,
  ClipboardList,
  ListChecks,
  BookOpenCheck,
  LayoutGrid,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Target,
  PlayCircle,
  Menu,
  X,
  Home,
  User,
  LogOut,
  Settings,
  Bell,
  Plus,
  Wand2,
  Lightbulb,
  GraduationCap,
  Palette
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TokenUsageWidget } from "@/components/tokens/TokenUsageWidget";
import alverseLogo from "@assets/iaprender-logo.png";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Get current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={alverseLogo} alt="Alverse" className="h-12 w-12 object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Dashboard do Professor</h1>
                  <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={logout}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="p-4 space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Olá, {user?.firstName}! 👋</h2>
                  <p className="text-blue-100 text-lg">
                    Transforme sua educação com o poder da Inteligência Artificial
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Status e Tokens */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Widget de Tokens - Posição destacada */}
            <div className="lg:col-span-1">
              <TokenUsageWidget />
            </div>
            
            {/* Cards de Status Rápido */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">Atividades Criadas</p>
                      <p className="text-2xl font-bold text-emerald-900">12</p>
                    </div>
                    <CheckSquare className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Planos de Aula</p>
                      <p className="text-2xl font-bold text-blue-900">8</p>
                    </div>
                    <CalendarCheck2 className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-gradient-to-br from-violet-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-violet-600 font-medium">Imagens Geradas</p>
                      <p className="text-2xl font-bold text-violet-900">25</p>
                    </div>
                    <ImageIcon className="h-8 w-8 text-violet-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Ferramentas de IA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/central-ia">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                      <Bot className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Novo
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Central de IAs</h3>
                  <p className="text-sm text-slate-600">ChatGPT, Claude e Gemini em um só lugar</p>
                  <div className="mt-4 flex items-center text-purple-600 group-hover:text-purple-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/noticias-podcasts">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                      <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Novo</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Notícias do Universo IA</h3>
                  <p className="text-sm text-slate-600">Últimas novidades em IA e educação</p>
                  <div className="mt-4 flex items-center text-orange-600 group-hover:text-orange-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/planejamento-aula">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Planos de Aula</h3>
                  <p className="text-sm text-slate-600">Planejamento inteligente com IA</p>
                  <div className="mt-4 flex items-center text-amber-600 group-hover:text-amber-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/gerador-atividades">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl">
                      <FilePlus className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Gerar Atividades</h3>
                  <p className="text-sm text-slate-600">Exercícios personalizados com IA</p>
                  <div className="mt-4 flex items-center text-emerald-600 group-hover:text-emerald-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/imagem-educacional">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Imagens Educacionais</h3>
                  <p className="text-sm text-slate-600">Gere ilustrações para suas aulas</p>
                  <div className="mt-4 flex items-center text-violet-600 group-hover:text-violet-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/materiais-didaticos">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Resumos Didáticos</h3>
                  <p className="text-sm text-slate-600">Crie resumos educativos com IA</p>
                  <div className="mt-4 flex items-center text-indigo-600 group-hover:text-indigo-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/resumos-bncc">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Resumos BNCC</h3>
                  <p className="text-sm text-slate-600">Resumos alinhados à Base Nacional</p>
                  <div className="mt-4 flex items-center text-cyan-600 group-hover:text-cyan-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/analise-documentos">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200">Popular</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Análise de Documentos</h3>
                  <p className="text-sm text-slate-600">Transforme PDFs em material didático</p>
                  <div className="mt-4 flex items-center text-rose-600 group-hover:text-rose-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>


          </div>

          {/* Dicas de IA para Educadores */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Dicas de IA para Educadores
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                <h4 className="font-semibold text-slate-900 mb-2">💡 Dica do Dia</h4>
                <p className="text-sm text-slate-700 mb-3">
                  Use a Central de IAs para comparar diferentes perspectivas sobre um tópico educacional. Cada IA tem seus pontos fortes únicos!
                </p>
                <Link href="/central-ia">
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    Experimentar
                  </Button>
                </Link>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                <h4 className="font-semibold text-slate-900 mb-2">🚀 Recurso em Destaque</h4>
                <p className="text-sm text-slate-700 mb-3">
                  A Análise de Documentos pode transformar qualquer PDF ou Word em material didático estruturado automaticamente.
                </p>
                <Link href="/professor/ferramentas/analise-documentos">
                  <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    Testar Agora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bot, Calendar, PenTool, Newspaper, Search, 
  FileText, Calculator, Send, BarChart3, 
  GraduationCap, Zap, ArrowRight, Bell, Menu, User, LogOut,
  Sparkles, Pencil, Users, BookOpen, Target, Clock, TrendingUp
} from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Buscar dados de tokens
  const { data: tokenData } = useQuery({
    queryKey: ['/api/tokens/status'],
    queryFn: async () => {
      const response = await fetch('/api/tokens/status');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      return response.json();
    },
  });

  const tokenUsagePercentage = tokenData 
    ? Math.round((tokenData.currentUsage / tokenData.monthlyLimit) * 100)
    : 0;

  const mainTools = [
    {
      title: "Central de IA",
      description: "ChatGPT, Claude e outras IAs",
      icon: Bot,
      href: "/central-ia",
      gradient: "from-violet-500 to-purple-600",
      color: "text-violet-600"
    },
    {
      title: "Planejamento",
      description: "Planos de aula inteligentes",
      icon: Calendar,
      href: "/professor/ferramentas/planejamento-aula",
      gradient: "from-emerald-500 to-green-600",
      color: "text-emerald-600"
    },
    {
      title: "Atividades",
      description: "Exercícios personalizados",
      icon: PenTool,
      href: "/professor/ferramentas/gerador-atividades",
      gradient: "from-blue-500 to-cyan-600",
      color: "text-blue-600"
    },
    {
      title: "Documentos",
      description: "Análise de PDFs e textos",
      icon: Search,
      href: "/professor/ferramentas/analisar-documentos",
      gradient: "from-indigo-500 to-purple-600",
      color: "text-indigo-600"
    },
    {
      title: "Redações",
      description: "Correção automática",
      icon: Pencil,
      href: "/professor/redacoes",
      gradient: "from-rose-500 to-pink-600",
      color: "text-rose-600"
    },
    {
      title: "Notícias",
      description: "Conteúdo atualizado",
      icon: Newspaper,
      href: "/professor/noticias-podcasts",
      gradient: "from-amber-500 to-orange-600",
      color: "text-amber-600"
    },
    {
      title: "Calculadora",
      description: "Gestão de notas",
      icon: Calculator,
      href: "/professor/calculadora",
      gradient: "from-violet-500 to-purple-600",
      color: "text-violet-600"
    },
    {
      title: "Relatórios",
      description: "Análise de desempenho",
      icon: BarChart3,
      href: "/professor/analises",
      gradient: "from-orange-500 to-red-600",
      color: "text-orange-600"
    }
  ];

  const quickActions = [
    { title: "Notificações", icon: Bell, href: "/professor/notificacoes", color: "text-blue-600" },
    { title: "Materiais", icon: FileText, href: "/professor/ferramentas/materiais-didaticos", color: "text-green-600" }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        {/* Minimalist Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  IAprender
                </h1>
              </div>

              <div className="flex items-center space-x-3">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button variant="ghost" size="sm" className="hidden md:flex">
                      <action.icon className={`h-4 w-4 ${action.color}`} />
                    </Button>
                  </Link>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-2">
                      <p className="font-medium">{user?.firstName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Import and use the new sidebar */}
        <TeacherSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="p-6 space-y-8 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-3 rounded-full">
              <GraduationCap className="h-6 w-6" />
              <span className="font-semibold">Olá, {user?.firstName}!</span>
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Transforme o ensino com IA</h2>
          </div>

          {/* Token Usage - Minimalist */}
          <Card className="bg-white/60 backdrop-blur-sm border border-slate-200/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-slate-800">Tokens</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">{tokenUsagePercentage}%</span>
              </div>
              <Progress value={tokenUsagePercentage} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{tokenData ? tokenData.currentUsage.toLocaleString() : '0'}</span>
                <span>{tokenData ? tokenData.monthlyLimit.toLocaleString() : '---'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Educational Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student Engagement */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/60 shadow-sm hover:shadow-lg hover:border-blue-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-slate-800">Engajamento</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">87%</div>
                <div className="text-xs text-slate-600 mb-3">Participação média da turma</div>
                {/* Mini chart */}
                <div className="flex items-end space-x-1 h-8">
                  {[65, 78, 82, 87, 85, 89, 87].map((value, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-300 rounded-sm flex-1" 
                      style={{ height: `${(value / 100) * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200/60 shadow-sm hover:shadow-lg hover:border-green-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-slate-800">Progresso</span>
                  </div>
                  <Target className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">73%</div>
                <div className="text-xs text-slate-600 mb-3">Objetivos alcançados</div>
                {/* Progress ring */}
                <div className="relative w-12 h-12 mx-auto">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray="73, 100"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200/60 shadow-sm hover:shadow-lg hover:border-purple-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-slate-800">Esta Semana</span>
                  </div>
                  <Clock className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">12h</div>
                <div className="text-xs text-slate-600 mb-3">Tempo de ensino ativo</div>
                {/* Weekly dots */}
                <div className="flex justify-between items-center">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className={`w-2 h-2 rounded-full mb-1 ${
                          index < 5 ? 'bg-purple-400' : 'bg-slate-200'
                        }`} 
                      />
                      <span className="text-xs text-slate-500">{day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Usage */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-200/60 shadow-sm hover:shadow-lg hover:border-indigo-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium text-slate-800">IA Utilizada</span>
                  </div>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">34</div>
                <div className="text-xs text-slate-600 mb-3">Ferramentas ativadas hoje</div>
                {/* AI tools breakdown */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">ChatGPT</span>
                    <span className="text-slate-800">67%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div className="bg-indigo-500 h-1 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Grid - Clean and Interactive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mainTools.map((tool, index) => (
              <Link key={index} href={tool.href}>
                <Card className="group hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-200/60">
                  <CardContent className="p-4">
                    <div className="text-center space-y-3">
                      <div className={`mx-auto w-12 h-12 bg-gradient-to-r ${tool.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <tool.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">{tool.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed">{tool.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 mx-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>


        </main>
      </div>
    </>
  );
}
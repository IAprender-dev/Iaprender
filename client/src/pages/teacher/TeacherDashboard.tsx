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
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Scroll to top with animation when dashboard loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
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
      gradient: "from-slate-500 to-slate-600",
      color: "text-slate-600"
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

      <div className="min-h-screen bg-slate-50">
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
                <div className="flex items-center space-x-3">
                  <img 
                    src={iAprenderLogo} 
                    alt="IAprender Logo" 
                    className="h-8 w-8 object-contain"
                  />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Link href="/professor/notificacoes">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </Button>
                </Link>
                
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

        <main className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Section - Highlighted */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl border border-violet-300 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Olá, {user?.firstName}!</h1>
                  <p className="text-violet-100">Transforme o ensino com inteligência artificial</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Professor</span>
              </div>
            </div>
          </div>

          {/* Token Usage - Redesigned */}
          <Card className="bg-green-50 border border-green-200/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Tokens Disponíveis</h3>
                    <p className="text-sm text-slate-600">Uso mensal de IA</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-800">{tokenUsagePercentage}%</div>
                  <div className="text-xs text-slate-500">usado</div>
                </div>
              </div>
              <Progress value={tokenUsagePercentage} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-slate-600">
                <span>{tokenData ? tokenData.currentUsage.toLocaleString() : '0'} tokens</span>
                <span>{tokenData ? tokenData.monthlyLimit.toLocaleString() : '---'} limite</span>
              </div>
            </CardContent>
          </Card>

          {/* Educational Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Student Engagement */}
            <Card className="bg-slate-50 border-2 border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-800">Engajamento</span>
                  </div>
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">87%</div>
                <div className="text-xs text-slate-600 mb-3">Participação média da turma</div>
                {/* Mini chart */}
                <div className="flex items-end space-x-1 h-8">
                  {[65, 78, 82, 87, 85, 89, 87].map((value, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-300 rounded-sm flex-1" 
                      style={{ height: `${(value / 100) * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card className="bg-slate-50 border-2 border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-800">Progresso</span>
                  </div>
                  <Target className="h-4 w-4 text-slate-500" />
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
            <Card className="bg-slate-50 border-2 border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-800">Esta Semana</span>
                  </div>
                  <Clock className="h-4 w-4 text-slate-500" />
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">12h</div>
                <div className="text-xs text-slate-600 mb-3">Tempo de ensino ativo</div>
                {/* Weekly dots */}
                <div className="flex justify-between items-center">
                  {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className={`w-2 h-2 rounded-full mb-1 ${
                          index < 5 ? 'bg-slate-400' : 'bg-slate-200'
                        }`} 
                      />
                      <span className="text-xs text-slate-500">{day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Usage */}
            <Card className="bg-slate-50 border-2 border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300/80 transition-all duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-slate-800">IA Utilizada</span>
                  </div>
                  <Zap className="h-4 w-4 text-slate-500" />
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
                    <div className="bg-slate-500 h-1 rounded-full" style={{ width: '67%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tools Grid - Redesigned with solid colors */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ferramentas Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mainTools.map((tool, index) => {
                const bgColors = [
                  'bg-blue-200/90 border-blue-700/70 hover:border-blue-800/80',
                  'bg-green-200/90 border-green-700/70 hover:border-green-800/80', 
                  'bg-red-200/90 border-red-800/70 hover:border-red-900/80',
                  'bg-yellow-200/90 border-yellow-700/70 hover:border-yellow-800/80',
                  'bg-gray-200/90 border-gray-700/70 hover:border-gray-800/80',
                  'bg-amber-200/90 border-amber-800/70 hover:border-amber-900/80',
                  'bg-purple-200/90 border-purple-700/70 hover:border-purple-800/80',
                  'bg-pink-200/90 border-pink-600/70 hover:border-pink-700/80'
                ];
                const iconBgColors = [
                  'bg-blue-300/90',
                  'bg-green-300/90',
                  'bg-red-300/90', 
                  'bg-yellow-300/90',
                  'bg-gray-300/90',
                  'bg-amber-300/90',
                  'bg-purple-300/90',
                  'bg-pink-300/90'
                ];
                const iconColors = [
                  'text-blue-800',
                  'text-green-800',
                  'text-red-900',
                  'text-yellow-800', 
                  'text-gray-800',
                  'text-amber-900',
                  'text-purple-800',
                  'text-pink-700'
                ];
                
                return (
                  <Link key={index} href={tool.href}>
                    <Card className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${bgColors[index % bgColors.length]}`}>
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          <div className={`w-12 h-12 ${iconBgColors[index % iconBgColors.length]} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <tool.icon className={`h-6 w-6 ${iconColors[index % iconColors.length]}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 mb-2">{tool.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-3">{tool.description}</p>
                            <div className="flex items-center text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                              <span>Acessar</span>
                              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>


        </main>
      </div>
    </>
  );
}
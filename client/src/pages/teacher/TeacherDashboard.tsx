import { useState } from "react";
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
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import iaverseLogo from "@/assets/IAverse.png";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(currentDate);

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/teacher/dashboard", icon: LayoutGrid, active: true },
    { name: "Central de IAs", href: "/central-ia", icon: Bot, featured: true },
    { name: "Ferramentas IA", href: "/teacher/tools", icon: Wand2 },
  ];

  // AI Stats
  const aiStats = [
    {
      title: "Tokens Usados",
      value: "12.5K",
      description: "Este mês",
      icon: <Bot className="text-blue-600 h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      trend: "+15%"
    },
    {
      title: "Atividades Geradas",
      value: "47",
      description: "Com IA este mês",
      icon: <FilePlus className="text-purple-600 h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
      trend: "+23"
    },
    {
      title: "Imagens Criadas",
      value: "32",
      description: "Para materiais",
      icon: <ImageIcon className="text-green-600 h-6 w-6" />,
      color: "from-green-500 to-green-600",
      trend: "+8"
    },
    {
      title: "Tempo Economizado",
      value: "18h",
      description: "Na semana",
      icon: <Clock className="text-amber-600 h-6 w-6" />,
      color: "from-amber-500 to-amber-600",
      trend: "+5h"
    }
  ];

  // AI Tools
  const aiTools = [
    {
      title: "Central de IAs",
      description: "ChatGPT, Claude, Gemini em um só lugar",
      icon: <Bot className="h-8 w-8" />,
      color: "from-purple-600 to-blue-600",
      href: "/central-ia",
      badge: "Principal",
      featured: true
    },
    {
      title: "Gerador de Atividades",
      description: "Crie exercícios personalizados com IA",
      icon: <FilePlus className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
      href: "/teacher/tools/generator",
      badge: "Popular"
    },
    {
      title: "Correção Inteligente",
      description: "Correção automatizada de provas",
      icon: <CheckSquare className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
      href: "/teacher/tools/correction",
      badge: "Novo"
    },
    {
      title: "Imagens Educacionais",
      description: "Gere ilustrações para suas aulas",
      icon: <ImageIcon className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      href: "/teacher/tools/images"
    },
    {
      title: "Planejamento de Aula",
      description: "Planos de aula inteligentes",
      icon: <Calendar className="h-6 w-6" />,
      color: "from-amber-500 to-amber-600",
      href: "/teacher/tools/planning"
    },
    {
      title: "Materiais Didáticos",
      description: "Crie materiais educativos com IA",
      icon: <BookOpen className="h-6 w-6" />,
      color: "from-indigo-500 to-indigo-600",
      href: "/teacher/tools/materials"
    }
  ];

  // Recent AI activities
  const recentAIUsage = [
    {
      id: 1,
      tool: "Central de IAs",
      action: "Chat com ChatGPT",
      time: "Há 5 min",
      tokens: 150,
      type: "chat"
    },
    {
      id: 2,
      tool: "Gerador de Atividades",
      action: "Lista de Matemática",
      time: "Há 20 min",
      tokens: 340,
      type: "generation"
    },
    {
      id: 3,
      tool: "Imagens Educacionais",
      action: "Diagrama de Física",
      time: "Há 1h",
      tokens: 0,
      type: "image"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-200/50">
              <div className="relative">
                <img src={iaverseLogo} alt="IAverse" className="w-10 h-10 rounded-xl shadow-lg" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IAverse
                </h1>
                <p className="text-xs text-slate-500 font-medium">Portal do Professor</p>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4 py-6">
              <div className="space-y-2">
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Link key={index} href={item.href}>
                      <Button
                        variant={item.active ? "secondary" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 font-medium transition-all duration-200 ${
                          item.active 
                            ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-sm hover:shadow-md" 
                            : item.featured
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                            : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {item.featured && (
                          <Sparkles className="h-4 w-4 ml-auto" />
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>

            {/* User Profile */}
            <div className="p-6 border-t border-slate-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">Professor</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="w-full gap-2 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-72">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden text-slate-600 hover:text-blue-600"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Olá, Prof. {user?.firstName}!
                  </h1>
                  <p className="text-sm text-slate-600 capitalize">
                    {formattedDate}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden md:inline">Notificações</span>
                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">3</Badge>
                </Button>
                <Link href="/central-ia">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Bot className="h-4 w-4 mr-2" />
                    Central de IAs
                  </Button>
                </Link>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="p-6 space-y-8">
            {/* Hero Section - Central de IAs */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="relative p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold mb-1">Central de IAs</h2>
                        <p className="text-white/80 text-lg">Sua porta de entrada para todas as inteligências artificiais</p>
                      </div>
                    </div>
                    <p className="text-white/90 mb-6 max-w-2xl">
                      Acesse ChatGPT, Claude, Gemini e mais ferramentas de IA em uma interface unificada. 
                      Otimize seu tempo e crie conteúdos educacionais incríveis.
                    </p>
                    <div className="flex gap-4">
                      <Link href="/central-ia">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 shadow-xl gap-3 font-semibold">
                          <Sparkles className="h-5 w-5" />
                          Acessar Central de IAs
                        </Button>
                      </Link>
                      <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Ver Tutorial
                      </Button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                      <Bot className="h-16 w-16 text-white/80" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Suas Métricas de IA</h2>
                <p className="text-sm text-slate-600">Acompanhe seu uso das ferramentas de inteligência artificial</p>
              </div>
            </div>

            {/* AI Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiStats.map((stat, index) => (
                <Card key={index} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                        {stat.icon}
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Tools Section */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">Ferramentas de IA</CardTitle>
                      <p className="text-sm text-slate-600">Potencialize suas aulas com inteligência artificial</p>
                    </div>
                  </div>
                  <Link href="/teacher/tools">
                    <Button variant="outline" size="sm" className="gap-2">
                      Ver todas
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiTools.map((tool, index) => (
                    <Link key={index} href={tool.href}>
                      <div className={`group relative p-6 rounded-2xl border border-slate-200/50 hover:border-blue-200/50 hover:bg-blue-50/30 transition-all cursor-pointer ${
                        tool.featured ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200/50 shadow-lg' : ''
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} opacity-15 group-hover:opacity-25 transition-opacity`}>
                            {tool.icon}
                          </div>
                          {tool.badge && (
                            <Badge 
                              variant={tool.featured ? "default" : "secondary"} 
                              className={`text-xs ${tool.featured ? 'bg-purple-600 text-white' : ''}`}
                            >
                              {tool.badge}
                            </Badge>
                          )}
                        </div>
                        <h4 className={`font-bold mb-2 ${tool.featured ? 'text-lg text-purple-700' : 'text-slate-900'}`}>
                          {tool.title}
                        </h4>
                        <p className="text-sm text-slate-600">{tool.description}</p>
                        {tool.featured && (
                          <div className="mt-4 flex items-center gap-2 text-purple-600 font-medium text-sm">
                            <Sparkles className="h-4 w-4" />
                            <span>Ferramenta Principal</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent AI Usage */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">Atividade Recente de IA</CardTitle>
                    <Link href="/central-ia">
                      <Button variant="outline" size="sm" className="gap-2">
                        Ver histórico
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAIUsage.map((usage) => (
                    <div key={usage.id} className="p-4 rounded-xl border border-slate-200/50 hover:border-blue-200/50 hover:bg-blue-50/30 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            usage.type === 'chat' ? 'bg-blue-100' :
                            usage.type === 'generation' ? 'bg-purple-100' : 'bg-green-100'
                          }`}>
                            {usage.type === 'chat' ? <Bot className="h-4 w-4 text-blue-600" /> :
                             usage.type === 'generation' ? <FilePlus className="h-4 w-4 text-purple-600" /> :
                             <ImageIcon className="h-4 w-4 text-green-600" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{usage.tool}</h4>
                            <p className="text-sm text-slate-600">{usage.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">{usage.time}</p>
                          {usage.tokens > 0 && (
                            <p className="text-xs text-slate-400">{usage.tokens} tokens</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* AI Tips & Quick Actions */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-900">Dicas e Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-slate-900">Dica do Dia</h4>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">
                      Use a Central de IAs para comparar respostas de diferentes modelos (ChatGPT, Claude, Gemini) 
                      e obter perspectivas variadas para seus materiais educacionais.
                    </p>
                    <Link href="/central-ia">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Experimentar Agora
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Ações Rápidas</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/teacher/tools/generator">
                        <Button variant="outline" size="sm" className="w-full gap-2 h-auto p-3 flex-col">
                          <FilePlus className="h-4 w-4" />
                          <span className="text-xs">Gerar Atividade</span>
                        </Button>
                      </Link>
                      <Link href="/teacher/tools/images">
                        <Button variant="outline" size="sm" className="w-full gap-2 h-auto p-3 flex-col">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-xs">Criar Imagem</span>
                        </Button>
                      </Link>
                      <Link href="/teacher/tools/planning">
                        <Button variant="outline" size="sm" className="w-full gap-2 h-auto p-3 flex-col">
                          <Calendar className="h-4 w-4" />
                          <span className="text-xs">Planejar Aula</span>
                        </Button>
                      </Link>
                      <Link href="/teacher/tools/correction">
                        <Button variant="outline" size="sm" className="w-full gap-2 h-auto p-3 flex-col">
                          <CheckSquare className="h-4 w-4" />
                          <span className="text-xs">Corrigir Prova</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}
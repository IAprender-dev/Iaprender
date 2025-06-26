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
  Sparkles, Pencil
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">24</div>
                <div className="text-xs opacity-90">Aulas criadas</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">156</div>
                <div className="text-xs opacity-90">Atividades</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">89</div>
                <div className="text-xs opacity-90">Documentos</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">42</div>
                <div className="text-xs opacity-90">Redações</div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { 
  CheckSquare, 
  Bot, 
  GraduationCap,
  Calendar,
  ArrowRight,
  Sparkles,
  Target,
  Menu,
  User,
  LogOut,
  Languages,
  Mic,
  Zap,
  BarChart3,
  Network,
  Bell,
  Clock,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import iaprenderLogo from "@assets/IAprender_1750262377399.png";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  
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
      title: "Quiz Interativo",
      description: "Teste seus conhecimentos",
      icon: CheckSquare,
      href: "/student/quiz",
      gradient: "from-emerald-500 to-teal-600",
      color: "text-emerald-600"
    },
    {
      title: "Mapas Mentais",
      description: "Organize suas ideias",
      icon: Network,
      href: "/student/mind-map",
      gradient: "from-purple-500 to-violet-600",
      color: "text-purple-600"
    },
    {
      title: "Tutor IA",
      description: "Aprenda com inteligência artificial",
      icon: Bot,
      href: "/student/ai-tutor",
      gradient: "from-blue-500 to-indigo-600",
      color: "text-blue-600"
    },
    {
      title: "ProVersa",
      description: "Converse por voz com IA",
      icon: Mic,
      href: "/student/voice-tutor",
      gradient: "from-indigo-500 to-purple-600",
      color: "text-indigo-600"
    },
    {
      title: "Planejamento",
      description: "Organize seus estudos",
      icon: Calendar,
      href: "/student/study-planning",
      gradient: "from-amber-500 to-orange-600",
      color: "text-amber-600"
    },
    {
      title: "Tradutor",
      description: "Traduza textos e idiomas",
      icon: Languages,
      href: "/student/translator",
      gradient: "from-cyan-500 to-blue-600",
      color: "text-cyan-600"
    }
  ];

  const quickActions = [
    { title: "Notificações", icon: Bell, href: "/student/notifications", color: "text-orange-600" },
    { title: "Progresso", icon: BarChart3, href: "/student/progress", color: "text-purple-600" }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Estudante | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Minimalist Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={iaprenderLogo} 
                    alt="IAprender Logo" 
                    className="h-8 w-8 object-contain"
                  />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Link href="/student/notifications">
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <Bell className="h-4 w-4 text-orange-600" />
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
                      <p className="text-xs text-blue-600">{user?.schoolYear || "Estudante"}</p>
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

        <main className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl border border-blue-300 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Olá, {user?.firstName}!</h1>
                  <p className="text-blue-100">Vamos aprender juntos hoje</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Estudante</span>
              </div>
            </div>
          </div>

          {/* Token Usage Card */}
          {tokenData && (
            <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Tokens IA Disponíveis</h3>
                      <p className="text-green-100">
                        {tokenData.currentUsage.toLocaleString()} / {tokenData.monthlyLimit.toLocaleString()} tokens utilizados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{tokenUsagePercentage}%</div>
                    <div className="text-green-100 text-sm">este mês</div>
                  </div>
                </div>
                <Progress 
                  value={tokenUsagePercentage} 
                  className="h-3 bg-white/20"
                />
              </CardContent>
            </Card>
          )}

          {/* Learning Insights */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Insights de Aprendizado</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Metas Semanais</p>
                      <p className="text-lg font-bold text-blue-800">8/10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600">Tempo de Estudo</p>
                      <p className="text-lg font-bold text-emerald-800">2h 30m</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">Progresso</p>
                      <p className="text-lg font-bold text-purple-800">+15%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600">Conquistas</p>
                      <p className="text-lg font-bold text-amber-800">12</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Tools Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Ferramentas de Aprendizado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainTools.map((tool, index) => (
                <Link key={index} href={tool.href}>
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`bg-gradient-to-br ${tool.gradient} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                          <tool.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 group-hover:text-slate-900 mb-1">{tool.title}</h3>
                          <p className="text-sm text-slate-600">{tool.description}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 bg-white border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">{action.title}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
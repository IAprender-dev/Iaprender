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

  // Recent courses
  const recentCourses = [
    {
      id: 1,
      title: "Matemática 9º Ano",
      students: 32,
      progress: 78,
      nextClass: "Hoje, 14:00",
      subject: "Equações do 2º grau"
    },
    {
      id: 2,
      title: "Física 2º Ano",
      students: 28,
      progress: 65,
      nextClass: "Amanhã, 10:00",
      subject: "Cinemática"
    },
    {
      id: 3,
      title: "Química 1º Ano",
      students: 35,
      progress: 45,
      nextClass: "Qua, 08:00",
      subject: "Tabela Periódica"
    }
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      title: "Prova - Equações Quadráticas",
      course: "Matemática 9º Ano",
      submissions: 28,
      total: 32,
      dueDate: "Hoje",
      status: "pending"
    },
    {
      id: 2,
      title: "Lista de Exercícios - Cinemática",
      course: "Física 2º Ano",
      submissions: 25,
      total: 28,
      dueDate: "Ontem",
      status: "late"
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
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Resumo de Hoje</h2>
                <p className="text-sm text-slate-600">Gerencie suas aulas e atividades</p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                <Plus className="h-4 w-4" />
                Criar Curso
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {aiTools.map((tool, index) => (
                    <Link key={index} href={tool.href}>
                      <div className="group p-4 rounded-xl border border-slate-200/50 hover:border-blue-200/50 hover:bg-blue-50/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                            {tool.icon}
                          </div>
                          {tool.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {tool.badge}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-slate-900 mb-1">{tool.title}</h4>
                        <p className="text-xs text-slate-600">{tool.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Courses */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">Próximas Aulas</CardTitle>
                    <Link href="/teacher/courses">
                      <Button variant="outline" size="sm" className="gap-2">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentCourses.map((course) => (
                    <div key={course.id} className="p-4 rounded-xl border border-slate-200/50 hover:border-blue-200/50 hover:bg-blue-50/30 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{course.title}</h4>
                          <p className="text-sm text-slate-600">{course.students} alunos</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{course.nextClass}</p>
                          <p className="text-xs text-slate-500">{course.subject}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Progresso do curso</span>
                          <span className="font-medium text-slate-900">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">Atividades Pendentes</CardTitle>
                    <Link href="/teacher/activities">
                      <Button variant="outline" size="sm" className="gap-2">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="p-4 rounded-xl border border-slate-200/50 hover:border-blue-200/50 hover:bg-blue-50/30 transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{activity.title}</h4>
                        <Badge 
                          variant={activity.status === 'pending' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {activity.status === 'pending' ? 'Pendente' : 'Atrasado'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{activity.course}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {activity.submissions}/{activity.total} entregas
                        </span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>{activity.dueDate}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(activity.submissions / activity.total) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  ))}
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
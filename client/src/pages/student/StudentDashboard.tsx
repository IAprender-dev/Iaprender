import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { KidsLayout } from "@/components/dashboard/student/KidsLayout";
import { 
  Book, 
  CheckSquare, 
  Medal, 
  Bot, 
  Bookmark, 
  Activity, 
  LayoutGrid, 
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  PlayCircle,
  Menu,
  X,
  Home,
  User,
  LogOut,
  Plus,
  Languages,
  Mic,
  Zap,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  PenTool,
  FileText,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import iaprenderLogo from "@assets/IAprender_1750262542315.png";
import TodayStudySchedule from "@/components/TodayStudySchedule";

interface StudySession {
  id: number;
  subject: string;
  startTime: Date;
  endTime: Date;
  time: string;
  isCompleted: boolean;
  pomodoroCount: number;
  dayOfWeek: string;
}

interface StudyPlan {
  id: number;
  name: string;
  schoolYear: string;
  sessions: StudySession[];
  createdAt: Date;
  isActive: boolean;
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

// Helper function to check if user is in grades 1-3
const isElementaryGrades123 = (schoolYear: string) => {
  return schoolYear?.includes('1º ano fundamental') || 
         schoolYear?.includes('2º ano fundamental') || 
         schoolYear?.includes('3º ano fundamental');
};

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);

  // Buscar dados de consumo de tokens
  const { data: tokenData, isLoading: isTokenLoading } = useQuery<TokenUsageData>({
    queryKey: ['/api/tokens/status'],
    enabled: !!user,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
  
  // Carregar plano de estudos do localStorage
  useEffect(() => {
    const loadStudyPlan = () => {
      const savedPlan = localStorage.getItem('iaulaStudyPlan');
      if (savedPlan) {
        try {
          const plan = JSON.parse(savedPlan);
          // Converter strings de data de volta para objetos Date
          plan.createdAt = new Date(plan.createdAt);
          if (plan.sessions) {
            plan.sessions = plan.sessions.map((session: any) => ({
              ...session,
              startTime: new Date(session.startTime),
              endTime: new Date(session.endTime)
            }));
          }
          setStudyPlan(plan);
        } catch (error) {
          console.error('Erro ao carregar plano de estudos:', error);
          localStorage.removeItem('iaulaStudyPlan');
        }
      }
    };

    loadStudyPlan();
    
    // Listen for storage changes (when plan is created in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'iaulaStudyPlan') {
        loadStudyPlan();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStudyPlan();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location]);

  const getTodaySessions = () => {
    if (!studyPlan) return [];
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return studyPlan.sessions.filter(session => 
      session.startTime >= startOfDay && session.startTime <= endOfDay
    );
  };

  const getWeekProgress = () => {
    if (!studyPlan) return { completed: 0, total: 0, percentage: 0 };
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const weekSessions = studyPlan.sessions.filter(session => 
      session.startTime >= startOfWeek && session.startTime <= endOfWeek
    );
    
    const completed = weekSessions.filter(s => s.isCompleted).length;
    const total = weekSessions.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };
  
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(currentDate);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const menuItems = [
    { icon: Bot, label: "Central de Inteligências", href: "/central-ia", isActive: location === "/central-ia" },
    { icon: CheckSquare, label: "Quiz Educativo", href: "/student/quiz", isActive: location === "/student/quiz" },
    { icon: MessageSquare, label: "Tutor por Texto", href: "/aluno/tutor-ia", isActive: location === "/aluno/tutor-ia" },
    { icon: Mic, label: "Tutor por Voz", href: "/aluno/tutor-voz", isActive: location === "/aluno/tutor-voz" },
    { icon: Languages, label: "Tradutor Escolar", href: "/student/translator", isActive: location === "/student/translator" },
    { icon: BookOpen, label: "Cursos", href: "/student/courses", isActive: location === "/student/courses" },
    { icon: Calendar, label: "Planejamento", href: "/aluno/planejamento", isActive: location === "/aluno/planejamento" },
    { icon: BookOpen, label: "Wikipedia", href: "/student/wikipedia", isActive: location === "/student/wikipedia" },
    { icon: User, label: "Meu Perfil", href: "/student/profile", isActive: location === "/student/profile" },
  ];

  // Check if user is in elementary grades 1-3 for special layout
  const isKidsLayout = user?.schoolYear && isElementaryGrades123(user.schoolYear);

  // If kids layout, return the special interface
  if (isKidsLayout) {
    return (
      <>
        <Helmet>
          <title>Meu Cantinho de Aprender - IAprender</title>
        </Helmet>
        <KidsLayout userName={user?.firstName || 'pequeno estudante'}>
          {/* Additional kid-specific content can go here */}
        </KidsLayout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard do Aluno - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-blue-100 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src={iaprenderLogo} alt="IAprender" className="h-8 w-8" />
            <span className="font-bold text-slate-800">IAprender</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className={`
            fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-sm border-r border-blue-100
            transform transition-transform duration-300 ease-in-out lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="h-full flex flex-col">
              {/* Logo */}
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <img src={iaprenderLogo} alt="IAprender" className="h-8 w-8" />
                  <div>
                    <h1 className="font-bold text-slate-800">IAprender</h1>
                    <p className="text-xs text-slate-600">Portal do Aluno</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{user?.username}</p>
                    <p className="text-sm text-slate-600">Aluno</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <ScrollArea className="flex-1 px-4 py-6">
                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={item.isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 ${
                          item.isActive 
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm" 
                            : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  
                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 mt-4 border-t border-slate-200 pt-4"
                    onClick={() => {
                      logout();
                      setLocation("/");
                      setIsSidebarOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </Button>
                </nav>
              </ScrollArea>

              {/* Logout */}
              <div className="p-4 border-t border-blue-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-700 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    logout();
                    setLocation("/");
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              </div>

              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 lg:ml-0 min-h-screen">
            <div className="p-6 lg:p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent mb-2">
                  Bem-vindo de volta, {user?.username}!
                </h1>
                <p className="text-slate-700 capitalize">{formattedDate}</p>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-bold px-2 py-1 text-xs">
                          Central IA
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-white">Central de IAs</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          ChatGPT, Claude e Gemini unificados
                        </p>
                        <div className="flex items-center text-white/80 font-medium text-sm pt-2">
                          <span>Acessar</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/student/quiz">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <CheckSquare className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-0 font-bold px-2 py-1 text-xs">
                          <Target className="h-3 w-3 mr-1" />
                          Quiz
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-white">Quiz Educativo</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          Responda perguntas geradas por IA
                        </p>
                        <div className="flex items-center text-white/80 font-medium text-sm pt-2">
                          <span>Começar</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/aluno/tutor-ia">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white border-0 font-bold px-2 py-1 text-xs">
                          Tutor
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-white">Tutor Chat IA</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          Converse por texto com sua tutora
                        </p>
                        <div className="flex items-center text-white/80 font-medium text-sm pt-2">
                          <span>Conversar</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/aluno/tutor-voz">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Mic className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-pink-400 to-purple-500 text-white border-0 font-bold px-2 py-1 text-xs">
                          NOVO
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-white">ProVersa</h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          Converse por voz com tutora virtual
                        </p>
                        <div className="flex items-center text-white/80 font-medium text-sm pt-2">
                          <span>Falar</span>
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick Navigation & Study Tools */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Access to Tools */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Lightbulb className="h-6 w-6 text-white" />
                      </div>
                      Ferramentas de Estudo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/student/translator">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Languages className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Tradutor</p>
                            <p className="text-sm text-slate-600">Tradução educacional</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>





                    <Link href="/student/wikipedia">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                            <Book className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Wikipedia</p>
                            <p className="text-sm text-slate-600">Explorar conhecimento</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Study Insights */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      Meus Estudos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Progresso Semanal</span>
                        <span className="text-lg font-bold text-green-800">
                          {getWeekProgress().percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-green-600">
                        {getWeekProgress().completed} de {getWeekProgress().total} sessões completas
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Sessões Hoje</span>
                        <span className="text-lg font-bold text-purple-800">
                          {getTodaySessions().length}
                        </span>
                      </div>
                      <p className="text-xs text-purple-600">
                        {getTodaySessions().filter(s => s.isCompleted).length} sessões concluídas
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Próxima Sessão</span>
                        <span className="text-lg font-bold text-blue-800">
                          {getTodaySessions().find(s => !s.isCompleted)?.subject || 'Livre'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        {getTodaySessions().find(s => !s.isCompleted)?.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || 'Nenhuma agendada'}
                      </p>
                    </div>

                    {/* Study Plan Action */}
                    <div className="pt-4 border-t border-slate-200">
                      <Link href="/aluno/gerador-plano">
                        <Button className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm">
                          <Target className="h-4 w-4" />
                          Gerar Plano de Estudos
                        </Button>
                      </Link>
                      <p className="text-xs text-slate-500 text-center mt-2">
                        Crie um plano personalizado com IA
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
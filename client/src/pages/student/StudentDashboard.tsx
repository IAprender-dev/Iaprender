import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
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
  Mic
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";
import TodayStudySchedule from "@/components/TodayStudySchedule";

interface StudySession {
  id: number;
  subject: string;
  startTime: Date;
  endTime: Date;
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

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  
  // Carregar plano de estudos do localStorage
  useEffect(() => {
    const savedPlan = localStorage.getItem('iaulaStudyPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        // Converter strings de data de volta para objetos Date
        plan.createdAt = new Date(plan.createdAt);
        plan.sessions = plan.sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime)
        }));
        setStudyPlan(plan);
      } catch (error) {
        console.error('Erro ao carregar plano de estudos:', error);
        localStorage.removeItem('iaulaStudyPlan');
      }
    }
  }, []);

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
    { icon: Home, label: "Dashboard", href: "/student/dashboard", isActive: location === "/student/dashboard" },
    { icon: BookOpen, label: "Cursos", href: "/student/courses", isActive: location === "/student/courses" },
    { icon: CheckSquare, label: "Atividades", href: "/student/activities", isActive: location === "/student/activities" },
    { icon: Calendar, label: "Planejamento", href: "/aluno/planejamento", isActive: location === "/aluno/planejamento" },
    { icon: Book, label: "Wikipedia", href: "/student/wikipedia", isActive: location === "/student/wikipedia" },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Aluno - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/90 backdrop-blur-sm border-b border-blue-100 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src={aiverseLogo} alt="AIverse" className="h-8 w-8" />
            <span className="font-bold text-slate-800">AIverse</span>
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
                  <img src={aiverseLogo} alt="AIverse" className="h-8 w-8" />
                  <div>
                    <h1 className="font-bold text-slate-800">AIverse</h1>
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
                </nav>
              </ScrollArea>

              {/* Logout */}
              <div className="p-4 border-t border-blue-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-700 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
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

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Cursos Ativos</p>
                        <p className="text-3xl font-bold">3</p>
                      </div>
                      <BookOpen className="h-10 w-10 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Atividades Concluídas</p>
                        <p className="text-3xl font-bold">12</p>
                      </div>
                      <CheckSquare className="h-10 w-10 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Certificados</p>
                        <p className="text-3xl font-bold">2</p>
                      </div>
                      <Award className="h-10 w-10 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Horas de Estudo</p>
                        <p className="text-3xl font-bold">45h</p>
                      </div>
                      <Clock className="h-10 w-10 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Translator Card */}
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm shadow-lg rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                            <Languages className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Tradutor Educacional</h3>
                            <p className="text-sm text-slate-600">Traduza textos e materiais educacionais</p>
                          </div>
                        </div>
                        <p className="text-slate-600 mb-4">
                          Acesse nossa ferramenta de tradução completa com suporte a múltiplos idiomas
                        </p>
                        <Link href="/student/translator">
                          <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                            Abrir Tradutor
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="md:w-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-r-2xl flex items-center justify-center p-4">
                        <Languages className="h-16 w-16 text-blue-500/50" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activities Card */}
                <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm shadow-lg rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                            <CheckSquare className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Exercícios Inteligentes</h3>
                            <p className="text-sm text-slate-600">Questões e Respostas Geradas por IA</p>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-4 leading-relaxed">
                          Estude praticando com a IA e fique entre os melhores do Ranking!
                        </p>
                        <Link href="/student/activities">
                          <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm">
                            <CheckSquare className="h-4 w-4" />
                            Fazer Exercícios
                          </Button>
                        </Link>
                      </div>
                      <div className="hidden md:block p-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200">
                          <div className="text-6xl">✅</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Tutor Chat */}
                <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-sm shadow-lg rounded-2xl">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Tutor IA por Texto</h3>
                            <p className="text-sm text-slate-600">Tutoria personalizada com IA</p>
                          </div>
                        </div>
                        <p className="text-slate-700 mb-4 leading-relaxed">
                          Converse com nossa IA especializada em ensino e tire todas as suas dúvidas sobre as matérias do seu ano escolar!
                        </p>
                        <Link href="/aluno/tutor-ia">
                          <Button className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-sm">
                            <Bot className="h-4 w-4" />
                            Conversar por Texto
                          </Button>
                        </Link>
                      </div>
                      <div className="hidden md:block p-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-purple-200">
                          <div className="text-6xl">💬</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice AI Tutor Chat */}
                <Card className="border-0 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 backdrop-blur-sm shadow-lg rounded-2xl border border-pink-100">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-xl">
                            <GraduationCap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">Pro Versa</h3>
                            <p className="text-sm text-slate-600">Sua tutora baseada em IA</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">NOVO</Badge>
                        </div>
                        <p className="text-slate-700 mb-4 leading-relaxed">
                          Conheça a Pro Versa, sua tutora virtual que ensina qualquer matéria do seu ano escolar. Fale naturalmente e aprenda no seu ritmo!
                        </p>
                        <Link href="/aluno/tutor-voz">
                          <Button className="gap-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white shadow-sm">
                            <Mic className="h-4 w-4" />
                            Conversar com Pro Versa
                          </Button>
                        </Link>
                      </div>
                      <div className="hidden md:block p-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-pink-200 relative">
                          <div className="text-6xl">👩‍🏫</div>
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Mic className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Wikipedia Explorer */}
              <Card className="border-0 bg-gradient-to-br from-orange-50 to-yellow-50 backdrop-blur-sm shadow-lg rounded-2xl mb-8">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl">
                          <Book className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-800">Explorador Wikipedia</h3>
                          <p className="text-sm text-slate-600">Acesso ao conhecimento mundial</p>
                        </div>
                      </div>
                      <p className="text-slate-700 mb-4 leading-relaxed">
                        Pesquise milhões de artigos da Wikipedia e expanda seus conhecimentos sobre qualquer assunto educacional!
                      </p>
                      <Link href="/student/wikipedia">
                        <Button className="gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-sm">
                          <Book className="h-4 w-4" />
                          Explorar Wikipedia
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden md:block p-6">
                      <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center border border-orange-200">
                        <div className="text-6xl">📚</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Study Planning Section */}
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">Planejamento de Estudos</CardTitle>
                        <p className="text-sm text-slate-600">Organize seus estudos da semana</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/aluno/gerador-plano">
                        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                          <Target className="h-4 w-4" />
                          Novo Plano
                        </Button>
                      </Link>
                      <Link href="/aluno/planejamento">
                        <Button variant="outline" className="gap-2">
                          <Calendar className="h-4 w-4" />
                          Ver Planos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {studyPlan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800">{studyPlan.name}</h3>
                          <p className="text-sm text-slate-600">
                            Criado em {studyPlan.createdAt.toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-blue-500 text-white">Ativo</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 bg-blue-50 border-blue-200">
                          <h4 className="font-semibold text-blue-800 mb-2">Progresso da Semana</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Concluídas:</span>
                              <span>{getWeekProgress().completed} / {getWeekProgress().total}</span>
                            </div>
                            <Progress value={getWeekProgress().percentage} className="h-2" />
                            <p className="text-xs text-blue-700">{getWeekProgress().percentage}% completo</p>
                          </div>
                        </Card>
                        
                        <Card className="p-4 bg-green-50 border-green-200">
                          <h4 className="font-semibold text-green-800 mb-2">Sessões de Hoje</h4>
                          <div className="space-y-2">
                            {getTodaySessions().length > 0 ? (
                              getTodaySessions().slice(0, 2).map(session => (
                                <div key={session.id} className="text-sm">
                                  <div className="font-medium text-green-800">{session.subject}</div>
                                  <div className="text-green-600">
                                    {session.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                                    {session.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-green-600">Nenhuma sessão programada para hoje</p>
                            )}
                          </div>
                        </Card>
                      </div>
                      
                      <div className="flex gap-3">
                        <Link href="/aluno/planejamento">
                          <Button className="gap-2" size="sm">
                            <Calendar className="h-4 w-4" />
                            Ver Cronograma Completo
                          </Button>
                        </Link>
                        <Link href="/aluno/planejamento">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Target className="h-4 w-4" />
                            Editar Plano
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-slate-700 mb-2">Nenhum plano ativo</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Crie seu plano de estudos personalizado baseado na BNCC
                      </p>
                      <Link href="/aluno/planejamento">
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Criar Plano de Estudos
                        </Button>
                      </Link>
                    </div>
                  )}
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
import { useState } from "react";
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
  LogOut
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import iaverseLogo from "@/assets/IAverse.png";

export default function StudentDashboard() {
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
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutGrid, active: true },
    { name: "Meus Cursos", href: "/student/courses", icon: BookOpen },
    { name: "Atividades", href: "/student/activities", icon: CheckSquare },
    { name: "Certificados", href: "/student/certificates", icon: Award },
    { name: "Wikipedia", href: "/student/wikipedia", icon: Book },
    { name: "Central de IAs", href: "/central-ia", icon: Bot },
  ];

  // Progress summary stats
  const progressStats = [
    {
      title: "Cursos Ativos",
      value: "3",
      description: "Em andamento",
      icon: <BookOpen className="text-blue-600 h-6 w-6" />,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Tarefas Pendentes",
      value: "2",
      description: "Para entregar",
      icon: <CheckSquare className="text-amber-600 h-6 w-6" />,
      color: "from-amber-500 to-amber-600"
    },
    {
      title: "Certificados",
      value: "5",
      description: "Conquistados",
      icon: <Award className="text-green-600 h-6 w-6" />,
      color: "from-green-500 to-green-600"
    }
  ];

  // Recent courses
  const recentCourses = [
    {
      id: 1,
      title: "Matemática Avançada",
      progress: 75,
      totalLessons: 24,
      completedLessons: 18,
      category: "Matemática",
      instructor: "Prof. Silva"
    },
    {
      id: 2,
      title: "História do Brasil",
      progress: 45,
      totalLessons: 16,
      completedLessons: 7,
      category: "História",
      instructor: "Prof. Santos"
    },
    {
      id: 3,
      title: "Ciências Naturais",
      progress: 90,
      totalLessons: 20,
      completedLessons: 18,
      category: "Ciências",
      instructor: "Prof. Costa"
    }
  ];

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      title: "Resolução de Equações",
      subject: "Matemática",
      dueDate: "2024-01-15",
      status: "pending",
      priority: "high"
    },
    {
      id: 2,
      title: "Ensaio sobre Período Colonial",
      subject: "História",
      dueDate: "2024-01-18",
      status: "in_progress",
      priority: "medium"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Aluno - IAverse</title>
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
                <p className="text-xs text-slate-500 font-medium">Portal do Aluno</p>
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
                            : "text-slate-600 hover:text-blue-600 hover:bg-blue-50/50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
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
                  <p className="text-xs text-slate-500 truncate">Aluno</p>
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
                    Bem-vindo, {user?.firstName}!
                  </h1>
                  <p className="text-sm text-slate-600 capitalize">
                    {formattedDate}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {progressStats.map((stat, index) => (
                <Card key={index} className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl hover:scale-105">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                  <CardContent className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}>
                        {stat.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Wikipedia Explorer Card */}
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden border border-blue-100">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-sm">
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
                      <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm">
                        <Book className="h-4 w-4" />
                        Explorar Wikipedia
                      </Button>
                    </Link>
                  </div>
                  <div className="hidden md:block p-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200">
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
                  <Link href="/aluno/planejamento">
                    <Button className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                      <Target className="h-4 w-4" />
                      Criar Plano
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => {
                    const today = new Date();
                    const weekDay = new Date(today);
                    weekDay.setDate(today.getDate() - today.getDay() + index + 1);
                    const isToday = weekDay.toDateString() === today.toDateString();
                    
                    return (
                      <div key={index} className={`p-3 rounded-xl border transition-all ${
                        isToday 
                          ? 'border-purple-200 bg-gradient-to-br from-purple-100 to-blue-100' 
                          : 'border-slate-200 bg-white/50'
                      }`}>
                        <div className="text-center">
                          <p className={`text-xs font-medium ${isToday ? 'text-purple-700' : 'text-slate-600'}`}>
                            {day}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? 'text-purple-900' : 'text-slate-900'}`}>
                            {weekDay.getDate()}
                          </p>
                          <div className="mt-2 space-y-1">
                            {index < 5 && (
                              <div className={`text-xs p-1 rounded ${
                                isToday 
                                  ? 'bg-purple-200 text-purple-800' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                19:00-21:00
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-white/60 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Progresso da semana</span>
                    <span className="font-medium text-slate-900">3/5 sessões</span>
                  </div>
                  <Progress value={60} className="h-2 mt-2" />
                </div>
              </CardContent>
            </Card>


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
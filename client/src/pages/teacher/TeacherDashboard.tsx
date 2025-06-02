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
  GraduationCap
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
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [recentAIUsage, setRecentAIUsage] = useState<any[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(currentDate);

  // Fetch real dashboard metrics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingMetrics(true);
        
        // Fetch metrics
        const metricsResponse = await fetch('/api/dashboard/teacher-metrics');
        if (metricsResponse.ok) {
          const metrics = await metricsResponse.json();
          setDashboardMetrics(metrics);
        }

        // Fetch recent AI usage
        const usageResponse = await fetch('/api/dashboard/recent-ai-usage');
        if (usageResponse.ok) {
          const usage = await usageResponse.json();
          setRecentAIUsage(usage);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Navigation items
  const navigationItems = [
    { name: "Dashboard", href: "/professor/dashboard", icon: LayoutGrid, active: true },
    { name: "Central de IAs", href: "/central-ia", icon: Bot, featured: true },
    { name: "Ferramentas IA", href: "/professor/ferramentas", icon: Wand2 },
  ];

  // Removed AI Stats section as requested

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
      href: "/professor/ferramentas/gerador-atividades",
      badge: "Popular"
    },

    {
      title: "Imagens Educacionais",
      description: "Gere ilustrações para suas aulas",
      icon: <ImageIcon className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
      href: "/professor/ferramentas/imagem-educacional"
    },
    {
      title: "Planejamento de Aula",
      description: "Planos de aula inteligentes",
      icon: <Calendar className="h-6 w-6" />,
      color: "from-amber-500 to-amber-600",
      href: "/professor/ferramentas/planejamento-aula"
    },
    {
      title: "Resumos Didáticos",
      description: "Crie resumos educativos com IA",
      icon: <BookOpen className="h-6 w-6" />,
      color: "from-indigo-500 to-indigo-600",
      href: "/professor/ferramentas/materiais-didaticos"
    },
    {
      title: "Resumos BNCC",
      description: "Resumos alinhados à Base Nacional Comum Curricular",
      icon: <GraduationCap className="h-6 w-6" />,
      color: "from-emerald-500 to-emerald-600",
      href: "/professor/ferramentas/resumos-bncc"
    },
    {
      title: "Análise de Documentos",
      description: "Transforme qualquer documento em material didático estruturado",
      icon: <FileText className="h-6 w-6" />,
      color: "from-rose-500 to-rose-600",
      href: "/professor/ferramentas/analise-documentos"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200/50">
              <div className="flex items-center gap-3">
                <img src={iaverseLogo} alt="IAverse" className="h-10 w-10 rounded-xl" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    IAverse
                  </h1>
                  <p className="text-sm text-slate-500">Professor</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2">
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}>
                    <item.icon className={`h-5 w-5 ${item.featured ? 'text-purple-400' : ''}`} />
                    <span className="font-medium">{item.name}</span>
                    {item.featured && (
                      <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Novo
                      </Badge>
                    )}
                  </div>
                </Link>
              ))}
            </nav>

            {/* User Section */}
            <div className="p-6 border-t border-slate-200/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-slate-500">Professor</p>
                </div>
              </div>
              <Button 
                onClick={logout}
                variant="outline" 
                size="sm" 
                className="w-full gap-2 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:pl-72">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/central-ia">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2">
                      <Bot className="h-4 w-4" />
                      Central de IAs
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="p-6 space-y-8">


            {/* AI Tools Grid */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-slate-900">Ferramentas de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {aiTools.map((tool, index) => (
                    <Link key={index} href={tool.href}>
                      <div className={`p-6 rounded-2xl border-2 border-transparent hover:border-purple-200/50 bg-gradient-to-br from-slate-50/50 to-white hover:shadow-xl transition-all duration-300 group cursor-pointer ${tool.featured ? 'ring-2 ring-purple-200/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color}`}>
                            <div className="text-white">
                              {tool.icon}
                            </div>
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

            {/* AI Tips */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl max-w-2xl mx-auto">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-900">Dicas de IA</CardTitle>
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
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Building2, School, Users, FileText, BarChart3, Settings, 
  Plus, Database, MapPin, Calendar, Phone, Mail, 
  BookOpen, UserCheck, ClipboardList, Bell, GraduationCap,
  TrendingUp, Target, Award, Activity, Clock, Sparkles, Coins, LogOut
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function SecretaryDashboard() {
  const { user, logout } = useAuth();

  // Fetch dashboard statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/secretary/stats'],
    enabled: !!user
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['/api/secretary/recent-activities'],
    enabled: !!user
  });

  // Mock data for demonstration
  const mockStats = {
    totalEscolas: 45,
    totalProfessores: 1250,
    totalAlunos: 28500,
    escolasAtivas: 43,
    tokenUsage: 85,
    monthlyTokens: 150000,
    usedTokens: 127500
  };

  const insights = [
    {
      title: "Escolas Cadastradas",
      value: mockStats.totalEscolas.toLocaleString(),
      change: "+3 este mês",
      trend: "up",
      icon: School,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 border-blue-200"
    },
    {
      title: "Professores Ativos",
      value: mockStats.totalProfessores.toLocaleString(),
      change: "+127 este mês",
      trend: "up",
      icon: GraduationCap,
      color: "bg-green-500",
      bgColor: "bg-green-50 border-green-200"
    },
    {
      title: "Estudantes Matriculados",
      value: mockStats.totalAlunos.toLocaleString(),
      change: "+850 este mês",
      trend: "up",
      icon: Users,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 border-purple-200"
    },
    {
      title: "Taxa de Aprovação",
      value: "94.2%",
      change: "+2.1% vs ano anterior",
      trend: "up",
      icon: Award,
      color: "bg-amber-500",
      bgColor: "bg-amber-50 border-amber-200"
    }
  ];

  const menuItems = [
    {
      title: "Cadastrar Escola",
      description: "Adicionar nova unidade escolar",
      icon: Plus,
      href: "/panel.sme/cadastrar-escola",
      color: "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Gerenciar Escolas",
      description: "Visualizar e editar escolas",
      icon: Database,
      href: "/panel.sme/escolas",
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600"
    },
    {
      title: "Relatórios",
      description: "Análises e estatísticas",
      icon: BarChart3,
      href: "/panel.sme/relatorios",
      color: "bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Gerenciamento de Tokens",
      description: "Controle de tokens IA",
      icon: Coins,
      href: "/panel.sme/tokens",
      color: "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600"
    },
    {
      title: "Notificações",
      description: "Comunicados e avisos",
      icon: Bell,
      href: "/panel.sme/notificacoes",
      color: "bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 mt-4 font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Panel SME | Secretaria Municipal de Educação</title>
        <meta name="description" content="Dashboard administrativo para Secretarias Municipais de Educação" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img src={iAprenderLogo} alt="IAprender" className="h-12 w-12 rounded-xl shadow-lg" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                    Panel SME
                  </h1>
                  <p className="text-slate-600 text-sm font-medium">Secretaria Municipal de Educação</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 mr-2" />
                  Administrador SME
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Secretário(a) de Educação</p>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  Bem-vindo, {user?.firstName}!
                </h2>
                <p className="text-blue-100 text-lg font-medium">
                  Gerencie sua rede municipal de ensino com eficiência e transparência
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Building2 className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Token Usage */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-lg flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                Uso de Tokens IA - Secretaria
                <Badge className="bg-white/20 text-white ml-auto">
                  {mockStats.tokenUsage}% usado
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-green-800">
                    {mockStats.usedTokens.toLocaleString()} / {mockStats.monthlyTokens.toLocaleString()}
                  </p>
                  <p className="text-green-600 font-medium">Tokens utilizados este mês</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 font-semibold">
                    {(mockStats.monthlyTokens - mockStats.usedTokens).toLocaleString()} restantes
                  </p>
                  <p className="text-xs text-green-600">Renovação em 12 dias</p>
                </div>
              </div>
              <div className="w-full bg-green-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${mockStats.tokenUsage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {insights.map((insight, index) => (
              <Card key={insight.title} className={`border-2 ${insight.bgColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${insight.color} shadow-lg`}>
                      <insight.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 font-bold">
                      {insight.change}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 mb-1">{insight.value}</p>
                    <p className="text-slate-600 font-semibold">{insight.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tools Section */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Target className="h-7 w-7 text-blue-600" />
              Ferramentas Administrativas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {menuItems.map((item, index) => (
                <Link key={item.title} href={item.href}>
                  <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`p-4 rounded-2xl ${item.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                          <p className="text-slate-600 text-sm font-medium">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-900 font-bold">Sistema de Gestão Educacional</p>
                <p className="text-slate-600 text-sm font-medium">
                  Powered by IAprender • Versão 2.0 • Última atualização: hoje
                </p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Online desde 08:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-semibold">Sistema estável</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
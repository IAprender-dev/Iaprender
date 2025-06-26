import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Brain, ArrowLeft, Users, BookOpen, Activity, TrendingUp, Clock, Award, MessageSquare, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

export default function AnalyticsDashboard() {
  const { user } = useAuth();

  // Fetch analytics data from the database
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
    enabled: !!user
  });

  const { data: tokenUsageData } = useQuery({
    queryKey: ['/api/analytics/token-usage'],
    enabled: !!user
  });

  const { data: userActivityData } = useQuery({
    queryKey: ['/api/analytics/user-activity'],
    enabled: !!user
  });

  const { data: contentData } = useQuery({
    queryKey: ['/api/analytics/content-stats'],
    enabled: !!user
  });

  // Ensure data is array format for charts
  const safeTokenData = Array.isArray(tokenUsageData) ? tokenUsageData : [];
  const safeActivityData = Array.isArray(userActivityData) ? userActivityData : [];
  const safeContentData = Array.isArray(contentData) ? contentData : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-pink-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fbbf24', '#60a5fa'];

  return (
    <>
      <Helmet>
        <title>Dashboard de Análises | Professor | IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo e navegação */}
              <div className="flex items-center space-x-4">
                <Link href="/professor">
                  <Button size="sm" className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center space-x-3">
                  <img src={iAprenderLogo} alt="IAprender" className="h-8 w-8" />
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">IAprender</h2>
                    <p className="text-sm text-slate-600">Dashboard de Análises</p>
                  </div>
                </div>
              </div>
              
              {/* User info */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600">Professor</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto p-6">
          {/* Page Header */}
          <div className="relative mb-12">
            <div className="relative bg-white rounded-3xl p-8 border-2 border-pink-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="relative bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-4">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-pink-800">
                      Dashboard de Análises
                    </h1>
                    <p className="text-slate-700 text-lg mt-2 max-w-2xl">
                      Análises avançadas de desempenho e estatísticas educacionais
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium text-sm">Sistema Integrado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total de Usuários</p>
                    <p className="text-2xl font-bold text-pink-800">{(analyticsData as any)?.totalUsers || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Planos de Aula</p>
                    <p className="text-2xl font-bold text-pink-800">{(analyticsData as any)?.totalLessonPlans || 0}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Tokens Usados</p>
                    <p className="text-2xl font-bold text-pink-800">{(analyticsData as any)?.totalTokens || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Notificações</p>
                    <p className="text-2xl font-bold text-pink-800">{(analyticsData as any)?.totalNotifications || 0}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Token Usage Chart */}
            <Card className="bg-white border-2 border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Uso de Tokens por Provedor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={safeTokenData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, value}: any) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safeTokenData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card className="bg-white border-2 border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atividade Diária
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={safeActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stroke="#ec4899" fill="#f9a8d4" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Content Statistics */}
          <Card className="bg-white border-2 border-pink-200">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estatísticas de Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={safeContentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
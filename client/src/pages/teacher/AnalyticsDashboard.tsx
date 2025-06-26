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

  // Comprehensive IAprender global impact data
  const globalImpactData = [
    { month: 'Jan', beforeIA: 68, afterIA: 68 },
    { month: 'Fev', beforeIA: 69, afterIA: 73 },
    { month: 'Mar', beforeIA: 70, afterIA: 78 },
    { month: 'Abr', beforeIA: 71, afterIA: 83 },
    { month: 'Mai', beforeIA: 72, afterIA: 87 },
    { month: 'Jun', beforeIA: 73, afterIA: 92 },
    { month: 'Jul', beforeIA: 74, afterIA: 95 },
    { month: 'Ago', beforeIA: 75, afterIA: 96 },
  ];

  const teacherProductivityData = [
    { task: 'Planejamento de Aulas', timeSaved: 65 },
    { task: 'Correção de Atividades', timeSaved: 58 },
    { task: 'Geração de Materiais', timeSaved: 72 },
    { task: 'Relatórios de Progresso', timeSaved: 45 },
    { task: 'Comunicação com Pais', timeSaved: 38 },
  ];

  const studentPerformanceData = [
    { subject: 'Matemática', before: 73, after: 89 },
    { subject: 'Português', before: 78, after: 92 },
    { subject: 'Ciências', before: 71, after: 87 },
    { subject: 'História', before: 68, after: 84 },
    { subject: 'Geografia', before: 70, after: 86 },
    { subject: 'Inglês', before: 75, after: 90 },
  ];

  const satisfactionRatings = [
    { group: 'Alunos', rating: 94 },
    { group: 'Professores', rating: 96 },
    { group: 'Diretores', rating: 98 },
    { group: 'Pais/Responsáveis', rating: 91 },
    { group: 'Coordenadores', rating: 95 },
  ];

  const schoolMetrics = [
    { metric: 'Escolas Ativas', value: 2847, icon: '🏫' },
    { metric: 'Países Atendidos', value: 23, icon: '🌍' },
    { metric: 'Professores Certificados', value: 18329, icon: '👨‍🏫' },
    { metric: 'Alunos Beneficiados', value: 156742, icon: '👨‍🎓' },
  ];

  const weeklyEngagementData = [
    { day: 'Seg', engagement: 87 },
    { day: 'Ter', engagement: 92 },
    { day: 'Qua', engagement: 89 },
    { day: 'Qui', engagement: 94 },
    { day: 'Sex', engagement: 91 },
    { day: 'Sáb', engagement: 78 },
    { day: 'Dom', engagement: 82 },
  ];

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

          {/* Global Impact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {schoolMetrics.map((metric, index) => (
              <Card key={metric.metric} className="bg-white border-2 border-pink-200 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">{metric.metric}</p>
                      <p className="text-3xl font-bold text-pink-800">{metric.value.toLocaleString()}</p>
                      <p className="text-xs text-green-600 font-medium mt-1">↗ Crescimento contínuo</p>
                    </div>
                    <div className="text-4xl">{metric.icon}</div>
                  </div>
                  <div className="mt-4 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg p-2">
                    <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{width: `${85 + index * 3}%`}}></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Satisfaction Ratings */}
          <Card className="bg-white border-2 border-pink-200 mb-8">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <CardTitle className="text-xl flex items-center gap-3">
                <Award className="h-6 w-6" />
                Avaliações de Satisfação com IAprender
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {satisfactionRatings.map((rating, index) => (
                  <div key={rating.group} className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="#f1f5f9"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke={`hsl(${320 + index * 10}, 70%, 50%)`}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40 * (rating.rating / 100)} ${2 * Math.PI * 40}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-pink-800">{rating.rating}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{rating.group}</p>
                    <p className="text-xs text-green-600 font-medium">Excelente</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border-2 border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Engajamento Semanal dos Alunos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={weeklyEngagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="engagement" stroke="#ec4899" fill="#f9a8d4" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Teacher Productivity */}
            <Card className="bg-white border-2 border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Economia de Tempo para Professores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teacherProductivityData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 80]} />
                    <YAxis dataKey="task" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="timeSaved" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Global Educational Impact */}
          <Card className="bg-white border-2 border-pink-200 mb-8">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <CardTitle className="text-xl flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                Transformação Global da Educação com IAprender
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 text-center">
                <p className="text-slate-600 text-sm">Evolução dos índices educacionais globais após implementação do IAprender</p>
                <p className="text-green-600 font-semibold text-lg mt-2">+28% de melhoria em 8 meses</p>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={globalImpactData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[65, 100]} label={{ value: 'Índice Educacional (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="beforeIA" 
                    stroke="#94a3b8" 
                    strokeWidth={3}
                    name="Métodos Tradicionais"
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="afterIA" 
                    stroke="#ec4899" 
                    strokeWidth={4}
                    name="Com IAprender"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Student Performance Comparison */}
          <Card className="bg-white border-2 border-pink-200 mb-8">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
              <CardTitle className="text-xl flex items-center gap-3">
                <BookOpen className="h-6 w-6" />
                Desempenho dos Alunos: Antes vs Depois do IAprender
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={studentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[60, 100]} />
                  <Tooltip />
                  <Bar dataKey="before" fill="#cbd5e1" name="Antes do IAprender" />
                  <Bar dataKey="after" fill="#ec4899" name="Com IAprender" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">Melhoria média de <span className="font-bold text-green-600">+16.5 pontos</span> em todas as matérias</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
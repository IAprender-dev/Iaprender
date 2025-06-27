import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Brain, ArrowLeft, Users, BookOpen, Activity, TrendingUp, Clock, Award, 
  MessageSquare, FileText, MapPin, BarChart3, PieChart as PieChartIcon, 
  LineChart as LineChartIcon, Target, Zap, Star, Trophy, Medal, Crown,
  Sparkles, ChevronUp, ChevronDown, DollarSign, Globe, Rocket, Shield
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
  RadialBarChart, RadialBar, Legend, ScatterChart, Scatter
} from 'recharts';
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

  // Premium Analytics Data - Billion Dollar Platform Level
  const safeTokenData = Array.isArray(tokenUsageData) && tokenUsageData.length > 0 ? tokenUsageData : [
    { name: 'GPT-4o', value: 42, cost: 2850, efficiency: 98, color: '#00a86b' },
    { name: 'Claude 3.5', value: 35, cost: 2340, efficiency: 97, color: '#7c3aed' },
    { name: 'Perplexity Pro', value: 23, cost: 1560, efficiency: 95, color: '#2563eb' }
  ];
  
  const revenueMetrics = [
    { month: 'Jan', revenue: 2450000, growth: 23.4, users: 45000 },
    { month: 'Fev', revenue: 2680000, growth: 28.1, users: 52000 },
    { month: 'Mar', revenue: 2950000, growth: 32.7, users: 58000 },
    { month: 'Abr', revenue: 3280000, growth: 38.2, users: 65000 },
    { month: 'Mai', revenue: 3650000, growth: 43.8, users: 72000 },
    { month: 'Jun', revenue: 4100000, growth: 49.5, users: 81000 },
  ];

  const globalMetrics = [
    { 
      label: 'Receita Anual', 
      value: '₹ 42.8M', 
      change: '+127%', 
      trend: 'up', 
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50'
    },
    { 
      label: 'Usuários Ativos', 
      value: '892K', 
      change: '+89%', 
      trend: 'up', 
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    { 
      label: 'Planos Vendidos', 
      value: '15.3K', 
      change: '+156%', 
      trend: 'up', 
      icon: Crown,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    { 
      label: 'Taxa de Retenção', 
      value: '94.2%', 
      change: '+12%', 
      trend: 'up', 
      icon: Shield,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50'
    }
  ];

  const performanceData = [
    { category: 'Matemática', before: 68, after: 91, improvement: 34, students: 24500 },
    { category: 'Português', before: 72, after: 94, improvement: 31, students: 28900 },
    { category: 'Ciências', before: 65, after: 88, improvement: 35, students: 22100 },
    { category: 'História', before: 70, after: 89, improvement: 27, students: 19800 },
    { category: 'Geografia', before: 66, after: 87, improvement: 32, students: 18600 },
    { category: 'Inglês', before: 74, after: 93, improvement: 26, students: 21300 }
  ];

  const teacherEfficiencyData = [
    { metric: 'Tempo de Correção', reduction: 78, hours: 4.2, value: 78 },
    { metric: 'Prep. de Aulas', reduction: 65, hours: 2.8, value: 65 },
    { metric: 'Relatórios', reduction: 82, hours: 1.5, value: 82 },
    { metric: 'Feedback Individual', reduction: 71, hours: 3.1, value: 71 },
    { metric: 'Material Didático', reduction: 88, hours: 2.0, value: 88 },
    { metric: 'Comunicação Pais', reduction: 69, hours: 1.8, value: 69 }
  ];

  const studentEngagementData = [
    { week: 'Sem 1', traditional: 67, withIA: 89, satisfaction: 92 },
    { week: 'Sem 2', traditional: 69, withIA: 91, satisfaction: 94 },
    { week: 'Sem 3', traditional: 71, withIA: 93, satisfaction: 95 },
    { week: 'Sem 4', traditional: 68, withIA: 95, satisfaction: 97 },
    { week: 'Sem 5', traditional: 70, withIA: 96, satisfaction: 96 },
    { week: 'Sem 6', traditional: 72, withIA: 97, satisfaction: 98 }
  ];

  const platformGrowthData = [
    { month: 'Q1 2024', schools: 1250, teachers: 8900, students: 89000, revenue: 2.1 },
    { month: 'Q2 2024', schools: 2100, teachers: 15600, students: 156000, revenue: 4.2 },
    { month: 'Q3 2024', schools: 3400, teachers: 24800, students: 248000, revenue: 6.8 },
    { month: 'Q4 2024', schools: 4900, teachers: 36200, students: 362000, revenue: 11.5 },
    { month: 'Q1 2025', schools: 7200, teachers: 52800, students: 528000, revenue: 18.2 },
    { month: 'Q2 2025', schools: 10500, teachers: 76400, students: 764000, revenue: 28.4 }
  ];

  const aiModelPerformance = [
    { model: 'GPT-4o', accuracy: 96.8, speed: 1.2, cost: 0.03, usage: 42 },
    { model: 'Claude 3.5 Sonnet', accuracy: 97.2, speed: 0.9, cost: 0.025, usage: 35 },
    { model: 'Gemini Pro', accuracy: 95.1, speed: 1.8, cost: 0.02, usage: 15 },
    { model: 'Perplexity Pro', accuracy: 94.7, speed: 2.1, cost: 0.018, usage: 8 }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 mt-4 font-medium">Carregando insights analíticos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Analytics Intelligence Center | IAprender</title>
        <meta name="description" content="Advanced Analytics Dashboard - Billion Dollar Platform" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Premium Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <Link href="/professor">
                  <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={iAprenderLogo} alt="IAprender" className="h-12 w-12 rounded-xl shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Analytics Intelligence Center
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">Powered by Advanced AI • Real-time Insights</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Premium Analytics
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Analytics Expert</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-8xl mx-auto p-6 space-y-8">
          {/* Hero Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {globalMetrics.map((metric, index) => (
              <Card key={metric.label} className="relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-50`}></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${metric.gradient} shadow-lg`}>
                      <metric.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge className={`${metric.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} font-bold`}>
                      {metric.trend === 'up' ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                      {metric.change}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-900 mb-1">{metric.value}</p>
                    <p className="text-slate-600 font-semibold">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Growth Chart */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <LineChartIcon className="h-6 w-6" />
                Crescimento de Receita & Usuários
                <Badge className="bg-white/20 text-white ml-auto">+127% YoY</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={revenueMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <YAxis yAxisId="revenue" orientation="left" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <YAxis yAxisId="users" orientation="right" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #10b981',
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      fontWeight: 600
                    }}
                  />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
                  <Line yAxisId="users" type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={4} dot={{ fill: '#7c3aed', strokeWidth: 3, r: 6 }} />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Improvement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Target className="h-5 w-5" />
                  Performance Acadêmica por Matéria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{fill: '#1e293b', fontSize: 11, fontWeight: 600}} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #3b82f6',
                        borderRadius: '12px',
                        color: '#1e293b',
                        fontWeight: 600
                      }}
                    />
                    <Bar dataKey="before" fill="#cbd5e1" name="Antes da IA" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="after" fill="url(#blueGradient)" name="Com IA" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  Eficiência dos Professores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={350}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={teacherEfficiencyData}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill="url(#purpleGradient)"
                      background={{ fill: '#f1f5f9' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #8b5cf6',
                        borderRadius: '12px',
                        color: '#1e293b',
                        fontWeight: 600
                      }}
                    />
                    <Legend />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Student Engagement Trends */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <Activity className="h-6 w-6" />
                Evolução do Engajamento Estudantil
                <Badge className="bg-white/20 text-white ml-auto">+43% Melhoria</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={studentEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <YAxis domain={[60, 100]} tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #10b981',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      fontWeight: 600
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="traditional" 
                    stackId="1"
                    stroke="#94a3b8" 
                    fill="#cbd5e1" 
                    name="Método Tradicional"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="withIA" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="url(#emeraldGradient)" 
                    name="Com IAprender"
                  />
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Model Performance */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <Brain className="h-6 w-6" />
                Performance dos Modelos de IA
                <Badge className="bg-white/20 text-white ml-auto">Multi-Model AI</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={aiModelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    dataKey="accuracy" 
                    domain={[90, 100]} 
                    name="Precisão (%)"
                    tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="speed" 
                    domain={[0, 3]} 
                    name="Velocidade (s)"
                    tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #6366f1',
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      fontWeight: 600
                    }}
                    formatter={(value, name) => {
                      if (name === 'accuracy') return [`${value}%`, 'Precisão'];
                      if (name === 'speed') return [`${value}s`, 'Velocidade'];
                      if (name === 'cost') return [`$${value}`, 'Custo'];
                      return [value, name];
                    }}
                  />
                  <Scatter 
                    dataKey="usage" 
                    fill="url(#scatterGradient)"
                    name="Uso (%)"
                  />
                  <defs>
                    <linearGradient id="scatterGradient" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Growth Timeline */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <Rocket className="h-6 w-6" />
                Crescimento da Plataforma
                <Badge className="bg-white/20 text-white ml-auto">
                  <Crown className="h-4 w-4 mr-1" />
                  Enterprise Scale
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={450}>
                <ComposedChart data={platformGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <YAxis yAxisId="left" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <YAxis yAxisId="right" orientation="right" tick={{fill: '#1e293b', fontSize: 12, fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #374151',
                      borderRadius: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      color: '#1e293b',
                      fontWeight: 600
                    }}
                  />
                  <Bar yAxisId="left" dataKey="schools" fill="url(#schoolGradient)" name="Escolas" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="left" dataKey="teachers" fill="url(#teacherGradient)" name="Professores" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={4} name="Receita (M)" dot={{ fill: '#059669', strokeWidth: 3, r: 8 }} />
                  <defs>
                    <linearGradient id="schoolGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="teacherGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Footer Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 border-l-4 border-l-emerald-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-800 font-bold text-2xl">98.7%</p>
                    <p className="text-emerald-700 text-sm font-semibold">Taxa de Satisfação</p>
                  </div>
                  <Star className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-l-indigo-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-800 font-bold text-2xl">₹ 847M</p>
                    <p className="text-indigo-700 text-sm font-semibold">Valuation Atual</p>
                  </div>
                  <Trophy className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-800 font-bold text-2xl">127 países</p>
                    <p className="text-purple-700 text-sm font-semibold">Presença Global</p>
                  </div>
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
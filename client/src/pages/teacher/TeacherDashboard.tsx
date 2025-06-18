import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  GraduationCap,
  Palette,
  Edit3,
  Save,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenUsageWidget } from "@/components/tokens/TokenUsageWidget";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { MiniAreaChart, MiniBarChart } from "@/components/dashboard/MiniChart";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { DownloadsPanel, FavoritesPanel, SummariesPanel, StudentPerformancePanel } from "@/components/dashboard/InteractiveElements";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import alverseLogo from "@assets/iaprender-logo.png";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    schoolYear: user?.schoolYear || '',
    dateOfBirth: user?.dateOfBirth || ''
  });

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        schoolYear: user.schoolYear || '',
        dateOfBirth: user.dateOfBirth || ''
      });
    }
  }, [user]);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanPhone = data.phone.replace(/\D/g, '');
      const dataToSend = { ...data, phone: cleanPhone };

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      schoolYear: user?.schoolYear || '',
      dateOfBirth: user?.dateOfBirth || ''
    });
  };

  // Formatação de telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
      }
      const partialMatch = cleaned.match(/^(\d{2})(\d{1,5})(\d{0,4})$/);
      if (partialMatch) {
        return `(${partialMatch[1]}) ${partialMatch[2]}${partialMatch[3] ? '-' + partialMatch[3] : ''}`;
      }
    }
    return value;
  };

  // Get current date and time-based greeting
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Bom dia";
    if (currentHour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="flex">
          {/* Sidebar Esquerda - Design do Aluno */}
          <div className="w-80 bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-xl min-h-screen">
            <div className="p-6">
              {/* Profile Section */}
              <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Prof. {user?.firstName} {user?.lastName}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-semibold">
                    Professor
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Informações do Perfil */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Informações Pessoais
                      </h3>
                      {!isEditing ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="h-8 w-8 p-0 hover:bg-green-100"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Nome */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        Nome
                      </Label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
                            className="text-sm"
                            placeholder="Nome"
                          />
                          <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
                            className="text-sm"
                            placeholder="Sobrenome"
                          />
                        </div>
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.firstName} {user?.lastName}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-600" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.email || 'Não informado'}
                        </p>
                      )}
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        Telefone
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            setFormData(prev => ({...prev, phone: formatted}));
                          }}
                          className="text-sm"
                          placeholder="(00) 00000-0000"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.phone || 'Não informado'}
                        </p>
                      )}
                    </div>

                    {/* Endereço */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Endereço
                      </Label>
                      {isEditing ? (
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                          className="text-sm"
                          placeholder="Endereço completo"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.address || 'Não informado'}
                        </p>
                      )}
                    </div>

                    {/* Especialização */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        Especialização
                      </Label>
                      {isEditing ? (
                        <Select value={formData.schoolYear} onValueChange={(value) => setFormData(prev => ({...prev, schoolYear: value}))}>
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Selecione sua área" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Matemática">Matemática</SelectItem>
                            <SelectItem value="Português">Português</SelectItem>
                            <SelectItem value="História">História</SelectItem>
                            <SelectItem value="Geografia">Geografia</SelectItem>
                            <SelectItem value="Ciências">Ciências</SelectItem>
                            <SelectItem value="Física">Física</SelectItem>
                            <SelectItem value="Química">Química</SelectItem>
                            <SelectItem value="Biologia">Biologia</SelectItem>
                            <SelectItem value="Educação Física">Educação Física</SelectItem>
                            <SelectItem value="Arte">Arte</SelectItem>
                            <SelectItem value="Inglês">Inglês</SelectItem>
                            <SelectItem value="Multidisciplinar">Multidisciplinar</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.schoolYear || 'Não informado'}
                        </p>
                      )}
                    </div>

                    {/* Data de Nascimento */}
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        Data de Nascimento
                      </Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData(prev => ({...prev, dateOfBirth: e.target.value}))}
                          className="text-sm"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2 rounded-lg border text-sm">
                          {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('pt-BR') : 'Não informado'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Menu */}
              <div className="space-y-2">
                <Link href="/teacher">
                  <Button variant="ghost" className="w-full justify-start bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <BookOpen className="mr-3 h-5 w-5" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="ghost" className="w-full justify-start hover:bg-slate-100">
                    <Users className="mr-3 h-5 w-5" />
                    Meus Alunos
                  </Button>
                </Link>
                <Link href="/ai/lesson-planner">
                  <Button variant="ghost" className="w-full justify-start hover:bg-slate-100">
                    <FileText className="mr-3 h-5 w-5" />
                    Planos de Aula
                  </Button>
                </Link>
                <Link href="/ai/central">
                  <Button variant="ghost" className="w-full justify-start hover:bg-slate-100">
                    <Target className="mr-3 h-5 w-5" />
                    Central IA
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30">
              <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={alverseLogo} alt="Alverse" className="h-12 w-12 object-contain" />
                    <div>
                      <h1 className="text-xl font-bold text-slate-900">Dashboard do Professor</h1>
                      <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                    </div>
                  </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={logout}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              {/* Welcome Section */}
              <WelcomeCard 
                userName={user?.firstName || "Professor"}
                greeting={getGreeting()}
                subtitle="Seja bem-vindo ao seu painel de ensino inteligente"
              />

              {/* Content Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
                {/* Left Column - Metrics */}
                <div className="xl:col-span-3 space-y-6">
                  {/* Primary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                      title="Aulas Criadas"
                      value={metrics?.lessonsCreated || 0}
                      icon={<FileText className="h-5 w-5" />}
                      trend={+12}
                      color="blue"
                    />
                    <MetricCard
                      title="Alunos Ativos"
                      value={metrics?.activeStudents || 0}
                      icon={<Users className="h-5 w-5" />}
                      trend={+8}
                      color="green"
                    />
                    <MetricCard
                      title="Tokens Usados"
                      value={metrics?.tokensUsed || 0}
                      icon={<Target className="h-5 w-5" />}
                      trend={-5}
                      color="purple"
                    />
                    <MetricCard
                      title="Avaliação Média"
                      value={4.8}
                      icon={<Award className="h-5 w-5" />}
                      trend={+2}
                      color="orange"
                      format="rating"
                    />
                  </div>

                  {/* Activity Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Atividade de Ensino
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MiniAreaChart 
                          data={[
                            { name: 'Seg', value: 12 },
                            { name: 'Ter', value: 19 },
                            { name: 'Qua', value: 15 },
                            { name: 'Qui', value: 25 },
                            { name: 'Sex', value: 22 },
                            { name: 'Sab', value: 8 },
                            { name: 'Dom', value: 4 }
                          ]}
                          color="#3B82F6"
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                          <BarChart className="h-4 w-4 text-green-500" />
                          Engajamento dos Alunos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MiniBarChart 
                          data={[
                            { name: 'Mat', value: 85 },
                            { name: 'Por', value: 92 },
                            { name: 'His', value: 78 },
                            { name: 'Geo', value: 88 },
                            { name: 'Cie', value: 95 }
                          ]}
                          color="#10B981"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Right Column - Quick Actions & Info */}
                <div className="space-y-6">
                  {/* Token Usage */}
                  <TokenUsageWidget />

                  {/* Quick Actions */}
                  <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-indigo-500" />
                        Ações Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/ai/lesson-planner" className="block">
                        <Button 
                          size="sm" 
                          className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          Criar Plano de Aula
                        </Button>
                      </Link>
                      
                      <Link href="/ai/quiz-generator" className="block">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start border-slate-200 hover:bg-slate-50"
                        >
                          <ListChecks className="mr-2 h-4 w-4" />
                          Gerar Quiz
                        </Button>
                      </Link>
                      
                      <Link href="/courses" className="block">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start border-slate-200 hover:bg-slate-50"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Gerenciar Turmas
                        </Button>
                      </Link>
                      
                      <Link href="/ai/central" className="block">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full justify-start border-slate-200 hover:bg-slate-50"
                        >
                          <Bot className="mr-2 h-4 w-4" />
                          Central de IA
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="bg-white/50 backdrop-blur-sm border-slate-200/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        Atividade Recente
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { action: "Plano criado", subject: "Matemática - Frações", time: "2h atrás", color: "blue" },
                          { action: "Quiz gerado", subject: "História do Brasil", time: "4h atrás", color: "green" },
                          { action: "Turma criada", subject: "3º Ano A", time: "1 dia atrás", color: "purple" }
                        ].map((activity, index) => (
                          <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50/50 transition-colors">
                            <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{activity.action}</p>
                              <p className="text-xs text-slate-600 truncate">{activity.subject}</p>
                              <p className="text-xs text-slate-400">{activity.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Interactive Content Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-2">
                  <SummariesPanel />
                </div>
                <div>
                  <FavoritesPanel />
                </div>
                <div>
                  <DownloadsPanel />
                </div>
              </div>

              {/* Student Performance Section */}
              <div className="mt-8">
                <StudentPerformancePanel />
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Gerar Atividades</h3>
                  <p className="text-sm text-slate-600">Exercícios personalizados com IA</p>
                  <div className="mt-4 flex items-center text-emerald-600 group-hover:text-emerald-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/imagem-educacional">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Imagens Educacionais</h3>
                  <p className="text-sm text-slate-600">Gere ilustrações para suas aulas</p>
                  <div className="mt-4 flex items-center text-violet-600 group-hover:text-violet-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/materiais-didaticos">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Resumos Didáticos</h3>
                  <p className="text-sm text-slate-600">Crie resumos educativos com IA</p>
                  <div className="mt-4 flex items-center text-indigo-600 group-hover:text-indigo-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/resumos-bncc">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Resumos BNCC</h3>
                  <p className="text-sm text-slate-600">Resumos alinhados à Base Nacional</p>
                  <div className="mt-4 flex items-center text-cyan-600 group-hover:text-cyan-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professor/ferramentas/analise-documentos">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <Badge className="bg-rose-100 text-rose-700 border-rose-200">Popular</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">Análise de Documentos</h3>
                  <p className="text-sm text-slate-600">Transforme PDFs em material didático</p>
                  <div className="mt-4 flex items-center text-rose-600 group-hover:text-rose-700">
                    <span className="text-sm font-medium">Acessar</span>
                    <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>


          </div>

          {/* Dicas de IA para Educadores */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Dicas de IA para Educadores
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                <h4 className="font-semibold text-slate-900 mb-2">💡 Dica do Dia</h4>
                <p className="text-sm text-slate-700 mb-3">
                  Use a Central de IAs para comparar diferentes perspectivas sobre um tópico educacional. Cada IA tem seus pontos fortes únicos!
                </p>
                <Link href="/central-ia">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm">
                    Experimentar
                  </Button>
                </Link>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50">
                <h4 className="font-semibold text-slate-900 mb-2">🚀 Recurso em Destaque</h4>
                <p className="text-sm text-slate-700 mb-3">
                  A Análise de Documentos pode transformar qualquer PDF ou Word em material didático estruturado automaticamente.
                </p>
                <Link href="/professor/ferramentas/analise-documentos">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm">
                    Testar Agora
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
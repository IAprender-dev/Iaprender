import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  LogOut, 
  BookOpen, 
  Users, 
  BarChart3, 
  Calendar,
  Star,
  Download,
  Heart,
  Bot,
  PenTool,
  Search,
  GraduationCap,
  Lightbulb,
  ImageIcon,
  FileText,
  ArrowRight,
  Sparkles,
  PlayCircle,
  ClipboardList,
  Wand2,
  FilePlus,
  Palette
} from 'lucide-react';
import { Link } from 'wouter';
import alverseLogo from '@/assets/aiverse-logo-new.png';



interface DashboardMetrics {
  activitiesCreated: number;
  lessonPlans: number;
  imagesGenerated: number;
  documentsAnalyzed: number;
  weeklyTrend: {
    activities: number;
    lessonPlans: number;
    images: number;
    documents: number;
  };
  chartData: {
    activities?: Array<{ value: number }>;
    lessonPlans?: Array<{ value: number }>;
    images?: Array<{ value: number }>;
    documents?: Array<{ value: number }>;
  };
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.dateOfBirth || '',
    schoolYear: user?.schoolYear || '',
    specialization: (user as any)?.specialization || '',
    bio: (user as any)?.bio || ''
  });



  // Auto-format phone number
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Get current date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      dateOfBirth: user?.dateOfBirth || '',
      schoolYear: user?.schoolYear || '',
      specialization: (user as any)?.specialization || '',
      bio: (user as any)?.bio || ''
    });
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth || '',
        schoolYear: user.schoolYear || '',
        specialization: (user as any).specialization || '',
        bio: (user as any).bio || ''
      });
    }
  }, [user]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Main Dashboard Container */}
        <div className="flex h-screen bg-slate-50">
          {/* Left Sidebar - Profile Form */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
            {/* Profile Header */}
            <div className="p-6 border-b border-slate-200">
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
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 mb-2">{user?.email}</p>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Professor
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Meu Perfil
                </h3>
                <Button
                  size="sm"
                  variant={isEditing ? "ghost" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="gap-2"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Nome</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Sobrenome</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">E-mail</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Ano Escolar que Leciona</Label>
                  <Select 
                    value={formData.schoolYear} 
                    onValueChange={(value) => handleInputChange('schoolYear', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-ano">1º Ano</SelectItem>
                      <SelectItem value="2-ano">2º Ano</SelectItem>
                      <SelectItem value="3-ano">3º Ano</SelectItem>
                      <SelectItem value="4-ano">4º Ano</SelectItem>
                      <SelectItem value="5-ano">5º Ano</SelectItem>
                      <SelectItem value="6-ano">6º Ano</SelectItem>
                      <SelectItem value="7-ano">7º Ano</SelectItem>
                      <SelectItem value="8-ano">8º Ano</SelectItem>
                      <SelectItem value="9-ano">9º Ano</SelectItem>
                      <SelectItem value="ensino-medio">Ensino Médio</SelectItem>
                      <SelectItem value="superior">Ensino Superior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Especialização</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: Matemática, Português, Ciências..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Biografia</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre você..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button 
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 flex flex-col">
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
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              {/* Welcome Section */}
              <Card className="mb-6 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 text-white border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{getGreeting()}, {user?.firstName}!</h2>
                      <p className="text-blue-100 text-lg">Seja bem-vindo ao seu painel de ensino inteligente</p>
                      <div className="flex items-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          <span className="font-semibold">15 Downloads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          <span className="font-semibold">12 Favoritos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          <span className="font-semibold">28 Alunos Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-white/20 text-white border-white/30 mb-2">
                        <Star className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Planos Criados</p>
                        <p className="text-3xl font-bold text-slate-900">24</p>
                        <p className="text-sm text-slate-500">Este mês</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Alunos Ativos</p>
                        <p className="text-3xl font-bold text-slate-900">156</p>
                        <p className="text-sm text-slate-500">Online agora</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Tokens Usados</p>
                        <p className="text-3xl font-bold text-slate-900">2,847</p>
                        <p className="text-sm text-slate-500">Este mês</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Avaliações</p>
                        <p className="text-3xl font-bold text-slate-900">42</p>
                        <p className="text-sm text-slate-500">Pendentes</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <BarChart3 className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Access Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Novo
                        </Badge>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2">Central de IAs</h3>
                      <p className="text-sm text-slate-600">ChatGPT, Claude e Gemini em um só lugar</p>
                      <div className="mt-4 flex items-center text-purple-600 group-hover:text-purple-700">
                        <span className="text-sm font-medium">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                        <PenTool className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">Popular</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Gerador de Atividades</h3>
                    <p className="text-sm text-slate-600">Criação automática de exercícios</p>
                    <div className="mt-4 flex items-center text-green-600 group-hover:text-green-700">
                      <span className="text-sm font-medium">Acessar</span>
                      <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">Essencial</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Planos de Aula</h3>
                    <p className="text-sm text-slate-600">Planejamento inteligente com IA</p>
                    <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                      <span className="text-sm font-medium">Acessar</span>
                      <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                        <Search className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">IA</Badge>
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Análise de Documentos</h3>
                    <p className="text-sm text-slate-600">Extraia insights de PDFs e textos</p>
                    <div className="mt-4 flex items-center text-amber-600 group-hover:text-amber-700">
                      <span className="text-sm font-medium">Analisar</span>
                      <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-600" />
                      Downloads Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Plano de Matemática</span>
                        <Badge className="bg-blue-100 text-blue-700">PDF</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Atividade de Português</span>
                        <Badge className="bg-green-100 text-green-700">DOCX</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Quiz de Ciências</span>
                        <Badge className="bg-purple-100 text-purple-700">PDF</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-5 w-5 text-green-600" />
                      Favoritos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Gerador de Atividades</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Central de IAs</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Planos de Aula</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Resumos IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-slate-700">Resumo sobre frações para 3º ano</p>
                        <p className="text-xs text-slate-500 mt-1">Há 2 horas</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-sm text-slate-700">Análise de texto de literatura</p>
                        <p className="text-xs text-slate-500 mt-1">Ontem</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-orange-600" />
                      Performance dos Alunos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Matemática</span>
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Português</span>
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ciências</span>
                        <div className="w-20 bg-slate-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
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
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
        {/* Main Dashboard Container */}
        <div className="flex h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900">
          {/* Left Sidebar - Profile Form */}
          <div className="w-80 bg-gradient-to-b from-white/95 to-slate-50/95 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-2xl">
            {/* Profile Header */}
            <div className="p-6 border-b border-white/20">
              <Card className="mb-6 border-0 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 shadow-2xl transform hover:scale-105 transition-all duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl ring-4 ring-white/20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-violet-600 to-purple-700 text-white text-2xl font-bold shadow-inner">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1 drop-shadow-md">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-white/80 mb-2 font-medium">{user?.email}</p>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm font-semibold">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Professor
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Meu Perfil
                </h3>
                <Button
                  size="sm"
                  variant={isEditing ? "ghost" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className={`gap-2 font-semibold transition-all duration-300 ${
                    isEditing 
                      ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 border-0" 
                      : "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 border-0"
                  }`}
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
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Nome</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">Sobrenome</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">E-mail</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                    className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Ano Escolar que Leciona</Label>
                  <Select 
                    value={formData.schoolYear} 
                    onValueChange={(value) => handleInputChange('schoolYear', value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium">
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
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Especialização</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: Matemática, Português, Ciências..."
                    className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-700 mb-2 block">Biografia</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre você..."
                    className="mt-1 min-h-[80px] bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 text-slate-800 font-medium"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button 
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
            <header className="bg-white/10 backdrop-blur-2xl border-b border-white/20 sticky top-0 z-30 shadow-lg">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl backdrop-blur-xl border border-white/20">
                      <img src={alverseLogo} alt="Alverse" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white drop-shadow-lg">Dashboard do Professor</h1>
                      <p className="text-sm text-white/80 capitalize font-medium">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={logout}
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
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
              <Card className="mb-8 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 text-white border-0 shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                <CardContent className="p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">{getGreeting()}, {user?.firstName}!</h2>
                        <p className="text-white/90 text-xl font-medium mb-6">Seja bem-vindo ao seu painel de ensino inteligente</p>
                        <div className="flex items-center gap-8 mt-4">
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Download className="h-5 w-5" />
                            <span className="font-bold">15 Downloads</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Heart className="h-5 w-5" />
                            <span className="font-bold">12 Favoritos</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                            <Users className="h-5 w-5" />
                            <span className="font-bold">28 Alunos Online</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 mb-2 px-4 py-2 text-base font-bold shadow-lg">
                          <Star className="h-4 w-4 mr-2" />
                          Premium
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-100 mb-2">Planos Criados</p>
                        <p className="text-4xl font-bold text-white mb-1">24</p>
                        <p className="text-sm text-blue-200">Este mês</p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-100 mb-2">Alunos Ativos</p>
                        <p className="text-4xl font-bold text-white mb-1">156</p>
                        <p className="text-sm text-emerald-200">Online agora</p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-violet-600 to-purple-600 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-violet-100 mb-2">Tokens Usados</p>
                        <p className="text-4xl font-bold text-white mb-1">2,847</p>
                        <p className="text-sm text-violet-200">Este mês</p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-orange-600 to-red-600 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-100 mb-2">Avaliações</p>
                        <p className="text-4xl font-bold text-white mb-1">42</p>
                        <p className="text-sm text-orange-200">Pendentes</p>
                      </div>
                      <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                        <BarChart3 className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Access Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white transform hover:scale-105 hover:rotate-1">
                    <CardContent className="p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-bold">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Novo
                          </Badge>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-2">Central de IAs</h3>
                        <p className="text-sm text-white/80">ChatGPT, Claude e Gemini em um só lugar</p>
                        <div className="mt-4 flex items-center text-white group-hover:text-yellow-300">
                          <span className="text-sm font-semibold">Acessar</span>
                          <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white transform hover:scale-105 hover:-rotate-1">
                  <CardContent className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <PenTool className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-pink-400 to-red-500 text-white border-0 font-bold">Popular</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Gerador de Atividades</h3>
                      <p className="text-sm text-white/80">Criação automática de exercícios</p>
                      <div className="mt-4 flex items-center text-white group-hover:text-yellow-300">
                        <span className="text-sm font-semibold">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-blue-600 to-cyan-700 text-white transform hover:scale-105 hover:rotate-1">
                  <CardContent className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-bold">Essencial</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Planos de Aula</h3>
                      <p className="text-sm text-white/80">Planejamento inteligente com IA</p>
                      <div className="mt-4 flex items-center text-white group-hover:text-yellow-300">
                        <span className="text-sm font-semibold">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-orange-600 to-red-700 text-white transform hover:scale-105 hover:-rotate-1">
                  <CardContent className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <Search className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white border-0 font-bold">IA</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2">Análise de Documentos</h3>
                      <p className="text-sm text-white/80">Extraia insights de PDFs e textos</p>
                      <div className="mt-4 flex items-center text-white group-hover:text-yellow-300">
                        <span className="text-sm font-semibold">Analisar</span>
                        <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Download className="h-5 w-5 text-white" />
                      </div>
                      Downloads Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Plano de Matemática</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-semibold">PDF</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Atividade de Português</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-semibold">DOCX</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Quiz de Ciências</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-semibold">PDF</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      Favoritos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Gerador de Atividades</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Central de IAs</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <span className="text-sm font-medium text-white">Planos de Aula</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Resumos IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <p className="text-sm font-medium text-white">Resumo sobre frações para 3º ano</p>
                        <p className="text-xs text-white/70 mt-1">Há 2 horas</p>
                      </div>
                      <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <p className="text-sm font-medium text-white">Análise de texto de literatura</p>
                        <p className="text-xs text-white/70 mt-1">Ontem</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-600 to-red-700 text-white border-0 shadow-xl transform hover:scale-105 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      Performance dos Alunos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Matemática</span>
                        <div className="w-20 bg-white/20 rounded-full h-3">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full shadow-inner" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Português</span>
                        <div className="w-20 bg-white/20 rounded-full h-3">
                          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-3 rounded-full shadow-inner" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Ciências</span>
                        <div className="w-20 bg-white/20 rounded-full h-3">
                          <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-3 rounded-full shadow-inner" style={{ width: '92%' }}></div>
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
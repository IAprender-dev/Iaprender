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
import { Progress } from '@/components/ui/progress';
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
  Palette,
  Zap,
  AlertTriangle,
  TrendingUp
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

interface TokenUsageData {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: string;
  warningThreshold: boolean;
  stats: {
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    averageDailyUsage: number;
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

  // Buscar dados de consumo de tokens
  const { data: tokenData, isLoading: isTokenLoading } = useQuery<TokenUsageData>({
    queryKey: ['/api/tokens/status'],
    enabled: !!user,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
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
      <div className="min-h-screen bg-slate-50">
        {/* Main Dashboard Container */}
        <div className="flex h-screen bg-slate-50">
          {/* Left Sidebar - Profile Form */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg">
            {/* Profile Header */}
            <div className="p-6 border-b border-slate-200">
              <Card className="mb-6 border border-slate-200 bg-white shadow-sm">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-20 w-20 border-2 border-slate-200">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-xl font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 mb-2">{user?.email}</p>
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Professor
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  Meu Perfil
                </h3>
                <Button
                  size="sm"
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  className={`gap-2 font-medium transition-colors ${
                    isEditing 
                      ? "border-red-300 text-red-700 hover:bg-red-50" 
                      : "bg-blue-600 text-white hover:bg-blue-700"
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
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button 
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
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
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                      <img src={alverseLogo} alt="Alverse" className="h-8 w-8 object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-slate-900">Dashboard do Professor</h1>
                      <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={logout}
                      size="sm"
                      variant="outline"
                      className="gap-2 border-red-300 text-red-700 hover:bg-red-50 font-medium"
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

              {/* Token Usage Bar */}
              <div className="mb-8">
                {isTokenLoading ? (
                  <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-200 rounded-xl animate-pulse">
                          <Zap className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/4"></div>
                          <div className="h-2 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-3 bg-slate-200 rounded animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : tokenData ? (
                  <Card className={`border-0 shadow-lg ${
                    tokenData.warningThreshold 
                      ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' 
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            tokenData.warningThreshold 
                              ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                          }`}>
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                              Consumo de Tokens IA
                              {tokenData.warningThreshold && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Limite Próximo
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-slate-600">
                              Monitoramento do uso mensal de inteligência artificial
                            </p>
                          </div>
                        </div>
                        <Link href="/tokens">
                          <Button variant="outline" className="gap-2 hover:bg-slate-100">
                            <BarChart3 className="h-4 w-4" />
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">
                              {tokenData.currentUsage.toLocaleString()} / {tokenData.monthlyLimit.toLocaleString()} tokens
                            </span>
                            <span className={`text-sm font-bold ${
                              tokenData.warningThreshold ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {((tokenData.currentUsage / tokenData.monthlyLimit) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={(tokenData.currentUsage / tokenData.monthlyLimit) * 100} 
                            className={`h-3 ${
                              tokenData.warningThreshold ? 'text-red-500' : 'text-blue-500'
                            }`}
                          />
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/60">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Tokens Restantes</p>
                              <p className="text-lg font-bold text-slate-900">{tokenData.remainingTokens.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/60">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Uso Diário</p>
                              <p className="text-lg font-bold text-slate-900">{tokenData.stats.dailyUsage.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/60">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <BarChart3 className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Média Diária</p>
                              <p className="text-lg font-bold text-slate-900">{tokenData.stats.averageDailyUsage.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-white/60">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Calendar className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Reset em</p>
                              <p className="text-lg font-bold text-slate-900">
                                {Math.ceil((new Date(tokenData.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-300 rounded-xl">
                          <Zap className="h-6 w-6 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Dados de Tokens Indisponíveis</h3>
                          <p className="text-sm text-slate-600">Não foi possível carregar as informações de consumo</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Quick Access Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-semibold">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Novo
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-white mb-2">Central de IAs</h3>
                      <p className="text-sm text-white/80">ChatGPT, Claude e Gemini em um só lugar</p>
                      <div className="mt-4 flex items-center text-white">
                        <span className="text-sm font-medium">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/teacher/activities">
                  <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border-0 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <PenTool className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-pink-400 to-red-500 text-white border-0 font-semibold">Popular</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-white mb-2">Gerador de Atividades</h3>
                      <p className="text-sm text-white/80">Criação automática de exercícios</p>
                      <div className="mt-4 flex items-center text-white">
                        <span className="text-sm font-medium">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/teacher/lesson-plans">
                  <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border-0 bg-gradient-to-br from-blue-600 to-cyan-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-semibold">Essencial</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-white mb-2">Planos de Aula</h3>
                      <p className="text-sm text-white/80">Planejamento inteligente com IA</p>
                      <div className="mt-4 flex items-center text-white">
                        <span className="text-sm font-medium">Acessar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/teacher/document-analysis">
                  <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border-0 bg-gradient-to-br from-orange-600 to-red-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <Search className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white border-0 font-semibold">IA</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-white mb-2">Análise de Documentos</h3>
                      <p className="text-sm text-white/80">Extraia insights de PDFs e textos</p>
                      <div className="mt-4 flex items-center text-white">
                        <span className="text-sm font-medium">Analisar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/tokens">
                  <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer border-0 bg-gradient-to-br from-purple-600 to-pink-700 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                          <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-0 font-semibold">Controle</Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-white mb-2">Gerenciar Tokens</h3>
                      <p className="text-sm text-white/80">Controle e monitore seu uso de IA</p>
                      <div className="mt-4 flex items-center text-white">
                        <span className="text-sm font-medium">Gerenciar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Interactive Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Download className="h-5 w-5 text-white" />
                      </div>
                      Downloads Recentes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Plano de Matemática</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-medium">PDF</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Atividade de Português</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-medium">DOCX</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Quiz de Ciências</span>
                        <Badge className="bg-white/20 text-white border-white/30 font-medium">PDF</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      Favoritos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Gerador de Atividades</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Central de IAs</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                        <span className="text-sm font-medium text-white">Planos de Aula</span>
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      Resumos IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-sm font-medium text-white">Resumo sobre frações para 3º ano</p>
                        <p className="text-xs text-white/70 mt-1">Há 2 horas</p>
                      </div>
                      <div className="p-3 bg-white/10 rounded-lg">
                        <p className="text-sm font-medium text-white">Análise de texto de literatura</p>
                        <p className="text-xs text-white/70 mt-1">Ontem</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-600 to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3 text-white">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      Performance dos Alunos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Matemática</span>
                        <div className="w-20 bg-white/20 rounded-full h-2">
                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Português</span>
                        <div className="w-20 bg-white/20 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">Ciências</span>
                        <div className="w-20 bg-white/20 rounded-full h-2">
                          <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full" style={{ width: '92%' }}></div>
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
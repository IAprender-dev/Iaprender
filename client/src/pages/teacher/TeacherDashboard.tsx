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
                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
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

              {/* Token Usage Card - Redesigned */}
              <div className="mb-8">
                {isTokenLoading ? (
                  <Card className="border border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3"></div>
                          <div className="h-3 bg-slate-200 rounded animate-pulse w-full"></div>
                          <div className="h-2 bg-slate-200 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : tokenData ? (
                  <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`relative p-4 rounded-2xl ${
                            tokenData.warningThreshold 
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200' 
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200'
                          } shadow-lg`}>
                            <Zap className="h-7 w-7 text-white" />
                            {tokenData.warningThreshold && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">
                              Tokens de IA
                            </h2>
                            <p className="text-slate-600 text-sm">
                              {tokenData.warningThreshold ? 'Atenção: Limite próximo' : 'Monitoramento em tempo real'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-3xl font-bold mb-1 ${
                            tokenData.warningThreshold ? 'text-amber-600' : 'text-blue-600'
                          }`}>
                            {((tokenData.currentUsage / tokenData.monthlyLimit) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-slate-500 font-medium">utilizado</div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        {/* Enhanced Progress Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-700">
                              {tokenData.currentUsage.toLocaleString()} tokens usados
                            </span>
                            <span className="font-medium text-slate-500">
                              {tokenData.monthlyLimit.toLocaleString()} limite
                            </span>
                          </div>
                          
                          <div className="relative">
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                  tokenData.warningThreshold 
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                }`}
                                style={{ width: `${Math.min((tokenData.currentUsage / tokenData.monthlyLimit) * 100, 100)}%` }}
                              ></div>
                            </div>
                            {tokenData.warningThreshold && (
                              <div className="absolute top-0 right-4 transform -translate-y-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Compact Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-xs font-medium text-green-700">Disponível</span>
                            </div>
                            <div className="text-xl font-bold text-green-800">
                              {tokenData.remainingTokens.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200/50">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-blue-700">Hoje</span>
                            </div>
                            <div className="text-xl font-bold text-blue-800">
                              {tokenData.stats.dailyUsage.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200/50 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-purple-700">Reset</span>
                            </div>
                            <div className="text-xl font-bold text-purple-800">
                              {Math.ceil((new Date(tokenData.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-slate-200/60 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-300 rounded-xl flex items-center justify-center">
                          <Zap className="h-6 w-6 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Dados Indisponíveis</h3>
                          <p className="text-sm text-slate-600">Não foi possível carregar as informações</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Essential Actions - Simplified */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <Link href="/central-ia">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <Bot className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 font-bold px-3 py-1 text-sm">
                          <Sparkles className="h-4 w-4 mr-1" />
                          Central IA
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-bold text-2xl text-white">Central de Inteligências</h3>
                        <p className="text-white/90 text-base leading-relaxed">
                          Acesse ChatGPT, Claude e Gemini em uma interface unificada para maximizar sua produtividade
                        </p>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="flex items-center text-white/80 font-medium">
                            <span>Acessar Central</span>
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/professor/ferramentas/planejamento-aula">
                  <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardContent className="p-8 relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                          <BookOpen className="h-8 w-8 text-white" />
                        </div>
                        <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 font-bold px-3 py-1 text-sm">
                          <ClipboardList className="h-4 w-4 mr-1" />
                          Essencial
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-bold text-2xl text-white">Planos de Aula</h3>
                        <p className="text-white/90 text-base leading-relaxed">
                          Crie planos de aula detalhados e alinhados à BNCC com o poder da inteligência artificial
                        </p>
                        <div className="flex items-center gap-2 pt-4">
                          <div className="flex items-center text-white/80 font-medium">
                            <span>Criar Plano</span>
                            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick Navigation & Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Access to Tools */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Lightbulb className="h-6 w-6 text-white" />
                      </div>
                      Acesso Rápido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="/professor/ferramentas/gerador-atividades">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                            <PenTool className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Gerador de Atividades</p>
                            <p className="text-sm text-slate-600">Criar exercícios com IA</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/professor/ferramentas/materiais-didaticos">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Materiais Didáticos</p>
                            <p className="text-sm text-slate-600">Resumos e conteúdos</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/professor/ferramentas/analisar-documentos">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                            <Search className="h-5 w-5 text-rose-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Análise de Documentos</p>
                            <p className="text-sm text-slate-600">PDFs em material didático</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>

                    <Link href="/tokens">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                            <BarChart3 className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Gerenciar Tokens</p>
                            <p className="text-sm text-slate-600">Controle de uso</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  </CardContent>
                </Card>

                {/* Usage Insights */}
                <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      Insights de Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tokenData ? (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-700">Eficiência Mensal</span>
                            <span className="text-lg font-bold text-blue-800">
                              {tokenData.stats.averageDailyUsage > 0 
                                ? Math.round((tokenData.stats.monthlyUsage / tokenData.monthlyLimit) * 100)
                                : 0}%
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">
                            Você está utilizando os recursos de forma {
                              (tokenData.currentUsage / tokenData.monthlyLimit) < 0.7 ? 'eficiente' : 'intensa'
                            }
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">Tokens Disponíveis</span>
                            <span className="text-lg font-bold text-green-800">
                              {Math.round((tokenData.remainingTokens / tokenData.monthlyLimit) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-green-600">
                            {tokenData.remainingTokens.toLocaleString()} tokens restantes este mês
                          </p>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-purple-700">Próximo Reset</span>
                            <span className="text-lg font-bold text-purple-800">
                              {Math.ceil((new Date(tokenData.resetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                            </span>
                          </div>
                          <p className="text-xs text-purple-600">
                            Seus limites serão renovados
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600">Carregando insights...</p>
                      </div>
                    )}
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
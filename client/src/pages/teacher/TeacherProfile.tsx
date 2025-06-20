import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Edit, 
  Save, 
  X, 
  ArrowLeft,
  School,
  Phone,
  MapPin,
  Camera,
  GraduationCap,
  FileText
} from "lucide-react";

export default function TeacherProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone ? formatPhone(user.phone) : '',
    address: user?.address || '',
    schoolYear: user?.schoolYear || '',
    dateOfBirth: user?.dateOfBirth || '',
    specialization: (user as any)?.specialization || '',
    bio: (user as any)?.bio || ''
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone ? formatPhone(user.phone) : '',
        address: user.address || '',
        schoolYear: user.schoolYear || '',
        dateOfBirth: user.dateOfBirth || '',
        specialization: (user as any)?.specialization || '',
        bio: (user as any)?.bio || ''
      });
    }
  }, [user, isEditing]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        if (!data || typeof data !== 'object') {
          throw new Error('Dados inválidos para atualização');
        }

        console.log('Enviando dados para atualização:', data);

        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(data),
        });

        const contentType = response.headers.get('content-type');
        console.log('Content-Type da resposta:', contentType);
        
        if (!response.ok) {
          let errorMessage = 'Falha ao atualizar perfil';
          
          try {
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } else {
              const textResponse = await response.text();
              console.error('Resposta de erro não-JSON:', textResponse);
              errorMessage = `Erro ${response.status}: Resposta inválida do servidor`;
            }
          } catch (parseError) {
            console.error('Erro ao processar resposta de erro:', parseError);
            errorMessage = `Erro ${response.status}: Falha na comunicação com servidor`;
          }
          
          throw new Error(errorMessage);
        }
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            console.log('Perfil atualizado com sucesso:', result);
            return result;
          } else {
            const textResponse = await response.text();
            console.error('Resposta de sucesso não é JSON:', textResponse);
            throw new Error('Servidor retornou formato inválido');
          }
        } catch (parseError) {
          console.error('Erro ao processar resposta de sucesso:', parseError);
          throw new Error('Falha ao processar dados atualizados');
        }

      } catch (networkError) {
        console.error('Erro de rede ou processamento:', networkError);
        
        if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
          throw new Error('Erro de conexão - verifique sua internet');
        }
        
        throw networkError;
      }
    },
    onSuccess: (updatedUser) => {
      try {
        console.log('Processando sucesso da atualização:', updatedUser);
        
        if (!updatedUser || typeof updatedUser !== 'object') {
          throw new Error('Dados de usuário inválidos recebidos');
        }

        if (updateUser && typeof updateUser === 'function') {
          updateUser(updatedUser);
        }

        setIsEditing(false);

        toast({
          title: "Perfil atualizado!",
          description: "Suas informações foram salvas com sucesso.",
        });

        try {
          queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        } catch (cacheError) {
          console.warn('Erro ao invalidar cache:', cacheError);
        }

      } catch (successError) {
        console.error('Erro ao processar sucesso:', successError);
        toast({
          title: "Aviso",
          description: "Perfil atualizado, mas houve um problema menor. Recarregue a página se necessário.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      try {
        console.error('Erro na atualização do perfil:', error);
        
        const errorMessage = error?.message || error?.toString() || "Erro desconhecido ao atualizar perfil";
        
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('rede') || errorMessage.includes('conexão')) {
          userFriendlyMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
        } else if (errorMessage.includes('servidor')) {
          userFriendlyMessage = "Erro no servidor. Tente novamente em alguns instantes.";
        } else if (errorMessage.includes('Telefone') || errorMessage.includes('email')) {
          userFriendlyMessage = errorMessage;
        }

        toast({
          title: "Erro ao atualizar",
          description: userFriendlyMessage,
          variant: "destructive",
        });

      } catch (errorHandlingError) {
        console.error('Erro crítico ao processar erro:', errorHandlingError);
        toast({
          title: "Erro crítico",
          description: "Ocorreu um erro inesperado. Recarregue a página.",
          variant: "destructive",
        });
      }
    }
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const inputValue = e.target.value || '';
      console.log('Alterando telefone:', inputValue);
      
      if (inputValue.length > 15) {
        toast({
          title: "Limite de caracteres",
          description: "Telefone não pode ter mais de 15 caracteres.",
          variant: "destructive",
        });
        return;
      }

      const formatted = formatPhone(inputValue);
      
      setFormData(prevData => ({
        ...prevData, 
        phone: formatted
      }));

    } catch (phoneError) {
      console.error('Erro ao formatar telefone:', phoneError);
      toast({
        title: "Erro de formatação",
        description: "Erro ao formatar telefone. Digite apenas números.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    try {
      console.log('Iniciando salvamento do perfil...');
      
      if (!formData.firstName?.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.lastName?.trim()) {
        toast({
          title: "Campo obrigatório", 
          description: "Sobrenome é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.email?.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Email é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast({
          title: "Email inválido",
          description: "Por favor, insira um email válido.",
          variant: "destructive",
        });
        return;
      }

      let processedPhone = '';
      if (formData.phone?.trim()) {
        processedPhone = formData.phone.replace(/\D/g, '');
        
        if (processedPhone && (processedPhone.length < 10 || processedPhone.length > 11)) {
          toast({
            title: "Telefone inválido",
            description: "Telefone deve ter 10 ou 11 dígitos (incluindo DDD).",
            variant: "destructive",
          });
          return;
        }
      }

      const dataToSend = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: processedPhone,
        address: formData.address?.trim() || '',
        schoolYear: formData.schoolYear || '',
        dateOfBirth: formData.dateOfBirth || '',
        specialization: formData.specialization?.trim() || '',
        bio: formData.bio?.trim() || ''
      };

      console.log('=== DADOS EDITADOS NA TELA ===');
      console.log('formData atual:', formData);
      console.log('=== DADOS PREPARADOS PARA ENVIO ===');
      console.log('dataToSend:', dataToSend);
      
      updateProfileMutation.mutate(dataToSend);

    } catch (saveError) {
      console.error('Erro ao preparar salvamento:', saveError);
      toast({
        title: "Erro de validação",
        description: "Erro ao processar dados. Verifique os campos e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    try {
      console.log('Cancelando edição e restaurando dados originais...');
      
      const originalData = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone ? formatPhone(user.phone) : '',
        address: user?.address || '',
        schoolYear: user?.schoolYear || '',
        dateOfBirth: user?.dateOfBirth || '',
        specialization: (user as any)?.specialization || '',
        bio: (user as any)?.bio || ''
      };

      setFormData(originalData);
      setIsEditing(false);

      toast({
        title: "Edição cancelada",
        description: "Alterações descartadas.",
      });

    } catch (cancelError) {
      console.error('Erro ao cancelar edição:', cancelError);
      setIsEditing(false);
      
      toast({
        title: "Aviso",
        description: "Edição cancelada, mas alguns dados podem não ter sido restaurados.",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <>
      <Helmet>
        <title>Meu Perfil - Professor - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/teacher/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Meu Perfil
            </h1>
          </div>
          <p className="text-slate-600">Visualize e edite suas informações pessoais</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card className="border-0 shadow-2xl bg-white backdrop-blur-sm ring-1 ring-slate-200">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-4 ring-blue-100">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Basic Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-lg text-slate-600 mb-4">{user?.email}</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-4 py-2 text-sm font-medium">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Professor
                    </Badge>
                    {formData.specialization && (
                      <Badge variant="outline" className="border-slate-300 text-slate-700 px-4 py-2 text-sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {formData.specialization}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {formatDate(user?.dateOfBirth || '')}
                      </div>
                      <div className="text-xs text-blue-600 font-medium">Data de Nasc.</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {user?.phone ? formatPhone(user.phone) : 'N/A'}
                      </div>
                      <div className="text-xs text-green-600 font-medium">Telefone</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="text-2xl font-bold text-purple-700">
                        {formData.schoolYear || 'N/A'}
                      </div>
                      <div className="text-xs text-purple-600 font-medium">Ano Lecionado</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="text-2xl font-bold text-orange-700">
                        {user?.address ? 'Sim' : 'N/A'}
                      </div>
                      <div className="text-xs text-orange-600 font-medium">Endereço</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="border-0 shadow-2xl bg-white backdrop-blur-sm ring-1 ring-slate-200">
            <CardHeader className="border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  Informações Pessoais
                </CardTitle>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "destructive" : "default"}
                  className={`gap-2 font-medium transition-all duration-200 ${
                    isEditing 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {isEditing ? "Cancelar" : "Editar Perfil"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nome */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome
                  </Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Sobrenome */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Sobrenome
                  </Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    disabled={!isEditing}
                    placeholder="(11) 99999-9999"
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </Label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    disabled={!isEditing}
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Ano Escolar que Leciona */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Ano Escolar que Leciona
                  </Label>
                  <Select 
                    value={formData.schoolYear} 
                    onValueChange={(value) => setFormData({...formData, schoolYear: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium">
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

                {/* Especialização */}
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Especialização
                  </Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Ex: Matemática, Português, Ciências..."
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Seu endereço completo"
                    className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>

                {/* Biografia */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Biografia Profissional
                  </Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Conte um pouco sobre sua experiência, formação e paixão pela educação..."
                    className="min-h-[120px] bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <>
                  <Separator className="my-8" />
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1 sm:flex-none px-8 py-3 border-red-300 text-red-700 hover:bg-red-50 font-medium"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
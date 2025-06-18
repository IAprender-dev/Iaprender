import { useState } from "react";
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
  Camera
} from "lucide-react";

export default function StudentProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone ? formatPhone(user.phone) : '',
    address: user?.address || '',
    schoolYear: user?.schoolYear || '',
    dateOfBirth: user?.dateOfBirth || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Falha ao atualizar perfil');
      }
      return res.json();
    }),
    onSuccess: (updatedUser) => {
      if (updateUser) {
        updateUser(updatedUser);
      }
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    }
  });

  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a formatação (XX) XXXXX-XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({...formData, phone: formatted});
  };

  const handleSave = () => {
    // Remove a formatação do telefone antes de enviar
    const phoneNumbers = formData.phone?.replace(/\D/g, '') || '';
    const dataToSend = {
      ...formData,
      phone: phoneNumbers
    };
    updateProfileMutation.mutate(dataToSend);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone ? formatPhone(user.phone) : '',
      address: user?.address || '',
      schoolYear: user?.schoolYear || '',
      dateOfBirth: user?.dateOfBirth || ''
    });
    setIsEditing(false);
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

  const getGradeEmoji = (schoolYear: string) => {
    if (schoolYear?.includes('1º ano fundamental')) return '🎨';
    if (schoolYear?.includes('2º ano fundamental')) return '📚';
    if (schoolYear?.includes('3º ano fundamental')) return '🔢';
    if (schoolYear?.includes('4º ano fundamental')) return '🌟';
    if (schoolYear?.includes('5º ano fundamental')) return '🌍';
    if (schoolYear?.includes('6º ano')) return '📖';
    if (schoolYear?.includes('7º ano')) return '🔬';
    if (schoolYear?.includes('8º ano')) return '🧮';
    if (schoolYear?.includes('9º ano')) return '🎓';
    if (schoolYear?.includes('médio')) return '🏆';
    return '📚';
  };

  return (
    <>
      <Helmet>
        <title>Meu Perfil - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/student/dashboard">
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
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-4 ring-blue-100">
                    <AvatarImage src="" alt={user?.firstName} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-12 h-12 p-0 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2 px-4 py-2 text-sm font-semibold">
                      <BookOpen className="h-4 w-4" />
                      Aluno
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 gap-2 px-4 py-2 text-sm font-semibold">
                      <span className="text-lg">{getGradeEmoji(user?.schoolYear || '')}</span>
                      {user?.schoolYear || 'Ano não informado'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mb-6 text-lg">
                    Membro desde {formatDate(user?.createdAt || '')}
                  </p>
                  
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 px-6 py-3 text-base font-semibold shadow-lg"
                    >
                      <Edit className="h-5 w-5" />
                      Editar Perfil
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card className="border-0 shadow-2xl bg-white backdrop-blur-sm ring-1 ring-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  Informações Pessoais
                </CardTitle>
                {isEditing && (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2 px-6 font-semibold shadow-lg"
                    >
                      <Save className="h-4 w-4" />
                      {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                    />
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                      {user?.firstName || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Sobrenome
                  </Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                    />
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-indigo-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                      {user?.lastName || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                    />
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-green-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                      {user?.email || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-600" />
                    Telefone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-purple-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                      {user?.phone ? formatPhone(user.phone) : 'Não informado'}
                    </p>
                  )}
                </div>

                {/* School Year */}
                <div className="space-y-3">
                  <Label htmlFor="schoolYear" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <School className="h-5 w-5 text-orange-600" />
                    Ano Escolar
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={formData.schoolYear} 
                      onValueChange={(value) => setFormData({...formData, schoolYear: value})}
                    >
                      <SelectTrigger className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white">
                        <SelectValue placeholder="Selecione o ano escolar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl max-h-80">
                        <div className="p-2">
                          <div className="mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental I</p>
                          </div>
                          <SelectItem value="1º ano fundamental" className="py-3 px-3 hover:bg-pink-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                🎨
                              </div>
                              <span className="font-medium text-slate-800">1º ano - Mundo das Cores</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="2º ano fundamental" className="py-3 px-3 hover:bg-green-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                📚
                              </div>
                              <span className="font-medium text-slate-800">2º ano - Aventura das Letras</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="3º ano fundamental" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                🔢
                              </div>
                              <span className="font-medium text-slate-800">3º ano - Universo dos Números</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="4º ano fundamental" className="py-3 px-3 hover:bg-orange-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                🌟
                              </div>
                              <span className="font-medium text-slate-800">4º ano - Explorando Ciências</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="5º ano fundamental" className="py-3 px-3 hover:bg-cyan-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                🌍
                              </div>
                              <span className="font-medium text-slate-800">5º ano - Descobrindo o Mundo</span>
                            </div>
                          </SelectItem>
                          
                          <div className="my-3 border-t border-slate-200"></div>
                          <div className="mb-3">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental II</p>
                          </div>
                          <SelectItem value="6º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">6</div>
                              <span className="font-medium text-slate-800">6º ano</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="7º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">7</div>
                              <span className="font-medium text-slate-800">7º ano</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="8º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">8</div>
                              <span className="font-medium text-slate-800">8º ano</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="9º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">9</div>
                              <span className="font-medium text-slate-800">9º ano</span>
                            </div>
                          </SelectItem>
                          
                          <div className="mb-3 mt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Médio</p>
                          </div>
                          <SelectItem value="1º ano médio" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
                              <span className="font-medium text-slate-800">1º ano (Ensino Médio)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="2º ano médio" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</div>
                              <span className="font-medium text-slate-800">2º ano (Ensino Médio)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="3º ano médio" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150">
                            <div className="flex items-center space-x-3">
                              <div className="w-7 h-7 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">3</div>
                              <span className="font-medium text-slate-800">3º ano (Ensino Médio)</span>
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-orange-50 p-4 rounded-xl border-2 border-slate-200 flex items-center gap-3 font-medium text-base">
                      <span className="text-2xl">{getGradeEmoji(user?.schoolYear || '')}</span>
                      {user?.schoolYear || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-3">
                  <Label htmlFor="dateOfBirth" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-pink-600" />
                    Data de Nascimento
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                    />
                  ) : (
                    <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-pink-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                      {formatDate(user?.dateOfBirth || '')}
                    </p>
                  )}
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="space-y-3">
                <Label htmlFor="address" className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  Endereço
                </Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base py-3 bg-white"
                    placeholder="Rua, número, bairro, cidade"
                  />
                ) : (
                  <p className="text-slate-800 bg-gradient-to-r from-slate-50 to-teal-50 p-4 rounded-xl border-2 border-slate-200 font-medium text-base">
                    {user?.address || 'Não informado'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="border-0 shadow-2xl bg-white backdrop-blur-sm ring-1 ring-slate-200">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-800">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                Estatísticas da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl font-black text-blue-700 mb-3">12</div>
                  <div className="text-base text-blue-700 font-bold">Cursos Concluídos</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl font-black text-green-700 mb-3">48</div>
                  <div className="text-base text-green-700 font-bold">Atividades Realizadas</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl font-black text-purple-700 mb-3">5</div>
                  <div className="text-base text-purple-700 font-bold">Certificados Obtidos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
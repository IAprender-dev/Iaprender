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
import { apiRequest } from "@/lib/queryClient";
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
    phone: user?.phone || '',
    address: user?.address || '',
    schoolYear: user?.schoolYear || '',
    dateOfBirth: user?.dateOfBirth || ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
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

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
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

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 lg:p-8">
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
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src="" alt={user?.firstName} />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-indigo-500 hover:bg-indigo-600"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white gap-2">
                      <BookOpen className="h-4 w-4" />
                      Aluno
                    </Badge>
                    <Badge variant="outline" className="gap-2 border-slate-300">
                      <span className="text-lg">{getGradeEmoji(user?.schoolYear || '')}</span>
                      {user?.schoolYear || 'Ano não informado'}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Membro desde {formatDate(user?.createdAt || '')}
                  </p>
                  
                  {!isEditing && (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Perfil
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  Informações Pessoais
                </CardTitle>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 gap-2"
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
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                    Nome
                  </Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                      {user?.firstName || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                    Sobrenome
                  </Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                      {user?.lastName || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                      {user?.email || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="border-slate-300 focus:border-blue-500"
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                      {user?.phone || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* School Year */}
                <div className="space-y-2">
                  <Label htmlFor="schoolYear" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Ano Escolar
                  </Label>
                  {isEditing ? (
                    <Select 
                      value={formData.schoolYear} 
                      onValueChange={(value) => setFormData({...formData, schoolYear: value})}
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o ano escolar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1º ano fundamental">1º ano - Mundo das Cores</SelectItem>
                        <SelectItem value="2º ano fundamental">2º ano - Aventura das Letras</SelectItem>
                        <SelectItem value="3º ano fundamental">3º ano - Universo dos Números</SelectItem>
                        <SelectItem value="4º ano fundamental">4º ano - Explorando Ciências</SelectItem>
                        <SelectItem value="5º ano fundamental">5º ano - Descobrindo o Mundo</SelectItem>
                        <SelectItem value="6º ano">6º ano</SelectItem>
                        <SelectItem value="7º ano">7º ano</SelectItem>
                        <SelectItem value="8º ano">8º ano</SelectItem>
                        <SelectItem value="9º ano">9º ano</SelectItem>
                        <SelectItem value="1º ano médio">1º ano (Ensino Médio)</SelectItem>
                        <SelectItem value="2º ano médio">2º ano (Ensino Médio)</SelectItem>
                        <SelectItem value="3º ano médio">3º ano (Ensino Médio)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border flex items-center gap-2">
                      <span className="text-lg">{getGradeEmoji(user?.schoolYear || '')}</span>
                      {user?.schoolYear || 'Não informado'}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento
                  </Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                      {formatDate(user?.dateOfBirth || '')}
                    </p>
                  )}
                </div>
              </div>

              {/* Address - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="border-slate-300 focus:border-blue-500"
                    placeholder="Rua, número, bairro, cidade"
                  />
                ) : (
                  <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border">
                    {user?.address || 'Não informado'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Estatísticas da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
                  <div className="text-sm text-blue-600 font-medium">Cursos Concluídos</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <div className="text-3xl font-bold text-green-600 mb-2">48</div>
                  <div className="text-sm text-green-600 font-medium">Atividades Realizadas</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                  <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
                  <div className="text-sm text-purple-600 font-medium">Certificados Obtidos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CalendarDays, 
  Briefcase,
  Edit3, 
  Save, 
  X, 
  BookOpen,
  Users,
  FileText,
  Target,
  Home,
  Settings,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  Star,
  Plus,
  ChevronRight
} from "lucide-react";

export default function TeacherProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    schoolYear: user?.schoolYear || '', // Para professor será especialização
    dateOfBirth: user?.dateOfBirth || ''
  });

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
      console.log('Iniciando salvamento do perfil...');
      console.log('=== DADOS EDITADOS NA TELA ===');
      console.log('formData atual:', formData);
      
      // Limpar telefone (manter apenas números)
      const cleanPhone = data.phone.replace(/\D/g, '');
      
      const dataToSend = {
        ...data,
        phone: cleanPhone
      };
      
      console.log('=== DADOS PREPARADOS PARA ENVIO ===');
      console.log('dataToSend:', dataToSend);
      
      console.log('=== DIFERENÇAS COM DADOS ORIGINAIS ===');
      console.log('Original firstName:', user?.firstName, '-> Novo:', dataToSend.firstName);
      console.log('Original lastName:', user?.lastName, '-> Novo:', dataToSend.lastName);
      console.log('Original email:', user?.email, '-> Novo:', dataToSend.email);
      console.log('Original phone:', user?.phone, '-> Novo:', dataToSend.phone);
      console.log('Original address:', user?.address, '-> Novo:', dataToSend.address);
      console.log('Original schoolYear:', user?.schoolYear, '-> Novo:', dataToSend.schoolYear);
      console.log('Original dateOfBirth:', user?.dateOfBirth, '-> Novo:', dataToSend.dateOfBirth);
      
      console.log('Enviando dados para atualização:', dataToSend);

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      console.log('Content-Type da resposta:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        throw new Error('Erro ao atualizar perfil');
      }

      const result = await response.json();
      console.log('Perfil atualizado com sucesso:', result);
      console.log('Processando sucesso da atualização:', result);
      
      return result;
    },
    onSuccess: (data) => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
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

  // Formatação de telefone em tempo real
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

  return (
    <>
      <Helmet>
        <title>Perfil do Professor - IAverse</title>
        <meta name="description" content="Perfil e configurações do professor" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex">
          {/* Sidebar Esquerda - Design do Aluno */}
          <div className="w-80 bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-xl min-h-screen">
            <div className="p-6">
              {/* Profile Section */}
              <Card className="mb-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={user?.profileImage || ''} />
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
                        Nome Completo
                      </Label>
                      {isEditing ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={formData.firstName}
                            onChange={(e) => {
                              console.log('Alterando firstName:', e.target.value);
                              setFormData(prev => ({...prev, firstName: e.target.value}));
                            }}
                            className="text-sm border-2 border-slate-300 focus:border-blue-500"
                            placeholder="Nome"
                          />
                          <Input
                            value={formData.lastName}
                            onChange={(e) => {
                              console.log('Alterando lastName:', e.target.value);
                              setFormData(prev => ({...prev, lastName: e.target.value}));
                            }}
                            className="text-sm border-2 border-slate-300 focus:border-blue-500"
                            placeholder="Sobrenome"
                          />
                        </div>
                      ) : (
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
                          onChange={(e) => {
                            console.log('Alterando email:', e.target.value);
                            setFormData(prev => ({...prev, email: e.target.value}));
                          }}
                          className="text-sm border-2 border-slate-300 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
                            console.log('Alterando telefone:', formatted);
                            setFormData(prev => ({...prev, phone: formatted}));
                          }}
                          className="text-sm border-2 border-slate-300 focus:border-blue-500"
                          placeholder="(00) 00000-0000"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
                          onChange={(e) => {
                            console.log('Alterando address:', e.target.value);
                            setFormData(prev => ({...prev, address: e.target.value}));
                          }}
                          className="text-sm border-2 border-slate-300 focus:border-blue-500"
                          placeholder="Endereço completo"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
                        <Select 
                          value={formData.schoolYear} 
                          onValueChange={(value) => {
                            console.log('Alterando schoolYear:', value);
                            setFormData(prev => ({...prev, schoolYear: value}));
                          }}
                        >
                          <SelectTrigger className="text-sm border-2 border-slate-300 focus:border-blue-500">
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
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
                          onChange={(e) => {
                            console.log('Alterando dateOfBirth:', e.target.value);
                            setFormData(prev => ({...prev, dateOfBirth: e.target.value}));
                          }}
                          className="text-sm border-2 border-slate-300 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-3 rounded-lg border-2 border-slate-200 text-sm font-medium">
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
          <div className="flex-1 p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Perfil do Professor 👩‍🏫
                  </h1>
                  <p className="text-lg text-slate-600">
                    Gerencie suas informações pessoais e configurações
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Conteúdo principal vazio ou outras configurações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Settings className="h-5 w-5" />
                    Configurações da Conta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Suas informações estão na barra lateral esquerda. 
                    Clique no ícone de edição para alterar seus dados.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Award className="h-5 w-5" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Alunos:</span>
                      <span className="font-bold">47</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aulas Criadas:</span>
                      <span className="font-bold">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Atividades:</span>
                      <span className="font-bold">156</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
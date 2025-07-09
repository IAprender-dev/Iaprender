import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  ArrowLeft,

  Plus,
  Edit,
  Eye,
  School,
  UserCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import logoIAprender from '@assets/IAprender_1750262377399.png';

interface School {
  id: number;
  name: string;
  inep: string | null;
  cnpj: string | null;
  address: string;
  city: string;
  state: string;
  numberOfStudents: number;
  numberOfTeachers: number;
  numberOfClassrooms: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  contractName: string;
  contractStatus: string;
  companyName: string;
  directorName: string | null;
  directorEmail: string | null;
}

interface Director {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  cognitoGroup: string;
  companyId: number;
  contractId: number | null;
  companyName: string;
  contractName: string | null;
  createdAt: string;
}

interface Contract {
  id: number;
  name: string;
  description: string;
  status: string;
  maxUsers: number;
  startDate: string;
  endDate: string;
}

export default function SchoolManagementNew() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [isCreatingDirector, setIsCreatingDirector] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [editingDirector, setEditingDirector] = useState<Director | null>(null);
  const [viewingSchool, setViewingSchool] = useState<School | null>(null);
  const [viewingDirector, setViewingDirector] = useState<Director | null>(null);

  // Dados das escolas
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['/api/municipal/schools/filtered'],
    queryFn: () => apiRequest('/api/municipal/schools/filtered'),
  });

  // Dados dos diretores
  const { data: directorsData, isLoading: directorsLoading } = useQuery({
    queryKey: ['/api/municipal/directors/filtered'],
    queryFn: () => apiRequest('/api/municipal/directors/filtered'),
  });

  // Dados dos contratos
  const { data: contractsData } = useQuery({
    queryKey: ['/api/municipal/contracts/filtered'],
    queryFn: () => apiRequest('/api/municipal/contracts/filtered'),
  });

  // Estados do formulário
  const [schoolFormData, setSchoolFormData] = useState({
    name: '',
    inep: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    numberOfStudents: '',
    numberOfTeachers: '',
    numberOfClassrooms: '',
    contractId: '',
  });

  const [directorFormData, setDirectorFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    contractId: '',
    password: '',
  });

  // Mutation para criar escola
  const createSchoolMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/municipal/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
      setIsCreatingSchool(false);
      setSchoolFormData({
        name: '',
        inep: '',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        numberOfStudents: '',
        numberOfTeachers: '',
        numberOfClassrooms: '',
        contractId: '',
      });
      toast({
        title: "Sucesso",
        description: "Escola criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar escola",
        variant: "destructive",
      });
    },
  });

  // Mutation para criar diretor
  const createDirectorMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/municipal/directors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/directors/filtered'] });
      setIsCreatingDirector(false);
      setDirectorFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        contractId: '',
        password: '',
      });
      toast({
        title: "Sucesso",
        description: "Diretor criado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar diretor",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar escola
  const updateSchoolMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest(`/api/municipal/schools/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
      setEditingSchool(null);
      toast({
        title: "Sucesso",
        description: "Escola atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar escola",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar diretor
  const updateDirectorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      apiRequest(`/api/municipal/directors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/directors/filtered'] });
      setEditingDirector(null);
      toast({
        title: "Sucesso",
        description: "Diretor atualizado com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar diretor",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir escola
  const deleteSchoolMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/municipal/schools/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
      toast({
        title: "Sucesso",
        description: "Escola excluída com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir escola",
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir diretor
  const deleteDirectorMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/municipal/directors/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/directors/filtered'] });
      toast({
        title: "Sucesso",
        description: "Diretor excluído com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir diretor",
        variant: "destructive",
      });
    },
  });

  const handleCreateSchool = () => {
    createSchoolMutation.mutate({
      ...schoolFormData,
      numberOfStudents: parseInt(schoolFormData.numberOfStudents) || 0,
      numberOfTeachers: parseInt(schoolFormData.numberOfTeachers) || 0,
      numberOfClassrooms: parseInt(schoolFormData.numberOfClassrooms) || 0,
      contractId: parseInt(schoolFormData.contractId),
    });
  };

  const handleCreateDirector = () => {
    createDirectorMutation.mutate({
      ...directorFormData,
      contractId: parseInt(directorFormData.contractId),
    });
  };

  // Função para confirmar exclusão de escola
  const handleDeleteSchool = (school: School) => {
    if (window.confirm(`Tem certeza que deseja excluir a escola "${school.name}"? Esta ação não pode ser desfeita.`)) {
      deleteSchoolMutation.mutate(school.id);
    }
  };

  // Função para confirmar exclusão de diretor
  const handleDeleteDirector = (director: Director) => {
    if (window.confirm(`Tem certeza que deseja excluir o diretor "${director.firstName} ${director.lastName}"? Esta ação não pode ser desfeita.`)) {
      deleteDirectorMutation.mutate(director.id);
    }
  };

  // Função para editar escola
  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
  };

  // Função para editar diretor
  const handleEditDirector = (director: Director) => {
    setEditingDirector(director);
  };

  // Função para visualizar escola
  const handleViewSchool = (school: School) => {
    setViewingSchool(school);
  };

  // Função para visualizar diretor
  const handleViewDirector = (director: Director) => {
    setViewingDirector(director);
  };

  if (schoolsLoading || directorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const schools = schoolsData?.schools || [];
  const directors = directorsData?.directors || [];
  const contracts = contractsData?.contracts || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Botão Voltar e Logo */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/gestor/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img 
                    src={logoIAprender} 
                    alt="IAprender" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                  <p className="text-sm text-gray-600">Gestão de Escolas</p>
                </div>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <nav className="flex space-x-2 text-sm">
              <span className="text-gray-500">Gestor Municipal</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-medium">Gestão de Escolas</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="schools">Escolas ({schools.length})</TabsTrigger>
            <TabsTrigger value="directors">Diretores ({directors.length})</TabsTrigger>
            <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Escolas</CardTitle>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <School className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{schools.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Escolas cadastradas</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Diretores Ativos</CardTitle>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <UserCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{directors.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Diretores cadastrados</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Alunos</CardTitle>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {schools.reduce((total, school) => total + (school.numberOfStudents || 0), 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Estudantes matriculados</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total de Professores</CardTitle>
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {schools.reduce((total, school) => total + (school.numberOfTeachers || 0), 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Professores ativos</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Escolas */}
          <TabsContent value="schools" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Escolas Cadastradas</h2>
                <p className="text-gray-600">Gerencie as escolas vinculadas aos seus contratos</p>
              </div>
              <Button
                onClick={() => setIsCreatingSchool(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Escola
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
                <Card key={school.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">{school.name}</CardTitle>
                      <Badge variant={school.isActive ? "default" : "secondary"}>
                        {school.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {school.city}, {school.state}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>{school.numberOfStudents || 0} alunos</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span>{school.numberOfTeachers || 0} professores</span>
                      </div>
                    </div>
                    
                    {school.directorName && (
                      <div className="flex items-center space-x-2 text-sm">
                        <UserCircle className="h-4 w-4 text-purple-600" />
                        <span>Dir: {school.directorName}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Contrato: {school.contractName}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleViewSchool(school)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-green-50 hover:border-green-300 transition-colors"
                        onClick={() => handleEditSchool(school)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-red-50 hover:border-red-300 transition-colors"
                        onClick={() => handleDeleteSchool(school)}
                        disabled={deleteSchoolMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Diretores */}
          <TabsContent value="directors" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Diretores Cadastrados</h2>
                <p className="text-gray-600">Gerencie os diretores das escolas</p>
              </div>
              <Button
                onClick={() => setIsCreatingDirector(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Diretor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {directors.map((director) => (
                <Card key={director.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {director.firstName} {director.lastName}
                      </CardTitle>
                      <Badge variant="outline">
                        {director.cognitoGroup}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="truncate">{director.email}</span>
                    </div>
                    
                    {director.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span>{director.phone}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">
                        Contrato: {director.contractName || 'Não atribuído'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Empresa: {director.companyName}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        onClick={() => handleViewDirector(director)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-green-50 hover:border-green-300 transition-colors"
                        onClick={() => handleEditDirector(director)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-red-50 hover:border-red-300 transition-colors"
                        onClick={() => handleDeleteDirector(director)}
                        disabled={deleteDirectorMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Ações Rápidas */}
          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Criar Nova Escola</CardTitle>
                  <p className="text-gray-600">Cadastre uma nova escola no sistema</p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsCreatingSchool(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <School className="h-4 w-4 mr-2" />
                    Criar Escola
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Adicionar Diretor</CardTitle>
                  <p className="text-gray-600">Cadastre um novo diretor</p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setIsCreatingDirector(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    Criar Diretor
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Criar Escola */}
      <Dialog open={isCreatingSchool} onOpenChange={setIsCreatingSchool}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Escola</DialogTitle>
            <DialogDescription>
              Preencha as informações da nova escola
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">Nome da Escola</Label>
              <Input
                id="schoolName"
                value={schoolFormData.name}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                placeholder="Ex: Escola Municipal ABC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inep">Código INEP</Label>
              <Input
                id="inep"
                value={schoolFormData.inep}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, inep: e.target.value })}
                placeholder="Ex: 12345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={schoolFormData.cnpj}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, cnpj: e.target.value })}
                placeholder="Ex: 12.345.678/0001-90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract">Contrato</Label>
              <Select
                value={schoolFormData.contractId}
                onValueChange={(value) => setSchoolFormData({ ...schoolFormData, contractId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={schoolFormData.address}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={schoolFormData.city}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, city: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={schoolFormData.state}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, state: e.target.value })}
                placeholder="Ex: SP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="students">Número de Alunos</Label>
              <Input
                id="students"
                type="number"
                value={schoolFormData.numberOfStudents}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, numberOfStudents: e.target.value })}
                placeholder="Ex: 500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teachers">Número de Professores</Label>
              <Input
                id="teachers"
                type="number"
                value={schoolFormData.numberOfTeachers}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, numberOfTeachers: e.target.value })}
                placeholder="Ex: 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classrooms">Número de Salas</Label>
              <Input
                id="classrooms"
                type="number"
                value={schoolFormData.numberOfClassrooms}
                onChange={(e) => setSchoolFormData({ ...schoolFormData, numberOfClassrooms: e.target.value })}
                placeholder="Ex: 20"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreatingSchool(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSchool}
              disabled={createSchoolMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createSchoolMutation.isPending ? "Criando..." : "Criar Escola"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Diretor */}
      <Dialog open={isCreatingDirector} onOpenChange={setIsCreatingDirector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Diretor</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo diretor
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Primeiro Nome</Label>
              <Input
                id="firstName"
                value={directorFormData.firstName}
                onChange={(e) => setDirectorFormData({ ...directorFormData, firstName: e.target.value })}
                placeholder="Ex: João"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={directorFormData.lastName}
                onChange={(e) => setDirectorFormData({ ...directorFormData, lastName: e.target.value })}
                placeholder="Ex: Silva"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={directorFormData.email}
                onChange={(e) => setDirectorFormData({ ...directorFormData, email: e.target.value })}
                placeholder="Ex: joao.silva@escola.edu.br"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={directorFormData.phone}
                onChange={(e) => setDirectorFormData({ ...directorFormData, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="directorContract">Contrato</Label>
              <Select
                value={directorFormData.contractId}
                onValueChange={(value) => setDirectorFormData({ ...directorFormData, contractId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="password">Senha Temporária</Label>
              <Input
                id="password"
                type="password"
                value={directorFormData.password}
                onChange={(e) => setDirectorFormData({ ...directorFormData, password: e.target.value })}
                placeholder="Senha temporária para primeiro acesso"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreatingDirector(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateDirector}
              disabled={createDirectorMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createDirectorMutation.isPending ? "Criando..." : "Criar Diretor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Visualizar Escola */}
      <Dialog open={!!viewingSchool} onOpenChange={() => setViewingSchool(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <School className="h-5 w-5 text-blue-600" />
              </div>
              <span>{viewingSchool?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas da escola
            </DialogDescription>
          </DialogHeader>
          
          {viewingSchool && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge variant={viewingSchool.isActive ? "default" : "secondary"} className="text-sm">
                  {viewingSchool.isActive ? "Escola Ativa" : "Escola Inativa"}
                </Badge>
                <div className="text-sm text-gray-500">
                  Criada em: {new Date(viewingSchool.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Nome:</span>
                      <span>{viewingSchool.name}</span>
                    </div>
                    {viewingSchool.inep && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">INEP:</span>
                        <span>{viewingSchool.inep}</span>
                      </div>
                    )}
                    {viewingSchool.cnpj && (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">CNPJ:</span>
                        <span>{viewingSchool.cnpj}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-800">Localização</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Endereço:</span>
                      <span>{viewingSchool.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Cidade:</span>
                      <span>{viewingSchool.city}, {viewingSchool.state}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-2">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{viewingSchool.numberOfStudents || 0}</div>
                      <div className="text-sm text-gray-600">Alunos</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-2">
                        <GraduationCap className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{viewingSchool.numberOfTeachers || 0}</div>
                      <div className="text-sm text-gray-600">Professores</div>
                    </div>
                    <div className="text-center">
                      <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-2">
                        <Building2 className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600">{viewingSchool.numberOfClassrooms || 0}</div>
                      <div className="text-sm text-gray-600">Salas de Aula</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diretor e Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-amber-800">Diretor Responsável</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {viewingSchool.directorName ? (
                      <>
                        <div className="flex items-center space-x-3">
                          <UserCircle className="h-4 w-4 text-amber-600" />
                          <span className="font-medium">Nome:</span>
                          <span>{viewingSchool.directorName}</span>
                        </div>
                        {viewingSchool.directorEmail && (
                          <div className="flex items-center space-x-3">
                            <Mail className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">Email:</span>
                            <span>{viewingSchool.directorEmail}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center space-x-3 text-gray-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Nenhum diretor atribuído</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-indigo-800">Informações do Contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Contrato:</span>
                      <span>{viewingSchool.contractName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Empresa:</span>
                      <span>{viewingSchool.companyName}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      Status: {viewingSchool.contractStatus}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewingSchool(null)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setViewingSchool(null);
                    setEditingSchool(viewingSchool);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Escola
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Visualizar Diretor */}
      <Dialog open={!!viewingDirector} onOpenChange={() => setViewingDirector(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <UserCircle className="h-5 w-5 text-green-600" />
              </div>
              <span>{viewingDirector && `${viewingDirector.firstName} ${viewingDirector.lastName}`}</span>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas do diretor
            </DialogDescription>
          </DialogHeader>
          
          {viewingDirector && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-sm">
                  {viewingDirector.cognitoGroup}
                </Badge>
                <div className="text-sm text-gray-500">
                  Cadastrado em: {new Date(viewingDirector.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Informações Pessoais */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <UserCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Nome Completo:</span>
                      <span>{viewingDirector.firstName} {viewingDirector.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <span className="text-blue-600">{viewingDirector.email}</span>
                    </div>
                    {viewingDirector.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Telefone:</span>
                        <span>{viewingDirector.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Grupo:</span>
                      <Badge variant="secondary">{viewingDirector.cognitoGroup}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações Profissionais */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">Informações Profissionais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Empresa:</span>
                      <span>{viewingDirector.companyName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Contrato:</span>
                      <span>{viewingDirector.contractName || 'Não atribuído'}</span>
                    </div>
                  </div>
                  
                  {viewingDirector.contractName && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-indigo-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>Diretor vinculado ao contrato: <strong>{viewingDirector.contractName}</strong></span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setViewingDirector(null)}>
                  Fechar
                </Button>
                <Button 
                  onClick={() => {
                    setViewingDirector(null);
                    setEditingDirector(viewingDirector);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Diretor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Escola */}
      <Dialog open={!!editingSchool} onOpenChange={() => setEditingSchool(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Edit className="h-5 w-5 text-green-600" />
              </div>
              <span>Editar Escola: {editingSchool?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da escola
            </DialogDescription>
          </DialogHeader>
          
          {editingSchool && (
            <EditSchoolForm
              school={editingSchool}
              contracts={contracts}
              onSave={(data) => {
                updateSchoolMutation.mutate({ id: editingSchool.id, data });
              }}
              onCancel={() => setEditingSchool(null)}
              isLoading={updateSchoolMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Diretor */}
      <Dialog open={!!editingDirector} onOpenChange={() => setEditingDirector(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Edit className="h-5 w-5 text-green-600" />
              </div>
              <span>Editar Diretor: {editingDirector && `${editingDirector.firstName} ${editingDirector.lastName}`}</span>
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do diretor
            </DialogDescription>
          </DialogHeader>
          
          {editingDirector && (
            <EditDirectorForm
              director={editingDirector}
              contracts={contracts}
              onSave={(data) => {
                updateDirectorMutation.mutate({ id: editingDirector.id, data });
              }}
              onCancel={() => setEditingDirector(null)}
              isLoading={updateDirectorMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente do formulário de edição de escola
function EditSchoolForm({ school, contracts, onSave, onCancel, isLoading }: {
  school: School;
  contracts: Contract[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: school.name,
    inep: school.inep || '',
    cnpj: school.cnpj || '',
    address: school.address,
    city: school.city,
    state: school.state,
    numberOfStudents: school.numberOfStudents.toString(),
    numberOfTeachers: school.numberOfTeachers.toString(),
    numberOfClassrooms: school.numberOfClassrooms.toString(),
    isActive: school.isActive,
  });

  const handleSubmit = () => {
    onSave({
      ...formData,
      numberOfStudents: parseInt(formData.numberOfStudents) || 0,
      numberOfTeachers: parseInt(formData.numberOfTeachers) || 0,
      numberOfClassrooms: parseInt(formData.numberOfClassrooms) || 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editSchoolName">Nome da Escola</Label>
          <Input
            id="editSchoolName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome da escola"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editInep">Código INEP</Label>
          <Input
            id="editInep"
            value={formData.inep}
            onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
            placeholder="Código INEP"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editCnpj">CNPJ</Label>
          <Input
            id="editCnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="CNPJ"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editCity">Cidade</Label>
          <Input
            id="editCity"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editState">Estado</Label>
          <Input
            id="editState"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="Estado"
          />
        </div>
        <div className="space-y-2 col-span-2">
          <Label htmlFor="editAddress">Endereço</Label>
          <Input
            id="editAddress"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Endereço completo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editStudents">Número de Alunos</Label>
          <Input
            id="editStudents"
            type="number"
            value={formData.numberOfStudents}
            onChange={(e) => setFormData({ ...formData, numberOfStudents: e.target.value })}
            placeholder="Número de alunos"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editTeachers">Número de Professores</Label>
          <Input
            id="editTeachers"
            type="number"
            value={formData.numberOfTeachers}
            onChange={(e) => setFormData({ ...formData, numberOfTeachers: e.target.value })}
            placeholder="Número de professores"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editClassrooms">Número de Salas</Label>
          <Input
            id="editClassrooms"
            type="number"
            value={formData.numberOfClassrooms}
            onChange={(e) => setFormData({ ...formData, numberOfClassrooms: e.target.value })}
            placeholder="Número de salas de aula"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editActive">Status</Label>
          <Select
            value={formData.isActive ? "true" : "false"}
            onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Ativa</SelectItem>
              <SelectItem value="false">Inativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

// Componente do formulário de edição de diretor
function EditDirectorForm({ director, contracts, onSave, onCancel, isLoading }: {
  director: Director;
  contracts: Contract[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: director.firstName,
    lastName: director.lastName,
    phone: director.phone || '',
    contractId: director.contractId?.toString() || '',
  });

  const handleSubmit = () => {
    onSave({
      ...formData,
      contractId: formData.contractId ? parseInt(formData.contractId) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="editFirstName">Primeiro Nome</Label>
          <Input
            id="editFirstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Primeiro nome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editLastName">Sobrenome</Label>
          <Input
            id="editLastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Sobrenome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editPhone">Telefone</Label>
          <Input
            id="editPhone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Telefone"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="editContract">Contrato</Label>
          <Select
            value={formData.contractId}
            onValueChange={(value) => setFormData({ ...formData, contractId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum contrato</SelectItem>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id.toString()}>
                  {contract.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center space-x-2 text-sm text-blue-700">
          <CheckCircle className="h-4 w-4" />
          <span>Email: <strong>{director.email}</strong> (não editável)</span>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
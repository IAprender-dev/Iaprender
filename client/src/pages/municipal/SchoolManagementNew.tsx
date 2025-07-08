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
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
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
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
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
    </div>
  );
}
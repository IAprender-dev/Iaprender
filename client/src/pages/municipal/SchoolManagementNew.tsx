import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { School, Building2, Users, GraduationCap, MapPin, Phone, Mail, Calendar, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2, ArrowLeft, UserPlus, Eye, UserCircle } from 'lucide-react';
import { Link } from 'wouter';
import iAprenderLogo from '@assets/IAprender_1750262377399.png';

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
  status: string;
  isActive: boolean;
  createdAt: string;
  contractName: string;
  contractStatus: string;
  companyName: string;
  directorName: string | null;
  directorEmail: string | null;
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

interface Director {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
  contractId: number | null;
  contractName: string | null;
}

export default function SchoolManagementNew() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'contracts' | 'directors' | 'schools'>('overview');
  const [isEditDirectorDialogOpen, setIsEditDirectorDialogOpen] = useState(false);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [directorEditData, setDirectorEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contractId: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state para criação de escola
  const [formData, setFormData] = useState({
    name: '',
    inep: '',
    cnpj: '',
    contractId: '',
    address: '',
    neighborhood: '',
    city: '',
    state: 'RS',
    zipCode: '',
    phone: '',
    email: '',
    foundationDate: '',
    numberOfClassrooms: 0,
    numberOfStudents: 0,
    numberOfTeachers: 0,
    zone: 'urbana',
    type: 'municipal',
    directorOption: 'existing', // 'create' ou 'existing'
    existingDirectorId: '',
    directorData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });

  // Queries para dados filtrados pela empresa do usuário logado
  const { data: companyData } = useQuery({
    queryKey: ['/api/municipal/company/info'],
    enabled: true
  });

  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/municipal/contracts/filtered'],
    enabled: true
  });

  const { data: directorsData, isLoading: directorsLoading } = useQuery({
    queryKey: ['/api/municipal/directors/filtered'],
    enabled: true
  });

  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['/api/municipal/schools/filtered'],
    enabled: true
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/municipal/stats'],
    enabled: true
  });

  // Mutation para criar escola
  const createSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      const response = await apiRequest('POST', '/api/municipal/schools/create', schoolData);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Escola criada com sucesso!",
        description: "A nova escola foi registrada no sistema.",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        inep: '',
        cnpj: '',
        contractId: '',
        address: '',
        neighborhood: '',
        city: '',
        state: 'RS',
        zipCode: '',
        phone: '',
        email: '',
        foundationDate: '',
        numberOfClassrooms: 0,
        numberOfTeachers: 0,
        numberOfStudents: 0,
        zone: 'urbana',
        type: 'municipal',
        directorOption: 'existing',
        existingDirectorId: '',
        directorData: {
          firstName: '',
          lastName: '',
          email: '',
          phone: ''
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar escola",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar escola
  const editSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      return apiRequest(`/api/municipal/schools/${selectedSchool?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Escola atualizada com sucesso!",
        description: `As informações da escola foram atualizadas.`,
        variant: "default",
      });
      setIsEditDialogOpen(false);
      setSelectedSchool(null);
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar escola",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar diretor
  const editDirectorMutation = useMutation({
    mutationFn: async (directorData: any) => {
      return apiRequest(`/api/municipal/directors/${selectedDirector?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directorData),
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Diretor atualizado com sucesso!",
        description: `As informações do diretor foram atualizadas.`,
        variant: "default",
      });
      setIsEditDirectorDialogOpen(false);
      setSelectedDirector(null);
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/directors/filtered'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/filtered'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar diretor",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.contractId || !formData.address) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, contrato e endereço da escola.",
        variant: "destructive",
      });
      return;
    }

    if (formData.directorOption === 'existing' && !formData.existingDirectorId) {
      toast({
        title: "Diretor obrigatório",
        description: "Selecione um diretor existente.",
        variant: "destructive",
      });
      return;
    }

    // Determinar se é criação ou edição
    const isEditing = selectedSchool !== null;
    
    const schoolData = {
      ...formData,
      numberOfClassrooms: Number(formData.numberOfClassrooms),
      numberOfStudents: Number(formData.numberOfStudents),
      numberOfTeachers: Number(formData.numberOfTeachers),
      contractId: Number(formData.contractId),
      existingDirectorId: (formData.existingDirectorId && formData.existingDirectorId !== 'none') ? Number(formData.existingDirectorId) : null,
    };

    if (isEditing) {
      editSchoolMutation.mutate(schoolData);
    } else {
      createSchoolMutation.mutate(schoolData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDirectorDataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      directorData: { ...prev.directorData, [field]: value }
    }));
  };

  // Funções para visualizar e editar escolas
  const handleViewSchool = (school: School) => {
    setSelectedSchool(school);
    setIsViewDialogOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      inep: school.inep || '',
      cnpj: school.cnpj || '',
      contractId: school.contractId?.toString() || '',
      address: school.address,
      neighborhood: '',
      city: school.city,
      state: school.state,
      zipCode: '',
      phone: '',
      email: '',
      foundationDate: '',
      numberOfClassrooms: 0,
      numberOfStudents: school.numberOfStudents || 0,
      numberOfTeachers: school.numberOfTeachers || 0,
      zone: 'urbana',
      type: 'municipal',
      directorOption: 'existing',
      existingDirectorId: school.directorUserId?.toString() || '',
      directorData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      }
    });
    setIsEditDialogOpen(true);
  };

  // Funções para editar diretor
  const handleEditDirector = (director: Director) => {
    setSelectedDirector(director);
    setDirectorEditData({
      firstName: director.firstName,
      lastName: director.lastName,
      email: director.email,
      contractId: director.contractId?.toString() || 'none'
    });
    setIsEditDirectorDialogOpen(true);
  };

  const handleDirectorEditChange = (field: string, value: string) => {
    setDirectorEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleDirectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directorEditData.firstName || !directorEditData.lastName || !directorEditData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, sobrenome e email do diretor.",
        variant: "destructive",
      });
      return;
    }

    editDirectorMutation.mutate({
      firstName: directorEditData.firstName,
      lastName: directorEditData.lastName,
      email: directorEditData.email,
      contractId: (directorEditData.contractId && directorEditData.contractId !== 'none') ? Number(directorEditData.contractId) : null,
    });
  };

  const company = companyData?.company || {};
  const user = companyData?.user || {};
  const contracts = contractsData?.contracts || [];
  const directors = directorsData?.directors || [];
  const schools = schoolsData?.schools || [];
  const stats = statsData?.stats || {};

  const availableDirectors = directors.filter((director: Director) => 
    !schools.some((school: School) => school.directorEmail === director.email)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/gestor/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img src={iAprenderLogo} alt="IAprender" className="w-8 h-8 bg-white p-1 rounded shadow" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestão de Escolas</h1>
                <p className="text-sm text-gray-600">{company.name || 'Carregando empresa...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Building2 },
              { id: 'contracts', label: 'Contratos', icon: School },
              { id: 'directors', label: 'Diretores', icon: Users },
              { id: 'schools', label: 'Escolas', icon: GraduationCap },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Visão Geral */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Escolas</CardTitle>
                  <School className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSchools || 0}</div>
                  <p className="text-xs text-muted-foreground">Escolas cadastradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contracts.filter(c => c.status === 'active').length}</div>
                  <p className="text-xs text-muted-foreground">De {contracts.length} contratos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diretores</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{directors.length}</div>
                  <p className="text-xs text-muted-foreground">{availableDirectors.length} disponíveis</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">Estudantes atendidos</p>
                </CardContent>
              </Card>
            </div>

            {/* Ações rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Principais funcionalidades do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4" />
                        Nova Escola
                      </Button>
                    </DialogTrigger>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTab('contracts')}
                    className="flex items-center gap-2"
                  >
                    <School className="w-4 h-4" />
                    Ver Contratos
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTab('directors')}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Ver Diretores
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Aba Contratos */}
        {selectedTab === 'contracts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Contratos</h2>
                <p className="text-gray-600">Contratos de {company.name || 'sua empresa'}</p>
              </div>
            </div>

            {contractsLoading ? (
              <div className="text-center py-8">Carregando contratos...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contracts.map((contract: Contract) => (
                  <Card key={contract.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {contract.name}
                        <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{contract.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Máximo de usuários:</span>
                          <span className="font-medium">{contract.maxUsers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Início:</span>
                          <span className="font-medium">{new Date(contract.startDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Término:</span>
                          <span className="font-medium">{new Date(contract.endDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba Diretores */}
        {selectedTab === 'directors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Diretores</h2>
                <p className="text-gray-600">Diretores vinculados a {company.name || 'sua empresa'}</p>
              </div>
            </div>

            {directorsLoading ? (
              <div className="text-center py-8">Carregando diretores...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {directors.map((director: Director) => {
                  const isAvailable = availableDirectors.some(d => d.id === director.id);
                  return (
                    <Card key={director.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{director.firstName} {director.lastName}</span>
                          <Badge variant={isAvailable ? 'default' : 'secondary'}>
                            {isAvailable ? 'Disponível' : 'Em uso'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{director.email}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Contrato:</span>
                            <span className="font-medium">{director.contractName || 'Não atribuído'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-orange-600'}`}>
                              {isAvailable ? 'Livre para atribuição' : 'Dirigindo escola'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Aba Escolas */}
        {selectedTab === 'schools' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Escolas</h2>
                <p className="text-gray-600">Escolas de {company.name || 'sua empresa'}</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Escola
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {schoolsLoading ? (
              <div className="text-center py-8">Carregando escolas...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map((school: School) => (
                  <Card key={school.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-base">{school.name}</span>
                        <Badge variant={school.isActive ? 'default' : 'secondary'}>
                          {school.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {school.city}, {school.state}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Contrato:</span>
                          <span className="font-medium">{school.contractName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Diretor:</span>
                          <span className="font-medium">{school.directorName || 'Não atribuído'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Alunos:</span>
                          <span className="font-medium">{school.numberOfStudents}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Professores:</span>
                          <span className="font-medium">{school.numberOfTeachers}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSchool(school)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditSchool(school)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialog para criar escola */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Escola</DialogTitle>
          <DialogDescription>
            Cadastre uma nova escola para {company.name || 'sua empresa'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Escola *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Escola Estadual Prof. João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractId">Contrato *</Label>
              <Select value={formData.contractId} onValueChange={(value) => handleInputChange('contractId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract: Contract) => (
                    <SelectItem key={contract.id} value={contract.id.toString()}>
                      {contract.name} - {contract.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inep">Código INEP</Label>
              <Input
                id="inep"
                value={formData.inep}
                onChange={(e) => handleInputChange('inep', e.target.value)}
                placeholder="Ex: 43000001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Nome da cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(51) 9999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="escola@educacao.rs.gov.br"
                />
              </div>
            </div>
          </div>

          {/* Números */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfClassrooms">Salas de Aula</Label>
                <Input
                  id="numberOfClassrooms"
                  type="number"
                  value={formData.numberOfClassrooms}
                  onChange={(e) => handleInputChange('numberOfClassrooms', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfStudents">Número de Alunos</Label>
                <Input
                  id="numberOfStudents"
                  type="number"
                  value={formData.numberOfStudents}
                  onChange={(e) => handleInputChange('numberOfStudents', Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfTeachers">Número de Professores</Label>
                <Input
                  id="numberOfTeachers"
                  type="number"
                  value={formData.numberOfTeachers}
                  onChange={(e) => handleInputChange('numberOfTeachers', Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Diretor */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Diretor</h3>
            <div className="space-y-2">
              <Label htmlFor="existingDirectorId">Diretor *</Label>
              <Select value={formData.existingDirectorId} onValueChange={(value) => handleInputChange('existingDirectorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um diretor disponível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecionar diretor</SelectItem>
                  {availableDirectors.map((director: Director) => (
                    <SelectItem key={director.id} value={director.id.toString()}>
                      {director.firstName} {director.lastName} - {director.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createSchoolMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createSchoolMutation.isPending ? 'Criando...' : 'Criar Escola'}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Escola */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-600" />
              Detalhes da Escola
            </DialogTitle>
            <DialogDescription>
              Informações completas da escola selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchool && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nome da Escola</Label>
                    <p className="text-gray-900 font-medium">{selectedSchool.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">INEP</Label>
                    <p className="text-gray-900">{selectedSchool.inep || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                    <p className="text-gray-900">{selectedSchool.cnpj || 'Não informado'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div>
                      <Badge variant={selectedSchool.isActive ? 'default' : 'secondary'}>
                        {selectedSchool.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Contrato</Label>
                    <p className="text-gray-900">{selectedSchool.contractName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Diretor</Label>
                    <p className="text-gray-900">{selectedSchool.directorName || 'Não atribuído'}</p>
                    {selectedSchool.directorEmail && (
                      <p className="text-sm text-gray-600">{selectedSchool.directorEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Endereço</Label>
                    <p className="text-gray-900">{selectedSchool.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Cidade / Estado</Label>
                    <p className="text-gray-900">{selectedSchool.city}, {selectedSchool.state}</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Números da Escola</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedSchool.numberOfStudents}</div>
                    <div className="text-sm text-gray-600">Alunos</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedSchool.numberOfTeachers}</div>
                    <div className="text-sm text-gray-600">Professores</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">-</div>
                    <div className="text-sm text-gray-600">Salas</div>
                  </div>
                </div>
              </div>

              {/* Data de Criação */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  Criada em {new Date(selectedSchool.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedSchool) handleEditSchool(selectedSchool);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Escola
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Escola */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-emerald-600" />
              Editar Escola
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da escola {selectedSchool?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome da Escola *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo da escola"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contractId">Contrato *</Label>
                  <Select value={formData.contractId} onValueChange={(value) => handleInputChange('contractId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contracts.map((contract: Contract) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                          {contract.name} - {contract.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-inep">Código INEP</Label>
                  <Input
                    id="edit-inep"
                    value={formData.inep}
                    onChange={(e) => handleInputChange('inep', e.target.value)}
                    placeholder="00000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input
                    id="edit-cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Localização</h3>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Endereço *</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">CEP</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Números */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-numberOfStudents">Número de Alunos</Label>
                  <Input
                    id="edit-numberOfStudents"
                    type="number"
                    value={formData.numberOfStudents}
                    onChange={(e) => handleInputChange('numberOfStudents', Number(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-numberOfTeachers">Número de Professores</Label>
                  <Input
                    id="edit-numberOfTeachers"
                    type="number"
                    value={formData.numberOfTeachers}
                    onChange={(e) => handleInputChange('numberOfTeachers', Number(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-numberOfClassrooms">Salas de Aula</Label>
                  <Input
                    id="edit-numberOfClassrooms"
                    type="number"
                    value={formData.numberOfClassrooms}
                    onChange={(e) => handleInputChange('numberOfClassrooms', Number(e.target.value))}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Gestão do Diretor */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Gestão do Diretor</h3>
              <div className="space-y-2">
                <Label htmlFor="edit-existingDirectorId">Diretor Atual *</Label>
                <Select value={formData.existingDirectorId} onValueChange={(value) => handleInputChange('existingDirectorId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um diretor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecionar diretor</SelectItem>
                    {availableDirectors.map((director: Director) => (
                      <SelectItem key={director.id} value={director.id.toString()}>
                        {director.firstName} {director.lastName} - {director.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Informações do diretor selecionado */}
              {formData.existingDirectorId && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-900">Informações do Diretor Selecionado</h4>
                    {(() => {
                      const selectedDirector = availableDirectors.find(d => d.id.toString() === formData.existingDirectorId);
                      if (selectedDirector) {
                        return (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDirector(selectedDirector)}
                            className="text-blue-700 border-blue-300 hover:bg-blue-100"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar Diretor
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  {(() => {
                    const selectedDirector = availableDirectors.find(d => d.id.toString() === formData.existingDirectorId);
                    if (selectedDirector) {
                      return (
                        <div className="text-sm text-blue-800">
                          <p><strong>Nome:</strong> {selectedDirector.firstName} {selectedDirector.lastName}</p>
                          <p><strong>Email:</strong> {selectedDirector.email}</p>
                          <p><strong>Contrato:</strong> {selectedDirector.contractName || 'Não vinculado'}</p>
                        </div>
                      );
                    }
                    return <p className="text-sm text-blue-800">Diretor não encontrado</p>;
                  })()}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={editSchoolMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {editSchoolMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição do Diretor */}
      <Dialog open={isEditDirectorDialogOpen} onOpenChange={setIsEditDirectorDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-blue-600" />
              Editar Informações do Diretor
            </DialogTitle>
            <DialogDescription>
              Atualize as informações pessoais e contratuais do diretor {selectedDirector?.firstName} {selectedDirector?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDirectorSubmit} className="space-y-6">
            {/* Informações Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="director-firstName">Nome *</Label>
                  <Input
                    id="director-firstName"
                    value={directorEditData.firstName}
                    onChange={(e) => handleDirectorEditChange('firstName', e.target.value)}
                    placeholder="Nome do diretor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director-lastName">Sobrenome *</Label>
                  <Input
                    id="director-lastName"
                    value={directorEditData.lastName}
                    onChange={(e) => handleDirectorEditChange('lastName', e.target.value)}
                    placeholder="Sobrenome do diretor"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="director-email">Email *</Label>
                <Input
                  id="director-email"
                  type="email"
                  value={directorEditData.email}
                  onChange={(e) => handleDirectorEditChange('email', e.target.value)}
                  placeholder="email@diretor.com"
                  required
                />
              </div>
            </div>

            {/* Informações Contratuais */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Contratuais</h3>
              <div className="space-y-2">
                <Label htmlFor="director-contractId">Contrato Vinculado</Label>
                <Select value={directorEditData.contractId} onValueChange={(value) => handleDirectorEditChange('contractId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem contrato específico</SelectItem>
                    {contracts.map((contract: Contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        {contract.name} - {contract.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {directorEditData.contractId && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Informação:</strong> O diretor será vinculado ao contrato selecionado e terá acesso apenas às funcionalidades deste contrato específico.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDirectorDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={editDirectorMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editDirectorMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
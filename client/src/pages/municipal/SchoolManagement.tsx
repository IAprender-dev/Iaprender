import { useState } from 'react';
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
import { School, Building2, Users, GraduationCap, MapPin, Phone, Mail, Calendar, AlertTriangle, CheckCircle, XCircle, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
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
  status: string;
  maxUsers: number;
  startDate: string;
  endDate: string;
}

export default function SchoolManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for creating school
  const [formData, setFormData] = useState({
    name: '',
    inep: '',
    cnpj: '',
    contractId: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    foundationDate: '',
    numberOfClassrooms: 0,
    numberOfStudents: 0,
    numberOfTeachers: 0,
    zone: '',
    type: 'municipal',
    directorOption: 'create', // 'create' ou 'existing'
    existingDirectorId: '',
    directorData: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });

  // Estado para diretores existentes
  const [availableDirectors, setAvailableDirectors] = useState<any[]>([]);

  // Queries
  const { data: schools, isLoading: schoolsLoading } = useQuery({
    queryKey: ['/api/municipal/schools'],
  });

  const { data: contractsResponse } = useQuery({
    queryKey: ['/api/municipal/contracts/available'],
  });

  const { data: schoolStats } = useQuery({
    queryKey: ['/api/municipal/schools/stats'],
  });

  // Query para buscar diretores disponíveis
  const { data: directorsData } = useQuery({
    queryKey: ['/api/municipal/available-directors'],
  });

  // Mutations
  const createSchoolMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/municipal/schools', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/stats'] });
      setIsCreateDialogOpen(false);
      resetForm();
      
      if (data.director) {
        toast({
          title: "Escola Criada com Sucesso!",
          description: `Escola "${formData.name}" foi criada e o diretor foi automaticamente criado no sistema.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Escola Criada!",
          description: data.warning || `Escola "${formData.name}" foi criada com sucesso.`,
          variant: data.warning ? "destructive" : "default",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Criar Escola",
        description: error.message || "Ocorreu um erro ao criar a escola.",
        variant: "destructive",
      });
    },
  });

  const deactivateSchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      return await apiRequest(`/api/municipal/schools/${schoolId}/deactivate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools/stats'] });
      toast({
        title: "Escola Desativada",
        description: "Escola, usuários e contrato foram desativados com sucesso.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao Desativar Escola",
        description: error.message || "Ocorreu um erro ao desativar a escola.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      inep: '',
      cnpj: '',
      contractId: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      foundationDate: '',
      numberOfClassrooms: 0,
      numberOfStudents: 0,
      numberOfTeachers: 0,
      zone: '',
      type: 'municipal',
      directorOption: 'create',
      existingDirectorId: '',
      directorData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      }
    });
  };

  const handleCreateSchool = () => {
    if (!formData.name || !formData.contractId || !formData.address || !formData.city || !formData.state) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha todos os campos obrigatórios: Nome, Contrato, Endereço, Cidade e Estado.",
        variant: "destructive",
      });
      return;
    }

    createSchoolMutation.mutate(formData);
  };

  const handleDeactivateSchool = (school: School) => {
    if (window.confirm(`Tem certeza que deseja desativar a escola "${school.name}"? Esta ação desativará também o contrato e tornará os dados inacessíveis.`)) {
      deactivateSchoolMutation.mutate(school.id);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive || status === 'inactive') {
      return <Badge variant="destructive">Inativa</Badge>;
    }
    return <Badge variant="default">Ativa</Badge>;
  };

  // Contratos já filtrados pela empresa do gestor (ID da empresa não é exposto no frontend)
  const availableContracts = contractsResponse?.contracts || [];

  if (schoolsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Back Button, Logo and Brand */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {/* Left side: Back button and branding */}
          <div className="flex items-center space-x-4">
            <Link href="/gestor/dashboard">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-sm border">
                <img 
                  src={iAprenderLogo} 
                  alt="IAprender Logo" 
                  className="h-8 w-auto"
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
          
          {/* Right side: Title and description */}
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">Gestão de Escolas Municipais</h2>
            <p className="text-gray-600">Gerencie as escolas vinculadas aos seus contratos</p>
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Escolas Cadastradas</h3>
          <p className="text-gray-600">Visualize e gerencie todas as escolas municipais</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Escola
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Escola</DialogTitle>
              <DialogDescription>
                Cada escola representa um contrato específico para liberação de acesso aos tokens de IA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Escola *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Escola Municipal João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractId">Contrato Vinculado *</Label>
                    <Select 
                      value={formData.contractId} 
                      onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato disponível" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContracts.map((contract: Contract) => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            {contract.name} (Máx: {contract.maxUsers} usuários)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Apenas contratos ativos da sua empresa são exibidos
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="inep">Código INEP</Label>
                    <Input
                      id="inep"
                      value={formData.inep}
                      onChange={(e) => setFormData({ ...formData, inep: e.target.value })}
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>

              {/* Opções do Diretor */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Designação do Diretor</h3>
                
                {/* Opção: Criar Novo ou Vincular Existente */}
                <div className="flex space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="directorOption"
                      value="create"
                      checked={formData.directorOption === 'create'}
                      onChange={(e) => setFormData({...formData, directorOption: e.target.value, existingDirectorId: ''})}
                      className="text-emerald-600"
                    />
                    <span className="text-sm font-medium">Criar Novo Diretor</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="directorOption"
                      value="existing"
                      checked={formData.directorOption === 'existing'}
                      onChange={(e) => setFormData({...formData, directorOption: e.target.value})}
                      className="text-emerald-600"
                    />
                    <span className="text-sm font-medium">Vincular Diretor Existente</span>
                  </label>
                </div>

                {/* Formulário para Novo Diretor */}
                {formData.directorOption === 'create' && (
                  <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="text-sm font-medium text-emerald-700">Dados do Novo Diretor</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="directorFirstName">Nome *</Label>
                        <Input
                          id="directorFirstName"
                          value={formData.directorData.firstName}
                          onChange={(e) => setFormData({...formData, directorData: {...formData.directorData, firstName: e.target.value}})}
                          placeholder="João"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="directorLastName">Sobrenome *</Label>
                        <Input
                          id="directorLastName"
                          value={formData.directorData.lastName}
                          onChange={(e) => setFormData({...formData, directorData: {...formData.directorData, lastName: e.target.value}})}
                          placeholder="Silva"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="directorEmail">Email *</Label>
                        <Input
                          id="directorEmail"
                          type="email"
                          value={formData.directorData.email}
                          onChange={(e) => setFormData({...formData, directorData: {...formData.directorData, email: e.target.value}})}
                          placeholder="diretor@escola.edu.br"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="directorPhone">Telefone</Label>
                      <Input
                        id="directorPhone"
                        value={formData.directorData.phone}
                        onChange={(e) => setFormData({...formData, directorData: {...formData.directorData, phone: e.target.value}})}
                        placeholder="(51) 99999-9999"
                      />
                    </div>
                    
                    <div className="text-xs text-emerald-600 bg-emerald-100 p-2 rounded">
                      <strong>Nota:</strong> O diretor será criado automaticamente no sistema AWS Cognito com acesso à empresa e ao contrato selecionado.
                    </div>
                  </div>
                )}

                {/* Seleção de Diretor Existente */}
                {formData.directorOption === 'existing' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-700">Selecionar Diretor Existente</h4>
                    
                    <div>
                      <Label htmlFor="existingDirector">Diretor Disponível</Label>
                      <Select 
                        value={formData.existingDirectorId} 
                        onValueChange={(value) => setFormData({...formData, existingDirectorId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um diretor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {directorsData?.directors?.map((director: any) => (
                            <SelectItem key={director.id} value={director.id.toString()}>
                              {director.firstName} {director.lastName} ({director.email})
                              {director.currentSchool && (
                                <span className="text-xs text-gray-500 ml-2">
                                  - Atualmente em: {director.currentSchool}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                          {(!directorsData?.directors || directorsData.directors.length === 0) && (
                            <SelectItem value="none" disabled>
                              Nenhum diretor disponível
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                      <strong>Nota:</strong> Diretores já vinculados a outras escolas podem ser transferidos. O acesso será automaticamente atualizado para o novo contrato.
                    </div>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informações Pedagógicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="numberOfStudents">Número de Alunos</Label>
                    <Input
                      id="numberOfStudents"
                      type="number"
                      value={formData.numberOfStudents}
                      onChange={(e) => setFormData({ ...formData, numberOfStudents: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfTeachers">Número de Professores</Label>
                    <Input
                      id="numberOfTeachers"
                      type="number"
                      value={formData.numberOfTeachers}
                      onChange={(e) => setFormData({ ...formData, numberOfTeachers: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numberOfClassrooms">Número de Salas</Label>
                    <Input
                      id="numberOfClassrooms"
                      type="number"
                      value={formData.numberOfClassrooms}
                      onChange={(e) => setFormData({ ...formData, numberOfClassrooms: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateSchool}
                disabled={createSchoolMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createSchoolMutation.isPending ? 'Criando...' : 'Criar Escola'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {schoolStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Escolas</CardTitle>
              <Building2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.stats?.totalSchools || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.stats?.activeSchools || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.stats?.totalStudents || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{schoolStats.stats?.totalTeachers || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schools List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Escolas Cadastradas</h2>
        
        {(!schools?.schools || schools.schools.length === 0) ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhuma escola cadastrada</h3>
              <p className="text-gray-500 mb-4">
                Comece criando sua primeira escola vinculada a um contrato.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Escola
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.schools.map((school: School) => (
              <Card key={school.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold">{school.name}</CardTitle>
                      <CardDescription>{school.city}, {school.state}</CardDescription>
                    </div>
                    {getStatusBadge(school.status, school.isActive)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {school.address}
                  </div>
                  
                  {school.directorName && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Diretor: {school.directorName}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-3 h-3 mr-1" />
                      {school.numberOfStudents} alunos
                    </div>
                    <div className="flex items-center text-gray-600">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      {school.numberOfTeachers} professores
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Contrato: {school.contractName}
                    </p>
                    <Badge variant={school.contractStatus === 'active' ? 'default' : 'destructive'} className="mt-1 text-xs">
                      {school.contractStatus === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    {school.isActive && school.status === 'active' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivateSchool(school)}
                        disabled={deactivateSchoolMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Desativar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit2, Users, Building, MapPin, Phone, Mail, Calendar, Hash } from 'lucide-react';

interface School {
  id: number;
  name: string;
  inep?: string;
  cnpj?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  numberOfClassrooms: number;
  numberOfStudents: number;
  numberOfTeachers: number;
  status: string;
  contractId: number;
  contractName: string;
  directorUserId?: number;
  directorEmail?: string;
  directorName?: string;
}

interface Director {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contractId?: number;
}

interface Contract {
  id: number;
  name: string;
  status: string;
}

interface FormData {
  name: string;
  inep: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  numberOfClassrooms: number;
  numberOfStudents: number;
  numberOfTeachers: number;

  contractId: string;
  existingDirectorId: string;
}

const initialFormData: FormData = {
  name: '',
  inep: '',
  cnpj: '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  numberOfClassrooms: 0,
  numberOfStudents: 0,
  numberOfTeachers: 0,

  contractId: '',
  existingDirectorId: '',
};

export default function SchoolManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados do formulário
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Queries
  const { data: statsData } = useQuery({
    queryKey: ['/api/municipal/stats'],
  });

  const { data: contractsData } = useQuery({
    queryKey: ['/api/municipal/contracts/filtered'],
  });

  const { data: directorsData } = useQuery({
    queryKey: ['/api/municipal/directors/filtered'],
  });

  const { data: schoolsData, refetch: refetchSchools } = useQuery({
    queryKey: ['/api/municipal/schools/filtered'],
  });

  // Mutations
  const createSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      const response = await apiRequest('/api/municipal/schools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar escola');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Escola criada com sucesso!",
        description: "A nova escola foi adicionada ao sistema.",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      refetchSchools();
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar escola",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      const response = await apiRequest(`/api/municipal/schools/${selectedSchool?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar escola');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Escola atualizada com sucesso!",
        description: "As informações da escola foram salvas.",
      });
      setIsEditDialogOpen(false);
      setSelectedSchool(null);
      resetForm();
      refetchSchools();
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar escola",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funções auxiliares
  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name || !formData.contractId || !formData.address) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, contrato e endereço da escola.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.existingDirectorId || formData.existingDirectorId === 'none') {
      toast({
        title: "Diretor obrigatório",
        description: "Selecione um diretor para a escola.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados para envio (removendo campos opcionais vazios)
    const schoolData = {
      name: formData.name,
      inep: formData.inep || undefined,
      cnpj: formData.cnpj || undefined,
      address: formData.address,
      neighborhood: formData.neighborhood || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      numberOfClassrooms: Number(formData.numberOfClassrooms),
      numberOfStudents: Number(formData.numberOfStudents),
      numberOfTeachers: Number(formData.numberOfTeachers),
      contractId: Number(formData.contractId),
      existingDirectorId: Number(formData.existingDirectorId),
    };

    // Determinar se é criação ou edição
    if (selectedSchool) {
      updateSchoolMutation.mutate(schoolData);
    } else {
      createSchoolMutation.mutate(schoolData);
    }
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      inep: school.inep || '',
      cnpj: school.cnpj || '',
      address: school.address,
      neighborhood: school.neighborhood || '',
      city: school.city || '',
      state: school.state || '',
      zipCode: school.zipCode || '',
      phone: school.phone || '',
      email: school.email || '',
      numberOfClassrooms: school.numberOfClassrooms,
      numberOfStudents: school.numberOfStudents,
      numberOfTeachers: school.numberOfTeachers,
      contractId: school.contractId.toString(),
      existingDirectorId: school.directorUserId?.toString() || 'none',
    });
    setIsEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setSelectedSchool(null);
    setIsCreateDialogOpen(true);
  };

  // Dados processados
  const stats = statsData?.stats || {};
  const contracts = contractsData?.contracts || [];
  const directors = directorsData?.directors || [];
  const schools = schoolsData?.schools || [];

  // Filtrar diretores disponíveis (que não estão vinculados a outras escolas)
  const availableDirectors = directors.filter((director: Director) => 
    !schools.some((school: School) => school.directorEmail === director.email && school.id !== selectedSchool?.id)
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
              <div className="w-8 h-8 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                <img 
                  src="/attached_assets/IAprender Logo_1751743080748.png" 
                  alt="IAprender" 
                  className="w-6 h-6"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gestão de Escolas</h1>
                <p className="text-sm text-gray-500">Gerenciar escolas municipais</p>
              </div>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Escola
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Escolas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSchools || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeSchools || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalTeachers || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Escolas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Escolas Cadastradas</h2>
          {schools.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma escola cadastrada</h3>
                <p className="text-gray-500 mb-4">Comece criando sua primeira escola</p>
                <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Escola
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school: School) => (
                <Card key={school.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{school.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">{school.contractName}</p>
                      </div>
                      <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                        {school.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{school.address}</span>
                    </div>
                    
                    {school.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    
                    {school.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{school.email}</span>
                      </div>
                    )}
                    
                    {school.inep && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash className="w-4 h-4" />
                        <span>INEP: {school.inep}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{school.numberOfStudents}</div>
                        <div className="text-xs text-gray-500">Alunos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{school.numberOfTeachers}</div>
                        <div className="text-xs text-gray-500">Professores</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{school.numberOfClassrooms}</div>
                        <div className="text-xs text-gray-500">Salas</div>
                      </div>
                    </div>
                    
                    {school.directorName && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600">
                          <strong>Diretor:</strong> {school.directorName}
                        </div>
                        <div className="text-xs text-gray-500">{school.directorEmail}</div>
                      </div>
                    )}
                    
                    <div className="pt-3">
                      <Button 
                        onClick={() => handleEditSchool(school)} 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar Escola
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedSchool(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSchool ? 'Editar Escola' : 'Nova Escola'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Escola *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome completo da escola"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractId">Contrato *</Label>
                  <Select value={formData.contractId} onValueChange={(value) => handleInputChange('contractId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecionar contrato</SelectItem>
                      {contracts.map((contract: Contract) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                          {contract.name}
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
                    placeholder="00000000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                

              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
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
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="UF"
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

            {/* Informações Numéricas */}
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
                <Label htmlFor="existingDirectorId">Diretor da Escola *</Label>
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
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedSchool(null);
                resetForm();
              }}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createSchoolMutation.isPending || updateSchoolMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createSchoolMutation.isPending || updateSchoolMutation.isPending ? 'Salvando...' : 
                 selectedSchool ? 'Salvar Alterações' : 'Criar Escola'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
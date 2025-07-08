import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield, GraduationCap, ArrowLeft, Eye, Edit } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  cognitoGroup: string;
  cognitoStatus: string;
  companyId: number;
  contractId?: number;
  companyName?: string;
  contractName?: string;
}

interface Company {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  schoolName: string;
  contractNumber: string;
}

const UserManagementGestor = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedContract, setSelectedContract] = useState('');

  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: '',
    companyId: '',
    contractId: '',
  });

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/municipal/users/list'],
  });

  const { data: companiesData } = useQuery({
    queryKey: ['/api/municipal/users/companies'],
  });

  const { data: contractsData } = useQuery({
    queryKey: ['/api/municipal/users/contracts', selectedCompany],
    enabled: !!selectedCompany,
  });

  const users = usersData?.users || [];
  const companies = companiesData?.companies || [];
  const contracts = contractsData?.contracts || [];

  // Filter users based on active tab
  const filteredUsers = users.filter((user: User) => {
    if (activeTab === 'active') return user.cognitoStatus === 'CONFIRMED';
    if (activeTab === 'gestores') return user.cognitoGroup === 'Gestores';
    if (activeTab === 'diretores') return user.cognitoGroup === 'Diretores';
    return true;
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/municipal/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar usuário');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Usuário criado com sucesso!",
        description: `${data.user.firstName} foi criado e pode acessar a plataforma.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/users/list'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewUserData({
      firstName: '',
      lastName: '',
      email: '',
      userType: '',
      companyId: '',
      contractId: '',
    });
    setSelectedUserType('');
    setSelectedCompany('');
    setSelectedContract('');
  };

  const handleInputChange = (field: string, value: string) => {
    setNewUserData(prev => ({ ...prev, [field]: value }));
  };

  const handleUserTypeChange = (value: string) => {
    setSelectedUserType(value);
    handleInputChange('userType', value);
    setSelectedCompany('');
    setSelectedContract('');
    handleInputChange('companyId', '');
    handleInputChange('contractId', '');
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    handleInputChange('companyId', value);
    setSelectedContract('');
    handleInputChange('contractId', '');
  };

  const handleContractChange = (value: string) => {
    setSelectedContract(value);
    handleInputChange('contractId', value);
  };

  const handleCreateUser = () => {
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.userType) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validações específicas por tipo
    if (selectedUserType === 'Gestores' && !newUserData.companyId) {
      toast({
        title: "Empresa obrigatória",
        description: "Gestores devem estar vinculados a uma empresa.",
        variant: "destructive",
      });
      return;
    }

    if (selectedUserType === 'Diretores' && (!newUserData.companyId || !newUserData.contractId)) {
      toast({
        title: "Empresa e contrato obrigatórios",
        description: "Diretores devem estar vinculados a uma empresa e contrato específico.",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(newUserData);
  };

  const getRoleBadgeColor = (group: string) => {
    switch (group) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Gestores': return 'bg-blue-100 text-blue-800';
      case 'Diretores': return 'bg-green-100 text-green-800';
      case 'Professores': return 'bg-purple-100 text-purple-800';
      case 'Alunos': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'UNCONFIRMED': return 'bg-yellow-100 text-yellow-800';
      case 'FORCE_CHANGE_PASSWORD': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation('/gestor/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <div className="flex items-center space-x-3">
                <img 
                  src="/attached_assets/IAprender_1750262377399.png" 
                  alt="IAprender Logo" 
                  className="h-8 w-8 rounded bg-white shadow-sm"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Gestão de Usuários
                  </h1>
                  <p className="text-gray-600">Gerencie gestores e diretores da sua organização</p>
                </div>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Dados básicos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nome *</Label>
                      <Input
                        id="firstName"
                        value={newUserData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Digite o nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Sobrenome *</Label>
                      <Input
                        id="lastName"
                        value={newUserData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Digite o sobrenome"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Digite o email"
                    />
                  </div>

                  {/* Tipo de usuário */}
                  <div className="space-y-2">
                    <Label htmlFor="userType">Tipo de Usuário *</Label>
                    <Select value={selectedUserType} onValueChange={handleUserTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gestores">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span>Gestor Municipal</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Diretores">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-green-600" />
                            <span>Diretor de Escola</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campos condicionais */}
                  {(selectedUserType === 'Gestores' || selectedUserType === 'Diretores') && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa *</Label>
                      <Select value={selectedCompany} onValueChange={handleCompanyChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company: Company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedUserType === 'Diretores' && selectedCompany && (
                    <div className="space-y-2">
                      <Label htmlFor="contract">Contrato *</Label>
                      <Select value={selectedContract} onValueChange={handleContractChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {contracts.map((contract: Contract) => (
                            <SelectItem key={contract.id} value={contract.id.toString()}>
                              {contract.schoolName} - {contract.contractNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter((u: User) => u.cognitoStatus === 'CONFIRMED').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gestores</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter((u: User) => u.cognitoGroup === 'Gestores').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Diretores</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter((u: User) => u.cognitoGroup === 'Diretores').length}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Usuários Ativos</TabsTrigger>
            <TabsTrigger value="gestores">Gestores</TabsTrigger>
            <TabsTrigger value="diretores">Diretores</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user: User) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      <Badge className={getRoleBadgeColor(user.cognitoGroup)}>
                        {user.cognitoGroup}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={getStatusBadgeColor(user.cognitoStatus)}>
                        {user.cognitoStatus === 'CONFIRMED' ? 'Ativo' : 
                         user.cognitoStatus === 'UNCONFIRMED' ? 'Pendente' : 
                         'Trocar Senha'}
                      </Badge>
                    </div>

                    {user.companyName && (
                      <div className="text-sm">
                        <span className="text-gray-600">Empresa: </span>
                        <span className="font-medium">{user.companyName}</span>
                      </div>
                    )}

                    {user.contractName && (
                      <div className="text-sm">
                        <span className="text-gray-600">Contrato: </span>
                        <span className="font-medium">{user.contractName}</span>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600">Não há usuários nesta categoria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserManagementGestor;
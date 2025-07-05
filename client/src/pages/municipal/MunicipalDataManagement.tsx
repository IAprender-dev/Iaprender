import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Building2,
  Users,
  School,
  FileText,
  Plus,
  Search,
  Filter,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  UserCheck,
  GraduationCap,
  Home,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface Contract {
  id: number;
  name: string;
  companyName: string;
  status: 'active' | 'inactive' | 'expired';
  totalLicenses: number;
  usedLicenses: number;
  monthlyValue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface School {
  id: number;
  name: string;
  inep?: string;
  cnpj?: string;
  address: string;
  city: string;
  state: string;
  numberOfStudents: number;
  numberOfTeachers: number;
  status: 'active' | 'inactive';
  contractName: string;
  directorName?: string;
  directorEmail?: string;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive';
  contractId?: number;
  createdAt: string;
}

interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  cnpj?: string;
  contactPerson?: string;
  status: string;
}

const MunicipalDataManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateContractDialog, setShowCreateContractDialog] = useState(false);
  const [showCreateSchoolDialog, setShowCreateSchoolDialog] = useState(false);

  // Fetch real data from municipal endpoints
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/municipal/stats'],
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/municipal/contracts'],
  });

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['/api/municipal/schools'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/municipal/users'],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/municipal/companies'],
  });

  // Contract creation mutation
  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      return apiRequest('POST', '/api/municipal/contracts', contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
      setShowCreateContractDialog(false);
      toast({
        title: "Sucesso",
        description: "Contrato criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar contrato",
        variant: "destructive",
      });
    },
  });

  // School creation mutation
  const createSchoolMutation = useMutation({
    mutationFn: async (schoolData: any) => {
      return apiRequest('POST', '/api/municipal/schools', schoolData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/schools'] });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/stats'] });
      setShowCreateSchoolDialog(false);
      toast({
        title: "Sucesso",
        description: "Escola criada com sucesso e diretor cadastrado",
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

  const filteredContracts = contracts.filter((contract: Contract) => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredSchools = schools.filter((school: School) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {contracts.length > 0 ? `${contracts.length} total` : 'Nenhum contrato'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escolas Cadastradas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools || 0}</div>
            <p className="text-xs text-muted-foreground">
              {schools.length > 0 ? `${schools.length} total` : 'Nenhuma escola'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {users.length > 0 ? `${users.length} total` : 'Nenhum usuário'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(stats.monthlyRevenue || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              receita recorrente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-dashed border-emerald-200 hover:border-emerald-300 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Plus className="h-12 w-12 text-emerald-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Novo Contrato</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie contratos para liberação de licenças
            </p>
            <Button onClick={() => setShowCreateContractDialog(true)} className="w-full">
              Criar Contrato
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <School className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nova Escola</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre escolas e seus diretores
            </p>
            <Button 
              onClick={() => setShowCreateSchoolDialog(true)} 
              className="w-full"
              disabled={contracts.length === 0}
            >
              Cadastrar Escola
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Users className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gerenciar Usuários</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visualize e gerencie todos os usuários
            </p>
            <Button 
              onClick={() => setActiveTab('users')} 
              className="w-full"
            >
              Ver Usuários
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ContractsTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar contratos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="expired">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreateContractDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contractsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredContracts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro contrato'
              }
            </p>
          </div>
        ) : (
          filteredContracts.map((contract: Contract) => (
            <Card key={contract.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{contract.name}</h3>
                    <p className="text-sm text-muted-foreground">{contract.companyName}</p>
                  </div>
                  <Badge 
                    variant={contract.status === 'active' ? 'default' : 'secondary'}
                    className={contract.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {contract.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Licenças:</span>
                    <span className="text-sm font-medium">
                      {contract.usedLicenses} / {contract.totalLicenses}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor Mensal:</span>
                    <span className="text-sm font-medium">
                      R$ {contract.monthlyValue.toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vigência:</span>
                    <span className="text-sm font-medium">
                      {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const SchoolsTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar escolas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="inactive">Inativa</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          onClick={() => setShowCreateSchoolDialog(true)}
          disabled={contracts.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Escola
        </Button>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {schoolsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredSchools.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma escola encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando sua primeira escola'
              }
            </p>
            {contracts.length === 0 && (
              <p className="text-red-600 mt-2">
                Você precisa criar um contrato antes de cadastrar escolas
              </p>
            )}
          </div>
        ) : (
          filteredSchools.map((school: School) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{school.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {school.city}, {school.state}
                    </div>
                  </div>
                  <Badge 
                    variant={school.status === 'active' ? 'default' : 'secondary'}
                    className={school.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {school.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {school.inep && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">INEP:</span>
                      <span className="text-sm font-medium">{school.inep}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Alunos:</span>
                    <span className="text-sm font-medium">{school.numberOfStudents}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Professores:</span>
                    <span className="text-sm font-medium">{school.numberOfTeachers}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contrato:</span>
                    <span className="text-sm font-medium">{school.contractName}</span>
                  </div>

                  {school.directorName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Diretor:</span>
                      <span className="text-sm font-medium">{school.directorName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {usersLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Os usuários aparecerão aqui quando escolas forem cadastradas'
              }
            </p>
          </div>
        ) : (
          filteredUsers.map((user: User) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{user.firstName} {user.lastName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                      className={user.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {user.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const CreateContractForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      totalLicenses: '',
      pricePerLicense: '',
      startDate: '',
      endDate: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createContractMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Contrato</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Ex: Contrato Escolas Municipais 2024"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrição detalhada do contrato..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalLicenses">Total de Licenças</Label>
            <Input
              id="totalLicenses"
              type="number"
              value={formData.totalLicenses}
              onChange={(e) => setFormData({...formData, totalLicenses: e.target.value})}
              placeholder="100"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="pricePerLicense">Preço por Licença (R$)</Label>
            <Input
              id="pricePerLicense"
              type="number"
              step="0.01"
              value={formData.pricePerLicense}
              onChange={(e) => setFormData({...formData, pricePerLicense: e.target.value})}
              placeholder="10.00"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="endDate">Data de Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowCreateContractDialog(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createContractMutation.isPending}>
            {createContractMutation.isPending ? 'Criando...' : 'Criar Contrato'}
          </Button>
        </div>
      </form>
    );
  };

  const CreateSchoolForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      inep: '',
      cnpj: '',
      address: '',
      city: '',
      state: '',
      contractId: '',
      numberOfStudents: '',
      numberOfTeachers: '',
      directorEmail: '',
      directorFirstName: '',
      directorLastName: '',
      directorPhone: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createSchoolMutation.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Dados da Escola</h4>
          
          <div>
            <Label htmlFor="school-name">Nome da Escola</Label>
            <Input
              id="school-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="E.M. Professor João Silva"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inep">Código INEP</Label>
              <Input
                id="inep"
                value={formData.inep}
                onChange={(e) => setFormData({...formData, inep: e.target.value})}
                placeholder="12345678"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0001-00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Rua das Flores, 123"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="São Paulo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({...formData, state: e.target.value})}
                placeholder="SP"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contractId">Contrato Vinculado</Label>
            <Select value={formData.contractId} onValueChange={(value) => setFormData({...formData, contractId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contrato" />
              </SelectTrigger>
              <SelectContent>
                {contracts.filter((c: Contract) => c.status === 'active').map((contract: Contract) => (
                  <SelectItem key={contract.id} value={contract.id.toString()}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numberOfStudents">Número de Alunos</Label>
              <Input
                id="numberOfStudents"
                type="number"
                value={formData.numberOfStudents}
                onChange={(e) => setFormData({...formData, numberOfStudents: e.target.value})}
                placeholder="500"
              />
            </div>
            
            <div>
              <Label htmlFor="numberOfTeachers">Número de Professores</Label>
              <Input
                id="numberOfTeachers"
                type="number"
                value={formData.numberOfTeachers}
                onChange={(e) => setFormData({...formData, numberOfTeachers: e.target.value})}
                placeholder="25"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900">Dados do Diretor</h4>
          
          <div>
            <Label htmlFor="directorEmail">Email do Diretor</Label>
            <Input
              id="directorEmail"
              type="email"
              value={formData.directorEmail}
              onChange={(e) => setFormData({...formData, directorEmail: e.target.value})}
              placeholder="diretor@escola.edu.br"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="directorFirstName">Nome</Label>
              <Input
                id="directorFirstName"
                value={formData.directorFirstName}
                onChange={(e) => setFormData({...formData, directorFirstName: e.target.value})}
                placeholder="Maria"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="directorLastName">Sobrenome</Label>
              <Input
                id="directorLastName"
                value={formData.directorLastName}
                onChange={(e) => setFormData({...formData, directorLastName: e.target.value})}
                placeholder="Silva"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="directorPhone">Telefone</Label>
            <Input
              id="directorPhone"
              value={formData.directorPhone}
              onChange={(e) => setFormData({...formData, directorPhone: e.target.value})}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setShowCreateSchoolDialog(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createSchoolMutation.isPending}>
            {createSchoolMutation.isPending ? 'Criando...' : 'Criar Escola'}
          </Button>
        </div>
      </form>
    );
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados municipais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/municipal/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Dados Municipais</h1>
              <p className="text-gray-600 mt-1">
                Gerencie contratos, usuários e empresas do seu município
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="schools">Escolas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractsTab />
          </TabsContent>

          <TabsContent value="schools">
            <SchoolsTab />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>

        {/* Create Contract Dialog */}
        <Dialog open={showCreateContractDialog} onOpenChange={setShowCreateContractDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Contrato</DialogTitle>
            </DialogHeader>
            <CreateContractForm />
          </DialogContent>
        </Dialog>

        {/* Create School Dialog */}
        <Dialog open={showCreateSchoolDialog} onOpenChange={setShowCreateSchoolDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Escola</DialogTitle>
            </DialogHeader>
            <CreateSchoolForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MunicipalDataManagement;
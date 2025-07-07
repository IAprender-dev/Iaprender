import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit,
  Shield,
  Clock,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Building,
  Save,
  Eye,
  X
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import IAprender_Logo from "@/assets/IAprender_1750262377399.png";

interface CognitoUser {
  cognitoId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  enabled: boolean;
  createdDate: string;
  lastModifiedDate: string;
  groups: string[];
  localData?: {
    id: number;
    role: string;
    lastLoginAt?: string;
    firstLogin: boolean;
    contractId?: number;
  } | null;
  contractInfo?: {
    contractId: number;
    contractNumber: string;
    contractName: string;
    companyId: number;
    companyName: string;
    companyEmail: string;
    companyPhone: string;
  } | null;
}

interface UserStatistics {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function UserManagement() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filtros e paginação
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);
  const [editingUser, setEditingUser] = useState<CognitoUser | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("none");
  const [selectedContractId, setSelectedContractId] = useState<string>("none");

  // Mapear tab para group
  const getGroupFromTab = (tab: string) => {
    switch (tab) {
      case 'admin': return 'Admin';
      case 'gestores': return 'Gestores';
      case 'diretores': return 'Diretores';
      default: return 'all';
    }
  };

  // Buscar usuários
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users/list', {
      group: getGroupFromTab(activeTab) === 'all' ? '' : getGroupFromTab(activeTab),
      page: currentPage,
      limit: 10,
      search: searchTerm,
      status: selectedStatus
    }],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar estatísticas
  const { data: statistics } = useQuery({
    queryKey: ['/api/admin/users/statistics'],
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Buscar empresas para o dropdown de edição
  const { data: companiesData, error: companiesError } = useQuery({
    queryKey: ['/api/admin/companies'],
    enabled: !!editingUser, // Só carregar quando estiver editando
  });

  // Buscar contratos da empresa selecionada
  const { data: contractsData, isLoading: contractsLoading, error: contractsError } = useQuery({
    queryKey: ['/api/admin/companies', selectedCompanyId, 'contracts'],
    queryFn: async () => {
      if (!selectedCompanyId || selectedCompanyId === "none") return { contracts: [] };
      console.log('🔍 [CONTRACTS] Buscando contratos para empresa:', selectedCompanyId);
      const response = await fetch(`/api/admin/companies/${selectedCompanyId}/contracts`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error('❌ [CONTRACTS] Erro ao buscar contratos:', response.status, response.statusText);
        throw new Error(`Failed to fetch contracts: ${response.status}`);
      }
      const data = await response.json();
      console.log('📋 [CONTRACTS] Contratos recebidos:', data);
      return data;
    },
    enabled: !!selectedCompanyId && selectedCompanyId !== "none",
  });

  const users: CognitoUser[] = usersData?.users || [];
  const pagination: PaginationInfo = usersData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  };
  const userStats: UserStatistics = usersData?.statistics || {
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0
  };

  // Log dos dados para debug
  if (editingUser) {
    console.log('🔍 [DEBUG] EditingUser:', editingUser);
    console.log('🔍 [DEBUG] Companies data:', companiesData);
    console.log('🔍 [DEBUG] Companies error:', companiesError);
    console.log('🔍 [DEBUG] Contracts data:', contractsData);
    console.log('🔍 [DEBUG] Contracts error:', contractsError);
    console.log('🔍 [DEBUG] Selected company ID:', selectedCompanyId);
    console.log('🔍 [DEBUG] Selected contract ID:', selectedContractId);
  }

  // Funções de manipulação
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset para primeira página
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset para primeira página quando mudar de aba
  };

  const handleGroupFilter = (value: string) => {
    setSelectedGroup(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return <Badge variant="destructive">Desabilitado</Badge>;
    }
    
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'FORCE_CHANGE_PASSWORD':
        return <Badge className="bg-yellow-100 text-yellow-800">Senha Temporária</Badge>;
      case 'UNCONFIRMED':
        return <Badge className="bg-gray-100 text-gray-800">Não Confirmado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getGroupBadge = (groups: string[]) => {
    if (groups.includes('Admin')) {
      return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
    }
    if (groups.includes('Gestores')) {
      return <Badge className="bg-blue-100 text-blue-800">Gestor</Badge>;
    }
    if (groups.includes('Diretores')) {
      return <Badge className="bg-green-100 text-green-800">Diretor</Badge>;
    }
    return <Badge variant="outline">Sem Grupo</Badge>;
  };

  // Funções auxiliares para edição - apenas para Diretores
  const openEditModal = (user: CognitoUser) => {
    // Permite edição para Gestores e Diretores
    if (!user.groups.includes('Gestores') && !user.groups.includes('Diretores')) {
      return;
    }
    setEditingUser(user);
    setSelectedCompanyId(user.contractInfo?.companyId?.toString() || "none");
    setSelectedContractId(user.contractInfo?.contractId?.toString() || "none");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setSelectedCompanyId("none");
    setSelectedContractId("none");
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedContractId("none"); // Reset contract quando empresa muda
  };

  // Mutation para atualizar vínculos
  const updateContractMutation = useMutation({
    mutationFn: async ({ cognitoId, email, contractId, companyId }: { cognitoId: string; email: string; contractId: string | null; companyId: string | null }) => {
      console.log('🚀 [FRONTEND] Executando mutation com:', { cognitoId, email, contractId, companyId });
      
      const response = await fetch(`/api/admin/users/${cognitoId}/update-contract`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cognitoId, email, contractId, companyId })
      });
      
      console.log('📡 [FRONTEND] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.log('❌ [FRONTEND] Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [FRONTEND] Success response:', result);
      return result;
    },
    onSuccess: async (data) => {
      console.log('✅ [FRONTEND] Mutation success response:', data);
      
      // Fechar modal primeiro
      closeEditModal();
      
      // Mostrar toast de sucesso
      toast({
        title: "Vínculos atualizados",
        description: "Os vínculos de empresa e contrato foram atualizados com sucesso.",
      });
      
      console.log('🔄 [FRONTEND] Invalidando cache e fazendo refetch completo...');
      
      // Invalidar TODOS os caches relacionados
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users/list'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users/statistics'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      
      // Aguardar um momento para o backend processar
      setTimeout(() => {
        console.log('🔄 [FRONTEND] Fazendo refetch forçado após delay...');
        refetch();
      }, 500);
      
      // Forçar refetch imediato também
      refetch();
    },
    onError: (error: any) => {
      console.error('❌ [FRONTEND] Mutation error:', error);
      console.error('❌ [FRONTEND] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast({
        title: "Erro ao atualizar vínculos",
        description: error.message || "Ocorreu um erro ao atualizar os vínculos.",
        variant: "destructive",
      });
    }
  });

  const handleSaveContract = () => {
    console.log('🎯 [FRONTEND] handleSaveContract chamado');
    console.log('🔍 [FRONTEND] Estado atual:', {
      editingUser: editingUser,
      selectedCompanyId,
      selectedContractId,
      hasEditingUser: !!editingUser
    });
    
    if (!editingUser) {
      console.log('❌ [FRONTEND] editingUser não encontrado');
      toast({
        title: "Erro",
        description: "Nenhum usuário selecionado para edição.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se é Gestor ou Diretor
    if (!editingUser.groups.includes('Gestores') && !editingUser.groups.includes('Diretores')) {
      console.log('❌ [FRONTEND] Usuário não é Gestor nem Diretor, grupos:', editingUser.groups);
      toast({
        title: "Erro",
        description: "Apenas Gestores e Diretores podem ter vínculos editados.",
        variant: "destructive",
      });
      return;
    }
    
    // Para Gestores: apenas empresa (contractId sempre null)
    // Para Diretores: empresa + contrato específico
    let contractId = null;
    
    if (editingUser.groups.includes('Diretores')) {
      // Diretores precisam de empresa E contrato
      if (selectedCompanyId === "none" || selectedContractId === "none") {
        contractId = null;
      } else {
        contractId = selectedContractId;
      }
      console.log('📝 [FRONTEND] Processando Diretor - empresa:', selectedCompanyId, 'contrato:', selectedContractId);
    } else if (editingUser.groups.includes('Gestores')) {
      // Para Gestores, contractId permanece null mas pode ter empresa
      contractId = null;
      console.log('📝 [FRONTEND] Processando Gestor - empresa:', selectedCompanyId, 'contractId sempre null');
    }
    
    console.log('🎯 [FRONTEND] Dados finais para envio:', {
      cognitoId: editingUser.cognitoId,
      email: editingUser.email,
      contractId,
      selectedCompanyId,
      selectedContractId,
      userType: editingUser.groups.includes('Diretores') ? 'Diretor' : 'Gestor'
    });
    
    console.log('🚀 [FRONTEND] Iniciando mutation...');
    updateContractMutation.mutate({
      cognitoId: editingUser.cognitoId,
      email: editingUser.email,
      contractId,
      companyId: selectedCompanyId === "none" ? null : selectedCompanyId
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/master">
                <Button variant="ghost" size="sm">
                  ← Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-1">
                    <img 
                      src={IAprender_Logo} 
                      alt="IAprender Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IAprender
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestão de Usuários AWS Cognito
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Admin, Gestores e Diretores
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{user?.firstName || 'Admin'}</span>
              </span>
              <Link href="/admin/cognito-users">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </Button>
              </Link>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{userStats.total}</div>
              <p className="text-xs text-blue-700">Admin, Gestores e Diretores</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Usuários Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{userStats.active}</div>
              <p className="text-xs text-green-700">Status confirmado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Senha Temporária</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">{userStats.pending}</div>
              <p className="text-xs text-yellow-700">Aguardando primeiro acesso</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">Inativos</CardTitle>
              <UserX className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{userStats.inactive}</div>
              <p className="text-xs text-gray-700">Desabilitados ou não confirmados</p>
            </CardContent>
          </Card>
        </div>

        {/* Abas de Filtro por Tipo de Usuário */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="todos" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Todos</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </TabsTrigger>
                <TabsTrigger value="gestores" className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>Gestores</span>
                </TabsTrigger>
                <TabsTrigger value="diretores" className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Diretores</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select value={selectedStatus} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="CONFIRMED">Ativo</SelectItem>
                  <SelectItem value="FORCE_CHANGE_PASSWORD">Senha Temporária</SelectItem>
                  <SelectItem value="UNCONFIRMED">Não Confirmado</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="icon"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  {pagination.totalUsers} usuários encontrados
                </CardDescription>
              </div>
              <Badge variant="outline">
                Página {pagination.currentPage} de {pagination.totalPages}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Carregando usuários...</p>
              </div>
            ) : error ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Erro ao carregar usuários. Verifique suas permissões AWS Cognito.
                </AlertDescription>
              </Alert>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Nenhum usuário encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.cognitoId}
                    className="p-6 border rounded-xl hover:shadow-md transition-all duration-200 bg-white"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* Header do usuário */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {user.firstName} {user.lastName}
                              </h3>
                              <div className="flex items-center space-x-2 text-gray-600">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Badges e informações */}
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            {getStatusBadge(user.status, user.enabled)}
                            {getGroupBadge(user.groups)}
                          </div>
                          
                          {/* Informações de data */}
                          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Criado: {new Date(user.createdDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {user.localData?.lastLoginAt && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Último acesso: {new Date(user.localData.lastLoginAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 whitespace-nowrap"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          {user.groups.includes('Gestores') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 whitespace-nowrap"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Alterar Empresa
                            </Button>
                          )}
                          {user.groups.includes('Diretores') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 whitespace-nowrap"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Vínculos
                            </Button>
                          )}
                        </div>
                      </div>

                        {/* Informações de Empresa - para Gestores */}
                        {user.groups.includes('Gestores') && user.contractInfo && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-3">
                              <Building className="h-4 w-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-800 text-sm">Empresa Vinculada</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Nome da Empresa</span>
                                  <p className="text-sm font-medium text-emerald-900">{user.contractInfo.companyName}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Email</span>
                                  <p className="text-sm text-emerald-800">{user.contractInfo.companyEmail}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Telefone</span>
                                  <p className="text-sm text-emerald-800">{user.contractInfo.companyPhone || 'Não informado'}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Nível de Acesso</span>
                                  <p className="text-sm font-medium text-emerald-900">Gestão completa da empresa</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Informações de Empresa e Contrato - para Diretores */}
                        {user.groups.includes('Diretores') && user.contractInfo && (
                          <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2 mb-3">
                              <UserCheck className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-800 text-sm">Empresa e Contrato Específico</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Empresa</span>
                                  <p className="text-sm font-medium text-blue-900">{user.contractInfo.companyName}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Contrato</span>
                                  <p className="text-sm font-medium text-blue-900">{user.contractInfo.contractName || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Email da Empresa</span>
                                  <p className="text-sm text-blue-800">{user.contractInfo.companyEmail}</p>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Telefone</span>
                                  <p className="text-sm text-blue-800">{user.contractInfo.companyPhone || 'Não informado'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Nível de Acesso</span>
                              <p className="text-sm text-blue-800">Acesso restrito apenas ao contrato específico</p>
                            </div>
                          </div>
                        )}

                        {/* Aviso para Gestores sem empresa vinculada */}
                        {user.groups.includes('Gestores') && !user.contractInfo && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-800 font-medium">
                                Gestor sem empresa vinculada - Acesso limitado até configuração
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Aviso para Diretores sem empresa/contrato vinculado */}
                        {user.groups.includes('Diretores') && !user.contractInfo && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-800 font-medium">
                                Diretor sem empresa/contrato vinculado - Acesso limitado até configuração
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {users.length > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} até{' '}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalUsers)} de{' '}
                  {pagination.totalUsers} usuários
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
                    {pagination.currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Detalhes do Usuário</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                      <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">ID Cognito</label>
                      <p className="text-sm text-gray-900 font-mono text-xs">{selectedUser.cognitoId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                      <p className="text-sm text-gray-900">{new Date(selectedUser.createdDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Status e Grupos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedUser.status, selectedUser.enabled)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Grupos</label>
                      <div className="mt-1">{getGroupBadge(selectedUser.groups)}</div>
                    </div>
                  </div>

                  {/* Informações de Empresa e Contrato - apenas para Diretores */}
                  {selectedUser.groups.includes('Diretores') && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Informações de Empresa e Contrato
                      </h3>
                      {selectedUser.contractInfo ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-blue-800">Empresa</label>
                            <p className="text-sm text-blue-900">{selectedUser.contractInfo.companyName}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-800">Contrato</label>
                            <p className="text-sm text-blue-900">{selectedUser.contractInfo.contractNumber}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-800">Email da Empresa</label>
                            <p className="text-sm text-blue-900">{selectedUser.contractInfo.companyEmail}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-800">Telefone</label>
                            <p className="text-sm text-blue-900">{selectedUser.contractInfo.companyPhone || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-800">Nome do Contrato</label>
                            <p className="text-sm text-blue-900">{selectedUser.contractInfo.contractName}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-800">ID do Contrato</label>
                            <p className="text-sm text-blue-900 font-mono">{selectedUser.contractInfo.contractId}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">Diretor sem empresa/contrato vinculado</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informações Locais */}
                  {selectedUser.localData && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Informações Locais</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-700">ID Local</label>
                          <p className="text-sm text-gray-900">{selectedUser.localData.id}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">Role</label>
                          <p className="text-sm text-gray-900">{selectedUser.localData.role}</p>
                        </div>
                        {selectedUser.localData.lastLoginAt && (
                          <div>
                            <label className="text-xs font-medium text-gray-700">Último Login</label>
                            <p className="text-sm text-gray-900">{new Date(selectedUser.localData.lastLoginAt).toLocaleString('pt-BR')}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-medium text-gray-700">Primeiro Login</label>
                          <p className="text-sm text-gray-900">{selectedUser.localData.firstLogin ? 'Sim' : 'Não'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  {selectedUser.groups.includes('Diretores') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        openEditModal(selectedUser);
                      }}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      ✏️ Editar Vínculos
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Edição de Vínculos - para Gestores e Diretores */}
        {editingUser && (editingUser.groups.includes('Gestores') || editingUser.groups.includes('Diretores')) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-green-600" />
                  <span>
                    {editingUser.groups.includes('Gestores') ? 'Alterar Empresa' : 'Alterar Empresa e Contrato'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {editingUser.firstName} {editingUser.lastName} - {editingUser.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Explicação baseada no tipo de usuário */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">
                      {editingUser.groups.includes('Gestores') ? 'Gestor Municipal' : 'Diretor de Escola'}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {editingUser.groups.includes('Gestores') 
                        ? 'Gestores gerenciam uma empresa completa e todos os seus contratos. Selecione apenas a empresa.'
                        : 'Diretores gerenciam um contrato específico dentro de uma empresa. Selecione empresa e contrato.'
                      }
                    </p>
                  </div>
                  
                  {/* Informações atuais */}
                  {editingUser.contractInfo && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Vínculos Atuais:</h4>
                      <div className="text-xs text-blue-800">
                        <p><strong>Empresa:</strong> {editingUser.contractInfo.companyName}</p>
                        <p><strong>Contrato:</strong> {editingUser.contractInfo.contractNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* Seleção de Empresa */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Selecionar Empresa:
                    </label>
                    <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma empresa..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma empresa</SelectItem>
                        {companiesData?.companies?.map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seleção de Contrato - apenas para Diretores */}
                  {editingUser.groups.includes('Diretores') && selectedCompanyId && selectedCompanyId !== "none" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Selecionar Contrato:
                      </label>
                      {contractsLoading ? (
                        <div className="text-sm text-gray-500">Carregando contratos...</div>
                      ) : (
                        <Select value={selectedContractId} onValueChange={setSelectedContractId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um contrato..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum contrato</SelectItem>
                            {contractsData?.contracts?.map((contract: any) => (
                              <SelectItem key={contract.id} value={contract.id.toString()}>
                                {contract.contract_number} - {contract.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {contractsData?.contracts && contractsData.contracts.length === 0 && !contractsLoading && (
                        <div className="text-sm text-amber-600 mt-2">
                          ⚠️ Nenhum contrato ativo encontrado para esta empresa
                        </div>
                      )}
                    </div>
                  )}

                  {/* Informações do contrato selecionado - apenas para Diretores */}
                  {editingUser.groups.includes('Diretores') && selectedContractId && contractsData?.contracts && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-2">Novo Vínculo:</h4>
                      {(() => {
                        const selectedContract = contractsData.contracts.find(
                          (c: any) => c.id.toString() === selectedContractId
                        );
                        return selectedContract ? (
                          <div className="text-xs text-green-800">
                            <p><strong>Contrato:</strong> {selectedContract.contract_number}</p>
                            <p><strong>Nome:</strong> {selectedContract.name}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={closeEditModal}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveContract}
                    disabled={updateContractMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateContractMutation.isPending ? 'Salvando...' : 
                      editingUser.groups.includes('Gestores') ? 'Salvar Empresa' : 'Salvar Vínculos'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
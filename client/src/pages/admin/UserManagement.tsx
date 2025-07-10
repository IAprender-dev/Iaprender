import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Building, 
  FileText, 
  Shield, 
  UserCheck, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  X, 
  Save,
  ChevronLeft,
  ChevronRight,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

import CompanyManagement from "./CompanyManagement";
import ContractManagement from "./ContractManagement";

// Interfaces reutilizadas do sistema existente
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
  const [activeMainTab, setActiveMainTab] = useState("usuarios");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/assets/iaprender-logo.png" 
                  alt="IAprender" 
                  className="h-8 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'block';
                  }}
                />
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-sm text-gray-600">Sistema de gestão educacional IAprender</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/logout">
                <Button variant="outline" size="sm">
                  Sair
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger 
              value="usuarios" 
              className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              <span>Gestão de Usuários</span>
            </TabsTrigger>
            <TabsTrigger 
              value="empresas" 
              className="flex items-center space-x-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <Building className="h-4 w-4" />
              <span>Gestão de Empresas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contratos" 
              className="flex items-center space-x-2 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              <span>Gestão de Contratos</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Gestão de Usuários */}
          <TabsContent value="usuarios">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Gestão de Usuários</CardTitle>
                  <CardDescription className="text-indigo-700">
                    Administre usuários do sistema AWS Cognito com controle hierárquico completo
                  </CardDescription>
                </CardHeader>
              </Card>
              <UserManagementContent />
            </div>
          </TabsContent>

          {/* Aba Gestão de Empresas */}
          <TabsContent value="empresas">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Gestão de Empresas</CardTitle>
                  <CardDescription className="text-emerald-700">
                    Administre empresas parceiras e instituições educacionais
                  </CardDescription>
                </CardHeader>
              </Card>
              <CompanyManagement />
            </div>
          </TabsContent>

          {/* Aba Gestão de Contratos */}
          <TabsContent value="contratos">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-900">Gestão de Contratos</CardTitle>
                  <CardDescription className="text-orange-700">
                    Administre contratos comerciais e acordos educacionais
                  </CardDescription>
                </CardHeader>
              </Card>
              <ContractManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente específico para gestão de usuários
function UserManagementContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados do componente original de gestão de usuários
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);
  const [editingUser, setEditingUser] = useState<CognitoUser | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("none");
  const [selectedContractId, setSelectedContractId] = useState<string>("none");

  // Capturar token JWT da URL após callback do Cognito
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('🔑 [FRONTEND] Token JWT encontrado na URL:', token.substring(0, 50) + '...');
      localStorage.setItem('token', token);
      
      // Limpar URL após salvar o token
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      toast({
        title: "Autenticação realizada",
        description: "Token JWT salvo com sucesso.",
      });
    }
  }, [toast]);

  // Buscar usuários do AWS Cognito
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users/list', {
      page: currentPage,
      search: searchTerm,
      status: selectedStatus,
      activeTab: activeTab
    }],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar empresas para o dropdown de edição
  const { data: companiesData } = useQuery({
    queryKey: ['/api/empresas'],
    enabled: !!editingUser, // Só carregar quando estiver editando
  });

  // Buscar contratos da empresa selecionada
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/contratos', { empresaId: selectedCompanyId }],
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

  // Funções de manipulação
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
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

  // Funções auxiliares para edição
  const openEditModal = (user: CognitoUser) => {
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
    setSelectedContractId("none");
  };

  // Mutation para atualizar vínculos
  const updateContractMutation = useMutation({
    mutationFn: async ({ cognitoId, email, contractId, companyId }: { cognitoId: string; email: string; contractId: string | null; companyId: string | null }) => {
      const response = await fetch(`/api/admin/users/${cognitoId}/update-contract`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ cognitoId, email, contractId, companyId })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: async () => {
      closeEditModal();
      toast({
        title: "Vínculos atualizados",
        description: "Os vínculos de empresa e contrato foram atualizados com sucesso.",
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/users/list'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar vínculos",
        description: error.message || "Erro desconhecido ao atualizar vínculos.",
        variant: "destructive",
      });
    }
  });

  const handleUpdateContract = () => {
    if (!editingUser) return;
    
    if (!editingUser.groups.includes('Gestores') && !editingUser.groups.includes('Diretores')) {
      toast({
        title: "Erro",
        description: "Apenas Gestores e Diretores podem ter vínculos editados.",
        variant: "destructive",
      });
      return;
    }
    
    let contractId = null;
    
    if (editingUser.groups.includes('Diretores')) {
      if (selectedCompanyId === "none" || selectedContractId === "none") {
        contractId = null;
      } else {
        contractId = selectedContractId;
      }
    }
    
    updateContractMutation.mutate({
      cognitoId: editingUser.cognitoId,
      email: editingUser.email,
      contractId,
      companyId: selectedCompanyId === "none" ? null : selectedCompanyId
    });
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      <Card>
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
      <Card>
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
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Página {pagination.currentPage} de {pagination.totalPages}
              </Badge>
              <Link href="/admin/cognito-users">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </Button>
              </Link>
            </div>
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
            <div className="space-y-6">
              {/* Seção de Administradores */}
              {users.filter(user => user.groups.includes('Admin')).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Administradores do Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.filter(user => user.groups.includes('Admin')).map((userItem) => (
                      <div
                        key={userItem.cognitoId}
                        className="p-4 border border-red-200 rounded-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">
                              {userItem.firstName?.charAt(0)}{userItem.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">
                              {userItem.firstName} {userItem.lastName}
                            </h4>
                            <p className="text-xs text-gray-600 truncate">{userItem.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          {getStatusBadge(userItem.status, userItem.enabled)}
                          <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(userItem)}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Gestores */}
              {users.filter(user => user.groups.includes('Gestores')).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-blue-600" />
                    Gestores Municipais
                  </h3>
                  <div className="space-y-3">
                    {users.filter(user => user.groups.includes('Gestores')).map((userItem) => (
                      <div
                        key={userItem.cognitoId}
                        className="p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {userItem.firstName?.charAt(0)}{userItem.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {userItem.firstName} {userItem.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{userItem.email}</p>
                              {userItem.contractInfo && (
                                <p className="text-xs text-blue-700 font-medium">
                                  {userItem.contractInfo.companyName}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(userItem.status, userItem.enabled)}
                            <Badge className="bg-blue-100 text-blue-800">Gestor</Badge>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(userItem)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(userItem)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Diretores */}
              {users.filter(user => user.groups.includes('Diretores')).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                    Diretores Escolares
                  </h3>
                  <div className="space-y-3">
                    {users.filter(user => user.groups.includes('Diretores')).map((userItem) => (
                      <div
                        key={userItem.cognitoId}
                        className="p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {userItem.firstName?.charAt(0)}{userItem.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {userItem.firstName} {userItem.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{userItem.email}</p>
                              {userItem.contractInfo && (
                                <div className="text-xs text-green-700">
                                  <p className="font-medium">{userItem.contractInfo.companyName}</p>
                                  <p>Contrato: {userItem.contractInfo.contractName}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(userItem.status, userItem.enabled)}
                            <Badge className="bg-green-100 text-green-800">Diretor</Badge>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedUser(userItem)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(userItem)}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                Total: {pagination.totalUsers} usuários
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização Detalhada */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalhes do Usuário
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedUser.status, selectedUser.enabled)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <div className="mt-1">{getGroupBadge(selectedUser.groups)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Criado em:</span>
                    <p className="font-medium">{new Date(selectedUser.createdDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Última modificação:</span>
                    <p className="font-medium">{new Date(selectedUser.lastModifiedDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {/* Informações de Contrato (se houver) */}
              {selectedUser.contractInfo && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Vínculos Empresariais</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Empresa:</span>
                        <p className="font-medium">{selectedUser.contractInfo.companyName}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Contrato:</span>
                        <p className="font-medium">{selectedUser.contractInfo.contractName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Telefone da Empresa:</span>
                        <p className="font-medium">{selectedUser.contractInfo.companyPhone}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Email da Empresa:</span>
                        <p className="font-medium">{selectedUser.contractInfo.companyEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Vínculos */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Vínculos
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeEditModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {editingUser.firstName} {editingUser.lastName}
                </h4>
                <p className="text-sm text-gray-600">{editingUser.email}</p>
                <div className="mt-2">{getGroupBadge(editingUser.groups)}</div>
              </div>

              <div className="space-y-4">
                {/* Seleção de Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma empresa</SelectItem>
                      {companiesData?.companies?.map((company: any) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Seleção de Contrato (apenas para Diretores) */}
                {editingUser.groups.includes('Diretores') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contrato
                    </label>
                    <Select 
                      value={selectedContractId} 
                      onValueChange={setSelectedContractId}
                      disabled={selectedCompanyId === "none" || contractsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum contrato</SelectItem>
                        {contractsData?.contratos?.map((contract: any) => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            {contract.nome} - {contract.numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {contractsLoading && (
                      <p className="text-xs text-gray-600 mt-1">
                        Carregando contratos...
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleUpdateContract}
                  disabled={updateContractMutation.isPending}
                  className="flex-1"
                >
                  {updateContractMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  disabled={updateContractMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
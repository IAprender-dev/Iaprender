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
  Filter, 
  Eye, 
  Edit, 
  X, 
  Save,
  ChevronLeft,
  ChevronRight,
  UserX,
  Plus,
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Empresa, InsertEmpresa, Contrato, InsertContrato } from "@shared/schema";

// Interfaces para usuários AWS Cognito
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

// Interfaces para empresas
interface CompanyFormData {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  website?: string;
  observacoes?: string;
}

// Interfaces para contratos
interface ContractFormData {
  numero: string;
  nome: string;
  empresaId: number | null;
  dataInicio: string;
  dataFim: string;
  valor: string;
  moeda: string;
  descricao?: string;
  objeto?: string;
  status: string;
  observacoes?: string;
}

export default function AdminUnifiedDashboard() {
  const [activeMainTab, setActiveMainTab] = useState("usuarios");
  const { toast } = useToast();

  // Capturar token JWT da URL após callback do Cognito
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const authSuccess = urlParams.get('auth');
    const userType = urlParams.get('type');
    const userEmail = urlParams.get('email');
    
    console.log('🔍 AdminUnifiedDashboard: Verificando parâmetros da URL...', {
      token: token ? 'presente' : 'ausente',
      authSuccess,
      userType,
      userEmail
    });
    
    if (token) {
      console.log('🔑 [FRONTEND] Token JWT encontrado na URL:', token.substring(0, 50) + '...');
      
      // Salvar token em múltiplos locais para compatibilidade máxima
      localStorage.setItem('token', token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('cognito_token', token);
      localStorage.setItem('sistema_token', token);
      localStorage.setItem('authToken', token);
      
      // Salvar informações do usuário se disponíveis
      if (userEmail && userType) {
        const userData = {
          email: decodeURIComponent(userEmail),
          tipo_usuario: userType,
          authenticated: true,
          login_source: 'aws_cognito',
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('auth_user', JSON.stringify(userData));
        console.log('👤 Dados do usuário salvos:', userData);
      }
      
      // Limpar URL após salvar o token
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      toast({
        title: "✅ Autenticação realizada",
        description: "Sistema pronto para carregar usuários.",
        duration: 3000
      });
      
      console.log('✅ Token JWT salvo em todos os locais de armazenamento');
    }
  }, [toast]);

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
              <CompanyManagementContent />
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
              <ContractManagementContent />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Componente específico para gestão de usuários
function UserManagementContent() {
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

  // Buscar usuários do AWS Cognito
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users/list', {
      page: currentPage,
      search: searchTerm,
      status: selectedStatus,
      activeTab: activeTab
    }],
    refetchInterval: 30000,
  });

  // Buscar empresas para o dropdown de edição
  const { data: companiesData } = useQuery({
    queryKey: ['/api/empresas'],
    enabled: !!editingUser,
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
              {/* Lista de usuários por tipo */}
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
    </div>
  );
}

// Componente específico para gestão de empresas
function CompanyManagementContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Empresa | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>({
    nome: "",
    razaoSocial: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    website: "",
    observacoes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar empresas
  const { data: empresas, isLoading, error } = useQuery({
    queryKey: ['/api/empresas'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/empresas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar empresas');
      }

      const result = await response.json();
      return result.data as Empresa[];
    }
  });

  // Criar empresa
  const createMutation = useMutation({
    mutationFn: async (data: InsertEmpresa) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/empresas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/empresas'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Empresa criada",
        description: "A empresa foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar empresa",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      razaoSocial: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      website: "",
      observacoes: ""
    });
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.razaoSocial || !formData.cnpj || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      nome: formData.nome,
      razaoSocial: formData.razaoSocial,
      cnpj: formData.cnpj,
      email: formData.email,
      telefone: formData.telefone || null,
      endereco: formData.endereco || null,
      cidade: formData.cidade || null,
      estado: formData.estado || null,
      cep: formData.cep || null,
      website: formData.website || null,
      observacoes: formData.observacoes || null
    });
  };

  const viewCompany = (empresa: Empresa) => {
    setSelectedCompany(empresa);
    setIsViewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empresas Cadastradas</h2>
          <p className="text-gray-600">Gerencie as empresas parceiras do sistema</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Empresa *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Nome fantasia da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                    placeholder="Razão social completa"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre a empresa"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Empresa"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de empresas */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Carregando empresas...</p>
            </div>
          ) : error ? (
            <Alert className="m-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Erro ao carregar empresas. Verifique sua conexão.
              </AlertDescription>
            </Alert>
          ) : empresas && empresas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{empresa.nome}</div>
                        <div className="text-sm text-gray-500">{empresa.razaoSocial}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{empresa.cnpj}</TableCell>
                    <TableCell>{empresa.email}</TableCell>
                    <TableCell>{empresa.telefone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {empresa.cidade && empresa.estado ? `${empresa.cidade}, ${empresa.estado}` : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => viewCompany(empresa)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhuma empresa cadastrada ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização da empresa */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Empresa</Label>
                  <p className="font-medium">{selectedCompany.nome}</p>
                </div>
                <div>
                  <Label>Razão Social</Label>
                  <p className="font-medium">{selectedCompany.razaoSocial}</p>
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <p className="font-mono">{selectedCompany.cnpj}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedCompany.email}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p>{selectedCompany.telefone || '-'}</p>
                </div>
                <div>
                  <Label>Website</Label>
                  <p>{selectedCompany.website || '-'}</p>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <p>{selectedCompany.endereco || '-'}</p>
                </div>
                <div>
                  <Label>Cidade/Estado</Label>
                  <p>{selectedCompany.cidade && selectedCompany.estado ? `${selectedCompany.cidade}, ${selectedCompany.estado}` : '-'}</p>
                </div>
                <div>
                  <Label>CEP</Label>
                  <p>{selectedCompany.cep || '-'}</p>
                </div>
              </div>
              {selectedCompany.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-gray-600">{selectedCompany.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente específico para gestão de contratos
function ContractManagementContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contrato | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>({
    numero: "",
    nome: "",
    empresaId: null,
    dataInicio: "",
    dataFim: "",
    valor: "",
    moeda: "BRL",
    descricao: "",
    objeto: "",
    status: "active",
    observacoes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar empresas para o select
  const { data: empresas } = useQuery({
    queryKey: ['/api/empresas'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/empresas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar empresas');
      const result = await response.json();
      return result.data as Empresa[];
    }
  });

  // Buscar contratos
  const { data: contratos, isLoading, error } = useQuery({
    queryKey: ['/api/contratos'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/contratos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar contratos');
      const result = await response.json();
      return result.data as Contrato[];
    }
  });

  // Criar contrato
  const createMutation = useMutation({
    mutationFn: async (data: InsertContrato) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contratos'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Contrato criado",
        description: "O contrato foi criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      numero: "",
      nome: "",
      empresaId: null,
      dataInicio: "",
      dataFim: "",
      valor: "",
      moeda: "BRL",
      descricao: "",
      objeto: "",
      status: "active",
      observacoes: ""
    });
  };

  const handleInputChange = (field: keyof ContractFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero || !formData.nome || !formData.empresaId || !formData.dataInicio || !formData.dataFim || !formData.valor) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      numero: formData.numero,
      nome: formData.nome,
      empresaId: formData.empresaId,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      valor: parseFloat(formData.valor.replace(/[^\d,]/g, '').replace(',', '.')),
      moeda: formData.moeda,
      descricao: formData.descricao || null,
      objeto: formData.objeto || null,
      status: formData.status,
      observacoes: formData.observacoes || null
    });
  };

  const viewContract = (contrato: Contrato) => {
    setSelectedContract(contrato);
    setIsViewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800">Suspenso</Badge>;
      case 'finished':
        return <Badge className="bg-gray-100 text-gray-800">Finalizado</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCompanyName = (empresaId: number) => {
    const empresa = empresas?.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de criar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contratos Cadastrados</h2>
          <p className="text-gray-600">Gerencie os contratos comerciais do sistema</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Contrato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Número do Contrato *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    placeholder="CTR-2024-001"
                  />
                </div>
                <div>
                  <Label htmlFor="nome">Nome do Contrato *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Nome identificativo do contrato"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="empresaId">Empresa *</Label>
                  <Select value={formData.empresaId?.toString() || ""} onValueChange={(value) => handleInputChange('empresaId', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas?.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id.toString()}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data de Fim *</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => handleInputChange('dataFim', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => handleInputChange('valor', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="objeto">Objeto do Contrato</Label>
                <Textarea
                  id="objeto"
                  value={formData.objeto}
                  onChange={(e) => handleInputChange('objeto', e.target.value)}
                  placeholder="Descreva o objeto/finalidade do contrato"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição adicional do contrato"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações importantes sobre o contrato"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Contrato"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de contratos */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Carregando contratos...</p>
            </div>
          ) : error ? (
            <Alert className="m-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Erro ao carregar contratos. Verifique sua conexão.
              </AlertDescription>
            </Alert>
          ) : contratos && contratos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contrato.numero}</div>
                        <div className="text-sm text-gray-500">{contrato.nome}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getCompanyName(contrato.empresaId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(contrato.valor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(contrato.dataInicio)} - {formatDate(contrato.dataFim)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(contrato.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => viewContract(contrato)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhum contrato cadastrado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de visualização do contrato */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do Contrato</Label>
                  <p className="font-medium">{selectedContract.numero}</p>
                </div>
                <div>
                  <Label>Nome</Label>
                  <p className="font-medium">{selectedContract.nome}</p>
                </div>
                <div>
                  <Label>Empresa</Label>
                  <p>{getCompanyName(selectedContract.empresaId)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
                <div>
                  <Label>Data de Início</Label>
                  <p>{formatDate(selectedContract.dataInicio)}</p>
                </div>
                <div>
                  <Label>Data de Fim</Label>
                  <p>{formatDate(selectedContract.dataFim)}</p>
                </div>
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium text-green-600">{formatCurrency(selectedContract.valor)}</p>
                </div>
                <div>
                  <Label>Moeda</Label>
                  <p>{selectedContract.moeda}</p>
                </div>
              </div>
              {selectedContract.objeto && (
                <div>
                  <Label>Objeto do Contrato</Label>
                  <p className="text-sm text-gray-600">{selectedContract.objeto}</p>
                </div>
              )}
              {selectedContract.descricao && (
                <div>
                  <Label>Descrição</Label>
                  <p className="text-sm text-gray-600">{selectedContract.descricao}</p>
                </div>
              )}
              {selectedContract.observacoes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm text-gray-600">{selectedContract.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
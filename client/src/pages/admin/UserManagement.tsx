import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
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
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);

  // Buscar usuários
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users/list', {
      group: selectedGroup === 'all' ? '' : selectedGroup,
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
    setCurrentPage(1); // Reset para primeira página
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
    return <Badge variant="outline">Sem Grupo</Badge>;
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
                  ← Voltar ao Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestão de Usuários AWS Cognito
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Admin e Gestores
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
              <p className="text-xs text-blue-700">Admin e Gestores</p>
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
              <Select value={selectedGroup} onValueChange={handleGroupFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Gestores">Gestores</SelectItem>
                </SelectContent>
              </Select>
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
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          {getStatusBadge(user.status, user.enabled)}
                          {getGroupBadge(user.groups)}
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            Criado: {new Date(user.createdDate).toLocaleDateString('pt-BR')}
                          </div>
                          {user.localData?.lastLoginAt && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Último acesso: {new Date(user.localData.lastLoginAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
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

        {/* Modal de Detalhes (placeholder) */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Detalhes do Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
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
                    <p className="text-sm text-gray-900 font-mono">{selectedUser.cognitoId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status, selectedUser.enabled)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Grupos</label>
                    <div className="mt-1">{getGroupBadge(selectedUser.groups)}</div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
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
      </div>
    </div>
  );
}
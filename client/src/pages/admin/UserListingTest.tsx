/**
 * Página de teste para a função listarUsuarios da API externa
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, Users, Search, Filter, FileText, AlertCircle, 
  CheckCircle, XCircle, Clock, Database, Settings, LogOut,
  Cloud, Loader2, Download
} from "lucide-react";
import { useExternalUsers } from "@/hooks/useExternalApi";
import { externalApiService } from "@/services/externalApi";
import { useToast } from "@/hooks/use-toast";
import iaprender_logo from "@assets/iaprender-logo.png";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration?: number;
}

export default function UserListingTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { toast } = useToast();
  
  // Hook do React Query para cache automático
  const { data: cachedUsers = [], isLoading: isLoadingCache, error: cacheError, refetch } = useExternalUsers();

  // Estados para controle manual de teste
  const [manualUsers, setManualUsers] = useState<any[]>([]);
  const [apiStats, setApiStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0
  });

  // Função para testar a API diretamente
  const testarListarUsuarios = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('🔄 Iniciando teste da função listarUsuarios...');
      
      // Chamar a API externa diretamente
      const usuarios = await externalApiService.listarUsuarios();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('✅ Resposta recebida:', usuarios);
      
      setTestResult({
        success: true,
        data: usuarios,
        timestamp: new Date().toISOString(),
        duration
      });
      
      setManualUsers(usuarios);
      
      // Atualizar estatísticas
      setApiStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests + 1,
        failedRequests: prev.failedRequests,
        averageResponseTime: Math.round((prev.averageResponseTime * prev.totalRequests + duration) / (prev.totalRequests + 1))
      }));
      
      toast({
        title: "Teste Concluído",
        description: `${usuarios.length} usuários carregados em ${duration}ms`,
        variant: "default"
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error('❌ Erro no teste:', error);
      
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        duration
      });
      
      // Atualizar estatísticas
      setApiStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        successfulRequests: prev.successfulRequests,
        failedRequests: prev.failedRequests + 1,
        averageResponseTime: Math.round((prev.averageResponseTime * prev.totalRequests + duration) / (prev.totalRequests + 1))
      }));
      
      toast({
        title: "Erro no Teste",
        description: error instanceof Error ? error.message : 'Falha na conexão',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para testar conectividade
  const testarConectividade = async () => {
    setIsLoading(true);
    try {
      const isOnline = await externalApiService.verificarConectividade();
      toast({
        title: isOnline ? "API Online" : "API Offline",
        description: isOnline ? "Conexão estabelecida com sucesso" : "Não foi possível conectar",
        variant: isOnline ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro de Conectividade",
        description: "Falha ao verificar status da API",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários baseado nos critérios
  const filteredUsers = (manualUsers.length > 0 ? manualUsers : cachedUsers).filter(user => {
    const matchesSearch = !searchTerm || 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.documento?.includes(searchTerm);
    
    const matchesType = filterType === "all" || user.tipoUsuario === filterType;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginação
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Estatísticas
  const stats = [
    {
      title: "Total de Usuários",
      value: manualUsers.length || cachedUsers.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Requisições API",
      value: apiStats.totalRequests,
      icon: Database,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Taxa de Sucesso",
      value: apiStats.totalRequests > 0 ? `${Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100)}%` : "0%",
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Tempo Médio",
      value: `${apiStats.averageResponseTime}ms`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      'ativo': 'bg-green-100 text-green-800',
      'inativo': 'bg-red-100 text-red-800',
      'pendente': 'bg-yellow-100 text-yellow-800',
      'suspenso': 'bg-orange-100 text-orange-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getTipoUsuarioBadge = (tipo: string) => {
    const variants = {
      'admin': 'bg-purple-100 text-purple-800',
      'gestor': 'bg-blue-100 text-blue-800',
      'diretor': 'bg-indigo-100 text-indigo-800',
      'professor': 'bg-emerald-100 text-emerald-800',
      'aluno': 'bg-gray-100 text-gray-800'
    };
    return variants[tipo as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  // Função para exportar dados
  const exportarDados = () => {
    const dataStr = JSON.stringify(filteredUsers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-xl p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={iaprender_logo} 
                alt="IAprender Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teste - Listar Usuários</h1>
                <p className="text-sm text-gray-600">Teste da função listarUsuarios da API externa</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/external-users'}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Users className="h-4 w-4 mr-2" />
                Gerenciamento
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/crud'}
                className="border-gray-500 text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controles de Teste */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              Controles de Teste
            </CardTitle>
            <CardDescription>
              Teste manual da função listarUsuarios e verificação de conectividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testarListarUsuarios}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Testar listarUsuarios()
              </Button>
              
              <Button 
                onClick={testarConectividade}
                disabled={isLoading}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4 mr-2" />
                )}
                Verificar Conectividade
              </Button>
              
              <Button 
                onClick={() => refetch()}
                disabled={isLoadingCache}
                variant="outline"
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                {isLoadingCache ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Cache (React Query)
              </Button>
              
              <Button 
                onClick={exportarDados}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                disabled={filteredUsers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do Teste */}
        {testResult && (
          <Card className={`mb-6 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {testResult.success ? 'Teste Bem-sucedido' : 'Teste Falhado'}
                  </h3>
                  <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.success 
                      ? `${Array.isArray(testResult.data) ? testResult.data.length : 0} usuários carregados em ${testResult.duration}ms`
                      : testResult.error
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(testResult.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  placeholder="Nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterType">Tipo de Usuário</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="aluno">Aluno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filterStatus">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="itemsPerPage">Itens por Página</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuários Carregados</CardTitle>
                <CardDescription>
                  Mostrando {paginatedUsers.length} de {totalItems} usuários
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(isLoading || isLoadingCache) ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome / Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Telefone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user, index) => (
                      <TableRow key={user.id || index}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-blue-600">{user.nome || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{user.email || 'N/A'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoUsuarioBadge(user.tipoUsuario || 'aluno')}>
                            {user.tipoUsuario || 'aluno'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(user.status || 'ativo')}>
                            {user.status || 'ativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{user.documento || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{user.telefone || '-'}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {paginatedUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum usuário encontrado</p>
                  </div>
                )}

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
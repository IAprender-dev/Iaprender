/**
 * Componente para gerenciamento de usuários via API externa
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, Edit, Trash2, Plus, Users, RefreshCw, LogOut, Settings, 
  FileText, Search, AlertCircle, CheckCircle, XCircle, Clock,
  Database, Cloud
} from "lucide-react";
import { useExternalUsers, useCreateExternalUser, useUpdateExternalUser, useDeleteExternalUser, useExternalApiHealth } from "@/hooks/useExternalApi";
import { ExternalUser } from "@/services/externalApi";
import iaprender_logo from "@assets/iaprender-logo.png";

export default function ExternalUsersManagement() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [selectedUser, setSelectedUser] = useState<ExternalUser | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Hooks da API externa
  const { data: users = [], isLoading, error, refetch } = useExternalUsers();
  const { data: apiHealth = false } = useExternalApiHealth();
  const createUserMutation = useCreateExternalUser();
  const updateUserMutation = useUpdateExternalUser();
  const deleteUserMutation = useDeleteExternalUser();

  // Estado do formulário
  const [formData, setFormData] = useState<Partial<ExternalUser>>({
    nome: "",
    email: "",
    tipoUsuario: "aluno",
    status: "ativo",
    telefone: "",
    endereco: "",
    documento: "",
    observacoes: ""
  });

  // Capturar token do Cognito da URL quando componente monta
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cognitoToken = urlParams.get('cognito_token');
    
    if (cognitoToken) {
      localStorage.setItem('cognito_token', cognitoToken);
      // Limpar URL dos parâmetros sensíveis
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔐 Token Cognito salvo para uso na API externa');
    }
  }, []);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.documento?.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, userData: formData });
    } else {
      createUserMutation.mutate(formData);
    }
    
    // Fechar modais após sucesso
    if (!updateUserMutation.isError && !createUserMutation.isError) {
      setIsCreateOpen(false);
      setIsEditOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      tipoUsuario: "aluno",
      status: "ativo",
      telefone: "",
      endereco: "",
      documento: "",
      observacoes: ""
    });
    setSelectedUser(null);
  };

  const openEdit = (user: ExternalUser) => {
    setSelectedUser(user);
    setFormData({
      nome: user.nome || "",
      email: user.email || "",
      tipoUsuario: user.tipoUsuario || "aluno",
      status: user.status || "ativo",
      telefone: user.telefone || "",
      endereco: user.endereco || "",
      documento: user.documento || "",
      observacoes: user.observacoes || ""
    });
    setIsEditOpen(true);
  };

  const openView = (user: ExternalUser) => {
    setSelectedUser(user);
    setIsViewOpen(true);
  };

  const handleDelete = (user: ExternalUser) => {
    if (confirm(`Confirma a exclusão do usuário ${user.nome}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

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

  const stats = [
    {
      title: "Total de Usuários",
      value: users.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Usuários Ativos",
      value: users.filter(u => u.status === 'ativo').length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "API Externa",
      value: apiHealth ? "Online" : "Offline",
      icon: apiHealth ? Cloud : AlertCircle,
      color: apiHealth ? "text-green-600" : "text-red-600",
      bgColor: apiHealth ? "bg-green-50" : "bg-red-50"
    },
    {
      title: "Sincronização",
      value: error ? "Erro" : "OK",
      icon: error ? XCircle : Database,
      color: error ? "text-red-600" : "text-green-600",
      bgColor: error ? "bg-red-50" : "bg-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header com Logo e Navegação */}
        <div className="bg-white shadow-lg rounded-xl p-4 mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={iaprender_logo} 
                alt="IAprender Logo" 
                className="h-12 w-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IAprender</h1>
                <p className="text-sm text-gray-600">Gestão de Usuários - API Externa</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/crud'}
                className="border-gray-500 text-gray-600 hover:bg-gray-50"
              >
                <Database className="h-4 w-4 mr-2" />
                Banco Local
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/auth';
                }}
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
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

        {/* Alerta de erro se API externa estiver indisponível */}
        {(error || !apiHealth) && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">API Externa Indisponível</h3>
                  <p className="text-sm text-red-700">
                    {error?.message || "Não foi possível conectar com a API externa. Verifique sua conexão e token de autenticação."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo Principal */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  <Cloud className="h-5 w-5 mr-2 text-blue-600" />
                  Usuários - API Externa
                </CardTitle>
                <CardDescription>
                  Gerenciamento de usuários via API externa AWS
                </CardDescription>
              </div>
              <Button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!apiHealth}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros e Busca */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativos</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela de Usuários */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome / Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-blue-600">{user.nome}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoUsuarioBadge(user.tipoUsuario)}>
                          {user.tipoUsuario}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{user.documento || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredUsers.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum usuário encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criar/Editar */}
        <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoUsuario">Tipo de Usuário</Label>
                  <Select 
                    value={formData.tipoUsuario} 
                    onValueChange={(value) => setFormData({...formData, tipoUsuario: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="aluno">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="documento">Documento (CPF/CNPJ)</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setIsEditOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) && (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {selectedUser ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome</Label>
                    <p className="font-medium">{selectedUser.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                    <p>
                      <Badge className={getTipoUsuarioBadge(selectedUser.tipoUsuario)}>
                        {selectedUser.tipoUsuario}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <p>
                      <Badge className={getStatusBadge(selectedUser.status)}>
                        {selectedUser.status}
                      </Badge>
                    </p>
                  </div>
                </div>
                {selectedUser.telefone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="font-medium">{selectedUser.telefone}</p>
                  </div>
                )}
                {selectedUser.documento && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Documento</Label>
                    <p className="font-medium font-mono">{selectedUser.documento}</p>
                  </div>
                )}
                {selectedUser.endereco && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="font-medium">{selectedUser.endereco}</p>
                  </div>
                )}
                {selectedUser.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Observações</Label>
                    <p className="font-medium">{selectedUser.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
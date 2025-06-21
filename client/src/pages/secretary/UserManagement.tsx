import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  GraduationCap, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid3X3,
  List,
  ArrowUpDown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  School,
  Shield
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher';
  status: 'active' | 'inactive' | 'pending';
  schoolYear?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: number;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    role: "student",
    schoolYear: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/secretary/users', searchTerm, filterRole, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/secretary/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/secretary/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      toast({ 
        title: "✅ Usuário criado com sucesso!", 
        description: "O novo usuário foi adicionado à plataforma." 
      });
      setIsCreateDialogOpen(false);
      resetNewUserForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao criar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: any }) => {
      const response = await fetch(`/api/secretary/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      toast({ 
        title: "✅ Usuário atualizado com sucesso!", 
        description: "As alterações foram salvas." 
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao atualizar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/secretary/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      toast({ 
        title: "✅ Usuário removido com sucesso!", 
        description: "O usuário foi removido da plataforma." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao remover usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetNewUserForm = () => {
    setNewUser({
      firstName: "",
      lastName: "", 
      email: "",
      role: "student",
      schoolYear: "",
      phone: "",
      address: "",
      dateOfBirth: "",
    });
  };

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = (userData: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestão de Usuários - Secretaria - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/secretary">
                  <Button variant="outline" size="sm" className="gap-2 border-slate-300 hover:bg-slate-50">
                    <Users className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    Gestão de Usuários
                  </h1>
                  <p className="text-slate-600 mt-1">Gerencie alunos, professores e suas informações</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
                  <Shield className="h-4 w-4 mr-1" />
                  {filteredUsers.length} usuários
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Controls */}
          <Card className="mb-8 border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-1 gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, email ou usuário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 bg-white/80 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                    />
                  </div>
                  
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48 h-12 bg-white/80 border-slate-300">
                      <SelectValue placeholder="Filtrar por cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cargos</SelectItem>
                      <SelectItem value="student">Alunos</SelectItem>
                      <SelectItem value="teacher">Professores</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 h-12 bg-white/80 border-slate-300">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium h-12 px-6">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                          Criar Novo Usuário
                        </DialogTitle>
                        <DialogDescription>
                          Preencha os dados para cadastrar um novo usuário na plataforma
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Personal Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Nome
                            </Label>
                            <Input
                              value={newUser.firstName}
                              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                              className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                              placeholder="Digite o nome"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Sobrenome
                            </Label>
                            <Input
                              value={newUser.lastName}
                              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                              className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                              placeholder="Digite o sobrenome"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            E-mail
                          </Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                            placeholder="usuario@dominio.com"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              Cargo
                            </Label>
                            <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                              <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Aluno</SelectItem>
                                <SelectItem value="teacher">Professor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {newUser.role === 'student' && (
                            <div className="space-y-2">
                              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <School className="h-4 w-4" />
                                Ano Escolar
                              </Label>
                              <Select value={newUser.schoolYear} onValueChange={(value) => setNewUser({...newUser, schoolYear: value})}>
                                <SelectTrigger className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500">
                                  <SelectValue placeholder="Selecione o ano" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1ano">1º Ano</SelectItem>
                                  <SelectItem value="2ano">2º Ano</SelectItem>
                                  <SelectItem value="3ano">3º Ano</SelectItem>
                                  <SelectItem value="4ano">4º Ano</SelectItem>
                                  <SelectItem value="5ano">5º Ano</SelectItem>
                                  <SelectItem value="6ano">6º Ano</SelectItem>
                                  <SelectItem value="7ano">7º Ano</SelectItem>
                                  <SelectItem value="8ano">8º Ano</SelectItem>
                                  <SelectItem value="9ano">9º Ano</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Telefone
                            </Label>
                            <Input
                              value={newUser.phone}
                              onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                              className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                              placeholder="(11) 99999-9999"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Data de Nascimento
                            </Label>
                            <Input
                              type="date"
                              value={newUser.dateOfBirth}
                              onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                              className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Endereço
                          </Label>
                          <Textarea
                            value={newUser.address}
                            onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                            className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                            placeholder="Endereço completo"
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="border-slate-300 hover:bg-slate-50"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateUser}
                          disabled={createUserMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-0 bg-white/70 shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((userData) => (
                <Card key={userData.id} className="border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-slate-200 group-hover:border-purple-300 transition-colors">
                          <AvatarFallback className={`text-white font-bold text-lg ${
                            userData.role === 'teacher' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                          }`}>
                            {userData.firstName[0]}{userData.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {userData.firstName} {userData.lastName}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">{userData.email}</p>
                          <div className="flex gap-2">
                            <Badge className={`text-xs ${getRoleColor(userData.role)}`}>
                              {userData.role === 'teacher' ? 'Professor' : 'Aluno'}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(userData.status)}`}>
                              {userData.status === 'active' ? 'Ativo' : userData.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Checkbox
                        checked={selectedUsers.has(userData.id)}
                        onCheckedChange={() => handleSelectUser(userData.id)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                    </div>

                    <div className="space-y-3 mb-4">
                      {userData.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          {userData.phone}
                        </div>
                      )}
                      {userData.schoolYear && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <School className="h-4 w-4" />
                          {userData.schoolYear}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        Criado em {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(userData)}
                        className="flex-1 border-slate-300 hover:bg-slate-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(userData.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                        <TableHead className="font-bold text-slate-700">Cargo</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Contato</TableHead>
                        <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                        <TableHead className="font-bold text-slate-700 w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userData) => (
                        <TableRow key={userData.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(userData.id)}
                              onCheckedChange={() => handleSelectUser(userData.id)}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`text-white font-bold ${
                                  userData.role === 'teacher' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                }`}>
                                  {userData.firstName[0]}{userData.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">{userData.firstName} {userData.lastName}</p>
                                <p className="text-sm text-slate-500">{userData.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRoleColor(userData.role)}`}>
                              {userData.role === 'teacher' ? 'Professor' : 'Aluno'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(userData.status)}`}>
                              {userData.status === 'active' ? 'Ativo' : userData.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {userData.phone && (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Phone className="h-3 w-3" />
                                  {userData.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingUser(userData)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(userData.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && filteredUsers.length === 0 && (
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros para encontrar usuários.'
                    : 'Não há usuários cadastrados no sistema.'}
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                  Editar Usuário
                </DialogTitle>
                <DialogDescription>
                  Altere as informações do usuário {editingUser.firstName} {editingUser.lastName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Edit form similar to create form but with editingUser data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Nome</Label>
                    <Input
                      defaultValue={editingUser.firstName}
                      className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Sobrenome</Label>
                    <Input
                      defaultValue={editingUser.lastName}
                      className="h-12 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-purple-500"
                    />
                  </div>
                </div>
                {/* Add more fields as needed */}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingUser(null)}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleUpdateUser({})}
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
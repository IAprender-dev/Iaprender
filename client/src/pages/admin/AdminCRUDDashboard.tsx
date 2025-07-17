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
  DollarSign,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  CreditCard,
  Archive,
  LogOut,
  Bot,
  Brain
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
import { Empresa, InsertEmpresa, Contrato, InsertContrato, User, InsertUser } from "@shared/schema";
import IAprender_Logo from "@/assets/IAprender_1750262377399.png";
import { LogoutButton } from "@/components/LogoutButton";

// Funções de formatação para campos brasileiros
const formatCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
  }
  return value;
};

const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return value;
};

const removeCNPJFormat = (value: string) => {
  return value.replace(/\D/g, '');
};

const removePhoneFormat = (value: string) => {
  return value.replace(/\D/g, '');
};

// Interface para dados do formulário de empresa
interface EmpresaFormData {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  emailContato: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  responsavel?: string;
  cargoResponsavel?: string;
  observacoes?: string;
}

// Interface para dados do formulário de contrato
interface ContratoFormData {
  numero: string;
  nome: string;
  empresaId: number | null;
  dataInicio: string;
  dataFim: string;
  valor: string;
  moeda: string;
  tipoContrato?: string;
  descricao?: string;
  objeto?: string;
  status: string;
  observacoes?: string;
  responsavelContrato?: string;
  emailResponsavel?: string;
  telefoneResponsavel?: string;
}

// Interface para dados do formulário de usuário
interface UsuarioFormData {
  nome: string;
  email: string;
  tipoUsuario: string;
  status: string;
  empresaId?: number;
  contratoId?: number;
  telefone?: string;
  endereco?: string;
  dataNascimento?: string;
  documento?: string;
  observacoes?: string;
}

// Componente de Stats Cards
function StatsCards({ type, data }: { type: 'empresa' | 'contrato' | 'usuario', data: any }) {
  const getStatsForType = () => {
    switch (type) {
      case 'empresa':
        return [
          { title: 'Total de Empresas', value: data?.total || 0, icon: Building, color: 'text-blue-600' },
          { title: 'Empresas Ativas', value: data?.ativas || 0, icon: CheckCircle, color: 'text-green-600' },
          { title: 'Empresas Inativas', value: data?.inativas || 0, icon: XCircle, color: 'text-red-600' },
          { title: 'Com Contratos', value: data?.comContratos || 0, icon: FileText, color: 'text-purple-600' }
        ];
      case 'contrato':
        return [
          { title: 'Total de Contratos', value: data?.total || 0, icon: FileText, color: 'text-blue-600' },
          { title: 'Contratos Ativos', value: data?.ativos || 0, icon: CheckCircle, color: 'text-green-600' },
          { title: 'Valor Total', value: `R$ ${data?.valorTotal?.toLocaleString() || 0}`, icon: DollarSign, color: 'text-emerald-600' },
          { title: 'Vencendo em 30 dias', value: data?.vencendo30Dias || 0, icon: Clock, color: 'text-orange-600' }
        ];
      case 'usuario':
        return [
          { title: 'Total de Usuários', value: data?.total || 0, icon: Users, color: 'text-blue-600' },
          { title: 'Usuários Ativos', value: data?.ativos || 0, icon: UserCheck, color: 'text-green-600' },
          { title: 'Admins', value: data?.admins || 0, icon: Shield, color: 'text-purple-600' },
          { title: 'Gestores', value: data?.gestores || 0, icon: UserX, color: 'text-indigo-600' }
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForType();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente principal do Dashboard CRUD
export default function AdminCRUDDashboard() {
  const [activeTab, setActiveTab] = useState("empresas");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Token authentication handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, '', window.location.pathname);
      
      toast({
        title: "Autenticação realizada",
        description: "Sistema pronto para uso.",
        duration: 3000
      });
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
                  src={IAprender_Logo} 
                  alt="IAprender" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'block';
                  }}
                />
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestão Administrativa</h1>
                <p className="text-sm text-gray-600">CRUD de Empresas, Usuários e Contratos</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/ai-resources">
                <Button variant="outline" size="sm" className="text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300">
                  <Bot className="h-4 w-4 mr-2" />
                  Recursos IA
                </Button>
              </Link>
              <Link href="/hybrid-lambda-demo">
                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300">
                  <Brain className="h-4 w-4 mr-2" />
                  Sistema Híbrido
                </Button>
              </Link>
              <LogoutButton 
                variant="outline" 
                size="sm"
                text="Sair"
                showIcon={true}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              />
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="empresas" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="contratos" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Contratos
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Empresas */}
          <TabsContent value="empresas">
            <EmpresasTab 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              isCreateOpen={isCreateOpen}
              setIsCreateOpen={setIsCreateOpen}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              isViewOpen={isViewOpen}
              setIsViewOpen={setIsViewOpen}
            />
          </TabsContent>

          {/* Tab Content - Usuários */}
          <TabsContent value="usuarios">
            <UsuariosTab 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              isCreateOpen={isCreateOpen}
              setIsCreateOpen={setIsCreateOpen}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              isViewOpen={isViewOpen}
              setIsViewOpen={setIsViewOpen}
            />
          </TabsContent>

          {/* Tab Content - Contratos */}
          <TabsContent value="contratos">
            <ContratosTab 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              isCreateOpen={isCreateOpen}
              setIsCreateOpen={setIsCreateOpen}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
              isViewOpen={isViewOpen}
              setIsViewOpen={setIsViewOpen}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===================== COMPONENTE EMPRESAS =====================
function EmpresasTab({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus,
  currentPage,
  setCurrentPage,
  selectedItem,
  setSelectedItem,
  isCreateOpen,
  setIsCreateOpen,
  isEditOpen,
  setIsEditOpen,
  isViewOpen,
  setIsViewOpen
}: any) {
  const [formData, setFormData] = useState<EmpresaFormData>({
    nome: "",
    razaoSocial: "",
    cnpj: "",
    emailContato: "",
    telefone: "",
    endereco: "",
    cidade: "",
    estado: "",
    responsavel: "",
    cargoResponsavel: "",
    observacoes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar empresas
  const { data: empresasResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/companies', { page: currentPage, search: searchTerm, status: filterStatus }],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: filterStatus
      });

      const response = await fetch(`/api/admin/companies?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar empresas');
      return response.json();
    }
  });

  // Buscar estatísticas de empresas
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/admin/companies/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/companies/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    }
  });

  // Criar empresa
  const createMutation = useMutation({
    mutationFn: async (data: EmpresaFormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Erro ao criar empresa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/stats'] });
      setIsCreateOpen(false);
      setFormData({
        nome: "",
        razaoSocial: "",
        cnpj: "",
        emailContato: "",
        telefone: "",
        endereco: "",
        cidade: "",
        estado: "",
        responsavel: "",
        cargoResponsavel: "",
        observacoes: ""
      });
      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Atualizar empresa
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<EmpresaFormData> }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Erro ao atualizar empresa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/stats'] });
      setIsEditOpen(false);
      setSelectedItem(null);
      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Deletar empresa
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao deletar empresa');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/companies/stats'] });
      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao deletar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEdit = (empresa: Empresa) => {
    setSelectedItem(empresa);
    setFormData({
      nome: empresa.nome,
      razaoSocial: empresa.razaoSocial || "",
      cnpj: empresa.cnpj,
      emailContato: empresa.emailContato,
      telefone: empresa.telefone || "",
      endereco: empresa.endereco || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      responsavel: empresa.responsavel || "",
      cargoResponsavel: empresa.cargoResponsavel || "",
      observacoes: empresa.observacoes || ""
    });
    setIsEditOpen(true);
  };

  const openView = (empresa: Empresa) => {
    setSelectedItem(empresa);
    setIsViewOpen(true);
  };

  // Funções específicas para usuários
  const openEditUser = (usuario: User) => {
    setSelectedItem(usuario);
    setFormData({
      nome: usuario.nome || "",
      email: usuario.email || "",
      tipoUsuario: usuario.tipoUsuario || "",
      status: usuario.status || "ativo",
      empresaId: usuario.empresaId || undefined,
      contratoId: usuario.contratoId || undefined,
      telefone: usuario.telefone || "",
      endereco: usuario.endereco || "",
      dataNascimento: usuario.dataNascimento || "",
      documento: usuario.documento || "",
      observacoes: usuario.observacoes || ""
    });
    setIsEditOpen(true);
  };

  const openViewUser = (usuario: User) => {
    setSelectedItem(usuario);
    setIsViewOpen(true);
  };

  const empresas = empresasResponse?.empresas || [];
  const stats = statsResponse?.stats || {};
  const total = empresasResponse?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards type="empresa" data={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Gestão de Empresas
              </CardTitle>
              <CardDescription>
                Gerencie empresas cadastradas no sistema
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, razão social ou CNPJ..."
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
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Empresas */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Identificação</TableHead>
                    <TableHead>Detalhes da Empresa</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((empresa: Empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-bold text-blue-600 text-lg leading-tight">
                            {empresa.razaoSocial || empresa.nome}
                          </div>
                          <div className="text-sm text-gray-600">
                            {empresa.razaoSocial && (
                              <div className="italic text-gray-500">{empresa.nome}</div>
                            )}
                          </div>
                          {empresa.cnpj && (
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded-full font-mono inline-block">
                              CNPJ: {empresa.cnpj}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {empresa.emailContato && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              <span>{empresa.emailContato}</span>
                            </div>
                          )}
                          {empresa.telefone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-2 text-gray-400" />
                              <span>{empresa.telefone}</span>
                            </div>
                          )}
                          {(empresa.cidade || empresa.estado) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-2 text-gray-400" />
                              <span>
                                {empresa.cidade && empresa.estado 
                                  ? `${empresa.cidade}, ${empresa.estado}`
                                  : empresa.cidade || empresa.estado || '-'
                                }
                              </span>
                            </div>
                          )}
                          {empresa.responsavel && (
                            <div className="flex items-start text-sm text-gray-600">
                              <Users className="h-3 w-3 mr-2 text-gray-400 mt-0.5" />
                              <div>
                                <div className="font-medium">{empresa.responsavel}</div>
                                {empresa.cargoResponsavel && (
                                  <div className="text-xs text-gray-500">{empresa.cargoResponsavel}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={empresa.ativo ? "default" : "secondary"}>
                          {empresa.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openView(empresa)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(empresa)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteMutation.mutate(empresa.id)}
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

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages} ({total} empresas)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar Empresa */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedItem(null);
          setFormData({
            nome: "",
            razaoSocial: "",
            cnpj: "",
            emailContato: "",
            telefone: "",
            endereco: "",
            cidade: "",
            estado: "",
            responsavel: "",
            cargoResponsavel: "",
            observacoes: ""
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                  placeholder="Razão social da empresa"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome Fantasia</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome fantasia"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleanValue = removeCNPJFormat(value);
                    if (cleanValue.length <= 14) {
                      const formatted = formatCNPJ(cleanValue);
                      setFormData(prev => ({ ...prev, cnpj: formatted }));
                    }
                  }}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="emailContato">Email de Contato *</Label>
                <Input
                  id="emailContato"
                  type="email"
                  value={formData.emailContato}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailContato: e.target.value }))}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleanValue = removePhoneFormat(value);
                    if (cleanValue.length <= 11) {
                      const formatted = formatPhone(cleanValue);
                      setFormData(prev => ({ ...prev, telefone: formatted }));
                    }
                  }}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cargoResponsavel">Cargo do Responsável</Label>
              <Input
                id="cargoResponsavel"
                value={formData.cargoResponsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, cargoResponsavel: e.target.value }))}
                placeholder="Diretor, Gerente, etc."
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {selectedItem ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Visualizar Empresa */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Razão Social</Label>
                  <p className="text-sm">{selectedItem.razaoSocial || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome Fantasia</Label>
                  <p className="text-sm">{selectedItem.nome}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                  <p className="text-sm">{selectedItem.cnpj}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedItem.emailContato}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-sm">{selectedItem.telefone || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={selectedItem.ativo ? "default" : "secondary"}>
                    {selectedItem.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
              {selectedItem.endereco && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  <p className="text-sm">{selectedItem.endereco}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cidade</Label>
                  <p className="text-sm">{selectedItem.cidade || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estado</Label>
                  <p className="text-sm">{selectedItem.estado || '-'}</p>
                </div>
              </div>
              {selectedItem.responsavel && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="text-sm">{selectedItem.responsavel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cargo</Label>
                    <p className="text-sm">{selectedItem.cargoResponsavel || '-'}</p>
                  </div>
                </div>
              )}
              {selectedItem.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedItem.observacoes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-sm">{new Date(selectedItem.criadoEm).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p className="text-sm">{selectedItem.atualizadoEm ? new Date(selectedItem.atualizadoEm).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== COMPONENTE USUÁRIOS =====================
function UsuariosTab({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus,
  currentPage,
  setCurrentPage,
  selectedItem,
  setSelectedItem,
  isCreateOpen,
  setIsCreateOpen,
  isEditOpen,
  setIsEditOpen,
  isViewOpen,
  setIsViewOpen
}: any) {
  const [formData, setFormData] = useState<UsuarioFormData>({
    nome: "",
    email: "",
    tipoUsuario: "",
    status: "ativo",
    empresaId: undefined,
    contratoId: undefined,
    telefone: "",
    endereco: "",
    dataNascimento: "",
    documento: "",
    observacoes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar usuários
  const { data: usuariosResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page: currentPage, search: searchTerm, status: filterStatus }],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: filterStatus
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar usuários');
      return response.json();
    }
  });

  // Buscar estatísticas de usuários
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/admin/users/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    }
  });

  // Buscar empresas para select
  const { data: empresasResponse } = useQuery({
    queryKey: ['/api/admin/companies/list'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/companies?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar empresas');
      return response.json();
    }
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: UsuarioFormData) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Erro ao criar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsCreateOpen(false);
      setFormData({
        nome: "",
        email: "",
        tipoUsuario: "",
        status: "ativo",
        empresaId: undefined,
        contratoId: undefined,
        telefone: "",
        endereco: "",
        dataNascimento: "",
        documento: "",
        observacoes: ""
      });
      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para editar usuário
  const editUserMutation = useMutation({
    mutationFn: async (data: UsuarioFormData & { id: number }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Erro ao atualizar usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      setIsEditOpen(false);
      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para excluir usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao excluir usuário');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/stats'] });
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const usuarios = usuariosResponse?.usuarios || [];
  const stats = statsResponse?.stats || {};
  const empresas = empresasResponse?.empresas || [];
  const total = usuariosResponse?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards type="usuario" data={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie usuários cadastrados no sistema
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou email..."
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
                <SelectItem value="suspenso">Suspensos</SelectItem>
                <SelectItem value="bloqueado">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Usuários */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Nome</TableHead>
                    <TableHead>Nível de Acesso</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-[140px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario: User) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {usuario.tipoUsuario === 'admin' ? 'Administrador' :
                           usuario.tipoUsuario === 'gestor' ? 'Gestor Municipal' :
                           usuario.tipoUsuario === 'diretor' ? 'Diretor' :
                           usuario.tipoUsuario === 'professor' ? 'Professor' :
                           usuario.tipoUsuario === 'aluno' ? 'Aluno' : usuario.tipoUsuario}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.status === 'ativo' ? "default" : "secondary"}>
                          {usuario.status === 'ativo' ? 'Ativo' : 
                           usuario.status === 'inativo' ? 'Inativo' : 
                           usuario.status === 'suspenso' ? 'Suspenso' : 'Bloqueado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openViewUser(usuario)} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditUser(usuario)} title="Editar usuário">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este usuário?')) {
                              deleteUserMutation.mutate(usuario.id);
                            }
                          }} title="Excluir usuário" className="text-red-600 hover:text-red-800">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages} ({total} usuários)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Visualizar Usuário */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ver dados do usuário</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome</Label>
                  <p className="text-sm">{selectedItem.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedItem.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nível de Acesso</Label>
                  <Badge variant="outline">
                    {selectedItem.tipoUsuario === 'admin' ? 'Administrador' :
                     selectedItem.tipoUsuario === 'gestor' ? 'Gestor Municipal' :
                     selectedItem.tipoUsuario === 'diretor' ? 'Diretor' :
                     selectedItem.tipoUsuario === 'professor' ? 'Professor' :
                     selectedItem.tipoUsuario === 'aluno' ? 'Aluno' : selectedItem.tipoUsuario}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Situação</Label>
                  <Badge variant={selectedItem.status === 'ativo' ? "default" : "secondary"}>
                    {selectedItem.status === 'ativo' ? 'Ativo' : 
                     selectedItem.status === 'inativo' ? 'Inativo' : 
                     selectedItem.status === 'suspenso' ? 'Suspenso' : 'Bloqueado'}
                  </Badge>
                </div>
              </div>
              {(selectedItem.telefone || selectedItem.documento) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.telefone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                      <p className="text-sm">{selectedItem.telefone}</p>
                    </div>
                  )}
                  {selectedItem.documento && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Documento</Label>
                      <p className="text-sm">{selectedItem.documento}</p>
                    </div>
                  )}
                </div>
              )}
              {selectedItem.endereco && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                  <p className="text-sm">{selectedItem.endereco}</p>
                </div>
              )}
              {selectedItem.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Observações</Label>
                  <p className="text-sm">{selectedItem.observacoes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-sm">{selectedItem.criadoEm ? new Date(selectedItem.criadoEm).toLocaleDateString() : '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p className="text-sm">{selectedItem.atualizadoEm ? new Date(selectedItem.atualizadoEm).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Usuário */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createUserMutation.mutate(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipoUsuario">Nível de Acesso *</Label>
                <Select value={formData.tipoUsuario} onValueChange={(value) => setFormData({...formData, tipoUsuario: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor Municipal</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                    <SelectItem value="aluno">Aluno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Situação</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
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
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="documento">Documento</Label>
                <Input
                  id="documento"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  placeholder="CPF ou RG"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                placeholder="Endereço completo"
              />
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações adicionais"
                className="h-20"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Usuário */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar dados do usuário</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (selectedItem) {
                editUserMutation.mutate({ ...formData, id: selectedItem.id });
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome *</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tipoUsuario">Nível de Acesso *</Label>
                  <Select value={formData.tipoUsuario} onValueChange={(value) => setFormData({...formData, tipoUsuario: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor Municipal</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="aluno">Aluno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Situação</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-documento">Documento</Label>
                  <Input
                    id="edit-documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({...formData, documento: e.target.value})}
                    placeholder="CPF ou RG"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Endereço completo"
                />
              </div>
              <div>
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais"
                  className="h-20"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== COMPONENTE CONTRATOS =====================
function ContratosTab({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus,
  currentPage,
  setCurrentPage,
  selectedItem,
  setSelectedItem,
  isCreateOpen,
  setIsCreateOpen,
  isEditOpen,
  setIsEditOpen,
  isViewOpen,
  setIsViewOpen
}: any) {
  const [formData, setFormData] = useState<ContratoFormData>({
    numero: "",
    nome: "",
    empresaId: null,
    dataInicio: "",
    dataFim: "",
    valor: "",
    moeda: "BRL",
    tipoContrato: "",
    descricao: "",
    objeto: "",
    status: "active",
    observacoes: "",
    responsavelContrato: "",
    emailResponsavel: "",
    telefoneResponsavel: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar contratos
  const { data: contratosResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/contracts', { page: currentPage, search: searchTerm, status: filterStatus }],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: filterStatus
      });

      const response = await fetch(`/api/admin/contracts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar contratos');
      return response.json();
    }
  });

  // Buscar estatísticas de contratos
  const { data: statsResponse } = useQuery({
    queryKey: ['/api/admin/contracts/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/contracts/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar estatísticas');
      return response.json();
    }
  });

  // Buscar empresas para select
  const { data: empresasResponse } = useQuery({
    queryKey: ['/api/admin/companies/list'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/admin/companies?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar empresas');
      return response.json();
    }
  });

  const contratos = contratosResponse?.contratos || [];
  const stats = statsResponse?.stats || {};
  const empresas = empresasResponse?.empresas || [];
  const total = contratosResponse?.pagination?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards type="contrato" data={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Gestão de Contratos
              </CardTitle>
              <CardDescription>
                Gerencie contratos cadastrados no sistema
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número ou nome do contrato..."
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
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Contratos */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Identificação</TableHead>
                    <TableHead>Detalhes do Contrato</TableHead>
                    <TableHead className="w-[150px]">Valor</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato: Contrato) => (
                    <TableRow key={contrato.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-blue-600">{contrato.numero}</div>
                          <div className="text-xs text-gray-500">
                            {contrato.tipoContrato && (
                              <span className="inline-block bg-gray-100 px-2 py-1 rounded-full text-xs">
                                {contrato.tipoContrato}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900 leading-tight">
                            {contrato.nome}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-500 w-16">Início:</span>
                              <span>{new Date(contrato.dataInicio).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs font-medium text-gray-500 w-16">Fim:</span>
                              <span>{new Date(contrato.dataFim).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {contrato.numeroLicencas && (
                              <div className="flex items-center">
                                <span className="text-xs font-medium text-gray-500 w-16">Licenças:</span>
                                <span className="text-blue-600 font-medium">{contrato.numeroLicencas.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-green-600 text-lg">
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: contrato.moeda || 'BRL' 
                            }).format(contrato.valorTotal || contrato.valor || 0)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contrato.moeda || 'BRL'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          contrato.status === 'ativo' || contrato.status === 'active' ? "default" :
                          contrato.status === 'pending' || contrato.status === 'pendente' ? "secondary" :
                          contrato.status === 'expired' || contrato.status === 'expirado' ? "destructive" : "outline"
                        }>
                          {contrato.status === 'ativo' || contrato.status === 'active' ? 'Ativo' :
                           contrato.status === 'pending' || contrato.status === 'pendente' ? 'Pendente' :
                           contrato.status === 'expired' || contrato.status === 'expirado' ? 'Expirado' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedItem(contrato);
                            setIsViewOpen(true);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedItem(contrato);
                            setFormData({
                              numero: contrato.numero || "",
                              nome: contrato.nome || "",
                              empresaId: contrato.empresaId,
                              dataInicio: contrato.dataInicio ? new Date(contrato.dataInicio).toISOString().split('T')[0] : "",
                              dataFim: contrato.dataFim ? new Date(contrato.dataFim).toISOString().split('T')[0] : "",
                              valor: (contrato.valorTotal || contrato.valor)?.toString() || "",
                              moeda: contrato.moeda || "BRL",
                              tipoContrato: contrato.tipoContrato || "",
                              descricao: contrato.descricao || "",
                              objeto: contrato.objeto || "",
                              status: contrato.status || "active",
                              observacoes: contrato.observacoes || "",
                              responsavelContrato: contrato.responsavelContrato || "",
                              emailResponsavel: contrato.emailResponsavel || "",
                              telefoneResponsavel: contrato.telefoneResponsavel || ""
                            });
                            setIsEditOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700">
                    Página {currentPage} de {totalPages} ({total} contratos)
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Visualizar Contrato */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número</Label>
                  <p className="text-sm font-medium">{selectedItem.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome</Label>
                  <p className="text-sm">{selectedItem.nome}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Valor</Label>
                  <p className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: selectedItem.moeda || 'BRL' 
                    }).format(selectedItem.valor)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={
                    selectedItem.status === 'active' ? "default" :
                    selectedItem.status === 'pending' ? "secondary" :
                    selectedItem.status === 'expired' ? "destructive" : "outline"
                  }>
                    {selectedItem.status === 'active' ? 'Ativo' :
                     selectedItem.status === 'pending' ? 'Pendente' :
                     selectedItem.status === 'expired' ? 'Expirado' : 'Cancelado'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Início</Label>
                  <p className="text-sm">{new Date(selectedItem.dataInicio).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Fim</Label>
                  <p className="text-sm">{new Date(selectedItem.dataFim).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedItem.descricao && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-sm">{selectedItem.descricao}</p>
                </div>
              )}
              {selectedItem.objeto && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Objeto</Label>
                  <p className="text-sm">{selectedItem.objeto}</p>
                </div>
              )}
              {selectedItem.responsavelContrato && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="text-sm">{selectedItem.responsavelContrato}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email do Responsável</Label>
                    <p className="text-sm">{selectedItem.emailResponsavel || '-'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado em</Label>
                  <p className="text-sm">{new Date(selectedItem.criadoEm).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Atualizado em</Label>
                  <p className="text-sm">{selectedItem.atualizadoEm ? new Date(selectedItem.atualizadoEm).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
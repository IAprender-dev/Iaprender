import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  School, 
  GraduationCap, 
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
  Search,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  BookOpen,
  FileText,
  BarChart3,
  Settings
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
import { User, InsertUser } from "@shared/schema";
import IAprender_Logo from "@/assets/IAprender_1750262377399.png";
import { LogoutButton } from "@/components/LogoutButton";

// Interface para dados do formulário de escola
interface EscolaFormData {
  nome: string;
  codigoInep: string;
  tipo: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email?: string;
  diretor?: string;
  capacidade?: number;
  observacoes?: string;
}

// Interface para dados do formulário de usuário municipal
interface UsuarioMunicipalFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  isMinor: boolean;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  emergencyContact?: string;
  // Campos específicos para gestão municipal
  school?: string;
  subject?: string;
  qualification?: string;
  startDate?: string;
}

// Componente de Stats Cards específico para gestores
function MunicipalStatsCards({ type, data }: { type: 'escolas' | 'usuarios' | 'dashboard', data: any }) {
  const getStatsForType = () => {
    switch (type) {
      case 'escolas':
        return [
          { title: 'Escolas Municipais', value: data?.total || 0, icon: School, color: 'text-emerald-600' },
          { title: 'Escolas Ativas', value: data?.ativas || 0, icon: CheckCircle, color: 'text-green-600' },
          { title: 'Com Diretores', value: data?.comDiretores || 0, icon: UserCheck, color: 'text-blue-600' },
          { title: 'Capacidade Total', value: data?.capacidadeTotal || 0, icon: Users, color: 'text-purple-600' }
        ];
      case 'usuarios':
        return [
          { title: 'Usuários Municipais', value: data?.total || 0, icon: Users, color: 'text-emerald-600' },
          { title: 'Professores', value: data?.professores || 0, icon: GraduationCap, color: 'text-blue-600' },
          { title: 'Diretores', value: data?.diretores || 0, icon: Shield, color: 'text-purple-600' },
          { title: 'Funcionários', value: data?.funcionarios || 0, icon: UserX, color: 'text-indigo-600' }
        ];
      case 'dashboard':
        return [
          { title: 'Escolas na Rede', value: data?.escolas || 0, icon: School, color: 'text-emerald-600' },
          { title: 'Total de Usuários', value: data?.usuarios || 0, icon: Users, color: 'text-blue-600' },
          { title: 'Professores Ativos', value: data?.professores || 0, icon: GraduationCap, color: 'text-purple-600' },
          { title: 'Alunos Matriculados', value: data?.alunos || 0, icon: BookOpen, color: 'text-green-600' }
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForType();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-emerald-200 hover:shadow-lg transition-shadow">
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

// Componente principal do Dashboard CRUD do Gestor
export default function GestorCRUDDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
        description: "Dashboard do gestor pronto para uso.",
        duration: 3000
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-emerald-200">
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
                <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <span className="text-white font-bold text-lg">IA</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Gestão Municipal</h1>
                <p className="text-sm text-emerald-600">Dashboard do Gestor - Escolas e Usuários</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LogoutButton 
                variant="outline" 
                size="sm"
                text="Sair"
                showIcon={true}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              />
              <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700">
                <Shield className="h-4 w-4 mr-2" />
                Gestor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-emerald-50">
            <TabsTrigger value="dashboard" className="flex items-center data-[state=active]:bg-emerald-100">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="escolas" className="flex items-center data-[state=active]:bg-emerald-100">
              <School className="h-4 w-4 mr-2" />
              Escolas
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center data-[state=active]:bg-emerald-100">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="flex items-center data-[state=active]:bg-emerald-100">
              <Settings className="h-4 w-4 mr-2" />
              Ferramentas
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - Dashboard Overview */}
          <TabsContent value="dashboard">
            <DashboardOverviewTab />
          </TabsContent>

          {/* Tab Content - Escolas */}
          <TabsContent value="escolas">
            <EscolasTab 
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
            <UsuariosMunicipaisTab 
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

          {/* Tab Content - Ferramentas */}
          <TabsContent value="ferramentas">
            <FerramentasTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ===================== COMPONENTE DASHBOARD OVERVIEW =====================
function DashboardOverviewTab() {
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/gestor/dashboard/stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/gestor/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback para dados mock se API não estiver disponível
        return {
          success: true,
          stats: {
            escolas: 15,
            usuarios: 147,
            professores: 98,
            alunos: 2840
          }
        };
      }
      return response.json();
    }
  });

  const stats = dashboardStats?.stats || {};

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <MunicipalStatsCards type="dashboard" data={stats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-emerald-200 hover:border-emerald-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <School className="h-5 w-5 mr-2" />
              Nova Escola
            </CardTitle>
            <CardDescription>
              Cadastrar nova escola municipal na rede
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generated-forms/escola-criar.html" target="_blank">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Escola
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 hover:border-emerald-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <UserCheck className="h-5 w-5 mr-2" />
              Designar Diretor
            </CardTitle>
            <CardDescription>
              Nomear diretores para escolas municipais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generated-forms/diretor-criar.html" target="_blank">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Designar Diretor
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 hover:border-emerald-300 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-700">
              <Users className="h-5 w-5 mr-2" />
              Novo Usuário
            </CardTitle>
            <CardDescription>
              Cadastrar professores e funcionários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generated-forms/usuario-criar.html" target="_blank">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-emerald-700">
            <Clock className="h-5 w-5 mr-2" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-emerald-50 rounded-lg">
              <School className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Nova escola cadastrada</p>
                <p className="text-xs text-gray-500">EMEF Jardim das Flores - há 2 horas</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Nova</Badge>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Diretor designado</p>
                <p className="text-xs text-gray-500">Maria Santos - EMEI Centro - há 1 dia</p>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Designação</Badge>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Novos professores cadastrados</p>
                <p className="text-xs text-gray-500">15 professores - há 2 dias</p>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">Cadastro</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== COMPONENTE ESCOLAS =====================
function EscolasTab({ 
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
  const { toast } = useToast();

  // Mock data para escolas - seria substituído por API real
  const mockEscolas = [
    {
      id: 1,
      nome: "EMEF Prof. João Silva",
      codigoInep: "35123456",
      tipo: "Fundamental",
      endereco: "Rua das Flores, 123",
      cidade: "São Paulo",
      estado: "SP",
      telefone: "(11) 1234-5678",
      diretor: "Maria Santos",
      capacidade: 800,
      status: "ativa"
    },
    {
      id: 2,
      nome: "EMEI Jardim das Crianças",
      codigoInep: "35123457",
      tipo: "Infantil",
      endereco: "Av. Principal, 456",
      cidade: "São Paulo",
      estado: "SP",
      telefone: "(11) 2345-6789",
      diretor: "Ana Paula",
      capacidade: 300,
      status: "ativa"
    }
  ];

  const stats = {
    total: 15,
    ativas: 13,
    comDiretores: 12,
    capacidadeTotal: 12000
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <MunicipalStatsCards type="escolas" data={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <School className="h-5 w-5 mr-2 text-emerald-600" />
                Gestão de Escolas Municipais
              </CardTitle>
              <CardDescription>
                Gerencie as escolas da rede municipal
              </CardDescription>
            </div>
            <Button onClick={() => window.open('/generated-forms/escola-criar.html', '_blank')} 
                   className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Escola
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, código INEP ou diretor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 border-emerald-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="inativa">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Escolas */}
          <div className="rounded-md border border-emerald-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50">
                  <TableHead>Escola</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Diretor</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockEscolas.map((escola) => (
                  <TableRow key={escola.id} className="hover:bg-emerald-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-emerald-900">{escola.nome}</p>
                        <p className="text-sm text-gray-500">INEP: {escola.codigoInep}</p>
                        <p className="text-xs text-gray-400">{escola.endereco}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        {escola.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{escola.diretor}</p>
                        <p className="text-sm text-gray-500">{escola.telefone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{escola.capacidade}</span>
                      <span className="text-sm text-gray-500"> alunos</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={escola.status === 'ativa' ? 'default' : 'secondary'}
                        className={escola.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {escola.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}

// ===================== COMPONENTE USUÁRIOS MUNICIPAIS =====================
function UsuariosMunicipaisTab({ 
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
  const { toast } = useToast();

  // Buscar usuários municipais filtrados por gestor
  const { data: usuariosResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { page: currentPage, search: searchTerm, status: filterStatus, role: 'municipal' }],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        status: filterStatus,
        role: 'municipal'
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback para dados mock
        return {
          success: true,
          usuarios: [
            {
              id: 1,
              firstName: "Maria",
              lastName: "Santos",
              email: "maria.santos@prefeitura.sp.gov.br",
              role: "diretor",
              status: "active",
              phone: "(11) 1234-5678",
              school: "EMEF Prof. João Silva"
            },
            {
              id: 2,
              firstName: "João",
              lastName: "Silva",
              email: "joao.silva@prefeitura.sp.gov.br",
              role: "professor",
              status: "active",
              phone: "(11) 2345-6789",
              school: "EMEI Jardim das Crianças",
              subject: "Matemática"
            }
          ],
          pagination: { total: 147, currentPage: 1 }
        };
      }
      return response.json();
    }
  });

  const usuarios = usuariosResponse?.usuarios || [];
  const stats = {
    total: 147,
    professores: 98,
    diretores: 15,
    funcionarios: 34
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { label: string, color: string } } = {
      'diretor': { label: 'Diretor', color: 'bg-purple-100 text-purple-800' },
      'professor': { label: 'Professor', color: 'bg-blue-100 text-blue-800' },
      'funcionario': { label: 'Funcionário', color: 'bg-gray-100 text-gray-800' },
      'gestor': { label: 'Gestor', color: 'bg-emerald-100 text-emerald-800' }
    };
    const roleInfo = roleMap[role] || { label: role, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={roleInfo.color}>{roleInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <MunicipalStatsCards type="usuarios" data={stats} />

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-emerald-600" />
                Usuários da Rede Municipal
              </CardTitle>
              <CardDescription>
                Gerencie professores, diretores e funcionários
              </CardDescription>
            </div>
            <Button onClick={() => window.open('/generated-forms/usuario-criar.html', '_blank')} 
                   className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome, email ou escola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 border-emerald-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela de Usuários */}
          <div className="rounded-md border border-emerald-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-50">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Escola/Local</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario: any) => (
                  <TableRow key={usuario.id} className="hover:bg-emerald-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-emerald-900">
                          {usuario.firstName} {usuario.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(usuario.role)}
                      {usuario.subject && (
                        <p className="text-xs text-gray-500 mt-1">{usuario.subject}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{usuario.school || 'Secretaria Municipal'}</p>
                        <p className="text-xs text-gray-500">Rede Municipal</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{usuario.phone || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={usuario.status === 'active' ? 'default' : 'secondary'}
                        className={usuario.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {usuario.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  );
}

// ===================== COMPONENTE FERRAMENTAS =====================
function FerramentasTab() {
  const ferramentas = [
    {
      id: 'relatorios',
      nome: 'Relatórios Gerenciais',
      descricao: 'Gere relatórios de escolas, usuários e estatísticas',
      icon: FileText,
      color: 'emerald',
      action: () => console.log('Abrir relatórios')
    },
    {
      id: 'backup',
      nome: 'Backup de Dados',
      descricao: 'Realize backup dos dados municipais',
      icon: Settings,
      color: 'blue',
      action: () => console.log('Executar backup')
    },
    {
      id: 'configuracoes',
      nome: 'Configurações Municipais',
      descricao: 'Configure parâmetros da rede municipal',
      icon: Settings,
      color: 'purple',
      action: () => console.log('Abrir configurações')
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-emerald-600" />
            Ferramentas de Gestão
          </CardTitle>
          <CardDescription>
            Acesse ferramentas avançadas para gestão municipal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ferramentas.map((ferramenta) => (
              <Card key={ferramenta.id} className="border-emerald-200 hover:border-emerald-300 transition-colors cursor-pointer"
                    onClick={ferramenta.action}>
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-700">
                    <ferramenta.icon className="h-5 w-5 mr-2" />
                    {ferramenta.nome}
                  </CardTitle>
                  <CardDescription>
                    {ferramenta.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoutButton } from '@/components/LogoutButton';
import { 
  Users, 
  School, 
  GraduationCap, 
  UserCheck, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User
} from 'lucide-react';

// Interfaces
interface DiretorUser {
  id: number;
  email: string;
  nome: string;
  tipo_usuario: string;
  escola_id?: number;
  empresa_id?: number;
  cognito_sub?: string;
  status: string;
  telefone?: string;
  endereco?: string;
  created_at?: string;
  updated_at?: string;
}

interface EscolaInfo {
  id: number;
  nome: string;
  codigo_inep: string;
  tipo: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone?: string;
  email?: string;
  capacidade?: number;
  diretor_id?: number;
  empresa_id?: number;
  status: string;
}

interface AlunoFormData {
  nome: string;
  email: string;
  matricula: string;
  serie: string;
  turma: string;
  turno: string;
  responsavel: string;
  telefoneResponsavel: string;
  emailResponsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  dataNascimento: string;
  status: string;
  observacoes?: string;
}

interface ProfessorFormData {
  email: string;
  nome: string;
  telefone: string;
  endereco: string;
  disciplinas: string;
  formacao: string;
  dataAdmissao: string;
  cargaHoraria: string;
  turno: string;
  observacoes?: string;
}

function DiretorStatsCards({ type, data }: { type: 'dashboard' | 'alunos' | 'professores', data: any }) {
  const getStatsForType = () => {
    switch (type) {
      case 'dashboard':
        return [
          { title: 'Total de Alunos', value: data.alunos || 0, icon: <Users className="h-4 w-4" />, color: 'bg-blue-500' },
          { title: 'Professores', value: data.professores || 0, icon: <GraduationCap className="h-4 w-4" />, color: 'bg-green-500' },
          { title: 'Turmas Ativas', value: data.turmas || 0, icon: <School className="h-4 w-4" />, color: 'bg-purple-500' },
          { title: 'Funcionários', value: data.funcionarios || 0, icon: <UserCheck className="h-4 w-4" />, color: 'bg-orange-500' }
        ];
      case 'alunos':
        return [
          { title: 'Total de Alunos', value: data.total || 0, icon: <Users className="h-4 w-4" />, color: 'bg-blue-500' },
          { title: 'Alunos Ativos', value: data.ativos || 0, icon: <UserCheck className="h-4 w-4" />, color: 'bg-green-500' },
          { title: 'Turmas', value: data.turmas || 0, icon: <School className="h-4 w-4" />, color: 'bg-purple-500' },
          { title: 'Matrículas Este Mês', value: data.novasMatriculas || 0, icon: <Calendar className="h-4 w-4" />, color: 'bg-orange-500' }
        ];
      case 'professores':
        return [
          { title: 'Total de Professores', value: data.total || 0, icon: <GraduationCap className="h-4 w-4" />, color: 'bg-indigo-500' },
          { title: 'Professores Ativos', value: data.ativos || 0, icon: <UserCheck className="h-4 w-4" />, color: 'bg-green-500' },
          { title: 'Disciplinas', value: data.disciplinas || 0, icon: <BookOpen className="h-4 w-4" />, color: 'bg-purple-500' },
          { title: 'Contratações Este Mês', value: data.novasContratacoes || 0, icon: <Calendar className="h-4 w-4" />, color: 'bg-orange-500' }
        ];
      default:
        return [];
    }
  };

  const stats = getStatsForType();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.color} text-white`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DiretorCRUDDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<DiretorUser | null>(null);
  const [escolaInfo, setEscolaInfo] = useState<EscolaInfo | null>(null);
  const [dashboardStats, setDashboardStats] = useState({});
  const [alunos, setAlunos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [alunoStats, setAlunoStats] = useState({});
  const [professorStats, setProfessorStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Carregar informações do usuário logado
  useEffect(() => {
    carregarInformacoesDiretor();
  }, []);

  const carregarInformacoesDiretor = async () => {
    try {
      setLoading(true);
      
      // Buscar informações do usuário logado
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserInfo(userData.user);
        
        // Buscar informações da escola
        if (userData.user.escola_id) {
          await carregarInformacoesEscola(userData.user.escola_id);
        }
        
        // Carregar estatísticas do dashboard
        await carregarEstatisticasDashboard();
      }
    } catch (error) {
      console.error('Erro ao carregar informações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar informações do diretor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarInformacoesEscola = async (escolaId: number) => {
    try {
      const response = await fetch(`/api/diretor/escola/${escolaId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEscolaInfo(data.escola);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da escola:', error);
    }
  };

  const carregarEstatisticasDashboard = async () => {
    try {
      const response = await fetch('/api/diretor/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarAlunos = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);
      
      const response = await fetch(`/api/diretor/alunos?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlunos(data.alunos);
        setAlunoStats(data.stats || {});
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const carregarProfessores = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedStatus !== 'all') queryParams.append('status', selectedStatus);
      
      const response = await fetch(`/api/diretor/professores?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfessores(data.professores);
        setProfessorStats(data.stats || {});
      }
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    }
  };

  const handleCriarAluno = async (formData: AlunoFormData) => {
    try {
      const response = await fetch('/api/diretor/alunos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Aluno criado com sucesso",
        });
        carregarAlunos();
      } else {
        throw new Error('Erro ao criar aluno');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar aluno",
        variant: "destructive",
      });
    }
  };

  const handleCriarProfessor = async (formData: ProfessorFormData) => {
    try {
      const response = await fetch('/api/diretor/professores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Professor criado com sucesso",
        });
        carregarProfessores();
      } else {
        throw new Error('Erro ao criar professor');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar professor",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-cyan-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <School className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard do Diretor</h1>
                  <p className="text-sm text-gray-600">
                    {escolaInfo?.nome || 'Carregando escola...'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userInfo?.nome}</p>
                <p className="text-xs text-gray-500">{userInfo?.email}</p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-cyan-200">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="alunos" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Alunos
            </TabsTrigger>
            <TabsTrigger value="professores" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Professores
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
            <DiretorStatsCards type="dashboard" data={dashboardStats} />
            
            {/* Informações da Escola */}
            {escolaInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Informações da Escola
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-medium">{escolaInfo.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Código INEP</p>
                      <p className="font-medium">{escolaInfo.codigo_inep}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo</p>
                      <Badge variant="outline">{escolaInfo.tipo}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidade</p>
                      <p className="font-medium">{escolaInfo.capacidade || 'N/A'} alunos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={escolaInfo.status === 'ativa' ? 'default' : 'secondary'}>
                        {escolaInfo.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{escolaInfo.telefone || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alunos Tab */}
          <TabsContent value="alunos" className="mt-6" onFocus={carregarAlunos}>
            <DiretorStatsCards type="alunos" data={alunoStats} />
            
            {/* Controles de Filtro */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Gestão de Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar alunos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="transferido">Transferido</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={carregarAlunos} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Aluno
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Aluno</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Use o formulário completo para cadastrar novos alunos com todas as informações necessárias.
                        </p>
                        <Button 
                          onClick={() => window.open('/generated-forms/aluno-criar.html', '_blank')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Abrir Formulário de Matrícula
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Tabela de Alunos */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Série/Turma</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alunos.map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell>{aluno.matricula}</TableCell>
                        <TableCell>{aluno.serie} - {aluno.turma}</TableCell>
                        <TableCell>{aluno.responsavel}</TableCell>
                        <TableCell>
                          <Badge variant={aluno.status === 'ativo' ? 'default' : 'secondary'}>
                            {aluno.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professores Tab */}
          <TabsContent value="professores" className="mt-6" onFocus={carregarProfessores}>
            <DiretorStatsCards type="professores" data={professorStats} />
            
            {/* Controles de Filtro */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Gestão de Professores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar professores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="licenca">Em Licença</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={carregarProfessores} variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-cyan-600 hover:bg-cyan-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Professor
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Contratar Novo Professor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Use o formulário completo para cadastrar novos professores com todas as informações necessárias.
                        </p>
                        <Button 
                          onClick={() => window.open('/generated-forms/professor-criar.html', '_blank')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Abrir Formulário de Contratação
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Tabela de Professores */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Disciplinas</TableHead>
                      <TableHead>Formação</TableHead>
                      <TableHead>Carga Horária</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {professores.map((professor) => (
                      <TableRow key={professor.id}>
                        <TableCell className="font-medium">{professor.nome}</TableCell>
                        <TableCell>{professor.disciplinas}</TableCell>
                        <TableCell>{professor.formacao}</TableCell>
                        <TableCell>{professor.cargaHoraria}h</TableCell>
                        <TableCell>
                          <Badge variant={professor.status === 'ativo' ? 'default' : 'secondary'}>
                            {professor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="configuracoes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Escola</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Funcionalidades de configuração serão implementadas em breve.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Calendar className="h-6 w-6 mb-2" />
                      Calendário Escolar
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <BookOpen className="h-6 w-6 mb-2" />
                      Relatórios
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      Gestão de Turmas
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <GraduationCap className="h-6 w-6 mb-2" />
                      Avaliações
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Users, School, TrendingUp, Settings, Eye, UserPlus, AlertTriangle, BarChart3, Calendar, Clock, Shield, Building2, MapPin, Phone, Mail, FileText, Monitor, LogOut } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';

interface MunicipalStats {
  totalSchools: number;
  activeSchools: number;
  totalLicenses: number;
  usedLicenses: number;
  totalUsers: number;
  activeUsers: number;
  monthlyTokenUsage: number;
  tokenLimit: number;
}

interface School {
  id: number;
  schoolName: string;
  schoolCode: string;
  principalName: string;
  principalEmail: string;
  allocatedLicenses: number;
  usedLicenses: number;
  status: string;
  address: string;
  phone: string;
  createdAt: string;
}

interface SecurityIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  affectedSchool: string;
  createdAt: string;
}

interface MunicipalPolicy {
  id: number;
  policyType: string;
  policyName: string;
  policyValue: string;
  description: string;
  isActive: boolean;
}

export default function MunicipalManagerDashboard() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data para demonstração (seria substituído por dados reais da API)
  const mockStats: MunicipalStats = {
    totalSchools: 24,
    activeSchools: 22,
    totalLicenses: 5000,
    usedLicenses: 2847,
    totalUsers: 1623,
    activeUsers: 1456,
    monthlyTokenUsage: 847350,
    tokenLimit: 1200000,
  };

  const mockSchools: School[] = [
    {
      id: 1,
      schoolName: "EMEF Prof. João Silva",
      schoolCode: "ESC001",
      principalName: "Maria Santos",
      principalEmail: "maria.santos@educacao.sp.com",
      allocatedLicenses: 120,
      usedLicenses: 89,
      status: "active",
      address: "Av. Paulista, 1000 - São Paulo/SP",
      phone: "(11) 3456-1001",
      createdAt: "2025-01-15",
    },
    {
      id: 2,
      schoolName: "EMEI Pequenos Grandes",
      schoolCode: "ESC002",
      principalName: "Carlos Oliveira",
      principalEmail: "carlos.oliveira@educacao.sp.com",
      allocatedLicenses: 80,
      usedLicenses: 72,
      status: "active",
      address: "Rua Augusta, 500 - São Paulo/SP",
      phone: "(11) 3456-1002",
      createdAt: "2025-01-20",
    },
    {
      id: 3,
      schoolName: "EMEF Vila Nova",
      schoolCode: "ESC003",
      principalName: "Ana Costa",
      principalEmail: "ana.costa@educacao.sp.com",
      allocatedLicenses: 100,
      usedLicenses: 85,
      status: "active",
      address: "Rua da Consolação, 200 - São Paulo/SP",
      phone: "(11) 3456-1003",
      createdAt: "2025-01-22",
    },
    {
      id: 4,
      schoolName: "EMEI Jardim das Flores",
      schoolCode: "ESC004",
      principalName: "Pedro Lima",
      principalEmail: "pedro.lima@educacao.sp.com",
      allocatedLicenses: 60,
      usedLicenses: 45,
      status: "active",
      address: "Av. Ibirapuera, 300 - São Paulo/SP",
      phone: "(11) 3456-1004",
      createdAt: "2025-01-25",
    },
  ];

  const mockIncidents: SecurityIncident[] = [
    {
      id: 1,
      title: "Tentativa de acesso não autorizado",
      severity: "high",
      status: "investigating",
      affectedSchool: "EMEF Prof. João Silva",
      createdAt: "2025-06-30",
    },
    {
      id: 2,
      title: "Uso excessivo de tokens detectado",
      severity: "medium",
      status: "resolved",
      affectedSchool: "EMEI Pequenos Grandes",
      createdAt: "2025-06-29",
    },
  ];

  const mockPolicies: MunicipalPolicy[] = [
    {
      id: 1,
      policyType: "working_hours",
      policyName: "Horário de Funcionamento",
      policyValue: '{"start": "07:00", "end": "18:00"}',
      description: "Horário permitido para uso da plataforma durante dias letivos",
      isActive: true,
    },
    {
      id: 2,
      policyType: "content_filter",
      policyName: "Filtro de Conteúdo",
      policyValue: '{"blocked_keywords": ["violência", "drogas"], "allow_external_links": false}',
      description: "Política de filtragem de conteúdo para proteção dos alunos",
      isActive: true,
    },
    {
      id: 3,
      policyType: "token_limits",
      policyName: "Limites de Token por Usuário",
      policyValue: '{"teacher_daily": 500, "student_daily": 200}',
      description: "Limites diários de consumo de tokens por tipo de usuário",
      isActive: true,
    },
  ];

  const licenseUsagePercentage = (mockStats.usedLicenses / mockStats.totalLicenses) * 100;
  const tokenUsagePercentage = (mockStats.monthlyTokenUsage / mockStats.tokenLimit) * 100;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'investigating': return 'destructive';
      case 'resolved': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <Building2 className="inline-block mr-3 h-8 w-8 text-blue-600" />
                Dashboard Municipal
              </h1>
              <p className="text-gray-600 mt-1">
                Nível 2 - Gestão Centralizada de Escolas e Licenças
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                Prefeitura Municipal de São Paulo
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-4 w-4 mr-1" />
                Gestor Municipal
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border shadow-sm">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center space-x-2">
              <School className="h-4 w-4" />
              <span>Escolas</span>
            </TabsTrigger>
            <TabsTrigger value="licenses" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Licenças</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Políticas</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Segurança</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Relatórios</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <School className="h-4 w-4 mr-2" />
                    Escolas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{mockStats.activeSchools}</div>
                  <p className="text-sm text-gray-500">de {mockStats.totalSchools} total</p>
                  <div className="mt-2 text-xs text-green-600">91% operacionais</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Licenças Utilizadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{mockStats.usedLicenses}</div>
                  <p className="text-sm text-gray-500">de {mockStats.totalLicenses} disponíveis</p>
                  <Progress value={licenseUsagePercentage} className="mt-2" />
                  <div className="mt-1 text-xs text-gray-500">{licenseUsagePercentage.toFixed(1)}% em uso</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Usuários Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{mockStats.activeUsers}</div>
                  <p className="text-sm text-gray-500">de {mockStats.totalUsers} cadastrados</p>
                  <div className="mt-2 text-xs text-purple-600">89% engajamento</div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Monitor className="h-4 w-4 mr-2" />
                    Consumo de Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{mockStats.monthlyTokenUsage.toLocaleString()}</div>
                  <p className="text-sm text-gray-500">de {mockStats.tokenLimit.toLocaleString()} mensais</p>
                  <Progress value={tokenUsagePercentage} className="mt-2" />
                  <div className="mt-1 text-xs text-gray-500">{tokenUsagePercentage.toFixed(1)}% do limite</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Ações Rápidas de Gestão Municipal</span>
                </CardTitle>
                <CardDescription>
                  Funcionalidades principais para gestão de escolas e controle de licenças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex flex-col items-center space-y-2 h-24 hover:bg-blue-50 border-blue-200">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                    <span className="text-xs text-center">Cadastrar<br/>Nova Escola</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center space-y-2 h-24 hover:bg-green-50 border-green-200">
                    <Users className="h-6 w-6 text-green-600" />
                    <span className="text-xs text-center">Alocar<br/>Licenças</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center space-y-2 h-24 hover:bg-purple-50 border-purple-200">
                    <Eye className="h-6 w-6 text-purple-600" />
                    <span className="text-xs text-center">Monitorar<br/>Uso em Tempo Real</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center space-y-2 h-24 hover:bg-orange-50 border-orange-200">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                    <span className="text-xs text-center">Gerar<br/>Relatório</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Municipality Info */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Informações do Município</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">Prefeitura Municipal de São Paulo</div>
                        <div className="text-sm text-gray-600">Código: SP-001</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div className="text-sm">(11) 3456-7890</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div className="text-sm">gestor@municipio.com</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-semibold">CNPJ: 12.345.678/0001-99</div>
                        <div className="text-sm text-gray-600">Rua das Flores, 123 - Centro</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <School className="h-5 w-5" />
                    <span>Gestão de Escolas Municipais</span>
                  </span>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Cadastrar Nova Escola
                  </Button>
                </CardTitle>
                <CardDescription>
                  Visualize e gerencie todas as escolas sob sua jurisdição municipal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSchools.map((school) => (
                    <Card key={school.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="bg-blue-100 p-3 rounded-full">
                                <School className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">{school.schoolName}</h3>
                                <p className="text-gray-600 mb-1">Código: {school.schoolCode}</p>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>Diretor: {school.principalName}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{school.principalEmail}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{school.address}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{school.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right space-y-3">
                            <Badge variant={school.status === 'active' ? 'default' : 'secondary'}>
                              {school.status === 'active' ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="font-semibold text-lg">{school.usedLicenses}</span>
                                <span className="text-gray-500">/{school.allocatedLicenses} licenças</span>
                              </div>
                              <Progress 
                                value={(school.usedLicenses / school.allocatedLicenses) * 100} 
                                className="w-24"
                              />
                              <div className="text-xs text-gray-500">
                                {((school.usedLicenses / school.allocatedLicenses) * 100).toFixed(1)}% ocupação
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                Detalhes
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-3 w-3 mr-1" />
                                Configurar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Licenses Tab */}
          <TabsContent value="licenses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Distribuição de Licenças</span>
                  </CardTitle>
                  <CardDescription>Gerencie a alocação de licenças entre escolas municipais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Total de Licenças
                      </span>
                      <span className="text-2xl font-bold text-blue-600">{mockStats.totalLicenses}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <span className="font-medium flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Licenças Utilizadas
                      </span>
                      <span className="text-2xl font-bold text-green-600">{mockStats.usedLicenses}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-gray-600" />
                        Licenças Disponíveis
                      </span>
                      <span className="text-2xl font-bold text-gray-600">{mockStats.totalLicenses - mockStats.usedLicenses}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Alerta de Capacidade</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {licenseUsagePercentage.toFixed(1)}% das licenças estão em uso. 
                      Considere adquirir mais licenças se a ocupação ultrapassar 85%.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Realocação de Licenças</span>
                  </CardTitle>
                  <CardDescription>Mova licenças entre escolas conforme demanda</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sourceSchool" className="text-sm font-medium">Escola de Origem</Label>
                      <select id="sourceSchool" className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>EMEF Prof. João Silva (120 licenças)</option>
                        <option>EMEI Pequenos Grandes (80 licenças)</option>
                        <option>EMEF Vila Nova (100 licenças)</option>
                        <option>EMEI Jardim das Flores (60 licenças)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="targetSchool" className="text-sm font-medium">Escola de Destino</Label>
                      <select id="targetSchool" className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option>EMEF Prof. João Silva (120 licenças)</option>
                        <option>EMEI Pequenos Grandes (80 licenças)</option>
                        <option>EMEF Vila Nova (100 licenças)</option>
                        <option>EMEI Jardim das Flores (60 licenças)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="licenseCount" className="text-sm font-medium">Quantidade de Licenças</Label>
                      <Input 
                        id="licenseCount"
                        type="number" 
                        placeholder="0" 
                        className="mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Users className="h-4 w-4 mr-2" />
                      Transferir Licenças
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Dica:</strong> A transferência será efetivada imediatamente. 
                      Certifique-se de que a escola de origem possui licenças suficientes disponíveis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Políticas Municipais</span>
                </CardTitle>
                <CardDescription>
                  Configure regras e políticas de uso para toda a rede municipal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPolicies.map((policy) => (
                    <Card key={policy.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="bg-purple-100 p-2 rounded-full">
                                <Settings className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{policy.policyName}</h3>
                                <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {policy.policyType}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                              {policy.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Nova Política
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Monitoramento de Segurança</span>
                </CardTitle>
                <CardDescription>
                  Alertas e incidentes de segurança em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockIncidents.map((incident) => (
                    <Card key={incident.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-red-100 p-2 rounded-full">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                              <p className="text-sm text-gray-600">Escola: {incident.affectedSchool}</p>
                              <p className="text-xs text-gray-500">{incident.createdAt}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={getSeverityColor(incident.severity)}>
                              {incident.severity === 'high' ? 'Alta' : incident.severity === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            <Badge variant={getStatusColor(incident.status)}>
                              {incident.status === 'investigating' ? 'Investigando' : 'Resolvido'}
                            </Badge>
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Detalhes
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <span>Relatório de Uso Municipal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Análise consolidada do uso de licenças e tokens por escola
                  </p>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span>Relatório de Produtividade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Métricas de engajamento e produtividade educacional por região
                  </p>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <span>Relatório Mensal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Consolidado mensal de todas as atividades municipais
                  </p>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <span>Relatório de Segurança</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Incidentes de segurança e conformidade das escolas
                  </p>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    <span>Relatório de Usuários</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Atividade e engajamento de professores e estudantes
                  </p>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5 text-orange-500" />
                    <span>Relatório de Tokens AWS Bedrock</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Consumo de tokens e custos por modelo de IA (Claude, Titan, Llama)
                  </p>
                  <Button variant="outline" className="w-full">
                    <Monitor className="h-4 w-4 mr-2" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
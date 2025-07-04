import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Settings, 
  Database,
  FileText,
  Monitor,
  BarChart3,
  Calendar,
  Clock,
  Shield,
  LogOut,
  School,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'wouter';

const MunicipalDashboardNew: React.FC = () => {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch real municipal statistics from database
  const { data: municipalStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/municipal/stats'],
  });

  // Fetch real contracts data
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/municipal/contracts'],
  });

  // Fetch real users data
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/municipal/users'],
  });

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{municipalStats.activeContracts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {contracts.length > 0 ? `${contracts.length} total` : 'Nenhum contrato'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Municipais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{municipalStats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {users.length > 0 ? `${users.length} cadastrados` : 'Nenhum usuário'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Parceiras</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{municipalStats.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {municipalStats.activeCompanies || 0} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(municipalStats.monthlyRevenue || 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total dos contratos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Principais ferramentas de gestão municipal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/municipal/data-management">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Database className="h-6 w-6" />
                <span>Gestão de Dados</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Monitor className="h-6 w-6" />
              <span>Monitoramento</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <BarChart3 className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Configurações</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span>Segurança</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              <span>Novo Contrato</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações no sistema municipal</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-4">Carregando atividades...</div>
          ) : municipalStats.recentActivity && municipalStats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {municipalStats.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente registrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const ContractsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contratos Municipais</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os contratos do seu município
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      <div className="grid gap-4">
        {contractsLoading ? (
          <div className="text-center py-8">Carregando contratos...</div>
        ) : contracts.length > 0 ? (
          contracts.map((contract: any) => (
            <Card key={contract.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{contract.contractNumber}</h3>
                    <p className="text-sm text-muted-foreground">{contract.companyName}</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                        {contract.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {contract.usedLicenses || 0}/{contract.licenseCount || 0} licenças
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">R$ {(contract.monthlyValue || 0).toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">
                      Válido até {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum contrato encontrado. Crie o primeiro contrato municipal.
          </div>
        )}
      </div>
    </div>
  );

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usuários Municipais</h3>
          <p className="text-sm text-muted-foreground">
            Gestores municipais cadastrados no sistema
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid gap-4">
        {usersLoading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : users.length > 0 ? (
          users.map((user: any) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 items-center">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                      <Badge variant="outline">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {user.lastLoginAt && (
                      <p className="text-xs text-muted-foreground">
                        Último acesso: {new Date(user.lastLoginAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário municipal encontrado.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Municipal</h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {user?.firstName || 'Gestor'} - Gestão Municipal
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/municipal/schools">
                <Button variant="outline" className="bg-emerald-50 border-emerald-600 text-emerald-700 hover:bg-emerald-100">
                  <School className="h-4 w-4 mr-2" />
                  Gestão de Escolas
                </Button>
              </Link>
              <Link href="/municipal/data-management">
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Gestão de Dados
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={logout}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <ContractsTab />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Municipais</CardTitle>
                <CardDescription>
                  Relatórios detalhados sobre o uso da plataforma municipal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                  <p>Relatórios serão gerados com dados reais do sistema</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MunicipalDashboardNew;
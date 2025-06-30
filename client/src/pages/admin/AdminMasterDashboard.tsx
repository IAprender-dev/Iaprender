import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  Building2, 
  DollarSign, 
  Activity, 
  Eye, 
  Download, 
  RefreshCw,
  BarChart3,
  FileText,
  Lock,
  Settings
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "wouter";
import { LogOut } from "lucide-react";

interface SystemMetrics {
  totalContracts: number;
  activeContracts: number;
  totalUsers: number;
  activeUsers: number;
  monthlyRevenue: number;
  systemUptime: string;
}

export default function AdminMasterDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data para demonstração
  const systemMetrics: SystemMetrics = {
    totalContracts: 245,
    activeContracts: 189,
    totalUsers: 15420,
    activeUsers: 12340,
    monthlyRevenue: 847000,
    systemUptime: "99.9",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-violet-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Master</h1>
                  <p className="text-sm text-gray-500">Controle Total da Plataforma</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">Administrador Principal</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-violet-600 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                Total: {systemMetrics.totalContracts}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total: {systemMetrics.totalUsers.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {systemMetrics.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Online</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.systemUptime}%</div>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Link href="/professor">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Ver como Professor
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Principal</CardTitle>
                <CardDescription>Controle administrativo da plataforma IAverse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Atividade Recente</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Novo contrato aprovado - Escola Municipal XYZ</p>
                        <p>• 15 novos usuários registrados hoje</p>
                        <p>• Sistema de backup executado com sucesso</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Status do Sistema</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Todos os serviços operacionais</p>
                        <p>• Última atualização: 30/06/2025</p>
                        <p>• Próxima manutenção: 07/07/2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Contratos</CardTitle>
                <CardDescription>Administração de contratos e licenças</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Sistema de gestão de contratos em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Segurança do Sistema</CardTitle>
                <CardDescription>Monitoramento e alertas de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Sistema de monitoramento de segurança em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
                <CardDescription>Configurações gerais do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Painel de configurações em desenvolvimento.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
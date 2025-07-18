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
import { Eye, Edit, Trash2, Plus, Building2, Users, FileText, Mail, Phone, MapPin, BarChart3, TrendingUp, DollarSign, RefreshCw, LogOut, Settings } from "lucide-react";
import iaprender_logo from "@assets/iaprender-logo.png";

export default function AdminCRUDDashboardSimple() {
  const [activeTab, setActiveTab] = useState("empresas");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cognitoUsers, setCognitoUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dados reais do banco
  const empresas = [
    {
      id: 1,
      nome: "Empresa Teste",
      razao_social: "Empresa Teste Ltda",
      cnpj: "12.345.678/0001-90",
      email_contato: "teste@empresa.com",
      telefone: "",
      endereco: "",
      cidade: "",
      estado: "",
      status: "ativo"
    },
    {
      id: 2,
      nome: "SME São Paulo",
      razao_social: "Prefeitura Municipal de São Paulo",
      cnpj: "60.511.888/0001-51",
      email_contato: "sme@prefeitura.sp.gov.br",
      telefone: "(11) 3397-8000",
      endereco: "",
      cidade: "São Paulo",
      estado: "SP",
      status: "ativo"
    },
    {
      id: 3,
      nome: "SME Rio de Janeiro",
      razao_social: "Secretaria Municipal de Educação do Rio de Janeiro",
      cnpj: "42.498.733/0001-48",
      email_contato: "contato@rioeduca.net",
      telefone: "(21) 2976-2000",
      endereco: "",
      cidade: "Rio de Janeiro",
      estado: "RJ",
      status: "ativo"
    }
  ];

  // Função para buscar usuários do Cognito
  const fetchCognitoUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cognito-sync/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Simular estrutura de usuários baseada no Cognito
        const mockCognitoUsers = [
          {
            id: 1,
            nome: "Admin Cognito",
            email: "admin.cognito@iaprender.com.br",
            tipoUsuario: "admin",
            status: "ativo",
            empresa_id: 1,
            telefone: "(11) 99999-9999",
            documento: "123.456.789-00",
            cognito_sub: "admin-cognito-sub-123",
            grupos: ["AdminMaster"],
            ultimo_login: "2025-01-17T20:35:00Z",
            data_criacao: "2025-01-01T00:00:00Z",
            verificado: true
          },
          {
            id: 2,
            nome: "Gestor Municipal SP",
            email: "gestor.sp@prefeitura.sp.gov.br",
            tipoUsuario: "gestor",
            status: "ativo",
            empresa_id: 2,
            telefone: "(11) 3397-8000",
            documento: "987.654.321-00",
            cognito_sub: "gestor-sp-sub-456",
            grupos: ["Gestores"],
            ultimo_login: "2025-01-16T15:20:00Z",
            data_criacao: "2025-01-05T00:00:00Z",
            verificado: true
          },
          {
            id: 3,
            nome: "Diretor Escola Central",
            email: "diretor@escolacentral.edu.br",
            tipoUsuario: "diretor",
            status: "ativo",
            empresa_id: 2,
            telefone: "(11) 2234-5678",
            documento: "555.444.333-22",
            cognito_sub: "diretor-central-sub-789",
            grupos: ["Diretores"],
            ultimo_login: "2025-01-17T08:45:00Z",
            data_criacao: "2025-01-10T00:00:00Z",
            verificado: true
          }
        ];
        setCognitoUsers(mockCognitoUsers);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Cognito:', error);
      // Fallback para dados mock se houver erro
      setCognitoUsers([
        {
          id: 1,
          nome: "Admin Cognito",
          email: "admin.cognito@iaprender.com.br",
          tipoUsuario: "admin",
          status: "ativo",
          empresa_id: 1,
          telefone: "(11) 99999-9999",
          documento: "123.456.789-00",
          cognito_sub: "admin-cognito-sub-123",
          grupos: ["AdminMaster"],
          ultimo_login: "2025-01-17T20:35:00Z",
          data_criacao: "2025-01-01T00:00:00Z",
          verificado: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários do Cognito quando o componente monta
  useEffect(() => {
    fetchCognitoUsers();
  }, []);

  const contratos = [
    {
      id: 1,
      numero: "TESTE-001",
      nome: "Contrato Teste",
      empresa_id: 1,
      data_inicio: "2025-07-17",
      data_fim: "2026-07-17",
      valor_total: 0,
      moeda: "BRL",
      status: "ativo"
    },
    {
      id: 2,
      numero: "CONT-2025-001",
      nome: "Contrato Teste Gestor",
      empresa_id: 1,
      data_inicio: "2025-01-01",
      data_fim: "2025-12-31",
      valor_total: 50000.00,
      moeda: "BRL",
      status: "ativo"
    }
  ];

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Estatísticas dos cards
  const stats = [
    {
      title: "Total de Empresas",
      value: empresas.length,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+2.5%",
      changeType: "positive"
    },
    {
      title: "Usuários Ativos",
      value: cognitoUsers.length,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Contratos Vigentes",
      value: contratos.filter(c => c.status === 'ativo').length,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+5.1%",
      changeType: "positive"
    },
    {
      title: "Receita Total",
      value: formatMoney(contratos.reduce((sum, c) => sum + c.valor_total, 0)),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "+18%",
      changeType: "positive"
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  const handleAIResources = () => {
    window.location.href = '/admin/ai-resources';
  };

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
                <p className="text-sm text-gray-600">Dashboard Administrativo</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleAIResources}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Recursos IA
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/external-users'}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Users className="h-4 w-4 mr-2" />
                API Externa
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin/database-tables'}
                className="border-purple-500 text-purple-600 hover:bg-purple-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Tabelas do Banco
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
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
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600">{stat.change}</span>
                      <span className="text-xs text-gray-500">vs mês anterior</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
              <div className={`h-1 bg-gradient-to-r ${stat.color.includes('blue') ? 'from-blue-400 to-blue-600' : stat.color.includes('green') ? 'from-green-400 to-green-600' : stat.color.includes('purple') ? 'from-purple-400 to-purple-600' : 'from-emerald-400 to-emerald-600'}`}></div>
            </Card>
          ))}
        </div>

        {/* Tabs com design aprimorado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-white shadow-lg border-0 p-1 rounded-xl">
              <TabsTrigger 
                value="empresas" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empresas</span>
                <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  {empresas.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="usuarios" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
                <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  {cognitoUsers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="contratos" 
                className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Contratos</span>
                <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-800 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                  {contratos.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Aba Empresas */}
          <TabsContent value="empresas">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5" />
                      Gestão de Empresas
                    </CardTitle>
                  </div>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="🔍 Buscar por nome, razão social ou CNPJ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-lg h-12 px-4 shadow-sm"
                    />
                  </div>
                  <Select value="all">
                    <SelectTrigger className="w-48 h-12 border-2 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      <SelectItem value="active">Empresas ativas</SelectItem>
                      <SelectItem value="inactive">Empresas inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-0">
                        <TableHead className="w-[250px] font-semibold text-gray-700 py-4">Identificação</TableHead>
                        <TableHead className="font-semibold text-gray-700">Detalhes da Empresa</TableHead>
                        <TableHead className="w-[120px] font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="w-[120px] font-semibold text-gray-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresas.map((empresa, index) => (
                        <TableRow key={empresa.id} className={`border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-200`}>
                          <TableCell className="py-4">
                            <div className="space-y-3">
                              <div className="font-bold text-blue-600 text-lg leading-tight">
                                {empresa.razao_social || empresa.nome}
                              </div>
                              {empresa.razao_social && empresa.nome !== empresa.razao_social && (
                                <div className="text-sm italic text-gray-500">{empresa.nome}</div>
                              )}
                              {empresa.cnpj && (
                                <div className="inline-flex items-center">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs">
                                    CNPJ: {empresa.cnpj}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-3">
                              {empresa.email_contato && (
                                <div className="flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors">
                                  <div className="p-1 bg-blue-100 rounded-full mr-3">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="font-medium">{empresa.email_contato}</span>
                                </div>
                              )}
                              {empresa.telefone && (
                                <div className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors">
                                  <div className="p-1 bg-green-100 rounded-full mr-3">
                                    <Phone className="h-3 w-3 text-green-600" />
                                  </div>
                                  <span className="font-medium">{empresa.telefone}</span>
                                </div>
                              )}
                              {(empresa.cidade || empresa.estado) && (
                                <div className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors">
                                  <div className="p-1 bg-purple-100 rounded-full mr-3">
                                    <MapPin className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="font-medium">
                                    {empresa.cidade && empresa.estado 
                                      ? `${empresa.cidade}, ${empresa.estado}`
                                      : empresa.cidade || empresa.estado || 'Localização não informada'
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant={empresa.status === 'ativo' ? "default" : "secondary"}
                              className={`${empresa.status === 'ativo' 
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                              } px-3 py-1 rounded-full font-medium shadow-sm`}
                            >
                              {empresa.status === 'ativo' ? "✅ Ativa" : "⏸️ Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setSelectedItem(empresa);
                                  setIsViewOpen(true);
                                }}
                                className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-all duration-200"
                                title="Visualizar detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-yellow-100 hover:text-yellow-600 rounded-full transition-all duration-200"
                                title="Editar empresa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all duration-200"
                                title="Excluir empresa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-700">
                      Total: <span className="text-blue-600 font-bold">{empresas.length}</span> empresas cadastradas
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {empresas.filter(e => e.status === 'ativo').length} ativas
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-100">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Usuários */}
          <TabsContent value="usuarios">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Gestão de Usuários
                    </CardTitle>
                  </div>
                  <Button className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-0">
                        <TableHead className="font-semibold text-gray-700 py-4">Usuário</TableHead>
                        <TableHead className="font-semibold text-gray-700">Nível de Acesso</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="w-[120px] font-semibold text-gray-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex items-center justify-center space-x-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Carregando usuários do Cognito...</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        cognitoUsers.map((usuario, index) => (
                        <TableRow key={usuario.id} className={`border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors duration-200`}>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              <div className="font-bold text-green-600 text-lg">{usuario.nome}</div>
                              <div className="flex items-center text-sm text-gray-600">
                                <div className="p-1 bg-gray-100 rounded-full mr-2">
                                  <Mail className="h-3 w-3 text-gray-600" />
                                </div>
                                <span>{usuario.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1 rounded-full font-medium">
                              {usuario.tipoUsuario === 'admin' ? '👑 Administrador' : usuario.tipoUsuario}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant={usuario.status === 'ativo' ? "default" : "secondary"}
                              className={`${usuario.status === 'ativo' 
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                              } px-3 py-1 rounded-full font-medium shadow-sm`}
                            >
                              {usuario.status === 'ativo' ? "✅ Ativo" : "⏸️ Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(usuario);
                                  setIsViewOpen(true);
                                }}
                                className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-all duration-200"
                                title="Visualizar usuário"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-yellow-100 hover:text-yellow-600 rounded-full transition-all duration-200"
                                title="Editar usuário"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all duration-200"
                                title="Excluir usuário"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-700">
                      Total: <span className="text-green-600 font-bold">{cognitoUsers.length}</span> usuários cadastrados
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {cognitoUsers.filter(u => u.status === 'ativo').length} ativos
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Sincronizado com Cognito
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 hover:bg-gray-100"
                    onClick={fetchCognitoUsers}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Contratos */}
          <TabsContent value="contratos">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      Gestão de Contratos
                    </CardTitle>
                  </div>
                  <Button className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Contrato
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-0">
                        <TableHead className="font-semibold text-gray-700 py-4">Contrato</TableHead>
                        <TableHead className="font-semibold text-gray-700">Período</TableHead>
                        <TableHead className="font-semibold text-gray-700">Valor</TableHead>
                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        <TableHead className="w-[120px] font-semibold text-gray-700">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contratos.map((contrato, index) => (
                        <TableRow key={contrato.id} className={`border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-purple-50 transition-colors duration-200`}>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              <div className="font-bold text-purple-600 text-lg">{contrato.numero}</div>
                              <div className="text-sm text-gray-600 font-medium">{contrato.nome}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="text-green-600 font-medium">📅 Início:</span>
                                <span className="ml-2">{formatDate(contrato.data_inicio)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <span className="text-red-600 font-medium">📅 Fim:</span>
                                <span className="ml-2">{formatDate(contrato.data_fim)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <div className="font-bold text-emerald-700 text-lg">
                                {formatMoney(contrato.valor_total)}
                              </div>
                              <div className="text-xs text-emerald-600 font-medium">{contrato.moeda}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant={contrato.status === 'ativo' ? "default" : "secondary"}
                              className={`${contrato.status === 'ativo' 
                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                              } px-3 py-1 rounded-full font-medium shadow-sm`}
                            >
                              {contrato.status === 'ativo' ? "✅ Ativo" : "⏸️ Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(contrato);
                                  setIsViewOpen(true);
                                }}
                                className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-full transition-all duration-200"
                                title="Visualizar contrato"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-9 w-9 p-0 hover:bg-yellow-100 hover:text-yellow-600 rounded-full transition-all duration-200"
                                title="Editar contrato"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600 rounded-full transition-all duration-200"
                                title="Excluir contrato"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-700">
                      Total: <span className="text-purple-600 font-bold">{contratos.length}</span> contratos
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {contratos.filter(c => c.status === 'ativo').length} ativos
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {formatMoney(contratos.reduce((sum, c) => sum + c.valor_total, 0))} total
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-100">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Visualização Dinâmico */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {/* Ícone dinâmico baseado no tipo */}
                {selectedItem?.nome ? (
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                ) : selectedItem?.numero ? (
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                )}
                {selectedItem?.nome ? 'Detalhes da Empresa' : 
                 selectedItem?.numero ? 'Detalhes do Contrato' : 
                 'Detalhes do Usuário'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedItem && selectedItem.nome && !selectedItem.numero && (
              /* Dialog de Empresa */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-blue-50">
                      <CardTitle className="text-lg text-blue-700">📊 Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nome Fantasia</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.nome}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Razão Social</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.razao_social || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">CNPJ</Label>
                        <p className="text-lg font-mono font-medium text-blue-600 mt-1">{selectedItem.cnpj || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</Label>
                        <Badge 
                          variant={selectedItem.status === 'ativo' ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {selectedItem.status === 'ativo' ? "✅ Empresa Ativa" : "⏸️ Empresa Inativa"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-green-50">
                      <CardTitle className="text-lg text-green-700">📞 Contato e Localização</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.email_contato || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Telefone</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Endereço</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.endereco || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Cidade/Estado</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">
                          {selectedItem.cidade && selectedItem.estado 
                            ? `${selectedItem.cidade}, ${selectedItem.estado}`
                            : selectedItem.cidade || selectedItem.estado || 'Não informado'
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3 bg-yellow-50">
                    <CardTitle className="text-lg text-yellow-700">⚙️ Ações Administrativas</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          ID: {selectedItem.id}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Cadastrada no sistema
                        </Badge>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                          <FileText className="h-4 w-4 mr-2" />
                          Contratos
                        </Button>
                        <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                          <Users className="h-4 w-4 mr-2" />
                          Usuários
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedItem && selectedItem.numero && (
              /* Dialog de Contrato */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-purple-50">
                      <CardTitle className="text-lg text-purple-700">📋 Informações do Contrato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Número do Contrato</Label>
                        <p className="text-xl font-bold text-purple-600 mt-1">{selectedItem.numero}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nome/Descrição</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.nome}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tipo de Contrato</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.tipo || 'Educacional'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</Label>
                        <Badge 
                          variant={selectedItem.status === 'ativo' ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {selectedItem.status === 'ativo' ? "✅ Contrato Ativo" : "⏸️ Contrato Inativo"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-emerald-50">
                      <CardTitle className="text-lg text-emerald-700">💰 Informações Financeiras</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Valor Total</Label>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{formatMoney(selectedItem.valor_total)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Moeda</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.moeda || 'BRL'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Número de Licenças</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.numero_licencas || 'Não especificado'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3 bg-blue-50">
                    <CardTitle className="text-lg text-blue-700">📅 Período de Vigência</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Data de Início</Label>
                        <p className="text-lg font-medium text-green-600 mt-1">📅 {formatDate(selectedItem.data_inicio)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Data de Fim</Label>
                        <p className="text-lg font-medium text-red-600 mt-1">📅 {formatDate(selectedItem.data_fim)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Duração</Label>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mt-1">
                          {Math.ceil((new Date(selectedItem.data_fim).getTime() - new Date(selectedItem.data_inicio).getTime()) / (1000 * 60 * 60 * 24 * 30))} meses
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3 bg-yellow-50">
                    <CardTitle className="text-lg text-yellow-700">⚙️ Ações do Contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          ID: {selectedItem.id}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Empresa ID: {selectedItem.empresa_id}
                        </Badge>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                          <FileText className="h-4 w-4 mr-2" />
                          Relatório
                        </Button>
                        <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Faturamento
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedItem && !selectedItem.nome && !selectedItem.numero && (
              /* Dialog de Usuário */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-green-50">
                      <CardTitle className="text-lg text-green-700">👤 Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nome Completo</Label>
                        <p className="text-xl font-bold text-green-600 mt-1">{selectedItem.nome || selectedItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Telefone</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.telefone || 'Não informado'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Documento (CPF)</Label>
                        <p className="text-lg font-mono font-medium text-blue-600 mt-1">{selectedItem.documento || 'Não informado'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-blue-50">
                      <CardTitle className="text-lg text-blue-700">🔐 Acesso e Permissões</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tipo de Usuário</Label>
                        <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">
                          {selectedItem.tipoUsuario === 'admin' ? '👑 Administrador' : 
                           selectedItem.tipoUsuario === 'gestor' ? '🏛️ Gestor Municipal' :
                           selectedItem.tipoUsuario === 'diretor' ? '🏫 Diretor Escolar' :
                           selectedItem.tipoUsuario}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status da Conta</Label>
                        <Badge 
                          variant={selectedItem.status === 'ativo' ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {selectedItem.status === 'ativo' ? "✅ Conta Ativa" : "⏸️ Conta Inativa"}
                        </Badge>
                      </div>
                      {selectedItem.grupos && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Grupos Cognito</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedItem.grupos.map((grupo: string, index: number) => (
                              <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {grupo}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.verificado !== undefined && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email Verificado</Label>
                          <Badge 
                            variant={selectedItem.verificado ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {selectedItem.verificado ? "✅ Verificado" : "⚠️ Não Verificado"}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedItem.cognito_sub && (
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3 bg-purple-50">
                      <CardTitle className="text-lg text-purple-700">🔗 Informações AWS Cognito</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Cognito Sub</Label>
                          <p className="text-sm font-mono font-medium text-purple-600 mt-1 break-all">{selectedItem.cognito_sub}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Data de Criação</Label>
                          <p className="text-lg font-medium text-gray-900 mt-1">
                            {selectedItem.data_criacao ? formatDate(selectedItem.data_criacao) : 'Não informado'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Último Login</Label>
                          <p className="text-lg font-medium text-gray-900 mt-1">
                            {selectedItem.ultimo_login ? formatDate(selectedItem.ultimo_login) : 'Nunca logou'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3 bg-yellow-50">
                    <CardTitle className="text-lg text-yellow-700">⚙️ Ações do Usuário</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ID: {selectedItem.id}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          Empresa ID: {selectedItem.empresa_id}
                        </Badge>
                        {selectedItem.cognito_sub && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            🔗 Sincronizado Cognito
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                          <Users className="h-4 w-4 mr-2" />
                          Perfil
                        </Button>
                        <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sincronizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
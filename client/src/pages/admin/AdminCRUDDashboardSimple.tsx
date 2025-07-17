import React, { useState } from "react";
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
import { Eye, Edit, Trash2, Plus, Building2, Users, FileText, Mail, Phone, MapPin, BarChart3, TrendingUp, DollarSign, RefreshCw } from "lucide-react";

export default function AdminCRUDDashboardSimple() {
  const [activeTab, setActiveTab] = useState("empresas");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const usuarios = [
    {
      id: 1,
      nome: "Usuário Teste",
      email: "test@usuario.com",
      tipoUsuario: "admin",
      status: "ativo",
      empresa_id: 1,
      telefone: "",
      documento: ""
    }
  ];

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
      value: usuarios.length,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 mb-8 text-white">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-blue-100 text-lg">Centro de comando para gestão completa do sistema</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
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
                  {usuarios.length}
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
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Building2 className="h-6 w-6" />
                      </div>
                      Gestão de Empresas
                    </CardTitle>
                    <CardDescription className="text-blue-100 mt-2">
                      Controle completo das organizações parceiras do sistema
                    </CardDescription>
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
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Users className="h-6 w-6" />
                      </div>
                      Gestão de Usuários
                    </CardTitle>
                    <CardDescription className="text-green-100 mt-2">
                      Administre contas de usuário e permissões de acesso
                    </CardDescription>
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
                      {usuarios.map((usuario, index) => (
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-700">
                      Total: <span className="text-green-600 font-bold">{usuarios.length}</span> usuários cadastrados
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {usuarios.filter(u => u.status === 'ativo').length} ativos
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

          {/* Aba Contratos */}
          <TabsContent value="contratos">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <FileText className="h-6 w-6" />
                      </div>
                      Gestão de Contratos
                    </CardTitle>
                    <CardDescription className="text-purple-100 mt-2">
                      Monitore contratos ativos e gerencie relacionamentos comerciais
                    </CardDescription>
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

        {/* Dialog de Visualização Aprimorado */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                Detalhes da Empresa
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-700">Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nome</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.nome}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Razão Social</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.razao_social}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">CNPJ</Label>
                        <p className="text-lg font-mono font-medium text-blue-600 mt-1">{selectedItem.cnpj}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-700">Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Email</Label>
                        <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.email_contato}</p>
                      </div>
                      {selectedItem.telefone && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Telefone</Label>
                          <p className="text-lg font-medium text-gray-900 mt-1">{selectedItem.telefone}</p>
                        </div>
                      )}
                      {(selectedItem.cidade || selectedItem.estado) && (
                        <div>
                          <Label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Localização</Label>
                          <p className="text-lg font-medium text-gray-900 mt-1">
                            {selectedItem.cidade && selectedItem.estado 
                              ? `${selectedItem.cidade}, ${selectedItem.estado}`
                              : selectedItem.cidade || selectedItem.estado
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-700">Status da Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={selectedItem.status === 'ativo' ? "default" : "secondary"}
                        className="text-lg px-4 py-2"
                      >
                        {selectedItem.status === 'ativo' ? "✅ Empresa Ativa" : "⏸️ Empresa Inativa"}
                      </Badge>
                      <div className="flex space-x-3">
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" className="border-gray-300">
                          <FileText className="h-4 w-4 mr-2" />
                          Relatório
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
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
import { Eye, Edit, Trash2, Plus, Building2, Users, FileText, Mail, Phone, MapPin } from "lucide-react";

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão Administrativa</h1>
          <p className="text-gray-600">Gerencie empresas, usuários e contratos do sistema</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="empresas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresas ({empresas.length})
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários ({usuarios.length})
          </TabsTrigger>
          <TabsTrigger value="contratos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contratos ({contratos.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba Empresas */}
        <TabsContent value="empresas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Gestão de Empresas
                  </CardTitle>
                  <CardDescription>
                    Visualize e gerencie as empresas cadastradas no sistema
                  </CardDescription>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Buscar por nome, razão social ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

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
                  {empresas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="font-bold text-blue-600 text-lg leading-tight">
                            {empresa.razao_social || empresa.nome}
                          </div>
                          {empresa.razao_social && empresa.nome !== empresa.razao_social && (
                            <div className="text-sm italic text-gray-500">{empresa.nome}</div>
                          )}
                          {empresa.cnpj && (
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded-full font-mono inline-block">
                              CNPJ: {empresa.cnpj}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {empresa.email_contato && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              <span>{empresa.email_contato}</span>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={empresa.status === 'ativo' ? "default" : "secondary"}>
                          {empresa.status === 'ativo' ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedItem(empresa);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
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

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700">
                  Total: {empresas.length} empresas
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Usuários */}
        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nível de Acesso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {usuario.tipoUsuario === 'admin' ? 'Administrador' : usuario.tipoUsuario}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.status === 'ativo' ? "default" : "secondary"}>
                          {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700">
                  Total: {usuarios.length} usuários
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Contratos */}
        <TabsContent value="contratos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestão de Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => (
                    <TableRow key={contrato.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-blue-600">{contrato.numero}</div>
                          <div className="text-sm text-gray-500">{contrato.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(contrato.data_inicio)} até</div>
                          <div>{formatDate(contrato.data_fim)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatMoney(contrato.valor_total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contrato.status === 'ativo' ? "default" : "secondary"}>
                          {contrato.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700">
                  Total: {contratos.length} contratos
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Empresa</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nome</Label>
                  <p className="text-sm">{selectedItem.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Razão Social</Label>
                  <p className="text-sm">{selectedItem.razao_social}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                  <p className="text-sm">{selectedItem.cnpj}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedItem.email_contato}</p>
                </div>
              </div>
              {selectedItem.telefone && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                  <p className="text-sm">{selectedItem.telefone}</p>
                </div>
              )}
              {(selectedItem.cidade || selectedItem.estado) && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Localização</Label>
                  <p className="text-sm">
                    {selectedItem.cidade && selectedItem.estado 
                      ? `${selectedItem.cidade}, ${selectedItem.estado}`
                      : selectedItem.cidade || selectedItem.estado
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
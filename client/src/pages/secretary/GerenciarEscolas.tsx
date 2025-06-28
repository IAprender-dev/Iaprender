import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft, School, Search, Plus, Edit, Trash2, Eye,
  MapPin, Phone, Mail, Users, Building2, Filter,
  MoreVertical, Download, RefreshCw, CheckCircle,
  AlertCircle, Calendar, Database
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

interface Escola {
  id: number;
  nomeEscola: string;
  tipoEscola: string;
  inep?: string;
  cnpj?: string;
  idSecretaria: number;
  nomeDiretor?: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  zona: string;
  dataFundacao?: string;
  numeroSalas?: number;
  numeroAlunos?: number;
  status: string;
  createdAt: string;
}

export default function GerenciarEscolas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch escolas from database
  const { data: escolas, isLoading, error } = useQuery({
    queryKey: ['/api/escolas'],
    enabled: !!user
  });

  // Mock data for demonstration (replace with real API call)
  const mockEscolas: Escola[] = [
    {
      id: 1,
      nomeEscola: "EMEF Prof. Alvares de Azevedo",
      tipoEscola: "municipal",
      inep: "35052562",
      cnpj: "12.345.678/0001-01",
      idSecretaria: 1,
      nomeDiretor: "Carlos Eduardo Silva",
      endereco: "Rua das Flores, 456",
      bairro: "Vila Madalena",
      cidade: "São Paulo",
      estado: "SP",
      cep: "05435-010",
      telefone: "(11) 3021-1234",
      email: "alvares@sme.prefsp.gov.br",
      zona: "urbana",
      dataFundacao: "1985-03-15",
      numeroSalas: 12,
      numeroAlunos: 480,
      status: "ativa",
      createdAt: "2025-06-28T02:32:50.931489Z"
    },
    {
      id: 2,
      nomeEscola: "EMEI Pequeno Príncipe",
      tipoEscola: "municipal",
      inep: "31076534",
      cnpj: "11.222.333/0001-03",
      idSecretaria: 1,
      nomeDiretor: "Roberto Alves Santos",
      endereco: "Rua da Paz, 321",
      bairro: "Savassi",
      cidade: "Belo Horizonte",
      estado: "MG",
      cep: "30112-000",
      telefone: "(31) 3241-9876",
      email: "pequenoprincipe@pbh.gov.br",
      zona: "urbana",
      dataFundacao: "1990-02-10",
      numeroSalas: 8,
      numeroAlunos: 240,
      status: "ativa",
      createdAt: "2025-06-28T02:32:50.931489Z"
    },
    {
      id: 3,
      nomeEscola: "Escola Rural São José",
      tipoEscola: "municipal",
      inep: "35987123",
      cnpj: "12.345.678/0001-04",
      idSecretaria: 1,
      nomeDiretor: "Helena Ferreira Lima",
      endereco: "Estrada Rural, km 15",
      bairro: "Zona Rural",
      cidade: "São Paulo",
      estado: "SP",
      cep: "08140-000",
      telefone: "(11) 4002-8922",
      email: "saojose@sme.prefsp.gov.br",
      zona: "rural",
      dataFundacao: "1978-09-05",
      numeroSalas: 6,
      numeroAlunos: 180,
      status: "ativa",
      createdAt: "2025-06-28T02:32:50.931489Z"
    }
  ];

  const escolasData = escolas || mockEscolas;

  const deleteEscolaMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/escolas/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({
        title: "Escola removida",
        description: "A escola foi removida do sistema com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/escolas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover escola",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    },
  });

  const filteredEscolas = escolasData.filter((escola: Escola) => {
    const matchesSearch = escola.nomeEscola.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escola.nomeDiretor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         escola.cidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || escola.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTipoEscolaColor = (tipo: string) => {
    switch (tipo) {
      case 'municipal': return 'bg-blue-100 text-blue-800';
      case 'estadual': return 'bg-green-100 text-green-800';
      case 'federal': return 'bg-purple-100 text-purple-800';
      case 'particular': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getZonaColor = (zona: string) => {
    return zona === 'urbana' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 mt-4 font-medium">Carregando escolas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Escolas | Panel SME</title>
        <meta name="description" content="Visualização e gestão de unidades escolares" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <Link href="/panel.sme">
                  <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Panel SME
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={iAprenderLogo} alt="IAprender" className="h-12 w-12 rounded-xl shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-900 to-emerald-700 bg-clip-text text-transparent">
                      Gerenciar Escolas
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">Visualização e edição de dados escolares</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 text-sm font-semibold">
                  <Database className="h-4 w-4 mr-2" />
                  {filteredEscolas.length} Escolas
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Secretário(a) de Educação</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Controls */}
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, diretor ou cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                      <option value="all">Todas</option>
                      <option value="ativa">Ativas</option>
                      <option value="inativa">Inativas</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/escolas'] })}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                  </Button>
                  
                  <Link href="/panel.sme/cadastrar-escola">
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Plus className="h-4 w-4" />
                      Nova Escola
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 bg-blue-50 border-blue-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-800">{filteredEscolas.length}</p>
                    <p className="text-blue-600 font-semibold text-sm">Total de Escolas</p>
                  </div>
                  <School className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-emerald-50 border-emerald-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-emerald-800">
                      {filteredEscolas.filter(e => e.status === 'ativa').length}
                    </p>
                    <p className="text-emerald-600 font-semibold text-sm">Escolas Ativas</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-purple-50 border-purple-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-800">
                      {filteredEscolas.reduce((acc, e) => acc + (e.numeroAlunos || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-purple-600 font-semibold text-sm">Total de Alunos</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-amber-50 border-amber-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-amber-800">
                      {filteredEscolas.filter(e => e.zona === 'rural').length}
                    </p>
                    <p className="text-amber-600 font-semibold text-sm">Escolas Rurais</p>
                  </div>
                  <MapPin className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schools Table */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <Database className="h-6 w-6" />
                Dados das Escolas
                <Badge className="bg-white/20 text-white ml-auto">
                  {filteredEscolas.length} registros
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Nome da Escola</TableHead>
                      <TableHead className="font-bold">Tipo</TableHead>
                      <TableHead className="font-bold">Diretor(a)</TableHead>
                      <TableHead className="font-bold">Localização</TableHead>
                      <TableHead className="font-bold">Zona</TableHead>
                      <TableHead className="font-bold">Alunos</TableHead>
                      <TableHead className="font-bold">Contato</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEscolas.map((escola) => (
                      <TableRow key={escola.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="font-semibold text-slate-900">{escola.nomeEscola}</div>
                          {escola.inep && (
                            <div className="text-xs text-slate-700 font-medium">INEP: {escola.inep}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTipoEscolaColor(escola.tipoEscola)}>
                            {escola.tipoEscola.charAt(0).toUpperCase() + escola.tipoEscola.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{escola.nomeDiretor || 'Não informado'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{escola.cidade}, {escola.estado}</div>
                            <div className="text-slate-700 font-medium">{escola.bairro}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getZonaColor(escola.zona)}>
                            {escola.zona.charAt(0).toUpperCase() + escola.zona.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-semibold">{escola.numeroAlunos || 0}</div>
                            <div className="text-xs text-slate-700 font-medium">{escola.numeroSalas || 0} salas</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-600" />
                              <span className="text-xs text-slate-800 font-medium">{escola.telefone}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3 text-slate-600" />
                              <span className="text-xs text-slate-800 font-medium truncate max-w-[120px]">{escola.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={escola.status === 'ativa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {escola.status === 'ativa' ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="p-2">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="p-2">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="p-2 text-red-600 hover:text-red-700"
                              onClick={() => deleteEscolaMutation.mutate(escola.id)}
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
              
              {filteredEscolas.length === 0 && (
                <div className="text-center py-12">
                  <School className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhuma escola encontrada</h3>
                  <p className="text-slate-500 mb-4">
                    {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece cadastrando sua primeira escola'}
                  </p>
                  <Link href="/panel.sme/cadastrar-escola">
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeira Escola
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Edit, Eye, Calendar, DollarSign } from "lucide-react";
import { Contrato, InsertContrato, Empresa } from "@shared/schema";

interface ContractFormData {
  numero: string;
  nome: string;
  empresaId: number | null;
  dataInicio: string;
  dataFim: string;
  valor: string;
  moeda: string;
  descricao?: string;
  objeto?: string;
  status: string;
  observacoes?: string;
}

export default function ContractManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contrato | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>({
    numero: "",
    nome: "",
    empresaId: null,
    dataInicio: "",
    dataFim: "",
    valor: "",
    moeda: "BRL",
    descricao: "",
    objeto: "",
    status: "active",
    observacoes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar empresas para o select
  const { data: empresas } = useQuery({
    queryKey: ['/api/empresas'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/empresas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar empresas');
      const result = await response.json();
      return result.data as Empresa[];
    }
  });

  // Buscar contratos
  const { data: contratos, isLoading, error } = useQuery({
    queryKey: ['/api/contratos'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/contratos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Erro ao buscar contratos');
      const result = await response.json();
      return result.data as Contrato[];
    }
  });

  // Criar contrato
  const createMutation = useMutation({
    mutationFn: async (data: InsertContrato) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar contrato');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contratos'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Contrato criado com sucesso!"
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

  const resetForm = () => {
    setFormData({
      numero: "",
      nome: "",
      empresaId: null,
      dataInicio: "",
      dataFim: "",
      valor: "",
      moeda: "BRL",
      descricao: "",
      objeto: "",
      status: "active",
      observacoes: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero || !formData.nome || !formData.empresaId || 
        !formData.dataInicio || !formData.dataFim || !formData.valor) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar datas
    const dataInicio = new Date(formData.dataInicio);
    const dataFim = new Date(formData.dataFim);
    if (dataFim <= dataInicio) {
      toast({
        title: "Erro",
        description: "Data de fim deve ser posterior à data de início",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      empresaId: formData.empresaId!,
      valor: parseFloat(formData.valor.replace(/[^\d.,]/g, '').replace(',', '.'))
    });
  };

  const formatCurrency = (value: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'expired': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getEmpresaNome = (empresaId: number) => {
    const empresa = empresas?.find(e => e.id === empresaId);
    return empresa?.nome || 'Empresa não encontrada';
  };

  const viewContract = (contrato: Contrato) => {
    setSelectedContract(contrato);
    setIsViewOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro ao carregar contratos</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Contratos</h1>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Contrato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Número do Contrato *</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="Ex: 001/2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nome">Nome do Contrato *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Prestação de Serviços Educacionais"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="empresaId">Empresa Contratante *</Label>
                <Select 
                  value={formData.empresaId?.toString() || ""} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, empresaId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id.toString()}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data de Fim *</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="valor">Valor Total *</Label>
                  <Input
                    id="valor"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="Ex: 150000.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="moeda">Moeda</Label>
                  <Select 
                    value={formData.moeda} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, moeda: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="objeto">Objeto do Contrato</Label>
                <Input
                  id="objeto"
                  value={formData.objeto}
                  onChange={(e) => setFormData(prev => ({ ...prev, objeto: e.target.value }))}
                  placeholder="Ex: Prestação de serviços de tecnologia educacional"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição detalhada do contrato..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Contrato"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contratos Cadastrados ({contratos?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {contratos && contratos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número/Nome</TableHead>
                  <TableHead>Empresa</TableHead>
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
                      <div>
                        <div className="font-medium">{contrato.numero}</div>
                        <div className="text-sm text-gray-500">{contrato.nome}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getEmpresaNome(contrato.empresaId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(contrato.dataInicio)} - {formatDate(contrato.dataFim)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(contrato.valor, contrato.moeda)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(contrato.status)}>
                        {getStatusLabel(contrato.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewContract(contrato)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contrato cadastrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando seu primeiro contrato.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Contrato</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Número</Label>
                  <p className="text-sm font-mono">{selectedContract.numero}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nome</Label>
                  <p className="text-sm">{selectedContract.nome}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Empresa Contratante</Label>
                <p className="text-sm">{getEmpresaNome(selectedContract.empresaId)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Início</Label>
                  <p className="text-sm">{formatDate(selectedContract.dataInicio)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Data de Fim</Label>
                  <p className="text-sm">{formatDate(selectedContract.dataFim)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Valor Total</Label>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(selectedContract.valor, selectedContract.moeda)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={getStatusColor(selectedContract.status)}>
                    {getStatusLabel(selectedContract.status)}
                  </Badge>
                </div>
              </div>

              {selectedContract.objeto && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Objeto</Label>
                  <p className="text-sm">{selectedContract.objeto}</p>
                </div>
              )}

              {selectedContract.descricao && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                  <p className="text-sm">{selectedContract.descricao}</p>
                </div>
              )}

              {selectedContract.observacoes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Observações</Label>
                  <p className="text-sm">{selectedContract.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Criado em</Label>
                  <p className="text-sm">{formatDate(selectedContract.criadoEm)}</p>
                </div>
                {selectedContract.atualizadoEm && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Atualizado em</Label>
                    <p className="text-sm">{formatDate(selectedContract.atualizadoEm)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
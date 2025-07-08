import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Edit, 
  Eye, 
  Save, 
  X, 
  FileText, 
  Calendar, 
  DollarSign,
  Users,
  Building,
  ArrowLeft,
  Bell,
  User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import logoIAprender from '@assets/IAprender_1750262377399.png';

interface Contract {
  id: number;
  name: string;
  status: string;
  totalLicenses: number;
  maxTeachers: number;
  startDate: string;
  endDate: string;
  value: number;
  description: string;
  companyId: number;
}

export default function ContractManagement() {
  const [, setLocation] = useLocation();
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Contract>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // Query para buscar contratos
  const { data: contractsData, isLoading, error } = useQuery<{ success: boolean; contracts: Contract[] }>({
    queryKey: ['/api/municipal/contracts/filtered'],
  });

  // Mutation para atualizar contrato
  const updateContractMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<Contract> }) =>
      apiRequest(`/api/municipal/contracts/${data.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data.updates),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Contrato atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/municipal/contracts/filtered'] });
      setEditingContract(null);
      setEditFormData({});
    },
    onError: (error) => {
      toast({ 
        title: 'Erro', 
        description: 'Erro ao atualizar contrato. Tente novamente.',
        variant: 'destructive'
      });
      console.error('Error updating contract:', error);
    },
  });

  const handleEditClick = (contract: Contract) => {
    setEditingContract(contract);
    setEditFormData({
      name: contract.name,
      status: contract.status,
      totalLicenses: contract.totalLicenses,
      maxTeachers: contract.maxTeachers,
      startDate: contract.startDate?.split('T')[0], // Format for date input
      endDate: contract.endDate?.split('T')[0],
      value: contract.value,
      description: contract.description,
    });
  };

  const handleSaveEdit = () => {
    if (!editingContract) return;

    updateContractMutation.mutate({
      id: editingContract.id,
      updates: editFormData,
    });
  };

  const handleCancelEdit = () => {
    setEditingContract(null);
    setEditFormData({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'expired': return 'bg-red-500';
      case 'suspended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Erro ao carregar contratos</h2>
          <p className="text-gray-600 mt-2">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Principal */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Botão Voltar e Logo */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/gestor/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-lg p-2 shadow-sm">
                  <img 
                    src={logoIAprender} 
                    alt="IAprender" 
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                  <p className="text-sm text-gray-600">Gestão de Contratos</p>
                </div>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.first_name || 'Usuário'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <nav className="flex space-x-2 text-sm">
              <span className="text-gray-500">Gestor Municipal</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-600 font-medium">Gestão de Contratos</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total de Contratos</CardTitle>
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{contractsData?.contracts?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Contratos registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Contratos Ativos</CardTitle>
              <div className="bg-green-100 p-2 rounded-lg">
                <Building className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {contractsData?.contracts?.filter(c => c.status === 'active').length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Em operação</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total de Licenças</CardTitle>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {contractsData?.contracts?.reduce((sum, c) => sum + (c.totalLicenses || 0), 0) || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Licenças disponíveis</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Valor Total</CardTitle>
              <div className="bg-emerald-100 p-2 rounded-lg">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(contractsData?.contracts?.reduce((sum, c) => sum + (c.value || 0), 0) || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Valor mensal</p>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contractsData?.contracts?.map((contract) => (
            <Card key={contract.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">{contract.name}</CardTitle>
                  <Badge className={`${getStatusColor(contract.status)} text-white`}>
                    {getStatusLabel(contract.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Licenças:</span>
                    <div className="font-medium">{contract.totalLicenses}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Professores:</span>
                    <div className="font-medium">{contract.maxTeachers}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Início:</span>
                    <div className="font-medium">{formatDate(contract.startDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Fim:</span>
                    <div className="font-medium">{formatDate(contract.endDate)}</div>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-500">Valor:</span>
                  <div className="font-bold text-green-600">{formatCurrency(contract.value)}</div>
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setViewingContract(contract)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes do Contrato</DialogTitle>
                        <DialogDescription>
                          Informações completas do contrato {viewingContract?.name}
                        </DialogDescription>
                      </DialogHeader>
                      {viewingContract && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nome do Contrato</Label>
                              <div className="font-medium">{viewingContract.name}</div>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Badge className={`${getStatusColor(viewingContract.status)} text-white`}>
                                {getStatusLabel(viewingContract.status)}
                              </Badge>
                            </div>
                            <div>
                              <Label>Total de Licenças</Label>
                              <div className="font-medium">{viewingContract.totalLicenses}</div>
                            </div>
                            <div>
                              <Label>Máximo de Professores</Label>
                              <div className="font-medium">{viewingContract.maxTeachers}</div>
                            </div>
                            <div>
                              <Label>Data de Início</Label>
                              <div className="font-medium">{formatDate(viewingContract.startDate)}</div>
                            </div>
                            <div>
                              <Label>Data de Fim</Label>
                              <div className="font-medium">{formatDate(viewingContract.endDate)}</div>
                            </div>
                          </div>
                          <div>
                            <Label>Valor</Label>
                            <div className="font-bold text-green-600 text-lg">{formatCurrency(viewingContract.value)}</div>
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <div className="text-gray-700">{viewingContract.description || 'Nenhuma descrição disponível'}</div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditClick(contract)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Contract Dialog */}
        {editingContract && (
          <Dialog open={!!editingContract} onOpenChange={() => handleCancelEdit()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Contrato</DialogTitle>
                <DialogDescription>
                  Atualize as informações do contrato {editingContract.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Contrato</Label>
                    <Input
                      id="name"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="suspended">Suspenso</SelectItem>
                        <SelectItem value="expired">Expirado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="totalLicenses">Total de Licenças</Label>
                    <Input
                      id="totalLicenses"
                      type="number"
                      value={editFormData.totalLicenses || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, totalLicenses: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTeachers">Máximo de Professores</Label>
                    <Input
                      id="maxTeachers"
                      type="number"
                      value={editFormData.maxTeachers || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, maxTeachers: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={editFormData.startDate || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Data de Fim</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={editFormData.endDate || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={editFormData.value || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateContractMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateContractMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Empty State */}
        {contractsData?.contracts?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-500">Não há contratos disponíveis para sua empresa no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
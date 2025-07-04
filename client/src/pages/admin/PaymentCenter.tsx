import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, RefreshCw, Ban, Play, Pause } from 'lucide-react';

interface Contract {
  id: number;
  contractNumber: string;
  companyName: string;
  planType: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyValue: number;
  daysRemaining: number;
  lastPayment?: string;
  nextPayment?: string;
}

interface PaymentRecord {
  id: number;
  contractId: number;
  amount: number;
  paymentDate: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
  reference: string;
  notes?: string;
}

export default function PaymentCenter() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contracts with payment status
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/admin/payment/contracts'],
  });

  // Fetch payment records
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/admin/payment/records'],
  });

  // Fetch payment statistics
  const { data: stats = { totalPaid: 0, pendingPayments: 0, overduePayments: 0, totalRevenue: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/payment/stats'],
  });

  // Register payment mutation
  const registerPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('POST', '/api/admin/payment/register', paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento Registrado",
        description: "Pagamento registrado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment/records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment/stats'] });
      setPaymentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao registrar pagamento",
        variant: "destructive",
      });
    },
  });

  // Renew license mutation
  const renewLicenseMutation = useMutation({
    mutationFn: async (renewalData: any) => {
      return apiRequest('POST', '/api/admin/payment/renew', renewalData);
    },
    onSuccess: () => {
      toast({
        title: "Licença Renovada",
        description: "Licença renovada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment/contracts'] });
      setRenewalDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao renovar licença",
        variant: "destructive",
      });
    },
  });

  // Access control mutation
  const accessControlMutation = useMutation({
    mutationFn: async ({ contractId, action }: { contractId: number; action: string }) => {
      return apiRequest('POST', '/api/admin/payment/access-control', { contractId, action });
    },
    onSuccess: (data, variables) => {
      const actionMap = {
        activate: 'ativado',
        reactivate: 'reativado',
        block: 'bloqueado',
        deactivate: 'desativado'
      };
      toast({
        title: "Acesso Atualizado",
        description: `Acesso ${actionMap[variables.action as keyof typeof actionMap]} com sucesso!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment/contracts'] });
      setAccessDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar acesso",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days <= 7) return 'text-red-600';
    if (days <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (contractsLoading || paymentsLoading || statsLoading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Central de Pagamentos
              </h1>
              <p className="text-slate-600 mt-2">
                Gestão completa de contratos, pagamentos e renovações
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => window.location.href = '/admin/master'}
                variant="outline"
                className="bg-white/50 hover:bg-white/80"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Receita Mensal</p>
                  <p className="text-3xl font-bold">
                    R$ {(stats.monthlyRevenue || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Contratos Ativos</p>
                  <p className="text-3xl font-bold">{stats.activeContracts || 0}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Vencendo em 30 dias</p>
                  <p className="text-3xl font-bold">{stats.expiringSoon || 0}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-yellow-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">Em Atraso</p>
                  <p className="text-3xl font-bold">{stats.overdue || 0}</p>
                </div>
                <Clock className="h-12 w-12 text-red-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-white/20 p-1">
            <TabsTrigger value="contracts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Contratos & Status
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Registros de Pagamento
            </TabsTrigger>
            <TabsTrigger value="renewals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Histórico de Renovações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">Gestão de Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts.map((contract: Contract) => (
                    <div key={contract.id} className="border border-slate-200 rounded-lg p-4 bg-white/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-800">{contract.companyName}</h3>
                            <Badge className={getStatusColor(contract.status)}>
                              {contract.status}
                            </Badge>
                            <Badge variant="outline">
                              {contract.planType}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">Contrato:</span> {contract.contractNumber}
                            </div>
                            <div>
                              <span className="font-medium">Valor Mensal:</span> R$ {contract.monthlyValue?.toLocaleString('pt-BR')}
                            </div>
                            <div>
                              <span className="font-medium">Vencimento:</span> {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div className={getDaysRemainingColor(contract.daysRemaining)}>
                              <span className="font-medium">Dias restantes:</span> {contract.daysRemaining}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-50 text-green-700 hover:bg-green-100"
                                onClick={() => setSelectedContract(contract)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pagamento
                              </Button>
                            </DialogTrigger>
                          </Dialog>

                          <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                                onClick={() => setSelectedContract(contract)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Renovar
                              </Button>
                            </DialogTrigger>
                          </Dialog>

                          <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-orange-50 text-orange-700 hover:bg-orange-100"
                                onClick={() => setSelectedContract(contract)}
                              >
                                Acesso
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.map((payment: PaymentRecord) => (
                    <div key={payment.id} className="border border-slate-200 rounded-lg p-4 bg-white/50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-slate-800">
                              R$ {payment.amount.toLocaleString('pt-BR')}
                            </span>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status === 'paid' ? 'Pago' : payment.status === 'pending' ? 'Pendente' : 'Vencido'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                            <div>
                              <span className="font-medium">Data Pagamento:</span> {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <span className="font-medium">Vencimento:</span> {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                            </div>
                            <div>
                              <span className="font-medium">Método:</span> {payment.method}
                            </div>
                            <div>
                              <span className="font-medium">Referência:</span> {payment.reference}
                            </div>
                          </div>
                          {payment.notes && (
                            <div className="mt-2 text-sm text-slate-600">
                              <span className="font-medium">Observações:</span> {payment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renewals">
            <Card className="bg-white/80 backdrop-blur-sm border border-white/20">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800">Histórico de Renovações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>Histórico de renovações será exibido aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Registration Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <PaymentForm
              contract={selectedContract}
              onSubmit={(data) => registerPaymentMutation.mutate(data)}
              isLoading={registerPaymentMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* License Renewal Dialog */}
        <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Renovar Licença</DialogTitle>
            </DialogHeader>
            <RenewalForm
              contract={selectedContract}
              onSubmit={(data) => renewLicenseMutation.mutate(data)}
              isLoading={renewLicenseMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Access Control Dialog */}
        <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Controle de Acesso</DialogTitle>
            </DialogHeader>
            <AccessControlForm
              contract={selectedContract}
              onSubmit={(action) => accessControlMutation.mutate({ contractId: selectedContract?.id!, action })}
              isLoading={accessControlMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Payment Form Component
function PaymentForm({ contract, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    amount: contract?.monthlyValue || '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'pix',
    reference: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      contractId: contract?.id,
      ...formData,
      amount: parseFloat(formData.amount.toString())
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="paymentDate">Data do Pagamento</Label>
        <Input
          id="paymentDate"
          type="date"
          value={formData.paymentDate}
          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="method">Método de Pagamento</Label>
        <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="boleto">Boleto</SelectItem>
            <SelectItem value="transferencia">Transferência</SelectItem>
            <SelectItem value="cartao">Cartão</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="reference">Referência/Comprovante</Label>
        <Input
          id="reference"
          value={formData.reference}
          onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
          placeholder="ID da transação, número do boleto, etc."
        />
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações adicionais..."
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Registrando...' : 'Registrar Pagamento'}
      </Button>
    </form>
  );
}

// Renewal Form Component
function RenewalForm({ contract, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    renewalPeriod: '12',
    newEndDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      contractId: contract?.id,
      ...formData,
      renewalPeriod: parseInt(formData.renewalPeriod)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="renewalPeriod">Período de Renovação (meses)</Label>
        <Select value={formData.renewalPeriod} onValueChange={(value) => setFormData({ ...formData, renewalPeriod: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 meses</SelectItem>
            <SelectItem value="12">12 meses</SelectItem>
            <SelectItem value="24">24 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="newEndDate">Nova Data de Vencimento</Label>
        <Input
          id="newEndDate"
          type="date"
          value={formData.newEndDate}
          onChange={(e) => setFormData({ ...formData, newEndDate: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observações sobre a renovação..."
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Renovando...' : 'Renovar Licença'}
      </Button>
    </form>
  );
}

// Access Control Form Component
function AccessControlForm({ contract, onSubmit, isLoading }: any) {
  const [selectedAction, setSelectedAction] = useState('');

  const actions = [
    { value: 'activate', label: 'Ativar', icon: Play, color: 'text-green-600' },
    { value: 'reactivate', label: 'Reativar', icon: RefreshCw, color: 'text-blue-600' },
    { value: 'block', label: 'Bloquear', icon: Ban, color: 'text-red-600' },
    { value: 'deactivate', label: 'Desativar', icon: Pause, color: 'text-gray-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAction) {
      onSubmit(selectedAction);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Ação de Controle de Acesso</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {actions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.value}
                type="button"
                onClick={() => setSelectedAction(action.value)}
                className={`p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors ${
                  selectedAction === action.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <IconComponent className={`h-6 w-6 mx-auto mb-1 ${action.color}`} />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {contract && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Contrato:</span> {contract.companyName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Status Atual:</span> {contract.status}
          </p>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading || !selectedAction}>
        {isLoading ? 'Processando...' : 'Aplicar Ação'}
      </Button>
    </form>
  );
}
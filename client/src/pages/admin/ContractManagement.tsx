import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Trash2, 
  CalendarIcon, 
  Users, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  DollarSign,
  Activity,
  Target,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface Contract {
  id: string;
  companyName: string;
  clientName: string;
  email: string;
  phone: string;
  planType: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended';
  startDate: string;
  endDate: string;
  totalLicenses: number;
  availableLicenses: number;
  usedLicenses: number;
  pricePerLicense: number;
  monthlyRevenue: number;
  tokenLimits: {
    teacher: number;
    student: number;
  };
  enabledModels: string[];
  autoRenewal: boolean;
  createdAt: string;
}

const ContractManagement = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    planType: 'basic',
    status: 'active',
    totalLicenses: 10,
    pricePerLicense: 29.90,
    tokenLimits: { teacher: 10000, student: 5000 },
    enabledModels: ['openai-gpt-4', 'anthropic-claude'],
    autoRenewal: true
  });

  // Fetch real contracts from database
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/admin/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data.contracts);
          setFilteredContracts(data.contracts);
        } else {
          console.error('Erro ao buscar contratos:', response.statusText);
        }
      } catch (error) {
        console.error('Erro na requisição de contratos:', error);
      }
    };

    fetchContracts();
  }, []);

  // Filter contracts based on search and status
  useEffect(() => {
    let filtered = contracts.filter(contract => 
      contract.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle, label: "Ativo" },
      pending: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock, label: "Pendente" },
      expired: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle, label: "Expirado" },
      cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle, label: "Cancelado" },
      suspended: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: Pause, label: "Suspenso" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} border font-medium`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      basic: { color: "bg-blue-100 text-blue-800", label: "Básico" },
      standard: { color: "bg-purple-100 text-purple-800", label: "Padrão" },
      premium: { color: "bg-indigo-100 text-indigo-800", label: "Premium" },
      enterprise: { color: "bg-slate-100 text-slate-800", label: "Enterprise" }
    };

    const config = planConfig[plan as keyof typeof planConfig] || planConfig.basic;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const toggleContractStatus = (contractId: string) => {
    setContracts(prev => prev.map(contract => {
      if (contract.id === contractId) {
        const newStatus = contract.status === 'active' ? 'suspended' : 'active';
        return { ...contract, status: newStatus };
      }
      return contract;
    }));
  };

  const handleCreateContract = async () => {
    try {
      const contractData = {
        companyName: newContract.companyName || '',
        clientName: newContract.clientName || '',
        email: newContract.email || '',
        phone: newContract.phone || '',
        planType: newContract.planType || 'basic',
        status: newContract.status || 'active',
        startDate: newContract.startDate || new Date().toISOString().split('T')[0],
        endDate: newContract.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalLicenses: newContract.totalLicenses || 10,
        pricePerLicense: newContract.pricePerLicense || 29.90,
        tokenLimits: newContract.tokenLimits || { teacher: 10000, student: 5000 },
        enabledModels: newContract.enabledModels || ['openai-gpt-4'],
        autoRenewal: newContract.autoRenewal ?? true
      };

      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Atualizar lista de contratos
        setContracts(prev => [result.contract, ...prev]);
        setFilteredContracts(prev => [result.contract, ...prev]);
        
        // Fechar modal e resetar formulário
        setIsCreateModalOpen(false);
        setNewContract({
          planType: 'basic',
          status: 'active',
          totalLicenses: 10,
          pricePerLicense: 29.90,
          tokenLimits: { teacher: 10000, student: 5000 },
          enabledModels: ['openai-gpt-4'],
          autoRenewal: true
        });

        console.log('✅ Contrato criado com sucesso:', result.contract);
      } else {
        const error = await response.json();
        console.error('❌ Erro ao criar contrato:', error);
        alert('Erro ao criar contrato: ' + (error.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      alert('Erro na requisição. Verifique os dados e tente novamente.');
    }
  };

  const handleEditContract = () => {
    if (!selectedContract) return;

    setContracts(prev => prev.map(contract => {
      if (contract.id === selectedContract.id) {
        return {
          ...selectedContract,
          monthlyRevenue: selectedContract.totalLicenses * selectedContract.pricePerLicense
        };
      }
      return contract;
    }));

    setIsEditModalOpen(false);
    setSelectedContract(null);
  };

  const openEditModal = (contract: Contract) => {
    setSelectedContract({ ...contract });
    setIsEditModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/master">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <div className="relative z-10">
                  <span className="text-white font-bold text-sm">IA</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IAprender
              </span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestão de Contratos</h1>
              <p className="text-slate-600 mt-1">Gerencie contratos, licenças e configurações</p>
            </div>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Contrato</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo contrato
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="licenses">Licenças</TabsTrigger>
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        value={newContract.companyName || ''}
                        onChange={(e) => setNewContract(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Nome da instituição"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientName">Nome do Responsável</Label>
                      <Input
                        id="clientName"
                        value={newContract.clientName || ''}
                        onChange={(e) => setNewContract(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder="Nome do contato principal"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newContract.email || ''}
                        onChange={(e) => setNewContract(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@escola.edu.br"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newContract.phone || ''}
                        onChange={(e) => setNewContract(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planType">Tipo de Plano</Label>
                      <Select value={newContract.planType} onValueChange={(value) => setNewContract(prev => ({ ...prev, planType: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newContract.status} onValueChange={(value) => setNewContract(prev => ({ ...prev, status: value as any }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="licenses" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalLicenses">Total de Licenças</Label>
                      <Input
                        id="totalLicenses"
                        type="number"
                        value={newContract.totalLicenses || 0}
                        onChange={(e) => setNewContract(prev => ({ ...prev, totalLicenses: parseInt(e.target.value) }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pricePerLicense">Preço por Licença (R$)</Label>
                      <Input
                        id="pricePerLicense"
                        type="number"
                        step="0.01"
                        value={newContract.pricePerLicense || 0}
                        onChange={(e) => setNewContract(prev => ({ ...prev, pricePerLicense: parseFloat(e.target.value) }))}
                        placeholder="29.90"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teacherTokens">Limite Mensal - Professores</Label>
                      <Input
                        id="teacherTokens"
                        type="number"
                        value={newContract.tokenLimits?.teacher || 0}
                        onChange={(e) => setNewContract(prev => ({ 
                          ...prev, 
                          tokenLimits: { teacher: parseInt(e.target.value) || 10000, student: prev.tokenLimits?.student || 5000 } 
                        }))}
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="studentTokens">Limite Mensal - Alunos</Label>
                      <Input
                        id="studentTokens"
                        type="number"
                        value={newContract.tokenLimits?.student || 0}
                        onChange={(e) => setNewContract(prev => ({ 
                          ...prev, 
                          tokenLimits: { teacher: prev.tokenLimits?.teacher || 10000, student: parseInt(e.target.value) || 5000 } 
                        }))}
                        placeholder="5000"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="config" className="space-y-4">
                  <div>
                    <Label>Modelos Habilitados</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['openai-gpt-4', 'anthropic-claude', 'perplexity', 'bedrock'].map(model => (
                        <div key={model} className="flex items-center space-x-2">
                          <Switch
                            checked={newContract.enabledModels?.includes(model)}
                            onCheckedChange={(checked) => {
                              setNewContract(prev => ({
                                ...prev,
                                enabledModels: checked 
                                  ? [...(prev.enabledModels || []), model]
                                  : (prev.enabledModels || []).filter(m => m !== model)
                              }));
                            }}
                          />
                          <Label className="text-sm">{model}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newContract.autoRenewal}
                      onCheckedChange={(checked) => setNewContract(prev => ({ ...prev, autoRenewal: checked }))}
                    />
                    <Label>Renovação Automática</Label>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateContract} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                  Criar Contrato
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por empresa, responsável, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="suspended">Suspensos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="grid gap-6">
          {filteredContracts.map((contract) => {
            const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
            const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            
            return (
              <Card key={contract.id} className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-slate-900">{contract.companyName}</CardTitle>
                        {getStatusBadge(contract.status)}
                        {getPlanBadge(contract.planType)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          {contract.clientName}
                        </span>
                        <span>{contract.email}</span>
                        <span>{contract.phone}</span>
                      </div>
                      <CardDescription className="mt-2 text-slate-500">
                        ID: {contract.id} • Criado em {formatDate(contract.createdAt)}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(contract)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleContractStatus(contract.id)}
                        className={contract.status === 'active' 
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        }
                      >
                        {contract.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Contract Duration */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CalendarIcon className="w-4 h-4" />
                        Vigência
                      </div>
                      <div className="text-sm text-slate-600">
                        <div>{formatDate(contract.startDate)} até</div>
                        <div>{formatDate(contract.endDate)}</div>
                        {isExpiringSoon && (
                          <div className="flex items-center gap-1 text-amber-600 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-xs">Expira em {daysUntilExpiry} dias</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Licenses */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Users className="w-4 h-4" />
                        Licenças
                      </div>
                      <div className="text-sm text-slate-600">
                        <div>{contract.usedLicenses} / {contract.totalLicenses} usadas</div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" 
                            style={{ width: `${(contract.usedLicenses / contract.totalLicenses) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {contract.availableLicenses} disponíveis
                        </div>
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <DollarSign className="w-4 h-4" />
                        Receita Mensal
                      </div>
                      <div className="text-sm text-slate-600">
                        <div className="text-lg font-semibold text-emerald-600">
                          {formatCurrency(contract.monthlyRevenue)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatCurrency(contract.pricePerLicense)} por licença
                        </div>
                      </div>
                    </div>

                    {/* Token Limits */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Activity className="w-4 h-4" />
                        Limites de Token
                      </div>
                      <div className="text-sm text-slate-600">
                        <div>Prof: {contract.tokenLimits.teacher.toLocaleString()}</div>
                        <div>Aluno: {contract.tokenLimits.student.toLocaleString()}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {contract.enabledModels.length} modelos ativos
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Building className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-slate-600 mb-4">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros de busca"
                : "Crie seu primeiro contrato para começar"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            )}
          </div>
        )}

        {/* Edit Contract Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Contrato</DialogTitle>
              <DialogDescription>
                Altere as configurações do contrato
              </DialogDescription>
            </DialogHeader>
            
            {selectedContract && (
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="licenses">Licenças</TabsTrigger>
                  <TabsTrigger value="config">Configurações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-companyName">Nome da Empresa</Label>
                      <Input
                        id="edit-companyName"
                        value={selectedContract.companyName}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-clientName">Nome do Responsável</Label>
                      <Input
                        id="edit-clientName"
                        value={selectedContract.clientName}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, clientName: e.target.value } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={selectedContract.email}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, email: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Telefone</Label>
                      <Input
                        id="edit-phone"
                        value={selectedContract.phone}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, phone: e.target.value } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-planType">Tipo de Plano</Label>
                      <Select 
                        value={selectedContract.planType} 
                        onValueChange={(value) => setSelectedContract(prev => prev ? { ...prev, planType: value as any } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="standard">Padrão</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select 
                        value={selectedContract.status} 
                        onValueChange={(value) => setSelectedContract(prev => prev ? { ...prev, status: value as any } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                          <SelectItem value="expired">Expirado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="licenses" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-totalLicenses">Total de Licenças</Label>
                      <Input
                        id="edit-totalLicenses"
                        type="number"
                        value={selectedContract.totalLicenses}
                        onChange={(e) => {
                          const newTotal = parseInt(e.target.value);
                          setSelectedContract(prev => prev ? { 
                            ...prev, 
                            totalLicenses: newTotal,
                            availableLicenses: newTotal - prev.usedLicenses
                          } : null);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-pricePerLicense">Preço por Licença (R$)</Label>
                      <Input
                        id="edit-pricePerLicense"
                        type="number"
                        step="0.01"
                        value={selectedContract.pricePerLicense}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, pricePerLicense: parseFloat(e.target.value) } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-teacherTokens">Limite Mensal - Professores</Label>
                      <Input
                        id="edit-teacherTokens"
                        type="number"
                        value={selectedContract.tokenLimits.teacher}
                        onChange={(e) => setSelectedContract(prev => prev ? { 
                          ...prev, 
                          tokenLimits: { ...prev.tokenLimits, teacher: parseInt(e.target.value) } 
                        } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-studentTokens">Limite Mensal - Alunos</Label>
                      <Input
                        id="edit-studentTokens"
                        type="number"
                        value={selectedContract.tokenLimits.student}
                        onChange={(e) => setSelectedContract(prev => prev ? { 
                          ...prev, 
                          tokenLimits: { ...prev.tokenLimits, student: parseInt(e.target.value) } 
                        } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700 mb-2">Uso Atual de Licenças</div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Usadas: {selectedContract.usedLicenses}</span>
                      <span>Disponíveis: {selectedContract.availableLicenses}</span>
                      <span>Total: {selectedContract.totalLicenses}</span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="config" className="space-y-4">
                  <div>
                    <Label>Modelos Habilitados</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['openai-gpt-4', 'anthropic-claude', 'perplexity', 'bedrock'].map(model => (
                        <div key={model} className="flex items-center space-x-2">
                          <Switch
                            checked={selectedContract.enabledModels.includes(model)}
                            onCheckedChange={(checked) => {
                              setSelectedContract(prev => prev ? ({
                                ...prev,
                                enabledModels: checked 
                                  ? [...prev.enabledModels, model]
                                  : prev.enabledModels.filter(m => m !== model)
                              }) : null);
                            }}
                          />
                          <Label className="text-sm">{model}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedContract.autoRenewal}
                      onCheckedChange={(checked) => setSelectedContract(prev => prev ? { ...prev, autoRenewal: checked } : null)}
                    />
                    <Label>Renovação Automática</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-startDate">Data de Início</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        value={selectedContract.startDate}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-endDate">Data de Fim</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        value={selectedContract.endDate}
                        onChange={(e) => setSelectedContract(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditContract} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContractManagement;
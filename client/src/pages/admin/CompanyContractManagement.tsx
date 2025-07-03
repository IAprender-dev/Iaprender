import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Building2, 
  FileText, 
  Users, 
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Activity,
  CreditCard,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  logo?: string;
  createdAt: string;
  contracts: Contract[];
}

interface Contract {
  id: number;
  name: string;
  description?: string;
  planType: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'pending' | 'expired' | 'cancelled' | 'suspended';
  startDate: string;
  endDate: string;
  totalLicenses: number;
  availableLicenses: number;
  maxTeachers: number;
  maxStudents: number;
  pricePerLicense: number;
  monthlyTokenLimitTeacher: number;
  monthlyTokenLimitStudent: number;
  enabledAIModels: string[];
  createdAt: string;
}

interface NewCompanyForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
}

interface NewContractForm {
  name: string;
  description: string;
  planType: 'basic' | 'standard' | 'premium' | 'enterprise';
  startDate: string;
  endDate: string;
  totalLicenses: number;
  maxTeachers: number;
  maxStudents: number;
  pricePerLicense: number;
}

export default function CompanyContractManagement() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [isCreateContractModalOpen, setIsCreateContractModalOpen] = useState(false);
  const [isViewCompanyModalOpen, setIsViewCompanyModalOpen] = useState(false);
  const [isEditCompanyModalOpen, setIsEditCompanyModalOpen] = useState(false);
  const [isViewContractModalOpen, setIsViewContractModalOpen] = useState(false);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [newCompany, setNewCompany] = useState<NewCompanyForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: ""
  });
  const [newContract, setNewContract] = useState<NewContractForm>({
    name: "",
    description: "",
    planType: "basic",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalLicenses: 10,
    maxTeachers: 5,
    maxStudents: 50,
    pricePerLicense: 29.90
  });
  
  // Edit forms state
  const [editCompany, setEditCompany] = useState<NewCompanyForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: ""
  });
  const [editContract, setEditContract] = useState<NewContractForm>({
    name: "",
    description: "",
    planType: "basic",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalLicenses: 10,
    maxTeachers: 5,
    maxStudents: 50,
    pricePerLicense: 29.90
  });

  // Fetch companies with their contracts
  const { data: companies = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/companies-with-contracts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/companies-with-contracts', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar empresas');
      }
      const data = await response.json();
      return data.companies || [];
    }
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (companyData: NewCompanyForm) => {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(companyData)
      });
      if (!response.ok) {
        throw new Error('Erro ao criar empresa');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa criada com sucesso!",
        description: "A nova empresa foi adicionada ao sistema.",
      });
      setIsCreateCompanyModalOpen(false);
      setNewCompany({ name: "", email: "", phone: "", address: "", contactPerson: "" });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar empresa",
        description: error.message || "Ocorreu um erro ao criar a empresa.",
        variant: "destructive",
      });
    }
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (contractData: NewContractForm & { companyId: number }) => {
      const response = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contractData)
      });
      if (!response.ok) {
        throw new Error('Erro ao criar contrato');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato criado com sucesso!",
        description: "O novo contrato foi adicionado à empresa.",
      });
      setIsCreateContractModalOpen(false);
      setNewContract({
        name: "",
        description: "",
        planType: "basic",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalLicenses: 10,
        maxTeachers: 5,
        maxStudents: 50,
        pricePerLicense: 29.90
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar contrato",
        description: error.message || "Ocorreu um erro ao criar o contrato.",
        variant: "destructive",
      });
    }
  });

  // Edit company mutation
  const editCompanyMutation = useMutation({
    mutationFn: async (companyData: { id: number } & NewCompanyForm) => {
      const response = await fetch(`/api/admin/companies/${companyData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(companyData)
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar empresa');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empresa atualizada com sucesso!",
        description: "Os dados da empresa foram atualizados.",
      });
      setIsEditCompanyModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar empresa",
        description: error.message || "Ocorreu um erro ao atualizar a empresa.",
        variant: "destructive",
      });
    }
  });

  // Edit contract mutation
  const editContractMutation = useMutation({
    mutationFn: async (contractData: { id: number } & NewContractForm) => {
      const response = await fetch(`/api/admin/contracts/${contractData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contractData)
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar contrato');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato atualizado com sucesso!",
        description: "Os dados do contrato foram atualizados.",
      });
      setIsEditContractModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message || "Ocorreu um erro ao atualizar o contrato.",
        variant: "destructive",
      });
    }
  });

  // Helper functions for opening modals
  const openViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsViewCompanyModalOpen(true);
  };

  const openEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditCompany({
      name: company.name,
      email: company.email,
      phone: company.phone || "",
      address: company.address || "",
      contactPerson: company.contactPerson || ""
    });
    setIsEditCompanyModalOpen(true);
  };

  const openViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setIsViewContractModalOpen(true);
  };

  const openEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setEditContract({
      name: contract.name,
      description: contract.description || "",
      planType: contract.planType,
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate.split('T')[0],
      totalLicenses: contract.totalLicenses,
      maxTeachers: contract.maxTeachers,
      maxStudents: contract.maxStudents,
      pricePerLicense: contract.pricePerLicense
    });
    setIsEditContractModalOpen(true);
  };

  const filteredCompanies = companies.filter((company: Company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleCreateCompany = () => {
    if (!newCompany.name || !newCompany.email) {
      toast({
        title: "Dados incompletos",
        description: "Nome e email da empresa são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createCompanyMutation.mutate(newCompany);
  };

  const handleCreateContract = () => {
    if (!selectedCompany || !newContract.name) {
      toast({
        title: "Dados incompletos",
        description: "Nome do contrato é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    createContractMutation.mutate({
      ...newContract,
      companyId: selectedCompany.id
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando empresas e contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin/master">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestão de Empresas e Contratos
              </h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {companies.length} {companies.length === 1 ? 'Empresa' : 'Empresas'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{user?.firstName || 'Admin'}</span>
              </span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <Input
                placeholder="Buscar por empresa, responsável ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex gap-3">
              <Dialog open={isCreateCompanyModalOpen} onOpenChange={setIsCreateCompanyModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Building2 className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
                    <DialogDescription>
                      Insira os dados da empresa contratante
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Nome da Empresa *</Label>
                      <Input
                        id="companyName"
                        value={newCompany.name}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Prefeitura Municipal de São Paulo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyEmail">Email Institucional *</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={newCompany.email}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@prefeitura.sp.gov.br"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">Responsável</Label>
                      <Input
                        id="contactPerson"
                        value={newCompany.contactPerson}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="Nome do responsável pelo contrato"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyPhone">Telefone</Label>
                      <Input
                        id="companyPhone"
                        value={newCompany.phone}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyAddress">Endereço</Label>
                      <Textarea
                        id="companyAddress"
                        value={newCompany.address}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Endereço completo da empresa"
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateCompanyModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateCompany} 
                      disabled={createCompanyMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createCompanyMutation.isPending ? "Criando..." : "Criar Empresa"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? "Tente alterar os termos de busca" : "Comece criando uma nova empresa"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateCompanyModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Empresa
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCompanies.map((company: Company) => (
              <Card key={company.id} className="bg-white shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">{company.name}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          {company.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {company.email}
                            </div>
                          )}
                          {company.contactPerson && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {company.contactPerson}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {company.contracts.length} {company.contracts.length === 1 ? 'Contrato' : 'Contratos'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openViewCompany(company)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Visualizar empresa"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openEditCompany(company)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Editar empresa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Company Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      {company.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {company.phone}
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-center text-sm text-gray-600 md:col-span-2">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {company.address}
                        </div>
                      )}
                    </div>

                    {/* Contracts */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Contratos Ativos</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCompany(company);
                            setIsCreateContractModalOpen(true);
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Novo Contrato
                        </Button>
                      </div>
                      
                      {company.contracts.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Nenhum contrato ativo</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCompany(company);
                              setIsCreateContractModalOpen(true);
                            }}
                            className="mt-2 text-blue-600 hover:text-blue-700"
                          >
                            Criar primeiro contrato
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {company.contracts.map((contract: Contract) => (
                            <div key={contract.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900">{contract.name}</h5>
                                  {getPlanBadge(contract.planType)}
                                  {getStatusBadge(contract.status)}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => openViewContract(contract)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    title="Visualizar contrato"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => openEditContract(contract)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Editar contrato"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Período:</span>
                                  <p className="font-medium">
                                    {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Licenças:</span>
                                  <p className="font-medium">{contract.availableLicenses}/{contract.totalLicenses}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Professores:</span>
                                  <p className="font-medium">Até {contract.maxTeachers}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Valor:</span>
                                  <p className="font-medium">R$ {contract.pricePerLicense.toFixed(2)}/licença</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Contract Modal */}
        <Dialog open={isCreateContractModalOpen} onOpenChange={setIsCreateContractModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Contrato</DialogTitle>
              <DialogDescription>
                Criar novo contrato para {selectedCompany?.name}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="contractName">Nome do Contrato *</Label>
                  <Input
                    id="contractName"
                    value={newContract.name}
                    onChange={(e) => setNewContract(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Contrato Educação 2024"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contractDescription">Descrição</Label>
                  <Textarea
                    id="contractDescription"
                    value={newContract.description}
                    onChange={(e) => setNewContract(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada do contrato"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planType">Tipo de Plano</Label>
                    <Select value={newContract.planType} onValueChange={(value: any) => setNewContract(prev => ({ ...prev, planType: value }))}>
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
                    <Label htmlFor="totalLicenses">Total de Licenças</Label>
                    <Input
                      id="totalLicenses"
                      type="number"
                      value={newContract.totalLicenses}
                      onChange={(e) => setNewContract(prev => ({ ...prev, totalLicenses: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxTeachers">Máx. Professores</Label>
                    <Input
                      id="maxTeachers"
                      type="number"
                      value={newContract.maxTeachers}
                      onChange={(e) => setNewContract(prev => ({ ...prev, maxTeachers: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxStudents">Máx. Alunos</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={newContract.maxStudents}
                      onChange={(e) => setNewContract(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 0 }))}
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newContract.startDate}
                      onChange={(e) => setNewContract(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newContract.endDate}
                      onChange={(e) => setNewContract(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pricePerLicense">Preço por Licença (R$)</Label>
                  <Input
                    id="pricePerLicense"
                    type="number"
                    step="0.01"
                    value={newContract.pricePerLicense}
                    onChange={(e) => setNewContract(prev => ({ ...prev, pricePerLicense: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateContractModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateContract} 
                disabled={createContractMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createContractMutation.isPending ? "Criando..." : "Criar Contrato"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Company Modal */}
        <Dialog open={isViewCompanyModalOpen} onOpenChange={setIsViewCompanyModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Empresa</DialogTitle>
              <DialogDescription>
                Informações completas da empresa
              </DialogDescription>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome da Empresa</Label>
                    <p className="text-gray-900 font-medium">{selectedCompany.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-gray-900">{selectedCompany.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                    <p className="text-gray-900">{selectedCompany.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                    <p className="text-gray-900">{selectedCompany.contactPerson || 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-gray-900">{selectedCompany.address || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Cadastro</Label>
                    <p className="text-gray-900">{new Date(selectedCompany.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total de Contratos</Label>
                    <p className="text-gray-900">{selectedCompany.contracts.length}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsViewCompanyModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewCompanyModalOpen(false);
                      openEditCompany(selectedCompany);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Company Modal */}
        <Dialog open={isEditCompanyModalOpen} onOpenChange={setIsEditCompanyModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
              <DialogDescription>
                Atualize os dados da empresa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editCompanyName">Nome da Empresa *</Label>
                <Input
                  id="editCompanyName"
                  value={editCompany.name}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Prefeitura Municipal de São Paulo"
                />
              </div>
              <div>
                <Label htmlFor="editCompanyEmail">Email Institucional *</Label>
                <Input
                  id="editCompanyEmail"
                  type="email"
                  value={editCompany.email}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contato@prefeitura.sp.gov.br"
                />
              </div>
              <div>
                <Label htmlFor="editContactPerson">Responsável</Label>
                <Input
                  id="editContactPerson"
                  value={editCompany.contactPerson}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <Label htmlFor="editCompanyPhone">Telefone</Label>
                <Input
                  id="editCompanyPhone"
                  value={editCompany.phone}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 9999-9999"
                />
              </div>
              <div>
                <Label htmlFor="editCompanyAddress">Endereço</Label>
                <Textarea
                  id="editCompanyAddress"
                  value={editCompany.address}
                  onChange={(e) => setEditCompany(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo da empresa"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditCompanyModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedCompany) {
                    editCompanyMutation.mutate({ id: selectedCompany.id, ...editCompany });
                  }
                }}
                disabled={editCompanyMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {editCompanyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Contract Modal */}
        <Dialog open={isViewContractModalOpen} onOpenChange={setIsViewContractModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
              <DialogDescription>
                Informações completas do contrato
              </DialogDescription>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Nome do Contrato</Label>
                    <p className="text-gray-900 font-medium">{selectedContract.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo de Plano</Label>
                    <div className="mt-1">{getPlanBadge(selectedContract.planType)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Período</Label>
                    <p className="text-gray-900">{new Date(selectedContract.startDate).toLocaleDateString('pt-BR')} - {new Date(selectedContract.endDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total de Licenças</Label>
                    <p className="text-gray-900">{selectedContract.totalLicenses}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Licenças Disponíveis</Label>
                    <p className="text-gray-900">{selectedContract.availableLicenses}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Máx. Professores</Label>
                    <p className="text-gray-900">{selectedContract.maxTeachers}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Máx. Estudantes</Label>
                    <p className="text-gray-900">{selectedContract.maxStudents}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Preço por Licença</Label>
                    <p className="text-gray-900">R$ {selectedContract.pricePerLicense.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tokens Professor/mês</Label>
                    <p className="text-gray-900">{selectedContract.monthlyTokenLimitTeacher.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tokens Estudante/mês</Label>
                    <p className="text-gray-900">{selectedContract.monthlyTokenLimitStudent.toLocaleString()}</p>
                  </div>
                  {selectedContract.description && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                      <p className="text-gray-900">{selectedContract.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsViewContractModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsViewContractModalOpen(false);
                      openEditContract(selectedContract);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Contract Modal */}
        <Dialog open={isEditContractModalOpen} onOpenChange={setIsEditContractModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Contrato</DialogTitle>
              <DialogDescription>
                Atualize os dados do contrato
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div>
                  <Label htmlFor="editContractName">Nome do Contrato *</Label>
                  <Input
                    id="editContractName"
                    value={editContract.name}
                    onChange={(e) => setEditContract(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Contrato Anual 2025"
                  />
                </div>
                <div>
                  <Label htmlFor="editContractDescription">Descrição</Label>
                  <Textarea
                    id="editContractDescription"
                    value={editContract.description}
                    onChange={(e) => setEditContract(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do contrato"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="editPlanType">Tipo de Plano *</Label>
                  <Select value={editContract.planType} onValueChange={(value: any) => setEditContract(prev => ({ ...prev, planType: value }))}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStartDate">Data de Início *</Label>
                    <Input
                      id="editStartDate"
                      type="date"
                      value={editContract.startDate}
                      onChange={(e) => setEditContract(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEndDate">Data de Término *</Label>
                    <Input
                      id="editEndDate"
                      type="date"
                      value={editContract.endDate}
                      onChange={(e) => setEditContract(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editTotalLicenses">Total de Licenças *</Label>
                    <Input
                      id="editTotalLicenses"
                      type="number"
                      min="1"
                      value={editContract.totalLicenses}
                      onChange={(e) => setEditContract(prev => ({ ...prev, totalLicenses: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editPricePerLicense">Preço por Licença (R$) *</Label>
                    <Input
                      id="editPricePerLicense"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editContract.pricePerLicense}
                      onChange={(e) => setEditContract(prev => ({ ...prev, pricePerLicense: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editMaxTeachers">Máximo de Professores *</Label>
                    <Input
                      id="editMaxTeachers"
                      type="number"
                      min="1"
                      value={editContract.maxTeachers}
                      onChange={(e) => setEditContract(prev => ({ ...prev, maxTeachers: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editMaxStudents">Máximo de Estudantes *</Label>
                    <Input
                      id="editMaxStudents"
                      type="number"
                      min="1"
                      value={editContract.maxStudents}
                      onChange={(e) => setEditContract(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditContractModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedContract) {
                    editContractMutation.mutate({ id: selectedContract.id, ...editContract });
                  }
                }}
                disabled={editContractMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {editContractMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
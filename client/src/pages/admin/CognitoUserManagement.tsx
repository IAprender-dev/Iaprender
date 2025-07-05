import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield, AlertCircle, CheckCircle, Clock, Settings, Check, Copy, ExternalLink, AlertTriangle, Info, Upload, FileSpreadsheet, Download } from 'lucide-react';
import IAprender_Logo from "@/assets/IAprender_1750262377399.png";

interface Company {
  id: number;
  name: string;
  cnpj: string;
}

interface Contract {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface CognitoGroup {
  name: string;
  description: string;
  exists: boolean;
}

interface UserCreationRequest {
  email: string;
  name: string;
  group: 'Admin' | 'Gestores' | 'Diretores' | 'Professores' | 'Alunos';
  companyId?: string;
  contractId?: string;
}

interface GroupStatus {
  exists: string[];
  missing: string[];
  total: number;
  complete: boolean;
}

export default function CognitoUserManagement() {
  const { toast } = useToast();
  
  // Estados para criação de usuário
  const [userForm, setUserForm] = useState<UserCreationRequest>({
    email: '',
    name: '',
    group: 'Gestores'
  });
  
  // Estados para dados do sistema
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [groupStatus, setGroupStatus] = useState<GroupStatus | null>(null);
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([]);
  
  // Estados de controle
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  
  // Estados para criação em lote
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Carregar contratos quando empresa é selecionada
  useEffect(() => {
    if (userForm.companyId && userForm.group === 'Gestores') {
      loadCompanyContracts(parseInt(userForm.companyId));
    }
  }, [userForm.companyId, userForm.group]);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      
      // Carregar empresas
      const companiesResponse = await fetch('/api/admin/companies', {
        credentials: 'include'
      });
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
      }

      // Carregar status dos grupos Cognito
      const groupsResponse = await fetch('/api/admin/cognito/groups/status', {
        credentials: 'include'
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroupStatus(groupsData.status);
      }

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do sistema",
        variant: "destructive"
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadCompanyContracts = async (companyId: number) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/contracts`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      setAvailableContracts([]);
    }
  };

  const handleFormChange = (field: keyof UserCreationRequest, value: string) => {
    setUserForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Resetar campos relacionados quando grupo muda
      if (field === 'group') {
        if (value !== 'Gestores') {
          delete updated.companyId;
          delete updated.contractId;
          setAvailableContracts([]);
        }
      }
      
      // Resetar contrato quando empresa muda
      if (field === 'companyId') {
        delete updated.contractId;
      }
      
      return updated;
    });
  };

  const validateForm = (): boolean => {
    if (!userForm.email || !userForm.name || !userForm.group) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      toast({
        title: "Erro de Validação",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return false;
    }

    // Validar domínio brasileiro para gestores municipais
    if (userForm.group === 'Gestores') {
      const allowedDomains = ['.gov.br', '.edu.br'];
      const hasValidDomain = allowedDomains.some(domain => userForm.email.includes(domain));
      
      if (!hasValidDomain) {
        toast({
          title: "Erro de Validação",
          description: "Gestores Municipais devem usar email institucional (.gov.br ou .edu.br)",
          variant: "destructive"
        });
        return false;
      }

      if (!userForm.companyId || !userForm.contractId) {
        toast({
          title: "Erro de Validação",
          description: "Gestores Municipais precisam ter empresa e contrato associados",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const createUser = async () => {
    if (!validateForm()) return;

    try {
      setIsCreatingUser(true);

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userForm)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Capturar informações do usuário criado
        setCreatedUser(data);
        
        toast({
          title: "Usuário Criado",
          description: `Usuário ${userForm.email} criado com sucesso no grupo ${userForm.group}`,
          variant: "default"
        });

        // Resetar formulário
        setUserForm({
          email: '',
          name: '',
          group: 'Gestores'
        });
        setAvailableContracts([]);

      } else {
        throw new Error(data.error || 'Erro desconhecido ao criar usuário');
      }

    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar usuário",
        variant: "destructive"
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const generateSampleTemplate = () => {
    const csvContent = `email,nome,nivelAcesso,empresa,contrato
admin@escola.gov.br,João Silva,Admin,,
gestor@secretaria.gov.br,Maria Santos,Gestores,Prefeitura Municipal,Contrato Educação 2025
diretor@escola.edu.br,Carlos Oliveira,Diretores,,`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_usuarios_cognito.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processBulkUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo CSV primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingBulk(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/users/bulk-create', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBulkResults(data);
        
        toast({
          title: "Upload Processado",
          description: `${data.success_count} usuários criados, ${data.error_count} falhas`,
          variant: "default"
        });

        setSelectedFile(null);
        
      } else {
        throw new Error(data.error || 'Erro no processamento em lote');
      }

    } catch (error: any) {
      console.error('Erro no upload em lote:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha no processamento em lote",
        variant: "destructive"
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const getGroupBadgeVariant = (groupName: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (groupName) {
      case 'Admin': return 'destructive';
      case 'Gestores': return 'default';
      case 'Diretores': return 'secondary';
      case 'Professores': return 'outline';
      case 'Alunos': return 'outline';
      default: return 'outline';
    }
  };

  const getGroupDescription = (group: string): string => {
    const descriptions = {
      'Admin': 'Acesso total à plataforma - pode criar todos os tipos de usuário',
      'Gestores': 'Gestores municipais de educação - podem criar diretores, professores e alunos',
      'Diretores': 'Diretores de escola - podem criar professores e alunos',
      'Professores': 'Professores - podem criar alunos',
      'Alunos': 'Estudantes - acesso básico à plataforma'
    };
    return descriptions[group as keyof typeof descriptions] || '';
  };

  if (isLoadingData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 animate-spin" />
          <span>Carregando dados do sistema...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-1">
              <img 
                src={IAprender_Logo} 
                alt="IAprender Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            IAprender
          </span>
        </div>
        <div className="h-6 w-px bg-gray-300"></div>
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Criar novo Usuário</h1>
          <p className="text-gray-600">Criar usuários com atribuição automática de grupos e roles</p>
        </div>
      </div>

      {/* Status dos Grupos */}
      {groupStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Status dos Grupos Cognito</span>
            </CardTitle>
            <CardDescription>
              Grupos necessários para o sistema de hierarquia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-700">Grupos Existentes ({groupStatus.exists.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {groupStatus.exists.map(group => (
                    <Badge key={group} variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {groupStatus.missing.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-amber-700">Grupos Faltando ({groupStatus.missing.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {groupStatus.missing.map(group => (
                      <Badge key={group} variant="outline" className="border-amber-300 text-amber-700">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {!groupStatus.complete && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Alguns grupos estão faltando. O sistema funcionará, mas recomenda-se criar todos os grupos para funcionalidade completa.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado da Criação */}
      {createdUser && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Check className="h-5 w-5" />
              <span>Usuário Criado com Sucesso!</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Credenciais geradas e URL de primeiro acesso criada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-sm font-medium text-green-800">Email:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    value={createdUser.userEmail || ''} 
                    readOnly 
                    className="bg-white"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdUser.userEmail || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-green-800">Senha Temporária:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    value={createdUser.tempPassword || ''} 
                    readOnly 
                    className="bg-white font-mono"
                    type="password"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdUser.tempPassword || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-green-800">ID do Usuário:</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input 
                    value={createdUser.userId || ''} 
                    readOnly 
                    className="bg-white font-mono"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdUser.userId || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {createdUser.firstAccessUrl && (
                <div>
                  <Label className="text-sm font-medium text-green-800">URL de Primeiro Acesso:</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input 
                      value={window.location.origin + createdUser.firstAccessUrl} 
                      readOnly 
                      className="bg-white font-mono text-xs"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(window.location.origin + createdUser.firstAccessUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => window.open(window.location.origin + createdUser.firstAccessUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>Importante:</strong> O usuário deve usar a URL de primeiro acesso para alterar a senha temporária e concluir o onboarding personalizado.
              </AlertDescription>
            </Alert>

            <Alert className="border-purple-200 bg-purple-50">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Sistema de Onboarding:</strong> A URL inclui tutorial personalizado para {createdUser.group} e redirecionamento automático para o dashboard apropriado.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => setCreatedUser(null)} 
              variant="outline" 
              className="w-full"
            >
              Criar Outro Usuário
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Criação de Usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Criar Novo Usuário</span>
          </CardTitle>
          <CardDescription>
            Adicionar usuário ao AWS Cognito com grupo e role apropriados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@dominio.com"
                value={userForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Nome do usuário"
                value={userForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </div>
          </div>

          {/* Seleção de Nível de Acesso */}
          <div className="space-y-2">
            <Label htmlFor="group">Nível de Acesso *</Label>
            <Select value={userForm.group} onValueChange={(value) => handleFormChange('group', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de acesso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getGroupBadgeVariant('Admin')}>Admin</Badge>
                    <span>Administrador da Plataforma</span>
                  </div>
                </SelectItem>
                <SelectItem value="Gestores">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getGroupBadgeVariant('Gestores')}>Gestores</Badge>
                    <span>Gestor Municipal</span>
                  </div>
                </SelectItem>
                <SelectItem value="Diretores">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getGroupBadgeVariant('Diretores')}>Diretores</Badge>
                    <span>Diretor de Escola</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {userForm.group && (
              <p className="text-sm text-gray-600">
                {getGroupDescription(userForm.group)}
              </p>
            )}
          </div>

          {/* Campos Específicos para Gestores Municipais */}
          {userForm.group === 'Gestores' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuração para Gestor Municipal</h3>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Gestores Municipais devem usar email institucional (.gov.br ou .edu.br) e ter contrato associado
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa/Secretaria *</Label>
                    <Select value={userForm.companyId || ''} onValueChange={(value) => handleFormChange('companyId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name} ({company.cnpj})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract">Contrato *</Label>
                    <Select 
                      value={userForm.contractId || ''} 
                      onValueChange={(value) => handleFormChange('contractId', value)}
                      disabled={!userForm.companyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContracts.map(contract => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            {contract.name} ({contract.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Botão de Criação */}
          <div className="flex justify-end">
            <Button 
              onClick={createUser} 
              disabled={isCreatingUser}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isCreatingUser ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Criando Usuário...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Usuário
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Criação em Lote via Planilha */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-700">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Criação em Lote via Planilha</span>
          </CardTitle>
          <CardDescription>
            Crie múltiplos usuários AWS Cognito usando arquivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instruções e Template */}
          <div className="bg-purple-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-purple-800">Como usar:</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>Baixe o template CSV clicando no botão abaixo</li>
              <li>Preencha o arquivo com os dados dos usuários</li>
              <li>Faça upload do arquivo preenchido</li>
              <li>Aguarde o processamento automático</li>
            </ol>
            
            <div className="flex items-center space-x-2 mt-3">
              <Button 
                onClick={generateSampleTemplate}
                variant="outline" 
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Template CSV
              </Button>
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                Formato: email, nome, nivelAcesso, empresa, contrato
              </Badge>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-700 font-medium">
                  {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo CSV'}
                </p>
                <p className="text-sm text-purple-600 mt-2">
                  Apenas arquivos .csv são aceitos
                </p>
              </label>
            </div>

            {selectedFile && (
              <Alert className="border-purple-200 bg-purple-50">
                <Info className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-700">
                  <strong>Arquivo selecionado:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botão de Processamento */}
          <div className="flex justify-end">
            <Button 
              onClick={processBulkUpload}
              disabled={!selectedFile || isProcessingBulk}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessingBulk ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Processar Planilha
                </>
              )}
            </Button>
          </div>

          {/* Resultados do Processamento */}
          {bulkResults && (
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium text-purple-800">Resultados do Processamento:</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{bulkResults.success_count}</p>
                  <p className="text-sm text-green-700">Criados</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{bulkResults.error_count}</p>
                  <p className="text-sm text-red-700">Falhas</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{bulkResults.total_processed}</p>
                  <p className="text-sm text-blue-700">Total</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {bulkResults.success_count > 0 ? Math.round((bulkResults.success_count / bulkResults.total_processed) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-700">Sucesso</p>
                </div>
              </div>

              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Erros encontrados:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {bulkResults.errors.map((error: any, index: number) => (
                      <p key={index} className="text-sm text-red-700">
                        Linha {error.line}: {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => setBulkResults(null)} 
                variant="outline" 
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                Processar Nova Planilha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configurações Avançadas</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? 'Ocultar' : 'Mostrar'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showAdvanced && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Total de Empresas</Label>
                <p className="text-2xl font-bold text-blue-600">{companies.length}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Grupos Configurados</Label>
                <p className="text-2xl font-bold text-green-600">
                  {groupStatus ? `${groupStatus.exists.length}/${groupStatus.total}` : '0/5'}
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este sistema integra diretamente com AWS Cognito. Usuários criados aqui terão acesso automático à plataforma com as permissões apropriadas.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
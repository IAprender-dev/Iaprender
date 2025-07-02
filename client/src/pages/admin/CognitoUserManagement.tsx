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
import { Users, UserPlus, Shield, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';

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
    group: 'Alunos'
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
        toast({
          title: "Usuário Criado",
          description: `Usuário ${userForm.email} criado com sucesso no grupo ${userForm.group}`,
          variant: "default"
        });

        // Resetar formulário
        setUserForm({
          email: '',
          name: '',
          group: 'Alunos'
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
      <div className="flex items-center space-x-3">
        <Users className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários AWS Cognito</h1>
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

          {/* Seleção de Grupo */}
          <div className="space-y-2">
            <Label htmlFor="group">Grupo / Role *</Label>
            <Select value={userForm.group} onValueChange={(value) => handleFormChange('group', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo" />
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
                <SelectItem value="Professores">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getGroupBadgeVariant('Professores')}>Professores</Badge>
                    <span>Professor</span>
                  </div>
                </SelectItem>
                <SelectItem value="Alunos">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getGroupBadgeVariant('Alunos')}>Alunos</Badge>
                    <span>Estudante</span>
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
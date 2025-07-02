import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Check, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Schema de validação para criação de usuário
const createUserSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  group: z.enum(['Admin', 'GestorMunicipal'], {
    required_error: 'Selecione um grupo'
  }),
  municipio: z.string().optional(),
  escola: z.string().optional(),
  companyId: z.string().optional(),
  contractId: z.string().optional()
}).refine((data) => {
  // Se for Gestor Municipal, empresa é obrigatória
  if (data.group === 'GestorMunicipal') {
    return data.companyId;
  }
  return true;
}, {
  message: 'Empresa é obrigatória para Gestores Municipais',
  path: ['companyId']
});

type CreateUserForm = z.infer<typeof createUserSchema>;

interface CreateUserResponse {
  success: boolean;
  message?: string;
  userId?: string;
  tempPassword?: string;
  userEmail?: string;
  group?: string;
  error?: string;
}

interface Company {
  id: number;
  name: string;
}

interface Contract {
  id: number;
  name: string;
  status: string;
}

interface CompaniesResponse {
  companies: Company[];
}

interface ContractsResponse {
  contracts: Contract[];
}

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      municipio: '',
      escola: ''
    }
  });

  // Query para listar grupos disponíveis
  const { data: groupsData } = useQuery({
    queryKey: ['/api/admin/cognito/groups'],
    enabled: true
  });

  // Query para listar empresas
  const { data: companiesData } = useQuery<CompaniesResponse>({
    queryKey: ['/api/admin/companies'],
    enabled: true
  });

  // Query para listar contratos da empresa selecionada
  const { data: contractsData } = useQuery<ContractsResponse>({
    queryKey: ['/api/admin/companies', selectedCompany, 'contracts'],
    enabled: !!selectedCompany
  });

  // Mutation para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm): Promise<CreateUserResponse> => {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }
      
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Usuário criado com sucesso!",
        description: `${data.userEmail} foi adicionado ao grupo ${data.group}`,
      });
      
      setCreatedUser(data);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro ao criar usuário",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para validar domínio de email
  const validateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/admin/validate-email-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      return response.json();
    }
  });

  const onSubmit = (data: CreateUserForm) => {
    console.log('🔄 Criando usuário:', data);
    createUserMutation.mutate(data);
  };

  const handleEmailChange = (email: string) => {
    if (email && email.includes('@')) {
      validateEmailMutation.mutate(email);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copiado!",
      description: "Texto copiado para a área de transferência"
    });
  };

  const groupLabels = {
    'Admin': 'Administrador Geral',
    'GestorMunicipal': 'Gestor Municipal'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600">Criar e gerenciar usuários no sistema AWS Cognito</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Criação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Criar Novo Usuário</span>
              </CardTitle>
              <CardDescription>
                Adicione um novo usuário ao sistema com acesso baseado em grupos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Institucional</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="usuario@prefeitura.cidade.gov.br"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              handleEmailChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        
                        {/* Validação de domínio */}
                        {validateEmailMutation.data && (
                          <Alert className={validateEmailMutation.data.isAuthorized ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                            <AlertTriangle className={`h-4 w-4 ${validateEmailMutation.data.isAuthorized ? "text-green-600" : "text-red-600"}`} />
                            <AlertDescription className={validateEmailMutation.data.isAuthorized ? "text-green-700" : "text-red-700"}>
                              {validateEmailMutation.data.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="João Silva Santos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Grupo */}
                  <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Acesso</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedGroup(value);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o grupo de usuário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(groupLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campos específicos para Gestor Municipal */}
                  {selectedGroup === 'GestorMunicipal' && (
                    <>
                      {/* Empresa Contratante */}
                      <FormField
                        control={form.control}
                        name="companyId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa Contratante *</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCompany(value);
                            }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a empresa contratante" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {companiesData?.companies ? 
                                  companiesData.companies.map((company: any) => (
                                    <SelectItem key={company.id} value={company.id.toString()}>
                                      <div className="flex flex-col py-1">
                                        <span className="font-semibold text-gray-900">{company.name}</span>
                                        <span className="text-sm text-blue-600">{company.description}</span>
                                        <span className="text-xs text-gray-500 mt-1">
                                          📧 {company.email} • 📞 {company.phone || 'N/A'}
                                        </span>
                                        <span className="text-xs text-green-600 mt-1">
                                          👥 {company.contactInfo} • 📍 {company.address || 'N/A'}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  )) : 
                                  <SelectItem value="loading" disabled>Carregando empresas com contratos ativos...</SelectItem>
                                }
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />



                      {/* Card simples com informações da empresa selecionada */}
                      {selectedCompany && companiesData?.companies && (
                        (() => {
                          const selectedCompanyData = companiesData.companies.find((c: any) => c.id.toString() === selectedCompany);
                          return selectedCompanyData && (
                            <Card className="border-blue-200 bg-blue-50">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-blue-800 font-semibold text-lg">{selectedCompanyData.name}</h4>
                                  </div>
                                  
                                  <div className="text-sm text-blue-700 space-y-1">
                                    <div><strong>Email:</strong> {selectedCompanyData.email || 'N/A'}</div>
                                    <div><strong>Contato:</strong> {selectedCompanyData.contactPerson || 'N/A'}</div>
                                    <div><strong>Telefone:</strong> {selectedCompanyData.phone || 'N/A'}</div>
                                    <div><strong>Contratos Ativos:</strong> {selectedCompanyData.activeContractsCount || 0}</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })()
                      )}
                    </>
                  )}

                  {/* Município (opcional) */}
                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Município (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Escola (opcional) */}
                  <FormField
                    control={form.control}
                    name="escola"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escola (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Escola Municipal João Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createUserMutation.isPending}
                  >
                    {createUserMutation.isPending ? 'Criando usuário...' : 'Criar Usuário'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Resultado da Criação */}
          {createdUser && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Check className="h-5 w-5" />
                  <span>Usuário Criado com Sucesso!</span>
                </CardTitle>
                <CardDescription className="text-green-700">
                  Credenciais geradas para o novo usuário
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
                        onClick={() => copyToClipboard(createdUser.userEmail || '')}
                      >
                        📋
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-green-800">Grupo:</Label>
                    <Input 
                      value={groupLabels[createdUser.group as keyof typeof groupLabels] || createdUser.group || ''} 
                      readOnly 
                      className="bg-white mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-green-800">Senha Temporária:</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        value={createdUser.tempPassword || ''} 
                        readOnly 
                        className="bg-white font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(createdUser.tempPassword || '')}
                      >
                        📋
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <strong>Importante:</strong> O usuário deve alterar a senha no primeiro login. 
                    Envie essas credenciais de forma segura para o usuário.
                  </AlertDescription>
                </Alert>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setCreatedUser(null)}
                >
                  Criar Outro Usuário
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Grupos Disponíveis:</h4>
                <ul className="space-y-1 text-gray-600">
                  {Object.entries(groupLabels).map(([key, label]) => (
                    <li key={key}>• <strong>{key}:</strong> {label}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Domínios Autorizados:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• @prefeitura.[cidade].gov.br</li>
                  <li>• @educacao.[cidade].gov.br</li>
                  <li>• @escola.[cidade].edu.br</li>
                  <li>• @estudante.[cidade].edu.br</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
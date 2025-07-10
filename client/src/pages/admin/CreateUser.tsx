import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  UserPlus, 
  ArrowLeft, 
  Shield, 
  Users, 
  Building, 
  Mail,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import iaprenderLogo from "@assets/iaprender-logo.png";
import { apiRequest } from "@/lib/queryClient";

// Schema de validação para criação de usuário
const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email deve ter um formato válido")
    .refine((email) => email.endsWith('.com.br') || email.endsWith('.com') || email.endsWith('.org'), {
      message: "Email deve ter uma extensão válida (.com.br, .com, .org)"
    }),
  firstName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  lastName: z
    .string()
    .min(2, "Sobrenome deve ter pelo menos 2 caracteres")
    .max(50, "Sobrenome deve ter no máximo 50 caracteres")
    .regex(/^[A-Za-zÀ-ÿ\s]+$/, "Sobrenome deve conter apenas letras e espaços"),
  userGroup: z
    .string()
    .min(1, "Tipo de usuário é obrigatório")
    .refine((group) => ['Admin', 'Gestores', 'Diretores'].includes(group), {
      message: "Tipo de usuário deve ser Admin, Gestores ou Diretores"
    }),
  tempPassword: z
    .string()
    .min(8, "Senha temporária deve ter pelo menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
      message: "Senha deve conter pelo menos: 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial"
    })
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const userGroupOptions = [
  { value: 'Admin', label: 'Administrador', description: 'Acesso total ao sistema', icon: Shield, color: 'red' },
  { value: 'Gestores', label: 'Gestor Municipal', description: 'Gestão de escolas municipais', icon: Building, color: 'blue' },
  { value: 'Diretores', label: 'Diretor de Escola', description: 'Administração escolar', icon: Users, color: 'green' }
];

export default function CreateUser() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      userGroup: "",
      tempPassword: ""
    }
  });

  // Mutation para criar usuário no AWS Cognito
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      console.log('🚀 [CREATE USER] Enviando dados:', data);
      
      const response = await apiRequest('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          group: data.userGroup,
          temporaryPassword: data.tempPassword
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar usuário');
      }

      const result = await response.json();
      console.log('✅ [CREATE USER] Usuário criado:', result);
      return result;
    },
    onSuccess: (result) => {
      setCreatedUser(result.user);
      form.reset();
      
      toast({
        title: "Usuário criado com sucesso!",
        description: `${result.user.firstName} ${result.user.lastName} foi criado no AWS Cognito`,
        duration: 5000,
      });

      // Invalidar cache de usuários
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/list'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/statistics'] });
    },
    onError: (error: Error) => {
      console.error('❌ [CREATE USER] Erro:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
        duration: 7000,
      });
    }
  });

  const onSubmit = (data: CreateUserFormData) => {
    console.log('📝 [FORM] Dados do formulário:', data);
    createUserMutation.mutate(data);
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special = "@$!%*?&";
    
    let password = "";
    
    // Garantir pelo menos um de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Preencher o resto
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Embaralhar
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    form.setValue('tempPassword', password);
  };

  const goBack = () => {
    setLocation('/admin/user-management');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center p-1">
                    <img 
                      src={iaprenderLogo} 
                      alt="IAprender Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  IAprender
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Criar Novo Usuário
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Logado como: <span className="font-medium">{user?.firstName || 'Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usuário criado com sucesso */}
        {createdUser && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-medium">Usuário criado com sucesso!</div>
              <div className="mt-1">
                <strong>{createdUser.firstName} {createdUser.lastName}</strong> ({createdUser.email}) 
                foi criado no AWS Cognito no grupo <strong>{createdUser.groups[0]}</strong>.
                <br />
                <span className="text-sm">O usuário receberá um email com instruções de primeiro acesso.</span>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                  Informações do Usuário
                </CardTitle>
                <CardDescription>
                  Preencha os dados para criar um novo usuário no AWS Cognito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="usuario@exemplo.com.br" 
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Nome e Sobrenome */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome *</FormLabel>
                            <FormControl>
                              <Input placeholder="João" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sobrenome *</FormLabel>
                            <FormControl>
                              <Input placeholder="Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tipo de Usuário */}
                    <FormField
                      control={form.control}
                      name="userGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Usuário *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de usuário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {userGroupOptions.map((option) => {
                                const IconComponent = option.icon;
                                return (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center space-x-2">
                                      <IconComponent className={`h-4 w-4 text-${option.color}-600`} />
                                      <div>
                                        <div className="font-medium">{option.label}</div>
                                        <div className="text-xs text-gray-500">{option.description}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Senha Temporária */}
                    <FormField
                      control={form.control}
                      name="tempPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Temporária *</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <div className="relative flex-1">
                                <Input 
                                  placeholder="Senha temporária" 
                                  type={showPassword ? "text" : "password"}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={generatePassword}
                            >
                              Gerar
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            Deve conter pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Botões */}
                    <div className="flex space-x-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={createUserMutation.isPending}
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Criar Usuário
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => form.reset()}
                        disabled={createUserMutation.isPending}
                      >
                        Limpar
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Informações laterais */}
          <div className="space-y-6">
            {/* Tipos de usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tipos de Usuário</CardTitle>
                <CardDescription>
                  Permissões por nível de acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userGroupOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.value} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <IconComponent className={`h-5 w-5 text-${option.color}-600 mt-0.5`} />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instruções Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <p className="text-gray-600">
                    O usuário receberá um email com instruções para o primeiro acesso
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-gray-600">
                    A senha temporária deve ser alterada no primeiro login
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-gray-600">
                    O tipo de usuário define as permissões no sistema
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
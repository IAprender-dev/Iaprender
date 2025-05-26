import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles, BookOpen, Users, Brain } from "lucide-react";
import { Link } from "wouter";
import iaverseLogo from "@/assets/IAverse.png";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

const registerSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["teacher", "student"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Verificar parâmetros URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "true") {
      setActiveTab("register");
    }
  }, []);

  // Se já estiver autenticado, redirecionar para a página inicial
  useEffect(() => {
    if (user) {
      if (user.role === "teacher") {
        navigate("/professor/dashboard");
      } else if (user.role === "student") {
        navigate("/aluno/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "teacher",
    },
  });

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <Link href="/">
              <Button variant="ghost" className="mb-4 text-gray-600 hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao site
              </Button>
            </Link>
            
            <div className="flex items-center justify-center space-x-3">
              <img src={iaverseLogo} alt="IAverse" className="w-12 h-12" />
              <span className="text-2xl font-bold text-gray-900">IAverse</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === "login" ? "Bem-vindo de volta!" : "Comece sua jornada"}
              </h1>
              <p className="text-gray-600">
                {activeTab === "login" 
                  ? "Entre na sua conta para acessar suas ferramentas de IA" 
                  : "Crie sua conta e transforme sua forma de ensinar"}
              </p>
            </div>
          </div>

          {/* Form */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl">Acesse sua conta</CardTitle>
                  <CardDescription>
                    Entre com seu email e senha para continuar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="rounded-xl"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Sua senha"
                        className="rounded-xl"
                        {...loginForm.register("password")}
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 rounded-xl py-3"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-6">
              <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-xl">Criar nova conta</CardTitle>
                  <CardDescription>
                    Preencha os dados abaixo para começar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                          id="firstName"
                          placeholder="Seu nome"
                          className="rounded-xl"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                          id="lastName"
                          placeholder="Seu sobrenome"
                          className="rounded-xl"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="rounded-xl"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="rounded-xl"
                        {...registerForm.register("password")}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Eu sou</Label>
                      <select
                        id="role"
                        className="w-full px-3 py-2 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                        {...registerForm.register("role")}
                      >
                        <option value="teacher">Professor(a)</option>
                        <option value="student">Estudante</option>
                      </select>
                      {registerForm.formState.errors.role && (
                        <p className="text-sm text-red-600">{registerForm.formState.errors.role.message}</p>
                      )}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 rounded-xl py-3"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Hero Content */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 text-white p-12 items-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6" />
              <span className="text-lg font-medium">IAverse</span>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Transforme a Educação com Inteligência Artificial
            </h2>
            <p className="text-xl text-white/90">
              Conecte-se com milhares de educadores que já estão revolucionando 
              o ensino com ferramentas de IA de última geração.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Ferramentas Inteligentes</h3>
                <p className="text-white/80">Crie atividades e materiais personalizados</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Recursos Educacionais</h3>
                <p className="text-white/80">Biblioteca rica em conteúdo didático</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Comunidade Ativa</h3>
                <p className="text-white/80">Conecte-se com outros educadores</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8">
            <div className="text-sm text-white/70">
              Mais de 50.000 educadores confiam na IAverse
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
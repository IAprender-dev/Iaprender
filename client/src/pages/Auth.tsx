import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles, BookOpen, Users, Brain } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import aiverseLogo from "@assets/Design sem nome (5)_1749599545530.png";

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
  schoolYear: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [location, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "true") {
      setActiveTab("register");
    }
  }, []);

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
      schoolYear: "",
    },
  });

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Login - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="flex justify-between items-center p-6">
            <Link href="/">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao site
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex min-h-screen">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 items-center justify-center p-12">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative text-center text-white space-y-8">
              <div className="flex items-center justify-center mb-8">
                <img src={aiverseLogo} alt="AIverse" className="w-24 h-24 drop-shadow-lg" />
              </div>
              <h1 className="text-5xl font-bold">AIverse</h1>
              <p className="text-xl text-blue-100 max-w-md">
                Seu universo de inteligência artificial para educação de classe mundial
              </p>
              <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">25+ Modelos de IA</div>
                    <div className="text-sm text-blue-100">GPT, Claude, Gemini e mais</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Para Professores e Alunos</div>
                    <div className="text-sm text-blue-100">Dashboards especializados</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Inovação Educacional</div>
                    <div className="text-sm text-blue-100">Transforme sua metodologia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md space-y-8">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <img src={aiverseLogo} alt="AIverse" className="w-16 h-16" />
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">AIverse</span>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {activeTab === "login" ? "Bem-vindo de volta!" : "Comece sua jornada"}
                </h1>
                <p className="text-gray-600">
                  {activeTab === "login" 
                    ? "Entre na sua conta para acessar o universo de IA" 
                    : "Crie sua conta e transforme sua forma de ensinar"}
                </p>
              </div>

              {/* Form */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl h-12">
                  <TabsTrigger value="login" className="rounded-lg">Entrar</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-lg">Criar Conta</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-6 mt-6">
                  <Card className="border border-gray-200 shadow-lg rounded-2xl">
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
                            className="rounded-xl h-12"
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
                            className="rounded-xl h-12"
                            {...loginForm.register("password")}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 text-white"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Entrando..." : "Entrar"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-6 mt-6">
                  <Card className="border border-gray-200 shadow-lg rounded-2xl">
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
                              className="rounded-xl h-12"
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
                              className="rounded-xl h-12"
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
                            className="rounded-xl h-12"
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
                            className="rounded-xl h-12"
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
                            className="w-full px-3 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-12"
                            {...registerForm.register("role")}
                          >
                            <option value="teacher">Professor(a)</option>
                            <option value="student">Estudante</option>
                          </select>
                          {registerForm.formState.errors.role && (
                            <p className="text-sm text-red-600">{registerForm.formState.errors.role.message}</p>
                          )}
                        </div>
                        
                        {registerForm.watch("role") === "student" && (
                          <div className="space-y-2">
                            <Label htmlFor="schoolYear">Ano Escolar</Label>
                            <select
                              id="schoolYear"
                              className="w-full px-3 py-3 border border-input bg-background rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-12"
                              {...registerForm.register("schoolYear")}
                            >
                              <option value="">Selecione seu ano escolar</option>
                              <option value="6º ano">6º ano</option>
                              <option value="7º ano">7º ano</option>
                              <option value="8º ano">8º ano</option>
                              <option value="9º ano">9º ano</option>
                              <option value="1º ano">1º ano (Ensino Médio)</option>
                              <option value="2º ano">2º ano (Ensino Médio)</option>
                              <option value="3º ano">3º ano (Ensino Médio)</option>
                            </select>
                            {registerForm.formState.errors.schoolYear && (
                              <p className="text-sm text-red-600">{registerForm.formState.errors.schoolYear.message}</p>
                            )}
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 text-white"
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
        </div>
      </div>
    </>
  );
}
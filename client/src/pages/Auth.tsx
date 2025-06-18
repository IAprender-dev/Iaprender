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
import { ArrowLeft, Sparkles, BookOpen, Users, Brain, ChevronDown, User, GraduationCap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import iaprenderLogo from "@assets/iaprender-logo.png";

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
        <title>Login - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-tr from-purple-200/30 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200/20 to-blue-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="flex justify-between items-center p-6">
            <Link href="/">
              <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-white/80 backdrop-blur-sm transition-all duration-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao site
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex min-h-screen relative z-10">
          {/* Left Side - Enhanced Branding */}
          <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 items-center justify-center p-12 overflow-hidden">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-purple-900/20"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            <div className="relative text-center text-white space-y-10 max-w-lg">
              <div className="space-y-6">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl w-32 h-32"></div>
                  <img src={iaprenderLogo} alt="IAprender" className="relative w-28 h-28 drop-shadow-2xl" />
                </div>
                <div className="space-y-4">
                  <h1 className="text-6xl font-black tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    IAprender
                  </h1>
                  <p className="text-xl text-blue-100/90 font-medium leading-relaxed">
                    Plataforma educacional alimentada por inteligência artificial avançada
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 text-left">
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">IA Avançada</div>
                    <div className="text-sm text-blue-100/80">Múltiplos modelos integrados</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Multi-usuário</div>
                    <div className="text-sm text-blue-100/80">Professores e estudantes</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">BNCC Alinhado</div>
                    <div className="text-sm text-blue-100/80">Conforme diretrizes nacionais</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 pt-6 border-t border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-100/70">Sistema ativo e seguro</span>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Form */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 relative">
            <div className="w-full max-w-lg space-y-8">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-200/50 rounded-full blur-lg w-20 h-20"></div>
                    <img src={iaprenderLogo} alt="IAprender" className="relative w-16 h-16" />
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">IAprender</span>
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                  {activeTab === "login" ? "Bem-vindo de volta!" : "Inicie sua jornada"}
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  {activeTab === "login" 
                    ? "Acesse sua conta e explore o universo da IA educacional" 
                    : "Crie sua conta e revolucione sua metodologia de ensino"}
                </p>
              </div>

              {/* Enhanced Form */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl h-14 bg-slate-100/80 backdrop-blur-sm p-1">
                  <TabsTrigger 
                    value="login" 
                    className="rounded-xl font-semibold text-base data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-300"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="rounded-xl font-semibold text-base data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all duration-300"
                  >
                    Criar Conta
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-6 mt-8">
                  <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-3 pb-6 pt-8 px-8">
                      <CardTitle className="text-2xl font-bold text-slate-900">Acesse sua conta</CardTitle>
                      <CardDescription className="text-slate-600 font-medium">
                        Entre com suas credenciais para continuar sua jornada educacional
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-8">
                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Digite seu email"
                            className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                            {...loginForm.register("email")}
                          />
                          {loginForm.formState.errors.email && (
                            <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                              <span>{loginForm.formState.errors.email.message}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Senha</Label>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-600 hover:text-blue-700 font-medium"
                              type="button"
                            >
                              Esqueceu a senha?
                            </Button>
                          </div>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Digite sua senha"
                            className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                            {...loginForm.register("password")}
                          />
                          {loginForm.formState.errors.password && (
                            <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                              <span>{loginForm.formState.errors.password.message}</span>
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-2xl h-14 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Entrando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>Entrar na plataforma</span>
                              <Sparkles className="w-5 h-5" />
                            </div>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-6 mt-8">
                  <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl">
                    <CardHeader className="space-y-3 pb-6 pt-8 px-8">
                      <CardTitle className="text-2xl font-bold text-slate-900">Criar nova conta</CardTitle>
                      <CardDescription className="text-slate-600 font-medium">
                        Preencha os dados abaixo para começar sua jornada educacional
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-8">
                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <Label htmlFor="firstName" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Nome</Label>
                            <Input
                              id="firstName"
                              placeholder="Digite seu nome"
                              className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                              {...registerForm.register("firstName")}
                            />
                            {registerForm.formState.errors.firstName && (
                              <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                                <span>{registerForm.formState.errors.firstName.message}</span>
                              </p>
                            )}
                          </div>
                          <div className="space-y-3">
                            <Label htmlFor="lastName" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Sobrenome</Label>
                            <Input
                              id="lastName"
                              placeholder="Digite seu sobrenome"
                              className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                              {...registerForm.register("lastName")}
                            />
                            {registerForm.formState.errors.lastName && (
                              <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                                <span>{registerForm.formState.errors.lastName.message}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Digite seu email"
                            className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                            {...registerForm.register("email")}
                          />
                          {registerForm.formState.errors.email && (
                            <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                              <span>{registerForm.formState.errors.email.message}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="password" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Senha</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                            {...registerForm.register("password")}
                          />
                          {registerForm.formState.errors.password && (
                            <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                              <span>{registerForm.formState.errors.password.message}</span>
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Label htmlFor="role" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Eu sou</Label>
                          <Select 
                            value={registerForm.watch("role")} 
                            onValueChange={(value: "teacher" | "student") => {
                              registerForm.setValue("role", value);
                              registerForm.trigger("role");
                            }}
                          >
                            <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <SelectValue placeholder="Selecione seu perfil" className="text-slate-600" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                              <SelectItem value="teacher" className="py-4 px-4 hover:bg-emerald-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">Professor(a)</p>
                                    <p className="text-xs text-slate-600">Criar conteúdo e gerenciar turmas</p>
                                  </div>
                                </div>
                              </SelectItem>
                              <SelectItem value="student" className="py-4 px-4 hover:bg-purple-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">Estudante</p>
                                    <p className="text-xs text-slate-600">Aprender e acompanhar progresso</p>
                                  </div>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {registerForm.formState.errors.role && (
                            <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                              <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                              <span>{registerForm.formState.errors.role.message}</span>
                            </p>
                          )}
                        </div>
                        
                        {registerForm.watch("role") === "student" && (
                          <div className="space-y-3">
                            <Label htmlFor="schoolYear" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Ano Escolar</Label>
                            <Select 
                              value={registerForm.watch("schoolYear") || ""} 
                              onValueChange={(value: string) => {
                                registerForm.setValue("schoolYear", value);
                                registerForm.trigger("schoolYear");
                              }}
                            >
                              <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                                <div className="flex items-center space-x-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-4 h-4 text-white" />
                                  </div>
                                  <SelectValue placeholder="Selecione seu ano escolar" className="text-slate-600" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl max-h-80">
                                <div className="p-2">
                                  <div className="mb-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental I</p>
                                  </div>
                                  <SelectItem value="1º ano" className="py-3 px-3 hover:bg-pink-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        🎨
                                      </div>
                                      <span className="font-medium text-slate-800">1º ano - Mundo das Cores</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="2º ano" className="py-3 px-3 hover:bg-green-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        📚
                                      </div>
                                      <span className="font-medium text-slate-800">2º ano - Aventura das Letras</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="3º ano" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        🔢
                                      </div>
                                      <span className="font-medium text-slate-800">3º ano - Universo dos Números</span>
                                    </div>
                                  </SelectItem>
                                  
                                  <div className="my-3 border-t border-slate-200"></div>
                                  <div className="mb-3">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental II</p>
                                  </div>
                                  <SelectItem value="6º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">6</div>
                                      <span className="font-medium text-slate-800">6º ano</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="7º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">7</div>
                                      <span className="font-medium text-slate-800">7º ano</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="8º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">8</div>
                                      <span className="font-medium text-slate-800">8º ano</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="9º ano" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">9</div>
                                      <span className="font-medium text-slate-800">9º ano</span>
                                    </div>
                                  </SelectItem>
                                  
                                  <div className="mb-3 mt-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Médio</p>
                                  </div>
                                  <SelectItem value="1º ano" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</div>
                                      <span className="font-medium text-slate-800">1º ano (Ensino Médio)</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="2º ano" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</div>
                                      <span className="font-medium text-slate-800">2º ano (Ensino Médio)</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="3º ano" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-7 h-7 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">3</div>
                                      <span className="font-medium text-slate-800">3º ano (Ensino Médio)</span>
                                    </div>
                                  </SelectItem>
                                </div>
                              </SelectContent>
                            </Select>
                            {registerForm.formState.errors.schoolYear && (
                              <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                                <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                                <span>{registerForm.formState.errors.schoolYear.message}</span>
                              </p>
                            )}
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-2xl h-14 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Criando conta...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>Criar conta gratuita</span>
                              <Users className="w-5 h-5" />
                            </div>
                          )}
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
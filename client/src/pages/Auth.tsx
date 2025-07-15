import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Users, Brain, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import iaprenderLogo from "@assets/IAprender_1750262542315.png";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Auth() {
  const [location, navigate] = useLocation();
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Processar token OAuth do Cognito se presente
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const success = params.get("success");
    const error = params.get("error");
    
    if (token && success === "true") {
      // Salvar token no localStorage
      localStorage.setItem("authToken", token);
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Mostrar toast de sucesso
      toast({
        title: "Login realizado com sucesso!",
        description: "Você foi autenticado via AWS Cognito.",
        variant: "default",
      });
      
      // Recarregar página para que o AuthContext reconheça o novo token
      window.location.reload();
    } else if (error) {
      toast({
        title: "Erro na autenticação",
        description: "Falha ao autenticar via AWS Cognito. Tente novamente.",
        variant: "destructive",
      });
      
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Só redireciona se o usuário acabou de fazer login (via query param)
    const justLoggedIn = params.get("login") === "success";
    
    if (user && justLoggedIn) {
      if (user.role === "admin") {
        navigate("/admin/master");
      } else if (user.role === "municipal_manager") {
        navigate("/gestor/dashboard");
      } else if (user.role === "school_director") {
        navigate("/school/dashboard");
      } else if (user.role === "teacher") {
        navigate("/professor");
      } else if (user.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate, toast]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onCognitoLogin = () => {
    // Redirecionar para o OAuth do Cognito
    window.location.href = "/api/auth/oauth/login";
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
            {/* Botão Voltar */}
            <Link href="/" className="absolute top-4 right-4 flex items-center space-x-2 px-4 py-2 text-white hover:text-white transition-colors duration-200 bg-blue-600 hover:bg-blue-700 rounded-lg border border-blue-600 hover:border-blue-700">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Voltar</span>
            </Link>
            
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
                  Bem-vindo de volta!
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  Acesse sua conta e explore o universo da IA educacional
                </p>
                
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
                    <p className="font-medium">
                      Você já está logado como {user.firstName} {user.lastName} ({user.role})
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Deseja fazer login com uma conta diferente? Use o formulário abaixo.
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced Form */}
              <div className="w-full">
                <div className="rounded-2xl h-14 bg-slate-100/80 backdrop-blur-sm p-1 flex justify-center items-center">
                  <div className="rounded-xl font-semibold text-base bg-white shadow-lg text-blue-600 transition-all duration-300 px-6 py-3">
                    Entrar
                  </div>
                </div>
                
                <div className="space-y-6 mt-8">
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
                          <div className="flex items-center space-x-2">
                            <span>
                              {loginMutation.isPending ? "Autenticando..." : "Entrar na plataforma"}
                            </span>
                            <Sparkles className="w-5 h-5" />
                          </div>
                        </Button>
                      </form>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="bg-white px-2 text-slate-600">ou</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={onCognitoLogin}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl h-14 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                        type="button"
                      >
                        <div className="flex items-center space-x-2">
                          <span>Entrar com AWS Cognito</span>
                          <Brain className="w-5 h-5" />
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

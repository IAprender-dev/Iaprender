import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, BookOpen, Users, Brain, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import iaprenderLogo from "@assets/IAprender_1750262542315.png";

const cognitoLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type CognitoLoginFormValues = z.infer<typeof cognitoLoginSchema>;

export default function CognitoAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<CognitoLoginFormValues>({
    resolver: zodResolver(cognitoLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check for error parameters from Cognito
    const params = new URLSearchParams(window.location.search);
    const cognitoError = params.get('cognito_error');
    
    if (cognitoError) {
      switch (cognitoError) {
        case 'connection_failed':
          setError('Não foi possível conectar com o serviço de autenticação. Tente novamente.');
          break;
        case 'internal_error':
          setError('Erro interno do servidor. Tente novamente em alguns minutos.');
          break;
        default:
          setError('Erro desconhecido na autenticação.');
      }
    }
  }, []);

  const onSubmit = async (data: CognitoLoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      // First validate credentials with a custom endpoint
      const response = await fetch('/api/auth/cognito-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        // Usar redirecionamento invisível para manter usuário no domínio da aplicação
        window.location.href = '/api/auth/invisible-redirect';
      } else {
        setError(result.message || 'Credenciais inválidas');
        toast({
          title: "Erro de Autenticação",
          description: result.message || 'Credenciais inválidas',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('Erro ao conectar com o servidor');
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCognitoRedirect = () => {
    setLoading(true);
    
    // Usar redirecionamento invisível para manter usuário no domínio da aplicação
    window.location.href = '/api/auth/invisible-redirect';
  };

  return (
    <>
      <Helmet>
        <title>Login AWS Cognito - IAprender</title>
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
                    Autenticação segura com AWS Cognito
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 text-left">
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Segurança AWS</div>
                    <div className="text-sm text-blue-100/80">Autenticação robusta</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Acesso Unificado</div>
                    <div className="text-sm text-blue-100/80">Uma conta, todas as ferramentas</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">Experiência Integrada</div>
                    <div className="text-sm text-blue-100/80">Interface familiar e intuitiva</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 pt-6 border-t border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-100/70">Conexão segura estabelecida</span>
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
                  Acesso Seguro AWS Cognito
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  Entre com suas credenciais para acessar a plataforma
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Authentication Options */}
              <div className="space-y-6">
                {/* Direct Cognito Login Button */}
                <Card className="border-0 shadow-2xl rounded-3xl bg-white/80 backdrop-blur-xl">
                  <CardHeader className="space-y-3 pb-6 pt-8 px-8">
                    <CardTitle className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span>Autenticação AWS Cognito</span>
                    </CardTitle>
                    <CardDescription className="text-slate-600 font-medium">
                      Acesse diretamente através do sistema de autenticação seguro da AWS
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-8 pb-8">
                    <Button 
                      onClick={handleCognitoRedirect}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 rounded-2xl h-14 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Conectando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Entrar com AWS Cognito</span>
                        </div>
                      )}
                    </Button>
                    
                    <p className="text-sm text-center text-slate-500">
                      Você será redirecionado para a página de login segura da AWS
                    </p>
                  </CardContent>
                </Card>

                {/* Alternative Form Login */}
                <Card className="border-0 shadow-2xl rounded-3xl bg-white/60 backdrop-blur-xl opacity-75">
                  <CardHeader className="space-y-3 pb-6 pt-8 px-8">
                    <CardTitle className="text-xl font-bold text-slate-700">Login Alternativo</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                      Para validação de credenciais (desenvolvimento)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-8 pb-8">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Digite seu email"
                          className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                          {...form.register("email")}
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                            <span>{form.formState.errors.email.message}</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="password" className="text-slate-800 font-bold text-sm tracking-wide uppercase">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Digite sua senha"
                          className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-600 placeholder:font-medium text-slate-900 font-medium"
                          {...form.register("password")}
                        />
                        {form.formState.errors.password && (
                          <p className="text-sm text-red-500 font-medium flex items-center space-x-2">
                            <span className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">!</span>
                            <span>{form.formState.errors.password.message}</span>
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 rounded-2xl h-14 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
                      >
                        {loading ? "Validando..." : "Validar Credenciais"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Footer */}
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">
                  Problemas com o login? Entre em contato com o suporte
                </p>
                <Link href="/auth" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Usar login padrão da plataforma
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
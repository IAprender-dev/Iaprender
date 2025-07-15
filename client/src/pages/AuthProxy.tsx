import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import iaprenderLogo from "@assets/IAprender_1750262542315.png";

export default function AuthProxy() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se há código de retorno do Cognito
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');
    
    if (code) {
      // Se há código, processar callback
      window.location.href = `/auth/callback?code=${code}`;
      return;
    }
    
    if (errorParam) {
      toast({
        title: "Erro na autenticação",
        description: "Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    toast({
      title: "Redirecionando",
      description: "Você será redirecionado para o login seguro...",
    });
    
    // Usar redirecionamento invisível para manter usuário no domínio da aplicação
    setTimeout(() => {
      window.location.href = '/api/auth/invisible-redirect';
    }, 1000);
  };

  return (
    <>
      <Helmet>
        <title>Login - IAprender</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <img 
                src={iaprenderLogo} 
                alt="IAprender Logo" 
                className="h-20 w-auto mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">IAprender</h1>
              <p className="text-gray-600">Sistema Educacional Inteligente</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Email ou Nome de Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu email ou usuário"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={isLoading}
                  className="h-12"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    className="h-12 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-2">
              <p className="text-xs text-gray-500">
                Autenticação segura fornecida por AWS Cognito
              </p>
              <p className="text-xs text-gray-500">
                Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
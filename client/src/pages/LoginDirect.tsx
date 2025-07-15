import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, ExternalLink } from 'lucide-react';

export default function LoginDirect() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cognitoConfig, setCognitoConfig] = useState<any>(null);

  // Buscar configuração do Cognito
  useEffect(() => {
    const fetchCognitoConfig = async () => {
      try {
        const response = await fetch('/api/auth/cognito-config');
        const config = await response.json();
        setCognitoConfig(config);
      } catch (err) {
        setError('Erro ao carregar configuração de autenticação');
      }
    };
    
    fetchCognitoConfig();
  }, []);

  const handleCognitoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Redirecionar para a página de login do Cognito
      const response = await fetch('/api/auth/start-login');
      const data = await response.json();
      
      if (data.loginUrl) {
        window.location.href = data.loginUrl;
      } else {
        setError('Erro ao iniciar autenticação');
      }
    } catch (err) {
      setError('Erro ao conectar com o serviço de autenticação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Entrar no IAprender
          </CardTitle>
          <CardDescription className="text-gray-600">
            Autenticação segura via AWS Cognito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Autenticação Segura
              </span>
            </div>
            <p className="text-xs text-blue-700">
              Você será redirecionado para a página oficial do AWS Cognito 
              para fazer login com suas credenciais seguras.
            </p>
          </div>

          <Button 
            onClick={handleCognitoLogin}
            className="w-full"
            disabled={isLoading || !cognitoConfig}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Fazer Login com Cognito
              </>
            )}
          </Button>

          {cognitoConfig && (
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Domínio: {cognitoConfig.domain}</p>
              <p>Pool ID: {cognitoConfig.userPoolId}</p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="mb-2">Acesso exclusivo via Cognito:</p>
            <div className="bg-gray-50 p-3 rounded text-xs">
              <p>• Usuários devem ser criados no AWS Cognito</p>
              <p>• Autenticação oficial da AWS</p>
              <p>• Tokens JWT válidos e seguros</p>
              <p>• Sem bypass de segurança</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
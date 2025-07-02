import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Settings, 
  RefreshCw,
  Copy,
  Terminal,
  User,
  Cloud
} from "lucide-react";
import { Link } from "wouter";

interface PermissionStatus {
  permission: string;
  granted: boolean;
  error?: string;
}

interface IAMDiagnostic {
  userId: string;
  userArn: string;
  currentPolicies: string[];
  requiredPermissions: string[];
  permissionStatus: PermissionStatus[];
  needsUpdate: boolean;
  recommendedPolicy: {
    Version: string;
    Statement: Array<{
      Effect: string;
      Action: string[];
      Resource: string[];
    }>;
  };
}

interface Instructions {
  awsConsoleUrl: string;
  policyJson: string;
  steps: string[];
}

export default function AWSPermissionsManager() {
  const [diagnostic, setDiagnostic] = useState<IAMDiagnostic | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Carregar diagnóstico inicial
  useEffect(() => {
    loadDiagnostic();
    loadInstructions();
  }, []);

  const loadDiagnostic = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/aws/permissions/diagnose', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiagnostic(data.diagnostic);
        setLastCheck(new Date());
      } else {
        throw new Error('Falha ao carregar diagnóstico');
      }
    } catch (error) {
      toast({
        title: "Erro no diagnóstico",
        description: "Não foi possível carregar o diagnóstico de permissões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstructions = async () => {
    try {
      const response = await fetch('/api/admin/aws/permissions/instructions', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstructions(data.instructions);
      }
    } catch (error) {
      console.error('Erro ao carregar instruções:', error);
    }
  };

  const verifyPermissions = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/aws/permissions/verify', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.permissionsValid) {
          toast({
            title: "Permissões validadas!",
            description: "Todas as permissões AWS estão configuradas corretamente",
          });
          // Recarregar diagnóstico
          await loadDiagnostic();
        } else {
          toast({
            title: "Permissões ainda pendentes",
            description: "Algumas permissões ainda precisam ser configuradas",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar as permissões",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${description} copiado para área de transferência`,
    });
  };

  const getPermissionProgress = () => {
    if (!diagnostic) return 0;
    const granted = diagnostic.permissionStatus.filter(p => p.granted).length;
    return (granted / diagnostic.permissionStatus.length) * 100;
  };

  const getStatusColor = (granted: boolean) => {
    return granted ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (granted: boolean) => {
    return granted ? CheckCircle : AlertTriangle;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span>Configuração de Permissões AWS</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Fase 2.1 - Diagnóstico e configuração de permissões IAM para AWS Cognito
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={verifyPermissions}
              disabled={isVerifying}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verificar Permissões</span>
            </Button>
            
            <Link href="/admin/master">
              <Button variant="ghost">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Geral */}
        {diagnostic && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Status Atual - Usuário AWS</span>
              </CardTitle>
              <CardDescription>
                Informações do usuário e progresso das permissões
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuário IAM</p>
                  <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                    {diagnostic.userArn.split('/').pop()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">ARN Completo</p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                    {diagnostic.userArn}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso das Permissões</span>
                  <span className="text-sm text-gray-600">
                    {diagnostic.permissionStatus.filter(p => p.granted).length} de {diagnostic.permissionStatus.length}
                  </span>
                </div>
                <Progress value={getPermissionProgress()} className="h-2" />
              </div>

              {lastCheck && (
                <p className="text-xs text-gray-500">
                  Última verificação: {lastCheck.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs Principais */}
        <Tabs defaultValue="diagnostic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
            <TabsTrigger value="instructions">Configuração Manual</TabsTrigger>
            <TabsTrigger value="policy">Política JSON</TabsTrigger>
          </TabsList>

          {/* Tab Diagnóstico */}
          <TabsContent value="diagnostic" className="space-y-6">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-12">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Carregando diagnóstico...</span>
                  </div>
                </CardContent>
              </Card>
            ) : diagnostic ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status das Permissões */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Status das Permissões</span>
                    </CardTitle>
                    <CardDescription>
                      Verificação individual de cada permissão necessária
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {diagnostic.permissionStatus.map((permission, index) => {
                        const Icon = getStatusIcon(permission.granted);
                        return (
                          <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Icon 
                              className={`h-5 w-5 mt-0.5 ${getStatusColor(permission.granted)}`} 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {permission.permission}
                              </p>
                              {permission.error && (
                                <p className="text-xs text-red-600 mt-1">
                                  {permission.error}
                                </p>
                              )}
                            </div>
                            <Badge variant={permission.granted ? "default" : "destructive"}>
                              {permission.granted ? "OK" : "Negado"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo e Ações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Cloud className="h-5 w-5" />
                      <span>Resumo e Ações</span>
                    </CardTitle>
                    <CardDescription>
                      Próximos passos para configuração
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {diagnostic.needsUpdate ? (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Configuração necessária:</strong> As permissões AWS ainda não estão configuradas. 
                          Use a aba "Configuração Manual" para aplicar as políticas necessárias.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Configuração completa:</strong> Todas as permissões estão configuradas corretamente.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Permissões Necessárias:</h4>
                      <div className="text-sm bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
                        {diagnostic.requiredPermissions.map((perm, index) => (
                          <div key={index}>{perm}</div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={loadDiagnostic}
                      variant="outline" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Atualizar Diagnóstico
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center p-12">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">Diagnóstico não disponível</p>
                  <p className="text-gray-600">Clique em "Atualizar Diagnóstico" para tentar novamente</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Instruções */}
          <TabsContent value="instructions" className="space-y-6">
            {instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5" />
                    <span>Instruções de Configuração Manual</span>
                  </CardTitle>
                  <CardDescription>
                    Siga estes passos no AWS Console para configurar as permissões
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => window.open(instructions.awsConsoleUrl, '_blank')}
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Abrir AWS IAM Console</span>
                    </Button>
                    
                    <Button
                      onClick={() => copyToClipboard(instructions.awsConsoleUrl, "URL do AWS Console")}
                      variant="outline"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar URL
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Passos para Configuração:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      {instructions.steps.map((step, index) => (
                        <li key={index} className="pl-2">{step}</li>
                      ))}
                    </ol>
                  </div>

                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Importante:</strong> Após aplicar a política no AWS Console, 
                      volte aqui e clique em "Verificar Permissões" para confirmar a configuração.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Política JSON */}
          <TabsContent value="policy" className="space-y-6">
            {instructions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Política IAM JSON</span>
                  </CardTitle>
                  <CardDescription>
                    Cole este JSON no AWS Console ao criar a política
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => copyToClipboard(instructions.policyJson, "Política JSON")}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copiar JSON</span>
                    </Button>
                  </div>

                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{instructions.policyJson}</code>
                    </pre>
                  </div>

                  <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nome sugerido:</strong> CognitoUserManagementPolicy
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
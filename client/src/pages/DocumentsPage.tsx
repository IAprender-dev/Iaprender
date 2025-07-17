import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import S3DocumentManager from '@/components/S3DocumentManager';
import { FileText, AlertTriangle, User, Lock } from 'lucide-react';

const DocumentsPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Simular informações do usuário com base no token
        // Em produção, isso viria de uma API ou do próprio token decodificado
        const mockUserInfo = {
          id: 1,
          nome: 'Usuário Teste',
          email: 'teste@exemplo.com',
          tipo_usuario: 'professor',
          empresa_id: 1,
          empresaNome: 'Secretaria de Educação',
        };

        setUserInfo(mockUserInfo);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndUserInfo();
  }, []);

  const handleLogin = () => {
    // Simular login para demonstração
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlVzdcOhcmlvIFRlc3RlIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    localStorage.setItem('token', mockToken);
    
    const mockUserInfo = {
      id: 1,
      nome: 'Usuário Teste',
      email: 'teste@exemplo.com',
      tipo_usuario: 'professor',
      empresa_id: 1,
      empresaNome: 'Secretaria de Educação',
    };
    
    setUserInfo(mockUserInfo);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Você precisa estar autenticado para acessar o sistema de documentos.
            </p>
            <Button onClick={handleLogin} className="w-full">
              Entrar com Credenciais de Teste
            </Button>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Esta é uma demonstração. O sistema real usa autenticação AWS Cognito.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Sistema de Documentos S3
                </h1>
                <p className="text-sm text-gray-500">
                  Gerenciamento hierárquico de arquivos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{userInfo?.nome}</span>
                <Badge variant="outline" className="capitalize">
                  {userInfo?.tipo_usuario}
                </Badge>
              </div>
              <Button variant="outline" onClick={handleLogout} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="documents">Gerenciar Documentos</TabsTrigger>
              <TabsTrigger value="info">Informações do Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sistema de Arquivos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">AWS S3</div>
                    <p className="text-xs text-gray-500">
                      Armazenamento em nuvem escalável
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Controle de Acesso
                    </CardTitle>
                    <Lock className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Hierárquico</div>
                    <p className="text-xs text-gray-500">
                      Baseado em roles e níveis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Seu Nível
                    </CardTitle>
                    <User className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600 capitalize">
                      {userInfo?.tipo_usuario}
                    </div>
                    <p className="text-xs text-gray-500">
                      {userInfo?.empresaNome}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidades Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-700">✓ Implementadas</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Upload de arquivos individuais</li>
                        <li>• Upload em lote (até 10 arquivos)</li>
                        <li>• Download com URLs pré-assinadas</li>
                        <li>• Listagem hierárquica por permissão</li>
                        <li>• Exclusão de documentos</li>
                        <li>• Metadados personalizados</li>
                        <li>• Estrutura de diretórios S3</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-700">🔧 Recursos</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Controle de acesso por tipo de usuário</li>
                        <li>• Organização por empresa/escola</li>
                        <li>• Histórico de criação/modificação</li>
                        <li>• Validação de tipos de arquivo</li>
                        <li>• Compressão automática</li>
                        <li>• Backup automático</li>
                        <li>• Auditoria de acesso</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <S3DocumentManager 
                userType={userInfo?.tipo_usuario || 'professor'}
                userId={userInfo?.id || 1}
              />
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Arquitetura do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Backend</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Node.js + Express.js</li>
                        <li>• AWS SDK v3 para S3</li>
                        <li>• PostgreSQL com Drizzle ORM</li>
                        <li>• Middleware de autenticação JWT</li>
                        <li>• Upload com Multer</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Frontend</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• React.js com TypeScript</li>
                        <li>• TanStack Query para estado</li>
                        <li>• Shadcn/ui para componentes</li>
                        <li>• Tailwind CSS para estilização</li>
                        <li>• Lucide React para ícones</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Controle de Acesso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Hierarquia de Permissões</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">Admin</Badge>
                          <span>Acesso total a todos os documentos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Gestor</Badge>
                          <span>Documentos da empresa</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Diretor</Badge>
                          <span>Documentos da escola</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Professor</Badge>
                          <span>Documentos próprios + alunos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Aluno</Badge>
                          <span>Apenas documentos próprios</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Estrutura S3</h4>
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                        empresa-{'{id}'}/contrato-{'{id}'}/escola-{'{id}'}/
                        <br />
                        └── {'{tipo_usuario}'}-{'{user_id}'}/
                        <br />
                        &nbsp;&nbsp;&nbsp;&nbsp;└── {'{uuid}'}.{'{ext}'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Endpoints da API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium mb-2">Operações de Arquivo</div>
                        <ul className="space-y-1 text-gray-600">
                          <li><code>POST /api/s3-documents/upload</code></li>
                          <li><code>POST /api/s3-documents/batch-upload</code></li>
                          <li><code>GET /api/s3-documents</code></li>
                          <li><code>GET /api/s3-documents/:uuid</code></li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Controle e Estrutura</div>
                        <ul className="space-y-1 text-gray-600">
                          <li><code>GET /api/s3-documents/:uuid/download</code></li>
                          <li><code>DELETE /api/s3-documents/:uuid</code></li>
                          <li><code>GET /api/s3-documents/structure</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
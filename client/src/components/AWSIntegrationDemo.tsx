import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, FileText, User, Database, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
  sucesso: boolean;
  status: string;
  timestamp: string;
  servicos: {
    database: string;
    s3: string;
    dynamodb: string;
    bedrock: string;
  };
}

interface DocumentResponse {
  sucesso: boolean;
  uuid: string;
  s3_key: string;
  conteudo: {
    prompt: string;
    resposta: string;
    tipo: string;
    data_criacao: string;
    usuario_id: string;
    empresa_id: number;
  };
}

export default function AWSIntegrationDemo() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userDocuments, setUserDocuments] = useState<any[]>([]);
  const [generatedDoc, setGeneratedDoc] = useState<DocumentResponse | null>(null);
  const [prompt, setPrompt] = useState('');
  const [tipoArquivo, setTipoArquivo] = useState('plano_aula');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Token JWT de exemplo (em produção viria do localStorage ou context)
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1wcmVzYV9pZCI6MSwidGlwb191c3VhcmlvIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQGlhcHJlbmRlci5jb20iLCJpYXQiOjE3NTI3NzU3NzUsImV4cCI6MTc1Mjc3OTM3NX0.JC01pktjdVpO9B_nZMyJDTo2pqU1rWz3sC8ILfs-VTM';

  const fetchHealthStatus = async () => {
    setLoading('health');
    setError(null);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      setError('Erro ao verificar status dos serviços');
    } finally {
      setLoading(null);
    }
  };

  const fetchUserProfile = async () => {
    setLoading('profile');
    setError(null);
    try {
      const response = await fetch('/api/usuario/perfil', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      setError('Erro ao buscar perfil do usuário');
    } finally {
      setLoading(null);
    }
  };

  const fetchUserDocuments = async () => {
    setLoading('documents');
    setError(null);
    try {
      const response = await fetch('/api/usuario/documentos', {
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setUserDocuments(data);
    } catch (err) {
      setError('Erro ao buscar documentos do usuário');
    } finally {
      setLoading(null);
    }
  };

  const generateDocument = async () => {
    if (!prompt.trim()) {
      setError('Por favor, insira um prompt para gerar o documento');
      return;
    }

    setLoading('generate');
    setError(null);
    try {
      const response = await fetch('/api/documento/gerar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          tipo_arquivo: tipoArquivo
        })
      });
      const data = await response.json();
      if (data.sucesso) {
        setGeneratedDoc(data);
      } else {
        setError(data.erro || 'Erro ao gerar documento');
      }
    } catch (err) {
      setError('Erro ao gerar documento');
    } finally {
      setLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'OK' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'OK' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        OK
      </Badge>
    ) : (
      <Badge variant="destructive">
        ERRO
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          AWS Integration Demo
        </h1>
        <p className="text-gray-600">
          Demonstração das integrações AWS do sistema educacional
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health">Health Check</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="generate">Gerar Documento</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Status dos Serviços AWS
              </CardTitle>
              <CardDescription>
                Verificação de conectividade com todos os serviços AWS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchHealthStatus}
                disabled={loading === 'health'}
                className="w-full"
              >
                {loading === 'health' ? 'Verificando...' : 'Verificar Status'}
              </Button>

              {healthStatus && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Status Geral:</span>
                    <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
                      {healthStatus.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Database
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.servicos.database)}
                        {getStatusBadge(healthStatus.servicos.database)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        S3
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.servicos.s3)}
                        {getStatusBadge(healthStatus.servicos.s3)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        DynamoDB
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.servicos.dynamodb)}
                        {getStatusBadge(healthStatus.servicos.dynamodb)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Bedrock
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(healthStatus.servicos.bedrock)}
                        {getStatusBadge(healthStatus.servicos.bedrock)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Última verificação: {new Date(healthStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription>
                Dados do usuário armazenados no PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchUserProfile}
                disabled={loading === 'profile'}
                className="w-full"
              >
                {loading === 'profile' ? 'Carregando...' : 'Carregar Perfil'}
              </Button>

              {userProfile && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(userProfile, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos do Usuário
              </CardTitle>
              <CardDescription>
                Lista de documentos armazenados no DynamoDB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchUserDocuments}
                disabled={loading === 'documents'}
                className="w-full"
              >
                {loading === 'documents' ? 'Carregando...' : 'Carregar Documentos'}
              </Button>

              {userDocuments.length > 0 ? (
                <div className="space-y-2">
                  {userDocuments.map((doc, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold">{doc.tipo_arquivo}</div>
                      <div className="text-sm text-gray-600">{doc.data_criacao}</div>
                      <div className="text-xs text-gray-500">{doc.s3_key}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  {userDocuments.length === 0 && loading !== 'documents' ? 
                    'Nenhum documento encontrado' : 
                    'Clique em "Carregar Documentos" para ver a lista'
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Gerador de Documentos
              </CardTitle>
              <CardDescription>
                Gere documentos educacionais com IA e armazene no S3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt para IA</Label>
                <Textarea
                  id="prompt"
                  placeholder="Descreva o documento que deseja gerar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Arquivo</Label>
                <select
                  id="tipo"
                  value={tipoArquivo}
                  onChange={(e) => setTipoArquivo(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="plano_aula">Plano de Aula</option>
                  <option value="atividade">Atividade</option>
                  <option value="avaliacao">Avaliação</option>
                  <option value="relatorio">Relatório</option>
                </select>
              </div>

              <Button 
                onClick={generateDocument}
                disabled={loading === 'generate'}
                className="w-full"
              >
                {loading === 'generate' ? 'Gerando...' : 'Gerar Documento'}
              </Button>

              {generatedDoc && (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Documento Gerado com Sucesso!
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>UUID:</strong> {generatedDoc.uuid}</div>
                      <div><strong>S3 Key:</strong> {generatedDoc.s3_key}</div>
                      <div><strong>Data:</strong> {new Date(generatedDoc.conteudo.data_criacao).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Conteúdo Gerado:</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Prompt:</strong> {generatedDoc.conteudo.prompt}</div>
                      <div><strong>Resposta:</strong> {generatedDoc.conteudo.resposta}</div>
                      <div><strong>Tipo:</strong> {generatedDoc.conteudo.tipo}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
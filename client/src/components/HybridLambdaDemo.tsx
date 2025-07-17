import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  Server, 
  Zap, 
  Shield, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Activity,
  TrendingUp
} from 'lucide-react';

interface HybridStatus {
  sistema_hibrido: {
    ativo: boolean;
    lambda_disponivel: boolean;
    modo_principal: 'lambda' | 'express';
    fallback_ativo: boolean;
  };
  estatisticas: any;
}

interface DocumentoGerado {
  uuid: string;
  conteudo_gerado: string;
  tokens_utilizados: number;
  tempo_geracao_ms: number;
  processing_method: 'lambda' | 'express';
  data_criacao: string;
}

const HybridLambdaDemo: React.FC = () => {
  const [status, setStatus] = useState<HybridStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [documento, setDocumento] = useState<DocumentoGerado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  
  // Form states
  const [prompt, setPrompt] = useState('');
  const [tipoArquivo, setTipoArquivo] = useState('plano_aula');
  const [modeloBedrock, setModeloBedrock] = useState('');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperatura, setTemperatura] = useState(0.7);

  // Carregar status inicial
  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    try {
      const response = await fetch('/api/hybrid-lambda/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const gerarDocumento = async () => {
    if (!prompt.trim()) {
      setErro('Prompt é obrigatório');
      return;
    }

    setLoading(true);
    setErro(null);
    setDocumento(null);

    try {
      const response = await fetch('/api/hybrid-lambda/gerar-documento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          tipo_arquivo: tipoArquivo,
          modelo_bedrock: modeloBedrock || undefined,
          max_tokens: maxTokens,
          temperatura: temperatura
        })
      });

      const data = await response.json();

      if (data.sucesso) {
        setDocumento(data.dados);
        // Atualizar status após geração
        carregarStatus();
      } else {
        setErro(data.erro || 'Erro ao gerar documento');
      }
    } catch (error) {
      setErro('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const testarLambda = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hybrid-lambda/test-lambda', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.sucesso) {
        carregarStatus();
      }
    } catch (error) {
      console.error('Erro ao testar Lambda:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatusCard = () => {
    if (!status) return null;

    const { sistema_hibrido } = status;
    const modoIcon = sistema_hibrido.lambda_disponivel ? <Cloud className="w-5 h-5" /> : <Server className="w-5 h-5" />;
    const modoColor = sistema_hibrido.lambda_disponivel ? 'text-blue-600' : 'text-green-600';
    const modoText = sistema_hibrido.lambda_disponivel ? 'Lambda AWS' : 'Express Local';

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sistema Híbrido - Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {modoIcon}
              <span className={`font-medium ${modoColor}`}>
                Modo: {modoText}
              </span>
            </div>
            <Badge variant={sistema_hibrido.lambda_disponivel ? 'default' : 'secondary'}>
              {sistema_hibrido.lambda_disponivel ? 'Lambda Ativa' : 'Fallback Express'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm">
                Fallback: {sistema_hibrido.fallback_ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">
                Sistema: {sistema_hibrido.ativo ? 'Operacional' : 'Offline'}
              </span>
            </div>
          </div>

          <Button 
            onClick={testarLambda} 
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando Lambda...
              </>
            ) : (
              'Testar Disponibilidade Lambda'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderFormulario = () => (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Documentos Híbrido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="prompt">Prompt para Geração</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva o documento que deseja gerar..."
            className="min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tipo">Tipo de Arquivo</Label>
            <Select value={tipoArquivo} onValueChange={setTipoArquivo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plano_aula">Plano de Aula</SelectItem>
                <SelectItem value="atividade_educacional">Atividade Educacional</SelectItem>
                <SelectItem value="avaliacao">Avaliação</SelectItem>
                <SelectItem value="material_didatico">Material Didático</SelectItem>
                <SelectItem value="relatorio_pedagogico">Relatório Pedagógico</SelectItem>
                <SelectItem value="projeto_escolar">Projeto Escolar</SelectItem>
                <SelectItem value="comunicado">Comunicado</SelectItem>
                <SelectItem value="documento_administrativo">Documento Administrativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="modelo">Modelo Bedrock (Opcional)</Label>
            <Input
              id="modelo"
              value={modeloBedrock}
              onChange={(e) => setModeloBedrock(e.target.value)}
              placeholder="anthropic.claude-3-haiku-20240307-v1:0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tokens">Max Tokens</Label>
            <Input
              id="tokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              min="100"
              max="4000"
            />
          </div>

          <div>
            <Label htmlFor="temp">Temperatura</Label>
            <Input
              id="temp"
              type="number"
              value={temperatura}
              onChange={(e) => setTemperatura(parseFloat(e.target.value))}
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>

        <Button 
          onClick={gerarDocumento} 
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Documento...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Documento
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderResultado = () => {
    if (erro) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      );
    }

    if (!documento) return null;

    const processingIcon = documento.processing_method === 'lambda' ? 
      <Cloud className="w-4 h-4 text-blue-600" /> : 
      <Server className="w-4 h-4 text-green-600" />;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Documento Gerado com Sucesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {processingIcon}
              <span className="font-medium">
                Processado via: {documento.processing_method === 'lambda' ? 'AWS Lambda' : 'Express Local'}
              </span>
            </div>
            <Badge variant="outline">
              UUID: {documento.uuid}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{documento.tokens_utilizados}</div>
              <div className="text-sm text-gray-600">Tokens Utilizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{documento.tempo_geracao_ms}ms</div>
              <div className="text-sm text-gray-600">Tempo de Geração</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(documento.data_criacao).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">Hora de Criação</div>
            </div>
          </div>

          <div>
            <Label>Conteúdo Gerado:</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">
                {documento.conteudo_gerado}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sistema Híbrido Lambda + Express</h1>
        <p className="text-gray-600">
          Geração de documentos com AWS Lambda e fallback automático para Express
        </p>
      </div>

      <Tabs defaultValue="gerador" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gerador">Gerador</TabsTrigger>
          <TabsTrigger value="status">Status do Sistema</TabsTrigger>
          <TabsTrigger value="arquitetura">Arquitetura</TabsTrigger>
        </TabsList>

        <TabsContent value="gerador" className="space-y-6">
          {renderFormulario()}
          {renderResultado()}
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {renderStatusCard()}
          
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <strong>Arquitetura:</strong> Sistema híbrido com fallback automático
                </div>
                <div>
                  <strong>Processamento Primário:</strong> AWS Lambda (se disponível)
                </div>
                <div>
                  <strong>Fallback:</strong> Express + AWS Bedrock (sempre disponível)
                </div>
                <div>
                  <strong>Vantagens:</strong> Máxima disponibilidade, performance otimizada, custo eficiente
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquitetura" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Processamento Híbrido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <div>
                    <strong>Tentativa Lambda:</strong> Sistema tenta processar via AWS Lambda
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <strong>Fallback Express:</strong> Se Lambda falhar, usa Express + Bedrock
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <strong>Resposta Unificada:</strong> Resultado independente do método usado
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vantagens da Arquitetura Híbrida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">🚀 Performance</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Lambda: Cold start otimizado</li>
                    <li>• Express: Latência baixa</li>
                    <li>• Fallback automático</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">💰 Custo</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Lambda: Pagar por uso</li>
                    <li>• Express: Custo fixo</li>
                    <li>• Otimização automática</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛡️ Confiabilidade</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 100% disponibilidade</li>
                    <li>• Fallback robusto</li>
                    <li>• Monitoramento ativo</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🔧 Manutenção</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Desenvolvimento simples</li>
                    <li>• Deploy independente</li>
                    <li>• Debugging eficiente</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HybridLambdaDemo;
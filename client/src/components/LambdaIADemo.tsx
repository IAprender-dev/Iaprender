import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  FileText, 
  Download, 
  Clock, 
  Cpu, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  BookOpen,
  GraduationCap,
  ClipboardList,
  FileSpreadsheet,
  BarChart3,
  Folder
} from 'lucide-react';

interface DocumentoIA {
  uuid: string;
  s3_key: string;
  conteudo_gerado: string;
  tokens_utilizados: number;
  tempo_geracao_ms: number;
  status: string;
  data_criacao: string;
}

interface MetadadosDocumento {
  empresa_id: number;
  uuid: string;
  usuario_id: number;
  tipo_usuario: string;
  escola_id?: number;
  contrato_id?: number;
  data_criacao: string;
  tipo_arquivo: string;
  nome_usuario: string;
  s3_key: string;
  status: string;
  tokens_utilizados: number;
  tempo_geracao_ms: number;
  modelo_utilizado: string;
  prompt_hash: string;
  metadata?: Record<string, any>;
}

interface Estatisticas {
  total_documentos: number;
  tokens_utilizados_total: number;
  tempo_geracao_medio: number;
  tipos_arquivo: Record<string, number>;
  documentos_por_mes: Record<string, number>;
}

interface ModeloBedrock {
  id: string;
  nome: string;
  descricao: string;
  max_tokens: number;
  custo_por_token: number;
  recomendado_para: string[];
}

const LambdaIADemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gerador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para geração de documento
  const [prompt, setPrompt] = useState('');
  const [tipoArquivo, setTipoArquivo] = useState<string>('');
  const [modeloBedrock, setModeloBedrock] = useState<string>('');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [temperatura, setTemperatura] = useState(0.7);
  const [documentoGerado, setDocumentoGerado] = useState<DocumentoIA | null>(null);
  
  // Estados para listagem
  const [meusDocumentos, setMeusDocumentos] = useState<MetadadosDocumento[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [modelos, setModelos] = useState<ModeloBedrock[]>([]);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<any>(null);

  // Mapear tipos de arquivo para ícones
  const iconesTipoArquivo = {
    plano_aula: <BookOpen className="w-4 h-4" />,
    atividade_educacional: <GraduationCap className="w-4 h-4" />,
    avaliacao: <ClipboardList className="w-4 h-4" />,
    material_didatico: <FileText className="w-4 h-4" />,
    relatorio_pedagogico: <BarChart3 className="w-4 h-4" />,
    projeto_escolar: <Folder className="w-4 h-4" />,
    comunicado: <FileSpreadsheet className="w-4 h-4" />,
    documento_administrativo: <FileText className="w-4 h-4" />
  };

  // Carregar dados iniciais
  useEffect(() => {
    carregarModelos();
    carregarMeusDocumentos();
    carregarEstatisticas();
  }, []);

  const mostrarErro = (mensagem: string) => {
    setError(mensagem);
    setSuccess(null);
    setTimeout(() => setError(null), 5000);
  };

  const mostrarSucesso = (mensagem: string) => {
    setSuccess(mensagem);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  };

  const carregarModelos = async () => {
    try {
      const response = await fetch('/api/lambda-ia/modelos-disponiveis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModelos(data.dados || []);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
    }
  };

  const carregarMeusDocumentos = async () => {
    try {
      const response = await fetch('/api/lambda-ia/meus-documentos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeusDocumentos(data.dados || []);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      const response = await fetch('/api/lambda-ia/estatisticas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstatisticas(data.dados || null);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const gerarDocumento = async () => {
    if (!prompt.trim() || !tipoArquivo) {
      mostrarErro('Por favor, preencha o prompt e selecione o tipo de arquivo');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/lambda-ia/gerar-documento', {
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
          temperatura: temperatura,
          metadata: {
            gerado_via: 'lambda-ia-demo',
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDocumentoGerado(data.dados);
        mostrarSucesso('Documento gerado com sucesso!');
        await carregarMeusDocumentos();
        await carregarEstatisticas();
      } else {
        mostrarErro(data.erro || 'Erro ao gerar documento');
      }
    } catch (error) {
      mostrarErro('Erro na conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const buscarDocumento = async (uuid: string) => {
    try {
      const response = await fetch(`/api/lambda-ia/documento/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentoSelecionado(data.dados);
      } else {
        mostrarErro('Erro ao buscar documento');
      }
    } catch (error) {
      mostrarErro('Erro na conexão com o servidor');
    }
  };

  const formatarTempo = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatarData = (iso: string) => {
    return new Date(iso).toLocaleString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Lambda IA - Sistema de Geração de Documentos
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Gere documentos educacionais usando AWS Bedrock, S3, DynamoDB e Aurora
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gerador">Gerador IA</TabsTrigger>
          <TabsTrigger value="documentos">Meus Documentos</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
        </TabsList>

        {/* Aba Gerador */}
        <TabsContent value="gerador" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Gerador de Documentos IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo-arquivo">Tipo de Documento</Label>
                  <Select value={tipoArquivo} onValueChange={setTipoArquivo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
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

                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo Bedrock</Label>
                  <Select value={modeloBedrock} onValueChange={setModeloBedrock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Modelo padrão (Claude 3 Haiku)" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelos.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Máximo de Tokens</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    min="100"
                    max="4000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperatura">Temperatura</Label>
                  <Input
                    id="temperatura"
                    type="number"
                    value={temperatura}
                    onChange={(e) => setTemperatura(parseFloat(e.target.value))}
                    min="0"
                    max="1"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt para IA</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Digite aqui o que você quer que a IA gere..."
                  className="min-h-[120px]"
                />
              </div>

              <Button
                onClick={gerarDocumento}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Gerar Documento
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado da Geração */}
          {documentoGerado && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Documento Gerado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      Tempo: {formatarTempo(documentoGerado.tempo_geracao_ms)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      Tokens: {documentoGerado.tokens_utilizados}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      UUID: {documentoGerado.uuid.substring(0, 8)}...
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Conteúdo Gerado:</h4>
                  <div className="max-h-60 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {documentoGerado.conteudo_gerado}
                    </pre>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(documentoGerado.conteudo_gerado);
                    mostrarSucesso('Conteúdo copiado para área de transferência!');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Copiar Conteúdo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Documentos */}
        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Meus Documentos ({meusDocumentos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meusDocumentos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum documento encontrado. Gere seu primeiro documento na aba "Gerador IA".
                </p>
              ) : (
                <div className="space-y-4">
                  {meusDocumentos.map((doc) => (
                    <div
                      key={doc.uuid}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => buscarDocumento(doc.uuid)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {iconesTipoArquivo[doc.tipo_arquivo as keyof typeof iconesTipoArquivo]}
                          <div>
                            <h4 className="font-semibold capitalize">
                              {doc.tipo_arquivo.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {formatarData(doc.data_criacao)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">
                            {doc.tokens_utilizados} tokens
                          </Badge>
                          <Badge variant="outline">
                            {formatarTempo(doc.tempo_geracao_ms)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documento Selecionado */}
          {documentoSelecionado && (
            <Card>
              <CardHeader>
                <CardTitle>Documento Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">UUID:</span>
                      <p>{documentoSelecionado.uuid}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Modelo:</span>
                      <p>{documentoSelecionado.metadata.modelo_utilizado}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Conteúdo:</h4>
                    <div className="max-h-60 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">
                        {documentoSelecionado.conteudo_gerado}
                      </pre>
                    </div>
                  </div>

                  <Button
                    onClick={() => setDocumentoSelecionado(null)}
                    variant="outline"
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total de Documentos</p>
                    <p className="text-2xl font-bold">
                      {estatisticas?.total_documentos || 0}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tokens Utilizados</p>
                    <p className="text-2xl font-bold">
                      {estatisticas?.tokens_utilizados_total || 0}
                    </p>
                  </div>
                  <Cpu className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tempo Médio</p>
                    <p className="text-2xl font-bold">
                      {formatarTempo(estatisticas?.tempo_geracao_medio || 0)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tipo Mais Usado</p>
                    <p className="text-lg font-bold">
                      {estatisticas?.tipos_arquivo ? 
                        Object.entries(estatisticas.tipos_arquivo)
                          .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'
                        : 'N/A'}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tipos de Arquivo */}
          {estatisticas?.tipos_arquivo && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(estatisticas.tipos_arquivo).map(([tipo, quantidade]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {iconesTipoArquivo[tipo as keyof typeof iconesTipoArquivo]}
                        <span className="capitalize">{tipo.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(quantidade / estatisticas.total_documentos) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">{quantidade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Modelos */}
        <TabsContent value="modelos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelos.map((modelo) => (
              <Card key={modelo.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{modelo.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">{modelo.descricao}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Máx. Tokens:</span>
                      <span className="font-semibold">{modelo.max_tokens}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Custo/Token:</span>
                      <span className="font-semibold">${modelo.custo_por_token}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-1">Recomendado para:</p>
                    <div className="flex flex-wrap gap-1">
                      {modelo.recomendado_para.map((uso) => (
                        <Badge key={uso} variant="secondary" className="text-xs">
                          {uso.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LambdaIADemo;
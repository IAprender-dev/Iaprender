import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Brain,
  Download,
  Trash2,
  Eye,
  BarChart3,
  CloudUpload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Cpu,
  BookOpen,
  Target,
  Lightbulb
} from 'lucide-react';

interface UploadedFile {
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
  userId: number;
  resourceType: string;
}

interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  educationalLevel: string;
  subject: string;
  suggestedActivities: string[];
  bnccAlignment: string[];
  confidence: number;
}

export default function S3BedrockDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState('document');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResult>>({});
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Buscar status do serviço
  const { data: serviceStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['/api/s3-bedrock/status'],
    queryFn: async () => {
      const response = await fetch('/api/s3-bedrock/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    }
  });

  // Buscar arquivos do usuário
  const { data: userFiles, isLoading: loadingFiles, refetch: refetchFiles } = useQuery({
    queryKey: ['/api/s3-bedrock/files'],
    queryFn: async () => {
      const response = await fetch('/api/s3-bedrock/files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    }
  });

  // Mutation para upload
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/s3-bedrock/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/s3-bedrock/files'] });
      setSelectedFile(null);
      setUploadProgress(0);
      toast({
        title: "Upload concluído",
        description: "Arquivo carregado com sucesso para o S3"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para análise
  const analysisMutation = useMutation({
    mutationFn: async ({ fileKey, contentText }: { fileKey: string; contentText?: string }) => {
      const response = await fetch(`/api/s3-bedrock/analyze/${encodeURIComponent(fileKey)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contentText })
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: (data, variables) => {
      setAnalysisResults(prev => ({
        ...prev,
        [variables.fileKey]: data.data
      }));
      toast({
        title: "Análise concluída",
        description: "Conteúdo educacional analisado com IA"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation para deletar arquivo
  const deleteMutation = useMutation({
    mutationFn: async (fileKey: string) => {
      const response = await fetch(`/api/s3-bedrock/files/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/s3-bedrock/files'] });
      toast({
        title: "Arquivo deletado",
        description: "Arquivo removido do S3 com sucesso"
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 50MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('resourceType', resourceType);
    formData.append('metadata', JSON.stringify({
      uploadedBy: 'dashboard',
      category: resourceType
    }));

    // Simular progresso de upload
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    uploadMutation.mutate(formData);
  };

  const handleAnalyze = (fileKey: string) => {
    analysisMutation.mutate({ fileKey });
  };

  const handleDelete = (fileKey: string) => {
    if (confirm('Tem certeza que deseja deletar este arquivo?')) {
      deleteMutation.mutate(fileKey);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const files = userFiles?.data || [];

  return (
    <>
      <Helmet>
        <title>Dashboard S3 + Bedrock - IAprender</title>
        <meta name="description" content="Integração AWS S3 e Bedrock para processamento de conteúdo educacional" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AWS S3 + Bedrock Integration
            </h1>
            <p className="text-gray-600">
              Upload, armazenar e analisar conteúdo educacional com inteligência artificial
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button
              onClick={() => queryClient.invalidateQueries()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Status S3
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : serviceStatus?.success ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Cpu className="h-5 w-5 mr-2" />
                Status Bedrock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStatus ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verificando...</span>
                </div>
              ) : serviceStatus?.data?.bedrockConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Operacional
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Indisponível
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Meus Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {files.length}
              </div>
              <p className="text-sm text-gray-600">arquivos armazenados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              Arquivos
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Arquivo</CardTitle>
                <CardDescription>
                  Carregue documentos, imagens ou vídeos educacionais para análise com IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Selection */}
                <div className="space-y-4">
                  <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.json,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
                    />
                    <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Clique para selecionar ou arraste um arquivo aqui
                    </p>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, TXT, JSON, Imagens, Vídeos, Áudios (máx. 50MB)
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="mt-4"
                    >
                      Escolher Arquivo
                    </Button>
                  </div>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(selectedFile.type)}
                      <div className="flex-1">
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="resource-type">Tipo de Recurso</Label>
                  <Select value={resourceType} onValueChange={setResourceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson-plan">Plano de Aula</SelectItem>
                      <SelectItem value="activity">Atividade</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="audio">Áudio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Upload Progress */}
                {uploadMutation.isPending && (
                  <div className="space-y-2">
                    <Label>Progresso do Upload</Label>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600">{uploadProgress}% concluído</p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? 'Carregando...' : 'Fazer Upload'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingFiles ? (
                <div className="col-span-full text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Carregando arquivos...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum arquivo encontrado</p>
                  <p className="text-sm text-gray-500">Faça upload do primeiro arquivo</p>
                </div>
              ) : (
                files.map((file: UploadedFile) => (
                  <Card key={file.key} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.mimeType)}
                          <CardTitle className="text-sm truncate">{file.originalName}</CardTitle>
                        </div>
                        <Badge variant="outline">{file.resourceType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>{formatFileSize(file.size)}</p>
                        <p>{new Date(file.uploadedAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => window.open(file.url, '_blank')}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          onClick={() => handleAnalyze(file.key)}
                          variant="outline"
                          size="sm"
                          disabled={analysisMutation.isPending}
                        >
                          <Brain className="h-3 w-3 mr-1" />
                          IA
                        </Button>
                        <Button
                          onClick={() => handleDelete(file.key)}
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {Object.keys(analysisResults).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma análise disponível</p>
                  <p className="text-sm text-gray-500">
                    Analise um arquivo na aba "Arquivos" para ver os resultados aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(analysisResults).map(([fileKey, analysis]) => (
                <Card key={fileKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>Análise Educacional</span>
                      <Badge className="bg-green-100 text-green-800">
                        {analysis.confidence}% confiança
                      </Badge>
                    </CardTitle>
                    <CardDescription>{fileKey.split('/').pop()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Resumo
                      </h4>
                      <p className="text-gray-700">{analysis.summary}</p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Nível Educacional</h4>
                        <Badge variant="outline">{analysis.educationalLevel}</Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Disciplina</h4>
                        <Badge variant="outline">{analysis.subject}</Badge>
                      </div>
                    </div>

                    {/* Key Points */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Pontos Principais
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.keyPoints.map((point, index) => (
                          <li key={index} className="text-gray-700">{point}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Suggested Activities */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Atividades Sugeridas
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.suggestedActivities.map((activity, index) => (
                          <li key={index} className="text-gray-700">{activity}</li>
                        ))}
                      </ul>
                    </div>

                    {/* BNCC Alignment */}
                    {analysis.bnccAlignment.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Alinhamento BNCC</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.bnccAlignment.map((code, index) => (
                            <Badge key={index} variant="secondary">{code}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Total de Arquivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{files.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Análises Realizadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {Object.keys(analysisResults).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Espaço Utilizado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {formatFileSize(files.reduce((acc, file) => acc + file.size, 0))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Última Atividade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    {files.length > 0 
                      ? new Date(Math.max(...files.map(f => new Date(f.uploadedAt).getTime()))).toLocaleDateString('pt-BR')
                      : 'Nenhuma atividade'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* File Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo de Arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['lesson-plan', 'activity', 'document', 'image', 'video', 'audio'].map(type => {
                    const count = files.filter(f => f.resourceType === type).length;
                    const percentage = files.length > 0 ? (count / files.length) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center space-x-4">
                        <div className="w-24 text-sm capitalize">{type}</div>
                        <div className="flex-1">
                          <Progress value={percentage} className="h-2" />
                        </div>
                        <div className="w-16 text-sm text-right">{count} ({percentage.toFixed(1)}%)</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
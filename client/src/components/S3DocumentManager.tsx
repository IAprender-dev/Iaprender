import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  Trash2, 
  FileText, 
  FolderOpen, 
  Info,
  User,
  Building,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';

interface DocumentInfo {
  uuid: string;
  s3Key: string;
  descricao: string;
  tipoArquivo: string;
  tamanhoBytes: number;
  mimeType: string;
  criadoEm: string;
  criadoPor: string;
  empresaNome: string;
  escolaNome?: string;
  usuarioNome: string;
}

interface S3DocumentManagerProps {
  userType: string;
  userId: number;
}

export const S3DocumentManager: React.FC<S3DocumentManagerProps> = ({ userType, userId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadMetadata, setUploadMetadata] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const queryClient = useQueryClient();

  // Buscar documentos do usuário
  const { data: documentsData, isLoading: loadingDocuments, error: documentsError } = useQuery({
    queryKey: ['/api/s3-documents'],
    queryFn: async () => {
      const response = await fetch('/api/s3-documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar documentos');
      }
      
      return response.json();
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar estrutura de diretórios
  const { data: structureData, isLoading: loadingStructure } = useQuery({
    queryKey: ['/api/s3-documents/structure'],
    queryFn: async () => {
      const response = await fetch('/api/s3-documents/structure', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estrutura');
      }
      
      return response.json();
    },
  });

  // Mutation para upload de arquivo
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/s3-documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro no upload');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents/structure'] });
      setSelectedFile(null);
      setUploadDescription('');
      setUploadMetadata('');
      setUploadProgress(0);
    },
  });

  // Mutation para upload em lote
  const batchUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/s3-documents/batch-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro no upload em lote');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents/structure'] });
      setSelectedFiles([]);
    },
  });

  // Mutation para deletar arquivo
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await fetch(`/api/s3-documents/${uuid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao deletar arquivo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/s3-documents/structure'] });
    },
  });

  // Função para download
  const handleDownload = useCallback(async (uuid: string, fileName: string) => {
    try {
      const response = await fetch(`/api/s3-documents/${uuid}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar URL de download');
      }
      
      const { downloadUrl } = await response.json();
      
      // Abrir URL de download em nova aba
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Erro no download:', error);
    }
  }, []);

  // Função para upload individual
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('descricao', uploadDescription);
    
    if (uploadMetadata) {
      formData.append('metadata', uploadMetadata);
    }
    
    uploadMutation.mutate(formData);
  }, [selectedFile, uploadDescription, uploadMetadata, uploadMutation]);

  // Função para upload em lote
  const handleBatchUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    batchUploadMutation.mutate(formData);
  }, [selectedFiles, batchUploadMutation]);

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para obter ícone por tipo de usuário
  const getUserTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'admin': return <User className="w-4 h-4 text-red-500" />;
      case 'gestor': return <Building className="w-4 h-4 text-blue-500" />;
      case 'diretor': return <GraduationCap className="w-4 h-4 text-green-500" />;
      case 'professor': return <User className="w-4 h-4 text-purple-500" />;
      case 'aluno': return <User className="w-4 h-4 text-orange-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loadingDocuments) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documentsError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar documentos. Verifique sua conexão e tente novamente.
        </AlertDescription>
      </Alert>
    );
  }

  const documents = documentsData?.documents || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerenciador de Documentos S3
            <Badge variant="outline" className="ml-2">
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700">Total de Documentos</h3>
              <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-700">Tamanho Total</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.tamanhoBytes, 0))}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-700">Nível de Acesso</h3>
              <p className="text-2xl font-bold text-purple-600 capitalize">{userType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="batch">Upload em Lote</TabsTrigger>
          <TabsTrigger value="structure">Estrutura</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum documento encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: DocumentInfo) => (
                    <div key={doc.uuid} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{doc.descricao}</h4>
                          <p className="text-sm text-gray-600">
                            {doc.s3Key.split('/').pop()} • {formatFileSize(doc.tamanhoBytes)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {doc.empresaNome}
                            </Badge>
                            {doc.escolaNome && (
                              <Badge variant="outline" className="text-xs">
                                {doc.escolaNome}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              {getUserTypeIcon(doc.usuarioNome)}
                              <span className="text-xs text-gray-500">{doc.usuarioNome}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc.uuid, doc.s3Key)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMutation.mutate(doc.uuid)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">Selecionar Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Descrição do arquivo"
                />
              </div>
              
              <div>
                <Label htmlFor="metadata">Metadados (JSON)</Label>
                <Textarea
                  id="metadata"
                  value={uploadMetadata}
                  onChange={(e) => setUploadMetadata(e.target.value)}
                  placeholder='{"categoria": "plano_aula", "disciplina": "matematica"}'
                />
              </div>
              
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Arquivo
                  </>
                )}
              </Button>
              
              {uploadMutation.isError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erro no upload: {uploadMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {uploadMutation.isSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Arquivo enviado com sucesso!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload em Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="files">Selecionar Múltiplos Arquivos</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                />
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Arquivos Selecionados ({selectedFiles.length})</h4>
                  <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="text-sm">
                        {file.name} - {formatFileSize(file.size)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleBatchUpload}
                disabled={selectedFiles.length === 0 || batchUploadMutation.isPending}
                className="w-full"
              >
                {batchUploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar {selectedFiles.length} Arquivo(s)
                  </>
                )}
              </Button>
              
              {batchUploadMutation.isError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erro no upload em lote: {batchUploadMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {batchUploadMutation.isSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Upload em lote concluído!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Hierárquica</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStructure ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : structureData?.structure ? (
                <div className="space-y-4">
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                    {JSON.stringify(structureData.structure, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma estrutura encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default S3DocumentManager;
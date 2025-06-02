import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Download, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  BookOpen,
  Target,
  Users,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AnaliseDocumentos() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (validTypes.includes(fileType)) {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Por favor, selecione um arquivo PDF ou Word (.doc, .docx)");
      }
    }
  };

  const analyzeDocument = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError("");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Erro ao analisar documento');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      setError('Erro ao analisar documento. Tente novamente.');
      console.error('Erro:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadMaterial = () => {
    if (!analysisResult) return;
    
    const content = `
# ${analysisResult.title}

## Objetivos de Aprendizagem
${analysisResult.objectives.map((obj: string) => `- ${obj}`).join('\n')}

## Público-Alvo
${analysisResult.targetAudience}

## Duração Estimada
${analysisResult.duration}

## Conteúdo Estruturado

${analysisResult.sections.map((section: any) => `
### ${section.title}
${section.content}

**Pontos-chave:**
${section.keyPoints.map((point: string) => `- ${point}`).join('\n')}
`).join('\n')}

## Atividades Sugeridas
${analysisResult.activities.map((activity: string) => `- ${activity}`).join('\n')}

## Avaliação
${analysisResult.assessment}
    `;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysisResult.title.replace(/\s+/g, '_')}_material_didatico.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Análise de Documentos - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/professor/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Análise de Documentos</h1>
              <p className="text-slate-600">Transforme qualquer documento em material didático estruturado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-rose-600" />
                  Upload do Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-rose-400 transition-colors">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-slate-700 font-medium">Arraste e solte seu arquivo aqui</p>
                    <p className="text-sm text-slate-500">ou clique para selecionar</p>
                    <p className="text-xs text-slate-400">Suporte para PDF, DOC e DOCX (máx. 10MB)</p>
                  </div>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button className="mt-4 bg-rose-600 hover:bg-rose-700">
                      Selecionar Arquivo
                    </Button>
                  </Label>
                </div>

                {file && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{file.name}</p>
                        <p className="text-sm text-green-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                      <span className="text-sm text-slate-600">Analisando documento...</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <Button 
                  onClick={analyzeDocument}
                  disabled={!file || isAnalyzing}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Analisar Documento
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-rose-600" />
                  Material Didático Gerado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!analysisResult ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Nenhum documento analisado ainda</p>
                    <p className="text-sm text-slate-400">Faça upload de um documento para começar</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overview */}
                    <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                      <h3 className="font-bold text-slate-900 text-lg mb-3">{analysisResult.title}</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-rose-600" />
                          <span className="text-slate-600">{analysisResult.targetAudience}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-rose-600" />
                          <span className="text-slate-600">{analysisResult.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-rose-600" />
                          <span className="text-slate-600">{analysisResult.difficulty}</span>
                        </div>
                      </div>
                    </div>

                    {/* Objectives */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Objetivos de Aprendizagem</h4>
                      <div className="space-y-2">
                        {analysisResult.objectives.map((objective: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Sections */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Estrutura do Conteúdo</h4>
                      <div className="space-y-3">
                        {analysisResult.sections.map((section: any, index: number) => (
                          <div key={index} className="p-3 border border-slate-200 rounded-lg">
                            <h5 className="font-medium text-slate-900 mb-2">{section.title}</h5>
                            <p className="text-sm text-slate-600 mb-2">{section.summary}</p>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {section.keyPoints.length} pontos-chave
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-200">
                      <Button 
                        onClick={downloadMaterial}
                        className="w-full bg-rose-600 hover:bg-rose-700 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Baixar Material Completo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
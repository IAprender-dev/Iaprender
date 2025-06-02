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
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-rose-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-slate-700 font-medium">Arraste e solte seu arquivo aqui</p>
                    <p className="text-sm text-slate-500">ou clique para selecionar</p>
                    <p className="text-xs text-slate-400">Suporte para PDF, DOC e DOCX (máx. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button className="mt-4 bg-rose-600 hover:bg-rose-700 pointer-events-none">
                    Selecionar Arquivo
                  </Button>
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
              <CardContent className="max-h-[600px] overflow-y-auto">
                {!analysisResult ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">Nenhum documento analisado ainda</p>
                    <p className="text-sm text-slate-400">Faça upload de um documento para começar</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 rounded-2xl p-6 border border-rose-100">
                      <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{analysisResult.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-white/40">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Público-alvo</p>
                            <p className="text-sm font-semibold text-slate-800">{analysisResult.targetAudience}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-white/40">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Clock className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Duração</p>
                            <p className="text-sm font-semibold text-slate-800">{analysisResult.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-white/40">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Target className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nível</p>
                            <p className="text-sm font-semibold text-slate-800">{analysisResult.difficulty}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Objetivos de Aprendizagem</h3>
                      </div>
                      <div className="grid gap-3">
                        {analysisResult.objectives.map((objective: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-white/50">
                            <div className="p-1 bg-green-100 rounded-full mt-0.5">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{objective}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Structure */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BookOpen className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Estrutura do Conteúdo</h3>
                      </div>
                      {analysisResult.sections.map((section: any, index: number) => (
                        <div key={index} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <h4 className="font-semibold text-slate-900 text-base">{section.title}</h4>
                          </div>
                          <p className="text-sm text-slate-700 mb-4 leading-relaxed bg-white/50 p-3 rounded-lg">{section.summary}</p>
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Pontos-chave:</p>
                            <div className="grid gap-2">
                              {section.keyPoints.map((point: string, pointIndex: number) => (
                                <div key={pointIndex} className="flex items-start gap-2">
                                  <div className="w-4 h-4 bg-orange-200 rounded-full flex items-center justify-center mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                                  </div>
                                  <p className="text-sm text-slate-700">{point}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Activities */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Lightbulb className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Atividades Sugeridas</h3>
                      </div>
                      <div className="grid gap-3">
                        {analysisResult.activities.map((activity: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-white/50">
                            <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{activity}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assessment */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Award className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Método de Avaliação</h3>
                      </div>
                      <div className="p-4 bg-white/60 rounded-lg border border-white/50">
                        <p className="text-sm text-slate-700 leading-relaxed">{analysisResult.assessment}</p>
                      </div>
                    </div>

                    {/* Download Action */}
                    <div className="pt-6 border-t border-slate-200">
                      <Button 
                        onClick={downloadMaterial}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 gap-3"
                      >
                        <Download className="h-5 w-5" />
                        Baixar Material Didático Completo
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
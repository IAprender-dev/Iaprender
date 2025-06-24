import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, Eye, Download, Star, Pencil, BookOpen, Brain } from "lucide-react";

// Essay Analyzer component
function EssayAnalyzer() {
  const { toast } = useToast();
  const [essayText, setEssayText] = useState("");
  const [analysisType, setAnalysisType] = useState("comprehensive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!essayText.trim()) {
      toast({
        title: "Texto obrigatório",
        description: "Digite ou cole o texto da redação para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulated analysis - in real implementation, this would call AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAnalysisResult({
        score: 8.5,
        grade: "Muito Bom",
        strengths: [
          "Estrutura clara e bem organizada",
          "Argumentação consistente",
          "Uso adequado de conectivos"
        ],
        improvements: [
          "Poderia explorar mais exemplos concretos",
          "Algumas repetições de palavras",
          "Conclusão poderia ser mais impactante"
        ],
        grammar: {
          errors: 3,
          suggestions: [
            "Linha 5: 'Mas' deveria ser 'Porém' para texto formal",
            "Linha 12: Concordância verbal",
            "Linha 18: Uso da vírgula"
          ]
        }
      });
      
      toast({
        title: "Análise concluída!",
        description: "A redação foi analisada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a redação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="analysisType">Tipo de Análise</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Análise Completa</SelectItem>
                <SelectItem value="grammar">Foco em Gramática</SelectItem>
                <SelectItem value="structure">Foco em Estrutura</SelectItem>
                <SelectItem value="argumentation">Foco em Argumentação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="essayText">Texto da Redação</Label>
            <Textarea
              id="essayText"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Cole ou digite o texto da redação aqui..."
              className="min-h-[300px]"
            />
          </div>
          
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analisar Redação
              </>
            )}
          </Button>
        </div>
        
        <div>
          {analysisResult ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Nota:</span>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {analysisResult.score}/10
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Conceito:</span>
                      <Badge className="text-lg px-3 py-1 bg-green-100 text-green-800">
                        {analysisResult.grade}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pontos Fortes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pontos de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Correções Gramaticais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {analysisResult.grammar.errors} erro(s) encontrado(s)
                  </p>
                  <ul className="space-y-2">
                    {analysisResult.grammar.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center p-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Digite o texto da redação e clique em "Analisar" para ver os resultados aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EssaysDashboard() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Dashboard de Redações | Professor | IAprender</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-pink-500/5 rounded-3xl"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg shadow-purple-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl blur-lg opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-4">
                          <Pencil className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                          Dashboard de Redações
                        </h1>
                        <p className="text-slate-600 text-lg mt-2 max-w-2xl">
                          Analise e avalie redações com inteligência artificial avançada
                        </p>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl px-4 py-3 border border-purple-200">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-purple-700 font-medium text-sm">IA Ativa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Essay Analyzer */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-xl">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Brain className="h-6 w-6" />
                    Analisador Inteligente de Redações
                  </CardTitle>
                  <CardDescription className="text-purple-100">
                    Utilize IA para analisar estrutura, gramática e argumentação das redações dos seus alunos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <EssayAnalyzer />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
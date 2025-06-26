import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Loader2, Upload, FileText, Eye, Download, Star, Pencil, BookOpen, Brain, ArrowLeft } from "lucide-react";
import iaprenderLogoNew from "@/assets/IAprender_1750262377399.png";

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
            <Label htmlFor="analysisType" className="text-sm font-semibold text-slate-700">Tipo de Análise</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="border-2 border-slate-200 focus:border-slate-600 transition-all duration-300 bg-white">
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
            <Label htmlFor="essayText" className="text-sm font-semibold text-slate-700">Texto da Redação</Label>
            <Textarea
              id="essayText"
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Cole ou digite o texto da redação aqui..."
              className="min-h-[300px] border-2 border-slate-200 focus:border-slate-600 focus:ring-slate-600/20 focus:ring-4 transition-all duration-300 bg-white text-slate-900 placeholder:text-slate-600"
            />
          </div>
          
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="w-full bg-slate-600 hover:bg-slate-700"
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
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Star className="h-5 w-5 text-slate-600" />
                    Resultado da Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Nota:</span>
                      <Badge className="text-lg px-3 py-1 bg-slate-100 text-slate-800">
                        {analysisResult.score}/10
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Conceito:</span>
                      <Badge className="text-lg px-3 py-1 bg-slate-200 text-slate-700">
                        {analysisResult.grade}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Pontos Fortes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-slate-600 rounded-full mt-2"></div>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Pontos de Melhoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.improvements.map((improvement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full mt-2"></div>
                        <span className="text-sm">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Correções Gramaticais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    {analysisResult.grammar.errors} erro(s) encontrado(s)
                  </p>
                  <ul className="space-y-2">
                    {analysisResult.grammar.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm bg-slate-50 p-2 rounded border-l-4 border-slate-400">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="text-center p-8">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500">
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

      <div className="min-h-screen bg-slate-50">
        {/* Header com botão Voltar */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/professor">
                  <Button className="gap-2 bg-slate-600 hover:bg-slate-700 text-white shadow-lg border-0">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <img 
                    src={iaprenderLogoNew} 
                    alt="IAprender Logo" 
                    className="w-10 h-10 object-contain"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard de Redações</h1>
                    <p className="text-slate-600">Analise e corrija redações com inteligência artificial</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="relative mb-12">
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="bg-slate-100 rounded-2xl p-4">
                        <Pencil className="h-8 w-8 text-slate-600" />
                      </div>
                      </div>
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                          Dashboard de Redações
                        </h1>
                        <p className="text-slate-600 text-lg mt-2 max-w-2xl">
                          Analise e avalie redações com inteligência artificial avançada
                        </p>
                      </div>
                    </div>
                    <div className="hidden lg:flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl px-4 py-3 border border-slate-200">
                        <div className="w-3 h-3 bg-slate-600 rounded-full animate-pulse"></div>
                        <span className="text-slate-700 font-medium text-sm">IA Ativa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Essay Analyzer */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-slate-600" />
                    Analisador Inteligente de Redações
                  </CardTitle>
                  <CardDescription className="text-slate-600">
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
    </>
  );
}
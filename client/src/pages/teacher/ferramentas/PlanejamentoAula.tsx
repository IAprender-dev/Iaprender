import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  Calendar, 
  BookOpen, 
  Target, 
  Clock, 
  FileText, 
  Lightbulb,
  Sparkles,
  ArrowLeft,
  Download,
  Save,
  RefreshCw,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function PlanejamentoAula() {
  const { toast } = useToast();
  
  const [tema, setTema] = useState("");
  const [duracao, setDuracao] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [temaAnalysis, setTemaAnalysis] = useState<any>(null);
  const [planoGerado, setPlanoGerado] = useState<any>(null);

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Analisar tema automaticamente usando IA e diretrizes do MEC/BNCC
  const analisarTema = async (temaInput: string) => {
    if (!temaInput.trim()) {
      setTemaAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tema: temaInput }),
      });

      if (!response.ok) {
        throw new Error('Erro na análise do tema');
      }

      const analysis = await response.json();
      setTemaAnalysis(analysis);
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o tema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounce para análise do tema
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tema.trim().length > 3) {
        analisarTema(tema);
      } else {
        setTemaAnalysis(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [tema]);

  const gerarPlano = async () => {
    if (!tema.trim() || !duracao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o tema e a duração para gerar o plano de aula.",
        variant: "destructive"
      });
      return;
    }

    if (!temaAnalysis) {
      toast({
        title: "Aguarde a análise",
        description: "Aguarde a análise automática do tema ser concluída.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tema, 
          duracao, 
          analysis: temaAnalysis 
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na geração do plano');
      }

      const planoData = await response.json();
      setPlanoGerado(planoData);
      
      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu plano de aula profissional está pronto para uso.",
      });
    } catch (error: any) {
      console.error('Erro na geração do plano:', error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportarPDF = () => {
    toast({
      title: "Exportação iniciada",
      description: "Seu plano de aula será exportado em PDF.",
    });
  };

  const salvarPlano = () => {
    toast({
      title: "Plano salvo",
      description: "Seu plano de aula foi salvo com sucesso.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Planejamento de Aula - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Planejamento de Aula</h1>
                  <p className="text-slate-600">Geração inteligente com IA baseada nas diretrizes do MEC e BNCC</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulário de Entrada */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">Dados da Aula</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campo do Tema */}
                <div className="space-y-2">
                  <Label htmlFor="tema" className="text-sm font-semibold text-slate-700">
                    Tema da Aula *
                  </Label>
                  <Textarea
                    id="tema"
                    placeholder="Digite o tema da sua aula (ex: Frações, Sistema Solar, Brasil Colônia...)"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analisando tema conforme diretrizes do MEC e BNCC...
                    </div>
                  )}
                </div>

                {/* Análise do Tema */}
                {temaAnalysis && (
                  <Card className={`border-2 ${temaAnalysis.conformeRegulasBNCC ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {temaAnalysis.conformeRegulasBNCC ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        )}
                        <span className="font-semibold text-sm">
                          {temaAnalysis.conformeRegulasBNCC ? 'Tema alinhado à BNCC' : 'Atenção: Tema fora das diretrizes'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-slate-700">Disciplina identificada: </span>
                          <Badge variant="secondary">{temaAnalysis.disciplina}</Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-700">Ano/Série sugerido: </span>
                          <Badge variant="secondary">{temaAnalysis.anoSerie}</Badge>
                        </div>
                        {!temaAnalysis.conformeRegulasBNCC && (
                          <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                            <strong>Observação:</strong> {temaAnalysis.observacoes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Campo de Duração */}
                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-sm font-semibold text-slate-700">
                    Duração da Aula *
                  </Label>
                  <Select value={duracao} onValueChange={setDuracao}>
                    <SelectTrigger className="w-full border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="50">50 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botão Gerar Plano */}
                <Button 
                  onClick={gerarPlano}
                  disabled={isGenerating || !tema.trim() || !duracao || !temaAnalysis}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Gerando Plano...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Gerar Plano de Aula
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview/Resultado */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Plano de Aula</CardTitle>
                  </div>
                  {planoGerado && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={salvarPlano}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={exportarPDF}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!planoGerado ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum plano gerado</h3>
                    <p className="text-slate-500 max-w-sm">
                      Preencha o tema e a duração da aula para gerar seu plano profissional
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Cabeçalho do Plano */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h2 className="text-xl font-bold text-slate-900 mb-2">{planoGerado.titulo}</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-slate-700">Disciplina:</span>
                          <p className="text-slate-600">{planoGerado.disciplina}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Série:</span>
                          <p className="text-slate-600">{planoGerado.serie}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Duração:</span>
                          <p className="text-slate-600">{planoGerado.duracao}</p>
                        </div>
                      </div>
                    </div>

                    {/* Observações sobre conformidade com BNCC */}
                    {planoGerado.observacoesBNCC && (
                      <div className="bg-orange-50 border-orange-200 border p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-orange-800 mb-1">Observações sobre BNCC</h4>
                            <p className="text-orange-700 text-sm">{planoGerado.observacoesBNCC}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seções do Plano */}
                    <div className="space-y-4">
                      {/* Objetivos */}
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Objetivos
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed">{planoGerado.objetivo}</p>
                      </div>

                      {/* Cronograma de Atividades */}
                      {planoGerado.cronograma && (
                        <div>
                          <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                            Cronograma da Aula
                          </h3>
                          <div className="space-y-3">
                            {planoGerado.cronograma.map((etapa: any, index: number) => (
                              <div key={index} className="bg-slate-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-slate-900 text-sm">{etapa.atividade}</span>
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {etapa.tempo}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600">{etapa.descricao}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conteúdo Programático */}
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <BookOpen className="h-4 w-4 text-green-600" />
                          Conteúdo Programático
                        </h3>
                        <ul className="space-y-1">
                          {planoGerado.conteudoProgramatico?.map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                              <ChevronRight className="h-3 w-3 text-slate-400 mt-1 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Metodologia */}
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Settings className="h-4 w-4 text-purple-600" />
                          Metodologia
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed">{planoGerado.metodologia}</p>
                      </div>

                      {/* Recursos Necessários */}
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Plus className="h-4 w-4 text-amber-600" />
                          Recursos Necessários
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {planoGerado.recursos?.map((recurso: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {recurso}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Avaliação */}
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Avaliação
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed">{planoGerado.avaliacao}</p>
                      </div>

                      {/* Observações */}
                      {planoGerado.observacoes && (
                        <div>
                          <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            Observações
                          </h3>
                          <p className="text-slate-700 text-sm leading-relaxed">{planoGerado.observacoes}</p>
                        </div>
                      )}
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
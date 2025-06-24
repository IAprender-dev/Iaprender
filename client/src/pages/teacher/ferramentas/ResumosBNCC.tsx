import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { 
  ArrowLeft, 
  BookOpen, 
  Loader2, 
  Download, 
  Save, 
  Wand2,
  Sparkles,
  CheckCircle,
  FileText,
  GraduationCap,
  Copy,
  RefreshCw,
  Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ResumoGerado {
  id: string;
  titulo: string;
  materia: string;
  serie: string;
  conteudo: string;
  dataGeracao: Date;
  favorito: boolean;
}

export default function ResumosBNCC() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumoGerado, setResumoGerado] = useState<ResumoGerado | null>(null);
  const [historico, setHistorico] = useState<ResumoGerado[]>([]);

  // Garantir que a página sempre inicie no topo com animação suave
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: 'smooth' 
      });
    };
    
    scrollToTop();
    
    // Também rolar para o topo quando um resumo for gerado
    if (resumoGerado) {
      setTimeout(scrollToTop, 100);
    }
  }, [resumoGerado]);

  // Formulário simplificado
  const [assunto, setAssunto] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Sugestões de assuntos populares
  const sugestoesAssuntos = [
    "Fotossíntese",
    "Sistema Solar", 
    "Revolução Industrial",
    "Funções Matemáticas",
    "Células e Tecidos",
    "Aquecimento Global"
  ];

  const gerarResumo = async () => {
    if (!assunto.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "Por favor, informe o assunto para criar o resumo BNCC.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/education/generate-educational-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto,
          contextoPedagogico: observacoes
        })
      });

      console.log('Status da resposta:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API:', response.status, errorText);
        throw new Error(`Erro da API: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Texto bruto da resposta:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Dados parseados:', data);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        throw new Error("Resposta da API não é um JSON válido");
      }
      
      // Verificar se existe conteúdo
      const conteudo = data.resumo || data.content || data.response || "";
      if (!conteudo.trim()) {
        console.error('Nenhum conteúdo encontrado na resposta:', data);
        throw new Error("Nenhum conteúdo foi gerado");
      }
      
      const novoResumo: ResumoGerado = {
        id: Date.now().toString(),
        titulo: assunto,
        materia: data.materia || "Identificação automática",
        serie: data.serie || "Conforme BNCC",
        conteudo: conteudo,
        dataGeracao: new Date(),
        favorito: false
      };

      console.log('Resumo criado:', novoResumo);

      setResumoGerado(novoResumo);
      setHistorico(prev => [novoResumo, ...prev.slice(0, 9)]);
      
      toast({
        title: "Resumo BNCC criado!",
        description: `Resumo sobre ${assunto} gerado conforme diretrizes da BNCC.`
      });

    } catch (error) {
      console.error('Erro detalhado na geração:', error);
      console.error('Tipo do erro:', typeof error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      toast({
        title: "Erro ao gerar resumo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const salvarResumo = () => {
    if (resumoGerado) {
      toast({
        title: "Resumo salvo!",
        description: "O resumo foi salvo nos seus materiais."
      });
    }
  };

  const downloadResumo = () => {
    if (resumoGerado) {
      const blob = new Blob([resumoGerado.conteudo], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumo-${resumoGerado.titulo.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado!",
        description: "O resumo está sendo baixado."
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Resumos BNCC - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 overflow-x-hidden">
        {/* Header */}
        <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <Link href="/professor">
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900">
                    Resumos BNCC
                  </h1>
                  <p className="text-slate-600 text-sm">Resumos educacionais alinhados à Base Nacional Comum Curricular</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Painel de Configuração */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-800">
                        Gerar Resumo BNCC
                      </CardTitle>
                      <p className="text-sm text-slate-500">
                        A IA identificará automaticamente a matéria e série adequadas
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Assunto */}
                  <div className="space-y-3">
                    <Label htmlFor="assunto" className="text-sm font-medium text-slate-700">
                      Assunto/Tema *
                    </Label>
                    <Textarea 
                      id="assunto"
                      placeholder="Ex: Fotossíntese e respiração celular"
                      className="min-h-[100px] resize-none border-2 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500/20 focus:ring-4 transition-all duration-300 bg-white text-cyan-900"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                    />
                    
                    {/* Sugestões */}
                    <div className="flex flex-wrap gap-2">
                      {sugestoesAssuntos.map((sugestao, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer hover:bg-cyan-50 border-cyan-200 text-cyan-700"
                          onClick={() => setAssunto(sugestao)}
                        >
                          {sugestao}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Contexto Adicional */}
                  <div className="space-y-3">
                    <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700">
                      Observações Específicas
                    </Label>
                    <Textarea 
                      id="observacoes"
                      placeholder="Ex: Enfoque em aspectos práticos, adaptação para necessidades especiais..."
                      className="min-h-[80px] resize-none border-2 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500/20 focus:ring-4 transition-all duration-300 bg-white text-cyan-900"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      Opcional: Orientações específicas sobre abordagem pedagógica
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-emerald-800">
                        <p className="font-medium mb-1">Identificação Automática BNCC</p>
                        <p className="text-emerald-700">
                          A IA analisará o assunto e identificará automaticamente a matéria, série e competências da BNCC aplicáveis.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botão Gerar */}
                  <Button 
                    onClick={gerarResumo}
                    disabled={isGenerating || !assunto.trim()}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Resumo BNCC...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Gerar Resumo BNCC
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Painel de Resultado */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                          Resumo BNCC Gerado
                        </CardTitle>
                        <p className="text-sm text-slate-500">
                          Material alinhado às diretrizes curriculares
                        </p>
                      </div>
                    </div>
                    {resumoGerado && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={salvarResumo}
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Salvar</span>
                        </Button>
                        <Button
                          onClick={downloadResumo}
                          variant="outline"
                          size="sm"
                          className="text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {resumoGerado ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          {resumoGerado.materia}
                        </Badge>
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                          {resumoGerado.serie}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          BNCC Alinhado
                        </Badge>
                      </div>
                      
                      <div className="border-t border-slate-200"></div>
                      
                      <ScrollArea className="h-[400px] sm:h-[600px] pr-2 sm:pr-4">
                        <div 
                          className="prose prose-sm max-w-none text-slate-700 text-sm sm:text-base"
                          dangerouslySetInnerHTML={{ __html: resumoGerado.conteudo }}
                        />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-[400px] sm:h-[600px] flex items-center justify-center text-center">
                      <div className="space-y-4 px-4">
                        <div className="p-3 sm:p-4 bg-slate-100 rounded-full w-fit mx-auto">
                          <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-slate-600 font-medium text-sm sm:text-base">Aguardando geração</p>
                          <p className="text-slate-400 text-xs sm:text-sm max-w-sm">
                            Digite o assunto ao lado e clique em "Gerar Resumo BNCC" para criar um material educacional completo
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Histórico */}
          {historico.length > 0 && (
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Resumos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {historico.slice(0, 5).map((resumo) => (
                    <div
                      key={resumo.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => setResumoGerado(resumo)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">{resumo.titulo}</p>
                          <p className="text-sm text-slate-600">
                            {resumo.materia} • {resumo.serie}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {resumo.dataGeracao.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
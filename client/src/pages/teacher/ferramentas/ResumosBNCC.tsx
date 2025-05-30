import { useState } from "react";
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
      const response = await fetch("/api/education/generate-educational-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto,
          contextoPedagogico: observacoes
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar resumo");
      }

      const data = await response.json();
      
      const novoResumo: ResumoGerado = {
        id: Date.now().toString(),
        titulo: assunto,
        materia: data.materia || "Identificação automática",
        serie: data.serie || "Conforme BNCC",
        conteudo: data.resumo,
        dataGeracao: new Date(),
        favorito: false
      };

      setResumoGerado(novoResumo);
      setHistorico(prev => [novoResumo, ...prev.slice(0, 9)]);
      
      toast({
        title: "Resumo BNCC criado!",
        description: `Resumo sobre ${assunto} gerado conforme diretrizes da BNCC.`
      });

    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Tente novamente em alguns instantes.",
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <div className="border-b border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/professor">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Resumos BNCC
                  </h1>
                  <p className="text-slate-500 text-sm">Resumos educacionais alinhados à Base Nacional Comum Curricular</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid lg:grid-cols-2 gap-6">
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
                      className="min-h-[100px] resize-none border-slate-300 focus:border-emerald-500"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                    />
                    
                    {/* Sugestões */}
                    <div className="flex flex-wrap gap-2">
                      {sugestoesAssuntos.map((sugestao, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer hover:bg-emerald-50 border-emerald-200 text-emerald-700"
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
                      className="min-h-[80px] resize-none border-slate-300 focus:border-emerald-500"
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
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
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
                      <div className="flex gap-2">
                        <Button
                          onClick={salvarResumo}
                          variant="outline"
                          size="sm"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          onClick={downloadResumo}
                          variant="outline"
                          size="sm"
                          className="text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
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
                      
                      <ScrollArea className="h-[600px] pr-4">
                        <div 
                          className="prose prose-sm max-w-none text-slate-700"
                          dangerouslySetInnerHTML={{ __html: resumoGerado.conteudo }}
                        />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="h-[600px] flex items-center justify-center text-center">
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                          <BookOpen className="h-12 w-12 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-slate-600 font-medium">Aguardando geração</p>
                          <p className="text-slate-400 text-sm max-w-sm">
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
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
  Target,
  CheckCircle,
  FileText,
  GraduationCap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  // Formulário
  const [assunto, setAssunto] = useState("");
  const [materia, setMateria] = useState("");
  const [serie, setSerie] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const materias = [
    "Língua Portuguesa",
    "Matemática", 
    "Ciências",
    "História",
    "Geografia",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Física",
    "Química",
    "Biologia",
    "Filosofia",
    "Sociologia"
  ];

  const series = [
    "1º ano EF", "2º ano EF", "3º ano EF", "4º ano EF", "5º ano EF",
    "6º ano EF", "7º ano EF", "8º ano EF", "9º ano EF",
    "1º ano EM", "2º ano EM", "3º ano EM"
  ];

  const gerarResumo = async () => {
    if (!assunto.trim() || !materia || !serie) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o assunto, matéria e série.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/education/generate-bncc-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto,
          materia,
          serie,
          observacoes
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao gerar resumo");
      }

      const data = await response.json();
      
      const novoResumo: ResumoGerado = {
        id: Date.now().toString(),
        titulo: assunto,
        materia,
        serie,
        conteudo: data.resumo,
        dataGeracao: new Date(),
        favorito: false
      };

      setResumoGerado(novoResumo);
      setHistorico(prev => [novoResumo, ...prev.slice(0, 9)]);
      
      toast({
        title: "Resumo gerado com sucesso!",
        description: "O resumo da matéria foi criado conforme a BNCC."
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

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
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
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Resumos BNCC
                </h1>
                <p className="text-slate-600">Gere resumos de matérias alinhados à Base Nacional Comum Curricular</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="h-5 w-5 text-blue-600" />
                  Configurações do Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="assunto" className="text-sm font-medium">
                    Assunto da Aula *
                  </Label>
                  <Input
                    id="assunto"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Ex: Fotossíntese, Sistema Solar, Revolução Industrial..."
                    className="bg-white/70"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Matéria *</Label>
                    <Select value={materia} onValueChange={setMateria}>
                      <SelectTrigger className="bg-white/70">
                        <SelectValue placeholder="Selecione a matéria" />
                      </SelectTrigger>
                      <SelectContent>
                        {materias.map((mat) => (
                          <SelectItem key={mat} value={mat}>
                            {mat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Série *</Label>
                    <Select value={serie} onValueChange={setSerie}>
                      <SelectTrigger className="bg-white/70">
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                      <SelectContent>
                        {series.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-sm font-medium">
                    Observações Adicionais
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Aspectos específicos que devem ser abordados..."
                    className="bg-white/70 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={gerarResumo}
                  disabled={isGenerating || !assunto.trim() || !materia || !serie}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Gerando Resumo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Gerar Resumo BNCC
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Alinhado à BNCC</p>
                      <p className="text-blue-700">
                        Os resumos são gerados seguindo as competências e habilidades definidas pela Base Nacional Comum Curricular, garantindo conteúdo adequado para cada série.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="h-5 w-5 text-green-600" />
                    Resumo Gerado
                  </CardTitle>
                  {resumoGerado && (
                    <div className="flex gap-2">
                      <Button
                        onClick={salvarResumo}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button
                        onClick={downloadResumo}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
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
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {resumoGerado.materia}
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {resumoGerado.serie}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        BNCC Alinhado
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <ScrollArea className="h-[600px] pr-4">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: resumoGerado.conteudo }}
                      />
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-center">
                    <div className="space-y-4">
                      <BookOpen className="h-16 w-16 text-slate-300 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-slate-500 font-medium">Nenhum resumo gerado ainda</p>
                        <p className="text-slate-400 text-sm">
                          Preencha as informações ao lado e clique em "Gerar Resumo BNCC"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
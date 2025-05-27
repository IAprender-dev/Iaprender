import { useState } from "react";
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
  Plus
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
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [duracao, setDuracao] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [planoGerado, setPlanoGerado] = useState<any>(null);

  // Sugestões de temas por disciplina
  const sugestoesTemas = {
    "Matemática": [
      "Frações e operações básicas",
      "Geometria plana e espacial",
      "Equações do primeiro grau",
      "Porcentagem e regra de três"
    ],
    "Português": [
      "Interpretação de textos narrativos",
      "Figuras de linguagem",
      "Produção textual criativa",
      "Análise de poemas"
    ],
    "Ciências": [
      "Sistema solar",
      "Ciclo da água",
      "Corpo humano",
      "Ecossistemas"
    ],
    "História": [
      "Brasil colonial",
      "Civilizações antigas",
      "Era Vargas",
      "Segunda Guerra Mundial"
    ],
    "Geografia": [
      "Regiões brasileiras",
      "Mudanças climáticas",
      "Urbanização",
      "Globalização"
    ]
  };

  const gerarPlanoAula = async () => {
    if (!tema.trim() || !disciplina || !serie || !duracao) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para gerar o plano de aula.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Simular chamada à API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const planoMock = {
        titulo: tema,
        disciplina,
        serie,
        duracao,
        objetivos: [
          "Compreender os conceitos fundamentais do tema proposto",
          "Desenvolver habilidades de análise crítica",
          "Aplicar conhecimentos em situações práticas",
          "Estabelecer conexões com o cotidiano"
        ],
        conteudo: [
          "Introdução ao tema e contextualização",
          "Desenvolvimento teórico dos conceitos",
          "Exemplos práticos e aplicações",
          "Atividades de fixação",
          "Conclusão e síntese"
        ],
        metodologia: "Aula expositiva dialogada com momentos de interação, uso de exemplos práticos e atividades em grupo para consolidação do aprendizado.",
        recursos: [
          "Quadro/lousa",
          "Projetor",
          "Material impresso",
          "Recursos digitais"
        ],
        avaliacao: "Observação da participação dos alunos, atividades práticas realizadas em sala e verificação da compreensão através de questionamentos.",
        dataGeracao: new Date().toLocaleDateString('pt-BR')
      };

      setPlanoGerado(planoMock);
      
      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu plano de aula está pronto para uso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar plano",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSugestoesPorDisciplina = () => {
    return disciplina && disciplina in sugestoesTemas 
      ? sugestoesTemas[disciplina as keyof typeof sugestoesTemas] 
      : [];
  };

  return (
    <>
      <Helmet>
        <title>Planejamento de Aula - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/professor/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-blue-600">
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
                  <p className="text-sm text-slate-600">Crie planos de aula personalizados com IA</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Geração */}
            <div className="space-y-6">
              {/* Formulário Principal */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Criar Novo Plano
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tema */}
                  <div className="space-y-2">
                    <Label htmlFor="tema" className="text-sm font-medium text-slate-700">
                      Tema da Aula
                    </Label>
                    <Textarea 
                      id="tema"
                      placeholder="Ex: Equações do primeiro grau e suas aplicações no cotidiano"
                      className="min-h-[80px] border-slate-200 focus:border-blue-400 focus:ring-blue-400/20"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                    />
                  </div>

                  {/* Disciplina e Série */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Disciplina</Label>
                      <Select value={disciplina} onValueChange={setDisciplina}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-400">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Matemática">Matemática</SelectItem>
                          <SelectItem value="Português">Português</SelectItem>
                          <SelectItem value="Ciências">Ciências</SelectItem>
                          <SelectItem value="História">História</SelectItem>
                          <SelectItem value="Geografia">Geografia</SelectItem>
                          <SelectItem value="Física">Física</SelectItem>
                          <SelectItem value="Química">Química</SelectItem>
                          <SelectItem value="Biologia">Biologia</SelectItem>
                          <SelectItem value="Arte">Arte</SelectItem>
                          <SelectItem value="Inglês">Inglês</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Ano/Série</Label>
                      <Select value={serie} onValueChange={setSerie}>
                        <SelectTrigger className="border-slate-200 focus:border-blue-400">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6º Ano">6º Ano</SelectItem>
                          <SelectItem value="7º Ano">7º Ano</SelectItem>
                          <SelectItem value="8º Ano">8º Ano</SelectItem>
                          <SelectItem value="9º Ano">9º Ano</SelectItem>
                          <SelectItem value="1º Ano EM">1º Ano - Ensino Médio</SelectItem>
                          <SelectItem value="2º Ano EM">2º Ano - Ensino Médio</SelectItem>
                          <SelectItem value="3º Ano EM">3º Ano - Ensino Médio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Duração */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Duração da Aula</Label>
                    <Select value={duracao} onValueChange={setDuracao}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Selecione a duração" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="45 minutos">45 minutos</SelectItem>
                        <SelectItem value="50 minutos">50 minutos</SelectItem>
                        <SelectItem value="90 minutos">90 minutos (aula dupla)</SelectItem>
                        <SelectItem value="2 aulas">2 aulas (sequência)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Botão Gerar */}
                  <Button 
                    onClick={gerarPlanoAula}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Plano...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Plano de Aula
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Sugestões de Temas */}
              {getSugestoesPorDisciplina().length > 0 && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Sugestões de Temas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {getSugestoesPorDisciplina().map((sugestao, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                          onClick={() => setTema(sugestao)}
                        >
                          {sugestao}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Resultado */}
            <div className="space-y-6">
              {!planoGerado ? (
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-full flex items-center justify-center min-h-[500px]">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Pronto para criar seu plano?
                    </h3>
                    <p className="text-slate-600 max-w-sm">
                      Preencha as informações ao lado e nossa IA irá gerar um plano de aula completo e personalizado para você.
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Plano Gerado
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Save className="h-4 w-4" />
                          Salvar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{planoGerado.disciplina}</Badge>
                      <Badge variant="secondary">{planoGerado.serie}</Badge>
                      <Badge variant="secondary">{planoGerado.duracao}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Título */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Título da Aula</h3>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{planoGerado.titulo}</p>
                    </div>

                    {/* Objetivos */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Objetivos de Aprendizagem
                      </h3>
                      <ul className="space-y-2">
                        {planoGerado.objetivos.map((objetivo: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{objetivo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Conteúdo */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        Conteúdo da Aula
                      </h3>
                      <ol className="space-y-2">
                        {planoGerado.conteudo.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                              {index + 1}
                            </span>
                            <span className="text-slate-700">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Metodologia */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        Metodologia
                      </h3>
                      <p className="text-slate-700 bg-green-50 p-3 rounded-lg">{planoGerado.metodologia}</p>
                    </div>

                    {/* Recursos */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Recursos Necessários</h3>
                      <div className="flex flex-wrap gap-2">
                        {planoGerado.recursos.map((recurso: string, index: number) => (
                          <Badge key={index} variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                            {recurso}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Avaliação */}
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Avaliação</h3>
                      <p className="text-slate-700 bg-purple-50 p-3 rounded-lg">{planoGerado.avaliacao}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
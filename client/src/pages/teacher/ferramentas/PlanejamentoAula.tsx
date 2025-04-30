import { useState } from "react";
import { ClipboardList, FileText, Lightbulb, Loader2, CheckCircle2, Filter, Target, Calendar, Clock, Hourglass, BookOpen, GraduationCap, PenTool, List, Download, CalendarDays } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface PlanoAula {
  id: string;
  titulo: string;
  disciplina: string;
  serie: string;
  objetivos: string;
  conteudo: string;
  metodologia: string;
  recursos: string[];
  avaliacao: string;
  tempoPrevisto: string;
  dataGeracao: Date;
}

export default function PlanejamentoAula() {
  const { toast } = useToast();
  
  // Estados para os parâmetros da geração
  const [tema, setTema] = useState("");
  const [disciplina, setDisciplina] = useState("matematica");
  const [serie, setSerie] = useState("6ano");
  const [abordagem, setAbordagem] = useState("tradicional");
  const [tempoPrevisto, setTempoPrevisto] = useState("50min");
  const [incluirObjetivos, setIncluirObjetivos] = useState(true);
  const [incluirRecursos, setIncluirRecursos] = useState(true);
  const [incluirAvaliacao, setIncluirAvaliacao] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados para os planos gerados
  const [planosGerados, setPlanosGerados] = useState<PlanoAula[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoAula | null>(null);
  
  // Sugestões de temas para inspiração
  const sugestoesTemas = {
    matematica: [
      "Frações e operações básicas",
      "Geometria: perímetro e área de figuras planas",
      "Equações do primeiro grau",
      "Estatística básica e interpretação de gráficos"
    ],
    portugues: [
      "Análise e interpretação de poemas",
      "Gêneros textuais: notícia e reportagem",
      "Figuras de linguagem: metáfora e comparação",
      "Produção textual: narrativa de aventura"
    ],
    ciencias: [
      "Sistema solar e seus componentes",
      "Ciclo da água e sua importância",
      "Célula animal e vegetal",
      "Cadeia alimentar e ecossistemas"
    ],
    historia: [
      "Civilizações antigas: Grécia e Roma",
      "Período colonial brasileiro",
      "Revolução Industrial e suas consequências",
      "Segunda Guerra Mundial: causas e impactos"
    ],
    geografia: [
      "Regiões brasileiras e suas características",
      "Fenômenos climáticos globais",
      "Globalização e comércio internacional",
      "Urbanização e desenvolvimento sustentável"
    ]
  };
  
  // Função para obter sugestões de temas baseados na disciplina selecionada
  const getSugestoesTemas = () => {
    return disciplina in sugestoesTemas ? sugestoesTemas[disciplina as keyof typeof sugestoesTemas] : [];
  };
  
  // Mapeamentos para valores legíveis
  const disciplinaParaTexto = (disc: string) => {
    const mapeamento: {[key: string]: string} = {
      matematica: "Matemática",
      portugues: "Português",
      ciencias: "Ciências",
      historia: "História",
      geografia: "Geografia"
    };
    return mapeamento[disc] || disc;
  };
  
  const serieParaTexto = (ser: string) => {
    const mapeamento: {[key: string]: string} = {
      "6ano": "6º Ano - Ensino Fundamental",
      "7ano": "7º Ano - Ensino Fundamental",
      "8ano": "8º Ano - Ensino Fundamental",
      "9ano": "9º Ano - Ensino Fundamental",
      "1em": "1º Ano - Ensino Médio",
      "2em": "2º Ano - Ensino Médio",
      "3em": "3º Ano - Ensino Médio"
    };
    return mapeamento[ser] || ser;
  };
  
  const abordagemParaTexto = (abord: string) => {
    const mapeamento: {[key: string]: string} = {
      tradicional: "Metodologia Tradicional",
      ativa: "Metodologia Ativa",
      projetos: "Aprendizagem por Projetos",
      problemas: "Aprendizagem Baseada em Problemas",
      investigativa: "Aprendizagem Investigativa"
    };
    return mapeamento[abord] || abord;
  };
  
  // Mock de função para gerar plano de aula
  const gerarPlanoAula = async () => {
    if (!tema.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, informe o tema da aula.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Aqui seria a chamada para a API
      // Simulando delay de processamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta
      const recursos = [
        "Quadro/lousa", 
        "Projetor/slides", 
        "Material impresso",
        "Livro didático"
      ];
      
      if (Math.random() > 0.5) recursos.push("Recursos digitais interativos");
      if (Math.random() > 0.7) recursos.push("Vídeos educativos");
      
      const novoPlano: PlanoAula = {
        id: `plano-${Date.now()}`,
        titulo: `Plano de Aula: ${tema}`,
        disciplina: disciplinaParaTexto(disciplina),
        serie: serieParaTexto(serie),
        objetivos: "• Compreender os conceitos fundamentais relacionados ao tema\n• Desenvolver habilidades de análise e interpretação\n• Aplicar os conhecimentos em situações práticas\n• Estabelecer relações entre o conteúdo e o cotidiano",
        conteudo: `1. Introdução ao tema "${tema}"\n2. Contextualização histórica e relevância\n3. Conceitos fundamentais\n4. Aplicações práticas\n5. Exercícios de fixação`,
        metodologia: `A aula será ministrada utilizando a abordagem ${abordagemParaTexto(abordagem).toLowerCase()}, com momentos de exposição dialogada, atividades em grupo e resolução de problemas. Serão utilizados exemplos contextualizados para facilitar a compreensão dos alunos.`,
        recursos: recursos,
        avaliacao: "A avaliação será processual, observando a participação dos alunos durante as atividades propostas. Será aplicada também uma atividade avaliativa ao final da aula para verificar a compreensão dos conceitos trabalhados.",
        tempoPrevisto: tempoPrevisto,
        dataGeracao: new Date()
      };
      
      setPlanosGerados(prev => [novoPlano, ...prev]);
      setPlanoSelecionado(novoPlano);
      
      toast({
        title: "Plano de aula gerado com sucesso",
        description: "Seu plano de aula foi criado e está pronto para uso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar plano",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para exportar plano
  const exportarPlano = () => {
    if (!planoSelecionado) return;
    
    toast({
      title: "Plano exportado",
      description: "O plano de aula foi exportado com sucesso.",
    });
  };

  return (
    <FerramentaLayout
      title="Planejamento de Aula"
      description="Crie planos de aula personalizados com objetivos, metodologias e recursos"
      icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
      helpText="Especifique o tema, disciplina, série e abordagem metodológica para criar um plano de aula personalizado. O sistema irá gerar automaticamente objetivos, conteúdos, metodologias e propostas de avaliação."
    >
      <Tabs defaultValue="gerar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="gerar" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Plano de Aula
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Biblioteca de Planos ({planosGerados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Painel de parâmetros */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="tema" className="text-base font-medium">Tema da aula</Label>
                <Textarea 
                  id="tema"
                  placeholder="Ex: Equações do primeiro grau e suas aplicações práticas"
                  className="min-h-[80px]"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                />
                
                {getSugestoesTemas().length > 0 && (
                  <div className="text-sm">
                    <p className="text-neutral-500 font-medium mb-1">Sugestões de temas:</p>
                    <div className="flex flex-wrap gap-2">
                      {getSugestoesTemas().map((sugestao, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className="cursor-pointer hover:bg-blue-50"
                          onClick={() => setTema(sugestao)}
                        >
                          {sugestao}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disciplina" className="text-sm">Disciplina</Label>
                  <Select value={disciplina} onValueChange={setDisciplina}>
                    <SelectTrigger id="disciplina">
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matematica">Matemática</SelectItem>
                      <SelectItem value="portugues">Português</SelectItem>
                      <SelectItem value="ciencias">Ciências</SelectItem>
                      <SelectItem value="historia">História</SelectItem>
                      <SelectItem value="geografia">Geografia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serie" className="text-sm">Série/Ano</Label>
                  <Select value={serie} onValueChange={setSerie}>
                    <SelectTrigger id="serie">
                      <SelectValue placeholder="Selecione a série" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6ano">6º Ano</SelectItem>
                      <SelectItem value="7ano">7º Ano</SelectItem>
                      <SelectItem value="8ano">8º Ano</SelectItem>
                      <SelectItem value="9ano">9º Ano</SelectItem>
                      <SelectItem value="1em">1º Ano - EM</SelectItem>
                      <SelectItem value="2em">2º Ano - EM</SelectItem>
                      <SelectItem value="3em">3º Ano - EM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="abordagem" className="text-sm">Abordagem Metodológica</Label>
                <RadioGroup value={abordagem} onValueChange={setAbordagem} className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tradicional" id="tradicional" />
                    <Label htmlFor="tradicional" className="text-sm font-normal">Tradicional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ativa" id="ativa" />
                    <Label htmlFor="ativa" className="text-sm font-normal">Metodologia Ativa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="projetos" id="projetos" />
                    <Label htmlFor="projetos" className="text-sm font-normal">Aprendizagem por Projetos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="problemas" id="problemas" />
                    <Label htmlFor="problemas" className="text-sm font-normal">Baseada em Problemas</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempoPrevisto" className="text-sm">Tempo previsto</Label>
                <Select value={tempoPrevisto} onValueChange={setTempoPrevisto}>
                  <SelectTrigger id="tempoPrevisto">
                    <SelectValue placeholder="Selecione o tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50min">50 minutos (1 aula)</SelectItem>
                    <SelectItem value="100min">100 minutos (2 aulas)</SelectItem>
                    <SelectItem value="150min">150 minutos (3 aulas)</SelectItem>
                    <SelectItem value="semana">Semana completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Accordion type="single" collapsible className="border rounded-md">
                <AccordionItem value="opcoes-avancadas">
                  <AccordionTrigger className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Opções avançadas
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="incluirObjetivos" 
                        checked={incluirObjetivos} 
                        onCheckedChange={setIncluirObjetivos}
                      />
                      <Label htmlFor="incluirObjetivos" className="text-sm">Incluir objetivos de aprendizagem</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="incluirRecursos" 
                        checked={incluirRecursos} 
                        onCheckedChange={setIncluirRecursos}
                      />
                      <Label htmlFor="incluirRecursos" className="text-sm">Incluir recursos didáticos</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="incluirAvaliacao" 
                        checked={incluirAvaliacao} 
                        onCheckedChange={setIncluirAvaliacao}
                      />
                      <Label htmlFor="incluirAvaliacao" className="text-sm">Incluir proposta de avaliação</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button 
                className="w-full" 
                size="lg"
                onClick={gerarPlanoAula}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando plano de aula...
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Gerar plano de aula
                  </>
                )}
              </Button>
            </div>
            
            {/* Painel de visualização */}
            <div className="space-y-6">
              {planoSelecionado ? (
                <Card className="border border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className="mb-2">{planoSelecionado.disciplina}</Badge>
                      <Badge variant="outline">{planoSelecionado.serie}</Badge>
                    </div>
                    <CardTitle className="text-xl">{planoSelecionado.titulo}</CardTitle>
                    <CardDescription>
                      Gerado em {planoSelecionado.dataGeracao.toLocaleDateString()} • {abordagemParaTexto(abordagem)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <Target className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Objetivos de Aprendizagem</h3>
                      </div>
                      <div className="whitespace-pre-line text-sm text-neutral-700 pl-6">
                        {planoSelecionado.objetivos}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Conteúdo Programático</h3>
                      </div>
                      <div className="whitespace-pre-line text-sm text-neutral-700 pl-6">
                        {planoSelecionado.conteudo}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <GraduationCap className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Metodologia</h3>
                      </div>
                      <div className="text-sm text-neutral-700 pl-6">
                        {planoSelecionado.metodologia}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <List className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Recursos Didáticos</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-6">
                        {planoSelecionado.recursos.map((recurso, index) => (
                          <Badge key={index} variant="secondary">{recurso}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <PenTool className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Avaliação</h3>
                      </div>
                      <div className="text-sm text-neutral-700 pl-6">
                        {planoSelecionado.avaliacao}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="h-4 w-4 text-blue-600 mr-2" />
                        <h3 className="text-sm font-semibold text-neutral-900">Tempo Previsto</h3>
                      </div>
                      <div className="text-sm text-neutral-700 pl-6">
                        {planoSelecionado.tempoPrevisto === "50min" ? "50 minutos (1 aula)" :
                         planoSelecionado.tempoPrevisto === "100min" ? "100 minutos (2 aulas)" :
                         planoSelecionado.tempoPrevisto === "150min" ? "150 minutos (3 aulas)" :
                         "Semana completa"}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2 border-t">
                    <Button variant="ghost" size="sm">
                      <PenTool className="mr-1 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPlano}>
                      <Download className="mr-1 h-4 w-4" />
                      Exportar
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-8 text-center">
                  <Lightbulb className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 mb-2">Como criar planos eficazes</h3>
                  <div className="text-sm text-neutral-600 max-w-md space-y-4">
                    <p>
                      Um bom plano de aula é fundamental para o sucesso do processo de ensino e aprendizagem. Ele serve como um guia para o professor e garante que os objetivos sejam alcançados.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Defina <strong>objetivos claros e mensuráveis</strong> para cada aula</span>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Escolha <strong>metodologias adequadas</strong> ao perfil dos alunos</span>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Diversifique os <strong>recursos didáticos</strong> para engajar os alunos</span>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Preveja <strong>momentos de avaliação</strong> ao longo da aula</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="biblioteca">
          {planosGerados.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {planosGerados.map((plano) => (
                <Card 
                  key={plano.id} 
                  className={`border cursor-pointer transition-all ${planoSelecionado?.id === plano.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200 hover:border-blue-200'}`}
                  onClick={() => setPlanoSelecionado(plano)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <Badge>{plano.disciplina}</Badge>
                      <Badge variant="outline" className="text-xs">{plano.serie.split(" - ")[0]}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2 leading-tight">{plano.titulo}</CardTitle>
                    <CardDescription className="flex items-center text-xs mt-1">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      {plano.dataGeracao.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {plano.tempoPrevisto === "50min" ? "1 aula" :
                         plano.tempoPrevisto === "100min" ? "2 aulas" :
                         plano.tempoPrevisto === "150min" ? "3 aulas" :
                         "Semana"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {abordagemParaTexto(abordagem).split(" ")[1] || "Tradicional"}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t flex justify-between">
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2">
                      <PenTool className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2">
                      <Download className="h-3 w-3 mr-1" />
                      Exportar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <ClipboardList className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Biblioteca vazia</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Você ainda não criou nenhum plano de aula. Gere seu primeiro plano na aba "Gerar Plano de Aula".
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="gerar"]') as HTMLElement;
                if (element) element.click();
              }}>
                Criar primeiro plano
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FerramentaLayout>
  );
}
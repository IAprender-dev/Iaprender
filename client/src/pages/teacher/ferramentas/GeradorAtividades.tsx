import { useState } from "react";
import { FileEdit, Download, Copy, Printer, Loader2, BookOpen, Lightbulb, Target, Settings, RefreshCw, Filter } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AtividadeGerada {
  id: string;
  titulo: string;
  materia: string;
  serie: string;
  conteudo: string;
  tipoAtividade: string;
  dataGeracao: Date;
}

export default function GeradorAtividades() {
  const { toast } = useToast();

  // Estados para os parâmetros da geração
  const [tema, setTema] = useState("");
  const [materia, setMateria] = useState("matematica");
  const [serie, setSerie] = useState("6ano");
  const [tipoAtividade, setTipoAtividade] = useState("exercicios");
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState([10]);
  const [nivelDificuldade, setNivelDificuldade] = useState("medio");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para as atividades geradas
  const [atividadesGeradas, setAtividadesGeradas] = useState<AtividadeGerada[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<AtividadeGerada | null>(null);

  // Lista de temas sugeridos por matéria
  const temasSugeridos = {
    matematica: ["Frações e números decimais", "Geometria - áreas e perímetros", "Equações do 1º grau", "Estatística básica"],
    portugues: ["Interpretação de texto", "Figuras de linguagem", "Gêneros textuais", "Concordância verbal e nominal"],
    ciencias: ["Sistema solar", "Corpo humano - sistemas", "Cadeia alimentar", "Estados físicos da matéria"],
    historia: ["Civilizações antigas", "Brasil Colônia", "Revolução Industrial", "Segunda Guerra Mundial"],
    geografia: ["Clima e vegetação", "Relevo e hidrografia", "Países e capitais", "Globalização"]
  };

  // Função auxiliar para pegar temas sugeridos da matéria selecionada
  const getTemasSugeridos = () => {
    const temas = temasSugeridos[materia as keyof typeof temasSugeridos] || [];
    return temas;
  };

  // Mock de função para gerar atividade
  const gerarAtividade = async () => {
    if (!tema.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, informe o tema da atividade que deseja criar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aqui seria a chamada para a API que gera atividades
      // Simulando delay de processamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta
      const novaAtividade: AtividadeGerada = {
        id: `ativ-${Date.now()}`,
        titulo: `Atividade de ${materiaParaTexto(materia)} - ${tema}`,
        materia: materiaParaTexto(materia),
        serie: serieParaTexto(serie),
        conteudo: mockConteudo(),
        tipoAtividade: tipoAtividadeParaTexto(tipoAtividade),
        dataGeracao: new Date()
      };
      
      setAtividadesGeradas(prev => [novaAtividade, ...prev]);
      setAtividadeSelecionada(novaAtividade);
      
      toast({
        title: "Atividade gerada com sucesso",
        description: "Sua atividade educacional foi criada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar atividade",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de conversão de valores para texto legível
  const materiaParaTexto = (mat: string) => {
    const mapeamento: {[key: string]: string} = {
      matematica: "Matemática",
      portugues: "Português",
      ciencias: "Ciências",
      historia: "História",
      geografia: "Geografia"
    };
    return mapeamento[mat] || mat;
  };

  const serieParaTexto = (ser: string) => {
    const mapeamento: {[key: string]: string} = {
      "6ano": "6º Ano",
      "7ano": "7º Ano",
      "8ano": "8º Ano",
      "9ano": "9º Ano",
      "1em": "1º Ensino Médio",
      "2em": "2º Ensino Médio",
      "3em": "3º Ensino Médio"
    };
    return mapeamento[ser] || ser;
  };

  const tipoAtividadeParaTexto = (tipo: string) => {
    const mapeamento: {[key: string]: string} = {
      exercicios: "Lista de Exercícios",
      avaliacao: "Avaliação/Prova",
      trabalho: "Trabalho em Grupo",
      projeto: "Projeto Educacional",
      questionario: "Questionário"
    };
    return mapeamento[tipo] || tipo;
  };

  // Mock de dados para simulação
  const mockConteudo = () => {
    return `<div class="activity-content">
      <h1>${tema}</h1>
      <p>Disciplina: ${materiaParaTexto(materia)}</p>
      <p>Série: ${serieParaTexto(serie)}</p>
      <p>Tipo: ${tipoAtividadeParaTexto(tipoAtividade)}</p>
      
      <div class="instructions">
        <p>Instruções: Responda as questões abaixo com base no conteúdo estudado em sala de aula.</p>
      </div>
      
      <div class="questions">
        <ol>
          ${Array(quantidadeQuestoes[0]).fill(0).map((_, i) => `
            <li>
              <p>Questão ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?</p>
              <ul style="list-style-type: lower-alpha;">
                <li>Alternativa 1</li>
                <li>Alternativa 2</li>
                <li>Alternativa 3</li>
                <li>Alternativa 4</li>
              </ul>
            </li>
          `).join('')}
        </ol>
      </div>
      
      ${incluirGabarito ? `
        <div class="answer-key">
          <h3>Gabarito</h3>
          <ul>
            ${Array(quantidadeQuestoes[0]).fill(0).map((_, i) => `
              <li>Questão ${i + 1}: ${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}
    </div>`;
  };

  const copiarParaClipboard = () => {
    if (atividadeSelecionada) {
      navigator.clipboard.writeText(atividadeSelecionada.conteudo);
      toast({
        title: "Conteúdo copiado",
        description: "O conteúdo da atividade foi copiado para a área de transferência.",
      });
    }
  };

  return (
    <FerramentaLayout
      title="Gerador de Atividades"
      description="Crie atividades, exercícios e avaliações personalizadas para suas aulas"
      icon={<FileEdit className="h-6 w-6 text-blue-600" />}
      helpText="Especifique o tema, matéria, série e tipo de atividade desejada. O sistema irá gerar automaticamente questões, exercícios ou atividades baseadas em seus critérios."
    >
      <Tabs defaultValue="criar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="criar" className="text-sm">
            <FileEdit className="h-4 w-4 mr-2" />
            Criar Nova Atividade
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Atividades Geradas ({atividadesGeradas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Painel principal de parâmetros */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label htmlFor="tema" className="text-base font-medium">Tema da atividade</Label>
                  <div className="text-xs text-neutral-500 hover:underline cursor-pointer" onClick={() => setTema(getTemasSugeridos()[0])}>
                    Sugerir tema
                  </div>
                </div>
                <Textarea 
                  id="tema"
                  placeholder="Ex: Frações e operações com números decimais"
                  className="min-h-[80px]"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                />
                
                {getTemasSugeridos().length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTemasSugeridos().map((tema, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => setTema(tema)}
                      >
                        {tema}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materia" className="text-sm">Matéria</Label>
                  <Select value={materia} onValueChange={setMateria}>
                    <SelectTrigger id="materia">
                      <SelectValue placeholder="Selecione a matéria" />
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
                      <SelectItem value="1em">1º Ensino Médio</SelectItem>
                      <SelectItem value="2em">2º Ensino Médio</SelectItem>
                      <SelectItem value="3em">3º Ensino Médio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm">Tipo de atividade</Label>
                <RadioGroup value={tipoAtividade} onValueChange={setTipoAtividade} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="exercicios" id="exercicios" />
                    <Label htmlFor="exercicios" className="text-sm font-normal">Lista de Exercícios</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="avaliacao" id="avaliacao" />
                    <Label htmlFor="avaliacao" className="text-sm font-normal">Avaliação/Prova</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trabalho" id="trabalho" />
                    <Label htmlFor="trabalho" className="text-sm font-normal">Trabalho em Grupo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="questionario" id="questionario" />
                    <Label htmlFor="questionario" className="text-sm font-normal">Questionário</Label>
                  </div>
                </RadioGroup>
              </div>

              <Accordion type="single" collapsible className="border rounded-md">
                <AccordionItem value="opcoes-avancadas">
                  <AccordionTrigger className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Opções avançadas
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="quantidadeQuestoes" className="text-sm">Quantidade de questões</Label>
                        <span className="text-sm text-neutral-500">{quantidadeQuestoes}</span>
                      </div>
                      <Slider 
                        id="quantidadeQuestoes"
                        value={quantidadeQuestoes} 
                        onValueChange={setQuantidadeQuestoes} 
                        max={30} 
                        min={1}
                        step={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nivelDificuldade" className="text-sm">Nível de dificuldade</Label>
                      <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                        <SelectTrigger id="nivelDificuldade">
                          <SelectValue placeholder="Selecione a dificuldade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facil">Fácil</SelectItem>
                          <SelectItem value="medio">Médio</SelectItem>
                          <SelectItem value="dificil">Difícil</SelectItem>
                          <SelectItem value="misto">Misto (variado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="incluirGabarito" 
                        checked={incluirGabarito} 
                        onCheckedChange={setIncluirGabarito}
                      />
                      <Label htmlFor="incluirGabarito" className="text-sm">Incluir gabarito</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button 
                className="w-full" 
                size="lg"
                onClick={gerarAtividade}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando atividade...
                  </>
                ) : (
                  <>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Gerar atividade
                  </>
                )}
              </Button>
            </div>
            
            {/* Painel de visualização e dicas */}
            <div className="space-y-6">
              {atividadeSelecionada ? (
                <Card className="border border-neutral-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{atividadeSelecionada.titulo}</CardTitle>
                    <CardDescription>
                      {atividadeSelecionada.materia} • {atividadeSelecionada.serie} • {atividadeSelecionada.tipoAtividade}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="border-t border-neutral-100 pt-4">
                    <div
                      className="prose prose-sm max-h-[400px] overflow-y-auto p-2"
                      dangerouslySetInnerHTML={{ __html: atividadeSelecionada.conteudo }}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-neutral-100 pt-3">
                    <Button variant="ghost" size="sm" onClick={copiarParaClipboard}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copiar
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Printer className="mr-1 h-4 w-4" />
                        Imprimir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-4 w-4" />
                        Exportar PDF
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-8 text-center">
                  <Lightbulb className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 mb-1">Dicas para melhores resultados</h3>
                  <div className="text-sm text-neutral-600 space-y-3 text-left max-w-md">
                    <p>
                      Ao criar suas atividades, considere:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Target className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Defina com clareza o objetivo de aprendizagem da atividade</span>
                      </li>
                      <li className="flex items-start">
                        <Filter className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Especifique o tema com detalhes para questões mais relevantes</span>
                      </li>
                      <li className="flex items-start">
                        <Settings className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Ajuste a dificuldade conforme as necessidades da turma</span>
                      </li>
                      <li className="flex items-start">
                        <RefreshCw className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Varie os tipos de atividade para manter o engajamento</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          {atividadesGeradas.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {atividadesGeradas.map((atividade) => (
                  <Card 
                    key={atividade.id} 
                    className={`border cursor-pointer transition-all ${atividadeSelecionada?.id === atividade.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200 hover:border-blue-200'}`}
                    onClick={() => setAtividadeSelecionada(atividade)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-tight">{atividade.titulo}</CardTitle>
                      <CardDescription className="text-xs">
                        Criado em {atividade.dataGeracao.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {atividade.materia}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {atividade.serie}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {atividade.tipoAtividade}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="ghost" size="sm" className="text-xs px-2 h-8">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <BookOpen className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhuma atividade gerada</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Você ainda não gerou nenhuma atividade. Crie sua primeira atividade na aba "Criar Nova Atividade".
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="criar"]') as HTMLElement;
                if (element) element.click();
              }}>
                Criar primeira atividade
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FerramentaLayout>
  );
}
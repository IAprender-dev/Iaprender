import { useState } from "react";
import { 
  FileEdit, 
  Download, 
  Copy, 
  Printer, 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  Target, 
  Settings, 
  RefreshCw, 
  Filter, 
  Dices,
  ListTodo,
  FileQuestion, 
  Users, 
  FileText,
  GraduationCap
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Modelo de dados para uma atividade gerada
 */
interface AtividadeGerada {
  id: string;
  titulo: string;
  materia: string;
  serie: string;
  conteudo: string;
  tipoAtividade: string;
  dataGeracao: Date;
  quantidadeQuestoes: number;
  nivelDificuldade: string;
  incluiGabarito: boolean;
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
        dataGeracao: new Date(),
        quantidadeQuestoes: quantidadeQuestoes[0],
        nivelDificuldade: nivelDificuldade,
        incluiGabarito: incluirGabarito
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
    return `<div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
      <header style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #3b82f6; padding-bottom: 1rem;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">${tema}</h1>
        <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
          <p><strong>Disciplina:</strong> ${materiaParaTexto(materia)}</p>
          <p><strong>Série:</strong> ${serieParaTexto(serie)}</p>
          <p><strong>Tipo:</strong> ${tipoAtividadeParaTexto(tipoAtividade)}</p>
        </div>
      </header>
      
      <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 2rem;">
        <p style="margin: 0; font-style: italic;">Instruções: Responda as questões abaixo com base no conteúdo estudado em sala de aula.</p>
      </div>
      
      <div class="questions">
        <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question;">
          ${Array(quantidadeQuestoes[0]).fill(0).map((_, i) => `
            <li style="margin-bottom: 1.5rem; counter-increment: question; position: relative;">
              <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1e3a8a;">
                Questão ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua?
              </div>
              <div style="background-color: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; margin-top: 0.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                    <span>Alternativa 1</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                    <span>Alternativa 2</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                    <span>Alternativa 3</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                    <span>Alternativa 4</span>
                  </div>
                </div>
              </div>
            </li>
          `).join('')}
        </ol>
      </div>
      
      ${incluirGabarito ? `
        <div class="answer-key" style="margin-top: 3rem; border-top: 2px solid #3b82f6; padding-top: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: bold; color: #1e3a8a; margin-bottom: 1rem;">Gabarito</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem;">
            ${Array(quantidadeQuestoes[0]).fill(0).map((_, i) => `
              <div style="display: flex; gap: 0.5rem; background-color: #f0f9ff; padding: 0.5rem; border-radius: 0.25rem;">
                <span style="font-weight: 500;">Questão ${i + 1}:</span>
                <span style="font-weight: bold; color: #1e3a8a;">${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <footer style="margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
        <p>Atividade gerada por iAula - ${new Date().toLocaleDateString()}</p>
      </footer>
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

  // Funções auxiliares para a interface
  const nivelDificuldadeParaTexto = (nivel: string) => {
    const mapeamento: {[key: string]: string} = {
      facil: "Fácil",
      medio: "Médio",
      dificil: "Difícil",
      misto: "Misto (variado)"
    };
    return mapeamento[nivel] || nivel;
  };
  
  // Função para fazer o download da atividade como PDF (mock)
  const downloadAtividade = () => {
    if (atividadeSelecionada) {
      toast({
        title: "Download iniciado",
        description: "Sua atividade está sendo salva como PDF.",
      });
    }
  };
  
  // Função para imprimir atividade
  const imprimirAtividade = () => {
    if (atividadeSelecionada) {
      window.print();
      toast({
        title: "Impressão iniciada",
        description: "Enviando atividade para impressora.",
      });
    }
  };
  
  // Ícones para tipos de atividade
  const iconeTipoAtividade = (tipo: string) => {
    switch (tipo) {
      case 'exercicios': return <ListTodo className="h-5 w-5" />;
      case 'avaliacao': return <FileText className="h-5 w-5" />;
      case 'trabalho': return <Users className="h-5 w-5" />;
      case 'questionario': return <FileQuestion className="h-5 w-5" />;
      default: return <FileEdit className="h-5 w-5" />;
    }
  };

  return (
    <FerramentaLayout
      title="Gerador de Atividades"
      description="Crie atividades, exercícios e avaliações personalizadas para suas aulas"
      icon={<FileEdit className="h-6 w-6 text-blue-600" />}
      helpText="Configure os parâmetros da atividade e nosso sistema utilizará Inteligência Artificial para gerar conteúdo educacional personalizado de acordo com suas necessidades."
    >
      <Tabs defaultValue="criar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="criar" className="text-sm font-medium">
            <FileEdit className="h-4 w-4 mr-2" />
            Criar Atividade
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-sm font-medium">
            <BookOpen className="h-4 w-4 mr-2" />
            Biblioteca ({atividadesGeradas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Painel de configuração - 5 colunas */}
            <div className="lg:col-span-5 space-y-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-blue-600" />
                    Configurações da Atividade
                  </CardTitle>
                  <CardDescription>
                    Configure os parâmetros para gerar sua atividade personalizada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Campo de tema com sugestões */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="tema" className="text-sm font-medium">
                        Tema da atividade <span className="text-red-500">*</span>
                      </Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => setTema(getTemasSugeridos()[Math.floor(Math.random() * getTemasSugeridos().length)])}
                      >
                        <Dices className="h-3 w-3 mr-1" />
                        Sugerir tema
                      </Button>
                    </div>
                    <Textarea 
                      id="tema"
                      placeholder="Ex: Frações e números decimais; Sistema solar; Concordância verbal"
                      className="min-h-[80px] text-base"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                    />
                    
                    {/* Sugestões de temas para a matéria selecionada */}
                    {getTemasSugeridos().length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-2">Temas sugeridos para {materiaParaTexto(materia)}:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {getTemasSugeridos().map((tema, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="cursor-pointer hover:bg-blue-50 text-xs"
                              onClick={() => setTema(tema)}
                            >
                              {tema}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Matéria e Série/Ano */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materia" className="text-sm font-medium">Matéria</Label>
                      <Select value={materia} onValueChange={setMateria}>
                        <SelectTrigger id="materia" className="text-sm">
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
                      <Label htmlFor="serie" className="text-sm font-medium">Série/Ano</Label>
                      <Select value={serie} onValueChange={setSerie}>
                        <SelectTrigger id="serie" className="text-sm">
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
                  
                  {/* Tipo de atividade */}
                  <div className="space-y-3">
                    <Label htmlFor="tipoAtividade" className="text-sm font-medium">Tipo de atividade</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Card 
                        className={`p-3 border cursor-pointer transition-all ${tipoAtividade === 'exercicios' ? 'border-blue-600 bg-blue-600 text-white ring-1 ring-blue-300' : 'border-gray-200 bg-white hover:bg-blue-50'}`}
                        onClick={() => setTipoAtividade('exercicios')}
                      >
                        <div className="flex items-center gap-2">
                          <ListTodo className={`h-4 w-4 ${tipoAtividade === 'exercicios' ? 'text-white' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${tipoAtividade === 'exercicios' ? 'text-white' : 'text-blue-600'}`}>Lista de Exercícios</span>
                        </div>
                      </Card>
                      
                      <Card 
                        className={`p-3 border cursor-pointer transition-all ${tipoAtividade === 'avaliacao' ? 'border-blue-600 bg-blue-600 text-white ring-1 ring-blue-300' : 'border-gray-200 bg-white hover:bg-blue-50'}`}
                        onClick={() => setTipoAtividade('avaliacao')}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${tipoAtividade === 'avaliacao' ? 'text-white' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${tipoAtividade === 'avaliacao' ? 'text-white' : 'text-blue-600'}`}>Avaliação/Prova</span>
                        </div>
                      </Card>
                      
                      <Card 
                        className={`p-3 border cursor-pointer transition-all ${tipoAtividade === 'trabalho' ? 'border-blue-600 bg-blue-600 text-white ring-1 ring-blue-300' : 'border-gray-200 bg-white hover:bg-blue-50'}`}
                        onClick={() => setTipoAtividade('trabalho')}
                      >
                        <div className="flex items-center gap-2">
                          <Users className={`h-4 w-4 ${tipoAtividade === 'trabalho' ? 'text-white' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${tipoAtividade === 'trabalho' ? 'text-white' : 'text-blue-600'}`}>Trabalho em Grupo</span>
                        </div>
                      </Card>
                      
                      <Card 
                        className={`p-3 border cursor-pointer transition-all ${tipoAtividade === 'questionario' ? 'border-blue-600 bg-blue-600 text-white ring-1 ring-blue-300' : 'border-gray-200 bg-white hover:bg-blue-50'}`}
                        onClick={() => setTipoAtividade('questionario')}
                      >
                        <div className="flex items-center gap-2">
                          <FileQuestion className={`h-4 w-4 ${tipoAtividade === 'questionario' ? 'text-white' : 'text-blue-600'}`} />
                          <span className={`text-sm font-medium ${tipoAtividade === 'questionario' ? 'text-white' : 'text-blue-600'}`}>Questionário</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Opções adicionais */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-neutral-500" />
                      Opções adicionais
                    </h3>
                    
                    {/* Quantidade de questões */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="quantidadeQuestoes" className="text-sm">Quantidade de questões</Label>
                        <Badge variant="outline" className="font-mono text-xs py-0 h-5">
                          {quantidadeQuestoes[0]}
                        </Badge>
                      </div>
                      <Slider 
                        id="quantidadeQuestoes"
                        value={quantidadeQuestoes} 
                        onValueChange={setQuantidadeQuestoes} 
                        max={20} 
                        min={1}
                        step={1}
                        className="py-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {/* Nível de dificuldade */}
                      <div className="space-y-2">
                        <Label htmlFor="nivelDificuldade" className="text-sm">Nível de dificuldade</Label>
                        <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                          <SelectTrigger id="nivelDificuldade" className="text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facil">Fácil</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="dificil">Difícil</SelectItem>
                            <SelectItem value="misto">Misto (variado)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Opção de gabarito */}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 flex flex-col justify-center">
                          <Label htmlFor="incluirGabarito" className="text-sm">Incluir gabarito</Label>
                          <p className="text-xs text-muted-foreground">
                            Adicionar respostas
                          </p>
                        </div>
                        <Switch 
                          id="incluirGabarito" 
                          checked={incluirGabarito} 
                          onCheckedChange={setIncluirGabarito}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={gerarAtividade}
                    disabled={isLoading || !tema.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Gerando atividade...
                      </>
                    ) : (
                      <>
                        <FileEdit className="mr-2 h-5 w-5" />
                        Gerar atividade
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Dicas para melhores resultados */}
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-blue-800">
                    <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
                    Dicas para melhores resultados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2 text-sm text-blue-900">
                    <li className="flex items-start">
                      <Target className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Especifique o tema com detalhes para criar atividades mais relevantes</span>
                    </li>
                    <li className="flex items-start">
                      <GraduationCap className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Adapte a dificuldade ao nível de conhecimento da turma</span>
                    </li>
                    <li className="flex items-start">
                      <RefreshCw className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Varie os tipos de atividade para manter o engajamento dos alunos</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            
            {/* Painel de visualização - 7 colunas */}
            <div className="lg:col-span-7">
              <Card className="h-full">
                <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      {atividadeSelecionada ? atividadeSelecionada.titulo : 'Visualização da Atividade'}
                    </CardTitle>
                    {atividadeSelecionada && (
                      <CardDescription className="flex gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className="text-xs font-normal">
                          {atividadeSelecionada.materia}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          {atividadeSelecionada.serie}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-normal">
                          {atividadeSelecionada.tipoAtividade}
                        </Badge>
                        {atividadeSelecionada.nivelDificuldade && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {nivelDificuldadeParaTexto(atividadeSelecionada.nivelDificuldade)}
                          </Badge>
                        )}
                        {atividadeSelecionada.quantidadeQuestoes && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {atividadeSelecionada.quantidadeQuestoes} questões
                          </Badge>
                        )}
                      </CardDescription>
                    )}
                  </div>
                  
                  {atividadeSelecionada && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={copiarParaClipboard}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copiar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-8"
                        onClick={imprimirAtividade}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        Imprimir
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700"
                        onClick={downloadAtividade}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Baixar PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                
                <Separator />
                
                <CardContent className="p-0 h-[calc(100%-4rem)]">
                  {atividadeSelecionada ? (
                    <ScrollArea className="h-full min-h-[calc(100vh-18rem)]">
                      <div
                        className="prose prose-sm max-w-none bg-white p-8 mx-auto"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          width: "100%",
                          minHeight: "calc(100vh - 18rem)",
                        }}
                        dangerouslySetInnerHTML={{ __html: atividadeSelecionada.conteudo }}
                      />
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-18rem)] text-center p-8">
                      <FileEdit className="h-20 w-20 text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-600 mb-2">
                        Nenhuma atividade gerada
                      </h3>
                      <p className="text-neutral-500 max-w-md mb-2">
                        Configure os parâmetros no painel lateral e clique em "Gerar atividade" para criar um novo conteúdo educacional.
                      </p>
                      <p className="text-sm text-neutral-400">
                        Todos os conteúdos gerados serão salvos automaticamente em sua biblioteca.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          {atividadesGeradas.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sua Biblioteca de Atividades</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-1" />
                    Filtrar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {atividadesGeradas.map((atividade) => (
                  <Card 
                    key={atividade.id} 
                    className={`border overflow-hidden hover:shadow-md transition-all cursor-pointer ${
                      atividadeSelecionada?.id === atividade.id 
                        ? 'ring-2 ring-blue-500 border-blue-200' 
                        : 'hover:border-blue-200'
                    }`}
                    onClick={() => setAtividadeSelecionada(atividade)}
                  >
                    <div className={`h-2 ${
                      atividade.tipoAtividade.includes('Exercícios') ? 'bg-green-500' :
                      atividade.tipoAtividade.includes('Avaliação') ? 'bg-orange-500' :
                      atividade.tipoAtividade.includes('Trabalho') ? 'bg-purple-500' :
                      'bg-blue-500'
                    }`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base leading-tight line-clamp-2">
                          {atividade.titulo}
                        </CardTitle>
                        <div className="flex-shrink-0 p-1 rounded-full bg-neutral-100">
                          {iconeTipoAtividade(
                            (Object.keys(tipoAtividadeParaTexto) as Array<string>).find(
                              (key) => tipoAtividadeParaTexto[key as keyof typeof tipoAtividadeParaTexto] === atividade.tipoAtividade
                            ) || 'exercicios'
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Criado em {atividade.dataGeracao.toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-3 pb-2">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                          {atividade.materia}
                        </Badge>
                        <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-200 border-none">
                          {atividade.serie}
                        </Badge>
                        {atividade.quantidadeQuestoes && (
                          <Badge className="text-xs bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border-none">
                            {atividade.quantidadeQuestoes} questões
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="py-2 flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {atividade.tipoAtividade}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <FileEdit className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Editar</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <BookOpen className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Sua biblioteca está vazia</h3>
              <p className="text-neutral-500 max-w-md mb-6">
                Você ainda não gerou nenhuma atividade. Crie sua primeira atividade na aba "Criar Atividade".
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="criar"]') as HTMLElement;
                if (element) element.click();
              }}>
                <FileEdit className="h-4 w-4 mr-2" />
                Criar primeira atividade
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FerramentaLayout>
  );
}
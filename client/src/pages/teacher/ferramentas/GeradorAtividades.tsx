import { useState, useRef } from "react";
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
  GraduationCap,
  Upload,
  FileUp,
  Trash2,
  HelpCircle,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  PanelLeft,
  PanelRight,
  Maximize,
  Minimize,
  Clipboard
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import jsPDF from 'jspdf';

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
  const [tema, setTema] = useState("Interpretação de texto");
  const [materia, setMateria] = useState("portugues");
  const [serie, setSerie] = useState("6ano");
  const [tipoAtividade, setTipoAtividade] = useState("exercicios");
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState([10]);
  const [nivelDificuldade, setNivelDificuldade] = useState("medio");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfSelecionado, setPdfSelecionado] = useState<File | null>(null);
  const [pdfNome, setPdfNome] = useState<string>("");
  const [usarPdf, setUsarPdf] = useState<boolean>(false);
  const [mostrarPainelLateral, setMostrarPainelLateral] = useState<boolean>(true);
  const [maximizado, setMaximizado] = useState<boolean>(false);
  
  // Estado para as atividades geradas
  const [atividadesGeradas, setAtividadesGeradas] = useState<AtividadeGerada[]>([]);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<AtividadeGerada | null>(null);
  
  // Referências para elementos do DOM
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista de temas sugeridos por matéria
  const temasSugeridos = {
    portugues: ["Interpretação de texto", "Figuras de linguagem", "Gêneros textuais", "Concordância verbal e nominal", "Análise sintática"],
    ingles: ["Present Simple vs Present Continuous", "Modal Verbs", "Conditional Sentences", "Phrasal Verbs", "Reading Comprehension"],
    arte: ["Renascimento", "Arte moderna brasileira", "Expressionismo", "Fotografia como arte", "Movimentos artísticos contemporâneos"],
    ciencias_fund: ["Sistema solar", "Corpo humano - sistemas", "Cadeia alimentar", "Estados físicos da matéria", "Ecossistemas"],
    matematica: ["Frações e números decimais", "Geometria - áreas e perímetros", "Equações do 1º grau", "Estatística básica", "Funções"],
    fisica: ["Leis de Newton", "Termodinâmica", "Eletromagnetismo", "Cinemática", "Física Quântica"],
    quimica: ["Tabela periódica", "Reações químicas", "Estequiometria", "Química orgânica", "Soluções e concentrações"],
    biologia: ["Célula e organelas", "Genética mendeliana", "Biodiversidade", "Ecologia", "Fisiologia humana"],
    historia: ["Civilizações antigas", "Brasil Colônia", "Revolução Industrial", "Segunda Guerra Mundial", "Era Vargas"],
    geografia: ["Clima e vegetação", "Relevo e hidrografia", "Países e capitais", "Globalização", "Geopolítica mundial"],
    filosofia: ["Filosofia clássica", "Filosofia moderna", "Ética e moral", "Existencialismo", "Teoria do conhecimento"],
    sociologia: ["Cultura e sociedade", "Movimentos sociais", "Trabalho na sociedade contemporânea", "Desigualdade social", "Sociologia urbana"]
  };

  // Função auxiliar para pegar temas sugeridos da matéria selecionada
  const getTemasSugeridos = () => {
    const temas = temasSugeridos[materia as keyof typeof temasSugeridos] || [];
    return temas;
  };

  // Funções para manipular o upload de PDF
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setPdfSelecionado(file);
        setPdfNome(file.name);
        setUsarPdf(true);
        toast({
          title: "PDF adicionado",
          description: `O arquivo ${file.name} será usado para gerar a atividade.`,
        });
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRemoverPdf = () => {
    setPdfSelecionado(null);
    setPdfNome("");
    setUsarPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({
      title: "PDF removido",
      description: "O arquivo foi removido da seleção.",
    });
  };

  const togglePainelLateral = () => {
    setMostrarPainelLateral(!mostrarPainelLateral);
  };

  const toggleMaximizado = () => {
    setMaximizado(!maximizado);
  };

  // Função para gerar atividade
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
      // Preparar dados do formulário
      const formData = new FormData();
      
      // Adicionar dados do formulário
      formData.append('tema', tema);
      formData.append('materia', materiaParaTexto(materia));
      formData.append('serie', serieParaTexto(serie));
      formData.append('tipoAtividade', tipoAtividadeParaTexto(tipoAtividade));
      formData.append('quantidadeQuestoes', quantidadeQuestoes[0].toString());
      formData.append('nivelDificuldade', nivelDificuldadeParaTexto(nivelDificuldade));
      formData.append('incluirGabarito', incluirGabarito.toString());
      formData.append('usarPdf', usarPdf.toString());
      
      // Adicionar PDF se existir
      if (usarPdf && pdfSelecionado) {
        formData.append('pdfFile', pdfSelecionado);
      }
      
      // Chamada para a API de geração de atividades
      let response;
      
      if (usarPdf && pdfSelecionado) {
        // Usando FormData para enviar o arquivo PDF
        response = await fetch('/api/ai/openai/activity-with-pdf', {
          method: 'POST',
          body: formData
        });
      } else {
        // Sem PDF, usando JSON normal
        response = await fetch('/api/ai/openai/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tema,
            materia: materiaParaTexto(materia),
            serie: serieParaTexto(serie),
            tipoAtividade: tipoAtividadeParaTexto(tipoAtividade),
            quantidadeQuestoes: quantidadeQuestoes[0],
            nivelDificuldade: nivelDificuldadeParaTexto(nivelDificuldade),
            incluirGabarito: incluirGabarito
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar atividade');
      }
      
      const data = await response.json();
      
      // Debugging para ver a estrutura da resposta
      console.log('Resposta da API:', data);
      
      // Criando objeto da atividade com o conteúdo gerado pela IA
      const novaAtividade: AtividadeGerada = {
        id: `ativ-${Date.now()}`,
        titulo: `Atividade de ${materiaParaTexto(materia)} - ${tema}`,
        materia: materiaParaTexto(materia),
        serie: serieParaTexto(serie),
        conteudo: data.content,
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
      console.error('Erro ao gerar atividade:', error);
      toast({
        title: "Erro ao gerar atividade",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de conversão de valores para texto legível
  const materiaParaTexto = (mat: string) => {
    const mapeamento: {[key: string]: string} = {
      portugues: "Língua Portuguesa",
      ingles: "Língua Inglesa",
      arte: "Arte",
      ciencias_fund: "Ciências - Fundamental",
      matematica: "Matemática",
      fisica: "Física",
      quimica: "Química",
      biologia: "Biologia",
      historia: "História",
      geografia: "Geografia",
      filosofia: "Filosofia",
      sociologia: "Sociologia"
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
  
  // Converter nível de dificuldade para texto legível
  const nivelDificuldadeParaTexto = (nivel: string) => {
    const mapeamento: {[key: string]: string} = {
      facil: "Fácil",
      medio: "Médio",
      dificil: "Difícil",
      misto: "Misto (variado)"
    };
    return mapeamento[nivel] || nivel;
  };

  // Funções para copiar, imprimir e baixar PDF
  const copiarParaClipboard = () => {
    if (!atividadeSelecionada) return;
    
    // Criar um elemento temporário para extrair o texto do HTML
    const temp = document.createElement('div');
    temp.innerHTML = atividadeSelecionada.conteudo;
    const textContent = temp.textContent || temp.innerText;
    
    navigator.clipboard.writeText(textContent).then(() => {
      toast({
        title: "Conteúdo copiado",
        description: "O texto da atividade foi copiado para a área de transferência.",
      });
    }).catch(err => {
      console.error('Erro ao copiar conteúdo: ', err);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o conteúdo para a área de transferência.",
        variant: "destructive"
      });
    });
  };
  
  const imprimirAtividade = () => {
    if (!atividadeSelecionada) return;
    
    // Criar uma janela temporária para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está ativado.",
        variant: "destructive"
      });
      return;
    }
    
    // Definir o conteúdo da página de impressão
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${atividadeSelecionada.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
            @media print {
              body { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>${atividadeSelecionada.titulo}</h1>
          <div class="meta">
            ${atividadeSelecionada.tipoAtividade} | 
            ${atividadeSelecionada.materia} | 
            ${atividadeSelecionada.serie} | 
            ${nivelDificuldadeParaTexto(atividadeSelecionada.nivelDificuldade)}
          </div>
          ${atividadeSelecionada.conteudo}
        </body>
      </html>
    `);
    
    // Imprimir e fechar a janela
    printWindow.document.close();
    printWindow.focus();
    
    // Atraso para garantir que o conteúdo foi carregado
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  const downloadAtividade = () => {
    if (!atividadeSelecionada) return;
    
    try {
      // Criar um elemento temporário para extrair o texto do HTML
      const temp = document.createElement('div');
      temp.innerHTML = atividadeSelecionada.conteudo;
      
      // Inicializar o PDF
      const pdf = new jsPDF();
      
      // Adicionar o título
      pdf.setFontSize(16);
      pdf.text(atividadeSelecionada.titulo, 20, 20);
      
      // Adicionar metadados
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `${atividadeSelecionada.tipoAtividade} | ${atividadeSelecionada.materia} | ${atividadeSelecionada.serie}`, 
        20, 
        30
      );
      
      // Adicionar conteúdo
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Obter texto do conteúdo HTML (simplificação)
      const textContent = temp.textContent || temp.innerText;
      
      // Dividir o texto em linhas para caber na página
      const splitText = pdf.splitTextToSize(textContent, 170);
      pdf.text(splitText, 20, 40);
      
      // Baixar o PDF
      pdf.save(`${atividadeSelecionada.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      
      toast({
        title: "PDF baixado",
        description: "Sua atividade foi baixada como arquivo PDF.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível gerar o arquivo PDF.",
        variant: "destructive"
      });
    }
  };
  
  // Ícones para tipos de atividade
  const iconeTipoAtividade = (tipo: string) => {
    switch (tipo) {
      case 'exercicios': return <ListTodo className="h-4 w-4" />;
      case 'avaliacao': return <FileQuestion className="h-4 w-4" />;
      case 'trabalho': return <Users className="h-4 w-4" />;
      case 'projeto': return <Lightbulb className="h-4 w-4" />;
      case 'questionario': return <FileText className="h-4 w-4" />;
      default: return <FileEdit className="h-4 w-4" />;
    }
  };

  return (
    <FerramentaLayout 
      title="Gerador de Atividades" 
      description="Crie atividades educacionais personalizadas com a ajuda da Inteligência Artificial"
      icon={<FileEdit className="h-5 w-5" />}
      helpText="Configure os parâmetros da atividade e nosso sistema utilizará Inteligência Artificial para gerar conteúdo educacional personalizado."
    >
      <Tabs defaultValue="criar">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="criar" data-value="criar">Criar Atividade</TabsTrigger>
            <TabsTrigger value="historico">Biblioteca</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            {maximizado ? (
              <Button variant="outline" size="sm" onClick={toggleMaximizado}>
                <Minimize className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Minimizar</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={toggleMaximizado}>
                <Maximize className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Maximizar</span>
              </Button>
            )}
            
            {mostrarPainelLateral ? (
              <Button variant="outline" size="sm" onClick={togglePainelLateral}>
                <PanelLeft className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Ocultar painel</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={togglePainelLateral}>
                <PanelRight className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Mostrar painel</span>
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="criar">
          <div className="grid grid-cols-1 gap-6" style={{ gridTemplateColumns: mostrarPainelLateral ? (maximizado ? '350px 1fr' : '1fr 2fr') : '1fr' }}>
            {/* Painel de configuração */}
            {mostrarPainelLateral && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      Configurações da Atividade
                    </CardTitle>
                    <CardDescription>
                      Configure os detalhes da atividade que deseja gerar
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-5">
                    {/* Tema da atividade */}
                    <div className="space-y-2">
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Matéria */}
                      <div className="space-y-2">
                        <Label htmlFor="materia">Matéria</Label>
                        <Select value={materia} onValueChange={setMateria}>
                          <SelectTrigger id="materia">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="portugues">Língua Portuguesa</SelectItem>
                            <SelectItem value="ingles">Língua Inglesa</SelectItem>
                            <SelectItem value="arte">Arte</SelectItem>
                            <SelectItem value="ciencias_fund">Ciências - Fundamental</SelectItem>
                            <SelectItem value="matematica">Matemática</SelectItem>
                            <SelectItem value="fisica">Física</SelectItem>
                            <SelectItem value="quimica">Química</SelectItem>
                            <SelectItem value="biologia">Biologia</SelectItem>
                            <SelectItem value="historia">História</SelectItem>
                            <SelectItem value="geografia">Geografia</SelectItem>
                            <SelectItem value="filosofia">Filosofia</SelectItem>
                            <SelectItem value="sociologia">Sociologia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Série/Ano */}
                      <div className="space-y-2">
                        <Label htmlFor="serie">Série/Ano</Label>
                        <Select value={serie} onValueChange={setSerie}>
                          <SelectTrigger id="serie">
                            <SelectValue placeholder="Selecione" />
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
                    
                    {/* Material de referência (PDF) */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="pdfRef" className="text-sm flex items-center gap-2">
                          Material de referência (PDF)
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Novo
                          </Badge>
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-sm text-xs">
                                Faça upload de um material em PDF para que a IA gere atividades baseadas no conteúdo do documento.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="usarPdf"
                            checked={usarPdf}
                            onCheckedChange={setUsarPdf}
                            disabled={!pdfSelecionado}
                          />
                          <div>
                            <Label htmlFor="usarPdf" className="text-sm">Usar PDF como base para geração</Label>
                            <p className="text-xs text-muted-foreground">
                              As questões serão baseadas no conteúdo do PDF
                            </p>
                          </div>
                        </div>
                        
                        {pdfSelecionado ? (
                          <div className="p-3 border rounded-md bg-blue-50 border-blue-200 flex justify-between items-center">
                            <div className="flex gap-2 items-center overflow-hidden">
                              <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                              <span className="text-sm truncate text-blue-700" title={pdfNome}>
                                {pdfNome}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={handleRemoverPdf} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input 
                              ref={fileInputRef}
                              type="file" 
                              id="pdfInput" 
                              className="hidden" 
                              accept=".pdf" 
                              onChange={handlePdfUpload}
                            />
                            <div 
                              className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FileUp className="h-8 w-8 text-gray-400 mb-3" />
                              <p className="text-sm font-medium">Clique para upload</p>
                              <p className="text-xs text-gray-500">ou arraste um PDF aqui</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Tipo de atividade */}
                    <div className="space-y-2">
                      <Label htmlFor="tipoAtividade" className="text-sm">Tipo de atividade</Label>
                      <RadioGroup
                        value={tipoAtividade}
                        onValueChange={setTipoAtividade}
                        className="grid grid-cols-3 sm:grid-cols-5 gap-2"
                      >
                        <div className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${tipoAtividade === 'exercicios' ? 'bg-blue-600 text-white border-blue-700' : 'bg-card hover:bg-blue-50 hover:border-blue-200'}`} onClick={() => setTipoAtividade('exercicios')}>
                          <div className="text-center">
                            <ListTodo className={`h-5 w-5 mx-auto mb-1 ${tipoAtividade === 'exercicios' ? 'text-white' : 'text-blue-600'}`} />
                            <span className="text-xs font-medium">Exercícios</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${tipoAtividade === 'avaliacao' ? 'bg-blue-600 text-white border-blue-700' : 'bg-card hover:bg-blue-50 hover:border-blue-200'}`} onClick={() => setTipoAtividade('avaliacao')}>
                          <div className="text-center">
                            <FileQuestion className={`h-5 w-5 mx-auto mb-1 ${tipoAtividade === 'avaliacao' ? 'text-white' : 'text-blue-600'}`} />
                            <span className="text-xs font-medium">Avaliação</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${tipoAtividade === 'trabalho' ? 'bg-blue-600 text-white border-blue-700' : 'bg-card hover:bg-blue-50 hover:border-blue-200'}`} onClick={() => setTipoAtividade('trabalho')}>
                          <div className="text-center">
                            <Users className={`h-5 w-5 mx-auto mb-1 ${tipoAtividade === 'trabalho' ? 'text-white' : 'text-blue-600'}`} />
                            <span className="text-xs font-medium">Trabalho</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${tipoAtividade === 'projeto' ? 'bg-blue-600 text-white border-blue-700' : 'bg-card hover:bg-blue-50 hover:border-blue-200'}`} onClick={() => setTipoAtividade('projeto')}>
                          <div className="text-center">
                            <Lightbulb className={`h-5 w-5 mx-auto mb-1 ${tipoAtividade === 'projeto' ? 'text-white' : 'text-blue-600'}`} />
                            <span className="text-xs font-medium">Projeto</span>
                          </div>
                        </div>
                        
                        <div className={`flex items-center justify-center p-3 rounded-md border cursor-pointer transition-colors ${tipoAtividade === 'questionario' ? 'bg-blue-600 text-white border-blue-700' : 'bg-card hover:bg-blue-50 hover:border-blue-200'}`} onClick={() => setTipoAtividade('questionario')}>
                          <div className="text-center">
                            <FileText className={`h-5 w-5 mx-auto mb-1 ${tipoAtividade === 'questionario' ? 'text-white' : 'text-blue-600'}`} />
                            <span className="text-xs font-medium">Questionário</span>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <Separator />
                    
                    {/* Opções adicionais */}
                    <div className="space-y-4">
                      <Accordion type="single" collapsible defaultValue="options" className="w-full">
                        <AccordionItem value="options" className="border-none">
                          <AccordionTrigger className="py-2">
                            <h3 className="text-sm font-medium flex items-center">
                              <Settings className="h-4 w-4 mr-2 text-neutral-500" />
                              Opções adicionais
                            </h3>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* Quantidade de questões */}
                            <div className="space-y-2 pt-1">
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
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
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
                                    Adicionar respostas ao final
                                  </p>
                                </div>
                                <Switch 
                                  id="incluirGabarito" 
                                  checked={incluirGabarito} 
                                  onCheckedChange={setIncluirGabarito}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="justify-between pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" type="button" disabled={isLoading} className="text-xs">
                          <HelpCircle className="h-3.5 w-3.5 mr-1" />
                          Ver exemplo
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Exemplo de atividade</AlertDialogTitle>
                          <AlertDialogDescription>
                            Aqui está um exemplo de atividade gerada pela IA:
                            <div className="mt-4 p-4 bg-muted rounded-md text-sm overflow-auto max-h-[400px]">
                              <h2 className="font-bold mb-2">Exercícios - Equações do 1º grau</h2>
                              <p className="mb-4">Resolva as seguintes equações:</p>
                              <ol className="space-y-4 list-decimal list-inside">
                                <li>3x + 7 = 10</li>
                                <li>2x - 5 = 3</li>
                                <li>4x = 16</li>
                                <li>5x - 8 = 2x + 4</li>
                                <li>7x + 3 = 4x - 6</li>
                              </ol>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Fechar</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button 
                      variant="default" 
                      size="lg"
                      onClick={gerarAtividade}
                      disabled={isLoading || !tema.trim()}
                      className="w-auto bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando atividade...
                        </>
                      ) : (
                        <>
                          <Dices className="mr-2 h-5 w-5" />
                          Gerar atividade
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            
            {/* Painel de visualização */}
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="pb-0 flex-col md:flex-row md:items-start md:justify-between md:space-y-0">
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
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8"
                      onClick={copiarParaClipboard}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Copiar</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={imprimirAtividade}
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Imprimir</span>
                    </Button>
                    <Button 
                      variant="default"
                      size="sm"
                      className="h-8 bg-blue-600 hover:bg-blue-700"
                      onClick={downloadAtividade}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Baixar PDF</span>
                    </Button>
                  </div>
                )}
              </CardHeader>
              
              <Separator className="my-2" />
              
              <CardContent className="p-0 h-[calc(100%-5rem)] overflow-auto">
                {atividadeSelecionada ? (
                  <div className="h-full overflow-auto">
                    <div
                      className="prose prose-sm max-w-none bg-white p-8"
                      dangerouslySetInnerHTML={{ __html: atividadeSelecionada.conteudo }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
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
        </TabsContent>

        <TabsContent value="historico">
          {atividadesGeradas.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sua Biblioteca de Atividades</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Filtrar</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Visualizar</span>
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
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
  const [tema, setTema] = useState("Interpretação de texto");
  const [materia, setMateria] = useState("portugues");
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
      // Chamada para a API de geração de atividades
      const response = await fetch('/api/ai/openai/activity', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar atividade');
      }
      
      const data = await response.json();
      
      // Criando objeto da atividade com o conteúdo gerado pela IA
      const novaAtividade: AtividadeGerada = {
        id: `ativ-${Date.now()}`,
        titulo: `Atividade de ${materiaParaTexto(materia)} - ${tema}`,
        materia: materiaParaTexto(materia),
        serie: serieParaTexto(serie),
        conteudo: data.conteudo,
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

  // Mock de dados para simulação
  const mockConteudo = () => {
    // Questões específicas por matéria para mock
    const questoesPorMateria: Record<string, string[]> = {
      portugues: [
        "Analise o texto a seguir e identifique o tipo de narração predominante:",
        "Qual das alternativas abaixo apresenta o uso correto da concordância verbal?",
        "Identifique a figura de linguagem presente no trecho: 'A cidade dormia tranquila'.",
        "Qual o sentido da expressão destacada no contexto: 'Ele PEGOU O BOI PELO CHIFRE e resolveu o problema'?",
        "Identifique a função sintática do termo sublinhado na oração: 'Os alunos entregaram O TRABALHO ontem'."
      ],
      matematica: [
        "Resolva a equação: 3x + 7 = 22",
        "Um triângulo retângulo tem catetos medindo 6 cm e 8 cm. Qual é a medida da hipotenusa?",
        "Se um produto custa R$ 200,00 e recebe um desconto de 15%, qual será o novo preço?",
        "Calcule a área de um círculo com raio de 5 cm. Use π = 3,14.",
        "Qual é a fórmula para calcular o volume de um prisma triangular?"
      ],
      historia: [
        "Quais foram as principais causas da Revolução Francesa?",
        "Explique a política do 'Pão e Circo' durante o Império Romano.",
        "Qual foi a importância da Revolução Industrial para a sociedade contemporânea?",
        "Cite as principais características do período conhecido como Idade Média.",
        "O que foi o Iluminismo e quais seus principais representantes?"
      ],
      geografia: [
        "Quais são os principais fatores que influenciam o clima de uma região?",
        "Explique o fenômeno da urbanização e seus impactos socioambientais.",
        "O que é desenvolvimento sustentável e qual sua importância para o futuro do planeta?",
        "Caracterize os diferentes biomas brasileiros.",
        "Como o processo de globalização afeta as relações econômicas entre os países?"
      ],
      ciencias_fund: [
        "Explique o processo de fotossíntese e sua importância para os seres vivos.",
        "Como funciona o sistema respiratório humano?",
        "Descreva as camadas da atmosfera terrestre.",
        "O que é uma cadeia alimentar? Dê um exemplo.",
        "Explique a diferença entre elementos, compostos e misturas."
      ],
      biologia: [
        "Descreva o processo de divisão celular por mitose.",
        "Como ocorre a transmissão das características genéticas de acordo com as Leis de Mendel?",
        "Explique a teoria da evolução proposta por Darwin.",
        "Como funciona o sistema imunológico humano?",
        "Qual a diferença entre células procariontes e eucariontes?"
      ],
      fisica: [
        "Enuncie a Lei da Inerça de Newton e dê um exemplo prático.",
        "Calcule a força resultante sobre um corpo de massa 5 kg que está sendo acelerado a 4 m/s².",
        "Explique o fenômeno da refração da luz.",
        "O que é energia potencial gravitacional?",
        "Qual a relação entre voltagem, corrente e resistência em um circuito elétrico?"
      ],
      quimica: [
        "Explique a teoria atômica de Dalton.",
        "Como funciona a tabela periódica dos elementos?",
        "O que são ligações iônicas e covalentes?",
        "Balanceie a equação química: H₂ + O₂ → H₂O",
        "Defina ácidos e bases segundo a teoria de Arrhenius."
      ],
      ingles: [
        "Complete the sentence with the correct verb tense: 'If I _____ (have) more time, I would study more.'.",
        "Choose the correct question tag: 'You are coming to the party, _____?'",
        "What's the difference between 'a few' and 'few'?",
        "Translate the following sentence to English: 'Eu estudo inglês há três anos.'",
        "Put the adverbs in the correct order: 'She (quietly, always, very) enters the room.'"
      ],
      arte: [
        "Quais são as características principais do Renascimento?",
        "Cite três obras famosas de Vincent van Gogh.",
        "Explique a diferença entre arte abstrata e arte figurativa.",
        "O que é a perspectiva na pintura e quando ela foi desenvolvida?",
        "Quais são os elementos básicos da linguagem visual?"
      ],
      filosofia: [
        "Explique o conceito de 'Caverna' na filosofia de Platão.",
        "O que é o imperativo categórico de Kant?",
        "Compare as visões de Hobbes e Rousseau sobre o 'estado de natureza'.",
        "Explique o conceito de existêncialismo segundo Sartre.",
        "O que é dialética para Hegel?"
      ],
      sociologia: [
        "Como Marx define o conceito de 'alienação'?",
        "Explique o conceito de 'fato social' segundo Durkheim.",
        "O que é mobilidade social e quais são seus tipos?",
        "Defina o conceito de 'ação social' de acordo com Max Weber.",
        "Como as desigualdades sociais se manifestam na sociedade brasileira?"
      ]
    };

    // Alternativas específicas por matéria para mock
    const alternativasPorMateria: Record<string, string[][]> = {
      portugues: [
        ["Narração em primeira pessoa", "Narração em terceira pessoa", "Narração objetiva", "Narração subjetiva"],
        ["Os alunos chegou cedo", "A turma de alunos chegaram", "Os alunos chegaram cedo", "A turma de alunos chegou cedo"],
        ["Metonimia", "Metafora", "Personificação", "Hiperbole"],
        ["Enfrentar um problema diretamente", "Agredir um animal", "Hesitar diante de um desafio", "Fugir de uma situação difícil"],
        ["Sujeito", "Objeto direto", "Objeto indireto", "Adjunto adverbial"]
      ],
      matematica: [
        ["x = 5", "x = 7", "x = 15", "x = -5"],
        ["10 cm", "12 cm", "14 cm", "16 cm"],
        ["R$ 170,00", "R$ 185,00", "R$ 30,00", "R$ 215,00"],
        ["15,7 cm²", "31,4 cm²", "78,5 cm²", "3,14 cm²"],
        ["V = base x altura", "V = base x altura ÷ 2", "V = área da base x altura", "V = área da base x altura ÷ 3"]
      ]
    };

    // Seleciona 5 questões aleatórias para a matéria, ou questões padrão se a matéria não tiver questões específicas
    const questoesDaMateria = questoesPorMateria[materia] || [
      "Questão 1: Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
      "Questão 2: Ut enim ad minim veniam, quis nostrud exercitation?",
      "Questão 3: Duis aute irure dolor in reprehenderit in voluptate?",
      "Questão 4: Excepteur sint occaecat cupidatat non proident?",
      "Questão 5: Sed ut perspiciatis unde omnis iste natus error?"
    ];

    // Cria HTML para cada questão
    const questoesHTML = Array.from({ length: quantidadeQuestoes[0] }, (_, i) => {
      // Seleciona uma questão aleatória ou cíclica baseada no índice
      const questao = questoesDaMateria[i % questoesDaMateria.length];
      
      // Gera alternativas genéricas ou específicas, se disponíveis
      let alternativas;
      if (alternativasPorMateria[materia] && i < alternativasPorMateria[materia].length) {
        alternativas = alternativasPorMateria[materia][i];
      } else {
        alternativas = [
          `Alternativa 1 para a questão ${i+1}`,
          `Alternativa 2 para a questão ${i+1}`,
          `Alternativa 3 para a questão ${i+1}`,
          `Alternativa 4 para a questão ${i+1}`
        ];
      }
      
      return `
        <li style="margin-bottom: 1.5rem; counter-increment: question; position: relative;">
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1e3a8a;">
            Questão ${i + 1}: ${questao}
          </div>
          <div style="background-color: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; margin-top: 0.5rem;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                <span>${alternativas[0]}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                <span>${alternativas[1]}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                <span>${alternativas[2]}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                <span>${alternativas[3]}</span>
              </div>
            </div>
          </div>
        </li>
      `;
    }).join('');

    let gabaritoHTML = '';
    if (incluirGabarito) {
      const respostasHTML = Array.from({ length: quantidadeQuestoes[0] }, (_, i) => {
        const opcoes = ['A', 'B', 'C', 'D'];
        const resposta = opcoes[Math.floor(Math.random() * opcoes.length)];
        return `
          <div style="display: flex; gap: 0.5rem; background-color: #f0f9ff; padding: 0.5rem; border-radius: 0.25rem;">
            <span style="font-weight: 500;">Questão ${i + 1}:</span>
            <span style="font-weight: bold; color: #1e3a8a;">${resposta}</span>
          </div>
        `;
      }).join('');

      gabaritoHTML = `
        <div class="answer-key" style="margin-top: 3rem; border-top: 2px solid #3b82f6; padding-top: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: bold; color: #1e3a8a; margin-bottom: 1rem;">Gabarito</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.5rem;">
            ${respostasHTML}
          </div>
        </div>
      `;
    }

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
          ${questoesHTML}
        </ol>
      </div>
      
      ${gabaritoHTML}
      
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
                    disabled={isLoading}
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
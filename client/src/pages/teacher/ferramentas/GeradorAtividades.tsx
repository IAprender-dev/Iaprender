import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import aiverseLogoNew from "@/assets/aiverse-logo-new.png";
import { 
  ArrowLeft,
  FileText,
  Download,
  Copy,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  Zap,
  CheckCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

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
  
  // Estados principais
  const [tema, setTema] = useState("");
  const [tipoAtividade, setTipoAtividade] = useState("");
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState([5]);
  const [nivelDificuldade, setNivelDificuldade] = useState("");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para resultado
  const [atividadeGerada, setAtividadeGerada] = useState<AtividadeGerada | null>(null);

  // Função para processar e limpar o conteúdo da atividade
  const processarConteudoAtividade = (conteudo: string): string => {
    if (!conteudo) return '';
    
    let htmlLimpo = conteudo;
    
    // Remove texto explicativo antes do HTML
    const inicioDiv = htmlLimpo.indexOf('<div');
    if (inicioDiv > 0) {
      htmlLimpo = htmlLimpo.substring(inicioDiv);
    }
    
    // Remove texto explicativo após o HTML
    const fimDiv = htmlLimpo.lastIndexOf('</div>') + 6;
    if (fimDiv < htmlLimpo.length) {
      htmlLimpo = htmlLimpo.substring(0, fimDiv);
    }
    
    // Limpa caracteres de formatação markdown e especiais
    htmlLimpo = htmlLimpo
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // **texto** para <strong>
      .replace(/\*([^*]+)\*/g, '<em>$1</em>') // *texto* para <em>
      .replace(/\\n/g, '<br>') // \n para quebra de linha
      .replace(/\\\\/g, '') // Remove barras duplas
      .replace(/\\\*/g, '*') // Remove escape de asterisco
      .replace(/\\"/g, '"') // Remove escape de aspas
      .replace(/\\_/g, '_') // Remove escape de underscore
      .replace(/###\s*/g, '') // Remove ### markdown
      .replace(/##\s*/g, '') // Remove ## markdown
      .replace(/#\s*/g, '') // Remove # markdown
      .replace(/\*\s*\*/g, '') // Remove ** vazios
      .replace(/\s\s+/g, ' ') // Remove espaços duplos
      .trim();
    
    // Se não contém HTML estruturado, criar layout básico
    if (!htmlLimpo.includes('<div')) {
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      
      // Limpa o texto de caracteres especiais
      const textoLimpo = conteudo
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\\/g, '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/^\s*[-+*]\s+/gm, '')
        .trim();
      
      return `
        <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: 'Times New Roman', serif; line-height: 1.6; background: white; color: #000;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
            <h1 style="font-size: 22px; font-weight: bold; color: #000; margin: 0 0 10px 0;">ATIVIDADE EDUCACIONAL</h1>
            <div style="font-size: 14px; color: #333;">
              <strong>Disciplina:</strong> ${atividadeGerada?.materia || 'Multidisciplinar'} | 
              <strong>Série:</strong> ${atividadeGerada?.serie || 'Ensino Fundamental'} | 
              <strong>Data:</strong> ___/___/______
            </div>
            <div style="font-size: 14px; color: #333; margin-top: 5px;">
              <strong>Nome:</strong> ______________________________________________ 
              <strong>Turma:</strong> __________
            </div>
          </div>
          <div style="white-space: pre-line; font-size: 16px; line-height: 1.8;">
            ${textoLimpo}
          </div>
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #ccc; padding-top: 15px;">
            <div style="font-size: 12px; color: #666;">
              Atividade gerada por <strong>AIverse - Seu Universo de IA</strong>
            </div>
          </div>
        </div>
      `;
    }
    
    // Substitui placeholders pela data atual
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    htmlLimpo = htmlLimpo.replace(/\[DATA ATUAL\]/g, dataAtual);
    htmlLimpo = htmlLimpo.replace(/\[DATA\]/g, dataAtual);
    
    return htmlLimpo;
  };

  // Função para gerar atividade
  const gerarAtividade = async () => {
    if (!tema.trim() || !tipoAtividade || !nivelDificuldade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para gerar a atividade.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Gerar atividade com detecção automática de disciplina e série
      const response = await fetch('/api/ai/openai/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tema,
          tipoAtividade,
          quantidadeQuestoes: quantidadeQuestoes[0],
          nivelDificuldade,
          incluirGabarito,
          autoDetectSubject: true // Flag para detecção automática
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar atividade');
      }
      
      const data = await response.json();
      
      // Limpar conteúdo
      let conteudoLimpo = data.content;
      if (conteudoLimpo.startsWith('```html')) {
        conteudoLimpo = conteudoLimpo.replace('```html', '');
        if (conteudoLimpo.endsWith('```')) {
          conteudoLimpo = conteudoLimpo.substring(0, conteudoLimpo.length - 3);
        }
      }
      conteudoLimpo = conteudoLimpo.trim();
      
      const novaAtividade: AtividadeGerada = {
        id: `ativ-${Date.now()}`,
        titulo: data.titulo || `Atividade - ${tema}`,
        materia: data.materia || "Detectado automaticamente",
        serie: data.serie || "Detectado automaticamente",
        conteudo: conteudoLimpo,
        tipoAtividade,
        dataGeracao: new Date(),
        quantidadeQuestoes: quantidadeQuestoes[0],
        nivelDificuldade,
        incluiGabarito: incluirGabarito
      };
      
      setAtividadeGerada(novaAtividade);
      
      toast({
        title: "Atividade gerada com sucesso!",
        description: "Sua atividade educacional foi criada com IA.",
      });
    } catch (error) {
      console.error('Erro ao gerar atividade:', error);
      toast({
        title: "Erro ao gerar atividade",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para copiar conteúdo
  const copiarConteudo = () => {
    if (atividadeGerada) {
      navigator.clipboard.writeText(atividadeGerada.conteudo);
      toast({
        title: "Conteúdo copiado!",
        description: "Atividade copiada para a área de transferência.",
      });
    }
  };

  // Função para baixar PDF
  const baixarPDF = () => {
    if (!atividadeGerada) return;
    
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(atividadeGerada.titulo, 20, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${atividadeGerada.tipoAtividade} | ${atividadeGerada.materia} | ${atividadeGerada.serie}`, 20, 30);
      
      const temp = document.createElement('div');
      temp.innerHTML = atividadeGerada.conteudo;
      const textContent = temp.textContent || temp.innerText;
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const splitText = pdf.splitTextToSize(textContent, 170);
      pdf.text(splitText, 20, 40);
      
      pdf.save(`${atividadeGerada.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      
      toast({
        title: "PDF baixado",
        description: "Atividade salva como PDF.",
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Gerador de Atividades - AIverse</title>
      </Helmet>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand Section */}
          <div className="flex items-center justify-center py-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <img 
                src={aiverseLogoNew} 
                alt="AIverse Logo" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AIverse
                </h1>
                <p className="text-sm text-slate-600 font-medium">Seu Universo de IA</p>
              </div>
            </div>
          </div>
          
          {/* Navigation Section */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Gerador de Atividades</h2>
                  <p className="text-sm text-slate-600">Crie atividades educacionais personalizadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Configurações da Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Tema */}
                <div className="space-y-2">
                  <Label htmlFor="tema" className="text-sm font-semibold text-slate-700">
                    Tema da Atividade *
                  </Label>
                  <Textarea
                    id="tema"
                    placeholder="Ex: Frações, Sistema Solar, Brasil Colônia..."
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-medium mb-1">Detecção Automática BNCC</p>
                        <p>A IA analisará o tema e identificará automaticamente a disciplina e ano/série conforme as diretrizes da BNCC.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tipo de Atividade */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Tipo de Atividade *
                  </Label>
                  <Select value={tipoAtividade} onValueChange={setTipoAtividade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exercicios">Lista de Exercícios</SelectItem>
                      <SelectItem value="prova">Prova/Avaliação</SelectItem>
                      <SelectItem value="quiz">Quiz Interativo</SelectItem>
                      <SelectItem value="trabalho">Trabalho de Pesquisa</SelectItem>
                      <SelectItem value="pratica">Atividade Prática</SelectItem>
                      <SelectItem value="dissertativa">Questões Dissertativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantidade de Questões */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700">
                    Quantidade de Questões: {quantidadeQuestoes[0]}
                  </Label>
                  <Slider
                    value={quantidadeQuestoes}
                    onValueChange={setQuantidadeQuestoes}
                    max={20}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1 questão</span>
                    <span>20 questões</span>
                  </div>
                </div>

                {/* Nível de Dificuldade */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Nível de Dificuldade *
                  </Label>
                  <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Incluir Gabarito */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-slate-700">
                      Incluir Gabarito
                    </Label>
                    <p className="text-xs text-slate-500">
                      Adicionar respostas e explicações
                    </p>
                  </div>
                  <Switch
                    checked={incluirGabarito}
                    onCheckedChange={setIncluirGabarito}
                  />
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarAtividade}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Gerando Atividade...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Gerar Atividade com IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-2">
            {atividadeGerada ? (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-xl">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-slate-800">
                        {atividadeGerada.titulo}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {atividadeGerada.materia}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {atividadeGerada.serie}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {atividadeGerada.tipoAtividade}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {atividadeGerada.quantidadeQuestoes} questões
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copiarConteudo}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button variant="outline" size="sm" onClick={baixarPDF}>
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Barra de ações superior */}
                  <div className="border-b border-slate-200 p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 font-medium">
                        Atividade pronta para uso em sala de aula
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copiarConteudo}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button variant="outline" size="sm" onClick={baixarPDF}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => window.print()}
                        >
                          Imprimir
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Área de visualização da atividade */}
                  <div className="activity-container bg-white">
                    <div 
                      className="activity-content p-12 max-h-[800px] overflow-y-auto"
                      style={{
                        maxWidth: '21cm',
                        margin: '0 auto',
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#000000',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ 
                        __html: processarConteudoAtividade(atividadeGerada.conteudo) 
                      }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-6 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl mb-6">
                    <BookOpen className="h-16 w-16 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Pronto para Criar Atividades Incríveis?
                  </h3>
                  <p className="text-slate-600 max-w-md mb-6">
                    Configure o tema e as opções desejadas, depois clique em "Gerar Atividade com IA" para criar conteúdo educacional personalizado.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-lg">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Target className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-slate-700">Detecção Automática BNCC</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-slate-700">Geração Rápida</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-slate-700">IA Avançada</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
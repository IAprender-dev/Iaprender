import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import aiverseLogoNew from "@/assets/aiverse-logo-new.png";
import { 
  ArrowLeft,
  FileText,
  Settings,
  Download,
  Copy,
  Printer,
  Upload,
  X,
  Sparkles,
  BookOpen,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  const [disciplina, setDisciplina] = useState("");
  const [serie, setSerie] = useState("");
  const [tipoAtividade, setTipoAtividade] = useState("");
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState([10]);
  const [nivelDificuldade, setNivelDificuldade] = useState("");
  const [incluirGabarito, setIncluirGabarito] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para PDF
  const [pdfSelecionado, setPdfSelecionado] = useState<File | null>(null);
  const [usarPdf, setUsarPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para resultado
  const [atividadeGerada, setAtividadeGerada] = useState<AtividadeGerada | null>(null);

  // Função para gerar atividade
  const gerarAtividade = async () => {
    if (!tema.trim() || !disciplina || !serie || !tipoAtividade || !nivelDificuldade) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos para gerar a atividade.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let response;
      
      if (usarPdf && pdfSelecionado) {
        // Gerar com PDF
        const formData = new FormData();
        formData.append('tema', tema);
        formData.append('materia', disciplina);
        formData.append('serie', serie);
        formData.append('tipoAtividade', tipoAtividade);
        formData.append('quantidadeQuestoes', quantidadeQuestoes[0].toString());
        formData.append('nivelDificuldade', nivelDificuldade);
        formData.append('incluirGabarito', incluirGabarito.toString());
        formData.append('usarPdf', 'true');
        formData.append('pdfFile', pdfSelecionado);
        
        response = await fetch('/api/ai/openai/activity-with-pdf', {
          method: 'POST',
          body: formData
        });
      } else {
        // Gerar sem PDF
        response = await fetch('/api/ai/openai/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tema,
            materia: disciplina,
            serie,
            tipoAtividade,
            quantidadeQuestoes: quantidadeQuestoes[0],
            nivelDificuldade,
            incluirGabarito
          }),
        });
      }

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
        titulo: `Atividade de ${disciplina} - ${tema}`,
        materia: disciplina,
        serie,
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

  // Função para upload de PDF
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setPdfSelecionado(file);
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

  const removerPdf = () => {
    setPdfSelecionado(null);
    setUsarPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Funções de ação
  const copiarAtividade = () => {
    if (!atividadeGerada) return;
    
    const temp = document.createElement('div');
    temp.innerHTML = atividadeGerada.conteudo;
    const textContent = temp.textContent || temp.innerText;
    
    navigator.clipboard.writeText(textContent).then(() => {
      toast({
        title: "Copiado!",
        description: "Atividade copiada para a área de transferência.",
      });
    });
  };

  const imprimirAtividade = () => {
    if (!atividadeGerada) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${atividadeGerada.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${atividadeGerada.titulo}</h1>
          <div class="meta">
            ${atividadeGerada.tipoAtividade} | ${atividadeGerada.materia} | ${atividadeGerada.serie}
          </div>
          ${atividadeGerada.conteudo}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const downloadPDF = () => {
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
        <title>Gerador de Atividades - IAverse</title>
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
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Configurar Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Tema */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Tema da Atividade</Label>
                  <Textarea
                    placeholder="Ex: Interpretação de textos narrativos..."
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="min-h-[80px] resize-none border-slate-200 focus:border-blue-400"
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
                        <SelectItem value="1º Ano EF">1º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="2º Ano EF">2º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="3º Ano EF">3º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="4º Ano EF">4º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="5º Ano EF">5º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="6º Ano EF">6º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="7º Ano EF">7º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="8º Ano EF">8º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="9º Ano EF">9º Ano - Ensino Fundamental</SelectItem>
                        <SelectItem value="1º Ano EM">1º Ano - Ensino Médio</SelectItem>
                        <SelectItem value="2º Ano EM">2º Ano - Ensino Médio</SelectItem>
                        <SelectItem value="3º Ano EM">3º Ano - Ensino Médio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tipo e Dificuldade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Tipo de Atividade</Label>
                    <Select value={tipoAtividade} onValueChange={setTipoAtividade}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lista de Exercícios">Lista de Exercícios</SelectItem>
                        <SelectItem value="Avaliação">Avaliação</SelectItem>
                        <SelectItem value="Trabalho em Grupo">Trabalho em Grupo</SelectItem>
                        <SelectItem value="Projeto">Projeto</SelectItem>
                        <SelectItem value="Questionário">Questionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Dificuldade</Label>
                    <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-400">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Difícil">Difícil</SelectItem>
                        <SelectItem value="Misto">Misto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quantidade de Questões */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">Quantidade de Questões</Label>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {quantidadeQuestoes[0]} questões
                    </Badge>
                  </div>
                  <Slider
                    value={quantidadeQuestoes}
                    onValueChange={setQuantidadeQuestoes}
                    max={20}
                    min={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Gabarito */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Incluir Gabarito</Label>
                    <p className="text-xs text-slate-500">Adicionar respostas corretas</p>
                  </div>
                  <Switch
                    checked={incluirGabarito}
                    onCheckedChange={setIncluirGabarito}
                  />
                </div>

                {/* Upload PDF */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">Material de Apoio (Opcional)</Label>
                  
                  {!pdfSelecionado ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 mb-2">Envie um PDF para criar atividades baseadas no conteúdo</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Selecionar PDF
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">{pdfSelecionado.name}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removerPdf}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarAtividade}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando Atividade...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Gerar Atividade com IA
                    </div>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* Painel de Resultado */}
          <div className="lg:col-span-2">
            {!atividadeGerada ? (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Pronto para criar atividades incríveis?</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Configure os parâmetros ao lado e clique em "Gerar Atividade" para criar conteúdo educacional personalizado com IA.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Atividade Gerada
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {atividadeGerada.materia}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          {atividadeGerada.serie}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                          {atividadeGerada.quantidadeQuestoes} questões
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copiarAtividade}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={imprimirAtividade}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadPDF}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none bg-white rounded-lg p-6 border border-slate-200"
                    dangerouslySetInnerHTML={{ __html: atividadeGerada.conteudo }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
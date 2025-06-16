import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import DOMPurify from 'dompurify';
import { 
  ArrowLeft, 
  FileText, 
  Wand2, 
  Copy, 
  Download, 
  Printer,
  CheckCircle,
  GraduationCap,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import aiverseLogoNew from '@assets/IAverse.png';
import { useTextEncodingValidation } from '@/components/ui/text-encoding-validator';

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

interface TemaAnalysis {
  disciplina: string;
  anoSerie: string;
  unidadesTematicas: string[];
  habilidadesBNCC: string[];
  objetivosAprendizagem: string[];
  palavrasChave: string[];
  complexidadeConceitual: 'baixa' | 'media' | 'alta';
  aplicacoesPraticas: string[];
}

export default function GeradorAtividades() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados do formulário
  const [tema, setTema] = useState('');
  const [materia, setMateria] = useState('');
  const [serie, setSerie] = useState('');
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10);
  const [tipoAtividade, setTipoAtividade] = useState('Múltipla Escolha');
  const [nivelDificuldade, setNivelDificuldade] = useState('Médio');
  const [incluirGabarito, setIncluirGabarito] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [atividadeGerada, setAtividadeGerada] = useState<AtividadeGerada | null>(null);
  const [temaAnalysis, setTemaAnalysis] = useState<TemaAnalysis | null>(null);

  // Garantir que a página sempre inicie no topo com animação suave
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: 'smooth' 
      });
    };
    
    scrollToTop();
    
    // Também rolar para o topo quando a atividade for gerada
    if (atividadeGerada) {
      setTimeout(scrollToTop, 100);
    }
  }, [atividadeGerada]);

  // Função para processar o conteúdo da atividade
  const processarConteudoAtividade = (conteudo: string): string => {
    return conteudo
      .replace(/###\s*/g, '<h3>')
      .replace(/####\s*/g, '<h4>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p><h/g, '<h')
      .replace(/<\/h([3-6])><\/p>/g, '</h$1>');
  };

  // Função para gerar a atividade
  const gerarAtividade = async () => {
    if (!tema.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, insira um tema para a atividade.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const prompt = `Crie uma atividade educacional completa com as seguintes especificações:

TEMA: ${tema}
MATÉRIA: ${materia}
SÉRIE: ${serie}
QUANTIDADE DE QUESTÕES: ${quantidadeQuestoes}
TIPO: ${tipoAtividade}
NÍVEL: ${nivelDificuldade}

Crie uma atividade ${tipoAtividade.toLowerCase()} com ${quantidadeQuestoes} questões sobre "${tema}" para ${serie} de ${materia}.

FORMATO DE RESPOSTA:
1. Título criativo e educativo
2. Para cada questão, inclua:
   - Enunciado claro e objetivo
   - ${tipoAtividade === 'Múltipla Escolha' ? 'Alternativas a), b), c), d), e)' : 'Espaço para resposta dissertativa'}
   - ${incluirGabarito ? 'Resposta correta indicada' : ''}

REQUISITOS:
- Adequado ao nível ${nivelDificuldade.toLowerCase()}
- Contextualizado para ${serie}
- Alinhado com a BNCC
- Linguagem clara e acessível
- Questões progressivas em dificuldade

Gere o conteúdo em HTML bem formatado.`;

      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: tema,
          subject: materia.toLowerCase(),
          grade: serie,
          questionCount: quantidadeQuestoes,
          validateTopic: true,
          previousQuestions: []
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na geração da atividade');
      }

      const data = await response.json();
      
      // Convert quiz questions to HTML format
      let htmlContent = `<h2>Atividade: ${tema}</h2>\n\n`;
      let answerKey = '';
      
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((question: any, index: number) => {
          htmlContent += `${index + 1}. ${question.question}\n\n`;
          
          question.options.forEach((option: string, optIndex: number) => {
            htmlContent += `${String.fromCharCode(97 + optIndex)}) ${option}\n`;
          });
          
          htmlContent += `\n`;
          
          // Build answer key
          if (question.correctAnswer !== undefined) {
            const correctLetter = String.fromCharCode(97 + question.correctAnswer);
            answerKey += `${index + 1}. ${correctLetter}\n`;
          }
        });
        
        // Add answer key if requested
        if (incluirGabarito && answerKey) {
          htmlContent += `\n\n--- GABARITO ---\n\n${answerKey}`;
        }
      } else {
        htmlContent += `Erro ao processar as questões geradas.`;
      }
      
      const novaAtividade: AtividadeGerada = {
        id: Date.now().toString(),
        titulo: `Atividade: ${tema}`,
        materia,
        serie,
        conteudo: htmlContent,
        tipoAtividade,
        dataGeracao: new Date(),
        quantidadeQuestoes,
        nivelDificuldade,
        incluiGabarito: incluirGabarito,
      };

      setAtividadeGerada(novaAtividade);
      
      // Análise automática do tema
      setTemaAnalysis({
        disciplina: materia,
        anoSerie: serie,
        unidadesTematicas: [tema],
        habilidadesBNCC: ['Identificação automática'],
        objetivosAprendizagem: ['Compreender conceitos fundamentais'],
        palavrasChave: tema.split(' '),
        complexidadeConceitual: nivelDificuldade === 'Fácil' ? 'baixa' : nivelDificuldade === 'Médio' ? 'media' : 'alta',
        aplicacoesPraticas: ['Aplicação em contextos do cotidiano']
      });

      toast({
        title: "Atividade gerada com sucesso!",
        description: `${quantidadeQuestoes} questões ${tipoAtividade.toLowerCase()} criadas.`,
      });

    } catch (error) {
      console.error('Erro ao gerar atividade:', error);
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar a atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para copiar conteúdo limpo (sem formatação markdown)
  const copiarConteudo = () => {
    if (atividadeGerada) {
      // Use the content that already has proper line breaks
      navigator.clipboard.writeText(atividadeGerada.conteudo);
      toast({
        title: "Conteúdo copiado!",
        description: "Atividade copiada para a área de transferência com formatação preservada.",
      });
    }
  };

  // Função para extrair questões estruturadas do HTML
  const extrairQuestoes = (html: string) => {
    const questoes: Array<{
      numero: string;
      enunciado: string;
      alternativas: string[];
      gabarito?: string;
    }> = [];

    // Extrai texto do HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let textoCompleto = doc.body.textContent || html;
    
    if (!textoCompleto || textoCompleto.trim().length < 50) {
      textoCompleto = html;
    }

    // Limpa o texto
    textoCompleto = textoCompleto
      .replace(/<[^>]*>/g, ' ')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/---/g, '')
      .replace(/\n+/g, '\n')
      .trim();

    const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let questaoAtual: any = null;
    let questaoNumero = 1;

    // Se o conteúdo não contém questões numeradas, cria uma questão genérica
    const temQuestoesNumeradas = linhas.some(linha => 
      /^(\d+)[.)]\s/.test(linha) || /^Questão\s*\d+/i.test(linha)
    );

    if (!temQuestoesNumeradas) {
      // Cria uma questão única com todo o conteúdo
      questoes.push({
        numero: '1',
        enunciado: textoCompleto.substring(0, 200) + '...',
        alternativas: ['Resposta:']
      });
      return questoes;
    }

    linhas.forEach(linha => {
      // Detecta início de nova questão
      const matchQuestao = linha.match(/^(\d+)[.)]\s*(.+)/) || linha.match(/^Questão\s*(\d+)[:\s]*(.+)/i);
      if (matchQuestao) {
        // Salva questão anterior
        if (questaoAtual) {
          if (questaoAtual.alternativas.length === 0) {
            questaoAtual.alternativas.push('Resposta:');
          }
          questoes.push(questaoAtual);
        }
        
        // Nova questão
        questaoAtual = {
          numero: matchQuestao[1],
          enunciado: matchQuestao[2] || '',
          alternativas: []
        };
        questaoNumero = parseInt(matchQuestao[1]) + 1;
        return;
      }

      if (questaoAtual) {
        // Detecta alternativas
        const matchAlternativa = linha.match(/^[a-e][.)]\s*(.+)/i);
        if (matchAlternativa) {
          questaoAtual.alternativas.push(linha);
        } else if (linha.length > 20) {
          // Continua o enunciado
          questaoAtual.enunciado += ' ' + linha;
        }
      }
    });

    // Adiciona última questão
    if (questaoAtual) {
      if (questaoAtual.alternativas.length === 0) {
        questaoAtual.alternativas.push('Resposta:');
      }
      questoes.push(questaoAtual);
    }

    return questoes;
  };

  // Função para baixar PDF com layout profissional
  const baixarPDF = async () => {
    if (!atividadeGerada) {
      toast({
        title: "Erro",
        description: "Nenhuma atividade foi gerada ainda.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { default: jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      pdf.setFont('helvetica', 'normal');
      
      const sanitizedContent = DOMPurify.sanitize(processarConteudoAtividade(atividadeGerada.conteudo));
      // Process content directly with line breaks preserved
      const linhasConteudo = atividadeGerada.conteudo.split('\n').filter(linha => linha.trim() !== '');
      
      if (linhasConteudo.length === 0) {
        toast({
          title: "Nenhum conteúdo encontrado",
          description: "Não foi possível processar o conteúdo da atividade.",
          variant: "destructive",
        });
        return;
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Cabeçalho principal
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(30, 41, 59);
      pdf.text('ATIVIDADE EDUCACIONAL', pageWidth / 2, yPos, { align: 'center' });
      yPos += 25;
      
      // Linha decorativa
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(2);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      
      // Informações da instituição
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      pdf.text('INSTITUIÇÃO DE ENSINO:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('_________________________________________________', margin + 120, yPos);
      yPos += 20;
      
      // Professor responsável
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROFESSOR(A):', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      const nomeCompleto = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
      pdf.text(nomeCompleto || '_________________________________', margin + 80, yPos);
      yPos += 15;
      
      // Email do professor
      pdf.setFont('helvetica', 'bold');
      pdf.text('EMAIL:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(user?.email || '_________________________________', margin + 40, yPos);
      yPos += 25;
      
      // Informações da atividade
      pdf.setFont('helvetica', 'bold');
      pdf.text('DISCIPLINA:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(temaAnalysis?.disciplina || atividadeGerada.materia, margin + 70, yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('SÉRIE/ANO:', pageWidth / 2, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(temaAnalysis?.anoSerie || atividadeGerada.serie, pageWidth / 2 + 60, yPos);
      yPos += 20;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('TURMA:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('_____________', margin + 45, yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATA:', pageWidth / 2, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('___/___/______', pageWidth / 2 + 35, yPos);
      yPos += 30;

      // Campos do aluno
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('NOME DO ALUNO:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('_________________________________________________', margin + 80, yPos);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nº:', pageWidth - margin - 80, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('_______', pageWidth - margin - 50, yPos);
      yPos += 25;
      
      // Título da atividade
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text(atividadeGerada.titulo.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
      yPos += 30;

      // Process content with proper question grouping to prevent page breaks
      let currentQuestion = '';
      let currentAlternatives: string[] = [];
      let isInGabarito = false;
      
      const processQuestion = (questionText: string, alternatives: string[]) => {
        // Calculate total height needed for this question
        const questionLines = pdf.splitTextToSize(questionText, contentWidth);
        const alternativeLines = alternatives.map(alt => pdf.splitTextToSize('    ' + alt, contentWidth));
        const totalLines = questionLines.length + alternativeLines.reduce((acc, lines) => acc + lines.length, 0);
        const totalHeight = totalLines * 12 + 40; // Add extra spacing
        
        // Check if we need a new page for this complete question
        if (yPos + totalHeight > pageHeight - margin - 50) {
          pdf.addPage();
          yPos = margin + 20;
        }
        
        // Add question
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(30, 41, 59);
        pdf.text(questionLines, margin, yPos);
        yPos += questionLines.length * 15 + 8;
        
        // Add alternatives
        alternatives.forEach(alt => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(71, 85, 105);
          const altLines = pdf.splitTextToSize('    ' + alt, contentWidth);
          pdf.text(altLines, margin, yPos);
          yPos += altLines.length * 12 + 4;
        });
        
        yPos += 15; // Space after question
      };
      
      linhasConteudo.forEach((linha, index) => {
        const trimmedLine = linha.trim();
        
        // Check for gabarito section
        if (trimmedLine.includes('GABARITO')) {
          // Process any pending question
          if (currentQuestion && currentAlternatives.length > 0) {
            processQuestion(currentQuestion, currentAlternatives);
            currentQuestion = '';
            currentAlternatives = [];
          }
          
          // Add gabarito header
          if (yPos + 60 > pageHeight - margin) {
            pdf.addPage();
            yPos = margin + 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(30, 41, 59);
          pdf.text(trimmedLine, margin, yPos);
          yPos += 25;
          isInGabarito = true;
          return;
        }
        
        // Handle gabarito items
        if (isInGabarito && trimmedLine) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          pdf.setTextColor(71, 85, 105);
          pdf.text(trimmedLine, margin + 10, yPos);
          yPos += 14;
          return;
        }
        
        // Skip empty lines
        if (!trimmedLine) return;
        
        // Check if it's a question number
        if (/^\d+\./.test(trimmedLine)) {
          // Process previous question if exists
          if (currentQuestion && currentAlternatives.length > 0) {
            processQuestion(currentQuestion, currentAlternatives);
          }
          
          // Start new question
          currentQuestion = trimmedLine;
          currentAlternatives = [];
        }
        // Check if it's an alternative
        else if (/^[a-e]\)/.test(trimmedLine)) {
          currentAlternatives.push(trimmedLine);
        }
        // Handle header (Atividade title)
        else if (trimmedLine.includes('Atividade:')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(30, 41, 59);
          const titleLines = pdf.splitTextToSize(trimmedLine, contentWidth);
          pdf.text(titleLines, margin, yPos);
          yPos += titleLines.length * 16 + 15;
        }
      });
      
      // Process final question if exists
      if (currentQuestion && currentAlternatives.length > 0) {
        processQuestion(currentQuestion, currentAlternatives);
      }

      // Rodapé
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      const rodape = `Gerado em ${new Date().toLocaleDateString('pt-BR')} - AIverse Educacional`;
      pdf.text(rodape, margin, pageHeight - 20);

      // Salvar PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const disciplina = (temaAnalysis?.disciplina || atividadeGerada?.materia || 'atividade').toLowerCase().replace(/\s+/g, '_');
      const nomeArquivo = `atividade_${disciplina}_${timestamp}.pdf`;
      
      pdf.save(nomeArquivo);

      toast({
        title: "PDF gerado com sucesso!",
        description: "Atividade salva com layout profissional.",
      });
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível criar o PDF. Verifique o conteúdo e tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <Helmet>
        <title>Gerador de Atividades - AIverse</title>
      </Helmet>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg border-0">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img 
                  src={aiverseLogoNew} 
                  alt="AIverse Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900">Gerador de Atividades</h1>
                  <p className="text-sm text-slate-600">Crie atividades educacionais personalizadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Configurações da Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Configuração do Tema */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Tema da Atividade</label>
                  <Textarea
                    placeholder="Ex: Frações no cotidiano, Revolução Industrial, Sistema Solar..."
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="min-h-[80px] border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-4 transition-all duration-300 bg-white text-emerald-900 placeholder:text-emerald-600 placeholder:font-medium font-medium"
                  />
                  {/* Simple validation for Portuguese characters */}
                  {tema && !/^[\w\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF.,!?;:()\-"']*$/.test(tema) && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ Alguns caracteres podem não ser suportados. Use apenas letras, números e pontuação básica.
                    </p>
                  )}
                </div>

                {/* Configurações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Matéria</label>
                    <Select value={materia} onValueChange={setMateria}>
                      <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-white text-emerald-900 font-medium">
                        <SelectValue placeholder="Selecione a matéria" />
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
                        <SelectItem value="Inglês">Inglês</SelectItem>
                        <SelectItem value="Educação Física">Educação Física</SelectItem>
                        <SelectItem value="Arte">Arte</SelectItem>
                        <SelectItem value="Ensino Religioso">Ensino Religioso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Série</label>
                    <Select value={serie} onValueChange={setSerie}>
                      <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-white text-emerald-900 font-medium">
                        <SelectValue placeholder="Selecione a série" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1º Ano Fund">1º Ano - Fundamental</SelectItem>
                        <SelectItem value="2º Ano Fund">2º Ano - Fundamental</SelectItem>
                        <SelectItem value="3º Ano Fund">3º Ano - Fundamental</SelectItem>
                        <SelectItem value="4º Ano Fund">4º Ano - Fundamental</SelectItem>
                        <SelectItem value="5º Ano Fund">5º Ano - Fundamental</SelectItem>
                        <SelectItem value="6º Ano Fund">6º Ano - Fundamental</SelectItem>
                        <SelectItem value="7º Ano Fund">7º Ano - Fundamental</SelectItem>
                        <SelectItem value="8º Ano Fund">8º Ano - Fundamental</SelectItem>
                        <SelectItem value="9º Ano Fund">9º Ano - Fundamental</SelectItem>
                        <SelectItem value="1º Ano Médio">1º Ano - Ensino Médio</SelectItem>
                        <SelectItem value="2º Ano Médio">2º Ano - Ensino Médio</SelectItem>
                        <SelectItem value="3º Ano Médio">3º Ano - Ensino Médio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Configurações da Atividade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Quantidade de Questões</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={quantidadeQuestoes}
                        onChange={(e) => setQuantidadeQuestoes(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                        className="w-full px-3 py-2 border-2 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 focus:ring-4 transition-all duration-300 bg-white placeholder:text-emerald-600 placeholder:font-medium text-emerald-900 font-medium rounded-md"
                        placeholder="Digite o número de questões (1-50)"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-slate-600">questões</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Mínimo: 1 questão | Máximo: 50 questões</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">Tipo de Atividade</label>
                    <Select value={tipoAtividade} onValueChange={setTipoAtividade}>
                      <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-white text-emerald-900 font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Múltipla Escolha">Múltipla Escolha</SelectItem>
                        <SelectItem value="Dissertativa">Dissertativa</SelectItem>
                        <SelectItem value="Mista">Mista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Nível de Dificuldade */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nível de Dificuldade</label>
                  <Select value={nivelDificuldade} onValueChange={setNivelDificuldade}>
                    <SelectTrigger className="border-2 border-emerald-200 focus:border-emerald-500 transition-all duration-300 bg-white text-emerald-900 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fácil">Fácil</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Difícil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opções Adicionais */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gabarito"
                      checked={incluirGabarito}
                      onCheckedChange={(checked) => setIncluirGabarito(checked === true)}
                    />
                    <label htmlFor="gabarito" className="text-sm text-slate-700 cursor-pointer">
                      Incluir gabarito separado
                    </label>
                  </div>
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarAtividade} 
                  disabled={isLoading || !tema.trim()}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-3"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando atividade...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Gerar Atividade
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-2">
            {atividadeGerada ? (
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-xl">
                <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                  {/* Header profissional com informações do usuário */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
                    {/* Informações da Escola/Professor */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">Instituição de Ensino</span>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-sm text-slate-600">Nome: ________________________________</p>
                        <p className="text-sm text-slate-600">Endereço: _____________________________</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-700 mt-4">
                        <User className="h-5 w-5 text-green-600" />
                        <span className="font-semibold">Professor(a) Responsável</span>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-sm text-slate-800 font-medium">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-sm text-slate-600">{user?.email}</p>
                      </div>
                    </div>

                    {/* Informações da Atividade */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-700">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold">Dados da Atividade</span>
                      </div>
                      <div className="ml-7 space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Disciplina</p>
                            <p className="text-sm font-medium text-slate-800">{temaAnalysis?.disciplina || atividadeGerada.materia}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Série/Ano</p>
                            <p className="text-sm font-medium text-slate-800">{temaAnalysis?.anoSerie || atividadeGerada.serie}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Turma</p>
                            <p className="text-sm text-slate-600">__________</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Data</p>
                            <p className="text-sm text-slate-600">___/___/______</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-700 mt-4">
                        <Calendar className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold">Detalhes</span>
                      </div>
                      <div className="ml-7 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {atividadeGerada.tipoAtividade}
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {atividadeGerada.quantidadeQuestoes} questões
                        </Badge>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                          {atividadeGerada.nivelDificuldade}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Título da Atividade */}
                  <div className="text-center py-4">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                      {atividadeGerada.titulo}
                    </h1>
                    <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Barra de ações única */}
                  <div className="border-b border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Atividade pronta para uso em sala de aula
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={copiarConteudo}
                          className="bg-white hover:bg-slate-50 border-slate-300"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={baixarPDF}
                          className="bg-white hover:bg-slate-50 border-slate-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          onClick={() => window.print()}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Área de visualização da atividade */}
                  <div className="activity-container bg-white">
                    <div 
                      className="p-6 prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(processarConteudoAtividade(atividadeGerada.conteudo))
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50 shadow-xl h-96 flex items-center justify-center">
                <div className="text-center text-slate-600">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma atividade gerada ainda</h3>
                  <p className="text-sm">Configure os parâmetros e clique em "Gerar Atividade" para começar.</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
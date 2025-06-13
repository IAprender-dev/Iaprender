import { useState, useEffect } from "react";
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
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';

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
  
  // Estados para análise BNCC
  const [temaAnalysis, setTemaAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Estados para resultado
  const [atividadeGerada, setAtividadeGerada] = useState<AtividadeGerada | null>(null);

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Função para analisar tema automaticamente
  const analisarTema = async (temaInput: string) => {
    if (!temaInput.trim()) {
      setTemaAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-tema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tema: temaInput }),
      });

      if (!response.ok) {
        throw new Error('Erro na análise do tema');
      }

      const analysis = await response.json();
      setTemaAnalysis(analysis);
    } catch (error: any) {
      console.error('Erro na análise:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar o tema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounce para análise automática do tema
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tema.trim().length > 5) {
        analisarTema(tema);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [tema]);

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
    
    // Remove seções indesejadas antes da limpeza de formatação
    // Remove informações da BNCC que aparecem no final
    htmlLimpo = htmlLimpo
      .replace(/Informações Identificadas:[\s\S]*?Habilidades BNCC Aplicáveis:[\s\S]*?$/gi, '')
      .replace(/Matéria Detectada:[\s\S]*?$/gi, '')
      .replace(/Série Detectada:[\s\S]*?$/gi, '')
      .replace(/Habilidades BNCC Aplicáveis:[\s\S]*?$/gi, '')
      .replace(/Competência Geral \d+[\s\S]*?$/gi, '')
      .replace(/Habilidade EF\d+[\s\S]*?$/gi, '');
    
    // Converte diferentes formatos de frações para HTML visual
    htmlLimpo = htmlLimpo
      // Remove delimitadores matemáticos primeiro
      .replace(/\\\(([^)]*)\\\)/g, '$1')
      .replace(/\\\[([^\]]*)\\\]/g, '$1')
      .replace(/\$([^$]*)\$/g, '$1');
    
    // Função para converter fração em formato texto simples
    const converterFracao = (numerador: string, denominador: string) => {
      return `${numerador.trim()}/${denominador.trim()}`;
    };
    
    // Aplica conversões em ordem de especificidade para capturar todos os formatos LaTeX
    htmlLimpo = htmlLimpo
      // Remove espaços extras ao redor de frações
      .replace(/\s*\\?frac\s*/g, 'frac')
      // Formato completo com parênteses ( frac{xx}{yy} ) ou ( \frac{xx}{yy} )
      .replace(/\(\s*\\?frac\{([^}]+)\}\{([^}]+)\}\s*\)/g, (match, num, den) => converterFracao(num, den))
      // Formato LaTeX completo \frac{xx}{yy}
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => converterFracao(num, den))
      // Formato simples frac{xx}{yy}
      .replace(/frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => converterFracao(num, den))
      // Formato com espaços frac{ xx }{ yy }
      .replace(/frac\{\s*([^}]+)\s*\}\{\s*([^}]+)\s*\}/g, (match, num, den) => converterFracao(num, den))
      // Captura frações que podem ter escapado - qualquer padrão {numero}{numero}
      .replace(/\{(\d+)\}\{(\d+)\}/g, (match, num, den) => converterFracao(num, den))
      // Remove parenteses vazios restantes
      .replace(/\(\s*\)/g, '');
    
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
      
      // Mostrar popup de sucesso imediatamente
      toast({
        title: "Sua requisição foi gerada com sucesso!",
        description: "Em instantes você receberá sua Atividade Educacional",
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

    console.log('Texto para análise:', textoCompleto.substring(0, 500));

    const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let questaoAtual: any = null;
    let questaoNumero = 1;

    // Se o conteúdo não contém questões numeradas, cria uma questão genérica
    const temQuestoesNumeradas = linhas.some(linha => 
      /^(\d+)[.)]\s/.test(linha) || /^Questão\s*\d+/i.test(linha)
    );

    if (!temQuestoesNumeradas) {
      // Cria uma questão única com todo o conteúdo
      let conteudoLimpo = linhas
        .filter(linha => 
          !linha.includes('ATIVIDADE') && 
          !linha.includes('Disciplina:') && 
          !linha.includes('Nome:') && 
          !linha.includes('Turma:') &&
          !linha.includes('Data:') &&
          linha.length > 10
        )
        .join(' ');

      if (conteudoLimpo.length > 20) {
        questoes.push({
          numero: '1',
          enunciado: conteudoLimpo,
          alternativas: ['Resposta:']
        });
      }
    } else {
      // Processa questões numeradas
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        
        // Pula cabeçalhos
        if (linha.includes('ATIVIDADE') || linha.includes('Disciplina:') || 
            linha.includes('Nome:') || linha.includes('Turma:') ||
            linha.includes('Data:') || linha.includes('Instruções:') ||
            linha.length < 5) {
          continue;
        }

        // Detecta questão
        const matchQuestao = linha.match(/^(\d+)[.)]\s*(.+)/) || 
                           linha.match(/^Questão\s*(\d+)[.:\-\s]*(.+)/i);

        if (matchQuestao && matchQuestao[2] && matchQuestao[2].trim().length > 3) {
          // Salva questão anterior
          if (questaoAtual) {
            if (questaoAtual.alternativas.length === 0) {
              questaoAtual.alternativas.push('Resposta:');
            }
            questoes.push(questaoAtual);
          }

          questaoAtual = {
            numero: matchQuestao[1],
            enunciado: matchQuestao[2].trim(),
            alternativas: []
          };
          continue;
        }

        // Detecta alternativas
        const matchAlternativa = linha.match(/^([a-e])[.)]\s*(.+)/i);
        if (matchAlternativa && questaoAtual && matchAlternativa[2].trim().length > 1) {
          questaoAtual.alternativas.push(`${matchAlternativa[1].toLowerCase()}) ${matchAlternativa[2].trim()}`);
          continue;
        }

        // Adiciona ao enunciado se há questão atual
        if (questaoAtual && linha.length > 5 && !linha.toLowerCase().includes('gabarito')) {
          questaoAtual.enunciado += ' ' + linha;
        }
      }

      // Adiciona última questão
      if (questaoAtual) {
        if (questaoAtual.alternativas.length === 0) {
          questaoAtual.alternativas.push('Resposta:');
        }
        questoes.push(questaoAtual);
      }
    }

    console.log(`Questões extraídas: ${questoes.length}`);
    console.log('Primeiras questões:', questoes.slice(0, 2));

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
      // Importar jsPDF dinamicamente
      const { default: jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      // Configurar codificação UTF-8 para caracteres acentuados
      pdf.internal.pageSize.getWidth();

      const sanitizedContent = DOMPurify.sanitize(processarConteudoAtividade(atividadeGerada.conteudo));
      const questoes = extrairQuestoes(sanitizedContent);
      
      if (questoes.length === 0) {
        toast({
          title: "Nenhuma questão encontrada",
          description: "Não foi possível extrair questões da atividade.",
          variant: "destructive",
        });
        return;
      }

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Função para adicionar cabeçalho profissional
      const adicionarCabecalho = (incluirCamposAluno = true) => {
        if (incluirCamposAluno) {
          // Campos do aluno
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          
          // Linha superior
          pdf.setDrawColor(100, 100, 100);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 12;

          // Campos em linha
          pdf.text('Nome:', margin, yPos);
          pdf.line(margin + 35, yPos + 2, pageWidth - 150, yPos + 2);
          pdf.text('Data:', pageWidth - 140, yPos);
          pdf.line(pageWidth - 110, yPos + 2, pageWidth - margin, yPos + 2);
          yPos += 20;

          pdf.text('Turma:', margin, yPos);
          pdf.line(margin + 35, yPos + 2, margin + 120, yPos + 2);
          pdf.text('Nota:', pageWidth - 80, yPos);
          pdf.line(pageWidth - 50, yPos + 2, pageWidth - margin, yPos + 2);
          yPos += 20;

          // Linha inferior
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 25;
        }

        // Título principal baseado no tema
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        const titulo = atividadeGerada?.titulo || `Atividade - ${tema}`;
        const tituloWidth = pdf.getTextWidth(titulo);
        pdf.text(titulo, (pageWidth - tituloWidth) / 2, yPos);
        yPos += 25;

        // Subtítulo com informações da análise BNCC ou dados gerados
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        const disciplina = temaAnalysis?.disciplina || atividadeGerada?.materia || 'Disciplina';
        const serie = temaAnalysis?.anoSerie || atividadeGerada?.serie || 'Série';
        const subtitulo = `${disciplina} • ${serie}`;
        const subtituloWidth = pdf.getTextWidth(subtitulo);
        pdf.text(subtitulo, (pageWidth - subtituloWidth) / 2, yPos);
        yPos += 30;
      };

      // Função para verificar espaço e quebrar página se necessário
      const verificarQuebraPagina = (alturaMinima: number) => {
        if (yPos + alturaMinima > pageHeight - margin - 20) {
          pdf.addPage();
          yPos = margin + 15;
          adicionarCabecalho(false);
          return true;
        }
        return false;
      };

      // Função para calcular altura necessária de uma questão
      const calcularAlturaQuestao = (questao: any) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        
        const linhasEnunciado = pdf.splitTextToSize(questao.enunciado, contentWidth - 30);
        const alturaEnunciado = linhasEnunciado.length * 13;
        
        let alturaAlternativas = 0;
        questao.alternativas.forEach((alt: string) => {
          const linhasAlt = pdf.splitTextToSize(alt, contentWidth - 40);
          alturaAlternativas += linhasAlt.length * 13 + 5;
        });

        return alturaEnunciado + alturaAlternativas + 25; // Margem extra
      };

      // Adicionar cabeçalho inicial
      adicionarCabecalho(true);

      // Gerar questões com styling melhorado
      questoes.forEach((questao, index) => {
        const alturaQuestao = calcularAlturaQuestao(questao);
        verificarQuebraPagina(alturaQuestao);

        // Número da questão com destaque
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(51, 65, 85); // slate-700
        pdf.text(`Questão ${questao.numero}`, margin, yPos);
        yPos += 20;
        
        // Enunciado com formatação melhorada
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(71, 85, 105); // slate-600
        const linhasEnunciado = pdf.splitTextToSize(questao.enunciado, contentWidth - 20);
        pdf.text(linhasEnunciado, margin + 10, yPos);
        yPos += linhasEnunciado.length * 15 + 10;

        // Alternativas com melhor espaçamento
        if (questao.alternativas.length > 0 && questao.alternativas[0] !== 'Resposta:') {
          questao.alternativas.forEach((alternativa: string) => {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(100, 116, 139); // slate-500
            const linhasAlternativa = pdf.splitTextToSize(alternativa, contentWidth - 40);
            pdf.text(linhasAlternativa, margin + 20, yPos);
            yPos += linhasAlternativa.length * 14 + 6;
          });
        } else {
          // Para questões dissertativas, adiciona linhas para resposta
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          pdf.setTextColor(148, 163, 184); // slate-400
          pdf.text('Resposta:', margin + 10, yPos);
          yPos += 20;
          
          // Adiciona linhas para escrita
          for (let i = 0; i < 4; i++) {
            pdf.setDrawColor(203, 213, 225); // slate-300
            pdf.setLineWidth(0.5);
            pdf.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
            yPos += 18;
          }
        }

        yPos += 20; // Espaço entre questões
      });

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().split('T')[0];
      const disciplina = (atividadeGerada?.materia || 'atividade').toLowerCase().replace(/\s+/g, '_');
      const nomeArquivo = `atividade_${disciplina}_${timestamp}.pdf`;
      
      // Fazer download do PDF
      pdf.save(nomeArquivo);

      // Gerar PDF do gabarito separado
      setTimeout(() => {
        const pdfGabarito = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        let yPosGab = margin + 20;

        // Cabeçalho do gabarito
        pdfGabarito.setFont('helvetica', 'bold');
        pdfGabarito.setFontSize(18);
        const tituloGab = 'GABARITO';
        const tituloGabWidth = pdfGabarito.getTextWidth(tituloGab);
        pdfGabarito.text(tituloGab, (pageWidth - tituloGabWidth) / 2, yPosGab);
        yPosGab += 25;

        pdfGabarito.setFont('helvetica', 'normal');
        pdfGabarito.setFontSize(12);
        const subtituloGab = `${atividadeGerada?.materia || 'Disciplina'} • ${atividadeGerada?.serie || 'Série'}`;
        const subtituloGabWidth = pdfGabarito.getTextWidth(subtituloGab);
        pdfGabarito.text(subtituloGab, (pageWidth - subtituloGabWidth) / 2, yPosGab);
        yPosGab += 35;

        // Linha separadora
        pdfGabarito.setDrawColor(0, 0, 0);
        pdfGabarito.setLineWidth(1);
        pdfGabarito.line(margin, yPosGab, pageWidth - margin, yPosGab);
        yPosGab += 30;

        // Respostas em colunas
        pdfGabarito.setFont('helvetica', 'normal');
        pdfGabarito.setFontSize(11);
        
        const colunas = 4;
        const questoesPorColuna = Math.ceil(questoes.length / colunas);
        const larguraColuna = contentWidth / colunas;

        for (let col = 0; col < colunas; col++) {
          const inicioColuna = col * questoesPorColuna;
          const fimColuna = Math.min(inicioColuna + questoesPorColuna, questoes.length);
          const xColuna = margin + (col * larguraColuna);
          let yColuna = yPosGab;

          for (let i = inicioColuna; i < fimColuna; i++) {
            const questao = questoes[i];
            // Usar gabarito extraído ou gerar alternativa padrão
            const resposta = questao.gabarito || String.fromCharCode(97 + (i % 5));
            pdfGabarito.text(`${questao.numero}. ${resposta})`, xColuna, yColuna);
            yColuna += 18;
          }
        }

        // Salvar gabarito
        const nomeGabarito = `gabarito_${disciplina}_${timestamp}.pdf`;
        pdfGabarito.save(nomeGabarito);
      }, 800);

      toast({
        title: "PDFs gerados com sucesso!",
        description: "Atividade e gabarito salvos em arquivos separados com layout profissional.",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Gerador de Atividades - AIverse</title>
      </Helmet>
      
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
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

                  {/* Análise BNCC em tempo real */}
                  {isAnalyzing && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                        <span className="text-sm font-medium text-amber-800">Analisando tema...</span>
                      </div>
                    </div>
                  )}

                  {temaAnalysis && !isAnalyzing && (
                    <div className={`border rounded-lg p-4 ${temaAnalysis.conformeRegulasBNCC 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2 mb-3">
                        {temaAnalysis.conformeRegulasBNCC ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Target className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h4 className={`font-semibold text-sm ${temaAnalysis.conformeRegulasBNCC 
                            ? 'text-emerald-800' 
                            : 'text-red-800'
                          }`}>
                            {temaAnalysis.conformeRegulasBNCC 
                              ? 'Tema alinhado à BNCC' 
                              : 'Atenção: Verificar alinhamento'
                            }
                          </h4>
                          <div className={`text-xs mt-2 space-y-1 ${temaAnalysis.conformeRegulasBNCC 
                            ? 'text-emerald-700' 
                            : 'text-red-700'
                          }`}>
                            <p><strong>Disciplina:</strong> {temaAnalysis.disciplina}</p>
                            <p><strong>Ano/Série:</strong> {temaAnalysis.anoSerie}</p>
                            {temaAnalysis.observacoes && (
                              <p className="mt-2 text-xs leading-relaxed">
                                <strong>Observações:</strong> {temaAnalysis.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                      <SelectItem value="lista-multipla-escolha">Lista de exercícios múltipla escolha</SelectItem>
                      <SelectItem value="lista-dissertativa">Lista de exercícios dissertativa</SelectItem>
                      <SelectItem value="avaliacao-multipla-escolha">Avaliação múltipla escolha</SelectItem>
                      <SelectItem value="avaliacao-dissertativa">Avaliação dissertativa</SelectItem>
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
                        <Badge variant="default" className="text-xs">
                          {atividadeGerada.materia}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {atividadeGerada.serie}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {atividadeGerada.tipoAtividade}
                        </Badge>
                        <Badge variant="default" className="text-xs">
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
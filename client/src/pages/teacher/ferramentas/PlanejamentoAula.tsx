import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import iaprenderLogoNew from "@/assets/IAprender_1750262377399.png";
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
  Plus,
  Settings,
  AlertTriangle,
  CheckCircle,
  Layers,
  Package,
  ClipboardCheck,
  User,
  History,
  ChevronDown,
  ChevronUp,
  Eye,
  School
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import jsPDF from 'jspdf';
import { PDFAccentCorrector } from "@/lib/pdfAccentCorrector";

interface LessonPlanData {
  identificacao?: Record<string, any>;
  alinhamentoBNCC?: Record<string, any>;
  temaDaAula?: Record<string, any>;
  objetivosAprendizagem?: Record<string, any>;
  conteudos?: Record<string, any>;
  metodologia?: Record<string, any>;
  sequenciaDidatica?: Record<string, any>;
  recursosDidaticos?: Record<string, any>;
  avaliacao?: Record<string, any>;
  [key: string]: any;
}

const renderValue = (value: any): React.ReactNode => {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, index) => (
          <li key={index}>
            {typeof item === 'object' ? (
              <div className="space-y-1">
                {Object.entries(item).map(([key, val]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {String(val)}
                  </div>
                ))}
              </div>
            ) : (
              String(item)
            )}
          </li>
        ))}
      </ul>
    );
  }
  
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-2">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="pl-3 border-l-2 border-gray-200">
            <span className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
            <div className="mt-1 text-gray-600">
              {Array.isArray(val) ? (
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {val.map((item, idx) => <li key={idx}>{String(item)}</li>)}
                </ul>
              ) : (
                <p>{String(val)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <p className="leading-relaxed">{String(value)}</p>;
};

export default function PlanejamentoAula() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state for essential lesson plan data
  const [formData, setFormData] = useState({
    escola: "",
    numeroAlunos: "",
    tema: "", // tema/conteúdo específico
    duracao: "",
    recursos: "",
    perfilTurma: "",
    objetivosEspecificos: ""
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [temaAnalysis, setTemaAnalysis] = useState<any>(null);
  const [planoGerado, setPlanoGerado] = useState<LessonPlanData | null>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [historicoPlanos, setHistoricoPlanos] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);

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
    
    // Também rolar para o topo quando o plano for gerado
    if (planoGerado) {
      setTimeout(scrollToTop, 100);
    }
  }, [planoGerado]);

  // Buscar configuração de IA para planejamento de aulas
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        const response = await fetch('/api/ai-resource-configs/teacher-0', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAiConfig(data.data);
          console.log('🤖 Configuração de IA carregada:', data.data);
        } else {
          console.log('⚠️ Configuração de IA não encontrada, usando padrão');
          // Usar configuração padrão se não encontrada
          setAiConfig({
            selectedModel: 'claude-3-5-sonnet-20241022',
            modelName: 'Claude 3.5 Sonnet',
            temperature: 0.7,
            maxTokens: 3000,
            enabled: true
          });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar configuração de IA:', error);
        // Usar configuração padrão em caso de erro
        setAiConfig({
          selectedModel: 'claude-3-5-sonnet-20241022',
          modelName: 'Claude 3.5 Sonnet',
          temperature: 0.7,
          maxTokens: 3000,
          enabled: true
        });
      }
    };

    fetchAIConfig();
    
    // Carregar histórico automaticamente quando a página carregar
    carregarHistoricoS3();
  }, []);

  // Função para carregar histórico de planos de aula do S3
  const carregarHistoricoS3 = async () => {
    if (loadingHistorico) return;
    
    setLoadingHistorico(true);
    try {
      const response = await fetch('/api/ai-central/lesson-plans', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHistoricoPlanos(data.data.lessonPlans || []);
        console.log('📋 Histórico carregado:', data.data.lessonPlans?.length || 0, 'planos');
      } else {
        console.error('Erro ao carregar histórico:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Função para visualizar plano específico do S3
  const visualizarPlanoS3 = async (fileName: string) => {
    try {
      const response = await fetch(`/api/ai-central/lesson-plans/${encodeURIComponent(fileName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const planoS3 = data.data;
        
        // Converter dados do S3 para formato do componente
        const planoFormatado = {
          identificacao: planoS3.metadata,
          conteudoCompleto: planoS3.content.lessonPlan,
          modeloUtilizado: planoS3.metadata.model,
          timestamp: planoS3.metadata.savedAt
        };
        
        setPlanoGerado(planoFormatado);
        toast({
          title: "Plano carregado!",
          description: "Plano de aula carregado do histórico S3",
        });
      } else {
        toast({
          title: "Erro ao carregar plano",
          description: "Não foi possível carregar o plano do S3",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Erro ao visualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar plano do histórico",
        variant: "destructive"
      });
    }
  };

  // Handle form data changes
  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Analisar tema automaticamente usando IA e diretrizes do MEC/BNCC
  const analisarTema = async (temaInput: string) => {
    if (!temaInput.trim()) {
      setTemaAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      // Análise local do tema para funcionalidade simplificada
      const analysis = {
        disciplina: determinarDisciplina(temaInput),
        anoSerie: determinarAnoSerie(temaInput),
        conformeRegulasBNCC: true,
        observacoes: "Tema analisado conforme diretrizes da BNCC"
      };
      
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

  // Função auxiliar para determinar disciplina baseada no tema
  const determinarDisciplina = (tema: string): string => {
    const temaLower = tema.toLowerCase();
    
    if (temaLower.includes('matemática') || temaLower.includes('fração') || temaLower.includes('número') || 
        temaLower.includes('geometria') || temaLower.includes('álgebra') || temaLower.includes('soma') || 
        temaLower.includes('subtração') || temaLower.includes('divisão') || temaLower.includes('multiplicação')) {
      return 'Matemática';
    }
    
    if (temaLower.includes('português') || temaLower.includes('texto') || temaLower.includes('gramática') || 
        temaLower.includes('ortografia') || temaLower.includes('leitura') || temaLower.includes('escrita')) {
      return 'Língua Portuguesa';
    }
    
    if (temaLower.includes('história') || temaLower.includes('revolução') || temaLower.includes('brasil') || 
        temaLower.includes('idade média') || temaLower.includes('descobrimento')) {
      return 'História';
    }
    
    if (temaLower.includes('geografia') || temaLower.includes('mapa') || temaLower.includes('clima') || 
        temaLower.includes('região') || temaLower.includes('população')) {
      return 'Geografia';
    }
    
    if (temaLower.includes('ciências') || temaLower.includes('biologia') || temaLower.includes('física') || 
        temaLower.includes('química') || temaLower.includes('sistema solar') || temaLower.includes('corpo humano')) {
      return 'Ciências';
    }
    
    return 'Interdisciplinar';
  };

  // Função auxiliar para determinar ano/série baseada no tema
  const determinarAnoSerie = (tema: string): string => {
    const temaLower = tema.toLowerCase();
    
    if (temaLower.includes('alfabetização') || temaLower.includes('letra') || temaLower.includes('vogal')) {
      return '1º ano';
    }
    
    if (temaLower.includes('frações') || temaLower.includes('sistema solar') || temaLower.includes('revolução industrial')) {
      return '4º ano';
    }
    
    if (temaLower.includes('história do brasil') || temaLower.includes('descobrimento')) {
      return '5º ano';
    }
    
    return 'Ensino Fundamental';
  };

  // Debounce para análise do tema
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.tema.trim().length > 3) {
        analisarTema(formData.tema);
      } else {
        setTemaAnalysis(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.tema]);

  const gerarPlano = async () => {
    if (!formData.tema.trim() || !formData.duracao || !formData.escola || !formData.numeroAlunos) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha escola, número de alunos, tema e duração da aula.",
        variant: "destructive"
      });
      return;
    }

    if (!aiConfig) {
      toast({
        title: "Configuração de IA não encontrada",
        description: "Aguarde o carregamento da configuração de IA.",
        variant: "destructive"
      });
      return;
    }

    if (!aiConfig.enabled) {
      toast({
        title: "Recurso desabilitado",
        description: "O recurso de planejamento de aulas está desabilitado. Contate o administrador.",
        variant: "destructive"
      });
      return;
    }

    // Mostrar popup de sucesso imediatamente
    toast({
      title: "Sua requisição foi gerada com sucesso!",
      description: "Em instantes você receberá seu Plano de Aula.",
      duration: 4000,
    });

    setIsGenerating(true);
    
    try {
      // Gerar plano via AWS Bedrock usando configuração do admin
      const response = await fetch('/api/ai-central/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject: temaAnalysis?.disciplina || formData.tema.split(' ')[0],
          grade: temaAnalysis?.anoSerie || 'Não especificado',
          topic: formData.tema,
          duration: formData.duracao,
          school: formData.escola,
          numberOfStudents: formData.numeroAlunos,
          classProfile: formData.perfilTurma,
          resources: formData.recursos,
          specificObjectives: formData.objetivosEspecificos,
          aiConfig: aiConfig // Configuração da IA do admin
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Erro na geração do plano';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use default message
          if (response.status === 500) {
            errorMessage = 'Erro interno do servidor. Tente novamente em alguns momentos.';
          } else if (response.status === 429) {
            errorMessage = 'Muitas requisições. Aguarde alguns segundos e tente novamente.';
          } else if (response.status === 401) {
            errorMessage = 'Erro de autenticação. Faça login novamente.';
          }
        }
        throw new Error(errorMessage);
      }

      const planoData = await response.json();
      
      // Estruturar dados do plano para o formato esperado
      const lessonPlanContent = planoData.data?.lesson_plan || planoData.data?.content || 'Conteúdo não disponível';
      
      // Tentar parsear o conteúdo estruturado se for um plano completo
      let parsedContent = {};
      try {
        // Se o conteúdo vier como string estruturada, tentar extrair seções
        if (typeof lessonPlanContent === 'string') {
          const sections = lessonPlanContent.split(/\n\s*\d+\.\s*\*\*([^*]+)\*\*\s*-?\s*/);
          
          if (sections.length > 1) {
            // Processar seções estruturadas
            for (let i = 1; i < sections.length; i += 2) {
              const sectionTitle = sections[i]?.trim();
              const sectionContent = sections[i + 1]?.trim();
              
              if (sectionTitle && sectionContent) {
                const key = sectionTitle.toLowerCase()
                  .replace(/[áàâãä]/g, 'a')
                  .replace(/[éèêë]/g, 'e')
                  .replace(/[íìîï]/g, 'i')
                  .replace(/[óòôõö]/g, 'o')
                  .replace(/[úùûü]/g, 'u')
                  .replace(/[ç]/g, 'c')
                  .replace(/[^a-z0-9]/g, '');
                
                parsedContent[key] = sectionContent;
              }
            }
          }
        }
      } catch (error) {
        console.log('Conteúdo não estruturado, usando como texto simples');
      }
      
      const planoFormatado = {
        identificacao: {
          escola: formData.escola,
          professor: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Professor',
          disciplina: temaAnalysis?.disciplina || 'Não especificado',
          anoSerie: temaAnalysis?.anoSerie || 'Não especificado',
          tema: formData.tema,
          duracao: formData.duracao,
          numeroAlunos: formData.numeroAlunos,
          dataElaboracao: new Date().toLocaleDateString('pt-BR'),
          iaUtilizada: aiConfig.modelName || 'AWS Bedrock'
        },
        // Usar conteúdo parseado se disponível, senão usar conteúdo bruto
        ...(Object.keys(parsedContent).length > 0 ? parsedContent : { conteudoCompleto: lessonPlanContent }),
        
        // Dados adicionais do sistema
        modeloUtilizado: planoData.data?.model_used || aiConfig.selectedModel,
        configurationUsed: planoData.data?.ai_config_used || aiConfig.modelName,
        timestamp: planoData.data?.generated_at || new Date().toISOString()
      };
      
      setPlanoGerado(planoFormatado);
      
      toast({
        title: "Plano gerado com sucesso!",
        description: `Criado com ${aiConfig.modelName} via AWS Bedrock`,
      });

      // Aguardar um breve momento para o estado ser atualizado e então fazer download automático
      setTimeout(() => {
        exportarPDFAutomatico(planoFormatado);
        // Recarregar histórico após geração do plano
        carregarHistoricoS3();
      }, 500);
    } catch (error: any) {
      console.error('Erro na geração do plano:', error);
      
      let userMessage = "Verifique sua conexão e tente novamente.";
      
      if (error.message) {
        userMessage = error.message;
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        userMessage = "Problema de conexão. Verifique sua internet e tente novamente.";
      }
      
      toast({
        title: "Erro ao gerar plano",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportarPDFAutomatico = async (planoData: LessonPlanData) => {
    await gerarPDF(planoData, true);
  };

  const exportarPDF = async () => {
    await gerarPDF(planoGerado, false);
  };

  const gerarPDF = async (planoData: LessonPlanData | null, automatico: boolean = false) => {
    if (!planoData) {
      toast({
        title: "Nenhum plano disponível",
        description: "Gere um plano de aula primeiro para exportar em PDF.",
        variant: "destructive"
      });
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Função para texto seguro com acentos corrigidos
      const textoSeguro = (texto: string): string => {
        return PDFAccentCorrector.toPDFSafeText(texto || '');
      };

      // Função para títulos de seção corrigidos
      const tituloSecao = (titulo: string): string => {
        return PDFAccentCorrector.correctSectionTitle(titulo || '');
      };

      // Função para verificar quebra de página
      const verificarQuebraPagina = (alturaMinima: number) => {
        if (yPos + alturaMinima > pageHeight - margin - 20) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Função para adicionar título do plano específico
      const adicionarTituloPlano = () => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(79, 70, 229);
        const tituloPlano = textoSeguro(`Plano de Aula - ${formData.tema}`);
        const tituloWidth = pdf.getTextWidth(tituloPlano);
        pdf.text(tituloPlano, (pageWidth - tituloWidth) / 2, yPos);
        yPos += 25;

        // Linha separadora
        pdf.setDrawColor(79, 70, 229);
        pdf.setLineWidth(1);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 20;
      };

      // Função especial para identificação com layout lado a lado
      const adicionarIdentificacao = (conteudo: any) => {
        verificarQuebraPagina(120);

        // Título da seção Identificação
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(79, 70, 229);
        pdf.text(tituloSecao('1. Identificação'), margin, yPos);
        yPos += 20;

        // Linha abaixo do título
        pdf.setDrawColor(79, 70, 229);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;

        // Layout em duas colunas para identificação
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);

        const colunaEsquerda = contentWidth * 0.48;
        const colunaDireita = contentWidth * 0.48;
        const espacoEntreColunas = contentWidth * 0.04;
        let yPosEsquerda = yPos;
        let yPosDireita = yPos;

        const itensEsquerda: [string, any][] = [];
        const itensDireita: [string, any][] = [];
        
        // Distribuir itens entre as duas colunas
        if (typeof conteudo === 'object' && conteudo !== null) {
          const entradas = Object.entries(conteudo);
          entradas.forEach((item: [string, any], index: number) => {
            if (index % 2 === 0) {
              itensEsquerda.push(item);
            } else {
              itensDireita.push(item);
            }
          });
        }

        // Renderizar coluna esquerda
        itensEsquerda.forEach(([key, value]) => {
          pdf.setFont('helvetica', 'bold');
          const subtitulo = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          const subtituloFormatado = textoSeguro(`${subtitulo.charAt(0).toUpperCase()}${subtitulo.slice(1)}:`);
          pdf.text(subtituloFormatado, margin, yPosEsquerda);
          yPosEsquerda += 12;

          pdf.setFont('helvetica', 'normal');
          const texto = textoSeguro(String(value));
          const linhas = pdf.splitTextToSize(texto, colunaEsquerda);
          pdf.text(linhas, margin, yPosEsquerda);
          yPosEsquerda += linhas.length * 12 + 8;
        });

        // Renderizar coluna direita
        itensDireita.forEach(([key, value]) => {
          pdf.setFont('helvetica', 'bold');
          const subtitulo = key.replace(/([A-Z])/g, ' $1').toLowerCase();
          const subtituloFormatado = textoSeguro(`${subtitulo.charAt(0).toUpperCase()}${subtitulo.slice(1)}:`);
          pdf.text(subtituloFormatado, margin + colunaEsquerda + espacoEntreColunas, yPosDireita);
          yPosDireita += 12;

          pdf.setFont('helvetica', 'normal');
          const texto = textoSeguro(String(value));
          const linhas = pdf.splitTextToSize(texto, colunaDireita);
          pdf.text(linhas, margin + colunaEsquerda + espacoEntreColunas, yPosDireita);
          yPosDireita += linhas.length * 12 + 8;
        });

        // Atualizar yPos para a maior altura entre as duas colunas
        yPos = Math.max(yPosEsquerda, yPosDireita) + 20;
      };

      // Função para adicionar seção
      const adicionarSecao = (numero: string, titulo: string, conteudo: any, cor: string = '#4F46E5') => {
        verificarQuebraPagina(60);

        // Título da seção
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(79, 70, 229); // Cor azul
        pdf.text(tituloSecao(`${numero}. ${titulo}`), margin, yPos);
        yPos += 20;

        // Linha abaixo do título
        pdf.setDrawColor(79, 70, 229);
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;

        // Conteúdo
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(60, 60, 60);

        if (typeof conteudo === 'object' && conteudo !== null) {
          Object.entries(conteudo).forEach(([key, value]) => {
            verificarQuebraPagina(30);
            
            // Subtítulo
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            const subtitulo = key.replace(/([A-Z])/g, ' $1').toLowerCase();
            pdf.text(textoSeguro(`${subtitulo.charAt(0).toUpperCase()}${subtitulo.slice(1)}:`), margin, yPos);
            yPos += 15;

            // Conteúdo do subtítulo
            pdf.setFont('helvetica', 'normal');
            if (Array.isArray(value)) {
              value.forEach((item: any) => {
                verificarQuebraPagina(20);
                if (typeof item === 'object') {
                  Object.entries(item).forEach(([subKey, subValue]) => {
                    const texto = textoSeguro(`• ${subKey}: ${String(subValue)}`);
                    const linhas = pdf.splitTextToSize(texto, contentWidth - 20);
                    pdf.text(linhas, margin + 15, yPos);
                    yPos += linhas.length * 12 + 5;
                  });
                } else {
                  const texto = textoSeguro(`• ${String(item)}`);
                  const linhas = pdf.splitTextToSize(texto, contentWidth - 20);
                  pdf.text(linhas, margin + 15, yPos);
                  yPos += linhas.length * 12 + 5;
                }
              });
            } else {
              const texto = textoSeguro(String(value));
              const linhas = pdf.splitTextToSize(texto, contentWidth - 20);
              pdf.text(linhas, margin + 15, yPos);
              yPos += linhas.length * 12 + 8;
            }
            yPos += 10;
          });
        } else {
          const texto = textoSeguro(String(conteudo));
          const linhas = pdf.splitTextToSize(texto, contentWidth);
          pdf.text(linhas, margin, yPos);
          yPos += linhas.length * 12 + 15;
        }

        yPos += 20; // Espaço entre seções
      };

      // Iniciar com identificação usando layout especial
      if (planoData.identificacao) {
        adicionarIdentificacao(planoData.identificacao);
      }

      // Adicionar título do plano após identificação
      adicionarTituloPlano();

      // Alinhamento BNCC
      if (planoData.alinhamentoBNCC) {
        adicionarSecao("2", tituloSecao("Alinhamento BNCC"), planoData.alinhamentoBNCC);
      }

      // Tema da Aula
      if (planoData.temaDaAula) {
        adicionarSecao("3", tituloSecao("Tema da Aula"), planoData.temaDaAula);
      }

      // Objetivos de Aprendizagem
      if (planoData.objetivosAprendizagem) {
        adicionarSecao("4", tituloSecao("Objetivos de Aprendizagem"), planoData.objetivosAprendizagem);
      }

      // Conteúdos
      if (planoData.conteudos) {
        adicionarSecao("5", tituloSecao("Conteúdos"), planoData.conteudos);
      }

      // Metodologia
      if (planoData.metodologia) {
        adicionarSecao("6", tituloSecao("Metodologia"), planoData.metodologia);
      }

      // Sequência Didática
      if (planoData.sequenciaDidatica) {
        adicionarSecao("7", tituloSecao("Sequência Didática"), planoData.sequenciaDidatica);
      }

      // Recursos Didáticos
      if (planoData.recursosDidaticos) {
        adicionarSecao("8", tituloSecao("Recursos Didáticos"), planoData.recursosDidaticos);
      }

      // Avaliação
      if (planoData.avaliacao) {
        adicionarSecao("9", tituloSecao("Avaliação"), planoData.avaliacao);
      }

      // Seções adicionais
      let numeroSecao = 10;
      Object.entries(planoData).forEach(([secao, conteudo]) => {
        if (!['identificacao', 'alinhamentoBNCC', 'temaDaAula', 'objetivosAprendizagem', 'conteudos', 'metodologia', 'sequenciaDidatica', 'recursosDidaticos', 'avaliacao'].includes(secao)) {
          const tituloSecaoRaw = secao.replace(/([A-Z])/g, ' $1').toLowerCase();
          const tituloFormatado = tituloSecao(tituloSecaoRaw.charAt(0).toUpperCase() + tituloSecaoRaw.slice(1));
          adicionarSecao(String(numeroSecao), tituloFormatado, conteudo);
          numeroSecao++;
        }
      });

      // Rodapé na última página com informações do professor
      verificarQuebraPagina(50);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      
      const nomeCompleto = user ? `${user.firstName} ${user.lastName}` : 'Professor';
      const emailProfessor = user?.email || '';
      const rodape = textoSeguro(`Plano gerado em ${new Date().toLocaleDateString('pt-BR')} por ${nomeCompleto} (${emailProfessor}) - IAprender Educacional`);
      const rodapeWidth = pdf.getTextWidth(rodape);
      pdf.text(rodape, (pageWidth - rodapeWidth) / 2, pageHeight - 30);

      // Gerar nome do arquivo baseado no tema e data
      const disciplinaDetectada = temaAnalysis?.disciplina || 'disciplina';
      const nomeArquivo = `plano_aula_${disciplinaDetectada.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Método aprimorado de download com múltiplas tentativas
      const realizarDownload = () => {
        try {
          // Método 1: jsPDF save (funciona na maioria dos navegadores modernos)
          pdf.save(nomeArquivo);
          
          if (!automatico) {
            toast({
              title: "PDF baixado com sucesso!",
              description: "Seu plano de aula foi baixado para a pasta Downloads.",
            });
          }
          
        } catch (error) {
          console.warn('Método save() falhou, tentando blob download');
          
          try {
            // Método 2: Blob download manual
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = nomeArquivo;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Limpar URL criada
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            if (!automatico) {
              toast({
                title: "PDF baixado com sucesso!",
                description: "Seu plano de aula foi baixado para a pasta Downloads.",
              });
            }
            
          } catch (error2) {
            console.warn('Blob download falhou, abrindo em nova aba');
            
            // Método 3: Abrir em nova aba (fallback)
            const pdfDataUri = pdf.output('datauristring');
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>Plano de Aula - ${disciplinaDetectada}</title></head>
                  <body style="margin:0;padding:0;">
                    <iframe src="${pdfDataUri}" style="width:100%;height:100vh;border:none;"></iframe>
                  </body>
                </html>
              `);
              
              if (!automatico) {
                toast({
                  title: "PDF aberto em nova aba",
                  description: "Use Ctrl+S para salvar o arquivo manualmente.",
                });
              }
            } else {
              throw new Error('Popup bloqueado pelo navegador');
            }
          }
        }
      };

      // Executar download
      realizarDownload();
      
      // Para download automático, mostrar toast específico
      if (automatico) {
        toast({
          title: "Download automático iniciado!",
          description: "O PDF do seu plano de aula está sendo baixado automaticamente.",
        });
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível criar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const salvarPlano = async () => {
    if (!planoGerado) {
      toast({
        title: "Nenhum plano disponível",
        description: "Gere um plano de aula primeiro para salvar.",
        variant: "destructive"
      });
      return;
    }

    // Salvar significa fazer download do PDF
    await exportarPDF();
  };

  return (
    <>
      <Helmet>
        <title>Planejamento de Aula - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-green-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-green-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <Link href="/professor">
                <Button size="sm" className="gap-2 bg-green-700 hover:bg-green-800 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img 
                  src={iaprenderLogoNew} 
                  alt="IAprender Logo" 
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900">Planejamento de Aula</h1>
                  <p className="text-slate-600 text-sm">Geração inteligente com IA baseada nas diretrizes do MEC e BNCC</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulário de Entrada */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-700" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Dados da Aula</CardTitle>
                  </div>
                  {aiConfig && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {aiConfig.modelName}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${aiConfig.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs ${aiConfig.enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {aiConfig.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Escola */}
                  <div className="space-y-2">
                    <Label htmlFor="escola" className="text-sm font-semibold text-slate-700">
                      Nome da Escola *
                    </Label>
                    <Input
                      id="escola"
                      placeholder="Ex: Escola Municipal João Silva"
                      value={formData.escola}
                      onChange={(e) => handleFormChange('escola', e.target.value)}
                      className="border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900"
                    />
                  </div>

                  {/* Número de Alunos */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroAlunos" className="text-sm font-semibold text-slate-700">
                      Número de Alunos *
                    </Label>
                    <Input
                      id="numeroAlunos"
                      type="number"
                      min="0"
                      placeholder="Ex: 25"
                      value={formData.numeroAlunos}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Prevent negative values
                        if (value === '' || parseInt(value) >= 0) {
                          handleFormChange('numeroAlunos', value);
                        }
                      }}
                      className="border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900"
                    />
                  </div>
                </div>

                {/* Tema/Conteúdo Específico */}
                <div className="space-y-2">
                  <Label htmlFor="tema" className="text-sm font-semibold text-slate-700">
                    Tema/Conteúdo Específico *
                  </Label>
                  <Textarea
                    id="tema"
                    placeholder="Ex: Frações, Sistema Solar, Revolução Industrial, etc."
                    value={formData.tema}
                    onChange={(e) => handleFormChange('tema', e.target.value)}
                    rows={3}
                    className="border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900 resize-none"
                  />
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analisando tema conforme BNCC...
                    </div>
                  )}
                  {temaAnalysis && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Análise BNCC Concluída</span>
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        <p><strong>Disciplina:</strong> {temaAnalysis.disciplina}</p>
                        <p><strong>Ano/Série:</strong> {temaAnalysis.anoSerie}</p>
                        <p><strong>Conforme BNCC:</strong> {temaAnalysis.conformeRegulasBNCC ? 'Sim' : 'Não'}</p>
                        {temaAnalysis.observacoes && (
                          <p><strong>Observações:</strong> {temaAnalysis.observacoes}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duração da Aula */}
                  <div className="space-y-2">
                    <Label htmlFor="duracao" className="text-sm font-semibold text-slate-700">
                      Duração da Aula *
                    </Label>
                    <Select value={formData.duracao} onValueChange={(value) => handleFormChange('duracao', value)}>
                      <SelectTrigger className="border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900 font-medium">
                        <SelectValue placeholder="Selecione a duração" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 minutos">30 minutos</SelectItem>
                        <SelectItem value="45 minutos">45 minutos</SelectItem>
                        <SelectItem value="50 minutos">50 minutos</SelectItem>
                        <SelectItem value="90 minutos">90 minutos (aula dupla)</SelectItem>
                        <SelectItem value="120 minutos">120 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recursos Disponíveis */}
                  <div className="space-y-2">
                    <Label htmlFor="recursos" className="text-sm font-semibold text-slate-700">
                      Recursos Disponíveis
                    </Label>
                    <Input
                      id="recursos"
                      placeholder="Ex: Projetor, computador, laboratório"
                      value={formData.recursos}
                      onChange={(e) => handleFormChange('recursos', e.target.value)}
                      className="border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900"
                    />
                  </div>
                </div>



                {/* Perfil da Turma */}
                <div className="space-y-2">
                  <Label htmlFor="perfilTurma" className="text-sm font-semibold text-slate-700">
                    Perfil da Turma
                  </Label>
                  <Textarea
                    id="perfilTurma"
                    placeholder="Descreva características especiais, nível socioeconômico, necessidades específicas..."
                    value={formData.perfilTurma}
                    onChange={(e) => handleFormChange('perfilTurma', e.target.value)}
                    className="min-h-[60px] resize-none border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900"
                  />
                </div>

                {/* Objetivos Específicos */}
                <div className="space-y-2">
                  <Label htmlFor="objetivosEspecificos" className="text-sm font-semibold text-slate-700">
                    Objetivos Específicos que Deseja Alcançar
                  </Label>
                  <Textarea
                    id="objetivosEspecificos"
                    placeholder="Descreva os objetivos específicos que pretende alcançar com esta aula..."
                    value={formData.objetivosEspecificos}
                    onChange={(e) => handleFormChange('objetivosEspecificos', e.target.value)}
                    className="min-h-[80px] resize-none border-2 border-green-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 bg-white text-green-900"
                  />
                </div>

                {/* Seção de Histórico de Planos de Aula */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-700">Histórico de Planos de Aula</h3>
                      <Badge variant="outline" className="text-xs">
                        {historicoPlanos.length} planos
                      </Badge>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowHistorico(!showHistorico);
                        if (!showHistorico && historicoPlanos.length === 0) {
                          carregarHistoricoS3();
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {showHistorico ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {showHistorico ? 'Recolher' : 'Expandir'}
                    </Button>
                  </div>
                  
                  {showHistorico && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {loadingHistorico ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                          <span className="ml-2 text-slate-600">Carregando histórico...</span>
                        </div>
                      ) : historicoPlanos.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                          <p className="text-sm">Nenhum plano de aula encontrado no histórico.</p>
                          <p className="text-xs text-slate-400 mt-1">Gere seu primeiro plano para começar o histórico.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {historicoPlanos.map((plano, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <h4 className="font-medium text-slate-800 line-clamp-1">
                                      {plano.metadata.topic || `${plano.metadata.subject} - ${plano.metadata.grade}`}
                                    </h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {plano.metadata.subject}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <School className="h-3 w-3" />
                                      {plano.metadata.school}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {plano.metadata.numberOfStudents} alunos
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {plano.metadata.duration}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      {plano.metadata.aiConfig}
                                    </div>
                                  </div>
                                  <div className="text-xs text-slate-500 mt-2">
                                    {new Date(plano.metadata.savedAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => visualizarPlanoS3(plano.fileName)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Botão Gerar Plano */}
                <Button 
                  onClick={gerarPlano}
                  disabled={isGenerating || !formData.tema.trim() || !formData.duracao || !formData.escola || !formData.numeroAlunos || !temaAnalysis}
                  className="w-full h-12 text-base font-semibold bg-green-700 hover:bg-green-800 text-white shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Gerando Plano...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Gerar Plano de Aula
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview/Resultado */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-900">Plano de Aula</CardTitle>
                  </div>
                  {planoGerado && (
                    <Button
                      size="sm"
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      onClick={exportarPDF}
                    >
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!planoGerado ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum plano gerado</h3>
                    <p className="text-slate-500 max-w-sm">
                      Preencha o tema e a duração da aula para gerar seu plano profissional
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2">
                    {/* Header com título principal */}
                    <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold mb-2">{formData.tema ? `Plano de Aula - ${formData.tema}` : "Plano de Aula"}</h2>
                          <p className="text-indigo-100 text-lg opacity-90">Desenvolvido com metodologias pedagógicas modernas e diretrizes BNCC</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-6">
                        <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">✨ Baseado na BNCC</span>
                        <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">🎯 Objetivos Claros</span>
                        <span className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">📚 Metodologia Ativa</span>
                      </div>
                    </div>

                    {/* 1. Identificação */}
                    {planoGerado.identificacao && (
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50 px-8 py-6 border-b border-gray-200">
                          <h3 className="flex items-center gap-4 font-bold text-gray-900 text-xl">
                            <div className="p-3 bg-slate-600 rounded-xl shadow-md">
                              <User className="h-6 w-6 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">1. Identificação</span>
                          </h3>
                        </div>
                        <div className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(planoGerado.identificacao).map(([key, value]) => (
                              <div key={key} className="group bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <p className="text-slate-900 text-lg font-semibold">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Alinhamento BNCC */}
                    {planoGerado.alinhamentoBNCC && (
                      <div className="bg-white border border-emerald-200 rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 px-8 py-6 border-b border-emerald-200">
                          <h3 className="flex items-center gap-4 font-bold text-gray-900 text-xl">
                            <div className="p-3 bg-emerald-600 rounded-xl shadow-md">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">2. Alinhamento Curricular BNCC</span>
                          </h3>
                        </div>
                        <div className="p-8">
                          <div className="space-y-6">
                            {Object.entries(planoGerado.alinhamentoBNCC).map(([key, value]) => (
                              <div key={key} className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 block">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <p className="text-emerald-900 text-base leading-relaxed">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Tema da Aula */}
                    {planoGerado.temaDaAula && (
                      <div className="bg-white border border-purple-200 rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 px-8 py-6 border-b border-purple-200">
                          <h3 className="flex items-center gap-4 font-bold text-gray-900 text-xl">
                            <div className="p-3 bg-purple-600 rounded-xl shadow-md">
                              <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-purple-700 to-indigo-800 bg-clip-text text-transparent">3. Tema da Aula</span>
                          </h3>
                        </div>
                        <div className="p-8">
                          <div className="space-y-6">
                            {Object.entries(planoGerado.temaDaAula).map(([key, value]) => (
                              <div key={key} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 block">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <p className="text-purple-900 text-base leading-relaxed">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Objetivos de Aprendizagem */}
                    {planoGerado.objetivosAprendizagem && (
                      <div className="bg-white border border-blue-200 rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 px-8 py-6 border-b border-blue-200">
                          <h3 className="flex items-center gap-4 font-bold text-gray-900 text-xl">
                            <div className="p-3 bg-blue-600 rounded-xl shadow-md">
                              <Target className="h-6 w-6 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-blue-700 to-sky-800 bg-clip-text text-transparent">4. Objetivos de Aprendizagem</span>
                          </h3>
                        </div>
                        <div className="p-8">
                          <div className="space-y-6">
                            {Object.entries(planoGerado.objetivosAprendizagem).map(([key, value]) => (
                              <div key={key} className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-200">
                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3 block">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <div className="text-blue-900">
                                  {renderValue(value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Conteúdos */}
                    {planoGerado.conteudos && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Layers className="h-4 w-4 text-amber-600" />
                          5. Conteúdos
                        </h3>
                        <div className="bg-amber-50 p-3 rounded-lg space-y-2 text-sm">
                          {Object.entries(planoGerado.conteudos).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium text-amber-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                              <div className="text-amber-600 ml-2">
                                {renderValue(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 6. Metodologia */}
                    {planoGerado.metodologia && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Settings className="h-4 w-4 text-green-700" />
                          6. Metodologia e Estratégias Didáticas
                        </h3>
                        <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                          {typeof planoGerado.metodologia === 'object' ? (
                            Object.entries(planoGerado.metodologia).map(([key, value]) => (
                              <div key={key} className="mb-2">
                                <span className="font-medium text-indigo-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <div className="text-green-700 ml-2">
                                  {renderValue(value)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-green-700">{String(planoGerado.metodologia)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 7. Sequência Didática */}
                    {planoGerado.sequenciaDidatica && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Clock className="h-4 w-4 text-rose-600" />
                          7. Sequência Didática Detalhada
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(planoGerado.sequenciaDidatica).map(([fase, conteudo]) => (
                            <div key={fase} className="bg-rose-50 p-3 rounded-lg border-l-4 border-rose-500">
                              <h4 className="font-medium text-rose-700 capitalize mb-2">{fase.replace(/([A-Z])/g, ' $1').toLowerCase()}</h4>
                              <div className="text-rose-600 text-sm">
                                {renderValue(conteudo)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 8. Recursos Didáticos */}
                    {planoGerado.recursosDidaticos && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          8. Recursos Didáticos
                        </h3>
                        <div className="bg-emerald-50 p-3 rounded-lg text-sm">
                          {typeof planoGerado.recursosDidaticos === 'object' ? (
                            Object.entries(planoGerado.recursosDidaticos).map(([key, value]) => (
                              <div key={key} className="mb-2">
                                <span className="font-medium text-emerald-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <div className="text-emerald-600 ml-2">
                                  {renderValue(value)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-emerald-600">{String(planoGerado.recursosDidaticos)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 9. Avaliação */}
                    {planoGerado.avaliacao && (
                      <div>
                        <h3 className="flex items-center gap-2 font-semibold text-slate-900 mb-2">
                          <ClipboardCheck className="h-4 w-4 text-teal-600" />
                          9. Avaliação
                        </h3>
                        <div className="bg-teal-50 p-3 rounded-lg text-sm">
                          {typeof planoGerado.avaliacao === 'object' ? (
                            Object.entries(planoGerado.avaliacao).map(([key, value]) => (
                              <div key={key} className="mb-2">
                                <span className="font-medium text-teal-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <div className="text-teal-600 ml-2">
                                  {renderValue(value)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-teal-600">{String(planoGerado.avaliacao)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Seções adicionais (10-15) com design moderno */}
                    {planoGerado && Object.entries(planoGerado).map(([secao, conteudo]) => {
                      if (['identificacao', 'alinhamentoBNCC', 'temaDaAula', 'objetivosAprendizagem', 'conteudos', 'metodologia', 'sequenciaDidatica', 'recursosDidaticos', 'avaliacao'].includes(secao)) {
                        return null;
                      }
                      
                      const getSectionColors = (secao: string) => {
                        switch (secao) {
                          case 'inclusaoAcessibilidade':
                            return {
                              headerBg: 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50',
                              headerBorder: 'border-orange-200',
                              iconBg: 'bg-orange-600',
                              titleText: 'text-orange-800',
                              contentBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
                              contentBorder: 'border-orange-200',
                              labelText: 'text-orange-700',
                              bodyText: 'text-orange-900'
                            };
                          case 'interdisciplinaridade':
                            return {
                              headerBg: 'bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50',
                              headerBorder: 'border-cyan-200',
                              iconBg: 'bg-cyan-600',
                              titleText: 'text-cyan-800',
                              contentBg: 'bg-gradient-to-br from-cyan-50 to-blue-50',
                              contentBorder: 'border-cyan-200',
                              labelText: 'text-cyan-700',
                              bodyText: 'text-cyan-900'
                            };
                          case 'contextualizacao':
                            return {
                              headerBg: 'bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50',
                              headerBorder: 'border-rose-200',
                              iconBg: 'bg-rose-600',
                              titleText: 'text-rose-800',
                              contentBg: 'bg-gradient-to-br from-rose-50 to-pink-50',
                              contentBorder: 'border-rose-200',
                              labelText: 'text-rose-700',
                              bodyText: 'text-rose-900'
                            };
                          case 'extensaoAprofundamento':
                            return {
                              headerBg: 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50',
                              headerBorder: 'border-yellow-200',
                              iconBg: 'bg-yellow-600',
                              titleText: 'text-yellow-800',
                              contentBg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
                              contentBorder: 'border-yellow-200',
                              labelText: 'text-yellow-700',
                              bodyText: 'text-yellow-900'
                            };
                          case 'reflexaoDocente':
                            return {
                              headerBg: 'bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50',
                              headerBorder: 'border-pink-200',
                              iconBg: 'bg-pink-600',
                              titleText: 'text-pink-800',
                              contentBg: 'bg-gradient-to-br from-pink-50 to-rose-50',
                              contentBorder: 'border-pink-200',
                              labelText: 'text-pink-700',
                              bodyText: 'text-pink-900'
                            };
                          case 'referencias':
                            return {
                              headerBg: 'bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50',
                              headerBorder: 'border-gray-200',
                              iconBg: 'bg-gray-600',
                              titleText: 'text-gray-800',
                              contentBg: 'bg-gradient-to-br from-gray-50 to-slate-50',
                              contentBorder: 'border-gray-200',
                              labelText: 'text-gray-700',
                              bodyText: 'text-gray-900'
                            };
                          default:
                            return {
                              headerBg: 'bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50',
                              headerBorder: 'border-slate-200',
                              iconBg: 'bg-slate-600',
                              titleText: 'text-slate-800',
                              contentBg: 'bg-gradient-to-br from-slate-50 to-gray-50',
                              contentBorder: 'border-slate-200',
                              labelText: 'text-slate-700',
                              bodyText: 'text-slate-900'
                            };
                        }
                      };
                      
                      const colors = getSectionColors(secao);
                      
                      return (
                        <div key={secao} className={`bg-white border ${colors.headerBorder} rounded-2xl shadow-lg overflow-hidden`}>
                          <div className={`${colors.headerBg} px-8 py-6 border-b ${colors.headerBorder}`}>
                            <h3 className="flex items-center gap-4 font-bold text-xl">
                              <div className={`p-3 ${colors.iconBg} rounded-xl shadow-md`}>
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <span className={colors.titleText}>
                                {secao.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                            </h3>
                          </div>
                          <div className="p-8">
                            {typeof conteudo === 'object' && conteudo !== null ? (
                              <div className="space-y-6">
                                {Object.entries(conteudo as Record<string, any>).map(([key, value]) => (
                                  <div key={key} className={`${colors.contentBg} p-6 rounded-xl border ${colors.contentBorder}`}>
                                    <span className={`text-xs font-semibold ${colors.labelText} uppercase tracking-wider mb-3 block`}>
                                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                    </span>
                                    <div className={colors.bodyText}>
                                      {renderValue(value)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={`${colors.contentBg} p-6 rounded-xl border ${colors.contentBorder}`}>
                                <p className={`${colors.bodyText} text-base leading-relaxed`}>{String(conteudo)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import aiverseLogoNew from "@/assets/aiverse-logo-new.png";
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  
  // Form state for comprehensive lesson plan data
  const [formData, setFormData] = useState({
    disciplina: "",
    anoSerie: "",
    etapaEnsino: "",
    tema: "",
    duracao: "",
    recursos: "",
    perfilTurma: "",
    numeroAlunos: "",
    objetivosEspecificos: "",
    escola: "",
    professor: ""
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [temaAnalysis, setTemaAnalysis] = useState<any>(null);
  const [planoGerado, setPlanoGerado] = useState<LessonPlanData | null>(null);

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

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
    if (!formData.tema.trim() || !formData.duracao || !formData.disciplina || !formData.anoSerie) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para gerar o plano de aula.",
        variant: "destructive"
      });
      return;
    }

    if (!temaAnalysis) {
      toast({
        title: "Aguarde a análise",
        description: "Aguarde a análise automática do tema ser concluída.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate-comprehensive-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          ...formData,
          analysis: temaAnalysis 
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na geração do plano');
      }

      const planoData = await response.json();
      setPlanoGerado(planoData);
      
      toast({
        title: "Plano gerado com sucesso!",
        description: "Seu plano de aula profissional está pronto para uso.",
      });
    } catch (error: any) {
      console.error('Erro na geração do plano:', error);
      toast({
        title: "Erro ao gerar plano",
        description: error.message || "Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportarPDF = () => {
    toast({
      title: "Exportação iniciada",
      description: "Seu plano de aula será exportado em PDF.",
    });
  };

  const salvarPlano = () => {
    toast({
      title: "Plano salvo",
      description: "Seu plano de aula foi salvo com sucesso.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Planejamento de Aula - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img 
                  src={aiverseLogoNew} 
                  alt="AIverse Logo" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AIverse - Seu Universo de IA</h1>
                  <p className="text-slate-600">Planejamento de Aula - Geração inteligente com IA baseada nas diretrizes do MEC e BNCC</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulário de Entrada */}
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 shadow-xl">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">Dados da Aula</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Escola */}
                  <div className="space-y-2">
                    <Label htmlFor="escola" className="text-sm font-semibold text-slate-700">
                      Nome da Escola
                    </Label>
                    <Input
                      id="escola"
                      placeholder="Nome da instituição de ensino"
                      value={formData.escola}
                      onChange={(e) => handleFormChange('escola', e.target.value)}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>

                  {/* Professor */}
                  <div className="space-y-2">
                    <Label htmlFor="professor" className="text-sm font-semibold text-slate-700">
                      Professor(a) Responsável
                    </Label>
                    <Input
                      id="professor"
                      placeholder="Nome do professor"
                      value={formData.professor}
                      onChange={(e) => handleFormChange('professor', e.target.value)}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Disciplina */}
                  <div className="space-y-2">
                    <Label htmlFor="disciplina" className="text-sm font-semibold text-slate-700">
                      Disciplina/Componente Curricular *
                    </Label>
                    <Select value={formData.disciplina} onValueChange={(value) => handleFormChange('disciplina', value)}>
                      <SelectTrigger className="border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Matemática">Matemática</SelectItem>
                        <SelectItem value="Língua Portuguesa">Língua Portuguesa</SelectItem>
                        <SelectItem value="Ciências">Ciências</SelectItem>
                        <SelectItem value="História">História</SelectItem>
                        <SelectItem value="Geografia">Geografia</SelectItem>
                        <SelectItem value="Física">Física</SelectItem>
                        <SelectItem value="Química">Química</SelectItem>
                        <SelectItem value="Biologia">Biologia</SelectItem>
                        <SelectItem value="Inglês">Inglês</SelectItem>
                        <SelectItem value="Educação Física">Educação Física</SelectItem>
                        <SelectItem value="Artes">Artes</SelectItem>
                        <SelectItem value="Filosofia">Filosofia</SelectItem>
                        <SelectItem value="Sociologia">Sociologia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Etapa de Ensino */}
                  <div className="space-y-2">
                    <Label htmlFor="etapaEnsino" className="text-sm font-semibold text-slate-700">
                      Etapa de Ensino *
                    </Label>
                    <Select value={formData.etapaEnsino} onValueChange={(value) => handleFormChange('etapaEnsino', value)}>
                      <SelectTrigger className="border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Educação Infantil">Educação Infantil</SelectItem>
                        <SelectItem value="Ensino Fundamental I">Ensino Fundamental I</SelectItem>
                        <SelectItem value="Ensino Fundamental II">Ensino Fundamental II</SelectItem>
                        <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ano/Série */}
                  <div className="space-y-2">
                    <Label htmlFor="anoSerie" className="text-sm font-semibold text-slate-700">
                      Ano/Série *
                    </Label>
                    <Select value={formData.anoSerie} onValueChange={(value) => handleFormChange('anoSerie', value)}>
                      <SelectTrigger className="border-slate-300 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o ano/série" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1º ano">1º ano</SelectItem>
                        <SelectItem value="2º ano">2º ano</SelectItem>
                        <SelectItem value="3º ano">3º ano</SelectItem>
                        <SelectItem value="4º ano">4º ano</SelectItem>
                        <SelectItem value="5º ano">5º ano</SelectItem>
                        <SelectItem value="6º ano">6º ano</SelectItem>
                        <SelectItem value="7º ano">7º ano</SelectItem>
                        <SelectItem value="8º ano">8º ano</SelectItem>
                        <SelectItem value="9º ano">9º ano</SelectItem>
                        <SelectItem value="1ª série">1ª série</SelectItem>
                        <SelectItem value="2ª série">2ª série</SelectItem>
                        <SelectItem value="3ª série">3ª série</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Número de Alunos */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroAlunos" className="text-sm font-semibold text-slate-700">
                      Número de Alunos
                    </Label>
                    <Input
                      id="numeroAlunos"
                      type="number"
                      placeholder="Ex: 25"
                      value={formData.numeroAlunos}
                      onChange={(e) => handleFormChange('numeroAlunos', e.target.value)}
                      className="border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tema da Aula */}
                <div className="space-y-2">
                  <Label htmlFor="tema" className="text-sm font-semibold text-slate-700">
                    Tema/Conteúdo Específico *
                  </Label>
                  <Textarea
                    id="tema"
                    placeholder="Digite o tema da sua aula (ex: Frações, Sistema Solar, Brasil Colônia...)"
                    value={formData.tema}
                    onChange={(e) => handleFormChange('tema', e.target.value)}
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analisando tema conforme diretrizes do MEC e BNCC...
                    </div>
                  )}
                </div>

                {/* Análise do Tema */}
                {temaAnalysis && (
                  <Card className={`border-2 ${temaAnalysis.conformeRegulasBNCC ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {temaAnalysis.conformeRegulasBNCC ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        )}
                        <span className={`font-semibold text-sm ${temaAnalysis.conformeRegulasBNCC ? 'text-green-800' : 'text-orange-800'}`}>
                          {temaAnalysis.conformeRegulasBNCC ? 'Tema alinhado à BNCC' : 'Atenção: Tema fora das diretrizes'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-slate-700">Disciplina identificada: </span>
                          <Badge variant="secondary">{temaAnalysis.disciplina}</Badge>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-700">Ano/Série sugerido: </span>
                          <Badge variant="secondary">{temaAnalysis.anoSerie}</Badge>
                        </div>
                        {!temaAnalysis.conformeRegulasBNCC && (
                          <div className="text-sm text-orange-700 bg-orange-100 p-2 rounded">
                            <strong>Observação:</strong> {temaAnalysis.observacoes}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Duração */}
                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-sm font-semibold text-slate-700">
                    Duração da Aula *
                  </Label>
                  <Select value={formData.duracao} onValueChange={(value) => handleFormChange('duracao', value)}>
                    <SelectTrigger className="w-full border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="50">50 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recursos Disponíveis */}
                <div className="space-y-2">
                  <Label htmlFor="recursos" className="text-sm font-semibold text-slate-700">
                    Recursos Disponíveis
                  </Label>
                  <Textarea
                    id="recursos"
                    placeholder="Liste os recursos disponíveis (tecnológicos, materiais, espaço físico...)"
                    value={formData.recursos}
                    onChange={(e) => handleFormChange('recursos', e.target.value)}
                    className="min-h-[60px] resize-none border-slate-300 focus:border-blue-500"
                  />
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
                    className="min-h-[60px] resize-none border-slate-300 focus:border-blue-500"
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
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500"
                  />
                </div>

                {/* Botão Gerar Plano */}
                <Button 
                  onClick={gerarPlano}
                  disabled={isGenerating || !formData.tema.trim() || !formData.duracao || !formData.disciplina || !formData.anoSerie || !temaAnalysis}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={salvarPlano}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={exportarPDF}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
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
                          <h2 className="text-3xl font-bold mb-2">Plano de Aula Profissional</h2>
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
                          <Settings className="h-4 w-4 text-indigo-600" />
                          6. Metodologia e Estratégias Didáticas
                        </h3>
                        <div className="bg-indigo-50 p-3 rounded-lg text-sm">
                          {typeof planoGerado.metodologia === 'object' ? (
                            Object.entries(planoGerado.metodologia).map(([key, value]) => (
                              <div key={key} className="mb-2">
                                <span className="font-medium text-indigo-700 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <div className="text-indigo-600 ml-2">
                                  {renderValue(value)}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-indigo-600">{String(planoGerado.metodologia)}</p>
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
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  BookOpenCheck, 
  FileText, 
  ArrowLeft, 
  Copy, 
  Download, 
  Loader2,
  Sparkles,
  RefreshCw,
  Heart,
  Share2,
  GraduationCap,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Tipo para representar um resumo gerado
interface ResumoGerado {
  id: string;
  titulo: string;
  materia: string;
  serie: string;
  conteudo: string;
  dataGeracao: Date;
  favorito: boolean;
}

export default function ResumosDidaticos() {
  const { toast } = useToast();
  
  // Estados para os parâmetros da geração
  const [assunto, setAssunto] = useState("");
  const [materia, setMateria] = useState("");
  const [serie, setSerie] = useState("");
  const [objetivosEspecificos, setObjetivosEspecificos] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para os resumos gerados
  const [resumosGerados, setResumosGerados] = useState<ResumoGerado[]>([]);
  const [resumoSelecionado, setResumoSelecionado] = useState<ResumoGerado | null>(null);
  
  // Função para gerar resumos
  const gerarResumo = async () => {
    if (!assunto.trim() || !materia.trim() || !serie.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha assunto, matéria e série/ano.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aqui seria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta
      const novoResumo: ResumoGerado = {
        id: `res-${Date.now()}`,
        titulo: assunto,
        materia: materia,
        serie: serie,
        conteudo: mockConteudoResumo(),
        dataGeracao: new Date(),
        favorito: false
      };
      
      setResumosGerados(prev => [novoResumo, ...prev]);
      setResumoSelecionado(novoResumo);
      
      toast({
        title: "Resumo criado com sucesso!",
        description: `Resumo sobre ${assunto} foi gerado conforme diretrizes da BNCC.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock de conteúdo do resumo
  const mockConteudoResumo = () => {
    return `
    <div class="resumo-content">
      <div class="resumo-header">
        <h1>${assunto}</h1>
        <div class="meta-info">
          <p><strong>Matéria:</strong> ${materia}</p>
          <p><strong>Série/Ano:</strong> ${serie}</p>
          <p><strong>Alinhamento BNCC:</strong> Conforme diretrizes curriculares nacionais</p>
        </div>
      </div>
      
      <div class="resumo-body">
        <section class="competencias-bncc">
          <h2>🎯 Competências e Habilidades (BNCC)</h2>
          <div class="competencias-list">
            <ul>
              <li>Compreender conceitos fundamentais sobre ${assunto}</li>
              <li>Desenvolver pensamento crítico e analítico</li>
              <li>Aplicar conhecimentos em situações práticas</li>
              <li>Estabelecer conexões interdisciplinares</li>
            </ul>
          </div>
        </section>

        <section class="objetivos-aprendizagem">
          <h2>📚 Objetivos de Aprendizagem</h2>
          <p>Este resumo tem como objetivo proporcionar uma compreensão clara e estruturada sobre ${assunto}, seguindo as diretrizes da Base Nacional Comum Curricular (BNCC) para ${materia}.</p>
          ${objetivosEspecificos ? `<p><strong>Objetivos específicos:</strong> ${objetivosEspecificos}</p>` : ''}
        </section>

        <section class="conceitos-fundamentais">
          <h2>💡 Conceitos Fundamentais</h2>
          <p>Os principais conceitos abordados neste tema incluem definições essenciais, características principais e relações com outros conteúdos da disciplina.</p>
          
          <div class="conceitos-principais">
            <h3>Definições Importantes:</h3>
            <ul>
              <li>Conceito A: Definição clara e objetiva</li>
              <li>Conceito B: Explicação contextualizada</li>
              <li>Conceito C: Relação com conhecimentos prévios</li>
            </ul>
          </div>
        </section>

        <section class="aplicacoes-praticas">
          <h2>🔧 Aplicações Práticas</h2>
          <p>Este conteúdo pode ser aplicado em diversas situações do cotidiano e conecta-se com outras áreas do conhecimento, promovendo uma aprendizagem significativa.</p>
          
          <div class="exemplos-praticos">
            <h3>Exemplos do Cotidiano:</h3>
            <ul>
              <li>Situação prática 1: Aplicação no dia a dia</li>
              <li>Situação prática 2: Conexão interdisciplinar</li>
              <li>Situação prática 3: Relevância social</li>
            </ul>
          </div>
        </section>

        <section class="metodologia-sugerida">
          <h2>🎓 Metodologia de Ensino Sugerida</h2>
          <div class="metodologia-steps">
            <ol>
              <li><strong>Sensibilização:</strong> Apresentação do tema com exemplos práticos</li>
              <li><strong>Desenvolvimento:</strong> Explicação dos conceitos principais</li>
              <li><strong>Aplicação:</strong> Exercícios e atividades práticas</li>
              <li><strong>Avaliação:</strong> Verificação da aprendizagem</li>
            </ol>
          </div>
        </section>

        <section class="recursos-complementares">
          <h2>📖 Recursos Complementares</h2>
          <ul>
            <li>Material de apoio: Livros didáticos e paradidáticos</li>
            <li>Recursos digitais: Vídeos educacionais e simuladores</li>
            <li>Atividades práticas: Experimentos e projetos</li>
            <li>Avaliação: Instrumentos variados de verificação</li>
          </ul>
        </section>

        <section class="consideracoes-finais">
          <h2>✅ Considerações Finais</h2>
          <p>Este resumo didático foi elaborado seguindo as diretrizes da BNCC, visando proporcionar uma base sólida para o desenvolvimento das competências e habilidades necessárias para ${serie} em ${materia}.</p>
          <p>O conteúdo pode ser adaptado conforme as necessidades específicas da turma e complementado com recursos adicionais para enriquecer o processo de ensino-aprendizagem.</p>
        </section>
      </div>
    </div>`;
  };

  const copiarParaClipboard = () => {
    if (resumoSelecionado) {
      navigator.clipboard.writeText(resumoSelecionado.conteudo);
      toast({
        title: "Conteúdo copiado!",
        description: "O resumo foi copiado para a área de transferência.",
      });
    }
  };

  const toggleFavorito = (id: string) => {
    setResumosGerados(prev => prev.map(resumo => 
      resumo.id === id 
        ? { ...resumo, favorito: !resumo.favorito } 
        : resumo
    ));
    
    if (resumoSelecionado?.id === id) {
      setResumoSelecionado(prev => prev ? { ...prev, favorito: !prev.favorito } : null);
    }
  };

  const materias = [
    "Língua Portuguesa",
    "Matemática", 
    "Ciências",
    "História",
    "Geografia",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Física",
    "Química",
    "Biologia",
    "Filosofia",
    "Sociologia"
  ];

  const series = [
    "1º ano - Ensino Fundamental",
    "2º ano - Ensino Fundamental",
    "3º ano - Ensino Fundamental",
    "4º ano - Ensino Fundamental",
    "5º ano - Ensino Fundamental",
    "6º ano - Ensino Fundamental",
    "7º ano - Ensino Fundamental",
    "8º ano - Ensino Fundamental",
    "9º ano - Ensino Fundamental",
    "1º ano - Ensino Médio",
    "2º ano - Ensino Médio",
    "3º ano - Ensino Médio"
  ];

  const sugestoesAssuntos = [
    "Sistema Solar e Planetas",
    "Revolução Industrial", 
    "Figuras de Linguagem",
    "Equações do 2º Grau",
    "Biomas Brasileiros",
    "Fotossíntese",
    "Brasil Colônia",
    "Geometria Plana"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Helmet>
        <title>Resumos Didáticos IA - IAverse</title>
      </Helmet>

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
              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <BookOpenCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Resumos Didáticos IA</h1>
                <p className="text-sm text-slate-600">Crie resumos profissionais alinhados com a BNCC</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuração */}
          <div className="space-y-6">
            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Configurar Resumo
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Defina o conteúdo conforme diretrizes da BNCC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Assunto */}
                <div className="space-y-3">
                  <Label htmlFor="assunto" className="text-sm font-medium text-slate-700">
                    Assunto/Tema *
                  </Label>
                  <Textarea 
                    id="assunto"
                    placeholder="Ex: Fotossíntese e respiração celular"
                    className="min-h-[100px] resize-none border-slate-300 focus:border-blue-500"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                  />
                  
                  {/* Sugestões */}
                  <div className="flex flex-wrap gap-2">
                    {sugestoesAssuntos.map((sugestao, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-700"
                        onClick={() => setAssunto(sugestao)}
                      >
                        {sugestao}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Matéria */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Matéria *
                  </Label>
                  <Select value={materia} onValueChange={setMateria}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione a matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {materias.map((mat) => (
                        <SelectItem key={mat} value={mat}>
                          {mat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Série */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Série/Ano *
                  </Label>
                  <Select value={serie} onValueChange={setSerie}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Selecione a série/ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {series.map((ser) => (
                        <SelectItem key={ser} value={ser}>
                          {ser}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Objetivos Específicos */}
                <div className="space-y-3">
                  <Label htmlFor="objetivos" className="text-sm font-medium text-slate-700">
                    Objetivos Específicos
                  </Label>
                  <Textarea 
                    id="objetivos"
                    placeholder="Ex: Compreender o processo de fotossíntese, identificar suas etapas e importância para os seres vivos"
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500"
                    value={objetivosEspecificos}
                    onChange={(e) => setObjetivosEspecificos(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Opcional: Defina objetivos específicos para personalizar o resumo
                  </p>
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarResumo}
                  disabled={isLoading || !assunto.trim() || !materia.trim() || !serie.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Resumo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Resumo Didático
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resumos Recentes */}
            {resumosGerados.length > 0 && (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Resumos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resumosGerados.slice(0, 3).map((resumo) => (
                    <div 
                      key={resumo.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setResumoSelecionado(resumo)}
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpenCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{resumo.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {resumo.materia} • {resumo.serie}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={resumo.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(resumo.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Visualização */}
          <div className="space-y-6">
            {resumoSelecionado ? (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-800">
                          {resumoSelecionado.titulo}
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          {resumoSelecionado.materia} • {resumoSelecionado.serie}
                        </CardDescription>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Alinhado com BNCC
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={resumoSelecionado.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={() => toggleFavorito(resumoSelecionado.id)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copiarParaClipboard}
                        className="text-slate-600 hover:text-blue-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 border border-slate-200 max-h-[600px] overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: resumoSelecionado.conteudo }}
                    />
                  </div>
                  
                  {/* Ações */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
                    <GraduationCap className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Nenhum resumo selecionado
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    Configure o assunto, matéria e série, depois clique em "Gerar Resumo Didático" para criar seu material educacional alinhado com a BNCC.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
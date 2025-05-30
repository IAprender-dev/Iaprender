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
  const [contextoPedagogico, setContextoPedagogico] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para os resumos gerados
  const [resumosGerados, setResumosGerados] = useState<ResumoGerado[]>([]);
  const [resumoSelecionado, setResumoSelecionado] = useState<ResumoGerado | null>(null);
  
  // Função para gerar resumos
  const gerarResumo = async () => {
    if (!assunto.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "Por favor, informe o assunto para criar o resumo didático.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aqui seria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta com análise automática
      const analiseAutomatica = analisarAssunto(assunto);
      
      const novoResumo: ResumoGerado = {
        id: `res-${Date.now()}`,
        titulo: assunto,
        materia: analiseAutomatica.materia,
        serie: analiseAutomatica.series.join(', '),
        conteudo: mockConteudoResumoCompleto(analiseAutomatica),
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

  // Função para analisar o assunto e determinar matéria/série automaticamente
  const analisarAssunto = (assunto: string) => {
    const assuntoLower = assunto.toLowerCase();
    
    // Mapeamento de assuntos para matérias e séries
    if (assuntoLower.includes('fotossíntese') || assuntoLower.includes('respiração') || assuntoLower.includes('célula')) {
      return {
        materia: 'Ciências/Biologia',
        series: ['7º ano EF', '8º ano EF', '1º ano EM'],
        area: 'Ciências da Natureza'
      };
    }
    if (assuntoLower.includes('revolução industrial') || assuntoLower.includes('brasil colônia')) {
      return {
        materia: 'História',
        series: ['8º ano EF', '9º ano EF'],
        area: 'Ciências Humanas'
      };
    }
    if (assuntoLower.includes('equação') || assuntoLower.includes('matemática') || assuntoLower.includes('geometria')) {
      return {
        materia: 'Matemática',
        series: ['8º ano EF', '9º ano EF', '1º ano EM'],
        area: 'Matemática'
      };
    }
    if (assuntoLower.includes('figura de linguagem') || assuntoLower.includes('português') || assuntoLower.includes('literatura')) {
      return {
        materia: 'Língua Portuguesa',
        series: ['6º ano EF', '7º ano EF', '8º ano EF'],
        area: 'Linguagens'
      };
    }
    if (assuntoLower.includes('sistema solar') || assuntoLower.includes('planeta') || assuntoLower.includes('astronomia')) {
      return {
        materia: 'Ciências',
        series: ['6º ano EF', '7º ano EF'],
        area: 'Ciências da Natureza'
      };
    }
    if (assuntoLower.includes('bioma') || assuntoLower.includes('geografia') || assuntoLower.includes('clima')) {
      return {
        materia: 'Geografia',
        series: ['6º ano EF', '7º ano EF', '8º ano EF'],
        area: 'Ciências Humanas'
      };
    }
    
    // Padrão para assuntos não identificados
    return {
      materia: 'Multidisciplinar',
      series: ['6º ao 9º ano EF'],
      area: 'Geral'
    };
  };

  // Conteúdo completo do resumo com informações reais
  const mockConteudoResumoCompleto = (analise: any) => {
    const conteudoEspecifico = obterConteudoEspecifico(assunto, analise);
    
    return `
    <div class="resumo-content">
      <div class="resumo-header">
        <h1>${assunto}</h1>
        <div class="meta-info">
          <p><strong>Área do Conhecimento:</strong> ${analise.area}</p>
          <p><strong>Componente Curricular:</strong> ${analise.materia}</p>
          <p><strong>Séries/Anos Recomendados:</strong> ${analise.series.join(', ')}</p>
          <p><strong>Alinhamento BNCC:</strong> ✅ Conforme diretrizes curriculares nacionais</p>
        </div>
      </div>
      
      <div class="resumo-body">
        <section class="competencias-bncc">
          <h2>🎯 Competências e Habilidades (BNCC)</h2>
          <div class="competencias-list">
            ${conteudoEspecifico.competencias}
          </div>
        </section>

        <section class="conteudo-principal">
          <h2>📖 Conteúdo da Matéria</h2>
          ${conteudoEspecifico.conteudo}
        </section>

        <section class="conceitos-fundamentais">
          <h2>💡 Conceitos Fundamentais</h2>
          ${conteudoEspecifico.conceitos}
        </section>

        <section class="aplicacoes-praticas">
          <h2>🔧 Aplicações Práticas</h2>
          ${conteudoEspecifico.aplicacoes}
        </section>

        <section class="metodologia-sugerida">
          <h2>🎓 Metodologia de Ensino Sugerida</h2>
          <div class="metodologia-steps">
            <ol>
              <li><strong>Sensibilização:</strong> ${conteudoEspecifico.metodologia.sensibilizacao}</li>
              <li><strong>Desenvolvimento:</strong> ${conteudoEspecifico.metodologia.desenvolvimento}</li>
              <li><strong>Aplicação:</strong> ${conteudoEspecifico.metodologia.aplicacao}</li>
              <li><strong>Avaliação:</strong> ${conteudoEspecifico.metodologia.avaliacao}</li>
            </ol>
          </div>
        </section>

        <section class="recursos-complementares">
          <h2>📖 Recursos Complementares</h2>
          ${conteudoEspecifico.recursos}
        </section>

        <section class="consideracoes-finais">
          <h2>✅ Considerações Finais</h2>
          <p>Este resumo didático foi elaborado seguindo as diretrizes da BNCC, visando proporcionar uma base sólida para o desenvolvimento das competências e habilidades necessárias para ${analise.series.join(' e ')} em ${analise.materia}.</p>
          <p>O conteúdo apresenta uma abordagem completa sobre ${assunto}, integrando teoria e prática de forma contextualizada e significativa para os estudantes.</p>
          ${contextoPedagogico ? `<p><strong>Contexto pedagógico adicional:</strong> ${contextoPedagogico}</p>` : ''}
        </section>
      </div>
    </div>`;
  };

  // Função para obter conteúdo específico baseado no assunto
  const obterConteudoEspecifico = (assunto: string, analise: any) => {
    const assuntoLower = assunto.toLowerCase();
    
    if (assuntoLower.includes('fotossíntese')) {
      return {
        competencias: `
          <ul>
            <li>Compreender a vida como um fenômeno natural e social, os problemas ambientais brasileiros e a importância da preservação do ambiente</li>
            <li>Identificar e explicar fenômenos envolvidos na manutenção da vida, diferenciando e classificando os seres vivos</li>
            <li>Analisar e explicar a importância da fotossíntese para a manutenção da vida na Terra</li>
          </ul>`,
        conteudo: `
          <p><strong>Fotossíntese</strong> é o processo biológico realizado pelas plantas, algas e algumas bactérias, onde a energia luminosa é convertida em energia química na forma de glicose.</p>
          
          <h3>Processo da Fotossíntese:</h3>
          <p><strong>Equação geral:</strong> 6CO₂ + 6H₂O + energia luminosa → C₆H₁₂O₆ + 6O₂</p>
          
          <p>O processo ocorre principalmente nas folhas, especificamente nos cloroplastos, organelas que contêm clorofila - pigmento verde responsável pela absorção da luz.</p>
          
          <h3>Etapas da Fotossíntese:</h3>
          <ol>
            <li><strong>Fase Clara (Fotoquímica):</strong> Ocorre nos tilacoides, onde a luz é capturada e a água é quebrada, liberando oxigênio</li>
            <li><strong>Fase Escura (Ciclo de Calvin):</strong> Ocorre no estroma, onde o CO₂ é fixado para formar glicose</li>
          </ol>`,
        conceitos: `
          <ul>
            <li><strong>Clorofila:</strong> Pigmento verde que absorve a energia luminosa</li>
            <li><strong>Cloroplastos:</strong> Organelas onde ocorre a fotossíntese</li>
            <li><strong>Estômatos:</strong> Estruturas das folhas por onde entram CO₂ e sai O₂</li>
            <li><strong>Glicose:</strong> Açúcar produzido que serve como alimento para a planta</li>
            <li><strong>Respiração Celular:</strong> Processo complementar onde a glicose é quebrada para liberar energia</li>
          </ul>`,
        aplicacoes: `
          <ul>
            <li>Produção de oxigênio que respiramos</li>
            <li>Base da cadeia alimentar terrestre</li>
            <li>Absorção de CO₂ da atmosfera, ajudando no controle do efeito estufa</li>
            <li>Agricultura e jardinagem: compreender necessidades das plantas</li>
            <li>Biotecnologia: desenvolvimento de plantas mais eficientes</li>
          </ul>`,
        metodologia: {
          sensibilizacao: "Demonstração com plantas em diferentes condições de luz, questionando por que plantas precisam de luz",
          desenvolvimento: "Explicação do processo com esquemas e experimentos práticos observando produção de oxigênio",
          aplicacao: "Experimentos com plantas aquáticas, observação de estômatos no microscópio",
          avaliacao: "Análise de situações-problema envolvendo crescimento de plantas e produção de alimentos"
        },
        recursos: `
          <ul>
            <li>Experimento com Elodea para observar produção de oxigênio</li>
            <li>Microscópio para observação de cloroplastos e estômatos</li>
            <li>Plantas em diferentes condições para comparação</li>
            <li>Vídeos educacionais sobre o processo</li>
            <li>Esquemas e infográficos explicativos</li>
          </ul>`
      };
    }
    
    // Conteúdo genérico para outros assuntos
    return {
      competencias: `
        <ul>
          <li>Desenvolver conhecimentos fundamentais sobre ${assunto}</li>
          <li>Aplicar conceitos em situações práticas do cotidiano</li>
          <li>Estabelecer relações interdisciplinares</li>
          <li>Desenvolver pensamento crítico e científico</li>
        </ul>`,
      conteudo: `
        <p>Este tópico aborda os aspectos fundamentais de ${assunto}, proporcionando uma base sólida de conhecimento alinhada às diretrizes da BNCC.</p>
        <p>O conteúdo será desenvolvido de forma contextualizada, relacionando teoria e prática para facilitar a compreensão dos estudantes.</p>`,
      conceitos: `
        <ul>
          <li>Conceitos básicos e definições importantes</li>
          <li>Relações com conhecimentos prévios</li>
          <li>Conexões interdisciplinares</li>
          <li>Aplicações práticas no cotidiano</li>
        </ul>`,
      aplicacoes: `
        <ul>
          <li>Aplicações no cotidiano dos estudantes</li>
          <li>Conexões com outras disciplinas</li>
          <li>Relevância social e cultural</li>
          <li>Preparação para estudos futuros</li>
        </ul>`,
      metodologia: {
        sensibilizacao: "Apresentação do tema conectado ao cotidiano dos estudantes",
        desenvolvimento: "Explicação progressiva dos conceitos com exemplos práticos",
        aplicacao: "Atividades hands-on e resolução de problemas contextualizados",
        avaliacao: "Instrumentos variados que verifiquem a compreensão e aplicação"
      },
      recursos: `
        <ul>
          <li>Material didático diversificado</li>
          <li>Recursos audiovisuais</li>
          <li>Atividades práticas e experimentais</li>
          <li>Tecnologias educacionais</li>
          <li>Bibliografia complementar</li>
        </ul>`
    };
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

                {/* Contexto Pedagógico */}
                <div className="space-y-3">
                  <Label htmlFor="contexto" className="text-sm font-medium text-slate-700">
                    Contexto Pedagógico Adicional
                  </Label>
                  <Textarea 
                    id="contexto"
                    placeholder="Ex: Enfoque em experimentos práticos, adaptação para alunos com dificuldades de aprendizagem..."
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500"
                    value={contextoPedagogico}
                    onChange={(e) => setContextoPedagogico(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Opcional: Orientações específicas sobre abordagem ou contexto pedagógico
                  </p>
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarResumo}
                  disabled={isLoading || !assunto.trim()}
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
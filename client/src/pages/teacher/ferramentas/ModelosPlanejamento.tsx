import { useState } from "react";
import { ListChecks, Search, Download, ArrowRight, ChevronRight, Calendar, FileText, BookOpen, GraduationCap, Loader2, Star, CalendarDays, Users, Lightbulb } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface ModeloPlanejamento {
  id: string;
  titulo: string;
  descricao: string;
  tipo: "anual" | "bimestral" | "semanal" | "unitario";
  disciplina: string;
  nivel: string;
  popularidade: number;
  downloads: number;
  dataPublicacao: Date;
  detalhes?: string;
}

export default function ModelosPlanejamento() {
  const { toast } = useToast();
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("todos");
  const [nivelFiltro, setNivelFiltro] = useState("todos");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para modelos e detalhes
  const [modelos, setModelos] = useState<ModeloPlanejamento[]>(mockModelos);
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloPlanejamento | null>(null);
  
  // Constantes para os tipos de modelos
  const tiposModelo: {[key: string]: {icone: JSX.Element, titulo: string, descricao: string}} = {
    anual: {
      icone: <Calendar className="h-5 w-5" />,
      titulo: "Planejamento Anual",
      descricao: "Organização geral do conteúdo para todo o ano letivo"
    },
    bimestral: {
      icone: <CalendarDays className="h-5 w-5" />,
      titulo: "Planejamento Bimestral",
      descricao: "Estruturação detalhada para o bimestre"
    },
    semanal: {
      icone: <FileText className="h-5 w-5" />,
      titulo: "Planejamento Semanal",
      descricao: "Organização das atividades para a semana"
    },
    unitario: {
      icone: <BookOpen className="h-5 w-5" />,
      titulo: "Planejamento por Unidade",
      descricao: "Estruturação por unidade ou capítulo"
    }
  };
  
  // Mock inicial de modelos
  function mockModelos(): ModeloPlanejamento[] {
    return [
      {
        id: "modelo-1",
        titulo: "Planejamento Anual de Matemática - Ensino Fundamental",
        descricao: "Modelo completo para planejamento anual de Matemática para o 6º ao 9º ano",
        tipo: "anual",
        disciplina: "Matemática",
        nivel: "Fundamental II",
        popularidade: 4.8,
        downloads: 2347,
        dataPublicacao: new Date(2023, 10, 15),
        detalhes: "Este modelo de planejamento anual abrange todos os conteúdos essenciais de Matemática para o Ensino Fundamental II, organizados em unidades temáticas e habilidades da BNCC. Inclui sugestões de metodologias, recursos didáticos e estratégias de avaliação."
      },
      {
        id: "modelo-2",
        titulo: "Planejamento Bimestral de Língua Portuguesa",
        descricao: "Modelo estruturado para o planejamento bimestral com objetivos e avaliações",
        tipo: "bimestral",
        disciplina: "Língua Portuguesa",
        nivel: "Ensino Médio",
        popularidade: 4.6,
        downloads: 1852,
        dataPublicacao: new Date(2023, 11, 5),
        detalhes: "Estrutura completa para o planejamento bimestral de Língua Portuguesa no Ensino Médio, com foco em literatura brasileira, produção textual e análise linguística. Organizado por semanas, com objetivos específicos, conteúdos, metodologias e critérios de avaliação."
      },
      {
        id: "modelo-3",
        titulo: "Planejamento Semanal de Ciências",
        descricao: "Organização semanal detalhada para aulas de Ciências",
        tipo: "semanal",
        disciplina: "Ciências",
        nivel: "Fundamental I",
        popularidade: 4.9,
        downloads: 2651,
        dataPublicacao: new Date(2024, 0, 10),
        detalhes: "Modelo de planejamento semanal para aulas de Ciências no Ensino Fundamental I, com distribuição de conteúdos, atividades práticas, experimentos e avaliações. Inclui espaço para registro de observações sobre o desenvolvimento da turma e adaptações necessárias."
      },
      {
        id: "modelo-4",
        titulo: "Planejamento por Unidade de História",
        descricao: "Modelo para planejamento por unidades temáticas em História",
        tipo: "unitario",
        disciplina: "História",
        nivel: "Ensino Médio",
        popularidade: 4.5,
        downloads: 1560,
        dataPublicacao: new Date(2023, 9, 20),
        detalhes: "Estrutura para planejamento por unidades temáticas para o ensino de História no Ensino Médio. Cada unidade contempla objetivos, conteúdos, atividades, recursos e formas de avaliação, facilitando a organização do professor ao longo do ano letivo."
      },
      {
        id: "modelo-5",
        titulo: "Planejamento Anual Interdisciplinar",
        descricao: "Modelo para planejamento integrado entre diferentes disciplinas",
        tipo: "anual",
        disciplina: "Multidisciplinar",
        nivel: "Fundamental II",
        popularidade: 4.7,
        downloads: 1987,
        dataPublicacao: new Date(2024, 1, 5),
        detalhes: "Planejamento anual para trabalho interdisciplinar, integrando diferentes áreas do conhecimento em projetos e atividades comuns. Propõe temas geradores, objetivos compartilhados e avaliação integrada, incentivando o trabalho colaborativo entre professores."
      },
      {
        id: "modelo-6",
        titulo: "Planejamento Bimestral de Educação Física",
        descricao: "Estrutura bimestral com atividades práticas e teóricas",
        tipo: "bimestral",
        disciplina: "Educação Física",
        nivel: "Fundamental I",
        popularidade: 4.4,
        downloads: 1230,
        dataPublicacao: new Date(2023, 8, 12),
        detalhes: "Modelo de planejamento bimestral para Educação Física nos anos iniciais do Ensino Fundamental, contemplando desenvolvimento motor, jogos cooperativos, brincadeiras tradicionais e iniciação esportiva. Inclui roteiro para avaliação diagnóstica e formativa."
      }
    ];
  }
  
  // Filtrar modelos de acordo com os critérios selecionados
  const modelosFiltrados = modelos.filter(modelo => {
    // Filtro por busca
    const termoBusca = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
                       modelo.titulo.toLowerCase().includes(termoBusca) || 
                       modelo.descricao.toLowerCase().includes(termoBusca);
    
    // Filtro por tipo
    const matchTipo = tipoFiltro === "todos" || modelo.tipo === tipoFiltro;
    
    // Filtro por disciplina
    const matchDisciplina = disciplinaFiltro === "todos" || modelo.disciplina === disciplinaFiltro;
    
    // Filtro por nível
    const matchNivel = nivelFiltro === "todos" || modelo.nivel === nivelFiltro;
    
    return matchSearch && matchTipo && matchDisciplina && matchNivel;
  });
  
  // Função para baixar o modelo
  const baixarModelo = (modelo: ModeloPlanejamento) => {
    setIsLoading(true);
    
    // Simulando download
    setTimeout(() => {
      setIsLoading(false);
      
      // Atualizar contagem de downloads
      setModelos(prevModelos => 
        prevModelos.map(m => 
          m.id === modelo.id 
            ? { ...m, downloads: m.downloads + 1 } 
            : m
        )
      );
      
      toast({
        title: "Download iniciado",
        description: `O modelo "${modelo.titulo}" está sendo baixado.`,
      });
    }, 1500);
  };
  
  // Lista de disciplinas para filtro
  const disciplinas = ["Matemática", "Língua Portuguesa", "Ciências", "História", "Geografia", "Educação Física", "Artes", "Multidisciplinar"];
  
  // Lista de níveis para filtro
  const niveis = ["Educação Infantil", "Fundamental I", "Fundamental II", "Ensino Médio"];

  return (
    <FerramentaLayout
      title="Modelos de Planejamento"
      description="Utilize templates prontos para seus planos de aula e planejamentos"
      icon={<ListChecks className="h-6 w-6 text-blue-600" />}
      helpText="Explore nossa biblioteca de modelos de planejamento para diferentes disciplinas, níveis de ensino e períodos. Você pode filtrar por tipo, disciplina e nível de ensino para encontrar o modelo ideal para suas necessidades."
    >
      <div className="space-y-6">
        {/* Barra de busca e filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input 
                    type="search" 
                    placeholder="Buscar modelos de planejamento..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de Planejamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="anual">Planejamento Anual</SelectItem>
                    <SelectItem value="bimestral">Planejamento Bimestral</SelectItem>
                    <SelectItem value="semanal">Planejamento Semanal</SelectItem>
                    <SelectItem value="unitario">Por Unidade/Temático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={disciplinaFiltro} onValueChange={setDisciplinaFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as disciplinas</SelectItem>
                    {disciplinas.map(disciplina => (
                      <SelectItem key={disciplina} value={disciplina}>{disciplina}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={nivelFiltro} onValueChange={setNivelFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nível de ensino" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os níveis</SelectItem>
                    {niveis.map(nivel => (
                      <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Exibição de categorias de modelos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tiposModelo).map(([tipo, info]) => (
            <Card 
              key={tipo}
              className={`cursor-pointer border transition-all hover:border-blue-200 hover:shadow-sm ${tipoFiltro === tipo ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => setTipoFiltro(tipo === tipoFiltro ? "todos" : tipo)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg ${tipoFiltro === tipo ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-600'}`}>
                  {info.icone}
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{info.titulo}</h3>
                  <p className="text-xs text-neutral-500">{info.descricao}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Lista de modelos */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">
              {modelosFiltrados.length} {modelosFiltrados.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}
            </h2>
            
            <Select defaultValue="recentes">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais recentes</SelectItem>
                <SelectItem value="populares">Mais populares</SelectItem>
                <SelectItem value="downloads">Mais baixados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {modelosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <Lightbulb className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhum modelo encontrado</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Não encontramos modelos que correspondam aos filtros selecionados. Tente ajustar seus critérios de busca.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setTipoFiltro("todos");
                  setDisciplinaFiltro("todos");
                  setNivelFiltro("todos");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modelosFiltrados.map((modelo) => (
                <Card 
                  key={modelo.id}
                  className="border hover:border-blue-200 hover:shadow-sm transition-all overflow-hidden"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">
                        <div className="flex items-center">
                          {tiposModelo[modelo.tipo].icone}
                          <span className="ml-1 text-xs">{tiposModelo[modelo.tipo].titulo}</span>
                        </div>
                      </Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm font-medium">{modelo.popularidade}</span>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {modelo.titulo}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {modelo.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 pt-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {modelo.disciplina}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {modelo.nivel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {modelo.downloads} downloads
                      </Badge>
                    </div>
                    
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 text-sm flex items-center"
                      onClick={() => setModeloSelecionado(modelo === modeloSelecionado ? null : modelo)}
                    >
                      {modelo === modeloSelecionado ? "Ocultar detalhes" : "Ver detalhes"}
                      <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${modelo === modeloSelecionado ? "rotate-90" : ""}`} />
                    </Button>
                    
                    {modelo === modeloSelecionado && (
                      <div className="mt-2 pt-2 border-t border-neutral-100 text-sm text-neutral-700">
                        {modelo.detalhes}
                      </div>
                    )}
                  </CardContent>
                  <Separator />
                  <CardFooter className="py-3 justify-between">
                    <div className="text-xs text-neutral-500">
                      Publicado em {modelo.dataPublicacao.toLocaleDateString()}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => baixarModelo(modelo)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Download className="h-4 w-4 mr-1" />
                      )}
                      Baixar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {/* Seção promocional para modelos premium */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xl font-bold">Modelos Premium de Planejamento</h3>
                <p className="text-blue-100">
                  Acesse nossa coleção completa de modelos premium, com recursos avançados, avaliações integradas e alinhamento com a BNCC.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50">
                    Explorar Modelos Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="p-8 bg-blue-500 bg-opacity-40 rounded-full">
                  <FileText className="h-14 w-14 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FerramentaLayout>
  );
}
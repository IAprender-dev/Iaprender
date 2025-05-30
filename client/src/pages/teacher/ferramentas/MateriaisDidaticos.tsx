import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  BookOpenCheck, 
  FileText, 
  Presentation, 
  ArrowLeft, 
  Bookmark, 
  Copy, 
  Download, 
  Loader2,
  Sparkles,
  RefreshCw,
  Heart,
  Share2,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Tipo para representar um material gerado
interface MaterialGerado {
  id: string;
  titulo: string;
  tipo: string;
  conteudo: string;
  dataGeracao: Date;
  favorito: boolean;
}

export default function MateriaisDidaticos() {
  const { toast } = useToast();
  
  // Estados para os parâmetros da geração
  const [assunto, setAssunto] = useState("");
  const [tipoMaterial, setTipoMaterial] = useState("apostila");
  const [descricaoDetalhada, setDescricaoDetalhada] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para os materiais gerados
  const [materiaisGerados, setMateriaisGerados] = useState<MaterialGerado[]>([]);
  const [materialSelecionado, setMaterialSelecionado] = useState<MaterialGerado | null>(null);
  
  // Função para gerar materiais
  const gerarMaterial = async () => {
    if (!assunto.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "Por favor, informe o assunto do material que deseja criar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aqui seria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta
      const novoMaterial: MaterialGerado = {
        id: `mat-${Date.now()}`,
        titulo: `${tipoParaTexto(tipoMaterial)} - ${assunto}`,
        tipo: tipoMaterial,
        conteudo: mockConteudo(),
        dataGeracao: new Date(),
        favorito: false
      };
      
      setMateriaisGerados(prev => [novoMaterial, ...prev]);
      setMaterialSelecionado(novoMaterial);
      
      toast({
        title: "Material criado com sucesso!",
        description: `${tipoParaTexto(tipoMaterial)} sobre ${assunto} foi gerado.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar material",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Funções auxiliares
  const tipoParaTexto = (tipo: string) => {
    const mapeamento: {[key: string]: string} = {
      apostila: "Apostila",
      slides: "Slides de Apresentação",
      resumo: "Resumo Didático"
    };
    return mapeamento[tipo] || tipo;
  };

  const tipoParaIcone = (tipo: string) => {
    switch (tipo) {
      case 'apostila':
        return <FileText className="h-5 w-5" />;
      case 'slides':
        return <Presentation className="h-5 w-5" />;
      case 'resumo':
        return <BookOpenCheck className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const mockConteudo = () => {
    return `
    <div class="material-content">
      <h1>${assunto}</h1>
      <p><strong>Tipo:</strong> ${tipoParaTexto(tipoMaterial)}</p>
      ${descricaoDetalhada ? `<p><strong>Descrição:</strong> ${descricaoDetalhada}</p>` : ''}
      
      <div class="content-section">
        <h2>Introdução</h2>
        <p>Este material didático apresenta uma abordagem completa sobre ${assunto}, desenvolvido especialmente para facilitar o processo de ensino-aprendizagem.</p>
        
        <h2>Desenvolvimento do Conteúdo</h2>
        <p>Apresentamos aqui os conceitos fundamentais, exemplos práticos e aplicações relevantes do tema proposto, organizados de forma didática e progressiva.</p>
        
        <h2>Aplicações Práticas</h2>
        <p>Este conteúdo pode ser aplicado em diversas situações do cotidiano educacional, proporcionando aos estudantes uma compreensão mais ampla e significativa.</p>
        
        <h2>Considerações Finais</h2>
        <p>O material desenvolvido visa promover uma aprendizagem efetiva e engajada, conectando teoria e prática de forma dinâmica.</p>
      </div>
    </div>`;
  };

  const copiarParaClipboard = () => {
    if (materialSelecionado) {
      navigator.clipboard.writeText(materialSelecionado.conteudo);
      toast({
        title: "Conteúdo copiado!",
        description: "O material foi copiado para a área de transferência.",
      });
    }
  };

  const toggleFavorito = (id: string) => {
    setMateriaisGerados(prev => prev.map(material => 
      material.id === id 
        ? { ...material, favorito: !material.favorito } 
        : material
    ));
    
    if (materialSelecionado?.id === id) {
      setMaterialSelecionado(prev => prev ? { ...prev, favorito: !prev.favorito } : null);
    }
  };

  const sugestoesAssuntos = [
    "Sistema Solar",
    "Revolução Industrial", 
    "Figuras de Linguagem",
    "Equações Quadráticas",
    "Biomas Brasileiros"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Helmet>
        <title>Materiais Didáticos IA - IAverse</title>
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
                <h1 className="text-xl font-bold text-slate-800">Materiais Didáticos IA</h1>
                <p className="text-sm text-slate-600">Crie apostilas, slides e materiais educacionais</p>
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
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Configurar Material
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Defina o conteúdo e tipo de material que deseja criar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Assunto */}
                <div className="space-y-3">
                  <Label htmlFor="assunto" className="text-sm font-medium text-slate-700">
                    Assunto *
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

                {/* Tipo de Material */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Tipo de Material
                  </Label>
                  <Select value={tipoMaterial} onValueChange={setTipoMaterial}>
                    <SelectTrigger className="border-slate-300 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apostila">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Apostila Completa
                        </div>
                      </SelectItem>
                      <SelectItem value="slides">
                        <div className="flex items-center gap-2">
                          <Presentation className="h-4 w-4" />
                          Slides de Apresentação
                        </div>
                      </SelectItem>
                      <SelectItem value="resumo">
                        <div className="flex items-center gap-2">
                          <BookOpenCheck className="h-4 w-4" />
                          Resumo Didático
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição Detalhada */}
                <div className="space-y-3">
                  <Label htmlFor="descricao" className="text-sm font-medium text-slate-700">
                    Instruções Adicionais
                  </Label>
                  <Textarea 
                    id="descricao"
                    placeholder="Ex: Para alunos do 7º ano, com exemplos do cotidiano e linguagem acessível"
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500"
                    value={descricaoDetalhada}
                    onChange={(e) => setDescricaoDetalhada(e.target.value)}
                  />
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarMaterial}
                  disabled={isLoading || !assunto.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Criando Material...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Material Didático
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Materiais Recentes */}
            {materiaisGerados.length > 0 && (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <BookOpenCheck className="h-5 w-5 text-blue-600" />
                    Materiais Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {materiaisGerados.slice(0, 3).map((material) => (
                    <div 
                      key={material.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setMaterialSelecionado(material)}
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {tipoParaIcone(material.tipo)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{material.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {material.dataGeracao.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={material.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(material.id);
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
            {materialSelecionado ? (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {tipoParaIcone(materialSelecionado.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-800">
                          {materialSelecionado.titulo}
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          Criado em {materialSelecionado.dataGeracao.toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={materialSelecionado.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={() => toggleFavorito(materialSelecionado.id)}
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
                  <div className="bg-white rounded-lg p-6 border border-slate-200 max-h-[500px] overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: materialSelecionado.conteudo }}
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
                    <BookOpenCheck className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Nenhum material selecionado
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    Configure o assunto e tipo de material desejado, depois clique em "Gerar Material Didático" para criar seu conteúdo educacional.
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
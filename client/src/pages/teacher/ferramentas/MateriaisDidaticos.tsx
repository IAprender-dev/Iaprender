import { useState } from "react";
import { BookOpenCheck, Download, Copy, Bookmark, Loader2, Lightbulb, Layout, FileText, Presentation, MessageSquare } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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
  const [orientacaoEducacional, setOrientacaoEducacional] = useState("");
  const [objetivosAprendizagem, setObjetivosAprendizagem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para os materiais gerados
  const [materiaisGerados, setMateriaisGerados] = useState<MaterialGerado[]>([]);
  const [materialSelecionado, setMaterialSelecionado] = useState<MaterialGerado | null>(null);
  
  // Mock de função para gerar materiais
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
      // Simulando delay de processamento
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
        title: "Material didático gerado com sucesso",
        description: `${tipoParaTexto(tipoMaterial)} sobre ${assunto} criado(a) com sucesso.`,
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

  // Funções de suporte para conversão de valores
  const tipoParaTexto = (tipo: string) => {
    const mapeamento: {[key: string]: string} = {
      apostila: "Apostila",
      slides: "Apresentação de Slides",
      resumo: "Resumo",
      planoAula: "Plano de Aula"
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
      case 'planoAula':
        return <Layout className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Mock de dados para simulação
  const mockConteudo = () => {
    return `
    <div class="material-content">
      <h1>${assunto}</h1>
      <p>Tipo: ${tipoParaTexto(tipoMaterial)}</p>
      ${objetivosAprendizagem ? `<p>Objetivos de aprendizagem: ${objetivosAprendizagem}</p>` : ''}
      
      <div class="content-section">
        <h2>Introdução</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec purus vitae tellus rhoncus venenatis. Vivamus ac felis at purus convallis malesuada in nec nunc. Donec eget magna vehicula, interdum sapien sit amet, consectetur sem.</p>
        
        <h2>Desenvolvimento</h2>
        <p>Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
        
        <h2>Aplicações</h2>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        
        <h2>Conclusão</h2>
        <p>Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.</p>
      </div>
    </div>`;
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
    
    toast({
      title: "Status atualizado",
      description: "Status de favorito alterado com sucesso.",
    });
  };

  const copiarParaClipboard = () => {
    if (materialSelecionado) {
      navigator.clipboard.writeText(materialSelecionado.conteudo);
      toast({
        title: "Conteúdo copiado",
        description: "O conteúdo do material foi copiado para a área de transferência.",
      });
    }
  };

  // Sugestões de assuntos para inspiração
  const sugestoesAssuntos = [
    "O sistema solar e seus planetas",
    "Revolução Industrial e seus impactos socioeconômicos",
    "Figuras de linguagem na literatura brasileira",
    "Equações do segundo grau e suas aplicações",
    "Biomas brasileiros e sua biodiversidade"
  ];

  return (
    <FerramentaLayout
      title="Materiais Didáticos IA"
      description="Crie apostilas, slides e materiais de apoio para suas aulas"
      icon={<BookOpenCheck className="h-6 w-6 text-blue-600" />}
      helpText="Especifique o assunto, tipo de material e objetivos de aprendizagem para criar materiais didáticos personalizados para suas aulas."
    >
      <Tabs defaultValue="criar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="criar" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Criar Novo Material
          </TabsTrigger>
          <TabsTrigger value="biblioteca" className="text-sm">
            <BookOpenCheck className="h-4 w-4 mr-2" />
            Biblioteca de Materiais ({materiaisGerados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Painel de configuração */}
            <div className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="assunto" className="text-base font-medium">Assunto</Label>
                <Textarea 
                  id="assunto"
                  placeholder="Ex: Meio ambiente e sustentabilidade - impacto das ações humanas"
                  className="min-h-[80px]"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                />
                
                <div className="text-sm text-neutral-500">
                  <p className="font-medium mb-1">Sugestões de assuntos:</p>
                  <div className="flex flex-wrap gap-2">
                    {sugestoesAssuntos.map((sugestao, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => setAssunto(sugestao)}
                      >
                        {sugestao}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm">Tipo de material</Label>
                <RadioGroup value={tipoMaterial} onValueChange={setTipoMaterial} className="grid grid-cols-2 gap-2">
                  <Card className={`border-2 cursor-pointer ${tipoMaterial === 'apostila' ? 'border-blue-500 bg-blue-50' : 'border-neutral-200'}`} onClick={() => setTipoMaterial('apostila')}>
                    <CardContent className="p-4 flex items-start space-x-3">
                      <RadioGroupItem value="apostila" id="apostila" className="mt-1" />
                      <div>
                        <Label htmlFor="apostila" className="text-sm font-medium cursor-pointer">Apostila</Label>
                        <p className="text-xs text-neutral-500">Material didático completo em formato de texto</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className={`border-2 cursor-pointer ${tipoMaterial === 'slides' ? 'border-blue-500 bg-blue-50' : 'border-neutral-200'}`} onClick={() => setTipoMaterial('slides')}>
                    <CardContent className="p-4 flex items-start space-x-3">
                      <RadioGroupItem value="slides" id="slides" className="mt-1" />
                      <div>
                        <Label htmlFor="slides" className="text-sm font-medium cursor-pointer">Slides</Label>
                        <p className="text-xs text-neutral-500">Apresentação em formato de slides para aulas</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className={`border-2 cursor-pointer ${tipoMaterial === 'resumo' ? 'border-blue-500 bg-blue-50' : 'border-neutral-200'}`} onClick={() => setTipoMaterial('resumo')}>
                    <CardContent className="p-4 flex items-start space-x-3">
                      <RadioGroupItem value="resumo" id="resumo" className="mt-1" />
                      <div>
                        <Label htmlFor="resumo" className="text-sm font-medium cursor-pointer">Resumo</Label>
                        <p className="text-xs text-neutral-500">Resumo dos pontos-chave do conteúdo</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className={`border-2 cursor-pointer ${tipoMaterial === 'planoAula' ? 'border-blue-500 bg-blue-50' : 'border-neutral-200'}`} onClick={() => setTipoMaterial('planoAula')}>
                    <CardContent className="p-4 flex items-start space-x-3">
                      <RadioGroupItem value="planoAula" id="planoAula" className="mt-1" />
                      <div>
                        <Label htmlFor="planoAula" className="text-sm font-medium cursor-pointer">Plano de Aula</Label>
                        <p className="text-xs text-neutral-500">Estrutura detalhada de uma aula</p>
                      </div>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label htmlFor="objetivosAprendizagem" className="text-sm">Objetivos de aprendizagem (opcional)</Label>
                <Textarea 
                  id="objetivosAprendizagem"
                  placeholder="Ex: Compreender o processo de fotossíntese e identificar suas etapas"
                  className="min-h-[80px]"
                  value={objetivosAprendizagem}
                  onChange={(e) => setObjetivosAprendizagem(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="orientacaoEducacional" className="text-sm">Orientação educacional (opcional)</Label>
                <Textarea 
                  id="orientacaoEducacional"
                  placeholder="Ex: Abordar o conteúdo de forma acessível para alunos do 8º ano, com exemplos práticos do cotidiano"
                  className="min-h-[80px]"
                  value={orientacaoEducacional}
                  onChange={(e) => setOrientacaoEducacional(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  Forneça orientações adicionais sobre como o material deve ser elaborado, como abordagem pedagógica, adaptações para necessidades específicas, etc.
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={gerarMaterial}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando material...
                  </>
                ) : (
                  <>
                    <BookOpenCheck className="mr-2 h-4 w-4" />
                    Criar material didático
                  </>
                )}
              </Button>
            </div>
            
            {/* Painel de visualização */}
            <div className="space-y-6">
              {materialSelecionado ? (
                <Card className="border border-neutral-200 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 flex flex-row justify-between items-center">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {tipoParaIcone(materialSelecionado.tipo)}
                        <span className="ml-2">{materialSelecionado.titulo}</span>
                      </CardTitle>
                      <CardDescription>
                        Criado em {materialSelecionado.dataGeracao.toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={materialSelecionado.favorito ? "text-amber-500" : "text-neutral-400"}
                      onClick={() => toggleFavorito(materialSelecionado.id)}
                    >
                      <Bookmark className="h-5 w-5" />
                    </Button>
                  </CardHeader>
                  <div className="border-t border-neutral-100">
                    <div
                      className="prose prose-sm max-h-[500px] overflow-y-auto p-6"
                      dangerouslySetInnerHTML={{ __html: materialSelecionado.conteudo }}
                    />
                  </div>
                  <CardFooter className="flex justify-between border-t border-neutral-100 pt-3">
                    <Button variant="ghost" size="sm" onClick={copiarParaClipboard}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copiar
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-4 w-4" />
                        Exportar
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-8 text-center">
                  <Lightbulb className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 mb-2">Como criar materiais eficazes</h3>
                  <div className="text-sm text-neutral-600 max-w-md mb-6">
                    <p className="mb-3">
                      Materiais didáticos bem elaborados melhoram significativamente a experiência de aprendizagem dos alunos.
                    </p>
                    <ul className="text-left space-y-2">
                      <li className="flex items-start">
                        <span className="inline-block bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                        <span>Defina claramente o <strong>assunto</strong> e os <strong>objetivos</strong> de aprendizagem</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                        <span>Escolha o <strong>tipo de material</strong> mais adequado para seu objetivo pedagógico</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                        <span>Forneça <strong>orientações específicas</strong> sobre abordagem e público-alvo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
                        <span>Revise e adapte o material gerado conforme necessário</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="biblioteca">
          {materiaisGerados.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materiaisGerados.map((material) => (
                  <Card 
                    key={material.id} 
                    className={`border cursor-pointer transition-all ${materialSelecionado?.id === material.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-neutral-200 hover:border-blue-200'}`}
                    onClick={() => setMaterialSelecionado(material)}
                  >
                    <CardHeader className="pb-2 flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="bg-blue-50 rounded-full p-2 mr-3">
                          {tipoParaIcone(material.tipo)}
                        </div>
                        <div>
                          <CardTitle className="text-base leading-tight">{material.titulo}</CardTitle>
                          <CardDescription className="text-xs">
                            Criado em {material.dataGeracao.toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 ${material.favorito ? "text-amber-500" : "text-neutral-400"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(material.id);
                        }}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <div className="flex justify-between w-full">
                        <Badge variant="secondary" className="text-xs">
                          {tipoParaTexto(material.tipo)}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-xs px-2 h-7">
                          Visualizar
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <BookOpenCheck className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Sua biblioteca está vazia</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Você ainda não criou nenhum material didático. Crie seu primeiro material na aba "Criar Novo Material".
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="criar"]') as HTMLElement;
                if (element) element.click();
              }}>
                Criar primeiro material
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FerramentaLayout>
  );
}
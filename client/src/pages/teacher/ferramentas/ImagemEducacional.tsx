import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  ArrowLeft,
  Image as ImageIcon,
  Settings,
  Download,
  Sparkles,
  Palette,
  Zap,
  Eye,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ImageResponse {
  url: string;
}

interface ApiResponse {
  images?: ImageResponse[];
  tokensUsed?: number;
}

export default function ImagemEducacional() {
  const { toast } = useToast();
  
  // Estados principais
  const [prompt, setPrompt] = useState("");
  const [estilo, setEstilo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagemGerada, setImagemGerada] = useState<string | null>(null);

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
    
    // Também rolar para o topo quando uma imagem for gerada
    if (imagemGerada) {
      setTimeout(scrollToTop, 100);
    }
  }, [imagemGerada]);

  // Sugestões de prompts educacionais
  const sugestoesTemas = [
    "Sistema solar com todos os planetas e suas órbitas em cores vibrantes",
    "Célula animal detalhada com organelas identificadas e coloridas",
    "Ciclo da água completo com setas e legendas explicativas",
    "Mapa do Brasil com regiões em cores diferentes e capitais",
    "Esqueleto humano didático com principais ossos identificados"
  ];

  // Função para gerar imagem
  const gerarImagem = async () => {
    if (!prompt.trim() || !estilo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha a descrição e selecione um estilo.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/openai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt}. Estilo: ${estilo}. Educacional, didático, adequado para sala de aula.`,
          style: estilo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar imagem');
      }

      const data: ApiResponse = await response.json();
      
      if (data.images && data.images.length > 0) {
        setImagemGerada(data.images[0].url);
        toast({
          title: "Sua requisição foi gerada com sucesso!",
          description: "Em instantes você receberá sua Imagem Educacional",
        });
      } else {
        throw new Error('Nenhuma imagem foi gerada');
      }
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: "Erro ao gerar imagem",
        description: error instanceof Error ? error.message : "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para download
  const baixarImagem = async () => {
    if (!imagemGerada) {
      toast({
        title: "Erro",
        description: "Nenhuma imagem foi gerada ainda.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Tentar download direto primeiro
      const response = await fetch(imagemGerada, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar imagem');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `imagem-educacional-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Download concluído",
        description: "Imagem salva com sucesso.",
      });
    } catch (error) {
      console.error('Erro no download:', error);
      
      // Fallback: abrir em nova aba
      try {
        window.open(imagemGerada, '_blank');
        toast({
          title: "Imagem aberta em nova aba",
          description: "Clique com o botão direito na imagem e selecione 'Salvar imagem como'.",
        });
      } catch (fallbackError) {
        toast({
          title: "Erro no download",
          description: "Não foi possível baixar a imagem. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para copiar URL
  const copiarUrl = () => {
    if (!imagemGerada) return;
    
    navigator.clipboard.writeText(imagemGerada).then(() => {
      toast({
        title: "URL copiada",
        description: "Link da imagem copiado para a área de transferência.",
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <Helmet>
        <title>Criar Imagem Educacional - IAverse</title>
      </Helmet>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900">Imagens Educacionais</h1>
                  <p className="text-sm text-slate-600">Gere imagens didáticas com Inteligência Artificial</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Painel de Configuração */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-600" />
                  Configurar Imagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Descrição */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Descrição da Imagem</Label>
                  <Textarea
                    placeholder="Ex: Sistema solar completo com todos os planetas em suas órbitas, mostrando as diferenças de tamanho e cores..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none border-2 border-violet-200 focus:border-violet-500 focus:ring-violet-500/20 focus:ring-4 transition-all duration-300 bg-white text-violet-900"
                  />
                  <p className="text-xs text-slate-500">Seja específico para obter melhores resultados</p>
                </div>

                {/* Estilo */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Estilo Visual</Label>
                  <Select value={estilo} onValueChange={setEstilo}>
                    <SelectTrigger className="border-2 border-violet-200 focus:border-violet-500 transition-all duration-300 bg-white text-violet-900">
                      <SelectValue placeholder="Selecione o estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educacional-realista">Educacional Realista</SelectItem>
                      <SelectItem value="ilustracao-didatica">Ilustração Didática</SelectItem>
                      <SelectItem value="cartoon-educativo">Cartoon Educativo</SelectItem>
                      <SelectItem value="diagrama-tecnico">Diagrama Técnico</SelectItem>
                      <SelectItem value="infografico">Infográfico</SelectItem>
                      <SelectItem value="aquarela-educativa">Aquarela Educativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                {/* Botão Gerar */}
                <Button 
                  onClick={gerarImagem}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gerando Imagem...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Gerar Imagem com IA
                    </div>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* Painel de Resultado */}
          <div className="lg:col-span-2">
            {!imagemGerada ? (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl h-full">
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Palette className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Pronto para criar imagens educacionais?</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                      Descreva a imagem que precisa, escolha um estilo e deixe a IA criar conteúdo visual perfeito para suas aulas.
                    </p>
                    <div className="space-y-2 text-sm text-slate-500">
                      <p className="font-medium">Dicas para melhores resultados:</p>
                      <ul className="text-left space-y-1 max-w-xs mx-auto">
                        <li>• Seja específico sobre elementos visuais</li>
                        <li>• Mencione cores e detalhes importantes</li>
                        <li>• Indique se precisa de legendas ou setas</li>
                        <li>• Especifique a faixa etária dos alunos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        Imagem Gerada
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                          {estilo}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                          Pronta para uso
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copiarUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={baixarImagem}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <img 
                      src={imagemGerada} 
                      alt="Imagem educacional gerada"
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                  
                  {/* Prompt usado */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Descrição utilizada:</Label>
                    <p className="text-sm text-slate-600 leading-relaxed">{prompt}</p>
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
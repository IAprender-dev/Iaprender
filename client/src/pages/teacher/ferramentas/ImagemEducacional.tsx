import { useState } from "react";
import { ImageIcon, Download, Copy, RefreshCw, Loader2 } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Interfaces para tipagem
interface ImageResponse {
  url: string;
  revised_prompt?: string;
}

interface ApiResponse {
  images?: ImageResponse[];
  tokensUsed?: number;
}

export default function ImagemEducacional() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [estilo, setEstilo] = useState("fotorealista");
  const [formato, setFormato] = useState("quadrado");
  const [textoImagem, setTextoImagem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagensGeradas, setImagensGeradas] = useState<string[]>([]);

  // Lista de temas para inspiração
  const exemplosTemas = [
    "Sistema solar com todos os planetas e suas principais características",
    "Diagrama do ciclo da água na natureza com explicações detalhadas",
    "Mapa da América do Sul destacando os principais rios e montanhas",
    "Representação visual do processo fotossintético em plantas",
    "Linha do tempo ilustrada das principais civilizações antigas"
  ];

  // Função para gerar imagens usando a API do OpenAI/DALL-E
  const gerarImagem = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Descrição obrigatória",
        description: "Por favor, descreva a imagem que deseja criar.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Construir o prompt completo com estilo, formato e texto opcional
      let promptCompleto = `${prompt}, no estilo ${estilo}`;
      
      // Adicionar texto na imagem se fornecido
      if (textoImagem.trim()) {
        promptCompleto += `, com o texto "${textoImagem}" visível na imagem`;
      }
      
      // Configuração de formato
      const size = formato === "quadrado" ? "1024x1024" : 
                  formato === "paisagem" ? "1792x1024" : 
                  formato === "retrato" ? "1024x1792" : 
                  "1024x1792"; // poster por padrão é vertical
      
      // Chamada para a API
      const response = await fetch('/api/ai/openai/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptCompleto,
          size: size,
          n: 2,  // Gerar 2 imagens
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao gerar imagens');
      }
      
      const data = await response.json() as ApiResponse;
      
      // Extrair URLs das imagens
      const imageUrls = data.images ? data.images.map(img => img.url) : [];
      setImagensGeradas(imageUrls);
      
      toast({
        title: "Imagens geradas com sucesso",
        description: "Suas imagens educacionais foram criadas.",
      });
    } catch (error) {
      console.error("Erro ao gerar imagens:", error);
      
      // Para desenvolvimento, usando imagens mock caso a API falhe
      const mockImagens = [
        "https://placehold.co/800x800/e6f7ff/007bff?text=Imagem+Educacional+1",
        "https://placehold.co/800x800/e6f7ff/007bff?text=Imagem+Educacional+2",
      ];
      
      setImagensGeradas(mockImagens);
      
      toast({
        title: "Erro ao gerar imagens",
        description: "Ocorreu um erro ao processar sua solicitação. Usando imagens de demonstração.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copiarParaClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada",
      description: "URL da imagem copiada para a área de transferência.",
    });
  };

  return (
    <FerramentaLayout
      title="Criar Imagem Educacional"
      description="Gere imagens personalizadas para enriquecer suas aulas e materiais didáticos"
      icon={<ImageIcon className="h-6 w-6 text-blue-600" />}
      helpText="Descreva detalhadamente a imagem educacional que você deseja criar. Quanto mais específico for, melhores serão os resultados. Você pode ajustar o estilo e formato da imagem."
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Painel de controle - 2 colunas */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <Label htmlFor="prompt" className="text-base font-medium">Descreva sua imagem educacional</Label>
            <Textarea 
              id="prompt"
              placeholder="Ex: Uma representação detalhada do sistema solar mostrando todos os planetas em órbita ao redor do sol, com legenda de cada planeta e suas principais características."
              className="min-h-[120px]"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <div className="text-sm text-neutral-500">
              <p className="mb-2 font-medium">Exemplos de descrições eficazes:</p>
              <ul className="space-y-1">
                {exemplosTemas.map((exemplo, index) => (
                  <li 
                    key={index}
                    className="cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() => setPrompt(exemplo)}
                  >
                    • {exemplo}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estilo" className="text-sm">Estilo visual</Label>
              <Select value={estilo} onValueChange={setEstilo}>
                <SelectTrigger id="estilo">
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fotorealista">Fotorealista</SelectItem>
                  <SelectItem value="ilustracao">Ilustração</SelectItem>
                  <SelectItem value="infografico">Infográfico</SelectItem>
                  <SelectItem value="cartoon">Cartoon educativo</SelectItem>
                  <SelectItem value="desenho">Desenho a mão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formato" className="text-sm">Formato</Label>
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger id="formato">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quadrado">Quadrado (1:1)</SelectItem>
                  <SelectItem value="paisagem">Paisagem (16:9)</SelectItem>
                  <SelectItem value="retrato">Retrato (9:16)</SelectItem>
                  <SelectItem value="poster">Poster (2:3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textoImagem" className="text-sm">Incluir texto na imagem (opcional)</Label>
            <Input 
              id="textoImagem"
              placeholder="Ex: Sistema Solar" 
              value={textoImagem}
              onChange={(e) => setTextoImagem(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={gerarImagem}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando imagens...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Gerar imagens
              </>
            )}
          </Button>
        </div>
        
        {/* Painel de resultados - 3 colunas */}
        <div className="md:col-span-3">
          {imagensGeradas.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-neutral-900">Imagens geradas</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setImagensGeradas([])}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imagensGeradas.map((url, index) => (
                  <Card key={index} className="overflow-hidden bg-neutral-50 border border-neutral-200">
                    <div className="aspect-square relative bg-neutral-100">
                      <img 
                        src={url} 
                        alt={`Imagem educacional ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex justify-between">
                        <Button variant="ghost" size="sm" onClick={() => copiarParaClipboard(url)}>
                          <Copy className="mr-1 h-4 w-4" />
                          Copiar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(url, "_blank")}>
                          <Download className="mr-1 h-4 w-4" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <ImageIcon className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhuma imagem gerada</h3>
              <p className="text-neutral-500 max-w-md mb-6">
                Descreva detalhadamente a imagem educacional que você deseja criar e clique em "Gerar imagens".
              </p>
              <div className="text-sm text-neutral-500">
                <p className="font-medium mb-2">Dicas para melhores resultados:</p>
                <ul className="text-left space-y-1">
                  <li>• Seja específico sobre o tema educacional</li>
                  <li>• Mencione cores e elementos visuais desejados</li>
                  <li>• Indique qual faixa etária a imagem se destina</li>
                  <li>• Descreva se deseja gráficos, diagramas ou ilustrações</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </FerramentaLayout>
  );
}
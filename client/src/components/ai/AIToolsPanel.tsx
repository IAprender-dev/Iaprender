import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  Bot, 
  Image as ImageIcon, 
  Search, 
  Loader2,
  Sparkles,
  Send,
  RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Componente principal que encapsula as diferentes ferramentas de IA
export default function AIToolsPanel() {
  const [activeTab, setActiveTab] = useState("chatgpt");
  const { toast } = useToast();

  // Verifica se tem as chaves de API necessárias
  const checkApiKeyAvailability = async () => {
    try {
      const response = await apiRequest("GET", "/api/ai/availability");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error("Falha ao verificar disponibilidade das APIs");
      }
      
      return data;
    } catch (error) {
      console.error("Erro ao verificar APIs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a disponibilidade dos serviços de IA",
        variant: "destructive"
      });
      return {
        openai: false,
        anthropic: false,
        perplexity: false
      };
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-5 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium">Ferramentas de IA para Professores</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full rounded-none border-b border-neutral-200 p-0 h-auto">
            <TabsTrigger 
              value="chatgpt" 
              className="flex-1 px-4 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              ChatGPT
            </TabsTrigger>
            <TabsTrigger 
              value="claude" 
              className="flex-1 px-4 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Bot className="h-4 w-4 mr-2" />
              Claude
            </TabsTrigger>
            <TabsTrigger 
              value="image" 
              className="flex-1 px-4 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Imagens
            </TabsTrigger>
            <TabsTrigger 
              value="perplexity" 
              className="flex-1 px-4 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none"
            >
              <Search className="h-4 w-4 mr-2" />
              Perplexity
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chatgpt" className="mt-0 p-0">
            <ChatGPTPanel />
          </TabsContent>
          
          <TabsContent value="claude" className="mt-0 p-0">
            <ClaudePanel />
          </TabsContent>
          
          <TabsContent value="image" className="mt-0 p-0">
            <ImageGenerationPanel />
          </TabsContent>
          
          <TabsContent value="perplexity" className="mt-0 p-0">
            <PerplexityPanel />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Componente para ChatGPT (OpenAI)
function ChatGPTPanel() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Por favor, digite algo para gerar uma resposta",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResponse("");
    
    try {
      const response = await apiRequest("POST", "/api/ai/openai/chat", {
        prompt: prompt,
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 1000
      });
      
      if (!response.ok) {
        throw new Error("Falha ao gerar resposta");
      }
      
      const data = await response.json();
      setResponse(data.content);
    } catch (error) {
      console.error("Erro ao chamar ChatGPT:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar uma resposta. Verifique sua conexão ou tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chatgpt-prompt">Pergunte ao ChatGPT (GPT-4)</Label>
            <Textarea
              id="chatgpt-prompt"
              placeholder="Escreva sua pergunta ou tarefa. Ex: Crie um plano de aula sobre fotossíntese para alunos do 5º ano."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-y"
            />
            <div className="text-xs text-muted-foreground">
              Use para gerar textos, explicações, planos de aula, ou resolver dúvidas.
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando resposta...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Gerar resposta
              </>
            )}
          </Button>
        </form>
        
        {response && (
          <div className="mt-6">
            <Label>Resposta:</Label>
            <div className="mt-2 p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para Claude (Anthropic)
function ClaudePanel() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Por favor, digite algo para gerar uma resposta",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResponse("");
    
    try {
      const response = await apiRequest("POST", "/api/ai/anthropic/chat", {
        prompt: prompt,
        model: "claude-3.7-sonnet-20250219", // Modelo mais recente Claude
        temperature: 0.7,
        maxTokens: 1000
      });
      
      if (!response.ok) {
        throw new Error("Falha ao gerar resposta");
      }
      
      const data = await response.json();
      setResponse(data.content);
    } catch (error) {
      console.error("Erro ao chamar Claude:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar uma resposta. Verifique sua conexão ou tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="claude-prompt">Pergunte ao Claude</Label>
            <Textarea
              id="claude-prompt"
              placeholder="Escreva sua pergunta ou tarefa. Ex: Explique como avaliar os trabalhos dos alunos de forma mais eficiente."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-y"
            />
            <div className="text-xs text-muted-foreground">
              O Claude é ótimo para análise de textos longos e explicações detalhadas.
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando resposta...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Gerar resposta
              </>
            )}
          </Button>
        </form>
        
        {response && (
          <div className="mt-6">
            <Label>Resposta:</Label>
            <div className="mt-2 p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para Geração de Imagens (DALL-E)
function ImageGenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Por favor, descreva a imagem que você deseja gerar",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setImageUrl("");
    
    try {
      const response = await apiRequest("POST", "/api/ai/openai/image", {
        prompt: prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1
      });
      
      if (!response.ok) {
        throw new Error("Falha ao gerar imagem");
      }
      
      const data = await response.json();
      if (data.images && data.images.length > 0) {
        setImageUrl(data.images[0].url);
      } else {
        throw new Error("Nenhuma imagem foi gerada");
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a imagem. Verifique sua conexão ou tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-prompt">Descreva a imagem que deseja criar</Label>
            <Textarea
              id="image-prompt"
              placeholder="Descreva a imagem em detalhes. Ex: Uma sala de aula futurista com estudantes usando tecnologia avançada de realidade virtual, estilo ilustração digital."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-y"
            />
            <div className="text-xs text-muted-foreground">
              Seja específico e detalhado para obter os melhores resultados. Mencione estilo, cores, contexto.
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando imagem...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Gerar imagem
              </>
            )}
          </Button>
        </form>
        
        {imageUrl && (
          <div className="mt-6">
            <Label>Imagem gerada:</Label>
            <div className="mt-2 overflow-hidden rounded-md border border-neutral-200">
              <img 
                src={imageUrl} 
                alt="Imagem gerada por IA" 
                className="w-full h-auto object-contain"
              />
            </div>
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => window.open(imageUrl, '_blank')}>
                Ver em tamanho completo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para Perplexity (Pesquisa)
function PerplexityPanel() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: "Consulta vazia",
        description: "Por favor, digite sua pergunta de pesquisa",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setResponse("");
    setReferences([]);
    
    try {
      const response = await apiRequest("POST", "/api/ai/perplexity/search", {
        query: query,
        model: "llama-3.1-sonar-small-128k-online",
        temperature: 0.2,
        maxTokens: 1000,
        includeReferences: true
      });
      
      if (!response.ok) {
        throw new Error("Falha ao realizar pesquisa");
      }
      
      const data = await response.json();
      setResponse(data.content);
      setReferences(data.references || []);
    } catch (error) {
      console.error("Erro ao pesquisar com Perplexity:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a pesquisa. Verifique sua conexão ou tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="perplexity-query">O que você gostaria de pesquisar?</Label>
            <Input
              id="perplexity-query"
              placeholder="Digite sua pergunta. Ex: Quais são as últimas pesquisas sobre aprendizado colaborativo?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Use para pesquisar informações atualizadas da web, estudos recentes ou dados factuais.
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pesquisando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar informações
              </>
            )}
          </Button>
        </form>
        
        {response && (
          <div className="mt-6">
            <Label>Resultado da pesquisa:</Label>
            <div className="mt-2 p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm">
              {response}
            </div>
            
            {references.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm">Fontes:</Label>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                  {references.map((ref, index) => (
                    <li key={index}>
                      <a 
                        href={ref} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block"
                      >
                        {ref}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
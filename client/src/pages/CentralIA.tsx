import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Bot, 
  Image as ImageIcon, 
  MessagesSquare, 
  Search, 
  Menu, 
  X, 
  Sparkles, 
  Plus, 
  Send, 
  Loader2,
  DownloadCloud,
  Bookmark,
  Settings,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Tipos de IA disponíveis
type AIModel = "chatgpt" | "claude" | "perplexity" | "image-gen";

// Tipo de mensagem
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: AIModel;
  imageUrl?: string;
  references?: string[];
}

// Tipo de conversa
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo de arquivo ou prompt salvo
interface SavedItem {
  id: string;
  type: "image" | "prompt" | "file";
  title: string;
  content: string;
  url?: string;
  createdAt: Date;
}

export default function CentralIA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModel>("chatgpt");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // AI Models info
  const modelInfo = {
    "chatgpt": {
      name: "ChatGPT",
      icon: <Sparkles className="h-5 w-5" />,
      avatarColor: "bg-emerald-500"
    },
    "claude": {
      name: "Claude",
      icon: <Bot className="h-5 w-5" />,
      avatarColor: "bg-purple-500"
    },
    "perplexity": {
      name: "Perplexity",
      icon: <Search className="h-5 w-5" />,
      avatarColor: "bg-blue-500"
    },
    "image-gen": {
      name: "Gerador de Imagens",
      icon: <ImageIcon className="h-5 w-5" />,
      avatarColor: "bg-orange-500"
    }
  };

  // Scroll para o final da conversa quando novas mensagens são adicionadas
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Criar nova conversa
  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: `Nova conversa ${new Date().toLocaleString("pt-BR", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      messages: [],
      model: currentModel,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  // Troca de modelo de IA
  const handleModelChange = (model: AIModel) => {
    setCurrentModel(model);
    
    if (currentConversation) {
      // Se já há uma conversa ativa, perguntar se deseja mudar de modelo
      // ou iniciar uma nova conversa
      const shouldCreateNew = confirm(
        "Deseja iniciar uma nova conversa com este modelo? Clique em OK para iniciar nova conversa ou Cancelar para manter a atual."
      );
      
      if (shouldCreateNew) {
        createNewConversation();
      }
    } else {
      createNewConversation();
    }
  };
  
  // Lidar com envio de prompt
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    // Criar nova conversa se não existir
    if (!currentConversation) {
      createNewConversation();
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
      model: currentModel
    };
    
    // Atualizar conversa com a mensagem do usuário
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date()
    };
    
    setCurrentConversation(updatedConversation);
    setConversations(conversations.map(
      conv => conv.id === updatedConversation.id ? updatedConversation : conv
    ));
    
    const promptCopy = prompt;
    setPrompt("");
    setIsLoading(true);
    
    try {
      let response;
      let aiResponse;
      
      // Enviar para a API apropriada conforme o modelo
      switch (currentModel) {
        case "chatgpt":
          response = await apiRequest("POST", "/api/ai/openai/chat", {
            prompt: promptCopy,
            model: "gpt-4o",
            temperature: 0.7,
            maxTokens: 1000
          });
          
          if (!response.ok) throw new Error("Falha ao obter resposta do ChatGPT");
          aiResponse = await response.json();
          
          // Adicionar resposta do ChatGPT
          addAIResponse({
            content: aiResponse.content,
            model: "chatgpt"
          });
          break;
          
        case "claude":
          response = await apiRequest("POST", "/api/ai/anthropic/chat", {
            prompt: promptCopy,
            model: "claude-3-7-sonnet-20250219",
            temperature: 0.7,
            maxTokens: 1000
          });
          
          if (!response.ok) throw new Error("Falha ao obter resposta do Claude");
          aiResponse = await response.json();
          
          // Adicionar resposta do Claude
          addAIResponse({
            content: aiResponse.content,
            model: "claude"
          });
          break;
          
        case "perplexity":
          response = await apiRequest("POST", "/api/ai/perplexity/search", {
            query: promptCopy,
            model: "llama-3.1-sonar-small-128k-online",
            temperature: 0.2,
            maxTokens: 1000,
            includeReferences: true
          });
          
          if (!response.ok) throw new Error("Falha ao obter resposta do Perplexity");
          aiResponse = await response.json();
          
          // Adicionar resposta do Perplexity com referências
          addAIResponse({
            content: aiResponse.content,
            model: "perplexity",
            references: aiResponse.references
          });
          break;
          
        case "image-gen":
          response = await apiRequest("POST", "/api/ai/openai/image", {
            prompt: promptCopy,
            size: "1024x1024",
            quality: "standard",
            n: 1
          });
          
          if (!response.ok) throw new Error("Falha ao gerar imagem");
          aiResponse = await response.json();
          
          if (aiResponse.images && aiResponse.images.length > 0) {
            // Adicionar resposta com a imagem gerada
            addAIResponse({
              content: "Imagem gerada com base no prompt fornecido.",
              model: "image-gen",
              imageUrl: aiResponse.images[0].url
            });
          } else {
            throw new Error("Nenhuma imagem foi gerada");
          }
          break;
      }
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar solicitação",
        variant: "destructive",
      });
      
      // Adicionar mensagem de erro como resposta do assistente
      addAIResponse({
        content: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.",
        model: currentModel
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Adicionar resposta da IA à conversa atual
  const addAIResponse = ({
    content,
    model,
    imageUrl,
    references
  }: {
    content: string;
    model: AIModel;
    imageUrl?: string;
    references?: string[];
  }) => {
    if (!currentConversation) return;
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      model,
      imageUrl,
      references
    };
    
    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, aiMessage],
      updatedAt: new Date()
    };
    
    setCurrentConversation(updatedConversation);
    setConversations(conversations.map(
      conv => conv.id === updatedConversation.id ? updatedConversation : conv
    ));
  };
  
  // Salvar item (imagem, prompt ou arquivo)
  const saveItem = (item: Omit<SavedItem, "id" | "createdAt">) => {
    const newItem: SavedItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    
    setSavedItems(prev => [newItem, ...prev]);
    
    toast({
      title: "Item salvo",
      description: `${item.title} foi salvo com sucesso.`,
    });
  };
  
  // Salvar prompt atual
  const saveCurrentPrompt = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Não é possível salvar um prompt vazio.",
        variant: "destructive",
      });
      return;
    }
    
    saveItem({
      type: "prompt",
      title: `Prompt ${new Date().toLocaleString("pt-BR", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      content: prompt
    });
  };
  
  // Salvar imagem da conversa
  const saveImage = (url: string) => {
    saveItem({
      type: "image",
      title: `Imagem ${new Date().toLocaleString("pt-BR", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      content: "Imagem gerada por IA",
      url
    });
  };
  
  // Renderizar mensagem individual
  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    const model = message.model || currentModel;
    const modelDetails = modelInfo[model];
    
    return (
      <div 
        key={message.id}
        className={`py-6 ${isUser ? "bg-neutral-50" : "bg-white"}`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 max-w-3xl mx-auto">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isUser ? (
                <Avatar>
                  <AvatarFallback className="bg-neutral-200">
                    <User className="h-5 w-5 text-neutral-600" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarFallback className={modelDetails.avatarColor}>
                    {modelDetails.icon}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            {/* Conteúdo */}
            <div className="flex-1 space-y-4">
              <div className="text-sm font-medium text-neutral-700">
                {isUser ? user?.firstName || "Você" : modelDetails.name}
              </div>
              
              <div className="prose prose-neutral">
                {message.content}
              </div>
              
              {/* Imagem (se houver) */}
              {message.imageUrl && (
                <div className="mt-4 relative group">
                  <img 
                    src={message.imageUrl} 
                    alt="Imagem gerada" 
                    className="max-w-full rounded-md border border-neutral-200"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="mr-2"
                      onClick={() => window.open(message.imageUrl, "_blank")}
                    >
                      <DownloadCloud className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => saveImage(message.imageUrl!)}
                    >
                      <Bookmark className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Referências (para Perplexity) */}
              {message.references && message.references.length > 0 && (
                <div className="mt-4 text-xs text-neutral-500">
                  <div className="font-medium mb-1">Fontes:</div>
                  <ul className="space-y-1">
                    {message.references.map((ref, idx) => (
                      <li key={idx}>
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
          </div>
        </div>
      </div>
    );
  };
  
  // Determinar qual interface mostrar com base no modelo atual
  const renderInterface = () => {
    if (!currentConversation) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            {modelInfo[currentModel].icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Bem-vindo à Central de IA
          </h2>
          <p className="text-neutral-600 max-w-md mb-6">
            Comece uma nova conversa com {modelInfo[currentModel].name} ou escolha outro modelo de IA para suas necessidades.
          </p>
          <Button onClick={createNewConversation}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </div>
      );
    }
    
    return (
      <>
        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto">
          {currentConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                {modelInfo[currentModel].icon}
              </div>
              <h2 className="text-xl font-bold mb-2">
                Conversa com {modelInfo[currentModel].name}
              </h2>
              <p className="text-neutral-600 max-w-md">
                Faça uma pergunta ou forneça um prompt para começar.
              </p>
            </div>
          ) : (
            currentConversation.messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  className="mr-2"
                  onClick={saveCurrentPrompt}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <textarea 
                    className="w-full border border-neutral-300 rounded-md py-3 px-4 pr-12 resize-none h-12 min-h-[48px] max-h-[200px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" 
                    placeholder={`Mensagem para ${modelInfo[currentModel].name}...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    rows={1}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={isLoading || !prompt.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Central de IA | IAverse</title>
      </Helmet>
      
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Sidebar (dispositivos grandes) */}
        <div className={`hidden md:block w-64 border-r border-neutral-200 h-full flex-shrink-0 ${isMenuOpen ? 'block' : ''}`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-neutral-200">
              <h1 className="text-lg font-semibold">Central de IA</h1>
            </div>
            
            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                onClick={createNewConversation}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            </div>
            
            {/* Conversation List */}
            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-2">
                {conversations.map(conv => (
                  <Button
                    key={conv.id}
                    variant={currentConversation?.id === conv.id ? "secondary" : "ghost"}
                    className="w-full justify-start overflow-hidden text-ellipsis whitespace-nowrap"
                    onClick={() => setCurrentConversation(conv)}
                  >
                    <MessagesSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            {/* Settings/Actions */}
            <div className="p-4 border-t border-neutral-200">
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Itens Salvos
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="h-16 border-b border-neutral-200 flex items-center justify-between px-4">
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <SheetHeader className="h-16 flex items-center px-4 border-b border-neutral-200">
                    <SheetTitle>Central de IA</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <Button 
                      onClick={() => {
                        createNewConversation();
                      }}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conversa
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 px-4 py-2 h-[calc(100vh-180px)]">
                    <div className="space-y-2">
                      {conversations.map(conv => (
                        <Button
                          key={conv.id}
                          variant={currentConversation?.id === conv.id ? "secondary" : "ghost"}
                          className="w-full justify-start overflow-hidden text-ellipsis whitespace-nowrap"
                          onClick={() => setCurrentConversation(conv)}
                        >
                          <MessagesSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{conv.title}</span>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-neutral-200">
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start">
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Itens Salvos
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* Model Selector */}
            <div className="flex-1 flex justify-center">
              <Tabs
                value={currentModel}
                onValueChange={(value) => handleModelChange(value as AIModel)}
                className="w-full max-w-lg"
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="chatgpt" className="flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 hidden sm:inline-block" />
                    <span>ChatGPT</span>
                  </TabsTrigger>
                  <TabsTrigger value="claude" className="flex items-center">
                    <Bot className="h-4 w-4 mr-2 hidden sm:inline-block" />
                    <span>Claude</span>
                  </TabsTrigger>
                  <TabsTrigger value="perplexity" className="flex items-center">
                    <Search className="h-4 w-4 mr-2 hidden sm:inline-block" />
                    <span>Perplexity</span>
                  </TabsTrigger>
                  <TabsTrigger value="image-gen" className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2 hidden sm:inline-block" />
                    <span>Imagens</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* User Info */}
            <div>
              <Button variant="ghost" size="icon" asChild>
                <Link href={user?.role === "teacher" ? "/professor/dashboard" : "/aluno/dashboard"}>
                  <X className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderInterface()}
          </div>
        </div>
      </div>
    </>
  );
}
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
  Home,
  ArrowLeft,
  FileText,
  Trash2,
  Calendar,
  Copy
} from "lucide-react";
import aiverseLogo from "@assets/Design sem nome (5).png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  const [showSavedItems, setShowSavedItems] = useState(false);
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

  // Salvar item (prompt, resposta ou imagem)
  const saveItemToCollection = (type: "image" | "prompt" | "file", title: string, content: string, url?: string) => {
    const newItem: SavedItem = {
      id: Date.now().toString(),
      type,
      title,
      content,
      url,
      createdAt: new Date()
    };
    
    setSavedItems(prev => [newItem, ...prev]);
    toast({
      title: "Item salvo!",
      description: "O item foi adicionado aos seus salvos.",
    });
  };

  // Remover item salvo
  const removeItem = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "O item foi removido dos seus salvos.",
    });
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
    
    saveItemToCollection("prompt", `Prompt ${new Date().toLocaleString("pt-BR", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`, prompt);
  };
  
  // Salvar imagem da conversa
  const saveImage = (url: string) => {
    saveItemToCollection("image", `Imagem ${new Date().toLocaleString("pt-BR", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })}`, "Imagem gerada por IA", url);
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
        <title>Central de IA | Aiverse</title>
      </Helmet>
      
      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Sidebar (dispositivos grandes) */}
        <div className={`hidden md:block w-72 bg-white border-r border-slate-200 shadow-sm h-full flex-shrink-0 ${isMenuOpen ? 'block' : ''}`}>
          <div className="flex flex-col h-full">
            {/* Header com Logo IAverse */}
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-blue-50">
              <Link href="/" className="flex items-center space-x-3">
                <img src={aiverseLogo} alt="Aiverse" className="w-12 h-12 object-contain" />
                <span className="text-xl font-bold text-gray-900">Aiverse</span>
              </Link>
              <div className="text-sm font-medium text-slate-600 bg-blue-100 px-3 py-1 rounded-full">
                Central de IA
              </div>
            </div>
            
            {/* Voltar à Página Principal */}
            <div className="px-6 py-4 border-b border-slate-100">
              <Link href="/professor/dashboard">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-11 border-slate-200 hover:bg-slate-50 hover:border-primary/20 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-medium">Página Principal</span>
                </Button>
              </Link>
            </div>
            
            {/* New Chat Button */}
            <div className="px-6 py-4">
              <Button 
                onClick={createNewConversation}
                className="w-full justify-start gap-3 h-12 bg-primary hover:bg-primary/90 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span className="font-medium">Nova Conversa</span>
              </Button>
            </div>
            
            {/* Conversation List */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-1 pb-4">
                <h3 className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Conversas Recentes
                </h3>
                {conversations.map(conv => (
                  <Button
                    key={conv.id}
                    variant={currentConversation?.id === conv.id ? "secondary" : "ghost"}
                    className={`w-full justify-start h-10 px-3 ${
                      currentConversation?.id === conv.id 
                        ? "bg-primary/10 text-primary border-primary/20 shadow-sm" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                    onClick={() => setCurrentConversation(conv)}
                  >
                    <MessagesSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate text-sm">{conv.title}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            {/* Itens Salvos */}
            <div className="px-6 py-4 border-t border-slate-100">
              <Button 
                onClick={() => setShowSavedItems(true)}
                variant="outline" 
                className="w-full justify-start gap-3 h-11 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 transition-all"
              >
                <Bookmark className="h-4 w-4" />
                <span className="font-medium">Itens Salvos ({savedItems.length})</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Moderno */}
          <div className="h-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
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
                  <div className="px-6 py-4 border-t border-slate-100">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 h-11 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 transition-all"
                    >
                      <Bookmark className="h-4 w-4" />
                      <span className="font-medium">Itens Salvos</span>
                    </Button>
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

      {/* Modal de Itens Salvos */}
      {showSavedItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] m-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">Itens Salvos</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSavedItems(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 h-full overflow-y-auto">
              {savedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bookmark className="h-16 w-16 text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">Nenhum item salvo</h3>
                  <p className="text-slate-500">
                    Comece a salvar prompts, imagens e arquivos durante suas conversas com as IAs.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {item.type === "image" && <ImageIcon className="h-4 w-4 text-orange-500" />}
                            {item.type === "prompt" && <FileText className="h-4 w-4 text-blue-500" />}
                            {item.type === "file" && <DownloadCloud className="h-4 w-4 text-green-500" />}
                            <span className="text-xs font-medium text-slate-500 uppercase">
                              {item.type === "image" ? "Imagem" : item.type === "prompt" ? "Prompt" : "Arquivo"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                          {item.title}
                        </h4>
                        
                        {item.type === "image" && item.url ? (
                          <div className="mb-3">
                            <img 
                              src={item.url} 
                              alt={item.title}
                              className="w-full h-32 object-cover rounded-md border"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                            {item.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.createdAt.toLocaleDateString("pt-BR")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(item.content);
                              toast({
                                title: "Copiado!",
                                description: "Conteúdo copiado para a área de transferência.",
                              });
                            }}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
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
      avatarColor: "bg-emerald-500",
      description: "Conversação avançada e análise de texto"
    },
    "claude": {
      name: "Claude",
      icon: <Bot className="h-5 w-5" />,
      avatarColor: "bg-purple-500",
      description: "Análise profunda e raciocínio complexo"
    },
    "perplexity": {
      name: "Perplexity",
      icon: <Search className="h-5 w-5" />,
      avatarColor: "bg-blue-500",
      description: "Pesquisa em tempo real com fontes"
    },
    "image-gen": {
      name: "Gerador de Imagens",
      icon: <ImageIcon className="h-5 w-5" />,
      avatarColor: "bg-orange-500",
      description: "Criação de imagens educacionais"
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
      // Simular resposta da IA
      setTimeout(() => {
        addAIResponse({
          content: `Esta é uma resposta simulada do ${modelInfo[currentModel].name} para: "${promptCopy}"`,
          model: currentModel
        });
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar solicitação",
        variant: "destructive",
      });
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
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Central de IA | AIverse</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        {/* Header Principal */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo e Nome */}
              <Link href="/" className="flex items-center space-x-3">
                <img src={aiverseLogo} alt="AIverse" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-xl font-bold text-gray-900">AIverse</span>
                  <div className="text-xs text-slate-500">Central de IA</div>
                </div>
              </Link>
              
              {/* Botão Voltar */}
              <Link href="/teacher-dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Seleção de IA - Cards em destaque */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Central de Inteligência Artificial</h1>
            <p className="text-slate-600 mb-8">Escolha a IA que melhor atende às suas necessidades educacionais</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Object.entries(modelInfo).map(([key, info]) => (
                <Card 
                  key={key}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                    currentModel === key 
                      ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleModelChange(key as AIModel)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${info.avatarColor}`}>
                      <div className="text-white text-2xl">
                        {info.icon}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-900 mb-2">{info.name}</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      {info.description}
                    </p>
                    {currentModel === key && (
                      <div className="mt-3 text-blue-600 font-medium text-sm">
                        ✓ Selecionado
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Layout da Conversa */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Painel Lateral - Conversas e Salvos */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Controles de Conversa */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <Button 
                  onClick={createNewConversation}
                  className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conversa
                </Button>
                
                <Button 
                  onClick={() => setShowSavedItems(!showSavedItems)}
                  variant="outline"
                  className="w-full"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Itens Salvos ({savedItems.length})
                </Button>
              </div>

              {/* Lista de Conversas */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Conversas Recentes</h3>
                <ScrollArea className="h-64">
                  {conversations.length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhuma conversa ainda</p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            currentConversation?.id === conv.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setCurrentConversation(conv)}
                        >
                          <div className="font-medium text-sm text-slate-900 truncate">
                            {conv.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {modelInfo[conv.model].name} • {conv.messages.length} mensagens
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Área Principal da Conversa */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 h-[600px] flex flex-col">
                
                {/* Header da conversa */}
                {currentConversation && (
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">{currentConversation.title}</h3>
                        <p className="text-sm text-slate-500">
                          Conversando com {modelInfo[currentModel].name}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${modelInfo[currentModel].avatarColor}`}>
                        <div className="text-white">
                          {modelInfo[currentModel].icon}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Área de mensagens */}
                <div className="flex-1 overflow-y-auto">
                  {!currentConversation ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                        {modelInfo[currentModel].icon}
                      </div>
                      <h2 className="text-xl font-bold mb-2">
                        Bem-vindo à Central de IA
                      </h2>
                      <p className="text-slate-600 max-w-md mb-6">
                        Comece uma nova conversa com {modelInfo[currentModel].name} ou escolha outro modelo de IA.
                      </p>
                      <Button onClick={createNewConversation}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Conversa
                      </Button>
                    </div>
                  ) : currentConversation.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                        {modelInfo[currentModel].icon}
                      </div>
                      <h2 className="text-xl font-bold mb-2">
                        Conversa com {modelInfo[currentModel].name}
                      </h2>
                      <p className="text-slate-600 max-w-md">
                        Faça uma pergunta ou forneça um prompt para começar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {currentConversation.messages.map(renderMessage)}
                      {isLoading && (
                        <div className="py-6 bg-white">
                          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-start gap-4 max-w-3xl mx-auto">
                              <Avatar>
                                <AvatarFallback className={modelInfo[currentModel].avatarColor}>
                                  {modelInfo[currentModel].icon}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-neutral-700 mb-2">
                                  {modelInfo[currentModel].name}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm text-slate-500">Pensando...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input de mensagem */}
                {currentConversation && (
                  <div className="p-6 border-t border-slate-200">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                      <div className="flex-1">
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={`Digite sua mensagem para ${modelInfo[currentModel].name}...`}
                          className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          disabled={isLoading}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={!prompt.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 self-end"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
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
      icon: <Sparkles className="h-6 w-6" />,
      avatarColor: "bg-gradient-to-br from-green-400 to-emerald-500",
      cardColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200",
      hoverColor: "hover:border-green-400",
      description: "Conversação avançada e análise de texto",
      route: "/central-ia/chatgpt"
    },
    "claude": {
      name: "Claude",
      icon: <Bot className="h-6 w-6" />,
      avatarColor: "bg-gradient-to-br from-purple-400 to-violet-500",
      cardColor: "from-purple-50 to-violet-50",
      borderColor: "border-purple-200",
      hoverColor: "hover:border-purple-400",
      description: "Análise profunda e raciocínio complexo",
      route: "/central-ia/claude"
    },
    "perplexity": {
      name: "Perplexity",
      icon: <Search className="h-6 w-6" />,
      avatarColor: "bg-gradient-to-br from-blue-400 to-indigo-500",
      cardColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:border-blue-400",
      description: "Pesquisa em tempo real com fontes",
      route: "/central-ia/perplexity"
    },
    "image-gen": {
      name: "Gerador de Imagens",
      icon: <ImageIcon className="h-6 w-6" />,
      avatarColor: "bg-gradient-to-br from-orange-400 to-amber-500",
      cardColor: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200",
      hoverColor: "hover:border-orange-400",
      description: "Criação de imagens educacionais",
      route: "/central-ia/image-gen"
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

  // Navegar para a IA selecionada
  const handleAISelection = (model: AIModel) => {
    // Redirecionar para a interface específica da IA
    window.location.href = modelInfo[model].route;
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header da Central */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Central de Inteligência Artificial</h1>
            <p className="text-xl text-slate-600 mb-2">Escolha a IA que melhor atende às suas necessidades educacionais</p>
            <p className="text-sm text-slate-500">Clique em uma das opções abaixo para começar</p>
          </div>
          
          {/* Cards das IAs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(modelInfo).map(([key, info]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 ${info.borderColor} ${info.hoverColor} bg-gradient-to-br ${info.cardColor}`}
                onClick={() => handleAISelection(key as AIModel)}
              >
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center ${info.avatarColor} shadow-lg`}>
                    <div className="text-white">
                      {info.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-3">{info.name}</h3>
                  <p className="text-sm text-slate-700 mb-6 leading-relaxed">
                    {info.description}
                  </p>
                  <div className="flex items-center justify-center text-blue-600 font-medium">
                    <span>Começar conversa</span>
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informações adicionais */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Como usar a Central de IA</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Escolha sua IA</h3>
                    <p className="text-sm text-slate-600">Selecione a inteligência artificial que melhor se adequa à sua tarefa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Digite sua pergunta</h3>
                    <p className="text-sm text-slate-600">Faça perguntas, peça análises ou solicite criação de conteúdo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Anexe arquivos</h3>
                    <p className="text-sm text-slate-600">Adicione documentos, imagens ou outros materiais para análise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
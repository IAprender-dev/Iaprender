import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Image as ImageIcon, 
  Plus, 
  Send, 
  Loader2,
  ArrowLeft,
  Download,
  Bookmark,
  Copy
} from "lucide-react";
import iaprenderLogo from "@assets/IAprender_1750262377399.png";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ImageGenPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Define user role and appropriate dashboard route
  const userRole = user?.role;
  const getDashboardRoute = () => {
    switch (userRole) {
      case 'teacher':
        return '/professor';
      case 'student':
        return '/student/dashboard';
      case 'admin':
        return '/professor';
      default:
        return '/student/dashboard';
    }
  };

  // Garantir que a página sempre inicie no topo
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation: Conversation = {
      id: newId,
      title: `Imagens - ${new Date().toLocaleString("pt-BR", { 
        month: "short", 
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    if (!currentConversation) {
      createNewConversation();
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      timestamp: new Date()
    };
    
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
      // Simular geração de imagem
      setTimeout(() => {
        // Usando uma imagem placeholder para demonstração
        const mockImageUrl = "https://picsum.photos/512/512?random=" + Date.now();
        addAIResponse(
          `Imagem gerada com base no prompt: "${promptCopy}"`,
          mockImageUrl
        );
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar imagem",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  const addAIResponse = (content: string, imageUrl?: string) => {
    if (!currentConversation) return;
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      imageUrl
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

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado",
      description: "A imagem está sendo baixada.",
    });
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Prompt copiado",
      description: "O prompt foi copiado para a área de transferência.",
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    
    return (
      <div 
        key={message.id}
        className={`py-6 ${isUser ? "bg-slate-50" : "bg-white"}`}
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {isUser ? (
                <Avatar>
                  <AvatarFallback className="bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500">
                    <ImageIcon className="h-5 w-5 text-white" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="text-sm font-medium text-slate-700">
                {isUser ? user?.firstName || "Você" : "Gerador de Imagens"}
              </div>
              
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.imageUrl && (
                <Card className="overflow-hidden max-w-lg">
                  <CardContent className="p-0">
                    <div className="relative group">
                      <img 
                        src={message.imageUrl} 
                        alt="Imagem gerada" 
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="bg-white hover:bg-gray-100"
                            onClick={() => downloadImage(message.imageUrl!, `imagem-${message.id}.png`)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Baixar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="bg-white hover:bg-gray-100"
                            onClick={() => copyPrompt(message.content)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copiar Prompt
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Gerador de Imagens | IAprender</title>
      </Helmet>
      
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <Link href="/central-ia">
              <Button className="gap-3 h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl mb-4">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">Gerador de Imagens</h1>
                <p className="text-sm text-slate-600">Criação visual</p>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button 
              onClick={createNewConversation}
              className="w-full justify-start gap-3 bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Nova criação
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4">
              {conversations.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Nenhuma criação ainda</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversation?.id === conv.id
                          ? 'bg-orange-100 border border-orange-200'
                          : 'hover:bg-slate-100'
                      }`}
                      onClick={() => setCurrentConversation(conv)}
                    >
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {conv.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {conv.messages.filter(m => m.imageUrl).length} imagens geradas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={iaprenderLogo} alt="IAprender" className="w-8 h-8 object-contain" />
                <div>
                  <h2 className="font-semibold text-slate-900">IAprender Gerador de Imagens</h2>
                  <p className="text-sm text-slate-600">
                    {currentConversation ? 'Criando...' : 'Pronto para criar'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {!currentConversation ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6">
                  <ImageIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Bem-vindo ao Gerador de Imagens
                </h2>
                <p className="text-slate-600 max-w-md mb-6">
                  Descreva o que você quer criar e transforme suas ideias em imagens educacionais.
                </p>
                <Button onClick={createNewConversation} size="lg" className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Começar a criar
                </Button>
              </div>
            ) : currentConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  O que você gostaria de criar?
                </h2>
                <p className="text-slate-600 max-w-md mb-4">
                  Descreva detalhadamente a imagem que você deseja gerar.
                </p>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg max-w-md">
                  <strong>Dica:</strong> Seja específico sobre estilo, cores, composição e elementos que deseja incluir.
                </div>
              </div>
            ) : (
              <div>
                {currentConversation.messages.map(renderMessage)}
                {isLoading && (
                  <div className="py-6 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500">
                            <ImageIcon className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700 mb-2">Gerador de Imagens</div>
                          <div className="flex items-center gap-2 mb-4">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                            <span className="text-sm text-slate-500">Gerando imagem...</span>
                          </div>
                          <div className="w-64 h-64 bg-slate-100 rounded-lg animate-pulse flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-slate-400" />
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

          {/* Input Area */}
          {currentConversation && (
            <div className="p-6 border-t border-slate-200 bg-white">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="flex-1">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Descreva a imagem que você quer criar..."
                    className="w-full p-4 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!prompt.trim() || isLoading}
                  className="bg-orange-600 hover:bg-orange-700 px-6 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
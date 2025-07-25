import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Bot, 
  Sparkles, 
  Plus, 
  Send, 
  Loader2,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import iaprenderLogo from "@assets/IAprender_1750262377399.png";
import chatgptLogo from "@assets/chatgpt-logo.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: File[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ChatGPTPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      title: `ChatGPT - ${new Date().toLocaleString("pt-BR", { 
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!prompt.trim() && attachedFiles.length === 0) || isLoading) return;
    
    if (!currentConversation) {
      createNewConversation();
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt || "Arquivo(s) anexado(s)",
      timestamp: new Date(),
      attachments: attachedFiles
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
    setAttachedFiles([]);
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/ai/openai/chat", {
        prompt: promptCopy,
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 1000
      });
      
      if (!response.ok) throw new Error("Falha ao obter resposta do ChatGPT");
      const aiResponse = await response.json();
      
      addAIResponse(aiResponse.content);
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar solicitação",
        variant: "destructive",
      });
      
      addAIResponse("Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const addAIResponse = (content: string) => {
    if (!currentConversation) return;
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content,
      timestamp: new Date()
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
                  <AvatarFallback className="bg-green-100 text-green-600 font-semibold">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain rounded-full" />
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium text-slate-700">
                {isUser ? user?.firstName || "Você" : "ChatGPT"}
              </div>
              
              <div className="prose prose-slate max-w-none">
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              </div>

              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-slate-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-600" />
                      )}
                      <span className="text-slate-700">{file.name}</span>
                    </div>
                  ))}
                </div>
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
        <title>ChatGPT | IAprender</title>
      </Helmet>
      
      <div className="flex h-screen bg-white">
        {/* Sidebar */}
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="mb-4">
              <BackButton href="/central-ia" label="Voltar" />
            </div>
            
            <div className="flex items-center gap-3">
              <img src={chatgptLogo} alt="ChatGPT" className="w-10 h-10 object-contain rounded-lg" />
              <div>
                <h1 className="font-semibold text-slate-900">ChatGPT</h1>
                <p className="text-sm text-slate-600">Conversação avançada</p>
              </div>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button 
              onClick={createNewConversation}
              className="w-full justify-start gap-3 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4">
              {conversations.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Nenhuma conversa ainda</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversation?.id === conv.id
                          ? 'bg-green-100 border border-green-200'
                          : 'hover:bg-slate-100'
                      }`}
                      onClick={() => setCurrentConversation(conv)}
                    >
                      <div className="font-medium text-sm text-slate-900 truncate">
                        {conv.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {conv.messages.length} mensagens
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
                  <h2 className="font-semibold text-slate-900">IAprender ChatGPT</h2>
                  <p className="text-sm text-slate-600">
                    {currentConversation ? 'Conversando...' : 'Pronto para conversar'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {!currentConversation ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <img src={chatgptLogo} alt="ChatGPT" className="w-20 h-20 object-contain rounded-2xl mb-6" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Bem-vindo ao ChatGPT
                </h2>
                <p className="text-slate-600 max-w-md mb-6">
                  Comece uma nova conversa para fazer perguntas, solicitar análises ou criar conteúdo educacional.
                </p>
                <Button onClick={createNewConversation} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Iniciar conversa
                </Button>
              </div>
            ) : currentConversation.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <img src={chatgptLogo} alt="ChatGPT" className="w-16 h-16 object-contain rounded-2xl mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  O que posso ajudar você hoje?
                </h2>
                <p className="text-slate-600 max-w-md">
                  Digite uma mensagem abaixo ou anexe um arquivo para começar nossa conversa.
                </p>
              </div>
            ) : (
              <div>
                {currentConversation.messages.map(renderMessage)}
                {isLoading && (
                  <div className="py-6 bg-white">
                    <div className="max-w-4xl mx-auto px-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500">
                            <Sparkles className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-700 mb-2">ChatGPT</div>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
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

          {/* Input Area */}
          {currentConversation && (
            <div className="p-6 border-t border-slate-200 bg-white">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Attached Files */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 text-sm">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-slate-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-slate-600" />
                        )}
                        <span className="text-slate-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(index)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Digite sua mensagem para o ChatGPT..."
                      className="w-full p-4 pr-12 border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={1}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={(!prompt.trim() && attachedFiles.length === 0) || isLoading}
                    className="bg-green-600 hover:bg-green-700 px-6"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
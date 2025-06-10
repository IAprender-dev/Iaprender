import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Bot, User, ArrowLeft, MessageSquare, Clock, Sparkles, Brain, HelpCircle, Target, History, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AITutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationTime, setConversationTime] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conversation timer
  useEffect(() => {
    conversationTimerRef.current = setInterval(() => {
      setConversationTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
      }
    };
  }, []);

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Olá, ${user?.firstName || 'estudante'}! 👋\n\nSou o Tutor IA, seu assistente educacional especializado. Estou aqui para te ajudar com suas matérias escolares de forma didática e personalizada.\n\n**Como posso te ajudar hoje?**\n• Explicar conceitos difíceis de forma simples\n• Resolver exercícios passo a passo\n• Tirar dúvidas sobre qualquer matéria\n• Criar resumos e mapas mentais\n\nDigite sua dúvida ou escolha uma das sugestões abaixo! 📚✨`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  // AI tutor conversation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-10),
        studentName: user?.firstName || 'Estudante',
        context: 'educational_text_tutor',
        grade: '9º ano'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Erro na conversa",
        description: "Não consegui processar sua pergunta. Tente novamente.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleUserMessage(inputMessage.trim());
    }
  };

  const handleUserMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    chatMutation.mutate(message);
  };

  const handleQuickQuestion = (question: string) => {
    handleUserMessage(question);
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `Conversa reiniciada! 🔄\n\nEstou pronto para uma nova sessão de estudos. Qual é sua dúvida hoje?`,
      timestamp: new Date()
    }]);
    setConversationTime(0);
  };

  // Format conversation time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced typing animation
  const TypingIndicator = () => (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
        <Bot className="w-5 h-5" />
      </div>
      <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-lg shadow-sm max-w-xs">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Preparando explicação didática...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Tutor IA - Assistente Educacional - AIverse</title>
      </Helmet>
      
      {/* Enhanced Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/aluno/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <img src={aiverseLogo} alt="AIverse" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tutor IA</h1>
                <p className="text-sm text-gray-500">Assistente educacional inteligente</p>
              </div>
            </div>
            
            {/* Session Stats & Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span>{formatTime(conversationTime)}</span>
              </div>
              
              <Button
                onClick={clearConversation}
                variant="outline"
                size="sm"
                className="bg-white/50 hover:bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Nova conversa
              </Button>
              
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white">
                    <History className="w-4 h-4 mr-2" />
                    Histórico ({messages.filter(m => m.role === 'user').length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Histórico da Conversa Educacional</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div key={message.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                                {message.role === 'user' ? 'Você' : 'Tutor IA'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString('pt-BR')}
                              </span>
                            </div>
                          </div>
                          <div className="ml-11 prose prose-sm max-w-none">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-xl bg-white/80 backdrop-blur-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>Conversa com o Tutor IA</span>
              <Badge variant="secondary" className="ml-auto">
                {messages.filter(m => m.role === 'user').length} perguntas feitas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Chat Messages */}
            <ScrollArea className="h-[600px] p-6">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start space-x-4 ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                    }`}>
                      {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-4 rounded-lg shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap m-0">{message.content}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Enhanced Input Area */}
            <div className="p-6 border-t bg-gray-50/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <Textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Digite sua dúvida ou pergunta sobre estudos... (Pressione Ctrl+Enter para enviar)"
                      disabled={isTyping}
                      className="min-h-[80px] text-base resize-none bg-white border-2 border-gray-200 focus:border-blue-400 rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        Pressione Ctrl+Enter para enviar rapidamente
                      </div>
                      <div className="text-xs text-gray-500">
                        {inputMessage.length}/500 caracteres
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button 
                      type="submit" 
                      disabled={!inputMessage.trim() || isTyping}
                      className="h-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isTyping ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Quick Questions */}
                {messages.length <= 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleQuickQuestion("Como posso melhorar minhas notas?")}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 bg-white hover:bg-blue-50"
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Como melhorar minhas notas?</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleQuickQuestion("Qual a melhor forma de estudar?")}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 bg-white hover:bg-green-50"
                    >
                      <Brain className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm">Como estudar de forma eficaz?</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleQuickQuestion("Me ajude a organizar meus estudos")}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 bg-white hover:bg-purple-50"
                    >
                      <Target className="w-4 h-4 mr-2 text-purple-500" />
                      <span className="text-sm">Organizar cronograma</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleQuickQuestion("Como me preparar para provas?")}
                      variant="outline"
                      size="sm"
                      className="justify-start h-auto p-3 bg-white hover:bg-orange-50"
                    >
                      <HelpCircle className="w-4 h-4 mr-2 text-orange-500" />
                      <span className="text-sm">Preparação para provas</span>
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
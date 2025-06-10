import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, BookOpen, Lightbulb, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_TOPICS = [
  "Matemática do 9º ano",
  "Português - verbos",
  "História do Brasil",
  "Ciências - fotossíntese",
  "Geografia - relevo",
  "Física - movimento",
  "Química - átomos",
  "Inglês - present tense"
];

export default function AITutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Olá ${user?.firstName || 'estudante'}! 👋 Sou sua tutora de IA especializada em educação. Estou aqui para ajudar você com suas dúvidas sobre as matérias do seu ano escolar.\n\nPosso te ajudar com:\n• Explicações detalhadas sobre conceitos\n• Resolução de exercícios passo a passo\n• Dicas de estudo e memorização\n• Esclarecimento de dúvidas específicas\n\nSobre que matéria gostaria de conversar hoje?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        studentGrade: user?.schoolYear || '9º ano', // Default grade if not available
        chatHistory: messages.slice(-10) // Send last 10 messages for context
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na conversa",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedTopic = (topic: string) => {
    setInputMessage(`Me explique sobre ${topic}`);
  };

  return (
    <>
      <Helmet>
        <title>Tutor IA - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-purple-100 p-4 sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/aluno/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img src={aiverseLogo} alt="AIverse" className="h-8 w-8" />
                <div>
                  <h1 className="font-bold text-slate-800">Tutor IA</h1>
                  <p className="text-xs text-slate-600">Tutoria personalizada</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Bot className="h-3 w-3" />
              Online
            </Badge>
          </div>
        </div>

        <div className="container mx-auto p-4 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
            {/* Sidebar with suggestions */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Temas Sugeridos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SUGGESTED_TOPICS.map((topic, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handleSuggestedTopic(topic)}
                    >
                      <BookOpen className="h-3 w-3 mr-2" />
                      {topic}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main chat area */}
            <div className="lg:col-span-3">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg h-full flex flex-col">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Bot className="h-5 w-5 text-purple-500" />
                    Conversa com a Tutora IA
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages area */}
                  <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <p className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-purple-100' : 'text-slate-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-slate-600" />
                            </div>
                          )}
                        </div>
                      ))}
                      {chatMutation.isPending && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="bg-slate-100 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                              <span className="text-sm text-slate-600">Pensando...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input area */}
                  <div className="border-t border-slate-100 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Digite sua dúvida sobre as matérias escolares..."
                        className="flex-1"
                        disabled={chatMutation.isPending}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || chatMutation.isPending}
                        className="px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
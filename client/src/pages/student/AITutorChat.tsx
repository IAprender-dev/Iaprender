import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, BookOpen, Lightbulb, ArrowLeft, Mic, MicOff, Volume2, FileText, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Audio transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Falha na transcrição');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setInputMessage(data.text);
      toast({
        title: "Áudio transcrito",
        description: "Sua mensagem foi convertida para texto.",
      });
    },
    onError: () => {
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        studentGrade: (user as any)?.schoolYear || '9º ano', // Default grade if not available
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
      
      // Generate speech for the response
      generateSpeech(data.response);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na conversa",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Document generation mutation
  const generateDocumentMutation = useMutation({
    mutationFn: async (selectedMessageIds: string[]) => {
      const selectedMsgs = messages.filter(msg => selectedMessageIds.includes(msg.id));
      
      const response = await apiRequest('POST', '/api/ai/generate-document', {
        messages: selectedMsgs,
        studentName: `${user?.firstName} ${user?.lastName}`,
        studentGrade: user?.schoolYear || '9º ano'
      });
      
      return await response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material-estudo-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Documento gerado",
        description: "Seu material de estudo foi baixado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar o documento. Tente novamente.",
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        transcribeMutation.mutate(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Text-to-speech function
  const generateSpeech = (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // Message selection functions
  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);
  };

  const generateDocument = () => {
    if (selectedMessages.size === 0) {
      toast({
        title: "Nenhuma mensagem selecionada",
        description: "Selecione ao menos uma mensagem para gerar o documento.",
        variant: "destructive",
      });
      return;
    }
    
    generateDocumentMutation.mutate(Array.from(selectedMessages));
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
            {/* Sidebar with suggestions and controls */}
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

              {/* Voice Controls */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Controles de Voz
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribeMutation.isPending}
                    className={`w-full ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    {transcribeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Mic className="h-4 w-4 mr-2" />
                    )}
                    {transcribeMutation.isPending ? 'Transcrevendo...' : isRecording ? 'Parar Gravação' : 'Gravar Voz'}
                  </Button>
                  
                  <Button
                    onClick={isPlaying ? stopSpeech : () => {}}
                    disabled={!isPlaying}
                    variant="outline"
                    className="w-full"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {isPlaying ? 'Pausar Áudio' : 'Aguardando...'}
                  </Button>
                </CardContent>
              </Card>

              {/* Document Generation */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gerar Material
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-600 mb-2">
                    {selectedMessages.size} mensagem(ns) selecionada(s)
                  </div>
                  <Button
                    onClick={generateDocument}
                    disabled={selectedMessages.size === 0 || generateDocumentMutation.isPending}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    {generateDocumentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar PDF
                  </Button>
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
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-purple-600" />
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedMessages.has(message.id)}
                                onChange={() => toggleMessageSelection(message.id)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                            </div>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                                : selectedMessages.has(message.id)
                                  ? 'bg-purple-50 border-2 border-purple-200 text-slate-800'
                                  : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs ${
                                message.role === 'user' ? 'text-purple-100' : 'text-slate-500'
                              }`}>
                                {message.timestamp.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              {message.role === 'assistant' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => generateSpeech(message.content)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Volume2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {message.role === 'user' && (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 text-slate-600" />
                              </div>
                              <input
                                type="checkbox"
                                checked={selectedMessages.has(message.id)}
                                onChange={() => toggleMessageSelection(message.id)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
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
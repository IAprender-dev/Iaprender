import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, ArrowLeft, BookOpen, Brain, Heart, Star, Volume2, Presentation, Lightbulb, Target, MapPin, Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';
type MessageType = 'user' | 'assistant';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  format: 'text' | 'audio';
}

interface ChalkboardContent {
  id: string;
  type: 'example' | 'concept' | 'formula' | 'mindmap' | 'important' | 'summary';
  title: string;
  content: string;
  timestamp: Date;
  subject?: string;
}

export default function VoiceTutorTeacher() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [chalkboardContent, setChalkboardContent] = useState<ChalkboardContent[]>([]);
  const [showChalkboard, setShowChalkboard] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  const addMessage = (type: MessageType, content: string, format: 'text' | 'audio') => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      format
    };
    setMessages(prev => [...prev, message]);
    
    // Analyze AI response for chalkboard content
    if (type === 'assistant' && format === 'text') {
      analyzeForChalkboardContent(content);
    }
  };

  const addChalkboardContent = (type: ChalkboardContent['type'], title: string, content: string, subject?: string) => {
    const chalkboardItem: ChalkboardContent = {
      id: Date.now().toString(),
      type,
      title,
      content,
      timestamp: new Date(),
      subject
    };
    // Replace previous content with new content (only one item at a time)
    setChalkboardContent([chalkboardItem]);
  };

  const analyzeForChalkboardContent = (content: string) => {
    // Enhanced extraction for LOUSA format from ProVersa
    const lousaPattern = /\[LOUSA\]\s*Título:\s*([^\n]+)\n([\s\S]*?)\[\/LOUSA\]/gi;
    const lousaMatches = content.match(lousaPattern);
    
    if (lousaMatches) {
      lousaMatches.forEach(match => {
        const titleMatch = match.match(/Título:\s*([^\n]+)/i);
        const contentMatch = match.match(/Título:[^\n]+\n([\s\S]*?)\[\/LOUSA\]/i);
        
        if (titleMatch && contentMatch) {
          const title = titleMatch[1].trim();
          let lousaContent = contentMatch[1].trim();
          
          // Remove square brackets from content display
          lousaContent = lousaContent.replace(/^\[|\]$/g, '').trim();
          
          // Organize content by type based on keywords
          if (lousaContent.includes('Fórmula') || lousaContent.includes('=') || lousaContent.includes('→')) {
            addChalkboardContent('formula', title, lousaContent);
          } else if (lousaContent.includes('Exemplo') || lousaContent.includes('Por exemplo')) {
            addChalkboardContent('example', title, lousaContent);
          } else if (lousaContent.includes('Importante') || lousaContent.includes('Lembre-se')) {
            addChalkboardContent('important', title, lousaContent);
          } else if (lousaContent.includes('Resumo') || lousaContent.includes('Síntese')) {
            addChalkboardContent('summary', title, lousaContent);
          } else if (lousaContent.includes('Mapa') || lousaContent.includes('Etapas') || lousaContent.includes('Passos')) {
            addChalkboardContent('mindmap', title, lousaContent);
          } else {
            addChalkboardContent('concept', title, lousaContent);
          }
        }
      });
      return; // If LOUSA format found, use it exclusively
    }
    
    // Fallback patterns for content without LOUSA format
    const conceptPatterns = [
      /([A-ZÁÊÔÃÇÕ][^.!?]*(?:é|são|significa|define-se como|consiste em|refere-se a)[^.!?]*[.!?])/gi,
      /(?:conceito|definição)[:\-]?\s*([^.!?]*[.!?])/gi,
      /([^.!?]*processo[^.!?]*[.!?])/gi
    ];
    
    conceptPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 20 && cleanMatch.length < 200) {
            addChalkboardContent('concept', 'Conceito Principal', cleanMatch);
          }
        });
      }
    });
    
    // Extract examples
    const examplePatterns = [
      /(?:exemplo|por exemplo|como exemplo|vamos ver)[:\-]?\s*([^.!?]*[.!?])/gi,
      /(?:imagine|considere|vamos pensar)[^.!?]*([^.!?]*[.!?])/gi
    ];
    
    examplePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 15 && cleanMatch.length < 150) {
            addChalkboardContent('example', 'Exemplo Prático', cleanMatch);
          }
        });
      }
    });
    
    // Extract formulas and equations
    const formulaPatterns = [
      /([^.!?]*[=+\-×÷][^.!?]*)/g,
      /(?:fórmula|equação)[:\-]?\s*([^.!?]*[.!?])/gi,
      /([A-Z]+[₀-₉]*\s*[+\-=]\s*[A-Z₀-₉\s+\-→]+)/g
    ];
    
    formulaPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.includes('=') || cleanMatch.includes('→') || cleanMatch.includes('fórmula')) {
            addChalkboardContent('formula', 'Fórmula', cleanMatch);
          }
        });
      }
    });
    
    // Extract important points
    const importantPatterns = [
      /(?:importante|fundamental|essencial|crucial|lembre-se|atenção)[:\-]?\s*([^.!?]*[.!?])/gi,
      /(?:não esqueça|é vital|é necessário)[^.!?]*([^.!?]*[.!?])/gi
    ];
    
    importantPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 10 && cleanMatch.length < 120) {
            addChalkboardContent('important', 'Ponto Importante', cleanMatch);
          }
        });
      }
    });
    
    // Extract summaries and conclusions
    const summaryPatterns = [
      /(?:resumindo|em resumo|concluindo|portanto)[:\-]?\s*([^.!?]*[.!?])/gi,
      /(?:principais pontos|pontos principais)[:\-]?\s*([^.!?]*[.!?])/gi
    ];
    
    summaryPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.trim();
          if (cleanMatch.length > 15 && cleanMatch.length < 180) {
            addChalkboardContent('summary', 'Resumo', cleanMatch);
          }
        });
      }
    });
    
    // Extract mind map elements (steps, processes, lists)
    const mindmapPatterns = [
      /(?:primeiro|segundo|terceiro|quarto|quinto)[:\-]?\s*([^.!?]*[.!?])/gi,
      /(?:etapas?|passos?|fases?)[:\-]?\s*([^.!?]*[.!?])/gi,
      /\d+[°º\.\)]\s*([^.!?]*[.!?])/g
    ];
    
    mindmapPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length >= 2) {
        const steps = matches.map(match => match.trim()).join('\n');
        addChalkboardContent('mindmap', 'Mapa Mental', steps);
      }
    });
  };

  const connectToRealtime = useCallback(async () => {
    try {
      setConnectionState('connecting');
      console.log('Conectando à Pro Versa...');
      
      // Verificar permissões de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Microfone autorizado');
      streamRef.current = stream;
      
      // Conectar com timeout para demonstração
      setTimeout(() => {
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('listening');
        
        toast({
          title: "Pro Versa conectada!",
          description: "Pronta para conversar! Use o microfone ou digite no chat.",
          variant: "default",
        });
        
        // Adicionar mensagem de boas-vindas
        addMessage('assistant', 'Olá! Eu sou a Pro Versa, sua tutora virtual. Estou aqui para te ajudar com seus estudos. O que gostaria de aprender hoje?', 'text');
        
        // Simular análise para a lousa
        setTimeout(() => {
          addChalkboardContent('concept', 'Bem-vindo à Pro Versa!', '• Sistema de tutoria virtual inteligente\n• Responde dúvidas sobre qualquer matéria\n• Adapta explicações ao seu nível\n• Usa metodologias de ensino modernas\n\nO que gostaria de estudar?');
        }, 1000);
        
      }, 2000);
      
    } catch (error) {
      console.error('Erro de conexão:', error);
      setConnectionState('error');
      
      let errorMessage = "Não foi possível conectar com a Pro Versa.";
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          errorMessage = "Permissão de microfone necessária. Autorize o acesso ao microfone para conversar por voz.";
        }
      }
      
      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !isConnected || isProcessing) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsProcessing(true);
    
    // Adicionar mensagem do usuário
    addMessage('user', userMessage, 'text');
    
    try {
      // Chamar API do tutor
      const response = await apiRequest('/api/ai/tutor-chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          context: 'Pro Versa - Tutora educacional especializada em BNCC'
        })
      });

      if (response.response) {
        addMessage('assistant', response.response, 'text');
        
        // Analisar se há conteúdo para a lousa
        analyzeForChalkboardContent(response.response);
      }
    } catch (error) {
      console.error('Erro no chat:', error);
      addMessage('assistant', 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.', 'text');
      
      toast({
        title: "Erro no chat",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [chatInput, isConnected, isProcessing, toast, addMessage, analyzeForChalkboardContent]);

  const handleRealtimeMessage = (message: any) => {
    console.log('Received message:', message.type);
    
    switch (message.type) {
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript && message.transcript.trim()) {
          setCurrentTranscript('');
          addMessage('user', message.transcript, 'text');
        }
        break;
        
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + (message.delta || ''));
        break;
        
      case 'response.audio_transcript.done':
        if (message.transcript && message.transcript.trim()) {
          addMessage('assistant', message.transcript, 'text');
          setCurrentTranscript('');
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        setConversationState('listening');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setConversationState('thinking');
        break;
        
      case 'response.created':
        setConversationState('thinking');
        break;
        
      case 'response.audio.done':
        setConversationState('listening');
        break;
        
      case 'error':
        console.error('Realtime API error:', message);
        toast({
          title: "Erro na conversa",
          description: message.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
        break;
    }
  };

  const disconnect = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    setCurrentTranscript('');
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getChalkboardIcon = (type: ChalkboardContent['type']) => {
    switch (type) {
      case 'example':
        return <Lightbulb className="h-4 w-4" />;
      case 'formula':
        return <Target className="h-4 w-4" />;
      case 'concept':
        return <BookOpen className="h-4 w-4" />;
      case 'important':
        return <Star className="h-4 w-4" />;
      case 'mindmap':
        return <MapPin className="h-4 w-4" />;
      case 'summary':
        return <Brain className="h-4 w-4" />;
      default:
        return <Presentation className="h-4 w-4" />;
    }
  };

  const getChalkboardColor = (type: ChalkboardContent['type']) => {
    switch (type) {
      case 'example':
        return 'border-yellow-400 bg-yellow-50';
      case 'formula':
        return 'border-blue-400 bg-blue-50';
      case 'concept':
        return 'border-purple-400 bg-purple-50';
      case 'important':
        return 'border-red-400 bg-red-50';
      case 'mindmap':
        return 'border-green-400 bg-green-50';
      case 'summary':
        return 'border-indigo-400 bg-indigo-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  const clearChalkboard = () => {
    setChalkboardContent([]);
  };

  // Test function to simulate AI response and demonstrate chalkboard functionality
  const testChalkboardExtraction = () => {
    const testResponse = `Vamos estudar fotossíntese! É um processo fascinante onde as plantas transformam luz solar em energia. Imagine uma folha como uma pequena fábrica solar que produz seu próprio alimento...

[LOUSA] Título: Fotossíntese
[• Processo de produção de energia nas plantas
• Ingredientes: CO₂ + H₂O + luz solar
• Produto: glicose + oxigênio
• Fórmula: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂] [/LOUSA]`;
    
    addMessage('assistant', testResponse, 'text');
    
    toast({
      title: "Teste da Lousa",
      description: "Demonstração do formato correto da ProVersa",
      variant: "default"
    });
  };

  // Initialize clean chalkboard
  useEffect(() => {
    setChalkboardContent([]);
  }, []);

  // Auto-scroll conversation to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const getTeacherAvatar = () => {
    if (conversationState === 'listening') {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse">
            <Mic className="h-2 w-2 text-white" />
          </div>
        </div>
      );
    }
    
    if (conversationState === 'thinking') {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <div className="w-1 h-1 rounded-full bg-white animate-bounce" />
          </div>
        </div>
      );
    }
    
    if (conversationState === 'speaking') {
      return (
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
            <Star className="h-2 w-2 text-white animate-spin" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Heart className="h-6 w-6 text-white" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Link href="/student/dashboard">
              <Button className="gap-2 h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl text-sm">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getTeacherAvatar()}
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800">Pro Versa</h1>
                <p className="text-xs text-gray-600">
                  {!isConnected && "Pronta para começar"}
                  {isConnected && conversationState === 'listening' && "Escutando você..."}
                  {isConnected && conversationState === 'thinking' && "Organizando ideias..."}
                  {isConnected && conversationState === 'speaking' && "Explicando conceitos..."}
                  {isConnected && conversationState === 'idle' && "Pronta para ensinar!"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                  Online • {chalkboardContent.length} itens
                </Badge>
              )}
              
              {!isConnected ? (
                <Button 
                  onClick={connectToRealtime}
                  disabled={connectionState === 'connecting'}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg h-9"
                  size="sm"
                >
                  {connectionState === 'connecting' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Conectar
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                    size="sm"
                  >
                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    size="sm"
                  >
                    Finalizar
                  </Button>
                  
                  <Button
                    onClick={testChalkboardExtraction}
                    variant="ghost"
                    size="sm"
                  >
                    Teste
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2 space-y-3">
        {/* Enhanced Green Chalkboard - Optimized Height */}
        <Card className="h-[calc(100vh-140px)] min-h-[600px] bg-gradient-to-br from-green-800 to-green-900 border-green-700 shadow-2xl">
          <CardContent className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-600/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600/30 flex items-center justify-center">
                  <Presentation className="h-4 w-4 text-green-100" />
                </div>
                <div>
                  <h3 className="font-bold text-green-100 text-base">Lousa Digital - Conceitos da Aula</h3>
                  <p className="text-green-300 text-xs">Conteúdo educacional organizado automaticamente</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-green-200 border-green-400 bg-green-800/50 text-xs">
                  {chalkboardContent.length > 0 ? 'Conteúdo ativo' : 'Aguardando'}
                </Badge>
                {chalkboardContent.length > 0 && (
                  <Button
                    onClick={clearChalkboard}
                    variant="ghost"
                    size="sm"
                    className="text-green-200 hover:bg-green-700/50 h-6 px-2 text-xs"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              {chalkboardContent.length === 0 ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-green-700/30 flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-green-500/50">
                    <Presentation className="h-10 w-10 text-green-200" />
                  </div>
                  <h4 className="font-bold text-green-100 mb-3 text-2xl font-serif">Lousa Digital</h4>
                  <p className="text-green-300 text-lg max-w-md mx-auto leading-relaxed mb-8 font-serif">
                    Durante a explicação, conceitos aparecerão aqui como em uma lousa tradicional
                  </p>
                  <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                        <Lightbulb className="h-6 w-6 text-green-300" />
                      </div>
                      <span className="text-green-400 text-sm font-serif">Exemplos</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                        <Target className="h-6 w-6 text-green-300" />
                      </div>
                      <span className="text-green-400 text-sm font-serif">Fórmulas</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                        <Brain className="h-6 w-6 text-green-300" />
                      </div>
                      <span className="text-green-400 text-sm font-serif">Conceitos</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-4xl">
                  {chalkboardContent.map((item) => (
                    <div key={item.id} className="text-center">
                      {/* Title at top like chalkboard */}
                      <div className="mb-8">
                        <h2 className="text-4xl font-bold text-green-100 mb-2 font-serif tracking-wide">
                          {item.title}
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-px bg-green-400/50 flex-1"></div>
                          <Badge variant="outline" className="bg-green-800/50 text-green-200 border-green-400/50 font-serif">
                            {item.type === 'example' && '💡 Exemplo'}
                            {item.type === 'formula' && '🧮 Fórmula'}
                            {item.type === 'concept' && '📚 Conceito'}
                            {item.type === 'important' && '⭐ Importante'}
                            {item.type === 'mindmap' && '🗺️ Mapa Mental'}
                            {item.type === 'summary' && '📝 Resumo'}
                          </Badge>
                          <div className="h-px bg-green-400/50 flex-1"></div>
                        </div>
                      </div>
                      
                      {/* Main content area with chalkboard style */}
                      <div className="bg-green-900/40 border-2 border-green-500/30 rounded-2xl p-12 backdrop-blur-sm">
                        <div 
                          className="text-green-100 leading-relaxed whitespace-pre-wrap font-serif text-2xl text-left"
                          style={{
                            fontFamily: 'Kalam, cursive, serif',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                            lineHeight: '1.6'
                          }}
                        >
                          {item.content}
                        </div>
                      </div>
                      
                      {/* Footer info */}
                      {item.subject && (
                        <div className="flex items-center justify-center gap-3 mt-6 text-green-300 font-serif">
                          <BookOpen className="h-5 w-5 text-green-400" />
                          <span className="text-lg">{item.subject}</span>
                          <span className="text-green-400">• {formatTime(item.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compact Conversation Bar */}
        <Card className="h-32 bg-white/95 backdrop-blur-sm border-white/40 shadow-lg">
          <CardContent className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3 w-3 text-indigo-600" />
                <h3 className="font-semibold text-gray-800 text-xs">Conversa</h3>
              </div>
              <Badge variant="outline" className="text-xs h-5">
                {messages.length} msgs
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 pr-1">
              <div className="space-y-1">
                {messages.length === 0 && !isConnected && (
                  <div className="text-center py-2">
                    <p className="text-gray-600 text-xs">Conecte-se para começar</p>
                  </div>
                )}
                
                {messages.length === 0 && isConnected && (
                  <div className="text-center py-2">
                    <p className="text-gray-600 text-xs">Conectado! Fale para começar</p>
                  </div>
                )}

                {messages.slice(-3).map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-2 rounded-md ${
                        message.type === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-xs leading-relaxed whitespace-pre-wrap line-clamp-2">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-70 mt-0.5 block">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {currentTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[90%] p-2 rounded-md bg-indigo-100 border border-indigo-200 text-indigo-800">
                      <p className="text-xs leading-relaxed line-clamp-1">
                        {currentTranscript}
                      </p>
                      <span className="text-xs text-indigo-600 mt-0.5 block">
                        Transcrevendo...
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={conversationEndRef} />
              </div>
            </ScrollArea>
            
            {/* Chat Input Area */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <form onSubmit={(e) => handleChatSubmit(e)} className="flex gap-2">
                <Input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isConnected ? "Digite sua pergunta para a Pro Versa..." : "Conecte-se primeiro para conversar"}
                  disabled={!isConnected || isProcessing}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!isConnected || !chatInput.trim() || isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, ArrowLeft, BookOpen, Brain, Heart, Star, Volume2, Presentation, Lightbulb, Target, MapPin } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

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
    setChalkboardContent(prev => [...prev, chalkboardItem]);
  };

  const analyzeForChalkboardContent = (content: string) => {
    // Simple keyword-based analysis to extract educational content
    const lowerContent = content.toLowerCase();
    
    // Look for examples
    if (lowerContent.includes('exemplo') || lowerContent.includes('por exemplo')) {
      const exampleMatch = content.match(/(?:exemplo|por exemplo)[:\-]?\s*([^.!?]*[.!?])/i);
      if (exampleMatch) {
        addChalkboardContent('example', 'Exemplo', exampleMatch[1].trim());
      }
    }
    
    // Look for formulas or equations
    if (content.includes('=') || lowerContent.includes('fórmula')) {
      const formulaMatch = content.match(/([^.!?]*[=][^.!?]*)/);
      if (formulaMatch) {
        addChalkboardContent('formula', 'Fórmula', formulaMatch[1].trim());
      }
    }
    
    // Look for important concepts
    if (lowerContent.includes('importante') || lowerContent.includes('lembre-se')) {
      const importantMatch = content.match(/(?:importante|lembre-se)[:\-]?\s*([^.!?]*[.!?])/i);
      if (importantMatch) {
        addChalkboardContent('important', 'Importante', importantMatch[1].trim());
      }
    }
    
    // Look for definitions
    if (lowerContent.includes('é definido como') || lowerContent.includes('significa')) {
      const conceptMatch = content.match(/([^.!?]*(?:é definido como|significa)[^.!?]*[.!?])/i);
      if (conceptMatch) {
        addChalkboardContent('concept', 'Conceito', conceptMatch[1].trim());
      }
    }
  };

  const connectToRealtime = useCallback(async () => {
    try {
      setConnectionState('connecting');
      
      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get ephemeral token');
      }
      
      const sessionData = await tokenResponse.json();
      const ephemeralKey = sessionData.client_secret.value;
      
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = (event) => {
        console.log('Received remote audio track');
        audioEl.srcObject = event.streams[0];
      };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('listening');
        
        toast({
          title: "Pro Versa conectada!",
          description: "Pronta para ensinar. Fale naturalmente!",
          variant: "default",
        });
      });
      
      dc.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });
      
      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }
      
      const answerSdp = await sdpResponse.text();
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      };
      
      await pc.setRemoteDescription(answer);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState('error');
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com a Pro Versa.",
        variant: "destructive",
      });
    }
  }, [toast]);

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

  // Add demo content when component mounts
  useEffect(() => {
    // Add some initial demo content to showcase the chalkboard
    const demoContent = [
      {
        id: 'demo-1',
        type: 'concept' as const,
        title: 'Conceito Fundamental',
        content: 'A fotossíntese é o processo pelo qual as plantas convertem luz solar em energia química.',
        timestamp: new Date(),
        subject: 'Biologia'
      },
      {
        id: 'demo-2', 
        type: 'formula' as const,
        title: 'Fórmula da Fotossíntese',
        content: '6CO₂ + 6H₂O + energia solar → C₆H₁₂O₆ + 6O₂',
        timestamp: new Date(),
        subject: 'Biologia'
      },
      {
        id: 'demo-3',
        type: 'important' as const,
        title: 'Ponto Importante',
        content: 'Lembre-se: as plantas são os produtores primários da cadeia alimentar!',
        timestamp: new Date(),
        subject: 'Biologia'
      }
    ];
    setChalkboardContent(demoContent);
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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/student/dashboard">
              <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Pro Versa</h1>
              <p className="text-sm text-gray-600">Sua tutora com voz por IA</p>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected && (
                <>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    Online
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {conversationState === 'listening' && '🎧 Escutando'}
                    {conversationState === 'thinking' && '🤔 Pensando'}
                    {conversationState === 'speaking' && '🗣️ Falando'}
                    {conversationState === 'idle' && '😊 Pronta'}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Control Bar */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-white/30 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {getTeacherAvatar()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Pro Versa</h2>
                <p className="text-sm text-gray-600">
                  {!isConnected && "Pronta para começar"}
                  {isConnected && conversationState === 'listening' && "🎧 Escutando você..."}
                  {isConnected && conversationState === 'thinking' && "🤔 Organizando ideias..."}
                  {isConnected && conversationState === 'speaking' && "🗣️ Explicando conceitos..."}
                  {isConnected && conversationState === 'idle' && "😊 Pronta para ensinar!"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  Online • {chalkboardContent.length} conceitos na lousa
                </Badge>
              )}
              
              {!isConnected ? (
                <Button 
                  onClick={connectToRealtime}
                  disabled={connectionState === 'connecting'}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                  size="lg"
                >
                  {connectionState === 'connecting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Conectar com Pro Versa
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Ativar Mic
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Silenciar
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={disconnect}
                    variant="outline"
                  >
                    Finalizar Aula
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* Green Chalkboard - Full Width */}
        <Card className="h-[calc(100vh-300px)] min-h-[500px] bg-gradient-to-br from-green-800 to-green-900 border-green-700 shadow-2xl">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-600/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600/30 flex items-center justify-center">
                  <Presentation className="h-5 w-5 text-green-100" />
                </div>
                <div>
                  <h3 className="font-bold text-green-100 text-lg">Lousa Digital - Conceitos da Aula</h3>
                  <p className="text-green-300 text-xs">Mapas mentais, fórmulas e exemplos ilustrativos</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-green-200 border-green-400 bg-green-800/50">
                  {chalkboardContent.length} conceitos
                </Badge>
                {chalkboardContent.length > 0 && (
                  <Button
                    onClick={clearChalkboard}
                    variant="ghost"
                    size="sm"
                    className="text-green-200 hover:bg-green-700/50 h-7 px-2"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="flex-1 pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {chalkboardContent.length === 0 ? (
                  <div className="col-span-2 text-center py-20">
                    <div className="w-24 h-24 rounded-full bg-green-700/30 flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-green-500/50">
                      <Presentation className="h-12 w-12 text-green-200" />
                    </div>
                    <h4 className="font-bold text-green-100 mb-3 text-2xl">Lousa Interativa Pronta</h4>
                    <p className="text-green-300 text-base max-w-lg mx-auto leading-relaxed mb-6">
                      Durante a explicação, conceitos visuais aparecerão aqui para reforçar o aprendizado
                    </p>
                    <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                          <Lightbulb className="h-6 w-6 text-green-300" />
                        </div>
                        <span className="text-green-400 text-sm">Exemplos</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                          <Target className="h-6 w-6 text-green-300" />
                        </div>
                        <span className="text-green-400 text-sm">Fórmulas</span>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-green-600/30 flex items-center justify-center mx-auto mb-2">
                          <MapPin className="h-6 w-6 text-green-300" />
                        </div>
                        <span className="text-green-400 text-sm">Mapas</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  chalkboardContent.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-green-600/20 rounded-xl transform rotate-1 group-hover:rotate-0 transition-transform duration-300"></div>
                      <div className="relative bg-green-700/40 border-2 border-green-500/50 rounded-xl p-6 backdrop-blur-sm hover:bg-green-700/50 transition-all duration-300 h-full">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600/50 flex items-center justify-center border border-green-400/50">
                            {getChalkboardIcon(item.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-bold text-green-100 text-xl">{item.title}</h4>
                              <Badge variant="outline" className="text-xs bg-green-800/50 text-green-200 border-green-400/50">
                                {item.type === 'example' && '💡 Exemplo'}
                                {item.type === 'formula' && '🧮 Fórmula'}
                                {item.type === 'concept' && '📚 Conceito'}
                                {item.type === 'important' && '⭐ Importante'}
                                {item.type === 'mindmap' && '🗺️ Mapa Mental'}
                                {item.type === 'summary' && '📝 Resumo'}
                              </Badge>
                            </div>
                            <div className="bg-green-900/60 rounded-lg p-4 border border-green-600/30 mb-3">
                              <p className="text-green-100 leading-relaxed whitespace-pre-wrap font-medium text-lg">
                                {item.content}
                              </p>
                            </div>
                            {item.subject && (
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-green-400" />
                                <span className="text-sm text-green-300">{item.subject}</span>
                                <span className="text-sm text-green-400">• {formatTime(item.timestamp)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Bottom Conversation Bar */}
        <Card className="h-48 bg-white/95 backdrop-blur-sm border-white/40 shadow-lg">
          <CardContent className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <h3 className="font-semibold text-gray-800 text-sm">Conversa com Pro Versa</h3>
              </div>
              <Badge variant="outline" className="text-xs">
                {messages.length} mensagens
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-2">
                {messages.length === 0 && !isConnected && (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">Conecte-se para começar a conversar com a Pro Versa</p>
                  </div>
                )}
                
                {messages.length === 0 && isConnected && (
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Mic className="h-4 w-4 animate-pulse text-green-500" />
                      <span>Pro Versa está ouvindo... Fale naturalmente</span>
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.type === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-lg p-2 text-xs ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        message.type === 'user' ? 'text-indigo-100' : 'text-gray-400'
                      }`}>
                        {message.type === 'user' ? 'Você' : 'Pro Versa'} • {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.type === 'user' && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {currentTranscript && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Volume2 className="h-3 w-3 text-white" />
                    </div>
                    <div className="max-w-[80%] rounded-lg p-2 bg-gray-50 border-2 border-dashed border-gray-200 text-xs">
                      <p className="text-gray-700 leading-relaxed italic">{currentTranscript}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse mr-1" />
                        Falando...
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Auto-scroll anchor */}
                <div ref={conversationEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
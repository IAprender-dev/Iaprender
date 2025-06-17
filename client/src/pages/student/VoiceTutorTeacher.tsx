import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Mic, MicOff, ArrowLeft, Phone, PhoneOff, User, Clock, BookOpen, Brain, Heart, Star, Volume2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  format: 'text' | 'audio';
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceTutorTeacher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Core states
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationTime, setConversationTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setConversationTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const addMessage = (type: 'user' | 'assistant', content: string, format: 'text' | 'audio' = 'text') => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      format
    };
    setMessages(prev => [...prev, message]);
  };

  const cleanup = () => {
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
  };

  const connectToRealtimeAPI = useCallback(async () => {
    try {
      setConnectionState('connecting');
      console.log('Iniciando conexão com OpenAI Realtime API...');
      
      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Erro na resposta da sessão:', errorText);
        throw new Error(`Failed to get ephemeral token: ${errorText}`);
      }
      
      const sessionData = await tokenResponse.json();
      console.log('Sessão criada:', sessionData);
      
      if (!sessionData.client_secret?.value) {
        console.error('Token não encontrado na resposta:', sessionData);
        throw new Error('Token de acesso não encontrado');
      }
      
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
      
      console.log('Solicitando permissão de microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      console.log('Microfone capturado com sucesso');
      
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('idle');
        
        // Configurar sessão da IA
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Você é a Pro Versa, uma tutora virtual especializada em ensino brasileiro. Seja paciente, didática e adaptativa ao nível do aluno. Responda sempre em português brasileiro de forma clara e educativa.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 200 },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
          }
        };
        
        console.log('Enviando configuração da sessão:', sessionConfig);
        dc.send(JSON.stringify(sessionConfig));
        
        addMessage('assistant', 'Olá! Sou a Pro Versa, sua tutora virtual. Como posso ajudar você hoje?');
        
        toast({
          title: "Pro Versa conectada!",
          description: "Pronta para ensinar. Fale naturalmente!",
        });
      });
      
      dc.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type, message);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      });
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      console.log('Enviando SDP offer para OpenAI...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });
      
      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP exchange failed:', errorText);
        throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText}`);
      }
      
      const answerSdp = await sdpResponse.text();
      console.log('Received SDP answer from OpenAI');
      
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      };
      
      await pc.setRemoteDescription(answer);
      console.log('WebRTC connection established successfully');
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('error');
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com a Pro Versa. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case 'session.created':
        console.log('Sessão criada com sucesso!');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('Transcrição do usuário:', message.transcript);
        if (message.transcript && message.transcript.trim()) {
          setCurrentTranscript('');
          addMessage('user', message.transcript, 'audio');
        }
        break;
        
      case 'response.audio_transcript.delta':
        if (message.delta) {
          setCurrentTranscript(prev => prev + message.delta);
        }
        break;
        
      case 'response.audio_transcript.done':
        console.log('Resposta da IA:', message.transcript);
        if (message.transcript && message.transcript.trim()) {
          addMessage('assistant', message.transcript, 'audio');
          setCurrentTranscript('');
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('Usuário começou a falar');
        setConversationState('listening');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('Usuário parou de falar');
        setConversationState('thinking');
        break;
        
      case 'response.created':
        setConversationState('thinking');
        break;
        
      case 'response.audio.done':
        setConversationState('idle');
        break;
        
      case 'error':
        console.error('Realtime API error:', message);
        toast({
          title: "Erro na conversa",
          description: message.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
        break;
        
      default:
        console.log('Tipo de mensagem não tratado:', message.type);
    }
  };

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    setCurrentTranscript('');
    addMessage('assistant', 'Sessão finalizada. Até a próxima!');
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

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const getConversationStateText = () => {
    switch (conversationState) {
      case 'listening': return 'Escutando...';
      case 'thinking': return 'Processando...';
      case 'speaking': return 'Falando...';
      default: return 'Pronta para conversar';
    }
  };

  const getTeacherAvatar = () => {
    if (conversationState === 'listening') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse">
            <Mic className="h-3 w-3 text-white" />
          </div>
        </div>
      );
    }
    
    if (conversationState === 'thinking') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </div>
      );
    }
    
    if (conversationState === 'speaking') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
            <Star className="h-3 w-3 text-white animate-spin" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Heart className="h-8 w-8 text-white" />
        </div>
      </div>
    );
  };

  useEffect(() => {
    addMessage('assistant', 'Bem-vindo ao Tutor por Voz! Clique em "Iniciar Tutoria" para começar uma sessão de aprendizado interativa.');
    
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header Superior */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Navegação */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/aluno/dashboard')}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-3">
              <div className="flex justify-center">
                {getTeacherAvatar()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Pro Versa</h1>
                <p className="text-sm text-slate-600">Sua tutora virtual inteligente</p>
              </div>
            </div>
          </div>

          {/* Status e Controles */}
          <div className="flex items-center space-x-4">
            {/* Status da Conexão */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm font-medium text-slate-700">
                {getConnectionStatusText()}
              </span>
              {isConnected && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 font-mono">
                    {formatTime(conversationTime)}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="outline" className="capitalize">
                    {conversationState === 'listening' && '🎧 Escutando'}
                    {conversationState === 'thinking' && '🤔 Pensando'}
                    {conversationState === 'speaking' && '🗣️ Falando'}
                    {conversationState === 'idle' && '😊 Pronta'}
                  </Badge>
                </>
              )}
            </div>

            {/* Controles de Áudio */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  className={`${isMuted ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
            )}

            {/* Botão Principal */}
            <Button
              onClick={isConnected ? disconnect : connectToRealtimeAPI}
              disabled={connectionState === 'connecting'}
              className={`px-6 ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              }`}
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Encerrar Tutoria
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {connectionState === 'connecting' ? 'Conectando...' : 'Iniciar Tutoria'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Área Principal - Lousa Virtual */}
      <div className="flex-1 bg-white m-6 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Área da Lousa */}
          <div className="flex-1 bg-gradient-to-br from-slate-50 to-white p-8 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-2xl">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <Bot className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  Pro Versa - Sua Tutora Virtual
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {connectionState === 'connecting' 
                    ? 'Conectando com a tutora virtual...'
                    : connectionState === 'error'
                    ? 'Erro de conexão. Tente novamente.'
                    : isConnected 
                    ? 'Estou aqui para ajudar! Fale comigo sobre qualquer matéria que você gostaria de aprender ou revisar.'
                    : 'Clique em "Iniciar Tutoria" no menu superior para começarmos uma sessão de aprendizado personalizada.'
                  }
                </p>
                
                {/* Indicadores de Status */}
                {isConnected && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <span className="text-sm font-medium text-slate-600">
                      {getConversationStateText()}
                    </span>
                  </div>
                )}
              </div>

              {isConnected && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <Mic className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-slate-700">Fale Naturalmente</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium text-slate-700">IA Especializada</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium text-slate-700">Aprendizado Personalizado</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat de Texto - Faixa Inferior */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
        <Card className="m-4 shadow-lg border-slate-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                Histórico da Conversa
              </h3>
              <Badge variant="outline" className="text-xs">
                {messages.length} mensagens
              </Badge>
            </div>
            
            <ScrollArea className="h-32">
              <div className="p-4 space-y-3">
                {messages.length === 0 && !isConnected && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium text-slate-800 mb-1">Olá, {user?.firstName}!</h4>
                    <p className="text-slate-600 text-sm">Conecte-se com a Pro Versa para começar a aprender!</p>
                  </div>
                )}
                
                {messages.length === 0 && isConnected && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium text-slate-800 mb-1">Pro Versa está ouvindo...</h4>
                    <p className="text-slate-600 text-sm">Fale naturalmente para começar a conversa</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs opacity-70">
                          {message.type === 'user' ? 'Você' : 'Pro Versa'}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {currentTranscript && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-3 py-2 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 text-sm">
                      <p className="text-gray-700 leading-relaxed">{currentTranscript}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                        Pro Versa está falando...
                      </p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
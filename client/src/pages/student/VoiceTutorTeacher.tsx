import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Mic, MicOff, ArrowLeft, Phone, PhoneOff, User, Clock, Wifi, WifiOff } from 'lucide-react';
import { useLocation } from 'wouter';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type: 'text' | 'audio';
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
  const wsRef = useRef<WebSocket | null>(null);

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

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'audio' = 'text') => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, message]);
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const connectToRealtimeAPI = useCallback(async () => {
    try {
      setConnectionState('connecting');
      
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }
      
      const { client_secret } = await sessionResponse.json();
      
      const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', [
        'realtime',
        `openai-insecure-api-key.${client_secret.value}`
      ]);

      wsRef.current = ws;
      
      ws.onopen = () => {
        setConnectionState('connected');
        setIsConnected(true);
        addMessage('assistant', 'Olá! Sou sua tutora virtual. Como posso ajudar você hoje?');
        
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Você é uma tutora virtual especializada em ensino. Seja paciente, didática e adaptativa ao nível do aluno.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 200 },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
          }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'input_audio_buffer.speech_started') {
            setConversationState('listening');
          } else if (message.type === 'input_audio_buffer.speech_stopped') {
            setConversationState('thinking');
          } else if (message.type === 'response.audio.delta') {
            setConversationState('speaking');
          } else if (message.type === 'response.done') {
            setConversationState('idle');
          } else if (message.type === 'conversation.item.input_audio_transcription.completed') {
            if (message.transcript) {
              addMessage('user', message.transcript, 'audio');
            }
          } else if (message.type === 'response.audio_transcript.done') {
            if (message.transcript) {
              addMessage('assistant', message.transcript, 'audio');
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        toast({
          title: "Erro de Conexão",
          description: "Não foi possível conectar ao serviço de voz.",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        setConnectionState('disconnected');
        setIsConnected(false);
        setConversationState('idle');
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const outputBuffer = new Int16Array(inputBuffer.length);
          
          for (let i = 0; i < inputBuffer.length; i++) {
            outputBuffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
          }
          
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: Array.from(outputBuffer).map(sample => sample.toString()).join(',')
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('error');
      toast({
        title: "Erro",
        description: "Falha ao conectar. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    addMessage('assistant', 'Sessão finalizada. Até a próxima!');
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

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
      default: return 'Pronto para conversar';
    }
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
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Tutor Pro Versa</h1>
                <p className="text-sm text-slate-600">Tutoria inteligente por voz</p>
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

        {/* Barra de Status da Conversa */}
        {isConnected && (
          <div className="mt-3 px-4 py-2 bg-slate-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  conversationState === 'listening' ? 'bg-blue-500 animate-pulse' :
                  conversationState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
                  conversationState === 'speaking' ? 'bg-green-500 animate-pulse' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium text-slate-700">
                  {getConversationStateText()}
                </span>
              </div>
              {currentTranscript && (
                <div className="text-sm text-slate-600 italic">
                  "{currentTranscript}..."
                </div>
              )}
            </div>
          </div>
        )}
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
                  {isConnected 
                    ? 'Estou aqui para ajudar! Fale comigo sobre qualquer matéria que você gostaria de aprender ou revisar.'
                    : 'Clique em "Iniciar Tutoria" no menu superior para começarmos uma sessão de aprendizado personalizada.'
                  }
                </p>
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
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs opacity-70">
                          {message.role === 'user' ? 'Você' : 'Pro Versa'}
                        </span>
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
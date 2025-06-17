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
      console.log('Iniciando conexão com Realtime API...');
      
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error('Erro na resposta da sessão:', errorText);
        throw new Error(`Failed to create session: ${errorText}`);
      }
      
      const sessionData = await sessionResponse.json();
      console.log('Sessão criada:', sessionData);
      
      if (!sessionData.client_secret?.value) {
        console.error('Token não encontrado na resposta:', sessionData);
        throw new Error('Token de acesso não encontrado');
      }
      
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      console.log('Conectando WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl, [
        'realtime',
        `openai-insecure-api-key.${sessionData.client_secret.value}`
      ]);

      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket conectado com sucesso!');
        setConnectionState('connected');
        setIsConnected(true);
        addMessage('assistant', 'Olá! Sou sua tutora virtual. Como posso ajudar você hoje?');
        
        // Configurar sessão da IA
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Você é uma tutora virtual especializada em ensino brasileiro. Seja paciente, didática e adaptativa ao nível do aluno. Responda em português brasileiro.',
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
        ws.send(JSON.stringify(sessionConfig));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Mensagem recebida:', message.type, message);
          
          switch (message.type) {
            case 'session.created':
              console.log('Sessão criada com sucesso!');
              toast({
                title: "Conectado!",
                description: "Tutoria iniciada com sucesso. Fale comigo!",
              });
              break;
              
            case 'input_audio_buffer.speech_started':
              console.log('Usuário começou a falar');
              setConversationState('listening');
              setCurrentTranscript('Escutando...');
              break;
              
            case 'input_audio_buffer.speech_stopped':
              console.log('Usuário parou de falar');
              setConversationState('thinking');
              setCurrentTranscript('Processando...');
              break;
              
            case 'response.audio.delta':
              setConversationState('speaking');
              break;
              
            case 'response.done':
              setConversationState('idle');
              setCurrentTranscript('');
              break;
              
            case 'conversation.item.input_audio_transcription.completed':
              console.log('Transcrição do usuário:', message.transcript);
              if (message.transcript) {
                addMessage('user', message.transcript, 'audio');
                setCurrentTranscript('');
              }
              break;
              
            case 'response.audio_transcript.done':
              console.log('Resposta da IA:', message.transcript);
              if (message.transcript) {
                addMessage('assistant', message.transcript, 'audio');
              }
              break;
              
            case 'conversation.item.input_audio_transcription.delta':
              if (message.delta) {
                setCurrentTranscript(prev => prev + message.delta);
              }
              break;
              
            case 'error':
              console.error('Erro da API:', message.error);
              toast({
                title: "Erro",
                description: `Erro na API: ${message.error?.message || 'Erro desconhecido'}`,
                variant: "destructive",
              });
              break;
              
            default:
              console.log('Tipo de mensagem não tratado:', message.type);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setConnectionState('error');
        toast({
          title: "Erro de Conexão",
          description: "Falha na conexão WebSocket. Verifique sua internet.",
          variant: "destructive",
        });
      };

      ws.onclose = (event) => {
        console.log('WebSocket fechado:', event.code, event.reason);
        setConnectionState('disconnected');
        setIsConnected(false);
        setConversationState('idle');
        
        if (event.code !== 1000) {
          toast({
            title: "Conexão Perdida",
            description: `Conexão encerrada: ${event.reason || 'Motivo desconhecido'}`,
            variant: "destructive",
          });
        }
      };

      // Configurar captura de áudio
      console.log('Solicitando permissão de microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      console.log('Microfone capturado com sucesso');
      
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN && !isMuted) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const outputBuffer = new Int16Array(inputBuffer.length);
          
          // Converter float32 para int16
          for (let i = 0; i < inputBuffer.length; i++) {
            const sample = Math.max(-1, Math.min(1, inputBuffer[i]));
            outputBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
          
          // Converter para base64 para envio
          const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(outputBuffer.buffer))));
          
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          }));
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      console.log('Processamento de áudio configurado');
      
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

            {/* Botão de Teste */}
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                      type: 'response.create',
                      response: {
                        modalities: ['text', 'audio'],
                        instructions: 'Diga "Olá! Estou funcionando perfeitamente!" em português brasileiro.'
                      }
                    }));
                  }
                }}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Testar Voz
              </Button>
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
                  {connectionState === 'connecting' 
                    ? 'Conectando com a tutora virtual...'
                    : connectionState === 'error'
                    ? 'Erro de conexão. Tente novamente.'
                    : isConnected 
                    ? 'Estou aqui para ajudar! Fale comigo sobre qualquer matéria que você gostaria de aprender ou revisar.'
                    : 'Clique em "Iniciar Tutoria" no menu superior para começarmos uma sessão de aprendizado personalizada.'
                  }
                </p>
                
                {/* Indicador de Status Visual */}
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
                  <span className="text-sm font-medium text-slate-600">
                    {getConnectionStatusText()}
                  </span>
                </div>
                
                {/* Debug Info (apenas quando conectado) */}
                {isConnected && (
                  <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                    <p>WebSocket: {wsRef.current?.readyState === WebSocket.OPEN ? 'Aberto' : 'Fechado'}</p>
                    <p>Estado: {conversationState}</p>
                    <p>Microfone: {isMuted ? 'Silenciado' : 'Ativo'}</p>
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
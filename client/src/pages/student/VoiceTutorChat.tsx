import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Mic, Play, Pause, RotateCcw, ArrowLeft, Phone, PhoneOff } from 'lucide-react';
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

export default function VoiceTutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Core states
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [conversationTime, setConversationTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');

  // WebSocket and audio refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

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

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou seu tutor de conversas por voz usando a OpenAI Realtime API. Clique em "Conectar" para iniciar nossa conversa em tempo real.`,
      timestamp: new Date(),
      type: 'text'
    }]);

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const connectToRealtimeAPI = useCallback(async () => {
    try {
      setConnectionState('connecting');
      
      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
          channelCount: 1
        }
      });
      
      streamRef.current = stream;
      
      // Setup audio context for processing
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      
      // Connect to our WebSocket proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/realtime`;
      const ws = new WebSocket(wsUrl);
      
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('Connected to Realtime API proxy');
        // Don't set connected state yet - wait for session.created
      };
      
      ws.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const message = JSON.parse(event.data);
            handleRealtimeMessage(message);
          } else {
            // Handle binary audio data
            console.log('Received binary audio data');
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar com o servidor de voz.",
          variant: "destructive",
        });
      };
      
      ws.onclose = () => {
        console.log('Disconnected from Realtime API');
        setConnectionState('disconnected');
        setIsConnected(false);
        setConversationState('idle');
      };
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState('error');
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  }, [user?.firstName, toast]);

  const setupAudioProcessing = (audioContext: AudioContext, stream: MediaStream, ws: WebSocket) => {
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (event) => {
      if (ws.readyState === WebSocket.OPEN && conversationState !== 'speaking') {
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert float32 to int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Send audio data to Realtime API
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: arrayBufferToBase64(pcmData.buffer)
        }));
      }
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    processorRef.current = processor;
  };

  const handleRealtimeMessage = (message: any) => {
    console.log('Received message:', message.type, message);
    
    switch (message.type) {
      case 'session.created':
        console.log('Session created');
        break;
        
      case 'session.updated':
        console.log('Session configured - activating voice chat');
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('listening');
        
        if (wsRef.current && audioContextRef.current && streamRef.current) {
          setupAudioProcessing(audioContextRef.current, streamRef.current, wsRef.current);
          toast({
            title: "Conectado!",
            description: "Conversa por voz ativa. Fale naturalmente.",
            variant: "default",
          });
        }
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        console.log('User transcription completed:', message.transcript);
        if (message.transcript && message.transcript.trim()) {
          setCurrentTranscript('');
          addMessage('user', message.transcript, 'text');
        }
        break;
        
      case 'conversation.item.input_audio_transcription.failed':
        console.log('User transcription failed:', message);
        break;
        
      case 'conversation.item.created':
        // Handle user input items
        if (message.item && message.item.type === 'message' && message.item.role === 'user') {
          console.log('User message item created:', message.item);
          // Check if there's content to display
          if (message.item.content && message.item.content.length > 0) {
            const textContent = message.item.content.find((c: any) => c.type === 'input_text');
            if (textContent && textContent.text) {
              console.log('Adding user message from item:', textContent.text);
              addMessage('user', textContent.text, 'text');
            }
          }
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
        
      case 'response.audio.delta':
        if (message.delta) {
          audioQueueRef.current.push(message.delta);
          if (!isPlayingRef.current) {
            playNextAudioChunk();
          }
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        setConversationState('listening');
        setCurrentTranscript(''); // Clear any previous transcript
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
        setConversationState('thinking');
        // Commit the input audio buffer to get transcription
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.commit'
          }));
        }
        break;
        
      case 'input_audio_buffer.committed':
        console.log('Audio buffer committed, waiting for transcription...');
        break;
        
      case 'response.created':
        setConversationState('thinking');
        break;
        
      case 'response.audio.done':
        setConversationState('listening');
        isPlayingRef.current = false;
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

  const playNextAudioChunk = async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;
    
    isPlayingRef.current = true;
    setConversationState('speaking');
    
    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift()!;
      
      try {
        const binaryData = base64ToArrayBuffer(audioData);
        const audioBuffer = new Int16Array(binaryData);
        
        // Convert int16 to float32
        const floatData = new Float32Array(audioBuffer.length);
        for (let i = 0; i < audioBuffer.length; i++) {
          floatData[i] = audioBuffer[i] / 32768;
        }
        
        const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
        buffer.copyToChannel(floatData, 0);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
        
      } catch (error) {
        console.error('Error playing audio chunk:', error);
      }
    }
    
    isPlayingRef.current = false;
    setConversationState('listening');
  };

  const addMessage = (role: 'user' | 'assistant', content: string, type: 'text' | 'audio') => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      type
    };
    
    setMessages(prev => [...prev, message]);
  };

  const disconnect = () => {
    cleanup();
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    setConversationTime(0);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    
    toast({
      title: "Desconectado",
      description: "Conversa por voz finalizada.",
      variant: "default",
    });
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `Conversa reiniciada! Estou pronto para uma nova sessão de estudos por voz.`,
      timestamp: new Date(),
      type: 'text'
    }]);
    setConversationTime(0);
  };

  // Utility functions
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const buffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return buffer;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateDescription = () => {
    if (!isConnected) return 'Desconectado';
    
    switch (conversationState) {
      case 'idle': return 'Aguardando...';
      case 'listening': return 'Escutando você...';
      case 'thinking': return 'Processando...';
      case 'speaking': return 'Falando...';
      default: return 'Ativo';
    }
  };

  const getStateColor = () => {
    if (!isConnected) return 'bg-gray-500';
    
    switch (conversationState) {
      case 'listening': return 'bg-green-500';
      case 'thinking': return 'bg-yellow-500';
      case 'speaking': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  // Voice Avatar Component
  const VoiceAvatar = () => {
    const pulseScale = conversationState === 'speaking' ? 1.15 : conversationState === 'listening' ? 1.05 : 1;
    const glowIntensity = conversationState === 'speaking' ? 0.9 : 
                         conversationState === 'listening' ? 0.7 : 
                         conversationState === 'thinking' ? 0.5 : 0.3;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-12">
        <div className="relative">
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              transform: `scale(${1.5})`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${glowIntensity * 0.2}) 0%, transparent 70%)`,
              filter: `blur(30px)`
            }}
          />
          
          <div 
            className="relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center transition-all duration-300 shadow-2xl"
            style={{
              transform: `scale(${pulseScale})`,
              boxShadow: `0 0 ${50 + glowIntensity * 80}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-32 h-32 text-white drop-shadow-xl" />
            
            {conversationState === 'speaking' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-60" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-pulse opacity-80" />
              </>
            )}
            
            {conversationState === 'listening' && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-40"
                    style={{ 
                      animationDelay: `${i * 0.6}s`,
                      animationDuration: '2.5s'
                    }}
                  />
                ))}
              </div>
            )}
            
            {conversationState === 'thinking' && (
              <div className="absolute inset-0 rounded-full border-3 border-yellow-400 animate-spin opacity-70" 
                   style={{ animationDuration: '2s' }} />
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStateColor()} animate-pulse`} />
            <span className="text-xl font-semibold text-gray-700">{getStateDescription()}</span>
          </div>
          
          {isConnected && (
            <div className="space-y-2">
              <p className="text-sm text-blue-600 font-medium">
                OpenAI Realtime API - Conversa contínua ativa
              </p>
              {currentTranscript && (
                <p className="text-xs text-gray-600 italic max-w-md">
                  "{currentTranscript}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/student/dashboard')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    Tutor de Voz IA - Realtime
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Conversa em tempo real com OpenAI Realtime API
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {isConnected && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {formatTime(conversationTime)}
                  </Badge>
                )}
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  {messages.length - 1} mensagens
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Voice Interface */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardContent className="p-8">
              <VoiceAvatar />
              
              {/* Connection Controls */}
              <div className="flex justify-center space-x-4 mt-8">
                {!isConnected ? (
                  <Button
                    onClick={connectToRealtimeAPI}
                    disabled={connectionState === 'connecting'}
                    size="lg"
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    {connectionState === 'connecting' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-5 h-5" />
                        <span>Conectar</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={disconnect}
                    size="lg"
                    variant="destructive"
                    className="flex items-center space-x-2"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span>Desconectar</span>
                  </Button>
                )}
                
                <Button
                  onClick={clearConversation}
                  variant="outline"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Limpar</span>
                </Button>
              </div>

              {connectionState === 'error' && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    Erro de conexão. Verifique sua internet e tente novamente.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Conversa em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                        )}
                        {message.role === 'user' && (
                          <Mic className="w-4 h-4 mt-0.5 text-blue-100" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {message.type === 'audio' && (
                              <span className="text-xs opacity-70 bg-black/10 px-1 rounded">
                                voz
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
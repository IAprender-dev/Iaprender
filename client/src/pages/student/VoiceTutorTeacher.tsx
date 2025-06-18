import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Power, PowerOff, Volume2, VolumeX, Mic, MicOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  // Estados principais
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [blackboardContent, setBlackboardContent] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeSession, setRealtimeSession] = useState<any>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);

  const { toast } = useToast();

  // Solicitar permissões de microfone e alto-falante ao carregar a página
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('🎤 Solicitando permissões de áudio...');
        
        // Solicitar permissão do microfone
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        console.log('✅ Permissão do microfone concedida');
        setMicrophoneStream(stream);
        setPermissionsGranted(true);
        
        toast({
          title: "Permissões concedidas",
          description: "Microfone e alto-falante autorizados para uso",
        });
        
      } catch (error) {
        console.error('❌ Erro ao solicitar permissões:', error);
        setPermissionsGranted(false);
        
        toast({
          title: "Permissões necessárias",
          description: "A Pro Versa precisa de acesso ao microfone e alto-falante para funcionar",
          variant: "destructive",
        });
      }
    };

    requestPermissions();
    
    // Cleanup ao desmontar componente
    return () => {
      if (microphoneStream) {
        microphoneStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  // Função para adicionar mensagem
  const addMessage = useCallback((type: 'user' | 'assistant', content: string, format: 'text' | 'audio' = 'text') => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      format
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Função para filtrar conteúdo para o quadro
  const filterContentForBlackboard = (content: string): string => {
    const lines = content.split('\n');
    const educationalLines: string[] = [];
    
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.includes('=') || // Equações
          cleanLine.includes('→') || // Setas de reação
          cleanLine.includes('°C') || // Temperaturas
          cleanLine.includes('%') || // Porcentagens
          /^\d+\./.test(cleanLine) || // Listas numeradas
          /^[A-Z][a-z]+:/.test(cleanLine) || // Definições
          cleanLine.includes('Fórmula:') || // Fórmulas
          cleanLine.includes('Exemplo:') || // Exemplos
          cleanLine.includes('pH') || // pH
          cleanLine.includes('mol') || // mol
          /\b[A-Z][a-z]?\d*\b/.test(cleanLine) // Elementos químicos
      ) {
        educationalLines.push(cleanLine);
      }
    }
    
    return educationalLines.join('\n').trim();
  };

  // Função para converter ArrayBuffer para Base64
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Função para inicializar áudio WebRTC
  const initializeAudioSystem = useCallback(async () => {
    if (!permissionsGranted || !microphoneStream) {
      console.error('Permissões de áudio não concedidas');
      toast({
        title: "Permissões necessárias",
        description: "Conceda acesso ao microfone para usar a Pro Versa",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Criar contexto de áudio
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Criar fonte de áudio do stream do microfone
      sourceRef.current = audioContextRef.current.createMediaStreamSource(microphoneStream);

      // Criar processador de script para capturar áudio
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (event) => {
        if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) return;

        const inputBuffer = event.inputBuffer.getChannelData(0);
        
        // Converter para PCM 16-bit
        const pcmBuffer = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          pcmBuffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
        }

        // Enviar áudio para OpenAI Realtime
        if (isListeningRef.current) {
          wsConnection.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: arrayBufferToBase64(pcmBuffer.buffer)
          }));
        }
      };

      // Conectar os nós
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      console.log('✅ Sistema de áudio WebRTC inicializado');
      return true;

    } catch (error) {
      console.error('Erro ao inicializar sistema de áudio:', error);
      toast({
        title: "Erro no áudio",
        description: "Falha ao inicializar sistema de áudio",
        variant: "destructive",
      });
      return false;
    }
  }, [permissionsGranted, microphoneStream, wsConnection, toast, arrayBufferToBase64]);

  // Função para iniciar escuta
  const startListening = useCallback(() => {
    if (!wsConnection || !isConnected || !permissionsGranted || conversationState !== 'idle' || isListeningRef.current) {
      console.log('Condições não atendidas para iniciar escuta:', {
        hasWebSocket: !!wsConnection,
        isConnected,
        permissionsGranted,
        conversationState,
        isListening: isListeningRef.current
      });
      return;
    }

    try {
      isListeningRef.current = true;
      setConversationState('listening');
      console.log('🎤 Iniciando escuta com OpenAI Realtime...');

      // Sinalizar início da escuta para o servidor
      wsConnection.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));

    } catch (error) {
      console.error('Erro ao iniciar escuta:', error);
      isListeningRef.current = false;
      setConversationState('idle');
    }
  }, [wsConnection, isConnected, permissionsGranted, conversationState]);

  // Função para parar escuta
  const stopListening = useCallback(() => {
    if (!isListeningRef.current) return;

    isListeningRef.current = false;
    setConversationState('thinking');
    console.log('🔇 Parando escuta...');

    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
  }, [wsConnection]);

  // Função para reproduzir áudio delta
  const playAudioDelta = useCallback((deltaBase64: string) => {
    if (isMuted) return;

    try {
      // Decodificar base64 para ArrayBuffer
      const binaryString = atob(deltaBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (audioContextRef.current) {
        // Converter PCM16 para AudioBuffer e reproduzir
        const audioBuffer = audioContextRef.current.createBuffer(1, bytes.length / 2, 24000);
        const channelData = audioBuffer.getChannelData(0);
        
        const int16Array = new Int16Array(bytes.buffer);
        for (let i = 0; i < int16Array.length; i++) {
          channelData[i] = int16Array[i] / 32768;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio delta:', error);
    }
  }, [isMuted]);

  // Função para inicializar WebSocket da OpenAI Realtime
  const initializeRealtimeWebSocket = useCallback(async () => {
    try {
      // Obter token ephemeral da OpenAI
      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!tokenResponse.ok) {
        throw new Error(`Erro ao obter token: ${tokenResponse.status}`);
      }

      const { client_secret } = await tokenResponse.json();
      
      // Conectar ao WebSocket da OpenAI Realtime
      const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', [
        'realtime',
        `openai-insecure-api-key.${client_secret.value}`
      ]);

      ws.onopen = () => {
        console.log('✅ WebSocket conectado à OpenAI Realtime');
        
        // Configurar sessão
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Você é a Pro Versa, uma tutora virtual educacional brasileira. Seja amigável, educativa e responda em português. Mantenha as respostas concisas e didáticas.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📩 Mensagem WebSocket:', data.type);

        switch (data.type) {
          case 'conversation.item.input_audio_transcription.completed':
            if (data.transcript) {
              console.log('🗣️ Transcrição:', data.transcript);
              addMessage('user', data.transcript);
            }
            break;

          case 'response.audio.delta':
            // Reproduzir áudio da resposta
            if (data.delta) {
              playAudioDelta(data.delta);
            }
            break;

          case 'response.text.delta':
            // Atualizar texto da resposta
            if (data.delta) {
              console.log('📝 Texto da resposta:', data.delta);
            }
            break;

          case 'response.done':
            console.log('✅ Resposta concluída');
            setConversationState('idle');
            setTimeout(() => startListening(), 1000);
            break;

          case 'input_audio_buffer.speech_started':
            console.log('🎤 Início da fala detectado');
            setConversationState('listening');
            break;

          case 'input_audio_buffer.speech_stopped':
            console.log('🔇 Fim da fala detectado');
            setConversationState('thinking');
            break;

          case 'error':
            console.error('❌ Erro WebSocket:', data.error);
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
        toast({
          title: "Erro de conexão",
          description: "Falha na conexão com OpenAI Realtime",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket fechado');
        setWsConnection(null);
        setIsConnected(false);
        setConversationState('idle');
      };

      setWsConnection(ws);
      return true;

    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error);
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar à OpenAI Realtime",
        variant: "destructive",
      });
      return false;
    }
  }, [addMessage, startListening, toast, playAudioDelta]);

  // Função para conectar ao OpenAI Realtime
  const connectToRealtime = useCallback(async () => {
    if (!permissionsGranted) {
      toast({
        title: "Permissões necessárias",
        description: "Primeiro conceda acesso ao microfone e alto-falante",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnectionState('connecting');
      
      // Inicializar sistema de áudio
      const audioInitialized = await initializeAudioSystem();
      if (!audioInitialized) {
        throw new Error('Falha ao inicializar sistema de áudio');
      }

      // Inicializar WebSocket
      const wsInitialized = await initializeRealtimeWebSocket();
      if (!wsInitialized) {
        throw new Error('Falha ao conectar WebSocket');
      }

      setIsConnected(true);
      setConnectionState('connected');
      
      // Saudação inicial via texto
      const welcomeMessage = 'Oi! Eu sou a Pro Versa, sua tutora virtual com OpenAI Realtime. O que gostaria de aprender hoje?';
      addMessage('assistant', welcomeMessage);
      
      // Aguardar conexão WebSocket estar pronta
      setTimeout(() => {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          // Enviar mensagem inicial para o assistente
          wsConnection.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'assistant',
              content: [
                {
                  type: 'text',
                  text: welcomeMessage
                }
              ]
            }
          }));

          // Iniciar escuta
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      }, 2000);

      toast({
        title: "Pro Versa conectada!",
        description: "Sistema OpenAI Realtime ativo - pode falar!"
      });

    } catch (error) {
      console.error('Erro na conexão:', error);
      setConnectionState('error');
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar à Pro Versa",
        variant: "destructive",
      });
    }
  }, [permissionsGranted, initializeAudioSystem, initializeRealtimeWebSocket, addMessage, wsConnection, startListening, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pro Versa</h1>
          <p className="text-lg text-gray-600">Sua Tutora Virtual Inteligente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quadro virtual */}
          <div className="lg:col-span-2">
            <Card className="h-96 bg-green-800 border-8 border-amber-900 shadow-2xl relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-center text-xl">Quadro Virtual</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-green-700 h-full rounded-lg p-4 font-mono text-white text-sm whitespace-pre-wrap overflow-y-auto">
                  {blackboardContent || 'Aguardando conteúdo educacional...'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Painel de controle */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  Sistema de Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status de permissões */}
                {!permissionsGranted && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Permissões necessárias</p>
                        <p className="text-xs text-amber-600">Microfone e alto-falante são obrigatórios</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de conexão */}
                <div className="space-y-3">
                  {!isConnected ? (
                    <Button
                      onClick={connectToRealtime}
                      disabled={connectionState === 'connecting' || !permissionsGranted}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {connectionState === 'connecting' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-2" />
                          Conectar à Pro Versa
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsConnected(false);
                        setConnectionState('disconnected');
                        setConversationState('idle');
                        setRealtimeSession(null);
                        
                        if (wsConnection) {
                          wsConnection.close();
                          setWsConnection(null);
                        }
                        
                        if (audioContextRef.current) {
                          audioContextRef.current.close();
                          audioContextRef.current = null;
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      <PowerOff className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  )}
                </div>

                {/* Controle de áudio */}
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "default"}
                  className="w-full"
                  disabled={!isConnected}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Som Desligado
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Som Ligado
                    </>
                  )}
                </Button>

                {/* Botão manual para escutar */}
                <Button
                  onClick={startListening}
                  variant="outline"
                  className="w-full"
                  disabled={!isConnected || !permissionsGranted || conversationState !== 'idle'}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {conversationState === 'listening' ? 'Escutando...' : 'Clique para Falar'}
                </Button>

                {/* Status */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Status do Sistema:</p>
                  <div className="space-y-1 text-xs">
                    <p className={`${permissionsGranted ? 'text-green-600' : 'text-red-600'}`}>
                      🎛️ Permissões: {permissionsGranted ? 'Concedidas' : 'Negadas'}
                    </p>
                    <p className={`${connectionState === 'connected' ? 'text-green-600' : 'text-gray-500'}`}>
                      🔗 Conexão: {connectionState === 'connected' ? 'Conectada' : 'Desconectada'}
                    </p>
                    <p className={`${conversationState === 'listening' ? 'text-blue-600' : 'text-gray-500'}`}>
                      🎤 Microfone: {conversationState === 'listening' ? 'Ativo' : 'Inativo'}
                    </p>
                    <p className={`${conversationState === 'speaking' ? 'text-purple-600' : 'text-gray-500'}`}>
                      🔊 Síntese: {conversationState === 'speaking' ? 'Falando' : 'Silenciosa'}
                    </p>
                  </div>
                </div>

                {/* Estado da conversa */}
                <div className="flex justify-center">
                  <Badge variant={
                    conversationState === 'listening' ? 'default' :
                    conversationState === 'thinking' ? 'secondary' :
                    conversationState === 'speaking' ? 'destructive' : 'outline'
                  }>
                    {conversationState === 'listening' && '🎤 Escutando'}
                    {conversationState === 'thinking' && '🤔 Pensando'}
                    {conversationState === 'speaking' && '🗣️ Falando'}
                    {conversationState === 'idle' && '💤 Aguardando'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de conversas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Conversas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messages.slice(-5).map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg text-xs ${
                        message.type === 'user'
                          ? 'bg-blue-100 text-blue-800 ml-4'
                          : 'bg-green-100 text-green-800 mr-4'
                      }`}
                    >
                      <p className="font-medium">
                        {message.type === 'user' ? 'Você' : 'Pro Versa'}
                      </p>
                      <p>{message.content.substring(0, 100)}...</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-gray-500 text-xs text-center py-4">
                      Nenhuma conversa ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
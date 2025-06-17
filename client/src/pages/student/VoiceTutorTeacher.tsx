import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Power, PowerOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tipos
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
  const [elevenLabsSession, setElevenLabsSession] = useState<any>(null);
  const [useElevenLabsSpeech, setUseElevenLabsSpeech] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [microphoneStream, setMicrophoneStream] = useState<MediaStream | null>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Função para filtrar conteúdo educacional para a lousa
  const filterContentForBlackboard = (text: string): string => {
    const lines = text.split('\n');
    const educationalLines: string[] = [];
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      
      // Incluir fórmulas, definições, exemplos e conceitos
      if (cleanLine.includes('=') || 
          cleanLine.includes('→') || 
          cleanLine.includes('×') || 
          cleanLine.includes('÷') ||
          cleanLine.includes(':') ||
          cleanLine.toLowerCase().includes('exemplo') ||
          cleanLine.toLowerCase().includes('fórmula') ||
          cleanLine.toLowerCase().includes('definição') ||
          cleanLine.toLowerCase().includes('conceito') ||
          /^\d+\./.test(cleanLine) ||
          cleanLine.includes('•') ||
          cleanLine.includes('-')) {
        educationalLines.push(cleanLine);
      }
    });
    
    return educationalLines.join('\n').trim();
  };

  // Função para inicializar reconhecimento de voz nativo
  const initializeSpeechRecognition = useCallback(async () => {
    if (!permissionsGranted) {
      console.error('Permissões de áudio não concedidas');
      toast({
        title: "Permissões necessárias",
        description: "Conceda acesso ao microfone para usar a Pro Versa",
        variant: "destructive",
      });
      return false;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Reconhecimento de voz não suportado');
      toast({
        title: "Navegador não suportado",
        description: "Use Chrome, Edge ou Safari para reconhecimento de voz",
        variant: "destructive",
      });
      return false;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Reconhecimento ativo');
        setConversationState('listening');
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log('🗣️ Fala reconhecida:', transcript);
        
        if (transcript && transcript.length > 2) {
          setConversationState('thinking');
          processUserInput(transcript);
        } else {
          console.log('Transcrição muito curta, tentando novamente...');
          setTimeout(() => startListening(), 1000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento:', event.error);
        setConversationState('idle');
        isListeningRef.current = false;
        
        switch (event.error) {
          case 'not-allowed':
            setPermissionsGranted(false);
            toast({
              title: "Permissão negada",
              description: "Recarregue a página e permita acesso ao microfone",
              variant: "destructive",
            });
            break;
          case 'no-speech':
            console.log('Nenhuma fala detectada, tentando novamente...');
            setTimeout(() => startListening(), 2000);
            break;
          case 'network':
            console.log('Erro de rede, tentando novamente...');
            setTimeout(() => startListening(), 3000);
            break;
          case 'audio-capture':
            console.log('Erro de captura de áudio, tentando novamente...');
            setTimeout(() => startListening(), 2000);
            break;
          default:
            console.log('Erro desconhecido, tentando novamente...');
            setTimeout(() => startListening(), 3000);
        }
      };

      recognition.onend = () => {
        console.log('🔇 Reconhecimento finalizado');
        isListeningRef.current = false;
        setConversationState('idle');
      };

      recognitionRef.current = recognition;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar reconhecimento:', error);
      toast({
        title: "Erro no reconhecimento",
        description: "Falha ao inicializar sistema de voz",
        variant: "destructive",
      });
      return false;
    }
  }, [permissionsGranted, isConnected, conversationState, toast]);

  // Função para iniciar escuta
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isConnected || !permissionsGranted || conversationState !== 'idle' || isListeningRef.current) {
      console.log('Condições não atendidas para iniciar escuta:', {
        hasRecognition: !!recognitionRef.current,
        isConnected,
        permissionsGranted,
        conversationState,
        isListening: isListeningRef.current
      });
      return;
    }

    try {
      recognitionRef.current.start();
      console.log('🎤 Iniciando escuta...');
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already started')) {
        console.log('Reconhecimento já em andamento');
        return;
      }
      console.error('Erro ao iniciar reconhecimento:', error);
      setTimeout(() => startListening(), 2000);
    }
  }, [recognitionRef, isConnected, permissionsGranted, conversationState]);

  // Função para reiniciar reconhecimento
  const restartRecognition = useCallback(() => {
    setTimeout(() => {
      startListening();
    }, 500);
  }, [startListening]);

  // Função para processar entrada do usuário
  const processUserInput = useCallback(async (transcript: string) => {
    if (!transcript.trim()) {
      startListening();
      return;
    }

    console.log('👤 Processando:', transcript);
    setConversationState('thinking');
    isListeningRef.current = false;
    
    addMessage('user', transcript);

    try {
      const response = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: transcript,
          context: 'voice_tutor',
          chatHistory: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        const tutorResponse = data.response;
        
        console.log('🤖 Resposta da Pro Versa recebida');
        
        const filteredContent = filterContentForBlackboard(tutorResponse);
        if (filteredContent.trim()) {
          setBlackboardContent(filteredContent);
        }
        
        addMessage('assistant', tutorResponse);
        
        if (elevenLabsSession) {
          await synthesizeSpeech(tutorResponse);
        } else {
          setConversationState('idle');
          setTimeout(() => startListening(), 1000);
        }
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao processar pergunta:', error);
      const errorMessage = 'Desculpe, tive um problema técnico. Pode repetir sua pergunta?';
      addMessage('assistant', errorMessage);
      
      if (elevenLabsSession) {
        await synthesizeSpeech(errorMessage);
      } else {
        setConversationState('idle');
        setTimeout(() => startListening(), 2000);
      }
    }
  }, [addMessage, messages, elevenLabsSession, startListening]);

  // Função para sintetizar fala
  const synthesizeSpeech = useCallback(async (text: string) => {
    if (!elevenLabsSession) return;

    try {
      setConversationState('speaking');
      console.log('🔊 Sintetizando fala...');
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsSession.voiceId}?output_format=mp3_44100_128&optimize_streaming_latency=2`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsSession.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: elevenLabsSession.model || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          },
          apply_text_normalization: 'auto'
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onended = () => {
          console.log('🎵 Áudio finalizado');
          setConversationState('idle');
          setTimeout(() => startListening(), 800);
        };
        
        audioRef.current.onerror = (error) => {
          console.error('Erro na reprodução:', error);
          setConversationState('idle');
          setTimeout(() => startListening(), 1500);
        };
        
        if (!isMuted) {
          await audioRef.current.play();
          console.log('🔊 Áudio reproduzindo');
        } else {
          setConversationState('idle');
          setTimeout(() => startListening(), 500);
        }
      } else {
        throw new Error(`Erro na síntese: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na síntese de fala:', error);
      setConversationState('idle');
      setTimeout(() => startListening(), 1000);
    }
  }, [elevenLabsSession, isMuted, startListening]);

  // Função para conectar
  const connectToElevenLabs = useCallback(async () => {
    try {
      setConnectionState('connecting');
      console.log('🔄 Conectando...');

      // Verificar permissões de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Permissões de microfone OK');

      // Obter sessão ElevenLabs
      const response = await fetch('/api/elevenlabs/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentInfo: { schoolYear: '8º ano' }
        })
      });

      if (!response.ok) {
        throw new Error(`Falha ao obter sessão: ${response.status}`);
      }

      const sessionData = await response.json();
      console.log('✅ Sessão ElevenLabs configurada');

      setElevenLabsSession(sessionData);
      setIsConnected(true);
      setConnectionState('connected');

      // Inicializar reconhecimento
      const speechInitialized = await initializeSpeechRecognition();
      if (speechInitialized) {
        console.log('✅ Reconhecimento de voz inicializado');
        
        // Saudação inicial
        const welcomeMessage = `Oi! Eu sou a Pro Versa, sua tutora virtual. O que gostaria de aprender hoje?`;
        addMessage('assistant', welcomeMessage);
        
        // Reproduzir saudação e iniciar reconhecimento
        setTimeout(async () => {
          await synthesizeSpeech(welcomeMessage);
          
          // Iniciar reconhecimento após saudação
          setTimeout(() => {
            startListening();
          }, 1000);
        }, 1000);
        
        toast({
          title: "Pro Versa conectada!",
          description: "Sistema de voz ativo - pode falar!"
        });
      } else {
        throw new Error('Falha ao inicializar reconhecimento de voz');
      }

    } catch (error) {
      console.error('Erro na conexão:', error);
      setConnectionState('error');
      setIsConnected(false);
      toast({
        title: "Erro de conexão",
        description: "Falha ao conectar com o sistema de voz",
        variant: "destructive"
      });
    }
  }, [initializeSpeechRecognition, addMessage, synthesizeSpeech, toast]);

  // Função para desconectar
  const disconnect = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setConnectionState('disconnected');
    setConversationState('idle');
    setIsConnected(false);
    setElevenLabsSession(null);
    isListeningRef.current = false;
    
    toast({
      title: "Desconectado",
      description: "Pro Versa foi desconectada"
    });
  }, [toast]);

  // Status indicators
  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <Badge className="bg-green-500">Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500">Conectando...</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  const getConversationBadge = () => {
    switch (conversationState) {
      case 'listening':
        return <Badge className="bg-blue-500 animate-pulse">🎤 Ouvindo</Badge>;
      case 'thinking':
        return <Badge className="bg-purple-500">🤔 Pensando</Badge>;
      case 'speaking':
        return <Badge className="bg-orange-500">🗣️ Falando</Badge>;
      default:
        return <Badge variant="outline">💤 Aguardando</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Pro Versa - Tutora Virtual</h1>
          <div className="flex items-center gap-4">
            {getConnectionBadge()}
            {getConversationBadge()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Controles de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botão de conexão */}
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button 
                    onClick={connectToElevenLabs}
                    disabled={connectionState === 'connecting'}
                    className="flex-1"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {connectionState === 'connecting' ? 'Conectando...' : 'Conectar'}
                  </Button>
                ) : (
                  <Button 
                    onClick={disconnect}
                    variant="destructive"
                    className="flex-1"
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
                <p className="text-xs text-gray-600 mt-1">
                  {conversationState === 'listening' && 'Fale agora! Estou ouvindo...'}
                  {conversationState === 'thinking' && 'Processando sua pergunta...'}
                  {conversationState === 'speaking' && 'Reproduzindo resposta...'}
                  {conversationState === 'idle' && isConnected && 'Pronto para conversar!'}
                  {!isConnected && 'Clique em "Conectar" para começar'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lousa Virtual */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-green-800">📚 Lousa Virtual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-900 text-white p-6 rounded-lg min-h-[400px] font-mono">
                <div className="whitespace-pre-wrap">
                  {blackboardContent || 'A Pro Versa explicará conceitos aqui na lousa virtual...'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico da Conversa */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>💬 Conversa com a Pro Versa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Conecte-se e comece a conversar com a Pro Versa!
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.type === 'user' ? 'Você' : 'Pro Versa'}
                      </p>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
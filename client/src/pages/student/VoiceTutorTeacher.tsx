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
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Refs para reconhecimento de voz e síntese
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);

  const { toast } = useToast();

  // Solicitar permissões de microfone ao carregar a página
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('🎤 Solicitando permissões de áudio...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        console.log('✅ Permissão do microfone concedida');
        stream.getTracks().forEach(track => track.stop()); // Parar stream inicial
        setPermissionsGranted(true);
        
        toast({
          title: "Permissões concedidas",
          description: "Microfone autorizado para uso",
        });
        
      } catch (error) {
        console.error('❌ Erro ao solicitar permissões:', error);
        setPermissionsGranted(false);
        
        toast({
          title: "Permissões necessárias",
          description: "A Pro Versa precisa de acesso ao microfone para funcionar",
          variant: "destructive",
        });
      }
    };

    requestPermissions();
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

    // Atualizar quadro se for conteúdo educacional
    if (type === 'assistant') {
      const educationalContent = filterContentForBlackboard(content);
      if (educationalContent) {
        setBlackboardContent(prev => prev + '\n' + educationalContent);
      }
    }
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

  // Função para inicializar reconhecimento de voz
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Reconhecimento de voz não suportado');
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive",
      });
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'pt-BR';
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log('🎤 Reconhecimento iniciado');
      setConversationState('listening');
      isListeningRef.current = true;
    };

    recognitionRef.current.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      
      if (transcript) {
        console.log('🗣️ Texto reconhecido:', transcript);
        addMessage('user', transcript);
        
        setConversationState('thinking');
        
        // Enviar para IA e processar resposta
        try {
          const response = await fetch('/api/ai/tutor-chat', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: transcript,
              context: 'voice_tutor'
            })
          });

          if (response.ok) {
            const data = await response.json();
            addMessage('assistant', data.response);
            
            // Sintetizar resposta
            if (!isMuted) {
              await synthesizeSpeech(data.response);
            } else {
              setConversationState('idle');
              setTimeout(() => startListening(), 1000);
            }
          } else {
            throw new Error('Erro na resposta da IA');
          }
        } catch (error) {
          console.error('Erro ao processar resposta:', error);
          setConversationState('idle');
          setTimeout(() => startListening(), 2000);
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Erro no reconhecimento:', event.error);
      setConversationState('idle');
      isListeningRef.current = false;
      
      setTimeout(() => {
        if (isConnected) {
          startListening();
        }
      }, 2000);
    };

    recognitionRef.current.onend = () => {
      console.log('🔇 Reconhecimento finalizado');
      isListeningRef.current = false;
      
      if (conversationState === 'listening' && isConnected) {
        setTimeout(() => startListening(), 1000);
      }
    };

    return true;
  }, [addMessage, conversationState, isConnected, isMuted, toast]);

  // Função para iniciar escuta
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isConnected || !permissionsGranted || isListeningRef.current) {
      return;
    }

    try {
      recognitionRef.current.start();
      console.log('🎤 Iniciando escuta...');
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
    }
  }, [isConnected, permissionsGranted]);

  // Função para parar escuta
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setConversationState('idle');
    }
  }, []);

  // Função para sintetizar fala
  const synthesizeSpeech = useCallback(async (text: string) => {
    if (isMuted || !text) return;

    try {
      setConversationState('speaking');
      console.log('🔊 Sintetizando fala...');
      
      // Usar Speech Synthesis API nativa
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Tentar encontrar uma voz em português
      const voices = speechSynthesis.getVoices();
      const portugueseVoice = voices.find(voice => voice.lang.includes('pt'));
      if (portugueseVoice) {
        utterance.voice = portugueseVoice;
      }

      utterance.onend = () => {
        console.log('🎵 Síntese finalizada');
        setConversationState('idle');
        setTimeout(() => startListening(), 1000);
      };

      utterance.onerror = (error) => {
        console.error('Erro na síntese:', error);
        setConversationState('idle');
        setTimeout(() => startListening(), 1500);
      };

      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Erro na síntese de fala:', error);
      setConversationState('idle');
      setTimeout(() => startListening(), 1000);
    }
  }, [isMuted, startListening]);

  // Função para conectar
  const connectToSystem = useCallback(async () => {
    if (!permissionsGranted) {
      toast({
        title: "Permissões necessárias",
        description: "Primeiro conceda acesso ao microfone",
        variant: "destructive",
      });
      return;
    }

    try {
      setConnectionState('connecting');
      console.log('🔄 Conectando...');

      // Inicializar reconhecimento de voz
      const speechInitialized = initializeSpeechRecognition();
      if (!speechInitialized) {
        throw new Error('Falha ao inicializar reconhecimento de voz');
      }

      // Aguardar carregamento das vozes
      if (speechSynthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          speechSynthesis.onvoiceschanged = resolve;
          setTimeout(resolve, 1000); // Fallback timeout
        });
      }

      setIsConnected(true);
      setConnectionState('connected');
      
      // Saudação inicial
      const welcomeMessage = 'Oi! Eu sou a Pro Versa, sua tutora virtual. O que gostaria de aprender hoje?';
      addMessage('assistant', welcomeMessage);
      
      setTimeout(async () => {
        await synthesizeSpeech(welcomeMessage);
      }, 1000);
      
      toast({
        title: "Pro Versa conectada!",
        description: "Sistema de voz ativo - pode falar!"
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
  }, [permissionsGranted, initializeSpeechRecognition, addMessage, synthesizeSpeech, toast]);

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

    speechSynthesis.cancel();
    
    setConnectionState('disconnected');
    setConversationState('idle');
    setIsConnected(false);
    isListeningRef.current = false;
    
    toast({
      title: "Desconectado",
      description: "Pro Versa foi desconectada"
    });
  }, [toast]);

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
                        <p className="text-xs text-amber-600">Microfone é obrigatório</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de conexão */}
                <div className="space-y-3">
                  {!isConnected ? (
                    <Button
                      onClick={connectToSystem}
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
                      onClick={disconnect}
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
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play, Activity, BookOpen, Brain, MessageSquare } from 'lucide-react';

// Interfaces
interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  format: 'text' | 'audio';
  blackboardData?: BlackboardContent;
}

interface BlackboardContent {
  type: 'text' | 'diagram' | 'exercise' | 'mindmap' | 'equation' | 'drawing';
  content: any;
  animate?: boolean;
}

interface BlackboardElement {
  id: string;
  type: string;
  content: any;
  position: { x: number; y: number };
  animate: boolean;
  timestamp: number;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';

export default function VoiceTutorTeacher() {
  // Estados principais
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [boardContent, setBoardContent] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { toast } = useToast();

  // Função para filtrar conteúdo educativo
  const filterEducationalContent = (text: string): string => {
    const lines = text.split('\n');
    const educationalLines = lines.filter(line => {
      const cleanLine = line.trim().toLowerCase();
      
      // Remover linhas conversacionais comuns
      const conversationalPhrases = [
        'vou explicar', 'deixe-me explicar', 'vou te mostrar',
        'agora vou', 'primeiro', 'então', 'assim', 'portanto',
        'bem', 'ok', 'certo', 'perfeito', 'ótimo', 'entendi',
        'você pode', 'vamos ver', 'observe que', 'note que',
        'é importante', 'lembre-se', 'não esqueça'
      ];
      
      const isConversational = conversationalPhrases.some(phrase => 
        cleanLine.includes(phrase) && line.length < 100
      );
      
      if (isConversational) return false;
      
      // Manter conteúdo educativo específico
      const educationalPatterns = [
        /^\d+[\.\)]/, // Listas numeradas
        /^[a-z]\)/, // Listas alfabéticas
        /^[-•*]/, // Bullet points
        /=/, // Equações
        /[A-Z][a-z]*:\s/, // Definições
        /^\w+\s*[=:]/, // Fórmulas
        /exemplo/i,
        /definição/i,
        /fórmula/i,
        /conceito/i,
        /propriedade/i,
        /característica/i,
        /\b[A-Z]{2,}\b/, // Siglas
        /\d+%/, // Percentuais
        /\d+[°℃℉]/, // Temperaturas/graus
        /[≤≥<>±∑∆√π]/ // Símbolos matemáticos
      ];
      
      return educationalPatterns.some(pattern => pattern.test(line)) || 
             (line.length > 20 && line.includes(':')) ||
             /^[A-Z]/.test(line.trim()) && line.length > 30;
    });
    
    return educationalLines.join('\n').trim();
  };

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

  // Função para conectar ao ElevenLabs
  const connectToElevenLabs = useCallback(async () => {
    try {
      setConnectionState('connecting');

      // Obter sessão ElevenLabs do servidor
      const response = await fetch('/api/elevenlabs/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentInfo: {
            schoolYear: '8º ano'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao obter sessão ElevenLabs');
      }

      const sessionInfo = await response.json();
      setSessionData(sessionInfo);

      // Configurar reconhecimento de voz
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          console.log('Transcrição:', transcript);
          
          addMessage('user', transcript, 'text');
          setConversationState('thinking');
          
          // Processar entrada do usuário
          processUserInput(transcript, sessionInfo);
        };

        recognition.onerror = (event: any) => {
          console.error('Erro no reconhecimento:', event.error);
          setConversationState('idle');
        };

        recognition.onend = () => {
          if (isConnected && conversationState === 'idle') {
            setTimeout(() => {
              recognition.start();
            }, 1000);
          }
        };

        recognitionRef.current = recognition;
      }

      setConnectionState('connected');
      setIsConnected(true);
      setConversationState('idle');

      // Saudação inicial
      const greeting = 'Oi! Eu sou a Pro Versa, sua tutora virtual. O que gostaria de aprender hoje?';
      addMessage('assistant', greeting, 'audio');
      setBoardContent('Bem-vindo à Aula Interativa!\n\nFaça sua pergunta e vou explicar na lousa!');

      // Reproduzir saudação
      await synthesizeSpeech(greeting, sessionInfo);

      // Iniciar reconhecimento
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      toast({
        title: "Pro Versa conectada!",
        description: "Sistema de voz ElevenLabs ativo!"
      });

    } catch (error) {
      console.error('Erro ao conectar:', error);
      setConnectionState('error');
      toast({
        title: "Erro de conexão",
        description: "Falha ao conectar com ElevenLabs",
        variant: "destructive"
      });
    }
  }, [isConnected, conversationState, addMessage, toast]);

  // Função para processar entrada do usuário
  const processUserInput = async (transcript: string, sessionInfo: any) => {
    try {
      // Parar reconhecimento temporariamente
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Limpar lousa para nova pergunta
      if (transcript.includes('?') || 
          transcript.toLowerCase().includes('explica') ||
          transcript.toLowerCase().includes('como') ||
          transcript.toLowerCase().includes('que é') ||
          transcript.toLowerCase().includes('outra') ||
          transcript.toLowerCase().includes('nova')) {
        setBoardContent('');
      }

      // Enviar para IA para gerar resposta
      const response = await fetch('/api/ai/tutor-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: transcript,
          studentGrade: sessionInfo.studentInfo?.schoolYear || '8º ano',
          chatHistory: messages.slice(-5)
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.response;
        
        // Filtrar conteúdo educativo para a lousa
        const filteredContent = filterEducationalContent(aiResponse);
        if (filteredContent && filteredContent.length > 0) {
          setBoardContent(filteredContent);
        }
        
        // Adicionar mensagem à conversa
        addMessage('assistant', aiResponse, 'audio');
        
        // Sintetizar fala
        await synthesizeSpeech(aiResponse, sessionInfo);
      } else {
        throw new Error('Falha na resposta da IA');
      }
    } catch (error) {
      console.error('Erro ao processar entrada:', error);
      setConversationState('idle');
      
      // Reiniciar reconhecimento em caso de erro
      if (recognitionRef.current && isConnected) {
        setTimeout(() => {
          recognitionRef.current.start();
        }, 2000);
      }
    }
  };

  // Função para sintetizar fala com ElevenLabs
  const synthesizeSpeech = async (text: string, sessionInfo: any) => {
    try {
      setConversationState('speaking');
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${sessionInfo.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': sessionInfo.apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: sessionInfo.model,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
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
          setConversationState('idle');
          // Reiniciar reconhecimento após fala
          if (recognitionRef.current && isConnected) {
            setTimeout(() => {
              recognitionRef.current.start();
            }, 500);
          }
        };
        
        audioRef.current.onerror = () => {
          console.error('Erro na reprodução do áudio');
          setConversationState('idle');
        };
        
        if (!isMuted) {
          await audioRef.current.play();
        } else {
          setConversationState('idle');
        }
      } else {
        throw new Error('Falha na síntese de fala');
      }
    } catch (error) {
      console.error('Erro na síntese de fala:', error);
      setConversationState('idle');
    }
  };

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
    setIsConnected(false);
    setConversationState('idle');
    setMessages([]);
    setBoardContent('');
    
    toast({
      title: "Desconectado",
      description: "Sessão de tutoria encerrada"
    });
  }, [toast]);

  // Função para alternar mudo
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (audioRef.current && conversationState === 'speaking') {
      if (isMuted) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted, conversationState]);

  // Formatação de tempo
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Status do sistema
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConversationIcon = () => {
    switch (conversationState) {
      case 'listening': return <Mic className="w-4 h-4 text-blue-500" />;
      case 'thinking': return <Brain className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'speaking': return <Volume2 className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Pro Versa - Tutora Virtual
              </h1>
              <p className="text-gray-600">
                Sistema de tutoria inteligente com voz e lousa interativa
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
                <span className="text-sm font-medium capitalize text-gray-700">
                  {connectionState}
                </span>
              </div>
              <Badge variant="outline" className="flex items-center gap-2">
                {getConversationIcon()}
                <span className="capitalize">{conversationState}</span>
              </Badge>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            <Button
              onClick={isConnected ? disconnect : connectToElevenLabs}
              disabled={connectionState === 'connecting'}
              className={`px-6 ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              }`}
            >
              {connectionState === 'connecting' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              )}
              {isConnected ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Encerrar Tutoria
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Iniciar Tutoria
                </>
              )}
            </Button>

            {isConnected && (
              <Button
                onClick={toggleMute}
                variant="outline"
                className="px-4"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lousa Virtual */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Lousa Interativa
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-b-lg relative overflow-hidden">
                    {/* Grid da lousa */}
                    <div 
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `
                          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}
                    />
                    
                    {/* Conteúdo da lousa */}
                    <ScrollArea className="h-full p-6">
                      {boardContent ? (
                        <div className="text-white space-y-4">
                          {boardContent.split('\n').map((line, index) => (
                            <div
                              key={index}
                              className="animate-fade-in font-mono text-lg leading-relaxed"
                              style={{
                                animationDelay: `${index * 0.1}s`,
                                textShadow: '0 0 10px rgba(255,255,255,0.3)'
                              }}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-400">
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl font-medium mb-2">
                              Lousa Vazia
                            </p>
                            <p className="text-sm">
                              Faça uma pergunta para ver a explicação aqui
                            </p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat de Conversas */}
            <div className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                              message.type === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm mb-1">{message.content}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs opacity-70">
                                {formatMessageTime(message.timestamp)}
                              </span>
                              {message.format === 'audio' && (
                                <Volume2 className="w-3 h-3 opacity-70" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!isConnected && (
          <Card className="max-w-2xl mx-auto text-center shadow-lg">
            <CardContent className="py-12">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Bem-vindo à Pro Versa
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Sua tutora virtual com inteligência artificial. 
                  Converse por voz e veja explicações interativas na lousa.
                </p>
              </div>

              <div className="space-y-4 text-left max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fale naturalmente</h3>
                    <p className="text-sm text-gray-600">
                      Faça perguntas sobre qualquer matéria escolar
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Veja na lousa</h3>
                    <p className="text-sm text-gray-600">
                      Explicações visuais aparecem automaticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ouça a resposta</h3>
                    <p className="text-sm text-gray-600">
                      Pro Versa explica tudo com voz natural
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Estilos para animações */}
      <style>
        {`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
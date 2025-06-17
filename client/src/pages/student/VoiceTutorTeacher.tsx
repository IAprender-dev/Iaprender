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

  // Função para filtrar apenas exemplos e conteúdo educativo específico
  const filterEducationalContent = (text: string): string => {
    const lines = text.split('\n');
    const educationalLines = lines.filter(line => {
      const cleanLine = line.trim().toLowerCase();
      
      // Pular linhas vazias ou muito curtas
      if (!cleanLine || cleanLine.length < 5) return false;
      
      // Remover linhas conversacionais e introdutórias
      const conversationalPhrases = [
        'vou explicar', 'deixe-me explicar', 'vou te mostrar', 'vou demonstrar',
        'agora vou', 'primeiro', 'então', 'assim', 'portanto', 'dessa forma',
        'bem', 'ok', 'certo', 'perfeito', 'ótimo', 'entendi', 'muito bem',
        'você pode', 'vamos ver', 'observe que', 'note que', 'repare que',
        'é importante', 'lembre-se', 'não esqueça', 'sempre', 'nunca se esqueça',
        'para você', 'como você', 'se você', 'quando você', 'caso você',
        'gisele', 'olha', 'veja', 'perceba', 'imagine', 'pense', 'considere',
        'isso significa', 'ou seja', 'isto é', 'em outras palavras',
        'basicamente', 'resumindo', 'concluindo', 'finalizando'
      ];
      
      const isConversational = conversationalPhrases.some(phrase => 
        cleanLine.includes(phrase)
      );
      
      if (isConversational) return false;
      
      // Manter apenas exemplos, fórmulas, definições e conteúdo específico
      const educationalPatterns = [
        /^exemplo/i, // Exemplos
        /^\d+[\.\)]/, // Listas numeradas
        /^[a-z]\)/, // Listas alfabéticas  
        /^[-•*]/, // Bullet points
        /=/, // Equações e fórmulas
        /[A-Z][a-z]*:\s/, // Definições com dois pontos
        /^\w+\s*[=:]/, // Fórmulas matemáticas
        /definição/i, // Definições
        /fórmula/i, // Fórmulas
        /conceito/i, // Conceitos
        /propriedade/i, // Propriedades
        /característica/i, // Características
        /\b[A-Z]{2,}\b/, // Siglas e abreviações
        /\d+%/, // Percentuais
        /\d+[°℃℉]/, // Temperaturas/graus
        /[≤≥<>±∑∆√π∞]/, // Símbolos matemáticos
        /resultado/i, // Resultados
        /solução/i, // Soluções
        /resposta/i, // Respostas
        /aplicação/i, // Aplicações práticas
        /^[A-Z][^.!?]*[=:]/, // Títulos com dois pontos
        /^\d+\.?\s*[A-Z]/ // Itens numerados
      ];
      
      // Verificar se contém padrões educativos
      const hasEducationalPattern = educationalPatterns.some(pattern => pattern.test(line));
      
      // Manter linhas que são claramente conteúdo educativo ou exemplos
      const isEducationalContent = hasEducationalPattern || 
                                  (line.includes(':') && line.length > 15) ||
                                  (line.includes('=') && line.length > 10) ||
                                  (/^[A-Z]/.test(line.trim()) && line.length > 25 && !isConversational);
      
      return isEducationalContent;
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
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          console.log('🎤 Transcrição recebida:', transcript);
          
          if (transcript.length > 2) { // Evitar transcrições muito curtas
            addMessage('user', transcript, 'text');
            setConversationState('thinking');
            
            // Processar entrada do usuário
            processUserInput(transcript, sessionInfo);
          } else {
            console.log('Transcrição muito curta, ignorando:', transcript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Erro no reconhecimento:', event.error);
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Permissão de microfone negada",
              description: "Por favor, permita o acesso ao microfone para usar a Pro Versa",
              variant: "destructive",
            });
          } else if (event.error === 'no-speech') {
            console.log('Nenhuma fala detectada, tentando novamente...');
            // Não fazer nada, deixar o onend reiniciar
          } else {
            console.log('Tentando reiniciar após erro...');
          }
          
          setConversationState('idle');
        };

        recognition.onstart = () => {
          console.log('🎤 Reconhecimento iniciado - Pro Versa está ouvindo');
          setConversationState('listening');
        };

        recognition.onend = () => {
          console.log('🎤 Reconhecimento encerrado, estado atual:', conversationState);
          
          // Só reiniciar se não estiver processando ou falando
          if (isConnected && conversationState !== 'speaking' && conversationState !== 'thinking') {
            console.log('🔄 Preparando para reiniciar reconhecimento...');
            setTimeout(() => {
              try {
                if (recognitionRef.current && isConnected) {
                  recognition.start();
                  console.log('✅ Reconhecimento reiniciado');
                }
              } catch (error) {
                console.error('❌ Erro ao reiniciar reconhecimento:', error);
              }
            }, 1500);
          } else {
            console.log('⏸️ Aguardando para reiniciar (estado:', conversationState, ')');
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

      // Iniciar reconhecimento após um breve delay
      setTimeout(() => {
        if (recognitionRef.current && isConnected) {
          try {
            recognitionRef.current.start();
            console.log('🎤 Reconhecimento inicial iniciado');
          } catch (error) {
            console.error('❌ Erro ao iniciar reconhecimento inicial:', error);
            toast({
              title: "Erro no microfone",
              description: "Não foi possível iniciar o reconhecimento de voz. Verifique as permissões.",
              variant: "destructive",
            });
          }
        }
      }, 2000);

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
          console.log('Áudio terminou, reiniciando reconhecimento');
          setConversationState('idle');
          // Reiniciar reconhecimento após fala
          if (recognitionRef.current && isConnected) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                console.log('Reconhecimento reiniciado após áudio');
              } catch (error) {
                console.error('Erro ao reiniciar após áudio:', error);
              }
            }, 500);
          }
        };
        
        audioRef.current.onerror = (error) => {
          console.error('Erro na reprodução do áudio:', error);
          setConversationState('idle');
          // Tentar reiniciar reconhecimento mesmo com erro
          if (recognitionRef.current && isConnected) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Erro ao reiniciar após erro de áudio:', e);
              }
            }, 1000);
          }
        };
        
        if (!isMuted) {
          console.log('Reproduzindo áudio...');
          try {
            await audioRef.current.play();
          } catch (playError) {
            console.error('Erro ao reproduzir áudio:', playError);
            setConversationState('idle');
            // Reiniciar reconhecimento se falhar reprodução
            if (recognitionRef.current && isConnected) {
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.error('Erro ao reiniciar após falha de reprodução:', e);
                }
              }, 500);
            }
          }
        } else {
          console.log('Áudio silenciado');
          setConversationState('idle');
          // Reiniciar reconhecimento imediatamente se mudo
          if (recognitionRef.current && isConnected) {
            setTimeout(() => {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error('Erro ao reiniciar no modo mudo:', e);
              }
            }, 500);
          }
        }
      } else {
        console.error('Erro na API ElevenLabs:', response.status, response.statusText);
        throw new Error(`Falha na síntese de fala: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na síntese de fala:', error);
      setConversationState('idle');
      // Reiniciar reconhecimento em caso de erro
      if (recognitionRef.current && isConnected) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            console.log('Reconhecimento reiniciado após erro de síntese');
          } catch (e) {
            console.error('Erro ao reiniciar após erro de síntese:', e);
          }
        }, 1000);
      }
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
                <span className="capitalize">
                  {conversationState === 'listening' ? 'Ouvindo você...' : 
                   conversationState === 'thinking' ? 'Processando...' :
                   conversationState === 'speaking' ? 'Pro Versa falando' : 
                   'Aguardando'}
                </span>
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
              <Card className="h-[600px] shadow-xl border-4 border-gray-800">
                <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg py-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5" />
                    Lousa Interativa - Pro Versa
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <div 
                    className="h-full rounded-b-lg relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #1a4d3a 0%, #2d6b4f 50%, #1a4d3a 100%)',
                      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Textura da lousa */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: `
                          radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px),
                          radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px),
                          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px, 30px 30px, 20px 20px, 20px 20px'
                      }}
                    />
                    
                    {/* Borda interna da lousa */}
                    <div className="absolute inset-4 border-2 border-white border-opacity-20 rounded-lg"></div>
                    
                    {/* Conteúdo da lousa */}
                    <ScrollArea className="h-full p-8">
                      {boardContent ? (
                        <div className="text-white space-y-6">
                          {boardContent.split('\n').map((line, index) => (
                            <div
                              key={index}
                              className="animate-fade-in font-mono text-xl leading-relaxed tracking-wide"
                              style={{
                                animationDelay: `${index * 0.2}s`,
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(255,255,255,0.3)',
                                fontFamily: 'monospace, Courier New'
                              }}
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-white text-opacity-70">
                            <BookOpen className="w-20 h-20 mx-auto mb-6 opacity-60" />
                            <p className="text-2xl font-medium mb-3 font-mono" style={{
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                            }}>
                              Lousa Pronta
                            </p>
                            <p className="text-lg font-mono opacity-80">
                              Faça sua pergunta e vou explicar aqui!
                            </p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                    
                    {/* Reflexo da lousa */}
                    <div 
                      className="absolute top-4 left-4 w-32 h-16 bg-white opacity-5 rounded-full blur-xl"
                      style={{ transform: 'rotate(-15deg)' }}
                    ></div>
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
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes chalk-write {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 0.8s ease-out forwards;
          }
          
          .chalk-text {
            animation: chalk-write 0.6s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
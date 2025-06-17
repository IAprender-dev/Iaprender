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
  const [useElevenLabsSpeech, setUseElevenLabsSpeech] = useState(true);

  // Refs
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

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

  // Função para inicializar reconhecimento de voz (ElevenLabs ou Nativo)
  const initializeSpeechRecognition = useCallback(async () => {
    if (useElevenLabsSpeech) {
      return await initializeElevenLabsRecognition();
    } else {
      return initializeNativeRecognition();
    }
  }, [useElevenLabsSpeech]);

  // Reconhecimento via ElevenLabs
  const initializeElevenLabsRecognition = useCallback(async () => {
    try {
      // Verificar suporte a MediaRecorder
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        console.warn('WAV não suportado, usando WebM');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 Gravação finalizada, enviando para transcrição...');
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/wav' 
        });
        
        audioChunksRef.current = [];
        
        if (audioBlob.size > 1000) { // Apenas se tiver conteúdo significativo
          await transcribeWithElevenLabs(audioBlob);
        }
      };

      return true;
    } catch (error) {
      console.error('Erro ao inicializar ElevenLabs Recognition:', error);
      toast({
        title: "Erro no reconhecimento ElevenLabs",
        description: "Tentando usar reconhecimento nativo do navegador",
        variant: "destructive",
      });
      setUseElevenLabsSpeech(false);
      return initializeNativeRecognition();
    }
  }, []);

  // Transcrição via ElevenLabs
  const transcribeWithElevenLabs = useCallback(async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/elevenlabs/transcribe', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.transcript && result.transcript.trim().length > 2) {
          console.log('🗣️ Transcrição ElevenLabs:', result.transcript);
          processUserInput(result.transcript.trim());
        } else {
          console.log('Transcrição vazia, continuando a ouvir...');
          setTimeout(() => startElevenLabsListening(), 1000);
        }
      } else {
        console.error('Erro na transcrição ElevenLabs:', response.status);
        setTimeout(() => startElevenLabsListening(), 2000);
      }
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      setTimeout(() => startElevenLabsListening(), 2000);
    }
  }, []);

  // Iniciar escuta com ElevenLabs
  const startElevenLabsListening = useCallback(() => {
    if (!mediaRecorderRef.current || conversationState !== 'idle') {
      return;
    }

    try {
      setConversationState('listening');
      isListeningRef.current = true;
      mediaRecorderRef.current.start();
      console.log('🎤 Iniciando gravação ElevenLabs...');
      
      // Parar gravação após alguns segundos para processar
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          isListeningRef.current = false;
        }
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      isListeningRef.current = false;
    }
  }, [conversationState]);

  // Reconhecimento nativo do navegador (fallback)
  const initializeNativeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Reconhecimento de voz não suportado');
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      let silenceTimer: NodeJS.Timeout | null = null;

      recognition.onstart = () => {
        console.log('🎤 Reconhecimento nativo ativo');
        isListeningRef.current = true;
        setConversationState('listening');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim();
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && finalTranscript.length > 2) {
          console.log('🗣️ Fala reconhecida (nativo):', finalTranscript);
          recognition.stop();
          processUserInput(finalTranscript);
        } else if (interimTranscript && interimTranscript.length > 2) {
          silenceTimer = setTimeout(() => {
            if (interimTranscript.trim().length > 2) {
              console.log('🗣️ Fala por silêncio (nativo):', interimTranscript.trim());
              recognition.stop();
              processUserInput(interimTranscript.trim());
            }
          }, 2000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento nativo:', event.error);
        isListeningRef.current = false;
        
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        
        switch (event.error) {
          case 'not-allowed':
            setConnectionState('error');
            toast({
              title: "Permissão negada",
              description: "Permita acesso ao microfone para usar a Pro Versa",
              variant: "destructive",
            });
            break;
          case 'no-speech':
            setTimeout(() => restartRecognition(), 1000);
            break;
          case 'network':
            setTimeout(() => restartRecognition(), 3000);
            break;
          default:
            setTimeout(() => restartRecognition(), 2000);
        }
      };

      recognition.onend = () => {
        console.log('🔇 Reconhecimento nativo finalizado');
        isListeningRef.current = false;
        
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        
        if (isConnected && conversationState === 'listening') {
          setTimeout(() => restartRecognition(), 500);
        }
      };

      recognitionRef.current = recognition;
      return true;
    } catch (error) {
      console.error('Erro ao inicializar reconhecimento nativo:', error);
      return false;
    }
  }, [isConnected, conversationState]);

  // Função para reiniciar reconhecimento
  const restartRecognition = useCallback(() => {
    if (!isConnected || conversationState !== 'idle' || isListeningRef.current) {
      return;
    }

    if (useElevenLabsSpeech) {
      startElevenLabsListening();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        console.log('🔄 Reconhecimento nativo reiniciado');
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (!errorMessage.includes('already started')) {
          console.error('Erro ao reiniciar reconhecimento nativo:', error);
          setTimeout(() => restartRecognition(), 2000);
        }
      }
    }
  }, [isConnected, conversationState, useElevenLabsSpeech, startElevenLabsListening]);

  // Função para processar entrada do usuário
  const processUserInput = useCallback(async (transcript: string) => {
    if (!transcript.trim() || conversationState !== 'listening') {
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
          setTimeout(() => restartRecognition(), 1000);
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
        setTimeout(() => restartRecognition(), 2000);
      }
    }
  }, [conversationState, addMessage, messages, elevenLabsSession, restartRecognition]);

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
          setTimeout(() => restartRecognition(), 800);
        };
        
        audioRef.current.onerror = (error) => {
          console.error('Erro na reprodução:', error);
          setConversationState('idle');
          setTimeout(() => restartRecognition(), 1500);
        };
        
        if (!isMuted) {
          await audioRef.current.play();
          console.log('🔊 Áudio reproduzindo');
        } else {
          setConversationState('idle');
          setTimeout(() => restartRecognition(), 500);
        }
      } else {
        throw new Error(`Erro na síntese: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro na síntese de fala:', error);
      setConversationState('idle');
      setTimeout(() => restartRecognition(), 1000);
    }
  }, [elevenLabsSession, isMuted, restartRecognition]);

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
      if (initializeSpeechRecognition()) {
        console.log('✅ Reconhecimento de voz inicializado');
        
        // Saudação inicial
        const welcomeMessage = `Oi! Eu sou a Pro Versa, sua tutora virtual com tecnologia ElevenLabs ${useElevenLabsSpeech ? 'completa' : 'de síntese'}. O que gostaria de aprender hoje?`;
        addMessage('assistant', welcomeMessage);
        
        setTimeout(async () => {
          await synthesizeSpeech(welcomeMessage);
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

              {/* Toggle tipo de reconhecimento */}
              <Button
                onClick={() => setUseElevenLabsSpeech(!useElevenLabsSpeech)}
                variant="outline"
                className="w-full"
                disabled={isConnected}
              >
                {useElevenLabsSpeech ? (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    ElevenLabs Speech
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Browser Speech
                  </>
                )}
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
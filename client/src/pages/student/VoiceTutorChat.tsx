import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Mic, MicOff, Play, Pause, RotateCcw, TestTube, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  duration?: number;
}

type VoiceTutorState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused';

export default function VoiceTutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Core states
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [tutorState, setTutorState] = useState<VoiceTutorState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [conversationTime, setConversationTime] = useState(0);

  // Audio refs
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recording state
  const recordingRef = useRef({
    isActive: false,
    chunks: [] as Blob[],
    startTime: 0
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setConversationTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused]);

  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou seu tutor de conversas por voz. Vou começar a escutar automaticamente. Fale naturalmente comigo.`,
      timestamp: new Date()
    }]);

    initializeVoiceChat();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (utteranceRef.current) {
      window.speechSynthesis.cancel();
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  };

  const initializeVoiceChat = async () => {
    if (isPaused) return;

    try {
      console.log('Initializing voice chat...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      console.log('Microphone access granted');
      
      setTutorState('listening');
      setIsListening(true);
      
      // Start continuous recording with automatic chunking
      startContinuousRecording();
      
    } catch (error) {
      console.error('Voice initialization failed:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive",
      });
    }
  };

  const startContinuousRecording = () => {
    if (!streamRef.current || recordingRef.current.isActive || isSpeaking) return;

    try {
      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recordingRef.current.chunks = [];
      recordingRef.current.isActive = true;
      recordingRef.current.startTime = Date.now();
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingRef.current.chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        if (recordingRef.current.chunks.length > 0) {
          const audioBlob = new Blob(recordingRef.current.chunks, { type: 'audio/webm;codecs=opus' });
          const duration = (Date.now() - recordingRef.current.startTime) / 1000;
          
          // Only process if recording was long enough and we're not speaking
          if (duration > 1 && !isSpeaking) {
            transcribeAudio(audioBlob);
          }
        }
        recordingRef.current.isActive = false;
        
        // Restart recording after a brief pause (if not speaking)
        if (!isSpeaking && !isPaused) {
          setTimeout(() => {
            startContinuousRecording();
          }, 1000);
        }
      };
      
      recorderRef.current = recorder;
      recorder.start();
      
      // Auto-stop recording after 5 seconds to create chunks for Whisper
      recordingTimeoutRef.current = setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
      
    } catch (error) {
      console.error('Recording start failed:', error);
      recordingRef.current.isActive = false;
    }
  };

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setTutorState('processing');
      
      const formData = new FormData();
      const fileName = `voice_${Date.now()}.webm`;
      formData.append('audio', audioBlob, fileName);

      console.log('Sending audio for transcription:', { size: audioBlob.size, fileName });

      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Transcription response:', data);
      
      // Only process if we got actual speech content
      if (data.text && data.text.trim() && data.text.length > 3) {
        setCurrentTranscription(data.text);
        handleUserMessage(data.text, data.duration);
      } else {
        // No meaningful speech detected, continue listening
        setTutorState('listening');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTutorState('listening');
    }
  }, []);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-8),
        studentName: user?.firstName || 'Estudante',
        context: 'voice_continuous_tutor',
        isVoiceConversation: true
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: VoiceMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentTranscription('');
      
      // Speak the response
      setTimeout(() => speakText(assistantMessage.content), 300);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setTutorState('listening');
    }
  });

  const handleUserMessage = useCallback((message: string, duration?: number) => {
    if (!message.trim()) return;

    const userMessage: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      duration
    };

    setMessages(prev => [...prev, userMessage]);
    setTutorState('processing');
    chatMutation.mutate(message);
  }, [chatMutation]);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      // Stop any current recording while AI speaks
      if (recorderRef.current && recordingRef.current.isActive) {
        recorderRef.current.stop();
      }
      
      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[🌟✨💫⭐🎯📚💡🔥😊]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setTutorState('speaking');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setTutorState('listening');
        
        // Resume recording after AI finishes speaking
        if (!isPaused) {
          setTimeout(() => {
            startContinuousRecording();
          }, 1500); // Wait 1.5 seconds to avoid feedback
        }
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTutorState('listening');
        if (!isPaused) {
          setTimeout(() => startContinuousRecording(), 1000);
        }
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isPaused]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setTutorState('idle');
      setTimeout(() => initializeVoiceChat(), 500);
    } else {
      setIsPaused(true);
      if (isSpeaking) {
        stopSpeaking();
      }
      if (recorderRef.current && recordingRef.current.isActive) {
        recorderRef.current.stop();
      }
      cleanup();
      setIsListening(false);
      setTutorState('paused');
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `Conversa reiniciada! Estou pronto para uma nova sessão de estudos por voz.`,
      timestamp: new Date()
    }]);
    setConversationTime(0);
    if (!isPaused) {
      setTimeout(() => speakText("Conversa reiniciada! Estou pronto para uma nova sessão de estudos por voz."), 500);
    }
  };

  const testMicrophone = async () => {
    try {
      console.log('Testing microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      toast({
        title: "Microfone funcionando!",
        description: "O microfone está acessível e funcionando corretamente.",
        variant: "default",
      });

      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Microphone test failed:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateDescription = () => {
    switch (tutorState) {
      case 'idle': return 'Aguardando...';
      case 'listening': return 'Escutando você...';
      case 'processing': return 'Processando...';
      case 'speaking': return 'Falando...';
      case 'paused': return 'Pausado';
      default: return 'Inicializando...';
    }
  };

  const getStateColor = () => {
    switch (tutorState) {
      case 'listening': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'speaking': return 'bg-blue-500';
      case 'paused': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Simple Voice Avatar
  const VoiceAvatar = () => {
    const pulseScale = isSpeaking ? 1.1 : 1;
    const glowIntensity = isSpeaking ? 0.8 : isListening ? 0.6 : 0.3;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-12">
        <div className="relative">
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              transform: `scale(${1.5})`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${glowIntensity * 0.15}) 0%, transparent 70%)`,
              filter: `blur(25px)`
            }}
          />
          
          <div 
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center transition-all duration-300 shadow-2xl"
            style={{
              transform: `scale(${pulseScale})`,
              boxShadow: `0 0 ${40 + glowIntensity * 60}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-28 h-28 text-white drop-shadow-xl" />
            
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-50" />
                <div className="absolute inset-0 rounded-full border-3 border-orange-300 animate-pulse opacity-70" />
              </>
            )}
            
            {isListening && !isSpeaking && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-30"
                    style={{ 
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStateColor()} animate-pulse`} />
            <span className="text-xl font-semibold text-gray-700">{getStateDescription()}</span>
          </div>
          
          {tutorState === 'listening' && (
            <p className="text-sm text-green-600 font-medium">Fale naturalmente que eu escuto</p>
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
                  <CardTitle className="text-2xl font-bold text-gray-800">Tutor de Voz IA</CardTitle>
                  <p className="text-gray-600 mt-1">Conversação contínua com inteligência artificial</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {formatTime(conversationTime)}
                </Badge>
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
              
              {/* Controls */}
              <div className="flex justify-center space-x-4 mt-8">
                <Button
                  onClick={togglePause}
                  variant={isPaused ? "default" : "outline"}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Iniciar</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5" />
                      <span>Pausar</span>
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={clearConversation}
                  variant="outline"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Reiniciar</span>
                </Button>
                
                <Button
                  onClick={testMicrophone}
                  variant="outline"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <TestTube className="w-5 h-5" />
                  <span>Testar Mic</span>
                </Button>
              </div>

              {currentTranscription && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Transcrevendo:</p>
                  <p className="text-blue-800">{currentTranscription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Conversa</CardTitle>
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
                            {message.duration && (
                              <span className="text-xs opacity-70">
                                {message.duration.toFixed(1)}s
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
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bot, User, Mic, MicOff, Volume2, VolumeX, MessageSquare, Clock, History, RefreshCw, Play, Pause } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  duration?: number;
  isTranscribing?: boolean;
}

type VoiceTutorState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused';

export default function VoiceTutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [tutorState, setTutorState] = useState<VoiceTutorState>('idle');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationTime, setConversationTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceDetectionRef = useRef<{
    silenceCount: number;
    speechCount: number;
    isRecording: boolean;
  }>({ silenceCount: 0, speechCount: 0, isRecording: false });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conversation timer
  useEffect(() => {
    conversationTimerRef.current = setInterval(() => {
      setConversationTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
      }
    };
  }, []);

  // Initialize welcome message and auto-start
  useEffect(() => {
    const welcomeMessage: VoiceMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Olá! Sou seu Tutor IA de conversa por voz. Vou começar a te escutar automaticamente. Pode falar comigo a qualquer momento e eu vou parar de falar para te ouvir!",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Auto-speak welcome and start listening
    setTimeout(() => {
      speakText(welcomeMessage.content);
      setTimeout(() => initializeMicrophone(), 3000);
    }, 1000);
  }, []);

  // Initialize microphone for continuous monitoring
  const initializeMicrophone = useCallback(async () => {
    if (streamRef.current || isPaused) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      streamRef.current = stream;
      
      // Setup audio context for voice detection
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;

      const SILENCE_THRESHOLD = 0.015;
      const SPEECH_THRESHOLD = 0.08; // Threshold for detecting user speech
      const INTERRUPTION_THRESHOLD = 0.12; // Higher threshold for interrupting AI
      const SILENCE_DURATION = 100; // ~10 seconds of silence
      const SPEECH_DETECTION = 5; // ~0.5 seconds of speech to interrupt
      const MIN_SPEECH_DURATION = 15; // ~1.5 seconds minimum speech to process

      const monitorVoice = () => {
        if (!analyser || isPaused) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const level = Math.min(1, average / 128);
        setAudioLevel(level);

        const detection = voiceDetectionRef.current;

        // If AI is speaking and user speaks, interrupt immediately
        if (isSpeaking && level > INTERRUPTION_THRESHOLD) {
          detection.speechCount++;
          if (detection.speechCount >= SPEECH_DETECTION) {
            console.log('🔴 User interrupting AI speech');
            stopSpeaking();
            startListening();
            detection.speechCount = 0;
            detection.silenceCount = 0;
          }
        } else if (isSpeaking) {
          detection.speechCount = 0;
        }

        // If in listening mode, detect speech/silence
        if (isListening && !isSpeaking) {
          if (level > SPEECH_THRESHOLD) {
            detection.speechCount++;
            detection.silenceCount = 0;
            
            // Start recording if we detect sustained speech
            if (!detection.isRecording && detection.speechCount >= MIN_SPEECH_DURATION) {
              console.log('🎤 Starting recording - speech detected');
              startRecording();
            }
          } else if (level < SILENCE_THRESHOLD) {
            detection.silenceCount++;
            detection.speechCount = 0;
            
            // Stop recording if silence is detected while recording
            if (detection.isRecording && detection.silenceCount >= SILENCE_DURATION) {
              console.log('🔇 Stopping recording - silence detected');
              stopRecording();
            }
          }
        }

        // Continue monitoring if not paused
        if (!isPaused) {
          animationRef.current = requestAnimationFrame(monitorVoice);
        }
      };

      setTutorState('listening');
      setIsListening(true);
      monitorVoice();
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  }, [isPaused, isSpeaking, isListening]);

  // Start recording audio
  const startRecording = useCallback(() => {
    if (!streamRef.current || voiceDetectionRef.current.isRecording) return;

    try {
      // Use wav format which is better supported by OpenAI Whisper
      const mimeType = MediaRecorder.isTypeSupported('audio/wav') 
        ? 'audio/wav'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          if (audioBlob.size > 1000) {
            transcribeAudio(audioBlob, mimeType);
          }
        }
        audioChunksRef.current = [];
        voiceDetectionRef.current.isRecording = false;
      };

      mediaRecorder.start(100);
      voiceDetectionRef.current.isRecording = true;
      setTutorState('listening');
      
    } catch (error) {
      console.error('Recording error:', error);
    }
  }, []);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && voiceDetectionRef.current.isRecording) {
      mediaRecorderRef.current.stop();
      setTutorState('processing');
    }
  }, []);

  // Start listening mode
  const startListening = useCallback(() => {
    if (!isListening) {
      setIsListening(true);
      setTutorState('listening');
    }
  }, [isListening]);

  // Enhanced text-to-speech with interruption capability
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[🌟✨💫⭐🎯📚💡🔥]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setTutorState('speaking');
        setIsInterrupted(false);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        if (!isInterrupted && !isPaused) {
          setTutorState('listening');
          // Continue listening after speaking
          setTimeout(() => {
            if (!isPaused) {
              startListening();
            }
          }, 500);
        }
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTutorState('idle');
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isPaused, isInterrupted]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsInterrupted(true);
      setTutorState('listening');
    }
  }, []);

  // Audio transcription using OpenAI Whisper
  const transcribeAudio = useCallback(async (audioBlob: Blob, mimeType: string) => {
    try {
      const formData = new FormData();
      
      // Determine appropriate file extension based on mime type
      const fileExtension = mimeType.includes('wav') ? 'wav' : 
                           mimeType.includes('webm') ? 'webm' :
                           mimeType.includes('mp3') ? 'mp3' : 'wav';
      
      const fileName = `voice_${Date.now()}.${fileExtension}`;
      formData.append('audio', audioBlob, fileName);
      
      console.log('Sending audio for transcription:', {
        size: audioBlob.size,
        type: audioBlob.type,
        fileName
      });
      
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Transcription failed: ${response.status} - ${errorData.error}`);
      }
      
      const data = await response.json();
      console.log('Transcription response:', data);
      
      if (data.text && data.text.trim()) {
        setCurrentTranscription(data.text);
        handleUserMessage(data.text, data.duration);
      } else {
        // No speech detected, continue listening
        console.log('No speech detected in audio');
        setTutorState('listening');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o áudio. Tente falar mais claramente.",
        variant: "destructive",
      });
      setTutorState('listening');
    }
  }, [toast]);

  // AI conversation
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
      
      // Auto-speak response
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

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setTutorState('idle');
      setTimeout(() => initializeMicrophone(), 500);
    } else {
      setIsPaused(true);
      if (isSpeaking) {
        stopSpeaking();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced AI Avatar with real-time voice visualization
  const VoiceAvatar = () => {
    const baseScale = 1;
    const pulseScale = isSpeaking ? baseScale + Math.sin(Date.now() * 0.008) * 0.1 : baseScale;
    const glowIntensity = isSpeaking ? 0.8 : isListening ? 0.6 : tutorState === 'processing' ? 0.4 : 0.3;
    const audioVisualization = isListening ? baseScale + audioLevel * 0.3 : baseScale;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-12">
        {/* Main Avatar Container */}
        <div className="relative">
          {/* Outer glow rings */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              transform: `scale(${1.5})`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${glowIntensity * 0.15}) 0%, transparent 70%)`,
              filter: `blur(25px)`
            }}
          />
          
          {/* Avatar */}
          <div 
            className="relative w-56 h-56 rounded-full bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center transition-all duration-300 shadow-2xl"
            style={{
              transform: `scale(${pulseScale * audioVisualization})`,
              boxShadow: `0 0 ${40 + glowIntensity * 60}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-28 h-28 text-white drop-shadow-xl" />
            
            {/* Speaking Animation Rings */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping opacity-50" />
                <div className="absolute inset-0 rounded-full border-3 border-orange-300 animate-pulse opacity-70" />
                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-30" 
                     style={{ animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Listening Visualization */}
            {isListening && !isSpeaking && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-3 border-green-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      opacity: audioLevel * (1 - i * 0.12),
                      borderWidth: `${3 + audioLevel * 5}px`,
                      animationDuration: '1.8s'
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Processing Animation */}
            {tutorState === 'processing' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-spin opacity-70" 
                     style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-spin opacity-50" 
                     style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
              </>
            )}

            {/* Paused State */}
            {isPaused && (
              <div className="absolute inset-0 rounded-full border-4 border-gray-400 opacity-50" />
            )}
          </div>
          
          {/* Enhanced Audio Level Visualization */}
          {(isListening || isSpeaking) && (
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                {[...Array(11)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-100 shadow-lg ${
                      isSpeaking ? 'bg-gradient-to-t from-red-500 via-orange-500 to-yellow-500' 
                                : 'bg-gradient-to-t from-green-500 via-blue-500 to-purple-500'
                    }`}
                    style={{
                      height: audioLevel * 11 > i ? `${20 + audioLevel * 40 + Math.sin(Date.now() * 0.01 + i) * 6}px` : '10px',
                      opacity: audioLevel * 11 > i ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Status Display */}
        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Tutor IA - Conversa por Voz
          </h3>
          
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
              tutorState === 'idle' ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' :
              tutorState === 'listening' ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse' :
              tutorState === 'processing' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse' :
              tutorState === 'speaking' ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse' :
              'bg-gray-500 shadow-lg shadow-gray-500/50'
            }`} />
            <span className="text-lg text-gray-800 font-semibold">
              {tutorState === 'idle' ? 'Pronto para conversar' :
               tutorState === 'listening' ? 'Te escutando... (fale a qualquer momento!)' :
               tutorState === 'processing' ? 'Processando sua pergunta...' :
               tutorState === 'speaking' ? 'Explicando (me interrompa se quiser!)' :
               'Conversa pausada'}
            </span>
          </div>
          
          {/* Current Transcription Preview */}
          {currentTranscription && (
            <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200 max-w-md">
              <div className="font-semibold mb-1">Você disse:</div>
              "{currentTranscription}"
            </div>
          )}
          
          {/* Conversation Stats */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{formatTime(conversationTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{messages.filter(m => m.role === 'user').length} perguntas</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Tutor IA - Conversa por Voz Contínua - AIverse</title>
      </Helmet>
      
      {/* Enhanced Header */}
      <div className="bg-white backdrop-blur-sm border-b border-gray-300 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/aluno/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors duration-200">
                  Voltar
                </Button>
              </Link>
              <img src={aiverseLogo} alt="AIverse" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tutor IA - Conversa por Voz</h1>
                <p className="text-sm text-gray-700 font-medium">Conversa contínua com interrupção</p>
              </div>
            </div>
            
            {/* Voice Controls & Stats */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full font-medium">
                <Clock className="w-4 h-4 text-gray-600" />
                <span>{formatTime(conversationTime)}</span>
              </div>
              
              <Button
                onClick={togglePause}
                variant={isPaused ? "default" : "outline"}
                size="sm"
                className={isPaused 
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                }
              >
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Retomar' : 'Pausar'}
              </Button>
              
              <Button
                onClick={clearConversation}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Nova conversa
              </Button>
              
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-medium">
                    <History className="w-4 h-4 mr-2" />
                    Histórico ({messages.filter(m => m.role === 'user').length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 font-semibold">Histórico da Conversa por Voz</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div key={message.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={message.role === 'user' ? 'default' : 'secondary'} className="font-medium">
                                {message.role === 'user' ? 'Você' : 'Tutor IA'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Volume2 className="w-3 h-3 mr-1" />
                                Voz
                              </Badge>
                              <span className="text-xs text-gray-600 font-medium">
                                {message.timestamp.toLocaleTimeString('pt-BR')}
                              </span>
                              {message.duration && (
                                <span className="text-xs text-gray-500">
                                  ({message.duration.toFixed(1)}s)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-11">
                            <p className="text-sm leading-relaxed text-gray-800">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* AI Avatar Section - Takes more space */}
          <div className="lg:col-span-3">
            <Card className="h-fit shadow-xl bg-white border border-gray-200">
              <CardContent className="p-0">
                <VoiceAvatar />
                
                {/* Voice Instructions */}
                <div className="p-8 border-t border-gray-200 bg-gray-50">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Como funciona</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <Mic className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800">Fale naturalmente</p>
                        <p className="text-gray-600">Sem necessidade de apertar botões</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <Volume2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800">Interrupção inteligente</p>
                        <p className="text-gray-600">Fale durante a resposta para interromper</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <Bot className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-800">Conversa fluida</p>
                        <p className="text-gray-600">Como falar com um professor</p>
                      </div>
                    </div>
                    
                    {isPaused && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-yellow-800 font-medium">Conversa pausada</p>
                        <p className="text-yellow-700 text-sm">Clique em "Retomar" para continuar a conversa</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Flow - Compact side panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white border border-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-700" />
                  <span className="text-gray-900 font-semibold">Conversa em Andamento</span>
                  <Badge variant="secondary" className="ml-auto font-medium text-gray-700">
                    {messages.filter(m => m.role === 'user').length} falas
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-4">
                    {messages.slice(-8).map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
                            : 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-3 rounded-lg shadow-sm max-w-xs ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto'
                              : 'bg-white border border-gray-300 text-gray-900'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div className="mt-1 flex items-center space-x-1 opacity-70">
                              <Volume2 className="w-3 h-3" />
                              <span className="text-xs">
                                {message.timestamp.toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {messages.length > 8 && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setShowHistory(true)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600"
                    >
                      Ver conversa completa ({messages.length} mensagens)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
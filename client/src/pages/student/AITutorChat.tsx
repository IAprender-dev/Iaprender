import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bot, User, ArrowLeft, Mic, MicOff, Volume2, Pause, History, MessageSquare, Clock, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  duration?: number;
}

type TutorState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function AITutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [conversationTime, setConversationTime] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

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

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Olá! Sou o Tutor IA, seu assistente educacional especializado. Estou aqui para conversar com você sobre suas matérias escolares. Clique no botão e me conte sobre que assunto você gostaria de falar hoje!",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Auto-speak welcome after a delay
    setTimeout(() => speakText(welcomeMessage.content), 2000);
  }, []);

  // Enhanced text-to-speech
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[🌟✨💫⭐🎯📚💡🔥]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 0.9;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setTutorState('speaking');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setTutorState('idle');
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        setTutorState('idle');
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTutorState('idle');
    }
  };

  // Enhanced voice recording with better real-time feedback
  const startRecording = async () => {
    try {
      setCurrentTranscription('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm'
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Enhanced audio level visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;

      const updateAudioLevel = () => {
        if (isRecording && analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(1, average / 128));
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size > 1000) { // Only process if we have meaningful audio
          await transcribeAudio(audioBlob);
        } else {
          toast({
            title: "Áudio muito curto",
            description: "Tente falar por mais tempo para eu conseguir entender melhor.",
            variant: "destructive",
          });
          setTutorState('idle');
        }
        
        // Cleanup
        stream.getTracks().forEach(track => track.stop());
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      // Start recording
      mediaRecorder.start(500);
      setIsRecording(true);
      setTutorState('listening');
      setRecordingDuration(0);
      updateAudioLevel();
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Auto-stop after 45 seconds for better user experience
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 45000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setTutorState('processing');
      setRecordingDuration(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  };

  // Enhanced audio transcription
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 'm4a';
      const fileName = `voice_${Date.now()}.${fileExtension}`;
      
      formData.append('audio', audioBlob, fileName);
      
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        setCurrentTranscription(data.text);
        handleUserMessage(data.text, data.duration);
      } else {
        toast({
          title: "Não consegui ouvir claramente",
          description: "Tente falar mais devagar e claramente. Estou aqui para te ajudar!",
          variant: "destructive",
        });
        setTutorState('idle');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Erro na transcrição",
        description: "Houve um problema ao processar sua fala. Tente novamente.",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  };

  // AI tutor conversation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-8),
        studentName: user?.firstName || 'Estudante',
        context: 'voice_only_tutor',
        isVoiceConversation: true
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response || data.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentTranscription('');
      setTutorState('idle');
      
      // Auto-speak response with a natural delay
      setTimeout(() => speakText(assistantMessage.content), 800);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Erro na conversa",
        description: "Não consegui processar sua pergunta. Vamos tentar novamente?",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  });

  const handleUserMessage = (message: string, duration?: number) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      duration
    };

    setMessages(prev => [...prev, userMessage]);
    setTutorState('processing');
    chatMutation.mutate(message);
  };

  // Format conversation time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced AI Avatar with modern design
  const AIAvatar = () => {
    const baseScale = 1;
    const pulseScale = isSpeaking ? baseScale + Math.sin(Date.now() * 0.01) * 0.08 : baseScale;
    const glowIntensity = isSpeaking ? 0.8 : isRecording ? 0.6 : tutorState === 'processing' ? 0.4 : 0.3;
    const audioVisualization = isRecording ? baseScale + audioLevel * 0.2 : baseScale;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 p-12">
        {/* Main Avatar Container */}
        <div className="relative">
          {/* Outer glow rings */}
          <div 
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              transform: `scale(${1.4})`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${glowIntensity * 0.1}) 0%, transparent 70%)`,
              filter: `blur(20px)`
            }}
          />
          
          {/* Avatar */}
          <div 
            className="relative w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center transition-all duration-300 shadow-2xl"
            style={{
              transform: `scale(${pulseScale * audioVisualization})`,
              boxShadow: `0 0 ${30 + glowIntensity * 50}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-24 h-24 text-white drop-shadow-xl" />
            
            {/* Speaking Animation Rings */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-40" />
                <div className="absolute inset-0 rounded-full border-3 border-purple-300 animate-pulse opacity-60" />
                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-30" 
                     style={{ animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Listening Visualization */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-3 border-green-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      opacity: audioLevel * (1 - i * 0.15),
                      borderWidth: `${3 + audioLevel * 4}px`,
                      animationDuration: '1.5s'
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Processing Animation */}
            {tutorState === 'processing' && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-yellow-400 animate-spin opacity-60" 
                     style={{ animationDuration: '2s' }} />
                <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-spin opacity-40" 
                     style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
              </>
            )}
          </div>
          
          {/* Enhanced Audio Level Visualization */}
          {isRecording && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-100 shadow-sm"
                    style={{
                      height: audioLevel * 9 > i ? `${16 + audioLevel * 32 + Math.sin(Date.now() * 0.01 + i) * 4}px` : '8px',
                      opacity: audioLevel * 9 > i ? 1 : 0.3
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
            Tutor IA
          </h3>
          
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              tutorState === 'idle' ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' :
              tutorState === 'listening' ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse' :
              tutorState === 'processing' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse' :
              'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
            }`} />
            <span className="text-lg text-gray-700 font-medium">
              {tutorState === 'idle' ? 'Pronto para conversar' :
               tutorState === 'listening' ? 'Te escutando...' :
               tutorState === 'processing' ? 'Pensando na resposta...' :
               'Respondendo...'}
            </span>
          </div>
          
          {/* Recording Feedback */}
          {isRecording && (
            <div className="space-y-3">
              <div className="text-lg text-blue-600 font-mono bg-blue-50 px-4 py-2 rounded-full border-2 border-blue-200">
                🎤 {formatTime(recordingDuration)} / 0:45
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                Fale sobre sua dúvida escolar...
              </div>
            </div>
          )}
          
          {/* Current Transcription Preview */}
          {currentTranscription && (
            <div className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200 max-w-sm">
              <div className="font-medium mb-1">Você disse:</div>
              "{currentTranscription}"
            </div>
          )}
          
          {/* Conversation Stats */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatTime(conversationTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>{messages.filter(m => m.role === 'user').length} perguntas</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Helmet>
        <title>Tutor IA - Conversa por Voz - AIverse</title>
      </Helmet>
      
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/aluno/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <img src={aiverseLogo} alt="AIverse" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tutor IA</h1>
                <p className="text-sm text-gray-500">Conversa educacional por voz</p>
              </div>
            </div>
            
            {/* Session Info & History */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Sessão: {formatTime(conversationTime)}</span>
              </div>
              
              <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/50 hover:bg-white">
                    <History className="w-4 h-4 mr-2" />
                    Histórico ({messages.filter(m => m.role === 'user').length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Histórico da Conversa por Voz</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-4">
                    <div className="space-y-6">
                      {messages.map((message) => (
                        <div key={message.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-purple-100 text-purple-600'
                            }`}>
                              {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                                {message.role === 'user' ? 'Você' : 'Tutor IA'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Volume2 className="w-3 h-3 mr-1" />
                                Voz
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {message.timestamp.toLocaleTimeString('pt-BR')}
                              </span>
                              {message.duration && (
                                <span className="text-xs text-gray-400">
                                  ({message.duration.toFixed(1)}s)
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed ml-11 text-gray-800">{message.content}</p>
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* AI Avatar Section - Now takes more space */}
          <div className="lg:col-span-3">
            <Card className="h-fit shadow-xl bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-0">
                <AIAvatar />
                
                {/* Enhanced Voice Controls */}
                <div className="p-8 border-t space-y-6">
                  <div className="text-center space-y-6">
                    {!isRecording && !isSpeaking && tutorState === 'idle' ? (
                      <div className="space-y-4">
                        <Button
                          onClick={startRecording}
                          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white py-6 text-xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        >
                          <Mic className="w-8 h-8 mr-4" />
                          Conversar com o Tutor
                        </Button>
                        <p className="text-sm text-gray-600 max-w-sm mx-auto">
                          Clique e fale sobre qualquer matéria escolar. Estou aqui para te ajudar a aprender!
                        </p>
                      </div>
                    ) : isRecording ? (
                      <div className="space-y-4">
                        <Button
                          onClick={stopRecording}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-6 text-xl font-semibold rounded-2xl animate-pulse shadow-xl"
                        >
                          <MicOff className="w-8 h-8 mr-4" />
                          Finalizar Gravação
                        </Button>
                        <div className="text-center space-y-2">
                          <div className="text-lg text-blue-600 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                            🎙️ Estou te ouvindo! Fale sobre sua dúvida...
                          </div>
                          <p className="text-sm text-gray-600">
                            Pressione o botão quando terminar ou aguarde {45 - recordingDuration} segundos
                          </p>
                        </div>
                      </div>
                    ) : isSpeaking ? (
                      <div className="space-y-4">
                        <Button
                          onClick={stopSpeaking}
                          variant="outline"
                          className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 py-4 text-lg rounded-xl"
                        >
                          <Pause className="w-6 h-6 mr-3" />
                          Pausar Explicação
                        </Button>
                        <div className="text-center">
                          <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                            🗣️ Explicando para você...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-lg text-yellow-600 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200 flex items-center justify-center space-x-3">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Preparando resposta educacional...</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Analisando sua pergunta e preparando uma explicação clara
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Subject Suggestions */}
                  {tutorState === 'idle' && !isRecording && messages.length <= 1 && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">Ou escolha um assunto para começar:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => handleUserMessage("Me explique sobre matemática do nono ano")}
                            variant="outline"
                            size="sm"
                            className="h-12 text-sm bg-white hover:bg-blue-50 border-blue-200"
                          >
                            📊 Matemática
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Me ajude com português")}
                            variant="outline"
                            size="sm"
                            className="h-12 text-sm bg-white hover:bg-green-50 border-green-200"
                          >
                            📚 Português
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Quero aprender ciências")}
                            variant="outline"
                            size="sm"
                            className="h-12 text-sm bg-white hover:bg-purple-50 border-purple-200"
                          >
                            🔬 Ciências
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Me conte sobre história do Brasil")}
                            variant="outline"
                            size="sm"
                            className="h-12 text-sm bg-white hover:bg-orange-50 border-orange-200"
                          >
                            🏛️ História
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Flow - Compact side panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl bg-white/70 backdrop-blur-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Conversa Atual</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {messages.filter(m => m.role === 'user').length} perguntas
                  </Badge>
                </div>
                
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-4">
                    {messages.slice(-6).map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-3 rounded-lg shadow-sm max-w-xs ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                              : 'bg-white border border-gray-200 text-gray-900'
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
                
                {messages.length > 6 && (
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
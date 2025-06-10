import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Bot, User, ArrowLeft, Mic, MicOff, Volume2, MessageCircle, Sparkles, Play, Pause, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'question' | 'exercise';
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  isTranscribing?: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
}

type InteractionMode = 'voice' | 'text';
type TutorState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'waiting_answer';

const TUTOR_PERSONALITY = {
  welcome: "Olá! Sou a Luna, sua tutora de IA especializada em educação! Estou aqui para te ajudar com suas matérias escolares de forma divertida e interativa. Sobre que matéria você gostaria de conversar hoje?",
  encouragement: ["Muito bem!", "Excelente!", "Você está indo ótimo!", "Continue assim!", "Perfeito!"],
  thinking: ["Deixe-me pensar...", "Hmm, interessante pergunta...", "Vou explicar isso para você...", "Ótima pergunta!"]
};

export default function AITutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('voice');
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveAnimation, setWaveAnimation] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animation effects
  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        setWaveAnimation(prev => (prev + 0.1) % (Math.PI * 2));
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWaveAnimation(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: TUTOR_PERSONALITY.welcome,
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);
    
    // Speak welcome message if voice mode
    if (interactionMode === 'voice') {
      setTimeout(() => speakText(TUTOR_PERSONALITY.welcome), 1000);
    }
  }, []);

  // Voice functions
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      // Clean text for better speech synthesis
      const cleanText = text.replace(/[🌟✨💫⭐🎯📚💡🔥]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
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
      
      synthRef.current = utterance;
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

  // Recording functions with real-time feedback
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level detection for real-time visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;

      const updateAudioLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeMutation.mutate(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      mediaRecorder.start(250); // Collect data every 250ms for smooth real-time experience
      setIsRecording(true);
      setTutorState('listening');
      setRecordingDuration(0);
      updateAudioLevel();
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Auto-stop after 15 seconds for natural conversation flow
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 15000);
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões do navegador.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setTutorState('thinking');
      setRecordingDuration(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Real-time audio transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await apiRequest('POST', '/api/ai/transcribe-audio', formData);
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.text && data.text.trim()) {
        setCurrentTranscription(data.text);
        handleUserMessage(data.text);
      } else {
        toast({
          title: "Não consegui ouvir",
          description: "Tente falar mais alto ou verificar se o microfone está funcionando.",
          variant: "destructive",
        });
        setTutorState('idle');
      }
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível processar o áudio. Tente novamente.",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  });

  // AI tutor chat mutation with educational focus
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-8),
        studentName: user?.firstName || 'Estudante',
        studentGrade: (user as any)?.schoolYear || '9º ano',
        isVoiceConversation: interactionMode === 'voice'
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
        timestamp: new Date(),
        type: data.type || 'text',
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentTranscription('');
      
      // Handle different response types
      if (data.type === 'question' && data.options) {
        setCurrentQuestion({
          id: assistantMessage.id,
          question: data.response || data.message,
          options: data.options,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation
        });
        setTutorState('waiting_answer');
      } else {
        setTutorState('idle');
      }
      
      // Speak response if in voice mode
      if (interactionMode === 'voice') {
        setTimeout(() => speakText(data.response || data.message), 300);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Erro na conversa",
        description: "Não foi possível processar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  });

  const handleUserMessage = (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTutorState('thinking');

    // Process message with AI
    chatMutation.mutate(message);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleUserMessage(inputMessage);
    }
  };

  const handleAnswerSubmit = (answerIndex: number) => {
    if (!currentQuestion) return;

    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const selectedOption = currentQuestion.options[answerIndex];
    
    // Add user's answer as a message
    const answerMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `Resposta: ${String.fromCharCode(65 + answerIndex)}) ${selectedOption}`,
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, answerMessage]);

    const feedbackMessage = isCorrect 
      ? `${TUTOR_PERSONALITY.encouragement[Math.floor(Math.random() * TUTOR_PERSONALITY.encouragement.length)]} Resposta correta! ${currentQuestion.explanation}`
      : `Não foi dessa vez, mas não desanime! A resposta correta é: ${currentQuestion.options[currentQuestion.correctAnswer]}. ${currentQuestion.explanation}`;

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: feedbackMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    if (interactionMode === 'voice') {
      setTimeout(() => speakText(feedbackMessage), 300);
    }

    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setTutorState('idle');
  };

  const handleVoiceAnswer = async () => {
    if (currentQuestion && interactionMode === 'voice') {
      await startRecording();
    }
  };

  // Enhanced AI Avatar Component with Real-time Visualization
  const AIAvatar = () => {
    const pulseScale = 1 + Math.sin(waveAnimation) * 0.1;
    const glowIntensity = isSpeaking ? 0.5 + Math.sin(waveAnimation * 2) * 0.3 : 0.2;
    const audioVisualization = isRecording ? 1 + audioLevel * 0.4 : 1;

    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        {/* Main Avatar */}
        <div className="relative">
          <div 
            className="relative w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 flex items-center justify-center transition-all duration-300 shadow-2xl"
            style={{
              transform: `scale(${pulseScale * audioVisualization})`,
              boxShadow: `0 0 ${30 + glowIntensity * 40}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-20 h-20 text-white drop-shadow-lg" />
            
            {/* Speaking Animation */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-1 border-white animate-ping opacity-50" 
                     style={{ animationDelay: '0.5s' }} />
              </>
            )}
            
            {/* Listening Visualization */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      opacity: audioLevel * (1 - i * 0.15),
                      borderWidth: `${2 + audioLevel * 3}px`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Thinking Animation */}
            {tutorState === 'thinking' && (
              <div className="absolute inset-0 rounded-full border-3 border-yellow-400 animate-spin" 
                   style={{ animationDuration: '2s' }} />
            )}
          </div>
          
          {/* Real-time Audio Level Indicator */}
          {isRecording && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-gradient-to-t from-green-500 to-blue-500 rounded-full transition-all duration-100 ${
                      audioLevel * 7 > i ? `h-${Math.min(8, 2 + i)}` : 'h-1'
                    }`}
                    style={{
                      height: audioLevel * 7 > i ? `${8 + audioLevel * 16}px` : '4px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Status Display */}
        <div className="text-center space-y-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Luna - Tutora IA
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
              tutorState === 'idle' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
              tutorState === 'listening' ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50' :
              tutorState === 'thinking' ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50' :
              tutorState === 'speaking' ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' :
              'bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50'
            }`} />
            <span className="text-sm text-gray-700 font-medium">
              {tutorState === 'idle' ? 'Pronta para conversar!' :
               tutorState === 'listening' ? 'Te escutando...' :
               tutorState === 'thinking' ? 'Preparando resposta...' :
               tutorState === 'speaking' ? 'Explicando para você...' :
               'Aguardando sua resposta...'}
            </span>
          </div>
          
          {/* Recording Timer and Feedback */}
          {isRecording && (
            <div className="space-y-2">
              <div className="text-sm text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-full">
                Gravando: {recordingDuration}s / 15s
              </div>
              <div className="text-xs text-gray-600">
                Fale naturalmente sobre sua dúvida
              </div>
            </div>
          )}
          
          {/* Real-time Transcription Preview */}
          {currentTranscription && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg max-w-xs">
              Transcrição: "{currentTranscription}"
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>Tutor IA - AIverse</title>
      </Helmet>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/aluno/dashboard">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <img src={aiverseLogo} alt="AIverse" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tutor IA - Luna</h1>
                <p className="text-sm text-gray-500">Conversa educacional em tempo real</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={interactionMode === 'voice' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInteractionMode('voice')}
                  className="flex items-center space-x-1"
                >
                  <Mic className="w-4 h-4" />
                  <span>Voz</span>
                </Button>
                <Button
                  variant={interactionMode === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInteractionMode('text')}
                  className="flex items-center space-x-1"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Texto</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI Avatar Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit sticky top-24 shadow-lg">
              <CardContent className="p-0">
                <AIAvatar />
                
                {/* Voice Controls */}
                {interactionMode === 'voice' && (
                  <div className="p-6 border-t space-y-4">
                    <div className="text-center space-y-4">
                      {!isRecording && !isSpeaking && tutorState !== 'thinking' ? (
                        <Button
                          onClick={startRecording}
                          disabled={tutorState === 'thinking' || chatMutation.isPending}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Mic className="w-6 h-6 mr-3" />
                          Conversar com Luna
                        </Button>
                      ) : isRecording ? (
                        <div className="space-y-3">
                          <Button
                            onClick={stopRecording}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-xl animate-pulse shadow-lg"
                          >
                            <MicOff className="w-6 h-6 mr-3" />
                            Finalizar ({15 - recordingDuration}s)
                          </Button>
                          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                            Estou te ouvindo! Fale sobre sua dúvida escolar
                          </div>
                        </div>
                      ) : isSpeaking ? (
                        <Button
                          onClick={stopSpeaking}
                          variant="outline"
                          className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 py-3 rounded-xl"
                        >
                          <Pause className="w-5 h-5 mr-2" />
                          Parar explicação
                        </Button>
                      ) : (
                        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando sua pergunta...</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Subject Buttons */}
                    {tutorState === 'idle' && !isRecording && !currentQuestion && (
                      <div className="space-y-3">
                        <Separator />
                        <p className="text-sm text-gray-600 text-center">Ou escolha um assunto:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => handleUserMessage("Me explique matemática básica")}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            📊 Matemática
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Me ajude com português")}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            📚 Português
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Quero aprender ciências")}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            🔬 Ciências
                          </Button>
                          <Button
                            onClick={() => handleUserMessage("Me conte sobre história")}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                          >
                            🏛️ História
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="flex-1 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Conversa Educacional em Tempo Real</span>
                  <Badge variant="secondary" className="ml-auto">
                    {interactionMode === 'voice' ? 'Modo Voz' : 'Modo Texto'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                            : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`flex-1 max-w-lg ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-4 rounded-lg shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Current Question Display */}
                    {currentQuestion && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 shadow-md">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                          <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                          Questão para você:
                        </h4>
                        <p className="text-gray-800 mb-4 leading-relaxed">{currentQuestion.question}</p>
                        
                        {interactionMode === 'text' ? (
                          <RadioGroup 
                            value={selectedAnswer?.toString()} 
                            onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                            className="space-y-3"
                          >
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="flex items-start space-x-3 p-2 hover:bg-white rounded-lg transition-colors">
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                                <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1 leading-relaxed">
                                  <span className="font-medium">{String.fromCharCode(65 + index)})</span> {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className="space-y-3">
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="p-3 bg-white rounded-lg border text-sm shadow-sm">
                                <strong className="text-blue-600">{String.fromCharCode(65 + index)})</strong> {option}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-6 space-y-2">
                          {interactionMode === 'text' ? (
                            <Button
                              onClick={() => selectedAnswer !== null && handleAnswerSubmit(selectedAnswer)}
                              disabled={selectedAnswer === null}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirmar Resposta
                            </Button>
                          ) : (
                            <Button
                              onClick={handleVoiceAnswer}
                              disabled={isRecording || tutorState !== 'waiting_answer'}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                              <Mic className="w-4 h-4 mr-2" />
                              Responder por Voz
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Text Input */}
                {interactionMode === 'text' && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <form onSubmit={handleTextSubmit}>
                      <div className="flex space-x-3">
                        <Input
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Digite sua pergunta sobre matérias escolares..."
                          disabled={chatMutation.isPending || tutorState === 'thinking'}
                          className="flex-1 h-12 text-base"
                        />
                        <Button 
                          type="submit" 
                          disabled={!inputMessage.trim() || chatMutation.isPending || tutorState === 'thinking'}
                          className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {chatMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </form>
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
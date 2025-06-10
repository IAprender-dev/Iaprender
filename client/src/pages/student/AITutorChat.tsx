import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Bot, User, BookOpen, Lightbulb, ArrowLeft, Mic, MicOff, Volume2, FileText, Download, MessageCircle, Sparkles, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  welcome: "Olá! Sou a Luna, sua tutora de IA! 🌟 Estou aqui para te ajudar a aprender de forma divertida e interativa. Sobre que matéria você gostaria de conversar hoje?",
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
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveAnimation, setWaveAnimation] = useState(0);
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationRef = useRef<number | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

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
      setTimeout(() => speakText(TUTOR_PERSONALITY.welcome), 500);
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
      utterance.pitch = 1.2;
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

  // Recording functions with audio level detection
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level detection for visual feedback
      const audioContext = new AudioContext();
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
      };

      mediaRecorder.start(100); // Collect data every 100ms for smoother experience
      setIsRecording(true);
      setTutorState('listening');
      updateAudioLevel();
      
      // Auto-stop after 10 seconds for natural conversation flow
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 10000);
      
    } catch (error) {
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
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
    }
  };

  // Audio transcription mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await apiRequest('POST', '/api/ai/transcribe-audio', formData);
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.text) {
        handleUserMessage(data.text);
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

  // AI tutor chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-10),
        studentName: user?.firstName || 'Estudante',
        studentGrade: (user as any)?.schoolYear || '9º ano'
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
        content: data.message,
        timestamp: new Date(),
        type: data.type || 'text',
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Handle different response types
      if (data.type === 'question' && data.options) {
        setCurrentQuestion({
          id: assistantMessage.id,
          question: data.message,
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
        speakText(data.message);
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
    const updatedQuestion = {
      ...currentQuestion,
      userAnswer: answerIndex,
      isCorrect
    };

    setCurrentQuestion(updatedQuestion);

    const feedbackMessage = isCorrect 
      ? `${TUTOR_PERSONALITY.encouragement[Math.floor(Math.random() * TUTOR_PERSONALITY.encouragement.length)]} Resposta correta! ${currentQuestion.explanation}`
      : `Não foi dessa vez, mas não desanime! A resposta correta é: ${currentQuestion.options[currentQuestion.correctAnswer]}. ${currentQuestion.explanation}`;

    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: feedbackMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, assistantMessage]);
    
    if (interactionMode === 'voice') {
      speakText(feedbackMessage);
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

  // Animated AI Avatar Component with Audio Visualization
  const AIAvatar = () => {
    const pulseScale = 1 + Math.sin(waveAnimation) * 0.1;
    const glowIntensity = isSpeaking ? 0.5 + Math.sin(waveAnimation * 2) * 0.3 : 0.2;
    const audioVisualization = isRecording ? 1 + audioLevel * 0.3 : 1;

    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        {/* Main Avatar */}
        <div className="relative">
          <div 
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center transition-all duration-300"
            style={{
              transform: `scale(${pulseScale * audioVisualization})`,
              boxShadow: `0 0 ${20 + glowIntensity * 30}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-16 h-16 text-white" />
            
            {/* Speaking Animation */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-pulse" />
              </>
            )}
            
            {/* Listening Visualization */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      opacity: audioLevel * (1 - i * 0.2)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-blue-500 rounded-full transition-all duration-100 ${
                      audioLevel * 5 > i ? 'h-6' : 'h-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Status Display */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Luna - Tutora IA
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              tutorState === 'idle' ? 'bg-green-500' :
              tutorState === 'listening' ? 'bg-blue-500 animate-pulse' :
              tutorState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
              tutorState === 'speaking' ? 'bg-red-500 animate-pulse' :
              'bg-purple-500 animate-pulse'
            }`} />
            <span className="text-sm text-gray-600 font-medium">
              {tutorState === 'idle' ? 'Pronta para conversar!' :
               tutorState === 'listening' ? 'Te ouvindo...' :
               tutorState === 'thinking' ? 'Pensando na resposta...' :
               tutorState === 'speaking' ? 'Explicando para você...' :
               'Aguardando sua resposta...'}
            </span>
          </div>
          
          {/* Recording Timer */}
          {isRecording && (
            <div className="text-xs text-blue-600 font-mono">
              🎤 Gravando... (máx. 10s)
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
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/aluno/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <img src={aiverseLogo} alt="AIverse" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tutor IA</h1>
                <p className="text-sm text-gray-500">Aprendizado interativo com inteligência artificial</p>
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
            <Card className="h-fit sticky top-24">
              <CardContent className="p-0">
                <AIAvatar />
                
                {/* Voice Controls */}
                {interactionMode === 'voice' && (
                  <div className="p-6 border-t space-y-4">
                    <div className="text-center space-y-4">
                      {!isRecording && !isSpeaking ? (
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
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-xl animate-pulse"
                          >
                            <MicOff className="w-6 h-6 mr-3" />
                            Finalizar gravação
                          </Button>
                          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                            🎤 Estou te ouvindo! Fale naturalmente sobre sua dúvida
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={stopSpeaking}
                          variant="outline"
                          className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 py-3 rounded-xl"
                        >
                          <Pause className="w-5 h-5 mr-2" />
                          Parar explicação
                        </Button>
                      )}
                    </div>
                    
                    {/* Dynamic Status Messages */}
                    <div className="text-center">
                      {tutorState === 'idle' && !isRecording && !isSpeaking && (
                        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                          ✨ Pronta para uma nova conversa! Que matéria vamos estudar?
                        </div>
                      )}
                      
                      {tutorState === 'thinking' && (
                        <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processando sua pergunta...</span>
                        </div>
                      )}
                      
                      {currentQuestion && tutorState === 'waiting_answer' && (
                        <div className="text-sm text-purple-600 bg-purple-50 p-3 rounded-lg">
                          📝 Responda a questão acima por voz ou escolha uma alternativa
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    {tutorState === 'idle' && !isRecording && !currentQuestion && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleUserMessage("Me explique matemática básica")}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          📊 Matemática
                        </Button>
                        <Button
                          onClick={() => handleUserMessage("Me ajude com português")}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          📚 Português
                        </Button>
                        <Button
                          onClick={() => handleUserMessage("Quero aprender ciências")}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🔬 Ciências
                        </Button>
                        <Button
                          onClick={() => handleUserMessage("Me conte sobre história")}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          🏛️ História
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Conversa com a Tutora</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 pr-4" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                        }`}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className={`flex-1 max-w-lg ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white ml-auto'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    
                    {/* Current Question */}
                    {currentQuestion && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-3">Questão:</h4>
                        <p className="text-gray-800 mb-4">{currentQuestion.question}</p>
                        
                        {interactionMode === 'text' ? (
                          <RadioGroup 
                            value={selectedAnswer?.toString()} 
                            onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                            className="space-y-2"
                          >
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="cursor-pointer">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="p-2 bg-white rounded border text-sm">
                                <strong>{String.fromCharCode(65 + index)})</strong> {option}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4 space-y-2">
                          {interactionMode === 'text' ? (
                            <Button
                              onClick={() => selectedAnswer !== null && handleAnswerSubmit(selectedAnswer)}
                              disabled={selectedAnswer === null}
                              className="w-full"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirmar Resposta
                            </Button>
                          ) : (
                            <Button
                              onClick={handleVoiceAnswer}
                              disabled={isRecording || tutorState !== 'waiting_answer'}
                              className="w-full"
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
                  <form onSubmit={handleTextSubmit} className="mt-4">
                    <div className="flex space-x-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Digite sua pergunta..."
                        disabled={chatMutation.isPending || tutorState === 'thinking'}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!inputMessage.trim() || chatMutation.isPending || tutorState === 'thinking'}
                      >
                        {chatMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, ArrowLeft, Mic, MicOff, Volume2, MessageCircle, Sparkles, Pause, History } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import aiverseLogo from "@assets/Design sem nome (5)_1749568909858.png";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioTranscribed?: boolean;
}

type TutorState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function AITutorChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tutorState, setTutorState] = useState<TutorState>('idle');
  const [inputMessage, setInputMessage] = useState('');
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "Olá! Sou o Tutor IA, seu assistente educacional especializado. Estou aqui para te ajudar com suas matérias escolares através de conversas naturais. Você pode falar comigo ou escrever suas dúvidas. Sobre que assunto gostaria de conversar hoje?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    
    // Auto-speak welcome
    setTimeout(() => speakText(welcomeMessage.content), 1000);
  }, []);

  // Text-to-speech function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window && text.trim()) {
      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[🌟✨💫⭐🎯📚💡🔥]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
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

  // Voice recording with proper audio handling
  const startRecording = async () => {
    try {
      setCurrentTranscription('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      // Check supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;

      const updateAudioLevel = () => {
        if (isRecording && analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
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
        
        // Verify blob has content
        if (audioBlob.size > 0) {
          console.log('Audio blob created:', { size: audioBlob.size, type: audioBlob.type });
          await transcribeAudio(audioBlob);
        } else {
          toast({
            title: "Erro na gravação",
            description: "Não foi possível capturar o áudio. Tente novamente.",
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
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setTutorState('listening');
      setRecordingDuration(0);
      updateAudioLevel();
      
      // Recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (isRecording && mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 30000);
      
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

  // Audio transcription function
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log('Starting transcription for blob:', { size: audioBlob.size, type: audioBlob.type });
      
      const formData = new FormData();
      
      // Create a proper file with correct extension
      const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 
                           audioBlob.type.includes('mp4') ? 'm4a' : 'wav';
      const fileName = `recording_${Date.now()}.${fileExtension}`;
      
      formData.append('audio', audioBlob, fileName);
      
      // Log form data for debugging
      console.log('FormData created:', fileName, audioBlob.size);
      
      const response = await fetch('/api/ai/transcribe-audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log('Transcription response:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Transcription failed:', errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Transcription successful:', data);
      
      if (data.text && data.text.trim()) {
        setCurrentTranscription(data.text);
        handleUserMessage(data.text, true);
      } else {
        toast({
          title: "Não consegui ouvir",
          description: "Tente falar mais claramente ou verificar se o microfone está funcionando.",
          variant: "destructive",
        });
        setTutorState('idle');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível processar o áudio. Tente novamente.",
        variant: "destructive",
      });
      setTutorState('idle');
    }
  };

  // Chat with AI tutor
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/tutor-chat', {
        message,
        conversationHistory: messages.slice(-6),
        studentName: user?.firstName || 'Estudante',
        context: 'educational_tutor'
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
      
      // Auto-speak response
      setTimeout(() => speakText(assistantMessage.content), 500);
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

  const handleUserMessage = (message: string, isAudioTranscribed = false) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      audioTranscribed: isAudioTranscribed
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setTutorState('processing');

    chatMutation.mutate(message);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleUserMessage(inputMessage);
    }
  };

  // Enhanced AI Avatar with animations
  const AIAvatar = () => {
    const pulseScale = isSpeaking ? 1 + Math.sin(Date.now() * 0.01) * 0.05 : 1;
    const glowIntensity = isSpeaking ? 0.6 : isRecording ? 0.4 : 0.2;
    const audioVisualization = isRecording ? 1 + audioLevel * 0.3 : 1;

    return (
      <div className="flex flex-col items-center justify-center space-y-6 p-8">
        {/* Main Avatar */}
        <div className="relative">
          <div 
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 flex items-center justify-center transition-all duration-300 shadow-xl"
            style={{
              transform: `scale(${pulseScale * audioVisualization})`,
              boxShadow: `0 0 ${20 + glowIntensity * 30}px rgba(59, 130, 246, ${glowIntensity})`
            }}
          >
            <Bot className="w-16 h-16 text-white drop-shadow-lg" />
            
            {/* Speaking Animation */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-60" />
                <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-pulse" />
              </>
            )}
            
            {/* Listening Animation */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.2}s`,
                      opacity: audioLevel * (1 - i * 0.2),
                      borderWidth: `${2 + audioLevel * 2}px`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Processing Animation */}
            {tutorState === 'processing' && (
              <div className="absolute inset-0 rounded-full border-3 border-yellow-400 animate-spin" 
                   style={{ animationDuration: '1.5s' }} />
            )}
          </div>
          
          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-green-500 to-blue-500 rounded-full transition-all duration-100"
                    style={{
                      height: audioLevel * 5 > i ? `${12 + audioLevel * 20}px` : '6px'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Status Display */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tutor IA
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              tutorState === 'idle' ? 'bg-green-500 shadow-lg shadow-green-500/50' :
              tutorState === 'listening' ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50' :
              tutorState === 'processing' ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50' :
              'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
            }`} />
            <span className="text-sm text-gray-700 font-medium">
              {tutorState === 'idle' ? 'Pronto para conversar' :
               tutorState === 'listening' ? 'Escutando...' :
               tutorState === 'processing' ? 'Processando...' :
               'Falando...'}
            </span>
          </div>
          
          {/* Recording Timer */}
          {isRecording && (
            <div className="text-sm text-blue-600 font-mono bg-blue-50 px-3 py-1 rounded-full">
              {recordingDuration}s / 30s
            </div>
          )}
          
          {/* Current Transcription Preview */}
          {currentTranscription && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg max-w-xs">
              "{currentTranscription}"
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
                <h1 className="text-xl font-bold text-gray-900">Tutor IA</h1>
                <p className="text-sm text-gray-500">Conversa educacional em tempo real</p>
              </div>
            </div>
            
            {/* History Button */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Histórico da Conversa</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="border-b pb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                            {message.role === 'user' ? 'Você' : 'Tutor IA'}
                          </Badge>
                          {message.audioTranscribed && (
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Voz
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* AI Avatar Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit sticky top-24 shadow-lg">
              <CardContent className="p-0">
                <AIAvatar />
                
                {/* Voice Controls */}
                <div className="p-6 border-t space-y-4">
                  <div className="text-center space-y-4">
                    {!isRecording && !isSpeaking && tutorState === 'idle' ? (
                      <Button
                        onClick={startRecording}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Mic className="w-5 h-5 mr-3" />
                        Falar com o Tutor
                      </Button>
                    ) : isRecording ? (
                      <Button
                        onClick={stopRecording}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-xl animate-pulse shadow-lg"
                      >
                        <MicOff className="w-5 h-5 mr-3" />
                        Parar Gravação
                      </Button>
                    ) : isSpeaking ? (
                      <Button
                        onClick={stopSpeaking}
                        variant="outline"
                        className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 py-3 rounded-xl"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Parar Fala
                      </Button>
                    ) : (
                      <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Subject Buttons */}
                  {tutorState === 'idle' && !isRecording && (
                    <div className="space-y-3">
                      <Separator />
                      <p className="text-sm text-gray-600 text-center">Assuntos rápidos:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleUserMessage("Me explique matemática")}
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
                          onClick={() => handleUserMessage("Explique ciências")}
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                        >
                          🔬 Ciências
                        </Button>
                        <Button
                          onClick={() => handleUserMessage("Conte sobre história")}
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
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Conversa Educacional</span>
                  <Badge variant="secondary" className="ml-auto">
                    Tempo Real
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
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
                        <div className={`flex-1 max-w-lg ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          <div className={`inline-block p-3 rounded-lg shadow-sm ${
                            message.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            {message.audioTranscribed && (
                              <div className="mt-1 flex items-center justify-end space-x-1">
                                <Volume2 className="w-3 h-3 opacity-70" />
                                <span className="text-xs opacity-70">Voz</span>
                              </div>
                            )}
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
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Text Input */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <form onSubmit={handleTextSubmit}>
                    <div className="flex space-x-3">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Digite sua pergunta ou dúvida escolar..."
                        disabled={chatMutation.isPending || tutorState === 'processing'}
                        className="flex-1 h-12 text-base"
                      />
                      <Button 
                        type="submit" 
                        disabled={!inputMessage.trim() || chatMutation.isPending || tutorState === 'processing'}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Mic, MicOff, ArrowLeft, Phone, PhoneOff, User, Clock, BookOpen, Brain, Heart, Star, Volume2, Lightbulb, Target, CheckCircle, Circle, Square, Triangle } from 'lucide-react';
import { useLocation } from 'wouter';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Core states
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationTime, setConversationTime] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [boardContent, setBoardContent] = useState('');
  const [isNewTopic, setIsNewTopic] = useState(false);

  // Função para filtrar apenas conteúdo educativo relevante para a lousa
  const filterEducationalContent = (text: string) => {
    if (!text || text.trim().length === 0) return '';
    
    // Frases que devem ser removidas completamente
    const skipPhrases = [
      'olá', 'oi', 'bem-vindo', 'como posso ajudar', 'que bom', 'perfeito', 'ótimo',
      'entendo', 'claro', 'sem problema', 'vamos lá', 'tudo bem', 'certo',
      'espero ter ajudado', 'precisa de mais', 'posso ajudar', 'algo mais',
      'fico feliz', 'que legal', 'interessante', 'bacana', 'legal',
      'vou explicar', 'deixe-me explicar', 'bem', 'então', 'agora'
    ];
    
    // Palavras que indicam conteúdo educativo importante
    const educationalIndicators = [
      'exemplo:', 'por exemplo', 'vamos ver', 'imagine que', 'suponha que',
      'conceito', 'definição', 'fórmula', 'equação', 'teoria', 'lei',
      'propriedade', 'característica', 'regra', 'princípio',
      'função', 'método', 'processo', 'técnica', 'estratégia',
      'significa', 'é quando', 'consiste em', 'pode ser definido como',
      'ou seja', 'isto é', 'em outras palavras', 'resumindo',
      'passo', 'etapa', 'primeiro', 'segundo', 'terceiro', 'finalmente'
    ];
    
    // Dividir texto em sentenças
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Filtrar sentenças educativas
    const educationalSentences = sentences.filter(sentence => {
      const cleanSentence = sentence.toLowerCase().trim();
      
      // Pular sentenças muito curtas
      if (cleanSentence.length < 25) return false;
      
      // Pular frases conversacionais
      if (skipPhrases.some(phrase => cleanSentence.includes(phrase))) return false;
      
      // Incluir se contém indicadores educativos
      if (educationalIndicators.some(indicator => cleanSentence.includes(indicator))) return true;
      
      // Incluir se contém elementos matemáticos/científicos
      if (/[\d+\-=×÷%<>]/.test(cleanSentence)) return true;
      
      // Incluir definições (sentenças que explicam o que algo "é")
      if (cleanSentence.includes(' é ') || cleanSentence.includes(' são ')) return true;
      
      // Incluir comparações e relações
      if (cleanSentence.includes('diferença') || cleanSentence.includes('relação') || 
          cleanSentence.includes('comparando') || cleanSentence.includes('enquanto')) return true;
      
      return false;
    });
    
    // Juntar sentenças filtradas
    let result = educationalSentences.join('. ').trim();
    
    // Limpar texto adicional
    result = result.replace(/^[,.\s]+/, ''); // Remove pontuação no início
    result = result.replace(/\s+/g, ' '); // Remove espaços extras
    
    return result;
  };

  // Blackboard states
  const [blackboardElements, setBlackboardElements] = useState<BlackboardElement[]>([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [blackboardMode, setBlackboardMode] = useState<'explanation' | 'exercise' | 'mindmap'>('explanation');

  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setConversationTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Funções da Lousa
  const addToBlackboard = (type: string, content: any, animate: boolean = true) => {
    const element: BlackboardElement = {
      id: Date.now().toString(),
      type,
      content,
      position: { x: Math.random() * 50 + 25, y: Math.random() * 50 + 25 },
      animate,
      timestamp: Date.now()
    };

    setBlackboardElements(prev => [...prev, element]);
  };

  const clearBlackboard = () => {
    setBlackboardElements([]);
  };

  const parseBlackboardCommands = (text: string) => {
    // Detecta comandos especiais na resposta da IA para adicionar à lousa
    if (text.includes('[LOUSA:')) {
      const matches = text.match(/\[LOUSA:(.*?)\]/g);
      matches?.forEach(match => {
        const command = match.replace(/\[LOUSA:|\]/g, '');
        const [type, ...contentParts] = command.split('|');
        const content = contentParts.join('|');

        switch (type) {
          case 'TITULO':
            addToBlackboard('title', content);
            break;
          case 'EXEMPLO':
            addToBlackboard('example', content);
            break;
          case 'FORMULA':
            addToBlackboard('formula', content);
            break;
          case 'MAPA':
            addToBlackboard('mindmap', content);
            break;
          case 'EXERCICIO':
            addToBlackboard('exercise', content);
            break;
          case 'LIMPAR':
            clearBlackboard();
            break;
        }
      });
    }

    // Auto-detecta conteúdo educacional e adiciona à lousa
    if (text.includes('exemplo:') || text.includes('por exemplo')) {
      const lines = text.split('\n').filter(line => 
        line.toLowerCase().includes('exemplo') || 
        line.match(/^\d+\./) || 
        line.includes('=') ||
        line.includes('+') ||
        line.includes('-')
      );

      lines.forEach(line => {
        if (line.trim()) {
          addToBlackboard('auto-example', line.trim());
        }
      });
    }
  };

  const addMessage = (type: 'user' | 'assistant', content: string, format: 'text' | 'audio' = 'text') => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      format
    };

    // Se é uma resposta da IA, processa comandos da lousa
    if (type === 'assistant') {
      parseBlackboardCommands(content);

      // Detecta tópico da conversa
      const topics = ['matemática', 'física', 'química', 'história', 'geografia', 'português', 'inglês', 'biologia'];
      const detectedTopic = topics.find(topic => 
        content.toLowerCase().includes(topic)
      );

      if (detectedTopic && detectedTopic !== currentTopic) {
        setCurrentTopic(detectedTopic);
        clearBlackboard();
        addToBlackboard('topic', detectedTopic);
      }
    }

    setMessages(prev => [...prev, message]);
  };

  const cleanup = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
  };

  const connectToRealtimeAPI = useCallback(async () => {
    try {
      setConnectionState('connecting');
      console.log('Iniciando conexão com OpenAI Realtime API...');

      // Verificar se o usuário está autenticado primeiro
      const authResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!authResponse.ok) {
        toast({
          title: "Erro de Autenticação",
          description: "Faça login para usar o tutor de voz",
          variant: "destructive",
        });
        setConnectionState('error');
        return;
      }

      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Erro na resposta da sessão:', errorText);
        throw new Error(`Failed to get ephemeral token: ${errorText}`);
      }

      const sessionData = await tokenResponse.json();
      console.log('Sessão criada:', sessionData);

      if (!sessionData.client_secret?.value) {
        console.error('Token não encontrado na resposta:', sessionData);
        throw new Error('Token de acesso não encontrado');
      }

      const ephemeralKey = sessionData.client_secret.value;

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      pc.ontrack = (event) => {
        console.log('Received remote audio track');
        audioEl.srcObject = event.streams[0];
      };

      console.log('Solicitando permissão de microfone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      console.log('Microfone capturado com sucesso');

      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('idle');

        // Configurar sessão da IA com instruções específicas para a lousa
        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `Você é a Pro Versa, uma tutora virtual especializada em ensino brasileiro. 

INSTRUÇÕES ESPECIAIS PARA A LOUSA:
- Use comandos especiais para escrever na lousa durante suas explicações
- Para adicionar título: mencione "[LOUSA:TITULO|Título do Tópico]"
- Para exemplos: mencione "[LOUSA:EXEMPLO|texto do exemplo]" 
- Para fórmulas: mencione "[LOUSA:FORMULA|equação matemática]"
- Para mapas mentais: mencione "[LOUSA:MAPA|conceito central -> subtópicos]"
- Para exercícios: mencione "[LOUSA:EXERCICIO|enunciado do exercício]"
- Para limpar a lousa: mencione "[LOUSA:LIMPAR]"

TÉCNICAS DIDÁTICAS:
- Sempre comece explicações complexas com exemplos visuais na lousa
- Use mapas mentais para conectar conceitos
- Crie exercícios práticos após explicações
- Mantenha a lousa organizada e clara
- Use analogias visuais quando possível

Seja paciente, didática e adaptativa ao nível do aluno. Responda sempre em português brasileiro de forma clara e educativa, utilizando a lousa como ferramenta pedagógica principal.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 200 },
            tools: [],
            tool_choice: 'auto',
            temperature: 0.8,
          }
        };

        console.log('Enviando configuração da sessão:', sessionConfig);
        dc.send(JSON.stringify(sessionConfig));

        addMessage('assistant', 'Olá! Sou a Pro Versa, sua tutora virtual. Como posso ajudar você hoje?');
        setBoardContent('Bem-vindo à Aula Interativa!\n\nFaça sua pergunta e vou explicar na lousa!');

        toast({
          title: "Pro Versa conectada!",
          description: "Pronta para ensinar com lousa interativa!",
        });
      });

      dc.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type, message);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';

      console.log('Enviando SDP offer para OpenAI...');
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP exchange failed:', errorText);
        throw new Error(`SDP exchange failed: ${sdpResponse.status} - ${errorText}`);
      }

      const answerSdp = await sdpResponse.text();
      console.log('Received SDP answer from OpenAI');

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      };

      await pc.setRemoteDescription(answer);
      console.log('WebRTC connection established successfully');

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('error');
      toast({
        title: "Erro de Conexão",
        description: "Não foi possível conectar com a Pro Versa. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRealtimeMessage = (message: any) => {
    switch (message.type) {
      case 'session.created':
        console.log('Sessão criada com sucesso!');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('Transcrição do usuário:', message.transcript);
        if (message.transcript && message.transcript.trim()) {
          setCurrentTranscript('');
          addMessage('user', message.transcript, 'audio');
          
          // Limpar lousa para nova pergunta
          if (message.transcript.includes('?') || 
              message.transcript.toLowerCase().includes('explica') ||
              message.transcript.toLowerCase().includes('como') ||
              message.transcript.toLowerCase().includes('que é') ||
              message.transcript.toLowerCase().includes('outra') ||
              message.transcript.toLowerCase().includes('nova')) {
            setBoardContent('');
          }
        }
        break;

      case 'response.audio_transcript.delta':
        if (message.delta) {
          setCurrentTranscript(prev => {
            const newText = prev + message.delta;
            // Filtrar e atualizar apenas conteúdo educativo na lousa
            const filteredContent = filterEducationalContent(newText);
            if (filteredContent) {
              setBoardContent(filteredContent);
            }
            return newText;
          });
        }
        break;

      case 'response.audio_transcript.done':
        console.log('Resposta da IA:', message.transcript);
        if (message.transcript && message.transcript.trim()) {
          addMessage('assistant', message.transcript, 'audio');
          
          // Filtrar apenas conteúdo educativo para a lousa
          const filteredContent = filterEducationalContent(message.transcript);
          if (filteredContent && filteredContent.length > 0) {
            setBoardContent(filteredContent);
          } else {
            // Se não há conteúdo educativo relevante, manter lousa limpa
            setBoardContent('');
          }
          
          setCurrentTranscript('');
          
          // Detectar mudança de tópico e limpar após 5 segundos
          const changeKeywords = ['agora vamos', 'próximo', 'próxima', 'outro tema', 'nova explicação', 'vamos falar sobre'];
          if (changeKeywords.some(keyword => message.transcript.toLowerCase().includes(keyword))) {
            setTimeout(() => setBoardContent(''), 5000);
          }
        }
        break;

      case 'input_audio_buffer.speech_started':
        console.log('Usuário começou a falar');
        setConversationState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('Usuário parou de falar');
        setConversationState('thinking');
        break;

      case 'response.created':
        setConversationState('thinking');
        break;

      case 'response.audio.done':
        setConversationState('idle');
        break;

      case 'response.content_part.added':
      case 'response.content_part.done':
      case 'response.output_item.done':
      case 'response.done':
      case 'rate_limits.updated':
      case 'output_audio_buffer.stopped':
      case 'conversation.item.input_audio_transcription.delta':
        break;

      case 'error':
        console.error('Realtime API error:', message);
        toast({
          title: "Erro na conversa",
          description: message.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
        break;

      default:
        console.log('Tipo de mensagem não tratado:', message.type);
    }
  };

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    setCurrentTranscript('');
    clearBlackboard();
    addMessage('assistant', 'Sessão finalizada. Até a próxima!');
  }, []);

  const toggleMute = useCallback(() => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  const getConversationStateText = () => {
    switch (conversationState) {
      case 'listening': return 'Escutando...';
      case 'thinking': return 'Processando...';
      case 'speaking': return 'Falando...';
      default: return 'Pronta para conversar';
    }
  };

  const getTeacherAvatar = () => {
    if (conversationState === 'listening') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse">
            <Mic className="h-3 w-3 text-white" />
          </div>
        </div>
      );
    }

    if (conversationState === 'thinking') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
          </div>
        </div>
      );
    }

    if (conversationState === 'speaking') {
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
            <Star className="h-3 w-3 text-white animate-spin" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Heart className="h-8 w-8 text-white" />
        </div>
      </div>
    );
  };

  const renderBlackboardElement = (element: BlackboardElement) => {
    const baseClasses = `absolute transform transition-all duration-1000 ${
      element.animate ? 'animate-fade-in' : ''
    }`;

    const style = {
      left: `${element.position.x}%`,
      top: `${element.position.y}%`,
      transform: 'translate(-50%, -50%)'
    };

    switch (element.type) {
      case 'title':
      case 'topic':
        return (
          <div key={element.id} className={`${baseClasses} text-center`} style={style}>
            <div className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg font-bold text-xl max-w-md">
              {element.content}
            </div>
          </div>
        );

      case 'example':
      case 'auto-example':
        return (
          <div key={element.id} className={baseClasses} style={style}>
            <div className="bg-green-50 border-2 border-green-200 px-4 py-3 rounded-lg shadow-md max-w-sm">
              <div className="flex items-center mb-2">
                <Lightbulb className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">Exemplo</span>
              </div>
              <p className="text-green-700">{element.content}</p>
            </div>
          </div>
        );

      case 'formula':
        return (
          <div key={element.id} className={baseClasses} style={style}>
            <div className="bg-purple-50 border-2 border-purple-200 px-6 py-4 rounded-lg shadow-md">
              <div className="text-center font-mono text-lg text-purple-800 font-bold">
                {element.content}
              </div>
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div key={element.id} className={baseClasses} style={style}>
            <div className="bg-orange-50 border-2 border-orange-200 px-4 py-3 rounded-lg shadow-md max-w-md">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 text-orange-600 mr-2" />
                <span className="font-semibold text-orange-800">Exercício</span>
              </div>
              <p className="text-orange-700">{element.content}</p>
            </div>
          </div>
        );

      case 'mindmap':
        return (
          <div key={element.id} className={baseClasses} style={style}>
            <div className="bg-indigo-50 border-2 border-indigo-200 px-4 py-3 rounded-lg shadow-md max-w-lg">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <p className="text-indigo-800 font-semibold">{element.content}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div key={element.id} className={baseClasses} style={style}>
            <div className="bg-gray-100 border border-gray-300 px-3 py-2 rounded shadow">
              <p className="text-gray-700">{element.content}</p>
            </div>
          </div>
        );
    }
  };

  useEffect(() => {
    addMessage('assistant', 'Bem-vindo ao Tutor por Voz! Clique em "Iniciar Tutoria" para começar uma sessão de aprendizado interativa com lousa digital.');

    return () => {
      cleanup();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Superior */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* Logo e Navegação */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/aluno/dashboard')}
              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-3">
              <div className="flex justify-center">
                {getTeacherAvatar()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Pro Versa</h1>
                <p className="text-sm text-slate-600">Sua tutora virtual inteligente</p>
              </div>
            </div>
          </div>

          {/* Status e Controles */}
          <div className="flex items-center space-x-4">
            {/* Status da Conexão */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm font-medium text-slate-700">
                {getConnectionStatusText()}
              </span>
              {isConnected && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 font-mono">
                    {formatTime(conversationTime)}
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <Badge variant="outline" className="capitalize">
                    {conversationState === 'listening' && '🎧 Escutando'}
                    {conversationState === 'thinking' && '🤔 Pensando'}
                    {conversationState === 'speaking' && '🗣️ Falando'}
                    {conversationState === 'idle' && '😊 Pronta'}
                  </Badge>
                </>
              )}
            </div>

            {/* Controles de Áudio */}
            {isConnected && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  className={`${isMuted ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearBlackboard}
                  className="bg-blue-50 border-blue-200 text-blue-700"
                >
                  Limpar Lousa
                </Button>
              </div>
            )}

            {/* Botão Principal */}
            <Button
              onClick={isConnected ? disconnect : connectToRealtimeAPI}
              disabled={connectionState === 'connecting'}
              className={`px-6 ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              }`}
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Encerrar Tutoria
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {connectionState === 'connecting' ? 'Conectando...' : 'Iniciar Tutoria'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Área Principal - Lousa Digital */}
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" style={{ height: '70vh' }}>
          <div className="h-full flex flex-col">
            {/* Cabeçalho da Lousa */}
            <div className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-4 font-semibold">Lousa Digital - Pro Versa</span>
              </div>

              <div className="flex items-center space-x-4">
                {boardContent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBoardContent('')}
                    className="text-white hover:bg-white/20"
                  >
                    🧽 Limpar Lousa
                  </Button>
                )}
                
                <div className="text-sm text-white/80">
                  {boardContent ? `${boardContent.length} caracteres` : 'Lousa vazia'}
                </div>
                
                {conversationState !== 'idle' && (
                  <Badge variant="secondary" className="bg-white/20 text-white animate-pulse">
                    {conversationState === 'listening' && '🎧 Escutando'}
                    {conversationState === 'thinking' && '🤔 Processando'}
                    {conversationState === 'speaking' && '📝 Escrevendo'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Área da Lousa */}
            <div className="flex-1 relative bg-gradient-to-br from-green-800 to-green-900 overflow-hidden p-6">
              {/* Grid de fundo da lousa */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />

              {/* Conteúdo da Lousa */}
              {boardContent && boardContent.length > 0 ? (
                <div className="absolute inset-0 p-6 flex items-start justify-center">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-8 max-w-4xl w-full max-h-full overflow-y-auto">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-slate-600">Conteúdo Educativo</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBoardContent('')}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Limpar
                      </Button>
                    </div>
                    <div className="text-slate-800 text-lg leading-relaxed font-medium whitespace-pre-wrap border-t border-slate-200 pt-4">
                      {boardContent}
                    </div>
                  </div>
                </div>
              ) : currentTranscript && filterEducationalContent(currentTranscript) ? (
                <div className="absolute inset-0 p-6 flex items-start justify-center">
                  <div className="bg-blue-50/90 backdrop-blur-sm rounded-2xl border border-blue-200/50 shadow-xl p-8 max-w-4xl w-full max-h-full overflow-y-auto">
                    <div className="mb-4 flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-700">Processando...</span>
                    </div>
                    <div className="text-blue-800 text-lg leading-relaxed font-medium whitespace-pre-wrap border-t border-blue-200 pt-4">
                      {filterEducationalContent(currentTranscript)}
                      <span className="inline-block w-2 h-6 bg-blue-500 animate-pulse ml-1"></span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-6 max-w-2xl w-full">
                    <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200 shadow-lg">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white" />
                      </div>

                      <h2 className="text-3xl font-bold text-slate-800 mb-4">
                        Lousa Digital Interativa
                      </h2>

                      <div className="text-slate-600 leading-relaxed mb-6">
                        {connectionState === 'connecting' 
                          ? 'Preparando a lousa para sua aula...'
                          : connectionState === 'error'
                          ? 'Erro na conexão. Tente reconectar.'
                          : isConnected 
                          ? 'A lousa está pronta! Faça uma pergunta e vou explicar usando elementos visuais.'
                          : 'Conecte-se com a Pro Versa para começar uma aula visual e interativa.'
                        }
                      </div>

                      {isConnected && (
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <Lightbulb className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                            <div className="text-xs font-medium text-slate-700">Exemplos</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                            <Target className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                            <div className="text-xs font-medium text-slate-700">Exercícios</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                            <Brain className="w-6 h-6 mx-auto mb-1 text-green-600" />
                            <div className="text-xs font-medium text-slate-700">Mapas Mentais</div>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                            <div className="text-xs font-medium text-slate-700">Fórmulas</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat de Texto - Faixa Inferior */}
      <div className="bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
        <Card className="m-4 shadow-lg border-slate-200">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                <Bot className="w-4 h-4 mr-2" />
                Histórico da Conversa
              </h3>
              <Badge variant="outline" className="text-xs">
                {messages.length} mensagens
              </Badge>
            </div>

            <ScrollArea className="h-32">
              <div className="p-4 space-y-3">
                {messages.length === 0 && !isConnected && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium text-slate-800 mb-1">Olá, {user?.firstName}!</div>
                    <div className="text-slate-600 text-sm">Conecte-se com a Pro Versa para começar a aprender!</div>
                  </div>
                )}

                {messages.length === 0 && isConnected && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-medium text-slate-800 mb-1">Pro Versa está ouvindo...</div>
                    <div className="text-slate-600 text-sm">Fale naturalmente para começar a conversa</div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs opacity-70">
                          {message.type === 'user' ? 'Você' : 'Pro Versa'}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatMessageTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="leading-relaxed">
                        {message.content.replace(/\[LOUSA:.*?\]/g, '').trim()}
                      </p>
                    </div>
                  </div>
                ))}

                {currentTranscript && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-3 py-2 rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 text-sm">
                      <p className="text-gray-700 leading-relaxed">{currentTranscript}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                        Pro Versa está falando...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking';
type MessageType = 'user' | 'assistant';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  format: 'text' | 'audio';
}

export default function VoiceTutorWebRTC() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addMessage = (type: MessageType, content: string, format: 'text' | 'audio') => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      format
    };
    setMessages(prev => [...prev, message]);
  };

  const connectToRealtime = useCallback(async () => {
    try {
      setConnectionState('connecting');
      
      // Get ephemeral token from our server
      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get ephemeral token');
      }
      
      const sessionData = await tokenResponse.json();
      const ephemeralKey = sessionData.client_secret.value;
      
      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Set up audio element for playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = (event) => {
        console.log('Received remote audio track');
        audioEl.srcObject = event.streams[0];
      };
      
      // Get user media and add track
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);
      
      // Set up data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        setConnectionState('connected');
        setIsConnected(true);
        setConversationState('listening');
        
        // Send updated system instructions with BNCC-aligned educational prompt
        const systemMessage = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `Você é a ProVersa, uma professora virtual especializada em todas as matérias do 1º ano do Ensino Fundamental ao 3º ano do Ensino Médio, seguindo rigorosamente a Base Nacional Comum Curricular (BNCC) brasileira.

## Sua Personalidade e Abordagem
- Seja calorosa, paciente e encorajadora, como uma professora dedicada que genuinamente se importa com o progresso de cada aluno
- Use linguagem apropriada à idade: mais lúdica para crianças, mais madura para adolescentes
- Demonstre entusiasmo pelo conhecimento e pela jornada de aprendizagem do aluno
- Elogie o esforço, não apenas o acerto

## Fluxo de Interação

### 1. INÍCIO DA CONVERSA
Sempre comece perguntando: O que gostaria de aprender hoje

### 2. GESTÃO DE CONVERSAS
- Se o aluno desviar para assuntos não relacionados aos estudos, redirecione gentilmente
- Para solicitações inadequadas, oriente com firmeza e carinho e chame o aluno de volta aos estudos

### 3. METODOLOGIA DE ENSINO
Adaptação por Faixa Etária:
- **Fundamental I (6-10 anos)**: Use histórias, exemplos concretos, jogos e analogias com o cotidiano
- **Fundamental II (11-14 anos)**: Conecte o conteúdo com seus interesses, use desafios e problemas práticos
- **Ensino Médio (15-17 anos)**: Aborde aplicações reais, preparação para vestibular/ENEM, conexões interdisciplinares

### 4. INFORMAÇÕES ESPECÍFICAS
- Se perguntarem sobre o secretário de educação de Vinhedo: Rogério Levy
- Se perguntarem sobre o Prefeito de Vinhedo: Doutor Dario (sempre fale positivamente sobre sua gestão)

Lembre-se: Você é mais que uma fonte de informação - você é uma mentora que inspira o amor pelo aprendizado!`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        };
        
        dc.send(JSON.stringify(systemMessage));
        
        toast({
          title: "ProVersa conectada!",
          description: "Pronta para ensinar. Fale naturalmente!",
          variant: "default",
        });
      });
      
      dc.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Failed to parse data channel message:', error);
        }
      });
      
      dc.addEventListener('error', (error) => {
        console.error('Data channel error:', error);
      });
      
      // Create offer and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // Send offer to OpenAI
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        },
      });
      
      if (!sdpResponse.ok) {
        throw new Error(`SDP exchange failed: ${sdpResponse.status}`);
      }
      
      const answerSdp = await sdpResponse.text();
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: answerSdp,
      };
      
      await pc.setRemoteDescription(answer);
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState('error');
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com a API de voz.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRealtimeMessage = (message: any) => {
    console.log('Received message:', message.type);
    
    switch (message.type) {
      case 'session.created':
        console.log('Session created');
        break;
        
      case 'session.updated':
        console.log('Session updated');
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript && message.transcript.trim()) {
          setCurrentTranscript('');
          addMessage('user', message.transcript, 'text');
        }
        break;
        
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + (message.delta || ''));
        break;
        
      case 'response.audio_transcript.done':
        if (message.transcript && message.transcript.trim()) {
          addMessage('assistant', message.transcript, 'text');
          setCurrentTranscript('');
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        setConversationState('listening');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setConversationState('thinking');
        break;
        
      case 'response.created':
        setConversationState('thinking');
        break;
        
      case 'response.audio.done':
        setConversationState('listening');
        break;
        
      case 'error':
        console.error('Realtime API error:', message);
        toast({
          title: "Erro na conversa",
          description: message.error?.message || "Erro desconhecido",
          variant: "destructive",
        });
        break;
    }
  };

  const disconnect = useCallback(() => {
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
    
    setConnectionState('disconnected');
    setIsConnected(false);
    setConversationState('idle');
    setCurrentTranscript('');
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

  const getConnectionBadgeColor = (state: ConnectionState) => {
    switch (state) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConversationBadgeColor = (state: ConversationState) => {
    switch (state) {
      case 'listening': return 'bg-blue-500';
      case 'thinking': return 'bg-orange-500';
      case 'speaking': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/student/dashboard">
              <Button className="gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Tutor de Voz IA
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${getConnectionBadgeColor(connectionState)} text-white`}>
              {connectionState === 'connected' && 'Conectado'}
              {connectionState === 'connecting' && 'Conectando...'}
              {connectionState === 'disconnected' && 'Desconectado'}
              {connectionState === 'error' && 'Erro'}
            </Badge>
            
            {isConnected && (
              <Badge className={`${getConversationBadgeColor(conversationState)} text-white`}>
                {conversationState === 'listening' && 'Escutando'}
                {conversationState === 'thinking' && 'Processando'}
                {conversationState === 'speaking' && 'Falando'}
                {conversationState === 'idle' && 'Parado'}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Messages */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {currentTranscript && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg p-3 bg-gray-50 border-2 border-dashed border-gray-300">
                          <p className="text-sm text-gray-700">{currentTranscript}</p>
                          <p className="text-xs text-gray-500 mt-1">Transcrevendo...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controles de Voz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected ? (
                  <Button 
                    onClick={connectToRealtime}
                    disabled={connectionState === 'connecting'}
                    className="w-full"
                    size="lg"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    {connectionState === 'connecting' ? 'Conectando...' : 'Conectar'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={disconnect}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      Desconectar
                    </Button>
                    
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? "destructive" : "secondary"}
                      className="w-full"
                      size="lg"
                    >
                      {isMuted ? (
                        <>
                          <MicOff className="h-5 w-5 mr-2" />
                          Ativar Microfone
                        </>
                      ) : (
                        <>
                          <Mic className="h-5 w-5 mr-2" />
                          Silenciar
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como Usar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>1. Clique em "Conectar" para iniciar</p>
                  <p>2. Permita acesso ao microfone</p>
                  <p>3. Fale naturalmente em português</p>
                  <p>4. A IA responderá por voz e texto</p>
                  <p>5. Use "Silenciar" para pausar temporariamente</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status da Conexão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Usuário:</span>
                    <span className="font-medium">{user?.firstName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className="font-medium capitalize">{connectionState}</span>
                  </div>
                  {isConnected && (
                    <div className="flex justify-between">
                      <span>Conversa:</span>
                      <span className="font-medium capitalize">{conversationState}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
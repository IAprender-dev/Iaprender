import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceTutorSimple() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
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
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
  };

  const handleRealtimeMessage = (message: any) => {
    console.log('Received message:', message.type, message);
    
    switch (message.type) {
      case 'session.created':
        console.log('Session created successfully');
        break;
        
      case 'session.updated':
        console.log('Session updated - ProVersa ready');
        setIsConnected(true);
        setIsListening(true);
        toast({
          title: "ProVersa conectada!",
          description: "Fale naturalmente para conversar.",
          variant: "default",
        });
        break;
        
      case 'conversation.item.input_audio_transcription.completed':
        if (message.transcript && message.transcript.trim()) {
          console.log('User said:', message.transcript);
          addMessage('user', message.transcript);
          setCurrentTranscript('');
        }
        break;
        
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + (message.delta || ''));
        break;
        
      case 'response.audio_transcript.done':
        if (message.transcript && message.transcript.trim()) {
          console.log('ProVersa said:', message.transcript);
          addMessage('assistant', message.transcript);
          setCurrentTranscript('');
        }
        break;
        
      case 'input_audio_buffer.speech_started':
        console.log('User started speaking');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        console.log('User stopped speaking');
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

  const connectToProVersa = useCallback(async () => {
    if (isConnected) return;
    
    try {
      // Get session token
      const sessionResponse = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!sessionResponse.ok) {
        throw new Error('Falha ao obter token de sessão');
      }
      
      const sessionData = await sessionResponse.json();
      const ephemeralKey = sessionData.client_secret.value;
      
      // Setup WebRTC
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      
      // Setup audio output
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;
      
      pc.ontrack = (event) => {
        console.log('Received audio track from ProVersa');
        audioEl.srcObject = event.streams[0];
      };
      
      // Setup microphone
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
      
      // Setup data channel
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;
      
      dc.addEventListener('open', () => {
        console.log('Data channel opened - sending session config');
        
        // Send session configuration
        const sessionMessage = {
          type: 'session.update',
          session: {
            instructions: `Você é a Pro Versa, tutora educacional especializada. Sempre fale de forma natural e educativa em português brasileiro.`,
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        };
        
        dc.send(JSON.stringify(sessionMessage));
      });
      
      dc.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
      
      dc.addEventListener('error', (error) => {
        console.error('Data channel error:', error);
        toast({
          title: "Erro de conexão",
          description: "Problema na comunicação com a ProVersa.",
          variant: "destructive",
        });
      });
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      const response = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          'Authorization': `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp'
        }
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI connection failed: ${response.status}`);
      }
      
      const answer = await response.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });
      
      toast({
        title: "Conectando...",
        description: "Estabelecendo conexão com a ProVersa.",
        variant: "default",
      });
      
    } catch (error) {
      console.error('Connection error:', error);
      cleanup();
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar à ProVersa. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);

  const disconnect = () => {
    cleanup();
    toast({
      title: "Desconectado",
      description: "Conversa com a ProVersa encerrada.",
      variant: "default",
    });
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ProVersa - Tutora de Voz</h1>
                <p className="text-gray-600">Converse naturalmente para aprender</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              {!isConnected ? (
                <Button 
                  onClick={connectToProVersa} 
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Mic className="h-5 w-5 mr-2" />
                  Conectar à ProVersa
                </Button>
              ) : (
                <Button 
                  onClick={disconnect} 
                  variant="destructive"
                  size="lg"
                >
                  <MicOff className="h-5 w-5 mr-2" />
                  Desconectar
                </Button>
              )}
              
              {isConnected && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">
                    {isListening ? 'Ouvindo...' : 'Conectado'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messages.length === 0 && !isConnected && (
                <p className="text-gray-500 text-center py-8">
                  Clique em "Conectar à ProVersa" para começar a conversar
                </p>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-100 ml-8' 
                      : 'bg-purple-100 mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium mb-1">
                        {message.role === 'user' ? 'Você' : 'ProVersa'}
                      </p>
                      <p className="text-gray-800">{message.content}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {currentTranscript && (
                <div className="p-3 rounded-lg bg-purple-50 mr-8 border-l-4 border-purple-300">
                  <p className="font-medium mb-1">ProVersa (falando...)</p>
                  <p className="text-gray-700">{currentTranscript}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
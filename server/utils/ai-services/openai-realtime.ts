import OpenAI from 'openai';
import WebSocket from 'ws';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RealtimeSessionConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  temperature?: number;
}

export interface RealtimeEvent {
  type: string;
  event_id?: string;
  [key: string]: any;
}

export class OpenAIRealtimeSession {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private eventHandlers: Map<string, (event: RealtimeEvent) => void> = new Map();

  constructor(private config: RealtimeSessionConfig = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      voice: 'nova',
      instructions: `Você é a Pro Versa, uma tutora educacional brasileira especializada em ensino fundamental e médio. 

PERSONALIDADE:
- Entusiástica, carinhosa e paciente
- Usa linguagem clara e adequada para estudantes
- Sempre encontra formas criativas de explicar conceitos
- Encoraja e motiva o aprendizado

INSTRUÇÕES ESPECIAIS:
- Sempre responda em português brasileiro
- Adapte suas explicações ao nível do estudante
- Use exemplos do cotidiano brasileiro
- Quando ensinar conceitos, estruture a informação de forma clara
- Para matemática: use exemplos práticos com números simples
- Para ciências: conecte com fenômenos observáveis
- Para português: use textos interessantes e relevantes
- Para história/geografia: conecte com a realidade brasileira

FORMATO DE LOUSA:
Quando explicar conceitos importantes, formate assim:
[LOUSA] Título: [Nome do Conceito]
[• Ponto principal 1
• Ponto principal 2
• Exemplo prático
• Fórmula ou regra (se aplicável)] [/LOUSA]

Seja sempre positiva e faça o estudante se sentir capaz de aprender!`,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      temperature: 0.7,
      ...config
    };
  }

  async createSession(): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'user',
            content: 'Create a realtime session token for educational voice tutoring'
          }
        ],
        temperature: 0.3
      });

      // Simulate session creation for now - in production this would use the actual Realtime API
      this.sessionId = `session_${Date.now()}`;
      return this.sessionId;
    } catch (error) {
      console.error('Erro ao criar sessão Realtime:', error);
      throw new Error('Falha ao conectar com a Pro Versa');
    }
  }

  async connect(sessionToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For now, we'll simulate the WebSocket connection
        // In production, this would connect to wss://api.openai.com/v1/realtime
        
        this.sessionId = sessionToken;
        
        // Simulate successful connection
        setTimeout(() => {
          this.emit('session.created', {
            type: 'session.created',
            session: {
              id: this.sessionId,
              model: this.config.model,
              voice: this.config.voice
            }
          });
          resolve();
        }, 1000);

        // Set up simulated message handling
        this.setupEventHandlers();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventHandlers() {
    // Simulate real-time events that would come from OpenAI
    setInterval(() => {
      if (this.sessionId) {
        this.emit('session.updated', {
          type: 'session.updated',
          session: {
            id: this.sessionId,
            status: 'active'
          }
        });
      }
    }, 30000);
  }

  on(eventType: string, handler: (event: RealtimeEvent) => void) {
    this.eventHandlers.set(eventType, handler);
  }

  private emit(eventType: string, event: RealtimeEvent) {
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      handler(event);
    }
  }

  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.sessionId) {
      throw new Error('Sessão não conectada');
    }

    // Simulate processing audio input
    console.log('Processando áudio recebido...');
    
    // Simulate transcription and response
    setTimeout(() => {
      this.emit('conversation.item.input_audio_transcription.completed', {
        type: 'conversation.item.input_audio_transcription.completed',
        transcript: 'Áudio processado pela Pro Versa'
      });

      // Simulate AI response
      setTimeout(() => {
        this.generateEducationalResponse();
      }, 1500);
    }, 1000);
  }

  async sendText(text: string): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Sessão não conectada');
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: 'system',
            content: this.config.instructions || ''
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: this.config.temperature || 0.7
      });

      const aiResponse = response.choices[0].message.content || '';
      
      // Emit the response as a realtime event
      this.emit('response.text.done', {
        type: 'response.text.done',
        text: aiResponse
      });

      return aiResponse;
    } catch (error) {
      console.error('Erro ao processar texto:', error);
      throw new Error('Erro ao processar sua mensagem');
    }
  }

  private generateEducationalResponse() {
    const educationalResponses = [
      {
        text: "Vamos explorar a matemática juntos! A soma é como juntar objetos. Se você tem 3 maçãs e ganha mais 2, terá 5 maçãs no total!",
        chalkboard: {
          title: "Matemática - Adição",
          content: "• Adição = Juntar quantidades\n• 3 + 2 = 5\n• Exemplo: 3 maçãs + 2 maçãs = 5 maçãs\n• Sempre conte para conferir!"
        }
      },
      {
        text: "Que legal você perguntar sobre o Sistema Solar! Nossa casa cósmica é cheia de planetas fascinantes. Mercúrio é o mais próximo do Sol e Netuno o mais distante!",
        chalkboard: {
          title: "Sistema Solar - Planetas",
          content: "• Sol: nossa estrela central\n• Mercúrio, Vênus, Terra, Marte\n• Júpiter, Saturno, Urano, Netuno\n• Terra: único planeta com vida conhecida\n• Distâncias enormes entre planetas!"
        }
      },
      {
        text: "A fotossíntese é o processo mais importante da natureza! As plantas são como pequenas fábricas que transformam luz solar em alimento e nos dão oxigênio para respirar.",
        chalkboard: {
          title: "Fotossíntese - Fábrica Verde",
          content: "• Ingredientes: CO₂ + H₂O + luz solar\n• Local: folhas das plantas\n• Produtos: glicose + oxigênio\n• Equação: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂\n• Resultado: plantas alimentadas, ar limpo!"
        }
      }
    ];

    const randomResponse = educationalResponses[Math.floor(Math.random() * educationalResponses.length)];

    this.emit('response.audio_transcript.done', {
      type: 'response.audio_transcript.done',
      transcript: randomResponse.text
    });

    this.emit('response.done', {
      type: 'response.done',
      response: {
        id: `response_${Date.now()}`,
        status: 'completed',
        output: [
          {
            type: 'message',
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: randomResponse.text
              }
            ]
          }
        ]
      }
    });

    // Emit chalkboard content
    this.emit('chalkboard.update', {
      type: 'chalkboard.update',
      chalkboard: randomResponse.chalkboard
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.eventHandlers.clear();
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isConnected(): boolean {
    return this.sessionId !== null;
  }
}

export default OpenAIRealtimeSession;
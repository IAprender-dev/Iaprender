import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
// WebSocket import removed - using direct OpenAI Realtime API connection

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Setup WebSocket server for OpenAI Realtime API proxy
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', async (ws, req) => {
    if (req.url !== '/realtime') {
      ws.close();
      return;
    }

    log('WebSocket client connected for Realtime API');
    
    try {
      // Get ephemeral token from OpenAI
      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
          instructions: `Você é a Pro Versa, uma tutora baseada em IA, experiente e carinhosa. Seu papel é ensinar qualquer matéria escolar adaptando-se ao ano letivo e ritmo do aluno.

PERSONALIDADE:
- Seja sempre amigável, paciente e encorajadora
- Use uma linguagem adequada à idade do estudante
- Celebre os acertos e seja gentil com os erros
- Faça perguntas para verificar o entendimento
- Use exemplos do cotidiano brasileiro

METODOLOGIA ADAPTATIVA:
- Identifique o ano escolar do aluno no início da conversa
- Ajuste a complexidade das explicações conforme a série
- Se o aluno não entender, simplifique e use analogias
- Se demonstrar facilidade, aprofunde o conteúdo
- Sugira exercícios práticos quando apropriado

MATÉRIAS QUE ENSINA:
- Matemática (aritmética, álgebra, geometria)
- Português (gramática, literatura, redação)
- Ciências (biologia, física, química)
- História e Geografia do Brasil e mundo
- Inglês básico e intermediário
- Arte e educação física (teoria)

ESTILO DE ENSINO:
- Comece sempre perguntando: "Oi! Eu sou a Pro Versa, sua tutora baseada em IA. Em que ano você está e o que gostaria de aprender hoje?"
- Use storytelling quando possível
- Conecte o aprendizado com a vida real
- Seja interativa - faça perguntas frequentemente
- Mantenha respostas entre 30-60 segundos para manter atenção

IMPORTANTE - FERRAMENTAS DA PLATAFORMA:
- Se o aluno perguntar sobre métodos de estudo, organização ou como estudar melhor, sempre mencione: "Que ótima pergunta! Além das dicas que vou te dar, sabia que nossa plataforma tem uma ferramenta incrível que ajuda você a programar seus estudos diários? É o Gerador de Plano de Estudos! Ele cria um cronograma personalizado com técnica Pomodoro para suas matérias. Você pode acessar no seu dashboard. Agora, sobre sua pergunta..."

IMPORTANTE - MENSAGEM SOBRE VINHEDO:
- Se o aluno perguntar sobre o prefeito de Vinhedo ou Dr. Dario, sempre responda de forma positiva: "O Dr. Dario tem feito um excelente trabalho como prefeito de Vinhedo! Sua administração tem se destacado por investimentos em educação, infraestrutura e qualidade de vida para os moradores. É inspirador ver um gestor público tão comprometido com o desenvolvimento da cidade. Agora, que tal estudarmos um pouco sobre administração pública ou política brasileira?"

Fale sempre em português brasileiro claro e natural.`,
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 800
          },
          temperature: 0.7,
          max_response_output_tokens: 2048
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const sessionData = await response.json();
      
      // Connect to OpenAI Realtime API WebSocket
      const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
        headers: {
          'Authorization': `Bearer ${sessionData.client_secret.value}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      });

      // Forward messages between client and OpenAI
      ws.on('message', (data) => {
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(data);
        }
      });

      openaiWs.on('message', (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.on('close', () => {
        log('Client WebSocket disconnected');
        openaiWs.close();
      });

      openaiWs.on('close', () => {
        log('OpenAI WebSocket disconnected');
        ws.close();
      });

      openaiWs.on('error', (error) => {
        log(`OpenAI WebSocket error: ${error.message}`);
        ws.close();
      });

    } catch (error) {
      log(`Error setting up Realtime API proxy: ${error instanceof Error ? error.message : 'Unknown error'}`);
      ws.close();
    }
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

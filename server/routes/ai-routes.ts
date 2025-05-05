import { Router, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { 
  OpenAIService, 
  AnthropicService, 
  PerplexityService,
  checkAIServicesAvailability
} from "../utils/ai-services";

// Configure multer para upload de imagens
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/png' || 
      file.mimetype === 'image/webp'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
  },
});

// Configure multer para upload de PDFs
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit para PDFs
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware para verificar se o usuário está autenticado
// Temporariamente permitindo todos os acessos para desenvolvimento
const authenticate = (_req: Request, _res: Response, next: Function) => {
  // Em produção, descomentar o código abaixo:
  /*
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  */
  next();
};

// Middleware para verificar se o usuário tem contrato
// Temporariamente permitindo acesso a todos os usuários para fins de desenvolvimento
const hasContract = async (req: Request, res: Response, next: Function) => {
  // Permitindo acesso para todos os usuários
  next();
  // Em produção, descomentar o código abaixo:
  /*
  const user = req.session.user;
  if (!user.contractId) {
    return res.status(403).json({ 
      message: "You don't have access to AI tools. Contact your administrator." 
    });
  }
  next();
  */
};

const aiRouter = Router();

// Rota para verificar disponibilidade de serviços
aiRouter.get("/availability", authenticate, async (_req: Request, res: Response) => {
  try {
    const availability = await checkAIServicesAvailability();
    return res.status(200).json(availability);
  } catch (error: any) {
    console.error("Error checking AI services availability:", error);
    return res.status(500).json({ message: "Error checking services" });
  }
});

// Schema para validação da solicitação de chat
const chatRequestSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
});

// Rota para OpenAI (GPT)
aiRouter.post("/openai/chat", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const { prompt, model, temperature, maxTokens } = chatRequestSchema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model,
      temperature,
      maxTokens
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in OpenAI chat endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para geração de imagens com DALL-E
aiRouter.post("/openai/image", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      prompt: z.string().min(1).max(4000),
      size: z.string().optional(),
      quality: z.string().optional(),
      n: z.number().min(1).max(4).optional(),
    });
    
    const { prompt, size, quality, n } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    const result = await OpenAIService.generateImage({
      userId,
      contractId,
      prompt,
      size,
      quality,
      n
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in image generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para Anthropic (Claude)
aiRouter.post("/anthropic/chat", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      prompt: z.string().min(1).max(100000),
      system: z.string().optional(),
      model: z.string().optional(),
      maxTokens: z.number().positive().optional(),
      temperature: z.number().min(0).max(1).optional(),
    });
    
    const { prompt, system, model, maxTokens, temperature } = schema.parse(req.body);
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ message: "Anthropic service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    const result = await AnthropicService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      system,
      model,
      maxTokens,
      temperature
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in Anthropic chat endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para análise de imagem com Claude
aiRouter.post(
  "/anthropic/image",
  authenticate,
  hasContract,
  imageUpload.single('image'),
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        prompt: z.string().min(1).max(4000).optional(),
      });
      
      // Garantir que foi enviada uma imagem
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      const { prompt } = schema.parse(req.body);
      
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({ message: "Anthropic service is not available" });
      }
      
      const userId = req.session.user?.id || 1; // Valor temporário
      const contractId = req.session.user?.contractId || 1; // Valor temporário
      
      // Converter imagem para base64
      const imageBase64 = req.file.buffer.toString('base64');
      
      const result = await AnthropicService.analyzeImage(
        userId,
        contractId,
        imageBase64,
        prompt
      );
      
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error in image analysis endpoint:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Rota para geração de atividades educacionais
aiRouter.post("/openai/activity", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      tema: z.string().min(1).max(1000),
      materia: z.string(),
      serie: z.string(),
      tipoAtividade: z.string(),
      quantidadeQuestoes: z.number().min(1).max(20),
      nivelDificuldade: z.string(),
      incluirGabarito: z.boolean().optional().default(true),
    });
    
    const { tema, materia, serie, tipoAtividade, quantidadeQuestoes, nivelDificuldade, incluirGabarito } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário

    // Constrói o prompt para geração da atividade
    // Aqui está o novo prompt personalizado que pode ser modificado
    const promptAtividade = `
      Você é um educador especialista que cria atividades educacionais de alta qualidade.
      
      Crie uma atividade educacional completa com as seguintes características:
      - Tema: ${tema}
      - Matéria: ${materia}
      - Série/Ano: ${serie}
      - Tipo de atividade: ${tipoAtividade}
      - Quantidade de questões: ${quantidadeQuestoes} (IMPORTANTE: gere EXATAMENTE este número de questões)
      - Nível de dificuldade: ${nivelDificuldade}
      - Incluir gabarito: ${incluirGabarito ? 'Sim' : 'Não'}
      
      DIRETRIZES IMPORTANTES:
      - Crie questões desafiadoras e criativas, não apenas memorização de fatos
      - Use linguagem apropriada para a idade dos estudantes
      - Inclua questões que desenvolvam pensamento crítico
      - Evite estereótipos ou exemplos ultrapassados
      - Use exemplos do cotidiano para ajudar na compreensão
      - As alternativas de múltipla escolha devem ser plausíveis, não óbvias
      - Inclua questões que testem diferentes níveis de conhecimento (básico, intermediário, avançado)
      
      A atividade deve ser formatada em HTML seguindo o formato abaixo:
      
      <div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <header style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #3b82f6; padding-bottom: 1rem;">
          <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">[TÍTULO DA ATIVIDADE]</h1>
          <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
            <p><strong>Disciplina:</strong> [MATÉRIA]</p>
            <p><strong>Série:</strong> [SÉRIE]</p>
            <p><strong>Tipo:</strong> [TIPO DE ATIVIDADE]</p>
          </div>
        </header>
        
        <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 2rem;">
          <p style="margin: 0; font-style: italic;">[INSTRUÇÕES DA ATIVIDADE]</p>
        </div>
        
        <div class="questions">
          <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question;">
            [LISTA DE QUESTÕES AQUI, CADA UMA COM HTML SEMELHANTE AO EXEMPLO ABAIXO]
            <li style="margin-bottom: 1.5rem; counter-increment: question; position: relative;">
              <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1e3a8a;">
                Questão 1: [TEXTO DA QUESTÃO AQUI]
              </div>
              <div style="background-color: #f9fafb; padding: 0.75rem; border-radius: 0.375rem; margin-top: 0.5rem;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                    <span>[ALTERNATIVA A]</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                    <span>[ALTERNATIVA B]</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                    <span>[ALTERNATIVA C]</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                    <span>[ALTERNATIVA D]</span>
                  </div>
                </div>
              </div>
            </li>
          </ol>
        </div>
        
        [INCLUIR GABARITO AQUI SE SOLICITADO]
        
        <footer style="margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
          <p>Atividade gerada por iAula - [DATA]</p>
        </footer>
      </div>
      
      Fornece uma atividade educacional completa em HTML, seguindo as diretrizes acima. A atividade deve incluir:
      1. Um título relevante e criativo para o tema
      2. Instruções claras e específicas para os alunos
      3. EXATAMENTE ${quantidadeQuestoes} questões de múltipla escolha sobre o tema, com 4 alternativas cada
      4. Se solicitado, um gabarito completo com as respostas corretas e explicações breves sobre cada resposta
      
      Use formatação HTML bem estruturada com estilos CSS inline conforme o exemplo.`;
      
    // Define o prompt que será usado
    const prompt = promptAtividade;
    
    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 8000  // Aumentamos o limite para atividades completas e mais elaboradas
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in activity generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para geração de atividades educacionais com base em PDF
aiRouter.post(
  "/openai/activity-with-pdf",
  authenticate,
  hasContract,
  pdfUpload.single('pdfFile'),
  async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        tema: z.string().min(1).max(1000),
        materia: z.string(),
        serie: z.string(),
        tipoAtividade: z.string(),
        quantidadeQuestoes: z.string().transform(val => parseInt(val, 10)),
        nivelDificuldade: z.string(),
        incluirGabarito: z.string().transform(val => val === 'true'),
        usarPdf: z.string().transform(val => val === 'true')
      });
      
      // Garantir que foi enviado um PDF
      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" });
      }
      
      const parsedBody = schema.parse(req.body);
      const { tema, materia, serie, tipoAtividade, quantidadeQuestoes, nivelDificuldade, incluirGabarito } = parsedBody;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ message: "OpenAI service is not available" });
      }
      
      const userId = req.session.user?.id || 1; // Valor temporário
      const contractId = req.session.user?.contractId || 1; // Valor temporário
      
      // Converter PDF para base64
      const pdfBase64 = req.file.buffer.toString('base64');
      
      // Construir prompt para análise do PDF com instruções claras
      const promptAnalisePDF = `
        Você é um educador especialista que cria atividades educacionais de alta qualidade.
        
        Analisei o PDF fornecido e agora preciso criar uma atividade educacional com base no seu conteúdo,
        com as seguintes características:
        
        - Tema: ${tema}
        - Matéria: ${materia}
        - Série/Ano: ${serie}
        - Tipo de atividade: ${tipoAtividade}
        - Quantidade de questões: ${quantidadeQuestoes} (IMPORTANTE: gere EXATAMENTE este número de questões)
        - Nível de dificuldade: ${nivelDificuldade}
        - Incluir gabarito: ${incluirGabarito ? 'Sim' : 'Não'}
        
        DIRETRIZES IMPORTANTES:
        - Crie questões diretamente relacionadas ao conteúdo do PDF fornecido
        - Use terminologia e exemplos do próprio material
        - Mantenha o nível de dificuldade e linguagem adequados para a série indicada
        - As questões devem testar a compreensão do conteúdo do PDF
        - Inclua questões que desenvolvam pensamento crítico
        - As alternativas de múltipla escolha devem ser plausíveis, não óbvias
        - Distribua as questões para cobrir diferentes partes do conteúdo
        
        A atividade deve ser formatada em HTML seguindo o formato abaixo:
        
        <div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
          <header style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #3b82f6; padding-bottom: 1rem;">
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">[TÍTULO DA ATIVIDADE]</h1>
            <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
              <p><strong>Disciplina:</strong> [MATÉRIA]</p>
              <p><strong>Série:</strong> [SÉRIE]</p>
              <p><strong>Tipo:</strong> [TIPO DE ATIVIDADE]</p>
            </div>
          </header>
          
          <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 2rem;">
            <p style="margin: 0; font-style: italic;">[INSTRUÇÕES DA ATIVIDADE]</p>
          </div>
          
          <div class="questions">
            <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question;">
              [LISTA DE QUESTÕES AQUI]
            </ol>
          </div>
          
          [INCLUIR GABARITO AQUI SE SOLICITADO]
          
          <footer style="margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
            <p>Atividade gerada por iAula - Baseada no material fornecido</p>
          </footer>
        </div>
        
        Forneça uma atividade educacional completa em HTML, seguindo as diretrizes acima. A atividade deve incluir:
        1. Um título relevante que mencione o tema e o material de referência
        2. Instruções claras e específicas para os alunos
        3. EXATAMENTE ${quantidadeQuestoes} questões de múltipla escolha sobre o conteúdo do PDF, com 4 alternativas cada
        4. Se solicitado, um gabarito completo com as respostas corretas e explicações breves sobre cada resposta
        
        Use formatação HTML bem estruturada com estilos CSS inline conforme o exemplo.
      `;
      
      // Use o nome do arquivo como parte da informação contextual
      const pdfContext = `O PDF fornecido é: ${req.file.originalname}. Utilize seu conteúdo para criar a atividade.`;
      
      // Primeiro, analisar o PDF usando o modelo de visão
      const response = await OpenAIService.analyzeDocument({
        userId,
        contractId,
        file: pdfBase64,
        prompt: `Analise este PDF educacional sobre ${tema} para a matéria de ${materia} para ${serie}. Extraia os principais conceitos, definições, exemplos e pontos importantes que podem ser usados para criar uma atividade educacional.`,
        model: "gpt-4o",  // Usando o modelo mais atual
        maxTokens: 8000
      });
      
      // Agora, usar a análise para gerar a atividade
      const promptFinal = `
        ${promptAnalisePDF}
        
        Análise do conteúdo do PDF:
        ${response.content}
        
        ${pdfContext}
        
        Com base na análise acima, crie uma atividade educacional completa que utilize especificamente o conteúdo do PDF fornecido.
      `;
      
      const result = await OpenAIService.generateChatCompletion({
        userId,
        contractId,
        prompt: promptFinal,
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 8000  // Limite ampliado para comportar atividades complexas
      });
      
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error in PDF-based activity generation endpoint:", error);
      return res.status(500).json({ message: error.message });
    }
  }
);

// Rota para Perplexity (Pesquisa)
aiRouter.post("/perplexity/search", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      query: z.string().min(1).max(4000),
      model: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().positive().optional(),
      includeReferences: z.boolean().optional(),
    });
    
    const { query, model, temperature, maxTokens, includeReferences } = schema.parse(req.body);
    
    if (!process.env.PERPLEXITY_API_KEY) {
      return res.status(503).json({ message: "Perplexity service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    const result = await PerplexityService.performSearch({
      userId,
      contractId,
      query,
      model,
      temperature,
      maxTokens,
      includeReferences
    });
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in Perplexity search endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para geração de atividades educacionais
aiRouter.post("/education/generate-activity", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      tema: z.string().min(1).max(200),
      materia: z.string(),
      serie: z.string(),
      tipoAtividade: z.string(),
      quantidadeQuestoes: z.number().int().min(1).max(20),
      nivelDificuldade: z.string(),
      incluirGabarito: z.boolean()
    });
    
    const params = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    // Construir um prompt detalhado para o OpenAI
    const prompt = `
      Crie uma atividade educacional completa com as seguintes características:
      
      - Tema: ${params.tema}
      - Matéria: ${params.materia}
      - Série/Ano: ${params.serie}
      - Tipo de atividade: ${params.tipoAtividade}
      - Quantidade de questões: ${params.quantidadeQuestoes} (IMPORTANTE: gere exatamente esse número de questões, não menos)
      - Nível de dificuldade: ${params.nivelDificuldade}
      - Incluir gabarito: ${params.incluirGabarito ? 'Sim' : 'Não'}
      
      A atividade deve seguir um formato HTML que possa ser exibido diretamente em uma página web.
      Use tags div, h1, h2, ol, li, etc. e inclua estilização inline (style="...") para uma boa formatação visual.
      
      Estruture a atividade da seguinte forma:
      1. Um cabeçalho com título da atividade, matéria, série e tipo
      2. Uma breve instrução para os alunos
      3. EXATAMENTE ${params.quantidadeQuestoes} questões numeradas de 1 a ${params.quantidadeQuestoes}
      4. Se solicitado, inclua um gabarito ao final
      5. Um rodapé simples
      
      As questões devem ser específicas para a matéria selecionada, adequadas ao nível escolar indicado, 
      e pertinentes ao tema. Para cada questão, inclua 4 alternativas (A, B, C, D).
      
      IMPORTANTE: Você DEVE gerar EXATAMENTE ${params.quantidadeQuestoes} questões, não mais e não menos.
      
      Retorne APENAS o HTML puro, sem explicações adicionais ou texto fora do HTML.
    `;
    
    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 8000 // Aumentado para garantir que todas as questões solicitadas sejam geradas
    });
    
    return res.status(200).json({
      content: result.content,
      tokensUsed: result.tokensUsed
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in activity generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

export default aiRouter;
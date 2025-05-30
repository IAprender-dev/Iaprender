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
      
      A atividade deve ser formatada em HTML seguindo o formato abaixo RIGOROSAMENTE:
      
      <div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <header style="text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.75rem;">
          <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">[TÍTULO DA ATIVIDADE]</h1>
          <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
            <p style="margin: 0"><strong>Disciplina:</strong> [MATÉRIA]</p>
            <p style="margin: 0"><strong>Série:</strong> [SÉRIE]</p>
            <p style="margin: 0"><strong>Tipo:</strong> [TIPO DE ATIVIDADE]</p>
          </div>
        </header>
        
        <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="margin: 0; font-style: italic;">[INSTRUÇÕES DA ATIVIDADE]</p>
        </div>
        
        <div class="questions">
          <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question; margin-top: 0;">
            <!-- IMPORTANTE: Repita o formato abaixo EXATAMENTE ${quantidadeQuestoes} vezes, sem espaços extras entre as questões -->
            <!-- EXEMPLO DE QUESTÃO (REPITA ESTE FORMATO) -->
            <li style="margin-bottom: 0.6rem; counter-increment: question; position: relative;">
              <div style="font-weight: 600; margin-bottom: 0.25rem; color: #1e3a8a;">
                Questão 1: [TEXTO DA QUESTÃO AQUI]  <!-- Use o número real da questão -->
              </div>
              <div style="background-color: #f9fafb; padding: 0.5rem; border-radius: 0.375rem; margin-top: 0.25rem;">
                <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.25rem; margin: 0">
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                    <span>[ALTERNATIVA A]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                    <span>[ALTERNATIVA B]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                    <span>[ALTERNATIVA C]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                    <span>[ALTERNATIVA D]</span>
                  </div>
                </div>
              </div>
            </li>
            <!-- FIM DO EXEMPLO DE QUESTÃO -->
          </ol>
        </div>
        
        <!-- GABARITO (INCLUIR APENAS SE SOLICITADO) -->
        [INCLUIR GABARITO AQUI SE SOLICITADO]
        
        <footer style="margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
          <p style="margin: 0">Atividade gerada por iAula - [DATA]</p>
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
        
        A atividade deve ser formatada em HTML seguindo o formato abaixo RIGOROSAMENTE:
        
        <div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
          <header style="text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.75rem;">
            <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">[TÍTULO DA ATIVIDADE]</h1>
            <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
              <p style="margin: 0"><strong>Disciplina:</strong> [MATÉRIA]</p>
              <p style="margin: 0"><strong>Série:</strong> [SÉRIE]</p>
              <p style="margin: 0"><strong>Tipo:</strong> [TIPO DE ATIVIDADE]</p>
            </div>
          </header>
          
          <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 1.5rem;">
            <p style="margin: 0; font-style: italic;">[INSTRUÇÕES DA ATIVIDADE]</p>
          </div>
          
          <div class="questions">
            <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question; margin-top: 0;">
              <!-- IMPORTANTE: Repita o formato abaixo EXATAMENTE ${quantidadeQuestoes} vezes, sem espaços extras entre as questões -->
              <!-- EXEMPLO DE QUESTÃO (REPITA ESTE FORMATO) -->
              <li style="margin-bottom: 0.6rem; counter-increment: question; position: relative;">
                <div style="font-weight: 600; margin-bottom: 0.25rem; color: #1e3a8a;">
                  Questão 1: [TEXTO DA QUESTÃO AQUI]  <!-- Use o número real da questão -->
                </div>
                <div style="background-color: #f9fafb; padding: 0.5rem; border-radius: 0.375rem; margin-top: 0.25rem;">
                  <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.25rem; margin: 0">
                    <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                      <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                      <span>[ALTERNATIVA A]</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                      <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                      <span>[ALTERNATIVA B]</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                      <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                      <span>[ALTERNATIVA C]</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                      <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                      <span>[ALTERNATIVA D]</span>
                    </div>
                  </div>
                </div>
              </li>
              <!-- FIM DO EXEMPLO DE QUESTÃO -->
            </ol>
          </div>
          
          <!-- GABARITO (INCLUIR APENAS SE SOLICITADO) -->
          [INCLUIR GABARITO AQUI SE SOLICITADO]
          
          <footer style="margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
            <p style="margin: 0">Atividade gerada por iAula - Baseada no material fornecido</p>
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
      Você é um educador especialista que cria atividades educacionais de alta qualidade.
      
      Crie uma atividade educacional completa com as seguintes características:
      
      - Tema: ${params.tema}
      - Matéria: ${params.materia}
      - Série/Ano: ${params.serie}
      - Tipo de atividade: ${params.tipoAtividade}
      - Quantidade de questões: ${params.quantidadeQuestoes} (IMPORTANTE: gere EXATAMENTE este número de questões)
      - Nível de dificuldade: ${params.nivelDificuldade}
      - Incluir gabarito: ${params.incluirGabarito ? 'Sim' : 'Não'}
      
      DIRETRIZES IMPORTANTES:
      - Crie questões desafiadoras e criativas, não apenas memorização de fatos
      - Use linguagem apropriada para a idade dos estudantes
      - Inclua questões que desenvolvam pensamento crítico
      - Evite estereótipos ou exemplos ultrapassados
      - Use exemplos do cotidiano para ajudar na compreensão
      - As alternativas de múltipla escolha devem ser plausíveis, não óbvias
      - Inclua questões que testem diferentes níveis de conhecimento (básico, intermediário, avançado)
      
      A atividade deve ser formatada em HTML seguindo o formato abaixo RIGOROSAMENTE:
      
      <div class="activity-content" style="max-width: 800px; margin: 0 auto; font-family: system-ui, sans-serif;">
        <header style="text-align: center; margin-bottom: 1.5rem; border-bottom: 2px solid #3b82f6; padding-bottom: 0.75rem;">
          <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.5rem;">[TÍTULO DA ATIVIDADE]</h1>
          <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 0.875rem; color: #4b5563;">
            <p style="margin: 0"><strong>Disciplina:</strong> [MATÉRIA]</p>
            <p style="margin: 0"><strong>Série:</strong> [SÉRIE]</p>
            <p style="margin: 0"><strong>Tipo:</strong> [TIPO DE ATIVIDADE]</p>
          </div>
        </header>
        
        <div class="instructions" style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="margin: 0; font-style: italic;">[INSTRUÇÕES DA ATIVIDADE]</p>
        </div>
        
        <div class="questions">
          <ol style="list-style-position: outside; padding-left: 1.5rem; counter-reset: question; margin-top: 0;">
            <!-- IMPORTANTE: Repita o formato abaixo EXATAMENTE ${params.quantidadeQuestoes} vezes, sem espaços extras entre as questões -->
            <!-- EXEMPLO DE QUESTÃO (REPITA ESTE FORMATO) -->
            <li style="margin-bottom: 0.6rem; counter-increment: question; position: relative;">
              <div style="font-weight: 600; margin-bottom: 0.25rem; color: #1e3a8a;">
                Questão 1: [TEXTO DA QUESTÃO AQUI]  <!-- Use o número real da questão -->
              </div>
              <div style="background-color: #f9fafb; padding: 0.5rem; border-radius: 0.375rem; margin-top: 0.25rem;">
                <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.25rem; margin: 0">
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">A)</span>
                    <span>[ALTERNATIVA A]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">B)</span>
                    <span>[ALTERNATIVA B]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">C)</span>
                    <span>[ALTERNATIVA C]</span>
                  </div>
                  <div style="display: flex; align-items: flex-start; gap: 0.5rem; margin: 0">
                    <span style="font-weight: 500; min-width: 1.5rem;">D)</span>
                    <span>[ALTERNATIVA D]</span>
                  </div>
                </div>
              </div>
            </li>
            <!-- FIM DO EXEMPLO DE QUESTÃO -->
          </ol>
        </div>
        
        <!-- GABARITO (INCLUIR APENAS SE SOLICITADO) -->
        [INCLUIR GABARITO AQUI SE SOLICITADO]
        
        <footer style="margin-top: 1.5rem; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 1rem;">
          <p style="margin: 0">Atividade gerada por iAula - [DATA]</p>
        </footer>
      </div>
      
      REGRAS IMPORTANTES DE FORMATAÇÃO:
      1. Siga EXATAMENTE o modelo de HTML fornecido acima
      2. Gere EXATAMENTE ${params.quantidadeQuestoes} questões, não mais e não menos
      3. NÃO deixe espaçamentos excessivos entre as questões
      4. Cada questão deve ter 4 alternativas (A, B, C, D)
      5. Não adicione código ou explicações fora do HTML solicitado
      
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

// Rota para geração de planos de aula
aiRouter.post("/education/generate-lesson-plan", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      tema: z.string().min(1).max(500),
      disciplina: z.string().min(1).max(100),
      serie: z.string().min(1).max(50),
      duracao: z.string().min(1).max(50),
    });
    
    const { tema, disciplina, serie, duracao } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário
    
    // Prompt profissional seguindo diretrizes da BNCC e MEC
    const prompt = `
      Gere um plano de aula completo sobre o tema "${tema}" da disciplina ${disciplina}, para ${serie}. 
      Utilize as diretrizes do MEC e da BNCC. Entregue um plano de aula profissional e detalhado, 
      com o tempo de cada atividade, de forma a otimizar o ensino da matéria.

      DIRETRIZES OBRIGATÓRIAS:
      
      1. ESTRUTURA PEDAGÓGICA COMPLETA:
      - Seguir rigorosamente as competências e habilidades da BNCC para ${disciplina} - ${serie}
      - Aplicar metodologias ativas e participativas conforme diretrizes do MEC
      - Incluir momentos de diagnóstico, desenvolvimento e consolidação
      - Garantir acessibilidade e inclusão educacional
      
      2. ORGANIZAÇÃO TEMPORAL DETALHADA:
      - Duração total: ${duracao}
      - Dividir em blocos de tempo específicos (ex: 5min, 10min, 15min)
      - Incluir tempo para transições entre atividades
      - Considerar ritmo de aprendizagem adequado para a faixa etária
      
      3. OBJETIVOS DE APRENDIZAGEM ESPECÍFICOS:
      - Baseados nas competências gerais e específicas da BNCC
      - Utilizar verbos da taxonomia de Bloom
      - Incluir objetivos conceituais, procedimentais e atitudinais
      - Ser mensuráveis e observáveis
      
      4. METODOLOGIA DIFERENCIADA:
      - Incluir múltiplas estratégias de ensino
      - Contemplar diferentes estilos de aprendizagem
      - Usar recursos tecnológicos quando apropriado
      - Promover protagonismo estudantil
      
      5. AVALIAÇÃO FORMATIVA E SOMATIVA:
      - Critérios claros e objetivos
      - Instrumentos diversificados
      - Feedback contínuo
      - Autoavaliação dos estudantes
      
      FORMATO DE RESPOSTA EM JSON:
      {
        "titulo": "Título específico e atrativo da aula",
        "disciplina": "${disciplina}",
        "serie": "${serie}",
        "duracao": "${duracao}",
        "competencias_bncc": ["Lista das competências gerais e específicas da BNCC aplicáveis"],
        "habilidades_bncc": [
          "Código da habilidade (ex: EF67LP01) - Descrição completa da habilidade específica da BNCC",
          "Código da habilidade (ex: EF67LP02) - Descrição completa da habilidade específica da BNCC",
          "Código da habilidade (ex: EF67LP03) - Descrição completa da habilidade específica da BNCC"
        ],
        "objetivos_aprendizagem": [
          "Objetivo específico 1 com verbo da taxonomia de Bloom",
          "Objetivo específico 2 com verbo da taxonomia de Bloom",
          "Objetivo específico 3 com verbo da taxonomia de Bloom"
        ],
        "prerequisitos": ["Conhecimentos prévios necessários"],
        "cronograma_detalhado": [
          {
            "momento": "Abertura/Motivação",
            "tempo": "5 minutos",
            "atividade": "Descrição detalhada da atividade de abertura",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          },
          {
            "momento": "Diagnóstico inicial",
            "tempo": "10 minutos", 
            "atividade": "Atividade para verificar conhecimentos prévios",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          },
          {
            "momento": "Desenvolvimento - Parte 1",
            "tempo": "15 minutos",
            "atividade": "Primeira parte do desenvolvimento do conteúdo",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          },
          {
            "momento": "Atividade prática",
            "tempo": "15 minutos",
            "atividade": "Atividade prática para aplicação do conhecimento",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          },
          {
            "momento": "Consolidação",
            "tempo": "10 minutos",
            "atividade": "Atividade de síntese e consolidação",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          },
          {
            "momento": "Avaliação/Fechamento",
            "tempo": "5 minutos",
            "atividade": "Atividade avaliativa e fechamento da aula",
            "recursos": ["Lista de recursos específicos"],
            "estrategia": "Estratégia pedagógica utilizada"
          }
        ],
        "recursos_necessarios": {
          "materiais": ["Lista detalhada de materiais físicos"],
          "tecnologicos": ["Lista de recursos digitais/tecnológicos"],
          "espacos": ["Descrição dos espaços necessários"]
        },
        "metodologias_ativas": ["Lista das metodologias ativas utilizadas"],
        "diferenciacao_pedagogica": {
          "estudantes_com_dificuldade": "Estratégias específicas para estudantes com dificuldade",
          "estudantes_avancados": "Atividades desafiadoras para estudantes avançados",
          "necessidades_especiais": "Adaptações para inclusão"
        },
        "avaliacao": {
          "instrumentos": ["Lista de instrumentos avaliativos"],
          "criterios": ["Critérios de avaliação específicos"],
          "indicadores": ["Indicadores de aprendizagem observáveis"],
          "feedback": "Como será dado o feedback aos estudantes"
        },
        "extensao_casa": "Atividade para casa que complementa a aula",
        "referencias_complementares": ["Materiais de apoio para professor e estudantes"],
        "observacoes_professor": "Dicas importantes para execução da aula"
      }
      
      IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois.
    `;
    
    try {
      const result = await OpenAIService.generateChatCompletion({
        userId,
        contractId,
        prompt,
        model: "gpt-4o",
        temperature: 0.3,
        maxTokens: 4000
      });
      
      return res.status(200).json({
        content: result.content,
        tokensUsed: result.tokensUsed
      });
    } catch (aiError: any) {
      console.error("Error calling OpenAI service:", aiError);
      return res.status(500).json({ 
        message: "Erro ao processar solicitação de IA", 
        error: aiError.message 
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in lesson plan generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para geração de resumos BNCC
aiRouter.post("/education/generate-bncc-summary", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      assunto: z.string().min(1).max(1000),
      materia: z.string(),
      serie: z.string(),
      observacoes: z.string().optional()
    });
    
    const { assunto, materia, serie, observacoes } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1;
    const contractId = req.session.user?.contractId || 1;

    const prompt = `Crie um resumo completo da matéria "${assunto}" para ${materia} - ${serie}, seguindo rigorosamente a Base Nacional Comum Curricular (BNCC).

INFORMAÇÕES:
- Assunto: ${assunto}
- Matéria: ${materia}
- Série: ${serie}
- Observações: ${observacoes || 'Nenhuma observação específica'}

ESTRUTURA OBRIGATÓRIA:

1. COMPETÊNCIAS E HABILIDADES BNCC
   - Competências específicas da área
   - Habilidades específicas (com códigos BNCC)
   - Objetos de conhecimento relacionados

2. CONTEÚDO DA MATÉRIA
   - Conceitos fundamentais
   - Definições essenciais
   - Princípios e teorias
   - Processos e procedimentos

3. CONHECIMENTOS ESSENCIAIS
   - Fatos importantes
   - Dados relevantes
   - Relações e conexões
   - Aplicações práticas

4. DESENVOLVIMENTO PROGRESSIVO
   - Pré-requisitos necessários
   - Sequência lógica de apresentação
   - Conexões interdisciplinares

5. APLICAÇÕES E EXEMPLOS
   - Situações do cotidiano
   - Casos práticos
   - Experimentos ou demonstrações
   - Problemas e exercícios

6. AVALIAÇÃO SUGERIDA
   - Critérios de aprendizagem
   - Indicadores de desenvolvimento
   - Formas de verificação

IMPORTANTE: 
- Alinhe todo o conteúdo às competências gerais da BNCC
- Use linguagem adequada à série especificada
- Inclua apenas conteúdo obrigatório pela BNCC
- Organize de forma didática e sequencial
- Formate como HTML para visualização clara

Formate o resultado como HTML profissional e didático com estrutura bem organizada.`;

    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 4000
    });
    
    return res.status(200).json({ resumo: result.content });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in BNCC summary generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

// Rota para geração de resumos educacionais (materiais didáticos)
aiRouter.post("/education/generate-educational-summary", authenticate, hasContract, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      assunto: z.string().min(1).max(1000),
      contextoPedagogico: z.string().optional()
    });
    
    const { assunto, contextoPedagogico } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1;
    const contractId = req.session.user?.contractId || 1;

    const prompt = `Analise o assunto "${assunto}" e crie um resumo completo da matéria para preparação de aula.

TAREFA PRINCIPAL:
1. IDENTIFIQUE AUTOMATICAMENTE:
   - A matéria/disciplina adequada para este assunto
   - As séries/anos escolares apropriados conforme BNCC
   - A área do conhecimento (Linguagens, Matemática, Ciências da Natureza, Ciências Humanas)

2. CRIE UM RESUMO ESTRUTURADO:
   - Conceito principal claro e direto
   - Definições fundamentais que o professor precisa saber
   - Desenvolvimento progressivo do conteúdo
   - Exemplos práticos e aplicações
   - Metodologia sugerida para apresentar o tema
   - Recursos didáticos recomendados
   - Pontos importantes para destacar

CONTEXTO ADICIONAL: ${contextoPedagogico || 'Nenhum contexto específico fornecido'}

FORMATO DE RESPOSTA:
Retorne um objeto JSON com:
{
  "materia": "Nome da matéria identificada",
  "serie": "Séries adequadas (ex: 7º e 8º ano EF)",
  "area": "Área do conhecimento BNCC",
  "resumo": "HTML estruturado do resumo da matéria"
}

O resumo HTML deve seguir esta estrutura:
- Header com título e informações da matéria
- Seções organizadas por tópicos numerados
- Layout limpo e didático
- Foco no conteúdo que o professor precisa dominar para dar a aula

IMPORTANTE: Base toda a identificação nas diretrizes da BNCC e organize o conteúdo de forma que seja útil para o professor estudar antes da aula.`;

    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 4000
    });
    
    // Tentar parsear como JSON primeiro, se falhar retornar formato básico
    try {
      const parsedResult = JSON.parse(result.content || '{}');
      return res.status(200).json(parsedResult);
    } catch (parseError) {
      // Se não conseguir parsear, retornar formato básico
      return res.status(200).json({
        materia: "Identificação automática",
        serie: "Conforme BNCC",
        area: "Multidisciplinar",
        resumo: result.content || "Erro ao gerar resumo"
      });
    }
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in educational summary generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

export default aiRouter;
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
      tipoAtividade: z.string(),
      quantidadeQuestoes: z.number().min(1).max(20),
      nivelDificuldade: z.string(),
      incluirGabarito: z.boolean().optional().default(true),
      autoDetectSubject: z.boolean().optional().default(false),
    });
    
    const { tema, tipoAtividade, quantidadeQuestoes, nivelDificuldade, incluirGabarito, autoDetectSubject } = schema.parse(req.body);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "OpenAI service is not available" });
    }
    
    const userId = req.session.user?.id || 1; // Valor temporário
    const contractId = req.session.user?.contractId || 1; // Valor temporário

    // Constrói o prompt para geração da atividade com detecção automática
    const promptAtividade = autoDetectSubject ? `
      Você é um educador especialista que cria atividades educacionais de alta qualidade seguindo as diretrizes da BNCC.
      
      PRIMEIRO: Analise o tema "${tema}" e identifique automaticamente:
      1. Qual a disciplina/matéria mais adequada segundo a BNCC
      2. Qual o ano/série mais apropriado para este conteúdo
      3. Quais competências e habilidades da BNCC são contempladas
      
      DEPOIS: Crie uma atividade educacional completa com as seguintes características:
      - Tema: ${tema}
      - Tipo de atividade: ${tipoAtividade}
      - Quantidade de questões: ${quantidadeQuestoes} (IMPORTANTE: gere EXATAMENTE este número de questões)
      - Nível de dificuldade: ${nivelDificuldade}
      - Incluir gabarito: ${incluirGabarito ? 'Sim' : 'Não'}
      
      RETORNE também no final as informações identificadas:
      - Matéria detectada
      - Série detectada
      - Habilidades BNCC aplicáveis` : `
      Você é um educador especialista que cria atividades educacionais de alta qualidade.
      
      Crie uma atividade educacional completa com as seguintes características:
      - Tema: ${tema}
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
      
      IMPORTANTE: 
      - Retorne APENAS o HTML da atividade formatada, sem textos explicativos antes ou depois
      - NÃO use asteriscos (*), barras invertidas (\) ou formatação markdown
      - Use apenas HTML puro e limpo
      - Deixe uma linha vazia entre cada questão
      
      Formate a atividade seguindo EXATAMENTE este modelo:

      <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.6; background: white; color: #000000;">
        
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000000; padding-bottom: 20px;">
          <h1 style="font-size: 22px; font-weight: bold; color: #000000; margin: 0 0 10px 0; text-transform: uppercase;">[TÍTULO DA ATIVIDADE]</h1>
          <div style="font-size: 14px; color: #333333;">
            <strong>Disciplina:</strong> [MATÉRIA] | <strong>Série:</strong> [SÉRIE] | <strong>Data:</strong> ___/___/______
          </div>
          <div style="font-size: 14px; color: #333333; margin-top: 5px;">
            <strong>Nome:</strong> ______________________________________________ <strong>Turma:</strong> __________
          </div>
        </div>
        
        <!-- Instruções -->
        <div style="margin-bottom: 25px; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #000000;">Instruções:</h3>
          <p style="margin: 0; font-size: 14px; color: #333333;">[INSTRUÇÕES PARA OS ALUNOS]</p>
        </div>
        
        <!-- Questões -->
        <div style="margin-bottom: 30px;">
          <!-- REPITA ESTE FORMATO PARA CADA QUESTÃO ${quantidadeQuestoes} VEZES -->
          
          <div style="margin-bottom: 35px; page-break-inside: avoid;">
            <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #000000;">
              1. [ENUNCIADO DA QUESTÃO]
            </p>
            
            <div style="margin-left: 20px; font-size: 16px;">
              <p style="margin: 10px 0; color: #000000;">
                a) [ALTERNATIVA A]
              </p>
              <p style="margin: 10px 0; color: #000000;">
                b) [ALTERNATIVA B]
              </p>
              <p style="margin: 10px 0; color: #000000;">
                c) [ALTERNATIVA C]
              </p>
              <p style="margin: 10px 0; color: #000000;">
                d) [ALTERNATIVA D]
              </p>
            </div>
          </div>
          
          <!-- CONTINUAR PARA TODAS AS QUESTÕES -->
        </div>
        
        ${incluirGabarito ? `
        <!-- Gabarito -->
        <div style="margin-top: 40px; padding: 20px; background-color: #e8f5e8; border: 1px solid #28a745; border-radius: 5px; page-break-before: always;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #155724;">GABARITO</h3>
          [INCLUIR RESPOSTAS CORRETAS COM EXPLICAÇÕES]
        </div>
        ` : ''}
        
        <!-- Rodapé -->
        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #cccccc; padding-top: 15px;">
          <p style="margin: 0; font-size: 12px; color: #666666;">
            Atividade gerada por <strong>AIverse - Seu Universo de IA</strong>
          </p>
        </div>
        
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
    
    // Se está usando detecção automática, tenta extrair as informações identificadas
    let responseData = {
      content: result.content,
      tokensUsed: result.tokensUsed
    };
    
    if (autoDetectSubject) {
      // Tenta extrair informações automaticamente detectadas
      try {
        // Busca por padrões no texto para identificar matéria e série
        const content = result.content.toLowerCase();
        
        // Detecta matéria
        let materia = "Identificação automática";
        if (content.includes('matemática') || content.includes('frações') || content.includes('geometria')) {
          materia = "Matemática";
        } else if (content.includes('português') || content.includes('literatura') || content.includes('gramática')) {
          materia = "Língua Portuguesa";
        } else if (content.includes('ciências') || content.includes('biologia') || content.includes('física')) {
          materia = "Ciências";
        } else if (content.includes('história') || content.includes('brasil') || content.includes('colonial')) {
          materia = "História";
        } else if (content.includes('geografia') || content.includes('mapas') || content.includes('relevo')) {
          materia = "Geografia";
        } else if (content.includes('inglês') || content.includes('english')) {
          materia = "Inglês";
        }
        
        // Detecta série baseada na complexidade do tema
        let serie = "Identificação automática";
        if (tema.toLowerCase().includes('alfabetização') || tema.toLowerCase().includes('vogais')) {
          serie = "1º ao 2º ano";
        } else if (tema.toLowerCase().includes('frações') || tema.toLowerCase().includes('multiplicação')) {
          serie = "3º ao 5º ano";
        } else if (tema.toLowerCase().includes('equações') || tema.toLowerCase().includes('adolescência')) {
          serie = "6º ao 9º ano";
        } else {
          serie = "Ensino Fundamental";
        }
        
        responseData = {
          ...responseData,
          materia,
          serie,
          titulo: `Atividade de ${materia} - ${tema}`
        };
      } catch (detectError) {
        console.log('Erro na detecção automática, usando valores padrão');
      }
    }
    
    return res.status(200).json(responseData);
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

    const prompt = `Crie um resumo educacional completo sobre "${assunto}" seguindo rigorosamente as diretrizes da BNCC (Base Nacional Comum Curricular).

CONTEXTO ADICIONAL: ${contextoPedagogico || 'Nenhum contexto específico'}

IMPORTANTE: Identifique automaticamente a matéria e os anos/séries da BNCC mais adequados para este assunto.

Estruture o resumo em HTML com design moderno e didático:

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${assunto}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .title {
            font-size: 2.5em;
            margin: 0;
            font-weight: bold;
        }
        .subtitle {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .bncc-info {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #007bff;
            margin: 20px;
            border-radius: 8px;
        }
        .section {
            margin: 20px;
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .section-title {
            color: #007bff;
            font-size: 1.4em;
            margin-bottom: 15px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 5px;
        }
        .concept-box {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .highlight {
            background: #fff3cd;
            padding: 15px;
            border-left: 4px solid #ffc107;
            margin: 15px 0;
            border-radius: 4px;
        }
        .examples {
            background: #d4edda;
            padding: 15px;
            border-left: 4px solid #28a745;
            margin: 15px 0;
            border-radius: 4px;
        }
        .footer {
            background: #343a40;
            color: white;
            text-align: center;
            padding: 20px;
            font-style: italic;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${assunto}</h1>
            <p class="subtitle">Resumo Educacional - BNCC</p>
        </div>

        <div class="bncc-info">
            <h3>📚 Informações BNCC</h3>
            <p><strong>Área do Conhecimento:</strong> [IDENTIFIQUE A ÁREA]</p>
            <p><strong>Componente Curricular:</strong> [IDENTIFIQUE A MATÉRIA]</p>
            <p><strong>Anos/Séries Recomendadas:</strong> [IDENTIFIQUE OS ANOS ESPECÍFICOS DA BNCC]</p>
            <p><strong>Habilidades BNCC:</strong> [CITE CÓDIGOS ESPECÍFICOS QUANDO POSSÍVEL]</p>
        </div>

        <div class="section">
            <h2 class="section-title">🎯 Conceito Principal</h2>
            <div class="concept-box">
                [DEFINIÇÃO CLARA E OBJETIVA DO CONCEITO]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">📖 Fundamentos Teóricos</h2>
            [CONCEITOS FUNDAMENTAIS ORGANIZADOS]
        </div>

        <div class="section">
            <h2 class="section-title">👨‍🏫 Como Ensinar</h2>
            <div class="highlight">
                [ESTRATÉGIAS PEDAGÓGICAS E METODOLOGIAS]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">💡 Exemplos Práticos</h2>
            <div class="examples">
                [EXEMPLOS CONCRETOS E SITUAÇÕES DO COTIDIANO]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">⚠️ Pontos de Atenção</h2>
            [DIFICULDADES COMUNS E COMO SUPERÁ-LAS]
        </div>

        <div class="section">
            <h2 class="section-title">🎓 Atividades Sugeridas</h2>
            [SUGESTÕES DE ATIVIDADES PRÁTICAS ALINHADAS À BNCC]
        </div>

        <div class="footer">
            Gerado por AIverse - Seu Universo de IA
        </div>
    </div>
</body>
</html>

INSTRUÇÕES ESPECÍFICAS:
1. Identifique automaticamente a matéria mais adequada (Matemática, Ciências, História, etc.)
2. Especifique os anos/séries exatos da BNCC onde este conteúdo deve ser abordado
3. Cite habilidades específicas da BNCC com seus códigos quando possível
4. Mantenha linguagem adequada à faixa etária identificada
5. Use o template HTML acima preenchendo cada seção adequadamente
6. Garanta que o conteúdo esteja totalmente alinhado às diretrizes da BNCC`;

    const result = await OpenAIService.generateChatCompletion({
      userId,
      contractId,
      prompt,
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 4000
    });
    
    // Limpar o conteúdo removendo markdown desnecessário
    let cleanContent = result.content || "Erro ao gerar resumo";
    
    // Remover ```html do início e ``` do final se existirem
    cleanContent = cleanContent.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
    
    // Retornar formato estruturado
    return res.status(200).json({
      materia: "Identificação automática via IA",
      serie: "Adequado conforme BNCC",
      area: "Educacional",
      resumo: cleanContent
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error in educational summary generation endpoint:", error);
    return res.status(500).json({ message: error.message });
  }
});

export default aiRouter;
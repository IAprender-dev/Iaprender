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
const upload = multer({
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

// Middleware para verificar se o usuário está autenticado
const authenticate = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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
    
    const userId = req.session.user.id;
    const contractId = req.session.user.contractId;
    
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
    
    const userId = req.session.user.id;
    const contractId = req.session.user.contractId;
    
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
  upload.single('image'),
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
      
      const userId = req.session.user.id;
      const contractId = req.session.user.contractId;
      
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
    
    const userId = req.session.user.id;
    const contractId = req.session.user.contractId;
    
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

export default aiRouter;
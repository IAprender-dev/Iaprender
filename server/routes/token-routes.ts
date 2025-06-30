import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  getTokenUsageStats,
  getTokenAlerts,
  checkTokenLimits,
  calculateTokenCost,
  resetTokenLimits,
} from "../services/token-monitoring";

const tokenRouter = Router();

// Middleware para verificar autenticação
const authenticate = (req: Request, res: Response, next: Function) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Middleware para verificar se é administrador
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Rota para obter estatísticas de uso de tokens do usuário
tokenRouter.get("/usage/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await getTokenUsageStats(userId, start, end);
    
    return res.status(200).json(stats);
  } catch (error: any) {
    console.error("Error getting token usage stats:", error);
    return res.status(500).json({ message: "Error retrieving token statistics" });
  }
});

// Rota para obter alertas de tokens do usuário
tokenRouter.get("/alerts", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    const alerts = await getTokenAlerts(userId);
    
    return res.status(200).json({ alerts });
  } catch (error: any) {
    console.error("Error getting token alerts:", error);
    return res.status(500).json({ message: "Error retrieving token alerts" });
  }
});

// Rota para verificar limites antes de fazer uma solicitação
tokenRouter.post("/check-limits", authenticate, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      requestedTokens: z.number().positive(),
    });

    const { requestedTokens } = schema.parse(req.body);
    const userId = req.session.user.id;
    const contractId = req.session.user.contractId || 1;

    const result = await checkTokenLimits(userId, contractId, requestedTokens);
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error checking token limits:", error);
    return res.status(500).json({ message: "Error checking token limits" });
  }
});

// Rota para calcular custo estimado de uma solicitação
tokenRouter.post("/calculate-cost", authenticate, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      provider: z.string(),
      model: z.string(),
      inputTokens: z.number().positive(),
      outputTokens: z.number().optional().default(0),
    });

    const { provider, model, inputTokens, outputTokens } = schema.parse(req.body);
    
    const cost = calculateTokenCost(provider, model, inputTokens, outputTokens);
    
    return res.status(200).json({
      provider,
      model,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      costBreakdown: {
        inputCost: calculateTokenCost(provider, model, inputTokens, 0),
        outputCost: calculateTokenCost(provider, model, 0, outputTokens),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error calculating token cost:", error);
    return res.status(500).json({ message: "Error calculating token cost" });
  }
});

// Rota para obter resumo de uso atual
tokenRouter.get("/usage/summary", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user.id;
    
    // Obter dados do último mês
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const stats = await getTokenUsageStats(userId, startDate, endDate);
    const alerts = await getTokenAlerts(userId);
    
    // Calcular tendências
    const dailyAverage = stats.dailyUsage.length > 0 
      ? stats.totalTokens / stats.dailyUsage.length 
      : 0;
    
    const summary = {
      currentMonth: {
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
        dailyAverage: Math.round(dailyAverage),
      },
      alerts,
      topModels: stats.modelUsage.slice(0, 5),
      providerDistribution: stats.usageByProvider,
      efficiency: {
        costPerToken: stats.totalTokens > 0 ? stats.totalCost / stats.totalTokens : 0,
        requestsCount: stats.modelUsage.reduce((sum, model) => sum + model.requests, 0),
        avgTokensPerRequest: stats.totalTokens > 0 
          ? stats.totalTokens / stats.modelUsage.reduce((sum, model) => sum + model.requests, 0)
          : 0,
      },
    };
    
    return res.status(200).json(summary);
  } catch (error: any) {
    console.error("Error getting token usage summary:", error);
    return res.status(500).json({ message: "Error retrieving usage summary" });
  }
});

// Rotas administrativas

// Rota para resetar limites de usuário (admin apenas)
tokenRouter.post("/admin/reset-limits", requireAdmin, async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      userId: z.number().positive(),
      type: z.enum(['daily', 'monthly']),
    });

    const { userId, type } = schema.parse(req.body);
    
    const result = await resetTokenLimits(userId, type);
    
    return res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors });
    }
    console.error("Error resetting token limits:", error);
    return res.status(500).json({ message: "Error resetting token limits" });
  }
});

// Rota para obter estatísticas globais (admin apenas)
tokenRouter.get("/admin/global-stats", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Para admin, agregamos dados de todos os usuários
    // Esta implementação seria expandida para incluir dados de múltiplos usuários
    
    return res.status(200).json({
      message: "Global statistics endpoint - implementation in progress",
      note: "This endpoint will provide system-wide token usage statistics"
    });
  } catch (error: any) {
    console.error("Error getting global token stats:", error);
    return res.status(500).json({ message: "Error retrieving global statistics" });
  }
});

// Rota para obter modelos e seus preços
tokenRouter.get("/pricing", authenticate, async (req: Request, res: Response) => {
  try {
    const pricing = {
      openai: {
        'gpt-4o': { 
          input: 0.005, 
          output: 0.015,
          description: "Most capable GPT-4 model",
          category: "chat"
        },
        'gpt-4o-mini': { 
          input: 0.00015, 
          output: 0.0006,
          description: "Fast and cost-effective GPT-4 model",
          category: "chat"
        },
        'dall-e-3': { 
          input: 0.04, 
          output: 0.08,
          description: "Advanced image generation",
          category: "image"
        },
      },
      anthropic: {
        'claude-3-5-sonnet-20241022': { 
          input: 0.003, 
          output: 0.015,
          description: "Most intelligent Claude model",
          category: "chat"
        },
        'claude-3-haiku-20240307': { 
          input: 0.00025, 
          output: 0.00125,
          description: "Fastest Claude model",
          category: "chat"
        },
      },
      perplexity: {
        'llama-3.1-sonar-small-128k-online': { 
          input: 0.0002, 
          output: 0.0002,
          description: "Small online search model",
          category: "search"
        },
        'llama-3.1-sonar-large-128k-online': { 
          input: 0.001, 
          output: 0.001,
          description: "Large online search model",
          category: "search"
        },
      },
      bedrock: {
        'anthropic.claude-3-5-sonnet-20241022-v2:0': { 
          input: 0.003, 
          output: 0.015,
          description: "Claude 3.5 Sonnet via AWS Bedrock",
          category: "chat"
        },
        'anthropic.claude-3-haiku-20240307-v1:0': { 
          input: 0.00025, 
          output: 0.00125,
          description: "Claude 3 Haiku via AWS Bedrock",
          category: "chat"
        },
        'amazon.titan-text-lite-v1': { 
          input: 0.0003, 
          output: 0.0004,
          description: "Amazon Titan Text Lite",
          category: "chat"
        },
        'amazon.titan-text-express-v1': { 
          input: 0.0013, 
          output: 0.0017,
          description: "Amazon Titan Text Express",
          category: "chat"
        },
        'meta.llama2-13b-chat-v1': { 
          input: 0.00075, 
          output: 0.001,
          description: "Meta Llama 2 13B Chat",
          category: "chat"
        },
        'meta.llama2-70b-chat-v1': { 
          input: 0.00195, 
          output: 0.00256,
          description: "Meta Llama 2 70B Chat",
          category: "chat"
        },
        'ai21.j2-mid-v1': { 
          input: 0.0125, 
          output: 0.0125,
          description: "AI21 Jurassic-2 Mid",
          category: "chat"
        },
        'ai21.j2-ultra-v1': { 
          input: 0.0188, 
          output: 0.0188,
          description: "AI21 Jurassic-2 Ultra",
          category: "chat"
        },
      }
    };
    
    return res.status(200).json({
      pricing,
      currency: "USD",
      unit: "per 1000 tokens",
      lastUpdated: "2025-01-29"
    });
  } catch (error: any) {
    console.error("Error getting pricing information:", error);
    return res.status(500).json({ message: "Error retrieving pricing information" });
  }
});

export default tokenRouter;
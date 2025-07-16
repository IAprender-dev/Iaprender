import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { aiPreferences } from "@shared/schema";
import { eq } from "drizzle-orm";
import { invokeModelWithPreferences, checkBedrockStatus, listAvailableModels } from "../utils/aws-bedrock-service";

// Interface para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo_usuario: string;
    empresa_id: number;
    escola_id?: number;
    cognito_sub?: string;
  };
}

// Middleware de autenticação JWT (reutilizado do routes.ts)
const authenticate = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Token não fornecido" 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const JWT_SECRET = 'test_secret_key_iaprender_2025'; // Mesmo secret usado no sistema
    const decoded = require('jsonwebtoken').verify(token, JWT_SECRET) as any;
    
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      tipo_usuario: decoded.tipo_usuario,
      empresa_id: decoded.empresa_id,
      escola_id: decoded.escola_id,
      cognito_sub: decoded.cognito_sub
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Token inválido" 
    });
  }
};

const router = Router();

// Schema de validação para chat
const ChatRequestSchema = z.object({
  message: z.string().min(1, "Mensagem não pode estar vazia"),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().min(1).max(4000).optional(),
  usePreferences: z.boolean().default(true)
});

// POST /api/ai-central/chat - Enviar mensagem para IA
router.post("/chat", authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    console.log(`🤖 Processando mensagem de IA para usuário ${userId}`);

    // Validar dados de entrada
    const validatedData = ChatRequestSchema.parse(req.body);

    // Buscar preferências do usuário se solicitado
    let userPreferences = null;
    if (validatedData.usePreferences) {
      const preferences = await db
        .select()
        .from(aiPreferences)
        .where(eq(aiPreferences.userId, userId))
        .limit(1);

      if (preferences.length > 0) {
        userPreferences = preferences[0];
        console.log(`⚙️ Usando preferências do usuário: ${userPreferences.defaultAI}`);
      }
    }

    // Usar preferências padrão se não encontradas
    if (!userPreferences) {
      userPreferences = {
        defaultAI: 'claude',
        responseLanguage: 'pt-BR',
        complexityLevel: 'intermediario',
        autoStartSession: false,
        saveConversations: true,
        customPrompts: false
      };
      console.log(`⚙️ Usando preferências padrão`);
    }

    // Invocar modelo com preferências
    const response = await invokeModelWithPreferences(
      validatedData.message,
      userPreferences,
      validatedData.model
    );

    console.log(`✅ Resposta gerada com sucesso - Tokens: ${response.usage.totalTokens}`);

    return res.status(200).json({
      success: true,
      data: {
        message: response.content,
        model: response.model,
        usage: response.usage,
        timestamp: response.timestamp,
        preferences_used: {
          defaultAI: userPreferences.defaultAI,
          responseLanguage: userPreferences.responseLanguage,
          complexityLevel: userPreferences.complexityLevel
        }
      }
    });

  } catch (error) {
    console.error("❌ Erro no chat de IA:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// GET /api/ai-central/status - Verificar status do sistema de IA
router.get("/status", authenticate, async (req, res) => {
  try {
    console.log(`🔍 Verificando status do sistema de IA`);

    const bedrockStatus = await checkBedrockStatus();
    
    return res.status(200).json({
      success: true,
      data: {
        bedrock: bedrockStatus,
        services: {
          bedrock: bedrockStatus.status === 'connected',
          openai: false, // Será implementado
          anthropic: false, // Será implementado
          perplexity: false // Será implementado
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// GET /api/ai-central/models - Listar modelos disponíveis
router.get("/models", authenticate, async (req, res) => {
  try {
    console.log(`📋 Listando modelos disponíveis`);

    const models = await listAvailableModels();
    
    return res.status(200).json({
      success: true,
      data: {
        bedrock_models: models,
        total_models: models.length,
        providers: [...new Set(models.map(m => m.providerName))],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Erro ao listar modelos:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// POST /api/ai-central/generate-lesson - Gerar plano de aula com IA
router.post("/generate-lesson", authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    const { subject, grade, topic, duration } = req.body;

    if (!subject || !grade || !topic) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: subject, grade, topic"
      });
    }

    console.log(`📚 Gerando plano de aula: ${subject} - ${grade} - ${topic}`);

    // Prompt especializado para plano de aula
    const prompt = `
Crie um plano de aula detalhado para:
- Disciplina: ${subject}
- Série: ${grade}
- Tópico: ${topic}
- Duração: ${duration || '50 minutos'}

O plano deve incluir:
1. Objetivos de aprendizagem
2. Conteúdo programático
3. Metodologia
4. Recursos necessários
5. Avaliação
6. Bibliografia
7. Observações pedagógicas

Formate de maneira clara e organize bem as seções.
`;

    // Buscar preferências do usuário
    const preferences = await db
      .select()
      .from(aiPreferences)
      .where(eq(aiPreferences.userId, userId))
      .limit(1);

    const userPreferences = preferences.length > 0 ? preferences[0] : {
      defaultAI: 'claude',
      responseLanguage: 'pt-BR',
      complexityLevel: 'intermediario'
    };

    // Gerar plano de aula
    const response = await invokeModelWithPreferences(
      prompt,
      userPreferences
    );

    console.log(`✅ Plano de aula gerado com sucesso`);

    return res.status(200).json({
      success: true,
      data: {
        lesson_plan: response.content,
        subject,
        grade,
        topic,
        duration: duration || '50 minutos',
        model_used: response.model,
        usage: response.usage,
        generated_at: response.timestamp
      }
    });

  } catch (error) {
    console.error("❌ Erro ao gerar plano de aula:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;
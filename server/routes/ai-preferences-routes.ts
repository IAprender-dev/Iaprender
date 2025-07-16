import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { aiPreferences, usuarios } from "@shared/schema";
import { eq, and } from "drizzle-orm";
// Importar tipos necessários
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

// Schema de validação para preferências de IA
const AIPreferencesSchema = z.object({
  defaultAI: z.enum(['chatgpt', 'claude', 'perplexity']).default('chatgpt'),
  autoStartSession: z.boolean().default(false),
  saveConversations: z.boolean().default(true),
  responseLanguage: z.string().default('pt-BR'),
  complexityLevel: z.enum(['basico', 'intermediario', 'avancado']).default('intermediario'),
  customPrompts: z.boolean().default(false)
});

// GET /api/user/ai-preferences - Buscar preferências do usuário
router.get("/ai-preferences", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    console.log(`🔍 Buscando preferências de IA para usuário ${userId}`);

    // Buscar preferências existentes
    const userPreferences = await db
      .select()
      .from(aiPreferences)
      .where(eq(aiPreferences.userId, userId))
      .limit(1);

    if (userPreferences.length === 0) {
      // Se não existem preferências, criar com valores padrão
      console.log(`📝 Criando preferências padrão para usuário ${userId}`);
      
      const defaultPreferences = {
        userId,
        defaultAI: 'chatgpt',
        autoStartSession: false,
        saveConversations: true,
        responseLanguage: 'pt-BR',
        complexityLevel: 'intermediario',
        customPrompts: false
      };

      const [newPreferences] = await db
        .insert(aiPreferences)
        .values(defaultPreferences)
        .returning();

      return res.status(200).json({
        success: true,
        preferences: {
          defaultAI: newPreferences.defaultAI,
          autoStartSession: newPreferences.autoStartSession,
          saveConversations: newPreferences.saveConversations,
          responseLanguage: newPreferences.responseLanguage,
          complexityLevel: newPreferences.complexityLevel,
          customPrompts: newPreferences.customPrompts
        }
      });
    }

    const preferences = userPreferences[0];
    console.log(`✅ Preferências encontradas para usuário ${userId}`);

    return res.status(200).json({
      success: true,
      preferences: {
        defaultAI: preferences.defaultAI,
        autoStartSession: preferences.autoStartSession,
        saveConversations: preferences.saveConversations,
        responseLanguage: preferences.responseLanguage,
        complexityLevel: preferences.complexityLevel,
        customPrompts: preferences.customPrompts
      }
    });

  } catch (error) {
    console.error("❌ Erro ao buscar preferências de IA:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// POST /api/user/ai-preferences - Salvar preferências do usuário
router.post("/ai-preferences", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    console.log(`💾 Salvando preferências de IA para usuário ${userId}`);

    // Validar dados de entrada
    const validatedData = AIPreferencesSchema.parse(req.body.preferences);

    // Verificar se já existem preferências
    const existingPreferences = await db
      .select()
      .from(aiPreferences)
      .where(eq(aiPreferences.userId, userId))
      .limit(1);

    if (existingPreferences.length === 0) {
      // Criar novas preferências
      const [newPreferences] = await db
        .insert(aiPreferences)
        .values({
          userId,
          ...validatedData
        })
        .returning();

      console.log(`✅ Preferências criadas para usuário ${userId}:`, validatedData);

      return res.status(200).json({
        success: true,
        message: "Preferências salvas com sucesso",
        preferences: {
          defaultAI: newPreferences.defaultAI,
          autoStartSession: newPreferences.autoStartSession,
          saveConversations: newPreferences.saveConversations,
          responseLanguage: newPreferences.responseLanguage,
          complexityLevel: newPreferences.complexityLevel,
          customPrompts: newPreferences.customPrompts
        }
      });
    } else {
      // Atualizar preferências existentes
      const [updatedPreferences] = await db
        .update(aiPreferences)
        .set({
          ...validatedData,
          atualizadoEm: new Date()
        })
        .where(eq(aiPreferences.userId, userId))
        .returning();

      console.log(`✅ Preferências atualizadas para usuário ${userId}:`, validatedData);

      return res.status(200).json({
        success: true,
        message: "Preferências atualizadas com sucesso",
        preferences: {
          defaultAI: updatedPreferences.defaultAI,
          autoStartSession: updatedPreferences.autoStartSession,
          saveConversations: updatedPreferences.saveConversations,
          responseLanguage: updatedPreferences.responseLanguage,
          complexityLevel: updatedPreferences.complexityLevel,
          customPrompts: updatedPreferences.customPrompts
        }
      });
    }

  } catch (error) {
    console.error("❌ Erro ao salvar preferências de IA:", error);
    
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

// DELETE /api/user/ai-preferences - Resetar preferências para padrão
router.delete("/ai-preferences", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    console.log(`🔄 Resetando preferências para usuário ${userId}`);

    // Resetar para valores padrão
    const defaultPreferences = {
      defaultAI: 'chatgpt',
      autoStartSession: false,
      saveConversations: true,
      responseLanguage: 'pt-BR',
      complexityLevel: 'intermediario',
      customPrompts: false
    };

    // Verificar se existem preferências
    const existingPreferences = await db
      .select()
      .from(aiPreferences)
      .where(eq(aiPreferences.userId, userId))
      .limit(1);

    if (existingPreferences.length === 0) {
      // Criar com valores padrão
      await db
        .insert(aiPreferences)
        .values({
          userId,
          ...defaultPreferences
        });
    } else {
      // Atualizar para valores padrão
      await db
        .update(aiPreferences)
        .set({
          ...defaultPreferences,
          atualizadoEm: new Date()
        })
        .where(eq(aiPreferences.userId, userId));
    }

    console.log(`✅ Preferências resetadas para usuário ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Preferências resetadas para padrão",
      preferences: defaultPreferences
    });

  } catch (error) {
    console.error("❌ Erro ao resetar preferências:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;
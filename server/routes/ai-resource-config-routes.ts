import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { aiResourceConfigs, usuarios } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();

// Middleware de autenticação JWT
const authenticate = (req: Request, res: Response, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      console.log("❌ Token não fornecido no header");
      return res.status(401).json({ 
        success: false, 
        message: "Token não fornecido" 
      });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'test_secret_key_iaprender_2025';
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    console.log("✅ Token decodificado com sucesso:", {
      id: decoded.id,
      email: decoded.email,
      tipo_usuario: decoded.tipo_usuario
    });
    
    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      tipo_usuario: decoded.tipo_usuario,
      empresa_id: decoded.empresa_id,
      escola_id: decoded.escola_id
    };
    
    next();
  } catch (error) {
    console.error("❌ Erro na verificação do token:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Token inválido" 
    });
  }
};

// Schema de validação para configuração de recursos
const ResourceConfigSchema = z.object({
  resourceId: z.string().min(1, "ID do recurso é obrigatório"),
  resourceName: z.string().min(1, "Nome do recurso é obrigatório"),
  resourceType: z.enum(['teacher', 'student']),
  selectedModel: z.string().min(1, "Modelo selecionado é obrigatório"),
  modelName: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(8000).default(1000),
  enabled: z.boolean().default(true)
});

// Interface para requisições autenticadas
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo_usuario: string;
    empresa_id?: number;
    escola_id?: number;
  };
}

// GET /api/ai-resource-configs - Listar todas as configurações
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("🔍 Buscando configurações de recursos de IA");

    const configs = await db
      .select({
        id: aiResourceConfigs.id,
        resourceId: aiResourceConfigs.resourceId,
        resourceName: aiResourceConfigs.resourceName,
        resourceType: aiResourceConfigs.resourceType,
        selectedModel: aiResourceConfigs.selectedModel,
        modelName: aiResourceConfigs.modelName,
        temperature: aiResourceConfigs.temperature,
        maxTokens: aiResourceConfigs.maxTokens,
        enabled: aiResourceConfigs.enabled,
        criadoEm: aiResourceConfigs.criadoEm,
        atualizadoEm: aiResourceConfigs.atualizadoEm
      })
      .from(aiResourceConfigs)
      .orderBy(aiResourceConfigs.resourceType, aiResourceConfigs.resourceName);

    console.log(`✅ Encontradas ${configs.length} configurações de recursos`);

    return res.status(200).json({
      success: true,
      data: configs,
      total: configs.length
    });

  } catch (error) {
    console.error("❌ Erro ao buscar configurações de recursos:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// GET /api/ai-resource-configs/:resourceId - Buscar configuração específica
router.get("/:resourceId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    console.log(`🔍 Buscando configuração para recurso: ${resourceId}`);

    const config = await db
      .select()
      .from(aiResourceConfigs)
      .where(eq(aiResourceConfigs.resourceId, resourceId))
      .limit(1);

    if (config.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuração não encontrada"
      });
    }

    console.log(`✅ Configuração encontrada para ${resourceId}`);

    return res.status(200).json({
      success: true,
      data: config[0]
    });

  } catch (error) {
    console.error("❌ Erro ao buscar configuração específica:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// POST /api/ai-resource-configs - Criar ou atualizar configuração
router.post("/", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.tipo_usuario;

    // Verificar se é admin
    if (userType !== 'Admin' && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem configurar recursos de IA."
      });
    }

    console.log(`💾 Salvando configuração de recurso para admin ${userId}`);

    // Validar dados de entrada
    const validatedData = ResourceConfigSchema.parse(req.body);

    // Verificar se já existe configuração para este recurso
    const existingConfig = await db
      .select()
      .from(aiResourceConfigs)
      .where(eq(aiResourceConfigs.resourceId, validatedData.resourceId))
      .limit(1);

    if (existingConfig.length === 0) {
      // Criar nova configuração
      const [newConfig] = await db
        .insert(aiResourceConfigs)
        .values({
          ...validatedData,
          configuredBy: userId
        })
        .returning();

      console.log(`✅ Nova configuração criada para ${validatedData.resourceId}`);

      return res.status(201).json({
        success: true,
        message: "Configuração criada com sucesso",
        data: newConfig
      });
    } else {
      // Atualizar configuração existente
      const [updatedConfig] = await db
        .update(aiResourceConfigs)
        .set({
          ...validatedData,
          configuredBy: userId,
          atualizadoEm: new Date()
        })
        .where(eq(aiResourceConfigs.resourceId, validatedData.resourceId))
        .returning();

      console.log(`✅ Configuração atualizada para ${validatedData.resourceId}`);

      return res.status(200).json({
        success: true,
        message: "Configuração atualizada com sucesso",
        data: updatedConfig
      });
    }

  } catch (error) {
    console.error("❌ Erro ao salvar configuração de recurso:", error);
    
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

// DELETE /api/ai-resource-configs/:resourceId - Remover configuração
router.delete("/:resourceId", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    const userType = req.user?.tipo_usuario;

    // Verificar se é admin
    if (userType !== 'Admin' && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem remover configurações."
      });
    }

    console.log(`🗑️ Removendo configuração para recurso: ${resourceId}`);

    const deletedConfig = await db
      .delete(aiResourceConfigs)
      .where(eq(aiResourceConfigs.resourceId, resourceId))
      .returning();

    if (deletedConfig.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuração não encontrada"
      });
    }

    console.log(`✅ Configuração removida para ${resourceId}`);

    return res.status(200).json({
      success: true,
      message: "Configuração removida com sucesso"
    });

  } catch (error) {
    console.error("❌ Erro ao remover configuração:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// PUT /api/ai-resource-configs/:resourceId/toggle - Habilitar/desabilitar recurso
router.put("/:resourceId/toggle", authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceId } = req.params;
    const { enabled } = req.body;
    const userType = req.user?.tipo_usuario;

    // Verificar se é admin
    if (userType !== 'Admin' && userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Acesso negado. Apenas administradores podem alterar status de recursos."
      });
    }

    console.log(`🔄 Alterando status do recurso ${resourceId} para: ${enabled}`);

    const [updatedConfig] = await db
      .update(aiResourceConfigs)
      .set({
        enabled: Boolean(enabled),
        atualizadoEm: new Date()
      })
      .where(eq(aiResourceConfigs.resourceId, resourceId))
      .returning();

    if (!updatedConfig) {
      return res.status(404).json({
        success: false,
        message: "Configuração não encontrada"
      });
    }

    console.log(`✅ Status alterado para ${resourceId}: ${enabled}`);

    return res.status(200).json({
      success: true,
      message: `Recurso ${enabled ? 'habilitado' : 'desabilitado'} com sucesso`,
      data: updatedConfig
    });

  } catch (error) {
    console.error("❌ Erro ao alterar status do recurso:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;
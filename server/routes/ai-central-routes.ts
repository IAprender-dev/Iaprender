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

// Importar JWT
import jwt from "jsonwebtoken";

// Middleware de autenticação JWT (alinhado com routes.ts)
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
      escola_id: decoded.escola_id,
      cognito_sub: decoded.cognito_sub
    };
    
    next();
  } catch (error) {
    console.error("❌ Erro na autenticação JWT:", error);
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

    const { 
      subject, 
      grade, 
      topic, 
      duration, 
      school,
      numberOfStudents,
      classProfile,
      resources,
      specificObjectives,
      aiConfig
    } = req.body;

    if (!subject || !grade || !topic) {
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios: subject, grade, topic"
      });
    }

    console.log(`📚 Gerando plano de aula: ${subject} - ${grade} - ${topic}`);
    console.log(`🤖 Usando configuração de IA: ${aiConfig?.modelName || 'Padrão'}`);

    // Prompt especializado para plano de aula com informações detalhadas
    const prompt = `
Você é um especialista em educação brasileira com amplo conhecimento da BNCC, diretrizes do MEC e metodologias pedagógicas contemporâneas. Sua função é criar planejamentos de aula completos, profissionais e alinhados às normativas educacionais brasileiras.

**DADOS DA AULA:**
- Disciplina: ${subject}
- Série/Ano: ${grade}
- Tópico/Tema: ${topic}
- Duração: ${duration || '50 minutos'}
- Escola: ${school || 'Não especificado'}
- Número de Alunos: ${numberOfStudents || 'Não especificado'}
- Perfil da Turma: ${classProfile || 'Não especificado'}
- Recursos Disponíveis: ${resources || 'Recursos básicos de sala de aula'}
- Objetivos Específicos: ${specificObjectives || 'Conforme BNCC'}

**INSTRUÇÕES IMPORTANTES:**
1. Crie um plano de aula COMPLETO e PROFISSIONAL
2. Inclua alinhamento específico com a BNCC
3. Use metodologias ativas e contemporâneas
4. Considere o perfil da turma informado
5. Formate de maneira clara e organize bem as seções
6. Use linguagem técnica pedagógica adequada

**ESTRUTURA OBRIGATÓRIA:**
1. **ALINHAMENTO BNCC** - Competências e habilidades específicas
2. **TEMA DA AULA** - Contextualização e justificativa
3. **OBJETIVOS DE APRENDIZAGEM** - Gerais e específicos
4. **CONTEÚDO PROGRAMÁTICO** - Tópicos e subtópicos
5. **METODOLOGIA** - Estratégias pedagógicas detalhadas
6. **SEQUÊNCIA DIDÁTICA** - Passo a passo da aula com tempos
7. **RECURSOS DIDÁTICOS** - Materiais e equipamentos necessários
8. **AVALIAÇÃO** - Critérios e instrumentos de avaliação
9. **REFERÊNCIAS** - Bibliografia e fontes consultadas

Retorne APENAS o plano de aula estruturado, sem comentários adicionais.
`;

    // Usar configuração de IA específica ou buscar preferências do usuário
    let preferences;
    if (aiConfig && aiConfig.enabled) {
      preferences = {
        defaultAI: aiConfig.selectedModel.includes('claude') ? 'claude' : 'other',
        responseLanguage: 'pt-BR',
        complexityLevel: 'intermediario',
        temperature: aiConfig.temperature || 0.7,
        maxTokens: aiConfig.maxTokens || 3000
      };
      console.log(`🎯 Usando configuração admin: ${aiConfig.modelName}`);
    } else {
      // Buscar preferências do usuário como fallback
      const userPrefs = await db
        .select()
        .from(aiPreferences)
        .where(eq(aiPreferences.userId, userId))
        .limit(1);

      preferences = userPrefs.length > 0 ? userPrefs[0] : {
        defaultAI: 'claude',
        responseLanguage: 'pt-BR',
        complexityLevel: 'intermediario'
      };
      console.log(`👤 Usando preferências do usuário`);
    }

    // Gerar plano de aula usando AWS Bedrock
    const response = await invokeModelWithPreferences(
      prompt,
      preferences,
      aiConfig?.selectedModel
    );

    console.log(`✅ Plano de aula gerado com sucesso via ${response.model}`);

    // Salvar no S3 para histórico
    const s3Service = await import('../services/aws-s3-bedrock-service.js');
    const s3FileName = await s3Service.salvarPlanoAulaS3({
      userId: userId,
      subject,
      grade,
      topic,
      duration: duration || '50 minutos',
      school,
      numberOfStudents,
      lessonPlan: response.content,
      model: response.model,
      aiConfig: aiConfig?.modelName || 'Configuração padrão',
      timestamp: response.timestamp
    });

    console.log(`💾 Plano de aula salvo no S3: ${s3FileName}`);

    return res.status(200).json({
      success: true,
      data: {
        lesson_plan: response.content,
        subject,
        grade,
        topic,
        duration: duration || '50 minutos',
        school,
        numberOfStudents,
        model_used: response.model,
        ai_config_used: aiConfig?.modelName || 'Configuração padrão',
        usage: response.usage,
        generated_at: response.timestamp,
        s3_file: s3FileName
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

// GET /api/ai-central/lesson-plans - Listar planos de aula salvos no S3
router.get("/lesson-plans", authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    console.log(`📋 Listando planos de aula do usuário: ${userId}`);

    const s3Service = await import('../services/aws-s3-bedrock-service.js');
    const planos = await s3Service.listarPlanosAulaS3(userId);

    console.log(`✅ Encontrados ${planos.length} planos de aula`);

    return res.status(200).json({
      success: true,
      data: {
        lessonPlans: planos,
        count: planos.length
      }
    });

  } catch (error) {
    console.error("❌ Erro ao listar planos de aula:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

// GET /api/ai-central/lesson-plans/:fileName - Recuperar plano de aula específico do S3
router.get("/lesson-plans/:fileName", authenticate, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const { fileName } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Usuário não autenticado" 
      });
    }

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "Nome do arquivo é obrigatório"
      });
    }

    console.log(`📄 Recuperando plano de aula: ${fileName}`);

    const s3Service = await import('../services/aws-s3-bedrock-service.js');
    const plano = await s3Service.recuperarPlanoAulaS3(fileName);

    // Verificar se o plano pertence ao usuário
    if (plano.metadata.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Acesso negado - arquivo não pertence ao usuário"
      });
    }

    console.log(`✅ Plano de aula recuperado com sucesso`);

    return res.status(200).json({
      success: true,
      data: plano
    });

  } catch (error) {
    console.error("❌ Erro ao recuperar plano de aula:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;
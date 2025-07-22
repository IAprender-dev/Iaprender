import { Express, Request, Response } from 'express';
import { BedrockMultiModelService } from '../services/BedrockMultiModelService';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

const authMiddleware = new AuthMiddleware();
const bedrockService = new BedrockMultiModelService();

export function registerBedrockMultiModelRoutes(app: Express) {
  console.log('📝 Registrando rotas Multi-Model Bedrock...');

  /**
   * POST /api/bedrock/chat - Chat com qualquer modelo Bedrock
   */
  app.post('/api/bedrock/chat', 
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { model, prompt, systemPrompt, stream = false } = req.body;

        if (!model || !prompt) {
          return res.status(400).json({
            success: false,
            error: 'Modelo e prompt são obrigatórios'
          });
        }

        console.log(`🤖 Processando chat com modelo: ${model}`);

        // Invocar o modelo
        const result = await bedrockService.invokeModel(model, prompt, systemPrompt);

        // Se streaming foi solicitado (para implementação futura)
        if (stream) {
          // TODO: Implementar streaming de resposta
          return res.json({
            success: true,
            message: result.content,
            model: result.model,
            provider: result.provider,
            streaming: false // Por enquanto não suportamos streaming
          });
        }

        // Resposta padrão
        res.json({
          success: true,
          message: result.content,
          model: result.model,
          provider: result.provider,
          usage: result.usage
        });

      } catch (error: any) {
        console.error('❌ Erro no chat Bedrock:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao processar requisição'
        });
      }
    }
  );

  /**
   * GET /api/bedrock/models - Lista todos os modelos disponíveis
   */
  app.get('/api/bedrock/models',
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const models = bedrockService.getAvailableModels();
        
        res.json({
          success: true,
          models: models,
          count: models.length
        });

      } catch (error: any) {
        console.error('❌ Erro ao listar modelos:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao listar modelos'
        });
      }
    }
  );

  /**
   * GET /api/bedrock/models/:category - Lista modelos por categoria
   */
  app.get('/api/bedrock/models/category/:category',
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { category } = req.params;
        const models = bedrockService.getModelsByCategory(category);
        
        res.json({
          success: true,
          category: category,
          models: models,
          count: models.length
        });

      } catch (error: any) {
        console.error('❌ Erro ao listar modelos por categoria:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao listar modelos'
        });
      }
    }
  );

  /**
   * GET /api/bedrock/model/:modelKey - Informações de um modelo específico
   */
  app.get('/api/bedrock/model/:modelKey',
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { modelKey } = req.params;
        const modelInfo = bedrockService.getModelInfo(modelKey);
        
        if (!modelInfo) {
          return res.status(404).json({
            success: false,
            error: 'Modelo não encontrado'
          });
        }
        
        res.json({
          success: true,
          model: modelInfo
        });

      } catch (error: any) {
        console.error('❌ Erro ao obter informações do modelo:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao obter informações'
        });
      }
    }
  );

  /**
   * POST /api/bedrock/compare - Comparar respostas de múltiplos modelos
   */
  app.post('/api/bedrock/compare',
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { models, prompt, systemPrompt } = req.body;

        if (!models || !Array.isArray(models) || models.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Lista de modelos é obrigatória'
          });
        }

        if (!prompt) {
          return res.status(400).json({
            success: false,
            error: 'Prompt é obrigatório'
          });
        }

        console.log(`🔄 Comparando ${models.length} modelos...`);

        // Executar todos os modelos em paralelo
        const promises = models.map(model => 
          bedrockService.invokeModel(model, prompt, systemPrompt)
            .then(result => ({ model, success: true, ...result }))
            .catch(error => ({ model, success: false, error: error.message }))
        );

        const results = await Promise.all(promises);

        res.json({
          success: true,
          prompt: prompt,
          systemPrompt: systemPrompt,
          results: results
        });

      } catch (error: any) {
        console.error('❌ Erro ao comparar modelos:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao comparar modelos'
        });
      }
    }
  );

  /**
   * POST /api/bedrock/educational - Chat otimizado para contexto educacional
   */
  app.post('/api/bedrock/educational',
    authMiddleware.requireAuth(),
    async (req: Request, res: Response) => {
      try {
        const { model, prompt, subject, level, language = 'pt-BR' } = req.body;

        if (!model || !prompt) {
          return res.status(400).json({
            success: false,
            error: 'Modelo e prompt são obrigatórios'
          });
        }

        // System prompt educacional
        const systemPrompt = `Você é um assistente educacional especializado.
${subject ? `Disciplina: ${subject}` : ''}
${level ? `Nível: ${level}` : ''}
Idioma: ${language}

Suas respostas devem ser:
- Didáticas e apropriadas para o nível educacional
- Claras e bem estruturadas
- Com exemplos práticos quando relevante
- Encorajadoras e motivadoras
- Sempre em ${language === 'pt-BR' ? 'português brasileiro' : language}`;

        console.log(`🎓 Chat educacional com ${model}`);

        const result = await bedrockService.invokeModel(model, prompt, systemPrompt);

        res.json({
          success: true,
          message: result.content,
          model: result.model,
          provider: result.provider,
          context: {
            subject,
            level,
            language
          }
        });

      } catch (error: any) {
        console.error('❌ Erro no chat educacional:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Erro ao processar requisição'
        });
      }
    }
  );

  console.log('✅ Rotas Multi-Model Bedrock registradas com sucesso');
}
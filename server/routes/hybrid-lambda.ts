import { Router, Response } from 'express';
import { authMiddleware, RequisicaoAutenticada } from '../middleware/authMiddlewareUnified.js';
import { HybridLambdaService } from '../services/HybridLambdaService.js';
import { DocumentoIARequest } from '../services/LambdaIAService.js';
import { z } from 'zod';

const router = Router();
const hybridService = new HybridLambdaService();

// Schema para validação de requisição de documento IA
const documentoIASchema = z.object({
  prompt: z.string().min(10, 'Prompt deve ter pelo menos 10 caracteres'),
  tipo_arquivo: z.enum([
    'plano_aula',
    'atividade_educacional',
    'avaliacao',
    'material_didatico',
    'relatorio_pedagogico',
    'projeto_escolar',
    'comunicado',
    'documento_administrativo'
  ]),
  modelo_bedrock: z.string().optional(),
  max_tokens: z.number().min(100).max(4000).optional(),
  temperatura: z.number().min(0).max(1).optional(),
  contrato_id: z.number().optional(),
  escola_id: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

// Middleware de autenticação em todas as rotas
router.use(authMiddleware.autenticar);

/**
 * POST /api/hybrid-lambda/gerar-documento
 * Gera documento usando sistema híbrido: Lambda → Express fallback
 */
router.post('/gerar-documento', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    // Validar dados de entrada
    const dadosValidados = documentoIASchema.parse(req.body);
    
    // Preparar requisição para o serviço híbrido
    const requestHybrid: DocumentoIARequest = {
      empresa_id: usuario.empresa_id || 1,
      contrato_id: dadosValidados.contrato_id,
      escola_id: dadosValidados.escola_id,
      usuario_id: parseInt(usuario.id),
      tipo_usuario: usuario.tipo_usuario,
      nome_usuario: usuario.nome,
      prompt: dadosValidados.prompt,
      tipo_arquivo: dadosValidados.tipo_arquivo,
      modelo_bedrock: dadosValidados.modelo_bedrock,
      max_tokens: dadosValidados.max_tokens,
      temperatura: dadosValidados.temperatura,
      metadata: dadosValidados.metadata
    };

    // Processar documento via sistema híbrido
    const resultado = await hybridService.processarDocumentoHibrido(requestHybrid);

    if (!resultado.success) {
      return res.status(500).json({
        sucesso: false,
        erro: resultado.error,
        codigo: 'ERRO_PROCESSAMENTO',
        metodo_processamento: resultado.processing_method
      });
    }

    res.json({
      sucesso: true,
      dados: resultado.data,
      mensagem: `Documento gerado com sucesso via ${resultado.processing_method}`,
      estatisticas: {
        metodo_processamento: resultado.processing_method,
        tempo_execucao_ms: resultado.execution_time_ms,
        lambda_disponivel: resultado.processing_method === 'lambda'
      }
    });

  } catch (error) {
    console.error('❌ Erro no endpoint híbrido:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados inválidos',
        codigo: 'VALIDACAO_ERRO',
        detalhes: error.errors
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor',
      codigo: 'ERRO_INTERNO'
    });
  }
});

/**
 * GET /api/hybrid-lambda/status
 * Verifica status do sistema híbrido
 */
router.get('/status', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const lambdaDisponivel = await hybridService.verificarDisponibilidadeLambda();
    const estatisticas = await hybridService.obterEstatisticas();
    
    res.json({
      sucesso: true,
      dados: {
        sistema_hibrido: {
          ativo: true,
          lambda_disponivel: lambdaDisponivel,
          modo_principal: lambdaDisponivel ? 'lambda' : 'express',
          fallback_ativo: true
        },
        estatisticas
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao obter status do sistema',
      codigo: 'ERRO_STATUS'
    });
  }
});

/**
 * GET /api/hybrid-lambda/documentos
 * Lista documentos do usuário (via sistema híbrido)
 */
router.get('/documentos', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    // Usar serviço local para listar documentos (mais eficiente)
    const estatisticas = await hybridService.obterEstatisticas();
    
    res.json({
      sucesso: true,
      dados: {
        documentos: estatisticas.estatisticas_locais?.documentos_recentes || [],
        total: estatisticas.estatisticas_locais?.total_documentos || 0
      },
      mensagem: 'Documentos listados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao listar documentos:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao listar documentos',
      codigo: 'ERRO_LISTAGEM'
    });
  }
});

/**
 * POST /api/hybrid-lambda/test-lambda
 * Testa disponibilidade da função Lambda
 */
router.post('/test-lambda', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const disponivel = await hybridService.verificarDisponibilidadeLambda();
    
    res.json({
      sucesso: true,
      dados: {
        lambda_disponivel: disponivel,
        mensagem: disponivel 
          ? 'Lambda está disponível e funcional' 
          : 'Lambda não disponível - usando fallback Express',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro ao testar Lambda:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao testar função Lambda',
      codigo: 'ERRO_TESTE_LAMBDA'
    });
  }
});

export default router;
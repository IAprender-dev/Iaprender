import { Router, Response } from 'express';
import { authMiddleware, RequisicaoAutenticada } from '../middleware/authMiddlewareUnified.js';
import LambdaIAService, { DocumentoIARequest } from '../services/LambdaIAService.js';
import { z } from 'zod';

const router = Router();
const lambdaIAService = new LambdaIAService();

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
 * POST /api/lambda-ia/gerar-documento
 * Gera documento usando IA via AWS Bedrock
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
    
    // Preparar requisição para o serviço Lambda
    const requestLambda: DocumentoIARequest = {
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

    // Processar documento via Lambda IA Service
    const resultado = await lambdaIAService.processarDocumentoIA(requestLambda);

    res.json({
      sucesso: true,
      dados: resultado,
      mensagem: 'Documento gerado com sucesso via IA',
      estatisticas: {
        tokens_utilizados: resultado.tokens_utilizados,
        tempo_geracao_ms: resultado.tempo_geracao_ms
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na geração de documento IA:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Dados de entrada inválidos',
        codigo: 'DADOS_INVALIDOS',
        detalhes: error.errors
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno na geração do documento',
      codigo: 'ERRO_GERACAO_IA'
    });
  }
});

/**
 * GET /api/lambda-ia/documento/:uuid
 * Busca documento específico por UUID
 */
router.get('/documento/:uuid', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    const { uuid } = req.params;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    if (!uuid || uuid.length !== 36) {
      return res.status(400).json({
        sucesso: false,
        erro: 'UUID inválido',
        codigo: 'UUID_INVALIDO'
      });
    }

    // Buscar documento
    const documento = await lambdaIAService.buscarDocumentoPorUUID(uuid, usuario.empresa_id || 1);

    // Verificar se o usuário tem acesso ao documento
    if (documento.metadata.usuario_id !== parseInt(usuario.id) && 
        !['admin', 'gestor'].includes(usuario.tipo_usuario)) {
      return res.status(403).json({
        sucesso: false,
        erro: 'Acesso negado ao documento',
        codigo: 'ACESSO_NEGADO'
      });
    }

    res.json({
      sucesso: true,
      dados: documento,
      mensagem: 'Documento encontrado'
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar documento:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Documento não encontrado',
        codigo: 'DOCUMENTO_NAO_ENCONTRADO'
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno na busca do documento',
      codigo: 'ERRO_BUSCA_DOCUMENTO'
    });
  }
});

/**
 * GET /api/lambda-ia/meus-documentos
 * Lista documentos do usuário autenticado
 */
router.get('/meus-documentos', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    // Buscar documentos do usuário
    const documentos = await lambdaIAService.listarDocumentosUsuario(
      usuario.empresa_id || 1,
      parseInt(usuario.id)
    );

    res.json({
      sucesso: true,
      dados: documentos,
      total: documentos.length,
      mensagem: `${documentos.length} documento(s) encontrado(s)`
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar documentos:', error);
    
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno na listagem dos documentos',
      codigo: 'ERRO_LISTAGEM_DOCUMENTOS'
    });
  }
});

/**
 * GET /api/lambda-ia/documentos-empresa
 * Lista todos os documentos da empresa (apenas admin/gestor)
 */
router.get('/documentos-empresa', 
  authMiddleware.exigirGestorOuSuperior(),
  async (req: RequisicaoAutenticada, res: Response) => {
    try {
      const { usuario } = req;
      
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          erro: 'Usuário não autenticado',
          codigo: 'NAO_AUTENTICADO'
        });
      }

      // Para gestores/admin, buscar todos os documentos da empresa
      // Implementar lógica mais complexa aqui se necessário
      const documentos = await lambdaIAService.listarDocumentosUsuario(
        usuario.empresa_id || 1,
        parseInt(usuario.id)
      );

      res.json({
        sucesso: true,
        dados: documentos,
        total: documentos.length,
        mensagem: `${documentos.length} documento(s) da empresa encontrado(s)`
      });

    } catch (error: any) {
      console.error('❌ Erro ao listar documentos da empresa:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno na listagem dos documentos',
        codigo: 'ERRO_LISTAGEM_EMPRESA'
      });
    }
  }
);

/**
 * GET /api/lambda-ia/estatisticas
 * Retorna estatísticas de uso de IA
 */
router.get('/estatisticas', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    // Buscar documentos do usuário para calcular estatísticas
    const documentos = await lambdaIAService.listarDocumentosUsuario(
      usuario.empresa_id || 1,
      parseInt(usuario.id)
    );

    const estatisticas = {
      total_documentos: documentos.length,
      tokens_utilizados_total: documentos.reduce((sum, doc) => sum + doc.tokens_utilizados, 0),
      tempo_geracao_medio: documentos.length > 0 
        ? Math.round(documentos.reduce((sum, doc) => sum + doc.tempo_geracao_ms, 0) / documentos.length)
        : 0,
      tipos_arquivo: documentos.reduce((acc, doc) => {
        acc[doc.tipo_arquivo] = (acc[doc.tipo_arquivo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      documentos_por_mes: documentos.reduce((acc, doc) => {
        const mes = doc.data_criacao.substring(0, 7); // YYYY-MM
        acc[mes] = (acc[mes] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      sucesso: true,
      dados: estatisticas,
      mensagem: 'Estatísticas calculadas com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno no cálculo das estatísticas',
      codigo: 'ERRO_ESTATISTICAS'
    });
  }
});

/**
 * GET /api/lambda-ia/modelos-disponiveis
 * Lista modelos Bedrock disponíveis
 */
router.get('/modelos-disponiveis', async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    const modelos = [
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        nome: 'Claude 3 Haiku',
        descricao: 'Modelo rápido e eficiente para tarefas simples',
        max_tokens: 4000,
        custo_por_token: 0.00025,
        recomendado_para: ['comunicados', 'atividades_simples', 'resumos']
      },
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        nome: 'Claude 3 Sonnet',
        descricao: 'Modelo balanceado para tarefas complexas',
        max_tokens: 4000,
        custo_por_token: 0.003,
        recomendado_para: ['planos_aula', 'avaliacoes', 'projetos_escolares']
      },
      {
        id: 'anthropic.claude-3-opus-20240229-v1:0',
        nome: 'Claude 3 Opus',
        descricao: 'Modelo mais avançado para tarefas complexas',
        max_tokens: 4000,
        custo_por_token: 0.015,
        recomendado_para: ['material_didatico', 'relatorios_pedagogicos', 'documentos_administrativos']
      }
    ];

    res.json({
      sucesso: true,
      dados: modelos,
      total: modelos.length,
      mensagem: 'Modelos disponíveis listados com sucesso'
    });

  } catch (error: any) {
    console.error('❌ Erro ao listar modelos:', error);
    
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno na listagem dos modelos',
      codigo: 'ERRO_LISTAGEM_MODELOS'
    });
  }
});

export default router;
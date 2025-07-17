import { Router, Request, Response } from 'express';
import multer from 'multer';
import S3DocumentService from '../services/S3DocumentService';
import { authMiddleware, RequisicaoAutenticada } from '../middleware/authMiddlewareUnified.js';
import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { arquivos } from '../../shared/schema';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const s3DocumentService = new S3DocumentService();

// Schema para validação de upload
const uploadSchema = z.object({
  descricao: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Middleware para autenticação em todas as rotas
router.use(authMiddleware.autenticar);

/**
 * POST /api/s3-documents/upload - Upload de documento
 */
router.post('/upload', upload.single('file'), async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { usuario } = req;
    
    if (!req.file) {
      return res.status(400).json({ 
        sucesso: false, 
        erro: 'Nenhum arquivo enviado',
        codigo: 'ARQUIVO_AUSENTE'
      });
    }

    const { descricao, metadata } = uploadSchema.parse(req.body);
    
    // Verificar se o usuário tem permissão para upload
    if (!usuario || !usuario.id) {
      return res.status(401).json({ 
        sucesso: false, 
        erro: 'Usuário não autenticado',
        codigo: 'NAO_AUTENTICADO'
      });
    }

    const documentUpload = {
      empresaId: usuario.empresa_id || 1,
      contratoId: null,
      escolaId: null,
      usuarioId: parseInt(usuario.id),
      tipoUsuario: usuario.tipo_usuario || usuario.role,
      fileName: req.file.originalname,
      fileContent: req.file.buffer,
      mimeType: req.file.mimetype,
      descricao,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    };

    const uuid = await s3DocumentService.uploadDocument(documentUpload);
    
    res.json({ 
      sucesso: true, 
      uuid,
      mensagem: 'Documento enviado com sucesso',
      nomeArquivo: req.file.originalname,
      tamanho: req.file.size,
    });
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({ 
      sucesso: false, 
      erro: 'Erro interno do servidor',
      codigo: 'ERRO_INTERNO'
    });
  }
});

/**
 * GET /api/s3-documents - Lista documentos do usuário
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const documents = await s3DocumentService.getDocumentsByUser(parseInt(user.id), user.tipo_usuario || user.role);
    
    res.json({ 
      success: true, 
      documents,
      count: documents.length,
      userType: user.tipo_usuario || user.role,
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/s3-documents/:uuid - Obter informações de documento específico
 */
router.get('/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { uuid } = req.params;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const documents = await s3DocumentService.getDocumentsByUser(parseInt(user.id), user.tipo_usuario || user.role);
    const document = documents.find(doc => doc.uuid === uuid);
    
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado ou acesso negado' });
    }

    res.json({ 
      success: true, 
      document,
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/s3-documents/:uuid/download - Download de documento
 */
router.get('/:uuid/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { uuid } = req.params;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const downloadUrl = await s3DocumentService.getDownloadUrl(uuid, parseInt(user.id), user.tipo_usuario || user.role);
    
    res.json({ 
      success: true, 
      downloadUrl,
      expiresIn: 3600, // 1 hora
    });
  } catch (error) {
    console.error('Erro ao gerar URL de download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/s3-documents/:uuid - Deletar documento
 */
router.delete('/:uuid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { uuid } = req.params;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    await s3DocumentService.deleteDocument(uuid, parseInt(user.id), user.tipo_usuario || user.role);
    
    res.json({ 
      success: true, 
      message: 'Documento deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/s3-documents/structure - Obter estrutura hierárquica de diretórios
 */
router.get('/structure', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const structure = await s3DocumentService.listDirectoryStructure(parseInt(user.id), user.tipo_usuario || user.role);
    
    res.json({ 
      success: true, 
      structure,
      userType: user.tipo_usuario,
    });
  } catch (error) {
    console.error('Erro ao buscar estrutura:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/s3-documents/batch-upload - Upload em lote
 */
router.post('/batch-upload', upload.array('files', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    if (!user || !user.id) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const uploads = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const documentUpload = {
          empresaId: user.empresa_id || 1,
          contratoId: null,
          escolaId: null,
          usuarioId: parseInt(user.id),
          tipoUsuario: user.tipo_usuario || user.role,
          fileName: file.originalname,
          fileContent: file.buffer,
          mimeType: file.mimetype,
          descricao: `Upload em lote: ${file.originalname}`,
        };

        const uuid = await s3DocumentService.uploadDocument(documentUpload);
        uploads.push({ 
          uuid, 
          fileName: file.originalname,
          size: file.size,
          success: true,
        });
      } catch (error) {
        errors.push({ 
          fileName: file.originalname, 
          error: error.message,
          success: false,
        });
      }
    }

    res.json({ 
      success: true, 
      uploads,
      errors,
      totalProcessed: uploads.length + errors.length,
      successCount: uploads.length,
      errorCount: errors.length,
    });
  } catch (error) {
    console.error('Erro no upload em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
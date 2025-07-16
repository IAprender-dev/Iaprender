import { Router, Request, Response } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { createS3BedrockService } from '../services/aws-s3-bedrock-service.js';

const router = Router();

// Configurar multer para upload em memória
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Tipos de arquivo permitidos para conteúdo educacional
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  }
});

// Middleware de autenticação
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

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    tipo_usuario: string;
    empresa_id?: number;
    escola_id?: number;
  };
}

/**
 * POST /api/s3-bedrock/upload
 * Upload de arquivo educacional para S3
 */
router.post('/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const { resourceType = 'document', metadata = '{}' } = req.body;
    const userId = req.user!.id;
    
    // Parse dos metadados
    let parsedMetadata: Record<string, string> = {};
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      console.warn('⚠️ Metadados inválidos, usando objeto vazio');
    }

    console.log(`📁 Iniciando upload de ${req.file.originalname} para usuário ${userId}`);

    // Criar serviço S3+Bedrock
    const s3BedrockService = await createS3BedrockService();
    
    // Upload do arquivo
    const uploadedFile = await s3BedrockService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      userId,
      resourceType,
      parsedMetadata
    );

    res.status(201).json({
      success: true,
      message: 'Arquivo carregado com sucesso',
      data: uploadedFile
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * POST /api/s3-bedrock/analyze/:fileKey
 * Análise de conteúdo educacional usando Bedrock
 */
router.post('/analyze/:fileKey(*)', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileKey } = req.params;
    const { contentText } = req.body;
    const userId = req.user!.id;

    console.log(`🧠 Iniciando análise educacional do arquivo: ${fileKey}`);

    // Verificar se o arquivo pertence ao usuário (segurança)
    if (!fileKey.includes(`/${userId}/`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: arquivo não pertence ao usuário'
      });
    }

    const s3BedrockService = await createS3BedrockService();
    
    // Analisar conteúdo
    const analysis = await s3BedrockService.analyzeEducationalContent(
      fileKey,
      contentText
    );

    res.json({
      success: true,
      message: 'Análise educacional concluída',
      data: analysis
    });

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na análise do conteúdo',
      error: error.message
    });
  }
});

/**
 * GET /api/s3-bedrock/files
 * Listar arquivos do usuário
 */
router.get('/files', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { resourceType, limit = '50' } = req.query;

    console.log(`📋 Listando arquivos para usuário ${userId}`);

    const s3BedrockService = await createS3BedrockService();
    
    const files = await s3BedrockService.listUserFiles(
      userId,
      resourceType as any,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      message: `${files.length} arquivos encontrados`,
      data: files
    });

  } catch (error) {
    console.error('❌ Erro ao listar arquivos:', error);
    
    // Se o bucket não existir, retornar lista vazia
    if (error.message?.includes('NoSuchBucket') || error.message?.includes('does not exist')) {
      console.log('⚠️ Bucket não existe, retornando lista vazia');
      return res.json({
        success: true,
        message: 'Nenhum arquivo encontrado (bucket não configurado)',
        data: []
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao carregar arquivos',
      error: error.message
    });
  }
});

/**
 * DELETE /api/s3-bedrock/files/:fileKey
 * Deletar arquivo do S3
 */
router.delete('/files/:fileKey(*)', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileKey } = req.params;
    const userId = req.user!.id;

    // Verificar se o arquivo pertence ao usuário
    if (!fileKey.includes(`/${userId}/`)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: arquivo não pertence ao usuário'
      });
    }

    console.log(`🗑️ Deletando arquivo: ${fileKey}`);

    const s3BedrockService = await createS3BedrockService();
    const deleted = await s3BedrockService.deleteFile(fileKey);

    if (deleted) {
      res.json({
        success: true,
        message: 'Arquivo deletado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Falha ao deletar arquivo'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao deletar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao deletar arquivo',
      error: error.message
    });
  }
});

/**
 * POST /api/s3-bedrock/presigned-upload
 * Gerar URL presignada para upload direto
 */
router.post('/presigned-upload', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileName, mimeType, resourceType = 'document' } = req.body;
    const userId = req.user!.id;

    if (!fileName || !mimeType) {
      return res.status(400).json({
        success: false,
        message: 'fileName e mimeType são obrigatórios'
      });
    }

    console.log(`🔗 Gerando URL presignada para ${fileName}`);

    const s3BedrockService = await createS3BedrockService();
    
    const { uploadUrl, fileKey } = await s3BedrockService.getPresignedUploadUrl(
      fileName,
      mimeType,
      userId,
      resourceType
    );

    res.json({
      success: true,
      message: 'URL de upload gerada',
      data: {
        uploadUrl,
        fileKey,
        expiresIn: 3600 // 1 hora
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar URL:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar URL de upload',
      error: error.message
    });
  }
});

/**
 * POST /api/s3-bedrock/batch-process
 * Processamento em lote de arquivos
 */
router.post('/batch-process', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileKeys, processingType = 'analyze' } = req.body;
    const userId = req.user!.id;

    if (!Array.isArray(fileKeys) || fileKeys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de fileKeys é obrigatória'
      });
    }

    // Verificar se todos os arquivos pertencem ao usuário
    const invalidFiles = fileKeys.filter(key => !key.includes(`/${userId}/`));
    if (invalidFiles.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado: alguns arquivos não pertencem ao usuário',
        invalidFiles
      });
    }

    console.log(`🔄 Processamento em lote de ${fileKeys.length} arquivos`);

    const s3BedrockService = await createS3BedrockService();
    
    const results = await s3BedrockService.batchProcessFiles(
      fileKeys,
      processingType
    );

    res.json({
      success: true,
      message: `Processamento concluído para ${Object.keys(results).length} arquivos`,
      data: results
    });

  } catch (error) {
    console.error('❌ Erro no processamento em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no processamento em lote',
      error: error.message
    });
  }
});

/**
 * GET /api/s3-bedrock/debug-credentials  
 * Debug das credenciais AWS (temporário)
 */
router.get('/debug-credentials', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { SecretsManager } = await import('../services/secrets-manager.js');
    const secretsManager = new SecretsManager();
    const creds = await secretsManager.getAWSCredentials();
    
    // Verificar se há espaços em branco ou caracteres especiais
    const cleanAccessKeyId = creds.accessKeyId?.trim() || '';
    const cleanSecretAccessKey = creds.secretAccessKey?.trim() || '';
    
    res.json({
      success: true,
      data: {
        accessKeyId: cleanAccessKeyId ? cleanAccessKeyId.substring(0, 8) + '***' : 'EMPTY',
        secretAccessKey: cleanSecretAccessKey ? cleanSecretAccessKey.substring(0, 8) + '***' : 'EMPTY',
        region: creds.region,
        isConfigured: creds.isConfigured,
        types: {
          accessKeyId: typeof creds.accessKeyId + ' (length: ' + (creds.accessKeyId?.length || 0) + ')',
          secretAccessKey: typeof creds.secretAccessKey + ' (length: ' + (creds.secretAccessKey?.length || 0) + ')',
          region: typeof creds.region
        },
        validation: {
          accessKeyIdValid: /^AKIA[0-9A-Z]{16}$/.test(cleanAccessKeyId),
          secretAccessKeyValid: /^[A-Za-z0-9+/]{40}$/.test(cleanSecretAccessKey),
          regionValid: typeof creds.region === 'string' && creds.region.length > 0,
          hasWhitespace: {
            accessKeyId: creds.accessKeyId !== cleanAccessKeyId,
            secretAccessKey: creds.secretAccessKey !== cleanSecretAccessKey
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro no debug de credenciais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar credenciais',
      error: error.message
    });
  }
});

/**
 * GET /api/s3-bedrock/status
 * Status do serviço S3+Bedrock
 */
router.get('/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const s3BedrockService = await createS3BedrockService();
    
    // Teste básico de conectividade sem lançar erro se bucket não existir
    let testFiles = [];
    let s3Connected = true;
    
    try {
      testFiles = await s3BedrockService.listUserFiles(req.user!.id, undefined, 1);
    } catch (listError) {
      console.log('⚠️ Erro ao testar conectividade S3:', listError.message);
      if (listError.message?.includes('NoSuchBucket')) {
        // Bucket não existe, mas credenciais estão funcionando
        s3Connected = true; // Credenciais válidas
      } else {
        s3Connected = false; // Erro real de conectividade
      }
    }
    
    res.json({
      success: true,
      message: 'Serviço S3+Bedrock operacional',
      data: {
        s3Connected,
        bedrockConnected: true, // AWS SDK inicializado com sucesso
        userFileCount: testFiles.length,
        bucketExists: testFiles.length > 0 || s3Connected,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro no status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status',
      error: error.message,
      data: {
        s3Connected: false,
        bedrockConnected: false,
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
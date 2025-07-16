import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

interface S3BedrockConfig {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface UploadedFile {
  key: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  url: string;
  userId: number;
  resourceType: 'lesson-plan' | 'activity' | 'document' | 'image' | 'video' | 'audio';
}

interface BedrockAnalysisResult {
  summary: string;
  keyPoints: string[];
  educationalLevel: string;
  subject: string;
  suggestedActivities: string[];
  bnccAlignment: string[];
  confidence: number;
}

export class AWSS3BedrockService {
  private s3Client: S3Client;
  private bedrockClient: BedrockRuntimeClient;
  private bucketName: string;
  private region: string;

  constructor(config: S3BedrockConfig) {
    this.bucketName = config.bucketName;
    this.region = config.region;
    
    // Configurar cliente S3
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    // Configurar cliente Bedrock
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload de arquivo para S3 com metadados educacionais
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: number,
    resourceType: UploadedFile['resourceType'],
    metadata: Record<string, string> = {}
  ): Promise<UploadedFile> {
    try {
      // Gerar chave única para o arquivo
      const fileExtension = path.extname(originalName);
      const fileName = path.basename(originalName, fileExtension);
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const key = `educational-content/${resourceType}/${userId}/${uniqueId}-${fileName}${fileExtension}`;

      // Metadados completos
      const fullMetadata = {
        'original-name': originalName,
        'user-id': userId.toString(),
        'resource-type': resourceType,
        'uploaded-at': new Date().toISOString(),
        'file-size': fileBuffer.length.toString(),
        ...metadata
      };

      // Upload para S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: fullMetadata,
        ServerSideEncryption: 'AES256'
      });

      await this.s3Client.send(uploadCommand);

      // Gerar URL presignada para acesso
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, getCommand, { 
        expiresIn: 3600 // 1 hora
      });

      const uploadedFile: UploadedFile = {
        key,
        originalName,
        size: fileBuffer.length,
        mimeType,
        uploadedAt: new Date(),
        url: signedUrl,
        userId,
        resourceType
      };

      console.log(`📁 Arquivo ${originalName} carregado para S3: ${key}`);
      return uploadedFile;

    } catch (error) {
      console.error('❌ Erro no upload para S3:', error);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  /**
   * Análise de conteúdo educacional usando AWS Bedrock
   */
  async analyzeEducationalContent(
    fileKey: string,
    contentText?: string
  ): Promise<BedrockAnalysisResult> {
    try {
      // Se não temos o texto, baixar o arquivo do S3 e extrair
      let textContent = contentText;
      if (!textContent) {
        textContent = await this.extractTextFromS3File(fileKey);
      }

      // Prompt especializado para análise educacional
      const prompt = `
Analise o seguinte conteúdo educacional e forneça uma análise detalhada:

CONTEÚDO:
${textContent}

Por favor, forneça uma análise estruturada em JSON com os seguintes campos:
- summary: Resumo executivo do conteúdo (máximo 200 palavras)
- keyPoints: Lista de 5-8 pontos principais abordados
- educationalLevel: Nível educacional recomendado (Infantil, Fundamental I, Fundamental II, Médio, Superior)
- subject: Disciplina principal (Português, Matemática, Ciências, História, Geografia, etc.)
- suggestedActivities: Lista de 3-5 atividades pedagógicas sugeridas
- bnccAlignment: Códigos de competências e habilidades da BNCC relacionadas
- confidence: Nível de confiança da análise (0-100)

Responda APENAS com o JSON válido, sem texto adicional.`;

      // Chamar Claude 3.5 Sonnet via Bedrock
      const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
      
      const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 4000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
      });

      console.log(`🧠 Analisando conteúdo educacional com ${modelId}...`);
      const response = await this.bedrockClient.send(command);
      
      // Decodificar resposta
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const analysisText = responseBody.content[0].text;
      
      // Parse do JSON retornado
      const analysis: BedrockAnalysisResult = JSON.parse(analysisText);
      
      console.log(`✅ Análise educacional concluída com ${analysis.confidence}% de confiança`);
      return analysis;

    } catch (error) {
      console.error('❌ Erro na análise Bedrock:', error);
      throw new Error(`Falha na análise: ${error.message}`);
    }
  }

  /**
   * Extração de texto de arquivo S3
   */
  private async extractTextFromS3File(fileKey: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);
      const buffer = await this.streamToBuffer(response.Body as any);
      
      // Determinar tipo de arquivo pela extensão
      const extension = path.extname(fileKey).toLowerCase();
      
      switch (extension) {
        case '.txt':
          return buffer.toString('utf-8');
        case '.json':
          return JSON.stringify(JSON.parse(buffer.toString('utf-8')), null, 2);
        case '.pdf':
          // Para PDFs, retornamos uma representação base64 que pode ser processada
          return `[PDF Content - Base64: ${buffer.toString('base64').substring(0, 100)}...]`;
        default:
          return buffer.toString('utf-8');
      }
    } catch (error) {
      console.error('❌ Erro ao extrair texto do S3:', error);
      throw new Error(`Falha na extração: ${error.message}`);
    }
  }

  /**
   * Listar arquivos do usuário por tipo
   */
  async listUserFiles(
    userId: number,
    resourceType?: UploadedFile['resourceType'],
    limit: number = 50
  ): Promise<UploadedFile[]> {
    try {
      const prefix = resourceType 
        ? `educational-content/${resourceType}/${userId}/`
        : `educational-content/${userId}/`;

      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: limit,
      });

      const response = await this.s3Client.send(command);
      const files: UploadedFile[] = [];

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Size && obj.LastModified) {
            // Gerar URL presignada
            const getCommand = new GetObjectCommand({
              Bucket: this.bucketName,
              Key: obj.Key,
            });
            
            const signedUrl = await getSignedUrl(this.s3Client, getCommand, { 
              expiresIn: 3600 
            });

            // Extrair informações do caminho
            const pathParts = obj.Key.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const [, originalName] = fileName.split('-', 2);

            files.push({
              key: obj.Key,
              originalName: originalName || fileName,
              size: obj.Size,
              mimeType: this.getMimeTypeFromExtension(obj.Key),
              uploadedAt: obj.LastModified,
              url: signedUrl,
              userId,
              resourceType: (pathParts[1] as UploadedFile['resourceType']) || 'document'
            });
          }
        }
      }

      console.log(`📋 Listados ${files.length} arquivos para usuário ${userId}`);
      return files;

    } catch (error) {
      console.error('❌ Erro ao listar arquivos:', error);
      // Se o bucket não existir, retornar array vazio em vez de erro
      if (error.name === 'NoSuchBucket') {
        console.log(`⚠️ Bucket ${this.bucketName} não existe. Retornando lista vazia.`);
        return [];
      }
      throw new Error(`Falha na listagem: ${error.message}`);
    }
  }

  /**
   * Listar pastas do bucket S3
   */
  async listBucketFolders(prefix: string = ''): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        Delimiter: '/',
        MaxKeys: 1000
      });

      const response = await this.s3Client.send(command);
      
      const folders: string[] = [];
      
      // Adicionar pastas (CommonPrefixes)
      if (response.CommonPrefixes) {
        for (const commonPrefix of response.CommonPrefixes) {
          if (commonPrefix.Prefix) {
            folders.push(commonPrefix.Prefix);
          }
        }
      }
      
      console.log(`📁 Encontradas ${folders.length} pastas no bucket ${this.bucketName}`);
      return folders.sort();

    } catch (error) {
      console.error('❌ Erro ao listar pastas:', error);
      if (error.name === 'NoSuchBucket') {
        console.log(`⚠️ Bucket ${this.bucketName} não existe.`);
        return [];
      }
      throw new Error(`Falha na listagem de pastas: ${error.message}`);
    }
  }

  /**
   * Deletar arquivo do S3
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      console.log(`🗑️ Arquivo deletado: ${fileKey}`);
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar arquivo:', error);
      return false;
    }
  }

  /**
   * Gerar URL presignada para upload direto
   */
  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    userId: number,
    resourceType: UploadedFile['resourceType']
  ): Promise<{ uploadUrl: string; fileKey: string }> {
    try {
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueId = crypto.randomBytes(16).toString('hex');
      const key = `educational-content/${resourceType}/${userId}/${uniqueId}-${baseName}${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
        Metadata: {
          'original-name': fileName,
          'user-id': userId.toString(),
          'resource-type': resourceType,
          'uploaded-at': new Date().toISOString()
        }
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn: 3600 // 1 hora para completar upload
      });

      return { uploadUrl, fileKey: key };

    } catch (error) {
      console.error('❌ Erro ao gerar URL de upload:', error);
      throw new Error(`Falha na geração de URL: ${error.message}`);
    }
  }

  /**
   * Processamento em lote de arquivos educacionais
   */
  async batchProcessFiles(
    fileKeys: string[],
    processingType: 'analyze' | 'summarize' | 'extract-activities' = 'analyze'
  ): Promise<Record<string, BedrockAnalysisResult | string>> {
    const results: Record<string, BedrockAnalysisResult | string> = {};

    for (const fileKey of fileKeys) {
      try {
        console.log(`🔄 Processando arquivo: ${fileKey}`);
        
        if (processingType === 'analyze') {
          results[fileKey] = await this.analyzeEducationalContent(fileKey);
        } else {
          // Para outros tipos, extrair apenas texto
          results[fileKey] = await this.extractTextFromS3File(fileKey);
        }
        
        // Delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${fileKey}:`, error);
        results[fileKey] = `Erro: ${error.message}`;
      }
    }

    console.log(`✅ Processamento em lote concluído: ${Object.keys(results).length} arquivos`);
    return results;
  }

  // Utilitários
  private getMimeTypeFromExtension(fileName: string): string {
    const extension = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

// Factory para criar instância do serviço
export async function createS3BedrockService(): Promise<AWSS3BedrockService> {
  // Importar configurações das secrets
  const { SecretsManager } = await import('./secrets-manager.js');
  const secretsManager = new SecretsManager();
  const awsCredentials = await secretsManager.getAWSCredentials();
  
  // Verificar se há configuração específica de bucket nos secrets
  const bucketName = process.env.AWS_S3_BUCKET || 'iaprender-files-2025';
  
  const config: S3BedrockConfig = {
    bucketName: process.env.S3_BUCKET_NAME || bucketName,
    region: (awsCredentials.region || 'us-east-1').trim(),
    accessKeyId: (awsCredentials.accessKeyId || '').trim(),
    secretAccessKey: (awsCredentials.secretAccessKey || '').trim()
  };

  // Debug das credenciais que serão usadas
  console.log('🔐 Config S3/Bedrock criado:', {
    bucketName: config.bucketName,
    region: config.region,
    accessKeyId: config.accessKeyId ? config.accessKeyId.substring(0, 8) + '***' : 'EMPTY',
    secretAccessKey: config.secretAccessKey ? config.secretAccessKey.substring(0, 8) + '***' : 'EMPTY',
    credentialsValid: !!(config.accessKeyId && config.secretAccessKey)
  });

  return new AWSS3BedrockService(config);
}

// Função para salvar plano de aula no S3
export async function salvarPlanoAulaS3(planoData: {
  userId: number;
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  school: string;
  numberOfStudents: string;
  lessonPlan: string;
  model: string;
  aiConfig: string;
  timestamp: string;
}): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `bedrock/lesson-plans/user-${planoData.userId}/plano-aula-${timestamp}.json`;
    
    const planData = {
      metadata: {
        userId: planoData.userId,
        subject: planoData.subject,
        grade: planoData.grade,
        topic: planoData.topic,
        duration: planoData.duration,
        school: planoData.school,
        numberOfStudents: planoData.numberOfStudents,
        model: planoData.model,
        aiConfig: planoData.aiConfig,
        generatedAt: planoData.timestamp,
        savedAt: new Date().toISOString()
      },
      content: {
        lessonPlan: planoData.lessonPlan
      }
    };

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: JSON.stringify(planData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'user-id': planoData.userId.toString(),
        'subject': planoData.subject,
        'grade': planoData.grade,
        'model': planoData.model,
        'generated-at': planoData.timestamp
      }
    });

    await s3Client.send(putCommand);
    
    console.log(`💾 Plano de aula salvo no S3: s3://${BUCKET_NAME}/${fileName}`);
    return fileName;
    
  } catch (error) {
    console.error('❌ Erro ao salvar plano de aula no S3:', error);
    throw error;
  }
}

// Função para listar planos de aula salvos no S3
export async function listarPlanosAulaS3(userId: number): Promise<any[]> {
  try {
    const prefix = `bedrock/lesson-plans/user-${userId}/`;
    
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 100
    });

    const response = await s3Client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const planos = await Promise.all(
      response.Contents.map(async (object) => {
        if (!object.Key) return null;
        
        try {
          const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: object.Key
          });
          
          const objectResponse = await s3Client.send(getCommand);
          const content = await objectResponse.Body?.transformToString();
          
          if (content) {
            const planData = JSON.parse(content);
            return {
              fileName: object.Key,
              lastModified: object.LastModified,
              size: object.Size,
              metadata: planData.metadata,
              s3Url: `s3://${BUCKET_NAME}/${object.Key}`
            };
          }
        } catch (error) {
          console.error(`❌ Erro ao ler arquivo ${object.Key}:`, error);
          return null;
        }
      })
    );

    return planos.filter(plano => plano !== null);
    
  } catch (error) {
    console.error('❌ Erro ao listar planos de aula do S3:', error);
    throw error;
  }
}

// Função para recuperar plano de aula específico do S3
export async function recuperarPlanoAulaS3(fileName: string): Promise<any> {
  try {
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName
    });

    const response = await s3Client.send(getCommand);
    const content = await response.Body?.transformToString();
    
    if (!content) {
      throw new Error('Arquivo não encontrado ou vazio');
    }

    return JSON.parse(content);
    
  } catch (error) {
    console.error('❌ Erro ao recuperar plano de aula do S3:', error);
    throw error;
  }
}
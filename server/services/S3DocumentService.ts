import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../db';
import { arquivos } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import * as crypto from 'crypto';

export interface S3DocumentUpload {
  empresaId: number;
  contratoId?: number;
  escolaId?: number;
  usuarioId: number;
  tipoUsuario: string;
  fileName: string;
  fileContent: Buffer;
  mimeType: string;
  descricao?: string;
  metadata?: Record<string, any>;
}

export interface S3DocumentInfo {
  uuid: string;
  s3Key: string;
  descricao: string;
  tipoArquivo: string;
  tamanhoBytes: number;
  mimeType: string;
  criadoEm: Date;
  criadoPor: string;
  empresaNome: string;
  escolaNome?: string;
  usuarioNome: string;
}

export class S3DocumentService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME || 'iaprender-bucket';
  }

  /**
   * Gera S3 key estruturada baseada na hierarquia organizacional
   */
  private generateS3Key(
    empresaId: number,
    contratoId: number,
    escolaId: number,
    usuarioId: number,
    tipoUsuario: string,
    fileName: string
  ): string {
    const uuid = crypto.randomUUID();
    const extension = fileName.split('.').pop();
    const baseKey = `empresa-${empresaId}/contrato-${contratoId}/escola-${escolaId}/${tipoUsuario}-${usuarioId}`;
    return `${baseKey}/${uuid}.${extension}`;
  }

  /**
   * Faz upload de documento para S3 e registra no PostgreSQL
   */
  async uploadDocument(upload: S3DocumentUpload): Promise<string> {
    const { empresaId, contratoId, escolaId, usuarioId, tipoUsuario, fileName, fileContent, mimeType, descricao, metadata } = upload;

    // Gerar S3 key estruturada
    const s3Key = this.generateS3Key(
      empresaId,
      contratoId || 0,
      escolaId || 0,
      usuarioId,
      tipoUsuario,
      fileName
    );

    try {
      // Upload para S3
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileContent,
        ContentType: mimeType,
        Metadata: {
          'original-filename': fileName,
          'uploaded-by': usuarioId.toString(),
          'tipo-usuario': tipoUsuario,
          'empresa-id': empresaId.toString(),
          ...(metadata || {})
        },
      });

      await this.s3Client.send(uploadCommand);

      // Registrar no PostgreSQL
      const [arquivo] = await db
        .insert(arquivos)
        .values({
          empresaId,
          contratoId: contratoId || null,
          escolaId: escolaId || null,
          usuarioId,
          tipoUsuario: tipoUsuario as any,
          s3Key,
          descricao: descricao || fileName,
          tipoArquivo: fileName.split('.').pop() || 'unknown',
          tamanhoBytes: fileContent.length,
          mimeType,
          metadata: metadata || {},
          criadoPor: usuarioId,
        })
        .returning();

      return arquivo.uuid;
    } catch (error) {
      console.error('Erro ao fazer upload de documento:', error);
      throw new Error('Falha no upload do documento');
    }
  }

  /**
   * Obtém documentos que o usuário tem permissão para acessar
   */
  async getDocumentsByUser(usuarioId: number, tipoUsuario: string): Promise<S3DocumentInfo[]> {
    let query: any;

    try {
      switch (tipoUsuario) {
        case 'admin':
          // Admin vê todos os documentos
          query = sql`SELECT * FROM vw_arquivos_completos`;
          break;
        
        case 'gestor':
          // Gestor vê documentos de sua empresa
          query = sql`SELECT * FROM get_arquivos_por_gestor(${usuarioId})`;
          break;
        
        case 'diretor':
          // Diretor vê documentos de sua escola
          query = sql`SELECT * FROM get_arquivos_por_diretor(${usuarioId})`;
          break;
        
        case 'professor':
          // Professor vê documentos de alunos de suas escolas
          query = sql`SELECT * FROM get_arquivos_por_professor(${usuarioId})`;
          break;
        
        case 'aluno':
          // Aluno vê apenas seus próprios documentos
          query = sql`SELECT * FROM get_meus_arquivos(${usuarioId})`;
          break;
        
        default:
          throw new Error('Tipo de usuário não reconhecido');
      }

      const results = await db.execute(query);
      
      return results.map((row: any) => ({
        uuid: row.uuid,
        s3Key: row.s3_key,
        descricao: row.descricao,
        tipoArquivo: row.tipo_arquivo,
        tamanhoBytes: row.tamanho_bytes,
        mimeType: row.mime_type,
        criadoEm: row.criado_em,
        criadoPor: row.criado_por_nome || 'Sistema',
        empresaNome: row.empresa_nome,
        escolaNome: row.escola_nome,
        usuarioNome: row.usuario_nome,
      }));
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw new Error('Falha ao buscar documentos');
    }
  }

  /**
   * Gera URL assinada para download de documento
   */
  async getDownloadUrl(uuid: string, usuarioId: number, tipoUsuario: string): Promise<string> {
    try {
      // Verificar se o usuário tem permissão para acessar este documento
      const documents = await this.getDocumentsByUser(usuarioId, tipoUsuario);
      const document = documents.find(doc => doc.uuid === uuid);
      
      if (!document) {
        throw new Error('Documento não encontrado ou acesso negado');
      }

      // Gerar URL assinada
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: document.s3Key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 }); // 1 hora
      return signedUrl;
    } catch (error) {
      console.error('Erro ao gerar URL de download:', error);
      throw new Error('Falha ao gerar URL de download');
    }
  }

  /**
   * Remove documento do S3 e do PostgreSQL
   */
  async deleteDocument(uuid: string, usuarioId: number, tipoUsuario: string): Promise<void> {
    try {
      // Verificar se o usuário tem permissão para deletar este documento
      const documents = await this.getDocumentsByUser(usuarioId, tipoUsuario);
      const document = documents.find(doc => doc.uuid === uuid);
      
      if (!document) {
        throw new Error('Documento não encontrado ou acesso negado');
      }

      // Verificar se o usuário é o dono do documento ou tem permissão hierárquica
      const [arquivoInfo] = await db
        .select()
        .from(arquivos)
        .where(eq(arquivos.uuid, uuid));

      if (!arquivoInfo) {
        throw new Error('Documento não encontrado');
      }

      // Verificar permissões de exclusão
      const canDelete = 
        arquivoInfo.usuarioId === usuarioId || // Dono do documento
        tipoUsuario === 'admin' || // Admin pode deletar tudo
        (tipoUsuario === 'gestor' && arquivoInfo.empresaId) || // Gestor pode deletar da sua empresa
        (tipoUsuario === 'diretor' && arquivoInfo.escolaId); // Diretor pode deletar da sua escola

      if (!canDelete) {
        throw new Error('Sem permissão para deletar este documento');
      }

      // Deletar do S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: document.s3Key,
      });

      await this.s3Client.send(deleteCommand);

      // Marcar como excluído no PostgreSQL (soft delete)
      await db
        .update(arquivos)
        .set({
          status: 'excluido',
          atualizadoEm: new Date(),
          atualizadoPor: usuarioId,
        })
        .where(eq(arquivos.uuid, uuid));

    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw new Error('Falha ao deletar documento');
    }
  }

  /**
   * Lista estrutura de diretórios S3 para um usuário
   */
  async listDirectoryStructure(usuarioId: number, tipoUsuario: string): Promise<any> {
    try {
      const documents = await this.getDocumentsByUser(usuarioId, tipoUsuario);
      
      // Agrupar por estrutura hierárquica
      const structure: any = {};
      
      documents.forEach(doc => {
        const parts = doc.s3Key.split('/');
        const empresa = parts[0];
        const contrato = parts[1];
        const escola = parts[2];
        const usuario = parts[3];
        
        if (!structure[empresa]) structure[empresa] = {};
        if (!structure[empresa][contrato]) structure[empresa][contrato] = {};
        if (!structure[empresa][contrato][escola]) structure[empresa][contrato][escola] = {};
        if (!structure[empresa][contrato][escola][usuario]) structure[empresa][contrato][escola][usuario] = [];
        
        structure[empresa][contrato][escola][usuario].push({
          uuid: doc.uuid,
          fileName: doc.s3Key.split('/').pop(),
          descricao: doc.descricao,
          tipoArquivo: doc.tipoArquivo,
          tamanhoBytes: doc.tamanhoBytes,
          criadoEm: doc.criadoEm,
        });
      });

      return structure;
    } catch (error) {
      console.error('Erro ao listar estrutura:', error);
      throw new Error('Falha ao listar estrutura de diretórios');
    }
  }
}

export default S3DocumentService;
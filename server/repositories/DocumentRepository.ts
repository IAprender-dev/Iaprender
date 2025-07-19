import { arquivos, documentAnalyses, documentAccessLogs } from '@shared/schema';
import { BaseRepository } from '../models/BaseRepository';
import { InferModel, eq, and, or, sql, desc, asc, like } from 'drizzle-orm';
import { AppErrors } from '../middleware/errorHandler';

type Document = InferModel<typeof arquivos, 'select'>;
type DocumentInsert = InferModel<typeof arquivos, 'insert'>;

export interface DocumentWithPermissions extends Document {
  canEdit: boolean;
  canDelete: boolean;
  uploadedByName?: string;
  empresaNome?: string;
  escolaNome?: string;
}

export interface DocumentListResult {
  data: DocumentWithPermissions[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class DocumentRepository extends BaseRepository<typeof arquivos, DocumentInsert, Document> {
  constructor() {
    super(arquivos, 'arquivos');
  }

  /**
   * Create document record
   */
  public async createDocument(data: {
    uuid: string;
    empresaId: number;
    escolaId?: number;
    usuarioId: number;
    tipoUsuario: string;
    s3Key: string;
    s3Bucket: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    metadata?: any;
    status?: string;
    uploadedAt?: Date;
  }): Promise<Document> {
    return this.create({
      uuid: data.uuid,
      empresaId: data.empresaId,
      escolaId: data.escolaId || null,
      usuarioId: data.usuarioId,
      tipoUsuario: data.tipoUsuario as any,
      s3Key: data.s3Key,
      s3Bucket: data.s3Bucket,
      descricao: data.fileName,
      tipoArquivo: data.fileName.split('.').pop() || 'unknown',
      tamanhoBytes: data.fileSize,
      mimeType: data.mimeType,
      metadata: data.metadata || {},
      status: data.status || 'ativo',
      criadoPor: data.usuarioId,
      criadoEm: data.uploadedAt || new Date()
    });
  }

  /**
   * List documents with permissions
   */
  public async listDocumentsWithPermissions(options: {
    userId: number;
    userType: string;
    empresaId: number;
    escolaId?: number;
    page?: number;
    limit?: number;
    search?: string;
    fileType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<DocumentListResult> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = this.db
      .select({
        arquivo: arquivos,
        uploadedByName: sql<string>`u.nome`,
        empresaNome: sql<string>`e.nome`,
        escolaNome: sql<string>`es.nome`
      })
      .from(arquivos)
      .leftJoin(sql`usuarios u`, sql`u.id = ${arquivos.usuarioId}`)
      .leftJoin(sql`empresas e`, sql`e.id = ${arquivos.empresaId}`)
      .leftJoin(sql`escolas es`, sql`es.id = ${arquivos.escolaId}`)
      .where(and(
        eq(arquivos.status, 'ativo'),
        this.buildPermissionConditions(options)
      ));

    // Apply search filter
    if (options.search) {
      query = query.where(
        or(
          like(arquivos.descricao, `%${options.search}%`),
          like(arquivos.tipoArquivo, `%${options.search}%`)
        )
      );
    }

    // Apply file type filter
    if (options.fileType) {
      query = query.where(eq(arquivos.tipoArquivo, options.fileType));
    }

    // Apply sorting
    const sortColumn = this.getSortColumn(options.sortBy);
    if (options.sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Get total count
    const countQuery = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(arquivos)
      .where(and(
        eq(arquivos.status, 'ativo'),
        this.buildPermissionConditions(options)
      ));

    if (options.search) {
      countQuery.where(
        or(
          like(arquivos.descricao, `%${options.search}%`),
          like(arquivos.tipoArquivo, `%${options.search}%`)
        )
      );
    }

    const [{ count }] = await countQuery;
    const total = Number(count);

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const results = await query;

    const documents: DocumentWithPermissions[] = results.map(row => ({
      ...row.arquivo,
      canEdit: this.canEdit(row.arquivo, options.userId, options.userType),
      canDelete: this.canDelete(row.arquivo, options.userId, options.userType),
      uploadedByName: row.uploadedByName,
      empresaNome: row.empresaNome,
      escolaNome: row.escolaNome
    }));

    return {
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get document with permissions check
   */
  public async getDocumentWithPermissions(
    uuid: string,
    userId: number,
    userType: string
  ): Promise<DocumentWithPermissions | null> {
    const results = await this.db
      .select({
        arquivo: arquivos,
        uploadedByName: sql<string>`u.nome`,
        empresaNome: sql<string>`e.nome`,
        escolaNome: sql<string>`es.nome`
      })
      .from(arquivos)
      .leftJoin(sql`usuarios u`, sql`u.id = ${arquivos.usuarioId}`)
      .leftJoin(sql`empresas e`, sql`e.id = ${arquivos.empresaId}`)
      .leftJoin(sql`escolas es`, sql`es.id = ${arquivos.escolaId}`)
      .where(and(
        eq(arquivos.uuid, uuid),
        eq(arquivos.status, 'ativo')
      ))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const document = results[0].arquivo;
    
    // Check if user has permission to view
    if (!this.hasViewPermission(document, userId, userType)) {
      return null;
    }

    return {
      ...document,
      canEdit: this.canEdit(document, userId, userType),
      canDelete: this.canDelete(document, userId, userType),
      uploadedByName: results[0].uploadedByName,
      empresaNome: results[0].empresaNome,
      escolaNome: results[0].escolaNome
    };
  }

  /**
   * Soft delete document
   */
  public async softDeleteDocument(uuid: string, deletedBy: number): Promise<void> {
    await this.update(uuid, {
      status: 'excluido',
      atualizadoPor: deletedBy,
      atualizadoEm: new Date()
    }, 'uuid');
  }

  /**
   * Log document access
   */
  public async logAccess(data: {
    documentId: string;
    userId: number;
    action: string;
    ipAddress: string | null;
  }): Promise<void> {
    await this.db.insert(documentAccessLogs).values({
      documentId: data.documentId,
      userId: data.userId,
      action: data.action,
      ipAddress: data.ipAddress,
      accessedAt: new Date()
    });
  }

  /**
   * Save document analysis
   */
  public async saveAnalysis(data: {
    documentId: string;
    userId: number;
    analysisType: string;
    result: any;
    model: string;
    tokensUsed: number;
  }): Promise<void> {
    await this.db.insert(documentAnalyses).values({
      documentId: data.documentId,
      userId: data.userId,
      analysisType: data.analysisType,
      result: data.result,
      model: data.model,
      tokensUsed: data.tokensUsed,
      analyzedAt: new Date()
    });
  }

  /**
   * Get document structure
   */
  public async getDocumentStructure(options: {
    userId: number;
    userType: string;
    empresaId: number;
    escolaId?: number;
  }): Promise<any> {
    const documents = await this.listDocumentsWithPermissions({
      ...options,
      limit: 1000 // Get more for structure
    });

    const structure: any = {
      totalDocuments: documents.data.length,
      totalSize: 0,
      byType: {},
      byMonth: {},
      hierarchy: {}
    };

    documents.data.forEach(doc => {
      // Total size
      structure.totalSize += doc.tamanhoBytes;

      // By type
      if (!structure.byType[doc.tipoArquivo]) {
        structure.byType[doc.tipoArquivo] = { count: 0, size: 0 };
      }
      structure.byType[doc.tipoArquivo].count++;
      structure.byType[doc.tipoArquivo].size += doc.tamanhoBytes;

      // By month
      const month = new Date(doc.criadoEm).toISOString().substring(0, 7);
      if (!structure.byMonth[month]) {
        structure.byMonth[month] = { count: 0, size: 0 };
      }
      structure.byMonth[month].count++;
      structure.byMonth[month].size += doc.tamanhoBytes;

      // Hierarchy
      const parts = doc.s3Key.split('/');
      let current = structure.hierarchy;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = index === parts.length - 1 ? [] : {};
        }
        if (index === parts.length - 1) {
          current[part].push({
            uuid: doc.uuid,
            fileName: doc.descricao,
            size: doc.tamanhoBytes,
            uploadedAt: doc.criadoEm
          });
        } else {
          current = current[part];
        }
      });
    });

    return structure;
  }

  /**
   * Get documents by type
   */
  public async getDocumentsByType(
    fileType: string,
    options: any = {}
  ): Promise<Document[]> {
    return this.findAll({ 
      tipoArquivo: fileType,
      status: 'ativo'
    }, options);
  }

  /**
   * Get recent documents
   */
  public async getRecentDocuments(
    limit: number = 10,
    userId?: number
  ): Promise<Document[]> {
    let conditions: any = { status: 'ativo' };
    if (userId) {
      conditions.usuarioId = userId;
    }

    return this.findAll(conditions, {
      limit,
      orderBy: [{ column: 'criadoEm', direction: 'desc' }]
    });
  }

  // Helper methods

  private buildPermissionConditions(options: {
    userId: number;
    userType: string;
    empresaId: number;
    escolaId?: number;
  }): any {
    switch (options.userType) {
      case 'admin':
        return sql`1=1`; // Admin sees all

      case 'gestor':
        return eq(arquivos.empresaId, options.empresaId);

      case 'diretor':
        return and(
          eq(arquivos.empresaId, options.empresaId),
          or(
            eq(arquivos.escolaId, options.escolaId!),
            sql`${arquivos.escolaId} IS NULL`
          )
        );

      case 'professor':
        return and(
          eq(arquivos.empresaId, options.empresaId),
          or(
            eq(arquivos.escolaId, options.escolaId!),
            eq(arquivos.usuarioId, options.userId)
          )
        );

      case 'aluno':
      default:
        return eq(arquivos.usuarioId, options.userId);
    }
  }

  private hasViewPermission(document: Document, userId: number, userType: string): boolean {
    if (userType === 'admin') return true;
    if (document.usuarioId === userId) return true;
    
    if (userType === 'gestor' && document.empresaId) return true;
    if (userType === 'diretor' && document.escolaId) return true;
    if (userType === 'professor' && document.escolaId) return true;
    
    return false;
  }

  private canEdit(document: Document, userId: number, userType: string): boolean {
    if (userType === 'admin') return true;
    if (document.usuarioId === userId) return true;
    
    if (userType === 'gestor' && document.empresaId) return true;
    if (userType === 'diretor' && document.escolaId) return true;
    
    return false;
  }

  private canDelete(document: Document, userId: number, userType: string): boolean {
    return this.canEdit(document, userId, userType);
  }

  private getSortColumn(sortBy?: string): any {
    switch (sortBy) {
      case 'fileName':
        return arquivos.descricao;
      case 'fileSize':
        return arquivos.tamanhoBytes;
      case 'uploadedAt':
      default:
        return arquivos.criadoEm;
    }
  }
}
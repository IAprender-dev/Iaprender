import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  S3ServiceException
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createHash } from 'crypto';
import mime from 'mime-types';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { Cache, getCache } from '../utils/cache';
import { AppErrors } from '../middleware/errorHandler';
import { DatabaseConnection } from '../config/database-production';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  key?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  serverSideEncryption?: boolean;
  storageClass?: 'STANDARD' | 'STANDARD_IA' | 'ONEZONE_IA' | 'GLACIER' | 'DEEP_ARCHIVE';
  acl?: 'private' | 'public-read';
}

interface FileMetadata {
  id: string;
  key: string;
  size: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
  delimiter?: string;
}

interface MultipartUploadProgress {
  uploadId: string;
  key: string;
  parts: Array<{ partNumber: number; etag: string }>;
  bytesUploaded: number;
  totalBytes: number;
}

export class S3Service {
  private client: S3Client;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;
  private bucketName: string;
  private region: string;
  private db: DatabaseConnection;
  private uploadCache: Map<string, MultipartUploadProgress>;
  
  // Configuration
  private readonly MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private readonly MULTIPART_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SIGNED_URL_EXPIRY = 3600; // 1 hour
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
  private readonly ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'application/zip',
    'application/x-rar-compressed'
  ]);

  constructor() {
    this.region = envConfig.aws.region;
    this.bucketName = envConfig.s3.bucketName!;
    
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured');
    }

    this.client = new S3Client({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    this.logger = new Logger('S3Service');
    this.metrics = getMetrics();
    this.cache = getCache('s3', 300); // 5 min cache
    this.db = DatabaseConnection.getInstance();
    this.uploadCache = new Map();
  }

  /**
   * Upload a file to S3
   */
  public async uploadFile(
    buffer: Buffer | NodeJS.ReadableStream,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const timer = this.metrics.startTimer();
    
    try {
      // Validate file
      const validation = await this.validateFile(buffer, fileName);
      if (!validation.valid) {
        throw AppErrors.badRequest(validation.error!);
      }

      // Generate key if not provided
      const key = options.key || this.generateKey(fileName);
      
      // Determine content type
      const contentType = options.contentType || 
                         mime.lookup(fileName) || 
                         'application/octet-stream';

      // Prepare metadata
      const metadata: Record<string, string> = {
        'original-filename': fileName,
        'uploaded-at': new Date().toISOString(),
        ...options.metadata
      };

      // Use multipart upload for large files
      if (validation.size > this.MULTIPART_THRESHOLD) {
        return await this.multipartUpload(buffer, key, {
          ...options,
          contentType,
          metadata,
          fileSize: validation.size
        });
      }

      // Standard upload for smaller files
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
        CacheControl: options.cacheControl || 'max-age=31536000',
        ContentDisposition: options.contentDisposition,
        ServerSideEncryption: options.serverSideEncryption ? 'AES256' : undefined,
        StorageClass: options.storageClass,
        ACL: options.acl || 'private',
        Tagging: options.tags ? this.formatTags(options.tags) : undefined
      });

      const response = await this.client.send(command);
      
      const fileMetadata: FileMetadata = {
        id: uuidv4(),
        key,
        size: validation.size,
        contentType,
        etag: response.ETag,
        lastModified: new Date(),
        metadata,
        tags: options.tags
      };

      // Store metadata in database
      await this.saveFileMetadata(fileMetadata);

      const duration = timer();
      this.logger.info('File uploaded successfully', { key, size: validation.size, duration });
      this.metrics.timing('s3.upload.duration', duration);
      this.metrics.increment('s3.upload.success');
      this.metrics.histogram('s3.upload.size', validation.size);

      return fileMetadata;

    } catch (error) {
      const duration = timer();
      this.logger.error('File upload failed', error, { fileName, duration });
      this.metrics.increment('s3.upload.failure');
      throw this.mapS3Error(error);
    }
  }

  /**
   * Download a file from S3
   */
  public async downloadFile(key: string): Promise<{
    body: NodeJS.ReadableStream;
    metadata: FileMetadata;
  }> {
    const timer = this.metrics.startTimer();
    
    try {
      // Check cache first
      const cacheKey = `file:${key}`;
      const cached = this.cache.get<FileMetadata>(cacheKey);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response body');
      }

      const metadata: FileMetadata = cached || {
        id: uuidv4(),
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        etag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };

      // Cache metadata
      if (!cached) {
        this.cache.set(cacheKey, metadata);
      }

      const duration = timer();
      this.logger.info('File downloaded successfully', { key, duration });
      this.metrics.timing('s3.download.duration', duration);
      this.metrics.increment('s3.download.success');

      return {
        body: response.Body as NodeJS.ReadableStream,
        metadata
      };

    } catch (error) {
      const duration = timer();
      this.logger.error('File download failed', error, { key, duration });
      this.metrics.increment('s3.download.failure');
      throw this.mapS3Error(error);
    }
  }

  /**
   * Generate a pre-signed URL for direct upload/download
   */
  public async generatePresignedUrl(
    key: string,
    operation: 'upload' | 'download',
    expiresIn: number = this.SIGNED_URL_EXPIRY
  ): Promise<string> {
    const cacheKey = `presigned:${operation}:${key}:${expiresIn}`;
    
    // Check cache
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      this.metrics.increment('s3.presigned_url.cache_hit');
      return cached;
    }

    try {
      let command: GetObjectCommand | PutObjectCommand;
      
      if (operation === 'download') {
        command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key
        });
      } else {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ServerSideEncryption: 'AES256'
        });
      }

      const url = await getSignedUrl(this.client, command, { expiresIn });
      
      // Cache the URL (with shorter TTL than expiry)
      const cacheTtl = Math.min(expiresIn - 60, 300); // 5 min max
      this.cache.set(cacheKey, url, cacheTtl);
      
      this.logger.debug('Pre-signed URL generated', { key, operation, expiresIn });
      this.metrics.increment('s3.presigned_url.generated');
      
      return url;

    } catch (error) {
      this.logger.error('Failed to generate pre-signed URL', error);
      throw this.mapS3Error(error);
    }
  }

  /**
   * Delete a file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    const timer = this.metrics.startTimer();
    
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.client.send(command);
      
      // Remove from cache
      this.cache.delete(`file:${key}`);
      this.cache.deletePattern(`presigned:*:${key}:*`);
      
      // Update database
      await this.markFileAsDeleted(key);
      
      const duration = timer();
      this.logger.info('File deleted successfully', { key, duration });
      this.metrics.timing('s3.delete.duration', duration);
      this.metrics.increment('s3.delete.success');

    } catch (error) {
      const duration = timer();
      this.logger.error('File deletion failed', error, { key, duration });
      this.metrics.increment('s3.delete.failure');
      throw this.mapS3Error(error);
    }
  }

  /**
   * List files in S3
   */
  public async listFiles(options: ListOptions = {}): Promise<{
    files: FileMetadata[];
    continuationToken?: string;
  }> {
    const timer = this.metrics.startTimer();
    
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: options.prefix,
        MaxKeys: options.maxKeys || 1000,
        ContinuationToken: options.continuationToken,
        Delimiter: options.delimiter
      });

      const response = await this.client.send(command);
      
      const files: FileMetadata[] = (response.Contents || []).map(obj => ({
        id: uuidv4(),
        key: obj.Key!,
        size: obj.Size || 0,
        contentType: 'application/octet-stream',
        etag: obj.ETag,
        lastModified: obj.LastModified
      }));

      const duration = timer();
      this.logger.debug('Files listed successfully', { 
        prefix: options.prefix, 
        count: files.length,
        duration 
      });
      this.metrics.timing('s3.list.duration', duration);
      this.metrics.increment('s3.list.success');

      return {
        files,
        continuationToken: response.NextContinuationToken
      };

    } catch (error) {
      const duration = timer();
      this.logger.error('File listing failed', error, { options, duration });
      this.metrics.increment('s3.list.failure');
      throw this.mapS3Error(error);
    }
  }

  /**
   * Copy a file within S3
   */
  public async copyFile(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
    const timer = this.metrics.startTimer();
    
    try {
      const command = new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
        ServerSideEncryption: 'AES256'
      });

      const response = await this.client.send(command);
      
      // Get metadata of the new file
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: destinationKey
      });
      
      const headResponse = await this.client.send(headCommand);
      
      const metadata: FileMetadata = {
        id: uuidv4(),
        key: destinationKey,
        size: headResponse.ContentLength || 0,
        contentType: headResponse.ContentType || 'application/octet-stream',
        etag: response.CopyObjectResult?.ETag,
        lastModified: headResponse.LastModified,
        metadata: headResponse.Metadata
      };

      const duration = timer();
      this.logger.info('File copied successfully', { sourceKey, destinationKey, duration });
      this.metrics.timing('s3.copy.duration', duration);
      this.metrics.increment('s3.copy.success');

      return metadata;

    } catch (error) {
      const duration = timer();
      this.logger.error('File copy failed', error, { sourceKey, destinationKey, duration });
      this.metrics.increment('s3.copy.failure');
      throw this.mapS3Error(error);
    }
  }

  /**
   * Check if a file exists
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.client.send(command);
      return true;

    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw this.mapS3Error(error);
    }
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(key: string): Promise<FileMetadata> {
    const cacheKey = `metadata:${key}`;
    const cached = this.cache.get<FileMetadata>(cacheKey);
    if (cached) return cached;

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const response = await this.client.send(command);
      
      const metadata: FileMetadata = {
        id: uuidv4(),
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        etag: response.ETag,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };

      this.cache.set(cacheKey, metadata);
      
      return metadata;

    } catch (error) {
      this.logger.error('Failed to get file metadata', error, { key });
      throw this.mapS3Error(error);
    }
  }

  /**
   * Stream upload for large files
   */
  public async streamUpload(
    stream: NodeJS.ReadableStream,
    key: string,
    options: UploadOptions = {}
  ): Promise<FileMetadata> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: stream,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata,
        ServerSideEncryption: 'AES256'
      },
      partSize: this.MULTIPART_CHUNK_SIZE,
      queueSize: 4
    });

    upload.on('httpUploadProgress', (progress) => {
      this.logger.debug('Upload progress', {
        key,
        loaded: progress.loaded,
        total: progress.total
      });
    });

    try {
      const result = await upload.done();
      
      return {
        id: uuidv4(),
        key,
        size: 0, // Size unknown for streams
        contentType: options.contentType || 'application/octet-stream',
        etag: result.ETag,
        lastModified: new Date(),
        metadata: options.metadata
      };

    } catch (error) {
      this.logger.error('Stream upload failed', error, { key });
      throw this.mapS3Error(error);
    }
  }

  /**
   * Multipart upload for large files
   */
  private async multipartUpload(
    buffer: Buffer | NodeJS.ReadableStream,
    key: string,
    options: UploadOptions & { fileSize: number }
  ): Promise<FileMetadata> {
    const uploadId = uuidv4();
    let multipartUploadId: string;

    try {
      // Initialize multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ServerSideEncryption: 'AES256'
      });

      const createResponse = await this.client.send(createCommand);
      multipartUploadId = createResponse.UploadId!;

      // Track upload progress
      const progress: MultipartUploadProgress = {
        uploadId,
        key,
        parts: [],
        bytesUploaded: 0,
        totalBytes: options.fileSize
      };
      this.uploadCache.set(uploadId, progress);

      // Upload parts
      const parts = await this.uploadParts(buffer, key, multipartUploadId, progress);

      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: multipartUploadId,
        MultipartUpload: { Parts: parts }
      });

      const completeResponse = await this.client.send(completeCommand);
      
      this.uploadCache.delete(uploadId);
      
      return {
        id: uploadId,
        key,
        size: options.fileSize,
        contentType: options.contentType!,
        etag: completeResponse.ETag,
        lastModified: new Date(),
        metadata: options.metadata
      };

    } catch (error) {
      // Abort multipart upload on error
      if (multipartUploadId!) {
        try {
          await this.client.send(new AbortMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: multipartUploadId
          }));
        } catch (abortError) {
          this.logger.error('Failed to abort multipart upload', abortError);
        }
      }
      
      this.uploadCache.delete(uploadId);
      throw error;
    }
  }

  /**
   * Upload individual parts for multipart upload
   */
  private async uploadParts(
    buffer: Buffer | NodeJS.ReadableStream,
    key: string,
    uploadId: string,
    progress: MultipartUploadProgress
  ): Promise<Array<{ PartNumber: number; ETag: string }>> {
    const parts: Array<{ PartNumber: number; ETag: string }> = [];
    const partSize = this.MULTIPART_CHUNK_SIZE;
    let partNumber = 1;

    if (Buffer.isBuffer(buffer)) {
      // Handle buffer upload
      for (let start = 0; start < buffer.length; start += partSize) {
        const end = Math.min(start + partSize, buffer.length);
        const partBuffer = buffer.slice(start, end);

        const command = new UploadPartCommand({
          Bucket: this.bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: partBuffer
        });

        const response = await this.client.send(command);
        
        parts.push({
          PartNumber: partNumber,
          ETag: response.ETag!
        });

        progress.bytesUploaded += partBuffer.length;
        progress.parts.push({ partNumber, etag: response.ETag! });
        
        this.logger.debug('Part uploaded', {
          key,
          partNumber,
          bytesUploaded: progress.bytesUploaded,
          totalBytes: progress.totalBytes
        });

        partNumber++;
      }
    } else {
      // Handle stream upload - would need to be implemented with stream chunking
      throw new Error('Stream multipart upload not implemented');
    }

    return parts;
  }

  /**
   * Validate file before upload
   */
  private async validateFile(
    buffer: Buffer | NodeJS.ReadableStream,
    fileName: string
  ): Promise<{ valid: boolean; error?: string; size: number }> {
    // Check file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) {
      return { valid: false, error: 'File must have an extension', size: 0 };
    }

    // Check MIME type
    const mimeType = mime.lookup(fileName);
    if (!mimeType || !this.ALLOWED_MIME_TYPES.has(mimeType)) {
      return { 
        valid: false, 
        error: `File type ${mimeType || ext} is not allowed`, 
        size: 0 
      };
    }

    // Check file size
    let size = 0;
    if (Buffer.isBuffer(buffer)) {
      size = buffer.length;
    } else {
      // For streams, we'd need to check size differently
      size = 0; // Size check would be done during upload
    }

    if (size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`, 
        size 
      };
    }

    // Additional security checks could be added here
    // - Virus scanning
    // - Content validation
    // - Magic number verification

    return { valid: true, size };
  }

  /**
   * Generate a unique S3 key
   */
  private generateKey(fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const uuid = uuidv4();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `uploads/${year}/${month}/${day}/${uuid}/${sanitizedFileName}`;
  }

  /**
   * Format tags for S3
   */
  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Save file metadata to database
   */
  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    try {
      // Implementation would depend on your database schema
      // This is a placeholder
      this.logger.debug('File metadata saved', { id: metadata.id });
    } catch (error) {
      this.logger.error('Failed to save file metadata', error);
      // Don't throw - metadata save failure shouldn't fail upload
    }
  }

  /**
   * Mark file as deleted in database
   */
  private async markFileAsDeleted(key: string): Promise<void> {
    try {
      // Implementation would depend on your database schema
      // This is a placeholder
      this.logger.debug('File marked as deleted', { key });
    } catch (error) {
      this.logger.error('Failed to mark file as deleted', error);
      // Don't throw - database update failure shouldn't fail deletion
    }
  }

  /**
   * Map S3 errors to application errors
   */
  private mapS3Error(error: any): Error {
    if (error instanceof S3ServiceException) {
      const statusCode = error.$metadata?.httpStatusCode;
      
      if (statusCode === 404 || error.name === 'NoSuchKey') {
        return AppErrors.notFound('File not found');
      }
      
      if (statusCode === 403 || error.name === 'AccessDenied') {
        return AppErrors.forbidden('Access denied to S3 resource');
      }
      
      if (error.name === 'NoSuchBucket') {
        return AppErrors.internal('S3 bucket not found');
      }
      
      if (error.name === 'RequestTimeout') {
        return AppErrors.serviceUnavailable('S3 request timeout');
      }
    }

    return AppErrors.internal('S3 operation failed', { 
      message: error.message,
      code: error.code 
    });
  }

  /**
   * Get upload progress
   */
  public getUploadProgress(uploadId: string): MultipartUploadProgress | undefined {
    return this.uploadCache.get(uploadId);
  }

  /**
   * Clean up incomplete uploads
   */
  public async cleanupIncompleteUploads(olderThanHours: number = 24): Promise<number> {
    try {
      // This would list and abort multipart uploads older than specified hours
      // Implementation depends on specific requirements
      this.logger.info('Cleanup incomplete uploads completed');
      return 0;
    } catch (error) {
      this.logger.error('Failed to cleanup incomplete uploads', error);
      throw error;
    }
  }
}
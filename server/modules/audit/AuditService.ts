import { DatabaseConnection } from '../../config/database-production';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { sql } from 'drizzle-orm';

interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

interface AuditSearchParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  private db: DatabaseConnection;
  private logger: Logger;
  private metrics: MetricsCollector;
  private tableName: string = 'audit_logs';

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.logger = new Logger('AuditService');
    this.metrics = getMetrics();
    this.ensureTable();
  }

  /**
   * Create audit log entry
   */
  public async log(entry: AuditLogEntry): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const query = sql`
        INSERT INTO ${sql.identifier(this.tableName)} (
          user_id,
          action,
          resource,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at
        ) VALUES (
          ${entry.userId},
          ${entry.action},
          ${entry.resource},
          ${entry.resourceId || null},
          ${JSON.stringify(entry.details || {})},
          ${entry.ipAddress || null},
          ${entry.userAgent || null},
          ${entry.timestamp || new Date()}
        )
      `;

      await this.db.getDb()?.execute(query);

      const duration = timer();
      this.metrics.timing('audit.log.duration', duration);
      this.metrics.increment('audit.log.success');

      this.logger.debug('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to create audit log', error);
      this.metrics.increment('audit.log.failure');
      // Don't throw - audit failures shouldn't break the application
    }
  }

  /**
   * Search audit logs
   */
  public async search(params: AuditSearchParams): Promise<{
    logs: any[];
    total: number;
  }> {
    const timer = this.metrics.startTimer();

    try {
      const {
        userId,
        action,
        resource,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = params;

      // Build WHERE conditions
      const conditions: string[] = ['1=1'];
      const values: any[] = [];
      let paramIndex = 1;

      if (userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(userId);
      }

      if (action) {
        conditions.push(`action = $${paramIndex++}`);
        values.push(action);
      }

      if (resource) {
        conditions.push(`resource = $${paramIndex++}`);
        values.push(resource);
      }

      if (startDate) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(startDate);
      }

      if (endDate) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(endDate);
      }

      const whereClause = conditions.join(' AND ');

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${this.tableName}
        WHERE ${whereClause}
      `;

      const countResult = await this.db.getDb()?.execute(sql.raw(countQuery, values));
      const total = parseInt(countResult?.rows[0]?.total || '0');

      // Get logs
      const logsQuery = `
        SELECT 
          id,
          user_id,
          action,
          resource,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at
        FROM ${this.tableName}
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const logsResult = await this.db.getDb()?.execute(sql.raw(logsQuery, values));
      const logs = logsResult?.rows || [];

      const duration = timer();
      this.metrics.timing('audit.search.duration', duration);

      return { logs, total };

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to search audit logs', error);
      throw error;
    }
  }

  /**
   * Get user activity summary
   */
  public async getUserActivity(
    userId: string,
    days: number = 30
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByResource: Record<string, number>;
    recentActions: any[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total actions
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM ${this.tableName}
        WHERE user_id = $1 AND created_at >= $2
      `;
      const totalResult = await this.db.getDb()?.execute(
        sql.raw(totalQuery, [userId, startDate])
      );
      const totalActions = parseInt(totalResult?.rows[0]?.total || '0');

      // Get actions by type
      const typeQuery = `
        SELECT action, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1 AND created_at >= $2
        GROUP BY action
        ORDER BY count DESC
      `;
      const typeResult = await this.db.getDb()?.execute(
        sql.raw(typeQuery, [userId, startDate])
      );
      const actionsByType = Object.fromEntries(
        (typeResult?.rows || []).map(row => [row.action, parseInt(row.count)])
      );

      // Get actions by resource
      const resourceQuery = `
        SELECT resource, COUNT(*) as count
        FROM ${this.tableName}
        WHERE user_id = $1 AND created_at >= $2
        GROUP BY resource
        ORDER BY count DESC
      `;
      const resourceResult = await this.db.getDb()?.execute(
        sql.raw(resourceQuery, [userId, startDate])
      );
      const actionsByResource = Object.fromEntries(
        (resourceResult?.rows || []).map(row => [row.resource, parseInt(row.count)])
      );

      // Get recent actions
      const recentQuery = `
        SELECT *
        FROM ${this.tableName}
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const recentResult = await this.db.getDb()?.execute(
        sql.raw(recentQuery, [userId])
      );
      const recentActions = recentResult?.rows || [];

      return {
        totalActions,
        actionsByType,
        actionsByResource,
        recentActions
      };

    } catch (error) {
      this.logger.error('Failed to get user activity', error);
      throw error;
    }
  }

  /**
   * Get security events
   */
  public async getSecurityEvents(
    days: number = 7
  ): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const securityActions = [
        'USER_LOGIN',
        'USER_LOGOUT',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET',
        'MFA_ENABLED',
        'MFA_DISABLED',
        'USER_LOCKED',
        'USER_UNLOCKED',
        'PERMISSION_CHANGED',
        'SUSPICIOUS_ACTIVITY'
      ];

      const query = `
        SELECT *
        FROM ${this.tableName}
        WHERE action IN (${securityActions.map((_, i) => `$${i + 2}`).join(',')})
          AND created_at >= $1
        ORDER BY created_at DESC
        LIMIT 1000
      `;

      const result = await this.db.getDb()?.execute(
        sql.raw(query, [startDate, ...securityActions])
      );

      return result?.rows || [];

    } catch (error) {
      this.logger.error('Failed to get security events', error);
      throw error;
    }
  }

  /**
   * Clean old audit logs
   */
  public async cleanOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const query = `
        DELETE FROM ${this.tableName}
        WHERE created_at < $1
      `;

      const result = await this.db.getDb()?.execute(
        sql.raw(query, [cutoffDate])
      );

      const deleted = result?.rowCount || 0;

      this.logger.info('Cleaned old audit logs', {
        deleted,
        cutoffDate
      });

      return deleted;

    } catch (error) {
      this.logger.error('Failed to clean old logs', error);
      throw error;
    }
  }

  /**
   * Ensure audit table exists
   */
  private async ensureTable(): Promise<void> {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          action VARCHAR(100) NOT NULL,
          resource VARCHAR(100) NOT NULL,
          resource_id VARCHAR(255),
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_resource (resource),
          INDEX idx_created_at (created_at)
        )
      `;

      await this.db.getDb()?.execute(sql.raw(createTableQuery));

    } catch (error) {
      this.logger.error('Failed to create audit table', error);
      // Don't throw - table might already exist
    }
  }

  /**
   * Common audit actions
   */
  public static readonly Actions = {
    // Authentication
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
    MFA_ENABLED: 'MFA_ENABLED',
    MFA_DISABLED: 'MFA_DISABLED',
    MFA_VERIFIED: 'MFA_VERIFIED',
    OAUTH_LOGIN: 'OAUTH_LOGIN',

    // User management
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_ACTIVATED: 'USER_ACTIVATED',
    USER_DEACTIVATED: 'USER_DEACTIVATED',
    USER_LOCKED: 'USER_LOCKED',
    USER_UNLOCKED: 'USER_UNLOCKED',

    // Permissions
    PERMISSION_GRANTED: 'PERMISSION_GRANTED',
    PERMISSION_REVOKED: 'PERMISSION_REVOKED',
    ROLE_CHANGED: 'ROLE_CHANGED',

    // Data access
    DATA_ACCESSED: 'DATA_ACCESSED',
    DATA_EXPORTED: 'DATA_EXPORTED',
    DATA_IMPORTED: 'DATA_IMPORTED',

    // File operations
    FILE_UPLOADED: 'FILE_UPLOADED',
    FILE_DOWNLOADED: 'FILE_DOWNLOADED',
    FILE_DELETED: 'FILE_DELETED',

    // System
    SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
    BACKUP_CREATED: 'BACKUP_CREATED',
    BACKUP_RESTORED: 'BACKUP_RESTORED'
  };

  /**
   * Common resources
   */
  public static readonly Resources = {
    AUTH: 'auth',
    USERS: 'users',
    COMPANIES: 'companies',
    SCHOOLS: 'schools',
    DOCUMENTS: 'documents',
    FILES: 'files',
    REPORTS: 'reports',
    SYSTEM: 'system'
  };
}
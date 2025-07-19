import { usuarios, escolas, empresas } from '@shared/schema';
import { BaseRepository } from '../models/BaseRepository';
import { InferModel, eq, and, or, sql, desc, asc, gte, lte, count } from 'drizzle-orm';
import { AppErrors } from '../middleware/errorHandler';

export interface DashboardMetricsOptions {
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  timeRange: string;
}

export interface CoreMetrics {
  current: {
    users: number;
    schools: number;
    students: number;
    teachers: number;
    activities: number;
    documents: number;
  };
  previous: {
    users: number;
    schools: number;
    students: number;
    teachers: number;
    activities: number;
    documents: number;
  };
}

export class DashboardRepository extends BaseRepository<any, any, any> {
  constructor() {
    super(usuarios, 'dashboard');
  }

  /**
   * Get core dashboard metrics
   */
  public async getCoreMetrics(options: DashboardMetricsOptions): Promise<CoreMetrics> {
    try {
      const timeRangeConfig = this.getTimeRangeConfig(options.timeRange);
      const whereClause = this.buildPermissionFilter(options);

      // Current period metrics
      const currentMetrics = await this.getMetricsForPeriod(
        whereClause,
        timeRangeConfig.current.start,
        timeRangeConfig.current.end
      );

      // Previous period metrics for comparison
      const previousMetrics = await this.getMetricsForPeriod(
        whereClause,
        timeRangeConfig.previous.start,
        timeRangeConfig.previous.end
      );

      return {
        current: currentMetrics,
        previous: previousMetrics
      };

    } catch (error) {
      this.logger.error('Get core metrics failed', error);
      throw AppErrors.internal('Failed to retrieve core metrics');
    }
  }

  /**
   * Get activity trends
   */
  public async getActivityTrends(options: DashboardMetricsOptions): Promise<any> {
    try {
      const timeRangeConfig = this.getTimeRangeConfig(options.timeRange);
      const whereClause = this.buildPermissionFilter(options);

      const query = sql`
        WITH date_series AS (
          SELECT generate_series(
            ${timeRangeConfig.current.start}::timestamp,
            ${timeRangeConfig.current.end}::timestamp,
            '1 day'::interval
          )::date as date
        ),
        daily_activities AS (
          SELECT 
            DATE(created_at) as activity_date,
            COUNT(*) as activities,
            COUNT(DISTINCT user_id) as active_users
          FROM user_activities 
          WHERE created_at >= ${timeRangeConfig.current.start}
            AND created_at <= ${timeRangeConfig.current.end}
            ${whereClause}
          GROUP BY DATE(created_at)
        )
        SELECT 
          ds.date,
          COALESCE(da.activities, 0) as activities,
          COALESCE(da.active_users, 0) as active_users
        FROM date_series ds
        LEFT JOIN daily_activities da ON ds.date = da.activity_date
        ORDER BY ds.date
      `;

      const trends = await this.raw(query);
      
      return {
        daily: trends,
        summary: {
          totalActivities: trends.reduce((sum: number, day: any) => sum + day.activities, 0),
          avgDailyUsers: Math.round(
            trends.reduce((sum: number, day: any) => sum + day.active_users, 0) / trends.length
          ),
          peakDay: trends.reduce((max: any, day: any) => 
            day.activities > max.activities ? day : max, trends[0]
          )
        }
      };

    } catch (error) {
      this.logger.error('Get activity trends failed', error);
      throw AppErrors.internal('Failed to retrieve activity trends');
    }
  }

  /**
   * Get performance indicators
   */
  public async getPerformanceIndicators(options: DashboardMetricsOptions): Promise<any> {
    try {
      const timeRangeConfig = this.getTimeRangeConfig(options.timeRange);
      
      // Academic performance
      const academicQuery = sql`
        SELECT 
          AVG(score) as avg_score,
          COUNT(*) as total_assessments,
          COUNT(DISTINCT student_id) as students_assessed
        FROM assessments 
        WHERE created_at >= ${timeRangeConfig.current.start}
          AND created_at <= ${timeRangeConfig.current.end}
          ${this.buildPermissionFilter(options)}
      `;

      // AI usage performance
      const aiUsageQuery = sql`
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          SUM(tokens_used) as total_tokens,
          AVG(satisfaction_score) as avg_satisfaction
        FROM ai_usage_logs
        WHERE created_at >= ${timeRangeConfig.current.start}
          AND created_at <= ${timeRangeConfig.current.end}
          ${this.buildPermissionFilter(options)}
      `;

      // System performance
      const systemQuery = sql`
        SELECT 
          AVG(response_time) as avg_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
          COUNT(*) as total_requests
        FROM request_logs
        WHERE created_at >= ${timeRangeConfig.current.start}
          AND created_at <= ${timeRangeConfig.current.end}
      `;

      const [academic, aiUsage, system] = await Promise.all([
        this.raw(academicQuery),
        this.raw(aiUsageQuery),
        this.raw(systemQuery)
      ]);

      return {
        academic: academic[0] || {},
        aiUsage: aiUsage[0] || {},
        system: {
          ...system[0],
          errorRate: system[0]?.total_requests ? 
            (system[0].error_count / system[0].total_requests) * 100 : 0
        }
      };

    } catch (error) {
      this.logger.error('Get performance indicators failed', error);
      throw AppErrors.internal('Failed to retrieve performance indicators');
    }
  }

  /**
   * Get recent activities
   */
  public async getRecentActivities(options: DashboardMetricsOptions): Promise<any> {
    try {
      const whereClause = this.buildPermissionFilter(options);
      
      const query = sql`
        SELECT 
          ua.id,
          ua.activity_type,
          ua.description,
          ua.created_at,
          u.nome as user_name,
          u.tipo_usuario as user_type,
          ua.metadata
        FROM user_activities ua
        JOIN usuarios u ON ua.user_id = u.id
        WHERE ua.created_at >= NOW() - INTERVAL '24 hours'
          ${whereClause}
        ORDER BY ua.created_at DESC
        LIMIT 20
      `;

      const activities = await this.raw(query);
      
      return {
        activities: activities.map((activity: any) => ({
          id: activity.id,
          type: activity.activity_type,
          description: activity.description,
          timestamp: activity.created_at,
          user: {
            name: activity.user_name,
            type: activity.user_type
          },
          metadata: activity.metadata
        })),
        total: activities.length
      };

    } catch (error) {
      this.logger.error('Get recent activities failed', error);
      throw AppErrors.internal('Failed to retrieve recent activities');
    }
  }

  /**
   * Get comparisons with previous periods
   */
  public async getComparisons(options: DashboardMetricsOptions): Promise<any> {
    try {
      const coreMetrics = await this.getCoreMetrics(options);
      
      return {
        userGrowth: this.calculateGrowthRate(
          coreMetrics.current.users, 
          coreMetrics.previous.users
        ),
        activityGrowth: this.calculateGrowthRate(
          coreMetrics.current.activities, 
          coreMetrics.previous.activities
        ),
        schoolGrowth: this.calculateGrowthRate(
          coreMetrics.current.schools, 
          coreMetrics.previous.schools
        ),
        trends: {
          users: coreMetrics.current.users > coreMetrics.previous.users ? 'up' : 'down',
          activities: coreMetrics.current.activities > coreMetrics.previous.activities ? 'up' : 'down',
          schools: coreMetrics.current.schools > coreMetrics.previous.schools ? 'up' : 'down'
        }
      };

    } catch (error) {
      this.logger.error('Get comparisons failed', error);
      throw AppErrors.internal('Failed to retrieve comparisons');
    }
  }

  /**
   * Get widgets configuration
   */
  public async getWidgetsConfig(userId: number, userType: string): Promise<any> {
    try {
      const query = sql`
        SELECT config 
        FROM dashboard_widgets_config 
        WHERE user_id = ${userId}
      `;

      const result = await this.raw(query);
      return result[0]?.config || null;

    } catch (error) {
      this.logger.error('Get widgets config failed', error);
      throw AppErrors.internal('Failed to retrieve widgets configuration');
    }
  }

  /**
   * Update widgets configuration
   */
  public async updateWidgetsConfig(userId: number, config: any): Promise<any> {
    try {
      const query = sql`
        INSERT INTO dashboard_widgets_config (user_id, config, updated_at)
        VALUES (${userId}, ${JSON.stringify(config)}, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          config = ${JSON.stringify(config)},
          updated_at = NOW()
        RETURNING config
      `;

      const result = await this.raw(query);
      return result[0]?.config;

    } catch (error) {
      this.logger.error('Update widgets config failed', error);
      throw AppErrors.internal('Failed to update widgets configuration');
    }
  }

  /**
   * Get user alerts
   */
  public async getAlerts(options: {
    userId: number;
    userType: string;
    empresaId: number;
    limit: number;
  }): Promise<any> {
    try {
      const whereClause = this.buildPermissionFilter(options as any);
      
      const query = sql`
        SELECT 
          id,
          alert_type,
          title,
          message,
          severity,
          created_at,
          read_at,
          metadata
        FROM user_alerts
        WHERE user_id = ${options.userId}
          OR (alert_type = 'system' AND severity IN ('high', 'critical'))
          ${whereClause}
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
        LIMIT ${options.limit}
      `;

      const alerts = await this.raw(query);
      
      return alerts.map((alert: any) => ({
        id: alert.id,
        type: alert.alert_type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.created_at,
        isRead: !!alert.read_at,
        metadata: alert.metadata
      }));

    } catch (error) {
      this.logger.error('Get alerts failed', error);
      throw AppErrors.internal('Failed to retrieve alerts');
    }
  }

  /**
   * Get system alerts (admin only)
   */
  public async getSystemAlerts(): Promise<any[]> {
    try {
      const query = sql`
        SELECT 
          alert_type,
          title,
          message,
          severity,
          created_at,
          metadata
        FROM system_alerts
        WHERE created_at >= NOW() - INTERVAL '24 hours'
          AND severity IN ('high', 'critical')
        ORDER BY 
          CASE severity 
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
          END,
          created_at DESC
        LIMIT 10
      `;

      const alerts = await this.raw(query);
      
      return alerts.map((alert: any) => ({
        type: alert.alert_type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.created_at,
        metadata: alert.metadata
      }));

    } catch (error) {
      this.logger.error('Get system alerts failed', error);
      return [];
    }
  }

  /**
   * Check database health
   */
  public async checkDatabaseHealth(): Promise<any> {
    try {
      const start = Date.now();
      
      // Test query
      await this.raw(sql`SELECT 1 as health_check`);
      
      const responseTime = Date.now() - start;
      
      // Get connection pool stats
      const connectionQuery = sql`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;
      
      const connectionStats = await this.raw(connectionQuery);
      
      return {
        status: 'healthy',
        responseTime,
        connections: connectionStats[0] || { total_connections: 0, active_connections: 0 }
      };

    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get export data
   */
  public async getExportData(options: {
    userId: number;
    userType: string;
    sections: string[];
    timeRange: string;
  }): Promise<any> {
    try {
      const data: any = {};
      
      for (const section of options.sections) {
        switch (section) {
          case 'overview':
            data.overview = await this.getCoreMetrics(options as any);
            break;
          case 'activity':
            data.activity = await this.getActivityTrends(options as any);
            break;
          case 'performance':
            data.performance = await this.getPerformanceIndicators(options as any);
            break;
          // Add more sections as needed
        }
      }
      
      return data;

    } catch (error) {
      this.logger.error('Get export data failed', error);
      throw AppErrors.internal('Failed to retrieve export data');
    }
  }

  // Helper methods

  private async getMetricsForPeriod(
    whereClause: any, 
    startDate: string, 
    endDate: string
  ): Promise<any> {
    const queries = {
      users: sql`
        SELECT COUNT(*) as count 
        FROM usuarios 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `,
      schools: sql`
        SELECT COUNT(*) as count 
        FROM escolas 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `,
      students: sql`
        SELECT COUNT(*) as count 
        FROM alunos 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `,
      teachers: sql`
        SELECT COUNT(*) as count 
        FROM professores 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `,
      activities: sql`
        SELECT COUNT(*) as count 
        FROM user_activities 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `,
      documents: sql`
        SELECT COUNT(*) as count 
        FROM arquivos 
        WHERE created_at >= ${startDate} 
          AND created_at <= ${endDate}
          ${whereClause}
      `
    };

    const results = await Promise.all([
      this.raw(queries.users).catch(() => [{ count: 0 }]),
      this.raw(queries.schools).catch(() => [{ count: 0 }]),
      this.raw(queries.students).catch(() => [{ count: 0 }]),
      this.raw(queries.teachers).catch(() => [{ count: 0 }]),
      this.raw(queries.activities).catch(() => [{ count: 0 }]),
      this.raw(queries.documents).catch(() => [{ count: 0 }])
    ]);

    return {
      users: parseInt(results[0][0]?.count || 0),
      schools: parseInt(results[1][0]?.count || 0),
      students: parseInt(results[2][0]?.count || 0),
      teachers: parseInt(results[3][0]?.count || 0),
      activities: parseInt(results[4][0]?.count || 0),
      documents: parseInt(results[5][0]?.count || 0)
    };
  }

  private getTimeRangeConfig(timeRange: string): any {
    const now = new Date();
    const configs: Record<string, any> = {
      '1h': {
        current: {
          start: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        },
        previous: {
          start: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          end: new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        }
      },
      '24h': {
        current: {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        },
        previous: {
          start: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        }
      },
      '7d': {
        current: {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        },
        previous: {
          start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
      '30d': {
        current: {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        },
        previous: {
          start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    };

    return configs[timeRange] || configs['30d'];
  }

  private buildPermissionFilter(options: DashboardMetricsOptions): any {
    switch (options.userType) {
      case 'admin':
        return sql``; // Admin sees all
      case 'gestor':
        return sql`AND empresa_id = ${options.empresaId}`;
      case 'diretor':
        return sql`AND escola_id = ${options.escolaId}`;
      case 'professor':
        return sql`AND (escola_id = ${options.escolaId} OR user_id = ${options.userId})`;
      case 'aluno':
      default:
        return sql`AND user_id = ${options.userId}`;
    }
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
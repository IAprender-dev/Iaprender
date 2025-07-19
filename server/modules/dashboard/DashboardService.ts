import { DashboardRepository } from '../../repositories/DashboardRepository';
import { AnalyticsRepository } from '../../repositories/AnalyticsRepository';
import { Logger } from '../../utils/logger';
import { CacheService } from '../../services/CacheService';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';

export interface DashboardMetricsOptions {
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  timeRange: string;
  includeComparisons?: boolean;
}

export interface PerformanceAnalyticsOptions {
  timeRange: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
  metrics: string[];
}

export interface UserActivityOptions {
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  timeRange: string;
  groupBy: 'hour' | 'day' | 'week';
}

export interface AcademicAnalyticsOptions {
  userId: number;
  userType: string;
  empresaId: number;
  escolaId?: number;
  timeRange: string;
  subjects?: string[];
  grades?: string[];
}

export interface AIUsageAnalyticsOptions {
  userId: number;
  userType: string;
  empresaId: number;
  timeRange: string;
  models?: string[];
}

export interface ReportConfig {
  type: 'academic' | 'performance' | 'usage' | 'financial';
  timeRange: string;
  sections: string[];
  format: 'pdf' | 'excel' | 'csv';
  filters: Record<string, any>;
}

export class DashboardService {
  private dashboardRepository: DashboardRepository;
  private analyticsRepository: AnalyticsRepository;
  private cache: CacheService;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.dashboardRepository = new DashboardRepository();
    this.analyticsRepository = new AnalyticsRepository();
    this.cache = new CacheService();
    this.logger = new Logger('DashboardService');
    this.metrics = getMetrics();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  public async getDashboardMetrics(options: DashboardMetricsOptions): Promise<any> {
    try {
      const timer = this.metrics.startTimer();

      // Get core metrics based on user type
      const coreMetrics = await this.getCoreMetrics(options);
      
      // Get activity trends
      const activityTrends = await this.getActivityTrends(options);
      
      // Get performance indicators
      const performanceIndicators = await this.getPerformanceIndicators(options);
      
      // Get recent activities
      const recentActivities = await this.getRecentActivities(options);

      // Get comparisons if requested
      let comparisons = null;
      if (options.includeComparisons) {
        comparisons = await this.getComparisons(options);
      }

      const duration = timer();
      this.metrics.timing('dashboard.metrics.processing', duration);

      return {
        overview: coreMetrics,
        trends: activityTrends,
        performance: performanceIndicators,
        recentActivities,
        comparisons,
        metadata: {
          userType: options.userType,
          timeRange: options.timeRange,
          generatedAt: new Date().toISOString(),
          processingTime: duration
        }
      };

    } catch (error) {
      this.logger.error('Get dashboard metrics failed', error);
      throw AppErrors.internal('Failed to retrieve dashboard metrics');
    }
  }

  /**
   * Get performance analytics
   */
  public async getPerformanceAnalytics(options: PerformanceAnalyticsOptions): Promise<any> {
    try {
      const systemMetrics = await this.analyticsRepository.getSystemMetrics(options);
      const endpointMetrics = await this.analyticsRepository.getEndpointMetrics(options);
      const errorAnalytics = await this.analyticsRepository.getErrorAnalytics(options);
      const resourceUsage = await this.analyticsRepository.getResourceUsage(options);

      return {
        system: systemMetrics,
        endpoints: endpointMetrics,
        errors: errorAnalytics,
        resources: resourceUsage,
        summary: {
          avgResponseTime: systemMetrics.avgResponseTime,
          errorRate: errorAnalytics.rate,
          throughput: systemMetrics.requestsPerSecond,
          availability: systemMetrics.uptime
        }
      };

    } catch (error) {
      this.logger.error('Get performance analytics failed', error);
      throw AppErrors.internal('Failed to retrieve performance analytics');
    }
  }

  /**
   * Get user activity analytics
   */
  public async getUserActivityAnalytics(options: UserActivityOptions): Promise<any> {
    try {
      const activityData = await this.analyticsRepository.getUserActivity(options);
      const sessionData = await this.analyticsRepository.getSessionAnalytics(options);
      const engagementMetrics = await this.analyticsRepository.getEngagementMetrics(options);

      return {
        activity: activityData,
        sessions: sessionData,
        engagement: engagementMetrics,
        insights: this.generateActivityInsights(activityData, engagementMetrics)
      };

    } catch (error) {
      this.logger.error('Get user activity analytics failed', error);
      throw AppErrors.internal('Failed to retrieve user activity analytics');
    }
  }

  /**
   * Get academic performance analytics
   */
  public async getAcademicAnalytics(options: AcademicAnalyticsOptions): Promise<any> {
    try {
      const performanceData = await this.analyticsRepository.getAcademicPerformance(options);
      const progressTracking = await this.analyticsRepository.getProgressTracking(options);
      const subjectAnalytics = await this.analyticsRepository.getSubjectAnalytics(options);
      const assessmentData = await this.analyticsRepository.getAssessmentAnalytics(options);

      return {
        overview: performanceData.overview,
        subjects: subjectAnalytics,
        progress: progressTracking,
        assessments: assessmentData,
        insights: this.generateAcademicInsights(performanceData, progressTracking),
        recommendations: await this.generateRecommendations(options)
      };

    } catch (error) {
      this.logger.error('Get academic analytics failed', error);
      throw AppErrors.internal('Failed to retrieve academic analytics');
    }
  }

  /**
   * Get AI usage analytics
   */
  public async getAIUsageAnalytics(options: AIUsageAnalyticsOptions): Promise<any> {
    try {
      const usageData = await this.analyticsRepository.getAIUsage(options);
      const costAnalysis = await this.analyticsRepository.getAICostAnalysis(options);
      const modelPerformance = await this.analyticsRepository.getAIModelPerformance(options);
      const tokenUsage = await this.analyticsRepository.getTokenUsage(options);

      return {
        usage: usageData,
        costs: costAnalysis,
        models: modelPerformance,
        tokens: tokenUsage,
        efficiency: this.calculateAIEfficiency(usageData, costAnalysis),
        trends: await this.getAITrends(options)
      };

    } catch (error) {
      this.logger.error('Get AI usage analytics failed', error);
      throw AppErrors.internal('Failed to retrieve AI usage analytics');
    }
  }

  /**
   * Get real-time system status
   */
  public async getSystemStatus(): Promise<any> {
    try {
      const dbStatus = await this.dashboardRepository.checkDatabaseHealth();
      const cacheStatus = await this.cache.getStatus();
      const metrics = this.metrics.getCurrentMetrics();

      return {
        database: dbStatus,
        cache: cacheStatus,
        metrics: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          uptime: process.uptime()
        },
        services: {
          api: 'healthy',
          auth: 'healthy',
          storage: 'healthy'
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Get system status failed', error);
      throw AppErrors.internal('Failed to retrieve system status');
    }
  }

  /**
   * Generate custom report
   */
  public async generateCustomReport(options: {
    userId: number;
    userType: string;
    empresaId: number;
    escolaId?: number;
    reportConfig: ReportConfig;
  }): Promise<any> {
    try {
      const reportData = await this.analyticsRepository.generateReport(options.reportConfig);
      
      // Process data based on report type
      const processedData = await this.processReportData(reportData, options.reportConfig);
      
      // Generate visualizations
      const charts = await this.generateCharts(processedData, options.reportConfig);
      
      // Create report metadata
      const metadata = {
        generatedBy: options.userId,
        generatedAt: new Date().toISOString(),
        reportType: options.reportConfig.type,
        timeRange: options.reportConfig.timeRange,
        sections: options.reportConfig.sections
      };

      return {
        data: processedData,
        charts,
        metadata,
        summary: this.generateReportSummary(processedData)
      };

    } catch (error) {
      this.logger.error('Generate custom report failed', error);
      throw AppErrors.internal('Failed to generate custom report');
    }
  }

  /**
   * Export dashboard data
   */
  public async exportDashboardData(options: {
    userId: number;
    userType: string;
    format: string;
    sections: string[];
    timeRange: string;
  }): Promise<any> {
    try {
      const data = await this.dashboardRepository.getExportData(options);
      
      switch (options.format) {
        case 'pdf':
          return this.generatePDFExport(data, options);
        case 'excel':
          return this.generateExcelExport(data, options);
        case 'csv':
          return this.generateCSVExport(data, options);
        default:
          throw AppErrors.badRequest('Unsupported export format');
      }

    } catch (error) {
      this.logger.error('Export dashboard data failed', error);
      throw AppErrors.internal('Failed to export dashboard data');
    }
  }

  /**
   * Get widgets configuration
   */
  public async getWidgetsConfig(userId: number, userType: string): Promise<any> {
    try {
      const config = await this.dashboardRepository.getWidgetsConfig(userId, userType);
      
      if (!config) {
        // Return default configuration for user type
        return this.getDefaultWidgetsConfig(userType);
      }

      return config;

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
      const updatedConfig = await this.dashboardRepository.updateWidgetsConfig(userId, config);
      
      // Invalidate cache
      await this.cache.delete(`dashboard:config:${userId}`);
      
      return updatedConfig;

    } catch (error) {
      this.logger.error('Update widgets config failed', error);
      throw AppErrors.internal('Failed to update widgets configuration');
    }
  }

  /**
   * Get alerts and notifications
   */
  public async getAlerts(options: {
    userId: number;
    userType: string;
    empresaId: number;
    limit: number;
  }): Promise<any> {
    try {
      const alerts = await this.dashboardRepository.getAlerts(options);
      const systemAlerts = await this.getSystemAlerts(options.userType);
      
      return {
        user: alerts,
        system: systemAlerts,
        total: alerts.length + systemAlerts.length
      };

    } catch (error) {
      this.logger.error('Get alerts failed', error);
      throw AppErrors.internal('Failed to retrieve alerts');
    }
  }

  // Helper methods

  private async getCoreMetrics(options: DashboardMetricsOptions): Promise<any> {
    const metrics = await this.dashboardRepository.getCoreMetrics(options);
    
    // Add calculated fields
    return {
      ...metrics,
      growthRate: this.calculateGrowthRate(metrics.current, metrics.previous),
      efficiency: this.calculateEfficiency(metrics),
      health: this.calculateHealthScore(metrics)
    };
  }

  private async getActivityTrends(options: DashboardMetricsOptions): Promise<any> {
    return this.dashboardRepository.getActivityTrends(options);
  }

  private async getPerformanceIndicators(options: DashboardMetricsOptions): Promise<any> {
    return this.dashboardRepository.getPerformanceIndicators(options);
  }

  private async getRecentActivities(options: DashboardMetricsOptions): Promise<any> {
    return this.dashboardRepository.getRecentActivities(options);
  }

  private async getComparisons(options: DashboardMetricsOptions): Promise<any> {
    return this.dashboardRepository.getComparisons(options);
  }

  private generateActivityInsights(activityData: any, engagementMetrics: any): any {
    return {
      peakHours: this.identifyPeakHours(activityData),
      engagementScore: this.calculateEngagementScore(engagementMetrics),
      recommendations: this.generateActivityRecommendations(activityData)
    };
  }

  private generateAcademicInsights(performanceData: any, progressTracking: any): any {
    return {
      improvementAreas: this.identifyImprovementAreas(performanceData),
      strongSubjects: this.identifyStrongSubjects(performanceData),
      learningPattern: this.analyzeLearningPattern(progressTracking)
    };
  }

  private async generateRecommendations(options: AcademicAnalyticsOptions): Promise<any> {
    // AI-powered recommendations based on performance data
    return this.analyticsRepository.generateRecommendations(options);
  }

  private calculateAIEfficiency(usageData: any, costAnalysis: any): any {
    return {
      costPerToken: costAnalysis.totalCost / usageData.totalTokens,
      efficiency: usageData.successfulRequests / usageData.totalRequests,
      avgResponseTime: usageData.totalResponseTime / usageData.totalRequests
    };
  }

  private async getAITrends(options: AIUsageAnalyticsOptions): Promise<any> {
    return this.analyticsRepository.getAITrends(options);
  }

  private async processReportData(data: any, config: ReportConfig): Promise<any> {
    // Process data based on report type and sections
    return data;
  }

  private async generateCharts(data: any, config: ReportConfig): Promise<any> {
    // Generate chart configurations for the report
    return [];
  }

  private generateReportSummary(data: any): any {
    return {
      totalRecords: data.length,
      keyInsights: [],
      recommendations: []
    };
  }

  private async generatePDFExport(data: any, options: any): Promise<any> {
    // Generate PDF export
    return {
      data: Buffer.from('PDF content'),
      mimeType: 'application/pdf',
      filename: `dashboard-export-${new Date().toISOString().split('T')[0]}.pdf`
    };
  }

  private async generateExcelExport(data: any, options: any): Promise<any> {
    // Generate Excel export
    return {
      data: Buffer.from('Excel content'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`
    };
  }

  private async generateCSVExport(data: any, options: any): Promise<any> {
    // Generate CSV export
    const csvContent = 'CSV content here';
    return {
      data: Buffer.from(csvContent),
      mimeType: 'text/csv',
      filename: `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`
    };
  }

  private getDefaultWidgetsConfig(userType: string): any {
    const configs = {
      admin: {
        widgets: ['system-overview', 'user-analytics', 'performance', 'revenue'],
        layout: 'admin-default'
      },
      gestor: {
        widgets: ['school-overview', 'academic-performance', 'ai-usage'],
        layout: 'manager-default'
      },
      diretor: {
        widgets: ['school-stats', 'student-performance', 'teacher-activity'],
        layout: 'director-default'
      },
      professor: {
        widgets: ['class-overview', 'lesson-plans', 'student-progress'],
        layout: 'teacher-default'
      },
      aluno: {
        widgets: ['my-progress', 'assignments', 'achievements'],
        layout: 'student-default'
      }
    };

    return configs[userType] || configs.aluno;
  }

  private async getSystemAlerts(userType: string): Promise<any[]> {
    if (userType !== 'admin') return [];
    
    // Get system-level alerts for admins
    return this.dashboardRepository.getSystemAlerts();
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateEfficiency(metrics: any): number {
    // Calculate efficiency based on various metrics
    return 85; // Placeholder
  }

  private calculateHealthScore(metrics: any): number {
    // Calculate health score based on various metrics
    return 92; // Placeholder
  }

  private identifyPeakHours(activityData: any): any[] {
    // Analyze activity data to identify peak hours
    return [];
  }

  private calculateEngagementScore(engagementMetrics: any): number {
    // Calculate engagement score
    return 0;
  }

  private generateActivityRecommendations(activityData: any): any[] {
    // Generate recommendations based on activity patterns
    return [];
  }

  private identifyImprovementAreas(performanceData: any): any[] {
    // Identify areas needing improvement
    return [];
  }

  private identifyStrongSubjects(performanceData: any): any[] {
    // Identify strong subjects
    return [];
  }

  private analyzeLearningPattern(progressTracking: any): any {
    // Analyze learning patterns
    return {};
  }
}
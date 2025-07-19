import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './DashboardService';
import { DashboardValidator } from './DashboardValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CacheService } from '../../services/CacheService';

export class DashboardController {
  private dashboardService: DashboardService;
  private validator: DashboardValidator;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: CacheService;

  constructor() {
    this.dashboardService = new DashboardService();
    this.validator = new DashboardValidator();
    this.logger = new Logger('DashboardController');
    this.metrics = getMetrics();
    this.cache = new CacheService();
  }

  /**
   * Get comprehensive dashboard metrics
   */
  public async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateDashboardRequest(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const cacheKey = `dashboard:metrics:${req.user!.id}:${req.user!.tipo_usuario}:${JSON.stringify(validationResult.data)}`;
      
      // Check cache first
      let metrics = await this.cache.get(cacheKey);
      
      if (!metrics) {
        metrics = await this.dashboardService.getDashboardMetrics({
          userId: req.user!.id,
          userType: req.user!.tipo_usuario,
          empresaId: req.user!.empresa_id,
          escolaId: req.user!.escola_id,
          timeRange: validationResult.data.timeRange,
          includeComparisons: validationResult.data.includeComparisons
        });

        // Cache for 5 minutes for real-time feel with performance
        await this.cache.set(cacheKey, metrics, 300);
      }

      const duration = timer();
      this.logger.info('Dashboard metrics retrieved', {
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        timeRange: validationResult.data.timeRange,
        cached: !!metrics,
        duration
      });

      this.metrics.timing('dashboard.metrics.duration', duration);
      this.metrics.increment('dashboard.metrics.success');

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Get dashboard metrics failed', error, { duration });
      this.metrics.increment('dashboard.metrics.failure');
      next(error);
    }
  }

  /**
   * Get performance analytics
   */
  public async getPerformanceAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validatePerformanceRequest(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      // Only admins and gestores can access detailed performance analytics
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions for performance analytics');
      }

      const analytics = await this.dashboardService.getPerformanceAnalytics({
        timeRange: validationResult.data.timeRange,
        granularity: validationResult.data.granularity,
        metrics: validationResult.data.metrics
      });

      const duration = timer();
      this.logger.info('Performance analytics retrieved', {
        userId: req.user!.id,
        timeRange: validationResult.data.timeRange,
        duration
      });

      this.metrics.timing('dashboard.performance.duration', duration);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Get performance analytics failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get user activity analytics
   */
  public async getUserActivityAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateActivityRequest(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const analytics = await this.dashboardService.getUserActivityAnalytics({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        timeRange: validationResult.data.timeRange,
        groupBy: validationResult.data.groupBy
      });

      const duration = timer();
      this.metrics.timing('dashboard.activity.duration', duration);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Get user activity analytics failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get academic performance analytics
   */
  public async getAcademicAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateAcademicRequest(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const analytics = await this.dashboardService.getAcademicAnalytics({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        timeRange: validationResult.data.timeRange,
        subjects: validationResult.data.subjects,
        grades: validationResult.data.grades
      });

      const duration = timer();
      this.metrics.timing('dashboard.academic.duration', duration);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Get academic analytics failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get AI usage analytics
   */
  public async getAIUsageAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateAIUsageRequest(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const analytics = await this.dashboardService.getAIUsageAnalytics({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        timeRange: validationResult.data.timeRange,
        models: validationResult.data.models
      });

      const duration = timer();
      this.metrics.timing('dashboard.ai.duration', duration);

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Get AI usage analytics failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get real-time system status
   */
  public async getSystemStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Only admins can access system status
      if (req.user!.tipo_usuario !== 'admin') {
        throw AppErrors.forbidden('Insufficient permissions for system status');
      }

      const status = await this.dashboardService.getSystemStatus();

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      this.logger.error('Get system status failed', error);
      next(error);
    }
  }

  /**
   * Generate custom report
   */
  public async generateCustomReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateReportRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const report = await this.dashboardService.generateCustomReport({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        escolaId: req.user!.escola_id,
        reportConfig: validationResult.data
      });

      const duration = timer();
      this.logger.info('Custom report generated', {
        userId: req.user!.id,
        reportType: validationResult.data.type,
        duration
      });

      this.metrics.timing('dashboard.report.duration', duration);
      this.metrics.increment('dashboard.report.generated');

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Generate custom report failed', error, { duration });
      next(error);
    }
  }

  /**
   * Export dashboard data
   */
  public async exportDashboardData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateExportRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const exportData = await this.dashboardService.exportDashboardData({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        format: validationResult.data.format,
        sections: validationResult.data.sections,
        timeRange: validationResult.data.timeRange
      });

      const duration = timer();
      this.logger.info('Dashboard data exported', {
        userId: req.user!.id,
        format: validationResult.data.format,
        duration
      });

      this.metrics.timing('dashboard.export.duration', duration);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', exportData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      
      res.send(exportData.data);

    } catch (error) {
      const duration = timer();
      this.logger.error('Export dashboard data failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get dashboard widgets configuration
   */
  public async getWidgetsConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await this.dashboardService.getWidgetsConfig(
        req.user!.id,
        req.user!.tipo_usuario
      );

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      this.logger.error('Get widgets config failed', error);
      next(error);
    }
  }

  /**
   * Update dashboard widgets configuration
   */
  public async updateWidgetsConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validateWidgetsConfig(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const config = await this.dashboardService.updateWidgetsConfig(
        req.user!.id,
        validationResult.data
      );

      this.logger.info('Widgets config updated', {
        userId: req.user!.id,
        widgets: validationResult.data.widgets.length
      });

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      this.logger.error('Update widgets config failed', error);
      next(error);
    }
  }

  /**
   * Get alerts and notifications
   */
  public async getAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await this.dashboardService.getAlerts({
        userId: req.user!.id,
        userType: req.user!.tipo_usuario,
        empresaId: req.user!.empresa_id,
        limit: parseInt(req.query.limit as string) || 10
      });

      res.json({
        success: true,
        data: alerts
      });

    } catch (error) {
      this.logger.error('Get alerts failed', error);
      next(error);
    }
  }
}
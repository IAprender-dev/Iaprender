import { Request, Response, NextFunction } from 'express';
import { SchoolService } from './SchoolService';
import { SchoolValidator } from './SchoolValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';

export class SchoolController {
  private schoolService: SchoolService;
  private validator: SchoolValidator;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.schoolService = new SchoolService();
    this.validator = new SchoolValidator();
    this.logger = new Logger('SchoolController');
    this.metrics = getMetrics();
  }

  /**
   * List schools with filters and pagination
   */
  public async listSchools(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateListQuery(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const {
        page = 1,
        limit = 20,
        search,
        empresaId,
        contratoId,
        status,
        sort = 'nome',
        order = 'asc'
      } = validationResult.data;

      // Apply permission filters
      const filters = this.applyPermissionFilters(req.user!, {
        empresaId,
        contratoId,
        status
      });

      const result = await this.schoolService.listSchools({
        page,
        limit,
        search,
        filters,
        sort: {
          column: sort,
          direction: order
        }
      });

      const duration = timer();
      this.logger.info('Schools listed', {
        userId: req.user!.id,
        count: result.data.length,
        duration
      });
      this.metrics.timing('schools.list.duration', duration);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('List schools failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get school by ID
   */
  public async getSchool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check permissions
      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const school = await this.schoolService.getSchoolById(parseInt(id));

      if (!school) {
        throw AppErrors.notFound('School not found');
      }

      res.json({
        success: true,
        data: school
      });

    } catch (error) {
      this.logger.error('Get school failed', error);
      next(error);
    }
  }

  /**
   * Create new school
   */
  public async createSchool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      // Only admin and gestor can create schools
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Only administrators and managers can create schools');
      }

      const validationResult = this.validator.validateCreate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const schoolData = validationResult.data;

      // Gestor can only create schools in their company
      if (req.user!.tipo_usuario === 'gestor' && schoolData.empresaId !== req.user!.empresa_id) {
        throw AppErrors.forbidden('You can only create schools in your company');
      }

      const school = await this.schoolService.createSchool({
        ...schoolData,
        createdBy: req.user!.id
      });

      const duration = timer();
      this.logger.info('School created', {
        schoolId: school.id,
        createdBy: req.user!.id,
        duration
      });
      this.metrics.timing('schools.create.duration', duration);
      this.metrics.increment('schools.create.success');

      res.status(201).json({
        success: true,
        message: 'School created successfully',
        data: school
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Create school failed', error, { duration });
      this.metrics.increment('schools.create.failure');
      next(error);
    }
  }

  /**
   * Update school
   */
  public async updateSchool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id } = req.params;

      // Check permissions
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Only administrators and managers can update schools');
      }

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const validationResult = this.validator.validateUpdate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const school = await this.schoolService.updateSchool(parseInt(id), {
        ...validationResult.data,
        updatedBy: req.user!.id
      });

      if (!school) {
        throw AppErrors.notFound('School not found');
      }

      const duration = timer();
      this.logger.info('School updated', {
        schoolId: id,
        updatedBy: req.user!.id,
        duration
      });
      this.metrics.timing('schools.update.duration', duration);

      res.json({
        success: true,
        message: 'School updated successfully',
        data: school
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Update school failed', error, { duration });
      next(error);
    }
  }

  /**
   * Delete school
   */
  public async deleteSchool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id } = req.params;

      // Only admin can delete schools
      if (req.user!.tipo_usuario !== 'admin') {
        throw AppErrors.forbidden('Only administrators can delete schools');
      }

      const success = await this.schoolService.deleteSchool(parseInt(id));

      if (!success) {
        throw AppErrors.notFound('School not found');
      }

      const duration = timer();
      this.logger.info('School deleted', {
        schoolId: id,
        deletedBy: req.user!.id,
        duration
      });
      this.metrics.timing('schools.delete.duration', duration);

      res.json({
        success: true,
        message: 'School deleted successfully'
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete school failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get school statistics
   */
  public async getSchoolStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const stats = await this.schoolService.getSchoolStatistics(parseInt(id));

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      this.logger.error('Get school stats failed', error);
      next(error);
    }
  }

  /**
   * Get school classes
   */
  public async getSchoolClasses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const validationResult = this.validator.validateListQuery(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const classes = await this.schoolService.getSchoolClasses(parseInt(id), validationResult.data);

      res.json({
        success: true,
        data: classes
      });

    } catch (error) {
      this.logger.error('Get school classes failed', error);
      next(error);
    }
  }

  /**
   * Create class in school
   */
  public async createClass(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id } = req.params;

      // Check permissions - diretor can create classes in their school
      if (!['admin', 'gestor', 'diretor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const validationResult = this.validator.validateCreateClass(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const classData = await this.schoolService.createClass(parseInt(id), {
        ...validationResult.data,
        createdBy: req.user!.id
      });

      const duration = timer();
      this.logger.info('Class created', {
        schoolId: id,
        classId: classData.id,
        createdBy: req.user!.id,
        duration
      });
      this.metrics.timing('schools.createClass.duration', duration);

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: classData
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Create class failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get pending approvals for school
   */
  public async getPendingApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Only diretor and above can see approvals
      if (!['admin', 'gestor', 'diretor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const approvals = await this.schoolService.getPendingApprovals(parseInt(id));

      res.json({
        success: true,
        data: approvals
      });

    } catch (error) {
      this.logger.error('Get pending approvals failed', error);
      next(error);
    }
  }

  /**
   * Process approval
   */
  public async processApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, approvalId } = req.params;
      const { action, reason } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        throw AppErrors.badRequest('Invalid action. Must be approve or reject');
      }

      // Only diretor and above can process approvals
      if (!['admin', 'gestor', 'diretor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      await this.schoolService.processApproval(
        parseInt(approvalId),
        action,
        req.user!.id,
        reason
      );

      this.logger.info('Approval processed', {
        schoolId: id,
        approvalId,
        action,
        processedBy: req.user!.id
      });

      res.json({
        success: true,
        message: `User ${action}d successfully`
      });

    } catch (error) {
      this.logger.error('Process approval failed', error);
      next(error);
    }
  }

  /**
   * Generate school report
   */
  public async generateReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reportType, startDate, endDate } = req.body;

      if (!this.hasSchoolAccess(req.user!, parseInt(id))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const validationResult = this.validator.validateReportRequest({
        reportType,
        startDate,
        endDate
      });

      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const report = await this.schoolService.generateReport(
        parseInt(id),
        validationResult.data
      );

      this.logger.info('Report generated', {
        schoolId: id,
        reportType,
        generatedBy: req.user!.id
      });

      res.json({
        success: true,
        message: 'Report generated successfully',
        data: report
      });

    } catch (error) {
      this.logger.error('Generate report failed', error);
      next(error);
    }
  }

  // Helper methods

  private hasSchoolAccess(user: any, schoolId: number): boolean {
    // Admin has access to all schools
    if (user.tipo_usuario === 'admin') return true;

    // Gestor has access to schools in their company
    if (user.tipo_usuario === 'gestor') {
      // Would need to check if school belongs to user's company
      return true;
    }

    // Diretor has access only to their school
    if (user.tipo_usuario === 'diretor') {
      return user.escola_id === schoolId;
    }

    // Teachers and students have limited access to their school
    if (['professor', 'aluno'].includes(user.tipo_usuario)) {
      return user.escola_id === schoolId;
    }

    return false;
  }

  private applyPermissionFilters(user: any, filters: any): any {
    const appliedFilters = { ...filters };

    // Gestor can only see schools in their company
    if (user.tipo_usuario === 'gestor') {
      appliedFilters.empresaId = user.empresa_id;
    }

    // Diretor can only see their school
    if (user.tipo_usuario === 'diretor') {
      appliedFilters.id = user.escola_id;
    }

    return appliedFilters;
  }
}
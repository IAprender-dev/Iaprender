import { Request, Response, NextFunction } from 'express';
import { StudentService } from './StudentService';
import { StudentValidator } from './StudentValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';

export class StudentController {
  private studentService: StudentService;
  private validator: StudentValidator;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.studentService = new StudentService();
    this.validator = new StudentValidator();
    this.logger = new Logger('StudentController');
    this.metrics = getMetrics();
  }

  /**
   * List students
   */
  public async listStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId } = req.params;

      // Validate permissions
      if (!this.hasSchoolAccess(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const validationResult = this.validator.validateListQuery(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const result = await this.studentService.listStudents({
        schoolId: parseInt(schoolId),
        ...validationResult.data
      });

      const duration = timer();
      this.logger.info('Students listed', {
        schoolId,
        count: result.data.length,
        duration
      });
      this.metrics.timing('students.list.duration', duration);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('List students failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get student details
   */
  public async getStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: schoolId, studentId } = req.params;

      if (!this.hasSchoolAccess(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const student = await this.studentService.getStudentById(parseInt(studentId));

      if (!student || student.escolaId !== parseInt(schoolId)) {
        throw AppErrors.notFound('Student not found');
      }

      res.json({
        success: true,
        data: student
      });

    } catch (error) {
      this.logger.error('Get student failed', error);
      next(error);
    }
  }

  /**
   * Create student
   */
  public async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId } = req.params;

      if (!this.hasCreatePermission(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const validationResult = this.validator.validateCreate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const student = await this.studentService.createStudent({
        ...validationResult.data,
        escolaId: parseInt(schoolId),
        createdBy: req.user!.id
      });

      const duration = timer();
      this.logger.info('Student created', {
        studentId: student.id,
        schoolId,
        createdBy: req.user!.id,
        duration
      });
      this.metrics.timing('students.create.duration', duration);
      this.metrics.increment('students.create.success');

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Create student failed', error, { duration });
      this.metrics.increment('students.create.failure');
      next(error);
    }
  }

  /**
   * Update student
   */
  public async updateStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId, studentId } = req.params;

      if (!this.hasUpdatePermission(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const validationResult = this.validator.validateUpdate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const student = await this.studentService.updateStudent(
        parseInt(studentId),
        {
          ...validationResult.data,
          updatedBy: req.user!.id
        }
      );

      if (!student || student.escolaId !== parseInt(schoolId)) {
        throw AppErrors.notFound('Student not found');
      }

      const duration = timer();
      this.logger.info('Student updated', {
        studentId,
        updatedBy: req.user!.id,
        duration
      });
      this.metrics.timing('students.update.duration', duration);

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Update student failed', error, { duration });
      next(error);
    }
  }

  /**
   * Delete student
   */
  public async deleteStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId, studentId } = req.params;

      if (!this.hasDeletePermission(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const success = await this.studentService.deleteStudent(
        parseInt(studentId),
        req.user!.id
      );

      if (!success) {
        throw AppErrors.notFound('Student not found');
      }

      const duration = timer();
      this.logger.info('Student deleted', {
        studentId,
        deletedBy: req.user!.id,
        duration
      });
      this.metrics.timing('students.delete.duration', duration);

      res.json({
        success: true,
        message: 'Student deleted successfully'
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete student failed', error, { duration });
      next(error);
    }
  }

  /**
   * Transfer student to another class
   */
  public async transferStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId, studentId } = req.params;
      const { targetClassId, reason, observations } = req.body;

      if (!this.hasUpdatePermission(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const result = await this.studentService.transferStudent(
        parseInt(studentId),
        targetClassId,
        {
          reason,
          observations,
          transferredBy: req.user!.id
        }
      );

      const duration = timer();
      this.logger.info('Student transferred', {
        studentId,
        targetClassId,
        transferredBy: req.user!.id,
        duration
      });
      this.metrics.timing('students.transfer.duration', duration);

      res.json({
        success: true,
        message: 'Student transferred successfully',
        data: result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Transfer student failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get students needing attention
   */
  public async getStudentsNeedingAttention(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: schoolId } = req.params;

      if (!this.hasSchoolAccess(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const students = await this.studentService.getStudentsNeedingAttention(
        parseInt(schoolId)
      );

      res.json({
        success: true,
        data: students
      });

    } catch (error) {
      this.logger.error('Get students needing attention failed', error);
      next(error);
    }
  }

  /**
   * Get student performance
   */
  public async getStudentPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: schoolId, studentId } = req.params;
      const { months = 6 } = req.query;

      if (!this.hasSchoolAccess(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('You do not have access to this school');
      }

      const performance = await this.studentService.getStudentPerformance(
        parseInt(studentId),
        parseInt(months as string)
      );

      res.json({
        success: true,
        data: performance
      });

    } catch (error) {
      this.logger.error('Get student performance failed', error);
      next(error);
    }
  }

  /**
   * Bulk import students
   */
  public async bulkImportStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id: schoolId } = req.params;

      if (!this.hasCreatePermission(req.user!, parseInt(schoolId))) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const validationResult = this.validator.validateBulkImport(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const result = await this.studentService.bulkImportStudents(
        parseInt(schoolId),
        validationResult.data.students,
        req.user!.id
      );

      const duration = timer();
      this.logger.info('Bulk import completed', {
        schoolId,
        created: result.created.length,
        updated: result.updated.length,
        skipped: result.skipped.length,
        importedBy: req.user!.id,
        duration
      });
      this.metrics.timing('students.bulkImport.duration', duration);

      res.status(201).json({
        success: true,
        message: `Import completed: ${result.created.length} created, ${result.updated.length} updated, ${result.skipped.length} skipped`,
        data: result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Bulk import failed', error, { duration });
      next(error);
    }
  }

  // Helper methods

  private hasSchoolAccess(user: any, schoolId: number): boolean {
    if (user.tipo_usuario === 'admin') return true;
    if (user.tipo_usuario === 'gestor') return true; // Would need company check
    if (['diretor', 'professor'].includes(user.tipo_usuario)) {
      return user.escola_id === schoolId;
    }
    return false;
  }

  private hasCreatePermission(user: any, schoolId: number): boolean {
    if (user.tipo_usuario === 'admin') return true;
    if (user.tipo_usuario === 'gestor') return true; // Would need company check
    if (user.tipo_usuario === 'diretor') {
      return user.escola_id === schoolId;
    }
    return false;
  }

  private hasUpdatePermission(user: any, schoolId: number): boolean {
    return this.hasCreatePermission(user, schoolId);
  }

  private hasDeletePermission(user: any, schoolId: number): boolean {
    return this.hasCreatePermission(user, schoolId);
  }
}
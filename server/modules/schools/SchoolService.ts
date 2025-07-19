import { SchoolRepository } from '../../repositories/SchoolRepository';
import { ClassRepository } from '../../repositories/ClassRepository';
import { StudentRepository } from '../../repositories/StudentRepository';
import { TeacherRepository } from '../../repositories/TeacherRepository';
import { ApprovalRepository } from '../../repositories/ApprovalRepository';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { Cache, getCache } from '../../utils/cache';
import { AppErrors } from '../../middleware/errorHandler';
import { AuditService } from '../audit/AuditService';
import { NotificationService } from '../notifications/NotificationService';
import { ReportService } from '../reports/ReportService';

interface ListSchoolsParams {
  page: number;
  limit: number;
  search?: string;
  filters?: any;
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

interface SchoolStatistics {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  activeClasses: number;
  totalLicenses: number;
  usedLicenses: number;
  monthlyTokenUsage: number;
  tokenLimit: number;
  pendingApprovals: number;
  recentActivities: any[];
}

export class SchoolService {
  private schoolRepository: SchoolRepository;
  private classRepository: ClassRepository;
  private studentRepository: StudentRepository;
  private teacherRepository: TeacherRepository;
  private approvalRepository: ApprovalRepository;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private reportService: ReportService;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;

  constructor() {
    this.schoolRepository = new SchoolRepository();
    this.classRepository = new ClassRepository();
    this.studentRepository = new StudentRepository();
    this.teacherRepository = new TeacherRepository();
    this.approvalRepository = new ApprovalRepository();
    this.auditService = new AuditService();
    this.notificationService = new NotificationService();
    this.reportService = new ReportService();
    this.logger = new Logger('SchoolService');
    this.metrics = getMetrics();
    this.cache = getCache('schools', 300); // 5 min cache
  }

  /**
   * List schools with pagination and filters
   */
  public async listSchools(params: ListSchoolsParams): Promise<any> {
    const cacheKey = this.cache.createHashKey(params);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { page, limit, search, filters, sort } = params;

      // Build query conditions
      const conditions: any = { ...filters };
      
      // Add search conditions
      if (search) {
        conditions._or = [
          { nome: { ilike: `%${search}%` } },
          { codigo: { ilike: `%${search}%` } },
          { cidade: { ilike: `%${search}%` } }
        ];
      }

      // Get paginated schools
      const result = await this.schoolRepository.findPaginated(
        conditions,
        page,
        limit,
        {
          orderBy: sort ? [{
            column: sort.column,
            direction: sort.direction
          }] : undefined,
          include: ['empresa', 'contrato']
        }
      );

      // Enrich with additional data
      const enriched = await Promise.all(
        result.data.map(async (school) => ({
          ...school,
          studentCount: await this.studentRepository.count({ escolaId: school.id }),
          teacherCount: await this.teacherRepository.count({ escolaId: school.id }),
          classCount: await this.classRepository.count({ escolaId: school.id })
        }))
      );

      const response = {
        ...result,
        data: enriched
      };

      this.cache.set(cacheKey, response);
      this.metrics.increment('schools.list.success');

      return response;

    } catch (error) {
      this.logger.error('Failed to list schools', error);
      this.metrics.increment('schools.list.failure');
      throw error;
    }
  }

  /**
   * Get school by ID
   */
  public async getSchoolById(id: number): Promise<any> {
    const cacheKey = `school:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const school = await this.schoolRepository.findById(id);
      
      if (!school) {
        return null;
      }

      // Get related data
      const [empresa, contrato, stats] = await Promise.all([
        this.getSchoolCompany(school.empresaId),
        school.contratoId ? this.getSchoolContract(school.contratoId) : null,
        this.getSchoolStatistics(id)
      ]);

      const enriched = {
        ...school,
        empresa,
        contrato,
        stats
      };
      
      this.cache.set(cacheKey, enriched);
      return enriched;

    } catch (error) {
      this.logger.error('Failed to get school', error);
      throw error;
    }
  }

  /**
   * Create new school
   */
  public async createSchool(schoolData: any): Promise<any> {
    const timer = this.metrics.startTimer();

    try {
      // Validate unique code
      const existing = await this.schoolRepository.findByCode(schoolData.codigo);
      if (existing) {
        throw AppErrors.conflict('School with this code already exists');
      }

      // Create school
      const school = await this.schoolRepository.create({
        ...schoolData,
        status: 'ativo',
        configuracoes: this.getDefaultConfigurations()
      });

      // Create default classes if specified
      if (schoolData.createDefaultClasses) {
        await this.createDefaultClasses(school.id);
      }

      // Audit log
      await this.auditService.log({
        userId: schoolData.createdBy,
        action: AuditService.Actions.DATA_CREATED,
        resource: 'schools',
        resourceId: school.id.toString(),
        details: {
          name: school.nome,
          code: school.codigo
        }
      });

      // Send notification to company admin
      await this.notificationService.notify({
        userId: schoolData.notifyUserId || schoolData.createdBy,
        type: 'school_created',
        title: 'New School Created',
        message: `School ${school.nome} has been created successfully`,
        data: { schoolId: school.id }
      });

      // Clear cache
      this.cache.flush();

      const duration = timer();
      this.logger.info('School created', {
        schoolId: school.id,
        duration
      });
      this.metrics.timing('schools.create.duration', duration);

      return school;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to create school', error);
      this.metrics.increment('schools.create.failure');
      throw error;
    }
  }

  /**
   * Update school
   */
  public async updateSchool(id: number, updateData: any): Promise<any> {
    const timer = this.metrics.startTimer();

    try {
      // Check if school exists
      const existing = await this.schoolRepository.findById(id);
      if (!existing) {
        return null;
      }

      // Validate unique code if changed
      if (updateData.codigo && updateData.codigo !== existing.codigo) {
        const codeExists = await this.schoolRepository.findByCode(updateData.codigo);
        if (codeExists) {
          throw AppErrors.conflict('School with this code already exists');
        }
      }

      // Update school
      const school = await this.schoolRepository.update(id, updateData);

      // Audit log
      await this.auditService.log({
        userId: updateData.updatedBy,
        action: AuditService.Actions.DATA_UPDATED,
        resource: 'schools',
        resourceId: id.toString(),
        details: {
          changes: updateData
        }
      });

      // Clear cache
      this.cache.delete(`school:${id}`);
      this.cache.flush();

      const duration = timer();
      this.logger.info('School updated', {
        schoolId: id,
        duration
      });
      this.metrics.timing('schools.update.duration', duration);

      return school;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to update school', error);
      throw error;
    }
  }

  /**
   * Delete school
   */
  public async deleteSchool(id: number): Promise<boolean> {
    const timer = this.metrics.startTimer();

    try {
      // Check if school has active students/teachers
      const [studentCount, teacherCount] = await Promise.all([
        this.studentRepository.count({ escolaId: id, status: 'ativo' }),
        this.teacherRepository.count({ escolaId: id, status: 'ativo' })
      ]);

      if (studentCount > 0 || teacherCount > 0) {
        throw AppErrors.conflict('Cannot delete school with active students or teachers');
      }

      // Soft delete
      const success = await this.schoolRepository.softDelete(id);

      if (success) {
        // Audit log
        await this.auditService.log({
          userId: 'system',
          action: AuditService.Actions.DATA_DELETED,
          resource: 'schools',
          resourceId: id.toString()
        });

        // Clear cache
        this.cache.delete(`school:${id}`);
        this.cache.flush();
      }

      const duration = timer();
      this.logger.info('School deleted', {
        schoolId: id,
        success,
        duration
      });
      this.metrics.timing('schools.delete.duration', duration);

      return success;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to delete school', error);
      throw error;
    }
  }

  /**
   * Get school statistics
   */
  public async getSchoolStatistics(schoolId: number): Promise<SchoolStatistics> {
    const cacheKey = `school:${schoolId}:stats`;
    const cached = this.cache.get<SchoolStatistics>(cacheKey);
    if (cached) return cached;

    try {
      const [
        totalStudents,
        activeStudents,
        totalTeachers,
        activeTeachers,
        totalClasses,
        activeClasses,
        licenses,
        tokenUsage,
        pendingApprovals,
        recentActivities
      ] = await Promise.all([
        this.studentRepository.count({ escolaId: schoolId }),
        this.studentRepository.count({ escolaId: schoolId, status: 'ativo' }),
        this.teacherRepository.count({ escolaId: schoolId }),
        this.teacherRepository.count({ escolaId: schoolId, status: 'ativo' }),
        this.classRepository.count({ escolaId: schoolId }),
        this.classRepository.count({ escolaId: schoolId, ativo: true }),
        this.getLicenseInfo(schoolId),
        this.getTokenUsage(schoolId),
        this.approvalRepository.count({ escolaId: schoolId, status: 'pending' }),
        this.getRecentActivities(schoolId)
      ]);

      const stats: SchoolStatistics = {
        totalStudents,
        activeStudents,
        totalTeachers,
        activeTeachers,
        totalClasses,
        activeClasses,
        totalLicenses: licenses.total,
        usedLicenses: licenses.used,
        monthlyTokenUsage: tokenUsage.monthly,
        tokenLimit: tokenUsage.limit,
        pendingApprovals,
        recentActivities
      };

      this.cache.set(cacheKey, stats, 600); // 10 min cache
      return stats;

    } catch (error) {
      this.logger.error('Failed to get school statistics', error);
      throw error;
    }
  }

  /**
   * Get school classes
   */
  public async getSchoolClasses(schoolId: number, params?: any): Promise<any> {
    try {
      const conditions = {
        escolaId: schoolId,
        ...params?.filters
      };

      const classes = await this.classRepository.findPaginated(
        conditions,
        params?.page || 1,
        params?.limit || 20,
        {
          orderBy: params?.sort || [{ column: 'nome', direction: 'asc' }],
          include: ['professor']
        }
      );

      // Enrich with student counts
      const enriched = await Promise.all(
        classes.data.map(async (cls) => ({
          ...cls,
          studentCount: await this.studentRepository.count({ turmaId: cls.id }),
          allocatedLicenses: cls.licencasAlocadas || 0,
          usedLicenses: await this.getUsedLicenses(cls.id)
        }))
      );

      return {
        ...classes,
        data: enriched
      };

    } catch (error) {
      this.logger.error('Failed to get school classes', error);
      throw error;
    }
  }

  /**
   * Create class in school
   */
  public async createClass(schoolId: number, classData: any): Promise<any> {
    try {
      // Validate school exists
      const school = await this.schoolRepository.findById(schoolId);
      if (!school) {
        throw AppErrors.notFound('School not found');
      }

      // Check license availability
      const licenses = await this.getLicenseInfo(schoolId);
      if (licenses.available < (classData.licencasAlocadas || 0)) {
        throw AppErrors.conflict('Not enough licenses available');
      }

      // Create class
      const newClass = await this.classRepository.create({
        ...classData,
        escolaId: schoolId,
        empresaId: school.empresaId,
        ativo: true
      });

      // Audit log
      await this.auditService.log({
        userId: classData.createdBy,
        action: 'CLASS_CREATED',
        resource: 'classes',
        resourceId: newClass.id.toString(),
        details: {
          schoolId,
          className: newClass.nome
        }
      });

      // Clear cache
      this.cache.flush();

      return newClass;

    } catch (error) {
      this.logger.error('Failed to create class', error);
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  public async getPendingApprovals(schoolId: number): Promise<any[]> {
    try {
      const approvals = await this.approvalRepository.findAll({
        escolaId: schoolId,
        status: 'pending'
      }, {
        orderBy: [{ column: 'requestedAt', direction: 'desc' }]
      });

      return approvals;

    } catch (error) {
      this.logger.error('Failed to get pending approvals', error);
      throw error;
    }
  }

  /**
   * Process approval
   */
  public async processApproval(
    approvalId: number,
    action: 'approve' | 'reject',
    processedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      const approval = await this.approvalRepository.findById(approvalId);
      if (!approval) {
        throw AppErrors.notFound('Approval not found');
      }

      if (approval.status !== 'pending') {
        throw AppErrors.conflict('Approval already processed');
      }

      // Update approval status
      await this.approvalRepository.update(approvalId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        processedBy,
        processedAt: new Date(),
        reason
      });

      if (action === 'approve') {
        // Process the approval (create user, assign to class, etc.)
        await this.executeApproval(approval);
      }

      // Send notification
      await this.notificationService.notify({
        userId: approval.requestedBy,
        type: `approval_${action}d`,
        title: `Request ${action}d`,
        message: `Your request has been ${action}d${reason ? `: ${reason}` : ''}`,
        data: { approvalId }
      });

      // Audit log
      await this.auditService.log({
        userId: processedBy,
        action: `APPROVAL_${action.toUpperCase()}ED`,
        resource: 'approvals',
        resourceId: approvalId.toString(),
        details: { reason }
      });

    } catch (error) {
      this.logger.error('Failed to process approval', error);
      throw error;
    }
  }

  /**
   * Generate school report
   */
  public async generateReport(schoolId: number, params: any): Promise<any> {
    try {
      const school = await this.schoolRepository.findById(schoolId);
      if (!school) {
        throw AppErrors.notFound('School not found');
      }

      const report = await this.reportService.generateSchoolReport({
        schoolId,
        schoolName: school.nome,
        ...params
      });

      // Audit log
      await this.auditService.log({
        userId: params.requestedBy,
        action: 'REPORT_GENERATED',
        resource: 'reports',
        resourceId: report.id,
        details: {
          schoolId,
          reportType: params.reportType
        }
      });

      return report;

    } catch (error) {
      this.logger.error('Failed to generate report', error);
      throw error;
    }
  }

  // Helper methods

  private async getSchoolCompany(empresaId: number): Promise<any> {
    // Implementation to get company details
    return null;
  }

  private async getSchoolContract(contratoId: number): Promise<any> {
    // Implementation to get contract details
    return null;
  }

  private async getLicenseInfo(schoolId: number): Promise<{
    total: number;
    used: number;
    available: number;
  }> {
    // Implementation to get license information
    const total = 100; // From contract
    const used = await this.studentRepository.count({ escolaId: schoolId, status: 'ativo' });
    return {
      total,
      used,
      available: total - used
    };
  }

  private async getTokenUsage(schoolId: number): Promise<{
    monthly: number;
    limit: number;
  }> {
    // Implementation to get token usage from metrics
    return {
      monthly: 15750,
      limit: 25000
    };
  }

  private async getRecentActivities(schoolId: number): Promise<any[]> {
    // Get recent activities from audit logs
    return [];
  }

  private async getUsedLicenses(classId: number): Promise<number> {
    return this.studentRepository.count({ turmaId: classId, status: 'ativo' });
  }

  private getDefaultConfigurations(): any {
    return {
      ai_limits: {
        '1_3_years': 10,
        '4_6_years': 20,
        '7_9_years': 30
      },
      features: {
        excessive_use_alerts: true,
        content_filter: true,
        conversation_logs: true,
        parent_notifications: false
      },
      integrations: {
        google_classroom: false,
        microsoft_teams: false
      }
    };
  }

  private async createDefaultClasses(schoolId: number): Promise<void> {
    const defaultClasses = [
      { nome: '1º Ano', serie: '1', turno: 'manhã' },
      { nome: '2º Ano', serie: '2', turno: 'manhã' },
      { nome: '3º Ano', serie: '3', turno: 'manhã' },
      { nome: '4º Ano', serie: '4', turno: 'manhã' },
      { nome: '5º Ano', serie: '5', turno: 'manhã' }
    ];

    for (const cls of defaultClasses) {
      await this.classRepository.create({
        ...cls,
        escolaId: schoolId,
        ativo: true,
        maxAlunos: 30,
        licencasAlocadas: 15
      });
    }
  }

  private async executeApproval(approval: any): Promise<void> {
    // Implementation to execute the approval action
    // Create user, assign to class, etc.
  }
}
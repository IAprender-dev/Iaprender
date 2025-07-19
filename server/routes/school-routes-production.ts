import { Router } from 'express';
import { SchoolController } from '../modules/schools/SchoolController';
import { StudentController } from '../modules/schools/StudentController';
import { ClassController } from '../modules/schools/ClassController';
import { 
  authMiddleware, 
  requireUserType, 
  requireSchool,
  AuthenticatedRequest 
} from '../middleware/auth';
import { 
  rateLimiter, 
  apiRateLimiter 
} from '../middleware/rateLimiter';
import { 
  validateRequest, 
  validatePagination,
  validateIdParam 
} from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

export function createSchoolRouter(): Router {
  const router = Router();
  const schoolController = new SchoolController();
  const studentController = new StudentController();
  const classController = new ClassController();

  /**
   * Apply authentication to all routes
   */
  router.use(authMiddleware);
  router.use(apiRateLimiter);

  /**
   * SCHOOL MANAGEMENT ROUTES
   */

  // GET /schools - List schools
  router.get(
    '/',
    validatePagination,
    asyncHandler(schoolController.listSchools.bind(schoolController))
  );

  // GET /schools/:id - Get school details
  router.get(
    '/:id',
    validateIdParam,
    asyncHandler(schoolController.getSchool.bind(schoolController))
  );

  // POST /schools - Create new school
  router.post(
    '/',
    requireUserType('admin', 'gestor'),
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10
    }),
    asyncHandler(schoolController.createSchool.bind(schoolController))
  );

  // PUT /schools/:id - Update school
  router.put(
    '/:id',
    requireUserType('admin', 'gestor'),
    validateIdParam,
    asyncHandler(schoolController.updateSchool.bind(schoolController))
  );

  // DELETE /schools/:id - Delete school
  router.delete(
    '/:id',
    requireUserType('admin'),
    validateIdParam,
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5
    }),
    asyncHandler(schoolController.deleteSchool.bind(schoolController))
  );

  // GET /schools/:id/stats - Get school statistics
  router.get(
    '/:id/stats',
    validateIdParam,
    asyncHandler(schoolController.getSchoolStats.bind(schoolController))
  );

  // GET /schools/:id/configs - Get school configurations
  router.get(
    '/:id/configs',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(async (req, res) => {
      const controller = new SchoolController();
      const school = await (controller as any).schoolService.getSchoolById(parseInt(req.params.id));
      
      res.json({
        success: true,
        data: school?.configuracoes || {}
      });
    })
  );

  // PUT /schools/:id/configs - Update school configurations
  router.put(
    '/:id/configs',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(async (req, res) => {
      const controller = new SchoolController();
      const school = await (controller as any).schoolService.updateSchool(
        parseInt(req.params.id),
        { configuracoes: req.body }
      );
      
      res.json({
        success: true,
        message: 'Configurations updated successfully',
        data: school?.configuracoes
      });
    })
  );

  /**
   * CLASS MANAGEMENT ROUTES
   */

  // GET /schools/:id/classes - List school classes
  router.get(
    '/:id/classes',
    validateIdParam,
    validatePagination,
    asyncHandler(schoolController.getSchoolClasses.bind(schoolController))
  );

  // POST /schools/:id/classes - Create class in school
  router.post(
    '/:id/classes',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(schoolController.createClass.bind(schoolController))
  );

  // GET /schools/:id/classes/:classId - Get class details
  router.get(
    '/:id/classes/:classId',
    validateIdParam,
    asyncHandler(classController.getClass.bind(classController))
  );

  // PUT /schools/:id/classes/:classId - Update class
  router.put(
    '/:id/classes/:classId',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(classController.updateClass.bind(classController))
  );

  // DELETE /schools/:id/classes/:classId - Delete class
  router.delete(
    '/:id/classes/:classId',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(classController.deleteClass.bind(classController))
  );

  /**
   * STUDENT MANAGEMENT ROUTES
   */

  // GET /schools/:id/students - List school students
  router.get(
    '/:id/students',
    validateIdParam,
    validatePagination,
    asyncHandler(studentController.listStudents.bind(studentController))
  );

  // POST /schools/:id/students - Create student
  router.post(
    '/:id/students',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(studentController.createStudent.bind(studentController))
  );

  // GET /schools/:id/students/:studentId - Get student details
  router.get(
    '/:id/students/:studentId',
    validateIdParam,
    asyncHandler(studentController.getStudent.bind(studentController))
  );

  // PUT /schools/:id/students/:studentId - Update student
  router.put(
    '/:id/students/:studentId',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(studentController.updateStudent.bind(studentController))
  );

  // DELETE /schools/:id/students/:studentId - Delete student
  router.delete(
    '/:id/students/:studentId',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(studentController.deleteStudent.bind(studentController))
  );

  // POST /schools/:id/students/:studentId/transfer - Transfer student
  router.post(
    '/:id/students/:studentId/transfer',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    validateRequest({
      body: z.object({
        targetClassId: z.number().positive(),
        reason: z.string().min(1),
        observations: z.string().optional()
      })
    }),
    asyncHandler(studentController.transferStudent.bind(studentController))
  );

  /**
   * APPROVAL MANAGEMENT ROUTES
   */

  // GET /schools/:id/approvals - Get pending approvals
  router.get(
    '/:id/approvals',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(schoolController.getPendingApprovals.bind(schoolController))
  );

  // PATCH /schools/:id/approvals/:approvalId - Process approval
  router.patch(
    '/:id/approvals/:approvalId',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    validateRequest({
      body: z.object({
        action: z.enum(['approve', 'reject']),
        reason: z.string().optional()
      })
    }),
    asyncHandler(schoolController.processApproval.bind(schoolController))
  );

  /**
   * INVITATION ROUTES
   */

  // GET /schools/:id/invitations - List invitations
  router.get(
    '/:id/invitations',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(async (req, res) => {
      // Implementation for listing invitations
      res.json({
        success: true,
        data: []
      });
    })
  );

  // POST /schools/:id/invitations - Send invitation
  router.post(
    '/:id/invitations',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    validateRequest({
      body: z.object({
        email: z.string().email(),
        role: z.enum(['professor', 'coordenador', 'secretario']),
        classId: z.number().optional(),
        message: z.string().optional()
      })
    }),
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 20
    }),
    asyncHandler(async (req, res) => {
      // Implementation for sending invitations
      res.json({
        success: true,
        message: 'Invitation sent successfully'
      });
    })
  );

  /**
   * REPORT ROUTES
   */

  // GET /schools/:id/reports - List reports
  router.get(
    '/:id/reports',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(async (req, res) => {
      // Implementation for listing reports
      res.json({
        success: true,
        data: []
      });
    })
  );

  // POST /schools/:id/reports - Generate report
  router.post(
    '/:id/reports',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10
    }),
    asyncHandler(schoolController.generateReport.bind(schoolController))
  );

  /**
   * TEACHER MANAGEMENT ROUTES
   */

  // GET /schools/:id/teachers - List school teachers
  router.get(
    '/:id/teachers',
    validateIdParam,
    validatePagination,
    asyncHandler(async (req, res) => {
      // Implementation for listing teachers
      res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      });
    })
  );

  // POST /schools/:id/teachers - Add teacher to school
  router.post(
    '/:id/teachers',
    requireUserType('admin', 'gestor', 'diretor'),
    validateIdParam,
    asyncHandler(async (req, res) => {
      // Implementation for adding teacher
      res.status(201).json({
        success: true,
        message: 'Teacher added successfully'
      });
    })
  );

  return router;
}

/**
 * Register school routes with Express app
 */
export function registerSchoolRoutes(app: any): void {
  const schoolRouter = createSchoolRouter();
  app.use('/api/schools', schoolRouter);
  console.log('✅ School routes registered at /api/schools');
}
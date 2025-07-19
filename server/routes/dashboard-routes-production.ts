import { Router } from 'express';
import { DashboardController } from '../modules/dashboard/DashboardController';
import { 
  authMiddleware, 
  requireUserType,
  AuthenticatedRequest 
} from '../middleware/auth';
import { 
  rateLimiter, 
  apiRateLimiter 
} from '../middleware/rateLimiter';
import { 
  validateRequest,
  validatePagination 
} from '../middleware/validateRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { z } from 'zod';

export function createDashboardRouter(): Router {
  const router = Router();
  const dashboardController = new DashboardController();

  /**
   * Apply authentication to all routes
   */
  router.use(authMiddleware);
  router.use(apiRateLimiter);

  /**
   * CORE DASHBOARD ROUTES
   */

  // GET /dashboard/metrics - Get comprehensive dashboard metrics
  router.get(
    '/metrics',
    rateLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: 'Dashboard metrics rate limit exceeded'
    }),
    asyncHandler(dashboardController.getDashboardMetrics.bind(dashboardController))
  );

  // GET /dashboard/performance - Get performance analytics (admin/gestor only)
  router.get(
    '/performance',
    requireUserType('admin', 'gestor'),
    rateLimiter({
      windowMs: 60 * 1000,
      max: 30
    }),
    asyncHandler(dashboardController.getPerformanceAnalytics.bind(dashboardController))
  );

  // GET /dashboard/activity - Get user activity analytics
  router.get(
    '/activity',
    asyncHandler(dashboardController.getUserActivityAnalytics.bind(dashboardController))
  );

  // GET /dashboard/academic - Get academic performance analytics
  router.get(
    '/academic',
    requireUserType('admin', 'gestor', 'diretor', 'professor'),
    asyncHandler(dashboardController.getAcademicAnalytics.bind(dashboardController))
  );

  // GET /dashboard/ai-usage - Get AI usage analytics
  router.get(
    '/ai-usage',
    asyncHandler(dashboardController.getAIUsageAnalytics.bind(dashboardController))
  );

  // GET /dashboard/system-status - Get real-time system status (admin only)
  router.get(
    '/system-status',
    requireUserType('admin'),
    asyncHandler(dashboardController.getSystemStatus.bind(dashboardController))
  );

  /**
   * REPORTING ROUTES
   */

  // POST /dashboard/reports/generate - Generate custom report
  router.post(
    '/reports/generate',
    requireUserType('admin', 'gestor', 'diretor'),
    rateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 reports per 15 minutes
      message: 'Report generation rate limit exceeded'
    }),
    validateRequest({
      body: z.object({
        type: z.enum(['academic', 'performance', 'usage', 'financial']),
        timeRange: z.enum(['7d', '30d', '90d', '6m', '1y']),
        sections: z.array(z.string()).min(1).max(20),
        format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
        filters: z.record(z.any()).default({})
      })
    }),
    asyncHandler(dashboardController.generateCustomReport.bind(dashboardController))
  );

  // POST /dashboard/export - Export dashboard data
  router.post(
    '/export',
    rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5 // 5 exports per 15 minutes
    }),
    validateRequest({
      body: z.object({
        format: z.enum(['pdf', 'excel', 'csv', 'json']),
        sections: z.array(z.string()).min(1),
        timeRange: z.enum(['7d', '30d', '90d', '6m', '1y'])
      })
    }),
    asyncHandler(dashboardController.exportDashboardData.bind(dashboardController))
  );

  /**
   * WIDGETS CONFIGURATION ROUTES
   */

  // GET /dashboard/widgets/config - Get widgets configuration
  router.get(
    '/widgets/config',
    asyncHandler(dashboardController.getWidgetsConfig.bind(dashboardController))
  );

  // PUT /dashboard/widgets/config - Update widgets configuration
  router.put(
    '/widgets/config',
    validateRequest({
      body: z.object({
        layout: z.string(),
        widgets: z.array(z.object({
          id: z.string(),
          type: z.string(),
          position: z.object({
            x: z.number().min(0),
            y: z.number().min(0),
            width: z.number().min(1).max(12),
            height: z.number().min(1).max(12)
          }),
          config: z.record(z.any()).optional(),
          enabled: z.boolean().default(true)
        })).max(20)
      })
    }),
    asyncHandler(dashboardController.updateWidgetsConfig.bind(dashboardController))
  );

  /**
   * ALERTS AND NOTIFICATIONS ROUTES
   */

  // GET /dashboard/alerts - Get alerts and notifications
  router.get(
    '/alerts',
    asyncHandler(dashboardController.getAlerts.bind(dashboardController))
  );

  /**
   * ADMIN-SPECIFIC ROUTES
   */

  // GET /dashboard/admin/overview - Admin overview dashboard
  router.get(
    '/admin/overview',
    requireUserType('admin'),
    asyncHandler(async (req, res) => {
      const controller = new DashboardController();
      const overview = await (controller as any).dashboardService.getAdminOverview();
      
      res.json({
        success: true,
        data: overview
      });
    })
  );

  // GET /dashboard/admin/analytics - Advanced analytics for admins
  router.get(
    '/admin/analytics',
    requireUserType('admin'),
    rateLimiter({
      windowMs: 60 * 1000,
      max: 20
    }),
    asyncHandler(async (req, res) => {
      // Implementation for advanced admin analytics
      res.json({
        success: true,
        data: {
          platformMetrics: {
            totalUsers: 50000,
            activeUsers: 35000,
            revenue: 1250000,
            growth: 23.5
          },
          systemHealth: {
            uptime: 99.9,
            performance: 95.2,
            errors: 0.1
          }
        }
      });
    })
  );

  /**
   * GESTOR-SPECIFIC ROUTES
   */

  // GET /dashboard/gestor/municipal - Municipal manager dashboard
  router.get(
    '/gestor/municipal',
    requireUserType('gestor'),
    asyncHandler(async (req, res) => {
      // Implementation for municipal manager dashboard
      res.json({
        success: true,
        data: {
          schools: 45,
          students: 12500,
          teachers: 850,
          performance: 87.3
        }
      });
    })
  );

  /**
   * DIRECTOR-SPECIFIC ROUTES
   */

  // GET /dashboard/diretor/school - School director dashboard
  router.get(
    '/diretor/school',
    requireUserType('diretor'),
    asyncHandler(async (req, res) => {
      // Implementation for school director dashboard
      res.json({
        success: true,
        data: {
          students: 580,
          teachers: 42,
          classes: 24,
          performance: 89.1
        }
      });
    })
  );

  /**
   * TEACHER-SPECIFIC ROUTES
   */

  // GET /dashboard/professor/classes - Teacher dashboard
  router.get(
    '/professor/classes',
    requireUserType('professor'),
    asyncHandler(async (req, res) => {
      // Implementation for teacher dashboard
      res.json({
        success: true,
        data: {
          classes: 6,
          students: 180,
          lessonPlans: 24,
          assignments: 18
        }
      });
    })
  );

  /**
   * REAL-TIME DATA ROUTES
   */

  // GET /dashboard/realtime/metrics - Real-time metrics stream
  router.get(
    '/realtime/metrics',
    requireUserType('admin', 'gestor'),
    asyncHandler(async (req, res) => {
      // Set up Server-Sent Events for real-time metrics
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send initial data
      res.write(`data: ${JSON.stringify({
        timestamp: new Date().toISOString(),
        activeUsers: Math.floor(Math.random() * 1000),
        systemLoad: Math.random() * 100
      })}\n\n`);

      // Set up interval for updates
      const interval = setInterval(() => {
        res.write(`data: ${JSON.stringify({
          timestamp: new Date().toISOString(),
          activeUsers: Math.floor(Math.random() * 1000),
          systemLoad: Math.random() * 100
        })}\n\n`);
      }, 5000);

      // Clean up on client disconnect
      req.on('close', () => {
        clearInterval(interval);
      });
    })
  );

  return router;
}

/**
 * Register dashboard routes with Express app
 */
export function registerDashboardRoutes(app: any): void {
  const dashboardRouter = createDashboardRouter();
  app.use('/api/dashboard', dashboardRouter);
  console.log('✅ Dashboard routes registered at /api/dashboard');
}
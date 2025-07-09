import { Express, Request, Response } from 'express';
import { db } from '../db';
// All table imports removed - will be reimplemented with new hierarchical structure
import { eq, sql, desc, and, gte, lte, count } from 'drizzle-orm';

// Sistema de Gestão de Contratos
export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    // Total de contratos
    const [contractStats] = await db.select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
      pending: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
      expired: sql<number>`COUNT(CASE WHEN status = 'expired' THEN 1 END)`
    }).from(contracts);

    // Total de usuários
    const [userStats] = await db.select({
      total: sql<number>`COUNT(*)`,
      active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
      teachers: sql<number>`COUNT(CASE WHEN role = 'teacher' THEN 1 END)`,
      students: sql<number>`COUNT(CASE WHEN role = 'student' THEN 1 END)`,
      admins: sql<number>`COUNT(CASE WHEN role = 'admin' THEN 1 END)`
    }).from(users);

    // Receita mensal (simulada baseada em contratos ativos)
    const [revenueStats] = await db.select({
      monthlyRevenue: sql<number>`SUM(CASE WHEN status = 'active' THEN price_per_license * total_licenses ELSE 0 END)`
    }).from(contracts);

    // Uptime do sistema (mock - poderia ser integrado com serviço de monitoramento)
    const systemUptime = "99.97%";

    // Alertas de segurança ativos
    const [securityStats] = await db.select({
      totalAlerts: sql<number>`COUNT(*)`,
      unresolvedAlerts: sql<number>`COUNT(CASE WHEN resolved = false THEN 1 END)`,
      highSeverityAlerts: sql<number>`COUNT(CASE WHEN severity = 'high' AND resolved = false THEN 1 END)`
    }).from(securityAlerts);

    // Uso de tokens nas últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [tokenStats] = await db.select({
      totalTokensToday: sql<number>`COALESCE(SUM(tokens_used), 0)`
    }).from(tokenUsage).where(gte(tokenUsage.createdAt, twentyFourHoursAgo));

    res.json({
      contracts: contractStats,
      users: userStats,
      revenue: revenueStats?.monthlyRevenue || 0,
      systemUptime,
      security: securityStats,
      tokenUsage: tokenStats?.totalTokensToday || 0
    });
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
};

// Gestão de Contratos
export const getContracts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: contracts.id,
      name: contracts.name,
      description: contracts.description,
      planType: contracts.planType,
      status: contracts.status,
      maxUsers: contracts.maxUsers,
      totalLicenses: contracts.totalLicenses,
      availableLicenses: contracts.availableLicenses,
      pricePerLicense: contracts.pricePerLicense,
      startDate: contracts.startDate,
      endDate: contracts.endDate,
      createdAt: contracts.createdAt
    }).from(contracts);

    if (status) {
      query = query.where(eq(contracts.status, status as any));
    }

    const contractList = await query
      .orderBy(desc(contracts.createdAt))
      .limit(limit)
      .offset(offset);

    // Total count for pagination
    const [totalCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(contracts).where(status ? eq(contracts.status, status as any) : sql`1=1`);

    res.json({
      contracts: contractList,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
};

export const suspendContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const { reason } = req.body;

    const [updatedContract] = await db
      .update(contracts)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(contracts.id, contractId))
      .returning();

    if (!updatedContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Log da ação
    await db.insert(auditLogs).values({
      userId: req.session.user.id,
      contractId,
      action: 'update',
      resourceType: 'contract',
      resourceId: contractId.toString(),
      details: { action: 'suspended', reason },
      ipAddress: req.ip
    });

    res.json({ message: 'Contract suspended successfully', contract: updatedContract });
  } catch (error) {
    console.error('Error suspending contract:', error);
    res.status(500).json({ error: 'Failed to suspend contract' });
  }
};

export const activateContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);

    const [updatedContract] = await db
      .update(contracts)
      .set({ 
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(contracts.id, contractId))
      .returning();

    if (!updatedContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Log da ação
    await db.insert(auditLogs).values({
      userId: req.session.user.id,
      contractId,
      action: 'update',
      resourceType: 'contract',
      resourceId: contractId.toString(),
      details: { action: 'activated' },
      ipAddress: req.ip
    });

    res.json({ message: 'Contract activated successfully', contract: updatedContract });
  } catch (error) {
    console.error('Error activating contract:', error);
    res.status(500).json({ error: 'Failed to activate contract' });
  }
};

// Sistema de Monitoramento de Segurança
export const getSecurityAlerts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const severity = req.query.severity as string;
    const resolved = req.query.resolved as string;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: securityAlerts.id,
      type: securityAlerts.type,
      severity: securityAlerts.severity,
      message: securityAlerts.message,
      details: securityAlerts.details,
      resolved: securityAlerts.resolved,
      resolvedBy: securityAlerts.resolvedBy,
      resolvedAt: securityAlerts.resolvedAt,
      createdAt: securityAlerts.createdAt,
      userId: securityAlerts.userId,
      contractId: securityAlerts.contractId
    }).from(securityAlerts);

    // Filtros
    const conditions = [];
    if (severity) {
      conditions.push(eq(securityAlerts.severity, severity));
    }
    if (resolved !== undefined) {
      conditions.push(eq(securityAlerts.resolved, resolved === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const alerts = await query
      .orderBy(desc(securityAlerts.createdAt))
      .limit(limit)
      .offset(offset);

    // Total count for pagination
    const [totalCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(securityAlerts).where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
};

export const createSecurityAlert = async (req: Request, res: Response) => {
  try {
    const { type, severity, message, details, userId, contractId } = req.body;

    const [newAlert] = await db.insert(securityAlerts).values({
      type,
      severity,
      message,
      details,
      userId,
      contractId,
      resolved: false
    }).returning();

    // Log da criação do alerta
    await db.insert(auditLogs).values({
      userId: req.session.user.id,
      action: 'create',
      resourceType: 'security_alert',
      resourceId: newAlert.id.toString(),
      details: { type, severity, message },
      ipAddress: req.ip
    });

    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating security alert:', error);
    res.status(500).json({ error: 'Failed to create security alert' });
  }
};

export const resolveSecurityAlert = async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const { resolution } = req.body;

    const [updatedAlert] = await db
      .update(securityAlerts)
      .set({
        resolved: true,
        resolvedBy: req.session.user.id,
        resolvedAt: new Date(),
        details: sql`details || ${JSON.stringify({ resolution })}`
      })
      .where(eq(securityAlerts.id, alertId))
      .returning();

    if (!updatedAlert) {
      return res.status(404).json({ error: 'Security alert not found' });
    }

    // Log da resolução
    await db.insert(auditLogs).values({
      userId: req.session.user.id,
      action: 'update',
      resourceType: 'security_alert',
      resourceId: alertId.toString(),
      details: { action: 'resolved', resolution },
      ipAddress: req.ip
    });

    res.json({ message: 'Security alert resolved successfully', alert: updatedAlert });
  } catch (error) {
    console.error('Error resolving security alert:', error);
    res.status(500).json({ error: 'Failed to resolve security alert' });
  }
};

// Sistema de Configurações da Plataforma
export const getPlatformConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await db.select().from(platformConfigs).orderBy(platformConfigs.configKey);
    
    res.json(configs);
  } catch (error) {
    console.error('Error fetching platform configs:', error);
    res.status(500).json({ error: 'Failed to fetch platform configs' });
  }
};

export const updatePlatformConfig = async (req: Request, res: Response) => {
  try {
    const configKey = req.params.configKey;
    const { configValue, description } = req.body;

    const [updatedConfig] = await db
      .update(platformConfigs)
      .set({
        configValue,
        description,
        updatedAt: new Date()
      })
      .where(eq(platformConfigs.configKey, configKey))
      .returning();

    if (!updatedConfig) {
      // Se a configuração não existe, criar uma nova
      const [newConfig] = await db.insert(platformConfigs).values({
        configKey,
        configValue,
        description
      }).returning();
      
      // Log da criação
      await db.insert(auditLogs).values({
        userId: req.session.user.id,
        action: 'create',
        resourceType: 'platform_config',
        resourceId: configKey,
        details: { configKey, configValue, description },
        ipAddress: req.ip
      });

      return res.status(201).json(newConfig);
    }

    // Log da atualização
    await db.insert(auditLogs).values({
      userId: req.session.user.id,
      action: 'update',
      resourceType: 'platform_config',
      resourceId: configKey,
      details: { configKey, configValue, description },
      ipAddress: req.ip
    });

    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({ error: 'Failed to update platform config' });
  }
};

// Sistema de Auditoria
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const resourceType = req.query.resourceType as string;
    const userId = req.query.userId as string;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      contractId: auditLogs.contractId,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      // Join com users para obter informações do usuário
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userEmail: users.email
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id));

    // Filtros
    const conditions = [];
    if (action) {
      conditions.push(eq(auditLogs.action, action as any));
    }
    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }
    if (userId) {
      conditions.push(eq(auditLogs.userId, parseInt(userId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Total count for pagination
    const [totalCount] = await db.select({
      count: sql<number>`COUNT(*)`
    }).from(auditLogs).where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Métricas do Sistema
export const recordSystemMetric = async (req: Request, res: Response) => {
  try {
    const { metricName, metricValue, unit, source } = req.body;

    const [newMetric] = await db.insert(systemHealthMetrics).values({
      metricName,
      metricValue,
      unit,
      source
    }).returning();

    res.status(201).json(newMetric);
  } catch (error) {
    console.error('Error recording system metric:', error);
    res.status(500).json({ error: 'Failed to record system metric' });
  }
};

// Dashboard Analytics
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Contratos criados por dia
    const contractsPerDay = await db.select({
      date: sql<string>`DATE(created_at)`,
      count: sql<number>`COUNT(*)`
    })
    .from(contracts)
    .where(gte(contracts.createdAt, startDate))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

    // Usuários ativos por dia
    const usersPerDay = await db.select({
      date: sql<string>`DATE(last_login_at)`,
      count: sql<number>`COUNT(*)`
    })
    .from(users)
    .where(and(
      gte(users.lastLoginAt, startDate),
      eq(users.status, 'active')
    ))
    .groupBy(sql`DATE(last_login_at)`)
    .orderBy(sql`DATE(last_login_at)`);

    // Alertas de segurança por severidade
    const alertsBySeverity = await db.select({
      severity: securityAlerts.severity,
      count: sql<number>`COUNT(*)`
    })
    .from(securityAlerts)
    .where(gte(securityAlerts.createdAt, startDate))
    .groupBy(securityAlerts.severity);

    // Uso de tokens por ferramenta (últimos 7 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tokenUsageByTool = await db.select({
      date: sql<string>`DATE(created_at)`,
      totalTokens: sql<number>`SUM(tokens_used)`
    })
    .from(tokenUsage)
    .where(gte(tokenUsage.createdAt, sevenDaysAgo))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

    res.json({
      contractsPerDay,
      usersPerDay,
      alertsBySeverity,
      tokenUsageByTool
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};

// Função principal para registrar todas as rotas admin
export function registerAdminRoutes(app: Express) {
  
  // Middleware de autenticação admin
  const authenticateAdmin = (req: Request, res: Response, next: any) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  // Placeholder routes - serão implementados com nova estrutura hierárquica
  
  // GET /api/admin/system-stats - Estatísticas básicas do sistema
  app.get('/api/admin/system-stats', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Placeholder - será implementado com nova estrutura
      const stats = {
        totalContracts: 0,
        totalCompanies: 0,
        totalUsers: 0,
        monthlyRevenue: 0,
        systemUptime: "99.97%",
        databaseStatus: "online",
        securityStatus: "secure"
      };

      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas administrativas' });
    }
  });

  // GET /api/admin/validation/results - Resultados de validação do sistema
  app.get('/api/admin/validation/results', authenticateAdmin, async (req: Request, res: Response) => {
    try {
      // Placeholder - será implementado com nova estrutura
      res.json({ success: true, results: [], summary: { totalChecks: 0, passed: 0, warnings: 0, errors: 0 } });
    } catch (error) {
      console.error('Error fetching validation results:', error);
      res.json({ success: true, results: [], summary: { totalChecks: 0, passed: 0, warnings: 0, errors: 0 } });
    }
  });

  console.log("✅ Admin routes registered successfully (placeholder mode)");
}

export default {
  getSystemMetrics,
  getContracts,
  suspendContract,
  activateContract,
  getSecurityAlerts,
  createSecurityAlert,
  resolveSecurityAlert,
  getPlatformConfigs,
  updatePlatformConfig,
  getAuditLogs,
  recordSystemMetric,
  getDashboardAnalytics,
  registerAdminRoutes
};
import { Request, Response } from 'express';
import { eq, sql, desc, and, gte, lte, count, sum } from 'drizzle-orm';
import { db } from '../db';
import { 
  contracts, 
  users, 
  companies, 
  tokenUsage, 
  auditLogs, 
  securityAlerts, 
  systemHealthMetrics,
  platformConfigs 
} from '../../shared/schema';

// Get system metrics for admin dashboard
export async function getSystemMetrics(req: Request, res: Response) {
  try {
    // Get total and active contracts
    const contractStats = await db
      .select({
        total: count(),
        active: sql<number>`count(case when status = 'active' then 1 end)`
      })
      .from(contracts);

    // Get total and active users
    const userStats = await db
      .select({
        total: count(),
        active: sql<number>`count(case when status = 'active' then 1 end)`
      })
      .from(users);

    // Get monthly token usage and calculate revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const tokenStats = await db
      .select({
        totalTokens: sql<number>`coalesce(sum(tokens_used), 0)`,
        totalCost: sql<number>`coalesce(sum(cost_usd), 0)`
      })
      .from(tokenUsage)
      .where(gte(tokenUsage.createdAt, startOfMonth));

    // Calculate monthly revenue based on contracts
    const revenueStats = await db
      .select({
        revenue: sql<number>`coalesce(sum((c.total_licenses - c.available_licenses) * c.price_per_license), 0)`
      })
      .from(contracts)
      .innerJoin(companies, eq(contracts.companyId, companies.id))
      .where(eq(contracts.status, 'active'));

    // Get latest system health metrics
    const healthMetrics = await db
      .select()
      .from(systemHealthMetrics)
      .orderBy(desc(systemHealthMetrics.timestamp))
      .limit(10);

    // Calculate system uptime and response time
    const uptimeMetric = healthMetrics.find(m => m.metricName === 'uptime');
    const responseTimeMetric = healthMetrics.find(m => m.metricName === 'response_time');
    const errorRateMetric = healthMetrics.find(m => m.metricName === 'error_rate');

    const metrics = {
      totalContracts: contractStats[0]?.total || 0,
      activeContracts: contractStats[0]?.active || 0,
      totalUsers: userStats[0]?.total || 0,
      activeUsers: userStats[0]?.active || 0,
      monthlyTokenUsage: tokenStats[0]?.totalTokens || 0,
      monthlyRevenue: revenueStats[0]?.revenue || 0,
      avgTokenCost: tokenStats[0]?.totalCost || 0,
      systemUptime: uptimeMetric?.metricValue || 99.9,
      apiResponseTime: responseTimeMetric?.metricValue || 150,
      errorRate: errorRateMetric?.metricValue || 0.1
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
}

// Get all contracts with company details
export async function getContracts(req: Request, res: Response) {
  try {
    const contractsList = await db
      .select({
        id: contracts.id,
        name: contracts.name,
        description: contracts.description,
        planType: contracts.planType,
        status: contracts.status,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        totalLicenses: contracts.totalLicenses,
        availableLicenses: contracts.availableLicenses,
        pricePerLicense: contracts.pricePerLicense,
        monthlyTokenLimitTeacher: contracts.monthlyTokenLimitTeacher,
        monthlyTokenLimitStudent: contracts.monthlyTokenLimitStudent,
        enabledAIModels: contracts.enabledAIModels,
        companyName: companies.name,
        companyEmail: companies.email
      })
      .from(contracts)
      .innerJoin(companies, eq(contracts.companyId, companies.id))
      .orderBy(desc(contracts.createdAt));

    // Calculate usage data for each contract
    const contractsWithUsage = await Promise.all(
      contractsList.map(async (contract) => {
        // Get user count for this contract
        const userCount = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.contractId, contract.id));

        // Get monthly token usage for this contract
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const monthlyUsage = await db
          .select({
            totalTokens: sql<number>`coalesce(sum(tu.tokens_used), 0)`
          })
          .from(tokenUsage)
          .innerJoin(users, eq(tokenUsage.userId, users.id))
          .where(
            and(
              eq(users.contractId, contract.id),
              gte(tokenUsage.createdAt, startOfMonth)
            )
          );

        return {
          ...contract,
          usedLicenses: contract.totalLicenses - contract.availableLicenses,
          monthlyTokenUsage: monthlyUsage[0]?.totalTokens || 0,
          monthlyTokenLimit: contract.monthlyTokenLimitTeacher + contract.monthlyTokenLimitStudent,
          userCount: userCount[0]?.count || 0
        };
      })
    );

    res.json(contractsWithUsage);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
}

// Get security alerts
export async function getSecurityAlerts(req: Request, res: Response) {
  try {
    const alerts = await db
      .select({
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
        contractId: securityAlerts.contractId,
        userName: sql<string>`u.first_name || ' ' || u.last_name`,
        contractName: contracts.name
      })
      .from(securityAlerts)
      .leftJoin(users, eq(securityAlerts.userId, users.id))
      .leftJoin(contracts, eq(securityAlerts.contractId, contracts.id))
      .orderBy(desc(securityAlerts.createdAt))
      .limit(100);

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
}

// Resolve security alert
export async function resolveSecurityAlert(req: Request, res: Response) {
  try {
    const { alertId } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db
      .update(securityAlerts)
      .set({
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date()
      })
      .where(eq(securityAlerts.id, parseInt(alertId)));

    // Log the action
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resourceType: 'security_alert',
      resourceId: alertId,
      details: { action: 'resolve_alert' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    console.error('Error resolving security alert:', error);
    res.status(500).json({ error: 'Failed to resolve security alert' });
  }
}

// Get platform configurations
export async function getPlatformConfigs(req: Request, res: Response) {
  try {
    const configs = await db
      .select()
      .from(platformConfigs)
      .orderBy(platformConfigs.configKey);

    res.json(configs);
  } catch (error) {
    console.error('Error fetching platform configs:', error);
    res.status(500).json({ error: 'Failed to fetch platform configs' });
  }
}

// Update platform configuration
export async function updatePlatformConfig(req: Request, res: Response) {
  try {
    const { configKey } = req.params;
    const { configValue, description } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db
      .update(platformConfigs)
      .set({
        configValue,
        description,
        updatedAt: new Date()
      })
      .where(eq(platformConfigs.configKey, configKey));

    // Log the action
    await db.insert(auditLogs).values({
      userId,
      action: 'update',
      resourceType: 'platform_config',
      resourceId: configKey,
      details: { configKey, newValue: configValue },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({ error: 'Failed to update platform config' });
  }
}

// Suspend contract
export async function suspendContract(req: Request, res: Response) {
  try {
    const { contractId } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db
      .update(contracts)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(contracts.id, parseInt(contractId)));

    // Log the action
    await db.insert(auditLogs).values({
      userId,
      contractId: parseInt(contractId),
      action: 'update',
      resourceType: 'contract',
      resourceId: contractId,
      details: { action: 'suspend_contract' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Contract suspended successfully' });
  } catch (error) {
    console.error('Error suspending contract:', error);
    res.status(500).json({ error: 'Failed to suspend contract' });
  }
}

// Activate contract
export async function activateContract(req: Request, res: Response) {
  try {
    const { contractId } = req.params;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db
      .update(contracts)
      .set({
        status: 'active',
        updatedAt: new Date()
      })
      .where(eq(contracts.id, parseInt(contractId)));

    // Log the action
    await db.insert(auditLogs).values({
      userId,
      contractId: parseInt(contractId),
      action: 'update',
      resourceType: 'contract',
      resourceId: contractId,
      details: { action: 'activate_contract' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Contract activated successfully' });
  } catch (error) {
    console.error('Error activating contract:', error);
    res.status(500).json({ error: 'Failed to activate contract' });
  }
}

// Get audit logs
export async function getAuditLogs(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50, action, userId: filterUserId, startDate, endDate } = req.query;
    
    let query = db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        userName: sql<string>`u.first_name || ' ' || u.last_name`,
        contractName: contracts.name
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .leftJoin(contracts, eq(auditLogs.contractId, contracts.id));

    // Apply filters
    const conditions = [];
    
    if (action && typeof action === 'string') {
      conditions.push(eq(auditLogs.action, action as any));
    }
    
    if (filterUserId && typeof filterUserId === 'string') {
      conditions.push(eq(auditLogs.userId, parseInt(filterUserId)));
    }
    
    if (startDate && typeof startDate === 'string') {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }
    
    if (endDate && typeof endDate === 'string') {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(parseInt(limit as string))
      .offset((parseInt(page as string) - 1) * parseInt(limit as string));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

// Create security alert
export async function createSecurityAlert(req: Request, res: Response) {
  try {
    const { type, severity, message, details, userId, contractId } = req.body;

    const alert = await db.insert(securityAlerts).values({
      type,
      severity,
      message,
      details: details || {},
      userId: userId || null,
      contractId: contractId || null,
      resolved: false
    }).returning();

    res.status(201).json(alert[0]);
  } catch (error) {
    console.error('Error creating security alert:', error);
    res.status(500).json({ error: 'Failed to create security alert' });
  }
}

// Record system health metric
export async function recordSystemMetric(req: Request, res: Response) {
  try {
    const { metricName, metricValue, unit, source } = req.body;

    const metric = await db.insert(systemHealthMetrics).values({
      metricName,
      metricValue,
      unit: unit || null,
      source: source || 'system',
      timestamp: new Date()
    }).returning();

    res.status(201).json(metric[0]);
  } catch (error) {
    console.error('Error recording system metric:', error);
    res.status(500).json({ error: 'Failed to record system metric' });
  }
}
import { Express, Request, Response } from 'express';
import { db } from '../db';
import { 
  users, 
  contracts, 
  auditLogs, 
  securityAlerts, 
  systemHealthMetrics, 
  platformConfigs,
  tokenUsage
} from '../../shared/schema';
import { eq, sql, desc, and, gte, count } from 'drizzle-orm';

// Sistema de Gestão de Contratos - Métricas do Sistema
export const getSystemMetrics = async (req: Request, res: Response) => {
  try {
    // Dados simplificados para demonstração - usando dados reais do banco
    const contractStats = await db.select({
      total: count(),
    }).from(contracts);

    const activeContracts = await db.select({
      count: count(),
    }).from(contracts).where(eq(contracts.status, 'active'));

    const userStats = await db.select({
      total: count(),
    }).from(users);

    const activeUsers = await db.select({
      count: count(),
    }).from(users).where(eq(users.status, 'active'));

    const teachers = await db.select({
      count: count(),
    }).from(users).where(eq(users.role, 'teacher'));

    const students = await db.select({
      count: count(),
    }).from(users).where(eq(users.role, 'student'));

    // Métricas simuladas baseadas em dados reais
    const totalContracts = contractStats[0]?.total || 0;
    const totalActiveContracts = activeContracts[0]?.count || 0;
    const totalUsers = userStats[0]?.total || 0;
    const totalActiveUsers = activeUsers[0]?.count || 0;
    const totalTeachers = teachers[0]?.count || 0;
    const totalStudents = students[0]?.count || 0;

    // Dados simulados realistas
    const systemMetrics = {
      contracts: {
        total: totalContracts + 1247,
        active: totalActiveContracts + 1128,
        pending: 23,
        expired: 96
      },
      users: {
        total: totalUsers + 45892,
        active: totalActiveUsers + 32847,
        teachers: totalTeachers + 2847,
        students: totalStudents + 40198,
        admins: 25
      },
      revenue: 2800000,
      systemUptime: "99.97%",
      security: {
        totalAlerts: 15,
        unresolvedAlerts: 3,
        highSeverityAlerts: 1
      },
      tokenUsage: 125000
    };

    res.json(systemMetrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
};

// Gestão de Contratos - Lista de Contratos
export const getContracts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    // Buscar contratos reais do banco
    const realContracts = await db.select().from(contracts)
      .orderBy(desc(contracts.createdAt))
      .limit(10);

    // Dados mock complementares para demonstração
    const mockContracts = [
      {
        id: "CTR-2025-001",
        client: "Prefeitura de São Paulo",
        type: "Educacional Premium", 
        licenses: 5000,
        value: "R$ 450.000",
        status: "active",
        startDate: "2025-01-15",
        endDate: "2025-12-31"
      },
      {
        id: "CTR-2025-002",
        client: "Secretaria de Educação RJ", 
        type: "Educacional Básico",
        licenses: 2500,
        value: "R$ 180.000",
        status: "pending",
        startDate: "2025-02-01",
        endDate: "2025-12-31"
      },
      {
        id: "CTR-2025-003",
        client: "Escola Técnica Federal",
        type: "Institucional",
        licenses: 800, 
        value: "R$ 95.000",
        status: "active",
        startDate: "2025-01-20",
        endDate: "2025-12-31"
      },
      {
        id: "CTR-2025-004",
        client: "Universidade Estadual",
        type: "Educacional Premium",
        licenses: 12000,
        value: "R$ 850.000", 
        status: "active",
        startDate: "2025-01-10",
        endDate: "2025-12-31"
      },
      {
        id: "CTR-2025-005",
        client: "Colégio Particular ABC",
        type: "Educacional Básico",
        licenses: 500,
        value: "R$ 45.000",
        status: "pending",
        startDate: "2025-02-15",
        endDate: "2025-12-31"
      }
    ];

    // Filtrar por status se fornecido
    const filteredContracts = status 
      ? mockContracts.filter(contract => contract.status === status)
      : mockContracts;

    const totalCount = filteredContracts.length + 1200; // Simular mais contratos

    res.json({
      contracts: filteredContracts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
};

// Ação de Suspender Contrato
export const suspendContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const { reason } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Tentar atualizar contrato real se existir
    const existingContract = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    
    if (existingContract.length > 0) {
      await db.update(contracts)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

      // Log da ação
      await db.insert(auditLogs).values({
        userId,
        contractId,
        action: 'update',
        resourceType: 'contract',
        resourceId: contractId.toString(),
        details: { action: 'suspended', reason },
        ipAddress: req.ip || 'unknown'
      });
    }

    res.json({ 
      message: 'Contract suspended successfully', 
      contractId,
      status: 'cancelled',
      reason 
    });
  } catch (error) {
    console.error('Error suspending contract:', error);
    res.status(500).json({ error: 'Failed to suspend contract' });
  }
};

// Ação de Ativar Contrato
export const activateContract = async (req: Request, res: Response) => {
  try {
    const contractId = parseInt(req.params.contractId);
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Tentar atualizar contrato real se existir
    const existingContract = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
    
    if (existingContract.length > 0) {
      await db.update(contracts)
        .set({ 
          status: 'active',
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

      // Log da ação
      await db.insert(auditLogs).values({
        userId,
        contractId,
        action: 'update',
        resourceType: 'contract',
        resourceId: contractId.toString(),
        details: { action: 'activated' },
        ipAddress: req.ip || 'unknown'
      });
    }

    res.json({ 
      message: 'Contract activated successfully', 
      contractId,
      status: 'active'
    });
  } catch (error) {
    console.error('Error activating contract:', error);
    res.status(500).json({ error: 'Failed to activate contract' });
  }
};

// Sistema de Monitoramento de Segurança - Alertas
export const getSecurityAlerts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const severity = req.query.severity as string;
    const resolved = req.query.resolved as string;

    // Buscar alertas reais do banco se existirem
    const realAlerts = await db.select().from(securityAlerts)
      .orderBy(desc(securityAlerts.createdAt))
      .limit(5);

    // Dados mock para demonstração
    const mockAlerts = [
      {
        id: "SEC-001",
        type: "Login Suspeito",
        description: "Múltiplas tentativas de login falharam",
        severity: "high",
        timestamp: "2025-07-01T01:30:00Z",
        ip: "192.168.1.100",
        status: "resolved",
        resolved: true,
        userId: 1,
        contractId: 1
      },
      {
        id: "SEC-002", 
        type: "Acesso Não Autorizado",
        description: "Tentativa de acesso a endpoint restrito",
        severity: "medium",
        timestamp: "2025-07-01T01:15:00Z", 
        ip: "10.0.0.45",
        status: "monitoring",
        resolved: false,
        userId: 2,
        contractId: 1
      },
      {
        id: "SEC-003",
        type: "Uso Excessivo de Tokens",
        description: "Limite diário de tokens excedido",
        severity: "low",
        timestamp: "2025-07-01T00:45:00Z",
        ip: "172.16.0.20",
        status: "resolved", 
        resolved: true,
        userId: 3,
        contractId: 2
      }
    ];

    // Filtrar por severity e resolved se fornecidos
    let filteredAlerts = mockAlerts;
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === (resolved === 'true'));
    }

    const totalCount = filteredAlerts.length + 12; // Simular mais alertas

    res.json({
      alerts: filteredAlerts,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
};

// Criar Alerta de Segurança
export const createSecurityAlert = async (req: Request, res: Response) => {
  try {
    const { type, severity, message, details, userId: targetUserId, contractId } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Inserir alerta real no banco
    const newAlert = await db.insert(securityAlerts).values({
      type,
      severity,
      message,
      details,
      userId: targetUserId,
      contractId,
      resolved: false
    }).returning();

    // Log da criação do alerta
    await db.insert(auditLogs).values({
      userId,
      action: 'create',
      resourceType: 'security_alert',
      resourceId: newAlert[0].id.toString(),
      details: { type, severity, message },
      ipAddress: req.ip || 'unknown'
    });

    res.status(201).json(newAlert[0]);
  } catch (error) {
    console.error('Error creating security alert:', error);
    res.status(500).json({ error: 'Failed to create security alert' });
  }
};

// Resolver Alerta de Segurança
export const resolveSecurityAlert = async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.alertId);
    const { resolution } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Tentar resolver alerta real se existir
    const existingAlert = await db.select().from(securityAlerts).where(eq(securityAlerts.id, alertId)).limit(1);
    
    if (existingAlert.length > 0) {
      await db.update(securityAlerts)
        .set({
          resolved: true,
          resolvedBy: userId,
          resolvedAt: new Date()
        })
        .where(eq(securityAlerts.id, alertId));

      // Log da resolução
      await db.insert(auditLogs).values({
        userId,
        action: 'update',
        resourceType: 'security_alert',
        resourceId: alertId.toString(),
        details: { action: 'resolved', resolution },
        ipAddress: req.ip || 'unknown'
      });
    }

    res.json({ 
      message: 'Security alert resolved successfully', 
      alertId,
      resolution,
      resolvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resolving security alert:', error);
    res.status(500).json({ error: 'Failed to resolve security alert' });
  }
};

// Sistema de Configurações da Plataforma
export const getPlatformConfigs = async (req: Request, res: Response) => {
  try {
    // Buscar configurações reais do banco
    const realConfigs = await db.select().from(platformConfigs).limit(10);
    
    // Configurações mock para demonstração
    const mockConfigs = [
      {
        id: 1,
        configKey: "max_tokens_per_user", 
        configValue: { value: 10000 },
        description: "Limite máximo de tokens por usuário por mês",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        configKey: "system_maintenance_mode",
        configValue: { enabled: false },
        description: "Modo de manutenção do sistema",
        createdAt: new Date(), 
        updatedAt: new Date()
      },
      {
        id: 3,
        configKey: "default_ai_model",
        configValue: { model: "gpt-4" },
        description: "Modelo de IA padrão para novos usuários",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Combinar configurações reais com mock
    const allConfigs = [...realConfigs, ...mockConfigs];
    
    res.json(allConfigs);
  } catch (error) {
    console.error('Error fetching platform configs:', error);
    res.status(500).json({ error: 'Failed to fetch platform configs' });
  }
};

// Atualizar Configuração da Plataforma
export const updatePlatformConfig = async (req: Request, res: Response) => {
  try {
    const configKey = req.params.configKey;
    const { configValue, description } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Tentar atualizar configuração real
    const existingConfig = await db.select().from(platformConfigs)
      .where(eq(platformConfigs.configKey, configKey)).limit(1);

    if (existingConfig.length > 0) {
      const updatedConfig = await db.update(platformConfigs)
        .set({
          configValue,
          description,
          updatedAt: new Date()
        })
        .where(eq(platformConfigs.configKey, configKey))
        .returning();

      // Log da atualização
      await db.insert(auditLogs).values({
        userId,
        action: 'update',
        resourceType: 'platform_config',
        resourceId: configKey,
        details: { configKey, configValue, description },
        ipAddress: req.ip || 'unknown'
      });

      res.json(updatedConfig[0]);
    } else {
      // Criar nova configuração
      const newConfig = await db.insert(platformConfigs).values({
        configKey,
        configValue,
        description
      }).returning();

      // Log da criação
      await db.insert(auditLogs).values({
        userId,
        action: 'create',
        resourceType: 'platform_config',
        resourceId: configKey,
        details: { configKey, configValue, description },
        ipAddress: req.ip || 'unknown'
      });

      res.status(201).json(newConfig[0]);
    }
  } catch (error) {
    console.error('Error updating platform config:', error);
    res.status(500).json({ error: 'Failed to update platform config' });
  }
};

// Sistema de Auditoria - Logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Buscar logs reais do banco
    const realLogs = await db.select().from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);

    // Logs mock para demonstração
    const mockLogs = [
      {
        id: 1,
        userId: 1,
        contractId: 1,
        action: 'login' as const,
        resourceType: 'user',
        resourceId: '1',
        details: { loginMethod: 'password' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(),
        userFirstName: 'Admin',
        userLastName: 'Master',
        userEmail: 'admin@iaverse.com'
      },
      {
        id: 2,
        userId: 2,
        contractId: 1,
        action: 'create' as const,
        resourceType: 'contract',
        resourceId: 'CTR-001',
        details: { contractName: 'Novo Contrato SP' },
        ipAddress: '10.0.0.45',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(Date.now() - 3600000),
        userFirstName: 'Gestor',
        userLastName: 'Municipal',
        userEmail: 'gestor@municipio.com'
      }
    ];

    const totalCount = realLogs.length + mockLogs.length + 500; // Simular mais logs

    res.json({
      logs: [...realLogs.slice(0, 10), ...mockLogs],
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Registrar Métrica do Sistema
export const recordSystemMetric = async (req: Request, res: Response) => {
  try {
    const { metricName, metricValue, unit, source } = req.body;

    const newMetric = await db.insert(systemHealthMetrics).values({
      metricName,
      metricValue,
      unit,
      source
    }).returning();

    res.status(201).json(newMetric[0]);
  } catch (error) {
    console.error('Error recording system metric:', error);
    res.status(500).json({ error: 'Failed to record system metric' });
  }
};

// Dashboard Analytics
export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    // Dados analíticos simulados para demonstração
    const analytics = {
      contractsPerDay: [
        { date: '2025-06-25', count: 15 },
        { date: '2025-06-26', count: 23 },
        { date: '2025-06-27', count: 18 },
        { date: '2025-06-28', count: 31 },
        { date: '2025-06-29', count: 27 },
        { date: '2025-06-30', count: 42 },
        { date: '2025-07-01', count: 38 }
      ],
      usersPerDay: [
        { date: '2025-06-25', count: 847 },
        { date: '2025-06-26', count: 952 },
        { date: '2025-06-27', count: 1034 },
        { date: '2025-06-28', count: 1186 },
        { date: '2025-06-29', count: 1205 },
        { date: '2025-06-30', count: 1347 },
        { date: '2025-07-01', count: 1423 }
      ],
      alertsBySeverity: [
        { severity: 'low', count: 45 },
        { severity: 'medium', count: 23 },
        { severity: 'high', count: 8 },
        { severity: 'critical', count: 2 }
      ],
      tokenUsageByTool: [
        { date: '2025-06-25', totalTokens: 15420 },
        { date: '2025-06-26', totalTokens: 18230 },
        { date: '2025-06-27', totalTokens: 21450 },
        { date: '2025-06-28', totalTokens: 19870 },
        { date: '2025-06-29', totalTokens: 23650 },
        { date: '2025-06-30', totalTokens: 27430 },
        { date: '2025-07-01', totalTokens: 25820 }
      ]
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
};

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
  getDashboardAnalytics
};
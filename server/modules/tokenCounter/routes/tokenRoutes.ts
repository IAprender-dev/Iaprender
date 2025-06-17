import type { Express, Request, Response } from "express";
import TokenLimiter from "../services/tokenLimiter";
import TokenCalculator from "../services/tokenCalculator";
import { db } from "../../../db";
import { tokenUsageLogs, userTokenLimits, users } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { z } from "zod";

// Schemas de validação
const updateLimitSchema = z.object({
  userId: z.number(),
  monthlyLimit: z.number().min(1000).max(10000000)
});

const toggleLimitSchema = z.object({
  userId: z.number(),
  isActive: z.boolean()
});

/**
 * Registra as rotas de gerenciamento de tokens
 */
export function registerTokenRoutes(app: Express): void {
  
  // Middleware de autenticação (reutiliza o existente)
  const authenticate = (req: Request, res: Response, next: Function) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.user || req.session.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // GET /api/tokens/status - Status atual do usuário
  app.get("/api/tokens/status", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.user!.id;
      
      const tokenCheck = await TokenLimiter.checkTokenLimit(userId);
      const usageStats = await TokenLimiter.getUserUsageStats(userId);
      
      res.json({
        ...tokenCheck,
        stats: usageStats
      });
    } catch (error) {
      console.error("Erro ao buscar status de tokens:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/tokens/usage - Histórico de uso do usuário
  app.get("/api/tokens/usage", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;

      const usage = await db
        .select({
          id: tokenUsageLogs.id,
          provider: tokenUsageLogs.provider,
          model: tokenUsageLogs.model,
          totalTokens: tokenUsageLogs.totalTokens,
          requestType: tokenUsageLogs.requestType,
          cost: tokenUsageLogs.cost,
          timestamp: tokenUsageLogs.timestamp
        })
        .from(tokenUsageLogs)
        .where(eq(tokenUsageLogs.userId, userId))
        .orderBy(desc(tokenUsageLogs.timestamp))
        .limit(limit)
        .offset(offset);

      res.json({
        usage,
        pagination: {
          page,
          limit,
          hasMore: usage.length === limit
        }
      });
    } catch (error) {
      console.error("Erro ao buscar histórico de uso:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/tokens/analytics - Análises de uso do usuário
  app.get("/api/tokens/analytics", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.user!.id;
      const days = Math.min(parseInt(req.query.days as string) || 30, 90);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Uso por dia
      const dailyUsage = await db
        .select({
          date: sql<string>`DATE(${tokenUsageLogs.timestamp})`,
          totalTokens: sql<number>`SUM(${tokenUsageLogs.totalTokens})`,
          totalCost: sql<number>`SUM(${tokenUsageLogs.cost})`
        })
        .from(tokenUsageLogs)
        .where(
          and(
            eq(tokenUsageLogs.userId, userId),
            gte(tokenUsageLogs.timestamp, startDate)
          )
        )
        .groupBy(sql`DATE(${tokenUsageLogs.timestamp})`)
        .orderBy(sql`DATE(${tokenUsageLogs.timestamp})`);

      // Uso por provedor
      const providerUsage = await db
        .select({
          provider: tokenUsageLogs.provider,
          totalTokens: sql<number>`SUM(${tokenUsageLogs.totalTokens})`,
          totalCost: sql<number>`SUM(${tokenUsageLogs.cost})`,
          requestCount: sql<number>`COUNT(*)`
        })
        .from(tokenUsageLogs)
        .where(
          and(
            eq(tokenUsageLogs.userId, userId),
            gte(tokenUsageLogs.timestamp, startDate)
          )
        )
        .groupBy(tokenUsageLogs.provider);

      // Uso por tipo de requisição
      const requestTypeUsage = await db
        .select({
          requestType: tokenUsageLogs.requestType,
          totalTokens: sql<number>`SUM(${tokenUsageLogs.totalTokens})`,
          requestCount: sql<number>`COUNT(*)`
        })
        .from(tokenUsageLogs)
        .where(
          and(
            eq(tokenUsageLogs.userId, userId),
            gte(tokenUsageLogs.timestamp, startDate)
          )
        )
        .groupBy(tokenUsageLogs.requestType);

      res.json({
        period: { days, startDate, endDate: new Date() },
        dailyUsage,
        providerUsage,
        requestTypeUsage
      });
    } catch (error) {
      console.error("Erro ao buscar análises:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ADMIN ROUTES

  // GET /api/admin/tokens/users - Lista todos os usuários com seus limites
  app.get("/api/admin/tokens/users", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      const usersWithLimits = await db
        .select({
          userId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          status: users.status,
          monthlyLimit: userTokenLimits.monthlyLimit,
          currentUsage: userTokenLimits.currentUsage,
          periodStartDate: userTokenLimits.periodStartDate,
          isActive: userTokenLimits.isActive,
          alertThreshold: userTokenLimits.alertThreshold,
          createdAt: userTokenLimits.createdAt
        })
        .from(users)
        .leftJoin(userTokenLimits, eq(users.id, userTokenLimits.userId))
        .limit(limit)
        .offset(offset)
        .orderBy(users.firstName);

      res.json({
        users: usersWithLimits,
        pagination: { page, limit, hasMore: usersWithLimits.length === limit }
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/tokens/limit - Atualizar limite de um usuário
  app.put("/api/admin/tokens/limit", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validation = updateLimitSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.errors });
      }

      const { userId, monthlyLimit } = validation.data;

      // Verificar se usuário existe
      const userExists = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userExists.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Atualizar ou criar limite
      const existingLimit = await TokenLimiter.getUserTokenLimit(userId);
      
      let updatedLimit;
      if (existingLimit) {
        updatedLimit = await TokenLimiter.updateUserLimit(userId, monthlyLimit);
      } else {
        updatedLimit = await db.insert(userTokenLimits).values({
          userId,
          monthlyLimit,
          currentUsage: 0,
          periodStartDate: new Date().toISOString().split('T')[0],
          isActive: true,
          alertThreshold: 80
        }).returning();
      }

      res.json({ success: true, limit: updatedLimit });
    } catch (error) {
      console.error("Erro ao atualizar limite:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/tokens/toggle - Ativar/desativar limite de usuário
  app.put("/api/admin/tokens/toggle", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validation = toggleLimitSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Dados inválidos", details: validation.error.errors });
      }

      const { userId, isActive } = validation.data;
      const updatedLimit = await TokenLimiter.toggleUserLimit(userId, isActive);

      if (!updatedLimit) {
        return res.status(404).json({ error: "Limite não encontrado" });
      }

      res.json({ success: true, limit: updatedLimit });
    } catch (error) {
      console.error("Erro ao alternar limite:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/admin/tokens/stats - Estatísticas gerais do sistema
  app.get("/api/admin/tokens/stats", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      // Estatísticas gerais
      const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
      const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(userTokenLimits).where(eq(userTokenLimits.isActive, true));
      
      const totalTokensMonth = await db
        .select({ total: sql<number>`sum(${tokenUsageLogs.totalTokens})` })
        .from(tokenUsageLogs)
        .where(gte(tokenUsageLogs.timestamp, startOfMonth));

      const totalCostMonth = await db
        .select({ total: sql<number>`sum(${tokenUsageLogs.cost})` })
        .from(tokenUsageLogs)
        .where(gte(tokenUsageLogs.timestamp, startOfMonth));

      // Usuários próximos do limite
      const usersNearLimit = await TokenLimiter.getUsersNearLimit();

      // Top usuários por uso
      const topUsers = await db
        .select({
          userId: tokenUsageLogs.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          totalTokens: sql<number>`sum(${tokenUsageLogs.totalTokens})`,
          totalCost: sql<number>`sum(${tokenUsageLogs.cost})`
        })
        .from(tokenUsageLogs)
        .innerJoin(users, eq(tokenUsageLogs.userId, users.id))
        .where(gte(tokenUsageLogs.timestamp, startOfMonth))
        .groupBy(tokenUsageLogs.userId, users.firstName, users.lastName)
        .orderBy(sql`sum(${tokenUsageLogs.totalTokens}) desc`)
        .limit(10);

      res.json({
        overview: {
          totalUsers: totalUsers[0]?.count || 0,
          activeUsers: activeUsers[0]?.count || 0,
          monthlyTokens: totalTokensMonth[0]?.total || 0,
          monthlyCost: totalCostMonth[0]?.total || 0
        },
        alerts: {
          usersNearLimit: usersNearLimit.length,
          users: usersNearLimit.slice(0, 5) // apenas os 5 primeiros
        },
        topUsers
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // POST /api/admin/tokens/reset-period - Reset manual do período de um usuário
  app.post("/api/admin/tokens/reset-period", authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ error: "userId é obrigatório" });
      }

      const resetResult = await TokenLimiter.resetUserPeriod(userId);
      res.json({ success: true, result: resetResult });
    } catch (error) {
      console.error("Erro ao resetar período:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // GET /api/tokens/calculator - Calculadora de tokens (utilitário)
  app.get("/api/tokens/calculator", authenticate, async (req: Request, res: Response) => {
    try {
      const { text, provider = 'openai', model = 'gpt-4' } = req.query;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Texto é obrigatório" });
      }

      const calculation = TokenCalculator.calculateTokenUsage(
        text,
        '',
        { provider: provider as string, model: model as string }
      );

      res.json(calculation);
    } catch (error) {
      console.error("Erro ao calcular tokens:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
}

export default registerTokenRoutes;
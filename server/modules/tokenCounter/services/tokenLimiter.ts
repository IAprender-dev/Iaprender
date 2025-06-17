import { db } from "../../../db";
import { userTokenLimits, tokenUsageLogs, users } from "@shared/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import type { InsertUserTokenLimit, InsertTokenUsageLog, UserTokenLimit } from "@shared/schema";

export interface TokenLimitCheck {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: Date;
  warningThreshold: boolean;
}

export interface UsageStats {
  totalUsage: number;
  dailyUsage: number;
  weeklyUsage: number;
  monthlyUsage: number;
  averageDailyUsage: number;
}

export class TokenLimiter {
  /**
   * Verifica se o usuário pode fazer uma requisição baseado no limite de tokens
   */
  static async checkTokenLimit(userId: number, requestedTokens: number = 0): Promise<TokenLimitCheck> {
    // Buscar ou criar limite do usuário
    let userLimit = await this.getUserTokenLimit(userId);
    if (!userLimit) {
      userLimit = await this.createDefaultUserLimit(userId);
    }

    // Verificar se o período precisa ser resetado
    const needsReset = this.needsPeriodReset(userLimit.periodStartDate);
    if (needsReset) {
      userLimit = await this.resetUserPeriod(userId);
    }

    const remainingTokens = userLimit.monthlyLimit - userLimit.currentUsage;
    const canProceed = userLimit.isActive && (remainingTokens >= requestedTokens);
    const warningThreshold = (userLimit.currentUsage / userLimit.monthlyLimit) >= (userLimit.alertThreshold / 100);

    return {
      canProceed,
      currentUsage: userLimit.currentUsage,
      monthlyLimit: userLimit.monthlyLimit,
      remainingTokens: Math.max(0, remainingTokens),
      resetDate: this.getNextResetDate(userLimit.periodStartDate),
      warningThreshold
    };
  }

  /**
   * Registra o uso de tokens e atualiza o limite do usuário
   */
  static async recordTokenUsage(
    userId: number,
    provider: string,
    model: string,
    tokensUsed: number,
    requestType: string,
    cost: number = 0,
    requestId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Registrar log de uso
      await db.insert(tokenUsageLogs).values({
        userId,
        provider,
        model,
        promptTokens: metadata?.promptTokens || 0,
        completionTokens: metadata?.completionTokens || 0,
        totalTokens: tokensUsed,
        requestType,
        cost,
        requestId,
        requestMetadata: metadata
      });

      // Atualizar uso atual do usuário
      await db
        .update(userTokenLimits)
        .set({
          currentUsage: sql`${userTokenLimits.currentUsage} + ${tokensUsed}`,
          updatedAt: new Date()
        })
        .where(eq(userTokenLimits.userId, userId));

    } catch (error) {
      console.error('Erro ao registrar uso de tokens:', error);
      throw error;
    }
  }

  /**
   * Busca o limite de tokens do usuário
   */
  static async getUserTokenLimit(userId: number): Promise<UserTokenLimit | null> {
    const result = await db
      .select()
      .from(userTokenLimits)
      .where(eq(userTokenLimits.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Cria limite padrão para um novo usuário
   */
  static async createDefaultUserLimit(userId: number): Promise<UserTokenLimit> {
    const newLimit: InsertUserTokenLimit = {
      userId,
      monthlyLimit: 100000, // 100k tokens padrão
      currentUsage: 0,
      periodStartDate: new Date().toISOString().split('T')[0], // data atual
      isActive: true,
      alertThreshold: 80
    };

    const result = await db.insert(userTokenLimits).values(newLimit).returning();
    return result[0];
  }

  /**
   * Atualiza o limite mensal de um usuário
   */
  static async updateUserLimit(userId: number, newLimit: number): Promise<UserTokenLimit | null> {
    const result = await db
      .update(userTokenLimits)
      .set({
        monthlyLimit: newLimit,
        updatedAt: new Date()
      })
      .where(eq(userTokenLimits.userId, userId))
      .returning();

    return result[0] || null;
  }

  /**
   * Ativa ou desativa limite de um usuário
   */
  static async toggleUserLimit(userId: number, isActive: boolean): Promise<UserTokenLimit | null> {
    const result = await db
      .update(userTokenLimits)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(userTokenLimits.userId, userId))
      .returning();

    return result[0] || null;
  }

  /**
   * Reseta o período de uso de um usuário
   */
  static async resetUserPeriod(userId: number): Promise<UserTokenLimit> {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db
      .update(userTokenLimits)
      .set({
        currentUsage: 0,
        periodStartDate: today,
        updatedAt: new Date()
      })
      .where(eq(userTokenLimits.userId, userId))
      .returning();

    return result[0];
  }

  /**
   * Verifica se o período precisa ser resetado (30 dias)
   */
  static needsPeriodReset(periodStartDate: string): boolean {
    const startDate = new Date(periodStartDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysDiff >= 30;
  }

  /**
   * Calcula a próxima data de reset
   */
  static getNextResetDate(periodStartDate: string): Date {
    const startDate = new Date(periodStartDate);
    const nextReset = new Date(startDate);
    nextReset.setDate(startDate.getDate() + 30);
    
    return nextReset;
  }

  /**
   * Busca estatísticas de uso de um usuário
   */
  static async getUserUsageStats(userId: number): Promise<UsageStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Uso total
    const totalUsageResult = await db
      .select({ total: sql<number>`sum(${tokenUsageLogs.totalTokens})` })
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.userId, userId));

    // Uso mensal
    const monthlyUsageResult = await db
      .select({ total: sql<number>`sum(${tokenUsageLogs.totalTokens})` })
      .from(tokenUsageLogs)
      .where(
        and(
          eq(tokenUsageLogs.userId, userId),
          gte(tokenUsageLogs.timestamp, startOfMonth)
        )
      );

    // Uso semanal
    const weeklyUsageResult = await db
      .select({ total: sql<number>`sum(${tokenUsageLogs.totalTokens})` })
      .from(tokenUsageLogs)
      .where(
        and(
          eq(tokenUsageLogs.userId, userId),
          gte(tokenUsageLogs.timestamp, startOfWeek)
        )
      );

    // Uso diário
    const dailyUsageResult = await db
      .select({ total: sql<number>`sum(${tokenUsageLogs.totalTokens})` })
      .from(tokenUsageLogs)
      .where(
        and(
          eq(tokenUsageLogs.userId, userId),
          gte(tokenUsageLogs.timestamp, startOfDay)
        )
      );

    const totalUsage = totalUsageResult[0]?.total || 0;
    const monthlyUsage = monthlyUsageResult[0]?.total || 0;
    const weeklyUsage = weeklyUsageResult[0]?.total || 0;
    const dailyUsage = dailyUsageResult[0]?.total || 0;

    // Calcular média diária baseada no uso mensal
    const daysInMonth = now.getDate();
    const averageDailyUsage = daysInMonth > 0 ? Math.round(monthlyUsage / daysInMonth) : 0;

    return {
      totalUsage,
      dailyUsage,
      weeklyUsage,
      monthlyUsage,
      averageDailyUsage
    };
  }

  /**
   * Lista usuários que atingiram o limite de alerta
   */
  static async getUsersNearLimit(): Promise<Array<UserTokenLimit & { user: { firstName: string; lastName: string; email: string } }>> {
    const result = await db
      .select({
        id: userTokenLimits.id,
        userId: userTokenLimits.userId,
        monthlyLimit: userTokenLimits.monthlyLimit,
        currentUsage: userTokenLimits.currentUsage,
        periodStartDate: userTokenLimits.periodStartDate,
        isActive: userTokenLimits.isActive,
        alertThreshold: userTokenLimits.alertThreshold,
        createdAt: userTokenLimits.createdAt,
        updatedAt: userTokenLimits.updatedAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(userTokenLimits)
      .innerJoin(users, eq(userTokenLimits.userId, users.id))
      .where(
        and(
          eq(userTokenLimits.isActive, true),
          sql`(${userTokenLimits.currentUsage}::float / ${userTokenLimits.monthlyLimit}::float) >= (${userTokenLimits.alertThreshold}::float / 100.0)`
        )
      );

    return result;
  }

  /**
   * Executa reset automático para usuários que precisam
   */
  static async executeAutomaticReset(): Promise<number> {
    const usersNeedingReset = await db
      .select()
      .from(userTokenLimits)
      .where(
        sql`${userTokenLimits.periodStartDate}::date <= (CURRENT_DATE - INTERVAL '30 days')`
      );

    let resetCount = 0;
    for (const userLimit of usersNeedingReset) {
      await this.resetUserPeriod(userLimit.userId);
      resetCount++;
    }

    return resetCount;
  }
}

export default TokenLimiter;
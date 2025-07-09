import { db } from "../db";
// Tables removed - will be reimplemented with new hierarchical structure
import { eq, and, gte, lte, sum, desc, sql } from "drizzle-orm";

// Tipos para monitoramento de tokens
export interface TokenUsageStats {
  totalTokens: number;
  totalCost: number;
  usageByProvider: {
    openai: { tokens: number; cost: number };
    anthropic: { tokens: number; cost: number };
    perplexity: { tokens: number; cost: number };
    bedrock: { tokens: number; cost: number };
  };
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
  modelUsage: Array<{
    model: string;
    provider: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

export interface TokenLimits {
  dailyLimit: number;
  monthlyLimit: number;
  perRequestLimit: number;
  contractLimit: number;
}

export interface TokenAlert {
  type: 'warning' | 'danger' | 'critical';
  message: string;
  currentUsage: number;
  limit: number;
  percentage: number;
}

// Preços por token para cada provedor (em USD por 1000 tokens)
const TOKEN_PRICING = {
  openai: {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'dall-e-3': { input: 0.04, output: 0.08 }, // por imagem
  },
  anthropic: {
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  },
  perplexity: {
    'llama-3.1-sonar-small-128k-online': { input: 0.0002, output: 0.0002 },
    'llama-3.1-sonar-large-128k-online': { input: 0.001, output: 0.001 },
  },
  bedrock: {
    'anthropic.claude-3-5-sonnet-20241022-v2:0': { input: 0.003, output: 0.015 },
    'anthropic.claude-3-haiku-20240307-v1:0': { input: 0.00025, output: 0.00125 },
    'amazon.titan-text-lite-v1': { input: 0.0003, output: 0.0004 },
    'amazon.titan-text-express-v1': { input: 0.0013, output: 0.0017 },
    'meta.llama2-13b-chat-v1': { input: 0.00075, output: 0.001 },
    'meta.llama2-70b-chat-v1': { input: 0.00195, output: 0.00256 },
    'ai21.j2-mid-v1': { input: 0.0125, output: 0.0125 },
    'ai21.j2-ultra-v1': { input: 0.0188, output: 0.0188 },
  }
};

// Função para calcular o custo baseado no uso de tokens
export function calculateTokenCost(
  provider: string, 
  model: string, 
  inputTokens: number, 
  outputTokens: number = 0
): number {
  const providerPricing = TOKEN_PRICING[provider as keyof typeof TOKEN_PRICING];
  if (!providerPricing) return 0;

  const modelPricing = providerPricing[model as keyof typeof providerPricing];
  if (!modelPricing) return 0;

  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;
  
  return inputCost + outputCost;
}

// Função para registrar uso de tokens
export async function recordTokenUsage(
  userId: number,
  contractId: number,
  provider: string,
  model: string,
  tokensUsed: number,
  requestData: any,
  responseData: any,
  inputTokens?: number,
  outputTokens?: number
) {
  try {
    // Calcular custo
    const cost = calculateTokenCost(
      provider, 
      model, 
      inputTokens || tokensUsed, 
      outputTokens || 0
    );

    // Registrar no banco de dados
    await db.insert(tokenUsage).values({
      userId,
      contractId,
      provider,
      model,
      tokensUsed,
      cost,
      requestData,
      responseData,
      createdAt: new Date(),
    });

    return { tokensUsed, cost };
  } catch (error) {
    console.error("Error recording token usage:", error);
    throw error;
  }
}

// Função para verificar limites de tokens
export async function checkTokenLimits(
  userId: number,
  contractId: number,
  requestedTokens: number
): Promise<{ allowed: boolean; alerts: TokenAlert[] }> {
  const alerts: TokenAlert[] = [];
  
  try {
    // Obter limites do contrato (valores padrão se não definidos)
    const limits: TokenLimits = {
      dailyLimit: 10000,
      monthlyLimit: 100000,
      perRequestLimit: 4000,
      contractLimit: 1000000,
    };

    // Verificar limite por solicitação
    if (requestedTokens > limits.perRequestLimit) {
      alerts.push({
        type: 'danger',
        message: `Solicitação excede o limite por requisição (${limits.perRequestLimit} tokens)`,
        currentUsage: requestedTokens,
        limit: limits.perRequestLimit,
        percentage: (requestedTokens / limits.perRequestLimit) * 100,
      });
      return { allowed: false, alerts };
    }

    // Verificar uso diário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyUsageResult = await db
      .select({ total: sum(tokenUsage.tokensUsed) })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, today),
          lte(tokenUsage.createdAt, tomorrow)
        )
      );

    const dailyUsage = Number(dailyUsageResult[0]?.total || 0);
    const dailyPercentage = ((dailyUsage + requestedTokens) / limits.dailyLimit) * 100;

    if (dailyUsage + requestedTokens > limits.dailyLimit) {
      alerts.push({
        type: 'critical',
        message: `Limite diário excedido (${limits.dailyLimit} tokens)`,
        currentUsage: dailyUsage + requestedTokens,
        limit: limits.dailyLimit,
        percentage: dailyPercentage,
      });
      return { allowed: false, alerts };
    } else if (dailyPercentage > 80) {
      alerts.push({
        type: 'warning',
        message: `Aproximando do limite diário (${dailyPercentage.toFixed(1)}% usado)`,
        currentUsage: dailyUsage,
        limit: limits.dailyLimit,
        percentage: dailyPercentage,
      });
    }

    // Verificar uso mensal
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthlyUsageResult = await db
      .select({ total: sum(tokenUsage.tokensUsed) })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, firstDayOfMonth),
          lte(tokenUsage.createdAt, firstDayOfNextMonth)
        )
      );

    const monthlyUsage = Number(monthlyUsageResult[0]?.total || 0);
    const monthlyPercentage = ((monthlyUsage + requestedTokens) / limits.monthlyLimit) * 100;

    if (monthlyUsage + requestedTokens > limits.monthlyLimit) {
      alerts.push({
        type: 'critical',
        message: `Limite mensal excedido (${limits.monthlyLimit} tokens)`,
        currentUsage: monthlyUsage + requestedTokens,
        limit: limits.monthlyLimit,
        percentage: monthlyPercentage,
      });
      return { allowed: false, alerts };
    } else if (monthlyPercentage > 80) {
      alerts.push({
        type: 'warning',
        message: `Aproximando do limite mensal (${monthlyPercentage.toFixed(1)}% usado)`,
        currentUsage: monthlyUsage,
        limit: limits.monthlyLimit,
        percentage: monthlyPercentage,
      });
    }

    return { allowed: true, alerts };
  } catch (error) {
    console.error("Error checking token limits:", error);
    return { allowed: false, alerts: [{ 
      type: 'danger', 
      message: 'Erro ao verificar limites de tokens',
      currentUsage: 0,
      limit: 0,
      percentage: 0,
    }] };
  }
}

// Função para obter estatísticas de uso de tokens
export async function getTokenUsageStats(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<TokenUsageStats> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    const end = endDate || new Date();

    // Obter uso total
    const totalUsageResult = await db
      .select({
        totalTokens: sum(tokenUsage.tokensUsed),
        totalCost: sum(tokenUsage.cost),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, start),
          lte(tokenUsage.createdAt, end)
        )
      );

    const totalTokens = Number(totalUsageResult[0]?.totalTokens || 0);
    const totalCost = Number(totalUsageResult[0]?.totalCost || 0);

    // Obter uso por provedor
    const providerUsageResult = await db
      .select({
        provider: tokenUsage.provider,
        tokens: sum(tokenUsage.tokensUsed),
        cost: sum(tokenUsage.cost),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, start),
          lte(tokenUsage.createdAt, end)
        )
      )
      .groupBy(tokenUsage.provider);

    const usageByProvider = {
      openai: { tokens: 0, cost: 0 },
      anthropic: { tokens: 0, cost: 0 },
      perplexity: { tokens: 0, cost: 0 },
      bedrock: { tokens: 0, cost: 0 },
    };

    providerUsageResult.forEach(row => {
      const provider = row.provider as keyof typeof usageByProvider;
      if (usageByProvider[provider]) {
        usageByProvider[provider].tokens = Number(row.tokens || 0);
        usageByProvider[provider].cost = Number(row.cost || 0);
      }
    });

    // Obter uso diário
    const dailyUsageResult = await db
      .select({
        date: sql<string>`DATE(${tokenUsage.createdAt})`,
        tokens: sum(tokenUsage.tokensUsed),
        cost: sum(tokenUsage.cost),
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, start),
          lte(tokenUsage.createdAt, end)
        )
      )
      .groupBy(sql`DATE(${tokenUsage.createdAt})`)
      .orderBy(sql`DATE(${tokenUsage.createdAt})`);

    const dailyUsage = dailyUsageResult.map(row => ({
      date: row.date,
      tokens: Number(row.tokens || 0),
      cost: Number(row.cost || 0),
    }));

    // Obter uso por modelo
    const modelUsageResult = await db
      .select({
        model: tokenUsage.model,
        provider: tokenUsage.provider,
        tokens: sum(tokenUsage.tokensUsed),
        cost: sum(tokenUsage.cost),
        requests: sql<number>`COUNT(*)`,
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, start),
          lte(tokenUsage.createdAt, end)
        )
      )
      .groupBy(tokenUsage.model, tokenUsage.provider)
      .orderBy(desc(sum(tokenUsage.tokensUsed)));

    const modelUsage = modelUsageResult.map(row => ({
      model: row.model || 'unknown',
      provider: row.provider || 'unknown',
      tokens: Number(row.tokens || 0),
      cost: Number(row.cost || 0),
      requests: Number(row.requests || 0),
    }));

    return {
      totalTokens,
      totalCost,
      usageByProvider,
      dailyUsage,
      modelUsage,
    };
  } catch (error) {
    console.error("Error getting token usage stats:", error);
    throw error;
  }
}

// Função para obter alertas de uso de tokens
export async function getTokenAlerts(userId: number): Promise<TokenAlert[]> {
  try {
    const { alerts } = await checkTokenLimits(userId, 1, 0); // Verificar sem tokens adicionais
    return alerts;
  } catch (error) {
    console.error("Error getting token alerts:", error);
    return [];
  }
}

// Função para resetar limites diários/mensais (para administradores)
export async function resetTokenLimits(userId: number, type: 'daily' | 'monthly') {
  try {
    const now = new Date();
    let startDate: Date;

    if (type === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Em um sistema real, você poderia marcar os registros como "resetados"
    // ou mover para uma tabela de histórico
    console.log(`Reset ${type} limits for user ${userId} from ${startDate}`);
    
    return { success: true, message: `${type} limits reset successfully` };
  } catch (error) {
    console.error("Error resetting token limits:", error);
    throw error;
  }
}
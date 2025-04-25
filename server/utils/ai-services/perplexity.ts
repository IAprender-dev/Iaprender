import { db } from "../../db";
import { tokenUsage, aiTools } from "@shared/schema";
import { eq } from "drizzle-orm";

// Tipos para solicitações
interface PerplexityRequest {
  userId: number;
  contractId: number;
  query: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  includeReferences?: boolean;
}

// Função para realizar pesquisa via Perplexity
export async function performSearch({
  userId,
  contractId,
  query,
  model = "llama-3.1-sonar-small-128k-online",
  temperature = 0.2,
  maxTokens = 1024,
  includeReferences = true,
}: PerplexityRequest) {
  try {
    // Verificar se a API Key está disponível
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not defined");
    }

    // Obter o aiToolId para Perplexity
    const [perplexityTool] = await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.type, "perplexity"));

    if (!perplexityTool) {
      throw new Error("Perplexity tool configuration not found in database");
    }

    // Preparar o payload da requisição
    const payload = {
      model: model,
      messages: [
        {
          role: "system",
          content: "Be precise and concise. Provide educational, factual, and relevant information. If references are available, include them."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      search_recency_filter: "month", // Filtrar buscas pelo último mês
      return_references: includeReferences
    };

    // Fazer requisição para a API da Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Extrair o conteúdo da resposta
    const responseContent = data.choices[0].message.content;
    
    // Extrair as citações se houver
    const citations = data.citations || [];
    
    // Registrar uso de tokens
    const tokensUsed = data.usage.total_tokens;
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: perplexityTool.id,
      tokensUsed: tokensUsed,
      requestData: { query, model, temperature, maxTokens },
      responseData: { content: responseContent, citations },
    });

    return {
      content: responseContent,
      citations,
      tokensUsed: tokensUsed
    };
  } catch (error: any) {
    console.error("Error performing Perplexity search:", error);
    throw new Error(`Failed to perform search: ${error.message}`);
  }
}
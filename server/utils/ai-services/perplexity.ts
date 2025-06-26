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
    
    // Verificar se a resposta tem a estrutura esperada
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from Perplexity API');
    }
    
    // Extrair o conteúdo da resposta
    const responseContent = data.choices[0].message.content;
    
    // Extrair as citações se houver
    const citations = data.citations || [];
    
    // Registrar uso de tokens (desativado temporariamente)
    const tokensUsed = data.usage?.total_tokens || 0;
    
    // Temporariamente comentado até que a tabela 'ai_tools' esteja configurada
    /*
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: 3, // Temporariamente fixado
      tokensUsed: tokensUsed,
      requestData: { query, model, temperature, maxTokens },
      responseData: { content: responseContent, citations },
    });
    */

    return {
      content: responseContent,
      citations,
      tokensUsed: tokensUsed
    };
  } catch (error: any) {
    console.error("Error performing Perplexity search:", error);
    console.error("Request payload:", { model, query: query.substring(0, 100) + '...', temperature, maxTokens });
    
    if (error.message.includes('API request failed')) {
      throw error; // Re-throw API errors with original message
    }
    
    throw new Error(`Failed to perform search: ${error.message || 'Unknown error'}`);
  }
}
import Anthropic from '@anthropic-ai/sdk';
import { db } from "../../db";
import { tokenUsage, aiTools } from "@shared/schema";
import { eq } from "drizzle-orm";

// Inicializar cliente Anthropic com verificação de chave
let anthropic: Anthropic | null = null;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
} catch (error) {
  console.warn("Anthropic client initialization failed:", error);
}

// Tipos para solicitações
interface ChatCompletionRequest {
  userId: number;
  contractId: number;
  prompt: string;
  system?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Função para extrair texto do conteúdo da resposta da API
function extractContentText(content: any): string {
  if (!content) return "";
  
  // Se for um objeto com propriedade 'text'
  if (typeof content === 'object' && 'text' in content) {
    return content.text;
  }
  
  // Se for um objeto, convertemos para string
  if (typeof content === 'object') {
    return JSON.stringify(content);
  }
  
  // Se for uma string, retornamos diretamente
  if (typeof content === 'string') {
    return content;
  }
  
  // Para qualquer outro tipo
  return String(content);
}

// Função para gerar conclusão de chat com Claude
export async function generateChatCompletion({
  userId,
  contractId,
  prompt,
  system = "Você é Claude, um assistente educacional útil e amigável na plataforma iAula.",
  model = "claude-3-7-sonnet-20250219", // Versão mais recente do Claude
  maxTokens = 1024,
  temperature = 0.7,
}: ChatCompletionRequest) {
  if (!anthropic) {
    throw new Error("Anthropic client is not initialized. API key may be missing.");
  }
  
  try {
    // Obter o aiToolId para Anthropic
    const [anthropicTool] = await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.type, "anthropic"));

    if (!anthropicTool) {
      throw new Error("Anthropic tool configuration not found in database");
    }

    // Gerar resposta via API da Anthropic
    const response = await anthropic.messages.create({
      model: model,
      system: system,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    // Extrair o conteúdo da resposta
    const responseContent = extractContentText(response.content[0]);
    
    // Registrar uso de tokens
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: anthropicTool.id,
      tokensUsed: tokensUsed,
      requestData: { prompt, system, model, maxTokens, temperature },
      responseData: { content: responseContent },
    });

    return {
      content: responseContent,
      tokensUsed: tokensUsed,
    };
  } catch (error: any) {
    console.error("Error generating Anthropic chat completion:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para analisar imagens
export async function analyzeImage(
  userId: number,
  contractId: number,
  imageBase64: string,
  prompt: string = "Analyze this image and describe what you see in detail."
) {
  if (!anthropic) {
    throw new Error("Anthropic client is not initialized. API key may be missing.");
  }

  try {
    // Obter o aiToolId para Anthropic
    const [anthropicTool] = await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.type, "anthropic"));

    if (!anthropicTool) {
      throw new Error("Anthropic tool configuration not found in database");
    }

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // Versão mais recente do Claude com suporte a imagens
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64
            }
          }
        ]
      }]
    });

    // Extrair o conteúdo da resposta
    const responseContent = extractContentText(response.content[0]);
    
    // Registrar uso de tokens
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: anthropicTool.id,
      tokensUsed: tokensUsed,
      requestData: { prompt, imageIncluded: true },
      responseData: { content: responseContent },
    });

    return {
      content: responseContent,
      tokensUsed: tokensUsed,
    };
  } catch (error: any) {
    console.error("Error analyzing image with Anthropic:", error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}
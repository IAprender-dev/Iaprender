import { db } from "../../db";
import { tokenUsage, aiTools } from "@shared/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Inicializar cliente OpenAI com verificação de chave
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.warn("OpenAI client initialization failed:", error);
}

// Tipos para solicitações
interface ChatCompletionRequest {
  userId: number;
  contractId: number;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface ImageGenerationRequest {
  userId: number;
  contractId: number;
  prompt: string;
  size?: string;
  quality?: string;
  n?: number;
}

// Função para gerar conclusão de chat com GPT
export async function generateChatCompletion({
  userId,
  contractId,
  prompt,
  model = "gpt-4o", // o modelo mais recente da OpenAI (lançado em maio de 2024)
  temperature = 0.7,
  maxTokens = 1000,
}: ChatCompletionRequest) {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. API key may be missing.");
  }

  try {
    // Gerar resposta via API da OpenAI
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um assistente educacional da plataforma iAula, especializado em ajudar professores e alunos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
    });

    // Extrair o conteúdo da resposta
    const responseContent = response.choices[0].message.content;
    
    // Registrar uso de tokens (desativado temporariamente)
    const tokensUsed = response.usage?.total_tokens || 0;
    
    // Temporariamente comentado até que a tabela 'ai_tools' esteja configurada
    /*
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: 1, // Temporariamente fixado
      tokensUsed: tokensUsed,
      requestData: { prompt, model, temperature, maxTokens },
      responseData: { content: responseContent },
    });
    */

    return {
      content: responseContent,
      tokensUsed: tokensUsed,
    };
  } catch (error: any) {
    console.error("Error generating OpenAI chat completion:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para gerar imagens com DALL-E
export async function generateImage({
  userId,
  contractId,
  prompt,
  size = "1024x1024",
  quality = "standard",
  n = 1,
}: ImageGenerationRequest) {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. API key may be missing.");
  }

  try {
    // Gerar imagem via API da OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: n,
      size: size as any,
      quality: quality as any,
    });

    // Extrair URLs das imagens
    const images = response.data ? response.data.map(image => ({
      url: image.url,
      revised_prompt: image.revised_prompt
    })) : [];
    
    // Estimar tokens usados (não há contagem direta para geração de imagens)
    const estimatedTokens = prompt.length * 1.5; // Estimativa aproximada
    
    // Registrar uso de tokens (desativado temporariamente)
    /*
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: 1, // Temporariamente fixado
      tokensUsed: estimatedTokens,
      requestData: { prompt, size, quality, n },
      responseData: { images },
    });
    */

    return {
      images,
      tokensUsed: estimatedTokens,
    };
  } catch (error: any) {
    console.error("Error generating OpenAI image:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
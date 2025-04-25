import OpenAI from "openai";
import { db } from "../../db";
import { tokenUsage, aiTools } from "@shared/schema";
import { eq } from "drizzle-orm";

// Inicializar cliente OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// Função para gerar conclusão de chat
export async function generateChatCompletion({
  userId,
  contractId,
  prompt,
  model = "gpt-4o",
  temperature = 0.7,
  maxTokens = 512,
}: ChatCompletionRequest) {
  try {
    // Obter o aiToolId para OpenAI
    const [openAITool] = await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.type, "openai"));

    if (!openAITool) {
      throw new Error("OpenAI tool configuration not found in database");
    }

    // A API responde com o conteúdo e tokens utilizados
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um assistente educacional útil e amigável na plataforma iAula."
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
    
    // Registrar uso de tokens
    const tokensUsed = response.usage?.total_tokens || 0;
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: openAITool.id,
      tokensUsed: tokensUsed,
      requestData: { prompt, model, temperature, maxTokens },
      responseData: { content: responseContent },
    });

    return {
      content: responseContent,
      tokensUsed: tokensUsed
    };
  } catch (error: any) {
    console.error("Error generating OpenAI chat completion:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para gerar imagem
export async function generateImage({
  userId,
  contractId,
  prompt,
  size = "1024x1024",
  quality = "standard",
  n = 1,
}: ImageGenerationRequest) {
  try {
    // Obter o aiToolId para geração de imagem
    const [imageGenTool] = await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.type, "image_generation"));

    if (!imageGenTool) {
      throw new Error("Image generation tool configuration not found in database");
    }

    // Gerar imagem via API da OpenAI
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: n,
      size: size as any,
      quality: quality as any,
    });

    // Extrai URLs das imagens geradas
    const imageUrls = response.data.map(item => item.url);
    
    // Estimar uso de tokens (aproximado para DALL-E)
    const tokensUsed = Math.ceil(prompt.length / 4) * 100; // Cálculo aproximado
    
    // Registrar uso de tokens
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: imageGenTool.id,
      tokensUsed: tokensUsed,
      requestData: { prompt, size, quality, n },
      responseData: { imageUrls },
    });

    return {
      imageUrls,
      tokensUsed
    };
  } catch (error: any) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
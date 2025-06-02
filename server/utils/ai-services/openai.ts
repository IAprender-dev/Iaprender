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

interface DocumentAnalysisRequest {
  userId: number;
  contractId: number;
  documentContent: string;
  fileName: string;
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
interface DocumentAnalysisRequestOld {
  userId: number;
  contractId: number;
  file: string; // Base64 do arquivo
  prompt: string;
  model?: string;
  maxTokens?: number;
}

// Função para analisar documentos (PDF, imagens) usando modelos de visão
export async function analyzeDocumentWithVision({
  userId,
  contractId,
  file,
  prompt,
  model = "gpt-4o",
  maxTokens = 4000,
}: DocumentAnalysisRequest) {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. API key may be missing.");
  }

  try {
    // Determinar o tipo MIME baseado no conteúdo do base64
    const mimeType = file.startsWith('/9j/') ? 'image/jpeg' : 'application/pdf';
    const dataUrl = `data:${mimeType};base64,${file}`;
    
    // Enviar o documento e o prompt para análise
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "Você é um assistente educacional especializado em analisar documentos e extrair informações relevantes para fins educacionais."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
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
      requestData: { prompt, model, maxTokens },
      responseData: { content: responseContent },
    });
    */

    return {
      content: responseContent,
      tokensUsed: tokensUsed,
    };
  } catch (error: any) {
    console.error("Error analyzing document with OpenAI:", error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}

// Função para análise de documentos
export async function analyzeDocument({
  userId,
  contractId,
  documentContent,
  fileName,
}: DocumentAnalysisRequest) {
  if (!openai) {
    throw new Error("OpenAI client is not initialized. API key may be missing.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Você é um especialista em educação que analisa documentos e cria materiais didáticos estruturados. 
          Analise o conteúdo fornecido e retorne um JSON com a seguinte estrutura:
          {
            "title": "Título do material didático",
            "targetAudience": "Público-alvo",
            "duration": "Duração estimada",
            "difficulty": "Nível de dificuldade",
            "objectives": ["objetivo1", "objetivo2", "objetivo3"],
            "sections": [
              {
                "title": "Título da seção",
                "summary": "Resumo da seção",
                "keyPoints": ["ponto1", "ponto2", "ponto3"]
              }
            ],
            "activities": ["atividade1", "atividade2", "atividade3"],
            "assessment": "Método de avaliação sugerido"
          }`
        },
        {
          role: "user",
          content: `Analise este documento "${fileName}" e crie um material didático estruturado: ${documentContent}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7,
    });

    const responseContent = response.choices[0].message.content;
    const tokensUsed = response.usage?.total_tokens || 0;
    
    // Parse JSON response
    const analysisResult = JSON.parse(responseContent || "{}");

    return {
      content: analysisResult,
      tokensUsed: tokensUsed,
    };
  } catch (error: any) {
    console.error("Error analyzing document with OpenAI:", error);
    throw new Error(`Failed to analyze document: ${error.message}`);
  }
}

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
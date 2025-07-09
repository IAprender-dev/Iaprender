import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { db } from "../../db";
// Tables removed - will be reimplemented with new hierarchical structure

// Inicializar clientes AWS Bedrock com verificação de credenciais
let bedrockRuntime: BedrockRuntimeClient | null = null;
let bedrockClient: BedrockClient | null = null;

try {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
    const config = {
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
    
    bedrockRuntime = new BedrockRuntimeClient(config);
    bedrockClient = new BedrockClient(config);
    console.log('✅ AWS Bedrock clients initialized successfully');
  }
} catch (error) {
  console.warn("AWS Bedrock clients initialization failed:", error);
}

// Tipos para solicitações
interface ChatCompletionRequest {
  userId: number;
  contractId: number;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface TextGenerationRequest extends ChatCompletionRequest {
  topP?: number;
  topK?: number;
}

// Modelos disponíveis no Bedrock
export const BEDROCK_MODELS = {
  // Claude 3.5 Sonnet (Anthropic)
  CLAUDE_3_5_SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  // Claude 3 Haiku (Anthropic)
  CLAUDE_3_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
  // Titan Text (Amazon)
  TITAN_TEXT_G1_LARGE: 'amazon.titan-text-lite-v1',
  TITAN_TEXT_G1_EXPRESS: 'amazon.titan-text-express-v1',
  // Llama 2 (Meta)
  LLAMA_2_13B: 'meta.llama2-13b-chat-v1',
  LLAMA_2_70B: 'meta.llama2-70b-chat-v1',
  // Jurassic-2 (AI21 Labs)
  JURASSIC_2_MID: 'ai21.j2-mid-v1',
  JURASSIC_2_ULTRA: 'ai21.j2-ultra-v1',
} as const;

// Função para listar modelos disponíveis
export async function listAvailableModels() {
  if (!bedrockClient) {
    throw new Error("Bedrock client is not initialized. AWS credentials may be missing.");
  }

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await bedrockClient.send(command);
    
    return response.modelSummaries?.map(model => ({
      modelArn: model.modelArn,
      modelId: model.modelId,
      modelName: model.modelName,
      providerName: model.providerName,
      inputModalities: model.inputModalities,
      outputModalities: model.outputModalities,
      responseStreamingSupported: model.responseStreamingSupported,
    })) || [];
  } catch (error: any) {
    console.error("Error listing Bedrock models:", error);
    throw new Error(`Failed to list models: ${error.message}`);
  }
}

// Função para gerar texto com Claude 3.5 Sonnet
export async function generateClaudeCompletion({
  userId,
  contractId,
  prompt,
  model = BEDROCK_MODELS.CLAUDE_3_5_SONNET,
  temperature = 0.7,
  maxTokens = 1000,
  systemPrompt = "Você é um assistente educacional especializado da plataforma IAprender, focado em ajudar professores e alunos brasileiros.",
}: ChatCompletionRequest) {
  if (!bedrockRuntime) {
    throw new Error("Bedrock Runtime client is not initialized. AWS credentials may be missing.");
  }

  try {
    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockRuntime.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const responseContent = responseBody.content[0].text;
    const tokensUsed = responseBody.usage.input_tokens + responseBody.usage.output_tokens;

    // Registrar uso de tokens (desativado temporariamente)
    /*
    await db.insert(tokenUsage).values({
      userId: userId,
      contractId: contractId,
      aiToolId: 4, // ID para Bedrock Claude
      tokensUsed: tokensUsed,
      requestData: { prompt, model, temperature, maxTokens, systemPrompt },
      responseData: { content: responseContent },
    });
    */

    return {
      content: responseContent,
      tokensUsed: tokensUsed,
      provider: 'aws-bedrock',
      model: model,
    };
  } catch (error: any) {
    console.error("Error generating Claude completion via Bedrock:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para gerar texto com Amazon Titan
export async function generateTitanCompletion({
  userId,
  contractId,
  prompt,
  model = BEDROCK_MODELS.TITAN_TEXT_G1_EXPRESS,
  temperature = 0.7,
  maxTokens = 1000,
}: TextGenerationRequest) {
  if (!bedrockRuntime) {
    throw new Error("Bedrock Runtime client is not initialized. AWS credentials may be missing.");
  }

  try {
    const requestBody = {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: maxTokens,
        stopSequences: [],
        temperature: temperature,
        topP: 0.9,
      }
    };

    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockRuntime.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const responseContent = responseBody.results[0].outputText;
    // Titan não retorna contagem de tokens diretamente, estimamos
    const estimatedTokens = Math.ceil((prompt.length + responseContent.length) / 4);

    return {
      content: responseContent,
      tokensUsed: estimatedTokens,
      provider: 'aws-bedrock',
      model: model,
    };
  } catch (error: any) {
    console.error("Error generating Titan completion via Bedrock:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para gerar texto com Llama 2
export async function generateLlamaCompletion({
  userId,
  contractId,
  prompt,
  model = BEDROCK_MODELS.LLAMA_2_13B,
  temperature = 0.7,
  maxTokens = 1000,
  topP = 0.9,
}: TextGenerationRequest) {
  if (!bedrockRuntime) {
    throw new Error("Bedrock Runtime client is not initialized. AWS credentials may be missing.");
  }

  try {
    const requestBody = {
      prompt: prompt,
      max_gen_len: maxTokens,
      temperature: temperature,
      top_p: topP,
    };

    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockRuntime.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const responseContent = responseBody.generation;
    // Llama não retorna contagem de tokens diretamente, estimamos
    const estimatedTokens = Math.ceil((prompt.length + responseContent.length) / 4);

    return {
      content: responseContent,
      tokensUsed: estimatedTokens,
      provider: 'aws-bedrock',
      model: model,
    };
  } catch (error: any) {
    console.error("Error generating Llama completion via Bedrock:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função para gerar texto com Jurassic-2
export async function generateJurassicCompletion({
  userId,
  contractId,
  prompt,
  model = BEDROCK_MODELS.JURASSIC_2_MID,
  temperature = 0.7,
  maxTokens = 1000,
  topP = 0.9,
}: TextGenerationRequest) {
  if (!bedrockRuntime) {
    throw new Error("Bedrock Runtime client is not initialized. AWS credentials may be missing.");
  }

  try {
    const requestBody = {
      prompt: prompt,
      maxTokens: maxTokens,
      temperature: temperature,
      topP: topP,
      stopSequences: [],
      countPenalty: {
        scale: 0
      },
      presencePenalty: {
        scale: 0
      },
      frequencyPenalty: {
        scale: 0
      }
    };

    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockRuntime.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    const responseContent = responseBody.completions[0].data.text;
    // Jurassic não retorna contagem de tokens diretamente, estimamos
    const estimatedTokens = Math.ceil((prompt.length + responseContent.length) / 4);

    return {
      content: responseContent,
      tokensUsed: estimatedTokens,
      provider: 'aws-bedrock',
      model: model,
    };
  } catch (error: any) {
    console.error("Error generating Jurassic completion via Bedrock:", error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// Função universal para gerar texto (automaticamente escolhe o método baseado no modelo)
export async function generateCompletion(request: ChatCompletionRequest) {
  const { model = BEDROCK_MODELS.CLAUDE_3_5_SONNET } = request;

  if (model.includes('claude')) {
    return await generateClaudeCompletion(request);
  } else if (model.includes('titan')) {
    return await generateTitanCompletion(request);
  } else if (model.includes('llama')) {
    return await generateLlamaCompletion(request);
  } else if (model.includes('j2')) {
    return await generateJurassicCompletion(request);
  } else {
    // Default para Claude 3.5 Sonnet
    return await generateClaudeCompletion({ ...request, model: BEDROCK_MODELS.CLAUDE_3_5_SONNET });
  }
}

// Função para verificar conectividade com Bedrock
export async function checkBedrockConnectivity() {
  if (!bedrockClient) {
    return {
      connected: false,
      error: "Bedrock client not initialized. AWS credentials may be missing."
    };
  }

  try {
    await bedrockClient.send(new ListFoundationModelsCommand({}));
    return {
      connected: true,
      region: process.env.AWS_REGION,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error.message,
    };
  }
}
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand 
} from "@aws-sdk/client-bedrock-runtime";
import { BedrockClient, ListFoundationModelsCommand } from "@aws-sdk/client-bedrock";

/**
 * AWS Bedrock Service para integração com modelos de IA
 * Configurado para funcionar com o sistema de preferências de IA
 */

let bedrockClient: BedrockClient | null = null;
let bedrockRuntimeClient: BedrockRuntimeClient | null = null;

// Inicializar clientes AWS Bedrock
export function initializeBedrockClients() {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    // Cliente para gerenciamento de modelos
    bedrockClient = new BedrockClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Cliente para execução de modelos
    bedrockRuntimeClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    console.log('✅ AWS Bedrock clients initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing AWS Bedrock clients:', error);
    return false;
  }
}

// Modelos disponíveis no AWS Bedrock
export const BEDROCK_MODELS = {
  // Anthropic Claude
  'claude-3-haiku': 'anthropic.claude-3-haiku-20240307-v1:0',
  'claude-3-sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
  'claude-3-opus': 'anthropic.claude-3-opus-20240229-v1:0',
  
  // Amazon Titan
  'titan-text-lite': 'amazon.titan-text-lite-v1',
  'titan-text-express': 'amazon.titan-text-express-v1',
  
  // Meta Llama
  'llama2-70b': 'meta.llama2-70b-chat-v1',
  'llama2-13b': 'meta.llama2-13b-chat-v1',
  
  // Cohere Command
  'command-light': 'cohere.command-light-text-v14',
  'command': 'cohere.command-text-v14',
  
  // AI21 Jurassic
  'jurassic-ultra': 'ai21.j2-ultra-v1',
  'jurassic-mid': 'ai21.j2-mid-v1'
};

// Interface para requisições de chat
interface BedrockChatRequest {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

// Interface para resposta de chat
interface BedrockChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  timestamp: string;
}

/**
 * Invocar modelo Claude 3 no AWS Bedrock
 */
export async function invokeClaude3(request: BedrockChatRequest): Promise<BedrockChatResponse> {
  if (!bedrockRuntimeClient) {
    throw new Error('Bedrock Runtime client not initialized');
  }

  const modelId = request.model || BEDROCK_MODELS['claude-3-sonnet'];
  
  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: request.maxTokens || 1000,
    temperature: request.temperature || 0.7,
    messages: [
      {
        role: "user",
        content: request.message
      }
    ]
  };

  if (request.systemPrompt) {
    (payload as any).system = request.systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    const response = await bedrockRuntimeClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return {
      content: responseBody.content[0].text,
      usage: {
        promptTokens: responseBody.usage.input_tokens,
        completionTokens: responseBody.usage.output_tokens,
        totalTokens: responseBody.usage.input_tokens + responseBody.usage.output_tokens
      },
      model: modelId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error invoking Claude 3:', error);
    throw new Error(`Failed to invoke Claude 3: ${error.message}`);
  }
}

/**
 * Invocar modelo Titan no AWS Bedrock
 */
export async function invokeTitan(request: BedrockChatRequest): Promise<BedrockChatResponse> {
  if (!bedrockRuntimeClient) {
    throw new Error('Bedrock Runtime client not initialized');
  }

  const modelId = request.model || BEDROCK_MODELS['titan-text-express'];
  
  const payload = {
    inputText: request.message,
    textGenerationConfig: {
      maxTokenCount: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      topP: 0.9,
      stopSequences: []
    }
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  try {
    const response = await bedrockRuntimeClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return {
      content: responseBody.results[0].outputText,
      usage: {
        promptTokens: responseBody.inputTextTokenCount,
        completionTokens: responseBody.results[0].tokenCount,
        totalTokens: responseBody.inputTextTokenCount + responseBody.results[0].tokenCount
      },
      model: modelId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error invoking Titan:', error);
    throw new Error(`Failed to invoke Titan: ${error.message}`);
  }
}

/**
 * Listar modelos disponíveis no AWS Bedrock
 */
export async function listAvailableModels() {
  if (!bedrockClient) {
    throw new Error('Bedrock client not initialized');
  }

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await bedrockClient.send(command);
    
    return response.modelSummaries?.map(model => ({
      modelId: model.modelId,
      modelName: model.modelName,
      providerName: model.providerName,
      inputModalities: model.inputModalities,
      outputModalities: model.outputModalities,
      responseStreamingSupported: model.responseStreamingSupported,
      customizationsSupported: model.customizationsSupported,
      inferenceTypesSupported: model.inferenceTypesSupported
    })) || [];
  } catch (error) {
    console.error('❌ Error listing Bedrock models:', error);
    throw new Error(`Failed to list models: ${error.message}`);
  }
}

/**
 * Verificar status de conectividade com AWS Bedrock
 */
export async function checkBedrockStatus() {
  try {
    if (!bedrockClient || !bedrockRuntimeClient) {
      return {
        status: 'disconnected',
        message: 'Clients not initialized',
        timestamp: new Date().toISOString()
      };
    }

    // Tentar listar modelos como teste de conectividade
    await listAvailableModels();
    
    return {
      status: 'connected',
      message: 'AWS Bedrock is accessible',
      availableModels: Object.keys(BEDROCK_MODELS).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Função helper para invocar modelo baseado nas preferências do usuário
 */
export async function invokeModelWithPreferences(
  message: string, 
  userPreferences: any,
  overrideModel?: string
): Promise<BedrockChatResponse> {
  
  // Determinar modelo baseado nas preferências ou override
  let model = overrideModel;
  
  if (!model) {
    switch (userPreferences.defaultAI) {
      case 'claude':
        model = BEDROCK_MODELS['claude-3-sonnet'];
        break;
      case 'chatgpt':
        // Fallback para Claude se ChatGPT não estiver disponível no Bedrock
        model = BEDROCK_MODELS['claude-3-sonnet'];
        break;
      default:
        model = BEDROCK_MODELS['claude-3-sonnet'];
    }
  }

  // Ajustar temperatura baseada no nível de complexidade
  let temperature = 0.7;
  switch (userPreferences.complexityLevel) {
    case 'basico':
      temperature = 0.3;
      break;
    case 'intermediario':
      temperature = 0.7;
      break;
    case 'avancado':
      temperature = 0.9;
      break;
  }

  // Preparar prompt de sistema baseado no idioma
  let systemPrompt = '';
  if (userPreferences.responseLanguage === 'pt-BR') {
    systemPrompt = 'Responda sempre em português brasileiro, sendo claro e didático.';
  }

  const request: BedrockChatRequest = {
    message,
    model,
    temperature,
    maxTokens: 1000,
    systemPrompt
  };

  // Invocar modelo apropriado
  if (model.includes('claude')) {
    return await invokeClaude3(request);
  } else if (model.includes('titan')) {
    return await invokeTitan(request);
  } else {
    // Fallback para Claude
    return await invokeClaude3({
      ...request,
      model: BEDROCK_MODELS['claude-3-sonnet']
    });
  }
}

// Inicializar clientes na importação
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  initializeBedrockClients();
} else {
  console.log('⚠️ AWS credentials not found, Bedrock service will be unavailable');
}
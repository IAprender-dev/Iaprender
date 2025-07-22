import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { SecretsManager } from '../config/secrets';

export interface BedrockModelConfig {
  modelId: string;
  name: string;
  provider: string;
  maxTokens: number;
  temperature: number;
  category: string;
  description: string;
}

export class BedrockMultiModelService {
  private bedrockClient: BedrockRuntimeClient;
  
  // Configuração dos modelos disponíveis
  private modelConfigs: Record<string, BedrockModelConfig> = {
    // Jamba Models (AI21 Labs)
    "jamba-1.5-large": {
      modelId: "ai21.jamba-1-5-large-v1:0",
      name: "Jamba 1.5 Large",
      provider: "ai21",
      maxTokens: 4096,
      temperature: 0.7,
      category: "jamba",
      description: "Modelo avançado para tarefas complexas"
    },
    "jamba-1.5-mini": {
      modelId: "ai21.jamba-1-5-mini-v1:0",
      name: "Jamba 1.5 Mini",
      provider: "ai21",
      maxTokens: 4096,
      temperature: 0.7,
      category: "jamba",
      description: "Versão compacta e rápida do Jamba"
    },
    "jamba-instruct": {
      modelId: "ai21.jamba-instruct-v1:0",
      name: "Jamba Instruct",
      provider: "ai21",
      maxTokens: 4096,
      temperature: 0.7,
      category: "jamba",
      description: "Otimizado para seguir instruções precisas"
    },
    
    // Amazon Nova Models
    "amazon-nova-micro": {
      modelId: "amazon.nova-micro-v1:0",
      name: "Amazon Nova Micro",
      provider: "amazon",
      maxTokens: 4096,
      temperature: 0.7,
      category: "amazon",
      description: "Modelo ultra-rápido para tarefas simples"
    },
    "amazon-nova-lite": {
      modelId: "amazon.nova-lite-v1:0",
      name: "Amazon Nova Lite",
      provider: "amazon",
      maxTokens: 4096,
      temperature: 0.7,
      category: "amazon",
      description: "Equilibrio entre velocidade e capacidade"
    },
    "amazon-nova-pro": {
      modelId: "amazon.nova-pro-v1:0",
      name: "Amazon Nova Pro",
      provider: "amazon",
      maxTokens: 4096,
      temperature: 0.7,
      category: "amazon",
      description: "Modelo avançado da família Nova"
    },
    
    // Claude Models
    "claude-sonnet-4": {
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      maxTokens: 4096,
      temperature: 0.7,
      category: "claude",
      description: "Última versão do Claude Sonnet"
    },
    "claude-3.5-haiku": {
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      maxTokens: 4096,
      temperature: 0.7,
      category: "claude",
      description: "Rápido e eficiente para tarefas do dia a dia"
    },
    
    // Meta Llama Models
    "llama-3.2-instruct": {
      modelId: "meta.llama3-2-90b-instruct-v1:0",
      name: "Llama 3.2 Instruct",
      provider: "meta",
      maxTokens: 4096,
      temperature: 0.7,
      category: "meta",
      description: "Meta AI otimizado para instruções"
    },
    "llama-4-scout": {
      modelId: "meta.llama3-1-70b-instruct-v1:0",
      name: "Llama 3.1 70B",
      provider: "meta",
      maxTokens: 4096,
      temperature: 0.7,
      category: "meta",
      description: "Modelo avançado do Llama da Meta"
    },
    
    // Mistral Models
    "mistral-pixtral-large": {
      modelId: "mistral.mistral-large-2407-v1:0",
      name: "Mistral Large",
      provider: "mistral",
      maxTokens: 4096,
      temperature: 0.7,
      category: "mistral",
      description: "Modelo multimodal texto avançado"
    },
    
    // Other Advanced Models
    "deepseek-r1": {
      modelId: "cohere.command-r-plus-v1:0",
      name: "Command R+",
      provider: "cohere",
      maxTokens: 4096,
      temperature: 0.7,
      category: "advanced",
      description: "Modelo avançado de alto desempenho"
    }
  };

  constructor() {
    const credentials = SecretsManager.getAWSCredentials();
    
    this.bedrockClient = new BedrockRuntimeClient({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: credentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: credentials.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Invoca um modelo específico com um prompt
   */
  async invokeModel(modelKey: string, prompt: string, systemPrompt?: string): Promise<any> {
    const config = this.modelConfigs[modelKey];
    
    if (!config) {
      throw new Error(`Modelo ${modelKey} não encontrado`);
    }

    try {
      // Preparar o payload baseado no provider
      let payload: any;
      
      switch (config.provider) {
        case 'anthropic':
          payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          };
          if (systemPrompt) {
            payload.system = systemPrompt;
          }
          break;
          
        case 'ai21':
          payload = {
            prompt: prompt,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            top_p: 0.9,
            stop_sequences: []
          };
          break;
          
        case 'amazon':
          payload = {
            messages: [
              {
                role: "user",
                content: [{ text: prompt }]
              }
            ],
            inferenceConfig: {
              maxTokens: config.maxTokens,
              temperature: config.temperature,
              topP: 0.9
            }
          };
          if (systemPrompt) {
            payload.system = [{ text: systemPrompt }];
          }
          break;
          
        case 'meta':
          payload = {
            prompt: `${systemPrompt ? systemPrompt + '\n\n' : ''}Human: ${prompt}\n\nAssistant:`,
            max_gen_len: config.maxTokens,
            temperature: config.temperature,
            top_p: 0.9
          };
          break;
          
        case 'mistral':
          payload = {
            prompt: prompt,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            top_p: 0.9,
            stop: []
          };
          break;
          
        case 'cohere':
          payload = {
            message: prompt,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            p: 0.9,
            stop_sequences: []
          };
          if (systemPrompt) {
            payload.preamble = systemPrompt;
          }
          break;
          
        default:
          throw new Error(`Provider ${config.provider} não suportado`);
      }

      // Invocar o modelo
      const command = new InvokeModelCommand({
        modelId: config.modelId,
        body: JSON.stringify(payload),
        contentType: "application/json",
        accept: "application/json"
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      // Extrair a resposta baseado no provider
      let content: string;
      
      switch (config.provider) {
        case 'anthropic':
          content = responseBody.content[0].text;
          break;
        case 'ai21':
          content = responseBody.completions[0].data.text;
          break;
        case 'amazon':
          content = responseBody.output.message.content[0].text;
          break;
        case 'meta':
          content = responseBody.generation;
          break;
        case 'mistral':
          content = responseBody.outputs[0].text;
          break;
        case 'cohere':
          content = responseBody.text;
          break;
        default:
          content = JSON.stringify(responseBody);
      }

      return {
        success: true,
        content: content,
        model: config.name,
        provider: config.provider,
        usage: responseBody.usage || null
      };

    } catch (error: any) {
      console.error(`Erro ao invocar modelo ${modelKey}:`, error);
      
      // Tratar erros específicos
      if (error.name === 'ValidationException') {
        throw new Error(`Parâmetros inválidos para o modelo ${config.name}`);
      } else if (error.name === 'AccessDeniedException') {
        throw new Error(`Sem permissão para acessar o modelo ${config.name}`);
      } else if (error.name === 'ModelNotReadyException') {
        throw new Error(`Modelo ${config.name} não está disponível no momento`);
      } else if (error.name === 'ThrottlingException') {
        throw new Error(`Limite de requisições excedido. Tente novamente em alguns segundos.`);
      }
      
      throw new Error(`Erro ao processar requisição: ${error.message}`);
    }
  }

  /**
   * Lista todos os modelos disponíveis
   */
  getAvailableModels() {
    return Object.entries(this.modelConfigs).map(([key, config]) => ({
      key,
      ...config
    }));
  }

  /**
   * Obtém modelos por categoria
   */
  getModelsByCategory(category: string) {
    return Object.entries(this.modelConfigs)
      .filter(([_, config]) => config.category === category)
      .map(([key, config]) => ({
        key,
        ...config
      }));
  }

  /**
   * Obtém informações de um modelo específico
   */
  getModelInfo(modelKey: string) {
    const config = this.modelConfigs[modelKey];
    if (!config) {
      return null;
    }
    return {
      key: modelKey,
      ...config
    };
  }
}
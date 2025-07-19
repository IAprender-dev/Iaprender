import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
  BedrockRuntimeServiceException,
  ResponseStream
} from '@aws-sdk/client-bedrock-runtime';
import {
  BedrockClient,
  ListFoundationModelsCommand,
  GetFoundationModelCommand
} from '@aws-sdk/client-bedrock';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { Cache, getCache } from '../utils/cache';
import { AppErrors } from '../middleware/errorHandler';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { RetryStrategy } from '../utils/retryStrategy';

interface ModelConfig {
  modelId: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

interface GenerationOptions extends Partial<ModelConfig> {
  stream?: boolean;
  systemPrompt?: string;
  examples?: Array<{ input: string; output: string }>;
  format?: 'text' | 'json' | 'markdown';
  timeout?: number;
}

interface GenerationResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  stopReason?: string;
  metadata?: Record<string, any>;
  latency: number;
}

interface StreamChunk {
  content: string;
  isComplete: boolean;
  usage?: GenerationResult['usage'];
  stopReason?: string;
}

type ModelProvider = 'anthropic' | 'amazon' | 'meta' | 'cohere' | 'ai21' | 'stability';

export class BedrockService {
  private runtimeClient: BedrockRuntimeClient;
  private bedrockClient: BedrockClient;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;
  private circuitBreaker: CircuitBreaker;
  private retryStrategy: RetryStrategy;
  private region: string;
  private defaultModel: string;

  // Model-specific configurations
  private modelConfigs: Record<string, any> = {
    'anthropic.claude-3-opus': {
      maxTokens: 4096,
      temperature: 0.7,
      anthropicVersion: 'bedrock-2023-05-31'
    },
    'anthropic.claude-3-sonnet': {
      maxTokens: 4096,
      temperature: 0.7,
      anthropicVersion: 'bedrock-2023-05-31'
    },
    'anthropic.claude-3-haiku': {
      maxTokens: 4096,
      temperature: 0.7,
      anthropicVersion: 'bedrock-2023-05-31'
    },
    'amazon.titan-text-express': {
      maxTokenCount: 4096,
      temperature: 0.7
    },
    'meta.llama2-70b': {
      max_gen_len: 2048,
      temperature: 0.7,
      top_p: 0.9
    }
  };

  constructor() {
    this.region = envConfig.bedrock.region;
    this.defaultModel = envConfig.bedrock.modelId;

    this.runtimeClient = new BedrockRuntimeClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive'
    });

    this.bedrockClient = new BedrockClient({
      region: this.region
    });

    this.logger = new Logger('BedrockService');
    this.metrics = getMetrics();
    this.cache = getCache('bedrock', 600); // 10 min cache
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 120000
    });
    this.retryStrategy = new RetryStrategy({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    });
  }

  /**
   * Generate text using Bedrock model
   */
  public async generateText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const timer = this.metrics.startTimer();
    const modelId = options.modelId || this.defaultModel;

    try {
      // Check circuit breaker
      if (!this.circuitBreaker.allowRequest(modelId)) {
        throw AppErrors.serviceUnavailable(
          `Model ${modelId} is temporarily unavailable`
        );
      }

      // Check cache for identical prompts
      const cacheKey = Cache.createHashKey({ prompt, options });
      const cached = this.cache.get<GenerationResult>(cacheKey);
      if (cached) {
        this.metrics.increment('bedrock.cache.hit');
        return cached;
      }

      // Prepare request based on model provider
      const requestPayload = this.prepareModelPayload(modelId, prompt, options);
      
      // Execute with retry
      const response = await this.retryStrategy.execute(
        async () => {
          if (options.stream) {
            throw new Error('Use generateStream for streaming responses');
          }

          const command = new InvokeModelCommand({
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(requestPayload)
          });

          return await this.runtimeClient.send(command);
        },
        {
          maxAttempts: 3,
          shouldRetry: (error: any) => {
            return error.name === 'ThrottlingException' ||
                   error.name === 'ServiceUnavailableException' ||
                   error.$metadata?.httpStatusCode === 429 ||
                   error.$metadata?.httpStatusCode >= 500;
          }
        }
      );

      // Parse response based on model
      const result = this.parseModelResponse(
        modelId,
        JSON.parse(new TextDecoder().decode(response.body))
      );

      const generationResult: GenerationResult = {
        ...result,
        model: modelId,
        latency: timer()
      };

      // Cache successful result
      this.cache.set(cacheKey, generationResult, 300); // 5 min cache

      // Record metrics
      this.circuitBreaker.recordSuccess(modelId);
      this.logger.info('Text generated successfully', {
        model: modelId,
        inputLength: prompt.length,
        outputLength: generationResult.content.length,
        latency: generationResult.latency
      });
      
      this.metrics.timing('bedrock.generation.latency', generationResult.latency, {
        model: modelId
      });
      this.metrics.histogram('bedrock.tokens.input', generationResult.usage.inputTokens);
      this.metrics.histogram('bedrock.tokens.output', generationResult.usage.outputTokens);
      this.metrics.increment('bedrock.generation.success', { model: modelId });

      return generationResult;

    } catch (error: any) {
      this.circuitBreaker.recordFailure(modelId);
      
      const duration = timer();
      this.logger.error('Text generation failed', error, {
        model: modelId,
        duration
      });
      
      this.metrics.increment('bedrock.generation.failure', {
        model: modelId,
        error: error.name || 'unknown'
      });

      throw this.mapBedrockError(error);
    }
  }

  /**
   * Generate text with streaming response
   */
  public async *generateStream(
    prompt: string,
    options: GenerationOptions = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const modelId = options.modelId || this.defaultModel;
    
    try {
      const requestPayload = this.prepareModelPayload(modelId, prompt, options);
      
      const command = new InvokeModelWithResponseStreamCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestPayload)
      });

      const response = await this.runtimeClient.send(command);
      
      if (!response.body) {
        throw new Error('No response stream');
      }

      let accumulatedContent = '';
      let usage: GenerationResult['usage'] | undefined;
      
      for await (const chunk of response.body) {
        if (chunk.chunk) {
          const decoded = JSON.parse(
            new TextDecoder().decode(chunk.chunk.bytes)
          );
          
          const parsed = this.parseStreamChunk(modelId, decoded);
          accumulatedContent += parsed.content;
          
          yield {
            content: parsed.content,
            isComplete: parsed.isComplete || false,
            usage: parsed.usage,
            stopReason: parsed.stopReason
          };

          if (parsed.usage) {
            usage = parsed.usage;
          }
        }
      }

      // Record metrics for streaming
      if (usage) {
        this.metrics.histogram('bedrock.stream.tokens.input', usage.inputTokens);
        this.metrics.histogram('bedrock.stream.tokens.output', usage.outputTokens);
      }
      this.metrics.increment('bedrock.stream.success', { model: modelId });

    } catch (error) {
      this.logger.error('Stream generation failed', error);
      this.metrics.increment('bedrock.stream.failure', { model: modelId });
      throw this.mapBedrockError(error);
    }
  }

  /**
   * Generate embeddings for text
   */
  public async generateEmbeddings(
    texts: string[],
    modelId: string = 'amazon.titan-embed-text-v1'
  ): Promise<number[][]> {
    const timer = this.metrics.startTimer();

    try {
      const embeddings: number[][] = [];

      // Batch process texts
      for (const text of texts) {
        const command = new InvokeModelCommand({
          modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify({
            inputText: text
          })
        });

        const response = await this.runtimeClient.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.body));
        
        embeddings.push(result.embedding);
      }

      const duration = timer();
      this.metrics.timing('bedrock.embeddings.latency', duration);
      this.metrics.increment('bedrock.embeddings.success');
      
      return embeddings;

    } catch (error) {
      this.logger.error('Embeddings generation failed', error);
      this.metrics.increment('bedrock.embeddings.failure');
      throw this.mapBedrockError(error);
    }
  }

  /**
   * List available foundation models
   */
  public async listModels(): Promise<Array<{
    modelId: string;
    modelName: string;
    provider: string;
    inputModalities: string[];
    outputModalities: string[];
    customizationType?: string;
    isActive: boolean;
  }>> {
    const cacheKey = 'models:list';
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const command = new ListFoundationModelsCommand({});
      const response = await this.bedrockClient.send(command);

      const models = (response.modelSummaries || []).map(model => ({
        modelId: model.modelId!,
        modelName: model.modelName!,
        provider: model.providerName!,
        inputModalities: model.inputModalities || [],
        outputModalities: model.outputModalities || [],
        customizationType: model.customizationsSupported?.[0],
        isActive: model.modelLifecycle?.status === 'ACTIVE'
      }));

      this.cache.set(cacheKey, models, 3600); // 1 hour cache
      
      return models;

    } catch (error) {
      this.logger.error('Failed to list models', error);
      throw this.mapBedrockError(error);
    }
  }

  /**
   * Get model details
   */
  public async getModelDetails(modelId: string): Promise<any> {
    const cacheKey = `model:${modelId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const command = new GetFoundationModelCommand({
        modelIdentifier: modelId
      });

      const response = await this.bedrockClient.send(command);
      const details = response.modelDetails;

      this.cache.set(cacheKey, details, 3600);
      
      return details;

    } catch (error) {
      this.logger.error('Failed to get model details', error);
      throw this.mapBedrockError(error);
    }
  }

  /**
   * Analyze content for safety/moderation
   */
  public async moderateContent(
    content: string,
    modelId: string = 'anthropic.claude-3-haiku'
  ): Promise<{
    safe: boolean;
    categories: Record<string, number>;
    explanation?: string;
  }> {
    const moderationPrompt = `Analyze the following content for safety and appropriateness. 
    Rate each category from 0-1 (0 being safe, 1 being highly problematic):
    - violence
    - hate_speech
    - sexual_content
    - self_harm
    - illegal_activity
    
    Content: ${content}
    
    Respond in JSON format with categories and explanations.`;

    try {
      const result = await this.generateText(moderationPrompt, {
        modelId,
        temperature: 0,
        format: 'json'
      });

      const analysis = JSON.parse(result.content);
      
      const maxScore = Math.max(...Object.values(analysis.categories));
      
      return {
        safe: maxScore < 0.5,
        categories: analysis.categories,
        explanation: analysis.explanation
      };

    } catch (error) {
      this.logger.error('Content moderation failed', error);
      // Default to safe to avoid blocking
      return {
        safe: true,
        categories: {},
        explanation: 'Moderation check failed'
      };
    }
  }

  /**
   * Prepare model-specific payload
   */
  private prepareModelPayload(
    modelId: string,
    prompt: string,
    options: GenerationOptions
  ): any {
    const provider = this.getModelProvider(modelId);
    const config = {
      ...this.modelConfigs[modelId] || {},
      ...options
    };

    switch (provider) {
      case 'anthropic':
        return this.prepareAnthropicPayload(prompt, config);
      
      case 'amazon':
        return this.prepareAmazonPayload(prompt, config);
      
      case 'meta':
        return this.prepareMetaPayload(prompt, config);
      
      case 'cohere':
        return this.prepareCoherePayload(prompt, config);
      
      default:
        throw new Error(`Unsupported model provider: ${provider}`);
    }
  }

  /**
   * Prepare Anthropic Claude payload
   */
  private prepareAnthropicPayload(prompt: string, config: any): any {
    const messages = [];
    
    // Add system prompt if provided
    if (config.systemPrompt) {
      messages.push({
        role: 'system',
        content: config.systemPrompt
      });
    }

    // Add examples if provided
    if (config.examples) {
      for (const example of config.examples) {
        messages.push(
          { role: 'user', content: example.input },
          { role: 'assistant', content: example.output }
        );
      }
    }

    // Add main prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    return {
      anthropic_version: config.anthropicVersion || 'bedrock-2023-05-31',
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      top_p: config.topP || 1,
      top_k: config.topK || 250,
      stop_sequences: config.stopSequences || [],
      messages
    };
  }

  /**
   * Prepare Amazon Titan payload
   */
  private prepareAmazonPayload(prompt: string, config: any): any {
    return {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
        topP: config.topP || 1,
        stopSequences: config.stopSequences || []
      }
    };
  }

  /**
   * Prepare Meta Llama payload
   */
  private prepareMetaPayload(prompt: string, config: any): any {
    let formattedPrompt = prompt;
    
    if (config.systemPrompt) {
      formattedPrompt = `<<SYS>>\n${config.systemPrompt}\n<</SYS>>\n\n${prompt}`;
    }

    return {
      prompt: formattedPrompt,
      max_gen_len: config.maxTokens || 2048,
      temperature: config.temperature || 0.7,
      top_p: config.topP || 0.9
    };
  }

  /**
   * Prepare Cohere payload
   */
  private prepareCoherePayload(prompt: string, config: any): any {
    return {
      prompt: prompt,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      p: config.topP || 0.75,
      k: config.topK || 0,
      stop_sequences: config.stopSequences || [],
      return_likelihoods: 'NONE'
    };
  }

  /**
   * Parse model response
   */
  private parseModelResponse(modelId: string, response: any): Omit<GenerationResult, 'model' | 'latency'> {
    const provider = this.getModelProvider(modelId);

    switch (provider) {
      case 'anthropic':
        return {
          content: response.content[0].text,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens
          },
          stopReason: response.stop_reason,
          metadata: response.metadata
        };

      case 'amazon':
        const titanResult = response.results[0];
        return {
          content: titanResult.outputText,
          usage: {
            inputTokens: response.inputTextTokenCount || 0,
            outputTokens: titanResult.tokenCount || 0,
            totalTokens: (response.inputTextTokenCount || 0) + (titanResult.tokenCount || 0)
          },
          stopReason: titanResult.completionReason
        };

      case 'meta':
        return {
          content: response.generation,
          usage: {
            inputTokens: response.prompt_token_count || 0,
            outputTokens: response.generation_token_count || 0,
            totalTokens: (response.prompt_token_count || 0) + (response.generation_token_count || 0)
          },
          stopReason: response.stop_reason
        };

      case 'cohere':
        return {
          content: response.generations[0].text,
          usage: {
            inputTokens: 0, // Cohere doesn't provide token counts
            outputTokens: 0,
            totalTokens: 0
          }
        };

      default:
        throw new Error(`Unsupported response format for ${modelId}`);
    }
  }

  /**
   * Parse streaming chunk
   */
  private parseStreamChunk(modelId: string, chunk: any): StreamChunk {
    const provider = this.getModelProvider(modelId);

    switch (provider) {
      case 'anthropic':
        if (chunk.type === 'content_block_delta') {
          return {
            content: chunk.delta.text || '',
            isComplete: false
          };
        } else if (chunk.type === 'message_delta') {
          return {
            content: '',
            isComplete: true,
            stopReason: chunk.delta.stop_reason,
            usage: chunk.usage ? {
              inputTokens: chunk.usage.input_tokens,
              outputTokens: chunk.usage.output_tokens,
              totalTokens: chunk.usage.input_tokens + chunk.usage.output_tokens
            } : undefined
          };
        }
        return { content: '', isComplete: false };

      case 'amazon':
        return {
          content: chunk.outputText || '',
          isComplete: chunk.completionReason !== undefined
        };

      default:
        return {
          content: chunk.generation || chunk.text || '',
          isComplete: chunk.isFinished || false
        };
    }
  }

  /**
   * Get model provider from model ID
   */
  private getModelProvider(modelId: string): ModelProvider {
    if (modelId.startsWith('anthropic.')) return 'anthropic';
    if (modelId.startsWith('amazon.')) return 'amazon';
    if (modelId.startsWith('meta.')) return 'meta';
    if (modelId.startsWith('cohere.')) return 'cohere';
    if (modelId.startsWith('ai21.')) return 'ai21';
    if (modelId.startsWith('stability.')) return 'stability';
    
    throw new Error(`Unknown model provider for ${modelId}`);
  }

  /**
   * Map Bedrock errors to application errors
   */
  private mapBedrockError(error: any): Error {
    if (error instanceof BedrockRuntimeServiceException) {
      const statusCode = error.$metadata?.httpStatusCode;
      
      if (error.name === 'ResourceNotFoundException' || statusCode === 404) {
        return AppErrors.notFound('Model not found');
      }
      
      if (error.name === 'ThrottlingException' || statusCode === 429) {
        return AppErrors.tooManyRequests('Model rate limit exceeded');
      }
      
      if (error.name === 'ValidationException') {
        return AppErrors.badRequest('Invalid model parameters');
      }
      
      if (error.name === 'AccessDeniedException' || statusCode === 403) {
        return AppErrors.forbidden('Access denied to model');
      }
      
      if (error.name === 'ModelStreamErrorException') {
        return AppErrors.internal('Model streaming error');
      }
      
      if (error.name === 'ModelTimeoutException') {
        return AppErrors.serviceUnavailable('Model timeout');
      }
    }

    return AppErrors.internal('Bedrock operation failed', {
      error: error.name,
      message: error.message
    });
  }

  /**
   * Estimate tokens for text
   */
  public estimateTokens(text: string, modelId?: string): number {
    // Rough estimation - actual tokenization varies by model
    // Claude uses ~1.3 chars per token, GPT uses ~4 chars per token
    const provider = modelId ? this.getModelProvider(modelId) : 'anthropic';
    
    const charsPerToken = {
      anthropic: 1.3,
      amazon: 4,
      meta: 4,
      cohere: 4,
      ai21: 4,
      stability: 4
    };

    return Math.ceil(text.length / (charsPerToken[provider] || 4));
  }

  /**
   * Calculate cost estimate
   */
  public calculateCost(usage: GenerationResult['usage'], modelId: string): {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  } {
    // Pricing per 1K tokens (approximate, check AWS for current pricing)
    const pricing: Record<string, { input: number; output: number }> = {
      'anthropic.claude-3-opus': { input: 0.015, output: 0.075 },
      'anthropic.claude-3-sonnet': { input: 0.003, output: 0.015 },
      'anthropic.claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'amazon.titan-text-express': { input: 0.0003, output: 0.0004 },
      'meta.llama2-70b': { input: 0.00265, output: 0.0035 }
    };

    const modelPricing = pricing[modelId] || { input: 0.001, output: 0.001 };
    
    const inputCost = (usage.inputTokens / 1000) * modelPricing.input;
    const outputCost = (usage.outputTokens / 1000) * modelPricing.output;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost
    };
  }
}
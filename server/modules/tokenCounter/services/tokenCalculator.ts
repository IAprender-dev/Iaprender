import { TokenProviderRate } from "@shared/schema";

export interface TokenCalculationResult {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface TokenCalculatorConfig {
  provider: string;
  model: string;
  rates?: TokenProviderRate;
}

export class TokenCalculator {
  private static readonly DEFAULT_RATES = {
    openai: {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'dall-e-3': { input: 0.04, output: 0.08 }, // per image
    },
    anthropic: {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    },
    perplexity: {
      'pplx-7b-online': { input: 0.0002, output: 0.0002 },
      'pplx-70b-online': { input: 0.001, output: 0.001 },
    }
  };

  /**
   * Calcula tokens baseado no texto usando estimativa aproximada
   */
  static estimateTokensFromText(text: string, provider: string = 'openai'): number {
    if (!text) return 0;
    
    // Estimativas baseadas em análise de diferentes provedores
    const multipliers = {
      openai: 0.75,      // ~0.75 tokens por caractere
      anthropic: 0.8,    // ~0.8 tokens por caractere  
      perplexity: 1.0,   // ~1.0 tokens por caractere
      google: 0.75,      // similar ao OpenAI
    };
    
    const multiplier = multipliers[provider as keyof typeof multipliers] || 0.75;
    return Math.ceil(text.length * multiplier);
  }

  /**
   * Calcula tokens e custo para uma requisição
   */
  static calculateTokenUsage(
    prompt: string,
    completion: string = '',
    config: TokenCalculatorConfig
  ): TokenCalculationResult {
    const promptTokens = this.estimateTokensFromText(prompt, config.provider);
    const completionTokens = this.estimateTokensFromText(completion, config.provider);
    const totalTokens = promptTokens + completionTokens;

    let estimatedCost = 0;

    // Usar taxas customizadas se fornecidas
    if (config.rates) {
      estimatedCost = (
        (promptTokens / 1000) * config.rates.inputTokenRate +
        (completionTokens / 1000) * config.rates.outputTokenRate
      );
    } else {
      // Usar taxas padrão
      const providerRates = this.DEFAULT_RATES[config.provider as keyof typeof this.DEFAULT_RATES];
      if (providerRates) {
        const modelRates = providerRates[config.model as keyof typeof providerRates];
        if (modelRates) {
          estimatedCost = (
            (promptTokens / 1000) * modelRates.input +
            (completionTokens / 1000) * modelRates.output
          );
        }
      }
    }

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: Math.round(estimatedCost * 100000) / 100000 // 5 casas decimais
    };
  }

  /**
   * Calcula tokens para diferentes tipos de requisição
   */
  static calculateByRequestType(
    requestType: string,
    data: any,
    config: TokenCalculatorConfig
  ): TokenCalculationResult {
    switch (requestType) {
      case 'chat':
        return this.calculateTokenUsage(data.prompt || '', data.completion || '', config);
        
      case 'image':
        // Para geração de imagens, usar custo fixo baseado no modelo
        const imageTokens = 1000; // estimativa fixa
        const imageCost = config.provider === 'openai' ? 0.04 : 0.02;
        return {
          promptTokens: imageTokens,
          completionTokens: 0,
          totalTokens: imageTokens,
          estimatedCost: imageCost
        };
        
      case 'search':
        // Para busca (Perplexity), incluir query e resposta
        return this.calculateTokenUsage(
          data.query || '', 
          data.response || '', 
          config
        );
        
      case 'transcription':
        // Para transcrição, estimar baseado na duração do áudio
        const durationMinutes = data.duration || 1;
        const transcriptionTokens = Math.ceil(durationMinutes * 150); // ~150 tokens por minuto
        return {
          promptTokens: transcriptionTokens,
          completionTokens: 0,
          totalTokens: transcriptionTokens,
          estimatedCost: (transcriptionTokens / 1000) * 0.006 // taxa do Whisper
        };
        
      default:
        return this.calculateTokenUsage(data.input || '', data.output || '', config);
    }
  }

  /**
   * Obter taxas padrão para um modelo específico
   */
  static getDefaultRates(provider: string, model: string) {
    const providerRates = this.DEFAULT_RATES[provider as keyof typeof this.DEFAULT_RATES];
    if (providerRates) {
      return providerRates[model as keyof typeof providerRates];
    }
    return null;
  }

  /**
   * Validar se um modelo é suportado
   */
  static isModelSupported(provider: string, model: string): boolean {
    const rates = this.getDefaultRates(provider, model);
    return rates !== null && rates !== undefined;
  }
}

export default TokenCalculator;
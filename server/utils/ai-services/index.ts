import * as OpenAIService from './openai';
import * as AnthropicService from './anthropic';
import * as PerplexityService from './perplexity';

export { OpenAIService, AnthropicService, PerplexityService };

// Tipagem de entrada para interface comum
export interface AIRequestBase {
  userId: number;
  contractId: number;
  prompt: string;
}

// Função para verificar disponibilidade das APIs de IA
export async function checkAIServicesAvailability() {
  // Verificamos apenas a presença das variáveis de ambiente
  // A inicialização dos clientes é tratada nos respectivos arquivos de serviço
  const availability = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    perplexity: !!process.env.PERPLEXITY_API_KEY,
  };

  return availability;
}

// Função para obter as estimativas de tokens por 1000 caracteres
export function getTokenEstimates() {
  return {
    openai: {
      chat: 0.75, // ~0.75 tokens por caractere
      image: 50,  // estimativa por prompt (muito variável)
    },
    anthropic: {
      chat: 0.8,  // ~0.8 tokens por caractere
      vision: 150, // estimativa para análise de imagem
    },
    perplexity: {
      search: 1.0, // ~1.0 tokens por caractere (estimativa)
    },
  };
}
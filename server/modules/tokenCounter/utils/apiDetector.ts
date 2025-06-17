import type { Request } from "express";

export interface AIRequestDetection {
  isAIRequest: boolean;
  provider: string;
  model: string;
  requestType: string;
}

/**
 * Detecta se uma requisição é para uma API de IA e extrai informações relevantes
 */
export function detectAIRequest(req: Request): AIRequestDetection {
  const path = req.path.toLowerCase();
  const body = req.body || {};

  // OpenAI APIs
  if (path.includes('/openai') || path.includes('/chatgpt')) {
    return {
      isAIRequest: true,
      provider: 'openai',
      model: body.model || detectOpenAIModel(path, body),
      requestType: detectOpenAIRequestType(path, body)
    };
  }

  // Anthropic APIs
  if (path.includes('/anthropic') || path.includes('/claude')) {
    return {
      isAIRequest: true,
      provider: 'anthropic',
      model: body.model || detectAnthropicModel(path, body),
      requestType: detectAnthropicRequestType(path, body)
    };
  }

  // Perplexity APIs
  if (path.includes('/perplexity') || path.includes('/search')) {
    return {
      isAIRequest: true,
      provider: 'perplexity',
      model: body.model || 'pplx-7b-online',
      requestType: 'search'
    };
  }

  // Google/Gemini APIs
  if (path.includes('/gemini') || path.includes('/google')) {
    return {
      isAIRequest: true,
      provider: 'google',
      model: body.model || 'gemini-pro',
      requestType: detectGoogleRequestType(path, body)
    };
  }

  // Detectar por padrões no body da requisição
  if (hasAIPatterns(body)) {
    return detectByBodyPatterns(body);
  }

  return {
    isAIRequest: false,
    provider: '',
    model: '',
    requestType: ''
  };
}

/**
 * Detecta modelo OpenAI baseado no path e body
 */
function detectOpenAIModel(path: string, body: any): string {
  if (body.model) return body.model;
  
  if (path.includes('gpt-4')) return 'gpt-4';
  if (path.includes('gpt-3.5') || path.includes('turbo')) return 'gpt-3.5-turbo';
  if (path.includes('dall-e') || path.includes('image')) return 'dall-e-3';
  if (path.includes('whisper') || path.includes('transcrib')) return 'whisper-1';
  
  return 'gpt-4'; // padrão
}

/**
 * Detecta tipo de requisição OpenAI
 */
function detectOpenAIRequestType(path: string, body: any): string {
  if (path.includes('chat') || path.includes('completion')) return 'chat';
  if (path.includes('image') || path.includes('dall-e')) return 'image';
  if (path.includes('transcrib') || path.includes('whisper')) return 'transcription';
  if (path.includes('embedding')) return 'embedding';
  
  // Detectar pelo body
  if (body.messages || body.prompt) return 'chat';
  if (body.input && typeof body.input === 'string') return 'embedding';
  
  return 'chat';
}

/**
 * Detecta modelo Anthropic baseado no path e body
 */
function detectAnthropicModel(path: string, body: any): string {
  if (body.model) return body.model;
  
  if (path.includes('opus')) return 'claude-3-opus';
  if (path.includes('sonnet')) return 'claude-3-sonnet';
  if (path.includes('haiku')) return 'claude-3-haiku';
  
  return 'claude-3-sonnet'; // padrão
}

/**
 * Detecta tipo de requisição Anthropic
 */
function detectAnthropicRequestType(path: string, body: any): string {
  if (path.includes('vision') || body.images) return 'vision';
  return 'chat';
}

/**
 * Detecta tipo de requisição Google
 */
function detectGoogleRequestType(path: string, body: any): string {
  if (path.includes('vision') || body.images) return 'vision';
  if (path.includes('embedding')) return 'embedding';
  return 'chat';
}

/**
 * Verifica se o body contém padrões de requisições de IA
 */
function hasAIPatterns(body: any): boolean {
  if (!body || typeof body !== 'object') return false;

  const aiKeywords = [
    'prompt', 'messages', 'completion', 'model',
    'temperature', 'max_tokens', 'top_p', 'frequency_penalty',
    'presence_penalty', 'stop', 'stream'
  ];

  return aiKeywords.some(keyword => keyword in body);
}

/**
 * Detecta provedor e modelo baseado apenas no body
 */
function detectByBodyPatterns(body: any): AIRequestDetection {
  // Padrões OpenAI
  if (body.messages || (body.model && body.model.includes('gpt'))) {
    return {
      isAIRequest: true,
      provider: 'openai',
      model: body.model || 'gpt-4',
      requestType: 'chat'
    };
  }

  // Padrões Anthropic
  if (body.model && body.model.includes('claude')) {
    return {
      isAIRequest: true,
      provider: 'anthropic',
      model: body.model,
      requestType: 'chat'
    };
  }

  // Padrões genéricos
  if (body.prompt && body.model) {
    return {
      isAIRequest: true,
      provider: 'unknown',
      model: body.model,
      requestType: 'chat'
    };
  }

  return {
    isAIRequest: false,
    provider: '',
    model: '',
    requestType: ''
  };
}

/**
 * Lista de endpoints conhecidos de IA para validação
 */
export const AI_ENDPOINTS = {
  openai: [
    '/api/ai/openai',
    '/api/ai/chatgpt',
    '/api/ai/openai/chat',
    '/api/ai/openai/completion',
    '/api/ai/openai/image',
    '/api/ai/openai/transcription'
  ],
  anthropic: [
    '/api/ai/anthropic',
    '/api/ai/claude',
    '/api/ai/anthropic/chat',
    '/api/ai/anthropic/vision'
  ],
  perplexity: [
    '/api/ai/perplexity',
    '/api/ai/search',
    '/api/ai/perplexity/search'
  ],
  google: [
    '/api/ai/gemini',
    '/api/ai/google',
    '/api/ai/gemini/chat'
  ]
};

/**
 * Verifica se um endpoint é uma API de IA conhecida
 */
export function isKnownAIEndpoint(path: string): boolean {
  const normalizedPath = path.toLowerCase();
  
  return Object.values(AI_ENDPOINTS)
    .flat()
    .some(endpoint => normalizedPath.includes(endpoint));
}

/**
 * Obtém informações de um endpoint conhecido
 */
export function getEndpointInfo(path: string): AIRequestDetection | null {
  const normalizedPath = path.toLowerCase();
  
  for (const [provider, endpoints] of Object.entries(AI_ENDPOINTS)) {
    for (const endpoint of endpoints) {
      if (normalizedPath.includes(endpoint)) {
        return {
          isAIRequest: true,
          provider,
          model: getDefaultModelForProvider(provider),
          requestType: extractRequestTypeFromPath(endpoint)
        };
      }
    }
  }
  
  return null;
}

/**
 * Obtém modelo padrão para um provedor
 */
function getDefaultModelForProvider(provider: string): string {
  const defaults = {
    openai: 'gpt-4',
    anthropic: 'claude-3-sonnet',
    perplexity: 'pplx-7b-online',
    google: 'gemini-pro'
  };
  
  return defaults[provider as keyof typeof defaults] || 'unknown';
}

/**
 * Extrai tipo de requisição do path
 */
function extractRequestTypeFromPath(path: string): string {
  if (path.includes('chat')) return 'chat';
  if (path.includes('image')) return 'image';
  if (path.includes('search')) return 'search';
  if (path.includes('transcrib')) return 'transcription';
  if (path.includes('vision')) return 'vision';
  if (path.includes('embedding')) return 'embedding';
  
  return 'chat';
}
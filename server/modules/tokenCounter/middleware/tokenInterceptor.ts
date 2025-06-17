import type { Request, Response, NextFunction } from "express";
import TokenLimiter from "../services/tokenLimiter";
import TokenCalculator from "../services/tokenCalculator";
import { detectAIRequest } from "../utils/apiDetector";

export interface TokenInterceptorRequest extends Request {
  tokenUsage?: {
    provider: string;
    model: string;
    requestType: string;
    requestId: string;
    startTime: number;
  };
}

/**
 * Middleware para interceptar e monitorar chamadas de APIs de IA
 */
export const tokenInterceptor = async (
  req: TokenInterceptorRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obter ID do usuário do sistema de autenticação existente
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return next(); // Sem usuário autenticado, prosseguir normalmente
    }

    // Detectar se é uma requisição para API de IA
    const aiRequest = detectAIRequest(req);
    
    if (!aiRequest.isAIRequest) {
      return next(); // Não é requisição de IA, prosseguir normalmente
    }

    // Verificar limite de tokens ANTES de processar a requisição
    const tokenCheck = await TokenLimiter.checkTokenLimit(userId, 1000); // reserva estimada
    
    if (!tokenCheck.canProceed) {
      res.status(429).json({
        error: 'Limite de tokens excedido',
        message: 'Você atingiu seu limite mensal de tokens de IA',
        currentUsage: tokenCheck.currentUsage,
        monthlyLimit: tokenCheck.monthlyLimit,
        resetDate: tokenCheck.resetDate,
        remainingTokens: tokenCheck.remainingTokens
      });
      return;
    }

    // Armazenar informações da requisição para posterior processamento
    req.tokenUsage = {
      provider: aiRequest.provider,
      model: aiRequest.model,
      requestType: aiRequest.requestType,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now()
    };

    // Interceptar a resposta para calcular tokens utilizados
    interceptResponse(res, userId, req);
    
    next();
  } catch (error) {
    console.error('Erro no interceptador de tokens:', error);
    next(); // Em caso de erro, permitir que a requisição continue
  }
};

/**
 * Intercepta a resposta para calcular e registrar o uso de tokens
 */
function interceptResponse(res: Response, userId: number, req: TokenInterceptorRequest): void {
  const originalSend = res.send;
  const originalJson = res.json;

  // Interceptar res.send()
  res.send = function(data: any) {
    processTokenUsage(userId, req, data);
    return originalSend.call(this, data);
  };

  // Interceptar res.json()
  res.json = function(data: any) {
    processTokenUsage(userId, req, data);
    return originalJson.call(this, data);
  };
}

/**
 * Processa o uso de tokens após a resposta
 */
async function processTokenUsage(
  userId: number,
  req: TokenInterceptorRequest,
  responseData: any
): Promise<void> {
  try {
    if (!req.tokenUsage) return;

    const { provider, model, requestType, requestId } = req.tokenUsage;

    // Extrair prompt e resposta baseado no tipo de requisição
    const { prompt, completion } = extractRequestData(req, responseData, requestType);

    // Calcular tokens utilizados
    const tokenCalc = TokenCalculator.calculateTokenUsage(
      prompt,
      completion,
      { provider, model }
    );

    // Registrar uso de tokens
    await TokenLimiter.recordTokenUsage(
      userId,
      provider,
      model,
      tokenCalc.totalTokens,
      requestType,
      tokenCalc.estimatedCost,
      requestId,
      {
        promptTokens: tokenCalc.promptTokens,
        completionTokens: tokenCalc.completionTokens,
        processingTime: Date.now() - req.tokenUsage.startTime,
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      }
    );

    console.log(`Tokens registrados para usuário ${userId}: ${tokenCalc.totalTokens} tokens (${provider}/${model})`);
  } catch (error) {
    console.error('Erro ao processar uso de tokens:', error);
  }
}

/**
 * Extrai dados da requisição e resposta para cálculo de tokens
 */
function extractRequestData(
  req: TokenInterceptorRequest,
  responseData: any,
  requestType: string
): { prompt: string; completion: string } {
  let prompt = '';
  let completion = '';

  try {
    switch (requestType) {
      case 'chat':
        prompt = req.body?.prompt || req.body?.message || req.body?.messages?.[0]?.content || '';
        completion = responseData?.content || responseData?.response || responseData?.message || '';
        break;

      case 'image':
        prompt = req.body?.prompt || req.body?.description || '';
        completion = ''; // Imagens não têm completion text
        break;

      case 'search':
        prompt = req.body?.query || req.body?.prompt || '';
        completion = responseData?.result || responseData?.answer || '';
        break;

      case 'transcription':
        prompt = `Audio file transcription - ${req.body?.duration || 'unknown'} duration`;
        completion = responseData?.text || responseData?.transcription || '';
        break;

      default:
        prompt = JSON.stringify(req.body || {});
        completion = JSON.stringify(responseData || {});
    }
  } catch (error) {
    console.error('Erro ao extrair dados da requisição:', error);
    prompt = 'Error extracting prompt';
    completion = 'Error extracting completion';
  }

  return { prompt, completion };
}

/**
 * Middleware para verificar alertas de limite
 */
export const tokenAlertMiddleware = async (
  req: TokenInterceptorRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return next();
    }

    // Verificar se usuário está próximo do limite
    const tokenCheck = await TokenLimiter.checkTokenLimit(userId);
    
    if (tokenCheck.warningThreshold) {
      // Adicionar header de alerta
      res.setHeader('X-Token-Warning', 'true');
      res.setHeader('X-Token-Usage', `${tokenCheck.currentUsage}/${tokenCheck.monthlyLimit}`);
      res.setHeader('X-Token-Reset-Date', tokenCheck.resetDate.toISOString());
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de alerta de tokens:', error);
    next();
  }
};

export default tokenInterceptor;
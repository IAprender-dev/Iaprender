import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { LambdaIAService, DocumentoIARequest, DocumentoIAResponse } from './LambdaIAService.js';
import { SecretsManager } from '../config/secrets.js';

export interface HybridProcessingResult {
  success: boolean;
  data?: DocumentoIAResponse;
  processing_method: 'lambda' | 'express' | 'fallback';
  execution_time_ms: number;
  error?: string;
}

/**
 * Serviço híbrido que utiliza Lambda para processamento pesado
 * com fallback para processamento local via Express
 */
export class HybridLambdaService {
  private lambdaClient: LambdaClient;
  private localService: LambdaIAService;
  private lambdaFunctionName: string;
  private lambdaTimeout: number;

  constructor() {
    this.lambdaFunctionName = 'iaprender-bedrock-generator';
    this.lambdaTimeout = 55000; // 55 segundos (Lambda timeout é 60s)
    
    this.initializeClients();
    this.localService = new LambdaIAService();
  }

  private async initializeClients() {
    try {
      const credentials = await SecretsManager.getAWSCredentials();
      
      this.lambdaClient = new LambdaClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.access_key,
          secretAccessKey: credentials.secret_key
        }
      });

      console.log('✅ Hybrid Lambda Service - Clientes AWS inicializados');
    } catch (error) {
      console.error('❌ Erro ao inicializar clientes AWS:', error);
      throw error;
    }
  }

  /**
   * Processamento híbrido: tenta Lambda primeiro, fallback para Express
   */
  async processarDocumentoHibrido(request: DocumentoIARequest): Promise<HybridProcessingResult> {
    const startTime = Date.now();
    
    // ETAPA 1: Tentar processamento via Lambda
    try {
      console.log('🚀 Tentando processamento via Lambda...');
      const lambdaResult = await this.invocarLambda(request);
      
      if (lambdaResult.success) {
        return {
          success: true,
          data: lambdaResult.data,
          processing_method: 'lambda',
          execution_time_ms: Date.now() - startTime
        };
      }
    } catch (lambdaError) {
      console.log('⚠️ Lambda falhou, tentando fallback:', lambdaError.message);
    }

    // ETAPA 2: Fallback para processamento local via Express
    try {
      console.log('🔄 Executando fallback via Express...');
      const localResult = await this.localService.processarDocumentoIA(request);
      
      return {
        success: true,
        data: localResult,
        processing_method: 'express',
        execution_time_ms: Date.now() - startTime
      };
    } catch (expressError) {
      console.error('❌ Fallback Express também falhou:', expressError);
      
      // ETAPA 3: Fallback final com dados básicos
      return {
        success: false,
        processing_method: 'fallback',
        execution_time_ms: Date.now() - startTime,
        error: `Lambda e Express falharam: ${expressError.message}`
      };
    }
  }

  /**
   * Invoca a função Lambda para processamento de IA
   */
  private async invocarLambda(request: DocumentoIARequest): Promise<{success: boolean, data?: DocumentoIAResponse}> {
    const payload = JSON.stringify(request);
    
    const command = new InvokeCommand({
      FunctionName: this.lambdaFunctionName,
      Payload: Buffer.from(payload),
      InvocationType: 'RequestResponse'
    });

    // Timeout para evitar hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Lambda timeout')), this.lambdaTimeout);
    });

    try {
      const response = await Promise.race([
        this.lambdaClient.send(command),
        timeoutPromise
      ]);

      if (response.StatusCode !== 200) {
        throw new Error(`Lambda retornou status ${response.StatusCode}`);
      }

      const result = JSON.parse(Buffer.from(response.Payload).toString());
      
      if (result.errorMessage) {
        throw new Error(result.errorMessage);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Erro na invocação Lambda:', error);
      return {
        success: false
      };
    }
  }

  /**
   * Verifica se Lambda está disponível
   */
  async verificarDisponibilidadeLambda(): Promise<boolean> {
    try {
      const command = new InvokeCommand({
        FunctionName: this.lambdaFunctionName,
        Payload: Buffer.from(JSON.stringify({test: true})),
        InvocationType: 'RequestResponse'
      });

      const response = await this.lambdaClient.send(command);
      return response.StatusCode === 200;
    } catch (error) {
      console.log('⚠️ Lambda não disponível:', error.message);
      return false;
    }
  }

  /**
   * Estatísticas do sistema híbrido
   */
  async obterEstatisticas(): Promise<any> {
    const lambdaDisponivel = await this.verificarDisponibilidadeLambda();
    const estatisticasLocais = await this.localService.obterEstatisticasGeracao();
    
    return {
      sistema_hibrido: {
        lambda_disponivel: lambdaDisponivel,
        modo_principal: lambdaDisponivel ? 'lambda' : 'express',
        fallback_ativo: true
      },
      estatisticas_locais: estatisticasLocais,
      funcao_lambda: {
        nome: this.lambdaFunctionName,
        timeout: this.lambdaTimeout,
        regiao: 'us-east-1'
      }
    };
  }
}

export default HybridLambdaService;
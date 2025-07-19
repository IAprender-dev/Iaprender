import {
  LambdaClient,
  InvokeCommand,
  InvokeAsyncCommand,
  ListFunctionsCommand,
  GetFunctionCommand,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  DeleteFunctionCommand,
  TagResourceCommand,
  InvocationType,
  LogType,
  Runtime,
  Architecture,
  LambdaClientConfig
} from '@aws-sdk/client-lambda';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { MetricsCollector, getMetrics } from '../utils/metrics';
import { Cache, getCache } from '../utils/cache';
import { AppErrors } from '../middleware/errorHandler';
import { CircuitBreaker } from '../utils/circuitBreaker';
import { RetryStrategy } from '../utils/retryStrategy';

interface LambdaInvokeOptions {
  invocationType?: InvocationType;
  logType?: LogType;
  clientContext?: string;
  qualifier?: string;
  maxRetries?: number;
  timeout?: number;
}

interface LambdaResponse<T = any> {
  statusCode: number;
  payload: T;
  executedVersion?: string;
  logResult?: string;
  functionError?: string;
}

interface FunctionConfiguration {
  functionName: string;
  runtime: Runtime;
  handler: string;
  code: {
    zipFile?: Buffer;
    s3Bucket?: string;
    s3Key?: string;
  };
  role: string;
  description?: string;
  timeout?: number;
  memorySize?: number;
  environment?: Record<string, string>;
  vpcConfig?: {
    subnetIds: string[];
    securityGroupIds: string[];
  };
  layers?: string[];
  deadLetterConfig?: {
    targetArn: string;
  };
  tracingConfig?: {
    mode: 'Active' | 'PassThrough';
  };
  tags?: Record<string, string>;
}

export class LambdaService {
  private client: LambdaClient;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;
  private circuitBreaker: CircuitBreaker;
  private retryStrategy: RetryStrategy;
  private region: string;
  private defaultTimeout: number;
  private functionPrefix: string;

  constructor(config?: Partial<LambdaClientConfig>) {
    this.region = envConfig.aws.region;
    this.functionPrefix = envConfig.lambda.functionPrefix;
    this.defaultTimeout = 30000; // 30 seconds

    this.client = new LambdaClient({
      region: this.region,
      maxAttempts: 3,
      retryMode: 'adaptive',
      ...config
    });

    this.logger = new Logger('LambdaService');
    this.metrics = getMetrics();
    this.cache = getCache('lambda', 300); // 5 min cache
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 120000 // 2 minutes
    });
    this.retryStrategy = new RetryStrategy({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBase: 2
    });
  }

  /**
   * Invoke a Lambda function
   */
  public async invoke<TPayload = any, TResponse = any>(
    functionName: string,
    payload: TPayload,
    options: LambdaInvokeOptions = {}
  ): Promise<LambdaResponse<TResponse>> {
    const timer = this.metrics.startTimer();
    const fullFunctionName = this.prefixFunctionName(functionName);

    try {
      // Check circuit breaker
      if (!this.circuitBreaker.allowRequest(fullFunctionName)) {
        throw AppErrors.serviceUnavailable(
          `Lambda function ${fullFunctionName} is temporarily unavailable`
        );
      }

      // Prepare invocation
      const command = new InvokeCommand({
        FunctionName: fullFunctionName,
        InvocationType: options.invocationType || 'RequestResponse',
        LogType: options.logType || 'None',
        ClientContext: options.clientContext,
        Payload: JSON.stringify(payload),
        Qualifier: options.qualifier
      });

      // Execute with retry
      const response = await this.retryStrategy.execute(
        async () => {
          const result = await this.client.send(command);
          
          // Check for function errors
          if (result.FunctionError) {
            throw new Error(`Lambda function error: ${result.FunctionError}`);
          }

          return result;
        },
        {
          maxAttempts: options.maxRetries || 3,
          shouldRetry: (error: any) => {
            // Retry on throttling or transient errors
            return error.name === 'TooManyRequestsException' ||
                   error.name === 'ServiceException' ||
                   error.statusCode === 429 ||
                   error.statusCode >= 500;
          }
        }
      );

      // Parse response
      const payloadString = response.Payload 
        ? new TextDecoder().decode(response.Payload)
        : '{}';
      
      let parsedPayload: TResponse;
      try {
        parsedPayload = JSON.parse(payloadString);
      } catch {
        parsedPayload = payloadString as any;
      }

      const lambdaResponse: LambdaResponse<TResponse> = {
        statusCode: response.StatusCode || 200,
        payload: parsedPayload,
        executedVersion: response.ExecutedVersion,
        logResult: response.LogResult,
        functionError: response.FunctionError
      };

      // Record success
      this.circuitBreaker.recordSuccess(fullFunctionName);
      
      const duration = timer();
      this.logger.info('Lambda function invoked successfully', {
        functionName: fullFunctionName,
        statusCode: lambdaResponse.statusCode,
        duration
      });
      
      this.metrics.timing('lambda.invoke.duration', duration, {
        function: fullFunctionName,
        status: 'success'
      });
      this.metrics.increment('lambda.invoke.success', {
        function: fullFunctionName
      });

      return lambdaResponse;

    } catch (error: any) {
      // Record failure
      this.circuitBreaker.recordFailure(fullFunctionName);
      
      const duration = timer();
      this.logger.error('Lambda invocation failed', error, {
        functionName: fullFunctionName,
        duration
      });
      
      this.metrics.increment('lambda.invoke.failure', {
        function: fullFunctionName,
        error: error.name || 'unknown'
      });

      throw this.mapLambdaError(error);
    }
  }

  /**
   * Invoke a Lambda function asynchronously
   */
  public async invokeAsync<TPayload = any>(
    functionName: string,
    payload: TPayload,
    options: Omit<LambdaInvokeOptions, 'invocationType'> = {}
  ): Promise<{ statusCode: number; requestId: string }> {
    const fullFunctionName = this.prefixFunctionName(functionName);

    try {
      const command = new InvokeAsyncCommand({
        FunctionName: fullFunctionName,
        InvokeArgs: JSON.stringify(payload)
      });

      const response = await this.client.send(command);
      
      this.logger.info('Lambda function invoked asynchronously', {
        functionName: fullFunctionName,
        statusCode: response.Status
      });
      
      this.metrics.increment('lambda.invoke_async.success', {
        function: fullFunctionName
      });

      return {
        statusCode: response.Status || 202,
        requestId: response.$metadata.requestId || ''
      };

    } catch (error) {
      this.logger.error('Async Lambda invocation failed', error);
      this.metrics.increment('lambda.invoke_async.failure', {
        function: fullFunctionName
      });
      throw this.mapLambdaError(error);
    }
  }

  /**
   * List Lambda functions
   */
  public async listFunctions(options?: {
    maxItems?: number;
    marker?: string;
    functionVersion?: 'ALL';
  }): Promise<{
    functions: Array<{
      functionName: string;
      functionArn: string;
      runtime: string;
      handler: string;
      codeSize: number;
      description?: string;
      timeout: number;
      memorySize: number;
      lastModified: string;
    }>;
    nextMarker?: string;
  }> {
    const cacheKey = `list:${options?.marker || 'initial'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const command = new ListFunctionsCommand({
        MaxItems: options?.maxItems,
        Marker: options?.marker,
        FunctionVersion: options?.functionVersion
      });

      const response = await this.client.send(command);
      
      const functions = (response.Functions || [])
        .filter(fn => fn.FunctionName?.startsWith(this.functionPrefix))
        .map(fn => ({
          functionName: fn.FunctionName!,
          functionArn: fn.FunctionArn!,
          runtime: fn.Runtime!,
          handler: fn.Handler!,
          codeSize: fn.CodeSize!,
          description: fn.Description,
          timeout: fn.Timeout || 3,
          memorySize: fn.MemorySize || 128,
          lastModified: fn.LastModified!
        }));

      const result = {
        functions,
        nextMarker: response.NextMarker
      };

      this.cache.set(cacheKey, result);
      
      return result;

    } catch (error) {
      this.logger.error('Failed to list Lambda functions', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Get function configuration
   */
  public async getFunctionConfiguration(functionName: string): Promise<any> {
    const fullFunctionName = this.prefixFunctionName(functionName);
    const cacheKey = `config:${fullFunctionName}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const command = new GetFunctionCommand({
        FunctionName: fullFunctionName
      });

      const response = await this.client.send(command);
      
      const config = {
        functionName: response.Configuration?.FunctionName,
        functionArn: response.Configuration?.FunctionArn,
        runtime: response.Configuration?.Runtime,
        handler: response.Configuration?.Handler,
        codeSize: response.Configuration?.CodeSize,
        description: response.Configuration?.Description,
        timeout: response.Configuration?.Timeout,
        memorySize: response.Configuration?.MemorySize,
        lastModified: response.Configuration?.LastModified,
        version: response.Configuration?.Version,
        role: response.Configuration?.Role,
        environment: response.Configuration?.Environment?.Variables,
        vpcConfig: response.Configuration?.VpcConfig,
        layers: response.Configuration?.Layers,
        tracingConfig: response.Configuration?.TracingConfig,
        tags: response.Tags
      };

      this.cache.set(cacheKey, config);
      
      return config;

    } catch (error) {
      this.logger.error('Failed to get function configuration', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Create a new Lambda function
   */
  public async createFunction(config: FunctionConfiguration): Promise<{
    functionArn: string;
    functionName: string;
    version: string;
  }> {
    const fullFunctionName = this.prefixFunctionName(config.functionName);

    try {
      const command = new CreateFunctionCommand({
        FunctionName: fullFunctionName,
        Runtime: config.runtime,
        Handler: config.handler,
        Code: config.code,
        Role: config.role,
        Description: config.description,
        Timeout: config.timeout || 30,
        MemorySize: config.memorySize || 128,
        Environment: config.environment ? {
          Variables: config.environment
        } : undefined,
        VpcConfig: config.vpcConfig,
        Layers: config.layers,
        DeadLetterConfig: config.deadLetterConfig,
        TracingConfig: config.tracingConfig,
        Tags: {
          ...config.tags,
          ManagedBy: 'iaprender',
          CreatedAt: new Date().toISOString()
        },
        Architectures: [Architecture.x86_64],
        EphemeralStorage: {
          Size: 512 // MB
        }
      });

      const response = await this.client.send(command);
      
      // Clear cache
      this.cache.deletePattern('list:*');
      
      this.logger.info('Lambda function created', {
        functionName: fullFunctionName,
        functionArn: response.FunctionArn
      });
      
      this.metrics.increment('lambda.function.created');

      return {
        functionArn: response.FunctionArn!,
        functionName: response.FunctionName!,
        version: response.Version!
      };

    } catch (error) {
      this.logger.error('Failed to create Lambda function', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Update function code
   */
  public async updateFunctionCode(
    functionName: string,
    code: {
      zipFile?: Buffer;
      s3Bucket?: string;
      s3Key?: string;
      s3ObjectVersion?: string;
    }
  ): Promise<{
    functionArn: string;
    version: string;
    lastModified: string;
  }> {
    const fullFunctionName = this.prefixFunctionName(functionName);

    try {
      const command = new UpdateFunctionCodeCommand({
        FunctionName: fullFunctionName,
        ZipFile: code.zipFile,
        S3Bucket: code.s3Bucket,
        S3Key: code.s3Key,
        S3ObjectVersion: code.s3ObjectVersion,
        Publish: true
      });

      const response = await this.client.send(command);
      
      // Clear cache
      this.cache.delete(`config:${fullFunctionName}`);
      
      this.logger.info('Lambda function code updated', {
        functionName: fullFunctionName,
        version: response.Version
      });
      
      this.metrics.increment('lambda.function.code_updated');

      return {
        functionArn: response.FunctionArn!,
        version: response.Version!,
        lastModified: response.LastModified!
      };

    } catch (error) {
      this.logger.error('Failed to update function code', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Delete a Lambda function
   */
  public async deleteFunction(functionName: string): Promise<void> {
    const fullFunctionName = this.prefixFunctionName(functionName);

    try {
      const command = new DeleteFunctionCommand({
        FunctionName: fullFunctionName
      });

      await this.client.send(command);
      
      // Clear cache
      this.cache.delete(`config:${fullFunctionName}`);
      this.cache.deletePattern('list:*');
      
      this.logger.info('Lambda function deleted', {
        functionName: fullFunctionName
      });
      
      this.metrics.increment('lambda.function.deleted');

    } catch (error) {
      this.logger.error('Failed to delete Lambda function', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Invoke Lambda function with streaming response
   */
  public async invokeWithResponseStream<TPayload = any>(
    functionName: string,
    payload: TPayload,
    onData: (chunk: any) => void,
    options: LambdaInvokeOptions = {}
  ): Promise<void> {
    const fullFunctionName = this.prefixFunctionName(functionName);

    try {
      // Note: This would require Lambda function URL or custom implementation
      // AWS SDK v3 doesn't directly support response streaming for standard invoke
      throw new Error('Response streaming not implemented');

    } catch (error) {
      this.logger.error('Streaming invocation failed', error);
      throw this.mapLambdaError(error);
    }
  }

  /**
   * Batch invoke multiple Lambda functions
   */
  public async batchInvoke<TPayload = any, TResponse = any>(
    invocations: Array<{
      functionName: string;
      payload: TPayload;
      options?: LambdaInvokeOptions;
    }>
  ): Promise<Array<{
    functionName: string;
    result?: LambdaResponse<TResponse>;
    error?: Error;
  }>> {
    const results = await Promise.allSettled(
      invocations.map(inv => 
        this.invoke(inv.functionName, inv.payload, inv.options)
      )
    );

    return results.map((result, index) => ({
      functionName: invocations[index].functionName,
      result: result.status === 'fulfilled' ? result.value : undefined,
      error: result.status === 'rejected' ? result.reason : undefined
    }));
  }

  /**
   * Get function metrics
   */
  public async getFunctionMetrics(functionName: string): Promise<{
    invocations: number;
    errors: number;
    throttles: number;
    duration: {
      average: number;
      max: number;
      min: number;
    };
    concurrentExecutions: number;
  }> {
    // This would integrate with CloudWatch Metrics
    // Placeholder implementation
    return {
      invocations: 0,
      errors: 0,
      throttles: 0,
      duration: {
        average: 0,
        max: 0,
        min: 0
      },
      concurrentExecutions: 0
    };
  }

  /**
   * Warm up Lambda function
   */
  public async warmUp(functionName: string, concurrency: number = 1): Promise<void> {
    const warmUpPayload = { __warmup: true };
    
    const promises = Array.from({ length: concurrency }, () =>
      this.invoke(functionName, warmUpPayload, {
        invocationType: 'Event'
      }).catch(error => {
        this.logger.warn('Warm-up invocation failed', { functionName, error });
      })
    );

    await Promise.allSettled(promises);
    
    this.logger.info('Lambda function warmed up', {
      functionName,
      concurrency
    });
  }

  /**
   * Prefix function name with configured prefix
   */
  private prefixFunctionName(functionName: string): string {
    if (functionName.startsWith(this.functionPrefix)) {
      return functionName;
    }
    return `${this.functionPrefix}-${functionName}`;
  }

  /**
   * Map Lambda errors to application errors
   */
  private mapLambdaError(error: any): Error {
    const errorName = error.name || error.constructor.name;
    const statusCode = error.$metadata?.httpStatusCode || error.statusCode;

    if (errorName === 'ResourceNotFoundException' || statusCode === 404) {
      return AppErrors.notFound('Lambda function not found');
    }

    if (errorName === 'TooManyRequestsException' || statusCode === 429) {
      return AppErrors.tooManyRequests('Lambda throttling limit exceeded');
    }

    if (errorName === 'InvalidParameterValueException') {
      return AppErrors.badRequest('Invalid Lambda parameters');
    }

    if (errorName === 'AccessDeniedException' || statusCode === 403) {
      return AppErrors.forbidden('Access denied to Lambda function');
    }

    if (errorName === 'ServiceException' || statusCode >= 500) {
      return AppErrors.serviceUnavailable('Lambda service error');
    }

    return AppErrors.internal('Lambda operation failed', {
      error: errorName,
      message: error.message
    });
  }
}
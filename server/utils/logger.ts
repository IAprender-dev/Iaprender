import winston from 'winston';
import { envConfig } from '../config/environment';

export class Logger {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
    
    const formats = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({ 
        fillExcept: ['message', 'level', 'timestamp', 'context'] 
      })
    ];

    if (envConfig.logging.format === 'json') {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, metadata }) => {
          const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
          return `${timestamp} [${context}] ${level}: ${message} ${meta}`;
        })
      );
    }

    this.logger = winston.createLogger({
      level: envConfig.logging.level,
      format: winston.format.combine(...formats),
      defaultMeta: { context: this.context },
      transports: [
        new winston.transports.Console(),
        // Add file transport for production
        ...(envConfig.isProduction ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 10485760, // 10MB
            maxFiles: 10
          })
        ] : [])
      ],
      // Prevent process exit on error
      exitOnError: false,
      // Handle rejections and exceptions
      rejectionHandlers: envConfig.isProduction ? [
        new winston.transports.File({ filename: 'logs/rejections.log' })
      ] : [],
      exceptionHandlers: envConfig.isProduction ? [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      ] : []
    });

    // Add CloudWatch transport in production
    if (envConfig.isProduction && envConfig.aws.region) {
      this.addCloudWatchTransport();
    }
  }

  private addCloudWatchTransport(): void {
    try {
      const CloudWatchTransport = require('winston-cloudwatch');
      
      this.logger.add(new CloudWatchTransport({
        logGroupName: `/aws/elasticbeanstalk/iaprender/${envConfig.env}`,
        logStreamName: `${this.context}-${new Date().toISOString().split('T')[0]}`,
        awsRegion: envConfig.aws.region,
        messageFormatter: ({ level, message, metadata }: any) => {
          return JSON.stringify({ level, message, context: this.context, ...metadata });
        },
        retentionInDays: 30,
        uploadRate: 2000, // 2 seconds
        errorHandler: (err: Error) => {
          console.error('CloudWatch Transport Error:', err);
        }
      }));
    } catch (error) {
      console.warn('Failed to add CloudWatch transport:', error);
    }
  }

  // Logging methods
  public error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.logger.error(message, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      ...metadata
    });
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.logger.info(message, metadata);
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.logger.debug(message, metadata);
  }

  public http(message: string, metadata?: Record<string, any>): void {
    this.logger.http(message, metadata);
  }

  // Performance logging
  public startTimer(): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      return duration;
    };
  }

  public async logPerformance<T>(
    operation: string, 
    fn: () => Promise<T>
  ): Promise<T> {
    const timer = this.startTimer();
    try {
      const result = await fn();
      const duration = timer();
      this.info(`${operation} completed`, { duration, success: true });
      return result;
    } catch (error) {
      const duration = timer();
      this.error(`${operation} failed`, error, { duration, success: false });
      throw error;
    }
  }

  // Child logger with additional context
  public child(additionalContext: string): Logger {
    return new Logger(`${this.context}:${additionalContext}`);
  }
}
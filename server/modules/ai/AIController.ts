import { Request, Response, NextFunction } from 'express';
import { AIService } from './AIService';
import { AIValidator } from './AIValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';
import { RateLimiter } from '../../utils/rateLimiter';

export class AIController {
  private aiService: AIService;
  private validator: AIValidator;
  private logger: Logger;
  private metrics: MetricsCollector;
  private rateLimiter: RateLimiter;

  constructor() {
    this.aiService = new AIService();
    this.validator = new AIValidator();
    this.logger = new Logger('AIController');
    this.metrics = getMetrics();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Chat with AI
   */
  public async chat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      // Rate limiting based on user type
      const limit = this.getRateLimitForUserType(req.user!.tipo_usuario);
      const canChat = await this.rateLimiter.checkLimit(
        `ai-chat:${req.user!.id}`,
        limit,
        3600 // 1 hour window
      );

      if (!canChat) {
        throw AppErrors.tooManyRequests('AI chat limit exceeded');
      }

      const validationResult = this.validator.validateChatRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const response = await this.aiService.chat({
        message: validationResult.data.message,
        userId: req.user!.id,
        model: validationResult.data.model,
        temperature: validationResult.data.temperature,
        maxTokens: validationResult.data.maxTokens,
        systemPrompt: validationResult.data.systemPrompt,
        conversationId: validationResult.data.conversationId
      });

      const duration = timer();
      this.logger.info('AI chat completed', {
        userId: req.user!.id,
        model: response.model,
        tokensUsed: response.usage.totalTokens,
        duration
      });

      this.metrics.timing('ai.chat.duration', duration);
      this.metrics.increment('ai.chat.success');
      this.metrics.gauge('ai.chat.tokens', response.usage.totalTokens);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('AI chat failed', error, { duration });
      this.metrics.increment('ai.chat.failure');
      next(error);
    }
  }

  /**
   * Generate lesson plan
   */
  public async generateLessonPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const canGenerate = await this.rateLimiter.checkLimit(
        `ai-lesson:${req.user!.id}`,
        20, // 20 lesson plans per hour
        3600
      );

      if (!canGenerate) {
        throw AppErrors.tooManyRequests('Lesson plan generation limit exceeded');
      }

      const validationResult = this.validator.validateLessonPlanRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const lessonPlan = await this.aiService.generateLessonPlan({
        ...validationResult.data,
        userId: req.user!.id,
        escolaId: req.user!.escola_id
      });

      const duration = timer();
      this.logger.info('Lesson plan generated', {
        userId: req.user!.id,
        subject: validationResult.data.subject,
        grade: validationResult.data.grade,
        duration
      });

      this.metrics.timing('ai.lessonPlan.duration', duration);
      this.metrics.increment('ai.lessonPlan.success');

      res.json({
        success: true,
        data: lessonPlan
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Lesson plan generation failed', error, { duration });
      this.metrics.increment('ai.lessonPlan.failure');
      next(error);
    }
  }

  /**
   * Generate assessment
   */
  public async generateAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateAssessmentRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const assessment = await this.aiService.generateAssessment({
        ...validationResult.data,
        userId: req.user!.id
      });

      const duration = timer();
      this.logger.info('Assessment generated', {
        userId: req.user!.id,
        type: validationResult.data.type,
        numberOfQuestions: validationResult.data.numberOfQuestions,
        duration
      });

      this.metrics.timing('ai.assessment.duration', duration);
      this.metrics.increment('ai.assessment.success');

      res.json({
        success: true,
        data: assessment
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Assessment generation failed', error, { duration });
      this.metrics.increment('ai.assessment.failure');
      next(error);
    }
  }

  /**
   * Analyze document
   */
  public async analyzeDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      if (!req.file) {
        throw AppErrors.badRequest('No file provided');
      }

      const validationResult = this.validator.validateDocumentAnalysis(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const analysis = await this.aiService.analyzeDocument({
        file: req.file,
        analysisType: validationResult.data.analysisType,
        userId: req.user!.id,
        options: validationResult.data.options
      });

      const duration = timer();
      this.logger.info('Document analyzed', {
        userId: req.user!.id,
        fileName: req.file.originalname,
        analysisType: validationResult.data.analysisType,
        duration
      });

      this.metrics.timing('ai.document.duration', duration);
      this.metrics.increment('ai.document.success');

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Document analysis failed', error, { duration });
      this.metrics.increment('ai.document.failure');
      next(error);
    }
  }

  /**
   * Generate activity from content
   */
  public async generateActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateActivityRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const activity = await this.aiService.generateActivity({
        ...validationResult.data,
        userId: req.user!.id
      });

      const duration = timer();
      this.logger.info('Activity generated', {
        userId: req.user!.id,
        activityType: validationResult.data.activityType,
        duration
      });

      this.metrics.timing('ai.activity.duration', duration);
      this.metrics.increment('ai.activity.success');

      res.json({
        success: true,
        data: activity
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Activity generation failed', error, { duration });
      this.metrics.increment('ai.activity.failure');
      next(error);
    }
  }

  /**
   * Get AI models status
   */
  public async getModelsStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await this.aiService.getModelsStatus();

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      this.logger.error('Get models status failed', error);
      next(error);
    }
  }

  /**
   * Get user AI preferences
   */
  public async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await this.aiService.getUserPreferences(req.user!.id);

      res.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      this.logger.error('Get preferences failed', error);
      next(error);
    }
  }

  /**
   * Update user AI preferences
   */
  public async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validatePreferencesUpdate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const preferences = await this.aiService.updateUserPreferences(
        req.user!.id,
        validationResult.data
      );

      this.logger.info('AI preferences updated', {
        userId: req.user!.id,
        preferences: validationResult.data
      });

      res.json({
        success: true,
        data: preferences
      });

    } catch (error) {
      this.logger.error('Update preferences failed', error);
      next(error);
    }
  }

  /**
   * Get AI usage statistics
   */
  public async getUsageStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '30d' } = req.query;

      const stats = await this.aiService.getUsageStatistics(
        req.user!.id,
        req.user!.tipo_usuario,
        period as string
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      this.logger.error('Get usage stats failed', error);
      next(error);
    }
  }

  /**
   * Generate content from template
   */
  public async generateFromTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const validationResult = this.validator.validateTemplateRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const content = await this.aiService.generateFromTemplate({
        templateId: validationResult.data.templateId,
        variables: validationResult.data.variables,
        userId: req.user!.id
      });

      const duration = timer();
      this.logger.info('Content generated from template', {
        userId: req.user!.id,
        templateId: validationResult.data.templateId,
        duration
      });

      this.metrics.timing('ai.template.duration', duration);
      this.metrics.increment('ai.template.success');

      res.json({
        success: true,
        data: content
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Template generation failed', error, { duration });
      this.metrics.increment('ai.template.failure');
      next(error);
    }
  }

  /**
   * Stream AI response
   */
  public async streamChat(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validationResult = this.validator.validateChatRequest(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await this.aiService.streamChat({
        message: validationResult.data.message,
        userId: req.user!.id,
        model: validationResult.data.model
      });

      stream.on('data', (chunk: any) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      });

      stream.on('end', () => {
        res.write('data: [DONE]\n\n');
        res.end();
      });

      stream.on('error', (error: Error) => {
        this.logger.error('Stream error', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });

    } catch (error) {
      this.logger.error('Stream chat failed', error);
      res.status(500).json({ error: 'Stream initialization failed' });
    }
  }

  // Helper methods

  private getRateLimitForUserType(userType: string): number {
    const limits: Record<string, number> = {
      admin: 1000,
      gestor: 500,
      diretor: 300,
      professor: 200,
      aluno: 100
    };
    return limits[userType] || 50;
  }
}
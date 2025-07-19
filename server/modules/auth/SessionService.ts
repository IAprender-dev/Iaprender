import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { envConfig } from '../../config/environment';
import crypto from 'crypto';

interface SessionData {
  id: string;
  userId: string;
  cognitoSub: string;
  accessToken: string;
  refreshToken: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  clientInfo?: {
    ip?: string;
    userAgent?: string;
    origin?: string;
    deviceId?: string;
  };
  metadata?: Record<string, any>;
}

interface CreateSessionParams {
  userId: string;
  cognitoSub: string;
  accessToken: string;
  refreshToken: string;
  clientInfo?: Record<string, any>;
  ttl?: number;
}

export class SessionService {
  private redis: Redis;
  private logger: Logger;
  private metrics: MetricsCollector;
  private sessionTTL: number = 24 * 60 * 60; // 24 hours default
  private maxSessionsPerUser: number = 5;

  constructor() {
    this.logger = new Logger('SessionService');
    this.metrics = getMetrics();
    
    // Initialize Redis
    this.redis = new Redis({
      host: envConfig.cache.redis.host,
      port: envConfig.cache.redis.port,
      password: envConfig.cache.redis.password,
      db: 1, // Use DB 1 for sessions
      keyPrefix: 'session:',
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
      this.metrics.increment('session.redis.error');
    });

    this.redis.on('connect', () => {
      this.logger.info('Redis connected for sessions');
    });
  }

  /**
   * Create a new session
   */
  public async createSession(params: CreateSessionParams): Promise<string> {
    const timer = this.metrics.startTimer();
    
    try {
      const sessionId = this.generateSessionId();
      const now = new Date();
      const ttl = params.ttl || this.sessionTTL;
      
      const sessionData: SessionData = {
        id: sessionId,
        userId: params.userId,
        cognitoSub: params.cognitoSub,
        accessToken: params.accessToken,
        refreshToken: params.refreshToken,
        createdAt: now,
        lastActivity: now,
        expiresAt: new Date(now.getTime() + ttl * 1000),
        clientInfo: params.clientInfo
      };

      // Store session
      await this.redis.setex(
        sessionId,
        ttl,
        JSON.stringify(sessionData)
      );

      // Add to user's session list
      const userSessionKey = `user:${params.userId}:sessions`;
      await this.redis.zadd(
        userSessionKey,
        now.getTime(),
        sessionId
      );
      await this.redis.expire(userSessionKey, ttl);

      // Enforce session limit
      await this.enforceSessionLimit(params.userId);

      // Store reverse lookup for token invalidation
      await this.redis.setex(
        `token:${this.hashToken(params.accessToken)}`,
        3600, // 1 hour for access token
        sessionId
      );

      const duration = timer();
      this.logger.info('Session created', {
        sessionId,
        userId: params.userId,
        duration
      });
      this.metrics.timing('session.create.duration', duration);
      this.metrics.increment('session.create.success');

      return sessionId;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to create session', error);
      this.metrics.increment('session.create.error');
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  public async getSession(sessionId: string): Promise<SessionData | null> {
    const timer = this.metrics.startTimer();
    
    try {
      const data = await this.redis.get(sessionId);
      
      if (!data) {
        return null;
      }

      const session = JSON.parse(data) as SessionData;
      
      // Check if expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.endSession(sessionId);
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      await this.redis.setex(
        sessionId,
        Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
        JSON.stringify(session)
      );

      const duration = timer();
      this.metrics.timing('session.get.duration', duration);
      
      return session;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to get session', error);
      this.metrics.increment('session.get.error');
      return null;
    }
  }

  /**
   * Get session by access token
   */
  public async getSessionByToken(accessToken: string): Promise<SessionData | null> {
    try {
      const tokenHash = this.hashToken(accessToken);
      const sessionId = await this.redis.get(`token:${tokenHash}`);
      
      if (!sessionId) {
        return null;
      }

      return this.getSession(sessionId);

    } catch (error) {
      this.logger.error('Failed to get session by token', error);
      return null;
    }
  }

  /**
   * Update session
   */
  public async updateSession(
    sessionId: string, 
    updates: Partial<SessionData>
  ): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return false;
      }

      const updatedSession = {
        ...session,
        ...updates,
        lastActivity: new Date()
      };

      const ttl = Math.floor(
        (new Date(updatedSession.expiresAt).getTime() - Date.now()) / 1000
      );

      if (ttl <= 0) {
        await this.endSession(sessionId);
        return false;
      }

      await this.redis.setex(
        sessionId,
        ttl,
        JSON.stringify(updatedSession)
      );

      return true;

    } catch (error) {
      this.logger.error('Failed to update session', error);
      return false;
    }
  }

  /**
   * Extend session TTL
   */
  public async extendSession(sessionId: string, additionalTTL?: number): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      
      if (!session) {
        return false;
      }

      const extension = additionalTTL || this.sessionTTL;
      const newExpiresAt = new Date(Date.now() + extension * 1000);

      return this.updateSession(sessionId, {
        expiresAt: newExpiresAt
      });

    } catch (error) {
      this.logger.error('Failed to extend session', error);
      return false;
    }
  }

  /**
   * End a session
   */
  public async endSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      
      if (session) {
        // Remove session
        await this.redis.del(sessionId);
        
        // Remove from user's session list
        await this.redis.zrem(
          `user:${session.userId}:sessions`,
          sessionId
        );

        // Remove token mapping
        if (session.accessToken) {
          await this.redis.del(`token:${this.hashToken(session.accessToken)}`);
        }

        this.logger.info('Session ended', { sessionId, userId: session.userId });
        this.metrics.increment('session.end.success');
      }

    } catch (error) {
      this.logger.error('Failed to end session', error);
      this.metrics.increment('session.end.error');
    }
  }

  /**
   * End all sessions for a user
   */
  public async endAllUserSessions(userId: string): Promise<number> {
    try {
      const userSessionKey = `user:${userId}:sessions`;
      const sessionIds = await this.redis.zrange(userSessionKey, 0, -1);
      
      let count = 0;
      
      for (const sessionId of sessionIds) {
        await this.endSession(sessionId);
        count++;
      }

      // Clear user session list
      await this.redis.del(userSessionKey);

      this.logger.info('All user sessions ended', { userId, count });
      this.metrics.increment('session.endAll.success', count);
      
      return count;

    } catch (error) {
      this.logger.error('Failed to end all user sessions', error);
      this.metrics.increment('session.endAll.error');
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionKey = `user:${userId}:sessions`;
      const sessionIds = await this.redis.zrange(userSessionKey, 0, -1);
      
      const sessions: SessionData[] = [];
      
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

    } catch (error) {
      this.logger.error('Failed to get user sessions', error);
      return [];
    }
  }

  /**
   * Validate session
   */
  public async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return !!session && new Date(session.expiresAt) > new Date();
  }

  /**
   * Get session statistics
   */
  public async getStatistics(): Promise<{
    activeSessions: number;
    uniqueUsers: number;
    averageSessionDuration: number;
    sessionsCreatedToday: number;
  }> {
    try {
      // Get all session keys
      const keys = await this.redis.keys('session:*');
      const activeSessions = keys.filter(k => !k.includes(':sessions')).length;

      // Get unique users
      const userKeys = await this.redis.keys('user:*:sessions');
      const uniqueUsers = userKeys.length;

      // Calculate average session duration (simplified)
      let totalDuration = 0;
      let sessionCount = 0;

      for (const key of keys.slice(0, 100)) { // Sample first 100
        if (!key.includes(':sessions')) {
          const data = await this.redis.get(key.replace('session:', ''));
          if (data) {
            const session = JSON.parse(data) as SessionData;
            const duration = new Date(session.lastActivity).getTime() - 
                           new Date(session.createdAt).getTime();
            totalDuration += duration;
            sessionCount++;
          }
        }
      }

      const averageSessionDuration = sessionCount > 0 
        ? Math.floor(totalDuration / sessionCount / 1000) 
        : 0;

      // Sessions created today (would need separate tracking)
      const sessionsCreatedToday = 0; // Placeholder

      return {
        activeSessions,
        uniqueUsers,
        averageSessionDuration,
        sessionsCreatedToday
      };

    } catch (error) {
      this.logger.error('Failed to get session statistics', error);
      return {
        activeSessions: 0,
        uniqueUsers: 0,
        averageSessionDuration: 0,
        sessionsCreatedToday: 0
      };
    }
  }

  /**
   * Clean expired sessions
   */
  public async cleanExpiredSessions(): Promise<number> {
    try {
      const keys = await this.redis.keys('session:*');
      let cleaned = 0;

      for (const key of keys) {
        if (!key.includes(':sessions')) {
          const sessionId = key.replace('session:', '');
          const data = await this.redis.get(sessionId);
          
          if (data) {
            const session = JSON.parse(data) as SessionData;
            if (new Date(session.expiresAt) < new Date()) {
              await this.endSession(sessionId);
              cleaned++;
            }
          }
        }
      }

      this.logger.info('Cleaned expired sessions', { count: cleaned });
      this.metrics.increment('session.cleanup.success', cleaned);
      
      return cleaned;

    } catch (error) {
      this.logger.error('Failed to clean expired sessions', error);
      this.metrics.increment('session.cleanup.error');
      return 0;
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return `${uuidv4()}-${Date.now()}`;
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Enforce session limit per user
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      const userSessionKey = `user:${userId}:sessions`;
      const sessionIds = await this.redis.zrange(userSessionKey, 0, -1);
      
      if (sessionIds.length > this.maxSessionsPerUser) {
        // Remove oldest sessions
        const toRemove = sessionIds.slice(0, sessionIds.length - this.maxSessionsPerUser);
        
        for (const sessionId of toRemove) {
          await this.endSession(sessionId);
        }
        
        this.logger.info('Session limit enforced', {
          userId,
          removed: toRemove.length
        });
      }

    } catch (error) {
      this.logger.error('Failed to enforce session limit', error);
    }
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    await this.redis.quit();
  }
}
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';
import { Logger } from '../utils/logger';
import { envConfig } from '../config/environment';
import { AppErrors } from '../middleware/errorHandler';
import crypto from 'crypto';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  tipo_usuario: string;
  empresa_id: number;
  escola_id?: number;
  cognito_sub: string;
  groups: string[];
  sessionId?: string;
  [key: string]: any;
}

interface RefreshTokenPayload {
  tokenId: string;
  userId: string;
  iat: number;
  exp: number;
}

export class JWTService {
  private logger: Logger;
  private redis: Redis;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string = '1h';
  private refreshTokenExpiry: string = '7d';
  private issuer: string = 'iaprender-api';
  private audience: string = 'iaprender-users';

  constructor() {
    this.logger = new Logger('JWTService');
    
    // Get secrets from environment
    this.accessTokenSecret = envConfig.auth.jwt.secret;
    this.refreshTokenSecret = envConfig.auth.jwt.refreshSecret || 
      crypto.createHash('sha256').update(this.accessTokenSecret + ':refresh').digest('hex');
    
    // Initialize Redis for token blacklist
    this.redis = new Redis({
      host: envConfig.cache.redis.host,
      port: envConfig.cache.redis.port,
      password: envConfig.cache.redis.password,
      db: 2, // Use DB 2 for token blacklist
      keyPrefix: 'blacklist:',
      enableOfflineQueue: false
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });
  }

  /**
   * Generate access token
   */
  public generateToken(payload: TokenPayload): string {
    try {
      const token = jwt.sign(
        {
          ...payload,
          type: 'access'
        },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry,
          issuer: this.issuer,
          audience: this.audience,
          algorithm: 'HS256'
        }
      );

      this.logger.debug('Access token generated', { 
        userId: payload.id,
        email: payload.email 
      });

      return token;

    } catch (error) {
      this.logger.error('Failed to generate access token', error);
      throw AppErrors.internal('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(userId: string): string {
    try {
      const tokenId = uuidv4();
      
      const payload: RefreshTokenPayload = {
        tokenId,
        userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      };

      const token = jwt.sign(
        payload,
        this.refreshTokenSecret,
        {
          algorithm: 'HS256'
        }
      );

      this.logger.debug('Refresh token generated', { userId, tokenId });

      return token;

    } catch (error) {
      this.logger.error('Failed to generate refresh token', error);
      throw AppErrors.internal('Failed to generate refresh token');
    }
  }

  /**
   * Verify access token
   */
  public async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw AppErrors.unauthorized('Token has been revoked');
      }

      // Verify token
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256']
      }) as TokenPayload;

      // Check token type
      if (decoded.type !== 'access') {
        throw AppErrors.unauthorized('Invalid token type');
      }

      return decoded;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppErrors.unauthorized('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppErrors.unauthorized('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isRefreshTokenBlacklisted(token);
      if (isBlacklisted) {
        throw AppErrors.unauthorized('Refresh token has been revoked');
      }

      // Verify token
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: ['HS256']
      }) as RefreshTokenPayload;

      return decoded;

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppErrors.unauthorized('Refresh token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw AppErrors.unauthorized('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification
   */
  public decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.error('Failed to decode token', error);
      return null;
    }
  }

  /**
   * Invalidate access token
   */
  public async invalidateToken(token: string): Promise<void> {
    try {
      const decoded = this.decodeToken(token) as any;
      if (!decoded || !decoded.exp) {
        return;
      }

      // Calculate TTL until token expiry
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) {
        return; // Token already expired
      }

      // Add to blacklist
      const tokenHash = this.hashToken(token);
      await this.redis.setex(`access:${tokenHash}`, ttl, '1');

      this.logger.debug('Access token invalidated', { ttl });

    } catch (error) {
      this.logger.error('Failed to invalidate access token', error);
    }
  }

  /**
   * Invalidate refresh token
   */
  public async invalidateRefreshToken(tokenId: string): Promise<void> {
    try {
      // Add to blacklist with 7 day TTL
      const ttl = 7 * 24 * 60 * 60;
      await this.redis.setex(`refresh:${tokenId}`, ttl, '1');

      this.logger.debug('Refresh token invalidated', { tokenId });

    } catch (error) {
      this.logger.error('Failed to invalidate refresh token', error);
    }
  }

  /**
   * Check if access token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const exists = await this.redis.exists(`access:${tokenHash}`);
      return exists === 1;
    } catch (error) {
      this.logger.error('Failed to check token blacklist', error);
      return false; // Fail open
    }
  }

  /**
   * Check if refresh token is blacklisted
   */
  private async isRefreshTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = this.decodeToken(token) as RefreshTokenPayload;
      if (!decoded || !decoded.tokenId) {
        return false;
      }

      const exists = await this.redis.exists(`refresh:${decoded.tokenId}`);
      return exists === 1;
    } catch (error) {
      this.logger.error('Failed to check refresh token blacklist', error);
      return false; // Fail open
    }
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate tokens for OAuth
   */
  public generateOAuthTokens(
    payload: TokenPayload,
    options?: {
      accessTokenExpiry?: string;
      refreshTokenExpiry?: string;
      includeRefreshToken?: boolean;
    }
  ): {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
  } {
    const accessToken = jwt.sign(
      {
        ...payload,
        type: 'access'
      },
      this.accessTokenSecret,
      {
        expiresIn: options?.accessTokenExpiry || this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        algorithm: 'HS256'
      }
    );

    const result: any = {
      accessToken,
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer'
    };

    if (options?.includeRefreshToken !== false) {
      result.refreshToken = this.generateRefreshToken(payload.id);
    }

    return result;
  }

  /**
   * Exchange code for tokens (OAuth flow)
   */
  public async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    id_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    // This would typically call Cognito's token endpoint
    // For now, throwing not implemented
    throw AppErrors.notImplemented('OAuth code exchange not implemented');
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    await this.redis.quit();
  }
}
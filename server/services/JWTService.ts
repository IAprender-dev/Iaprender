import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { envConfig } from '../config/environment';
import { Logger } from '../utils/logger';
import { Cache } from '../utils/cache';
import { AppErrors } from '../middleware/errorHandler';

interface TokenPayload {
  id: string | number;
  email: string;
  name: string;
  tipo_usuario: string;
  empresa_id: number;
  escola_id?: number | null;
  cognito_sub: string;
  groups: string[];
}

interface RefreshTokenPayload {
  userId: string | number;
  tokenId: string;
  type: 'refresh';
}

export class JWTService {
  private logger: Logger;
  private cache: Cache;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;
  private issuer: string;

  constructor() {
    this.logger = new Logger('JWTService');
    this.cache = new Cache('jwt', 3600); // 1 hour cache
    
    this.accessTokenSecret = envConfig.security.jwtSecret || this.generateSecret();
    this.refreshTokenSecret = envConfig.security.refreshTokenSecret || this.generateSecret();
    this.accessTokenExpiry = envConfig.security.accessTokenExpiry || '1h';
    this.refreshTokenExpiry = envConfig.security.refreshTokenExpiry || '7d';
    this.issuer = 'iaprender';
    
    if (!envConfig.security.jwtSecret) {
      this.logger.warn('JWT secret not configured, using generated secret');
    }
  }

  private generateSecret(): string {
    return randomBytes(64).toString('hex');
  }

  public generateToken(payload: TokenPayload): string {
    try {
      const tokenId = randomBytes(16).toString('hex');
      
      const token = jwt.sign(
        {
          ...payload,
          jti: tokenId,
          type: 'access'
        },
        this.accessTokenSecret,
        {
          expiresIn: this.accessTokenExpiry,
          issuer: this.issuer,
          audience: 'iaprender-api',
          algorithm: 'HS256'
        }
      );

      // Store token metadata in cache for validation
      this.cache.set(`token:${tokenId}`, {
        userId: payload.id,
        email: payload.email,
        issuedAt: Date.now(),
        valid: true
      });

      this.logger.debug('Access token generated', { 
        userId: payload.id, 
        email: payload.email 
      });

      return token;
    } catch (error) {
      this.logger.error('Failed to generate token', error);
      throw AppErrors.internal('Failed to generate authentication token');
    }
  }

  public generateRefreshToken(userId: string | number): string {
    try {
      const tokenId = randomBytes(32).toString('hex');
      
      const payload: RefreshTokenPayload = {
        userId,
        tokenId,
        type: 'refresh'
      };

      const token = jwt.sign(
        payload,
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          issuer: this.issuer,
          audience: 'iaprender-refresh',
          algorithm: 'HS256'
        }
      );

      // Store refresh token in cache
      this.cache.set(`refresh:${tokenId}`, {
        userId,
        issuedAt: Date.now(),
        valid: true
      }, 7 * 24 * 60 * 60); // 7 days

      this.logger.debug('Refresh token generated', { userId });

      return token;
    } catch (error) {
      this.logger.error('Failed to generate refresh token', error);
      throw AppErrors.internal('Failed to generate refresh token');
    }
  }

  public verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: this.issuer,
        audience: 'iaprender-api',
        algorithms: ['HS256']
      }) as any;

      // Check if token is blacklisted
      const tokenId = decoded.jti;
      if (tokenId) {
        const tokenMeta = this.cache.get(`token:${tokenId}`);
        if (tokenMeta && !tokenMeta.valid) {
          throw new Error('Token has been invalidated');
        }
      }

      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        tipo_usuario: decoded.tipo_usuario,
        empresa_id: decoded.empresa_id,
        escola_id: decoded.escola_id,
        cognito_sub: decoded.cognito_sub,
        groups: decoded.groups || []
      };
    } catch (error: any) {
      this.logger.error('Token verification failed', error);
      
      if (error.name === 'TokenExpiredError') {
        throw AppErrors.unauthorized('Token has expired');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw AppErrors.unauthorized('Invalid token');
      }
      
      throw AppErrors.unauthorized('Token verification failed');
    }
  }

  public async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: this.issuer,
        audience: 'iaprender-refresh',
        algorithms: ['HS256']
      }) as RefreshTokenPayload;

      // Check if refresh token is still valid
      const tokenMeta = this.cache.get(`refresh:${decoded.tokenId}`);
      if (!tokenMeta || !tokenMeta.valid) {
        throw new Error('Refresh token has been invalidated');
      }

      return decoded;
    } catch (error: any) {
      this.logger.error('Refresh token verification failed', error);
      
      if (error.name === 'TokenExpiredError') {
        throw AppErrors.unauthorized('Refresh token has expired');
      }
      
      throw AppErrors.unauthorized('Invalid refresh token');
    }
  }

  public async invalidateToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded?.jti) {
        const tokenMeta = this.cache.get(`token:${decoded.jti}`);
        if (tokenMeta) {
          tokenMeta.valid = false;
          this.cache.set(`token:${decoded.jti}`, tokenMeta);
        }
      }
      
      this.logger.debug('Token invalidated', { tokenId: decoded?.jti });
    } catch (error) {
      this.logger.error('Failed to invalidate token', error);
    }
  }

  public async invalidateRefreshToken(tokenId: string): Promise<void> {
    try {
      const tokenMeta = this.cache.get(`refresh:${tokenId}`);
      if (tokenMeta) {
        tokenMeta.valid = false;
        this.cache.set(`refresh:${tokenId}`, tokenMeta);
      }
      
      this.logger.debug('Refresh token invalidated', { tokenId });
    } catch (error) {
      this.logger.error('Failed to invalidate refresh token', error);
    }
  }

  public decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      this.logger.error('Failed to decode token', error);
      return null;
    }
  }

  public async rotateRefreshToken(oldToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify old refresh token
      const oldPayload = await this.verifyRefreshToken(oldToken);
      
      // Invalidate old refresh token
      await this.invalidateRefreshToken(oldPayload.tokenId);
      
      // Generate new tokens
      // Note: In production, fetch full user data from database
      const userPayload: TokenPayload = {
        id: oldPayload.userId,
        email: 'user@example.com', // Fetch from DB
        name: 'User', // Fetch from DB
        tipo_usuario: 'user', // Fetch from DB
        empresa_id: 1, // Fetch from DB
        escola_id: null,
        cognito_sub: '', // Fetch from DB
        groups: []
      };
      
      const accessToken = this.generateToken(userPayload);
      const refreshToken = this.generateRefreshToken(oldPayload.userId);
      
      this.logger.info('Tokens rotated successfully', { userId: oldPayload.userId });
      
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error('Token rotation failed', error);
      throw error;
    }
  }

  public extractBearerToken(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }

  public async validateTokenChain(
    accessToken: string, 
    refreshToken?: string
  ): Promise<boolean> {
    try {
      // Verify access token
      const accessPayload = this.verifyToken(accessToken);
      
      // If refresh token provided, verify it belongs to same user
      if (refreshToken) {
        const refreshPayload = await this.verifyRefreshToken(refreshToken);
        if (refreshPayload.userId !== accessPayload.id) {
          throw new Error('Token mismatch');
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  public generateApiKey(userId: string | number, name: string): string {
    const keyId = randomBytes(16).toString('hex');
    const secret = randomBytes(32).toString('hex');
    const apiKey = `${keyId}.${secret}`;
    
    // Hash the secret before storing
    const hashedSecret = createHash('sha256').update(secret).digest('hex');
    
    // Store API key metadata
    this.cache.set(`apikey:${keyId}`, {
      userId,
      name,
      secret: hashedSecret,
      created: Date.now(),
      lastUsed: null,
      valid: true
    }, 365 * 24 * 60 * 60); // 1 year
    
    this.logger.info('API key generated', { userId, name, keyId });
    
    return apiKey;
  }

  public async verifyApiKey(apiKey: string): Promise<{
    userId: string | number;
    name: string;
  }> {
    try {
      const [keyId, secret] = apiKey.split('.');
      if (!keyId || !secret) {
        throw new Error('Invalid API key format');
      }
      
      const keyMeta = this.cache.get(`apikey:${keyId}`);
      if (!keyMeta || !keyMeta.valid) {
        throw new Error('Invalid API key');
      }
      
      // Verify secret
      const hashedSecret = createHash('sha256').update(secret).digest('hex');
      if (hashedSecret !== keyMeta.secret) {
        throw new Error('Invalid API key');
      }
      
      // Update last used
      keyMeta.lastUsed = Date.now();
      this.cache.set(`apikey:${keyId}`, keyMeta);
      
      return {
        userId: keyMeta.userId,
        name: keyMeta.name
      };
    } catch (error) {
      this.logger.error('API key verification failed', error);
      throw AppErrors.unauthorized('Invalid API key');
    }
  }
}
import { UserRepository } from '../../repositories/UserRepository';
import { CognitoAuthService } from '../../services/CognitoAuthService-production';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { Cache, getCache } from '../../utils/cache';
import { AppErrors } from '../../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { AuditService } from '../audit/AuditService';

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  filters?: any;
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

interface BulkCreateResult {
  created: any[];
  failed: Array<{
    row: number;
    email: string;
    error: string;
  }>;
}

export class UserService {
  private userRepository: UserRepository;
  private cognitoService: CognitoAuthService;
  private auditService: AuditService;
  private logger: Logger;
  private metrics: MetricsCollector;
  private cache: Cache;

  constructor() {
    this.userRepository = new UserRepository();
    this.cognitoService = new CognitoAuthService();
    this.auditService = new AuditService();
    this.logger = new Logger('UserService');
    this.metrics = getMetrics();
    this.cache = getCache('users', 300); // 5 min cache
  }

  /**
   * List users with pagination and filters
   */
  public async listUsers(params: ListUsersParams): Promise<any> {
    const cacheKey = this.cache.createHashKey(params);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { page, limit, search, filters, sort } = params;

      // Build query conditions
      const conditions: any = { ...filters };
      
      // Add search conditions
      if (search) {
        conditions._or = [
          { nome: { ilike: `%${search}%` } },
          { email: { ilike: `%${search}%` } }
        ];
      }

      // Get paginated users
      const result = await this.userRepository.findPaginated(
        conditions,
        page,
        limit,
        {
          orderBy: sort ? [{
            column: sort.column,
            direction: sort.direction
          }] : undefined
        }
      );

      // Get additional stats if requested
      const withStats = await this.enrichUsersWithStats(result.data);

      const response = {
        ...result,
        data: withStats
      };

      this.cache.set(cacheKey, response);
      this.metrics.increment('users.list.success');

      return response;

    } catch (error) {
      this.logger.error('Failed to list users', error);
      this.metrics.increment('users.list.failure');
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(id: string): Promise<any> {
    const cacheKey = `user:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        return null;
      }

      // Enrich with additional data
      const enriched = await this.enrichUserData(user);
      
      this.cache.set(cacheKey, enriched);
      return enriched;

    } catch (error) {
      this.logger.error('Failed to get user', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  public async createUser(userData: any): Promise<any> {
    const timer = this.metrics.startTimer();

    try {
      // Create user in database and Cognito
      const user = await this.userRepository.createUser({
        ...userData,
        senha: userData.password, // Will be hashed in repository
        sendWelcomeEmail: userData.sendWelcomeEmail !== false,
        cognitoGroups: this.mapTipoToGroups(userData.tipoUsuario)
      });

      // Audit log
      await this.auditService.log({
        userId: userData.createdBy,
        action: 'USER_CREATED',
        resource: 'users',
        resourceId: user.id,
        details: {
          email: user.email,
          tipoUsuario: user.tipoUsuario
        }
      });

      // Clear cache
      this.cache.flush();

      const duration = timer();
      this.logger.info('User created', {
        userId: user.id,
        email: user.email,
        duration
      });
      this.metrics.timing('users.create.duration', duration);

      return user;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to create user', error);
      this.metrics.increment('users.create.failure');
      
      if (error instanceof Error && error.message.includes('already exists')) {
        throw AppErrors.conflict('User with this email already exists');
      }
      
      throw error;
    }
  }

  /**
   * Update user
   */
  public async updateUser(id: string, updateData: any): Promise<any> {
    const timer = this.metrics.startTimer();

    try {
      // Update user
      const user = await this.userRepository.updateUser(id, updateData);
      
      if (!user) {
        return null;
      }

      // Update Cognito groups if tipo changed
      if (updateData.tipoUsuario) {
        await this.updateCognitoGroups(user.email, updateData.tipoUsuario);
      }

      // Audit log
      await this.auditService.log({
        userId: updateData.updatedBy,
        action: 'USER_UPDATED',
        resource: 'users',
        resourceId: id,
        details: {
          changes: updateData
        }
      });

      // Clear cache
      this.cache.delete(`user:${id}`);
      this.cache.flush();

      const duration = timer();
      this.logger.info('User updated', {
        userId: id,
        duration
      });
      this.metrics.timing('users.update.duration', duration);

      return user;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to update user', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(id: string): Promise<boolean> {
    const timer = this.metrics.startTimer();

    try {
      // Get user before deletion for audit
      const user = await this.userRepository.findById(id);
      if (!user) {
        return false;
      }

      // Delete from database and Cognito
      const success = await this.userRepository.deleteUser(id);

      if (success) {
        // Audit log
        await this.auditService.log({
          userId: 'system', // Should be passed from controller
          action: 'USER_DELETED',
          resource: 'users',
          resourceId: id,
          details: {
            email: user.email,
            tipoUsuario: user.tipoUsuario
          }
        });

        // Clear cache
        this.cache.delete(`user:${id}`);
        this.cache.flush();
      }

      const duration = timer();
      this.logger.info('User deleted', {
        userId: id,
        success,
        duration
      });
      this.metrics.timing('users.delete.duration', duration);

      return success;

    } catch (error) {
      const duration = timer();
      this.logger.error('Failed to delete user', error);
      throw error;
    }
  }

  /**
   * Bulk create users
   */
  public async bulkCreateUsers(users: any[], createdBy: string): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      created: [],
      failed: []
    };

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      
      try {
        const user = await this.createUser({
          ...userData,
          createdBy
        });
        result.created.push(user);
      } catch (error) {
        result.failed.push({
          row: i + 1,
          email: userData.email || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  /**
   * Get user statistics
   */
  public async getUserStatistics(empresaId?: number): Promise<any> {
    const cacheKey = `stats:${empresaId || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const stats = await this.userRepository.getStatistics(empresaId);
      
      this.cache.set(cacheKey, stats, 600); // 10 min cache
      return stats;

    } catch (error) {
      this.logger.error('Failed to get user statistics', error);
      throw error;
    }
  }

  /**
   * Verify user password
   */
  public async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.senha) {
        return false;
      }

      return bcrypt.compare(password, user.senha);

    } catch (error) {
      this.logger.error('Failed to verify password', error);
      return false;
    }
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update in database
      await this.userRepository.update(userId, {
        senha: hashedPassword
      });

      // Update in Cognito
      try {
        await this.cognitoService.adminSetUserPassword(user.email, newPassword);
      } catch (cognitoError) {
        this.logger.error('Failed to update password in Cognito', cognitoError);
        // Don't fail the operation if Cognito fails
      }

      // Audit log
      await this.auditService.log({
        userId,
        action: 'PASSWORD_CHANGED',
        resource: 'users',
        resourceId: userId
      });

    } catch (error) {
      this.logger.error('Failed to change password', error);
      throw error;
    }
  }

  /**
   * Toggle user status
   */
  public async toggleUserStatus(userId: string): Promise<any> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return null;
      }

      const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
      
      // Update status
      const updated = newStatus === 'ativo' 
        ? await this.userRepository.activateUser(userId)
        : await this.userRepository.deactivateUser(userId);

      // Update Cognito
      try {
        if (newStatus === 'ativo') {
          await this.cognitoService.adminEnableUser(user.email);
        } else {
          await this.cognitoService.adminDisableUser(user.email);
        }
      } catch (cognitoError) {
        this.logger.error('Failed to update status in Cognito', cognitoError);
      }

      // Clear cache
      this.cache.delete(`user:${userId}`);
      this.cache.flush();

      return updated;

    } catch (error) {
      this.logger.error('Failed to toggle user status', error);
      throw error;
    }
  }

  /**
   * Export users to CSV
   */
  public async exportUsersToCSV(filters?: any): Promise<string> {
    try {
      const users = await this.userRepository.findAll(filters);
      
      const data = users.map(user => ({
        ID: user.id,
        Nome: user.nome,
        Email: user.email,
        'Tipo de Usuário': user.tipoUsuario,
        Status: user.status,
        Empresa: user.empresaId,
        Escola: user.escolaId || '',
        'Criado em': user.criadoEm,
        'Último Login': user.ultimoLogin || ''
      }));

      const csv = stringify(data, {
        header: true,
        delimiter: ';'
      });

      return csv;

    } catch (error) {
      this.logger.error('Failed to export users', error);
      throw error;
    }
  }

  /**
   * Import users from CSV
   */
  public async importUsersFromCSV(csvData: string, importedBy: string): Promise<BulkCreateResult> {
    try {
      const records = parse(csvData, {
        columns: true,
        delimiter: ';',
        skip_empty_lines: true
      });

      const users = records.map((record: any) => ({
        nome: record.Nome,
        email: record.Email,
        tipoUsuario: record['Tipo de Usuário'],
        empresaId: parseInt(record.Empresa) || undefined,
        escolaId: parseInt(record.Escola) || undefined,
        password: record.Senha || this.generateTemporaryPassword()
      }));

      return this.bulkCreateUsers(users, importedBy);

    } catch (error) {
      this.logger.error('Failed to import users', error);
      throw error;
    }
  }

  // Helper methods

  private async enrichUserData(user: any): Promise<any> {
    // Add related data
    const enriched = { ...user };

    // Get last activity
    // Get document count
    // Get groups from Cognito
    // etc.

    return enriched;
  }

  private async enrichUsersWithStats(users: any[]): Promise<any[]> {
    // Add stats to each user if needed
    return users;
  }

  private mapTipoToGroups(tipoUsuario: string): string[] {
    const mapping: Record<string, string[]> = {
      'admin': ['Admin', 'Users'],
      'gestor': ['Gestores', 'Users'],
      'diretor': ['Diretores', 'Users'],
      'professor': ['Professores', 'Users'],
      'aluno': ['Alunos', 'Users']
    };

    return mapping[tipoUsuario] || ['Users'];
  }

  private async updateCognitoGroups(email: string, tipoUsuario: string): Promise<void> {
    try {
      const groups = this.mapTipoToGroups(tipoUsuario);
      
      // Remove from all groups first
      const allGroups = ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos'];
      for (const group of allGroups) {
        await this.cognitoService.removeUserFromGroup(email, group).catch(() => {});
      }

      // Add to new groups
      for (const group of groups) {
        await this.cognitoService.addUserToGroup(email, group);
      }

    } catch (error) {
      this.logger.error('Failed to update Cognito groups', error);
      // Don't throw - this is not critical
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }
}
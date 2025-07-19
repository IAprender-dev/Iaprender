import { Request, Response, NextFunction } from 'express';
import { UserService } from './UserService';
import { UserValidator } from './UserValidator';
import { Logger } from '../../utils/logger';
import { MetricsCollector, getMetrics } from '../../utils/metrics';
import { AppErrors } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';

export class UserController {
  private userService: UserService;
  private validator: UserValidator;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor() {
    this.userService = new UserService();
    this.validator = new UserValidator();
    this.logger = new Logger('UserController');
    this.metrics = getMetrics();
  }

  /**
   * List users with filters and pagination
   */
  public async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      // Validate query parameters
      const validationResult = this.validator.validateListQuery(req.query);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const {
        page = 1,
        limit = 20,
        search,
        tipoUsuario,
        empresaId,
        escolaId,
        status,
        sort = 'nome',
        order = 'asc'
      } = validationResult.data;

      // Check permissions
      const canViewAllUsers = ['admin', 'gestor'].includes(req.user!.tipo_usuario);
      const filters: any = {};

      if (!canViewAllUsers) {
        // Restrict to same company/school
        if (req.user!.tipo_usuario === 'diretor') {
          filters.escolaId = req.user!.escola_id;
        } else {
          filters.empresaId = req.user!.empresa_id;
        }
      } else if (empresaId) {
        filters.empresaId = empresaId;
      }

      if (escolaId) filters.escolaId = escolaId;
      if (tipoUsuario) filters.tipoUsuario = tipoUsuario;
      if (status) filters.status = status;

      // Get users
      const result = await this.userService.listUsers({
        page,
        limit,
        search,
        filters,
        sort: {
          column: sort,
          direction: order
        }
      });

      const duration = timer();
      this.logger.info('Users listed', {
        userId: req.user!.id,
        count: result.data.length,
        duration
      });
      this.metrics.timing('users.list.duration', duration);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('List users failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  public async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check permissions
      const canViewUser = this.checkViewPermission(req.user!, id);
      if (!canViewUser) {
        throw AppErrors.forbidden('You do not have permission to view this user');
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      this.logger.error('Get user failed', error);
      next(error);
    }
  }

  /**
   * Create new user
   */
  public async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      // Validate input
      const validationResult = this.validator.validateCreate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const userData = validationResult.data;

      // Check permissions
      this.checkCreatePermission(req.user!, userData);

      // Create user
      const user = await this.userService.createUser({
        ...userData,
        createdBy: req.user!.id
      });

      const duration = timer();
      this.logger.info('User created', {
        userId: user.id,
        createdBy: req.user!.id,
        duration
      });
      this.metrics.timing('users.create.duration', duration);
      this.metrics.increment('users.create.success');

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Create user failed', error, { duration });
      this.metrics.increment('users.create.failure');
      next(error);
    }
  }

  /**
   * Update user
   */
  public async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id } = req.params;

      // Validate input
      const validationResult = this.validator.validateUpdate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const updateData = validationResult.data;

      // Check permissions
      this.checkUpdatePermission(req.user!, id, updateData);

      // Update user
      const user = await this.userService.updateUser(id, {
        ...updateData,
        updatedBy: req.user!.id
      });

      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      const duration = timer();
      this.logger.info('User updated', {
        userId: id,
        updatedBy: req.user!.id,
        duration
      });
      this.metrics.timing('users.update.duration', duration);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Update user failed', error, { duration });
      next(error);
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      const { id } = req.params;

      // Check permissions - only admin can delete
      if (req.user!.tipo_usuario !== 'admin') {
        throw AppErrors.forbidden('Only administrators can delete users');
      }

      // Prevent self-deletion
      if (id === req.user!.id) {
        throw AppErrors.badRequest('You cannot delete your own account');
      }

      const success = await this.userService.deleteUser(id);

      if (!success) {
        throw AppErrors.notFound('User not found');
      }

      const duration = timer();
      this.logger.info('User deleted', {
        userId: id,
        deletedBy: req.user!.id,
        duration
      });
      this.metrics.timing('users.delete.duration', duration);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Delete user failed', error, { duration });
      next(error);
    }
  }

  /**
   * Bulk create users
   */
  public async bulkCreateUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const timer = this.metrics.startTimer();

    try {
      // Only admin can bulk create
      if (req.user!.tipo_usuario !== 'admin') {
        throw AppErrors.forbidden('Only administrators can bulk create users');
      }

      // Validate input
      const validationResult = this.validator.validateBulkCreate(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { users } = validationResult.data;

      // Create users
      const result = await this.userService.bulkCreateUsers(users, req.user!.id);

      const duration = timer();
      this.logger.info('Bulk users created', {
        count: result.created.length,
        failed: result.failed.length,
        createdBy: req.user!.id,
        duration
      });
      this.metrics.timing('users.bulkCreate.duration', duration);

      res.status(201).json({
        success: true,
        message: `${result.created.length} users created successfully`,
        data: result
      });

    } catch (error) {
      const duration = timer();
      this.logger.error('Bulk create users failed', error, { duration });
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check permissions
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const empresaId = req.user!.tipo_usuario === 'gestor' 
        ? req.user!.empresa_id 
        : parseInt(req.query.empresaId as string) || undefined;

      const stats = await this.userService.getUserStatistics(empresaId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      this.logger.error('Get user stats failed', error);
      next(error);
    }
  }

  /**
   * Change user password
   */
  public async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Users can only change their own password, admin can change any
      if (req.user!.id !== id && req.user!.tipo_usuario !== 'admin') {
        throw AppErrors.forbidden('You can only change your own password');
      }

      const validationResult = this.validator.validatePasswordChange(req.body);
      if (!validationResult.valid) {
        throw AppErrors.badRequest(validationResult.errors.join(', '));
      }

      const { currentPassword, newPassword } = validationResult.data;

      // Verify current password if not admin
      if (req.user!.tipo_usuario !== 'admin') {
        const isValid = await this.userService.verifyPassword(id, currentPassword);
        if (!isValid) {
          throw AppErrors.badRequest('Current password is incorrect');
        }
      }

      await this.userService.changePassword(id, newPassword);

      this.logger.info('Password changed', {
        userId: id,
        changedBy: req.user!.id
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      this.logger.error('Change password failed', error);
      next(error);
    }
  }

  /**
   * Toggle user status
   */
  public async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Check permissions
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const user = await this.userService.toggleUserStatus(id);

      if (!user) {
        throw AppErrors.notFound('User not found');
      }

      this.logger.info('User status toggled', {
        userId: id,
        newStatus: user.status,
        toggledBy: req.user!.id
      });

      res.json({
        success: true,
        message: `User ${user.status === 'ativo' ? 'activated' : 'deactivated'} successfully`,
        data: user
      });

    } catch (error) {
      this.logger.error('Toggle user status failed', error);
      next(error);
    }
  }

  /**
   * Export users to CSV
   */
  public async exportUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check permissions
      if (!['admin', 'gestor'].includes(req.user!.tipo_usuario)) {
        throw AppErrors.forbidden('Insufficient permissions');
      }

      const filters: any = {};
      if (req.user!.tipo_usuario === 'gestor') {
        filters.empresaId = req.user!.empresa_id;
      }

      const csv = await this.userService.exportUsersToCSV(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);

    } catch (error) {
      this.logger.error('Export users failed', error);
      next(error);
    }
  }

  // Permission check helpers

  private checkViewPermission(user: any, targetUserId: string): boolean {
    // Users can view their own profile
    if (user.id === targetUserId) return true;

    // Admin can view all
    if (user.tipo_usuario === 'admin') return true;

    // Gestor can view users in their company
    if (user.tipo_usuario === 'gestor') return true;

    // Diretor can view users in their school
    if (user.tipo_usuario === 'diretor') return true;

    return false;
  }

  private checkCreatePermission(user: any, userData: any): void {
    // Admin can create any user
    if (user.tipo_usuario === 'admin') return;

    // Gestor can create users in their company
    if (user.tipo_usuario === 'gestor') {
      if (userData.empresaId !== user.empresa_id) {
        throw AppErrors.forbidden('You can only create users in your company');
      }
      // Gestor cannot create admin users
      if (userData.tipoUsuario === 'admin') {
        throw AppErrors.forbidden('You cannot create admin users');
      }
      return;
    }

    // Diretor can create teachers and students in their school
    if (user.tipo_usuario === 'diretor') {
      if (!['professor', 'aluno'].includes(userData.tipoUsuario)) {
        throw AppErrors.forbidden('You can only create teachers and students');
      }
      if (userData.escolaId !== user.escola_id) {
        throw AppErrors.forbidden('You can only create users in your school');
      }
      return;
    }

    throw AppErrors.forbidden('You do not have permission to create users');
  }

  private checkUpdatePermission(user: any, targetUserId: string, updateData: any): void {
    // Users can update their own profile (limited fields)
    if (user.id === targetUserId) {
      const allowedFields = ['nome', 'telefone', 'avatar'];
      const hasRestrictedFields = Object.keys(updateData).some(
        field => !allowedFields.includes(field)
      );
      if (hasRestrictedFields) {
        throw AppErrors.forbidden('You can only update your name, phone and avatar');
      }
      return;
    }

    // Admin can update any user
    if (user.tipo_usuario === 'admin') return;

    // Gestor can update users in their company
    if (user.tipo_usuario === 'gestor') {
      // Cannot change user type to admin
      if (updateData.tipoUsuario === 'admin') {
        throw AppErrors.forbidden('You cannot promote users to admin');
      }
      return;
    }

    throw AppErrors.forbidden('You do not have permission to update this user');
  }
}
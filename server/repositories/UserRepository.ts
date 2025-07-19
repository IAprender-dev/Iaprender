import { usuarios } from '@shared/schema';
import { BaseRepository, FilterConditions, QueryOptions } from '../models/BaseRepository';
import { InferModel } from 'drizzle-orm';
import { AppErrors } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { CognitoAuthService } from '../services/CognitoAuthService-production';

type User = InferModel<typeof usuarios, 'select'>;
type UserInsert = InferModel<typeof usuarios, 'insert'>;

export interface CreateUserData extends Omit<UserInsert, 'senha'> {
  senha?: string;
  sendWelcomeEmail?: boolean;
  cognitoGroups?: string[];
}

export interface UserWithRelations extends User {
  empresa?: any;
  escola?: any;
  totalDocumentos?: number;
  ultimoAcesso?: Date;
}

export class UserRepository extends BaseRepository<typeof usuarios, UserInsert, User> {
  private cognitoService: CognitoAuthService;

  constructor() {
    super(usuarios, 'usuarios');
    this.cognitoService = new CognitoAuthService();
  }

  /**
   * Find user by email
   */
  public async findByEmail(email: string, options: QueryOptions = {}): Promise<User | null> {
    return this.findOne({ email }, options);
  }

  /**
   * Find user by Cognito Sub
   */
  public async findByCognitoSub(cognitoSub: string, options: QueryOptions = {}): Promise<User | null> {
    return this.findOne({ cognito_sub: cognitoSub }, options);
  }

  /**
   * Find users by empresa
   */
  public async findByEmpresa(
    empresaId: number, 
    options: QueryOptions = {}
  ): Promise<User[]> {
    return this.findAll({ empresaId }, options);
  }

  /**
   * Find users by escola
   */
  public async findByEscola(
    escolaId: number,
    options: QueryOptions = {}
  ): Promise<User[]> {
    return this.findAll({ escolaId }, options);
  }

  /**
   * Find users by type
   */
  public async findByTipo(
    tipoUsuario: string,
    options: QueryOptions = {}
  ): Promise<User[]> {
    return this.findAll({ tipoUsuario }, options);
  }

  /**
   * Create user with Cognito integration
   */
  public async createUser(data: CreateUserData): Promise<User> {
    const { senha, sendWelcomeEmail, cognitoGroups, ...userData } = data;

    // Validate unique email
    const existing = await this.findByEmail(userData.email);
    if (existing) {
      throw AppErrors.conflict('User with this email already exists');
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (senha) {
      hashedPassword = await bcrypt.hash(senha, 10);
    }

    // Start transaction
    return this.transaction(async (tx) => {
      // Create user in database
      const user = await this.create(
        {
          ...userData,
          senha: hashedPassword,
          status: 'ativo'
        },
        { transaction: tx }
      );

      try {
        // Create user in Cognito
        const cognitoResult = await this.cognitoService.createUser({
          email: user.email,
          name: user.nome,
          temporaryPassword: senha || this.generateTemporaryPassword(),
          group: this.mapTipoToGroup(user.tipoUsuario),
          attributes: {
            'custom:user_id': user.id.toString(),
            'custom:tipo_usuario': user.tipoUsuario,
            'custom:empresa_id': user.empresaId?.toString() || '',
            'custom:escola_id': user.escolaId?.toString() || ''
          },
          sendEmail: sendWelcomeEmail
        });

        // Update user with Cognito Sub
        const updatedUser = await this.update(
          user.id,
          { cognito_sub: cognitoResult.userId },
          { transaction: tx }
        );

        // Add to additional groups if specified
        if (cognitoGroups && cognitoGroups.length > 0) {
          for (const group of cognitoGroups) {
            await this.cognitoService.addUserToGroup(user.email, group);
          }
        }

        return updatedUser!;

      } catch (cognitoError) {
        this.logger.error('Failed to create user in Cognito', cognitoError);
        throw AppErrors.internal('Failed to complete user creation');
      }
    });
  }

  /**
   * Update user with Cognito sync
   */
  public async updateUser(
    id: string | number,
    data: Partial<UserInsert>
  ): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) {
      throw AppErrors.notFound('User not found');
    }

    // Update in database
    const updated = await this.update(id, data);
    if (!updated) {
      return null;
    }

    // Sync with Cognito if relevant fields changed
    if (data.nome || data.tipoUsuario || data.empresaId || data.escolaId) {
      try {
        await this.cognitoService.updateUserAttributes(user.email, {
          ...(data.nome && { name: data.nome }),
          ...(data.tipoUsuario && { 'custom:tipo_usuario': data.tipoUsuario }),
          ...(data.empresaId !== undefined && { 'custom:empresa_id': data.empresaId.toString() }),
          ...(data.escolaId !== undefined && { 'custom:escola_id': data.escolaId?.toString() || '' })
        });
      } catch (error) {
        this.logger.error('Failed to sync user updates with Cognito', error);
      }
    }

    return updated;
  }

  /**
   * Delete user with Cognito cleanup
   */
  public async deleteUser(id: string | number): Promise<boolean> {
    const user = await this.findById(id);
    if (!user) {
      return false;
    }

    // Delete from Cognito first
    try {
      await this.cognitoService.deleteUser(user.email);
    } catch (error) {
      this.logger.error('Failed to delete user from Cognito', error);
    }

    // Delete from database
    return this.delete(id);
  }

  /**
   * Activate user
   */
  public async activateUser(id: string | number): Promise<User | null> {
    return this.update(id, { status: 'ativo' });
  }

  /**
   * Deactivate user
   */
  public async deactivateUser(id: string | number): Promise<User | null> {
    const updated = await this.update(id, { status: 'inativo' });
    
    if (updated) {
      // Also disable in Cognito
      try {
        const user = await this.findById(id);
        if (user) {
          await this.cognitoService.updateUserAttributes(user.email, {
            'custom:status': 'inativo'
          });
        }
      } catch (error) {
        this.logger.error('Failed to deactivate user in Cognito', error);
      }
    }

    return updated;
  }

  /**
   * Find users with stats
   */
  public async findWithStats(
    conditions?: FilterConditions<User>,
    options: QueryOptions = {}
  ): Promise<UserWithRelations[]> {
    const query = `
      SELECT 
        u.*,
        e.nome as empresa_nome,
        es.nome as escola_nome,
        COUNT(DISTINCT a.id) as total_documentos,
        MAX(al.created_at) as ultimo_acesso
      FROM usuarios u
      LEFT JOIN empresas e ON u.empresa_id = e.id
      LEFT JOIN escolas es ON u.escola_id = es.id
      LEFT JOIN arquivos a ON u.id = a.usuario_id
      LEFT JOIN access_logs al ON u.id = al.user_id
      WHERE 1=1
      ${conditions?.empresaId ? 'AND u.empresa_id = $1' : ''}
      ${conditions?.escolaId ? 'AND u.escola_id = $2' : ''}
      ${conditions?.tipoUsuario ? 'AND u.tipo_usuario = $3' : ''}
      GROUP BY u.id, e.nome, es.nome
      ORDER BY u.nome
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;

    const params = [];
    if (conditions?.empresaId) params.push(conditions.empresaId);
    if (conditions?.escolaId) params.push(conditions.escolaId);
    if (conditions?.tipoUsuario) params.push(conditions.tipoUsuario);

    const results = await this.raw<UserWithRelations>(query, params);
    
    return results.map(row => ({
      ...row,
      totalDocumentos: parseInt(row.totalDocumentos as any) || 0,
      ultimoAcesso: row.ultimoAcesso ? new Date(row.ultimoAcesso) : undefined
    }));
  }

  /**
   * Search users by name or email
   */
  public async search(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<User[]> {
    const searchPattern = `%${searchTerm}%`;
    
    return this.findAll({
      _or: [
        { nome: { ilike: searchPattern } },
        { email: { ilike: searchPattern } }
      ]
    }, options);
  }

  /**
   * Get user statistics
   */
  public async getStatistics(empresaId?: number): Promise<{
    total: number;
    byTipo: Record<string, number>;
    byStatus: Record<string, number>;
    recentlyCreated: number;
    activeLastWeek: number;
  }> {
    const baseConditions = empresaId ? { empresaId } : undefined;

    // Get totals
    const total = await this.count(baseConditions);

    // By tipo
    const tipoQuery = `
      SELECT tipo_usuario, COUNT(*) as count
      FROM usuarios
      ${empresaId ? 'WHERE empresa_id = $1' : ''}
      GROUP BY tipo_usuario
    `;
    const tipoResults = await this.raw<{ tipo_usuario: string; count: string }>(
      tipoQuery,
      empresaId ? [empresaId] : []
    );
    const byTipo = Object.fromEntries(
      tipoResults.map(r => [r.tipo_usuario, parseInt(r.count)])
    );

    // By status
    const statusQuery = `
      SELECT status, COUNT(*) as count
      FROM usuarios
      ${empresaId ? 'WHERE empresa_id = $1' : ''}
      GROUP BY status
    `;
    const statusResults = await this.raw<{ status: string; count: string }>(
      statusQuery,
      empresaId ? [empresaId] : []
    );
    const byStatus = Object.fromEntries(
      statusResults.map(r => [r.status, parseInt(r.count)])
    );

    // Recently created (last 7 days)
    const recentQuery = `
      SELECT COUNT(*) as count
      FROM usuarios
      WHERE criado_em >= NOW() - INTERVAL '7 days'
      ${empresaId ? 'AND empresa_id = $1' : ''}
    `;
    const recentResult = await this.raw<{ count: string }>(
      recentQuery,
      empresaId ? [empresaId] : []
    );
    const recentlyCreated = parseInt(recentResult[0]?.count || '0');

    // Active last week
    const activeQuery = `
      SELECT COUNT(DISTINCT u.id) as count
      FROM usuarios u
      JOIN access_logs al ON u.id = al.user_id
      WHERE al.created_at >= NOW() - INTERVAL '7 days'
      ${empresaId ? 'AND u.empresa_id = $1' : ''}
    `;
    const activeResult = await this.raw<{ count: string }>(
      activeQuery,
      empresaId ? [empresaId] : []
    );
    const activeLastWeek = parseInt(activeResult[0]?.count || '0');

    return {
      total,
      byTipo,
      byStatus,
      recentlyCreated,
      activeLastWeek
    };
  }

  /**
   * Map tipo_usuario to Cognito group
   */
  private mapTipoToGroup(tipoUsuario: string): string {
    const mapping: Record<string, string> = {
      'admin': 'Admin',
      'gestor': 'Gestores',
      'diretor': 'Diretores',
      'professor': 'Professores',
      'aluno': 'Alunos'
    };
    
    return mapping[tipoUsuario] || 'Users';
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure it meets AWS Cognito requirements
    if (!/[A-Z]/.test(password)) password += 'A';
    if (!/[a-z]/.test(password)) password += 'a';
    if (!/[0-9]/.test(password)) password += '1';
    if (!/[!@#$%^&*]/.test(password)) password += '!';
    
    return password;
  }
}
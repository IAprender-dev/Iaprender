/**
 * COGNITO SYNC SERVICE
 * 
 * Serviço para sincronização entre AWS Cognito e banco de dados local
 * Mantém consistência entre usuários do Cognito e registros locais
 */

import AWS from 'aws-sdk';
import { SecretsManager } from '../config/secrets';
import { db } from '../db';
import { eq, sql, count } from 'drizzle-orm';
import { users, gestores, diretores } from '@shared/schema';

interface CognitoUser {
  Username: string;
  UserStatus: string;
  Enabled: boolean;
  UserCreateDate: Date;
  UserLastModifiedDate: Date;
  Attributes: Array<{
    Name: string;
    Value: string;
  }>;
}

interface CognitoGroup {
  GroupName: string;
  UserPoolId: string;
  Description?: string;
  RoleArn?: string;
  Precedence?: number;
  LastModifiedDate: Date;
  CreationDate: Date;
}

interface LocalUser {
  id: number;
  cognito_sub: string;
  email: string;
  nome: string;
  tipo_usuario: string;
  empresa_id?: number;
  escola_id?: number;
  status: string;
  criado_em: Date;
  atualizado_em?: Date;
}

interface SyncResult {
  success: boolean;
  timestamp: string;
  statistics: {
    cognito_users_found: number;
    local_users_found: number;
    users_created: number;
    users_updated: number;
    users_deactivated: number;
    errors: number;
  };
  operations: Array<{
    operation: 'create' | 'update' | 'deactivate' | 'error';
    cognito_id: string;
    email: string;
    message: string;
  }>;
  errors: Array<{
    cognito_id?: string;
    email?: string;
    error: string;
    details: any;
  }>;
}

export class CognitoSyncService {
  private cognitoClient: AWS.CognitoIdentityServiceProvider;
  private userPoolId: string;
  private secrets: any;

  constructor() {
    // Obter credenciais AWS do SecretsManager
    this.secrets = SecretsManager.getAWSCredentials();
    
    // Configurar cliente Cognito com as credenciais corretas dos Secrets
    AWS.config.update({
      region: this.secrets.region,
      accessKeyId: this.secrets.access_key,
      secretAccessKey: this.secrets.secret_key
    });

    this.cognitoClient = new AWS.CognitoIdentityServiceProvider();
    this.userPoolId = this.secrets.cognito_user_pool_id;

    console.log('🔄 CognitoSyncService initialized:', {
      region: this.secrets.region,
      userPoolId: this.userPoolId ? `${this.userPoolId.substring(0, 20)}...` : 'not configured'
    });
  }

  /**
   * Sincronização completa entre Cognito e banco local
   */
  async syncUsers(): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      success: false,
      timestamp: startTime.toISOString(),
      statistics: {
        cognito_users_found: 0,
        local_users_found: 0,
        users_created: 0,
        users_updated: 0,
        users_deactivated: 0,
        errors: 0
      },
      operations: [],
      errors: []
    };

    try {
      console.log('🚀 Iniciando sincronização Cognito → Database');

      // 1. Buscar todos os usuários do Cognito
      const cognitoUsers = await this.getAllCognitoUsers();
      result.statistics.cognito_users_found = cognitoUsers.length;
      console.log(`📊 Usuários encontrados no Cognito: ${cognitoUsers.length}`);

      // 2. Buscar todos os usuários locais
      const localUsers = await this.getAllLocalUsers();
      result.statistics.local_users_found = localUsers.length;
      console.log(`📊 Usuários encontrados no banco local: ${localUsers.length}`);

      // 3. Criar mapa de usuários locais por cognito_sub
      const localUserMap = new Map<string, LocalUser>();
      localUsers.forEach(user => {
        if (user.cognito_sub) {
          localUserMap.set(user.cognito_sub, user);
        }
      });

      // 4. Processar cada usuário do Cognito
      for (const cognitoUser of cognitoUsers) {
        try {
          const cognitoSub = cognitoUser.Username;
          const email = this.extractAttribute(cognitoUser, 'email');
          const firstName = this.extractAttribute(cognitoUser, 'given_name') || '';
          const lastName = this.extractAttribute(cognitoUser, 'family_name') || '';
          const nome = `${firstName} ${lastName}`.trim() || email.split('@')[0];

          if (!email) {
            result.errors.push({
              cognito_id: cognitoSub,
              error: 'Email não encontrado nos atributos do usuário',
              details: cognitoUser.Attributes
            });
            result.statistics.errors++;
            continue;
          }

          const localUser = localUserMap.get(cognitoSub);

          if (!localUser) {
            // Usuário existe no Cognito mas não no banco local - CRIAR
            await this.createLocalUser(cognitoUser, result);
          } else {
            // Usuário existe em ambos - ATUALIZAR se necessário
            await this.updateLocalUser(cognitoUser, localUser, result);
          }

        } catch (error) {
          console.error('❌ Erro ao processar usuário:', error);
          result.errors.push({
            cognito_id: cognitoUser.Username,
            error: 'Erro ao processar usuário',
            details: error instanceof Error ? error.message : String(error)
          });
          result.statistics.errors++;
        }
      }

      // 5. Verificar usuários locais que não existem mais no Cognito
      await this.deactivateOrphanedUsers(cognitoUsers, localUsers, result);

      // 6. Finalizar resultado
      result.success = result.statistics.errors === 0;
      const duration = Date.now() - startTime.getTime();

      console.log('✅ Sincronização concluída:', {
        duration_ms: duration,
        statistics: result.statistics,
        success: result.success
      });

      return result;

    } catch (error) {
      console.error('❌ Erro crítico na sincronização:', error);
      result.errors.push({
        error: 'Erro crítico na sincronização',
        details: error instanceof Error ? error.message : String(error)
      });
      result.statistics.errors++;
      return result;
    }
  }

  /**
   * 🔄 SINCRONIZAR TODOS OS USUÁRIOS COM PAGINAÇÃO COMPLETA
   * Implementação baseada no método Python fornecido
   */
  async syncAllUsers(): Promise<{ success: boolean; users_processed: number; error?: string }> {
    try {
      console.log('🔄 Iniciando sincronização completa de todos os usuários...');

      // 1️⃣ BUSCAR TODOS OS USUÁRIOS DO COGNITO (COM PAGINAÇÃO)
      const cognitoUsers = await this._getAllCognitoUsersWithPagination();
      
      // 2️⃣ PROCESSAR CADA USUÁRIO INDIVIDUALMENTE
      let processedCount = 0;
      for (const user of cognitoUsers) {
        try {
          await this._syncUserToLocal(user);
          processedCount++;
        } catch (error) {
          console.error(`❌ Erro ao processar usuário ${user.Username}:`, error);
        }
      }
      
      console.log(`✅ Sincronização concluída: ${processedCount} usuários processados`);
      return { 
        success: true, 
        users_processed: processedCount 
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro na sincronização: ${errorMessage}`);
      return { 
        success: false, 
        users_processed: 0,
        error: errorMessage 
      };
    }
  }

  /**
   * 📋 BUSCAR TODOS OS USUÁRIOS COM PAGINAÇÃO AUTOMÁTICA (Baseado na implementação Python)
   */
  private async _getAllCognitoUsersWithPagination(): Promise<CognitoUser[]> {
    const users: CognitoUser[] = [];
    let paginationToken: string | undefined = undefined;
    
    console.log('📄 Buscando usuários do Cognito com paginação...');
    
    while (true) {
      try {
        const params: AWS.CognitoIdentityServiceProvider.ListUsersRequest = {
          UserPoolId: this.userPoolId,
          Limit: 60 // Máximo por requisição
        };
        
        if (paginationToken) {
          params.PaginationToken = paginationToken;
        }
        
        // Chamada à API do Cognito
        const response = await this.cognitoClient.listUsers(params).promise();
        
        if (response.Users) {
          users.push(...response.Users as CognitoUser[]);
          console.log(`📊 Página processada: ${response.Users.length} usuários (Total: ${users.length})`);
        }
        
        // Verificar se há mais páginas
        paginationToken = response.PaginationToken;
        if (!paginationToken) {
          break;
        }
        
        // Pequeno delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('❌ Erro ao buscar página de usuários:', error);
        throw error;
      }
    }
    
    console.log(`📊 Total de usuários encontrados no Cognito: ${users.length}`);
    return users;
  }

  /**
   * 🔄 SINCRONIZA USUÁRIO INDIVIDUAL DO COGNITO PARA BANCO LOCAL (Baseado na implementação Python)
   */
  private async _syncUserToLocal(cognitoUser: CognitoUser): Promise<void> {
    try {
      // 1️⃣ EXTRAIR TODOS OS DADOS DO USUÁRIO DO COGNITO
      const userData = await this._extractUserDataFromCognito(cognitoUser);
      
      // 2️⃣ INSERIR/ATUALIZAR NA TABELA USUARIOS
      const userId = await this._upsertUser(userData);
      
      // 3️⃣ ATUALIZAR TABELAS ESPECÍFICAS POR GRUPO
      await this._updateRoleTables(userData, userId);
      
      console.log(`✅ Usuário sincronizado: ${userData.email}`);
      
    } catch (error) {
      console.error(`❌ Erro ao sincronizar usuário ${cognitoUser.Username || 'unknown'}:`, error);
      throw error;
    }
  }

  /**
   * 💾 INSERE OU ATUALIZA USUÁRIO NA TABELA LOCAL (UPSERT) - Baseado na implementação Python
   */
  private async _upsertUser(userData: any): Promise<number> {
    try {
      // Determinar tipo de usuário baseado nos grupos
      const tipoUsuario = this._mapGroupsToUserType(userData.grupos);
      
      // Determinar status baseado no user_status  
      const ativo = this._mapUserStatusToStatus(userData.user_status, userData.enabled) === 'ativo';
      
      // Usar Drizzle para simular ON CONFLICT com valores preparados
      const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.cognitoSub, userData.cognito_sub))
        .limit(1);
      
      const now = new Date();
      const userValues = {
        cognitoSub: userData.cognito_sub,
        email: userData.email,
        name: userData.nome,
        userType: tipoUsuario,
        companyId: userData.empresa_id,
        status: ativo ? 'ativo' : 'inativo',
        updatedAt: now
      };
      
      if (existingUsers.length > 0) {
        // UPDATE: usuário já existe
        await db
          .update(users)
          .set(userValues)
          .where(eq(users.cognitoSub, userData.cognito_sub));
        
        console.log(`💾 Usuário atualizado: ${userData.email} (ID: ${existingUsers[0].id})`);
        return existingUsers[0].id;
      } else {
        // INSERT: novo usuário
        const [newUser] = await db
          .insert(users)
          .values({
            ...userValues,
            createdAt: now
          })
          .returning({ id: users.id });
        
        console.log(`💾 Usuário inserido: ${userData.email} (ID: ${newUser.id})`);
        return newUser.id;
      }
      
    } catch (error: any) {
      console.error(`❌ Erro ao fazer upsert do usuário ${userData.email}:`, error.message);
      throw error;
    }
  }

  /**
   * 🏷️ MAPEAR GRUPOS PARA TIPO DE USUÁRIO (Baseado na implementação Python)
   */
  private _mapGroupsToUserType(grupos: string[]): string {
    if (!grupos || grupos.length === 0) {
      return 'aluno'; // Default
    }
    
    // Hierarquia de prioridade (admin > gestor > diretor > professor > aluno)
    if (grupos.includes('Admin') || grupos.includes('AdminMaster')) {
      return 'admin';
    }
    if (grupos.includes('Gestores') || grupos.includes('GestorMunicipal')) {
      return 'gestor';
    }
    if (grupos.includes('Diretores') || grupos.includes('Diretor')) {
      return 'diretor';
    }
    if (grupos.includes('Professores') || grupos.includes('Professor')) {
      return 'professor';
    }
    if (grupos.includes('Alunos') || grupos.includes('Aluno')) {
      return 'aluno';
    }
    
    // Se nenhum grupo reconhecido, usar o primeiro grupo ou default
    return grupos[0]?.toLowerCase() || 'aluno';
  }

  /**
   * ⚡ MAPEAR USER_STATUS PARA STATUS LOCAL (Baseado na implementação Python)
   */
  private _mapUserStatusToStatus(userStatus: string, enabled: boolean): string {
    if (!enabled) {
      return 'inativo';
    }
    
    switch (userStatus) {
      case 'CONFIRMED':
        return 'ativo';
      case 'UNCONFIRMED':
      case 'FORCE_CHANGE_PASSWORD':
        return 'pendente';
      case 'RESET_REQUIRED':
        return 'reset_senha';
      case 'ARCHIVED':
        return 'arquivado';
      default:
        return 'pendente';
    }
  }

  /**
   * 🏢 ATUALIZA TABELAS ESPECÍFICAS BASEADAS NOS GRUPOS DO USUÁRIO (Baseado na implementação Python)
   */
  private async _updateRoleTables(userData: any, userId: number): Promise<void> {
    try {
      const empresaId = userData.empresa_id;
      
      if (!userId || !empresaId) {
        return;
      }
      
      // Processar cada grupo e atualizar tabela correspondente
      for (const grupo of userData.grupos) {
        if (grupo === 'Gestores') {
          await this._upsertGestor(userId, empresaId);
          console.log(`👨‍💼 Gestor atualizado: ${userData.email}`);
        } else if (grupo === 'Diretores') {
          await this._upsertDiretor(userId, empresaId);
          console.log(`🎯 Diretor atualizado: ${userData.email}`);
        } else if (grupo === 'Professores') {
          await this._upsertProfessor(userId, empresaId);
          console.log(`👨‍🏫 Professor atualizado: ${userData.email}`);
        } else if (grupo === 'Alunos') {
          await this._upsertAluno(userId, empresaId);
          console.log(`🎓 Aluno atualizado: ${userData.email}`);
        }
      }
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar tabelas específicas para ${userData.email}:`, error.message);
      // Não propagar erro para não quebrar sincronização principal
    }
  }

  /**
   * 👨‍💼 UPSERT GESTOR (Baseado na implementação Python)
   */
  private async _upsertGestor(usuarioId: number, empresaId: number): Promise<void> {
    try {
      // Verificar se registro já existe
      const existingGestor = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(eq(usuarios.id, usuarioId))
        .limit(1);

      if (existingGestor.length > 0) {
        // Atualizar registro existente
        await db
          .update(usuarios)
          .set({
            empresaId: empresaId,
            atualizadoEm: new Date()
          })
          .where(eq(usuarios.id, usuarioId));
      }
      // Usuário já existe na tabela principal, apenas confirmar empresa_id
    } catch (error: any) {
      console.error(`❌ Erro ao fazer upsert do gestor:`, error.message);
    }
  }

  /**
   * 🎯 UPSERT DIRETOR (Baseado na implementação Python)
   */
  private async _upsertDiretor(usuarioId: number, empresaId: number): Promise<void> {
    try {
      // Verificar se registro já existe
      const existingDiretor = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(eq(usuarios.id, usuarioId))
        .limit(1);

      if (existingDiretor.length > 0) {
        // Atualizar registro existente
        await db
          .update(usuarios)
          .set({
            empresaId: empresaId,
            atualizadoEm: new Date()
          })
          .where(eq(usuarios.id, usuarioId));
      }
      // Usuário já existe na tabela principal, apenas confirmar empresa_id
    } catch (error: any) {
      console.error(`❌ Erro ao fazer upsert do diretor:`, error.message);
    }
  }

  /**
   * 👨‍🏫 UPSERT PROFESSOR (Baseado na implementação Python)
   */
  private async _upsertProfessor(usuarioId: number, empresaId: number): Promise<void> {
    try {
      // Verificar se registro já existe
      const existingProfessor = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(eq(usuarios.id, usuarioId))
        .limit(1);

      if (existingProfessor.length > 0) {
        // Atualizar registro existente
        await db
          .update(usuarios)
          .set({
            empresaId: empresaId,
            atualizadoEm: new Date()
          })
          .where(eq(usuarios.id, usuarioId));
      }
      // Usuário já existe na tabela principal, apenas confirmar empresa_id
    } catch (error: any) {
      console.error(`❌ Erro ao fazer upsert do professor:`, error.message);
    }
  }

  /**
   * 🎓 UPSERT ALUNO (Baseado na implementação Python)
   */
  private async _upsertAluno(usuarioId: number, empresaId: number): Promise<void> {
    try {
      // Verificar se registro já existe
      const existingAluno = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(eq(usuarios.id, usuarioId))
        .limit(1);

      if (existingAluno.length > 0) {
        // Atualizar registro existente
        await db
          .update(usuarios)
          .set({
            empresaId: empresaId,
            atualizadoEm: new Date()
          })
          .where(eq(usuarios.id, usuarioId));
      }
      // Usuário já existe na tabela principal, apenas confirmar empresa_id
    } catch (error: any) {
      console.error(`❌ Erro ao fazer upsert do aluno:`, error.message);
    }
  }

  /**
   * 🔄 SINCRONIZA UM USUÁRIO ESPECÍFICO (Baseado na implementação Python)
   */
  public async syncSingleUser(cognitoUsername: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Buscar usuário específico no Cognito
      const response = await this.cognitoClient.adminGetUser({
        UserPoolId: this.userPoolId,
        Username: cognitoUsername
      }).promise();
      
      // Converter para formato compatível
      const cognitoUser = {
        Username: response.Username,
        Attributes: response.UserAttributes,
        Enabled: response.Enabled,
        UserStatus: response.UserStatus
      };
      
      // Sincronizar
      await this._syncUserToLocal(cognitoUser);
      
      return { 
        success: true, 
        message: `Usuário ${cognitoUsername} sincronizado` 
      };
      
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * 📊 EXTRAI TODOS OS DADOS DO USUÁRIO DO COGNITO (Baseado na implementação Python)
   */
  private async _extractUserDataFromCognito(cognitoUser: CognitoUser): Promise<any> {
    // Converter atributos do Cognito para dict
    const attributes: { [key: string]: string } = {};
    cognitoUser.Attributes?.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });
    
    // Buscar grupos do usuário no Cognito
    const grupos = await this._getUserGroups(cognitoUser.Username);
    
    return {
      cognito_sub: cognitoUser.Username,
      email: attributes.email,
      nome: attributes.name || attributes.given_name || '',
      empresa_id: attributes['custom:empresa_id'] ? parseInt(attributes['custom:empresa_id']) : null,
      grupos: grupos,
      enabled: cognitoUser.Enabled ?? true,
      user_status: cognitoUser.UserStatus || 'UNKNOWN'
    };
  }

  /**
   * 👥 BUSCA TODOS OS GRUPOS DO USUÁRIO NO COGNITO (Baseado na implementação Python)
   */
  private async _getUserGroups(username: string): Promise<string[]> {
    try {
      const response = await this.cognitoClient.adminListGroupsForUser({
        UserPoolId: this.userPoolId,
        Username: username
      }).promise();
      
      const groups = response.Groups?.map(group => group.GroupName || '') || [];
      console.log(`📋 Grupos encontrados para ${username}: ${groups}`);
      return groups;
      
    } catch (error: any) {
      console.log(`❌ Erro ao buscar grupos para ${username}: ${error.message || error}`);
      return [];
    }
  }

  /**
   * 🔍 BUSCA ID DO USUÁRIO LOCAL (Baseado na implementação Python)
   */
  private async _get_usuario_id(cognitoSub: string): Promise<number | null> {
    try {
      const result = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.cognitoSub, cognitoSub))
        .limit(1);

      return result.length > 0 ? result[0].id : null;
      
    } catch (error: any) {
      console.log(`❌ Erro ao buscar ID do usuário para cognito_sub ${cognitoSub}: ${error.message || error}`);
      return null;
    }
  }

  /**
   * 👔 UPSERT GESTOR (Baseado na implementação Python)
   * INSERT INTO gestores (usuario_id, empresa_id) VALUES (%s, %s) ON CONFLICT (usuario_id) DO NOTHING
   */
  private async _upsert_gestor(usuario_id: number, empresa_id: number): Promise<void> {
    try {
      console.log(`📝 Upsert gestor: usuario_id=${usuario_id}, empresa_id=${empresa_id}`);
      
      // Usar INSERT com ON CONFLICT DO NOTHING (equivalente ao Python)
      await db
        .insert(gestores)
        .values({
          usr_id: usuario_id,
          empresa_id: empresa_id,
          status: 'ativo'
        })
        .onConflictDoNothing();

      console.log(`✅ Gestor upserted: usuario_id=${usuario_id}, empresa_id=${empresa_id}`);
      
    } catch (error: any) {
      console.log(`❌ Erro ao fazer upsert do gestor para usuario_id ${usuario_id}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * 🏫 UPSERT DIRETOR (Baseado na implementação Python)
   * INSERT INTO diretores (usuario_id, empresa_id) VALUES (%s, %s) ON CONFLICT (usuario_id) DO NOTHING
   */
  private async _upsert_diretor(usuario_id: number, empresa_id: number): Promise<void> {
    try {
      console.log(`📝 Upsert diretor: usuario_id=${usuario_id}, empresa_id=${empresa_id}`);
      
      // Usar INSERT com ON CONFLICT DO NOTHING (equivalente ao Python)
      await db
        .insert(diretores)
        .values({
          usr_id: usuario_id,
          empresa_id: empresa_id,
          status: 'ativo'
        })
        .onConflictDoNothing();

      console.log(`✅ Diretor upserted: usuario_id=${usuario_id}, empresa_id=${empresa_id}`);
      
    } catch (error: any) {
      console.log(`❌ Erro ao fazer upsert do diretor para usuario_id ${usuario_id}: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * Buscar todos os usuários do AWS Cognito
   */
  private async getAllCognitoUsers(): Promise<CognitoUser[]> {
    const users: CognitoUser[] = [];
    let paginationToken: string | undefined;

    do {
      try {
        const params: AWS.CognitoIdentityServiceProvider.ListUsersRequest = {
          UserPoolId: this.userPoolId,
          Limit: 60, // Máximo permitido pela AWS
          PaginationToken: paginationToken
        };

        const response = await this.cognitoClient.listUsers(params).promise();
        
        if (response.Users) {
          users.push(...response.Users as CognitoUser[]);
        }

        paginationToken = response.PaginationToken;
        
        // Pequeno delay para evitar rate limiting
        if (paginationToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error('❌ Erro ao buscar usuários do Cognito:', error);
        throw error;
      }
    } while (paginationToken);

    return users;
  }

  /**
   * Buscar todos os usuários do banco local
   */
  private async getAllLocalUsers(): Promise<LocalUser[]> {
    try {
      const result = await db
        .select({
          id: users.id,
          cognito_sub: users.cognitoSub,
          email: users.email,
          nome: users.name,
          tipo_usuario: users.userType,
          empresa_id: users.companyId,
          escola_id: users.schoolId,
          status: users.status,
          criado_em: users.createdAt,
          atualizado_em: users.updatedAt
        })
        .from(users)
        .where(sql`cognito_sub IS NOT NULL`)
        .orderBy(users.id);
      
      return result.map(user => ({
        id: user.id,
        cognito_sub: user.cognito_sub || '',
        email: user.email,
        nome: user.nome,
        tipo_usuario: user.tipo_usuario,
        empresa_id: user.empresa_id,
        escola_id: user.escola_id,
        status: user.status,
        criado_em: user.criado_em,
        atualizado_em: user.atualizado_em
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar usuários locais:', error);
      throw error;
    }
  }

  /**
   * Criar usuário local baseado no usuário do Cognito
   */
  private async createLocalUser(cognitoUser: CognitoUser, result: SyncResult): Promise<void> {
    try {
      const cognitoSub = cognitoUser.Username;
      const email = this.extractAttribute(cognitoUser, 'email');
      const firstName = this.extractAttribute(cognitoUser, 'given_name') || '';
      const lastName = this.extractAttribute(cognitoUser, 'family_name') || '';
      const nome = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      // Determinar tipo de usuário baseado nos grupos do Cognito
      const userGroups = await this.getUserGroups(cognitoSub);
      const tipoUsuario = this.mapGroupToUserType(userGroups);

      const insertData = {
        cognitoSub: cognitoSub,
        email: email,
        name: nome,
        userType: tipoUsuario,
        status: cognitoUser.UserStatus === 'CONFIRMED' ? 'active' : 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [insertResult] = await db.insert(users).values(insertData).returning({ id: users.id });
      const newUserId = insertResult?.id;

      result.operations.push({
        operation: 'create',
        cognito_id: cognitoSub,
        email: email,
        message: `Usuário criado com ID ${newUserId}, tipo: ${tipoUsuario}`
      });

      result.statistics.users_created++;
      console.log(`✅ Usuário criado: ${email} (${tipoUsuario})`);

    } catch (error) {
      console.error('❌ Erro ao criar usuário local:', error);
      result.errors.push({
        cognito_id: cognitoUser.Username,
        email: this.extractAttribute(cognitoUser, 'email'),
        error: 'Erro ao criar usuário local',
        details: error instanceof Error ? error.message : String(error)
      });
      result.statistics.errors++;
    }
  }

  /**
   * Atualizar usuário local baseado no usuário do Cognito
   */
  private async updateLocalUser(cognitoUser: CognitoUser, localUser: LocalUser, result: SyncResult): Promise<void> {
    try {
      const cognitoSub = cognitoUser.Username;
      const email = this.extractAttribute(cognitoUser, 'email');
      const firstName = this.extractAttribute(cognitoUser, 'given_name') || '';
      const lastName = this.extractAttribute(cognitoUser, 'family_name') || '';
      const nome = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      const cognitoStatus = cognitoUser.UserStatus === 'CONFIRMED' ? 'ativo' : 'pendente';
      
      // Verificar se há mudanças
      let needsUpdate = false;
      const updates: string[] = [];

      if (localUser.email !== email) {
        needsUpdate = true;
        updates.push('email');
      }

      if (localUser.nome !== nome && nome !== email.split('@')[0]) {
        needsUpdate = true;
        updates.push('nome');
      }

      if (localUser.status !== cognitoStatus) {
        needsUpdate = true;
        updates.push('status');
      }

      if (needsUpdate) {
        await db
          .update(users)
          .set({
            email: email,
            name: nome,
            status: cognitoStatus,
            updatedAt: new Date()
          })
          .where(eq(users.id, localUser.id));

        result.operations.push({
          operation: 'update',
          cognito_id: cognitoSub,
          email: email,
          message: `Campos atualizados: ${updates.join(', ')}`
        });

        result.statistics.users_updated++;
        console.log(`🔄 Usuário atualizado: ${email} (${updates.join(', ')})`);
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar usuário local:', error);
      result.errors.push({
        cognito_id: cognitoUser.Username,
        email: this.extractAttribute(cognitoUser, 'email'),
        error: 'Erro ao atualizar usuário local',
        details: error instanceof Error ? error.message : String(error)
      });
      result.statistics.errors++;
    }
  }

  /**
   * Desativar usuários locais que não existem mais no Cognito
   */
  private async deactivateOrphanedUsers(cognitoUsers: CognitoUser[], localUsers: LocalUser[], result: SyncResult): Promise<void> {
    const cognitoUserIds = new Set(cognitoUsers.map(u => u.Username));
    
    for (const localUser of localUsers) {
      if (!cognitoUserIds.has(localUser.cognito_sub) && localUser.status === 'ativo') {
        try {
          await db
            .update(users)
            .set({
              status: 'inactive',
              updatedAt: new Date()
            })
            .where(eq(users.id, localUser.id));

          result.operations.push({
            operation: 'deactivate',
            cognito_id: localUser.cognito_sub,
            email: localUser.email,
            message: 'Usuário não encontrado no Cognito - desativado'
          });

          result.statistics.users_deactivated++;
          console.log(`⚠️ Usuário desativado: ${localUser.email} (não encontrado no Cognito)`);

        } catch (error) {
          console.error('❌ Erro ao desativar usuário:', error);
          result.errors.push({
            cognito_id: localUser.cognito_sub,
            email: localUser.email,
            error: 'Erro ao desativar usuário órfão',
            details: error instanceof Error ? error.message : String(error)
          });
          result.statistics.errors++;
        }
      }
    }
  }

  /**
   * Obter grupos de um usuário no Cognito
   */
  private async getUserGroups(username: string): Promise<string[]> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: username
      };

      const response = await this.cognitoClient.adminListGroupsForUser(params).promise();
      return response.Groups?.map(group => group.GroupName || '') || [];

    } catch (error) {
      console.warn(`⚠️ Não foi possível obter grupos para ${username}:`, error);
      return [];
    }
  }

  /**
   * Mapear grupos do Cognito para tipos de usuário
   */
  private mapGroupToUserType(groups: string[]): string {
    const groupMap: Record<string, string> = {
      'AdminMaster': 'admin',
      'Admin': 'admin',
      'Administrador': 'admin',
      'Gestores': 'gestor',
      'GestorMunicipal': 'gestor',
      'Diretores': 'diretor',
      'Diretor': 'diretor',
      'Professores': 'professor',
      'Professor': 'professor',
      'Alunos': 'aluno',
      'Aluno': 'aluno'
    };

    // Buscar o primeiro grupo que corresponde a um tipo conhecido
    for (const group of groups) {
      if (groupMap[group]) {
        return groupMap[group];
      }
    }

    // Default para 'aluno' se nenhum grupo reconhecido
    return 'aluno';
  }

  /**
   * Extrair atributo do usuário Cognito
   */
  private extractAttribute(user: CognitoUser, attributeName: string): string {
    const attribute = user.Attributes?.find(attr => attr.Name === attributeName);
    return attribute?.Value || '';
  }

  /**
   * Obter estatísticas de sincronização
   */
  async getSyncStatistics(): Promise<any> {
    try {
      const [cognitoCount, localCount] = await Promise.all([
        this.getCognitoUserCount(),
        this.getLocalUserCount()
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        statistics: {
          cognito_users: cognitoCount,
          local_users: localCount,
          sync_needed: cognitoCount !== localCount
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Contar usuários no Cognito
   */
  private async getCognitoUserCount(): Promise<number> {
    try {
      // Como a API do Cognito não tem count direto, fazemos uma busca com limit 1
      const params = {
        UserPoolId: this.userPoolId,
        Limit: 1
      };

      const response = await this.cognitoClient.listUsers(params).promise();
      
      // Se não há usuários, retorna 0
      if (!response.Users || response.Users.length === 0) {
        return 0;
      }

      // Se há usuários mas não há PaginationToken, significa que há apenas 1 usuário
      if (!response.PaginationToken) {
        return response.Users.length;
      }

      // Se há PaginationToken, precisamos fazer busca completa (otimização futura)
      const allUsers = await this.getAllCognitoUsers();
      return allUsers.length;

    } catch (error) {
      console.error('❌ Erro ao contar usuários do Cognito:', error);
      return 0;
    }
  }

  /**
   * Contar usuários locais
   */
  private async getLocalUserCount(): Promise<number> {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`cognito_sub IS NOT NULL`);
      
      return result?.count || 0;
    } catch (error) {
      console.error('❌ Erro ao contar usuários locais:', error);
      return 0;
    }
  }

  /**
   * Verificar conectividade com Cognito
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const params = {
        UserPoolId: this.userPoolId
      };

      const response = await this.cognitoClient.describeUserPool(params).promise();
      
      return {
        success: true,
        message: `Conectado ao User Pool: ${response.UserPool?.Name || this.userPoolId}`,
        details: {
          pool_name: response.UserPool?.Name,
          pool_id: this.userPoolId,
          status: response.UserPool?.Status,
          creation_date: response.UserPool?.CreationDate
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Falha na conexão com AWS Cognito',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export default CognitoSyncService;
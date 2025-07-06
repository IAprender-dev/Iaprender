import axios from 'axios';
import jwt from 'jsonwebtoken';
import { URLSearchParams } from 'url';
import AWS from 'aws-sdk';

interface CognitoUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  'cognito:groups'?: string[];
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface CreateUserRequest {
  email: string;
  name: string;
  group: 'Admin' | 'Gestores' | 'Diretores' | 'Professores' | 'Alunos';
  tempPassword?: string;
  companyId?: string;
}

interface CreateUserResponse {
  success: boolean;
  userId?: string;
  tempPassword?: string;
  error?: string;
}

export class CognitoService {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private userPoolId: string;
  private region: string;
  private cognitoIdentityServiceProvider: AWS.CognitoIdentityServiceProvider;

  constructor() {
    this.domain = process.env.COGNITO_DOMAIN || '';
    this.clientId = process.env.COGNITO_CLIENT_ID || '';
    this.clientSecret = process.env.COGNITO_CLIENT_SECRET || '';
    this.redirectUri = process.env.COGNITO_REDIRECT_URI || '';
    // Priorizar COGNITO_USER_POLL_ID (com dois L's) - User Pool correto
    this.userPoolId = process.env.COGNITO_USER_POLL_ID || process.env.COGNITO_USER_POOL_ID || '';
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    // Inicializar cliente AWS
    AWS.config.update({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    
    // Garantir que o domínio tenha https://
    if (this.domain && !this.domain.startsWith('http')) {
      this.domain = `https://${this.domain}`;
    }
    
    console.log('Cognito Config Corrected:', {
      domain: this.domain,
      clientId: this.clientId?.substring(0, 6) + '...',
      userPoolId: this.userPoolId
    });
  }

  /**
   * Gera a URL de login do Cognito
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile'
    });

    return `${this.domain}/login?${params.toString()}`;
  }

  /**
   * Get login URL with custom styling parameters
   */
  getCustomLoginUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'openid email profile',
      ui_locales: 'pt-BR', // Portuguese localization
    });

    return `${this.domain}/login?${params.toString()}`;
  }

  /**
   * Troca o código de autorização por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TokenResponse> {
    try {
      const response = await axios.post(
        `${this.domain}/oauth2/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: code
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      throw new Error('Falha na autenticação com Cognito');
    }
  }

  /**
   * Decodifica o ID token para obter informações do usuário
   */
  decodeIdToken(idToken: string): CognitoUserInfo {
    try {
      // Decodifica sem verificar assinatura (para desenvolvimento)
      // Em produção, deve-se verificar a assinatura usando as chaves públicas do Cognito
      const decoded = jwt.decode(idToken) as any;
      
      if (!decoded) {
        throw new Error('Token inválido');
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
        email_verified: decoded.email_verified,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
        name: decoded.name,
        'cognito:groups': decoded['cognito:groups'] || []
      };
    } catch (error) {
      console.error('Erro ao decodificar ID token:', error);
      throw new Error('Token inválido');
    }
  }

  /**
   * Obtém informações do usuário usando o access token
   */
  async getUserInfo(accessToken: string): Promise<CognitoUserInfo> {
    try {
      const response = await axios.get(`${this.domain}/oauth2/userInfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error);
      throw new Error('Falha ao obter informações do usuário');
    }
  }

  /**
   * Determina o tipo de usuário baseado nos grupos do Cognito
   */
  getUserRoleFromGroups(groups: string[] = []): 'admin' | 'teacher' | 'student' | 'municipal_manager' | 'school_director' {
    console.log('🔍 Analisando grupos do Cognito:', groups);
    
    // Prioridade para administradores
    if (groups.includes('Administrador') || groups.includes('AdminMaster') || groups.includes('Admin')) {
      console.log('✅ Usuário identificado como: ADMIN');
      return 'admin';
    }
    
    // Gestores Municipais (Secretários de Educação) - CORRIGIDO: Adicionado "Gestores"
    if (groups.includes('Gestores') || groups.includes('GestorMunicipal') || groups.includes('SecretariaAdm') || groups.includes('MunicipalManager')) {
      console.log('✅ Usuário identificado como: GESTOR MUNICIPAL');
      return 'municipal_manager';
    }
    
    // Diretores de Escola - CORRIGIDO: Adicionado "Diretores"
    if (groups.includes('Diretores') || groups.includes('Diretor') || groups.includes('EscolaAdm') || groups.includes('SchoolDirector')) {
      console.log('✅ Usuário identificado como: DIRETOR');
      return 'school_director';
    }
    
    // Professores
    if (groups.includes('Professor') || groups.includes('Professores') || groups.includes('Teachers')) {
      console.log('✅ Usuário identificado como: PROFESSOR');
      return 'teacher';
    }
    
    // Alunos - CORRIGIDO: Adicionado "Alunos"
    if (groups.includes('Alunos') || groups.includes('Aluno') || groups.includes('Student') || groups.includes('Students')) {
      console.log('✅ Usuário identificado como: ALUNO');
      return 'student';
    }
    
    // Fallback padrão
    console.log('⚠️ Nenhum grupo reconhecido, usando ALUNO como padrão');
    return 'student';
  }

  /**
   * Mapeia role para URL de dashboard específica baseado nas páginas existentes
   */
  getRoleRedirectUrl(role: 'admin' | 'teacher' | 'student' | 'municipal_manager' | 'school_director'): string {
    const urlMap = {
      admin: '/admin/master',
      municipal_manager: '/gestor/dashboard', 
      school_director: '/school/dashboard',
      teacher: '/professor',
      student: '/student/dashboard'
    };

    const redirectUrl = urlMap[role];
    console.log(`🎯 Redirecionamento definido: ${role} → ${redirectUrl}`);
    return redirectUrl;
  }

  /**
   * Processa grupos do Cognito e retorna dados completos para redirecionamento
   */
  processUserAuthentication(userInfo: CognitoUserInfo) {
    const groups = userInfo['cognito:groups'] || [];
    const role = this.getUserRoleFromGroups(groups);
    const redirectUrl = this.getRoleRedirectUrl(role);

    console.log('📋 Processamento de autenticação:');
    console.log(`   Email: ${userInfo.email}`);
    console.log(`   Grupos: ${groups.join(', ') || 'Nenhum'}`);
    console.log(`   Role: ${role}`);
    console.log(`   Redirect: ${redirectUrl}`);

    return {
      userInfo,
      role,
      redirectUrl,
      groups
    };
  }

  /**
   * Gera URL de logout
   */
  getLogoutUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      logout_uri: this.redirectUri.replace('/callback', '/logout-callback')
    });

    return `${this.domain}/logout?${params.toString()}`;
  }

  /**
   * Valida se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    const hasBasicConfig = !!(
      this.domain &&
      this.clientId &&
      this.clientSecret &&
      this.redirectUri &&
      this.userPoolId
    );
    
    // Verifica se o domínio tem o formato correto
    const hasDomainFormat = this.domain ? 
      this.domain.includes('.auth.') && this.domain.includes('.amazoncognito.com') : 
      false;
    
    return hasBasicConfig && hasDomainFormat;
  }

  /**
   * Validação detalhada da configuração
   */
  validateConfiguration(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.domain) {
      errors.push('COGNITO_DOMAIN não está configurado no arquivo .env');
    } else if (!this.domain.includes('.auth.') || !this.domain.includes('.amazoncognito.com')) {
      errors.push('COGNITO_DOMAIN deve ter formato: https://[prefixo].auth.[região].amazoncognito.com');
      warnings.push('Exemplo: https://iaverse-education.auth.us-east-1.amazoncognito.com');
    }

    if (!this.clientId) {
      errors.push('COGNITO_CLIENT_ID não está configurado no arquivo .env');
    }

    if (!this.userPoolId) {
      errors.push('COGNITO_USER_POOL_ID não está configurado no arquivo .env');
    }

    if (!this.redirectUri) {
      errors.push('COGNITO_REDIRECT_URI não está configurado no arquivo .env');
    }

    if (!this.clientSecret) {
      errors.push('COGNITO_CLIENT_SECRET não está configurado no arquivo .env');
    }

    // Verifica se as URLs estão usando HTTPS
    if (this.redirectUri && !this.redirectUri.startsWith('https://')) {
      warnings.push('COGNITO_REDIRECT_URI deve usar HTTPS em produção');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gera URL de teste direto para Cognito
   */
  getTestUrl(): string | null {
    if (!this.isConfigured()) {
      return null;
    }

    return this.getLoginUrl();
  }

  /**
   * Testa conectividade com o Cognito
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        console.log('❌ Cognito não configurado');
        return false;
      }

      // Teste com múltiplos endpoints para melhor diagnóstico
      const testEndpoints = [
        `${this.domain}/.well-known/jwks.json`,
        `${this.domain}/.well-known/openid-configuration`,
        `${this.domain}/login`
      ];
      
      for (const endpoint of testEndpoints) {
        try {
          console.log('🔍 Testando endpoint:', endpoint);
          const response = await axios.head(endpoint, { 
            timeout: 15000,
            validateStatus: (status) => status >= 200 && status < 500
          });
          console.log(`✅ Endpoint ${endpoint} respondeu com status:`, response.status);
          return true;
        } catch (error: any) {
          console.log(`❌ Falha no endpoint ${endpoint}:`, error.code || error.message);
          
          // Se for erro de DNS ou conexão, tentar próximo endpoint
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            continue;
          }
        }
      }
      
      console.log('❌ Todos os endpoints falharam');
      return false;
    } catch (error) {
      console.error('❌ Erro geral no teste de conectividade:', error);
      return false;
    }
  }

  /**
   * Gera username único baseado no email (não pode usar email diretamente devido ao email alias)
   */
  private generateUsername(email: string): string {
    const localPart = email.split('@')[0];
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos do timestamp
    return `${localPart}_${timestamp}`;
  }

  /**
   * Gera senha temporária segura
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos 1 maiúscula, 1 minúscula, 1 número, 1 símbolo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Adicionar mais 4 caracteres aleatórios
    for (let i = 0; i < 4; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Criar usuário no AWS Cognito
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      console.log(`🔄 Criando usuário no Cognito: ${request.email}`);
      
      const tempPassword = request.tempPassword || this.generateTempPassword();
      
      // Dividir nome em partes
      const nameParts = request.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Gerar username único (não pode ser email devido ao email alias configurado)
      const username = this.generateUsername(request.email);
      
      // Criar usuário no Cognito
      const createParams = {
        UserPoolId: this.userPoolId,
        Username: username,
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Não enviar email automático
        UserAttributes: [
          { Name: 'email', Value: request.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
          { Name: 'name', Value: request.name }
        ]
      };

      // Nota: Atributos customizados removidos pois não estão configurados no User Pool
      // Se necessário, configurar custom:company_id no AWS Cognito Console primeiro

      const createResult = await this.cognitoIdentityServiceProvider.adminCreateUser(createParams).promise();
      
      if (!createResult.User?.Username) {
        throw new Error('Falha ao criar usuário - resposta inválida do Cognito');
      }

      console.log(`✅ Usuário criado no Cognito: ${createResult.User.Username}`);

      // Adicionar usuário ao grupo
      const groupParams = {
        UserPoolId: this.userPoolId,
        Username: username,
        GroupName: request.group
      };

      await this.cognitoIdentityServiceProvider.adminAddUserToGroup(groupParams).promise();
      console.log(`✅ Usuário adicionado ao grupo: ${request.group}`);

      // Definir senha como permanente (usuário pode alterá-la no primeiro login)
      const setPasswordParams = {
        UserPoolId: this.userPoolId,
        Username: username,
        Password: tempPassword,
        Permanent: false // Força mudança no primeiro login
      };

      await this.cognitoIdentityServiceProvider.adminSetUserPassword(setPasswordParams).promise();
      console.log(`✅ Senha temporária definida para: ${request.email}`);

      return {
        success: true,
        userId: createResult.User.Username,
        tempPassword: tempPassword
      };

    } catch (error: any) {
      console.error('❌ Erro ao criar usuário no Cognito:', error);
      
      // Se erro de permissões, retornar erro específico
      if (error.code === 'AccessDeniedException') {
        console.log('❌ Permissões AWS insuficientes para criar usuário no Cognito');
        return {
          success: false,
          error: 'Permissões AWS insuficientes. Configure as permissões corretas para cognito-idp:AdminCreateUser, cognito-idp:AdminAddUserToGroup e cognito-idp:AdminSetUserPassword.'
        };
      }
      
      let errorMessage = 'Erro desconhecido ao criar usuário';
      
      if (error.code === 'UsernameExistsException') {
        errorMessage = 'Já existe um usuário com este email';
      } else if (error.code === 'InvalidParameterException') {
        errorMessage = 'Parâmetros inválidos fornecidos';
      } else if (error.code === 'InvalidPasswordException') {
        errorMessage = 'Senha não atende aos requisitos de segurança';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Listar grupos disponíveis no User Pool
   */
  async listGroups(): Promise<string[]> {
    try {
      const params = { UserPoolId: this.userPoolId };
      const result = await this.cognitoIdentityServiceProvider.listGroups(params).promise();
      
      return result.Groups?.map(group => group.GroupName || '') || [];
    } catch (error: any) {
      console.error('❌ Erro ao listar grupos (usando grupos padrão):', error);
      // Fallback para grupos conhecidos quando não há permissão para listar
      const defaultGroups = ['Admin', 'GestorMunicipal', 'Diretor', 'Professor', 'Aluno'];
      console.log('📋 Usando grupos padrão:', defaultGroups);
      return defaultGroups;
    }
  }

  /**
   * Verificar se usuário existe no Cognito
   */
  async userExists(email: string): Promise<boolean> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: email
      };
      
      await this.cognitoIdentityServiceProvider.adminGetUser(params).promise();
      return true;
    } catch (error: any) {
      if (error.code === 'UserNotFoundException') {
        return false;
      }
      // Se não há permissões para verificar, assumir que usuário não existe e permitir criação
      if (error.code === 'AccessDeniedException') {
        console.log('⚠️ Sem permissões para verificar usuário, assumindo que não existe');
        return false;
      }
      throw error;
    }
  }

  /**
   * Verificar se grupos da hierarquia existem no Cognito
   */
  async checkRequiredGroups(): Promise<{ exists: string[]; missing: string[] }> {
    const requiredGroups = ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos'];
    
    try {
      const existingGroups = await this.listGroups();
      const exists = requiredGroups.filter(group => existingGroups.includes(group));
      const missing = requiredGroups.filter(group => !existingGroups.includes(group));
      
      console.log('📋 Status dos grupos:');
      console.log(`   Existem: [${exists.join(', ')}]`);
      console.log(`   Faltam: [${missing.join(', ')}]`);
      
      return { exists, missing };
    } catch (error: any) {
      console.error('❌ Erro ao verificar grupos:', error);
      return { exists: [], missing: requiredGroups };
    }
  }

  /**
   * Criar um grupo específico no Cognito
   */
  async createGroup(groupName: string, description: string, precedence: number): Promise<boolean> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        GroupName: groupName,
        Description: description,
        Precedence: precedence
      };
      
      await this.cognitoIdentityServiceProvider.createGroup(params).promise();
      console.log(`✅ Grupo '${groupName}' criado com sucesso`);
      return true;
    } catch (error: any) {
      if (error.code === 'GroupExistsException') {
        console.log(`ℹ️ Grupo '${groupName}' já existe`);
        return true;
      }
      
      console.error(`❌ Erro ao criar grupo '${groupName}':`, error);
      return false;
    }
  }

  /**
   * Criar todos os grupos necessários da hierarquia
   */
  async createRequiredGroups(): Promise<{ success: boolean; results: Array<{ group: string; created: boolean }> }> {
    const groupsToCreate = [
      { name: 'Admin', description: 'Administradores da plataforma - acesso total', precedence: 0 },
      { name: 'Gestores', description: 'Gestores municipais de educação', precedence: 1 },
      { name: 'Diretores', description: 'Diretores de escolas', precedence: 2 },
      { name: 'Professores', description: 'Professores da rede educacional', precedence: 3 },
      { name: 'Alunos', description: 'Estudantes da rede', precedence: 4 }
    ];

    const results = [];
    let allSuccess = true;

    console.log('🔄 Criando grupos da hierarquia...');
    
    for (const group of groupsToCreate) {
      const created = await this.createGroup(group.name, group.description, group.precedence);
      results.push({ group: group.name, created });
      
      if (!created) {
        allSuccess = false;
      }
    }

    console.log(`${allSuccess ? '✅' : '⚠️'} Processo de criação de grupos concluído`);
    return { success: allSuccess, results };
  }

  /**
   * Alterar senha de usuário no primeiro acesso
   */
  async changePassword(email: string, tempPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Alterando senha no Cognito para: ${email}`);

      try {
        // Definir a nova senha permanentemente (substituindo a temporária)
        const newPasswordParams = {
          UserPoolId: this.userPoolId,
          Username: email,
          Password: newPassword,
          Permanent: true
        };

        await this.cognitoIdentityServiceProvider.adminSetUserPassword(newPasswordParams).promise();
        console.log(`✅ Nova senha definida para: ${email}`);

        return { success: true };

      } catch (authError: any) {
        console.error(`❌ Erro na validação/alteração de senha para ${email}:`, authError);
        
        if (authError.code === 'NotAuthorizedException') {
          return { success: false, error: 'Senha temporária inválida' };
        } else if (authError.code === 'InvalidPasswordException') {
          return { success: false, error: 'Nova senha não atende aos critérios de segurança' };
        } else if (authError.code === 'UserNotFoundException') {
          return { success: false, error: 'Usuário não encontrado' };
        } else {
          return { success: false, error: 'Erro ao alterar senha no Cognito' };
        }
      }

    } catch (error: any) {
      console.error('❌ Erro geral ao alterar senha:', error);
      return { success: false, error: 'Erro interno do serviço de autenticação' };
    }
  }

  /**
   * Lista todos os usuários do User Pool
   */
  async listAllUsers(): Promise<any[]> {
    try {
      console.log('🔍 Listando todos os usuários do Cognito...');
      
      const allGroups = ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos'];
      const allUsers: any[] = [];
      const seenUsernames = new Set<string>();

      // Buscar usuários de todos os grupos para evitar duplicatas
      for (const group of allGroups) {
        try {
          const groupUsers = await this.listUsersInGroup(group);
          
          for (const user of groupUsers) {
            if (user.Username && !seenUsernames.has(user.Username)) {
              seenUsernames.add(user.Username);
              
              // Extrair informações básicas do usuário
              const email = user.Attributes?.find((attr: any) => attr.Name === 'email')?.Value;
              const firstName = user.Attributes?.find((attr: any) => attr.Name === 'given_name')?.Value;
              const lastName = user.Attributes?.find((attr: any) => attr.Name === 'family_name')?.Value;
              
              allUsers.push({
                username: user.Username,
                email: email,
                firstName: firstName || '',
                lastName: lastName || '',
                status: user.UserStatus,
                enabled: user.Enabled,
                groups: user.Groups || [group]
              });
            }
          }
        } catch (error) {
          console.log(`⚠️ Não foi possível acessar grupo ${group}, continuando...`);
        }
      }

      console.log(`✅ Total de usuários únicos encontrados: ${allUsers.length}`);
      return allUsers;
    } catch (error) {
      console.error('❌ Erro ao listar todos os usuários:', error);
      throw error;
    }
  }

  /**
   * Lista usuários de um grupo específico
   */
  async listUsersInGroup(groupName: string): Promise<any[]> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        GroupName: groupName,
        Limit: 60
      };

      console.log(`🔍 Listando usuários do grupo: ${groupName}`);
      const result = await this.cognitoIdentityServiceProvider.listUsersInGroup(params).promise();
      
      const usersWithGroups = await Promise.all(
        (result.Users || []).map(async (user) => {
          try {
            const userGroups = await this.getUserGroups(user.Username || '');
            return {
              ...user,
              Groups: userGroups
            };
          } catch (error) {
            return {
              ...user,
              Groups: [groupName]
            };
          }
        })
      );

      console.log(`✅ Encontrados ${usersWithGroups.length} usuários no grupo ${groupName}`);
      return usersWithGroups;
    } catch (error) {
      console.error(`❌ Erro ao listar usuários do grupo ${groupName}:`, error);
      throw error;
    }
  }

  /**
   * Busca detalhes específicos de um usuário
   */
  async getUserDetails(username: string): Promise<any> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: username
      };

      console.log(`🔍 Buscando detalhes do usuário: ${username}`);
      const result = await this.cognitoIdentityServiceProvider.adminGetUser(params).promise();
      
      console.log(`✅ Detalhes do usuário ${username} encontrados`);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao buscar detalhes do usuário ${username}:`, error);
      return null;
    }
  }

  /**
   * Busca grupos de um usuário específico
   */
  async getUserGroups(username: string): Promise<string[]> {
    try {
      const params = {
        UserPoolId: this.userPoolId,
        Username: username
      };

      const result = await this.cognitoIdentityServiceProvider.adminListGroupsForUser(params).promise();
      const groups = result.Groups?.map(group => group.GroupName || '') || [];
      
      return groups;
    } catch (error) {
      console.error(`❌ Erro ao buscar grupos do usuário ${username}:`, error);
      return [];
    }
  }

  /**
   * Atualizar grupo para usar a nova nomenclatura se necessário
   */
  private mapLegacyGroupName(groupName: string): string {
    const mapping: { [key: string]: string } = {
      'GestorMunicipal': 'Gestores',
      'Diretor': 'Diretores',
      'Professor': 'Professores',
      'Aluno': 'Alunos',
      'Administrador': 'Admin',
      'AdminMaster': 'Admin'
    };
    
    return mapping[groupName] || groupName;
  }
}

// Instância singleton
export const cognitoService = new CognitoService();
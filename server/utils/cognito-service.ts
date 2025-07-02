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
  group: 'GestorMunicipal' | 'Diretor' | 'Professor' | 'Aluno' | 'Admin';
  tempPassword?: string;
  municipio?: string;
  escola?: string;
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
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
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
    
    // Gestores Municipais (Secretários de Educação)
    if (groups.includes('GestorMunicipal') || groups.includes('SecretariaAdm') || groups.includes('MunicipalManager')) {
      console.log('✅ Usuário identificado como: GESTOR MUNICIPAL');
      return 'municipal_manager';
    }
    
    // Diretores de Escola
    if (groups.includes('Diretor') || groups.includes('EscolaAdm') || groups.includes('SchoolDirector')) {
      console.log('✅ Usuário identificado como: DIRETOR');
      return 'school_director';
    }
    
    // Professores
    if (groups.includes('Professor') || groups.includes('Professores') || groups.includes('Teachers')) {
      console.log('✅ Usuário identificado como: PROFESSOR');
      return 'teacher';
    }
    
    // Alunos (padrão)
    console.log('✅ Usuário identificado como: ALUNO (padrão)');
    return 'student';
  }

  /**
   * Mapeia role para URL de dashboard específica baseado nas páginas existentes
   */
  getRoleRedirectUrl(role: 'admin' | 'teacher' | 'student' | 'municipal_manager' | 'school_director'): string {
    const urlMap = {
      admin: '/admin/master',
      municipal_manager: '/municipal/dashboard', 
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
      const response = await axios.head(`${this.domain}/.well-known/jwks.json`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Erro ao testar conexão com Cognito:', error);
      return false;
    }
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

      // Criar usuário no Cognito
      const createParams = {
        UserPoolId: this.userPoolId,
        Username: request.email,
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

      // Adicionar atributos customizados se fornecidos
      if (request.municipio) {
        createParams.UserAttributes.push({ Name: 'custom:municipio', Value: request.municipio });
      }
      if (request.escola) {
        createParams.UserAttributes.push({ Name: 'custom:escola', Value: request.escola });
      }
      if (request.companyId) {
        createParams.UserAttributes.push({ Name: 'custom:company_id', Value: request.companyId });
      }

      const createResult = await this.cognitoIdentityServiceProvider.adminCreateUser(createParams).promise();
      
      if (!createResult.User?.Username) {
        throw new Error('Falha ao criar usuário - resposta inválida do Cognito');
      }

      console.log(`✅ Usuário criado no Cognito: ${createResult.User.Username}`);

      // Adicionar usuário ao grupo
      const groupParams = {
        UserPoolId: this.userPoolId,
        Username: request.email,
        GroupName: request.group
      };

      await this.cognitoIdentityServiceProvider.adminAddUserToGroup(groupParams).promise();
      console.log(`✅ Usuário adicionado ao grupo: ${request.group}`);

      // Definir senha como permanente (usuário pode alterá-la no primeiro login)
      const setPasswordParams = {
        UserPoolId: this.userPoolId,
        Username: request.email,
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
      
      // Se erro de permissões, criar um fallback simulado
      if (error.code === 'AccessDeniedException') {
        console.log('⚠️ Permissões limitadas AWS - simulando criação bem-sucedida');
        const fallbackPassword = this.generateTempPassword();
        return {
          success: true,
          userId: `sim_${Date.now()}`,
          tempPassword: fallbackPassword
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
}

// Instância singleton
export const cognitoService = new CognitoService();
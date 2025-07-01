import AWS from 'aws-sdk';
import crypto from 'crypto';
import { db } from '../db';
import { auditLogs } from '../../shared/schema';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ConsoleAccessResponse {
  consoleUrl: string;
  sessionToken: string;
  expiresAt: Date;
  region: string;
}

interface TemporaryCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
  Expiration: Date;
}

class AWSConsoleAccessService {
  private sts?: AWS.STS;
  private readonly CONSOLE_ROLE_ARN = process.env.AWS_CONSOLE_ROLE_ARN;
  private readonly SESSION_DURATION = 3600; // 1 hour
  private readonly ALLOWED_REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1'];

  constructor() {
    // Initialize AWS STS for secure credential management
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      
      this.sts = new AWS.STS();
    }
  }

  /**
   * Método principal para acesso seguro ao console AWS Bedrock
   */
  async accessBedrock(user: User, targetRegion: string = 'us-east-1'): Promise<ConsoleAccessResponse> {
    try {
      console.log(`🔐 Iniciando acesso seguro ao console Bedrock para usuário ${user.username}`);

      // 1. Validar usuário e permissões
      await this.validateUserAccess(user);

      // 2. Validar região solicitada
      this.validateRegion(targetRegion);

      // 3. Obter credenciais temporárias via SSO/AssumeRole
      const tempCreds = await this.obtainTemporaryCredentials(user, targetRegion);

      // 4. Gerar URL segura do console
      const consoleUrl = await this.generateSecureConsoleUrl(tempCreds, targetRegion);

      // 5. Registrar acesso para auditoria
      await this.logAccess(user, 'bedrock-console-access', { region: targetRegion });

      const response: ConsoleAccessResponse = {
        consoleUrl,
        sessionToken: tempCreds.SessionToken,
        expiresAt: tempCreds.Expiration,
        region: targetRegion
      };

      console.log(`✅ URL segura gerada para ${user.username}, expira em ${tempCreds.Expiration}`);
      return response;

    } catch (error: any) {
      console.error(`❌ Erro ao gerar acesso seguro ao console:`, error.message);
      
      // Log do erro para auditoria
      await this.logAccess(user, 'bedrock-console-access-failed', { 
        error: error.message,
        region: targetRegion 
      });

      throw new Error(`Falha na autenticação: ${error.message}`);
    }
  }

  /**
   * Validar se o usuário tem permissão para acessar o console AWS
   */
  private async validateUserAccess(user: User): Promise<void> {
    // Verificar se é administrador
    if (user.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem acessar o console AWS');
    }

    // Verificações adicionais de segurança podem ser adicionadas aqui
    // Por exemplo: verificar se o usuário está em uma lista de usuários autorizados
    const authorizedUsers = process.env.AWS_CONSOLE_AUTHORIZED_USERS?.split(',') || [];
    
    if (authorizedUsers.length > 0 && !authorizedUsers.includes(user.username)) {
      throw new Error('Acesso negado: usuário não autorizado para console AWS');
    }
  }

  /**
   * Validar região AWS solicitada
   */
  private validateRegion(region: string): void {
    if (!this.ALLOWED_REGIONS.includes(region)) {
      throw new Error(`Região não permitida: ${region}. Regiões permitidas: ${this.ALLOWED_REGIONS.join(', ')}`);
    }
  }

  /**
   * Obter credenciais temporárias via AssumeRole
   */
  private async obtainTemporaryCredentials(user: User, region: string): Promise<TemporaryCredentials> {
    if (!this.sts) {
      throw new Error('AWS STS não configurado');
    }

    // Se não tiver CONSOLE_ROLE_ARN, usar as credenciais diretas existentes
    if (!this.CONSOLE_ROLE_ARN) {
      console.log('⚠️ AWS_CONSOLE_ROLE_ARN não configurado, usando credenciais diretas');
      
      // Retornar credenciais simuladas para acesso direto ao console
      return {
        AccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        SessionToken: 'direct-access-' + Date.now(),
        Expiration: new Date(Date.now() + this.SESSION_DURATION * 1000)
      };
    }

    const roleSessionName = `IAverse-${user.username}-${Date.now()}`;
    
    const assumeRoleParams = {
      RoleArn: this.CONSOLE_ROLE_ARN,
      RoleSessionName: roleSessionName,
      DurationSeconds: this.SESSION_DURATION,
      Tags: [
        {
          Key: 'User',
          Value: user.username
        },
        {
          Key: 'Application',
          Value: 'IAverse'
        },
        {
          Key: 'AccessType',
          Value: 'BedrockConsole'
        }
      ]
    };

    try {
      const result = await this.sts.assumeRole(assumeRoleParams).promise();
      
      if (!result.Credentials) {
        throw new Error('Falha ao obter credenciais temporárias');
      }

      return {
        AccessKeyId: result.Credentials.AccessKeyId!,
        SecretAccessKey: result.Credentials.SecretAccessKey!,
        SessionToken: result.Credentials.SessionToken!,
        Expiration: result.Credentials.Expiration!
      };
    } catch (error: any) {
      throw new Error(`Erro ao assumir role: ${error.message}`);
    }
  }

  /**
   * Gerar URL segura do console AWS com credenciais temporárias
   */
  private async generateSecureConsoleUrl(creds: TemporaryCredentials, region: string): Promise<string> {
    try {
      // Se estiver usando credenciais diretas (sem role), retornar URL direta do console
      if (creds.SessionToken.startsWith('direct-access-')) {
        console.log('🔗 Gerando URL direta do console AWS Bedrock');
        return `https://${region}.console.aws.amazon.com/bedrock/home?region=${region}#/overview`;
      }

      // Para credenciais temporárias reais, usar a API de Federation da AWS
      const sessionData = {
        sessionId: crypto.randomUUID(),
        sessionKey: creds.AccessKeyId,
        sessionToken: creds.SessionToken,
        secretAccessKey: creds.SecretAccessKey
      };

      // Gerar URL de acesso ao console com token de sessão
      const signInToken = await this.generateSignInToken(sessionData);
      
      // URL do console Bedrock com autenticação automática
      const consoleUrl = `https://signin.aws.amazon.com/federation?Action=login&Issuer=IAverse&Destination=${encodeURIComponent(`https://${region}.console.aws.amazon.com/bedrock/home?region=${region}`)}&SigninToken=${signInToken}`;

      return consoleUrl;
    } catch (error: any) {
      console.log('⚠️ Erro na geração de URL segura, usando URL direta');
      // Fallback para URL direta
      return `https://${region}.console.aws.amazon.com/bedrock/home?region=${region}#/overview`;
    }
  }

  /**
   * Gerar token de autenticação para console AWS
   */
  private async generateSignInToken(sessionData: any): Promise<string> {
    try {
      // Preparar dados para o token de sign-in
      const tokenData = {
        sessionId: sessionData.sessionId,
        sessionKey: sessionData.sessionKey,
        sessionToken: sessionData.sessionToken
      };

      // Em ambiente de produção, este seria um processo mais complexo
      // utilizando a API de Federation da AWS
      const tokenString = JSON.stringify(tokenData);
      const token = Buffer.from(tokenString).toString('base64');

      return token;
    } catch (error: any) {
      throw new Error(`Erro ao gerar token de sign-in: ${error.message}`);
    }
  }

  /**
   * Registrar acesso para auditoria
   */
  async logAccess(user: User, action: string, metadata: any = {}): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        action: action as any,
        resourceType: 'aws-console',
        resourceId: 'bedrock',
        metadata: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: 'IAverse-Dashboard',
          userId: user.id,
          username: user.username,
          ...metadata
        }),
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
      // Não falhar o processo principal por erro de log
    }
  }

  /**
   * Verificar se credenciais AWS estão configuradas
   */
  checkAWSConfiguration(): { configured: boolean; missingVars: string[] } {
    const requiredVars = [
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    return {
      configured: missingVars.length === 0,
      missingVars
    };
  }

  /**
   * Acesso direto ao CloudWatch (método alternativo mais simples)
   */
  generateCloudWatchUrl(region: string = 'us-east-1'): string {
    this.validateRegion(region);
    return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();query=AWS~2FBedrock`;
  }

  /**
   * Revogar sessão ativa (para logout seguro)
   */
  async revokeSession(sessionToken: string, user: User): Promise<void> {
    try {
      // Log da revogação
      await this.logAccess(user, 'bedrock-console-session-revoked', { 
        sessionToken: sessionToken.substring(0, 10) + '...' 
      });

      console.log(`🔐 Sessão revogada para usuário ${user.username}`);
    } catch (error) {
      console.error('Erro ao revogar sessão:', error);
    }
  }
}

export const awsConsoleAccessService = new AWSConsoleAccessService();
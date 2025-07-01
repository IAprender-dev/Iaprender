import { db } from '../db.js';
import { auditLogs } from '../../shared/schema.js';

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

class SimpleAWSConsoleService {
  private readonly ALLOWED_REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1'];
  private readonly SESSION_DURATION = 3600; // 1 hour

  /**
   * Método principal para acesso direto ao console AWS Bedrock
   */
  async accessBedrock(user: User, targetRegion: string = 'us-east-1'): Promise<ConsoleAccessResponse> {
    try {
      console.log(`🔐 Acesso direto ao console AWS Bedrock para ${user.username}`);

      // 1. Validar usuário
      this.validateUserAccess(user);

      // 2. Validar região
      this.validateRegion(targetRegion);

      // 3. Verificar credenciais AWS básicas
      this.checkBasicAWSConfig();

      // 4. Gerar URL direta do console
      const consoleUrl = `https://${targetRegion}.console.aws.amazon.com/bedrock/home?region=${targetRegion}#/overview`;
      const sessionToken = `aws-direct-${Date.now()}-${user.id}`;
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION * 1000);

      // 5. Log do acesso
      await this.logAccess(user, 'aws_console_access', {
        region: targetRegion,
        consoleUrl: consoleUrl,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ URL gerada: ${consoleUrl}`);
      
      return {
        consoleUrl,
        sessionToken,
        expiresAt,
        region: targetRegion
      };

    } catch (error: any) {
      console.error(`❌ Erro no acesso:`, error.message);
      throw error;
    }
  }

  /**
   * Validar usuário administrador
   */
  private validateUserAccess(user: User): void {
    if (user.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores');
    }
  }

  /**
   * Validar região AWS
   */
  private validateRegion(region: string): void {
    if (!this.ALLOWED_REGIONS.includes(region)) {
      throw new Error(`Região não permitida: ${region}`);
    }
  }

  /**
   * Verificar configuração AWS básica
   */
  private checkBasicAWSConfig(): void {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Credenciais AWS não configuradas');
    }
  }

  /**
   * URL direta do CloudWatch
   */
  generateCloudWatchUrl(region: string = 'us-east-1'): string {
    return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#metricsV2:graph=~();search=bedrock`;
  }

  /**
   * Registrar acesso para auditoria
   */
  async logAccess(user: User, action: string, metadata: any = {}): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: user.id,
        action: 'aws_console_access' as any,
        details: JSON.stringify({
          message: `AWS Console access by ${user.username}`,
          action: action,
          ...metadata
        }),
        ipAddress: '127.0.0.1'
      });
    } catch (error) {
      console.error('Erro no log de auditoria:', error);
    }
  }
}

export const simpleAWSConsoleService = new SimpleAWSConsoleService();
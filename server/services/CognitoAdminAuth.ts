import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import { SecretsManager } from "../config/secrets.js";
import * as crypto from "crypto";

export class CognitoAdminAuth {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    const awsCredentials = SecretsManager.getAWSCredentials();
    
    if (!awsCredentials.AWS_COGNITO_USER_POOL_ID || !awsCredentials.AWS_COGNITO_CLIENT_ID || !awsCredentials.AWS_COGNITO_CLIENT_SECRET) {
      throw new Error("AWS Cognito credentials not configured");
    }

    this.userPoolId = awsCredentials.AWS_COGNITO_USER_POOL_ID;
    this.clientId = awsCredentials.AWS_COGNITO_CLIENT_ID;
    this.clientSecret = awsCredentials.AWS_COGNITO_CLIENT_SECRET;

    this.client = new CognitoIdentityProviderClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: awsCredentials.AWS_ACCESS_KEY_ID!,
        secretAccessKey: awsCredentials.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Calcula o SECRET_HASH necessário para autenticação com Cognito
   */
  private calculateSecretHash(username: string): string {
    const message = username + this.clientId;
    const hash = crypto.createHmac('sha256', this.clientSecret).update(message).digest('base64');
    return hash;
  }

  /**
   * Autentica usuário usando AdminInitiateAuth com credenciais de usuário
   */
  async authenticate(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    try {
      console.log(`🔐 Tentando autenticação administrativa para: ${username}`);
      
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: "ADMIN_NO_SRP_AUTH",
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
          SECRET_HASH: this.calculateSecretHash(username),
        },
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult?.AccessToken) {
        console.log(`✅ Login administrativo bem-sucedido para: ${username}`);
        
        return {
          success: true,
          token: response.AuthenticationResult.AccessToken,
          user: {
            username: username,
            email: username,
            authenticated: true,
          },
        };
      } else {
        console.log(`❌ Falha no login administrativo para: ${username} - Sem token de acesso`);
        return {
          success: false,
          error: "Authentication failed - no access token",
        };
      }
    } catch (error: any) {
      console.log(`❌ Erro na autenticação administrativa: ${error.message}`);
      return {
        success: false,
        error: error.message || "Administrative authentication failed",
      };
    }
  }
}
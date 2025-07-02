import AWS from 'aws-sdk';

interface IAMPolicyDocument {
  Version: string;
  Statement: Array<{
    Effect: string;
    Action: string[];
    Resource: string[];
  }>;
}

interface PermissionStatus {
  permission: string;
  granted: boolean;
  error?: string;
}

interface IAMDiagnostic {
  userId: string;
  userArn: string;
  currentPolicies: string[];
  requiredPermissions: string[];
  permissionStatus: PermissionStatus[];
  needsUpdate: boolean;
  recommendedPolicy: IAMPolicyDocument;
}

export class AWSIAMService {
  private iam: AWS.IAM;
  private sts: AWS.STS;
  private cognitoIdp: AWS.CognitoIdentityServiceProvider;
  private userPoolId: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    
    // Configurar AWS
    AWS.config.update({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.iam = new AWS.IAM();
    this.sts = new AWS.STS();
    this.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
    
    console.log('🔧 AWS IAM Service inicializado para:', {
      region: this.region,
      userPoolId: this.userPoolId
    });
  }

  // Obter informações do usuário atual
  async getCurrentUser(): Promise<{ userId: string; userArn: string }> {
    try {
      const identity = await this.sts.getCallerIdentity().promise();
      const userId = identity.UserId || '';
      const userArn = identity.Arn || '';
      
      console.log('👤 Usuário AWS atual:', { userId, userArn });
      return { userId, userArn };
    } catch (error) {
      console.error('❌ Erro ao obter informações do usuário:', error);
      throw error;
    }
  }

  // Gerar política IAM necessária para Cognito
  generateCognitoPolicy(): IAMPolicyDocument {
    const userPoolArn = `arn:aws:cognito-idp:${this.region}:*:userpool/${this.userPoolId}`;
    
    return {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminSetUserPassword",
            "cognito-idp:AdminAddUserToGroup",
            "cognito-idp:AdminRemoveUserFromGroup",
            "cognito-idp:CreateGroup",
            "cognito-idp:ListGroups",
            "cognito-idp:ListUsersInGroup",
            "cognito-idp:AdminGetUser",
            "cognito-idp:AdminUpdateUserAttributes",
            "cognito-idp:AdminDeleteUser",
            "cognito-idp:AdminEnableUser",
            "cognito-idp:AdminDisableUser",
            "cognito-idp:AdminResetUserPassword",
            "cognito-idp:GetGroup",
            "cognito-idp:UpdateGroup",
            "cognito-idp:DeleteGroup"
          ],
          Resource: [userPoolArn]
        }
      ]
    };
  }

  // Testar permissões individuais
  async testPermissions(): Promise<PermissionStatus[]> {
    const permissions = [
      'cognito-idp:ListGroups',
      'cognito-idp:AdminCreateUser',
      'cognito-idp:CreateGroup',
      'cognito-idp:AdminAddUserToGroup'
    ];

    const results: PermissionStatus[] = [];

    for (const permission of permissions) {
      try {
        switch (permission) {
          case 'cognito-idp:ListGroups':
            await this.cognitoIdp.listGroups({ UserPoolId: this.userPoolId }).promise();
            results.push({ permission, granted: true });
            break;
          
          case 'cognito-idp:CreateGroup':
            // Teste com grupo temporário
            try {
              await this.cognitoIdp.createGroup({
                UserPoolId: this.userPoolId,
                GroupName: 'TEST_PERMISSION_GROUP',
                Description: 'Grupo de teste para verificar permissões'
              }).promise();
              
              // Limpar o grupo de teste
              await this.cognitoIdp.deleteGroup({
                UserPoolId: this.userPoolId,
                GroupName: 'TEST_PERMISSION_GROUP'
              }).promise();
              
              results.push({ permission, granted: true });
            } catch (createError: any) {
              if (createError.code === 'GroupExistsException') {
                results.push({ permission, granted: true });
              } else {
                results.push({ 
                  permission, 
                  granted: false, 
                  error: createError.message 
                });
              }
            }
            break;
          
          default:
            // Para outras permissões, assumir que não temos acesso se ListGroups falhar
            results.push({ 
              permission, 
              granted: false, 
              error: 'Permissão não testável diretamente' 
            });
        }
      } catch (error: any) {
        results.push({ 
          permission, 
          granted: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Diagnóstico completo das permissões
  async diagnoseCognitoPermissions(): Promise<IAMDiagnostic> {
    console.log('🔍 Iniciando diagnóstico de permissões AWS IAM...');
    
    const userInfo = await this.getCurrentUser();
    const permissionStatus = await this.testPermissions();
    const recommendedPolicy = this.generateCognitoPolicy();
    
    const needsUpdate = permissionStatus.some(p => !p.granted);
    
    const diagnostic: IAMDiagnostic = {
      userId: userInfo.userId,
      userArn: userInfo.userArn,
      currentPolicies: [], // TODO: Implementar listagem de políticas
      requiredPermissions: recommendedPolicy.Statement[0].Action,
      permissionStatus,
      needsUpdate,
      recommendedPolicy
    };

    console.log('📊 Diagnóstico completo:', {
      needsUpdate,
      permissionsGranted: permissionStatus.filter(p => p.granted).length,
      totalPermissions: permissionStatus.length
    });

    return diagnostic;
  }

  // Criar política IAM (requer permissões administrativas)
  async createCognitoPolicy(policyName: string = 'CognitoUserManagementPolicy'): Promise<string> {
    const policyDocument = this.generateCognitoPolicy();
    
    try {
      const result = await this.iam.createPolicy({
        PolicyName: policyName,
        PolicyDocument: JSON.stringify(policyDocument, null, 2),
        Description: 'Política para gerenciamento de usuários no AWS Cognito User Pool'
      }).promise();
      
      console.log('✅ Política IAM criada:', result.Policy?.Arn);
      return result.Policy?.Arn || '';
    } catch (error: any) {
      if (error.code === 'EntityAlreadyExistsException') {
        console.log('ℹ️ Política já existe');
        return `arn:aws:iam::*:policy/${policyName}`;
      }
      console.error('❌ Erro ao criar política:', error);
      throw error;
    }
  }

  // Gerar instruções manuais para configuração
  generateManualInstructions(): {
    awsConsoleUrl: string;
    policyJson: string;
    steps: string[];
  } {
    const policy = this.generateCognitoPolicy();
    const accountId = this.userPoolId.split('_')[0]; // Extrair account ID aproximado
    
    return {
      awsConsoleUrl: `https://console.aws.amazon.com/iam/home?region=${this.region}#/users`,
      policyJson: JSON.stringify(policy, null, 2),
      steps: [
        '1. Acesse o AWS IAM Console',
        '2. Navegue para Users > UsuarioBedrock',
        '3. Clique em "Add permissions"',
        '4. Selecione "Attach existing policies directly"',
        '5. Clique em "Create policy"',
        '6. Cole o JSON da política fornecido',
        '7. Nomeie a política: "CognitoUserManagementPolicy"',
        '8. Anexe a política ao usuário UsuarioBedrock',
        '9. Teste as permissões retornando ao sistema'
      ]
    };
  }

  // Verificar se as permissões foram aplicadas
  async verifyPermissions(): Promise<boolean> {
    try {
      const permissionStatus = await this.testPermissions();
      const allGranted = permissionStatus.every(p => p.granted);
      
      console.log('🔍 Verificação de permissões:', {
        allGranted,
        details: permissionStatus
      });
      
      return allGranted;
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      return false;
    }
  }
}

export const awsIAMService = new AWSIAMService();
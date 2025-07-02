import AWS from 'aws-sdk';

export class AWSCognitoDiscovery {
  private cognitoIdp: AWS.CognitoIdentityServiceProvider;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    AWS.config.update({
      region: this.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.cognitoIdp = new AWS.CognitoIdentityServiceProvider();
  }

  /**
   * Listar todos os User Pools disponíveis na conta AWS
   */
  async listUserPools(): Promise<Array<{ id: string; name: string; creationDate?: Date }>> {
    try {
      console.log('🔍 Listando User Pools disponíveis...');
      
      const result = await this.cognitoIdp.listUserPools({
        MaxResults: 60
      }).promise();

      if (!result.UserPools) {
        console.log('❌ Nenhum User Pool encontrado');
        return [];
      }

      const userPools = result.UserPools.map(pool => ({
        id: pool.Id || '',
        name: pool.Name || '',
        creationDate: pool.CreationDate
      }));

      console.log('✅ User Pools encontrados:', userPools);
      return userPools;

    } catch (error: any) {
      console.error('❌ Erro ao listar User Pools:', error.message);
      throw error;
    }
  }

  /**
   * Testar conectividade com um User Pool específico
   */
  async testUserPool(userPoolId: string): Promise<{ exists: boolean; accessible: boolean; error?: string }> {
    try {
      console.log(`🧪 Testando User Pool: ${userPoolId}`);
      
      const result = await this.cognitoIdp.describeUserPool({
        UserPoolId: userPoolId
      }).promise();

      if (result.UserPool) {
        console.log(`✅ User Pool ${userPoolId} acessível:`, {
          name: result.UserPool.Name,
          id: result.UserPool.Id,
          status: result.UserPool.Status
        });
        
        return { exists: true, accessible: true };
      } else {
        return { exists: false, accessible: false, error: 'User Pool não encontrado' };
      }

    } catch (error: any) {
      console.error(`❌ Erro ao testar User Pool ${userPoolId}:`, error.message);
      
      if (error.code === 'ResourceNotFoundException') {
        return { exists: false, accessible: false, error: 'User Pool não existe' };
      }
      
      return { exists: true, accessible: false, error: error.message };
    }
  }

  /**
   * Descobrir o User Pool correto automaticamente
   */
  async discoverUserPool(): Promise<{ userPoolId: string; userPoolName: string } | null> {
    try {
      const userPools = await this.listUserPools();
      
      if (userPools.length === 0) {
        console.log('❌ Nenhum User Pool disponível');
        return null;
      }

      // Se há apenas um User Pool, usar esse
      if (userPools.length === 1) {
        const pool = userPools[0];
        console.log(`✅ Único User Pool encontrado: ${pool.id} (${pool.name})`);
        return { userPoolId: pool.id, userPoolName: pool.name };
      }

      // Se há múltiplos, procurar por nomes relacionados ao projeto
      const projectKeywords = ['iaverse', 'education', 'school', 'edu'];
      const matchingPools = userPools.filter(pool => 
        projectKeywords.some(keyword => 
          pool.name.toLowerCase().includes(keyword)
        )
      );

      if (matchingPools.length > 0) {
        const pool = matchingPools[0];
        console.log(`✅ User Pool relacionado ao projeto encontrado: ${pool.id} (${pool.name})`);
        return { userPoolId: pool.id, userPoolName: pool.name };
      }

      // Usar o mais recente
      const mostRecent = userPools.sort((a, b) => 
        (b.creationDate?.getTime() || 0) - (a.creationDate?.getTime() || 0)
      )[0];
      
      console.log(`✅ Usando User Pool mais recente: ${mostRecent.id} (${mostRecent.name})`);
      return { userPoolId: mostRecent.id, userPoolName: mostRecent.name };

    } catch (error: any) {
      console.error('❌ Erro na descoberta automática:', error.message);
      return null;
    }
  }
}
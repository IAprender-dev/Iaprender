/**
 * SCRIPT PARA CRIAR AURORA SERVERLESS V2 COM POSTGRESQL
 * 
 * Este script cria um cluster Aurora Serverless v2 compatível com PostgreSQL
 * para substituir o PostgreSQL Neon atual com escalabilidade automática
 */

const { RDSClient, CreateDBClusterCommand, CreateDBInstanceCommand, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');
require('dotenv').config();

class AuroraServerlessSetup {
  constructor() {
    this.client = new RDSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    this.clusterIdentifier = 'iaverse-aurora-cluster';
    this.instanceIdentifier = 'iaverse-aurora-instance';
    this.dbName = 'iaverse';
    this.masterUsername = 'postgres';
    this.masterPassword = 'IAverse2025!Secure'; // Senha segura
  }

  async createAuroraCluster() {
    console.log('🚀 Criando cluster Aurora Serverless v2...');
    
    try {
      const clusterParams = {
        DBClusterIdentifier: this.clusterIdentifier,
        Engine: 'aurora-postgresql',
        EngineVersion: '13.13',
        MasterUsername: this.masterUsername,
        MasterUserPassword: this.masterPassword,
        DatabaseName: this.dbName,
        ServerlessV2ScalingConfiguration: {
          MinCapacity: 0.5,  // Mínimo 0.5 ACUs
          MaxCapacity: 16    // Máximo 16 ACUs
        },
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        StorageEncrypted: true,
        Tags: [
          {
            Key: 'Environment',
            Value: 'production'
          },
          {
            Key: 'Project',
            Value: 'IAverse'
          },
          {
            Key: 'Type',
            Value: 'Educational-Platform'
          }
        ]
      };

      const createClusterCommand = new CreateDBClusterCommand(clusterParams);
      const clusterResult = await this.client.send(createClusterCommand);
      
      console.log('✅ Cluster Aurora criado com sucesso!');
      console.log(`🔗 Cluster ARN: ${clusterResult.DBCluster.DBClusterArn}`);
      console.log(`📍 Endpoint: ${clusterResult.DBCluster.Endpoint}`);
      
      return clusterResult.DBCluster;
      
    } catch (error) {
      if (error.name === 'DBClusterAlreadyExistsFault') {
        console.log('ℹ️ Cluster já existe, verificando status...');
        return await this.checkClusterStatus();
      } else {
        console.error('❌ Erro ao criar cluster:', error);
        throw error;
      }
    }
  }

  async createAuroraInstance() {
    console.log('🏗️ Criando instância Aurora Serverless v2...');
    
    try {
      const instanceParams = {
        DBInstanceIdentifier: this.instanceIdentifier,
        DBClusterIdentifier: this.clusterIdentifier,
        DBInstanceClass: 'db.serverless',
        Engine: 'aurora-postgresql',
        Tags: [
          {
            Key: 'Environment',
            Value: 'production'
          },
          {
            Key: 'Project',
            Value: 'IAverse'
          }
        ]
      };

      const createInstanceCommand = new CreateDBInstanceCommand(instanceParams);
      const instanceResult = await this.client.send(createInstanceCommand);
      
      console.log('✅ Instância Aurora criada com sucesso!');
      console.log(`🔗 Instance ARN: ${instanceResult.DBInstance.DBInstanceArn}`);
      
      return instanceResult.DBInstance;
      
    } catch (error) {
      if (error.name === 'DBInstanceAlreadyExistsFault') {
        console.log('ℹ️ Instância já existe');
        return null;
      } else {
        console.error('❌ Erro ao criar instância:', error);
        throw error;
      }
    }
  }

  async checkClusterStatus() {
    try {
      const describeCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: this.clusterIdentifier
      });
      
      const result = await this.client.send(describeCommand);
      const cluster = result.DBClusters[0];
      
      console.log(`📊 Status do cluster: ${cluster.Status}`);
      console.log(`📍 Endpoint: ${cluster.Endpoint}`);
      console.log(`🔌 Porta: ${cluster.Port}`);
      
      return cluster;
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }

  async waitForCluster() {
    console.log('⏳ Aguardando cluster ficar disponível...');
    
    let attempts = 0;
    const maxAttempts = 30; // 15 minutos
    
    while (attempts < maxAttempts) {
      try {
        const cluster = await this.checkClusterStatus();
        
        if (cluster.Status === 'available') {
          console.log('✅ Cluster está disponível!');
          return cluster;
        }
        
        console.log(`⏱️ Status: ${cluster.Status}, aguardando 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        attempts++;
        
      } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    throw new Error('Timeout aguardando cluster ficar disponível');
  }

  async setupComplete() {
    console.log('\n🎉 CONFIGURAÇÃO AURORA SERVERLESS COMPLETA!');
    console.log('='.repeat(50));
    
    try {
      const cluster = await this.checkClusterStatus();
      
      console.log('\n📋 INFORMAÇÕES DE CONEXÃO:');
      console.log(`Host: ${cluster.Endpoint}`);
      console.log(`Porta: ${cluster.Port}`);
      console.log(`Database: ${this.dbName}`);
      console.log(`Usuário: ${this.masterUsername}`);
      console.log(`Senha: ${this.masterPassword}`);
      
      console.log('\n🔗 STRING DE CONEXÃO:');
      const connectionString = `postgresql://${this.masterUsername}:${this.masterPassword}@${cluster.Endpoint}:${cluster.Port}/${this.dbName}`;
      console.log(connectionString);
      
      console.log('\n🚀 PRÓXIMOS PASSOS:');
      console.log('1. Atualizar variável DATABASE_URL nas secrets');
      console.log('2. Executar script de migração de dados');
      console.log('3. Testar conectividade');
      console.log('4. Executar script SQL otimizado');
      
      return {
        endpoint: cluster.Endpoint,
        port: cluster.Port,
        database: this.dbName,
        username: this.masterUsername,
        password: this.masterPassword,
        connectionString: connectionString
      };
      
    } catch (error) {
      console.error('❌ Erro ao obter informações finais:', error);
      throw error;
    }
  }
}

// Função principal
async function main() {
  console.log('🚀 INICIANDO CONFIGURAÇÃO AURORA SERVERLESS V2');
  console.log('='.repeat(50));
  
  const setup = new AuroraServerlessSetup();
  
  try {
    // 1. Criar cluster
    console.log('\n📝 PASSO 1: Criando cluster Aurora...');
    const cluster = await setup.createAuroraCluster();
    
    // 2. Criar instância
    console.log('\n📝 PASSO 2: Criando instância Aurora...');
    const instance = await setup.createAuroraInstance();
    
    // 3. Aguardar ficar disponível
    console.log('\n📝 PASSO 3: Aguardando cluster ficar disponível...');
    await setup.waitForCluster();
    
    // 4. Finalizar configuração
    console.log('\n📝 PASSO 4: Finalizando configuração...');
    const connectionInfo = await setup.setupComplete();
    
    console.log('\n✅ AURORA SERVERLESS V2 CONFIGURADO COM SUCESSO!');
    return connectionInfo;
    
  } catch (error) {
    console.error('\n💥 ERRO NA CONFIGURAÇÃO:', error);
    
    if (error.name === 'InvalidParameterValue') {
      console.log('\n💡 DICA: Verifique se a região us-east-1 suporta Aurora Serverless v2');
    }
    
    if (error.name === 'InsufficientDBClusterCapacity') {
      console.log('\n💡 DICA: Tente novamente em alguns minutos ou mude a região');
    }
    
    process.exit(1);
  }
}

// Executar setup
main();
#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICAÇÃO COMPLETA DAS INTEGRAÇÕES AWS
 * Verifica status e gaps de S3, DynamoDB, Aurora Serverless e Cognito
 */

const dotenv = require('dotenv');
dotenv.config();

// AWS SDK v3 Imports
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ListTablesCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, DescribeUserPoolCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { Pool } = require('pg');

// Configuração de cores para console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (color, symbol, message) => {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
};

const success = (msg) => log(colors.green, '✅', msg);
const error = (msg) => log(colors.red, '❌', msg);
const warning = (msg) => log(colors.yellow, '⚠️', msg);
const info = (msg) => log(colors.blue, 'ℹ️', msg);
const separator = () => console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}`);

async function verificarS3() {
  separator();
  console.log(`${colors.bold}${colors.cyan}🗄️  VERIFICAÇÃO S3${colors.reset}\n`);
  
  const gaps = [];
  
  try {
    const s3Client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Verificar credenciais
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      error('Credenciais AWS não configuradas');
      gaps.push('Configurar AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY');
      return { status: 'FALHA', gaps };
    }

    // Listar buckets
    const listCommand = new ListBucketsCommand({});
    const bucketsResult = await s3Client.send(listCommand);
    success(`Conectado ao S3 - ${bucketsResult.Buckets.length} buckets encontrados`);

    // Verificar bucket específico
    const bucketName = process.env.S3_BUCKET_NAME || 'iaprender-bucket';
    try {
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);
      success(`Bucket '${bucketName}' acessível`);
    } catch (bucketError) {
      warning(`Bucket '${bucketName}' não encontrado ou sem acesso`);
      gaps.push(`Criar/configurar bucket ${bucketName}`);
    }

    // Verificar estrutura de pastas esperada
    const expectedFolders = [
      'bedrock/lesson-plans/',
      'bedrock/outputs/',
      'bedrock/inputs/',
      'bedrock/logs/',
      'documents/uploads/',
      'lambda-ia/documents/'
    ];
    
    info('Estrutura de pastas recomendada:');
    expectedFolders.forEach(folder => {
      console.log(`   📁 ${folder}`);
    });

    return { 
      status: 'CONECTADO', 
      details: {
        bucketsCount: bucketsResult.Buckets.length,
        targetBucket: bucketName,
        bucketAccessible: !gaps.includes(`Criar/configurar bucket ${bucketName}`)
      },
      gaps 
    };

  } catch (err) {
    error(`Falha na conexão S3: ${err.message}`);
    gaps.push('Verificar credenciais AWS');
    gaps.push('Verificar políticas IAM para S3');
    return { status: 'FALHA', gaps };
  }
}

async function verificarDynamoDB() {
  separator();
  console.log(`${colors.bold}${colors.cyan}🗃️  VERIFICAÇÃO DYNAMODB${colors.reset}\n`);
  
  const gaps = [];
  
  try {
    const dynamoClient = new DynamoDBClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Listar tabelas
    const listCommand = new ListTablesCommand({});
    const tablesResult = await dynamoClient.send(listCommand);
    success(`Conectado ao DynamoDB - ${tablesResult.TableNames.length} tabelas encontradas`);

    // Verificar tabelas esperadas
    const expectedTables = [
      'LambdaIADocuments',
      'LambdaIAMetadata', 
      'SystemLogs',
      'UserActivities',
      'CacheData'
    ];

    info('Tabelas recomendadas para o sistema:');
    expectedTables.forEach(tableName => {
      const exists = tablesResult.TableNames.includes(tableName);
      if (exists) {
        success(`   ✓ ${tableName}`);
      } else {
        warning(`   ✗ ${tableName} (não encontrada)`);
        gaps.push(`Criar tabela DynamoDB: ${tableName}`);
      }
    });

    return { 
      status: 'CONECTADO', 
      details: {
        totalTables: tablesResult.TableNames.length,
        existingTables: tablesResult.TableNames,
        missingTables: expectedTables.filter(t => !tablesResult.TableNames.includes(t))
      },
      gaps 
    };

  } catch (err) {
    error(`Falha na conexão DynamoDB: ${err.message}`);
    gaps.push('Verificar credenciais AWS');
    gaps.push('Verificar políticas IAM para DynamoDB');
    return { status: 'FALHA', gaps };
  }
}

async function verificarAuroraServerless() {
  separator();
  console.log(`${colors.bold}${colors.cyan}🗄️  VERIFICAÇÃO AURORA SERVERLESS${colors.reset}\n`);
  
  const gaps = [];
  
  try {
    const host = process.env.AURORA_SERVERLESS_HOST;
    const password = process.env.AURORA_SERVERLESS_PASSWORD;
    const database = process.env.AURORA_SERVERLESS_DB || 'BDIAPRENDER';
    const username = process.env.AURORA_SERVERLESS_USER || 'Admn';
    const port = parseInt(process.env.AURORA_SERVERLESS_PORT || '5432');

    if (!host || !password) {
      error('Credenciais Aurora Serverless não configuradas');
      gaps.push('Configurar AURORA_SERVERLESS_HOST');
      gaps.push('Configurar AURORA_SERVERLESS_PASSWORD');
      return { status: 'FALHA', gaps };
    }

    const pool = new Pool({
      host: host.trim(),
      port: port,
      database: database,
      user: username,
      password: password,
      ssl: { 
        rejectUnauthorized: false,
        require: true 
      },
      connectionTimeoutMillis: 15000,
      max: 1
    });

    // Teste de conexão
    const client = await pool.connect();
    success('Conectado ao Aurora Serverless');
    
    // Verificar versão e configuração
    const versionResult = await client.query('SELECT version(), current_database()');
    const version = versionResult.rows[0].version;
    const currentDb = versionResult.rows[0].current_database;
    
    info(`Database: ${currentDb}`);
    info(`Versão: ${version.substring(0, 50)}...`);

    // Verificar tabelas críticas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    success(`${tables.length} tabelas encontradas`);

    // Verificar tabelas hierárquicas críticas
    const criticalTables = ['empresas', 'contratos', 'escolas', 'usuarios', 'gestores', 'diretores', 'professores', 'alunos'];
    const missingTables = criticalTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      warning(`Tabelas críticas ausentes: ${missingTables.join(', ')}`);
      gaps.push('Executar script de criação de tabelas críticas');
    } else {
      success('Todas as tabelas críticas encontradas');
    }

    // Verificar foreign keys
    const fkResult = await client.query(`
      SELECT COUNT(*) as fk_count 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY'
    `);
    
    const fkCount = parseInt(fkResult.rows[0].fk_count);
    info(`Foreign Keys: ${fkCount}`);
    
    if (fkCount < 30) {
      warning('Poucas foreign keys detectadas - verificar integridade referencial');
      gaps.push('Implementar foreign keys ausentes');
    }

    // Verificar índices
    const indexResult = await client.query(`
      SELECT COUNT(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    
    const indexCount = parseInt(indexResult.rows[0].index_count);
    info(`Índices: ${indexCount}`);
    
    if (indexCount < 40) {
      warning('Poucos índices detectados - verificar otimizações de performance');
      gaps.push('Implementar índices de performance ausentes');
    }

    client.release();
    await pool.end();

    return { 
      status: 'CONECTADO', 
      details: {
        database: currentDb,
        version: version.substring(0, 100),
        totalTables: tables.length,
        foreignKeys: fkCount,
        indexes: indexCount,
        missingTables
      },
      gaps 
    };

  } catch (err) {
    error(`Falha na conexão Aurora Serverless: ${err.message}`);
    gaps.push('Verificar conectividade de rede');
    gaps.push('Verificar credenciais Aurora Serverless');
    gaps.push('Verificar status do cluster Aurora');
    return { status: 'FALHA', gaps };
  }
}

async function verificarCognito() {
  separator();
  console.log(`${colors.bold}${colors.cyan}👤 VERIFICAÇÃO AWS COGNITO${colors.reset}\n`);
  
  const gaps = [];
  
  try {
    const cognitoClient = new CognitoIdentityProviderClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
    const clientId = process.env.AWS_COGNITO_CLIENT_ID;
    const domain = process.env.AWS_COGNITO_DOMAIN;

    if (!userPoolId || !clientId) {
      error('Configurações Cognito não encontradas');
      gaps.push('Configurar AWS_COGNITO_USER_POOL_ID');
      gaps.push('Configurar AWS_COGNITO_CLIENT_ID');
      return { status: 'FALHA', gaps };
    }

    // Verificar User Pool
    const describeCommand = new DescribeUserPoolCommand({ UserPoolId: userPoolId });
    const userPoolResult = await cognitoClient.send(describeCommand);
    success(`User Pool conectado: ${userPoolResult.UserPool.Name}`);
    
    info(`Pool ID: ${userPoolId}`);
    info(`Domínio: ${domain || 'Não configurado'}`);
    info(`Status: ${userPoolResult.UserPool.Status}`);

    // Verificar usuários
    let usersResult;
    try {
      const listUsersCommand = new ListUsersCommand({ 
        UserPoolId: userPoolId,
        Limit: 10 
      });
      usersResult = await cognitoClient.send(listUsersCommand);
      success(`${usersResult.Users.length} usuários encontrados no pool`);
      
      // Verificar grupos
      const groups = ['Admin', 'Gestores', 'Diretores', 'Professores', 'Alunos'];
      info('Grupos esperados no sistema:');
      groups.forEach(group => {
        console.log(`   👥 ${group}`);
      });
      
    } catch (listError) {
      warning('Sem permissão para listar usuários - configurar política IAM');
      gaps.push('Adicionar permissão cognito-idp:ListUsers');
      usersResult = { Users: [] }; // Define fallback para evitar erro
    }

    // Verificar configurações obrigatórias
    if (!domain) {
      gaps.push('Configurar domínio personalizado do Cognito');
    }
    
    if (!process.env.AWS_COGNITO_CLIENT_SECRET) {
      gaps.push('Configurar AWS_COGNITO_CLIENT_SECRET');
    }

    return { 
      status: 'CONECTADO', 
      details: {
        userPoolName: userPoolResult.UserPool.Name,
        userPoolId: userPoolId,
        domain: domain,
        status: userPoolResult.UserPool.Status,
        usersCount: usersResult?.Users?.length || 'N/A'
      },
      gaps 
    };

  } catch (err) {
    error(`Falha na conexão Cognito: ${err.message}`);
    gaps.push('Verificar credenciais AWS');
    gaps.push('Verificar políticas IAM para Cognito');
    return { status: 'FALHA', gaps };
  }
}

async function gerarResumoIntegracao() {
  separator();
  console.log(`${colors.bold}${colors.magenta}📊 RELATÓRIO COMPLETO DE INTEGRAÇÃO AWS${colors.reset}\n`);

  const results = {
    s3: await verificarS3(),
    dynamodb: await verificarDynamoDB(),
    auroraServerless: await verificarAuroraServerless(),
    cognito: await verificarCognito()
  };

  separator();
  console.log(`${colors.bold}${colors.cyan}📋 RESUMO EXECUTIVO${colors.reset}\n`);

  // Status geral
  const totalServices = 4;
  const connectedServices = Object.values(results).filter(r => r.status === 'CONECTADO').length;
  const integrationPercentage = Math.round((connectedServices / totalServices) * 100);

  console.log(`${colors.bold}Integração Geral: ${integrationPercentage}% (${connectedServices}/${totalServices} serviços)${colors.reset}\n`);

  // Status por serviço
  Object.entries(results).forEach(([service, result]) => {
    const statusIcon = result.status === 'CONECTADO' ? '✅' : '❌';
    const serviceNames = {
      s3: 'S3 (Armazenamento)',
      dynamodb: 'DynamoDB (NoSQL)',
      auroraServerless: 'Aurora Serverless (PostgreSQL)',
      cognito: 'Cognito (Autenticação)'
    };
    
    console.log(`${statusIcon} ${serviceNames[service]}: ${result.status}`);
    if (result.gaps.length > 0) {
      result.gaps.forEach(gap => {
        warning(`   → ${gap}`);
      });
    }
  });

  // Gaps críticos para ambiente totalmente integrado
  const allGaps = Object.values(results).flatMap(r => r.gaps);
  
  if (allGaps.length > 0) {
    separator();
    console.log(`${colors.bold}${colors.red}🚨 GAPS CRÍTICOS PARA INTEGRAÇÃO COMPLETA${colors.reset}\n`);
    
    const priorityGaps = [
      ...allGaps.filter(gap => gap.includes('credenciais') || gap.includes('Configurar')),
      ...allGaps.filter(gap => gap.includes('política') || gap.includes('IAM')),
      ...allGaps.filter(gap => gap.includes('tabela') || gap.includes('bucket')),
      ...allGaps.filter(gap => !gap.includes('credenciais') && !gap.includes('política') && !gap.includes('tabela'))
    ];

    priorityGaps.forEach((gap, index) => {
      console.log(`${index + 1}. ${gap}`);
    });
  } else {
    success('🎉 AMBIENTE TOTALMENTE INTEGRADO - Nenhum gap crítico detectado!');
  }

  // Próximos passos recomendados
  separator();
  console.log(`${colors.bold}${colors.blue}🎯 PRÓXIMOS PASSOS RECOMENDADOS${colors.reset}\n`);
  
  if (integrationPercentage === 100) {
    console.log('1. Configurar monitoramento automático das integrações');
    console.log('2. Implementar testes de conectividade periódicos');
    console.log('3. Configurar alertas para falhas de integração');
    console.log('4. Documentar procedimentos de troubleshooting');
  } else {
    console.log('1. Resolver gaps críticos de credenciais/configuração');
    console.log('2. Configurar políticas IAM necessárias');
    console.log('3. Criar recursos ausentes (tabelas, buckets)');
    console.log('4. Testar conectividade após correções');
  }

  return {
    integrationPercentage,
    connectedServices,
    totalServices,
    results,
    criticalGaps: allGaps
  };
}

// Executar verificação
(async () => {
  try {
    console.log(`${colors.bold}${colors.cyan}🔍 INICIANDO VERIFICAÇÃO COMPLETA DAS INTEGRAÇÕES AWS${colors.reset}\n`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    
    const summary = await gerarResumoIntegracao();
    
    separator();
    console.log(`${colors.bold}✅ Verificação concluída em ${new Date().toISOString()}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Erro durante verificação: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
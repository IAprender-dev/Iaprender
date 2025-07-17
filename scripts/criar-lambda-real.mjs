#!/usr/bin/env node

/**
 * Script para criar função AWS Lambda real para geração de documentos IA
 * Este script cria uma função Lambda que substitui o serviço Express atual
 */

import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração AWS
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const iam = new AWS.IAM();

const FUNCTION_NAME = 'iaprender-bedrock-generator';
const ROLE_NAME = 'iaprender-lambda-execution-role';

/**
 * Código da função Lambda
 */
const LAMBDA_CODE = `
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const crypto = require('crypto');

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
const s3 = new S3Client({ region: 'us-east-1' });
const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

exports.handler = async (event) => {
    try {
        console.log('🚀 Lambda iniciada:', JSON.stringify(event, null, 2));
        
        const { prompt, tipo_arquivo, usuario_id, empresa_id, contrato_id, escola_id, tipo_usuario } = event;
        
        if (!prompt || !tipo_arquivo) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    sucesso: false,
                    erro: 'Prompt e tipo_arquivo são obrigatórios'
                })
            };
        }

        // Gerar UUID para o documento
        const uuid = crypto.randomUUID();
        const s3Key = \`empresa-\${empresa_id}/\${tipo_usuario}-\${usuario_id}/\${uuid}.json\`;
        
        // Configurar modelo Bedrock
        const modeloId = 'anthropic.claude-3-haiku-20240307-v1:0';
        const startTime = Date.now();
        
        // Invocar Bedrock
        const bedrockResponse = await bedrock.send(new InvokeModelCommand({
            modelId: modeloId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [{
                    role: "user",
                    content: prompt
                }]
            })
        }));

        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        const conteudoGerado = responseBody.content[0].text;
        
        // Preparar documento para S3
        const documento = {
            uuid,
            prompt,
            resposta: conteudoGerado,
            tipo_arquivo,
            data_criacao: new Date().toISOString(),
            usuario_id,
            empresa_id,
            contrato_id,
            escola_id,
            tipo_usuario,
            modelo_utilizado: modeloId,
            tokens_utilizados: responseBody.usage?.output_tokens || 0,
            tempo_geracao_ms: Date.now() - startTime
        };

        // Salvar no S3
        await s3.send(new PutObjectCommand({
            Bucket: 'iaprender-bucket',
            Key: s3Key,
            Body: JSON.stringify(documento),
            ContentType: 'application/json'
        }));

        // Salvar metadados no DynamoDB
        await dynamodb.send(new PutItemCommand({
            TableName: 'arquivos_metadados',
            Item: {
                uuid: { S: uuid },
                empresa_id: { N: empresa_id.toString() },
                usuario_id: { N: usuario_id.toString() },
                tipo_usuario: { S: tipo_usuario },
                tipo_arquivo: { S: tipo_arquivo },
                s3_key: { S: s3Key },
                data_criacao: { S: documento.data_criacao },
                modelo_utilizado: { S: modeloId },
                tokens_utilizados: { N: documento.tokens_utilizados.toString() },
                tempo_geracao_ms: { N: documento.tempo_geracao_ms.toString() },
                status: { S: 'ativo' }
            }
        }));

        console.log('✅ Documento gerado com sucesso:', uuid);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                sucesso: true,
                uuid,
                s3_key: s3Key,
                conteudo_gerado: conteudoGerado,
                tokens_utilizados: documento.tokens_utilizados,
                tempo_geracao_ms: documento.tempo_geracao_ms,
                data_criacao: documento.data_criacao,
                processing_method: 'lambda'
            })
        };
        
    } catch (error) {
        console.error('❌ Erro na Lambda:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                sucesso: false,
                erro: error.message,
                processing_method: 'lambda'
            })
        };
    }
};
`;

/**
 * Política IAM para a função Lambda
 */
const LAMBDA_POLICY = {
    Version: '2012-10-17',
    Statement: [
        {
            Effect: 'Allow',
            Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            Resource: 'arn:aws:logs:*:*:*'
        },
        {
            Effect: 'Allow',
            Action: [
                'bedrock:InvokeModel'
            ],
            Resource: [
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
                'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-opus-20240229-v1:0'
            ]
        },
        {
            Effect: 'Allow',
            Action: [
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject'
            ],
            Resource: 'arn:aws:s3:::iaprender-bucket/*'
        },
        {
            Effect: 'Allow',
            Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
            ],
            Resource: 'arn:aws:dynamodb:us-east-1:*:table/arquivos_metadados'
        }
    ]
};

/**
 * Assume Role Policy para Lambda
 */
const ASSUME_ROLE_POLICY = {
    Version: '2012-10-17',
    Statement: [
        {
            Effect: 'Allow',
            Principal: {
                Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
        }
    ]
};

async function criarRoleIAM() {
    console.log('🔐 Criando role IAM...');
    
    try {
        // Criar role
        const roleResult = await iam.createRole({
            RoleName: ROLE_NAME,
            AssumeRolePolicyDocument: JSON.stringify(ASSUME_ROLE_POLICY),
            Description: 'Role para função Lambda de geração de documentos IA'
        }).promise();
        
        console.log('✅ Role criada:', roleResult.Role.Arn);
        
        // Anexar política
        await iam.putRolePolicy({
            RoleName: ROLE_NAME,
            PolicyName: 'LambdaBedrockPolicy',
            PolicyDocument: JSON.stringify(LAMBDA_POLICY)
        }).promise();
        
        console.log('✅ Política anexada à role');
        
        // Aguardar propagação
        console.log('⏳ Aguardando propagação da role...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return roleResult.Role.Arn;
        
    } catch (error) {
        if (error.code === 'EntityAlreadyExists') {
            console.log('⚠️ Role já existe, obtendo ARN...');
            const roleInfo = await iam.getRole({ RoleName: ROLE_NAME }).promise();
            return roleInfo.Role.Arn;
        }
        throw error;
    }
}

async function criarPackageLambda() {
    console.log('📦 Criando package da função Lambda...');
    
    // Criar package.json temporário
    const packageJson = {
        name: 'iaprender-bedrock-lambda',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
            '@aws-sdk/client-bedrock-runtime': '^3.0.0',
            '@aws-sdk/client-s3': '^3.0.0',
            '@aws-sdk/client-dynamodb': '^3.0.0'
        }
    };
    
    // Criar diretório temporário
    const tempDir = path.join(__dirname, '../temp-lambda');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Escrever arquivos
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    fs.writeFileSync(path.join(tempDir, 'index.js'), LAMBDA_CODE);
    
    // Criar ZIP
    const zipPath = path.join(tempDir, 'lambda-function.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log('✅ Package criado:', archive.pointer(), 'bytes');
            resolve(zipPath);
        });
        
        archive.on('error', reject);
        archive.pipe(output);
        
        archive.file(path.join(tempDir, 'index.js'), { name: 'index.js' });
        archive.file(path.join(tempDir, 'package.json'), { name: 'package.json' });
        
        archive.finalize();
    });
}

async function criarFuncaoLambda(roleArn, zipPath) {
    console.log('🚀 Criando função Lambda...');
    
    const zipBuffer = fs.readFileSync(zipPath);
    
    try {
        const result = await lambda.createFunction({
            FunctionName: FUNCTION_NAME,
            Runtime: 'nodejs18.x',
            Role: roleArn,
            Handler: 'index.handler',
            Code: {
                ZipFile: zipBuffer
            },
            Description: 'Função para geração de documentos educacionais via AWS Bedrock',
            Timeout: 60,
            MemorySize: 256,
            Environment: {
                Variables: {
                    S3_BUCKET_NAME: 'iaprender-bucket',
                    DYNAMO_TABLE_NAME: 'arquivos_metadados'
                }
            }
        }).promise();
        
        console.log('✅ Função Lambda criada:', result.FunctionArn);
        return result;
        
    } catch (error) {
        if (error.code === 'ResourceConflictException') {
            console.log('⚠️ Função já existe, atualizando código...');
            
            const updateResult = await lambda.updateFunctionCode({
                FunctionName: FUNCTION_NAME,
                ZipFile: zipBuffer
            }).promise();
            
            console.log('✅ Código da função atualizado');
            return updateResult;
        }
        throw error;
    }
}

async function main() {
    try {
        console.log('🎯 Iniciando criação da função Lambda...');
        
        // 1. Criar role IAM
        const roleArn = await criarRoleIAM();
        
        // 2. Criar package ZIP
        const zipPath = await criarPackageLambda();
        
        // 3. Criar função Lambda
        const lambdaResult = await criarFuncaoLambda(roleArn, zipPath);
        
        console.log('🎉 Função Lambda criada com sucesso!');
        console.log('📋 Detalhes:');
        console.log('   - Nome:', FUNCTION_NAME);
        console.log('   - ARN:', lambdaResult.FunctionArn);
        console.log('   - Runtime:', lambdaResult.Runtime);
        console.log('   - Timeout:', lambdaResult.Timeout, 'segundos');
        console.log('   - Memória:', lambdaResult.MemorySize, 'MB');
        
        // Limpeza
        fs.unlinkSync(zipPath);
        console.log('🧹 Arquivos temporários removidos');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
main();
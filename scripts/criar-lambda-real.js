#!/usr/bin/env node

/**
 * Script para criar função AWS Lambda real para geração de documentos IA
 * Este script cria uma função Lambda que substitui o serviço Express atual
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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
        
        // 1. Gerar documento via Bedrock
        const modelId = 'anthropic.claude-3-haiku-20240307-v1:0';
        const promptCompleto = \`Você é um especialista em educação brasileira. Crie um \${tipo_arquivo.replace('_', ' ')} detalhado e profissional.

Prompt: \${prompt}

Responda apenas com o conteúdo do documento em formato JSON estruturado.\`;

        const bedrockParams = {
            modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: promptCompleto
                }]
            })
        };
        
        const startTime = Date.now();
        const bedrockResponse = await bedrock.send(new InvokeModelCommand(bedrockParams));
        const endTime = Date.now();
        
        const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
        const conteudoGerado = responseBody.content[0].text;
        
        // 2. Gerar UUID e S3 key
        const uuid = crypto.randomUUID();
        const s3Key = \`empresa-\${empresa_id}/contrato-\${contrato_id}/escola-\${escola_id}/\${tipo_usuario}-\${usuario_id}/ia-generated/\${tipo_arquivo}/\${uuid}.json\`;
        
        // 3. Salvar no S3
        const documentoCompleto = {
            uuid,
            conteudo: conteudoGerado,
            prompt,
            tipo_arquivo,
            usuario_id,
            empresa_id,
            contrato_id,
            escola_id,
            tipo_usuario,
            data_criacao: new Date().toISOString(),
            modelo_utilizado: modelId,
            tokens_utilizados: responseBody.usage?.output_tokens || 0,
            tempo_geracao_ms: endTime - startTime
        };
        
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'iaprender-bucket',
            Key: s3Key,
            Body: JSON.stringify(documentoCompleto, null, 2),
            ContentType: 'application/json',
            Metadata: {
                'generated-by': 'aws-lambda',
                'tipo-arquivo': tipo_arquivo,
                'usuario-id': usuario_id.toString()
            }
        }));
        
        // 4. Salvar metadados no DynamoDB
        await dynamodb.send(new PutItemCommand({
            TableName: process.env.DYNAMO_TABLE_NAME || 'arquivos_metadados',
            Item: {
                empresa_id: { N: empresa_id.toString() },
                uuid: { S: uuid },
                usuario_id: { N: usuario_id.toString() },
                tipo_usuario: { S: tipo_usuario },
                escola_id: { N: escola_id.toString() },
                contrato_id: { N: contrato_id.toString() },
                data_criacao: { S: new Date().toISOString() },
                tipo_arquivo: { S: tipo_arquivo },
                s3_key: { S: s3Key },
                status: { S: 'ativo' },
                tokens_utilizados: { N: (responseBody.usage?.output_tokens || 0).toString() },
                tempo_geracao_ms: { N: (endTime - startTime).toString() },
                modelo_utilizado: { S: modelId },
                prompt_hash: { S: crypto.createHash('md5').update(prompt).digest('hex') }
            }
        }));
        
        console.log('✅ Documento gerado com sucesso:', uuid);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                sucesso: true,
                data: {
                    uuid,
                    s3_key: s3Key,
                    conteudo: conteudoGerado,
                    tokens_utilizados: responseBody.usage?.output_tokens || 0,
                    tempo_geracao_ms: endTime - startTime,
                    modelo_utilizado: modelId
                }
            })
        };
        
    } catch (error) {
        console.error('❌ Erro na Lambda:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                sucesso: false,
                erro: error.message,
                codigo: 'LAMBDA_ERROR'
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
const TRUST_POLICY = {
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

async function criarRole() {
    console.log('🔑 Criando role IAM...');
    
    try {
        const roleResult = await iam.createRole({
            RoleName: ROLE_NAME,
            AssumeRolePolicyDocument: JSON.stringify(TRUST_POLICY),
            Description: 'Role para função Lambda de geração de documentos IA'
        }).promise();
        
        console.log('✅ Role criada:', roleResult.Role.Arn);
        
        // Anexar política customizada
        await iam.putRolePolicy({
            RoleName: ROLE_NAME,
            PolicyName: 'IAprender-Lambda-Policy',
            PolicyDocument: JSON.stringify(LAMBDA_POLICY)
        }).promise();
        
        console.log('✅ Política anexada à role');
        
        return roleResult.Role.Arn;
        
    } catch (error) {
        if (error.code === 'EntityAlreadyExists') {
            console.log('⚠️ Role já existe, usando existente');
            const existingRole = await iam.getRole({ RoleName: ROLE_NAME }).promise();
            return existingRole.Role.Arn;
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

async function testarFuncaoLambda() {
    console.log('🧪 Testando função Lambda...');
    
    const testEvent = {
        prompt: 'Crie um plano de aula sobre frações para 5º ano',
        tipo_arquivo: 'plano_aula',
        usuario_id: 1,
        empresa_id: 1,
        contrato_id: 1,
        escola_id: 1,
        tipo_usuario: 'professor'
    };
    
    try {
        const result = await lambda.invoke({
            FunctionName: FUNCTION_NAME,
            Payload: JSON.stringify(testEvent)
        }).promise();
        
        const response = JSON.parse(result.Payload);
        console.log('✅ Teste bem-sucedido:', response);
        
        return response;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        throw error;
    }
}

async function main() {
    try {
        console.log('🏗️ Iniciando criação da função AWS Lambda real...\n');
        
        // 1. Criar role IAM
        const roleArn = await criarRole();
        
        // Aguardar propagação da role
        console.log('⏳ Aguardando propagação da role (10s)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 2. Criar package da função
        const zipPath = await criarPackageLambda();
        
        // 3. Criar função Lambda
        const lambdaResult = await criarFuncaoLambda(roleArn, zipPath);
        
        // 4. Testar função
        await testarFuncaoLambda();
        
        console.log('\n✅ FUNÇÃO LAMBDA CRIADA COM SUCESSO!');
        console.log('📍 Nome da função:', FUNCTION_NAME);
        console.log('📍 ARN:', lambdaResult.FunctionArn);
        console.log('📍 Região: us-east-1');
        
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Criar endpoint no Express para chamar a Lambda');
        console.log('2. Configurar API Gateway (opcional)');
        console.log('3. Testar integração completa');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    criarRole,
    criarPackageLambda,
    criarFuncaoLambda,
    testarFuncaoLambda,
    FUNCTION_NAME,
    ROLE_NAME
};
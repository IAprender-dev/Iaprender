#!/bin/bash

# Script para criar função Lambda completa para o sistema híbrido
# Executar quando tiver permissões IAM adequadas

set -e

echo "🚀 Criando função Lambda para sistema híbrido..."

# Configurações
FUNCTION_NAME="iaprender-bedrock-generator"
REGION="us-east-1"
RUNTIME="nodejs20.x"
TIMEOUT=55
MEMORY=1024

# Criar role IAM para Lambda
echo "📝 Criando IAM Role para Lambda..."
aws iam create-role \
  --role-name iaprender-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Anexar políticas necessárias
echo "🔒 Anexando políticas IAM..."
aws iam attach-role-policy \
  --role-name iaprender-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name iaprender-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam attach-role-policy \
  --role-name iaprender-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name iaprender-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Aguardar propagação da role
echo "⏳ Aguardando propagação da IAM Role..."
sleep 10

# Criar arquivo de código da função
echo "💻 Criando código da função Lambda..."
cat > /tmp/lambda-function.js << 'EOF'
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        console.log('🚀 Lambda iniciada - Evento:', JSON.stringify(event, null, 2));
        
        const {
            prompt,
            tipo_arquivo = 'plano_aula',
            modelo_bedrock = 'anthropic.claude-3-haiku-20240307-v1:0',
            max_tokens = 1000,
            temperatura = 0.7,
            usuario_id,
            empresa_id,
            escola_id
        } = event;

        if (!prompt) {
            throw new Error('Prompt é obrigatório');
        }

        // Gerar UUID para o documento
        const uuid = require('crypto').randomUUID();
        
        // Preparar payload para Bedrock
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: max_tokens,
            temperature: temperatura,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        };

        console.log('🤖 Invocando Bedrock...');
        
        // Invocar Bedrock
        const command = new InvokeModelCommand({
            modelId: modelo_bedrock,
            body: JSON.stringify(payload),
            contentType: "application/json"
        });

        const response = await bedrock.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        const conteudo_gerado = responseBody.content[0].text;
        const tokens_utilizados = responseBody.usage.input_tokens + responseBody.usage.output_tokens;

        console.log('✅ Bedrock respondeu:', tokens_utilizados, 'tokens');

        // Salvar no S3
        const s3Key = `bedrock/${tipo_arquivo}/${usuario_id}/${uuid}.json`;
        const s3Data = {
            uuid,
            conteudo_gerado,
            tokens_utilizados,
            tipo_arquivo,
            modelo_bedrock,
            prompt,
            usuario_id,
            empresa_id,
            escola_id,
            data_criacao: new Date().toISOString(),
            processing_method: 'lambda'
        };

        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME || 'iaprender-bucket',
            Key: s3Key,
            Body: JSON.stringify(s3Data, null, 2),
            ContentType: 'application/json'
        }));

        console.log('📁 Salvo no S3:', s3Key);

        // Salvar metadados no DynamoDB
        try {
            await dynamodb.send(new PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME || 'iaprender-documentos',
                Item: {
                    uuid: { S: uuid },
                    usuario_id: { N: usuario_id.toString() },
                    empresa_id: { N: empresa_id.toString() },
                    tipo_arquivo: { S: tipo_arquivo },
                    modelo_bedrock: { S: modelo_bedrock },
                    tokens_utilizados: { N: tokens_utilizados.toString() },
                    s3_key: { S: s3Key },
                    data_criacao: { S: new Date().toISOString() },
                    processing_method: { S: 'lambda' }
                }
            }));
            console.log('🗃️ Metadados salvos no DynamoDB');
        } catch (dynamoError) {
            console.warn('⚠️ Erro ao salvar no DynamoDB:', dynamoError.message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                sucesso: true,
                dados: {
                    uuid,
                    conteudo_gerado,
                    tokens_utilizados,
                    tempo_geracao_ms: 0,
                    processing_method: 'lambda',
                    data_criacao: new Date().toISOString(),
                    s3_key: s3Key
                },
                mensagem: 'Documento gerado com sucesso via Lambda'
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
EOF

# Criar package.json
cat > /tmp/package.json << 'EOF'
{
  "name": "iaprender-bedrock-generator",
  "version": "1.0.0",
  "description": "Gerador de documentos educacionais via AWS Bedrock",
  "main": "lambda-function.js",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-dynamodb": "^3.0.0"
  }
}
EOF

# Instalar dependências
echo "📦 Instalando dependências..."
cd /tmp
npm install

# Criar arquivo ZIP
echo "🗜️ Criando arquivo ZIP..."
zip -r lambda-deployment.zip lambda-function.js package.json node_modules/

# Obter ARN da role
ROLE_ARN=$(aws iam get-role --role-name iaprender-lambda-role --query 'Role.Arn' --output text)
echo "🔑 Role ARN: $ROLE_ARN"

# Criar função Lambda
echo "🎯 Criando função Lambda..."
aws lambda create-function \
  --function-name $FUNCTION_NAME \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler lambda-function.handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout $TIMEOUT \
  --memory-size $MEMORY \
  --environment Variables='{
    "AWS_REGION":"'$REGION'",
    "S3_BUCKET_NAME":"iaprender-bucket",
    "DYNAMODB_TABLE_NAME":"iaprender-documentos"
  }' \
  --description "Gerador de documentos educacionais via Bedrock para IAverse"

echo "✅ Função Lambda criada com sucesso!"
echo "📋 Nome: $FUNCTION_NAME"
echo "🌍 Região: $REGION"
echo "⏱️ Timeout: ${TIMEOUT}s"
echo "💾 Memória: ${MEMORY}MB"

# Testar função
echo "🧪 Testando função Lambda..."
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{
    "prompt": "Criar um plano de aula sobre frações para o 5º ano",
    "tipo_arquivo": "plano_aula",
    "usuario_id": 1,
    "empresa_id": 1,
    "escola_id": 1
  }' \
  --cli-binary-format raw-in-base64-out \
  /tmp/lambda-response.json

echo "📄 Resposta da Lambda:"
cat /tmp/lambda-response.json | jq .

echo "🎉 Setup completo! O sistema híbrido agora pode usar Lambda."
echo "💡 Próximos passos:"
echo "   1. Verificar se a função aparece no console AWS"
echo "   2. Testar via interface /hybrid-lambda-demo"
echo "   3. Monitorar logs no CloudWatch"

# Cleanup
rm -f /tmp/lambda-function.js /tmp/package.json /tmp/lambda-deployment.zip /tmp/lambda-response.json
rm -rf /tmp/node_modules
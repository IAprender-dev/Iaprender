#!/usr/bin/env python3
import boto3
import os
import json
import uuid
from datetime import datetime

# Carregar configs do ambiente
AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY")
REGIAO = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET_NAME")
PASTA_OUTPUT = "bedrock/outputs"

def test_bedrock_permissions():
    """Testa permissões específicas do Bedrock no S3"""
    
    print(f"🧪 Testando permissões IAM aplicadas")
    print(f"📦 Bucket: {BUCKET}")
    print(f"📁 Pasta Output: {PASTA_OUTPUT}")
    
    # Cliente S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Cliente Bedrock Runtime
    bedrock = boto3.client(
        'bedrock-runtime',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Testar acesso às pastas específicas
    pastas_permitidas = [
        "bedrock/outputs/",
        "bedrock/inputs/",
        "bedrock/logs/"
    ]
    
    print(f"\n🔐 Testando acesso às pastas permitidas...")
    
    for pasta in pastas_permitidas:
        try:
            # Testar listagem da pasta
            response = s3.list_objects_v2(
                Bucket=BUCKET,
                Prefix=pasta,
                MaxKeys=5
            )
            
            count = response.get('KeyCount', 0)
            print(f"✅ {pasta}: {count} objetos")
            
            # Testar upload de arquivo de teste
            test_key = f"{pasta}test-{uuid.uuid4()}.json"
            test_data = {
                "timestamp": datetime.now().isoformat(),
                "message": f"Teste de upload para {pasta}",
                "bucket": BUCKET,
                "pasta": pasta
            }
            
            s3.put_object(
                Bucket=BUCKET,
                Key=test_key,
                Body=json.dumps(test_data, indent=2),
                ContentType='application/json'
            )
            
            print(f"  ✅ Upload: {test_key}")
            
            # Testar download
            response = s3.get_object(Bucket=BUCKET, Key=test_key)
            content = json.loads(response['Body'].read())
            print(f"  ✅ Download: {content['message']}")
            
            # Limpar arquivo de teste
            s3.delete_object(Bucket=BUCKET, Key=test_key)
            print(f"  ✅ Delete: arquivo removido")
            
        except Exception as e:
            print(f"  ❌ Erro em {pasta}: {str(e)}")
    
    # Testar permissões do Bedrock
    print(f"\n🤖 Testando permissões do Bedrock...")
    
    try:
        # Listar modelos disponíveis
        bedrock_client = boto3.client('bedrock', region_name=REGIAO)
        models = bedrock_client.list_foundation_models()
        print(f"✅ Modelos disponíveis: {len(models['modelSummaries'])}")
        
        # Testar um modelo específico
        model_id = 'anthropic.claude-3-haiku-20240307-v1:0'
        try:
            response = bedrock.invoke_model(
                modelId=model_id,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 50,
                    "messages": [{"role": "user", "content": "Teste de conexão"}]
                })
            )
            
            result = json.loads(response['body'].read())
            print(f"✅ Modelo {model_id}: {result['content'][0]['text'][:30]}...")
            
        except Exception as e:
            print(f"❌ Erro ao testar modelo: {str(e)}")
            
    except Exception as e:
        print(f"❌ Erro ao acessar Bedrock: {str(e)}")
    
    # Criar estrutura de trabalho
    print(f"\n🏗️ Criando estrutura de trabalho...")
    
    try:
        # Criar arquivo de configuração
        config_data = {
            "bucket": BUCKET,
            "region": REGIAO,
            "pasta_output": PASTA_OUTPUT,
            "created_at": datetime.now().isoformat(),
            "permissions": {
                "s3_actions": ["PutObject", "GetObject", "DeleteObject", "ListBucket"],
                "bedrock_actions": ["InvokeModel", "InvokeModelWithResponseStream", "ListFoundationModels"],
                "folders": pastas_permitidas
            }
        }
        
        config_key = f"{PASTA_OUTPUT}/config.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=config_key,
            Body=json.dumps(config_data, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Configuração criada: {config_key}")
        
        # Criar arquivo de exemplo
        example_data = {
            "id": str(uuid.uuid4()),
            "type": "bedrock_output",
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "input": "Exemplo de entrada",
            "output": "Exemplo de saída do Bedrock",
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "tokens_used": 25,
                "processing_time": "0.5s"
            }
        }
        
        example_key = f"{PASTA_OUTPUT}/example-output.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=example_key,
            Body=json.dumps(example_data, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Exemplo criado: {example_key}")
        
    except Exception as e:
        print(f"❌ Erro ao criar estrutura: {str(e)}")
    
    print(f"\n✅ Teste de permissões concluído!")
    return True

if __name__ == "__main__":
    test_bedrock_permissions()
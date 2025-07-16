#!/usr/bin/env python3
import boto3
import os
import json
import uuid
from datetime import datetime

# Carregar configs do ambiente
AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY")
REGIAO = os.getenv("AWS_REGION", "us-east-1")
BUCKET = os.getenv("BUCKET_NAME", "iaprender-files-2025")
PASTA_OUTPUT = "bedrock/outputs"

def setup_s3_bedrock():
    """Configura bucket S3 com integração Bedrock"""
    
    if not AWS_KEY or not AWS_SECRET:
        print("❌ Credenciais AWS não encontradas")
        return False
    
    # Cliente S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Cliente Bedrock
    bedrock = boto3.client(
        'bedrock-runtime',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    try:
        print(f"🪣 Configurando bucket: {BUCKET}")
        
        # Criar bucket se não existir
        try:
            s3.head_bucket(Bucket=BUCKET)
            print(f"✅ Bucket {BUCKET} já existe")
        except:
            if REGIAO == 'us-east-1':
                s3.create_bucket(Bucket=BUCKET)
            else:
                s3.create_bucket(
                    Bucket=BUCKET,
                    CreateBucketConfiguration={'LocationConstraint': REGIAO}
                )
            print(f"✅ Bucket {BUCKET} criado")
        
        # Criar estrutura de pastas
        pastas = [
            'documentos/',
            'imagens/',
            'videos/',
            'audios/',
            'planos-aula/',
            'atividades/',
            PASTA_OUTPUT + '/',
            'temp/'
        ]
        
        for pasta in pastas:
            s3.put_object(
                Bucket=BUCKET,
                Key=pasta,
                Body=b''
            )
        
        print(f"✅ Estrutura de pastas criada")
        
        # Testar Bedrock
        try:
            response = bedrock.invoke_model(
                modelId='anthropic.claude-3-haiku-20240307-v1:0',
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 100,
                    "messages": [{"role": "user", "content": "Teste de conexão"}]
                })
            )
            print(f"✅ Bedrock conectado com sucesso")
        except Exception as e:
            print(f"⚠️ Bedrock não disponível: {str(e)}")
        
        # Criar arquivo de teste
        test_id = str(uuid.uuid4())
        test_content = {
            "id": test_id,
            "timestamp": datetime.now().isoformat(),
            "bucket": BUCKET,
            "region": REGIAO,
            "pasta_output": PASTA_OUTPUT,
            "status": "configurado"
        }
        
        s3.put_object(
            Bucket=BUCKET,
            Key=f"{PASTA_OUTPUT}/test-{test_id}.json",
            Body=json.dumps(test_content, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Arquivo de teste criado: test-{test_id}.json")
        
        # Listar objetos para verificar
        response = s3.list_objects_v2(Bucket=BUCKET)
        total = response.get('KeyCount', 0)
        
        print(f"✅ Configuração concluída - {total} objetos no bucket")
        print(f"📍 Bucket: {BUCKET}")
        print(f"📍 Região: {REGIAO}")
        print(f"📍 Pasta Bedrock: {PASTA_OUTPUT}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro na configuração: {str(e)}")
        return False

if __name__ == "__main__":
    success = setup_s3_bedrock()
    exit(0 if success else 1)
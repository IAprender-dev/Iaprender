#!/usr/bin/env python3
import boto3
import os
import json
import uuid

# Carregar configs do ambiente
AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY")
REGIAO = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET_NAME")
PASTA_OUTPUT = "bedrock/outputs"

def test_s3_bucket():
    """Testa acesso ao bucket S3 específico"""
    
    print(f"🪣 Testando acesso ao bucket: {BUCKET}")
    
    # Cliente S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    try:
        # Testar se o bucket existe e é acessível
        response = s3.head_bucket(Bucket=BUCKET)
        print(f"✅ Bucket {BUCKET} existe e é acessível")
        
        # Testar listagem de objetos
        try:
            response = s3.list_objects_v2(Bucket=BUCKET, MaxKeys=10)
            if 'Contents' in response:
                print(f"📁 Objetos no bucket ({response['KeyCount']}):")
                for obj in response['Contents'][:5]:
                    print(f"  - {obj['Key']} ({obj['Size']} bytes)")
            else:
                print(f"📁 Bucket {BUCKET} está vazio")
                
        except Exception as e:
            print(f"❌ Erro ao listar objetos: {str(e)}")
        
        # Testar upload de arquivo de teste
        try:
            test_key = f"{PASTA_OUTPUT}/test-{uuid.uuid4()}.json"
            test_data = {
                "timestamp": "2025-01-16T11:30:00Z",
                "message": "Teste de upload",
                "bucket": BUCKET,
                "pasta": PASTA_OUTPUT
            }
            
            s3.put_object(
                Bucket=BUCKET,
                Key=test_key,
                Body=json.dumps(test_data, indent=2),
                ContentType='application/json'
            )
            
            print(f"✅ Upload de teste realizado: {test_key}")
            
            # Testar download
            response = s3.get_object(Bucket=BUCKET, Key=test_key)
            content = json.loads(response['Body'].read())
            print(f"✅ Download de teste realizado: {content['message']}")
            
            # Limpar arquivo de teste
            s3.delete_object(Bucket=BUCKET, Key=test_key)
            print(f"✅ Arquivo de teste removido")
            
        except Exception as e:
            print(f"❌ Erro no teste de upload/download: {str(e)}")
        
        # Testar criação de "pastas" (prefixos)
        try:
            pastas = [
                f"{PASTA_OUTPUT}/",
                "documentos/",
                "imagens/",
                "videos/",
                "audios/",
                "planos-aula/",
                "atividades/",
                "temp/"
            ]
            
            for pasta in pastas:
                s3.put_object(
                    Bucket=BUCKET,
                    Key=pasta,
                    Body=b''
                )
            
            print(f"✅ Estrutura de pastas criada: {len(pastas)} pastas")
            
        except Exception as e:
            print(f"❌ Erro ao criar estrutura de pastas: {str(e)}")
            
    except Exception as e:
        print(f"❌ Erro ao acessar bucket {BUCKET}: {str(e)}")
    
    return True

if __name__ == "__main__":
    test_s3_bucket()
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

def check_aws_secrets():
    """Verifica as credenciais AWS nas secrets"""
    
    print("🔐 Verificando credenciais AWS das secrets:")
    print(f"AWS_ACCESS_KEY_ID: {'✅ Configurado' if AWS_KEY else '❌ Não encontrado'}")
    print(f"AWS_SECRET_ACCESS_KEY: {'✅ Configurado' if AWS_SECRET else '❌ Não encontrado'}")
    print(f"AWS_REGION: {REGIAO or '❌ Não configurado'}")
    print(f"S3_BUCKET_NAME: {BUCKET or '❌ Não configurado'}")
    
    if AWS_KEY:
        print(f"Access Key ID: {AWS_KEY[:8]}***{AWS_KEY[-4:] if len(AWS_KEY) > 12 else '***'}")
    
    if AWS_SECRET:
        print(f"Secret Access Key: {AWS_SECRET[:8]}***{AWS_SECRET[-4:] if len(AWS_SECRET) > 12 else '***'}")
    
    print(f"Região: {REGIAO}")
    print(f"Bucket: {BUCKET}")
    print(f"Pasta Output: {PASTA_OUTPUT}")
    
    # Testar conexão se credenciais estão disponíveis
    if AWS_KEY and AWS_SECRET:
        try:
            # Teste básico com STS
            sts = boto3.client(
                'sts',
                aws_access_key_id=AWS_KEY,
                aws_secret_access_key=AWS_SECRET,
                region_name=REGIAO or 'us-east-1'
            )
            
            identity = sts.get_caller_identity()
            print(f"\n✅ Conexão AWS bem-sucedida:")
            print(f"Account ID: {identity['Account']}")
            print(f"User ARN: {identity['Arn']}")
            print(f"User ID: {identity['UserId']}")
            
            # Testar S3
            s3 = boto3.client(
                's3',
                aws_access_key_id=AWS_KEY,
                aws_secret_access_key=AWS_SECRET,
                region_name=REGIAO or 'us-east-1'
            )
            
            # Listar buckets disponíveis
            buckets = s3.list_buckets()
            print(f"\n📦 Buckets disponíveis ({len(buckets['Buckets'])}):")
            for bucket in buckets['Buckets']:
                print(f"  - {bucket['Name']} (criado em {bucket['CreationDate']})")
            
            # Verificar se o bucket configurado existe
            if BUCKET:
                try:
                    s3.head_bucket(Bucket=BUCKET)
                    print(f"\n✅ Bucket {BUCKET} existe e é acessível")
                    
                    # Listar objetos no bucket
                    response = s3.list_objects_v2(Bucket=BUCKET, MaxKeys=10)
                    if 'Contents' in response:
                        print(f"📁 Objetos no bucket ({response['KeyCount']}):")
                        for obj in response['Contents'][:5]:
                            print(f"  - {obj['Key']} ({obj['Size']} bytes)")
                    else:
                        print(f"📁 Bucket {BUCKET} está vazio")
                        
                except Exception as e:
                    print(f"❌ Erro ao acessar bucket {BUCKET}: {str(e)}")
            
        except Exception as e:
            print(f"❌ Erro na conexão AWS: {str(e)}")
    
    return True

if __name__ == "__main__":
    check_aws_secrets()
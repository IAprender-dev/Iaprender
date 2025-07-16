#!/usr/bin/env python3
"""
Script para criar e configurar bucket S3 para o sistema IAverse
"""

import boto3
import json
import sys
import os
from datetime import datetime

def create_s3_bucket():
    """Cria e configura o bucket S3 para o sistema IAverse"""
    
    # Configurar credenciais AWS
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID', '').strip()
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY', '').strip()
    aws_region = os.getenv('AWS_REGION', 'us-east-1').strip()
    
    if not aws_access_key or not aws_secret_key:
        print("❌ Erro: Credenciais AWS não encontradas nas variáveis de ambiente")
        print("Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY")
        return False
    
    # Configurar cliente S3
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )
    
    bucket_name = 'iaprender-files-2025'
    
    try:
        print(f"🪣 Criando bucket S3: {bucket_name}")
        
        # Criar bucket
        if aws_region == 'us-east-1':
            # us-east-1 não precisa de LocationConstraint
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={'LocationConstraint': aws_region}
            )
        
        print(f"✅ Bucket {bucket_name} criado com sucesso")
        
        # Configurar política de bucket para acesso controlado
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "IAverseEducationalFiles",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{get_account_id()}:root"
                    },
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{bucket_name}",
                        f"arn:aws:s3:::{bucket_name}/*"
                    ]
                }
            ]
        }
        
        # Aplicar política de bucket
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        
        print(f"✅ Política de segurança aplicada ao bucket")
        
        # Configurar versionamento
        s3_client.put_bucket_versioning(
            Bucket=bucket_name,
            VersioningConfiguration={'Status': 'Enabled'}
        )
        
        print(f"✅ Versionamento habilitado")
        
        # Criar estrutura de pastas básica
        folders = [
            'documentos/',
            'imagens/',
            'videos/',
            'audios/',
            'planos-aula/',
            'atividades/',
            'temp/'
        ]
        
        for folder in folders:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=folder,
                Body=b'',
                ContentType='application/x-directory'
            )
        
        print(f"✅ Estrutura de pastas criada: {', '.join(folders)}")
        
        # Criar arquivo de configuração
        config_content = {
            "bucket_name": bucket_name,
            "region": aws_region,
            "created_at": datetime.now().isoformat(),
            "folders": folders,
            "max_file_size": "50MB",
            "allowed_types": [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png",
                "image/gif",
                "video/mp4",
                "video/avi",
                "audio/mpeg",
                "audio/wav"
            ]
        }
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key='config.json',
            Body=json.dumps(config_content, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Arquivo de configuração criado")
        
        # Testar listagem
        response = s3_client.list_objects_v2(Bucket=bucket_name)
        if 'Contents' in response:
            print(f"✅ Teste de listagem bem-sucedido: {len(response['Contents'])} objetos")
        
        print(f"\n🎉 Bucket S3 configurado com sucesso!")
        print(f"📍 Nome: {bucket_name}")
        print(f"📍 Região: {aws_region}")
        print(f"📍 URL: https://{bucket_name}.s3.{aws_region}.amazonaws.com/")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar bucket: {str(e)}")
        return False

def get_account_id():
    """Obtém o ID da conta AWS"""
    try:
        sts_client = boto3.client('sts')
        response = sts_client.get_caller_identity()
        return response['Account']
    except:
        return "123456789012"  # Fallback

if __name__ == "__main__":
    success = create_s3_bucket()
    sys.exit(0 if success else 1)
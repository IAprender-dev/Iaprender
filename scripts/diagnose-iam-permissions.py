#!/usr/bin/env python3
import boto3
import json
import os
from datetime import datetime

# Carregar configs do ambiente
AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY")
REGIAO = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET_NAME")
USERNAME = "UsuarioBedrock"

def diagnose_iam_permissions():
    """Diagnostica problemas com permissões IAM do usuário UsuarioBedrock"""
    
    print(f"🔍 Diagnóstico de Permissões IAM")
    print(f"👤 Usuário: {USERNAME}")
    print(f"📦 Bucket: {BUCKET}")
    print(f"🌍 Região: {REGIAO}")
    print(f"⏰ Timestamp: {datetime.now()}")
    
    # Cliente IAM
    iam = boto3.client(
        'iam',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Cliente STS para verificar identidade atual
    sts = boto3.client(
        'sts',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    print(f"\n🔐 Verificando identidade atual...")
    try:
        identity = sts.get_caller_identity()
        print(f"✅ Account ID: {identity['Account']}")
        print(f"✅ User ID: {identity['UserId']}")
        print(f"✅ ARN: {identity['Arn']}")
        
        # Verificar se é realmente o usuário correto
        if USERNAME in identity['Arn']:
            print(f"✅ Usuário {USERNAME} confirmado")
        else:
            print(f"⚠️ Usuário atual não é {USERNAME}")
            
    except Exception as e:
        print(f"❌ Erro ao verificar identidade: {str(e)}")
        return False
    
    # Listar políticas anexadas ao usuário
    print(f"\n📋 Políticas anexadas ao usuário {USERNAME}...")
    try:
        # Políticas gerenciadas
        attached_policies = iam.list_attached_user_policies(UserName=USERNAME)
        print(f"📄 Políticas gerenciadas anexadas: {len(attached_policies['AttachedPolicies'])}")
        
        for policy in attached_policies['AttachedPolicies']:
            print(f"  - {policy['PolicyName']} (ARN: {policy['PolicyArn']})")
            
            # Obter detalhes da política
            try:
                policy_details = iam.get_policy(PolicyArn=policy['PolicyArn'])
                policy_version = iam.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_details['Policy']['DefaultVersionId']
                )
                
                document = policy_version['PolicyVersion']['Document']
                print(f"    📋 Documento da política:")
                print(f"    {json.dumps(document, indent=6)}")
                
            except Exception as e:
                print(f"    ❌ Erro ao obter detalhes: {str(e)}")
        
        # Políticas inline
        inline_policies = iam.list_user_policies(UserName=USERNAME)
        print(f"📄 Políticas inline: {len(inline_policies['PolicyNames'])}")
        
        for policy_name in inline_policies['PolicyNames']:
            print(f"  - {policy_name}")
            
            try:
                policy_doc = iam.get_user_policy(UserName=USERNAME, PolicyName=policy_name)
                print(f"    📋 Documento da política inline:")
                print(f"    {json.dumps(policy_doc['PolicyDocument'], indent=6)}")
                
            except Exception as e:
                print(f"    ❌ Erro ao obter política inline: {str(e)}")
        
        # Grupos do usuário
        user_groups = iam.get_groups_for_user(UserName=USERNAME)
        print(f"👥 Grupos do usuário: {len(user_groups['Groups'])}")
        
        for group in user_groups['Groups']:
            print(f"  - Grupo: {group['GroupName']}")
            
            # Políticas do grupo
            group_policies = iam.list_attached_group_policies(GroupName=group['GroupName'])
            for policy in group_policies['AttachedPolicies']:
                print(f"    📄 Política do grupo: {policy['PolicyName']}")
                
    except Exception as e:
        print(f"❌ Erro ao listar políticas: {str(e)}")
    
    # Testar permissões específicas
    print(f"\n🧪 Testando permissões específicas...")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Testar s3:ListBucket
    print(f"🔍 Testando s3:ListBucket...")
    try:
        response = s3.list_objects_v2(
            Bucket=BUCKET,
            Prefix="bedrock/outputs/",
            MaxKeys=1
        )
        print(f"✅ s3:ListBucket funcionando")
    except Exception as e:
        print(f"❌ s3:ListBucket falhou: {str(e)}")
        
        # Testar sem condição
        try:
            response = s3.list_objects_v2(Bucket=BUCKET, MaxKeys=1)
            print(f"✅ s3:ListBucket sem condição funcionando")
        except Exception as e2:
            print(f"❌ s3:ListBucket sem condição também falhou: {str(e2)}")
    
    # Testar s3:PutObject
    print(f"🔍 Testando s3:PutObject...")
    test_key = "bedrock/outputs/test-permission.json"
    test_data = {"test": "permission check", "timestamp": datetime.now().isoformat()}
    
    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=test_key,
            Body=json.dumps(test_data),
            ContentType='application/json'
        )
        print(f"✅ s3:PutObject funcionando")
        
        # Testar s3:GetObject
        print(f"🔍 Testando s3:GetObject...")
        response = s3.get_object(Bucket=BUCKET, Key=test_key)
        print(f"✅ s3:GetObject funcionando")
        
        # Testar s3:DeleteObject
        print(f"🔍 Testando s3:DeleteObject...")
        s3.delete_object(Bucket=BUCKET, Key=test_key)
        print(f"✅ s3:DeleteObject funcionando")
        
    except Exception as e:
        print(f"❌ s3:PutObject falhou: {str(e)}")
    
    # Verificar bucket existe
    print(f"\n📦 Verificando bucket {BUCKET}...")
    try:
        s3.head_bucket(Bucket=BUCKET)
        print(f"✅ Bucket {BUCKET} existe e é acessível")
    except Exception as e:
        print(f"❌ Erro ao acessar bucket: {str(e)}")
    
    # Política sugerida
    print(f"\n💡 Política sugerida para anexar ao usuário {USERNAME}:")
    suggested_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:DeleteObject"
                ],
                "Resource": [
                    f"arn:aws:s3:::{BUCKET}/bedrock/outputs/*",
                    f"arn:aws:s3:::{BUCKET}/bedrock/inputs/*",
                    f"arn:aws:s3:::{BUCKET}/bedrock/logs/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": ["s3:ListBucket"],
                "Resource": f"arn:aws:s3:::{BUCKET}",
                "Condition": {
                    "StringLike": {
                        "s3:prefix": [
                            "bedrock/outputs/*",
                            "bedrock/inputs/*",
                            "bedrock/logs/*"
                        ]
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream",
                    "bedrock:ListFoundationModels",
                    "bedrock:GetFoundationModel"
                ],
                "Resource": "*"
            }
        ]
    }
    
    print(json.dumps(suggested_policy, indent=2))
    
    print(f"\n🔧 Comandos para resolver o problema:")
    print(f"1. Criar política personalizada:")
    print(f"   aws iam create-policy --policy-name IAprender-S3-Bedrock-Policy --policy-document file://politica.json")
    print(f"")
    print(f"2. Anexar política ao usuário:")
    print(f"   aws iam attach-user-policy --user-name {USERNAME} --policy-arn arn:aws:iam::ACCOUNT_ID:policy/IAprender-S3-Bedrock-Policy")
    print(f"")
    print(f"3. Ou anexar política inline:")
    print(f"   aws iam put-user-policy --user-name {USERNAME} --policy-name S3BedrockAccess --policy-document file://politica.json")
    
    return True

if __name__ == "__main__":
    diagnose_iam_permissions()
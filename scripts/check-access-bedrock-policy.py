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
POLICY_NAME = "AcessoBedRock"

def check_access_bedrock_policy():
    """Verifica se a política AcessoBedRock está anexada ao usuário"""
    
    print(f"🔍 Verificando política '{POLICY_NAME}'")
    print(f"👤 Usuário: {USERNAME}")
    print(f"📦 Bucket: {BUCKET}")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Criar cliente IAM com credenciais administrativas (se disponíveis)
    try:
        iam = boto3.client('iam', region_name=REGIAO)
        
        # Tentar listar políticas do usuário
        print(f"\n🔍 Tentando verificar políticas do usuário {USERNAME}...")
        
        try:
            # Verificar políticas inline
            inline_policies = iam.list_user_policies(UserName=USERNAME)
            print(f"📋 Políticas inline encontradas: {len(inline_policies['PolicyNames'])}")
            
            if POLICY_NAME in inline_policies['PolicyNames']:
                print(f"✅ Política inline '{POLICY_NAME}' encontrada!")
                
                # Obter detalhes da política inline
                try:
                    policy_doc = iam.get_user_policy(UserName=USERNAME, PolicyName=POLICY_NAME)
                    print(f"📄 Documento da política '{POLICY_NAME}':")
                    print(json.dumps(policy_doc['PolicyDocument'], indent=2))
                    
                    # Verificar se tem as permissões necessárias
                    doc = policy_doc['PolicyDocument']
                    has_s3_put = False
                    has_s3_get = False
                    has_s3_list = False
                    has_bedrock = False
                    
                    for statement in doc.get('Statement', []):
                        actions = statement.get('Action', [])
                        if isinstance(actions, str):
                            actions = [actions]
                        
                        for action in actions:
                            if 's3:PutObject' in action:
                                has_s3_put = True
                            if 's3:GetObject' in action:
                                has_s3_get = True
                            if 's3:ListBucket' in action:
                                has_s3_list = True
                            if 'bedrock:' in action:
                                has_bedrock = True
                    
                    print(f"\n🔍 Análise das permissões:")
                    print(f"  {'✅' if has_s3_put else '❌'} s3:PutObject")
                    print(f"  {'✅' if has_s3_get else '❌'} s3:GetObject")
                    print(f"  {'✅' if has_s3_list else '❌'} s3:ListBucket")
                    print(f"  {'✅' if has_bedrock else '❌'} bedrock:InvokeModel")
                    
                    if not all([has_s3_put, has_s3_get, has_s3_list, has_bedrock]):
                        print(f"\n⚠️ Política '{POLICY_NAME}' está incompleta!")
                        print(f"🔧 Algumas permissões estão faltando.")
                    else:
                        print(f"\n✅ Política '{POLICY_NAME}' tem todas as permissões necessárias!")
                    
                except Exception as e:
                    print(f"❌ Erro ao obter detalhes da política: {str(e)}")
                    
            else:
                print(f"❌ Política inline '{POLICY_NAME}' NÃO encontrada!")
                print(f"   Políticas inline existentes: {inline_policies['PolicyNames']}")
            
            # Verificar políticas gerenciadas anexadas
            attached_policies = iam.list_attached_user_policies(UserName=USERNAME)
            print(f"\n📋 Políticas gerenciadas anexadas: {len(attached_policies['AttachedPolicies'])}")
            
            for policy in attached_policies['AttachedPolicies']:
                print(f"  - {policy['PolicyName']} (ARN: {policy['PolicyArn']})")
                if POLICY_NAME in policy['PolicyName']:
                    print(f"    ✅ Política gerenciada '{POLICY_NAME}' encontrada!")
                    
        except Exception as e:
            print(f"❌ Erro ao verificar políticas: {str(e)}")
            if "AccessDenied" in str(e):
                print(f"⚠️ O usuário {USERNAME} não tem permissões para listar suas próprias políticas")
                print(f"   Isso é normal. Vamos tentar outros métodos...")
            
    except Exception as e:
        print(f"❌ Erro ao conectar com IAM: {str(e)}")
    
    # Método alternativo: Testar diretamente as operações
    print(f"\n🧪 Testando operações específicas...")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    test_results = []
    
    # Teste 1: s3:ListBucket
    print(f"1. Testando s3:ListBucket...")
    try:
        s3.list_objects_v2(Bucket=BUCKET, Prefix="bedrock/outputs/", MaxKeys=1)
        test_results.append("✅ s3:ListBucket: FUNCIONANDO")
    except Exception as e:
        test_results.append(f"❌ s3:ListBucket: FALHOU - {str(e)}")
    
    # Teste 2: s3:PutObject
    print(f"2. Testando s3:PutObject...")
    try:
        test_key = f"bedrock/outputs/test-policy-{datetime.now().strftime('%Y%m%d%H%M%S')}.json"
        s3.put_object(
            Bucket=BUCKET,
            Key=test_key,
            Body=json.dumps({"test": "policy check"}),
            ContentType='application/json'
        )
        test_results.append("✅ s3:PutObject: FUNCIONANDO")
        
        # Teste 3: s3:GetObject
        print(f"3. Testando s3:GetObject...")
        try:
            s3.get_object(Bucket=BUCKET, Key=test_key)
            test_results.append("✅ s3:GetObject: FUNCIONANDO")
        except Exception as e:
            test_results.append(f"❌ s3:GetObject: FALHOU - {str(e)}")
        
        # Teste 4: s3:DeleteObject
        print(f"4. Testando s3:DeleteObject...")
        try:
            s3.delete_object(Bucket=BUCKET, Key=test_key)
            test_results.append("✅ s3:DeleteObject: FUNCIONANDO")
        except Exception as e:
            test_results.append(f"❌ s3:DeleteObject: FALHOU - {str(e)}")
            
    except Exception as e:
        test_results.append(f"❌ s3:PutObject: FALHOU - {str(e)}")
        test_results.append(f"❌ s3:GetObject: PULADO (put falhou)")
        test_results.append(f"❌ s3:DeleteObject: PULADO (put falhou)")
    
    # Teste 5: Bedrock
    print(f"5. Testando Bedrock...")
    try:
        bedrock = boto3.client('bedrock-runtime', region_name=REGIAO)
        bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "test"}]
            })
        )
        test_results.append("✅ Bedrock: FUNCIONANDO")
    except Exception as e:
        test_results.append(f"❌ Bedrock: FALHOU - {str(e)}")
    
    # Resumo dos resultados
    print(f"\n📊 RESUMO DOS TESTES:")
    for result in test_results:
        print(f"  {result}")
    
    # Contagem de sucessos
    success_count = sum(1 for r in test_results if r.startswith("✅"))
    total_count = len(test_results)
    
    print(f"\n📈 Taxa de sucesso: {success_count}/{total_count} ({(success_count/total_count)*100:.1f}%)")
    
    if success_count == 0:
        print(f"\n❌ POLÍTICA '{POLICY_NAME}' NÃO ESTÁ FUNCIONANDO")
        print(f"🔧 A política precisa ser criada ou anexada ao usuário {USERNAME}")
    elif success_count < total_count:
        print(f"\n⚠️ POLÍTICA '{POLICY_NAME}' ESTÁ PARCIALMENTE FUNCIONANDO")
        print(f"🔧 Algumas permissões estão faltando ou incorretas")
    else:
        print(f"\n✅ POLÍTICA '{POLICY_NAME}' ESTÁ FUNCIONANDO PERFEITAMENTE!")
    
    return success_count == total_count

if __name__ == "__main__":
    check_access_bedrock_policy()
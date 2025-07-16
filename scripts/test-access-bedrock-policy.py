#!/usr/bin/env python3
import boto3
import json
import os
import uuid
from datetime import datetime

# Carregar configs do ambiente
AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY")
REGIAO = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET_NAME")

def test_access_bedrock_policy():
    """Testa se a política AcessoBedRock está funcionando"""
    
    print(f"🔍 Testando política 'AcessoBedRock'")
    print(f"📦 Bucket: {BUCKET}")
    print(f"⏰ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
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
    
    success_count = 0
    total_tests = 0
    
    # Teste 1: Verificar se bucket é acessível
    print(f"\n📦 Teste 1: Verificando acesso ao bucket...")
    total_tests += 1
    try:
        s3.head_bucket(Bucket=BUCKET)
        print(f"✅ Bucket {BUCKET} é acessível")
        success_count += 1
    except Exception as e:
        print(f"❌ Erro ao acessar bucket: {str(e)}")
    
    # Teste 2: Listar objetos com prefixo
    print(f"\n📋 Teste 2: Listando objetos com prefixo bedrock/outputs...")
    total_tests += 1
    try:
        response = s3.list_objects_v2(
            Bucket=BUCKET,
            Prefix="bedrock/outputs/",
            MaxKeys=10
        )
        count = response.get('KeyCount', 0)
        print(f"✅ Lista de objetos funcionou: {count} itens encontrados")
        success_count += 1
    except Exception as e:
        print(f"❌ Erro ao listar objetos: {str(e)}")
    
    # Teste 3: Upload de arquivo
    print(f"\n📤 Teste 3: Upload de arquivo de teste...")
    total_tests += 1
    test_key = f"bedrock/outputs/test-access-bedrock-{uuid.uuid4()}.json"
    test_data = {
        "test_id": str(uuid.uuid4()),
        "policy_name": "AcessoBedRock",
        "timestamp": datetime.now().isoformat(),
        "test_type": "upload_test",
        "bucket": BUCKET,
        "key": test_key
    }
    
    try:
        s3.put_object(
            Bucket=BUCKET,
            Key=test_key,
            Body=json.dumps(test_data, indent=2),
            ContentType='application/json'
        )
        print(f"✅ Upload realizado com sucesso: {test_key}")
        success_count += 1
        
        # Teste 4: Download do arquivo
        print(f"\n📥 Teste 4: Download do arquivo...")
        total_tests += 1
        try:
            response = s3.get_object(Bucket=BUCKET, Key=test_key)
            content = json.loads(response['Body'].read())
            print(f"✅ Download realizado: {content['test_id']}")
            success_count += 1
            
            # Teste 5: Deletar arquivo
            print(f"\n🗑️ Teste 5: Deletando arquivo...")
            total_tests += 1
            try:
                s3.delete_object(Bucket=BUCKET, Key=test_key)
                print(f"✅ Arquivo deletado com sucesso")
                success_count += 1
            except Exception as e:
                print(f"❌ Erro ao deletar arquivo: {str(e)}")
                
        except Exception as e:
            print(f"❌ Erro ao fazer download: {str(e)}")
            total_tests += 1
            
    except Exception as e:
        print(f"❌ Erro ao fazer upload: {str(e)}")
        total_tests += 2  # Pulou download e delete
    
    # Teste 6: Bedrock funcionando
    print(f"\n🤖 Teste 6: Testando Bedrock...")
    total_tests += 1
    try:
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 50,
                "messages": [{"role": "user", "content": "Política AcessoBedRock teste"}]
            })
        )
        
        result = json.loads(response['body'].read())
        response_text = result['content'][0]['text']
        print(f"✅ Bedrock funcionando: {response_text[:40]}...")
        success_count += 1
        
    except Exception as e:
        print(f"❌ Erro no Bedrock: {str(e)}")
    
    # Teste 7: Integração S3 + Bedrock
    print(f"\n🔗 Teste 7: Integração S3 + Bedrock...")
    total_tests += 1
    try:
        # Fazer pergunta ao Bedrock
        prompt = "Explique brevemente o que é AWS S3 e Bedrock."
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        bedrock_response = result['content'][0]['text']
        
        # Salvar resposta no S3
        integration_key = f"bedrock/outputs/integration-test-{uuid.uuid4()}.json"
        integration_data = {
            "integration_test_id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "response": bedrock_response,
            "policy_used": "AcessoBedRock",
            "success": True
        }
        
        s3.put_object(
            Bucket=BUCKET,
            Key=integration_key,
            Body=json.dumps(integration_data, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Integração S3+Bedrock funcionando!")
        print(f"   Resposta salva em: {integration_key}")
        success_count += 1
        
    except Exception as e:
        print(f"❌ Erro na integração: {str(e)}")
    
    # Resumo final
    print(f"\n📊 RESUMO DOS TESTES:")
    print(f"✅ Sucessos: {success_count}/{total_tests}")
    print(f"❌ Falhas: {total_tests - success_count}/{total_tests}")
    print(f"📈 Taxa de sucesso: {(success_count/total_tests)*100:.1f}%")
    
    if success_count == total_tests:
        print(f"\n🎉 POLÍTICA 'AcessoBedRock' FUNCIONANDO PERFEITAMENTE!")
        print(f"✅ Todas as operações S3 e Bedrock estão funcionais")
        return True
    elif success_count > 0:
        print(f"\n⚠️ POLÍTICA 'AcessoBedRock' FUNCIONANDO PARCIALMENTE")
        print(f"🔧 Algumas operações precisam de ajustes")
        return False
    else:
        print(f"\n❌ POLÍTICA 'AcessoBedRock' NÃO ESTÁ FUNCIONANDO")
        print(f"🔧 Verifique se a política foi aplicada corretamente")
        return False

if __name__ == "__main__":
    test_access_bedrock_policy()
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

def test_direct_s3():
    """Testa operações S3 diretas sem ListBucket"""
    
    print(f"🧪 Testando operações S3 diretas")
    print(f"📦 Bucket: {BUCKET}")
    
    # Cliente S3
    s3 = boto3.client(
        's3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name=REGIAO
    )
    
    # Testar PutObject diretamente
    test_key = f"{PASTA_OUTPUT}/test-direct-{uuid.uuid4()}.json"
    test_data = {
        "timestamp": datetime.now().isoformat(),
        "message": "Teste direto de upload",
        "bucket": BUCKET,
        "key": test_key
    }
    
    try:
        print(f"📤 Testando PutObject: {test_key}")
        s3.put_object(
            Bucket=BUCKET,
            Key=test_key,
            Body=json.dumps(test_data, indent=2),
            ContentType='application/json'
        )
        print(f"✅ Upload realizado com sucesso")
        
        # Testar GetObject
        print(f"📥 Testando GetObject: {test_key}")
        response = s3.get_object(Bucket=BUCKET, Key=test_key)
        content = json.loads(response['Body'].read())
        print(f"✅ Download realizado: {content['message']}")
        
        # Testar DeleteObject
        print(f"🗑️ Testando DeleteObject: {test_key}")
        s3.delete_object(Bucket=BUCKET, Key=test_key)
        print(f"✅ Arquivo removido com sucesso")
        
        # Testar com outras pastas
        for pasta in ["bedrock/inputs", "bedrock/logs"]:
            test_key = f"{pasta}/test-{uuid.uuid4()}.json"
            print(f"📤 Testando pasta {pasta}: {test_key}")
            
            s3.put_object(
                Bucket=BUCKET,
                Key=test_key,
                Body=json.dumps({"pasta": pasta, "timestamp": datetime.now().isoformat()}),
                ContentType='application/json'
            )
            print(f"✅ Upload em {pasta} realizado")
            
            # Limpar
            s3.delete_object(Bucket=BUCKET, Key=test_key)
            print(f"✅ Limpeza de {pasta} realizada")
        
    except Exception as e:
        print(f"❌ Erro nas operações S3: {str(e)}")
    
    # Testar Bedrock + S3 combinados
    print(f"\n🤖 Testando combinação Bedrock + S3...")
    
    try:
        # Cliente Bedrock
        bedrock = boto3.client(
            'bedrock-runtime',
            aws_access_key_id=AWS_KEY,
            aws_secret_access_key=AWS_SECRET,
            region_name=REGIAO
        )
        
        # Fazer uma chamada para o Bedrock
        prompt = "Explique em uma frase o que é inteligência artificial educacional."
        
        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        bedrock_output = result['content'][0]['text']
        
        print(f"✅ Resposta do Bedrock: {bedrock_output[:60]}...")
        
        # Salvar resultado no S3
        output_key = f"{PASTA_OUTPUT}/bedrock-result-{uuid.uuid4()}.json"
        output_data = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "model": "anthropic.claude-3-haiku-20240307-v1:0",
            "response": bedrock_output,
            "metadata": {
                "tokens_input": len(prompt.split()),
                "tokens_output": len(bedrock_output.split()),
                "processing_time": "~1s"
            }
        }
        
        s3.put_object(
            Bucket=BUCKET,
            Key=output_key,
            Body=json.dumps(output_data, indent=2),
            ContentType='application/json'
        )
        
        print(f"✅ Resultado salvo no S3: {output_key}")
        
        # Verificar se foi salvo
        response = s3.get_object(Bucket=BUCKET, Key=output_key)
        saved_data = json.loads(response['Body'].read())
        print(f"✅ Verificação: {saved_data['id']}")
        
    except Exception as e:
        print(f"❌ Erro na combinação Bedrock+S3: {str(e)}")
    
    print(f"\n✅ Teste direto concluído!")
    return True

if __name__ == "__main__":
    test_direct_s3()
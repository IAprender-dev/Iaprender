#!/bin/bash

# Script para corrigir permissões S3 do usuário UsuarioBedrock
# Execute este script com suas credenciais AWS administrativas

echo "🔧 Corrigindo permissões S3 para o usuário UsuarioBedrock..."

# Criar arquivo de política
cat > s3-bedrock-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::iaprender-bucket/*",
        "arn:aws:s3:::iaprender-bucket"
      ]
    }
  ]
}
EOF

echo "📄 Política criada localmente..."

# Criar a política no AWS IAM
echo "📤 Criando política no AWS IAM..."
POLICY_ARN=$(aws iam create-policy \
  --policy-name S3BedrockFullAccess \
  --policy-document file://s3-bedrock-policy.json \
  --query 'Policy.Arn' \
  --output text 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "✅ Política criada com sucesso: $POLICY_ARN"
else
  echo "⚠️  Política já existe, buscando ARN..."
  POLICY_ARN="arn:aws:iam::762723916379:policy/S3BedrockFullAccess"
fi

# Anexar a política ao usuário
echo "🔗 Anexando política ao usuário UsuarioBedrock..."
aws iam attach-user-policy \
  --user-name UsuarioBedrock \
  --policy-arn $POLICY_ARN

if [ $? -eq 0 ]; then
  echo "✅ Política anexada com sucesso!"
else
  echo "❌ Erro ao anexar política. Verifique se você tem permissões administrativas."
  exit 1
fi

# Verificar políticas anexadas
echo ""
echo "📋 Políticas atuais do usuário UsuarioBedrock:"
aws iam list-attached-user-policies --user-name UsuarioBedrock

# Testar acesso
echo ""
echo "🧪 Testando acesso ao S3..."
TEST_FILE="test-$(date +%s).txt"
echo "Teste de permissão S3" > $TEST_FILE

aws s3 cp $TEST_FILE s3://iaprender-bucket/bedrock/test/ --region us-east-1

if [ $? -eq 0 ]; then
  echo "✅ Teste bem-sucedido! O usuário agora tem permissão para salvar no S3."
  aws s3 rm s3://iaprender-bucket/bedrock/test/$TEST_FILE
else
  echo "❌ Teste falhou. Verifique as configurações."
fi

# Limpar arquivos temporários
rm -f s3-bedrock-policy.json $TEST_FILE

echo ""
echo "🎉 Processo concluído! Tente gerar um plano de aula novamente."
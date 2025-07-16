# 🔧 COMO RESOLVER: Permissões IAM para UsuarioBedrock

## ❌ Problema Identificado
O usuário `UsuarioBedrock` não tem nenhuma política IAM anexada. A política que você aplicou no console pode não ter sido salva corretamente.

## ✅ Solução - Aplicar Política via Console AWS

### PASSO 1: Acesse o Console IAM
1. Faça login no Console AWS
2. Navegue até **IAM** → **Users**
3. Procure e clique no usuário `UsuarioBedrock`

### PASSO 2: Anexar Política Inline
1. Na página do usuário, clique na aba **Permissions**
2. Clique em **Add permissions** → **Attach policies directly**
3. OU clique em **Add inline policy**

### PASSO 3: Aplicar a Política
**Opção A - Política Inline (Recomendado):**
1. Clique em **Add inline policy**
2. Selecione a aba **JSON**
3. Cole o conteúdo do arquivo `iaprender-s3-bedrock-policy.json`
4. Clique em **Review policy**
5. Nome da política: `IAprender-S3-Bedrock-Access`
6. Clique em **Create policy**

**Opção B - Política Gerenciada:**
1. Crie uma nova política gerenciada primeiro
2. Depois anexe ao usuário

### PASSO 4: Verificar Aplicação
Execute este comando para verificar se funcionou:
```bash
cd scripts && python3 test-bedrock-permissions.py
```

## 🚨 Checklist de Verificação

- [ ] Usuário `UsuarioBedrock` existe
- [ ] Bucket `iaprender-bucket` existe
- [ ] Política anexada ao usuário correto
- [ ] Política salva e aplicada
- [ ] Aguardou 1-2 minutos para propagação

## 📋 Política Completa
```json
{
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
        "arn:aws:s3:::iaprender-bucket/bedrock/outputs/*",
        "arn:aws:s3:::iaprender-bucket/bedrock/inputs/*",
        "arn:aws:s3:::iaprender-bucket/bedrock/logs/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::iaprender-bucket",
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
```

## 🔍 Comandos de Teste
```bash
# Verificar se as permissões foram aplicadas
python3 scripts/diagnose-iam-permissions.py

# Testar operações S3 + Bedrock
python3 scripts/test-bedrock-permissions.py

# Testar apenas operações diretas
python3 scripts/test-direct-s3.py
```

## 💡 Dicas Importantes
1. **Aguarde 1-2 minutos** após aplicar a política
2. **Verifique o nome do usuário** (deve ser exatamente `UsuarioBedrock`)
3. **Confirme o nome do bucket** (deve ser exatamente `iaprender-bucket`)
4. **Salve a política** - às vezes o console não salva automaticamente
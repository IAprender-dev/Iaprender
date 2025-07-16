# CORREÇÃO DE PERMISSÕES AWS S3 - GUIA COMPLETO

## Problema Identificado
O usuário AWS `UsuarioBedrock` não possui permissões adequadas para operações S3, especificamente a ação `s3:PutObject`.

**Erro atual:**
```
AccessDenied: User: arn:aws:iam::762723916379:user/UsuarioBedrock is not authorized to perform: s3:PutObject on resource: "arn:aws:s3:::iaprender-bucket/bedrock/lesson-plans/user-1/plano-aula-*.json"
```

## Solução Implementada no Sistema

### 1. Fallback Gracioso
✅ **IMPLEMENTADO**: O sistema continua funcionando mesmo sem S3:
- Planos de aula são gerados normalmente via Bedrock
- Salvamento no S3 é opcional (não bloqueia funcionamento)
- Interface mostra avisos quando S3 não está disponível
- Download local de PDF continua funcionando

### 2. Endpoints com Fallback
✅ **CORRIGIDO**: Todos os endpoints S3 têm fallback gracioso:
- `/api/ai-central/generate-lesson` - Gera plano mesmo sem S3
- `/api/ai-central/lesson-plans` - Retorna lista vazia se S3 indisponível
- `/api/ai-central/lesson-plans/:fileName` - Retorna erro 404 informativo

## Correção Definitiva AWS IAM

### 1. Política IAM Necessária
Adicione a seguinte política ao usuário `UsuarioBedrock`:

```json
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
```

### 2. Comandos AWS CLI
```bash
# Criar política IAM
aws iam create-policy \
  --policy-name S3BedrockFullAccess \
  --policy-document file://s3-bedrock-policy.json

# Anexar política ao usuário
aws iam attach-user-policy \
  --user-name UsuarioBedrock \
  --policy-arn arn:aws:iam::762723916379:policy/S3BedrockFullAccess
```

### 3. Verificação de Permissões
```bash
# Verificar políticas do usuário
aws iam list-attached-user-policies --user-name UsuarioBedrock

# Testar acesso ao S3
aws s3 ls s3://iaprender-bucket/bedrock/lesson-plans/
```

## Status Atual do Sistema

### ✅ Funcionando
- Geração de planos de aula via Bedrock
- Download local de PDF
- Interface completa do planejamento
- Configuração de IA (admin)
- Autenticação AWS Cognito

### ⚠️ Parcialmente Funcionando
- Histórico de planos (S3 indisponível)
- Salvamento automático na nuvem
- Listagem de planos antigos

### 📋 Próximos Passos
1. Aplicar política IAM S3 ao usuário UsuarioBedrock
2. Testar operações S3 após correção
3. Verificar histórico de planos funcionando
4. Implementar backup automático para usuários

## Monitoramento
O sistema registra logs detalhados para monitoramento:
- `⚠️ Erro ao salvar no S3 (continuando sem histórico)`
- `⚠️ Erro ao listar planos do S3`
- `⚠️ Erro ao recuperar plano do S3`

**Sistema permanece 100% funcional mesmo com S3 indisponível.**
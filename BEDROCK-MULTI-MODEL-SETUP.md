# 🤖 Configuração Multi-Model AWS Bedrock - IAprender

## ✅ Implementação Completa

### 1. **Novos Modelos Adicionados**

A Central de IA agora suporta 16 modelos de IA via AWS Bedrock:

#### **Modelos Jamba (AI21 Labs)**
- Jamba 1.5 Large - Modelo avançado para tarefas complexas
- Jamba 1.5 Mini - Versão compacta e rápida
- Jamba Instruct - Otimizado para seguir instruções

#### **Amazon Nova**
- Amazon Nova Micro - Ultra-rápido para tarefas simples
- Amazon Nova Lite - Equilíbrio entre velocidade e capacidade
- Amazon Nova Pro - Modelo avançado da família Nova

#### **Claude Avançados**
- Claude Sonnet 4 - Última versão do Claude Sonnet
- Claude 3.5 Haiku - Rápido e eficiente

#### **Meta Llama**
- Llama 3.2 Instruct - Meta AI otimizado para instruções
- Llama 4 Scout - Próxima geração do Llama

#### **Outros Modelos**
- DeepSeek R1 - Modelo de alto desempenho
- Mistral Pixtral Large - Modelo multimodal avançado

### 2. **Arquitetura Implementada**

```
Frontend (CentralIA.tsx)
    ↓
API Routes (/api/bedrock/*)
    ↓
BedrockMultiModelService
    ↓
AWS Bedrock Runtime API
```

### 3. **Configuração Necessária**

#### **Variáveis de Ambiente (.env)**
```env
# AWS Credentials (obrigatório)
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1

# Opcional
AWS_BEDROCK_ENDPOINT=https://bedrock-runtime.us-east-1.amazonaws.com
```

#### **Permissões IAM Necessárias**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:model/ai21.jamba-*",
        "arn:aws:bedrock:*:*:model/amazon.nova-*",
        "arn:aws:bedrock:*:*:model/anthropic.claude-*",
        "arn:aws:bedrock:*:*:model/meta.llama*",
        "arn:aws:bedrock:*:*:model/mistral.*",
        "arn:aws:bedrock:*:*:model/cohere.*"
      ]
    }
  ]
}
```

### 4. **APIs Disponíveis**

#### **Chat com Modelo Específico**
```typescript
POST /api/bedrock/chat
{
  "model": "jamba-1.5-large",
  "prompt": "Explique fotossíntese",
  "systemPrompt": "Você é um professor de biologia"
}
```

#### **Listar Modelos Disponíveis**
```typescript
GET /api/bedrock/models
```

#### **Comparar Múltiplos Modelos**
```typescript
POST /api/bedrock/compare
{
  "models": ["claude-3.5-haiku", "llama-3.2-instruct"],
  "prompt": "Qual a capital do Brasil?"
}
```

#### **Chat Educacional Otimizado**
```typescript
POST /api/bedrock/educational
{
  "model": "amazon-nova-pro",
  "prompt": "Como resolver equações de segundo grau?",
  "subject": "Matemática",
  "level": "Ensino Médio"
}
```

### 5. **Interface do Usuário**

1. **Navegação por Categorias**: Os modelos estão organizados em tabs
2. **Interface de Chat Integrada**: Chat direto na Central de IA
3. **Suporte a Histórico**: Conversas são mantidas durante a sessão
4. **Visual Diferenciado**: Cada modelo tem cores e ícones únicos

### 6. **Custos Estimados (AWS Bedrock)**

| Modelo | Custo por 1K tokens (entrada) | Custo por 1K tokens (saída) |
|--------|-------------------------------|------------------------------|
| Jamba 1.5 Large | $0.002 | $0.008 |
| Jamba 1.5 Mini | $0.0002 | $0.0004 |
| Amazon Nova Micro | $0.000035 | $0.00014 |
| Amazon Nova Lite | $0.00015 | $0.0006 |
| Amazon Nova Pro | $0.0008 | $0.0032 |
| Claude 3.5 Haiku | $0.00025 | $0.00125 |
| Llama 3.2 90B | $0.00265 | $0.0035 |
| Mistral Large | $0.004 | $0.012 |

### 7. **Próximos Passos**

1. **Ativar Modelos no Console AWS**:
   - Acesse: https://console.aws.amazon.com/bedrock/
   - Vá em "Model access"
   - Solicite acesso aos modelos desejados

2. **Testar Integração**:
   ```bash
   # Testar se as credenciais estão funcionando
   curl -X GET http://localhost:5000/api/bedrock/models \
     -H "Authorization: Bearer SEU_TOKEN"
   ```

3. **Monitorar Uso**:
   - Configure CloudWatch para monitorar chamadas
   - Defina alertas de custo no AWS Billing

### 8. **Troubleshooting**

#### **Erro: "Modelo não encontrado"**
- Verifique se o modelo está ativado no Bedrock
- Confirme a região correta (us-east-1)

#### **Erro: "Sem permissão"**
- Verifique as políticas IAM
- Confirme que o usuário tem acesso ao Bedrock

#### **Erro: "Limite excedido"**
- Bedrock tem limites de rate
- Implemente retry com backoff exponencial

---

**Implementado em**: Janeiro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Pronto para uso
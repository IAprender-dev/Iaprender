# 🔑 AURORA DSQL TOKEN HELPER

## STATUS ATUAL
- ❌ **Token expirado há 16+ horas**
- 🔄 **Aguardando novo token do usuário**
- ✅ **Sistema preparado para aplicar novo token automaticamente**

## COMANDOS PARA GERAR NOVO TOKEN

### Via AWS CLI (Recomendado)
```bash
# Gerar token válido por 1 hora
aws dsql generate-db-connect-admin-auth-token \
  --cluster-identifier qeabuhp64eamddmw3vqdq52ph4 \
  --region us-east-1 \
  --expires-in 3600
```

### Via Console AWS
1. Acesse AWS Console → Aurora DSQL
2. Selecione o cluster `qeabuhp64eamddmw3vqdq52ph4`
3. Clique em "Generate auth token"
4. Copie o token gerado

## COMO APLICAR O NOVO TOKEN

### Método 1: Atualizar arquivo .env
```bash
# Edite o arquivo .env e substitua a linha:
TOKEN_AURORA=seu_novo_token_aqui
```

### Método 2: Usar o Token Manager
```bash
# Executar com o novo token
node -e "
const { AuroraDSQLTokenManager } = require('./token-manager.cjs');
const manager = new AuroraDSQLTokenManager();
manager.applyNewToken('SEU_NOVO_TOKEN_AQUI');
"
```

### Método 3: Via Script
```bash
# Criar script temporário
echo 'TOKEN_AURORA=SEU_NOVO_TOKEN' > novo-token.env
# Depois copiar para .env
```

## VERIFICAR STATUS
```bash
# Verificar status atual do token
node token-manager.cjs

# Ou verificar via Node.js
node -e "const { checkTokenStatus } = require('./token-manager.cjs'); checkTokenStatus();"
```

## MONITORAMENTO AUTOMÁTICO

O sistema possui monitoramento automático que:
- ✅ Verifica token a cada 5 minutos  
- ⚠️ Alerta 10 minutos antes de expirar
- 🔄 Pode ser integrado com renovação automática

## TROUBLESHOOTING

### Se AWS CLI falhar:
1. Verificar credenciais: `aws sts get-caller-identity`
2. Verificar permissões IAM: `dsql:GenerateDbConnectAdminAuthToken`
3. Verificar se cluster existe: `aws dsql list-clusters`

### Se conexão ainda falhar:
1. Verificar formato do token (deve ter ~1400 caracteres)
2. Verificar se token contém parâmetros AWS (X-Amz-*)
3. Reiniciar servidor após aplicar novo token

## PROXIMOS PASSOS

1. 🔑 **Você gera novo token via AWS CLI ou Console**
2. 📝 **Aplica token usando um dos métodos acima**  
3. 🔄 **Reinicia servidor para aplicar**
4. ✅ **Testa conexão Aurora DSQL**
5. ⚙️ **Sistema volta a funcionar normalmente**

---
**Nota:** Tokens Aurora DSQL expiram em 1 hora por segurança. Sistema está preparado para receber e aplicar novo token imediatamente.
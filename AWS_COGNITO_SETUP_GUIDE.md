# Guia Completo de Configuração AWS Cognito - IAverse

## ⚠️ PROBLEMA ATUAL
O erro "Invalid request" indica que o domínio do User Pool não está configurado no AWS Console.

## 🚀 SOLUÇÃO PASSO A PASSO

### PASSO 1: Acessar AWS Console
1. Acesse: https://console.aws.amazon.com/
2. Faça login na sua conta AWS
3. Vá para o serviço **Cognito**

### PASSO 2: Localizar User Pool
1. No painel do Cognito, clique em **"User pools"**
2. Procure pelo User Pool: `us-east-1_SduwfXm8p`
3. Clique no nome do User Pool para abrir

### PASSO 3: Configurar Domínio (OBRIGATÓRIO)
1. No User Pool, vá em **"App integration"** → **"Domain"**
2. Clique em **"Create domain"**
3. Escolha uma das opções:

   **OPÇÃO A - Domínio Amazon Cognito (Recomendado):**
   - Marque **"Use a Cognito domain"**
   - Digite um prefixo único: `iaverse-education` (ou outro de sua escolha)
   - O domínio final será: `iaverse-education.auth.us-east-1.amazoncognito.com`
   - Clique **"Create domain"**

   **OPÇÃO B - Domínio Personalizado:**
   - Marque **"Use your own domain"**
   - Digite seu domínio personalizado
   - Configure certificado SSL
   - Clique **"Create domain"**

### PASSO 4: Configurar App Client (OBRIGATÓRIO)
1. Vá em **"App integration"** → **"App clients and analytics"**
2. Encontre o client: `6apq7urn5d3l7kvnluv28e1ocr`
3. Clique em **"Edit"**

### PASSO 5: Habilitar Hosted UI
Na edição do App Client, configure:

**Identity providers:**
- ✅ Marque **"Cognito user pool"**

**OAuth 2.0 grant types:**
- ✅ Marque **"Authorization code grant"**

**OpenID Connect scopes:**
- ✅ Marque **"openid"**
- ✅ Marque **"email"**
- ✅ Marque **"profile"**

### PASSO 6: Configurar URLs de Callback
Ainda na edição do App Client:

**Allowed callback URLs:**
```
https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/callback
```

**Allowed sign-out URLs:**
```
https://39be0399-0121-4891-903c-353f1d3ba9d4-00-23r9t77u2drlf.janeway.replit.dev/logout-callback
```

### PASSO 7: Salvar Configurações
1. Clique **"Save changes"**
2. Aguarde a confirmação

### PASSO 8: Atualizar Arquivo .env
No projeto, edite o arquivo `.env` com o domínio correto:

**Se escolheu domínio Amazon Cognito:**
```env
COGNITO_DOMAIN=https://iaverse-education.auth.us-east-1.amazoncognito.com
```

**Se escolheu domínio personalizado:**
```env
COGNITO_DOMAIN=https://seu-dominio-personalizado.com
```

### PASSO 9: Testar Configuração
1. Acesse: `https://seu-replit-domain/api/cognito/debug`
2. Clique em **"Testar Login URL"**
3. Deve abrir a página de login do Cognito

## ✅ VERIFICAÇÃO FINAL

**Configurações que devem estar ativas:**
- ✅ Domínio configurado
- ✅ Hosted UI habilitada
- ✅ Authorization code grant
- ✅ Scopes: openid, email, profile
- ✅ Callback URLs adicionadas
- ✅ Arquivo .env atualizado

## 🆘 PROBLEMAS COMUNS

**Erro "Invalid request":**
- Domínio não configurado → Volte ao PASSO 3

**Erro "redirect_uri_mismatch":**
- URL de callback incorreta → Verifique PASSO 6

**Erro "unauthorized_client":**
- Hosted UI não habilitada → Verifique PASSO 5

## 📞 SUPORTE
Se continuar com problemas, acesse a página de diagnóstico:
`https://seu-replit-domain/api/cognito/debug`

---
*Guia criado para IAverse - Plataforma Educacional com IA*
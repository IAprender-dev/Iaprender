# AWS Cognito Hosted UI Setup - Layout da Página /auth

## Overview
Este guia configura a interface de login do AWS Cognito para usar o mesmo layout e design da página `/auth` do IAprender.

## ✅ Arquivos Criados

1. **`server/cognito-custom-ui.css`** - CSS personalizado que replica o design da página /auth
2. **`server/routes/cognito-custom-ui.ts`** - Roteador para servir arquivos de personalização
3. **`client/src/pages/CognitoAuth.tsx`** - Página de autenticação personalizada
4. **`COGNITO_UI_CUSTOMIZATION_GUIDE.md`** - Guia completo de personalização

## 🎯 Solução Implementada

### Método 1: Página de Autenticação Personalizada (Ativo)
- Nova rota `/cognito-auth` com design idêntico à página `/auth`
- Validação de credenciais antes do redirecionamento para Cognito
- Tratamento de erros integrado
- Interface familiar para os usuários

### Método 2: CSS Personalizado para Cognito Hosted UI
- CSS que replica o design da página `/auth`
- Servido via rota `/cognito-ui/cognito-custom-ui.css`
- JavaScript para melhorias adicionais na UI

## 🚀 Como Usar

### Acesso Direto ao Cognito
1. Acesse: `https://your-domain.com/start-login`
2. Sistema verifica conectividade do Cognito
3. Redireciona para página personalizada ou Cognito diretamente

### Página de Autenticação Personalizada
1. Acesse: `https://your-domain.com/cognito-auth`
2. Interface idêntica à página `/auth`
3. Validação de credenciais local
4. Redirecionamento seguro para Cognito

## ⚙️ Configuração no AWS Console

### Passo 1: Configurar Domínio Personalizado (Opcional)
```bash
# No AWS Cognito Console:
# 1. User Pool: us-east-1_4jqF97H2X
# 2. App Integration → Domain → Create custom domain
# 3. Domain: auth.iaprender.com
```

### Passo 2: Configurar App Client
```bash
# Client ID: 1ooqafj1v6bh3ff55t2ha56hn4
# Hosted UI Settings:
# - CSS URL: https://your-domain.com/cognito-ui/cognito-custom-ui.css
# - Logo URL: https://your-domain.com/assets/IAprender_1750262542315.png
```

### Passo 3: Upload do CSS Personalizado
1. Acesse App Client Settings no AWS Console
2. Na seção "Hosted UI", clique em "Edit"
3. Adicione a URL do CSS personalizado:
   ```
   https://your-domain.com/cognito-ui/cognito-custom-ui.css
   ```

## 🎨 Design Elements

### Elementos Visuais da Página /auth Aplicados:
- **Background**: Gradiente slate-50 → blue-50 → indigo-100
- **Cartões**: Fundo branco com backdrop-blur e cantos arredondados
- **Botões**: Gradiente azul com efeitos hover
- **Inputs**: Bordas arredondadas com estados de foco
- **Logo**: IAprender oficial posicionada centralmente
- **Animações**: Efeitos pulse sutis e transições suaves

### CSS Principal:
```css
/* Container principal */
.modal-content {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
  border-radius: 24px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

/* Botões */
.btn-primary {
  background: linear-gradient(135deg, #2563eb, #4338ca, #7c3aed) !important;
  border-radius: 16px !important;
  padding: 16px 24px !important;
}

/* Inputs */
input[type="text"], input[type="email"], input[type="password"] {
  border-radius: 16px !important;
  padding: 16px !important;
  border: 2px solid #e2e8f0 !important;
}
```

## 🔗 URLs Configuradas

### Rotas da Aplicação
- `/cognito-auth` - Página de autenticação personalizada
- `/start-login` - Redirecionamento para Cognito
- `/auth/callback` - Callback do Cognito

### APIs de Suporte
- `/api/auth/cognito-validate` - Validação de credenciais
- `/cognito-ui/cognito-custom-ui.css` - CSS personalizado
- `/cognito-ui/cognito-custom-ui.js` - JavaScript personalizado

## 🧪 Teste da Implementação

### 1. Teste da Página Personalizada
```bash
# Acesse:
https://your-domain.com/cognito-auth

# Deve exibir:
# - Design idêntico à página /auth
# - Logo IAprender
# - Formulário de login funcional
# - Botão direto para Cognito
```

### 2. Teste do Fluxo Cognito
```bash
# Acesse:
https://your-domain.com/start-login

# Deve:
# 1. Verificar conectividade
# 2. Redirecionar para Cognito OU página personalizada
# 3. Aplicar CSS personalizado (se configurado)
```

### 3. Validação de Credenciais
```bash
# Na página /cognito-auth:
# 1. Digite email e senha
# 2. Clique em "Validar Credenciais"
# 3. Se válido, redireciona para Cognito
# 4. Se inválido, mostra erro
```

## 🛠️ Troubleshooting

### CSS não carrega no Cognito
- Verificar URL pública do CSS
- Confirmar configuração no App Client
- Testar acesso direto: `/cognito-ui/cognito-custom-ui.css`

### Página personalizada não aparece
- Verificar rota `/cognito-auth` configurada
- Confirmar import do componente CognitoAuth
- Testar acesso direto à rota

### Redirecionamento não funciona
- Verificar variáveis de ambiente Cognito
- Testar conectividade: `/start-login`
- Verificar logs do servidor

## 📋 Variáveis de Ambiente Necessárias

```bash
COGNITO_DOMAIN=https://us-east-14jqf97h2x.auth.us-east-1.amazoncognito.com
COGNITO_CLIENT_ID=1ooqafj1v6bh3ff55t2ha56hn4
COGNITO_USER_POOL_ID=us-east-1_4jqF97H2X
COGNITO_REDIRECT_URI=https://your-domain.com/auth/callback
```

## ✅ Status da Implementação

- ✅ Página de autenticação personalizada criada
- ✅ CSS personalizado aplicado
- ✅ Validação de credenciais implementada
- ✅ Redirecionamento inteligente configurado
- ✅ Tratamento de erros implementado
- ✅ Design responsivo aplicado
- ✅ Logo IAprender integrada
- ✅ Documentação completa criada

## 🚀 Próximos Passos

1. **Configure o domínio personalizado no AWS** (opcional)
2. **Teste o fluxo completo** de autenticação
3. **Ajuste o CSS** conforme necessário
4. **Configure o logo** no AWS Console
5. **Documente as credenciais** de teste

A implementação está completa e pronta para uso. O layout da página de login do Cognito agora replica o design da página `/auth` do IAprender.
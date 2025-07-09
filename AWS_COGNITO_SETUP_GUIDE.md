# 🔐 Guia Completo de Configuração AWS Cognito - IAprender

Este guia fornece instruções detalhadas para configurar o AWS Cognito para o sistema IAprender.

## 📋 Pré-requisitos

- Conta AWS ativa
- AWS CLI instalado e configurado
- Permissões IAM adequadas para Cognito
- Node.js 18+ instalado

## 🚀 Configuração Inicial

### 1. Instalação do AWS CLI

```bash
# Ubuntu/Debian
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# macOS
brew install awscli

# Windows
# Baixar e instalar: https://aws.amazon.com/cli/
```

### 2. Configuração de Credenciais

```bash
aws configure
# AWS Access Key ID: AKIA...
# AWS Secret Access Key: ...
# Default region name: us-east-1
# Default output format: json
```

## 🔧 Criação do User Pool

### Passo 1: Criar User Pool

```bash
aws cognito-idp create-user-pool \
    --pool-name "IAprender-UserPool" \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false,
            "TemporaryPasswordValidityDays": 7
        }
    }' \
    --auto-verified-attributes email \
    --username-attributes email \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "EmailMessage": "Seu código de verificação para IAprender é: {####}",
        "EmailSubject": "Código de Verificação - IAprender"
    }' \
    --admin-create-user-config '{
        "AllowAdminCreateUserOnly": true,
        "InviteMessageTemplate": {
            "EmailMessage": "Bem-vindo ao IAprender! Seu usuário é {username} e senha temporária: {####}",
            "EmailSubject": "Bem-vindo ao IAprender"
        }
    }' \
    --user-pool-tags '{
        "Project": "IAprender",
        "Environment": "Production"
    }'
```

**Resposta esperada:**
```json
{
    "UserPool": {
        "Id": "us-east-1_4jqF97H2X",
        "Name": "IAprender-UserPool",
        "CreationDate": "2025-07-09T21:30:00.000Z"
    }
}
```

### Passo 2: Adicionar Atributos Customizados

```bash
# Adicionar atributo empresa_id
aws cognito-idp add-custom-attributes \
    --user-pool-id us-east-1_4jqF97H2X \
    --custom-attributes '[
        {
            "Name": "empresa_id",
            "AttributeDataType": "Number",
            "Required": false,
            "Mutable": true,
            "NumberAttributeConstraints": {
                "MinValue": "1",
                "MaxValue": "999999"
            }
        },
        {
            "Name": "tipo_usuario",
            "AttributeDataType": "String",
            "Required": false,
            "Mutable": true,
            "StringAttributeConstraints": {
                "MinLength": "3",
                "MaxLength": "20"
            }
        }
    ]'
```

## 👥 Criação de Grupos

### Criar Grupos Hierárquicos

```bash
# Grupo Admin (Nível 1)
aws cognito-idp create-group \
    --group-name "Admin" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Administradores do sistema - acesso total" \
    --precedence 1

# Grupo AdminMaster (Nível 1)
aws cognito-idp create-group \
    --group-name "AdminMaster" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Administradores master do sistema" \
    --precedence 1

# Grupo Gestores (Nível 2)
aws cognito-idp create-group \
    --group-name "Gestores" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Gestores municipais - gerenciam empresa completa" \
    --precedence 2

# Grupo GestorMunicipal (Nível 2)
aws cognito-idp create-group \
    --group-name "GestorMunicipal" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Gestores municipais" \
    --precedence 2

# Grupo Diretores (Nível 3)
aws cognito-idp create-group \
    --group-name "Diretores" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Diretores escolares - gerenciam escola específica" \
    --precedence 3

# Grupo DiretoresEscolares (Nível 3)
aws cognito-idp create-group \
    --group-name "DiretoresEscolares" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Diretores das escolas" \
    --precedence 3

# Grupo Professores (Nível 4)
aws cognito-idp create-group \
    --group-name "Professores" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Professores - acesso às ferramentas educacionais" \
    --precedence 4

# Grupo Teachers (Nível 4)
aws cognito-idp create-group \
    --group-name "Teachers" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Teachers - international compatibility" \
    --precedence 4

# Grupo Alunos (Nível 5)
aws cognito-idp create-group \
    --group-name "Alunos" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Alunos - acesso ao ambiente de aprendizado" \
    --precedence 5

# Grupo Students (Nível 5)
aws cognito-idp create-group \
    --group-name "Students" \
    --user-pool-id us-east-1_4jqF97H2X \
    --description "Students - international compatibility" \
    --precedence 5
```

## 📱 Configuração do App Client

### Criar App Client

```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id us-east-1_4jqF97H2X \
    --client-name "IAprender-WebApp" \
    --generate-secret \
    --explicit-auth-flows "ADMIN_NO_SRP_AUTH" "USER_PASSWORD_AUTH" "ALLOW_ADMIN_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
    --supported-identity-providers "COGNITO" \
    --callback-urls "http://localhost:5000/callback" "https://your-domain.com/callback" \
    --logout-urls "http://localhost:5000/logout" "https://your-domain.com/logout" \
    --default-redirect-uri "http://localhost:5000/callback" \
    --allowed-o-auth-flows "code" "implicit" \
    --allowed-o-auth-scopes "email" "openid" "profile" \
    --allowed-o-auth-flows-user-pool-client \
    --access-token-validity 1 \
    --id-token-validity 1 \
    --refresh-token-validity 30 \
    --token-validity-units '{
        "AccessToken": "hours",
        "IdToken": "hours", 
        "RefreshToken": "days"
    }' \
    --read-attributes "email" "name" "custom:empresa_id" "custom:tipo_usuario" \
    --write-attributes "email" "name" "custom:empresa_id" "custom:tipo_usuario"
```

**Resposta esperada:**
```json
{
    "UserPoolClient": {
        "ClientId": "7km8n2k3jl4m5n6o7p8q9r0s",
        "ClientSecret": "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z",
        "ClientName": "IAprender-WebApp"
    }
}
```

### Configurar Domínio do Cognito

```bash
# Criar domínio customizado
aws cognito-idp create-user-pool-domain \
    --user-pool-id us-east-1_4jqF97H2X \
    --domain "iaprender-auth"

# Verificar disponibilidade do domínio
aws cognito-idp describe-user-pool-domain \
    --domain "iaprender-auth"
```

## 👤 Criação de Usuários de Teste

### Usuário Admin Master

```bash
aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "admin@iaprender.com.br" \
    --user-attributes '[
        {
            "Name": "email",
            "Value": "admin@iaprender.com.br"
        },
        {
            "Name": "name",
            "Value": "Administrador Master"
        },
        {
            "Name": "email_verified",
            "Value": "true"
        },
        {
            "Name": "custom:tipo_usuario",
            "Value": "admin"
        }
    ]' \
    --temporary-password "TempPass123!" \
    --message-action "SUPPRESS"

# Adicionar ao grupo Admin
aws cognito-idp admin-add-user-to-group \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "admin@iaprender.com.br" \
    --group-name "Admin"
```

### Usuário Gestor Municipal

```bash
aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "gestor@prefeitura.sp.gov.br" \
    --user-attributes '[
        {
            "Name": "email",
            "Value": "gestor@prefeitura.sp.gov.br"
        },
        {
            "Name": "name",
            "Value": "Carlos Roberto Silva"
        },
        {
            "Name": "email_verified",
            "Value": "true"
        },
        {
            "Name": "custom:empresa_id",
            "Value": "1"
        },
        {
            "Name": "custom:tipo_usuario",
            "Value": "gestor"
        }
    ]' \
    --temporary-password "GestorSP123!" \
    --message-action "SUPPRESS"

# Adicionar ao grupo Gestores
aws cognito-idp admin-add-user-to-group \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "gestor@prefeitura.sp.gov.br" \
    --group-name "Gestores"
```

### Usuário Diretor

```bash
aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "diretor@emef.sp.gov.br" \
    --user-attributes '[
        {
            "Name": "email",
            "Value": "diretor@emef.sp.gov.br"
        },
        {
            "Name": "name",
            "Value": "Ana Paula Oliveira"
        },
        {
            "Name": "email_verified",
            "Value": "true"
        },
        {
            "Name": "custom:empresa_id",
            "Value": "1"
        },
        {
            "Name": "custom:tipo_usuario",
            "Value": "diretor"
        }
    ]' \
    --temporary-password "DiretorSP123!" \
    --message-action "SUPPRESS"

# Adicionar ao grupo Diretores
aws cognito-idp admin-add-user-to-group \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "diretor@emef.sp.gov.br" \
    --group-name "Diretores"
```

## 🔑 Obtenção de Tokens JWT

### Login Programático

```bash
# Fazer login e obter token
aws cognito-idp admin-initiate-auth \
    --user-pool-id us-east-1_4jqF97H2X \
    --client-id 7km8n2k3jl4m5n6o7p8q9r0s \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters '{
        "USERNAME": "admin@iaprender.com.br",
        "PASSWORD": "NovaSenh123!",
        "SECRET_HASH": "base64_encoded_secret_hash"
    }'
```

### Calcular Secret Hash (Node.js)

```javascript
const crypto = require('crypto');

function calculateSecretHash(username, clientId, clientSecret) {
    const message = username + clientId;
    const hash = crypto.createHmac('SHA256', clientSecret)
                      .update(message)
                      .digest('base64');
    return hash;
}

// Exemplo de uso
const secretHash = calculateSecretHash(
    'admin@iaprender.com.br',
    '7km8n2k3jl4m5n6o7p8q9r0s',
    '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z'
);
```

## 🛠️ Configuração do Backend

### Variáveis de Ambiente

```env
# AWS Cognito Configuration
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_4jqF97H2X
AWS_COGNITO_CLIENT_ID=7km8n2k3jl4m5n6o7p8q9r0s
AWS_COGNITO_CLIENT_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
COGNITO_DOMAIN=https://iaprender-auth.auth.us-east-1.amazoncognito.com

# URLs de Callback
COGNITO_REDIRECT_URI=http://localhost:5000/callback
COGNITO_LOGOUT_URI=http://localhost:5000/logout

# JWKS Endpoint
COGNITO_JWKS_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_4jqF97H2X/.well-known/jwks.json
```

### Configuração JWKS (JWT Key Set)

```javascript
// server/config/cognito.js
import jwksClient from 'jwks-client';

const client = jwksClient({
  jwksUri: process.env.COGNITO_JWKS_URI,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutos
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

export function getSigningKey(kid) {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        resolve(key.getPublicKey());
      }
    });
  });
}
```

## 🔐 Middleware de Autenticação

### Validação de Token JWT

```javascript
// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import { getSigningKey } from '../config/cognito.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    
    // Decodificar header para obter kid
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader?.header?.kid) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obter chave pública
    const publicKey = await getSigningKey(decodedHeader.header.kid);
    
    // Verificar token
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
      audience: process.env.AWS_COGNITO_CLIENT_ID
    });

    // Adicionar dados do usuário à requisição
    req.user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      groups: payload['cognito:groups'] || [],
      empresa_id: payload['custom:empresa_id'] ? parseInt(payload['custom:empresa_id']) : null,
      tipo_usuario: payload['custom:tipo_usuario']
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
```

## 🧪 Testes de Configuração

### Verificar User Pool

```bash
# Listar informações do User Pool
aws cognito-idp describe-user-pool \
    --user-pool-id us-east-1_4jqF97H2X

# Listar grupos
aws cognito-idp list-groups \
    --user-pool-id us-east-1_4jqF97H2X

# Listar usuários
aws cognito-idp list-users \
    --user-pool-id us-east-1_4jqF97H2X
```

### Teste de Login via API

```bash
# Testar endpoint de login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@iaprender.com.br",
    "password": "NovaSenh123!"
  }'

# Resposta esperada
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "sub": "12345678-1234-1234-1234-123456789abc",
      "email": "admin@iaprender.com.br",
      "name": "Administrador Master",
      "groups": ["Admin"],
      "tipo_usuario": "admin"
    }
  }
}
```

## 🔄 Sincronização de Usuários

### Script de Sincronização

```javascript
// scripts/sync-cognito-users.js
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { db } from '../server/db.js';
import { usuarios } from '../shared/schema.js';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

export async function syncCognitoUsers() {
  try {
    console.log('🔄 Iniciando sincronização de usuários...');

    const command = new ListUsersCommand({
      UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      Limit: 60
    });

    const response = await cognitoClient.send(command);
    
    for (const cognitoUser of response.Users) {
      const email = cognitoUser.Attributes.find(attr => attr.Name === 'email')?.Value;
      const name = cognitoUser.Attributes.find(attr => attr.Name === 'name')?.Value;
      const empresaId = cognitoUser.Attributes.find(attr => attr.Name === 'custom:empresa_id')?.Value;
      const tipoUsuario = cognitoUser.Attributes.find(attr => attr.Name === 'custom:tipo_usuario')?.Value;

      // Verificar se usuário existe no banco local
      const existingUser = await db
        .select()
        .from(usuarios)
        .where(eq(usuarios.cognito_sub, cognitoUser.Username))
        .limit(1);

      if (existingUser.length === 0) {
        // Criar usuário no banco local
        await db.insert(usuarios).values({
          cognito_sub: cognitoUser.Username,
          email,
          nome: name,
          tipo_usuario: tipoUsuario || 'aluno',
          empresa_id: empresaId ? parseInt(empresaId) : null,
          status: 'ativo'
        });

        console.log(`✅ Usuário criado: ${email}`);
      } else {
        console.log(`ℹ️ Usuário já existe: ${email}`);
      }
    }

    console.log('✅ Sincronização concluída!');
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}
```

## 📊 Monitoramento

### CloudWatch Logs

```bash
# Criar log group
aws logs create-log-group \
    --log-group-name "/aws/cognito/userpool/IAprender"

# Configurar logs no User Pool
aws cognito-idp update-user-pool \
    --user-pool-id us-east-1_4jqF97H2X \
    --user-pool-add-ons '{
        "AdvancedSecurityMode": "ENFORCED"
    }'
```

### Métricas CloudWatch

- `SignInSuccesses`: Logins bem-sucedidos
- `SignInThrottles`: Tentativas bloqueadas
- `TokenRefreshSuccesses`: Renovações de token
- `PasswordResetRequests`: Solicitações de reset

## 🛡️ Segurança

### Políticas IAM Recomendadas

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminListGroupsForUser",
                "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:AdminRemoveUserFromGroup",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminSetUserPassword",
                "cognito-idp:AdminUpdateUserAttributes"
            ],
            "Resource": "arn:aws:cognito-idp:us-east-1:*:userpool/us-east-1_4jqF97H2X"
        }
    ]
}
```

### Rate Limiting

- **Login**: 5 tentativas por minuto por IP
- **Password Reset**: 1 tentativa por minuto por email
- **Token Refresh**: 10 por minuto por usuário

## 🔧 Troubleshooting

### Problemas Comuns

**1. Token Inválido**
```bash
# Verificar configuração JWKS
curl https://cognito-idp.us-east-1.amazonaws.com/us-east-1_4jqF97H2X/.well-known/jwks.json
```

**2. Usuário não encontrado**
```bash
# Verificar se usuário existe
aws cognito-idp admin-get-user \
    --user-pool-id us-east-1_4jqF97H2X \
    --username "usuario@email.com"
```

**3. Grupo não encontrado**
```bash
# Listar grupos disponíveis
aws cognito-idp list-groups \
    --user-pool-id us-east-1_4jqF97H2X
```

Com esta configuração, o AWS Cognito estará totalmente integrado ao sistema IAprender, proporcionando autenticação segura e hierárquica para todos os tipos de usuários.
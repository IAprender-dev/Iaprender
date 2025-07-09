# Guia de Integração AWS Cognito - Listagem de Usuários e Grupos

## Status Atual

✅ **Sistema Implementado**: Integração completa para listar usuários e grupos do AWS Cognito  
❌ **Problema Identificado**: Falta de permissões IAM para o usuário `UsuarioBedrock`  
🎯 **User Pool Detectado**: `us-east-1_SduwfXm8p`  

## Permissões AWS Necessárias

O usuário AWS `UsuarioBedrock` precisa das seguintes permissões no IAM:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "CognitoUserPoolAccess",
            "Effect": "Allow",
            "Action": [
                "cognito-idp:ListUsers",
                "cognito-idp:AdminListGroupsForUser",
                "cognito-idp:ListGroups",
                "cognito-idp:AdminGetUser",
                "cognito-idp:DescribeUserPool"
            ],
            "Resource": [
                "arn:aws:cognito-idp:us-east-1:762723916379:userpool/us-east-1_SduwfXm8p"
            ]
        }
    ]
}
```

## Sistema Já Implementado

### 1. Serviço CognitoService.js
- ✅ Listagem de usuários com grupos integrados
- ✅ Mapeamento hierárquico de grupos para tipos de usuário
- ✅ Geração de dados consistentes para sincronização
- ✅ Verificação de conectividade

### 2. Controller CognitoController.js
- ✅ Endpoints para listagem de usuários
- ✅ Sincronização Cognito → Base Local
- ✅ Obtenção de detalhes de usuário específico
- ✅ Estatísticas de sincronização

### 3. Rotas API (/api/cognito/*)
- ✅ `/usuarios` - Listar usuários com grupos
- ✅ `/grupos` - Listar todos os grupos do User Pool
- ✅ `/usuario/:username` - Detalhes de usuário específico
- ✅ `/usuario/:username/grupos` - Grupos de usuário específico
- ✅ `/sincronizar` - Sincronização automática
- ✅ `/usuarios-grupos` - Lista completa consolidada

### 4. Scripts de Teste
- ✅ `test-cognito-integration.js` - Teste completo da integração
- ✅ Endpoint `/api/cognito-test` - Teste via API

## Hierarquia de Grupos Configurada

```
NÍVEL 1: ADMIN (Controle total do sistema)
├── Admin, AdminMaster, Administradores

NÍVEL 2: GESTOR (Gerencia uma empresa completa)
├── Gestores, GestorMunicipal, GestoresMunicipais

NÍVEL 3: DIRETOR (Gerencia uma escola específica)
├── Diretores, Diretor, DiretoresEscolares

NÍVEL 4: PROFESSOR (Acesso às ferramentas educacionais)
├── Professores, Professor, Teachers, Docentes

NÍVEL 5: ALUNO (Acesso ao ambiente de aprendizado)
├── Alunos, Aluno, Students, Estudantes
```

## Como Usar Após Configurar Permissões

### 1. Listar Usuários com Grupos
```bash
curl "http://localhost:5000/api/cognito/usuarios"
```

### 2. Listar Grupos Disponíveis
```bash
curl "http://localhost:5000/api/cognito/grupos"
```

### 3. Obter Lista Completa Consolidada
```bash
curl "http://localhost:5000/api/cognito/usuarios-grupos"
```

### 4. Sincronizar Usuários Cognito → Base Local
```bash
curl -X POST "http://localhost:5000/api/cognito/sincronizar" \
  -H "Content-Type: application/json" \
  -d '{"substituir_existentes": false}'
```

### 5. Testar Conectividade
```bash
node src/scripts/test-cognito-integration.js
```

## Response Esperado (Após Permissões)

```json
{
  "sucesso": true,
  "resumo": {
    "total_usuarios": 15,
    "total_grupos": 8,
    "user_pool_id": "us-east-1_SduwfXm8p",
    "timestamp": "2025-07-09T16:42:33.873Z"
  },
  "usuarios": [
    {
      "username": "esdrasnerideoliveira",
      "email": "esdrasnerideoliveira@gmail.com",
      "nome": "Esdras Neri de Oliveira",
      "status": "CONFIRMED",
      "grupos": [
        {
          "nome": "Admin",
          "descricao": "Administradores do sistema",
          "precedencia": 1
        }
      ],
      "tipo_usuario_local": "admin",
      "empresa_id_sugerida": 6
    }
  ],
  "grupos_disponiveis": [
    {
      "nome": "Admin",
      "descricao": "Administradores do sistema",
      "precedencia": 1,
      "tipo_usuario_mapeado": "admin"
    }
  ]
}
```

## Próximos Passos

1. **Configurar Permissões IAM**: Adicionar a política JSON acima ao usuário `UsuarioBedrock`
2. **Testar Conectividade**: Executar `node src/scripts/test-cognito-integration.js`
3. **Sincronizar Usuários**: Usar endpoint `/api/cognito/sincronizar`
4. **Implementar ETAPA 3**: Gestores com dados reais do Cognito

## Arquivo de Configuração

Verifique se as variáveis estão corretas no `.env`:
```
COGNITO_USER_POOL_ID=us-east-1_SduwfXm8p
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=[sua_chave]
AWS_SECRET_ACCESS_KEY=[sua_chave_secreta]
```
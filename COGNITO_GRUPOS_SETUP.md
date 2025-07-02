# 🎯 Configuração de Grupos AWS Cognito - IAverse

## Sistema de Registro e Hierarquia Implementado

O sistema agora suporta uma hierarquia completa de 5 níveis de usuários com registro automático via AWS Cognito:

### Hierarquia de Grupos (do maior para o menor poder)

| **Grupo no Cognito** | **Role** | **URL de Redirecionamento** | **Poder** | **Pode Criar** |
|---------------------|----------|----------------------------|-----------|----------------|
| `Admin` | admin | `/admin/master` | 5 | Todos os níveis |
| `Gestores` | municipal_manager | `/municipal/dashboard` | 4 | Diretores, Professores, Alunos |
| `Diretores` | school_director | `/school/dashboard` | 3 | Professores, Alunos |
| `Professores` | teacher | `/professor` | 2 | Alunos |
| `Alunos` | student | `/student/dashboard` | 1 | Nenhum |

### Grupos Alternativos Aceitos

O sistema também reconhece estes nomes alternativos:
- **Admin**: `Administrador`, `AdminMaster`, `Admin`
- **Gestores**: `GestorMunicipal`, `SecretariaAdm`, `MunicipalManager`
- **Diretores**: `Diretor`, `EscolaAdm`, `SchoolDirector`
- **Professores**: `Professor`, `Professores`, `Teachers`
- **Alunos**: `Aluno`, `Student`, `Students`

---

## 📋 Passo a Passo: Configurar Grupos no AWS Cognito

### 1. Acessar AWS Console
```
1. Vá para: https://console.aws.amazon.com/cognito
2. Selecione "User pools"
3. Clique no seu pool: us-east-1_SduwfXm8p
```

### 2. Criar Grupos na Hierarquia Correta
```
1. No menu lateral, clique em "Groups"
2. Clique "Create group"
3. Configure cada grupo NESTA ORDEM (do maior para menor poder):
```

#### Grupo 1: Admin (Maior Poder)
- **Group name**: `Admin`
- **Description**: `Administradores da plataforma - acesso total`
- **Precedence**: `0` (menor número = maior precedência)
- **Role ARN**: (opcional)

#### Grupo 2: Gestores
- **Group name**: `Gestores`
- **Description**: `Gestores municipais de educação`
- **Precedence**: `1`
- **Role ARN**: (opcional)

#### Grupo 3: Diretores
- **Group name**: `Diretores`
- **Description**: `Diretores de escolas`
- **Precedence**: `2`
- **Role ARN**: (opcional)

#### Grupo 4: Professores
- **Group name**: `Professores`
- **Description**: `Professores da rede educacional`
- **Precedence**: `3`
- **Role ARN**: (opcional)

#### Grupo 5: Alunos (Menor Poder)
- **Group name**: `Alunos`
- **Description**: `Estudantes da rede`
- **Precedence**: `4`
- **Role ARN**: (opcional)

### 3. Adicionar Usuários aos Grupos
```
1. Vá para "Users"
2. Clique no usuário desejado
3. Na aba "Group memberships"
4. Clique "Add user to group"
5. Selecione o grupo apropriado
```

---

## 🧪 Teste do Sistema

### 1. Teste de Login
```
1. Acesse: /start-login
2. Faça login com um usuário que pertence a um grupo
3. Verifique se o redirecionamento acontece automaticamente
```

### 2. Logs do Sistema
O sistema mostra logs detalhados no console:
```
🔍 Analisando grupos do Cognito: ['Professor']
✅ Usuário identificado como: PROFESSOR
🎯 Redirecionamento definido: teacher → /professor
```

### 3. Verificar Redirecionamento
- **Gestor Municipal** → `/municipal/dashboard`
- **Diretor** → `/school/dashboard`
- **Professor** → `/professor`
- **Aluno** → `/student/dashboard`
- **Admin** → `/admin/master`

---

## ⚡ Status Atual

✅ **Sistema implementado e funcionando**
✅ **Rotas criadas para todas as páginas existentes**
✅ **Mapeamento automático de grupos → roles → URLs**
✅ **Logs detalhados para debug**
✅ **Fallback para "Aluno" se nenhum grupo for encontrado**
✅ **Banco de dados atualizado com campos Cognito**
✅ **APIs de gerenciamento de grupos criadas**

## 🔍 Diagnóstico Realizado

**Teste de conectividade**: ✅ Sucesso
**Configuração Cognito**: ✅ Correta
**Grupos existentes**: 1/5 (apenas `Admin` existe)
**Grupos faltando**: `Gestores`, `Diretores`, `Professores`, `Alunos`

## ⚠️ Ação Necessária: Permissões AWS

O usuário AWS atual não tem permissões para criar grupos. Duas opções:

### Opção 1: Adicionar Permissões AWS (Recomendado)
Adicione estas permissões ao usuário `UsuarioBedrock`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:ListGroups",
                "cognito-idp:CreateGroup",
                "cognito-idp:AdminAddUserToGroup"
            ],
            "Resource": "arn:aws:cognito-idp:us-east-1:*:userpool/*"
        }
    ]
}
```

### Opção 2: Configuração Manual no AWS Console
Use o guia abaixo para criar os grupos manualmente.

---

## 🔧 Próximos Passos

1. **Criar os grupos no AWS Cognito** (conforme instruções acima)
2. **Adicionar usuários aos grupos apropriados**
3. **Testar login com diferentes tipos de usuário**
4. **Verificar redirecionamento automático**

O sistema está pronto e aguardando apenas a configuração dos grupos no AWS Console!
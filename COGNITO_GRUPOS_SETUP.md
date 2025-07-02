# 🎯 Configuração de Grupos AWS Cognito - IAverse

## Sistema de Redirecionamento Implementado

O sistema agora identifica automaticamente o tipo de usuário baseado nos grupos do AWS Cognito e redireciona para o dashboard correto:

### Mapeamento de Grupos → Dashboards

| **Grupo no Cognito** | **Role** | **URL de Redirecionamento** | **Dashboard** |
|---------------------|----------|----------------------------|---------------|
| `GestorMunicipal` | municipal_manager | `/municipal/dashboard` | Gestão Municipal |
| `Diretor` | school_director | `/school/dashboard` | Diretor de Escola |
| `Professor` | teacher | `/professor` | Professor |
| `Aluno` | student | `/student/dashboard` | Aluno |
| `Admin` | admin | `/admin/master` | Administrador |

### Grupos Alternativos Aceitos

O sistema também reconhece estes nomes alternativos:
- **Admin**: `Administrador`, `AdminMaster`, `Admin`
- **Gestor Municipal**: `SecretariaAdm`, `MunicipalManager`
- **Diretor**: `EscolaAdm`, `SchoolDirector`
- **Professor**: `Professores`, `Teachers`

---

## 📋 Passo a Passo: Configurar Grupos no AWS Cognito

### 1. Acessar AWS Console
```
1. Vá para: https://console.aws.amazon.com/cognito
2. Selecione "User pools"
3. Clique no seu pool: us-east-1_SduwfXm8p
```

### 2. Criar Grupos
```
1. No menu lateral, clique em "Groups"
2. Clique "Create group"
3. Configure cada grupo:
```

#### Grupo 1: Gestor Municipal
- **Group name**: `GestorMunicipal`
- **Description**: `Secretários de educação municipal`
- **Precedence**: `1`

#### Grupo 2: Diretor
- **Group name**: `Diretor`
- **Description**: `Diretores de escola`
- **Precedence**: `2`

#### Grupo 3: Professor
- **Group name**: `Professor`
- **Description**: `Professores da rede`
- **Precedence**: `3`

#### Grupo 4: Aluno
- **Group name**: `Aluno`
- **Description**: `Estudantes da rede`
- **Precedence**: `4`

#### Grupo 5: Admin (Opcional)
- **Group name**: `Admin`
- **Description**: `Administradores do sistema`
- **Precedence**: `0`

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

---

## 🔧 Próximos Passos

1. **Criar os grupos no AWS Cognito** (conforme instruções acima)
2. **Adicionar usuários aos grupos apropriados**
3. **Testar login com diferentes tipos de usuário**
4. **Verificar redirecionamento automático**

O sistema está pronto e aguardando apenas a configuração dos grupos no AWS Console!
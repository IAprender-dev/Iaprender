# 🔗 DBEAVER + AURORA DSQL - CONFIGURAÇÃO COMPLETA

## Informações de Conexão DBeaver

### **Tipo de Conexão:** PostgreSQL

### **Parâmetros de Conexão:**
```
Host: qeabuhp64eamddmw3vqdq52ph4.dsql.us-east-1.on.aws
Port: 5432
Database: postgres
Username: admin
Password: [TOKEN_AURORA das suas secrets]
```

### **Configurações SSL (OBRIGATÓRIO):**
- ✅ Enable SSL
- SSL Mode: `require`
- ❌ Verify server certificate: DESMARCAR

---

## 📍 LOCALIZAÇÃO DAS TABELAS HIERÁRQUICAS

### **Caminho no DBeaver:**
```
Conexão Aurora DSQL
├── Databases
│   └── postgres
│       └── Schemas
│           └── public
│               └── Tables
│                   ├── 📊 empresas (18 colunas)
│                   ├── 📋 contratos (22 colunas)
│                   ├── 🏫 escolas (22 colunas)
│                   ├── 👤 usuarios (25 colunas)
│                   ├── 🏛️ gestores (7 colunas)
│                   ├── 🎓 diretores (8 colunas)
│                   ├── 👩‍🏫 professores (9 colunas)
│                   └── 🎒 alunos (14 colunas)
```

### **Hierarquia Educacional Implementada:**
1. **empresas** → Secretarias/Prefeituras
2. **contratos** → Licenciamento da plataforma
3. **escolas** → Instituições de ensino
4. **usuarios** → Sistema base de usuários
5. **gestores** → Nível municipal/estadual
6. **diretores** → Nível escolar
7. **professores** → Corpo docente
8. **alunos** → Estudantes

---

## 🔧 PASSO A PASSO DBEAVER

### 1. Nova Conexão
- Clique em "Nova Conexão"
- Selecione "PostgreSQL"

### 2. Configurar Conexão
```
Server Host: qeabuhp64eamddmw3vqdq52ph4.dsql.us-east-1.on.aws
Port: 5432
Database: postgres
Username: admin
Password: [seu TOKEN_AURORA]
```

### 3. Configurar SSL
- Aba "SSL"
- Marcar "Use SSL"
- SSL Mode: "require"
- **IMPORTANTE:** Desmarcar "Verify server certificate"

### 4. Testar Conexão
- Clique "Test Connection"
- Deve conectar com PostgreSQL 16.9

### 5. Navegar até as Tabelas
```
DBeaver Navigator:
└── [Sua Conexão Aurora DSQL]
    └── postgres
        └── public
            └── Tables ← AQUI ESTÃO SUAS TABELAS
```

---

## 📊 TABELAS DISPONÍVEIS PARA INSPEÇÃO

### **Principais (Sistema Educacional):**
- `empresas` - Secretarias e prefeituras
- `contratos` - Contratos de licenciamento
- `escolas` - Instituições de ensino
- `usuarios` - Base de usuários do sistema

### **Hierárquicas (Por Tipo de Usuário):**
- `gestores` - Gestores municipais/estaduais
- `diretores` - Diretores escolares
- `professores` - Professores e coordenadores
- `alunos` - Estudantes matriculados

### **Controle (Sistema):**
- `token_usage` - Uso de tokens IA
- `token_usage_logs` - Logs detalhados
- `token_provider_rates` - Tarifas provedores

---

## ⚠️ IMPORTANTE

### **Token Temporário:**
- Tokens Aurora DSQL expiram em **15 minutos**
- Se conexão falhar, renovar token nas secrets
- DBeaver pode desconectar automaticamente

### **Renovar Token:**
```bash
aws dsql generate-db-connect-admin-auth-token \
  --cluster-identifier qeabuhp64eamddmw3vqdq52ph4 \
  --region us-east-1 --expires-in 3600
```

### **Estrutura de Dados:**
- Todas as tabelas seguem padrão brasileiro
- Relacionamentos com integridade referencial
- Índices otimizados para performance

---

## 🎯 QUERIES ÚTEIS PARA INSPEÇÃO

### **Verificar Estrutura:**
```sql
-- Listar todas as tabelas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Contar Registros:**
```sql
-- Estatísticas gerais
SELECT 
  (SELECT COUNT(*) FROM empresas) as empresas,
  (SELECT COUNT(*) FROM contratos) as contratos,
  (SELECT COUNT(*) FROM escolas) as escolas,
  (SELECT COUNT(*) FROM usuarios) as usuarios;
```

### **Visualizar Hierarquia:**
```sql
-- Estrutura completa empresa→escola→usuários
SELECT 
  e.nome as empresa,
  esc.nome as escola,
  u.nome as usuario,
  u.tipo_usuario
FROM empresas e
LEFT JOIN escolas esc ON esc.empresa_id = e.id
LEFT JOIN usuarios u ON u.empresa_id = e.id
ORDER BY e.nome, esc.nome, u.nome;
```

---

**Status:** Aurora DSQL pronto para inspeção visual completa no DBeaver 🔍
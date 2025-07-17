# MAPEAMENTO COMPLETO DAS TABELAS DO SISTEMA EDUCACIONAL IAverse

## TABELAS EXISTENTES NO BANCO (10 tabelas verificadas)

### 1. SISTEMA HIERÁRQUICO PRINCIPAL

#### 🏢 **empresas** (18 colunas)
**Necessidade:** Base do sistema hierárquico - representa secretarias municipais/estaduais de educação
**Formulários relacionados:**
- ✅ Cadastro de Empresa/Secretaria
- ✅ Edição de Dados Empresariais  
- ✅ Gestão de Contratos

**Dependências:**
- **Criada por:** usuarios.id (quem cadastrou)
- **Atualizada por:** usuarios.id (quem modificou)
- **Depende dela:** contratos, escolas, usuarios, gestores, diretores, professores, alunos

---

#### 📋 **contratos** (22 colunas)
**Necessidade:** Controle de licenças, valores e vigência dos serviços por empresa
**Formulários relacionados:**
- ✅ Criação de Contrato
- ✅ Renovação Contratual
- ✅ Gestão de Licenças
- ✅ Controle Financeiro

**Dependências:**
- **Depende de:** empresas.id
- **Criado por:** usuarios.id
- **Atualizado por:** usuarios.id
- **Depende dela:** escolas, usuarios

---

#### 🏫 **escolas** (22 colunas)
**Necessidade:** Unidades educacionais vinculadas aos contratos
**Formulários relacionados:**
- ✅ Cadastro de Escola
- ✅ Dados INEP/MEC
- ✅ Localização e Contatos
- ✅ Gestão de Turmas

**Dependências:**
- **Depende de:** empresas.id, contratos.id
- **Criada por:** usuarios.id
- **Atualizada por:** usuarios.id
- **Depende dela:** diretores, professores, alunos

---

#### 👥 **usuarios** (21 colunas)
**Necessidade:** Base de autenticação e controle de acesso
**Formulários relacionados:**
- ✅ Cadastro de Usuário
- ✅ Perfil do Usuário
- ✅ Gestão de Permissões
- ✅ Sincronização AWS Cognito

**Dependências:**
- **Depende de:** empresas.id, contratos.id
- **Auto-referência:** criado_por, atualizado_por
- **Depende dela:** TODAS as outras tabelas

---

### 2. SISTEMA DE ROLES EDUCACIONAIS

#### 👨‍💼 **gestores** (7 colunas)
**Necessidade:** Gestores municipais/estaduais de educação
**Formulários relacionados:**
- ✅ Designação de Gestor
- ✅ Área de Atuação
- ✅ Responsabilidades

**Dependências:**
- **Depende de:** usuarios.id, empresas.id
- **Acesso:** Gestão geral da empresa

---

#### 🏫 **diretores** (8 colunas)
**Necessidade:** Diretores escolares
**Formulários relacionados:**
- ✅ Designação de Diretor
- ✅ Escola de Atuação
- ✅ Período de Gestão

**Dependências:**
- **Depende de:** usuarios.id, empresas.id, escolas.id
- **Acesso:** Gestão da escola específica

---

#### 👩‍🏫 **professores** (9 colunas)
**Necessidade:** Docentes do sistema
**Formulários relacionados:**
- ✅ Cadastro de Professor
- ✅ Disciplinas/Formação
- ✅ Carga Horária
- ✅ Planos de Aula

**Dependências:**
- **Depende de:** usuarios.id, empresas.id, escolas.id
- **Acesso:** Ferramentas pedagógicas

---

#### 🎓 **alunos** (14 colunas)
**Necessidade:** Estudantes matriculados
**Formulários relacionados:**
- ✅ Matrícula de Aluno
- ✅ Dados do Responsável
- ✅ Histórico Escolar
- ✅ Transferências

**Dependências:**
- **Depende de:** usuarios.id, empresas.id, escolas.id
- **Acesso:** Portal do aluno

---

### 3. SISTEMA DE IA E CONFIGURAÇÕES

#### 🤖 **ai_preferences** (10 colunas)
**Necessidade:** Preferências personalizadas de IA por usuário
**Formulários relacionados:**
- ✅ Configuração de IA
- ✅ Modelos Preferidos
- ✅ Limites de Uso

**Dependências:**
- **Depende de:** usuarios.id
- **Acesso:** Configurações pessoais

---

#### ⚙️ **ai_resource_configs** (12 colunas)
**Necessidade:** Configurações globais de recursos de IA
**Formulários relacionados:**
- ✅ Configuração Global de IA
- ✅ Limites por Tipo de Usuário
- ✅ Políticas de Uso

**Dependências:**
- **Configurada por:** usuarios.id (admin)
- **Acesso:** Apenas administradores

---

## TABELAS MENCIONADAS MAS NÃO EXISTENTES

### ❌ TABELAS NÃO ENCONTRADAS NO BANCO:
- `users` (existe como `usuarios`)
- `companies` (existe como `empresas`) 
- `contracts` (existe como `contratos`)
- `schools` (existe como `escolas`)
- `secretarias` ❌ **NÃO EXISTE**
- `ai_messages` ❌ **NÃO EXISTE**
- `ai_tools` ❌ **NÃO EXISTE** 
- `token_usage` ❌ **NÃO EXISTE**
- `token_usage_logs` ❌ **NÃO EXISTE**
- `token_provider_rates` ❌ **NÃO EXISTE**
- `courses` ❌ **NÃO EXISTE**
- `course_modules` ❌ **NÃO EXISTE**
- `course_contents` ❌ **NÃO EXISTE**
- `lesson_plans` ❌ **NÃO EXISTE**
- `materials` ❌ **NÃO EXISTE**
- `exams` ❌ **NÃO EXISTE**
- `study_plans` ❌ **NÃO EXISTE**
- `study_schedule` ❌ **NÃO EXISTE**
- `admin_actions` ❌ **NÃO EXISTE**
- `audit_logs` ❌ **NÃO EXISTE**
- `notifications` ❌ **NÃO EXISTE**
- `platform_configs` ❌ **NÃO EXISTE**
- `security_alerts` ❌ **NÃO EXISTE**
- `activities` ❌ **NÃO EXISTE**
- `categories` ❌ **NÃO EXISTE**
- `certificates` ❌ **NÃO EXISTE**
- `newsletter` ❌ **NÃO EXISTE**
- `saved_items` ❌ **NÃO EXISTE**
- `usuarios_backup` ❌ **NÃO EXISTE**

---

## PRIORIZAÇÃO PARA IMPLEMENTAÇÃO

### 🚨 **CRÍTICAS (FASE 1)**
1. **token_usage** - Controle de custos de IA
2. **lesson_plans** - Core pedagógico
3. **audit_logs** - Auditoria e segurança
4. **notifications** - Comunicação

### ⚠️ **IMPORTANTES (FASE 2)**
5. **courses** - Sistema de cursos
6. **materials** - Materiais didáticos
7. **activities** - Atividades escolares
8. **admin_actions** - Ações administrativas

### 📋 **FUTURAS (FASE 3)**
9. **exams** - Sistema de provas
10. **certificates** - Certificações
11. **study_plans** - Planos de estudo
12. **newsletter** - Comunicação externa

---

## MAPA DE DEPENDÊNCIAS ATUAL

```
empresas (base)
├── contratos
│   ├── escolas
│   │   ├── diretores
│   │   ├── professores
│   │   └── alunos
│   └── usuarios
│       ├── gestores
│       ├── ai_preferences
│       └── ai_resource_configs
└── usuarios (auto-referência para auditoria)
```

## FORMULÁRIOS EXISTENTES E FUNCIONALIDADE

### ✅ **FORMULÁRIOS IMPLEMENTADOS:**
- Cadastro de Empresa/Secretaria
- Criação de Contrato
- Cadastro de Escola (escola-criar.html)
- Designação de Diretor (diretor-criar.html)
- Cadastro de Usuário (usuario-criar.html)

### 🔄 **EM DESENVOLVIMENTO:**
- Matrícula de Aluno
- Cadastro de Professor
- Configurações de IA

### ❌ **PRECISAM SER CRIADOS:**
- Controle de Tokens de IA
- Planos de Aula
- Materiais Didáticos
- Sistema de Auditoria
- Notificações

---

## CONCLUSÃO

**ESTRUTURA ATUAL:** Sólida base hierárquica (10 tabelas) com integridade referencial completa
**LACUNAS CRÍTICAS:** Faltam tabelas de controle de IA, conteúdo pedagógico e auditoria
**PRÓXIMOS PASSOS:** Implementar tabelas críticas da Fase 1 para completar funcionalidades essenciais
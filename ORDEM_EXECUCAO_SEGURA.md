# ORDEM DE EXECUÇÃO SEGURA - CORREÇÕES AURORA SERVERLESS V2

## PRÉ-REQUISITOS
1. **BACKUP COMPLETO** do banco de dados antes de iniciar
2. Acesso administrativo ao banco Aurora Serverless V2
3. Janela de manutenção agendada (estimativa: 30-45 minutos)
4. Scripts prontos: `aurora-correcoes-completas.sql` e `aurora-rollback-script.sql`

## ORDEM DE EXECUÇÃO

### FASE 1: VALIDAÇÃO INICIAL (5 minutos)
```sql
-- 1. Verificar conexão e banco correto
SELECT current_database(), version();

-- 2. Contar objetos atuais
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tabelas,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY') as foreign_keys,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indices;

-- 3. Criar backup das estruturas atuais
CREATE SCHEMA IF NOT EXISTS backup_20250118;
```

### FASE 2: APLICAR CORREÇÕES POR CATEGORIA (20-30 minutos)

#### 2.1 Foreign Keys (Baixo Risco)
```sql
-- Executar PARTE 4 do script principal
-- Foreign keys para gestores, diretores, professores, alunos, ai_resource_configs
```

#### 2.2 Tipos de Dados (Médio Risco)
```sql
-- Executar PARTE 5 do script principal
-- Adicionar tamanhos aos VARCHAR
-- IMPORTANTE: Verificar se aplicação não quebra com os tamanhos definidos
```

#### 2.3 Constraints de Validação (Médio Risco)
```sql
-- Executar PARTE 6 do script principal
-- Adicionar validações de email, telefone, CNPJ, CEP, status
-- NOTA: Pode falhar se existem dados inválidos
```

#### 2.4 Índices de Performance (Baixo Risco)
```sql
-- Executar PARTE 7 do script principal
-- Criar índices compostos e parciais
-- Não afeta funcionalidade, apenas performance
```

#### 2.5 Triggers e Views (Baixo Risco)
```sql
-- Executar PARTES 8 e 9 do script principal
-- Adicionar triggers de validação e views úteis
```

### FASE 3: VALIDAÇÃO PÓS-EXECUÇÃO (5 minutos)
```sql
-- 1. Verificar objetos criados
SELECT 
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY') as foreign_keys,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indices,
    (SELECT COUNT(*) FROM information_schema.triggers) as triggers,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as views;

-- 2. Testar queries básicas
SELECT COUNT(*) FROM usuarios WHERE status = 'active';
SELECT COUNT(*) FROM contratos WHERE status = 'ativo';

-- 3. Verificar logs de erro
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';
```

## TRATAMENTO DE ERROS

### Se encontrar dados inválidos nas constraints:
```sql
-- Exemplo: Emails inválidos
SELECT table_name, column_name, email 
FROM (
    SELECT 'empresas' as table_name, 'email_contato' as column_name, email_contato as email FROM empresas
    UNION ALL
    SELECT 'usuarios', 'email', email FROM usuarios
    -- etc...
) t
WHERE email NOT LIKE '%@%.%';

-- Corrigir antes de aplicar constraints
UPDATE empresas SET email_contato = NULL WHERE email_contato NOT LIKE '%@%.%';
```

### Se precisar reverter:
```sql
-- Executar aurora-rollback-script.sql
-- OU reverter parcialmente:
ALTER TABLE tabela DROP CONSTRAINT constraint_name;
DROP INDEX index_name;
```

## MONITORAMENTO PÓS-IMPLEMENTAÇÃO

1. **Monitorar performance:**
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE n_tup_upd > 0;
   SELECT * FROM pg_stat_user_indexes WHERE idx_scan > 0;
   ```

2. **Verificar logs de aplicação** por erros relacionados a:
   - Validações de constraint rejeitadas
   - Campos com tamanho excedido
   - Foreign keys violadas

3. **Acompanhar por 24-48 horas** antes de considerar concluído

## COMUNICAÇÃO

- **Antes:** Notificar equipe sobre janela de manutenção
- **Durante:** Manter log detalhado de cada etapa executada
- **Depois:** Relatório com mudanças aplicadas e métricas de impacto
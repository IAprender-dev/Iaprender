# RECOMENDAÇÕES FUTURAS - AURORA SERVERLESS V2

## 1. MELHORIAS DE ARQUITETURA

### 1.1 Implementar Particionamento
**Tabelas candidatas:** contratos, usuarios, alunos  
**Estratégia:** Particionar por data ou empresa_id  
**Benefício:** Melhor performance para consultas e manutenção  
```sql
-- Exemplo: Particionar contratos por ano
CREATE TABLE contratos_2025 PARTITION OF contratos
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### 1.2 Implementar Schemas Separados
**Proposta:** Separar por domínio funcional  
```sql
CREATE SCHEMA educacional;  -- escolas, alunos, professores
CREATE SCHEMA administrativo; -- empresas, contratos
CREATE SCHEMA autenticacao;  -- usuarios, ai_preferences
```

### 1.3 Implementar Row Level Security (RLS)
**Benefício:** Segurança adicional no nível do banco  
```sql
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY alunos_empresa_policy ON alunos
    FOR ALL TO application_user
    USING (empresa_id = current_setting('app.current_empresa_id')::integer);
```

## 2. OTIMIZAÇÕES DE PERFORMANCE

### 2.1 Configurações Aurora Específicas
```sql
-- Ajustar para workload educacional
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 4096;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
```

### 2.2 Materialized Views para Relatórios
```sql
CREATE MATERIALIZED VIEW mv_dashboard_empresa AS
SELECT 
    e.id,
    e.nome,
    COUNT(DISTINCT es.id) as total_escolas,
    COUNT(DISTINCT a.id) as total_alunos,
    SUM(c.valor_total) as receita_total
FROM empresas e
LEFT JOIN escolas es ON es.empresa_id = e.id
LEFT JOIN alunos a ON a.empresa_id = e.id
LEFT JOIN contratos c ON c.empresa_id = e.id
GROUP BY e.id, e.nome;

-- Refresh agendado
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-dashboard', '0 2 * * *', 
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_empresa');
```

### 2.3 Implementar Cache de Queries
**Tecnologia:** Redis/ElastiCache  
**Queries candidatas:** Listagens, dashboards, relatórios  

## 3. SEGURANÇA ADICIONAL

### 3.1 Criptografia de Dados Sensíveis
```sql
-- Instalar pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criptografar documentos
ALTER TABLE usuarios ADD COLUMN documento_identidade_encrypted bytea;
UPDATE usuarios SET 
    documento_identidade_encrypted = pgp_sym_encrypt(documento_identidade, 'key'),
    documento_identidade = NULL;
```

### 3.2 Auditoria Detalhada
```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    operation VARCHAR(10),
    user_id INTEGER,
    changed_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger genérico de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, user_id, changed_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        current_setting('app.current_user_id', true)::integer,
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 4. INTEGRAÇÃO E APIS

### 4.1 Implementar GraphQL via PostGraphile
**Benefício:** API automática baseada no schema  
**Instalação:** Via extensão ou servidor separado  

### 4.2 Webhooks para Eventos
```sql
CREATE TABLE webhook_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50),
    payload JSONB,
    endpoint_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para eventos importantes
CREATE TRIGGER webhook_novo_aluno
AFTER INSERT ON alunos
FOR EACH ROW
EXECUTE FUNCTION criar_webhook_event('novo_aluno');
```

## 5. MONITORAMENTO E OBSERVABILIDADE

### 5.1 Métricas Customizadas
```sql
-- View para métricas de negócio
CREATE VIEW v_metricas_negocio AS
SELECT 
    DATE_TRUNC('day', CURRENT_TIMESTAMP) as data,
    COUNT(*) FILTER (WHERE criado_em >= CURRENT_DATE) as novos_usuarios_hoje,
    COUNT(*) FILTER (WHERE ultimo_acesso >= CURRENT_DATE) as usuarios_ativos_hoje,
    AVG(EXTRACT(EPOCH FROM (ultimo_acesso - criado_em))/3600)::INTEGER as horas_ate_primeiro_acesso
FROM usuarios;
```

### 5.2 Alertas Proativos
- Configurar CloudWatch para:
  - Conexões próximas ao limite
  - Queries lentas (> 5s)
  - Deadlocks frequentes
  - Espaço em disco > 80%

## 6. CONFORMIDADE E GOVERNANÇA

### 6.1 LGPD Compliance
```sql
-- Implementar direito ao esquecimento
CREATE OR REPLACE FUNCTION anonimizar_usuario(user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE usuarios SET
        nome = 'ANONIMIZADO',
        email = CONCAT('anonimo_', id, '@exemplo.com'),
        telefone = NULL,
        documento_identidade = NULL,
        endereco = NULL,
        foto_perfil = NULL
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Backup e Retenção
- Configurar snapshots automáticos diários
- Retenção de 30 dias para compliance
- Teste mensal de restore

## 7. EVOLUÇÃO DO MODELO

### 7.1 Novos Campos Sugeridos
```sql
-- Rastreamento de dispositivos
ALTER TABLE usuarios ADD COLUMN dispositivos_autorizados JSONB DEFAULT '[]';

-- Preferências de notificação
ALTER TABLE usuarios ADD COLUMN preferencias_notificacao JSONB DEFAULT '{"email": true, "sms": false}';

-- Histórico de escolas
CREATE TABLE historico_aluno_escola (
    aluno_id INTEGER REFERENCES alunos(id),
    escola_id INTEGER REFERENCES escolas(id),
    data_entrada DATE,
    data_saida DATE,
    motivo_saida VARCHAR(100)
);
```

### 7.2 Suporte Multi-idioma
```sql
CREATE TABLE traducoes (
    tabela VARCHAR(50),
    campo VARCHAR(50),
    id_registro INTEGER,
    idioma VARCHAR(5),
    traducao TEXT,
    PRIMARY KEY (tabela, campo, id_registro, idioma)
);
```

## PRIORIZAÇÃO

1. **Imediato:** Aplicar correções do script principal
2. **Curto prazo (1-3 meses):** Particionamento, RLS, Auditoria
3. **Médio prazo (3-6 meses):** Materialized views, Cache, LGPD
4. **Longo prazo (6-12 meses):** GraphQL, Multi-idioma, ML/AI
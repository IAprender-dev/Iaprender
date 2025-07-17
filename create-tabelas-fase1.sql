-- CRIAÇÃO DAS TABELAS CRÍTICAS FASE 1 - SISTEMA EDUCACIONAL IAverse
-- Execução no Neon PostgreSQL Database

-- =============================================================================
-- 1. TABELA DE CONTROLE DE TOKENS DE IA
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, perplexity
    model VARCHAR(100) NOT NULL, -- gpt-4, claude-3, etc
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
    cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0.00,
    request_type VARCHAR(50) NOT NULL, -- chat, completion, image, etc
    endpoint VARCHAR(200),
    session_id VARCHAR(100),
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_empresa_id ON token_usage(empresa_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_provider_model ON token_usage(provider, model);
CREATE INDEX IF NOT EXISTS idx_token_usage_cost ON token_usage(cost_usd);

-- =============================================================================
-- 2. TABELA DE LOGS DETALHADOS DE TOKENS
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_usage_logs (
    id SERIAL PRIMARY KEY,
    token_usage_id INTEGER NOT NULL REFERENCES token_usage(id) ON DELETE CASCADE,
    request_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    processing_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_token_logs_usage_id ON token_usage_logs(token_usage_id);
CREATE INDEX IF NOT EXISTS idx_token_logs_created_at ON token_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_token_logs_error ON token_usage_logs(error_message) WHERE error_message IS NOT NULL;

-- =============================================================================
-- 3. TABELA DE TARIFAS DOS PROVEDORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS token_provider_rates (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    cost_per_input_token DECIMAL(12,8) NOT NULL,
    cost_per_output_token DECIMAL(12,8) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, model, effective_date)
);

-- Índices para tarifas
CREATE INDEX IF NOT EXISTS idx_provider_rates_active ON token_provider_rates(provider, model) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_provider_rates_date ON token_provider_rates(effective_date, expires_date);

-- =============================================================================
-- 4. TABELA DE PLANOS DE AULA
-- =============================================================================

CREATE TABLE IF NOT EXISTS lesson_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL, -- Disciplina
    grade_level VARCHAR(50) NOT NULL, -- Série/Ano
    duration_minutes INTEGER NOT NULL DEFAULT 50,
    objectives TEXT NOT NULL, -- Objetivos de aprendizagem
    content_summary TEXT, -- Resumo do conteúdo
    methodology TEXT, -- Metodologia aplicada
    resources TEXT, -- Recursos necessários
    evaluation TEXT, -- Forma de avaliação
    bncc_codes TEXT, -- Códigos BNCC relacionados
    teacher_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    ai_generated BOOLEAN DEFAULT false,
    ai_provider VARCHAR(50),
    template_used VARCHAR(100),
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para planos de aula
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_id ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_escola_id ON lesson_plans(escola_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_empresa_id ON lesson_plans(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject_grade ON lesson_plans(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_status ON lesson_plans(status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_created_at ON lesson_plans(created_at);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_bncc ON lesson_plans USING gin(to_tsvector('portuguese', bncc_codes)) WHERE bncc_codes IS NOT NULL;

-- =============================================================================
-- 5. TABELA DE LOGS DE AUDITORIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array de campos alterados
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical'))
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- =============================================================================
-- 6. TABELA DE NOTIFICAÇÕES
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success', 'system')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category VARCHAR(50) DEFAULT 'general', -- general, academic, administrative, technical
    read_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500), -- URL para ação relacionada
    action_label VARCHAR(100), -- Texto do botão de ação
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_empresa_id ON notifications(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- =============================================================================
-- 7. TABELA DE MENSAGENS DE IA
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    session_id VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, perplexity
    model VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0.00,
    response_time_ms INTEGER,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
    context_type VARCHAR(50), -- lesson_plan, student_help, administrative, etc
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mensagens IA
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_session ON ai_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_empresa_id ON ai_messages(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_provider_model ON ai_messages(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_messages_context ON ai_messages(context_type);

-- =============================================================================
-- 8. TABELA DE FERRAMENTAS DE IA
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- lesson_planning, student_support, administration, etc
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200),
    prompt_template TEXT,
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    required_role VARCHAR(50), -- admin, teacher, student, etc
    cost_per_use DECIMAL(8,4) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para ferramentas IA
CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON ai_tools(category);
CREATE INDEX IF NOT EXISTS idx_ai_tools_provider_model ON ai_tools(provider, model);
CREATE INDEX IF NOT EXISTS idx_ai_tools_active ON ai_tools(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_tools_role ON ai_tools(required_role);

-- =============================================================================
-- TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- =============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para tabelas com updated_at
CREATE TRIGGER trigger_lesson_plans_updated_at
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_ai_tools_updated_at
    BEFORE UPDATE ON ai_tools
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_token_provider_rates_updated_at
    BEFORE UPDATE ON token_provider_rates
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- INSERÇÃO DE DADOS INICIAIS
-- =============================================================================

-- Tarifas iniciais dos provedores (valores aproximados de janeiro 2025)
INSERT INTO token_provider_rates (provider, model, cost_per_input_token, cost_per_output_token) VALUES
('openai', 'gpt-4o', 0.0000025, 0.00001),
('openai', 'gpt-4o-mini', 0.00000015, 0.0000006),
('openai', 'gpt-3.5-turbo', 0.0000005, 0.0000015),
('anthropic', 'claude-3-5-sonnet-20241022', 0.000003, 0.000015),
('anthropic', 'claude-3-haiku-20240307', 0.00000025, 0.00000125),
('anthropic', 'claude-3-opus-20240229', 0.000015, 0.000075),
('perplexity', 'llama-3.1-sonar-small-128k-online', 0.0000002, 0.0000002),
('perplexity', 'llama-3.1-sonar-large-128k-online', 0.000001, 0.000001)
ON CONFLICT (provider, model, effective_date) DO NOTHING;

-- Ferramentas de IA iniciais
INSERT INTO ai_tools (name, description, category, provider, model, required_role, prompt_template) VALUES
('Gerador de Plano de Aula', 'Cria planos de aula alinhados com a BNCC', 'lesson_planning', 'anthropic', 'claude-3-5-sonnet-20241022', 'teacher', 
'Crie um plano de aula detalhado para {subject} - {grade_level}. Tema: {topic}. Duração: {duration} minutos. Inclua objetivos BNCC, metodologia e avaliação.'),

('Assistente de Correção', 'Ajuda na correção de atividades e provas', 'student_support', 'openai', 'gpt-4o', 'teacher',
'Analise esta atividade de {subject} e forneça feedback construtivo: {content}'),

('Criador de Atividades', 'Gera atividades pedagógicas personalizadas', 'lesson_planning', 'anthropic', 'claude-3-haiku-20240307', 'teacher',
'Crie {quantity} atividades de {subject} para {grade_level} sobre o tema {topic}. Nível de dificuldade: {difficulty}'),

('Suporte ao Aluno', 'Tira dúvidas e explica conceitos', 'student_support', 'openai', 'gpt-4o-mini', 'student',
'Você é um tutor educacional. Explique de forma simples e didática: {question}. Série: {grade_level}'),

('Relatório Administrativo', 'Gera relatórios e análises administrativas', 'administration', 'anthropic', 'claude-3-5-sonnet-20241022', 'admin',
'Analise os seguintes dados educacionais e gere um relatório detalhado: {data}')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- COMENTÁRIOS FINAIS
-- =============================================================================

COMMENT ON TABLE token_usage IS 'Controle de uso e custos de tokens de IA por usuário';
COMMENT ON TABLE token_usage_logs IS 'Logs detalhados de requests para APIs de IA';
COMMENT ON TABLE token_provider_rates IS 'Tarifas atualizadas dos provedores de IA';
COMMENT ON TABLE lesson_plans IS 'Planos de aula criados por professores';
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para todas as operações do sistema';
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON TABLE ai_messages IS 'Histórico de conversas com IA';
COMMENT ON TABLE ai_tools IS 'Ferramentas de IA disponíveis no sistema';
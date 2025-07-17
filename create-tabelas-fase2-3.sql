-- CRIAÇÃO DAS TABELAS FASE 2 E 3 - SISTEMA EDUCACIONAL IAverse
-- Execução no Neon PostgreSQL Database

-- =============================================================================
-- FASE 2: TABELAS DE CONTEÚDO E CURSOS
-- =============================================================================

-- Cursos
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL, -- beginner, intermediate, advanced
    duration_hours INTEGER DEFAULT 0,
    instructor_id INTEGER REFERENCES professores(id) ON DELETE SET NULL,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'suspended')),
    enrollment_limit INTEGER,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_free BOOLEAN DEFAULT true,
    prerequisites TEXT,
    learning_objectives TEXT,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Módulos dos cursos
CREATE TABLE IF NOT EXISTS course_modules (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_sequence INTEGER NOT NULL DEFAULT 1,
    duration_minutes INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    unlock_after_module_id INTEGER REFERENCES course_modules(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, order_sequence)
);

-- Conteúdos dos módulos
CREATE TABLE IF NOT EXISTS course_contents (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'video', 'audio', 'image', 'pdf', 'quiz', 'assignment')),
    content_data TEXT, -- HTML, markdown ou JSON
    file_url VARCHAR(500),
    file_size_mb DECIMAL(8,2),
    order_sequence INTEGER NOT NULL DEFAULT 1,
    is_required BOOLEAN DEFAULT true,
    estimated_time_minutes INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module_id, order_sequence)
);

-- Materiais didáticos
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- worksheet, presentation, document, etc
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    file_type VARCHAR(20) NOT NULL, -- pdf, docx, pptx, etc
    file_url VARCHAR(500) NOT NULL,
    file_size_mb DECIMAL(8,2),
    download_count INTEGER DEFAULT 0,
    teacher_id INTEGER REFERENCES professores(id) ON DELETE SET NULL,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[], -- Array de tags
    bncc_codes TEXT,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Provas e exames
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    exam_type VARCHAR(50) NOT NULL, -- quiz, test, exam, assignment
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    total_points DECIMAL(6,2) NOT NULL DEFAULT 100.00,
    passing_score DECIMAL(6,2) NOT NULL DEFAULT 60.00,
    questions_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de questões
    teacher_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    attempt_limit INTEGER DEFAULT 1,
    show_results BOOLEAN DEFAULT true,
    randomize_questions BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Planos de estudo
CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    student_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES professores(id) ON DELETE SET NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goals TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cronograma de estudos
CREATE TABLE IF NOT EXISTS study_schedule (
    id SERIAL PRIMARY KEY,
    study_plan_id INTEGER NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(100) NOT NULL,
    topic VARCHAR(255),
    activities TEXT,
    is_recurring BOOLEAN DEFAULT true,
    specific_date DATE, -- Para atividades não recorrentes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FASE 3: TABELAS DE ADMINISTRAÇÃO
-- =============================================================================

-- Ações administrativas
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- create_user, update_contract, etc
    target_table VARCHAR(100),
    target_id INTEGER,
    description TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    ip_address INET,
    user_agent TEXT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('low', 'info', 'warning', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configurações da plataforma
CREATE TABLE IF NOT EXISTS platform_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- Configurações do sistema não podem ser alteradas
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE, -- NULL = global
    updated_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alertas de segurança
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- login_failure, suspicious_activity, etc
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    additional_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    assigned_to INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TABELAS AUXILIARES
-- =============================================================================

-- Atividades
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL, -- homework, project, quiz, etc
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    points_possible DECIMAL(6,2) DEFAULT 0.00,
    teacher_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT false,
    submission_type VARCHAR(20) DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'url', 'none')),
    allow_late_submission BOOLEAN DEFAULT true,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL, -- course, material, activity, etc
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    color VARCHAR(7), -- Código hexadecimal da cor
    icon VARCHAR(50),
    order_sequence INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category_type, empresa_id)
);

-- Certificados
CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    certificate_type VARCHAR(50) NOT NULL, -- course_completion, achievement, etc
    template_url VARCHAR(500),
    recipient_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    issued_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    verification_code VARCHAR(50) UNIQUE NOT NULL,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter
CREATE TABLE IF NOT EXISTS newsletter (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    newsletter_type VARCHAR(50) DEFAULT 'general', -- general, educational, administrative
    target_audience VARCHAR(50) NOT NULL, -- all, teachers, students, admins, parents
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    recipients_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    escola_id INTEGER REFERENCES escolas(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Itens salvos pelos usuários
CREATE TABLE IF NOT EXISTS saved_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- lesson_plan, material, course, etc
    item_id INTEGER NOT NULL,
    item_title VARCHAR(255),
    notes TEXT,
    folder VARCHAR(100) DEFAULT 'Geral',
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- Backup de usuários (para histórico)
CREATE TABLE IF NOT EXISTS usuarios_backup (
    id SERIAL PRIMARY KEY,
    original_user_id INTEGER NOT NULL,
    backup_data JSONB NOT NULL,
    backup_reason VARCHAR(100) NOT NULL, -- deletion, major_update, migration
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas adicionais baseadas na estrutura mencionada (aliases/views)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    escola_id INTEGER NOT NULL REFERENCES escolas(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS secretarias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- municipal, estadual
    municipio VARCHAR(100),
    estado VARCHAR(50),
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    responsavel VARCHAR(255),
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para courses
CREATE INDEX IF NOT EXISTS idx_courses_escola_empresa ON courses(escola_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);

-- Índices para course_modules
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id, order_sequence);

-- Índices para course_contents
CREATE INDEX IF NOT EXISTS idx_course_contents_module ON course_contents(module_id, order_sequence);

-- Índices para materials
CREATE INDEX IF NOT EXISTS idx_materials_subject_grade ON materials(subject, grade_level);
CREATE INDEX IF NOT EXISTS idx_materials_teacher ON materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_escola_empresa ON materials(escola_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_materials_tags ON materials USING gin(tags);

-- Índices para exams
CREATE INDEX IF NOT EXISTS idx_exams_teacher ON exams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_escola_empresa ON exams(escola_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_grade ON exams(subject, grade_level);

-- Índices para study_plans
CREATE INDEX IF NOT EXISTS idx_study_plans_student ON study_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_teacher ON study_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_dates ON study_plans(start_date, end_date);

-- Índices para activities
CREATE INDEX IF NOT EXISTS idx_activities_teacher ON activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activities_escola_empresa ON activities(escola_id, empresa_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities(due_date);

-- Índices para saved_items
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_saved_items_favorites ON saved_items(user_id) WHERE is_favorite = true;

-- =============================================================================
-- TRIGGERS PARA TIMESTAMPS AUTOMÁTICOS
-- =============================================================================

CREATE TRIGGER trigger_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_study_plans_updated_at BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- INSERÇÃO DE DADOS INICIAIS
-- =============================================================================

-- Categorias padrão
INSERT INTO categories (name, description, category_type, empresa_id, created_by) 
SELECT 'Matemática', 'Disciplina de Matemática', 'subject', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Matemática' AND empresa_id = 1);

INSERT INTO categories (name, description, category_type, empresa_id, created_by) 
SELECT 'Português', 'Disciplina de Língua Portuguesa', 'subject', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Português' AND empresa_id = 1);

INSERT INTO categories (name, description, category_type, empresa_id, created_by) 
SELECT 'Ciências', 'Disciplina de Ciências', 'subject', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Ciências' AND empresa_id = 1);

-- Configurações padrão da plataforma
INSERT INTO platform_configs (config_key, config_value, config_type, description, is_system, updated_by) VALUES
('max_file_upload_mb', '50', 'number', 'Tamanho máximo para upload de arquivos em MB', true, 1),
('session_timeout_minutes', '60', 'number', 'Tempo limite da sessão em minutos', true, 1),
('enable_notifications', 'true', 'boolean', 'Habilitar sistema de notificações', false, 1),
('maintenance_mode', 'false', 'boolean', 'Modo de manutenção do sistema', true, 1)
ON CONFLICT (config_key) DO NOTHING;

-- =============================================================================
-- COMENTÁRIOS FINAIS
-- =============================================================================

COMMENT ON TABLE courses IS 'Cursos oferecidos pela plataforma';
COMMENT ON TABLE course_modules IS 'Módulos que compõem os cursos';
COMMENT ON TABLE course_contents IS 'Conteúdos específicos de cada módulo';
COMMENT ON TABLE materials IS 'Materiais didáticos compartilháveis';
COMMENT ON TABLE exams IS 'Provas e avaliações';
COMMENT ON TABLE study_plans IS 'Planos de estudo personalizados';
COMMENT ON TABLE study_schedule IS 'Cronograma de estudos';
COMMENT ON TABLE admin_actions IS 'Registro de ações administrativas';
COMMENT ON TABLE platform_configs IS 'Configurações globais da plataforma';
COMMENT ON TABLE security_alerts IS 'Alertas de segurança do sistema';
COMMENT ON TABLE activities IS 'Atividades e tarefas escolares';
COMMENT ON TABLE categories IS 'Categorias para organização de conteúdo';
COMMENT ON TABLE certificates IS 'Certificados emitidos pela plataforma';
COMMENT ON TABLE newsletter IS 'Sistema de newsletter e comunicados';
COMMENT ON TABLE saved_items IS 'Itens salvos pelos usuários';
COMMENT ON TABLE usuarios_backup IS 'Backup de dados de usuários removidos';
COMMENT ON TABLE secretarias IS 'Secretarias de educação (municipal/estadual)';
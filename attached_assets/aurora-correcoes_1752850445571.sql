-- =====================================================
-- CORREÇÕES PARA O SISTEMA AURORA SERVERLESS V2
-- Data: 18/01/2025
-- Descrição: Script com todas as correções identificadas na auditoria
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPOS DE AUDITORIA COMPLETOS
-- =====================================================

-- Adicionar campos de auditoria em GESTORES
ALTER TABLE gestores 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id),
ADD COLUMN criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar campos de auditoria em DIRETORES
ALTER TABLE diretores 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id),
ADD COLUMN criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar campos de auditoria em PROFESSORES
ALTER TABLE professores 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id),
ADD COLUMN criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar campos de auditoria faltantes em ALUNOS (já tem criado_em)
ALTER TABLE alunos 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Adicionar campos de auditoria faltantes em AI_PREFERENCES
ALTER TABLE ai_preferences 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id);

-- Adicionar campos de auditoria faltantes em AI_RESOURCE_CONFIGS
ALTER TABLE ai_resource_configs 
ADD COLUMN criado_por UUID REFERENCES usuarios(id),
ADD COLUMN atualizado_por UUID REFERENCES usuarios(id);

-- =====================================================
-- 2. PADRONIZAR NOMENCLATURA DE CAMPOS (usr_id → user_id)
-- =====================================================

-- Primeiro, remover as foreign keys existentes
ALTER TABLE gestores DROP CONSTRAINT IF EXISTS fk_gestor_usuario;
ALTER TABLE diretores DROP CONSTRAINT IF EXISTS fk_diretor_usuario;
ALTER TABLE professores DROP CONSTRAINT IF EXISTS fk_professor_usuario;
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS fk_aluno_usuario;

-- Remover índices antigos
DROP INDEX IF EXISTS idx_gestores_usr_id;
DROP INDEX IF EXISTS idx_diretores_usr_id;
DROP INDEX IF EXISTS idx_professores_usr_id;
DROP INDEX IF EXISTS idx_alunos_usr_id;

-- Renomear as colunas
ALTER TABLE gestores RENAME COLUMN usr_id TO user_id;
ALTER TABLE diretores RENAME COLUMN usr_id TO user_id;
ALTER TABLE professores RENAME COLUMN usr_id TO user_id;
ALTER TABLE alunos RENAME COLUMN usr_id TO user_id;

-- Recriar as foreign keys com o novo nome
ALTER TABLE gestores ADD CONSTRAINT fk_gestor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id);
ALTER TABLE diretores ADD CONSTRAINT fk_diretor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id);
ALTER TABLE professores ADD CONSTRAINT fk_professor_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id);
ALTER TABLE alunos ADD CONSTRAINT fk_aluno_usuario FOREIGN KEY (user_id) REFERENCES usuarios(id);

-- Recriar os índices com o novo nome
CREATE INDEX idx_gestores_user_id ON gestores(user_id);
CREATE INDEX idx_diretores_user_id ON diretores(user_id);
CREATE INDEX idx_professores_user_id ON professores(user_id);
CREATE INDEX idx_alunos_user_id ON alunos(user_id);

-- =====================================================
-- 3. ADICIONAR ÍNDICES COMPOSTOS PARA PERFORMANCE
-- =====================================================

-- Índices compostos para consultas frequentes por empresa e status
CREATE INDEX idx_gestores_empresa_status ON gestores(empresa_id, status);
CREATE INDEX idx_diretores_escola_status ON diretores(escola_id, status);
CREATE INDEX idx_professores_escola_status ON professores(escola_id, status);
CREATE INDEX idx_alunos_escola_status ON alunos(escola_id, status);

-- Índice composto para usuários por empresa e tipo
CREATE INDEX idx_usuarios_empresa_tipo ON usuarios(empresa_id, tipo_usuario);

-- Índices compostos adicionais para melhor performance
CREATE INDEX idx_contratos_empresa_status ON contratos(empresa_id, status);
CREATE INDEX idx_escolas_empresa_status ON escolas(empresa_id, status);
CREATE INDEX idx_diretores_empresa_status ON diretores(empresa_id, status);
CREATE INDEX idx_professores_empresa_status ON professores(empresa_id, status);
CREATE INDEX idx_alunos_empresa_status ON alunos(empresa_id, status);

-- =====================================================
-- 4. CRIAR TRIGGERS PARA ATUALIZAR CAMPOS DE AUDITORIA
-- =====================================================

-- Função genérica para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com campo atualizado_em
CREATE TRIGGER update_gestores_updated_at BEFORE UPDATE ON gestores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diretores_updated_at BEFORE UPDATE ON diretores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professores_updated_at BEFORE UPDATE ON professores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at BEFORE UPDATE ON alunos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_preferences_updated_at BEFORE UPDATE ON ai_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_resource_configs_updated_at BEFORE UPDATE ON ai_resource_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ATUALIZAR VIEWS E FUNÇÕES PARA USAR user_id
-- =====================================================

-- Recriar a view de hierarquia completa com os novos nomes
CREATE OR REPLACE VIEW vw_hierarquia_completa AS
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    es.id as escola_id,
    es.nome as escola_nome,
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.tipo_usuario,
    g.id as gestor_id,
    d.id as diretor_id,
    p.id as professor_id,
    a.id as aluno_id
FROM empresas e
LEFT JOIN escolas es ON es.empresa_id = e.id
LEFT JOIN usuarios u ON u.empresa_id = e.id
LEFT JOIN gestores g ON g.user_id = u.id
LEFT JOIN diretores d ON d.user_id = u.id
LEFT JOIN professores p ON p.user_id = u.id
LEFT JOIN alunos a ON a.user_id = u.id;

-- =====================================================
-- 6. ADICIONAR FOREIGN KEYS PARA CAMPOS DE AUDITORIA
-- =====================================================

-- Foreign keys para criado_por e atualizado_por em gestores
ALTER TABLE gestores 
ADD CONSTRAINT fk_gestor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_gestor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- Foreign keys para criado_por e atualizado_por em diretores
ALTER TABLE diretores 
ADD CONSTRAINT fk_diretor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_diretor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- Foreign keys para criado_por e atualizado_por em professores
ALTER TABLE professores 
ADD CONSTRAINT fk_professor_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_professor_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- Foreign keys para criado_por e atualizado_por em alunos
ALTER TABLE alunos 
ADD CONSTRAINT fk_aluno_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_aluno_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- Foreign keys para criado_por e atualizado_por em ai_preferences
ALTER TABLE ai_preferences 
ADD CONSTRAINT fk_ai_pref_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_ai_pref_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- Foreign keys para criado_por e atualizado_por em ai_resource_configs
ALTER TABLE ai_resource_configs 
ADD CONSTRAINT fk_ai_config_criador FOREIGN KEY (criado_por) REFERENCES usuarios(id),
ADD CONSTRAINT fk_ai_config_atualizador FOREIGN KEY (atualizado_por) REFERENCES usuarios(id);

-- =====================================================
-- 7. COMENTÁRIOS NAS TABELAS E CAMPOS
-- =====================================================

-- Comentários para documentar os campos de auditoria
COMMENT ON COLUMN gestores.criado_por IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN gestores.atualizado_por IS 'ID do usuário que atualizou o registro por último';
COMMENT ON COLUMN gestores.criado_em IS 'Data e hora de criação do registro';
COMMENT ON COLUMN gestores.atualizado_em IS 'Data e hora da última atualização do registro';

COMMENT ON COLUMN diretores.criado_por IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN diretores.atualizado_por IS 'ID do usuário que atualizou o registro por último';
COMMENT ON COLUMN diretores.criado_em IS 'Data e hora de criação do registro';
COMMENT ON COLUMN diretores.atualizado_em IS 'Data e hora da última atualização do registro';

COMMENT ON COLUMN professores.criado_por IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN professores.atualizado_por IS 'ID do usuário que atualizou o registro por último';
COMMENT ON COLUMN professores.criado_em IS 'Data e hora de criação do registro';
COMMENT ON COLUMN professores.atualizado_em IS 'Data e hora da última atualização do registro';

COMMENT ON COLUMN alunos.criado_por IS 'ID do usuário que criou o registro';
COMMENT ON COLUMN alunos.atualizado_por IS 'ID do usuário que atualizou o registro por último';
COMMENT ON COLUMN alunos.atualizado_em IS 'Data e hora da última atualização do registro';

-- =====================================================
-- FIM DO SCRIPT DE CORREÇÕES
-- =====================================================
-- =====================================================================
-- SCRIPT DE CORREÇÕES COMPLETAS - AURORA SERVERLESS V2
-- Data: 18/01/2025
-- Banco: BDIAPRENDER
-- =====================================================================

-- Este script contém TODAS as correções identificadas na auditoria completa
-- Deve ser executado em ordem sequencial para garantir integridade

-- =====================================================================
-- PARTE 1: PREPARAÇÃO E CONFIGURAÇÕES
-- =====================================================================

-- Desabilitar temporariamente verificações de FK para aplicar mudanças
SET session_replication_role = 'replica';

-- =====================================================================
-- PARTE 2: CORREÇÕES DE NOMENCLATURA
-- =====================================================================

-- Nenhuma inconsistência de nomenclatura foi encontrada na auditoria atual
-- Tabelas já estão usando snake_case corretamente

-- =====================================================================
-- PARTE 3: CAMPOS DE AUDITORIA
-- =====================================================================

-- Todos os campos de auditoria já estão presentes nas tabelas
-- criado_em, atualizado_em, criado_por, atualizado_por

-- =====================================================================
-- PARTE 4: FOREIGN KEYS FALTANDO
-- =====================================================================

-- Adicionar foreign keys identificadas como faltantes

-- 4.1 Foreign keys para gestores
ALTER TABLE gestores 
ADD CONSTRAINT fk_gestores_empresa_id 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4.2 Foreign keys para diretores  
ALTER TABLE diretores
ADD CONSTRAINT fk_diretores_empresa_id
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4.3 Foreign keys para professores
ALTER TABLE professores
ADD CONSTRAINT fk_professores_empresa_id
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4.4 Foreign keys para alunos
ALTER TABLE alunos
ADD CONSTRAINT fk_alunos_empresa_id
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4.5 Foreign keys para ai_resource_configs
ALTER TABLE ai_resource_configs
ADD CONSTRAINT fk_ai_resource_configs_resource_id
FOREIGN KEY (resource_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================================
-- PARTE 5: CORREÇÕES DE TIPOS DE DADOS
-- =====================================================================

-- 5.1 Corrigir campos VARCHAR sem tamanho definido
ALTER TABLE empresas ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE empresas ALTER COLUMN telefone TYPE VARCHAR(20);
ALTER TABLE empresas ALTER COLUMN email_contato TYPE VARCHAR(255);
ALTER TABLE empresas ALTER COLUMN cidade TYPE VARCHAR(100);
ALTER TABLE empresas ALTER COLUMN responsavel TYPE VARCHAR(255);
ALTER TABLE empresas ALTER COLUMN cargo_responsavel TYPE VARCHAR(100);

ALTER TABLE contratos ALTER COLUMN numero TYPE VARCHAR(50);
ALTER TABLE contratos ALTER COLUMN tipo_contrato TYPE VARCHAR(50);
ALTER TABLE contratos ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE contratos ALTER COLUMN responsavel_contrato TYPE VARCHAR(255);
ALTER TABLE contratos ALTER COLUMN email_responsavel TYPE VARCHAR(255);

ALTER TABLE usuarios ALTER COLUMN cognito_username TYPE VARCHAR(255);
ALTER TABLE usuarios ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE usuarios ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE usuarios ALTER COLUMN tipo_usuario TYPE VARCHAR(50);
ALTER TABLE usuarios ALTER COLUMN telefone TYPE VARCHAR(20);
ALTER TABLE usuarios ALTER COLUMN documento_identidade TYPE VARCHAR(20);
ALTER TABLE usuarios ALTER COLUMN genero TYPE VARCHAR(20);
ALTER TABLE usuarios ALTER COLUMN cidade TYPE VARCHAR(100);
ALTER TABLE usuarios ALTER COLUMN estado TYPE VARCHAR(2);
ALTER TABLE usuarios ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE escolas ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE escolas ALTER COLUMN tipo_escola TYPE VARCHAR(50);
ALTER TABLE escolas ALTER COLUMN cidade TYPE VARCHAR(100);
ALTER TABLE escolas ALTER COLUMN telefone TYPE VARCHAR(20);
ALTER TABLE escolas ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE escolas ALTER COLUMN diretor_responsavel TYPE VARCHAR(255);
ALTER TABLE escolas ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE gestores ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE gestores ALTER COLUMN cargo TYPE VARCHAR(100);
ALTER TABLE gestores ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE diretores ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE diretores ALTER COLUMN cargo TYPE VARCHAR(100);
ALTER TABLE diretores ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE professores ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE professores ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE alunos ALTER COLUMN matricula TYPE VARCHAR(50);
ALTER TABLE alunos ALTER COLUMN nome TYPE VARCHAR(255);
ALTER TABLE alunos ALTER COLUMN turma TYPE VARCHAR(50);
ALTER TABLE alunos ALTER COLUMN serie TYPE VARCHAR(50);
ALTER TABLE alunos ALTER COLUMN turno TYPE VARCHAR(20);
ALTER TABLE alunos ALTER COLUMN nome_responsavel TYPE VARCHAR(255);
ALTER TABLE alunos ALTER COLUMN contato_responsavel TYPE VARCHAR(20);
ALTER TABLE alunos ALTER COLUMN status TYPE VARCHAR(20);

ALTER TABLE ai_preferences ALTER COLUMN default_ai TYPE VARCHAR(50);
ALTER TABLE ai_preferences ALTER COLUMN response_language TYPE VARCHAR(10);
ALTER TABLE ai_preferences ALTER COLUMN complexity_level TYPE VARCHAR(20);

ALTER TABLE ai_resource_configs ALTER COLUMN resource_name TYPE VARCHAR(255);
ALTER TABLE ai_resource_configs ALTER COLUMN resource_type TYPE VARCHAR(50);
ALTER TABLE ai_resource_configs ALTER COLUMN selected_model TYPE VARCHAR(100);
ALTER TABLE ai_resource_configs ALTER COLUMN model_name TYPE VARCHAR(100);

-- =====================================================================
-- PARTE 6: CONSTRAINTS DE VALIDAÇÃO
-- =====================================================================

-- 6.1 Constraints de email
ALTER TABLE empresas 
ADD CONSTRAINT chk_empresas_email_contato 
CHECK (email_contato ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE contratos
ADD CONSTRAINT chk_contratos_email_responsavel
CHECK (email_responsavel IS NULL OR email_responsavel ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_email
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_email
CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 6.2 Constraints de telefone
ALTER TABLE empresas
ADD CONSTRAINT chk_empresas_telefone
CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$');

ALTER TABLE contratos  
ADD CONSTRAINT chk_contratos_telefone_responsavel
CHECK (telefone_responsavel IS NULL OR telefone_responsavel ~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$');

ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_telefone
CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$');

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_telefone  
CHECK (telefone IS NULL OR telefone ~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$');

ALTER TABLE alunos
ADD CONSTRAINT chk_alunos_contato_responsavel
CHECK (contato_responsavel IS NULL OR contato_responsavel ~ '^\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}$');

-- 6.3 Constraints de CNPJ
ALTER TABLE empresas
ADD CONSTRAINT chk_empresas_cnpj
CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$');

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_cnpj
CHECK (cnpj IS NULL OR cnpj ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$');

-- 6.4 Constraints de CEP
ALTER TABLE empresas
ADD CONSTRAINT chk_empresas_cep
CHECK (cep IS NULL OR cep ~ '^[0-9]{5}-[0-9]{3}$');

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_cep
CHECK (cep IS NULL OR cep ~ '^[0-9]{5}-[0-9]{3}$');

-- 6.5 Constraints de status
ALTER TABLE empresas
ADD CONSTRAINT chk_empresas_status
CHECK (status IN ('ativa', 'inativa', 'suspensa'));

ALTER TABLE contratos
ADD CONSTRAINT chk_contratos_status
CHECK (status IN ('ativo', 'inativo', 'pendente', 'cancelado', 'expirado'));

ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_status
CHECK (status IN ('active', 'inactive', 'suspended', 'blocked'));

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_status
CHECK (status IN ('ativa', 'inativa', 'suspensa'));

ALTER TABLE gestores
ADD CONSTRAINT chk_gestores_status
CHECK (status IN ('ativo', 'inativo', 'afastado'));

ALTER TABLE diretores
ADD CONSTRAINT chk_diretores_status
CHECK (status IN ('ativo', 'inativo', 'afastado'));

ALTER TABLE professores
ADD CONSTRAINT chk_professores_status
CHECK (status IN ('ativo', 'inativo', 'afastado', 'licenca'));

ALTER TABLE alunos
ADD CONSTRAINT chk_alunos_status
CHECK (status IN ('ativo', 'inativo', 'transferido', 'formado', 'evadido'));

-- 6.6 Constraints de tipo_usuario
ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_tipo_usuario
CHECK (tipo_usuario IN ('admin', 'gestor', 'diretor', 'professor', 'aluno'));

-- 6.7 Constraints de UF
ALTER TABLE empresas
ADD CONSTRAINT chk_empresas_estado
CHECK (estado IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_estado
CHECK (estado IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));

ALTER TABLE usuarios
ADD CONSTRAINT chk_usuarios_estado
CHECK (estado IS NULL OR estado IN ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'));

-- 6.8 Constraints de código INEP
ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_codigo_inep
CHECK (codigo_inep ~ '^[0-9]{8}$');

-- 6.9 Constraints de valores positivos
ALTER TABLE contratos
ADD CONSTRAINT chk_contratos_valor_total
CHECK (valor_total >= 0);

ALTER TABLE contratos
ADD CONSTRAINT chk_contratos_numero_licencas
CHECK (numero_licencas > 0);

ALTER TABLE escolas
ADD CONSTRAINT chk_escolas_capacidade_alunos
CHECK (capacidade_alunos IS NULL OR capacidade_alunos > 0);

ALTER TABLE ai_resource_configs
ADD CONSTRAINT chk_ai_resource_configs_temperature
CHECK (temperature >= 0 AND temperature <= 2);

ALTER TABLE ai_resource_configs
ADD CONSTRAINT chk_ai_resource_configs_max_tokens
CHECK (max_tokens IS NULL OR max_tokens > 0);

-- =====================================================================
-- PARTE 7: ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================================

-- 7.1 Índices compostos para queries frequentes
CREATE INDEX idx_usuarios_empresa_tipo ON usuarios(empresa_id, tipo_usuario);
CREATE INDEX idx_escolas_empresa_status ON escolas(empresa_id, status);
CREATE INDEX idx_contratos_empresa_status ON contratos(empresa_id, status);
CREATE INDEX idx_alunos_escola_serie_turma ON alunos(escola_id, serie, turma);
CREATE INDEX idx_professores_escola_status ON professores(escola_id, status);
CREATE INDEX idx_diretores_escola_status ON diretores(escola_id, status);

-- 7.2 Índices para campos de busca frequentes
CREATE INDEX idx_usuarios_nome_gin ON usuarios USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_alunos_nome_gin ON alunos USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_empresas_nome_gin ON empresas USING gin(to_tsvector('portuguese', nome));
CREATE INDEX idx_escolas_nome_gin ON escolas USING gin(to_tsvector('portuguese', nome));

-- 7.3 Índices para campos de data
CREATE INDEX idx_contratos_data_inicio ON contratos(data_inicio);
CREATE INDEX idx_contratos_data_fim ON contratos(data_fim);
CREATE INDEX idx_usuarios_data_nascimento ON usuarios(data_nascimento);
CREATE INDEX idx_alunos_data_matricula ON alunos(data_matricula);

-- 7.4 Índices parciais para otimização
CREATE INDEX idx_usuarios_ativos ON usuarios(id) WHERE status = 'active';
CREATE INDEX idx_escolas_ativas ON escolas(id) WHERE status = 'ativa';
CREATE INDEX idx_contratos_ativos ON contratos(id) WHERE status = 'ativo';
CREATE INDEX idx_alunos_ativos ON alunos(id) WHERE status = 'ativo';

-- =====================================================================
-- PARTE 8: TRIGGERS ADICIONAIS
-- =====================================================================

-- 8.1 Trigger para validar datas de contrato
CREATE OR REPLACE FUNCTION validar_datas_contrato()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_fim <= NEW.data_inicio THEN
        RAISE EXCEPTION 'Data de fim deve ser posterior à data de início';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_datas_contrato
BEFORE INSERT OR UPDATE ON contratos
FOR EACH ROW
EXECUTE FUNCTION validar_datas_contrato();

-- 8.2 Trigger para atualizar status de contrato baseado nas datas
CREATE OR REPLACE FUNCTION atualizar_status_contrato()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_fim < CURRENT_DATE AND NEW.status = 'ativo' THEN
        NEW.status := 'expirado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_atualizar_status_contrato
BEFORE UPDATE ON contratos
FOR EACH ROW
EXECUTE FUNCTION atualizar_status_contrato();

-- =====================================================================
-- PARTE 9: VIEWS ÚTEIS
-- =====================================================================

-- 9.1 View para estatísticas por empresa
CREATE OR REPLACE VIEW vw_estatisticas_empresa AS
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    COUNT(DISTINCT es.id) as total_escolas,
    COUNT(DISTINCT u.id) FILTER (WHERE u.tipo_usuario = 'gestor') as total_gestores,
    COUNT(DISTINCT u.id) FILTER (WHERE u.tipo_usuario = 'diretor') as total_diretores,
    COUNT(DISTINCT u.id) FILTER (WHERE u.tipo_usuario = 'professor') as total_professores,
    COUNT(DISTINCT u.id) FILTER (WHERE u.tipo_usuario = 'aluno') as total_alunos,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativo') as contratos_ativos
FROM empresas e
LEFT JOIN escolas es ON es.empresa_id = e.id
LEFT JOIN usuarios u ON u.empresa_id = e.id
LEFT JOIN contratos c ON c.empresa_id = e.id
GROUP BY e.id, e.nome;

-- 9.2 View para usuários com informações completas
CREATE OR REPLACE VIEW vw_usuarios_completo AS
SELECT 
    u.*,
    e.nome as empresa_nome,
    c.numero as contrato_numero,
    CASE 
        WHEN g.id IS NOT NULL THEN 'Gestor'
        WHEN d.id IS NOT NULL THEN 'Diretor'
        WHEN p.id IS NOT NULL THEN 'Professor'
        WHEN a.id IS NOT NULL THEN 'Aluno'
        ELSE 'Admin'
    END as role_especifico
FROM usuarios u
LEFT JOIN empresas e ON e.id = u.empresa_id
LEFT JOIN contratos c ON c.id = u.contrato_id
LEFT JOIN gestores g ON g.user_id = u.id
LEFT JOIN diretores d ON d.user_id = u.id
LEFT JOIN professores p ON p.user_id = u.id
LEFT JOIN alunos a ON a.user_id = u.id;

-- =====================================================================
-- PARTE 10: DOCUMENTAÇÃO DAS TABELAS
-- =====================================================================

-- Comentários nas tabelas
COMMENT ON TABLE empresas IS 'Tabela principal de empresas/instituições do sistema educacional';
COMMENT ON TABLE contratos IS 'Contratos firmados entre empresas e o sistema';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com integração AWS Cognito';
COMMENT ON TABLE escolas IS 'Instituições de ensino vinculadas às empresas';
COMMENT ON TABLE gestores IS 'Gestores municipais/estaduais de educação';
COMMENT ON TABLE diretores IS 'Diretores de escolas';
COMMENT ON TABLE professores IS 'Professores das instituições de ensino';
COMMENT ON TABLE alunos IS 'Alunos matriculados nas escolas';
COMMENT ON TABLE ai_preferences IS 'Preferências de IA por usuário';
COMMENT ON TABLE ai_resource_configs IS 'Configurações de recursos de IA';

-- Comentários em colunas importantes
COMMENT ON COLUMN usuarios.cognito_sub IS 'ID único do usuário no AWS Cognito';
COMMENT ON COLUMN usuarios.cognito_username IS 'Username do usuário no AWS Cognito';
COMMENT ON COLUMN escolas.codigo_inep IS 'Código INEP da instituição de ensino';
COMMENT ON COLUMN contratos.valor_total IS 'Valor total do contrato em reais (BRL)';
COMMENT ON COLUMN ai_resource_configs.temperature IS 'Temperatura do modelo de IA (0-2)';

-- =====================================================================
-- PARTE 11: CONFIGURAÇÕES FINAIS
-- =====================================================================

-- Reabilitar verificações de FK
SET session_replication_role = 'origin';

-- Analisar tabelas para atualizar estatísticas
ANALYZE empresas;
ANALYZE contratos;
ANALYZE usuarios;
ANALYZE escolas;
ANALYZE gestores;
ANALYZE diretores;
ANALYZE professores;
ANALYZE alunos;
ANALYZE ai_preferences;
ANALYZE ai_resource_configs;

-- =====================================================================
-- FIM DO SCRIPT DE CORREÇÕES
-- =====================================================================
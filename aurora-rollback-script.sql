-- =====================================================================
-- SCRIPT DE ROLLBACK - AURORA SERVERLESS V2
-- Data: 18/01/2025
-- Banco: BDIAPRENDER
-- =====================================================================

-- Este script reverte TODAS as alterações aplicadas pelo script de correções
-- Deve ser executado APENAS em caso de problemas

-- =====================================================================
-- PARTE 1: PREPARAÇÃO
-- =====================================================================

SET session_replication_role = 'replica';

-- =====================================================================
-- PARTE 2: REMOVER VIEWS CRIADAS
-- =====================================================================

DROP VIEW IF EXISTS vw_estatisticas_empresa CASCADE;
DROP VIEW IF EXISTS vw_usuarios_completo CASCADE;

-- =====================================================================
-- PARTE 3: REMOVER TRIGGERS
-- =====================================================================

DROP TRIGGER IF EXISTS trg_validar_datas_contrato ON contratos;
DROP FUNCTION IF EXISTS validar_datas_contrato();

DROP TRIGGER IF EXISTS trg_atualizar_status_contrato ON contratos;
DROP FUNCTION IF EXISTS atualizar_status_contrato();

-- =====================================================================
-- PARTE 4: REMOVER COMENTÁRIOS
-- =====================================================================

COMMENT ON TABLE empresas IS NULL;
COMMENT ON TABLE contratos IS NULL;
COMMENT ON TABLE usuarios IS NULL;
COMMENT ON TABLE escolas IS NULL;
COMMENT ON TABLE gestores IS NULL;
COMMENT ON TABLE diretores IS NULL;
COMMENT ON TABLE professores IS NULL;
COMMENT ON TABLE alunos IS NULL;
COMMENT ON TABLE ai_preferences IS NULL;
COMMENT ON TABLE ai_resource_configs IS NULL;

COMMENT ON COLUMN usuarios.cognito_sub IS NULL;
COMMENT ON COLUMN usuarios.cognito_username IS NULL;
COMMENT ON COLUMN escolas.codigo_inep IS NULL;
COMMENT ON COLUMN contratos.valor_total IS NULL;
COMMENT ON COLUMN ai_resource_configs.temperature IS NULL;

-- =====================================================================
-- PARTE 5: REMOVER ÍNDICES CRIADOS
-- =====================================================================

-- Índices compostos
DROP INDEX IF EXISTS idx_usuarios_empresa_tipo;
DROP INDEX IF EXISTS idx_escolas_empresa_status;
DROP INDEX IF EXISTS idx_contratos_empresa_status;
DROP INDEX IF EXISTS idx_alunos_escola_serie_turma;
DROP INDEX IF EXISTS idx_professores_escola_status;
DROP INDEX IF EXISTS idx_diretores_escola_status;

-- Índices GIN
DROP INDEX IF EXISTS idx_usuarios_nome_gin;
DROP INDEX IF EXISTS idx_alunos_nome_gin;
DROP INDEX IF EXISTS idx_empresas_nome_gin;
DROP INDEX IF EXISTS idx_escolas_nome_gin;

-- Índices de data
DROP INDEX IF EXISTS idx_contratos_data_inicio;
DROP INDEX IF EXISTS idx_contratos_data_fim;
DROP INDEX IF EXISTS idx_usuarios_data_nascimento;
DROP INDEX IF EXISTS idx_alunos_data_matricula;

-- Índices parciais
DROP INDEX IF EXISTS idx_usuarios_ativos;
DROP INDEX IF EXISTS idx_escolas_ativas;
DROP INDEX IF EXISTS idx_contratos_ativos;
DROP INDEX IF EXISTS idx_alunos_ativos;

-- =====================================================================
-- PARTE 6: REMOVER CONSTRAINTS DE VALIDAÇÃO
-- =====================================================================

-- Constraints de email
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_email_contato;
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS chk_contratos_email_responsavel;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuarios_email;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_email;

-- Constraints de telefone
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_telefone;
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS chk_contratos_telefone_responsavel;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuarios_telefone;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_telefone;
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS chk_alunos_contato_responsavel;

-- Constraints de CNPJ
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_cnpj;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_cnpj;

-- Constraints de CEP
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_cep;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_cep;

-- Constraints de status
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_status;
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS chk_contratos_status;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuarios_status;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_status;
ALTER TABLE gestores DROP CONSTRAINT IF EXISTS chk_gestores_status;
ALTER TABLE diretores DROP CONSTRAINT IF EXISTS chk_diretores_status;
ALTER TABLE professores DROP CONSTRAINT IF EXISTS chk_professores_status;
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS chk_alunos_status;

-- Constraints de tipo_usuario
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuarios_tipo_usuario;

-- Constraints de UF
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS chk_empresas_estado;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_estado;
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS chk_usuarios_estado;

-- Constraints de código INEP
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_codigo_inep;

-- Constraints de valores
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS chk_contratos_valor_total;
ALTER TABLE contratos DROP CONSTRAINT IF EXISTS chk_contratos_numero_licencas;
ALTER TABLE escolas DROP CONSTRAINT IF EXISTS chk_escolas_capacidade_alunos;
ALTER TABLE ai_resource_configs DROP CONSTRAINT IF EXISTS chk_ai_resource_configs_temperature;
ALTER TABLE ai_resource_configs DROP CONSTRAINT IF EXISTS chk_ai_resource_configs_max_tokens;

-- =====================================================================
-- PARTE 7: REVERTER TIPOS DE DADOS
-- =====================================================================

-- Reverter para VARCHAR sem tamanho (estado original)
ALTER TABLE empresas ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE empresas ALTER COLUMN telefone TYPE VARCHAR;
ALTER TABLE empresas ALTER COLUMN email_contato TYPE VARCHAR;
ALTER TABLE empresas ALTER COLUMN cidade TYPE VARCHAR;
ALTER TABLE empresas ALTER COLUMN responsavel TYPE VARCHAR;
ALTER TABLE empresas ALTER COLUMN cargo_responsavel TYPE VARCHAR;

ALTER TABLE contratos ALTER COLUMN numero TYPE VARCHAR;
ALTER TABLE contratos ALTER COLUMN tipo_contrato TYPE VARCHAR;
ALTER TABLE contratos ALTER COLUMN status TYPE VARCHAR;
ALTER TABLE contratos ALTER COLUMN responsavel_contrato TYPE VARCHAR;
ALTER TABLE contratos ALTER COLUMN email_responsavel TYPE TEXT; -- Voltar para TEXT

ALTER TABLE usuarios ALTER COLUMN cognito_username TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN email TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN tipo_usuario TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN telefone TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN documento_identidade TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN genero TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN cidade TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN estado TYPE VARCHAR;
ALTER TABLE usuarios ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE escolas ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN tipo_escola TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN cidade TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN telefone TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN email TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN diretor_responsavel TYPE VARCHAR;
ALTER TABLE escolas ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE gestores ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE gestores ALTER COLUMN cargo TYPE VARCHAR;
ALTER TABLE gestores ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE diretores ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE diretores ALTER COLUMN cargo TYPE VARCHAR;
ALTER TABLE diretores ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE professores ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE professores ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE alunos ALTER COLUMN matricula TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN nome TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN turma TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN serie TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN turno TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN nome_responsavel TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN contato_responsavel TYPE VARCHAR;
ALTER TABLE alunos ALTER COLUMN status TYPE VARCHAR;

ALTER TABLE ai_preferences ALTER COLUMN default_ai TYPE VARCHAR;
ALTER TABLE ai_preferences ALTER COLUMN response_language TYPE VARCHAR;
ALTER TABLE ai_preferences ALTER COLUMN complexity_level TYPE VARCHAR;

ALTER TABLE ai_resource_configs ALTER COLUMN resource_name TYPE VARCHAR;
ALTER TABLE ai_resource_configs ALTER COLUMN resource_type TYPE VARCHAR;
ALTER TABLE ai_resource_configs ALTER COLUMN selected_model TYPE VARCHAR;
ALTER TABLE ai_resource_configs ALTER COLUMN model_name TYPE VARCHAR;

-- =====================================================================
-- PARTE 8: REMOVER FOREIGN KEYS ADICIONADAS
-- =====================================================================

ALTER TABLE gestores DROP CONSTRAINT IF EXISTS fk_gestores_empresa_id;
ALTER TABLE diretores DROP CONSTRAINT IF EXISTS fk_diretores_empresa_id;
ALTER TABLE professores DROP CONSTRAINT IF EXISTS fk_professores_empresa_id;
ALTER TABLE alunos DROP CONSTRAINT IF EXISTS fk_alunos_empresa_id;
ALTER TABLE ai_resource_configs DROP CONSTRAINT IF EXISTS fk_ai_resource_configs_resource_id;

-- =====================================================================
-- PARTE 9: CONFIGURAÇÕES FINAIS
-- =====================================================================

SET session_replication_role = 'origin';

-- =====================================================================
-- FIM DO SCRIPT DE ROLLBACK
-- =====================================================================
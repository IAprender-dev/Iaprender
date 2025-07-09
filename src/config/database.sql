-- =====================================================================
-- SISTEMA DE GESTÃO EDUCACIONAL - SCHEMA DE BANCO DE DADOS
-- Implementação por etapas da nova arquitetura hierárquica
-- =====================================================================

-- ✅ ETAPA 1: CRIAR A TABELA PRINCIPAL DE USUÁRIOS
-- Essa tabela guarda as informações locais dos usuários do sistema.
-- Cada usuário vem do Cognito, e aqui vamos guardar um espelho dele.

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,  -- ID interno do banco
    cognito_sub UUID UNIQUE NOT NULL,  -- ID do usuário no Cognito (global)
    email VARCHAR(100) UNIQUE NOT NULL,  -- email usado no login e para integração
    nome VARCHAR(100) NOT NULL,  -- nome completo
    tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'gestor', 'diretor', 'professor', 'aluno')),
    empresa_id INTEGER,  -- vai se ligar à tabela de empresas (vamos criar depois)
    telefone VARCHAR(20),
    documento_identidade VARCHAR(30),
    data_nascimento DATE,
    genero VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(50),
    estado VARCHAR(2),
    foto_perfil TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX idx_usuarios_cognito_sub ON usuarios(cognito_sub);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- Comentários nas colunas para documentação
COMMENT ON TABLE usuarios IS 'Tabela principal de usuários - espelho local dos usuários do AWS Cognito';
COMMENT ON COLUMN usuarios.cognito_sub IS 'Identificador único do usuário no AWS Cognito (UUID)';
COMMENT ON COLUMN usuarios.email IS 'Email de login do usuário, usado para integração com Cognito';
COMMENT ON COLUMN usuarios.tipo_usuario IS 'Tipo/role do usuário na hierarquia do sistema';
COMMENT ON COLUMN usuarios.empresa_id IS 'Referência para a tabela de empresas (será criada na próxima etapa)';

-- Trigger para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- =====================================================================
-- PRÓXIMAS ETAPAS (a serem implementadas):
-- ETAPA 2: Tabela de empresas/organizações
-- ETAPA 3: Tabela de contratos
-- ETAPA 4: Tabela de escolas
-- ETAPA 5: Relacionamentos e foreign keys
-- =====================================================================
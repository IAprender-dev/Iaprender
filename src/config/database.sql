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

-- ✅ ETAPA 2: CRIAR A TABELA DE EMPRESAS
-- Cada empresa representa uma organização no sistema (cliente).

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email_contato VARCHAR(100),
    endereco TEXT,
    cidade VARCHAR(50),
    estado VARCHAR(2),
    logo TEXT,
    criado_por INTEGER REFERENCES usuarios(id),  -- quem cadastrou a empresa
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_empresas_nome ON empresas(nome);
CREATE INDEX idx_empresas_criado_por ON empresas(criado_por);

-- Agora que empresas existem, conectamos a coluna empresa_id da tabela de usuarios
-- com a tabela empresas:
ALTER TABLE usuarios
ADD CONSTRAINT fk_empresa_usuarios FOREIGN KEY (empresa_id)
REFERENCES empresas(id) ON DELETE SET NULL;

-- Comentários nas colunas para documentação
COMMENT ON TABLE empresas IS 'Tabela de empresas/organizações clientes do sistema';
COMMENT ON COLUMN empresas.cnpj IS 'CNPJ da empresa (único no sistema)';
COMMENT ON COLUMN empresas.criado_por IS 'Usuário que cadastrou a empresa (FK para usuarios)';

-- Trigger para atualizar timestamp (caso precise de atualizado_em futuramente)
-- Por enquanto não implementado pois não há campo atualizado_em na especificação

-- ✅ ETAPA 9: CRIAR A TABELA DE HISTÓRICO DE TRANSFERÊNCIAS
-- Tabela para rastrear todas as transferências de alunos entre escolas

CREATE TABLE historico_transferencias (
    id SERIAL PRIMARY KEY,
    aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    escola_origem_id INTEGER NOT NULL REFERENCES escolas(id),
    escola_destino_id INTEGER NOT NULL REFERENCES escolas(id),
    data_transferencia TIMESTAMP NOT NULL,
    motivo_transferencia TEXT,
    matricula_anterior VARCHAR(20),
    nova_matricula VARCHAR(20),
    usuario_responsavel_id INTEGER NOT NULL REFERENCES usuarios(id),
    status_anterior VARCHAR(20),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance em consultas de histórico
CREATE INDEX idx_historico_transferencias_aluno_id ON historico_transferencias(aluno_id);
CREATE INDEX idx_historico_transferencias_data ON historico_transferencias(data_transferencia);
CREATE INDEX idx_historico_transferencias_escolas ON historico_transferencias(escola_origem_id, escola_destino_id);
CREATE INDEX idx_historico_transferencias_responsavel ON historico_transferencias(usuario_responsavel_id);

-- Comentários para documentação
COMMENT ON TABLE historico_transferencias IS 'Histórico completo de transferências de alunos entre escolas';
COMMENT ON COLUMN historico_transferencias.aluno_id IS 'Aluno que foi transferido';
COMMENT ON COLUMN historico_transferencias.escola_origem_id IS 'Escola de onde o aluno saiu';
COMMENT ON COLUMN historico_transferencias.escola_destino_id IS 'Escola para onde o aluno foi transferido';
COMMENT ON COLUMN historico_transferencias.data_transferencia IS 'Data/hora em que a transferência foi efetivada';
COMMENT ON COLUMN historico_transferencias.motivo_transferencia IS 'Motivo da transferência (mudança, reorganização, etc.)';
COMMENT ON COLUMN historico_transferencias.matricula_anterior IS 'Matrícula do aluno na escola de origem';
COMMENT ON COLUMN historico_transferencias.nova_matricula IS 'Nova matrícula gerada para a escola de destino';
COMMENT ON COLUMN historico_transferencias.usuario_responsavel_id IS 'Usuário que executou a transferência (admin/gestor/diretor)';
COMMENT ON COLUMN historico_transferencias.status_anterior IS 'Status do aluno antes da transferência';

-- =====================================================================
-- PRÓXIMAS ETAPAS (a serem implementadas):
-- ETAPA 3: Tabela de gestores
-- ETAPA 4: Tabela de contratos
-- ETAPA 5: Tabela de escolas
-- ETAPA 6: Relacionamentos finais
-- =====================================================================
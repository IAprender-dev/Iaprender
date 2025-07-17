// config-integracao.js - Configuração para integração do servidor
// Este arquivo será usado para organizar o código que você enviará por partes

const CONFIG = {
  // Configurações AWS
  AWS: {
    REGION: process.env.AWS_REGION || 'us-east-1',
    S3_BUCKET: process.env.S3_BUCKET_NAME || 'iaprender-bucket',
    DYNAMO_TABLE: process.env.DYNAMO_TABLE_NAME || 'arquivos_metadados',
    COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID: process.env.AWS_COGNITO_CLIENT_ID
  },

  // Configurações do banco
  DATABASE: {
    CONNECTION_STRING: process.env.DATABASE_URL,
    MAX_CONNECTIONS: 20,
    IDLE_TIMEOUT: 30000,
    CONNECTION_TIMEOUT: 2000
  },

  // Configurações de segurança
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || 'iaprender-secret-key',
    JWT_EXPIRATION: '24h',
    CORS_ORIGIN: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Modelos Bedrock
  BEDROCK_MODELS: {
    CLAUDE_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
    CLAUDE_SONNET: 'anthropic.claude-3-sonnet-20240229-v1:0',
    CLAUDE_OPUS: 'anthropic.claude-3-opus-20240229-v1:0'
  },

  // Tipos de arquivo suportados
  TIPOS_ARQUIVO: [
    'plano_aula',
    'atividade_educacional',
    'avaliacao',
    'material_didatico',
    'relatorio_pedagogico',
    'projeto_escolar',
    'comunicado',
    'documento_administrativo'
  ]
};

module.exports = CONFIG;
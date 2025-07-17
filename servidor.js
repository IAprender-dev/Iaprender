// servidor.js - Servidor Express conectado com Aurora PostgreSQL, DynamoDB, S3, Cognito e Bedrock

// 📦 Dependências necessárias
const express = require('express');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

require('dotenv').config();

// 🔧 Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔐 Configuração AWS
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// 📊 Clientes AWS
const bedrock = new BedrockRuntimeClient(awsConfig);
const s3 = new S3Client(awsConfig);
const dynamodb = new DynamoDBClient(awsConfig);
const cognito = new CognitoIdentityProviderClient(awsConfig);

// 🗄️ Configuração PostgreSQL (Aurora)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 🏗️ Configurações do sistema
const CONFIG = {
  S3_BUCKET: process.env.S3_BUCKET_NAME || 'iaprender-bucket',
  DYNAMO_TABLE: process.env.DYNAMO_TABLE_NAME || 'arquivos_metadados',
  COGNITO_USER_POOL_ID: process.env.AWS_COGNITO_USER_POOL_ID,
  JWT_SECRET: process.env.JWT_SECRET || 'iaprender-secret-key',
  BEDROCK_MODELS: {
    CLAUDE_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
    CLAUDE_SONNET: 'anthropic.claude-3-sonnet-20240229-v1:0',
    CLAUDE_OPUS: 'anthropic.claude-3-opus-20240229-v1:0'
  }
};

// 🔒 Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      sucesso: false, 
      erro: 'Token de autenticação necessário',
      codigo: 'TOKEN_AUSENTE' 
    });
  }

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    return res.status(401).json({ 
      sucesso: false, 
      erro: 'Token inválido',
      codigo: 'TOKEN_INVALIDO' 
    });
  }
};

// 🎯 Funções utilitárias
const gerarS3Key = (empresaId, contratoId, escolaId, usuarioId, tipoUsuario, tipoArquivo, uuid) => {
  return `empresa-${empresaId}/contrato-${contratoId}/escola-${escolaId}/${tipoUsuario}-${usuarioId}/ia-generated/${tipoArquivo}/${uuid}.json`;
};

const gerarHashPrompt = (prompt) => {
  return crypto.createHash('md5').update(prompt).digest('hex');
};

// 📝 Função para gerar documento via Bedrock
const gerarDocumentoIA = async (prompt, tipoArquivo, modelo = CONFIG.BEDROCK_MODELS.CLAUDE_HAIKU) => {
  try {
    console.log('🤖 Gerando documento via Bedrock:', { tipoArquivo, modelo });
    
    const promptCompleto = `Você é um especialista em educação brasileira seguindo a BNCC. Crie um ${tipoArquivo.replace('_', ' ')} detalhado e profissional em português brasileiro.

Prompt: ${prompt}

Responda em formato JSON estruturado com os campos apropriados para o tipo de documento solicitado. Seja detalhado e prático.`;

    const params = {
      modelId: modelo,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: promptCompleto
        }]
      })
    };

    const startTime = Date.now();
    const response = await bedrock.send(new InvokeModelCommand(params));
    const endTime = Date.now();

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const conteudo = responseBody.content[0].text;

    return {
      conteudo,
      tokens_utilizados: responseBody.usage?.output_tokens || 0,
      tempo_geracao_ms: endTime - startTime,
      modelo_utilizado: modelo
    };

  } catch (error) {
    console.error('❌ Erro ao gerar documento:', error);
    throw new Error(`Erro na geração IA: ${error.message}`);
  }
};

// 💾 Função para salvar no S3
const salvarNoS3 = async (s3Key, conteudo) => {
  try {
    const params = {
      Bucket: CONFIG.S3_BUCKET,
      Key: s3Key,
      Body: JSON.stringify(conteudo, null, 2),
      ContentType: 'application/json',
      Metadata: {
        'generated-by': 'iaprender-server',
        'timestamp': new Date().toISOString()
      }
    };

    await s3.send(new PutObjectCommand(params));
    console.log('✅ Documento salvo no S3:', s3Key);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar no S3:', error);
    throw new Error(`Erro no S3: ${error.message}`);
  }
};

// 🏷️ Função para salvar metadados no DynamoDB
const salvarMetadados = async (metadados) => {
  try {
    const params = {
      TableName: CONFIG.DYNAMO_TABLE,
      Item: {
        empresa_id: { N: metadados.empresa_id.toString() },
        uuid: { S: metadados.uuid },
        usuario_id: { N: metadados.usuario_id.toString() },
        tipo_usuario: { S: metadados.tipo_usuario },
        escola_id: { N: metadados.escola_id.toString() },
        contrato_id: { N: metadados.contrato_id.toString() },
        data_criacao: { S: metadados.data_criacao },
        tipo_arquivo: { S: metadados.tipo_arquivo },
        nome_usuario: { S: metadados.nome_usuario },
        s3_key: { S: metadados.s3_key },
        status: { S: metadados.status },
        tokens_utilizados: { N: metadados.tokens_utilizados.toString() },
        tempo_geracao_ms: { N: metadados.tempo_geracao_ms.toString() },
        modelo_utilizado: { S: metadados.modelo_utilizado },
        prompt_hash: { S: metadados.prompt_hash }
      }
    };

    await dynamodb.send(new PutItemCommand(params));
    console.log('✅ Metadados salvos no DynamoDB:', metadados.uuid);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar metadados:', error);
    throw new Error(`Erro no DynamoDB: ${error.message}`);
  }
};

// 📂 Função para salvar registro no PostgreSQL
const salvarRegistroPostgres = async (dados) => {
  try {
    const query = `
      INSERT INTO arquivos_ia (
        uuid, usuario_id, empresa_id, contrato_id, escola_id,
        tipo_arquivo, s3_key, status, tokens_utilizados,
        tempo_geracao_ms, modelo_utilizado, prompt_hash,
        data_criacao, atualizado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (uuid) DO UPDATE SET
        status = EXCLUDED.status,
        atualizado_em = EXCLUDED.atualizado_em
    `;

    const valores = [
      dados.uuid,
      dados.usuario_id,
      dados.empresa_id,
      dados.contrato_id,
      dados.escola_id,
      dados.tipo_arquivo,
      dados.s3_key,
      dados.status,
      dados.tokens_utilizados,
      dados.tempo_geracao_ms,
      dados.modelo_utilizado,
      dados.prompt_hash,
      dados.data_criacao,
      new Date()
    ];

    await pool.query(query, valores);
    console.log('✅ Registro salvo no PostgreSQL:', dados.uuid);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar no PostgreSQL:', error);
    // Não interrompe o fluxo se PostgreSQL falhar
    return false;
  }
};

// 🚀 ROTAS DA API

// 📊 Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Testar conexões
    const dbTest = await pool.query('SELECT 1');
    
    res.json({
      sucesso: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      servicos: {
        database: dbTest.rows ? 'OK' : 'ERROR',
        s3: 'OK',
        dynamodb: 'OK',
        bedrock: 'OK'
      }
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro no health check',
      detalhes: error.message
    });
  }
});

// 🤖 Gerar documento IA
app.post('/api/gerar-documento', authenticateToken, async (req, res) => {
  try {
    const { prompt, tipo_arquivo, modelo } = req.body;
    const usuario = req.usuario;

    // Validações
    if (!prompt || !tipo_arquivo) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Prompt e tipo_arquivo são obrigatórios',
        codigo: 'DADOS_INVALIDOS'
      });
    }

    // Dados do usuário (assumindo que vem do JWT)
    const dadosUsuario = {
      usuario_id: usuario.id,
      empresa_id: usuario.empresa_id || 1,
      contrato_id: usuario.contrato_id || 1,
      escola_id: usuario.escola_id || 1,
      tipo_usuario: usuario.tipo_usuario || 'professor',
      nome_usuario: usuario.nome || usuario.email
    };

    // Gerar documento via Bedrock
    const resultado = await gerarDocumentoIA(prompt, tipo_arquivo, modelo);

    // Gerar UUID e S3 key
    const uuid = uuidv4();
    const s3Key = gerarS3Key(
      dadosUsuario.empresa_id,
      dadosUsuario.contrato_id,
      dadosUsuario.escola_id,
      dadosUsuario.usuario_id,
      dadosUsuario.tipo_usuario,
      tipo_arquivo,
      uuid
    );

    // Documento completo
    const documentoCompleto = {
      uuid,
      prompt,
      conteudo: resultado.conteudo,
      tipo_arquivo,
      ...dadosUsuario,
      data_criacao: new Date().toISOString(),
      modelo_utilizado: resultado.modelo_utilizado,
      tokens_utilizados: resultado.tokens_utilizados,
      tempo_geracao_ms: resultado.tempo_geracao_ms,
      s3_key: s3Key,
      status: 'ativo'
    };

    // Salvar em paralelo
    const promisesSalvamento = [
      salvarNoS3(s3Key, documentoCompleto),
      salvarMetadados({
        ...documentoCompleto,
        prompt_hash: gerarHashPrompt(prompt)
      }),
      salvarRegistroPostgres({
        ...documentoCompleto,
        prompt_hash: gerarHashPrompt(prompt)
      })
    ];

    await Promise.allSettled(promisesSalvamento);

    res.json({
      sucesso: true,
      data: {
        uuid,
        s3_key: s3Key,
        conteudo: resultado.conteudo,
        tokens_utilizados: resultado.tokens_utilizados,
        tempo_geracao_ms: resultado.tempo_geracao_ms,
        modelo_utilizado: resultado.modelo_utilizado,
        tipo_arquivo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao gerar documento:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      codigo: 'ERRO_GERACAO'
    });
  }
});

// 📄 Buscar documento por UUID
app.get('/api/documento/:uuid', authenticateToken, async (req, res) => {
  try {
    const { uuid } = req.params;
    const usuario = req.usuario;

    // Buscar metadados no DynamoDB
    const params = {
      TableName: CONFIG.DYNAMO_TABLE,
      Key: {
        empresa_id: { N: (usuario.empresa_id || 1).toString() },
        uuid: { S: uuid }
      }
    };

    const result = await dynamodb.send(new GetItemCommand(params));
    
    if (!result.Item) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Documento não encontrado',
        codigo: 'DOCUMENTO_NAO_ENCONTRADO'
      });
    }

    // Buscar conteúdo no S3
    const s3Key = result.Item.s3_key.S;
    const s3Params = {
      Bucket: CONFIG.S3_BUCKET,
      Key: s3Key
    };

    const s3Result = await s3.send(new GetObjectCommand(s3Params));
    const conteudo = JSON.parse(await s3Result.Body.transformToString());

    res.json({
      sucesso: true,
      data: conteudo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar documento:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      codigo: 'ERRO_BUSCA'
    });
  }
});

// 📋 Listar documentos do usuário
app.get('/api/meus-documentos', authenticateToken, async (req, res) => {
  try {
    const usuario = req.usuario;
    const { limite = 10, tipo_arquivo } = req.query;

    const params = {
      TableName: CONFIG.DYNAMO_TABLE,
      KeyConditionExpression: 'empresa_id = :empresa_id',
      ExpressionAttributeValues: {
        ':empresa_id': { N: (usuario.empresa_id || 1).toString() }
      },
      ScanIndexForward: false,
      Limit: parseInt(limite)
    };

    if (tipo_arquivo) {
      params.FilterExpression = 'tipo_arquivo = :tipo_arquivo';
      params.ExpressionAttributeValues[':tipo_arquivo'] = { S: tipo_arquivo };
    }

    const result = await dynamodb.send(new QueryCommand(params));
    
    const documentos = result.Items?.map(item => ({
      uuid: item.uuid.S,
      tipo_arquivo: item.tipo_arquivo.S,
      data_criacao: item.data_criacao.S,
      tokens_utilizados: parseInt(item.tokens_utilizados.N),
      tempo_geracao_ms: parseInt(item.tempo_geracao_ms.N),
      modelo_utilizado: item.modelo_utilizado.S,
      status: item.status.S
    })) || [];

    res.json({
      sucesso: true,
      data: documentos,
      total: documentos.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao listar documentos:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      codigo: 'ERRO_LISTAGEM'
    });
  }
});

// 🔧 Listar modelos disponíveis
app.get('/api/modelos-disponiveis', authenticateToken, (req, res) => {
  res.json({
    sucesso: true,
    data: {
      modelos: CONFIG.BEDROCK_MODELS,
      tipos_arquivo: [
        'plano_aula',
        'atividade_educacional',
        'avaliacao',
        'material_didatico',
        'relatorio_pedagogico',
        'projeto_escolar',
        'comunicado',
        'documento_administrativo'
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// 📊 Estatísticas do usuário
app.get('/api/estatisticas', authenticateToken, async (req, res) => {
  try {
    const usuario = req.usuario;

    // Consultar PostgreSQL para estatísticas
    const query = `
      SELECT 
        COUNT(*) as total_documentos,
        SUM(tokens_utilizados) as total_tokens,
        AVG(tempo_geracao_ms) as tempo_medio,
        tipo_arquivo,
        COUNT(*) as count_por_tipo
      FROM arquivos_ia 
      WHERE empresa_id = $1 AND usuario_id = $2
      GROUP BY tipo_arquivo
      ORDER BY count_por_tipo DESC
    `;

    const result = await pool.query(query, [usuario.empresa_id || 1, usuario.id]);

    const estatisticas = {
      total_documentos: result.rows.reduce((acc, row) => acc + parseInt(row.count_por_tipo), 0),
      total_tokens: result.rows.reduce((acc, row) => acc + parseInt(row.total_tokens || 0), 0),
      tempo_medio: result.rows.length > 0 ? 
        Math.round(result.rows.reduce((acc, row) => acc + parseFloat(row.tempo_medio || 0), 0) / result.rows.length) : 0,
      por_tipo: result.rows.reduce((acc, row) => {
        acc[row.tipo_arquivo] = parseInt(row.count_por_tipo);
        return acc;
      }, {})
    };

    res.json({
      sucesso: true,
      data: estatisticas,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      codigo: 'ERRO_ESTATISTICAS'
    });
  }
});

// 🔑 Rota de teste de autenticação
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Aqui você implementaria a verificação real com Cognito
    // Para demo, vamos simular um token
    const token = jwt.sign(
      { 
        id: 1, 
        email: email,
        empresa_id: 1,
        contrato_id: 1,
        escola_id: 1,
        tipo_usuario: 'professor',
        nome: 'Professor Teste'
      },
      CONFIG.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      sucesso: true,
      token,
      usuario: {
        id: 1,
        email,
        tipo_usuario: 'professor',
        nome: 'Professor Teste'
      }
    });

  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
      codigo: 'ERRO_LOGIN'
    });
  }
});

// 🚫 Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    sucesso: false,
    erro: 'Erro interno do servidor',
    codigo: 'ERRO_INTERNO'
  });
});

// 🚦 Inicialização do servidor
const inicializarServidor = async () => {
  try {
    // Testar conexões
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL conectado');

    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arquivos_ia (
        uuid VARCHAR(36) PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        empresa_id INTEGER NOT NULL,
        contrato_id INTEGER NOT NULL,
        escola_id INTEGER NOT NULL,
        tipo_arquivo VARCHAR(50) NOT NULL,
        s3_key TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'ativo',
        tokens_utilizados INTEGER DEFAULT 0,
        tempo_geracao_ms INTEGER DEFAULT 0,
        modelo_utilizado VARCHAR(100),
        prompt_hash VARCHAR(32),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabela arquivos_ia verificada');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 Documentação: http://localhost:${PORT}/api/modelos-disponiveis`);
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// 🎯 Inicializar servidor
inicializarServidor();

module.exports = app;
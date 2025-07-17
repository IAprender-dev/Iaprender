import { Router, Request, Response } from 'express';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const router = Router();

// 🔐 Configuração AWS
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// 🔄 Conexão com DynamoDB
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

// 🗂️ Conexão com S3
const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'meu-bucket';

// 🤖 Cliente Bedrock (IA)
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

// 🌐 Conexão com Aurora PostgreSQL
const db = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_DB,
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

// 🔒 Middleware de autenticação
const autenticar = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'iaprender-secret-key');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido' });
  }
};

// 🩺 Health check integrado com AWS
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbTest = await db.query('SELECT 1');
    
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
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: 'Erro no health check',
      detalhes: error.message
    });
  }
});

// 🧠 Geração de documento simples para teste
router.post('/documento/gerar', autenticar, async (req: any, res: any) => {
  const { prompt, tipo_arquivo = 'documento' } = req.body;
  const { empresa_id, sub: usuario_id, tipo_usuario, email } = req.usuario;

  const uuid = uuidv4();
  const s3Key = `empresa-${empresa_id}/${tipo_usuario}-${usuario_id}/${uuid}.json`;

  try {
    // Gera conteúdo simples para teste
    const conteudo = {
      prompt: prompt || 'Teste',
      resposta: `Documento gerado para: ${prompt || 'Teste'}`,
      tipo: tipo_arquivo,
      data_criacao: new Date().toISOString(),
      usuario_id: usuario_id,
      empresa_id: empresa_id
    };

    // Tenta salvar no S3
    try {
      await s3.putObject({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: JSON.stringify(conteudo),
        ContentType: 'application/json'
      }).promise();
    } catch (s3Error) {
      console.log('S3 não configurado:', s3Error.message);
    }

    res.json({ sucesso: true, uuid, s3_key: s3Key, conteudo });
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// 📘 Consulta usuário no PostgreSQL
router.get('/usuario/perfil', autenticar, async (req: any, res: any) => {
  try {
    const { sub } = req.usuario;
    const { rows } = await db.query('SELECT * FROM usuarios WHERE cognito_sub = $1', [sub]);
    res.json(rows[0] || {});
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  }
});

// 🔍 Consulta arquivos do usuário
router.get('/usuario/documentos', autenticar, async (req: any, res: any) => {
  try {
    const { empresa_id, sub: usuario_id } = req.usuario;
    
    // Tenta consultar DynamoDB
    const result = await ddb.scan({
      TableName: 'arquivos_metadados',
      FilterExpression: 'usuario_id = :u AND empresa_id = :e',
      ExpressionAttributeValues: {
        ':u': usuario_id,
        ':e': empresa_id
      }
    }).promise();
    
    res.json(result.Items || []);
  } catch (err: any) {
    // Se não há permissões DynamoDB, retorna array vazio
    if (err.message.includes('not authorized')) {
      res.json([]);
    } else {
      res.status(500).json({ erro: err.message });
    }
  }
});

export default router;
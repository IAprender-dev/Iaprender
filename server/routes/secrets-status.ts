import express from 'express';
import { Request, Response } from 'express';
import { SecretsManager } from '../config/secrets';

const router = express.Router();

// Middleware de autenticação para administradores
const authenticateAdmin = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret_key_iaprender_2025');
    req.user = decoded;
    
    // Verificar se é admin
    if (!req.user || req.user.tipo_usuario !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// GET /api/secrets/health - Status das credenciais (público para debugging)
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = SecretsManager.checkSystemHealth();
    const safeConfig = SecretsManager.getSafeConfig();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system_health: health,
      configuration: safeConfig
    });
  } catch (error) {
    console.error('Erro ao verificar status das credenciais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/secrets/report - Relatório completo (apenas admins)
router.get('/report', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const report = SecretsManager.generateStatusReport();
    const allSecrets = SecretsManager.getAllSecrets();
    
    // Mascarar dados sensíveis para o relatório
    const maskedSecrets = {
      aws: {
        ...allSecrets.aws,
        access_key: allSecrets.aws.access_key ? '***masked***' : undefined,
        secret_key: allSecrets.aws.secret_key ? '***masked***' : undefined,
        cognito_client_secret: allSecrets.aws.cognito_client_secret ? '***masked***' : undefined
      },
      database: {
        ...allSecrets.database,
        database_url: allSecrets.database.database_url ? '***masked***' : undefined,
        pgpassword: allSecrets.database.pgpassword ? '***masked***' : undefined
      },
      ai_apis: Object.fromEntries(
        Object.entries(allSecrets.ai_apis).map(([key, value]) => [
          key,
          value ? '***masked***' : undefined
        ])
      ),
      jwt: {
        ...allSecrets.jwt,
        jwt_secret: allSecrets.jwt.jwt_secret ? '***masked***' : undefined
      },
      email: Object.fromEntries(
        Object.entries(allSecrets.email).map(([key, value]) => [
          key,
          key.includes('password') || key.includes('key') ? (value ? '***masked***' : undefined) : value
        ])
      ),
      application: allSecrets.application
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      report_text: report,
      masked_configuration: maskedSecrets,
      health_check: SecretsManager.checkSystemHealth()
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de credenciais:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/secrets/validate/:service - Validar serviço específico
router.get('/validate/:service', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const service = req.params.service.toLowerCase();
    let validation;

    switch (service) {
      case 'aws':
      case 'cognito':
        validation = SecretsManager.validateAWSCredentials();
        break;
      case 'database':
      case 'db':
        validation = SecretsManager.validateDatabaseCredentials();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Serviço não reconhecido. Use: aws, cognito, database, db'
        });
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service,
      validation: {
        is_valid: validation.isValid,
        missing_credentials: validation.missingCredentials,
        status: validation.isValid ? 'ok' : 'error'
      }
    });
  } catch (error) {
    console.error('Erro ao validar serviço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/secrets/test-connection - Testar conexões (apenas admins)
router.post('/test-connection', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { service } = req.body;
    const results: any = {};

    if (!service || service === 'database') {
      // Testar conexão com banco de dados
      try {
        const { pool } = await import('../db');
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as test');
        client.release();
        results.database = {
          status: 'ok',
          message: 'Conexão com banco de dados estabelecida',
          test_result: result.rows[0]
        };
      } catch (error) {
        results.database = {
          status: 'error',
          message: 'Falha na conexão com banco de dados',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
      }
    }

    if (!service || service === 'cognito') {
      // Testar configuração do Cognito
      const awsCreds = SecretsManager.getAWSCredentials();
      const validation = SecretsManager.validateAWSCredentials();
      
      results.cognito = {
        status: validation.isValid ? 'ok' : 'error',
        message: validation.isValid ? 'Configuração do Cognito válida' : 'Configuração do Cognito incompleta',
        missing_credentials: validation.missingCredentials,
        user_pool_id: awsCreds.cognito_user_pool_id ? 'configurado' : 'não configurado',
        client_id: awsCreds.cognito_client_id ? 'configurado' : 'não configurado',
        domain: awsCreds.cognito_domain ? 'configurado' : 'não configurado'
      };
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connection_tests: results
    });
  } catch (error) {
    console.error('Erro ao testar conexões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
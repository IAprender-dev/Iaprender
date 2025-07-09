import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';
import { executeQuery } from '../config/database.js';

// Configuração do cliente JWKS para AWS Cognito
const jwksUri = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

const client = jwksClient({
  jwksUri,
  requestHeaders: {
    'User-Agent': 'IAprender-Auth-Service/1.0.0'
  },
  timeout: 30000, // 30 segundos
  cache: true,
  cacheMaxEntries: 10, // Aumentado para mais chaves
  cacheMaxAge: 600000, // 10 minutos
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  strictSsl: true, // Verificação SSL rigorosa
  proxy: false // Sem proxy
});

// Função para obter a chave de assinatura
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('❌ Erro ao obter chave de assinatura:', err);
      return callback(err);
    }
    
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Função principal para verificar token JWT
export const verificarToken = (token) => {
  return new Promise((resolve, reject) => {
    // Passo 1: Decodificar o header JWT sem verificação
    let decodedHeader;
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header) {
        throw new Error('Token JWT inválido - header não encontrado');
      }
      decodedHeader = decoded.header;
      console.log('📋 Header JWT decodificado:', decodedHeader);
    } catch (error) {
      console.error('❌ Erro ao decodificar header JWT:', error.message);
      return reject({
        error: 'INVALID_JWT_HEADER',
        message: 'Não foi possível decodificar o header do token JWT',
        details: error.message
      });
    }

    // Passo 2: Verificar se o header possui kid (Key ID)
    if (!decodedHeader.kid) {
      console.error('❌ Token JWT sem Key ID (kid)');
      return reject({
        error: 'MISSING_KEY_ID',
        message: 'Token JWT não possui Key ID (kid) no header',
        details: 'O token deve conter um kid para localizar a chave pública'
      });
    }

    // Passo 3: Buscar a chave pública correspondente
    console.log(`🔍 Buscando chave pública para kid: ${decodedHeader.kid}`);
    client.getSigningKey(decodedHeader.kid, (err, key) => {
      if (err) {
        console.error('❌ Erro ao buscar chave pública:', err.message);
        return reject({
          error: 'JWKS_ERROR',
          message: 'Não foi possível obter a chave pública do JWKS',
          details: err.message
        });
      }

      const signingKey = key.getPublicKey();
      console.log('✅ Chave pública obtida com sucesso');

      // Passo 4: Verificar se o token é válido
      jwt.verify(token, signingKey, {
        audience: process.env.COGNITO_CLIENT_ID,
        issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
        algorithms: ['RS256']
      }, (verifyErr, decoded) => {
        if (verifyErr) {
          console.error('❌ Erro na verificação do token:', verifyErr.message);
          return reject({
            error: 'TOKEN_VERIFICATION_FAILED',
            message: 'Token JWT inválido ou expirado',
            details: verifyErr.message
          });
        }

        // Passo 5: Extrair informações importantes do payload
        const payload = {
          sub: decoded.sub,
          email: decoded.email,
          groups: decoded['cognito:groups'] || [],
          empresa_id: decoded['custom:empresa_id'] || null,
          nome: decoded.name || decoded['custom:nome'] || null,
          token_use: decoded.token_use,
          aud: decoded.aud,
          iss: decoded.iss,
          exp: decoded.exp,
          iat: decoded.iat,
          auth_time: decoded.auth_time,
          username: decoded['cognito:username'] || null
        };

        console.log('✅ Token verificado com sucesso');
        console.log('📋 Payload extraído:', {
          sub: payload.sub,
          email: payload.email,
          groups: payload.groups,
          empresa_id: payload.empresa_id,
          nome: payload.nome,
          expires_in: payload.exp - Math.floor(Date.now() / 1000)
        });

        resolve(payload);
      });
    });
  });
};

// Middleware para verificar token JWT (versão refatorada usando verificarToken)
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Token de acesso requerido',
      error: 'NO_TOKEN'
    });
  }
  
  try {
    // Usar a função verificarToken para validar o token
    const payload = await verificarToken(token);
    
    // Buscar informações do usuário no banco local
    const userResult = await executeQuery(
      'SELECT id, nome, email, tipo_usuario, empresa_id, status FROM usuarios WHERE cognito_sub = $1',
      [payload.sub]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Usuário não encontrado no sistema',
        error: 'USER_NOT_FOUND'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verificar se o usuário está ativo
    if (user.status !== 'ativo') {
      return res.status(403).json({ 
        message: 'Usuário desativado',
        error: 'USER_INACTIVE'
      });
    }
    
    // Adicionar informações do usuário ao request
    req.user = {
      id: user.id,
      cognitoSub: payload.sub,
      nome: payload.nome || user.nome,
      email: payload.email || user.email,
      tipo_usuario: user.tipo_usuario,
      empresa_id: payload.empresa_id || user.empresa_id,
      groups: payload.groups,
      tokenUse: payload.token_use,
      exp: payload.exp,
      iat: payload.iat,
      auth_time: payload.auth_time,
      username: payload.username
    };
    
    console.log(`✅ Usuário autenticado: ${req.user.nome} (${req.user.email}) - Tipo: ${req.user.tipo_usuario}`);
    next();
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    return res.status(403).json({ 
      message: error.message || 'Token inválido ou expirado',
      error: error.error || 'INVALID_TOKEN'
    });
  }
};

// Middleware para autorizar por tipo de usuário
export const authorize = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    const userType = req.user.tipo_usuario;
    
    if (!allowedTypes.includes(userType)) {
      console.warn(`⚠️ Acesso negado para ${req.user.nome} (${userType}). Requer: ${allowedTypes.join(', ')}`);
      return res.status(403).json({ 
        message: 'Acesso negado. Permissões insuficientes.',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedTypes,
        current: userType
      });
    }
    
    next();
  };
};

// Middleware para autorizar por grupos do Cognito
export const authorizeGroups = (allowedGroups) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }
    
    const userGroups = req.user.groups || [];
    const hasRequiredGroup = allowedGroups.some(group => userGroups.includes(group));
    
    if (!hasRequiredGroup) {
      console.warn(`⚠️ Acesso negado para ${req.user.nome}. Grupos do usuário: ${userGroups.join(', ')}. Requer: ${allowedGroups.join(', ')}`);
      return res.status(403).json({ 
        message: 'Acesso negado. Grupo insuficiente.',
        error: 'INSUFFICIENT_GROUP_PERMISSIONS',
        required: allowedGroups,
        current: userGroups
      });
    }
    
    next();
  };
};

// Middleware para verificar se o usuário pertence à mesma empresa
export const authorizeCompany = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Usuário não autenticado',
      error: 'NOT_AUTHENTICATED'
    });
  }
  
  // Admins podem acessar qualquer empresa
  if (req.user.tipo_usuario === 'admin') {
    return next();
  }
  
  const userEmpresaId = req.user.empresa_id;
  
  if (!userEmpresaId) {
    return res.status(403).json({ 
      message: 'Usuário não possui empresa vinculada',
      error: 'NO_COMPANY_LINKED'
    });
  }
  
  // Verificar se o recurso solicitado pertence à mesma empresa
  const resourceEmpresaId = req.params.empresa_id || req.body.empresa_id || req.query.empresa_id;
  
  if (resourceEmpresaId && parseInt(resourceEmpresaId) !== userEmpresaId) {
    console.warn(`⚠️ Acesso negado para ${req.user.nome}. Empresa do usuário: ${userEmpresaId}, Empresa solicitada: ${resourceEmpresaId}`);
    return res.status(403).json({ 
      message: 'Acesso negado. Recurso de empresa diferente.',
      error: 'DIFFERENT_COMPANY_ACCESS'
    });
  }
  
  next();
};

// Middleware para verificar se o token está próximo do vencimento
export const checkTokenExpiration = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  const now = Math.floor(Date.now() / 1000);
  const timeToExpiry = req.user.exp - now;
  
  // Se o token expira em menos de 5 minutos, adicionar header de aviso
  if (timeToExpiry < 300) {
    res.setHeader('X-Token-Expires-In', timeToExpiry);
    res.setHeader('X-Token-Refresh-Needed', 'true');
    console.warn(`⚠️ Token próximo do vencimento para ${req.user.nome}. Expira em ${timeToExpiry} segundos`);
  }
  
  next();
};

// Função para decodificar token sem verificação (apenas para debug)
export const decodeTokenUnsafe = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error.message);
    return null;
  }
};

// Middleware para logging de auditoria
export const auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log da ação do usuário
      const logData = {
        action,
        user: req.user ? {
          id: req.user.id,
          nome: req.user.nome,
          email: req.user.email,
          tipo_usuario: req.user.tipo_usuario
        } : null,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        statusCode: res.statusCode
      };
      
      console.log(`📋 Auditoria: ${action} - ${req.user?.nome || 'Anônimo'} - ${req.method} ${req.path} - Status: ${res.statusCode}`);
      
      // Aqui você pode salvar no banco de dados se necessário
      // await executeQuery('INSERT INTO audit_logs (action, user_data, request_data, created_at) VALUES ($1, $2, $3, NOW())', 
      //   [action, JSON.stringify(logData.user), JSON.stringify(logData)]);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Middleware para validar origem da requisição
export const validateOrigin = (req, res, next) => {
  const origin = req.get('Origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`⚠️ Origem não permitida: ${origin}`);
    return res.status(403).json({ 
      message: 'Origem não permitida',
      error: 'INVALID_ORIGIN'
    });
  }
  
  next();
};

export default {
  verificarToken,
  authenticateToken,
  authorize,
  authorizeGroups,
  authorizeCompany,
  checkTokenExpiration,
  decodeTokenUnsafe,
  auditLog,
  validateOrigin
};
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-client');

// AWS Cognito configuration
const cognitoConfig = {
  region: process.env.COGNITO_REGION || 'us-east-1',
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID,
  clientSecret: process.env.COGNITO_CLIENT_SECRET,
  domain: process.env.COGNITO_DOMAIN,
  redirectUri: process.env.COGNITO_REDIRECT_URI
};

// JWKS client configuration for token verification
const jwksUri = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`;

const client = jwksClient({
  jwksUri,
  requestHeaders: {}, // optional
  timeout: 30000, // defaults to 30s
  cache: true,
  cacheMaxEntries: 5, // default value
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
});

// Function to get signing key
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

// Function to verify JWT token
const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: cognitoConfig.clientId,
      issuer: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`,
      tokenUse: 'access', // or 'id' for ID tokens
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Function to decode token without verification (for development)
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

// Validate configuration
const validateConfig = () => {
  const required = ['userPoolId', 'clientId', 'region'];
  const missing = required.filter(key => !cognitoConfig[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Configurações AWS Cognito faltando: ${missing.join(', ')}`);
    return false;
  }
  
  console.log('✅ Configuração AWS Cognito validada');
  return true;
};

module.exports = {
  cognitoConfig,
  verifyToken,
  decodeToken,
  validateConfig
};
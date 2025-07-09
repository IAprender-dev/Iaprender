// Main routes file - will register all route modules

import express from 'express';
const router = express.Router();

// Import route modules
import cognitoRoutes from './cognito.js';
// const authRoutes = require('./auth');
// const userRoutes = require('./users');
// const schoolRoutes = require('./schools');
// const adminRoutes = require('./admin');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register route modules
router.use('/cognito', cognitoRoutes);
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/schools', schoolRoutes);
// router.use('/admin', adminRoutes);

// Placeholder routes for testing
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de Gestão Escolar - API funcionando',
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
    cognito: process.env.COGNITO_USER_POOL_ID ? 'Configurado' : 'Não configurado'
  });
});

// Debug endpoint para testar configuração do Cognito
router.get('/debug-cognito', (req, res) => {
  try {
    const config = {
      user_pool_id: process.env.COGNITO_USER_POOL_ID || 'NÃO CONFIGURADO',
      region: process.env.AWS_REGION || 'us-east-1',
      access_key_configured: process.env.AWS_ACCESS_KEY_ID ? 'SIM' : 'NÃO',
      secret_key_configured: process.env.AWS_SECRET_ACCESS_KEY ? 'SIM' : 'NÃO',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Configuração AWS Cognito',
      config,
      status: config.user_pool_id !== 'NÃO CONFIGURADO' && 
               config.access_key_configured === 'SIM' && 
               config.secret_key_configured === 'SIM' ? 'CONFIGURADO' : 'INCOMPLETO'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar configuração',
      error: error.message
    });
  }
});

export default router;
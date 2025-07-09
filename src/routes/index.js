// Main routes file - will register all route modules

import express from 'express';
const router = express.Router();

// Import route modules
import usuarioRoutes from './usuarios.js';
import alunoRoutes from './alunos.js';
// import escolaRoutes from './escolas.js';

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
router.use('/usuarios', usuarioRoutes);
router.use('/alunos', alunoRoutes);
// router.use('/escolas', escolaRoutes);

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

export default router;
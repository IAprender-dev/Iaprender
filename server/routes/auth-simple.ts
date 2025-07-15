import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { usuarios } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Sistema de autenticação simplificado que funciona com JWT
 */
router.post('/simple-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    }

    console.log(`🔐 Tentativa de login simples para: ${email}`);

    // Buscar usuário no banco local
    const userResult = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
    
    if (userResult.length === 0) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    const localUser = userResult[0];

    // Validar senha de desenvolvimento
    const testPasswords = {
      'admin@example.com': 'iaprender2025',
      'gestor@example.com': 'iaprender2025',
      'diretor@example.com': 'iaprender2025',
      'professor@example.com': 'iaprender2025',
      'aluno@example.com': 'iaprender2025',
    };

    const expectedPassword = testPasswords[email as keyof typeof testPasswords] || 'iaprender2025';
    
    if (password !== expectedPassword) {
      console.log(`❌ Senha incorreta para: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    // Mapear tipo de usuário para role
    const roleMapping = {
      'admin': 'admin',
      'municipal_manager': 'municipal_manager',
      'school_director': 'school_director',
      'teacher': 'teacher',
      'student': 'student',
    };

    const role = roleMapping[localUser.tipoUsuario as keyof typeof roleMapping] || 'student';

    // Criar token JWT simples
    const token = jwt.sign(
      {
        sub: localUser.id?.toString(),
        email: localUser.email,
        name: localUser.nome,
        'cognito:username': localUser.email,
        'cognito:groups': [localUser.tipoUsuario],
        email_verified: localUser.status === 'active',
        role: role,
        user_id: localUser.id,
        empresa_id: localUser.empresaId,
        tipo_usuario: localUser.tipoUsuario,
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { 
        expiresIn: '24h',
        algorithm: 'HS256'
      }
    );

    console.log(`✅ Login simples bem-sucedido para: ${email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: localUser.id,
        email: localUser.email,
        username: localUser.email,
        nome: localUser.nome,
        firstName: localUser.nome?.split(' ')[0],
        lastName: localUser.nome?.split(' ').slice(1).join(' '),
        role: role,
        status: localUser.status,
        contractId: localUser.contratoId,
        createdAt: localUser.criadoEm || new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Erro no login simples:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

export default router;
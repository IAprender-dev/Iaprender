import { Router } from 'express';
import { SecretsManager } from '../config/secrets.js';
import { storage } from '../storage.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { CognitoAdminAuth } from '../services/CognitoAdminAuth.js';

const router = Router();

/**
 * Endpoint para login com interface direta usando AWS Cognito
 */
router.post('/hybrid-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios',
      });
    }

    console.log(`🔐 Tentativa de login híbrido para: ${email}`);

    // Primeiro, tentar autenticar no AWS Cognito
    let cognitoUser = null;
    try {
      const cognitoAuth = new CognitoAdminAuth();
      const authResult = await cognitoAuth.authenticate(email, password);
      
      if (authResult.success && authResult.user) {
        cognitoUser = authResult.user;
        console.log(`✅ Usuário autenticado no Cognito: ${email}`);
      }
    } catch (cognitoError) {
      console.log(`⚠️ Falha na autenticação Cognito para ${email}:`, cognitoError);
      // Continuar com validação local se Cognito falhar
    }

    // Se não conseguiu autenticar no Cognito, verificar no banco local
    let localUser = await storage.getUserByEmail(email);
    
    if (!localUser && !cognitoUser) {
      console.log(`❌ Usuário não encontrado no Cognito nem no banco local: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado no sistema',
      });
    }

    // Se temos usuário do Cognito mas não no banco local, vamos sincronizar
    if (cognitoUser && !localUser) {
      console.log(`🔄 Sincronizando usuário do Cognito para o banco local: ${email}`);
      
      try {
        // Criar usuário local baseado nos dados do Cognito
        const insertUserData = {
          cognitoSub: cognitoUser.sub || `cognito-${email}`,
          email: cognitoUser.email,
          nome: cognitoUser.name || cognitoUser.email.split('@')[0],
          tipoUsuario: mapCognitoGroupsToUserType(cognitoUser.groups || []),
          status: cognitoUser.enabled ? 'active' : 'inactive',
          empresaId: 12, // Empresa padrão para desenvolvimento
        };

        localUser = await storage.createUser(insertUserData);
        console.log(`✅ Usuário sincronizado com sucesso: ${email}`);
      } catch (syncError) {
        console.error(`❌ Erro ao sincronizar usuário do Cognito:`, syncError);
        // Se falhar a sincronização, usar dados do Cognito temporariamente
        localUser = {
          id: Date.now(), // ID temporário
          email: cognitoUser.email,
          nome: cognitoUser.name || cognitoUser.email.split('@')[0],
          tipoUsuario: mapCognitoGroupsToUserType(cognitoUser.groups || []),
          status: cognitoUser.enabled ? 'active' : 'inactive',
          empresaId: 12,
        };
      }
    }

    // Se não autenticou no Cognito, validar senha local
    if (!cognitoUser) {
      const isValidPassword = await validatePassword(password, localUser.email);
      
      if (!isValidPassword) {
        console.log(`❌ Senha incorreta para: ${email}`);
        return res.status(401).json({
          success: false,
          error: 'Credenciais inválidas',
        });
      }
    }

    // Criar token JWT próprio do sistema
    const jwtToken = jwt.sign(
      {
        id: localUser.id,
        email: localUser.email,
        nome: localUser.nome,
        role: localUser.role || mapUserTypeToRole(localUser.tipoUsuario),
        tipo_usuario: localUser.tipoUsuario,
        empresa_id: localUser.empresaId,
        status: localUser.status,
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { expiresIn: '24h' }
    );

    console.log(`✅ Login híbrido bem-sucedido para: ${email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: jwtToken,
      user: {
        id: localUser.id,
        email: localUser.email,
        nome: localUser.nome,
        role: localUser.role || mapUserTypeToRole(localUser.tipoUsuario),
        tipo_usuario: localUser.tipoUsuario,
        status: localUser.status,
        empresa_id: localUser.empresaId,
      },
    });

  } catch (error: any) {
    console.error('❌ Erro no login híbrido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * Validação de senha simples para desenvolvimento
 */
async function validatePassword(password: string, email: string): Promise<boolean> {
  // Para desenvolvimento, aceitar senhas específicas baseadas no email
  const testPasswords = {
    'admin@example.com': 'AdminPass123!',
    'gestor@example.com': 'GestorPass123!',
    'diretor@example.com': 'DiretorPass123!',
    'professor@example.com': 'ProfessorPass123!',
    'aluno@example.com': 'AlunoPass123!',
  };

  // Verificar se é uma senha de teste
  if (testPasswords[email as keyof typeof testPasswords] === password) {
    return true;
  }

  // Para outros emails, aceitar uma senha padrão para desenvolvimento
  if (password === 'dev123456' || password === 'iaprender2025') {
    return true;
  }

  return false;
}

/**
 * Endpoint para verificar se o login híbrido está disponível
 */
router.get('/hybrid-status', async (req, res) => {
  try {
    res.json({
      success: true,
      configured: true,
      method: 'HYBRID_PASSWORD',
      available: true,
      description: 'Login direto com validação local para desenvolvimento',
    });
  } catch (error: any) {
    console.error('❌ Erro ao verificar status híbrido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar configuração',
    });
  }
});

export default router;
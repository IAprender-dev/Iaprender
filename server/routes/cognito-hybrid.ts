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

    // Criar token JWT compatível com Cognito
    const jwtToken = jwt.sign(
      {
        sub: localUser.id?.toString() || Date.now().toString(),
        email: localUser.email,
        name: localUser.nome,
        given_name: localUser.nome?.split(' ')[0],
        family_name: localUser.nome?.split(' ').slice(1).join(' '),
        'cognito:username': localUser.email,
        'cognito:groups': [mapUserTypeToGroup(localUser.tipoUsuario)],
        'custom:empresa_id': localUser.empresaId?.toString(),
        'custom:tipo_usuario': localUser.tipoUsuario,
        email_verified: localUser.status === 'active',
        aud: process.env.AWS_COGNITO_CLIENT_ID || 'test-client-id',
        iss: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID || 'test-pool-id'}`,
        token_use: 'id',
        auth_time: Math.floor(Date.now() / 1000),
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || 'test_secret_key_iaprender_2025',
      { 
        expiresIn: '24h',
        algorithm: 'HS256' // Simulando o formato do Cognito
      }
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
        role: localUser.role || mapUserTypeToRole(localUser.tipoUsuario || 'student'),
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
 * Mapeia grupos do Cognito para tipos de usuário
 */
function mapCognitoGroupsToUserType(groups: string[]): string {
  if (!groups || groups.length === 0) return 'student';
  
  const groupMap: { [key: string]: string } = {
    'Admin': 'admin',
    'AdminMaster': 'admin',
    'Gestores': 'municipal_manager',
    'GestorMunicipal': 'municipal_manager',
    'Diretores': 'school_director',
    'Diretor': 'school_director',
    'Professores': 'teacher',
    'Professor': 'teacher',
    'Alunos': 'student',
    'Aluno': 'student',
  };

  // Retornar o primeiro grupo mapeado encontrado
  for (const group of groups) {
    if (groupMap[group]) {
      return groupMap[group];
    }
  }

  return 'student'; // Default
}

/**
 * Mapeia tipos de usuário para grupos do Cognito
 */
function mapUserTypeToGroup(userType: string): string {
  const typeMap: { [key: string]: string } = {
    'admin': 'Admin',
    'municipal_manager': 'Gestores',
    'school_director': 'Diretores', 
    'teacher': 'Professores',
    'student': 'Alunos',
  };

  return typeMap[userType] || 'Alunos';
}

/**
 * Mapeia tipos de usuário para roles
 */
function mapUserTypeToRole(userType: string): string {
  const typeMap: { [key: string]: string } = {
    'admin': 'admin',
    'municipal_manager': 'municipal_manager',
    'school_director': 'school_director',
    'teacher': 'teacher',
    'student': 'student',
  };

  return typeMap[userType] || 'student';
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
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, companies, contracts, municipalManagers } from '../../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUserCompanyInfo } from '../utils/municipal-helpers';
import { authenticateMunicipal } from '../utils/auth';
import { CognitoService } from '../utils/cognito-service';

const router = Router();

// GET /api/municipal/users/list - Listar usuários da empresa do gestor
router.get('/list', authenticateMunicipal, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Buscar informações da empresa do usuário
    const userCompany = await getUserCompanyInfo(userId);
    console.log('🔍 [USERS-LIST] User company ID:', userCompany.companyId);

    // Buscar todos os usuários da mesma empresa
    const usersData = await db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        role: users.role,
        cognitoGroup: users.cognito_group,
        cognitoStatus: users.cognito_status,
        companyId: users.companyId,
        contractId: users.contractId,
        companyName: companies.name,
        contractName: contracts.schoolName,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .leftJoin(contracts, eq(users.contractId, contracts.id))
      .where(eq(users.companyId, userCompany.companyId));

    console.log('✅ [USERS-LIST] Encontrados', usersData.length, 'usuários da empresa', userCompany.companyId);

    // Estatísticas
    const stats = {
      total: usersData.length,
      active: usersData.filter(u => u.cognitoStatus === 'CONFIRMED').length,
      gestores: usersData.filter(u => u.cognitoGroup === 'Gestores').length,
      diretores: usersData.filter(u => u.cognitoGroup === 'Diretores').length,
      professores: usersData.filter(u => u.cognitoGroup === 'Professores').length,
      alunos: usersData.filter(u => u.cognitoGroup === 'Alunos').length,
    };

    res.json({
      success: true,
      users: usersData,
      statistics: stats
    });

  } catch (error) {
    console.error('❌ [USERS-LIST] Erro ao buscar usuários:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users', 
      error: error.message 
    });
  }
});

// GET /api/municipal/users/companies - Listar empresas para formulário
router.get('/companies', authenticateMunicipal, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Buscar informações da empresa do usuário
    const userCompany = await getUserCompanyInfo(userId);

    // Retornar apenas a empresa do usuário logado
    const companiesData = await db
      .select({
        id: companies.id,
        name: companies.name,
      })
      .from(companies)
      .where(eq(companies.id, userCompany.companyId));

    console.log('✅ [COMPANIES] Retornando empresa do usuário:', companiesData);

    res.json({
      success: true,
      companies: companiesData
    });

  } catch (error) {
    console.error('❌ [COMPANIES] Erro ao buscar empresas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch companies', 
      error: error.message 
    });
  }
});

// GET /api/municipal/users/contracts/:companyId - Listar contratos de uma empresa
router.get('/contracts/:companyId', authenticateMunicipal, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const companyId = parseInt(req.params.companyId);
    
    // Verificar se o usuário tem acesso a esta empresa
    const userCompany = await getUserCompanyInfo(userId);
    if (userCompany.companyId !== companyId) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this company' 
      });
    }

    // Buscar contratos da empresa
    const contractsData = await db
      .select({
        id: contracts.id,
        schoolName: contracts.schoolName,
        contractNumber: contracts.contractNumber,
      })
      .from(contracts)
      .where(eq(contracts.companyId, companyId));

    console.log('✅ [CONTRACTS] Encontrados', contractsData.length, 'contratos para empresa', companyId);

    res.json({
      success: true,
      contracts: contractsData
    });

  } catch (error) {
    console.error('❌ [CONTRACTS] Erro ao buscar contratos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch contracts', 
      error: error.message 
    });
  }
});

// POST /api/municipal/users/create - Criar novo usuário
router.post('/create', authenticateMunicipal, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { firstName, lastName, email, userType, companyId, contractId } = req.body;
    
    console.log('🚀 [CREATE-USER] Dados recebidos:', { firstName, lastName, email, userType, companyId, contractId });

    // Validações básicas
    if (!firstName || !lastName || !email || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Nome, sobrenome, email e tipo de usuário são obrigatórios'
      });
    }

    // Verificar se o usuário tem acesso à empresa
    const userCompany = await getUserCompanyInfo(userId);
    if (companyId && parseInt(companyId) !== userCompany.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a esta empresa'
      });
    }

    // Validações específicas por tipo
    if (userType === 'Gestores' && !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Gestores devem estar vinculados a uma empresa'
      });
    }

    if (userType === 'Diretores' && (!companyId || !contractId)) {
      return res.status(400).json({
        success: false,
        message: 'Diretores devem estar vinculados a uma empresa e contrato específico'
      });
    }

    // Criar usuário no AWS Cognito
    const cognitoService = new CognitoService();
    const cognitoResult = await cognitoService.createUser({
      email,
      firstName,
      lastName,
      group: userType,
      companyId: companyId ? parseInt(companyId) : undefined,
      contractId: contractId ? parseInt(contractId) : undefined,
    });

    console.log('✅ [CREATE-USER] Usuário criado no Cognito:', cognitoResult.username);

    // Determinar role local baseado no grupo
    let localRole = 'student';
    switch (userType) {
      case 'Admin':
        localRole = 'admin';
        break;
      case 'Gestores':
        localRole = 'municipal_manager';
        break;
      case 'Diretores':
        localRole = 'school_director';
        break;
      case 'Professores':
        localRole = 'teacher';
        break;
      case 'Alunos':
        localRole = 'student';
        break;
    }

    // Criar usuário na base local
    const [newUser] = await db
      .insert(users)
      .values({
        username: cognitoResult.username,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: localRole,
        cognito_user_id: cognitoResult.username,
        cognito_group: userType,
        cognito_status: 'FORCE_CHANGE_PASSWORD',
        companyId: companyId ? parseInt(companyId) : null,
        contractId: contractId ? parseInt(contractId) : null,
      })
      .returning();

    console.log('✅ [CREATE-USER] Usuário criado na base local:', newUser.id);

    res.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        cognitoUsername: cognitoResult.username,
        firstAccessUrl: `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/first-access?token=${cognitoResult.username}`
      }
    });

  } catch (error) {
    console.error('❌ [CREATE-USER] Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar usuário',
      error: error.message
    });
  }
});

export default router;
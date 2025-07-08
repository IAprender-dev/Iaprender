import { Express, Request, Response } from 'express';
import { db } from '../db';
import { municipalManagers, municipalSchools, municipalPolicies, users, companies, contracts } from '../../shared/schema';
import { eq, and, count, sum, isNull, or, inArray } from 'drizzle-orm';
import { CognitoService } from '../utils/cognito-service';
import { CacheManager } from '../utils/cache-manager';

export function registerMunicipalRoutes(app: Express) {
  
  // Middleware de autenticação para gestores municipais
  const authenticateMunicipal = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.session.user.role !== 'municipal_manager') {
      return res.status(403).json({ message: "Forbidden - Municipal Manager access required" });
    }
    
    next();
  };

  // FUNÇÃO CENTRAL: Obter empresa do usuário logado
  async function getUserCompany(userId: number): Promise<number | null> {
    try {
      const result = await db
        .select({ companyId: users.companyId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const companyId = result[0]?.companyId;
      
      if (!companyId) {
        console.log(`⚠️ User ${userId} sem empresa vinculada`);
        return null;
      }
      
      console.log(`✅ User ${userId} vinculado à empresa ${companyId}`);
      return companyId;
    } catch (error) {
      console.error(`❌ Erro ao buscar empresa do usuário ${userId}:`, error);
      return null;
    }
  }

  // Helper function to get user's company info
  const getUserCompanyInfo = async (userId: number) => {
    const [user] = await db
      .select({
        companyId: users.companyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.companyId) {
      throw new Error(`User ${userId} não possui empresa vinculada`);
    }

    return user;
  };

  // ============= MUNICIPAL USERS ENDPOINTS =============
  
  // GET /api/municipal/users/list - Listar usuários da empresa do gestor
  app.get('/api/municipal/users/list', authenticateMunicipal, async (req: Request, res: Response) => {
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
  app.get('/api/municipal/users/companies', authenticateMunicipal, async (req: Request, res: Response) => {
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
  app.get('/api/municipal/users/contracts/:companyId', authenticateMunicipal, async (req: Request, res: Response) => {
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
  app.post('/api/municipal/users/create', authenticateMunicipal, async (req: Request, res: Response) => {
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

  // ============= OTHER MUNICIPAL ENDPOINTS =============

  // GET /api/municipal/stats - Estatísticas do município (OTIMIZADO)
  app.get('/api/municipal/stats', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // 1. Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ 
          success: true, 
          stats: { totalContracts: 0, totalSchools: 0, activeSchools: 0, totalStudents: 0, totalTeachers: 0, totalClassrooms: 0 }
        });
      }
      
      // 2. Buscar estatísticas APENAS da empresa do usuário
      const [contractsCount, schoolsStats] = await Promise.all([
        // Contar contratos da empresa
        db
          .select({ count: count() })
          .from(contracts)
          .where(eq(contracts.companyId, userCompanyId))
          .then(results => results[0]?.count || 0),
        
        // Estatísticas das escolas através dos contratos da empresa
        db
          .select({
            totalSchools: count(),
            totalStudents: sum(municipalSchools.numberOfStudents),
            totalTeachers: sum(municipalSchools.numberOfTeachers),
          })
          .from(municipalSchools)
          .innerJoin(contracts, eq(municipalSchools.contractId, contracts.id))
          .where(eq(contracts.companyId, userCompanyId))
          .then(results => results[0] || { totalSchools: 0, totalStudents: 0, totalTeachers: 0 })
      ]);

      const stats = {
        totalContracts: contractsCount,
        totalSchools: schoolsStats.totalSchools || 0,
        activeSchools: schoolsStats.totalSchools || 0, // Assumindo que todas estão ativas
        totalStudents: schoolsStats.totalStudents || 0,
        totalTeachers: schoolsStats.totalTeachers || 0,
        totalClassrooms: 0, // Campo não disponível ainda
        companyRevenue: contractsCount * 15000, // Estimativa baseada nos contratos
        monthlyTokenUsage: Math.floor(Math.random() * 50000) + 25000, // Placeholder
        activeUsers: (schoolsStats.totalStudents || 0) + (schoolsStats.totalTeachers || 0),
        contractsManaged: contractsCount
      };

      console.log(`✅ [STATS] User ${userId} empresa ${userCompanyId}:`, stats);
      
      res.json({ success: true, stats });

    } catch (error) {
      console.error('❌ [STATS] Erro ao buscar estatísticas:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch stats', 
        error: error.message 
      });
    }
  });

  // GET /api/municipal/contracts/filtered - Buscar contratos da empresa do usuário
  app.get('/api/municipal/contracts/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, contracts: [] });
      }

      // Buscar contratos APENAS da empresa do usuário (consulta simplificada)
      const contractsData = await db
        .select()
        .from(contracts)
        .where(eq(contracts.companyId, userCompanyId));

      // Buscar nome da empresa separadamente
      const [companyInfo] = await db
        .select({ name: companies.name })
        .from(companies)
        .where(eq(companies.id, userCompanyId));

      const contractsWithCompany = contractsData.map(contract => ({
        ...contract,
        companyName: companyInfo?.name || 'N/A'
      }));

      console.log(`✅ [CONTRACTS] User ${userId} empresa ${userCompanyId}: ${contractsData.length} contratos`);
      
      res.json({ success: true, contracts: contractsWithCompany });

    } catch (error) {
      console.error('❌ [CONTRACTS] Erro ao buscar contratos:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch contracts', 
        error: error.message 
      });
    }
  });

  // GET /api/municipal/directors/filtered - Buscar diretores da empresa do usuário
  app.get('/api/municipal/directors/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, directors: [] });
      }

      // Buscar diretores APENAS da empresa do usuário (consulta simplificada)
      const directorsData = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.companyId, userCompanyId),
            eq(users.cognito_group, 'Diretores')
          )
        );

      // Buscar nomes dos contratos separadamente se necessário
      const directorsWithContracts = await Promise.all(
        directorsData.map(async (director) => {
          let contractName = null;
          if (director.contractId) {
            const [contract] = await db
              .select({ schoolName: contracts.schoolName })
              .from(contracts)
              .where(eq(contracts.id, director.contractId));
            contractName = contract?.schoolName || null;
          }
          
          return {
            id: director.id,
            firstName: director.first_name,
            lastName: director.last_name,
            email: director.email,
            cognitoStatus: director.cognito_status,
            contractId: director.contractId,
            contractName
          };
        })
      );

      console.log(`✅ [DIRECTORS] User ${userId} empresa ${userCompanyId}: ${directorsData.length} diretores`);
      
      res.json({ success: true, directors: directorsWithContracts });

    } catch (error) {
      console.error('❌ [DIRECTORS] Erro ao buscar diretores:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch directors', 
        error: error.message 
      });
    }
  });

  // GET /api/municipal/schools/filtered - Buscar escolas da empresa do usuário
  app.get('/api/municipal/schools/filtered', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, schools: [] });
      }

      // Primeiro, buscar IDs dos contratos da empresa
      const companyContracts = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(eq(contracts.companyId, userCompanyId));

      const contractIds = companyContracts.map(c => c.id);
      
      if (contractIds.length === 0) {
        return res.json({ success: true, schools: [] });
      }

      // Buscar escolas usando os IDs dos contratos
      const schoolsData = await db
        .select()
        .from(municipalSchools)
        .where(inArray(municipalSchools.contractId, contractIds));

      // Buscar nomes dos contratos separadamente
      const schoolsWithContracts = await Promise.all(
        schoolsData.map(async (school) => {
          const [contract] = await db
            .select({ schoolName: contracts.schoolName })
            .from(contracts)
            .where(eq(contracts.id, school.contractId));
          
          return {
            id: school.id,
            schoolName: school.schoolName,
            contractId: school.contractId,
            directorName: school.directorName,
            numberOfStudents: school.numberOfStudents,
            numberOfTeachers: school.numberOfTeachers,
            status: school.status,
            contractName: contract?.schoolName || 'N/A'
          };
        })
      );

      console.log(`✅ [SCHOOLS] User ${userId} empresa ${userCompanyId}: ${schoolsData.length} escolas`);
      
      res.json({ success: true, schools: schoolsWithContracts });

    } catch (error) {
      console.error('❌ [SCHOOLS] Erro ao buscar escolas:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch schools', 
        error: error.message 
      });
    }
  });

  // GET /api/municipal/company/info - Informações da empresa do usuário
  app.get('/api/municipal/company/info', authenticateMunicipal, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Obter empresa do usuário logado
      const userCompanyId = await getUserCompany(userId);
      if (!userCompanyId) {
        return res.json({ success: true, company: null });
      }

      // Buscar informações APENAS da empresa do usuário (consulta simplificada)
      const [companyInfo] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, userCompanyId));

      console.log(`✅ [COMPANY-INFO] User ${userId} empresa ${userCompanyId}:`, companyInfo?.name);
      
      res.json({ success: true, company: companyInfo || null });

    } catch (error) {
      console.error('❌ [COMPANY-INFO] Erro ao buscar informações da empresa:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch company info', 
        error: error.message 
      });
    }
  });

  // Outros endpoints existentes...
}